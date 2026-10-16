// Q6 – paragraph cloning, HR separators and image-paragraph toggle.
document.addEventListener('DOMContentLoaded', () => {
	const container = document.querySelector('article');
	const addButton = document.getElementById('add-paragraphs');

	// Snapshot the three original paragraphs once, so later copies never compound.
	const originals = Array.from(container.querySelectorAll('p')).map(p => p.cloneNode(true));

	let imagesHidden = false;

	// Fisher–Yates shuffle (returns a new array).
	function shuffle(items) {
		const a = items.slice();
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	// Remove all HRs, then insert one after every 2nd paragraph if another paragraph follows.
	// Hidden paragraphs are still counted.
	function placeSeparators() {
		container.querySelectorAll('hr').forEach(hr => hr.remove());
		const paragraphs = container.querySelectorAll('p');
		paragraphs.forEach((p, i) => {
			const position = i + 1;
			if (position % 2 === 0 && position < paragraphs.length) {
				p.after(document.createElement('hr'));
			}
		});
	}

	function applyImageVisibility(root = container) {
		root.querySelectorAll('p').forEach(p => {
			if (p.querySelector('img')) p.hidden = imagesHidden;
		});
	}

	addButton.addEventListener('click', () => {
		const lastParagraph = Array.from(container.querySelectorAll('p')).pop();
		const fragment = document.createDocumentFragment();
		shuffle(originals).forEach(p => fragment.appendChild(p.cloneNode(true)));
		applyImageVisibility(fragment);          // new image paragraphs inherit the hidden state
		lastParagraph.after(fragment);
		placeSeparators();
	});

	// Second button – created by JavaScript only.
	const toggleButton = document.createElement('button');
	toggleButton.type = 'button';
	toggleButton.id = 'toggle-images';
	toggleButton.setAttribute('aria-pressed', 'false');
	toggleButton.textContent = 'Hide image paragraphs';
	toggleButton.addEventListener('click', () => {
		imagesHidden = !imagesHidden;
		applyImageVisibility();
		toggleButton.setAttribute('aria-pressed', String(imagesHidden));
		toggleButton.textContent = imagesHidden ? 'Show image paragraphs' : 'Hide image paragraphs';
	});
	addButton.after(toggleButton);

	placeSeparators(); // initial load
});
