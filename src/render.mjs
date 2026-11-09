// Pure functions: data in, SVG strings out. No network, easy to test.
import { getTheme } from './themes.mjs';

export const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function formatNumber(n) {
  if (!Number.isFinite(n) || n < 0) return '0';
  if (n < 1000) return String(Math.round(n));
  return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
}

/** Sums language bytes across repos and returns the top N with percentages (sum of all = 100). */
export function aggregateLanguages(repos, limit = 6) {
  const totals = new Map();
  for (const repo of repos ?? []) {
    for (const edge of repo?.languages?.edges ?? []) {
      const name = edge?.node?.name;
      if (!name || !(edge.size > 0)) continue;
      totals.set(name, (totals.get(name) ?? 0) + edge.size);
    }
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  if (sum === 0) return [];
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, size]) => ({ name, size, percent: (size / sum) * 100 }));
}

/** Turns the GraphQL user object into the rows shown on the stats card. */
export function statsRows(user) {
  const cc = user?.contributionsCollection ?? {};
  const repos = user?.repositories?.nodes ?? [];
  const stars = repos.reduce((a, r) => a + (r?.stargazerCount ?? 0), 0);
  return [
    { label: 'TOTAL STARS', value: stars },
    { label: 'COMMITS (LAST YEAR)', value: (cc.totalCommitContributions ?? 0) + (cc.restrictedContributionsCount ?? 0) },
    { label: 'CONTRIBUTIONS (LAST YEAR)', value: cc.contributionCalendar?.totalContributions ?? 0 },
    { label: 'PULL REQUESTS', value: user?.pullRequests?.totalCount ?? 0 },
    { label: 'ISSUES', value: user?.issues?.totalCount ?? 0 },
    { label: 'PUBLIC REPOS', value: user?.repositories?.totalCount ?? 0 },
  ];
}

const MONO = "'Courier New', Courier, monospace";
const W = 495;
const H = 200;
const outline = `M.5 .5H${W - 16.5}L${W - 0.5} 16.5V${H - 0.5}H16.5L.5 ${H - 16.5}Z`;

function frame(t, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(title)}">
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
      <stop offset="0" stop-color="${t.accent}" stop-opacity=".18"/><stop offset=".45" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="tb" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}" stop-opacity=".3"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".3"/></pattern>
  </defs>
  <path d="${outline}" fill="${t.bg}"/>
  <path d="${outline}" fill="url(#hi)"/>
  <rect x="1" y="1" width="${W - 18}" height="30" fill="url(#tb)"/>
  <circle class="led" cx="18" cy="16" r="4" fill="${t.bright}"/>
  <text x="30" y="21" font-family="${MONO}" font-weight="bold" font-size="14" letter-spacing="2" fill="${t.bright}">${escapeXml(title)}</text>
  <line x1="1" y1="31" x2="${W - 1}" y2="31" stroke="${t.accent}" stroke-opacity=".35"/>
${body}
  <rect width="${W}" height="${H}" fill="url(#scan)"/>
  <path d="${outline}" fill="none" stroke="${t.edge}" stroke-width="1.5"/>
  <path d="M.5 .5H${W - 16.5}" stroke="${t.bright}" stroke-width="1.5"/>
</svg>
`;
}

export function renderStatsCard(user, { theme = 'green-core', title } = {}) {
  const t = getTheme(theme);
  const rows = statsRows(user);
  const max = Math.max(1, ...rows.map((r) => r.value));
  const body = rows
    .map(({ label, value }, i) => {
      const y = 56 + i * 24;
      const bw = Math.max(4, Math.round((value / max) * 150));
      return `  <g class="row" style="animation-delay:${(i * 0.12).toFixed(2)}s">
    <text x="18" y="${y}" font-family="${MONO}" font-size="12" letter-spacing="1" fill="${t.dim}">▸ ${label}</text>
    <rect x="248" y="${y - 10}" width="150" height="10" fill="${t.track}" opacity=".45"/>
    <rect class="bar" style="animation-delay:${(i * 0.12).toFixed(2)}s" x="248" y="${y - 10}" width="${bw}" height="10" fill="${t.accent}"/>
    <text x="477" y="${y}" text-anchor="end" font-family="${MONO}" font-weight="bold" font-size="14" fill="${t.bright}">${formatNumber(value)}</text>
  </g>`;
    })
    .join('\n');
  const name = (user?.name || user?.login || 'GITHUB').toUpperCase();
  return frame(t, title ?? `${name} // STATS.EXE`, body);
}

export function renderLanguagesCard(user, { theme = 'green-core', title = 'TOP_LANGUAGES.CFG', limit = 6 } = {}) {
  const t = getTheme(theme);
  const langs = aggregateLanguages(user?.repositories?.nodes, Math.min(Math.max(limit, 1), 6));
  const barW = W - 36;
  let body;
  if (langs.length === 0) {
    body = `  <rect x="18" y="46" width="${barW}" height="12" fill="${t.track}" opacity=".45"/>
  <text x="${W / 2}" y="120" text-anchor="middle" font-family="${MONO}" font-size="13" fill="${t.dim}">NO LANGUAGE DATA YET</text>`;
  } else {
    let x = 18;
    const segs = langs
      .map((l, i) => {
        const w = Math.max(2, (l.percent / 100) * barW);
        const seg = `<rect class="bar" style="animation-delay:${(i * 0.1).toFixed(1)}s" x="${x.toFixed(1)}" y="46" width="${w.toFixed(1)}" height="12" fill="${t.series[i]}"/>`;
        x += w;
        return seg;
      })
      .join('\n  ');
    const items = langs
      .map((l, i) => {
        const tx = 18 + (i % 2) * 236;
        const ty = 92 + Math.floor(i / 2) * 30;
        return `  <g class="row" style="animation-delay:${(0.3 + i * 0.1).toFixed(1)}s">
    <rect x="${tx}" y="${ty - 10}" width="10" height="10" fill="${t.series[i]}"/>
    <text x="${tx + 18}" y="${ty}" font-family="${MONO}" font-size="13" fill="${t.text}">${escapeXml(l.name)}</text>
    <text x="${tx + 218}" y="${ty}" text-anchor="end" font-family="${MONO}" font-weight="bold" font-size="13" fill="${t.bright}">${l.percent.toFixed(1)}%</text>
  </g>`;
      })
      .join('\n');
    body = `  <rect x="18" y="46" width="${barW}" height="12" fill="${t.track}" opacity=".45"/>
  ${segs}
${items}`;
  }
  return frame(t, title, body);
}
