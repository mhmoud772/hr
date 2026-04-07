const fs = require('fs');
const path = 'frontend/src/i18n.ts';
const text = fs.readFileSync(path, 'utf8');

const deMojibake = (value) => {
  if (typeof value !== 'string') return value;
  const tries = [];
  try {
    tries.push(unescape(escape(value)));
  } catch {}
  try {
    tries.push(decodeURIComponent(escape(value)));
  } catch {}
  try {
    const bytes = Uint8Array.from([...value].map(c => c.charCodeAt(0) & 0xff).filter(b => b!==0));
    tries.push(new TextDecoder('utf-8', {fatal:false}).decode(bytes));
  } catch {}
  for (const v of tries) {
    if (/[\u0600-\u06FF]/.test(v)) return v;
  }
  return value;
};

let changed = 0;
const replaced = text.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (full, inner) => {
  const raw = inner.replace(/\\"/g, '"');
  const fixed = deMojibake(raw);
  if (fixed !== raw) {
    changed++;
    const escaped = fixed.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return "";
  }
  return full;
});
fs.writeFileSync(path, replaced, 'utf8');
console.log('strings fixed:', changed);
