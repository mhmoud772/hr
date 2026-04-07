import json

def get_all_keys(d, prefix=""):
    keys = {}
    for k, v in d.items():
        key_path = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.update(get_all_keys(v, key_path))
        else:
            keys[key_path] = v
    return keys

def get_missing_keys(en_dict, ar_dict, prefix=""):
    missing = {}
    for k, v in en_dict.items():
        key_path = f"{prefix}.{k}" if prefix else k
        if k not in ar_dict:
            if isinstance(v, dict):
                # Entire subtree is missing
                sub = get_all_keys(v, key_path)
                missing.update(sub)
            else:
                missing[key_path] = v
        elif isinstance(v, dict) and isinstance(ar_dict.get(k), dict):
            sub_missing = get_missing_keys(v, ar_dict[k], key_path)
            missing.update(sub_missing)
    return missing

with open('d:/hr-companion-main/frontend/src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)
with open('d:/hr-companion-main/frontend/src/i18n/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

missing = get_missing_keys(en, ar)
print(f"Missing keys ({len(missing)}):")
for k, v in missing.items():
    print(f"  {k}: {repr(v)}")
