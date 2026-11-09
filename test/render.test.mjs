import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateLanguages, statsRows, formatNumber, escapeXml,
  renderStatsCard, renderLanguagesCard,
} from '../src/render.mjs';
import { themes, getTheme } from '../src/themes.mjs';
import { sampleUser } from '../src/sample.mjs';

const isSvg = (s) => s.startsWith('<svg') && s.trimEnd().endsWith('</svg>');

describe('formatNumber', () => {
  test('keeps small numbers as they are', () => assert.equal(formatNumber(999), '999'));
  test('abbreviates thousands', () => assert.equal(formatNumber(1500), '1.5k'));
  test('drops a trailing .0', () => assert.equal(formatNumber(2000), '2k'));
  test('treats invalid values as 0', () => {
    assert.equal(formatNumber(-5), '0');
    assert.equal(formatNumber(NaN), '0');
  });
});

describe('escapeXml', () => {
  test('escapes characters that would break the SVG', () => {
    assert.equal(escapeXml('<C&C> "x"'), '&lt;C&amp;C&gt; &quot;x&quot;');
  });
});

describe('aggregateLanguages', () => {
  test('sums bytes of the same language across repos', () => {
    const langs = aggregateLanguages([
      { languages: { edges: [{ size: 100, node: { name: 'Java' } }] } },
      { languages: { edges: [{ size: 300, node: { name: 'Java' } }] } },
    ]);
    assert.equal(langs.length, 1);
    assert.equal(langs[0].size, 400);
    assert.equal(langs[0].percent, 100);
  });

  test('sorts by size, largest first', () => {
    const names = aggregateLanguages(sampleUser.repositories.nodes).map((l) => l.name);
    assert.deepEqual(names.slice(0, 3), ['JavaScript', 'Java', 'HTML']);
  });

  test('respects the limit', () => {
    assert.equal(aggregateLanguages(sampleUser.repositories.nodes, 2).length, 2);
  });

  test('percentages of all languages add up to 100', () => {
    const all = aggregateLanguages(sampleUser.repositories.nodes, 99);
    const total = all.reduce((a, l) => a + l.percent, 0);
    assert.ok(Math.abs(total - 100) < 1e-9, `got ${total}`);
  });

  test('returns an empty list for no repos, null or zero-size data', () => {
    assert.deepEqual(aggregateLanguages([]), []);
    assert.deepEqual(aggregateLanguages(null), []);
    assert.deepEqual(aggregateLanguages([{ languages: { edges: [{ size: 0, node: { name: 'Go' } }] } }]), []);
  });

  test('ignores malformed edges instead of crashing', () => {
    const langs = aggregateLanguages([{ languages: { edges: [null, { size: 10 }, { size: 5, node: { name: 'C' } }] } }]);
    assert.deepEqual(langs.map((l) => l.name), ['C']);
  });
});

describe('statsRows', () => {
  test('adds private (restricted) commits to public commits', () => {
    const commits = statsRows(sampleUser).find((r) => r.label === 'COMMITS (LAST YEAR)');
    assert.equal(commits.value, 400);
  });

  test('sums stars across repos', () => {
    assert.equal(statsRows(sampleUser).find((r) => r.label === 'TOTAL STARS').value, 10);
  });

  test('falls back to zeros for a brand-new account', () => {
    assert.ok(statsRows({ login: 'new' }).every((r) => r.value === 0));
  });
});

describe('themes', () => {
  test('every theme has the same keys and six series colors', () => {
    const keys = Object.keys(themes['green-core']).sort();
    for (const [name, t] of Object.entries(themes)) {
      assert.deepEqual(Object.keys(t).sort(), keys, name);
      assert.equal(t.series.length, 6, name);
    }
  });

  test('an unknown theme gives a helpful error', () => {
    assert.throws(() => getTheme('nope'), /Available: green-core/);
  });
});

describe('rendering', () => {
  for (const name of Object.keys(themes)) {
    test(`stats and languages cards are valid SVG in ${name}`, () => {
      assert.ok(isSvg(renderStatsCard(sampleUser, { theme: name })));
      assert.ok(isSvg(renderLanguagesCard(sampleUser, { theme: name })));
    });
  }

  test('user names are escaped in the title', () => {
    const svg = renderStatsCard({ ...sampleUser, name: 'A<b>&c' });
    assert.match(svg, /A&LT;B&GT;&AMP;C|A&lt;B&gt;&amp;C/i);
    assert.doesNotMatch(svg, /A<B>/);
  });

  test('languages card shows an empty state when there is no data', () => {
    const svg = renderLanguagesCard({ login: 'new', repositories: { nodes: [] } });
    assert.match(svg, /NO LANGUAGE DATA YET/);
  });

  test('languages card never draws more than six languages', () => {
    const svg = renderLanguagesCard(sampleUser, { limit: 50 });
    assert.equal((svg.match(/class="row"/g) || []).length, 6);
  });
});
