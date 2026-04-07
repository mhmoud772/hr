const fix = (value) => Buffer.from(value, 'latin1').toString('utf8');
['Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©','ط§ظ„ط®ط¯ظ…ط© ط§ظ„ط°ط§طھظٹط©','الإعدادات'].forEach(s=>console.log(s,'->',fix(s)));
