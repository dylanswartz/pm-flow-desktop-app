# PM Flow

A local-first desktop app for AI-native product management: manage markdown context files, build context bundles, run AI tasks (Claude-first), and write results back to the filesystem.

## Prerequisites

PM Flow is built with Tauri, React, and TypeScript. To run it locally on Linux (Ubuntu), you need to install system dependencies, Node.js, and Rust.

### 1. System Dependencies

Since Tauri uses native webviews, you need to install the following system packages:

```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  libssl-dev \
  pkg-config \
  libjavascriptcoregtk-4.1-dev \
  libsoup-3.0-dev \
  libwebkit2gtk-4.1-dev
```

### 2. Node.js & Rust
If you haven't already:
- Install **Node.js** (v18+) via [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm install 20
  ```
- Install **Rust** via [rustup](https://rustup.rs/):
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

---

## Running the App

1. Ensure dependencies are installed:
   ```bash
   npm install
   ```
2. Start the development server (runs the React frontend and compiles the Tauri backend):
   ```bash
   npm run tauri dev
   ```
The first time you run this, Cargo will take a few minutes to download and compile the Rust dependencies.

---

## Setting up AI (Anthropic / Claude)

1. Launch the app `npm run tauri dev`.
2. Select a local folder to use as your workspace (this folder should contain your `.md` context files).
3. In the right panel, click the **AI** tab.
4. Click the gear icon (**Settings**) to set your Anthropic API Key (e.g. `sk-ant-...`).
5. You can now build bundles and run AI tasks.

***

## Architecture

* **Frontend:** React, TypeScript, Vite, Vanilla CSS.
* **Backend:** Tauri (Rust) for filesystem operations and proxying HTTP requests to avoid CORS.
* **Storage:** Local filesystem (Markdown files + YAML frontmatter). Settings are stored in `localStorage`.

***

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
