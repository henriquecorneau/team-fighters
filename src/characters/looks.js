// Aparências dos lutadores, derivadas das fotografias de referência (cabelo, óculos, barba, roupas e porte).
// Cada personagem em characters/*.js aponta para uma destas chaves (campo `photo`).
// Para trocar qual foto pertence a qual personagem, basta mudar essa chave em characters/index.js (PHOTO_OF).
import { prepLook } from '../render/rig.js';

export const LOOKS = {
  // Foto 1 — camiseta lilás com estampa de folhas, jeans escuro, óculos pretos, franja escura.
  foto1: { skin: '#f1c9a7', hair: '#33282a', hairStyle: 'fringe', glasses: 'rect', beard: 'none', shirt: '#6c70b8', print: 'leaf', pants: '#20335f', shoes: '#17171d', sole: '#17171d', build: 1.0 },
  // Foto 2 — camiseta azul-marinho ZUNE, jeans claro, cabelo raspado, bigode/cavanhaque ralos.
  foto2: { skin: '#d9a273', hair: '#2e221b', hairStyle: 'buzz', glasses: null, beard: 'stubble', shirt: '#182746', print: 'zune', pants: '#a7bdd5', fade: '#cbdbeb', shoes: '#16161b', sole: '#16161b', build: 1.12, belly: 1 },
  // Foto 3 — camiseta preta, calça cáqui, cabelo ondulado, barba cheia, óculos aviador, relógio e fones.
  foto3: { skin: '#d8a67d', hair: '#322a2e', hairStyle: 'wavy', glasses: 'aviator', beard: 'full', shirt: '#243650', print: 'necklace', pants: '#cbb68b', shoes: '#1a1c25', sole: '#f2f2f2', build: 1.12, belly: 1, watch: true, earphone: true },
  // Foto 5 — camisa social azul, calça cinza-cáqui, crachá laranja, óculos finos, barba curta, topete cacheado.
  foto5: { skin: '#e1b18b', hair: '#30251f', hairStyle: 'curlytop', glasses: 'thin', beard: 'short', shirt: '#21427f', sleeve: 'long', print: 'badge', pants: '#bcb5a7', shoes: '#131317', sole: '#131317', build: 0.95, smile: true },
  // Foto 6 — camiseta azul-clara com braço robótico, jeans, óculos de aro escuro, bigode, sorriso.
  foto6: { skin: '#e3ad85', hair: '#2f241f', hairStyle: 'short', glasses: 'darkrim', beard: 'mustache', shirt: '#8fc5ea', print: 'robotarm', pants: '#5d8dc2', fade: '#8fb6de', shoes: '#1d2131', sole: '#eeeeee', build: 1.0, smile: true },
  // Peidin — polo preta, calça preta, óculos de aro fino, bigode, franja de lado, corrente com pingente e relógio.
  peidin: { skin: '#dba67e', hair: '#30241f', hairStyle: 'fringe', glasses: 'thin', beard: 'mustache', shirt: '#3a3a42', print: 'polo', pants: '#1f2538', shoes: '#15151a', sole: '#15151a', build: 0.94, watch: true },
};

// Monta o visual final: aparência da foto + equipamento de luta do personagem.
export function buildLook(photo, extra) {
  return prepLook({ ...LOOKS[photo], ...extra });
}
