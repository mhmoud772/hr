const fix = (str) => {
  const bytes = new Uint8Array([...str].map((c) => c.charCodeAt(0) & 0xff));
  try {
    const decoded = new TextDecoder('utf-8').decode(bytes);
    if (/[\u0600-\u06FF]/.test(decoded)) return decoded;
  } catch {}
  return str;
};
const samples = ['?§U„?®?¯U…?© ?§U„?°?§??U??©','Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©','ÇáÎÏãÉ ÇáÐÇÊíÉ'];
for (const s of samples) {
  console.log('in:', s);
  console.log('out:', fix(s));
}
