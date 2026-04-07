const deMojibake = (value) => {
  if (typeof value !== 'string') return value;
  try {
    const fixed = unescape(escape(value));
    if (/[\u0600-\u06FF]/.test(fixed)) return fixed;
  } catch {}
  try {
    const fixed = decodeURIComponent(escape(value));
    if (/[\u0600-\u06FF]/.test(fixed)) return fixed;
  } catch {}
  return value;
};
const samples = [
  'Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©',
  'ط§ظ„ط®ط¯ظ…ط© ط§ظ„ط°ط§طھظٹط©',
  'الإعدادات'
];
samples.forEach((s) => console.log(s, '->', deMojibake(s)));
