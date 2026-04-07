import re, pathlib
path = pathlib.Path('frontend/src/i18n.ts')
text = path.read_text(encoding='utf8')

arabic_re = re.compile(r'[\u0600-\u06FF]')
str_re = re.compile(r'"([^"\\]*(?:\\.[^"\\]*)*)"')


def demojibake(val: str) -> str:
    original = val
    for _ in range(3):
        try:
            b = val.encode('latin-1', errors='replace')
            val2 = b.decode('utf-8', errors='replace')
        except Exception:
            break
        if val2 == val:
            break
        val = val2
    return val

changed = 0
parts = []
last = 0
for m in str_re.finditer(text):
    parts.append(text[last:m.start()])
    raw = m.group(1)
    fixed = demojibake(raw)
    if arabic_re.search(fixed) and fixed != raw:
        changed += 1
    else:
        fixed = raw
    fixed = fixed.replace('\\', '\\\\').replace('"', '\\"')
    parts.append(f'"{fixed}"')
    last = m.end()
parts.append(text[last:])
new_text = ''.join(parts)
path.write_text(new_text, encoding='utf8')
print('changed', changed)
