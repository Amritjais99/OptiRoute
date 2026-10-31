// Line chart data - model performance over time
export const lineChartData = Array.from({ length: 50 }, (_, i) => ({
  x: i + 1,
  gpt4o: 0.3 + Math.random() * 0.35 + (i > 25 ? 0.1 : 0),
  claude: 0.35 + Math.random() * 0.3 + (i > 25 ? 0.08 : 0),
  mistral: 0.28 + Math.random() * 0.32 + (i > 25 ? 0.12 : 0),
  gemini: 0.2 + Math.random() * 0.15,
  llama: 0.15 + Math.random() * 0.12,
}));

// Bar chart data - model usage distribution
export const barChartData = [
  { name: 'Week 1', gpt4o: 0.32, claude: 0.28, mistral: 0.35, gemini: 0.30 },
  { name: 'Week 2', gpt4o: 0.18, claude: 0.15, mistral: 0.20, gemini: 0.16 },
  { name: 'Week 3', gpt4o: 0.20, claude: 0.18, mistral: 0.22, gemini: 0.19 },
  { name: 'Week 4', gpt4o: 0.33, claude: 0.30, mistral: 0.35, gemini: 0.31 },
  { name: 'Week 5', gpt4o: 0.30, claude: 0.28, mistral: 0.32, gemini: 0.29 },
  { name: 'Week 6', gpt4o: 0.35, claude: 0.32, mistral: 0.38, gemini: 0.33 },
  { name: 'Week 7', gpt4o: 0.05, claude: 0.03, mistral: 0.04, gemini: 0.02 },
];

// Bar chart colors matching dashboard sampled blues
export const barColors = [
  'var(--color-dash-slate-2)',
  'var(--color-dash-slate-1)',
  'var(--color-dash-blue-1)',
  'var(--color-dash-blue-3)',
];

// Line chart colors
export const lineColors = ['#2F3B8E', '#9B2C3E', '#C4A43E', '#7B6CB5', '#E8A87C'];
