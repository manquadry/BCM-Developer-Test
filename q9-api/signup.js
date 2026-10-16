/**
 * Q9 – Idempotent newsletter signup (Node 18+, local mock included).
 * Run: node signup.js
 */
const crypto = require('crypto');

// ---- Local store (stand-in for a DB table: signups) ----
const db = new Map(); // key: email_hash -> { idempotencyKey, status, attempts, providerId }

// ---- Mock provider: honours Idempotency-Key, can simulate timeout/429/400 ----
const provider = {
	records: new Map(), // idempotencyKey -> subscriber
	mode: [],           // queue of behaviours for the next calls
	async subscribe(email, key) {
		const behaviour = this.mode.shift() || 'ok';
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { status: 400, body: { error: 'invalid_email' } };
		if (behaviour === '429') return { status: 429, headers: { 'retry-after': '0' } };
		// Accept (idempotently) first, then possibly "lose" the response.
		if (!this.records.has(key)) this.records.set(key, { id: 'sub_' + this.records.size, email });
		if (behaviour === 'timeout-after-accept') throw new Error('ETIMEDOUT');
		return { status: 200, body: this.records.get(key) };
	},
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const hash = email => crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

async function subscribe(email, maxAttempts = 4) {
	const emailHash = hash(email);
	// 1. Persist intent BEFORE calling out, reusing the key if this email is already pending.
	let row = db.get(emailHash);
	if (row?.status === 'subscribed') return row;                  // already done – no duplicate
	if (!row) { row = { idempotencyKey: crypto.randomUUID(), status: 'pending', attempts: 0 }; db.set(emailHash, row); }

	while (row.attempts < maxAttempts) {
		row.attempts++;
		try {
			const res = await provider.subscribe(email, row.idempotencyKey); // same key on every retry
			if (res.status === 200) { Object.assign(row, { status: 'subscribed', providerId: res.body.id }); break; }
			if (res.status === 400) { row.status = 'invalid'; break; }          // permanent – never retry
			if (res.status === 429) {
				const wait = Number(res.headers['retry-after'] ?? 1) * 1000 || 2 ** row.attempts * 100;
				await sleep(wait + Math.random() * 100);                       // backoff + jitter
				continue;
			}
			// Any other status (e.g. 5xx) is treated as transient: back off, then retry with the same key.
			await sleep(2 ** row.attempts * 100 + Math.random() * 100);
		} catch (err) {
			// Timeout: outcome unknown. Retry with SAME key; provider dedupes.
			await sleep(2 ** row.attempts * 100 + Math.random() * 100);
		}
	}
	if (row.status === 'pending') row.status = 'needs_retry';           // picked up later by a queue/cron
	// Log metadata only – never the raw email, API key or full provider payload.
	console.log(JSON.stringify({ emailHash: emailHash.slice(0, 12), key: row.idempotencyKey, status: row.status, attempts: row.attempts }));
	return row;
}

// ---- Tests ----
(async () => {
	const assert = require('assert');

	provider.mode = ['timeout-after-accept'];                 // accepted, but response lost
	await subscribe('reader@example.com');
	assert.strictEqual(provider.records.size, 1, 'retry after accepted request must not duplicate');

	await subscribe('reader@example.com');                     // user resubmits form
	assert.strictEqual(provider.records.size, 1);

	provider.mode = ['429'];
	const r = await subscribe('second@example.com');
	assert.strictEqual(r.status, 'subscribed');

	const bad = await subscribe('not-an-email');
	assert.strictEqual(bad.status, 'invalid');
	assert.strictEqual(bad.attempts, 1, 'invalid email is not retried');

	console.log('All tests passed. Provider records:', provider.records.size);
})();
