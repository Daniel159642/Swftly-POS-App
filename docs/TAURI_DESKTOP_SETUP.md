# Tauri Desktop App Setup (Delancey)

The POS desktop app is built with **Tauri 2**. This guide gets it running on your Mac.

## Prerequisites (already done if you followed setup)

- **Rust** – Install with: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js** – You already have this (frontend uses it).
- **macOS**: Xcode Command Line Tools (`xcode-select --install` if you get compile errors).

## Quick start

### 1. Start the backend (required)

The desktop app talks to your Python API. In one terminal:

```bash
cd /Users/danielbudnyatsky/POS\ 2/pos
python3 web_viewer.py
```

Leave this running (default: http://localhost:5001).

### 2. Run the desktop app

**Option A – Development (hot reload)**

```bash
cd /Users/danielbudnyatsky/POS\ 2/pos
npm run tauri:dev
```

This starts the Vite dev server and opens the Tauri window. Use this for day-to-day development.

**Option B – Run the built app**

After building (see below), run the app directly:

```bash
open "/Users/danielbudnyatsky/POS 2/pos/src-tauri/target/release/bundle/macos/Delancey.app"
```

Or double-click **Delancey.app** in Finder.

## Build for production

From the project root:

```bash
cd /Users/danielbudnyatsky/POS\ 2/pos
npm run tauri:build
```

Outputs:

- **App**: `pos/src-tauri/target/release/bundle/macos/Delancey.app`
- **DMG**: `pos/src-tauri/target/release/bundle/dmg/Delancey_1.0.0_aarch64.dmg`

You can copy `Delancey.app` to Applications or share the DMG.

## Rounded icon (macOS)

From the **pos** directory (not "POS 2"):

```bash
cd pos
python3 scripts/apply_rounded_icon_corners.py
npm run tauri:build
```

## Replacing the app icon

A placeholder icon is in `src-tauri/icons/icon.png`. To use your own:

1. Add a 1024×1024 PNG (e.g. `app-icon.png`) in the project.
2. Generate all sizes:

   ```bash
   cd /Users/danielbudnyatsky/POS\ 2/pos
   npx tauri icon app-icon.png
   ```

3. Run `npm run tauri:build` again.

## Troubleshooting

- **“Rust not found”** – Install Rust (see Prerequisites), then restart the terminal or run `source "$HOME/.cargo/env"`.
- **“Failed to connect” in the app** – Start the backend first: `python3 web_viewer.py`.
- **Build fails on icon** – Ensure `src-tauri/icons/icon.png` exists and is a valid RGBA PNG (e.g. 32×32 or larger).
