const fix = (value) => {
  const bytes = Uint8Array.from([...value].map((c) => c.charCodeAt(0)));
  try {
    const decoded = new TextDecoder('utf-8').decode(bytes);
    if (/[\u0600-\u06FF]/.test(decoded)) return decoded;
  } catch {}
  return value;
};
['Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©','ط§ظ„ط®ط¯ظ…ط© ط§ظ„ط°ط§طھظٹط©','الإعدادات'].forEach(s=>console.log(s,'->',fix(s)));
