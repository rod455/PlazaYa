#!/usr/bin/env python3
"""
Gera o novo ícone PlazaYa — gradiente laranja/rosa/roxo/azul
com texto "PlazaYa" e lupa laranja.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

def rounded_mask(size, radius):
    mask = Image.new('L', (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=255)
    return mask

def make_gradient(size):
    """Gradiente diagonal: laranja (top-left) → rosa (center) → roxo/azul (bottom-right)"""
    img = Image.new('RGB', (size, size))
    px = img.load()
    # Stops: laranja #FF6B1A → rosa #E91E8C → roxo #7B1FA2 → azul #1A237E
    stops = [
        (0.00, (255, 107, 26)),
        (0.30, (233,  30,140)),
        (0.65, (123,  31,162)),
        (1.00, ( 26,  35,126)),
    ]
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            # interpola entre stops
            c = stops[0][1]
            for i in range(len(stops)-1):
                t0, c0 = stops[i]
                t1, c1 = stops[i+1]
                if t0 <= t <= t1:
                    f = (t - t0) / (t1 - t0)
                    c = tuple(int(c0[j] + f*(c1[j]-c0[j])) for j in range(3))
                    break
            px[x, y] = c
    return img

def draw_swirls(draw, size):
    """Curvas suaves de destaque sobre o gradiente."""
    # curva clara no canto superior direito
    for offset in range(0, 60, 12):
        draw.arc(
            [size*0.3 + offset, -size*0.4 + offset,
             size*1.1 + offset,  size*0.4 + offset],
            start=160, end=220,
            fill=(255,255,255,18), width=int(size*0.04)
        )
    # curva clara no canto inferior esquerdo
    for offset in range(0, 50, 10):
        draw.arc(
            [-size*0.3 - offset, size*0.5 - offset,
              size*0.5 - offset, size*1.3 - offset],
            start=340, end=40,
            fill=(255,255,255,15), width=int(size*0.035)
        )

def draw_magnifier(draw, cx, cy, r, color_circle, color_handle):
    """Desenha a lupa: círculo + cabo."""
    # aro da lupa
    lw = max(2, r // 8)
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=(255,255,255,230), width=lw)
    # bola laranja/vermelha dentro
    ir = int(r * 0.72)
    draw.ellipse([cx-ir, cy-ir, cx+ir, cy+ir], fill=color_circle)
    # reflexo branco
    rr = int(ir * 0.38)
    draw.ellipse([cx-ir+2, cy-ir+2, cx-ir+2+rr, cy-ir+2+rr],
                 fill=(255,255,255,160))
    # cabo diagonal
    angle = math.radians(45)
    x1 = int(cx + r * math.cos(angle))
    y1 = int(cy + r * math.sin(angle))
    x2 = int(cx + (r + r*1.1) * math.cos(angle))
    y2 = int(cy + (r + r*1.1) * math.sin(angle))
    draw.line([x1, y1, x2, y2], fill=color_handle, width=lw+1)

def make_icon(size, out_path):
    # 1. Gradiente de fundo
    bg = make_gradient(size)

    # 2. Camada RGBA para swirls e elementos
    overlay = Image.new('RGBA', (size, size), (0,0,0,0))
    od = ImageDraw.Draw(overlay, 'RGBA')
    draw_swirls(od, size)
    bg = bg.convert('RGBA')
    bg = Image.alpha_composite(bg, overlay)

    draw = ImageDraw.Draw(bg, 'RGBA')

    # 3. Texto "Plaza" + "Ya"
    # Escala de fonte baseada no tamanho
    font_size = int(size * 0.22)
    try:
        font_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font_bold = ImageFont.load_default()

    text = "PlazaYa"
    # mede o texto
    bbox = draw.textbbox((0,0), text, font=font_bold)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    # posição: centralizado horizontalmente, um pouco acima do centro
    tx = (size - tw) // 2 - int(size * 0.04)
    ty = int(size * 0.38)

    # sombra sutil
    draw.text((tx+3, ty+3), text, font=font_bold, fill=(0,0,0,80))
    # texto branco
    draw.text((tx, ty), text, font=font_bold, fill=(255,255,255,255))

    # 4. Lupa no canto superior direito do texto "Ya"
    lupa_cx = tx + tw + int(size * 0.04)
    lupa_cy = ty + int(th * 0.15)
    lupa_r  = int(size * 0.07)
    draw_magnifier(draw, lupa_cx, lupa_cy, lupa_r,
                   color_circle=(220, 60, 20, 255),
                   color_handle=(255,255,255,240))

    # 5. Máscara arredondada
    radius = int(size * 0.18)
    mask = rounded_mask(size, radius)
    bg = bg.convert('RGBA')
    bg.putalpha(mask)

    bg.save(out_path, 'PNG')
    print(f"  ✓ {out_path} ({size}x{size})")

def make_webp(size, out_path):
    # Versão sem canal alpha para WebP dos launchers
    bg = make_gradient(size)
    overlay = Image.new('RGBA', (size, size), (0,0,0,0))
    od = ImageDraw.Draw(overlay, 'RGBA')
    draw_swirls(od, size)
    bg = bg.convert('RGBA')
    bg = Image.alpha_composite(bg, overlay)
    draw = ImageDraw.Draw(bg, 'RGBA')

    font_size = int(size * 0.22)
    try:
        font_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font_bold = ImageFont.load_default()

    text = "PlazaYa"
    bbox = draw.textbbox((0,0), text, font=font_bold)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - int(size * 0.04)
    ty = int(size * 0.38)
    draw.text((tx+2, ty+2), text, font=font_bold, fill=(0,0,0,80))
    draw.text((tx, ty), text, font=font_bold, fill=(255,255,255,255))

    lupa_cx = tx + tw + int(size * 0.04)
    lupa_cy = ty + int(th * 0.15)
    lupa_r  = int(size * 0.07)
    draw_magnifier(draw, lupa_cx, lupa_cy, lupa_r,
                   color_circle=(220, 60, 20, 255),
                   color_handle=(255,255,255,240))

    radius = int(size * 0.18)
    mask = rounded_mask(size, radius)
    bg.putalpha(mask)
    # Converter para RGB com fundo branco para WebP
    final = Image.new('RGB', (size, size), (255,255,255))
    final.paste(bg, mask=bg.split()[3])
    final.save(out_path, 'WEBP', quality=92)
    print(f"  ✓ {out_path} ({size}x{size})")

def make_foreground_webp(size, out_path):
    """Foreground adaptativo — só os elementos, fundo transparente."""
    img = Image.new('RGBA', (size, size), (0,0,0,0))
    draw = ImageDraw.Draw(img, 'RGBA')

    font_size = int(size * 0.22)
    try:
        font_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font_bold = ImageFont.load_default()

    text = "PlazaYa"
    bbox = draw.textbbox((0,0), text, font=font_bold)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2 - int(size * 0.04)
    ty = int(size * 0.38)
    draw.text((tx+2, ty+2), text, font=font_bold, fill=(0,0,0,80))
    draw.text((tx, ty), text, font=font_bold, fill=(255,255,255,255))

    lupa_cx = tx + tw + int(size * 0.04)
    lupa_cy = ty + int(th * 0.15)
    lupa_r  = int(size * 0.07)
    draw_magnifier(draw, lupa_cx, lupa_cy, lupa_r,
                   color_circle=(220, 60, 20, 255),
                   color_handle=(255,255,255,240))

    img.save(out_path, 'WEBP', quality=92)
    print(f"  ✓ {out_path} ({size}x{size})")


if __name__ == '__main__':
    base = '/home/user/PlazaYa'
    res  = f'{base}/app/android/app/src/main/res'

    print("=== Gerando novo ícone PlazaYa (rosa/gradiente) ===\n")

    print("1. Assets Expo/RN:")
    make_icon(1024, f'{base}/app/assets/icon.png')
    make_icon(1024, f'{base}/app/assets/adaptive-icon.png')
    make_icon(512,  f'{base}/app/assets/favicon.png')

    print("\n2. Android ic_launcher (WebP):")
    densities = {'mipmap-mdpi':48,'mipmap-hdpi':72,'mipmap-xhdpi':96,'mipmap-xxhdpi':144,'mipmap-xxxhdpi':192}
    for folder, px in densities.items():
        make_webp(px, f'{res}/{folder}/ic_launcher.webp')

    print("\n3. Android ic_launcher_foreground (WebP):")
    fg_densities = {'mipmap-mdpi':108,'mipmap-hdpi':162,'mipmap-xhdpi':216,'mipmap-xxhdpi':324,'mipmap-xxxhdpi':432}
    for folder, px in fg_densities.items():
        make_foreground_webp(px, f'{res}/{folder}/ic_launcher_foreground.webp')

    print("\n4. Splash logos Android (PNG transparente):")
    splash = {'drawable-mdpi':100,'drawable-hdpi':150,'drawable-xhdpi':200,'drawable-xxhdpi':300,'drawable-xxxhdpi':400}
    for folder, px in splash.items():
        make_icon(px, f'{res}/{folder}/splashscreen_logo.png')

    print("\n=== Concluído! ===")
