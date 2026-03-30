#!/usr/bin/env python3
"""
Generate new PlazaYa icons and splash logos without the green checkmark.
Clean, professional design: government building silhouette + briefcase on gold background.
No checkmarks or symbols suggesting official endorsement.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Brand colors
GOLD = (240, 165, 0)       # #f0a500
GREEN = (26, 92, 42)       # #1a5c2a
WHITE = (255, 255, 255)
DARK = (30, 30, 30)
RED = (192, 57, 43)        # #c0392b

def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2*radius, y0 + 2*radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2*radius, y0, x1, y0 + 2*radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2*radius, x0 + 2*radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2*radius, y1 - 2*radius, x1, y1], 0, 90, fill=fill)

def draw_building(draw, cx, cy, size, color):
    """Draw a simplified government building (dome + columns)."""
    s = size

    # Base platform
    base_y = cy + int(s * 0.35)
    draw.rectangle([cx - int(s*0.45), base_y, cx + int(s*0.45), base_y + int(s*0.08)], fill=color)

    # Main body
    body_top = cy - int(s * 0.05)
    draw.rectangle([cx - int(s*0.4), body_top, cx + int(s*0.4), base_y], fill=color)

    # Columns (5 columns)
    col_width = int(s * 0.06)
    col_spacing = int(s * 0.16)
    col_top = cy - int(s * 0.0)
    col_bottom = base_y
    for i in range(-2, 3):
        col_x = cx + i * col_spacing
        # Draw column as lighter shade (gap between them)
        draw.rectangle([col_x - col_width//2, col_top, col_x + col_width//2, col_bottom], fill=color)

    # Pediment (triangle)
    ped_top = cy - int(s * 0.2)
    ped_left = cx - int(s * 0.42)
    ped_right = cx + int(s * 0.42)
    draw.polygon([(cx, ped_top), (ped_left, body_top), (ped_right, body_top)], fill=color)

    # Dome
    dome_cx = cx
    dome_bottom = ped_top
    dome_top = cy - int(s * 0.45)
    dome_width = int(s * 0.2)
    draw.ellipse([dome_cx - dome_width, dome_top, dome_cx + dome_width, dome_bottom + int(s*0.05)], fill=color)

    # Dome top (small cylinder)
    draw.rectangle([cx - int(s*0.03), dome_top - int(s*0.08), cx + int(s*0.03), dome_top + int(s*0.02)], fill=color)

    # Flag pole
    pole_top = dome_top - int(s * 0.2)
    draw.rectangle([cx - int(s*0.01), pole_top, cx + int(s*0.01), dome_top - int(s*0.05)], fill=color)

    # Small flag (Mexican tricolor simplified)
    flag_w = int(s * 0.1)
    flag_h = int(s * 0.07)
    flag_x = cx + int(s*0.01)
    flag_y = pole_top
    # Green stripe
    draw.rectangle([flag_x, flag_y, flag_x + flag_w//3, flag_y + flag_h], fill=(0, 104, 71))
    # White stripe
    draw.rectangle([flag_x + flag_w//3, flag_y, flag_x + 2*flag_w//3, flag_y + flag_h], fill=WHITE)
    # Red stripe
    draw.rectangle([flag_x + 2*flag_w//3, flag_y, flag_x + flag_w, flag_y + flag_h], fill=(206, 17, 38))

def draw_briefcase(draw, cx, cy, size, color):
    """Draw a small briefcase icon."""
    s = size
    # Body
    bw = int(s * 0.22)
    bh = int(s * 0.16)
    draw_rounded_rect(draw, [cx - bw, cy - bh//2, cx + bw, cy + bh//2], int(s*0.02), color)
    # Handle
    hw = int(s * 0.1)
    hh = int(s * 0.05)
    draw.rectangle([cx - hw, cy - bh//2 - hh, cx - hw + int(s*0.03), cy - bh//2], fill=color)
    draw.rectangle([cx + hw - int(s*0.03), cy - bh//2 - hh, cx + hw, cy - bh//2], fill=color)
    draw.rectangle([cx - hw, cy - bh//2 - hh, cx + hw, cy - bh//2 - hh + int(s*0.03)], fill=color)
    # Center clasp
    draw.rectangle([cx - int(s*0.02), cy - int(s*0.04), cx + int(s*0.02), cy + int(s*0.04)], fill=GOLD)

def create_app_icon(size, output_path):
    """Create the main app icon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background with gold
    margin = int(size * 0.02)
    radius = int(size * 0.18)
    draw_rounded_rect(draw, [margin, margin, size - margin, size - margin], radius, GOLD)

    # Subtle gradient effect - lighter at top
    for i in range(int(size * 0.3)):
        alpha = int(40 * (1 - i / (size * 0.3)))
        draw.rectangle([margin + radius//2, margin + i, size - margin - radius//2, margin + i + 1],
                       fill=(255, 255, 255, alpha))

    # Draw building
    cx = size // 2
    cy = int(size * 0.38)
    draw_building(draw, cx, cy, int(size * 0.55), WHITE)

    # Draw briefcase at bottom
    draw_briefcase(draw, cx, int(size * 0.72), int(size * 0.55), GREEN)

    # Bottom green bar accent
    bar_y = int(size * 0.83)
    draw_rounded_rect(draw, [int(size*0.15), bar_y, int(size*0.85), bar_y + int(size*0.04)], int(size*0.02), GREEN)

    img.save(output_path, 'PNG')
    print(f"  Created: {output_path} ({size}x{size})")

def create_adaptive_icon(size, output_path):
    """Create adaptive icon foreground (no background padding needed for adaptive)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Content area for adaptive icons is the inner 66% (108dp safe zone in 108dp grid)
    # But we use full canvas, system handles the masking
    cx = size // 2
    cy = int(size * 0.38)

    # Draw building
    draw_building(draw, cx, cy, int(size * 0.42), WHITE)

    # Draw briefcase
    draw_briefcase(draw, cx, int(size * 0.68), int(size * 0.42), GREEN)

    # Bottom accent bar
    bar_y = int(size * 0.78)
    draw.rectangle([int(size*0.2), bar_y, int(size*0.8), bar_y + int(size*0.03)], fill=GREEN)

    img.save(output_path, 'PNG')
    print(f"  Created: {output_path} ({size}x{size})")

def create_splash_logo(size, output_path):
    """Create splash screen logo (just the building icon, transparent bg)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = size // 2
    cy = int(size * 0.4)

    # Draw building in white (for gold background)
    draw_building(draw, cx, cy, int(size * 0.6), WHITE)

    # Draw briefcase
    draw_briefcase(draw, cx, int(size * 0.75), int(size * 0.5), WHITE)

    img.save(output_path, 'PNG')
    print(f"  Created: {output_path} ({size}x{size})")

def create_webp_icon(size, output_path):
    """Create Android launcher icon in WebP format."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Full rounded icon
    margin = int(size * 0.02)
    radius = int(size * 0.18)
    draw_rounded_rect(draw, [margin, margin, size - margin, size - margin], radius, GOLD)

    cx = size // 2
    cy = int(size * 0.38)
    draw_building(draw, cx, cy, int(size * 0.5), WHITE)
    draw_briefcase(draw, cx, int(size * 0.7), int(size * 0.5), GREEN)

    bar_y = int(size * 0.82)
    draw_rounded_rect(draw, [int(size*0.15), bar_y, int(size*0.85), bar_y + int(size*0.04)], int(size*0.02), GREEN)

    img.save(output_path, 'WEBP', quality=90)
    print(f"  Created: {output_path} ({size}x{size})")

def create_foreground_webp(size, output_path):
    """Create adaptive icon foreground in WebP format."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = size // 2
    cy = int(size * 0.38)
    draw_building(draw, cx, cy, int(size * 0.42), WHITE)
    draw_briefcase(draw, cx, int(size * 0.68), int(size * 0.42), GREEN)

    bar_y = int(size * 0.78)
    draw.rectangle([int(size*0.2), bar_y, int(size*0.8), bar_y + int(size*0.03)], fill=GREEN)

    img.save(output_path, 'WEBP', quality=90)
    print(f"  Created: {output_path} ({size}x{size})")


if __name__ == '__main__':
    base = '/home/user/PlazaYa'

    print("=== Generating new PlazaYa icons (no checkmark) ===\n")

    # 1. Expo/RN assets
    print("1. Expo/React Native assets:")
    create_app_icon(1024, f'{base}/app/assets/icon.png')
    create_adaptive_icon(1024, f'{base}/app/assets/adaptive-icon.png')
    create_app_icon(512, f'{base}/app/assets/favicon.png')

    # 2. Android launcher icons (WebP)
    print("\n2. Android launcher icons (ic_launcher.webp):")
    android_res = f'{base}/app/android/app/src/main/res'
    densities_launcher = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }
    for folder, px in densities_launcher.items():
        create_webp_icon(px, f'{android_res}/{folder}/ic_launcher.webp')

    # 3. Android adaptive icon foregrounds
    print("\n3. Android adaptive icon foregrounds:")
    densities_fg = {
        'mipmap-mdpi': 108,
        'mipmap-hdpi': 162,
        'mipmap-xhdpi': 216,
        'mipmap-xxhdpi': 324,
        'mipmap-xxxhdpi': 432,
    }
    for folder, px in densities_fg.items():
        create_foreground_webp(px, f'{android_res}/{folder}/ic_launcher_foreground.webp')

    # 4. Android splash screen logos
    print("\n4. Android splash screen logos:")
    densities_splash = {
        'drawable-mdpi': 100,
        'drawable-hdpi': 150,
        'drawable-xhdpi': 200,
        'drawable-xxhdpi': 300,
        'drawable-xxxhdpi': 400,
    }
    for folder, px in densities_splash.items():
        create_splash_logo(px, f'{android_res}/{folder}/splashscreen_logo.png')

    print("\n=== Done! All icons generated without checkmark ===")
