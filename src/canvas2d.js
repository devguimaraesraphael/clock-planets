// Astrolábio desenhado inteiramente com formas vetoriais (canvas 2D puro —
// sem imagens/assets). Roda um loop de animação próprio (requestAnimationFrame)
// para o ponteiro de segundos, as engrenagens (algumas em rotação contínua,
// outras batendo tic-tac como um escapamento de relógio) e o brilho dos
// ponteiros ao passar o mouse — independente do tick de 2s que atualiza as
// posições astronômicas.

import { BODY_ORDER, BODY_META, SIGNS, ROMAN } from './ephemeris.js';
import { rawPlanetHouseText } from './interpretations.js';

const PLANET_COLORS = {
  sun: '#f5a623', moon: '#8fa3bf', mercury: '#7a8fa6', venus: '#e0509c',
  mars: '#d8331f', jupiter: '#c8631f', saturn: '#6b5228', uranus: '#26b8c4',
  neptune: '#3357c4', pluto: '#8c3fd4',
};

const SECOND_HAND_COLOR = '#ef4b3d';

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// onda triangular (-1..1) — movimento linear de ida e volta, mais "mecânico"
// que uma senoide, para o balanço tipo tic-tac de um escapamento.
function triangle(t) {
  return 2 * Math.abs(2 * (t - Math.floor(t + 0.5))) - 1;
}

