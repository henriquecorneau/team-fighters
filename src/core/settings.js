// Configurações persistentes (localStorage) — volumes, regras e controles.
const KEY = 'teamfighters.v1';

export const KB_PRESETS = {
  kb1: {
    left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'],
    light: ['KeyJ'], heavy: ['KeyK'], sp1: ['KeyU'], sp2: ['KeyI'], super: ['KeyO'], block: ['KeyL'],
  },
  kb2: {
    left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp', 'Numpad8'], down: ['ArrowDown', 'Numpad5'],
    light: ['Numpad1'], heavy: ['Numpad2'], sp1: ['Numpad4'], sp2: ['Numpad6'], super: ['Numpad3'], block: ['Numpad0'],
  },
  // Alternativa para notebooks sem teclado numérico.
  kb2compact: {
    left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
    light: ['KeyB'], heavy: ['KeyN'], sp1: ['KeyG'], sp2: ['KeyH'], super: ['KeyY'], block: ['KeyM'],
  },
};
export const PAD_PRESET = { light: 2, heavy: 3, sp1: 0, sp2: 1, super: 5, block: 4 };

const clone = (o) => JSON.parse(JSON.stringify(o));

function defaults() {
  return {
    music: 0.55, sfx: 0.8, rounds: 2, time: 99, difficulty: 'normal', pixel: true,
    p1: { kb: 'kb1', pad: 0 }, p2: { kb: 'kb2', pad: 1 },
    keys: { kb1: clone(KB_PRESETS.kb1), kb2: clone(KB_PRESETS.kb2) },
    kb2layout: 'numpad',
    pad: clone(PAD_PRESET),
    stats: { tourney: {}, wins: {} },
  };
}

function load() {
  const d = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object') {
      for (const k of Object.keys(d)) {
        if (raw[k] === undefined) continue;
        d[k] = (typeof d[k] === 'object' && !Array.isArray(d[k])) ? { ...d[k], ...raw[k] } : raw[k];
      }
    }
  } catch { /* armazenamento indisponível: segue com padrões */ }
  return d;
}

export const settings = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignora */ }
}

export function resetControls() {
  const d = defaults();
  settings.p1 = d.p1; settings.p2 = d.p2; settings.keys = d.keys; settings.pad = d.pad; settings.kb2layout = 'numpad';
  save();
}

export function setKb2Layout(name) {
  settings.kb2layout = name;
  settings.keys.kb2 = clone(name === 'compact' ? KB_PRESETS.kb2compact : KB_PRESETS.kb2);
  save();
}
