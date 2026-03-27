use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::Emitter;

#[derive(Debug, Deserialize)]
pub struct HttpRequest {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct HttpResponse {
    pub status: u16,
    pub body: String,
    pub headers: HashMap<String, String>,
}

/// Proxy HTTP requests from the frontend to avoid CORS issues with AI provider APIs.
#[tauri::command]
async fn http_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let client = reqwest::Client::new();

    let mut req_builder = match request.method.to_uppercase().as_str() {
        "GET" => client.get(&request.url),
        "POST" => client.post(&request.url),
        "PUT" => client.put(&request.url),
        "DELETE" => client.delete(&request.url),
        _ => return Err(format!("Unsupported HTTP method: {}", request.method)),
    };

    for (key, value) in &request.headers {
        req_builder = req_builder.header(key, value);
    }

    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
    }

    let response = req_builder
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    let status = response.status().as_u16();
    let headers: HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();
    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    Ok(HttpResponse {
        status,
        body,
        headers,
    })
}

/// Stream an HTTP request, emitting chunks via Tauri events for real-time AI streaming.
#[tauri::command]
async fn http_stream_request(
    app: tauri::AppHandle,
    request_id: String,
    request: HttpRequest,
) -> Result<(), String> {
    let client = reqwest::Client::new();

    let mut req_builder = client.post(&request.url);

    for (key, value) in &request.headers {
        req_builder = req_builder.header(key, value);
    }

    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
    }

    let response = req_builder
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {}", e))?;

    let status = response.status().as_u16();
    if status != 200 {
        let body = response
            .text()
            .await
            .map_err(|e| format!("Failed to read error body: {}", e))?;
        app.emit(
            &format!("stream-error-{}", request_id),
            format!("HTTP {}: {}", status, body),
        )
        .ok();
        return Ok(());
    }

    let mut stream = response.bytes_stream();
    use futures::StreamExt;

    while let Some(chunk) = stream.next().await {
        match chunk {
            Ok(bytes) => {
                let text = String::from_utf8_lossy(&bytes).to_string();
                app.emit(&format!("stream-chunk-{}", request_id), &text)
                    .ok();
            }
            Err(e) => {
                app.emit(
                    &format!("stream-error-{}", request_id),
                    format!("Stream error: {}", e),
                )
                .ok();
                break;
            }
        }
    }

    app.emit(&format!("stream-done-{}", request_id), ())
        .ok();

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![http_request, http_stream_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