export function createAstrolabeCanvas2D(container, isDark) {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const colors = {
    panel: cssVar('--panel') || (isDark ? '#1c140d' : '#f4ead0'),
    ink: cssVar('--ink') || (isDark ? '#ecdfc2' : '#241a12'),
    inkDim: cssVar('--ink-dim') || (isDark ? '#b7a583' : '#5c4c37'),
    brass: cssVar('--brass') || '#8a5a1e',
    brassLight: cssVar('--brass-light') || '#e8bd6f',
    brassLine: cssVar('--brass-line') || '#c9a765',
    verdigris: cssVar('--verdigris') || '#3f6d5c',
    mystic: cssVar('--mystic') || '#6a4a8a',
    bg: cssVar('--bg') || (isDark ? '#150f0a' : '#ece1c4'),
  };

  function resize() {
    const size = Math.max(1, Math.min(container.clientWidth, container.clientHeight));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  function polar(r, angleDeg) {
    const a = (angleDeg - 90) * (Math.PI / 180);
    return [r * Math.cos(a), r * Math.sin(a)];
  }

  // --- mouse: acompanha a posição relativa ao centro do disco, em pixels
  // do backing store (mesmo sistema de coordenadas usado no desenho) -------
  let mouse = null; // {x, y} relativo ao centro, ou null se fora
  let hovered = null;
  let prevHovered = null;
  const tipPositions = {}; // preenchido a cada frame por drawPointer

  // --- tooltip: nome do planeta, casa e a leitura crua daquela combinação --
  const tooltip = document.createElement('div');
  tooltip.className = 'astro-tooltip';
  document.body.appendChild(tooltip);

  function positionTooltip(clientX, clientY) {
    const margin = 16;
    const w = tooltip.offsetWidth || 220;
    const h = tooltip.offsetHeight || 60;
    let left = clientX + margin;
    let top = clientY + margin;
    if (left + w > window.innerWidth - 8) left = clientX - w - margin;
    if (top + h > window.innerHeight - 8) top = clientY - h - margin;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function showTooltip(name, sky, clientX, clientY) {
    const meta = BODY_META[name];
    const houseNum = sky.bodies[name].house;
    const raw = rawPlanetHouseText(name, houseNum);
    tooltip.innerHTML = `<strong>${meta.glyph} ${meta.label}</strong>`
      + `<span class="astro-tooltip-house">Casa ${ROMAN[houseNum - 1]}</span>`
      + `<p>${raw}</p>`;
    tooltip.classList.add('visible');
    positionTooltip(clientX, clientY);
  }

  function hideTooltip() {
    tooltip.classList.remove('visible');
  }

  let lastClient = { x: 0, y: 0 };
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    mouse = {
      x: (e.clientX - rect.left) * scale - canvas.width / 2,
      y: (e.clientY - rect.top) * scale - canvas.height / 2,
    };
    lastClient = { x: e.clientX, y: e.clientY };
    if (hovered) positionTooltip(e.clientX, e.clientY);
  });
  canvas.addEventListener('mouseleave', () => { mouse = null; });

  function updateHoverHitTest(R, sky) {
    hovered = null;
    if (mouse) {
      const hitR = R * 0.075;
      let best = null, bestDist = hitR;
      for (const name of BODY_ORDER) {
        const p = tipPositions[name];
        if (!p) continue;
        const d = Math.hypot(mouse.x - p.x, mouse.y - p.y);
        if (d < bestDist) { bestDist = d; best = name; }
      }
      hovered = best;
    }
    canvas.style.cursor = hovered ? 'pointer' : 'default';
    if (hovered !== prevHovered) {
      if (hovered) showTooltip(hovered, sky, lastClient.x, lastClient.y);
      else hideTooltip();
      prevHovered = hovered;
    }
  }

  // --- engrenagem genérica (silhueta com dentes + furo central) -----------
  function gearPath(radius, teeth, depth) {
    const path = new Path2D();
    const step = (Math.PI * 2) / (teeth * 2);
    for (let i = 0; i <= teeth * 2; i++) {
      const r = i % 2 === 0 ? radius : radius - depth;
      const a = i * step;
      const x = r * Math.cos(a), y = r * Math.sin(a);
      if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
    }
    path.closePath();
    return path;
  }

  function drawGear(cx, cy, radius, teeth, depth, rot, opacity, holeRatio) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = opacity;
    const grad = ctx.createRadialGradient(-radius * 0.25, -radius * 0.25, radius * 0.15, 0, 0, radius);
    grad.addColorStop(0, colors.brassLight);
    grad.addColorStop(0.6, colors.brass);
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fill(gearPath(radius, teeth, depth));
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius * holeRatio, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGears(t, R) {
    const configs = [
      // grande: rotação contínua, bem lenta e discreta
      { r: R * 0.94, teeth: 40, depth: R * 0.028, mode: 'spin', speed: 0.015, cx: 0, cy: 0, base: 0.10, pulse: 0.03, pf: 0.25, phase: 0, hole: 0.9 },
      // média: a única com tic-tac — balanço curto e pausado, tipo escapamento
      { r: R * 0.70, teeth: 26, depth: R * 0.038, mode: 'tictac', amp: 3.5, freq: 0.45, cx: R * 0.03, cy: -R * 0.05, base: 0.13, pulse: 0.04, pf: 0.3, phase: 1.4, hole: 0.55 },
      // pequena: parada, só respira (pulso de opacidade), sem girar
      { r: R * 0.46, teeth: 18, depth: R * 0.05, mode: 'still', cx: -R * 0.05, cy: R * 0.04, base: 0.13, pulse: 0.04, pf: 0.35, phase: 2.6, hole: 0.5 },
    ];
    for (const g of configs) {
      const pulse = Math.sin(t * g.pf + g.phase) * 0.5 + 0.5;
      const opacity = g.base + g.pulse * pulse;
      const rot = g.mode === 'spin' ? t * g.speed
        : g.mode === 'tictac' ? (g.amp * Math.PI / 180) * triangle(t * g.freq)
        : 0;
      drawGear(g.cx, g.cy, g.r, g.teeth, g.depth, rot, opacity, g.hole);
    }
  }

  // --- mostrador -------------------------------------------------------

  function drawDialFace(R) {
    const grad = ctx.createRadialGradient(-R * 0.15, -R * 0.2, R * 0.1, 0, 0, R);
    grad.addColorStop(0, colors.panel);
    grad.addColorStop(0.8, colors.panel);
    grad.addColorStop(1, colors.bg);
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function drawVignette(R) {
    ctx.save();
    const grad = ctx.createRadialGradient(0, 0, R * 0.55, 0, 0, R);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, isDark ? 'rgba(0,0,0,0.55)' : 'rgba(30,18,8,0.35)');
    ctx.globalCompositeOperation = 'multiply';
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
    ctx.restore();

    // brilho superior-esquerdo, como luz incidindo sobre vidro/metal
    ctx.save();
    const sheen = ctx.createRadialGradient(-R * 0.35, -R * 0.45, 0, -R * 0.35, -R * 0.45, R * 0.9);
    sheen.addColorStop(0, isDark ? 'rgba(255,240,210,0.10)' : 'rgba(255,250,230,0.35)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = sheen; ctx.fill();
    ctx.restore();
  }

  function drawBezel(R) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = R * 0.03;
    ctx.shadowOffsetY = R * 0.012;
    ctx.lineWidth = R * 0.05;
    // metade clara (luz vindo de cima-esquerda) e metade escura, para dar
    // volume metálico ao aro em vez de um tom brasso plano.
    ctx.strokeStyle = colors.brassLight;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.975, (-150) * Math.PI / 180, (30) * Math.PI / 180); ctx.stroke();
    ctx.strokeStyle = colors.brass;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.975, (30) * Math.PI / 180, (210) * Math.PI / 180); ctx.stroke();
    ctx.shadowColor = 'transparent';

    ctx.lineWidth = R * 0.006;
    ctx.strokeStyle = colors.brassLine;
    ctx.beginPath(); ctx.arc(0, 0, R * 1.0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.95, 0, Math.PI * 2); ctx.stroke();

    for (let i = 0; i < 60; i++) {
      const deg = i * 6;
      const major = i % 5 === 0;
      const [ox, oy] = polar(R * 0.95, deg);
      const [ix, iy] = polar(major ? R * 0.90 : R * 0.925, deg);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ix, iy);
      ctx.strokeStyle = major ? colors.brassLight : colors.brassLine;
      ctx.lineWidth = major ? R * 0.008 : R * 0.003;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawZodiacBand(R, rotOffset) {
    const rOuter = R * 0.88, rInner = R * 0.72;
    for (let s = 0; s < 12; s++) {
      const a0 = s * 30 + rotOffset, a1 = a0 + 30;
      ctx.beginPath();
      ctx.arc(0, 0, rOuter, (a0 - 90) * Math.PI / 180, (a1 - 90) * Math.PI / 180);
      ctx.arc(0, 0, rInner, (a1 - 90) * Math.PI / 180, (a0 - 90) * Math.PI / 180, true);
      ctx.closePath();
      ctx.fillStyle = s % 2 === 0
        ? (isDark ? 'rgba(217,190,140,0.12)' : 'rgba(36,26,18,0.09)')
        : 'rgba(0,0,0,0)';
      ctx.fill();
      ctx.strokeStyle = colors.brassLine;
      ctx.lineWidth = R * 0.003;
      ctx.stroke();

      const [gx, gy] = polar((rOuter + rInner) / 2, a0 + 15);
      ctx.save();
      ctx.translate(gx, gy);
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = R * 0.006;
      ctx.fillStyle = colors.brassLight;
      ctx.font = (R * 0.075) + 'px "EB Garamond", Georgia, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(SIGNS[s][0], 0, 0);
      ctx.restore();
    }
  }

  function drawDegreeBand(R, rotOffset) {
    const r = R * 0.70;
    ctx.save();
    ctx.strokeStyle = colors.brassLine;
    ctx.lineWidth = R * 0.003;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    for (let deg0 = 0; deg0 < 360; deg0 += 10) {
      const deg = deg0 + rotOffset;
      const major = deg0 % 30 === 0;
      const [ox, oy] = polar(r, deg);
      const [ix, iy] = polar(major ? r * 0.94 : r * 0.965, deg);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ix, iy);
      ctx.lineWidth = major ? R * 0.005 : R * 0.0022;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Casas e eixo ASC-DESC ficam em posição FIXA na tela (como num mapa
  // astrológico tradicional): é a faixa do zodíaco/os planetas que giram
  // por baixo deles conforme o Ascendente muda, não o contrário. A casa I
  // começa sempre à esquerda (270°), com o horizonte sempre na horizontal.
  const HOUSE_BASE_ANGLE = 270;

  function drawHouseSpokes(R) {
    ctx.save();
    for (let h = 0; h < 12; h++) {
      const deg = h * 30 + HOUSE_BASE_ANGLE;
      const [ox, oy] = polar(R * 0.68, deg);
      const [ix, iy] = polar(R * 0.20, deg);
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ix, iy);
      ctx.strokeStyle = isDark ? 'rgba(217,190,140,0.32)' : 'rgba(36,26,18,0.3)';
      ctx.lineWidth = R * 0.0018;
      ctx.stroke();
      const [lx, ly] = polar(R * 0.63, deg + 13);
      ctx.save(); ctx.translate(lx, ly);
      ctx.fillStyle = colors.inkDim;
      ctx.font = (R * 0.045) + 'px ui-monospace, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ROMAN[h], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawHorizon(R) {
    const ascA = HOUSE_BASE_ANGLE, descA = HOUSE_BASE_ANGLE + 180;
    const [ax, ay] = polar(R * 0.965, ascA);
    const [dx, dy] = polar(R * 0.965, descA);
    ctx.save();
    ctx.strokeStyle = colors.mystic;
    ctx.lineWidth = R * 0.0035;
    ctx.shadowColor = colors.mystic;
    ctx.shadowBlur = R * 0.025;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(dx, dy); ctx.stroke();
    ctx.restore();
    [['ASC', ascA], ['DESC', descA]].forEach(([label, angle]) => {
      const [lx, ly] = polar(R * 1.03, angle);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.fillStyle = colors.mystic;
      ctx.font = 'bold ' + (R * 0.04) + 'px ui-monospace, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    });
  }

  // Halo de luz pulsante ao redor do Sol — nenhum outro planeta emite isso,
  // é o próprio Sol "iluminando" o mostrador.
  function drawSunGlow(lon, t, R) {
    const tipRadius = R * (0.16 + BODY_META.sun.radiusFrac * 0.52);
    const [x, y] = polar(tipRadius, lon);
    const pulse = Math.sin(t * 1.3) * 0.5 + 0.5;
    const glowR = R * (0.15 + pulse * 0.045);
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    g.addColorStop(0, 'rgba(255,214,120,0.55)');
    g.addColorStop(0.45, 'rgba(255,178,60,0.22)');
    g.addColorStop(1, 'rgba(255,178,60,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPointer(name, lon, above, R) {
    const meta = BODY_META[name];
    const color = PLANET_COLORS[name];
    const tipRadius = R * (0.16 + meta.radiusFrac * 0.52);
    const isHovered = hovered === name;

    tipPositions[name] = { x: polar(tipRadius, lon)[0], y: polar(tipRadius, lon)[1] };

    ctx.save();
    ctx.rotate(lon * Math.PI / 180);

    // haste — mais grossa e com sombra própria quando em destaque; tracejada
    // quando o planeta está abaixo do horizonte (única diferença entre os
    // dois estados — o brilho da ponta é sempre o mesmo, acima ou abaixo).
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -tipRadius);
    const grad = ctx.createLinearGradient(0, 0, 0, -tipRadius);
    grad.addColorStop(0, colors.brassLine);
    grad.addColorStop(1, color);
    ctx.strokeStyle = grad;
    if (!above) ctx.setLineDash([R * 0.012, R * 0.01]);
    if (isHovered) {
      ctx.shadowColor = color;
      ctx.shadowBlur = R * 0.015;
    }
    ctx.lineWidth = isHovered ? R * 0.009 : R * 0.006;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // ponta luminosa com glifo — acende ao passar o mouse
    ctx.translate(0, -tipRadius);
    ctx.rotate(-lon * Math.PI / 180);
    const tipR = R * (isHovered ? 0.058 : 0.042);
    ctx.shadowColor = color;
    ctx.shadowBlur = isHovered ? R * 0.11 : R * 0.05;
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(0, 0, tipR * 1.7, 0, Math.PI * 2);
      ctx.fillStyle = `${color}33`;
      ctx.fill();
    }
    // respaldo escuro atrás da ponta — garante contraste mesmo para
    // planetas de cor clara (Lua, Mercúrio) contra o mostrador claro.
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, tipR * 1.16, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(35,22,8,0.45)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, tipR, 0, Math.PI * 2);
    const dotGrad = ctx.createRadialGradient(-tipR * 0.3, -tipR * 0.3, 0, 0, 0, tipR);
    dotGrad.addColorStop(0, '#ffffff');
    dotGrad.addColorStop(0.35, color);
    dotGrad.addColorStop(1, color);
    ctx.fillStyle = dotGrad;
    ctx.fill();
    ctx.lineWidth = R * 0.004;
    ctx.strokeStyle = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.4)';
    ctx.stroke();

    ctx.font = 'bold ' + (R * (isHovered ? 0.062 : 0.05)) + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = R * 0.006;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeText(meta.glyph, 0, R * 0.002);
    ctx.fillStyle = '#fff8e8';
    ctx.fillText(meta.glyph, 0, R * 0.002);
    ctx.restore();
  }

  function drawHub(t, R) {
    const pulse = Math.sin(t * 1.1) * 0.5 + 0.5;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = R * 0.025;
    ctx.shadowOffsetY = R * 0.01;
    const rimGrad = ctx.createRadialGradient(-R * 0.05, -R * 0.05, R * 0.02, 0, 0, R * 0.155);
    rimGrad.addColorStop(0, colors.brassLight);
    rimGrad.addColorStop(0.7, colors.brass);
    rimGrad.addColorStop(1, '#000000');
    ctx.beginPath(); ctx.arc(0, 0, R * 0.155, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = R * 0.006;
    ctx.strokeStyle = colors.brassLine;
    ctx.stroke();

    ctx.rotate(t * 0.3);
    ctx.fillStyle = colors.brassLight;
    ctx.fill(gearPath(R * 0.13, 12, R * 0.018));
    ctx.rotate(-t * 0.3);

    // brilho especular fixo (efeito de metal polido)
    ctx.beginPath();
    ctx.ellipse(-R * 0.05, -R * 0.06, R * 0.045, R * 0.02, -0.6, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? 'rgba(255,240,210,0.35)' : 'rgba(255,255,255,0.55)';
    ctx.fill();

    ctx.shadowColor = colors.mystic;
    ctx.shadowBlur = R * (0.05 + pulse * 0.07);
    ctx.beginPath(); ctx.arc(0, 0, R * (0.05 + pulse * 0.008), 0, Math.PI * 2);
    ctx.fillStyle = colors.mystic;
    ctx.fill();
    ctx.restore();
  }

  function drawSecondsHand(R) {
    const now = new Date();
    const secExact = now.getSeconds() + now.getMilliseconds() / 1000;
    const deg = secExact * 6;

    ctx.save();
    ctx.rotate(deg * Math.PI / 180);
    ctx.lineCap = 'round';
    ctx.strokeStyle = SECOND_HAND_COLOR;
    ctx.shadowColor = SECOND_HAND_COLOR;
    ctx.shadowBlur = R * 0.035;
    ctx.lineWidth = R * 0.007;
    ctx.beginPath();
    ctx.moveTo(0, R * 0.13);
    ctx.lineTo(0, -R * 0.82);
    ctx.stroke();
    // ponta — jóia com halo, gradiente e brilho, em vez de uma bolinha lisa
    ctx.translate(0, -R * 0.82);
    const tipR = R * 0.017;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, tipR * 2.1, 0, Math.PI * 2);
    ctx.fillStyle = `${SECOND_HAND_COLOR}2e`;
    ctx.fill();

    ctx.shadowColor = SECOND_HAND_COLOR;
    ctx.shadowBlur = R * 0.045;
    ctx.beginPath();
    ctx.arc(0, 0, tipR, 0, Math.PI * 2);
    const tipGrad = ctx.createRadialGradient(-tipR * 0.35, -tipR * 0.35, 0, 0, 0, tipR);
    tipGrad.addColorStop(0, '#ffffff');
    tipGrad.addColorStop(0.4, SECOND_HAND_COLOR);
    tipGrad.addColorStop(1, '#8a2318');
    ctx.fillStyle = tipGrad;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = R * 0.003;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.stroke();
    ctx.restore();

    // pivô central — desenhado por cima, sem rotação, pra ancorar o
    // ponteiro visivelmente no centro exato do mostrador.
    ctx.save();
    const pivotR = R * 0.024;
    const pivotGrad = ctx.createRadialGradient(-pivotR * 0.3, -pivotR * 0.3, 0, 0, 0, pivotR);
    pivotGrad.addColorStop(0, '#fff2ee');
    pivotGrad.addColorStop(0.55, SECOND_HAND_COLOR);
    pivotGrad.addColorStop(1, '#6b1e14');
    ctx.beginPath(); ctx.arc(0, 0, pivotR, 0, Math.PI * 2);
    ctx.fillStyle = pivotGrad;
    ctx.fill();
    ctx.lineWidth = R * 0.003;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
    ctx.restore();
  }

  let lastSky = null;
  let rafId = null;
  const startTime = performance.now();

  function draw() {
    if (!lastSky) return;
    const sky = lastSky;
    const t = (performance.now() - startTime) / 1000;
    const W = canvas.width, CX = W / 2, CY = W / 2, R = W * 0.485;

    updateHoverHitTest(R, sky);

    ctx.clearRect(0, 0, W, W);
    ctx.save();
    ctx.translate(CX, CY);

    drawDialFace(R);
    drawGears(t, R);
    drawBezel(R);

    // faixa do zodíaco e planetas giram conforme o Ascendente; casas e
    // horizonte (desenhados depois) ficam fixos na tela.
    const rotOffset = HOUSE_BASE_ANGLE - sky.asc;
    drawZodiacBand(R, rotOffset);
    drawDegreeBand(R, rotOffset);

    drawSunGlow(sky.bodies.sun.lon + rotOffset, t, R);

    BODY_ORDER.forEach((name) => {
      const b = sky.bodies[name];
      drawPointer(name, b.lon + rotOffset, b.alt >= 0, R);
    });

    drawHouseSpokes(R);
    drawHorizon(R);

    drawHub(t, R);
    drawSecondsHand(R);
    drawVignette(R);

    ctx.restore();
  }

  function frame() {
    draw();
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  function update(sky) {
    lastSky = sky;
  }

  function dispose() {
    if (rafId) cancelAnimationFrame(rafId);
    ro.disconnect();
    tooltip.remove();
  }

  return { update, dispose };
}
