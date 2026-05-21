#!/usr/bin/env python3
# Tạo icon SVG đơn giản cho PWA
# Chạy: python3 generate_icons.py

svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#0f172a"/>
  <text x="256" y="320" font-size="300" text-anchor="middle"
    font-family="Arial" fill="#3b82f6">₿</text>
</svg>'''

with open('icon.svg', 'w') as f:
    f.write(svg)

print("Tạo icon.svg thành công.")
print("Để tạo PNG: dùng Inkscape, GIMP, hoặc https://cloudconvert.com/svg-to-png")
print("Cần 2 file: icon-192.png (192x192) và icon-512.png (512x512)")
