const correct='«·Œœ„… «·–« Ì…';
const utf8Bytes=new TextEncoder().encode(correct);
const garbled=new TextDecoder('iso-8859-1').decode(utf8Bytes);
console.log(garbled);
