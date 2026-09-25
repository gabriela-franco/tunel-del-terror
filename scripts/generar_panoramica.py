"""Genera una imagen panorámica (collage horizontal) con las fotos reales de cada propuesta."""
import json
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PROPOSALS_JS = ROOT / "proposals.js"
THUMB_SIZE = (360, 270)
LABEL_HEIGHT = 40
GAP = 12
BG_COLOR = (13, 9, 18)
LABEL_COLOR = (242, 238, 252)
ACCENT_COLOR = (255, 45, 85)


def parse_proposals(js_text):
    proposals = []
    for prop_match in re.finditer(r'id:\s*"(propuesta-[ab])".*?nombre:\s*"([^"]+)".*?zonas:\s*\[(.*?)\n\s*\],', js_text, re.S):
        prop_id, prop_nombre, zonas_block = prop_match.groups()
        zonas = []
        for zona_match in re.finditer(r'nombre:\s*"([^"]+)".*?foto:\s*"([^"]+)"', zonas_block, re.S):
            zonas.append({"nombre": zona_match.group(1), "foto": zona_match.group(2)})
        proposals.append({"id": prop_id, "nombre": prop_nombre, "zonas": zonas})
    return proposals


def build_panorama(proposal):
    zonas = proposal["zonas"]
    n = len(zonas)
    width = n * THUMB_SIZE[0] + (n + 1) * GAP
    height = THUMB_SIZE[1] + LABEL_HEIGHT + 2 * GAP
    canvas = Image.new("RGB", (width, height), BG_COLOR)
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    except OSError:
        font = ImageFont.load_default()

    x = GAP
    for zona in zonas:
        img_path = ROOT / zona["foto"]
        if img_path.exists():
            thumb = Image.open(img_path).convert("RGB")
            thumb = thumb.resize(THUMB_SIZE)
        else:
            thumb = Image.new("RGB", THUMB_SIZE, (40, 30, 50))
        canvas.paste(thumb, (x, GAP))
        draw.rectangle(
            [x, GAP, x + THUMB_SIZE[0], GAP + THUMB_SIZE[1]],
            outline=ACCENT_COLOR,
            width=3,
        )
        text = zona["nombre"]
        text_w = draw.textlength(text, font=font)
        draw.text(
            (x + THUMB_SIZE[0] / 2 - text_w / 2, GAP * 2 + THUMB_SIZE[1]),
            text,
            fill=LABEL_COLOR,
            font=font,
        )
        x += THUMB_SIZE[0] + GAP

    out_path = ROOT / "images" / proposal["id"] / "panoramica-completa.jpg"
    canvas.save(out_path, quality=90)
    return out_path


def main():
    js_text = PROPOSALS_JS.read_text(encoding="utf-8")
    proposals = parse_proposals(js_text)
    for proposal in proposals:
        out_path = build_panorama(proposal)
        print(f"✓ {proposal['nombre']}: {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
