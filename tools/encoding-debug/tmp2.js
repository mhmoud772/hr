const s='Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©';
console.log('escape', escape(s));
console.log('unescape->', unescape(escape(s)));
console.log('decodeURIComponent->', decodeURIComponent(escape(s)));
