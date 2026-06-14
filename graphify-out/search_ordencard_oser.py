from pathlib import Path

path = Path('src/components/mantenimiento/OrdenCard.tsx')
content = path.read_text(encoding='utf-8-sig')
for idx, line in enumerate(content.splitlines(), 1):
    if 'OSER' in line:
        print(f"Line {idx}: {line}")
