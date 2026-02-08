#!/usr/bin/env python3
"""Apply macOS-style rounded corners to app icon. Run from repo root or scripts/."""
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
OUT_DIR = SCRIPT_DIR.parent
ICONS_DIR = OUT_DIR / "src-tauri" / "icons"
ICONSET_DIR = ICONS_DIR / "Delancey.iconset"

# macOS-style corner radius: ~21.5% of size (matches typical app icon look)
CORNER_RADIUS_RATIO = 0.215


def rounded_rect_mask(size: int, radius: float) -> Image.Image:
    """Create a mask that is 255 inside rounded rect, 0 outside."""
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    # draw.rounded_rectangle with radius for (x1,y1,x2,y2)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def apply_rounded_corners(img: Image.Image, corner_radius_ratio: float = CORNER_RADIUS_RATIO) -> Image.Image:
    """Composite image into a rounded-rectangle; corners become transparent."""
    size = img.width
    radius = max(2, int(size * corner_radius_ratio))
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    # Create white (or any) background with alpha
    out = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    mask = rounded_rect_mask(size, radius)
    # Paste the original icon using the rounded rect as mask
    out.paste(img, (0, 0), mask=mask)
    return out


def main():
    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    if not (ICONS_DIR / "icon.icns").exists():
        print("icon.icns not found in src-tauri/icons")
        return

    # Extract iconset from existing icns
    subprocess.run(
        ["iconutil", "-c", "iconset", str(ICONS_DIR / "icon.icns"), "-o", str(ICONSET_DIR)],
        check=True,
        capture_output=True,
    )

    # Sizes in the iconset (name, size)
    sizes = [
        ("icon_16x16.png", 16),
        ("icon_16x16@2x.png", 32),
        ("icon_32x32.png", 32),
        ("icon_32x32@2x.png", 64),
        ("icon_128x128.png", 128),
        ("icon_128x128@2x.png", 256),
        ("icon_256x256.png", 256),
        ("icon_256x256@2x.png", 512),
        ("icon_512x512.png", 512),
        ("icon_512x512@2x.png", 1024),
    ]

    # Use 1024 as source for consistent rounding, then downsample
    source_1024_path = ICONSET_DIR / "icon_512x512@2x.png"
    if not source_1024_path.exists():
        print("No 1024 source in iconset")
        return
    source = Image.open(source_1024_path).convert("RGBA")
    source_rounded = apply_rounded_corners(source)

    for name, size in sizes:
        if size == 1024:
            resized = source_rounded
        else:
            resized = source_rounded.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(ICONSET_DIR / name)

    # Regenerate icon.icns from iconset
    subprocess.run(
        ["iconutil", "-c", "icns", str(ICONSET_DIR), "-o", str(ICONS_DIR / "icon.icns")],
        check=True,
        capture_output=True,
    )

    # Copy the three PNGs Tauri expects
    for src_name, tauri_name in [
        ("icon_32x32.png", "32x32.png"),
        ("icon_128x128.png", "128x128.png"),
        ("icon_128x128@2x.png", "128x128@2x.png"),
    ]:
        src = ICONSET_DIR / src_name
        if src.exists():
            (ICONS_DIR / tauri_name).write_bytes(src.read_bytes())

    # Clean up iconset dir
    for f in ICONSET_DIR.iterdir():
        f.unlink()
    ICONSET_DIR.rmdir()

    print("Rounded corners applied. icon.icns and 32x32/128x128/128x128@2x.png updated.")
    print("Run: npm run tauri:build")


if __name__ == "__main__":
    main()
