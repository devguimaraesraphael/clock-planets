import { BODY_ORDER, BODY_META, SIGNS, ROMAN, rev } from './ephemeris.js';
import { interpretMoment, personalReadings } from './interpretations.js';

function formatDeg(d) {
  const dd = Math.floor(d);
  const mm = Math.round((d - dd) * 60);
  return `${dd}°${String(mm).padStart(2, '0')}'`;
}

export function renderLedger(tbody, sky) {
  tbody.innerHTML = BODY_ORDER.map((name) => {
    const b = sky.bodies[name];
    const meta = BODY_META[name];
    const sign = SIGNS[b.signIdx];
    const above = b.alt >= 0;
    return `<tr>
      <td><span class="glyph">${meta.glyph}</span>${meta.label}</td>
      <td><span class="glyph">${sign[0]}</span>${sign[1]} ${formatDeg(b.degInSign)}</td>
      <td>Casa ${ROMAN[b.house - 1]}</td>
      <td>${above ? '+' : ''}${b.alt.toFixed(1)}&deg;</td>
      <td><span class="pill ${above ? 'up' : 'down'}">${above ? 'Acima do horizonte' : 'Abaixo do horizonte'}</span></td>
    </tr>`;
  }).join('');
}

export function renderInterpretation(el, sky) {
  const { readings, aspects, synthesis, dominantArea, ruler, moon } = interpretMoment(sky);
  const rows = readings
    .map((r) => {
      const tags = [r.dignity ? r.dignity : null, r.retro ? 'retrógrado' : null].filter(Boolean);
      const tagStr = tags.length ? ` <span class="interp-tag">${tags.join(' · ')}</span>` : '';
      return `<li><span class="glyph">${BODY_META[r.planet].glyph}</span><b>${BODY_META[r.planet].label}</b>${tagStr} — ${r.text}</li>`;
    })
    .join('');
  const aspectRows = aspects.length
    ? `<ul class="interp-conj">${aspects.slice(0, 8).map((a) => `<li>${a.text}</li>`).join('')}</ul>`
    : '<p class="interp-empty">Nenhum aspecto maior ativo neste instante — céu comparativamente silencioso.</p>';
  el.innerHTML = `
    <p class="interp-headline">${synthesis}</p>
    <p class="interp-area">Área da vida em foco agora: <b>${dominantArea.label}</b></p>
    <div class="interp-highlights">
      <p><span class="glyph">${BODY_META[ruler.planet].glyph}</span><b>Regente do momento</b> — ${ruler.text}</p>
      <p><b>${moon.label}</b> — ${moon.text}</p>
    </div>
    <h3>Aspectos ativos</h3>
    ${aspectRows}
    <h3>Leitura por corpo</h3>
    <ul class="interp-list">${rows}</ul>
  `;
}

export function renderPersonal(el, sky, userSunSignIdx, userAscSignIdx) {
  if (userSunSignIdx == null || userAscSignIdx == null) {
    el.innerHTML = `
      <p class="interp-empty">
        Escolha seu Signo Solar e seu Ascendente ali em cima pra ver como o céu de agora
        cruza com o seu mapa — em que casa sua cada planeta tá passando, e quem tá tocando
        seu Sol ou seu Ascendente por aspecto.
      </p>`;
    return;
  }

  const { byHouse, toSun, toAsc, headline } = personalReadings(sky, userSunSignIdx, userAscSignIdx);
  const sunLabel = SIGNS[userSunSignIdx];
  const ascLabel = SIGNS[userAscSignIdx];

  const houseRows = byHouse.map((r) => {
    const tag = r.retro ? ' <span class="interp-tag">retrógrado</span>' : '';
    return `<li><span class="glyph">${BODY_META[r.planet].glyph}</span><b>${BODY_META[r.planet].label}</b>${tag} passando pela sua Casa ${ROMAN[r.house - 1]} — ${r.text}</li>`;
  }).join('');

  const pointRows = (list) => list.length
    ? `<ul class="interp-conj">${list.map((a) => `<li>${a.text}</li>`).join('')}</ul>`
    : '<p class="interp-empty">Nenhum planeta em aspecto exato agora.</p>';

  el.innerHTML = `
    <p class="interp-headline">${headline}</p>
    <p class="interp-area">
      Seu mapa: <b><span class="glyph">${sunLabel[0]}</span>${sunLabel[1]}</b> de Sol,
      Ascendente em <b><span class="glyph">${ascLabel[0]}</span>${ascLabel[1]}</b>
      <span class="interp-tag">graus aproximados</span>
    </p>
    <h3>Trânsitos no seu Sol natal</h3>
    ${pointRows(toSun)}
    <h3>Trânsitos no seu Ascendente</h3>
    ${pointRows(toAsc)}
    <h3>Planetas em trânsito pelas suas casas</h3>
    <ul class="interp-list">${houseRows}</ul>
  `;
}

export function renderStatus(el, date, sky, locLabel) {
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const ascSign = SIGNS[Math.floor(rev(sky.asc) / 30)];
  el.innerHTML = `
    <span class="date"><b>${dateStr}</b> &middot; ${timeStr}</span>
    <span>Local: <b>${locLabel}</b></span>
    <span>Ascendente: <b>${ascSign[0]} ${ascSign[1]} ${formatDeg(rev(sky.asc) % 30)}</b></span>
  `;
}
