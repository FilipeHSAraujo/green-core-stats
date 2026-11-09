// Regenerates examples/*.svg from fictional sample data (used in the README).
import { mkdirSync, writeFileSync } from 'node:fs';
import { themes } from '../src/themes.mjs';
import { renderStatsCard, renderLanguagesCard } from '../src/render.mjs';
import { sampleUser } from '../src/sample.mjs';

mkdirSync('examples', { recursive: true });
for (const name of Object.keys(themes)) {
  writeFileSync(`examples/${name}-stats.svg`, renderStatsCard(sampleUser, { theme: name }));
  writeFileSync(`examples/${name}-langs.svg`, renderLanguagesCard(sampleUser, { theme: name }));
}
console.log('Examples written for:', Object.keys(themes).join(', '));
