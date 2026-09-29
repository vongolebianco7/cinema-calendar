export const POC_STATES = Object.freeze([0, 10, 30, 100, 300, 500]);
export const DEFAULT_SEED = 'cinemap-poc-01';
export const POC_MODES = Object.freeze(['A', 'B', 'C', 'D', 'E']);

function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalizeState(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 100;
  return POC_STATES.reduce((best, candidate) =>
    Math.abs(candidate - n) < Math.abs(best - n) ? candidate : best, POC_STATES[0]);
}

export function createScenario(stateValue = 100, seed = DEFAULT_SEED) {
  const state = normalizeState(stateValue);
  const random = mulberry32(hashSeed(`${seed}:${state}`));
  const maturity = Math.min(1, state / 300);
  const species = state === 0 ? 0 : Math.max(2, Math.min(18, Math.round(2 + Math.sqrt(state) * 0.72)));
  const schools = state < 10 ? 0 : Math.min(7, Math.max(1, Math.floor(Math.sqrt(state) / 3)));
  const vegetation = state === 0 ? 0.08 : Math.min(1, 0.12 + maturity * 0.88);
  const reef = state === 0 ? 0.06 : Math.min(1, 0.1 + maturity * 0.9);
  const largeLife = state >= 100 ? Math.min(3, 1 + Math.floor(state / 250)) : 0;
  const organisms = Array.from({ length: Math.min(36, Math.max(0, species + schools * 2 + largeLife)) }, (_, index) => ({
    id: `${seed}-${state}-${index}`,
    atlas: index,
    family: index < largeLife ? ['manta', 'shark', 'whale'][index % 3] : (index % 5 === 0 ? 'clownfish' : 'grouper'),
    niche: index % 4 === 0 ? 'reef' : index % 7 === 0 ? 'benthic' : 'pelagic',
    scale: Number((0.78 + random() * 0.62).toFixed(3)),
    hero: index < largeLife,
  }));
  return {
    seed,
    state,
    maturity,
    stats: { watched: state, species },
    habitat: { reef, vegetation, schools },
    organisms,
  };
}

export function scenarioFromSearch(search = globalThis.location?.search || '') {
  const params = new URLSearchParams(search);
  return {
    mode: POC_MODES.includes(params.get('mode')) ? params.get('mode') : 'A',
    scenario: createScenario(params.get('pocState') ?? 100, params.get('seed') || DEFAULT_SEED),
  };
}
