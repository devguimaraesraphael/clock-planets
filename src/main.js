import './style.css';
import { computeSky, SIGNS } from './ephemeris.js';
import { renderLedger, renderStatus, renderInterpretation, renderPersonal } from './ledger.js';
import { createAstrolabeCanvas2D } from './canvas2d.js';

const wheelEl = document.getElementById('wheel');
const ledgerBody = document.getElementById('ledgerBody');
const statusLine = document.getElementById('statusLine');
const interpretationEl = document.getElementById('interpretation');
const personalEl = document.getElementById('personal');
const userSunSelect = document.getElementById('userSunSign');
const userAscSelect = document.getElementById('userAscSign');

const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const astrolabe = await createAstrolabeCanvas2D(wheelEl, isDark);

// --- signo solar / ascendente do usuário (persistidos localmente) --------

for (const select of [userSunSelect, userAscSelect]) {
  SIGNS.forEach(([glyph, name], idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = `${glyph} ${name}`;
    select.appendChild(opt);
  });
}

const STORAGE_KEY = 'astrolabio.userChart';
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  if (saved.sunSignIdx != null) userSunSelect.value = String(saved.sunSignIdx);
  if (saved.ascSignIdx != null) userAscSelect.value = String(saved.ascSignIdx);
} catch { /* localStorage indisponível ou dado corrompido — segue com selects vazios */ }

function userChart() {
  const sunSignIdx = userSunSelect.value === '' ? null : Number(userSunSelect.value);
  const ascSignIdx = userAscSelect.value === '' ? null : Number(userAscSelect.value);
  return { sunSignIdx, ascSignIdx };
}

for (const select of [userSunSelect, userAscSelect]) {
  select.addEventListener('change', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userChart()));
    tick();
  });
}

let observer = { lat: -23.5505, lon: -46.6333, label: 'São Paulo, BR (padrão)' };

function tick() {
  const now = new Date();
  const sky = computeSky(now, observer.lat, observer.lon);
  astrolabe.update(sky);
  renderLedger(ledgerBody, sky);
  renderStatus(statusLine, now, sky, observer.label);
  renderInterpretation(interpretationEl, sky);
  const { sunSignIdx, ascSignIdx } = userChart();
  renderPersonal(personalEl, sky, sunSignIdx, ascSignIdx);
}

function start() {
  tick();
  setInterval(tick, 2000);
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      observer = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        label: `${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`,
      };
      start();
    },
    () => start(),
    { timeout: 4000 },
  );
} else {
  start();
}
