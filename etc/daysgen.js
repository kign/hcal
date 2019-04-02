#! /usr/bin/env node

'use strict';

const Hebcal = require('hebcal');

console.log("const L = new Int8Array([");
let b = [];
for (let y=1; y<=10000; y ++) {
	let cnt;
	const leap = y%19 == 0 || y%19 == 3 || y%19 == 6 || y%19 == 8 || y%19 == 11 || y%19 == 14 || y%19 == 17;
	try {
		cnt = (new Hebcal(y)).days().length - (leap? 382: 352);
	}
	catch(err) {
		cnt = 0;
	}
	b.push(cnt);
	if (b.length == 19) {
		console.log(b.join(',') + ((y < 10000)? "," : ""));
		b = [];
	}
}

if (b.length > 0)
	console.log(b.join(','));
console.log("]);");
console.log("//exports.L = L");

