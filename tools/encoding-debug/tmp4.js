const s='Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©';
const bytes = Uint8Array.from([...s].map(c=>c.charCodeAt(0)));
console.log(bytes);
const decoded=new TextDecoder('utf-8',{fatal:false}).decode(bytes);
console.log(decoded);
