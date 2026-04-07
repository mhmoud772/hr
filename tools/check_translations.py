import json

def check_keys(en_dict, ar_dict, prefix=""):
    missing = []
    untranslated = []
    for k, v in en_dict.items():
        key_path = f"{prefix}.{k}" if prefix else k
        if k not in ar_dict:
            missing.append(key_path)
        elif isinstance(v, dict):
            if isinstance(ar_dict.get(k), dict):
                m, u = check_keys(v, ar_dict[k], key_path)
                missing.extend(m)
                untranslated.extend(u)
            else:
                missing.append(key_path + " (type mismatch)")
        else:
            # check if untranslated
            if v == ar_dict[k] and isinstance(v, str) and any(c.isalpha() for c in v):
                untranslated.append(key_path)
    return missing, untranslated

try:
    with open('d:/hr-companion-main/frontend/src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
        en = json.load(f)
    with open('d:/hr-companion-main/frontend/src/i18n/locales/ar.json', 'r', encoding='utf-8') as f:
        ar = json.load(f)

    missing, untranslated = check_keys(en, ar)

    print(f"Total English keys: {len(en)}")
    print(f"Missing in Arabic: {len(missing)}")
    if missing:
        for mk in missing[:20]:
            print(f"  - {mk}")
        if len(missing) > 20: print("  ...")

    print(f"\nUntranslated (Value same as English): {len(untranslated)}")
    if untranslated:
        for uk in untranslated[:20]:
            print(f"  - {uk}")
        if len(untranslated) > 20: print("  ...")
except Exception as e:
    print(f"Error: {e}")
