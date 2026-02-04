# Copy with Embedded Images - Obsidian Plugin

A simple Obsidian plugin that copies your current markdown note to the clipboard with all images embedded as base64 data URIs. This creates a truly self-contained markdown file that can be pasted anywhere.

## Features

- Converts both Obsidian wiki-style `![[image.png]]` and standard markdown `![](image.png)` images
- Embeds images as base64 data URIs
- One hotkey to copy everything: **Ctrl+Shift+C** (or **Cmd+Shift+C** on Mac)
- Works with PNG, JPG, JPEG, GIF, WEBP, BMP, and SVG images

## Installation

### Manual Installation

1. Download `main.js` and `manifest.json`
2. Create a folder called `copy-with-embedded-images` in your vault's `.obsidian/plugins/` directory
3. Copy `main.js` and `manifest.json` into that folder
4. Reload Obsidian
5. Enable the plugin in Settings → Community Plugins

### Directory Structure
```
YourVault/
└── .obsidian/
    └── plugins/
        └── copy-with-embedded-images/
            ├── main.js
            └── manifest.json
```

## Usage

1. Open any markdown note with images
2. Press **Ctrl+Shift+C** (Windows/Linux) or **Cmd+Shift+C** (Mac)
3. Your markdown with embedded images is now in your clipboard!
4. Paste anywhere (email, another app, another vault, etc.)

You can also access it via the command palette:
- Press `Ctrl+P` (or `Cmd+P` on Mac)
- Search for "Copy markdown with embedded images"

## How It Works

The plugin:
1. Reads your current note
2. Finds all image references (both `![[]]` and `![]()` syntax)
3. Converts each image to base64
4. Replaces image links with data URIs like: `![alt](data:image/png;base64,...)`
5. Copies the result to your clipboard

## Example

**Before:**
```markdown
# My Note
Here's an image:
![[screenshot.png]]
```

**After (in clipboard):**
```markdown
# My Note
Here's an image:
![screenshot](data:image/png;base64,iVBORw0KGgoAAAANS...)
```

## Notes

- The resulting markdown file will be larger due to base64 encoding
- Images must be accessible in your vault for the plugin to find them
- If an image can't be found, the original reference is left unchanged

## License

MIT
