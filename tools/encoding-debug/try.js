const s='الخدمة الذاتية';
console.log('orig', s);
const escaped = escape(s);
console.log('escaped', escaped.slice(0,60));
const unesc = unescape(escaped);
console.log('unescape->', unesc);
