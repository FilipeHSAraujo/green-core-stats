import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchUser } from '../src/github.mjs';

const fakeFetch = (status, body) => async () => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

test('returns the user on success', async () => {
  const user = await fetchUser('me', 't', fakeFetch(200, { data: { user: { login: 'me' } } }));
  assert.equal(user.login, 'me');
});

test('fails clearly without a token', async () => {
  await assert.rejects(fetchUser('me', ''), /No GitHub token/);
});

test('fails clearly without a username', async () => {
  await assert.rejects(fetchUser('', 't'), /No username/);
});

test('reports GraphQL errors', async () => {
  await assert.rejects(
    fetchUser('me', 't', fakeFetch(200, { errors: [{ message: 'Bad credentials' }] })),
    /Bad credentials/,
  );
});

test('reports an unknown user', async () => {
  await assert.rejects(fetchUser('ghost', 't', fakeFetch(200, { data: { user: null } })), /not found/);
});

test('reports a non-JSON response', async () => {
  const broken = async () => ({ ok: false, status: 502, json: async () => { throw new Error('x'); } });
  await assert.rejects(fetchUser('me', 't', broken), /502/);
});
