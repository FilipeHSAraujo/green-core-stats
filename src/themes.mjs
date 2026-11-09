// Color themes. Each theme needs the same keys; `series` colors the language bars.
export const themes = {
  'green-core': {
    bg: '#010402', edge: '#2f6b22', accent: '#7ee32a', bright: '#c2ff4d',
    text: '#d9ffd0', dim: '#7fae74', track: '#0f4d17',
    series: ['#c2ff4d', '#7ee32a', '#4fbf1f', '#2f9a18', '#1f7a14', '#3d5f2c'],
  },
  'amber-terminal': {
    bg: '#0b0700', edge: '#6b4a12', accent: '#ffb000', bright: '#ffd36b',
    text: '#ffe9c2', dim: '#b08a4f', track: '#3d2a06',
    series: ['#ffd36b', '#ffb000', '#e08a00', '#b86e00', '#8a5200', '#5e3d10'],
  },
  'ice-blue': {
    bg: '#01040a', edge: '#1f4f7a', accent: '#3fb7ff', bright: '#a8e4ff',
    text: '#d6f0ff', dim: '#6f93ae', track: '#0c2b47',
    series: ['#a8e4ff', '#3fb7ff', '#1f8fd6', '#1670ad', '#0f5585', '#2c4b66'],
  },
  vaporwave: {
    bg: '#0d0217', edge: '#6b2a7a', accent: '#ff4fd8', bright: '#7af7ff',
    text: '#f6e0ff', dim: '#a985bf', track: '#3a0d4d',
    series: ['#7af7ff', '#ff4fd8', '#b56bff', '#ff8a5c', '#5c7cff', '#7a4f8f'],
  },
};

export function getTheme(name = 'green-core') {
  const t = themes[name];
  if (!t) {
    throw new Error(`Unknown theme "${name}". Available: ${Object.keys(themes).join(', ')}`);
  }
  return t;
}
