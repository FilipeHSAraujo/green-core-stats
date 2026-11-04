// Generates assets/stats.svg and assets/langs.svg in the Green Core theme.
// Runs inside GitHub Actions (see .github/workflows/stats.yml). No external service.
import { writeFileSync, mkdirSync } from 'node:fs';

const LOGIN = process.env.GH_USER || 'FilipeHSAraujo';
const TOKEN = process.env.GITHUB_TOKEN;

const C = {
  void: '#010402', panel: '#06180a', edge: '#2f6b22',
  core: '#7ee32a', neon: '#c2ff4d', text: '#d9ffd0', dim: '#7fae74', moss: '#0f4d17',
};
const greens = ['#c2ff4d', '#7ee32a', '#4fbf1f', '#2f9a18', '#1f7a14', '#3d5f2c'];

const QUERY = `query($login: String!) {
  user(login: $login) {
    name login
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
      contributionCalendar { totalContributions }
    }
    pullRequests { totalCount }
    issues { totalCount }
    followers { totalCount }
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100) {
      totalCount
      nodes {
        stargazerCount
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name } }
        }
      }
    }
  }
}`;

async function load() {
  if (process.env.MOCK) {
    return {
      name: 'Filipe Araujo', login: LOGIN,
      contributionsCollection: { totalCommitContributions: 342, restrictedContributionsCount: 58, contributionCalendar: { totalContributions: 512 } },
      pullRequests: { totalCount: 41 }, issues: { totalCount: 17 }, followers: { totalCount: 23 },
      repositories: { totalCount: 28, nodes: [
        { stargazerCount: 6, languages: { edges: [{ size: 90000, node: { name: 'JavaScript' } }, { size: 40000, node: { name: 'HTML' } }, { size: 30000, node: { name: 'CSS' } }] } },
        { stargazerCount: 3, languages: { edges: [{ size: 70000, node: { name: 'Java' } }, { size: 20000, node: { name: 'GDScript' } }] } },
        { stargazerCount: 1, languages: { edges: [{ size: 25000, node: { name: 'Python' } }, { size: 9000, node: { name: 'C#' } }] } },
      ] },
    };
  }
  if (!TOKEN) throw new Error('GITHUB_TOKEN is missing');
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'green-core-stats' },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));
  return json.data.user;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);

function frame(w, h, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
  <style>
    @keyframes grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
    @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
    @keyframes pulse { 50% { opacity: .3 } }
    .bar { transform-box: fill-box; transform-origin: left; animation: grow 1s ease-out both }
    .row { animation: fade .6s ease-out both }
    .led { animation: pulse 1.4s ease-in-out infinite }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important } }
  </style>
  <defs>
    <linearGradient id="hi" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.core}" stop-opacity=".18"/><stop offset=".45" stop-color="${C.core}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="tb" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${C.core}" stop-opacity=".3"/><stop offset="1" stop-color="${C.core}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".3"/></pattern>
  </defs>
  <path d="M.5 .5H${w - 16.5}L${w - .5} 16.5V${h - .5}H16.5L.5 ${h - 16.5}Z" fill="${C.void}"/>
  <path d="M.5 .5H${w - 16.5}L${w - .5} 16.5V${h - .5}H16.5L.5 ${h - 16.5}Z" fill="url(#hi)"/>
  <rect x="1" y="1" width="${w - 18}" height="30" fill="url(#tb)"/>
  <circle class="led" cx="18" cy="16" r="4" fill="${C.neon}"/>
  <text x="30" y="21" font-family="'Courier New', monospace" font-weight="bold" font-size="14" letter-spacing="2" fill="${C.neon}">${esc(title)}</text>
  <line x1="1" y1="31" x2="${w - 1}" y2="31" stroke="${C.core}" stroke-opacity=".35"/>
${body}
  <rect width="${w}" height="${h}" fill="url(#scan)"/>
  <path d="M.5 .5H${w - 16.5}L${w - .5} 16.5V${h - .5}H16.5L.5 ${h - 16.5}Z" fill="none" stroke="${C.edge}" stroke-width="1.5"/>
  <path d="M.5 .5H${w - 16.5}" stroke="${C.neon}" stroke-width="1.5"/>
</svg>
`;
}

function statsCard(u, stars) {
  const cc = u.contributionsCollection;
  const rows = [
    ['TOTAL STARS', stars],
    ['COMMITS (LAST YEAR)', cc.totalCommitContributions + cc.restrictedContributionsCount],
    ['CONTRIBUTIONS (LAST YEAR)', cc.contributionCalendar.totalContributions],
    ['PULL REQUESTS', u.pullRequests.totalCount],
    ['ISSUES', u.issues.totalCount],
    ['PUBLIC REPOS', u.repositories.totalCount],
  ];
  const max = Math.max(...rows.map(r => r[1]), 1);
  const body = rows.map(([label, v], i) => {
    const y = 56 + i * 24;
    const bw = Math.max(4, Math.round((v / max) * 150));
    return `  <g class="row" style="animation-delay:${i * 0.12}s">
    <text x="18" y="${y}" font-family="'Courier New', monospace" font-size="12" letter-spacing="1" fill="${C.dim}">▸ ${label}</text>
    <rect x="248" y="${y - 10}" width="150" height="10" fill="${C.moss}" opacity=".45"/>
    <rect class="bar" style="animation-delay:${i * 0.12}s" x="248" y="${y - 10}" width="${bw}" height="10" fill="${C.core}"/>
    <text x="477" y="${y}" text-anchor="end" font-family="'Courier New', monospace" font-weight="bold" font-size="14" fill="${C.neon}">${fmt(v)}</text>
  </g>`;
  }).join('\n');
  return frame(495, 200, `${(u.name || u.login).toUpperCase()} // STATS.EXE`, body);
}

function langsCard(u) {
  const totals = {};
  for (const r of u.repositories.nodes) for (const e of r.languages.edges) totals[e.node.name] = (totals[e.node.name] || 0) + e.size;
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  let top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!top.length) top = [['NO DATA', 1]];
  // segmented bar
  let x = 18; const W = 459;
  const segs = top.map(([n, s], i) => {
    const w = Math.max(2, (s / sum) * W);
    const r = `<rect class="bar" style="animation-delay:${i * 0.1}s" x="${x.toFixed(1)}" y="46" width="${w.toFixed(1)}" height="12" fill="${greens[i]}"/>`;
    x += w; return r;
  }).join('\n    ');
  const items = top.map(([n, s], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const tx = 18 + col * 236, ty = 92 + row * 30;
    const pct = ((s / sum) * 100).toFixed(1);
    return `  <g class="row" style="animation-delay:${0.3 + i * 0.1}s">
    <rect x="${tx}" y="${ty - 10}" width="10" height="10" fill="${greens[i]}"/>
    <text x="${tx + 18}" y="${ty}" font-family="'Courier New', monospace" font-size="13" fill="${C.text}">${esc(n)}</text>
    <text x="${tx + 218}" y="${ty}" text-anchor="end" font-family="'Courier New', monospace" font-weight="bold" font-size="13" fill="${C.neon}">${pct}%</text>
  </g>`;
  }).join('\n');
  const body = `  <rect x="18" y="46" width="${W}" height="12" fill="${C.moss}" opacity=".45"/>
    ${segs}
${items}`;
  return frame(495, 200, 'TOP_LANGUAGES.CFG', body);
}

const u = await load();
const stars = u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0);
mkdirSync('assets', { recursive: true });
writeFileSync('assets/stats.svg', statsCard(u, stars));
writeFileSync('assets/langs.svg', langsCard(u));
console.log('Green Core stats cards updated for', u.login);
