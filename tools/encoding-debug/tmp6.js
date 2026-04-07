const s='ط§ظ„ط®ط¯ظ…ط© ط§ظ„ط°ط§طھظٹط©';
const bytes = Uint8Array.from([...s].map(c=>c.charCodeAt(0)));
console.log(bytes);
