#!/usr/bin/env python3
"""
Render the install icons in public/ from the CORE mark.

    python3 scripts/render-icons.py     # from the repository root

iOS and the Android installer both refuse an SVG icon, so the PWA needs real
PNGs. This rasterises the four rounded tiles of public/favicon.svg and writes
the files with zlib and struct — no imaging library, so it runs anywhere Python
does and adds no dependency to the project for four files that change rarely.

Only run this after editing the mark. The output is committed; the script is
here so the next person does not have to reconstruct the geometry by hand.

Everything is 4x supersampled, which is enough antialiasing at these sizes.
"""

import struct
import zlib

# The mark, in the favicon's own 24x24 coordinate space. Each entry is
# (x0, y0, x1, y1, (r_tl, r_tr, r_br, r_bl), colour) — the corner radii differ
# per shape because the two large tiles have one square corner where they meet
# at the centre.
R = 2.72727
MARK = [
    (2.0, 2.0, 12.0, 12.0, (R, R, 0.0, R), (0x2E, 0x9E, 0xFF)),   # top-left tile
    (12.0, 12.0, 22.0, 22.0, (0.0, R, R, R), (0x68, 0xC4, 0xFF)),  # bottom-right tile
    (15.0, 2.0, 22.0, 9.0, (2.0, 2.0, 2.0, 2.0), (0x0C, 0x79, 0xD8)),
    (2.0, 15.0, 9.0, 22.0, (2.0, 2.0, 2.0, 2.0), (0x0C, 0x79, 0xD8)),
]

BG_TOP = (0x12, 0x1A, 0x26)
BG_BOTTOM = (0x0A, 0x0D, 0x13)
SS = 4  # supersampling factor


def inside(px, py, x0, y0, x1, y1, radii):
    if px < x0 or px > x1 or py < y0 or py > y1:
        return False
    r_tl, r_tr, r_br, r_bl = radii
    # Only the four corner quadrants can fall outside the shape.
    if r_tl > 0 and px < x0 + r_tl and py < y0 + r_tl:
        return (px - (x0 + r_tl)) ** 2 + (py - (y0 + r_tl)) ** 2 <= r_tl ** 2
    if r_tr > 0 and px > x1 - r_tr and py < y0 + r_tr:
        return (px - (x1 - r_tr)) ** 2 + (py - (y0 + r_tr)) ** 2 <= r_tr ** 2
    if r_br > 0 and px > x1 - r_br and py > y1 - r_br:
        return (px - (x1 - r_br)) ** 2 + (py - (y1 - r_br)) ** 2 <= r_br ** 2
    if r_bl > 0 and px < x0 + r_bl and py > y1 - r_bl:
        return (px - (x0 + r_bl)) ** 2 + (py - (y1 - r_bl)) ** 2 <= r_bl ** 2
    return True


def render(size, glyph_fraction, bg_radius_fraction, opaque_edge):
    """
    bg_radius_fraction is the background's corner rounding as a share of the
    canvas; 0 gives the full-bleed square a maskable or iOS icon needs, since
    both platforms apply their own mask and a pre-rounded icon shows corner gaps.
    """
    bg_r = size * bg_radius_fraction
    glyph = size * glyph_fraction
    scale = glyph / 24.0
    off = (size - glyph) / 2.0

    px = bytearray()
    step = 1.0 / SS
    half = step / 2.0

    for y in range(size):
        px.append(0)  # PNG filter type 0 for this row
        # Background gradient is per-row, so compute it once.
        t = y / max(size - 1, 1)
        bg = tuple(
            int(round(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t)) for i in range(3)
        )
        for x in range(size):
            bg_cov = 0
            r_acc = g_acc = b_acc = 0.0
            fg_cov = 0
            for sy in range(SS):
                fy = y + sy * step + half
                for sx in range(SS):
                    fx = x + sx * step + half
                    if opaque_edge or inside(
                        fx, fy, 0.0, 0.0, float(size), float(size),
                        (bg_r, bg_r, bg_r, bg_r),
                    ):
                        bg_cov += 1
                    gx = (fx - off) / scale
                    gy = (fy - off) / scale
                    for x0, y0, x1, y1, radii, colour in MARK:
                        if inside(gx, gy, x0, y0, x1, y1, radii):
                            fg_cov += 1
                            r_acc += colour[0]
                            g_acc += colour[1]
                            b_acc += colour[2]
                            break
            total = SS * SS
            a_bg = bg_cov / total
            a_fg = fg_cov / total
            if fg_cov:
                fr, fg_, fb = r_acc / fg_cov, g_acc / fg_cov, b_acc / fg_cov
            else:
                fr = fg_ = fb = 0.0
            # Composite the mark over the background, then the pair over
            # transparency, so the rounded corners stay soft.
            alpha = a_bg + a_fg * (1 - a_bg)
            if alpha <= 0:
                px.extend((0, 0, 0, 0))
                continue
            cr = (bg[0] * a_bg * (1 - a_fg) + fr * a_fg) / alpha
            cg = (bg[1] * a_bg * (1 - a_fg) + fg_ * a_fg) / alpha
            cb = (bg[2] * a_bg * (1 - a_fg) + fb * a_fg) / alpha
            px.extend(
                (
                    max(0, min(255, int(round(cr)))),
                    max(0, min(255, int(round(cg)))),
                    max(0, min(255, int(round(cb)))),
                    max(0, min(255, int(round(alpha * 255)))),
                )
            )
    return bytes(px)


def chunk(tag, payload):
    body = tag + payload
    return struct.pack(">I", len(payload)) + body + struct.pack(">I", zlib.crc32(body))


def write_png(path, size, raw):
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    data = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as handle:
        handle.write(data)
    return len(data)


TARGETS = [
    # path, size, glyph share, background rounding, full-bleed
    ("public/icon-192.png", 192, 0.60, 0.225, False),
    ("public/icon-512.png", 512, 0.60, 0.225, False),
    ("public/icon-maskable-512.png", 512, 0.46, 0.0, True),
    ("public/apple-touch-icon.png", 180, 0.62, 0.0, True),
]

for path, size, glyph, radius, opaque in TARGETS:
    written = write_png(path, size, render(size, glyph, radius, opaque))
    print(f"{path}  {size}x{size}  {written} bytes")
