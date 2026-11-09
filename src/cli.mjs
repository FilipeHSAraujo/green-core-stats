#!/usr/bin/env node
// Entry point used by action.yml. Also runnable locally:
//   GITHUB_TOKEN=xxx GCS_USERNAME=you node src/cli.mjs
//   GCS_SAMPLE=1 node src/cli.mjs        (fictional data, no token needed)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchUser } from './github.mjs';
import { renderStatsCard, renderLanguagesCard } from './render.mjs';
import { sampleUser } from './sample.mjs';

const env = process.env;
const username = env.GCS_USERNAME || env.GITHUB_REPOSITORY_OWNER;
const theme = env.GCS_THEME || 'green-core';
const outDir = env.GCS_OUTPUT_DIR || 'assets';
const limit = Number.parseInt(env.GCS_LANGS_COUNT || '6', 10);

try {
  const user = env.GCS_SAMPLE ? sampleUser : await fetchUser(username, env.GITHUB_TOKEN);
  mkdirSync(outDir, { recursive: true });
  const statsPath = join(outDir, 'stats.svg');
  const langsPath = join(outDir, 'langs.svg');
  writeFileSync(statsPath, renderStatsCard(user, { theme }));
  writeFileSync(langsPath, renderLanguagesCard(user, { theme, limit }));
  console.log(`✔ Cards written for ${user.login} (theme: ${theme}): ${statsPath}, ${langsPath}`);
} catch (err) {
  console.error(`✖ ${err.message}`);
  process.exit(1);
}
