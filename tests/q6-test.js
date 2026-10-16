// Automated check of Q6 behaviour using jsdom. Run: node q6-test.js
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'q5-q6-html-js');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8').replace(/<script[^>]*><\/script>/, '');
const dom = new JSDOM(html, { runScripts: 'outside-only' });
const { window } = dom;
window.eval(fs.readFileSync(path.join(dir, 'script.js'), 'utf8'));
window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

const d = window.document;
const state = label => {
	const ps = [...d.querySelectorAll('article p')];
	const kids = [...d.querySelector('article').children].filter(e => e.tagName !== 'BUTTON');
	// check: every HR sits after an even-numbered paragraph and is followed by a paragraph
	let pCount = 0, ok = true;
	kids.forEach((el, i) => {
		if (el.tagName === 'P') pCount++;
		if (el.tagName === 'HR') ok = ok && pCount % 2 === 0 && kids[i + 1]?.tagName === 'P';
	});
	const row = { step: label, p: ps.length, hr: d.querySelectorAll('hr').length,
		expectedHr: Math.floor((ps.length - 1) / 2), hiddenImgParas: ps.filter(p => p.hidden).length,
		imgParas: ps.filter(p => p.querySelector('img')).length, separatorsValid: ok };
	console.log(JSON.stringify(row));
	return row;
};
const hit = () => d.getElementById('add-paragraphs').click();
const toggle = () => d.getElementById('toggle-images').click();

const rows = [];
rows.push(state('load'));
hit(); rows.push(state('click 1'));
hit(); rows.push(state('click 2'));
toggle(); rows.push(state('toggle -> hide'));
hit(); rows.push(state('click 3 while hidden'));
toggle(); rows.push(state('toggle -> show'));
hit(); rows.push(state('click 4'));

const pass = rows.every(r => r.hr === r.expectedHr && r.separatorsValid) &&
	rows[3].hiddenImgParas === rows[3].imgParas && rows[4].hiddenImgParas === rows[4].imgParas &&
	rows[5].hiddenImgParas === 0 && d.getElementById('toggle-images') !== null;
console.log(pass ? 'ALL CHECKS PASSED' : 'CHECKS FAILED');
process.exit(pass ? 0 : 1);
