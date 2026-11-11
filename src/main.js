// TEAM FIGHTERS — ponto de entrada: canvas responsivo, laço de jogo a 60 Hz e registro das cenas.
import { W, H, COL } from './core/config.js';
import { Input } from './core/input.js';
import { Audio } from './core/audio.js';
import { Game } from './core/game.js';
import boot from './scenes/boot.js';
import title from './scenes/title.js';
import select from './scenes/select.js';
import stage from './scenes/stage.js';
import fight from './scenes/fight.js';
import victory from './scenes/victory.js';
import tourney from './scenes/tourney.js';
import settingsScene from './scenes/settings.js';
import controls from './scenes/controls.js';
import credits from './scenes/credits.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function fatal(err) {
  const el = document.getElementById('fatal');
  el.hidden = false;
  el.textContent = 'TEAM FIGHTERS encontrou um erro e precisou parar.\n\n' + (err && err.stack ? err.stack : String(err)) + '\n\nRecarregue a página (F5) para tentar de novo.';
  console.error(err);
}

function resize() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  const cw = Math.max(320, Math.floor(W * s)), ch = Math.floor(cw * H / W);
  canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bw = Math.max(640, Math.min(1920, Math.round(cw * dpr)));
  if (canvas.width !== bw) { canvas.width = bw; canvas.height = Math.round(bw * H / W); }
}
window.addEventListener('resize', resize);
document.addEventListener('fullscreenchange', resize);
resize();

Input.init(canvas);
const unlock = () => Audio.init();
window.addEventListener('keydown', unlock);
window.addEventListener('mousedown', unlock);
window.addEventListener('touchstart', unlock);
window.addEventListener('keydown', (e) => { if (e.code === 'KeyF' && !Input.capturing && !e.repeat) Game.toggleFullscreen(); });

for (const [name, sc] of Object.entries({ boot, title, select, stage, fight, victory, tourney, settings: settingsScene, controls, credits })) Game.register(name, sc);
Game.canvas = canvas;
Game.go('boot', {}, true);

const STEP = 1000 / 60;
let last = performance.now(), acc = 0, dead = false;

function frame(now) {
  if (dead) return;
  requestAnimationFrame(frame);
  try {
    acc += Math.min(100, now - last); last = now;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      if (steps === 0) {
        Input.update();
        for (const ev of Input.padEvents) {
          if (ev.type === 'on') Game.toast(`🎮 Controle ${ev.slot + 1} conectado: ${ev.name}`, COL.cyan);
          else Game.toast(`🎮 Controle ${ev.slot + 1} desconectado`, COL.red);
          if (Game.scene && Game.scene.onPad) Game.scene.onPad(ev);
        }
        Input.padEvents.length = 0;
        if (Game.trans) { Input.menu.length = 0; Input.mouse.click = false; }
      } else { Input.menu.length = 0; Input.mouse.click = false; Input.anyPressed = false; }
      Game.update();
      acc -= STEP; steps++;
    }
    if (steps >= 5) acc = 0;
    const k = canvas.width / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    Game.draw(ctx);
  } catch (err) { dead = true; fatal(err); }
}
requestAnimationFrame(frame);
window.addEventListener('error', (e) => { if (!dead && e.error) { /* erros fora do laço são só registrados */ console.error(e.error); } });

// Exposto para depuração e testes automatizados.
window.TF = { Game, Input, Audio };
