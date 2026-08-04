// Low-precision geocentric ephemeris (Paul Schlyter / JPL osculating Keplerian
// elements, epoch 2000). Accurate to a few arcminutes for the planets and
// roughly 1 degree for the Moon — enough for a mechanical/astrological display.

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

const sind = (x) => Math.sin(x * D2R);
const cosd = (x) => Math.cos(x * D2R);
const tand = (x) => Math.tan(x * D2R);
const atan2d = (y, x) => Math.atan2(y, x) * R2D;
const asind = (x) => Math.asin(Math.max(-1, Math.min(1, x))) * R2D;
export const rev = (x) => x - Math.floor(x / 360) * 360;

const EPOCH_MS = Date.UTC(1999, 11, 31, 0, 0, 0);

export const BODY_ORDER = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

export const BODY_META = {
  sun:     { label: 'Sol',      glyph: '☉', radiusFrac: 0.30 },
  moon:    { label: 'Lua',      glyph: '☽', radiusFrac: 0.37 },
  mercury: { label: 'Mercúrio', glyph: '☿', radiusFrac: 0.44 },
  venus:   { label: 'Vênus',    glyph: '♀', radiusFrac: 0.51 },
  mars:    { label: 'Marte',    glyph: '♂', radiusFrac: 0.58 },
  jupiter: { label: 'Júpiter',  glyph: '♃', radiusFrac: 0.65 },
  saturn:  { label: 'Saturno',  glyph: '♄', radiusFrac: 0.72 },
  uranus:  { label: 'Urano',    glyph: '♅', radiusFrac: 0.79 },
  neptune: { label: 'Neptuno',  glyph: '♆', radiusFrac: 0.86 },
  pluto:   { label: 'Plutão',   glyph: '♇', radiusFrac: 0.93 },
};

export const SIGNS = [
  ['♈', 'Áries'], ['♉', 'Touro'], ['♊', 'Gêmeos'], ['♋', 'Câncer'],
  ['♌', 'Leão'], ['♍', 'Virgem'], ['♎', 'Libra'], ['♏', 'Escorpião'],
  ['♐', 'Sagitário'], ['♑', 'Capricórnio'], ['♒', 'Aquário'], ['♓', 'Peixes'],
];

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function solveKepler(M, e) {
  let E = M + e * R2D * sind(M) * (1 + e * cosd(M));
  for (let i = 0; i < 8; i++) {
    const dE = (E - e * R2D * sind(E) - M) / (1 - e * cosd(E));
    E -= dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

// heliocentric (or geocentric for the Moon) rectangular ecliptic coordinates
function orbitToXYZ(N, i, w, a, e, M) {
  const E = solveKepler(M, e);
  const xv = a * (cosd(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * sind(E));
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const vw = v + w;
  const xh = r * (cosd(N) * cosd(vw) - sind(N) * sind(vw) * cosd(i));
  const yh = r * (sind(N) * cosd(vw) + cosd(N) * sind(vw) * cosd(i));
  const zh = r * (sind(vw) * sind(i));
  return { x: xh, y: yh, z: zh, r };
}

function elementsAt(d) {
  return {
    sun:     { N: 0,                           i: 0,                     w: rev(282.9404 + 4.70935e-5 * d),  a: 1.000000, e: 0.016709 - 1.151e-9 * d, M: rev(356.0470 + 0.9856002585 * d) },
    mercury: { N: rev(48.3313 + 3.24587e-5 * d), i: 7.0047 + 5.00e-8 * d,  w: rev(29.1241 + 1.01444e-5 * d),   a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: rev(168.6562 + 4.0923344368 * d) },
    venus:   { N: rev(76.6799 + 2.46590e-5 * d), i: 3.3946 + 2.75e-8 * d,  w: rev(54.8910 + 1.38374e-5 * d),   a: 0.723330, e: 0.006773 - 1.302e-9 * d, M: rev(48.0052 + 1.6021302244 * d) },
    mars:    { N: rev(49.5574 + 2.11081e-5 * d), i: 1.8497 - 1.78e-8 * d,  w: rev(286.5016 + 2.92961e-5 * d),  a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: rev(18.6021 + 0.5240207766 * d) },
    jupiter: { N: rev(100.4542 + 2.76854e-5 * d), i: 1.3030 - 1.557e-7 * d, w: rev(273.8777 + 1.64505e-5 * d), a: 5.20256,  e: 0.048498 + 4.469e-9 * d, M: rev(19.8950 + 0.0830853001 * d) },
    saturn:  { N: rev(113.6634 + 2.38980e-5 * d), i: 2.4886 - 1.081e-7 * d, w: rev(339.3939 + 2.97661e-5 * d), a: 9.55475,  e: 0.055546 - 9.499e-9 * d, M: rev(316.9670 + 0.0334442282 * d) },
    uranus:  { N: rev(74.0005 + 1.3978e-5 * d),  i: 0.7733 + 1.9e-8 * d,   w: rev(96.6612 + 3.0565e-5 * d),    a: 19.18171 - 1.55e-8 * d, e: 0.047318 + 7.45e-9 * d, M: rev(142.5905 + 0.011725806 * d) },
    neptune: { N: rev(131.7806 + 3.0173e-5 * d), i: 1.7700 - 2.55e-7 * d,  w: rev(272.8461 - 6.027e-6 * d),    a: 30.05826 + 3.313e-8 * d, e: 0.008606 + 2.15e-9 * d, M: rev(260.2471 + 0.005995147 * d) },
    pluto:   { N: 110.299,                      i: 17.16,                 w: 113.76,                          a: 39.482,   e: 0.2488,                  M: rev(14.86 + 0.0039755 * d) },
    moon:    { N: rev(125.1228 - 0.0529538083 * d), i: 5.1454,            w: rev(318.0634 + 0.1643573223 * d), a: 60.2666,  e: 0.054900,                M: rev(115.3654 + 13.0649929509 * d) },
  };
}

function eclipticToEquatorial(lon, lat, ecl) {
  const x = cosd(lon) * cosd(lat);
  const y = sind(lon) * cosd(lat) * cosd(ecl) - sind(lat) * sind(ecl);
  const z = sind(lon) * cosd(lat) * sind(ecl) + sind(lat) * cosd(ecl);
  return { ra: rev(atan2d(y, x)), dec: asind(z) };
}

function altAz(ha, dec, lat) {
  const x = cosd(ha) * cosd(dec);
  const y = sind(ha) * cosd(dec);
  const z = sind(dec);
  const xhor = x * sind(lat) - z * cosd(lat);
  const yhor = y;
  const zhor = x * cosd(lat) + z * sind(lat);
  return { az: rev(atan2d(yhor, xhor) + 180), alt: asind(zhor) };
}

function geoLongitudesAt(d) {
  const el = elementsAt(d);
  const sunXYZ = orbitToXYZ(el.sun.N, el.sun.i, el.sun.w, el.sun.a, el.sun.e, el.sun.M);
  const sunLon = rev(atan2d(sunXYZ.y, sunXYZ.x));
  const earth = { x: -sunXYZ.x, y: -sunXYZ.y, z: -sunXYZ.z };

  const geo = { sun: { lon: sunLon, lat: 0 } };

  {
    const m = orbitToXYZ(el.moon.N, el.moon.i, el.moon.w, el.moon.a, el.moon.e, el.moon.M);
    let lon = atan2d(m.y, m.x);
    let lat = atan2d(m.z, Math.sqrt(m.x * m.x + m.y * m.y));
    const Ms = el.sun.M, Mm = el.moon.M;
    const Nm = el.moon.N, wm = el.moon.w;
    const Lm = rev(Nm + wm + Mm);
    const Ls = rev(el.sun.w + Ms);
    const D = rev(Lm - Ls);
    const F = rev(Lm - Nm);
    lon += -1.274 * sind(Mm - 2 * D) + 0.658 * sind(2 * D) - 0.186 * sind(Ms)
      - 0.059 * sind(2 * Mm - 2 * D) - 0.057 * sind(Mm - 2 * D + Ms) + 0.053 * sind(Mm + 2 * D)
      + 0.046 * sind(2 * D - Ms) + 0.041 * sind(Mm - Ms) - 0.035 * sind(D)
      - 0.031 * sind(Mm + Ms) - 0.015 * sind(2 * F - 2 * D) + 0.011 * sind(Mm - 4 * D);
    lat += -0.173 * sind(F - 2 * D) - 0.055 * sind(Mm - F - 2 * D) - 0.046 * sind(Mm + F - 2 * D)
      + 0.033 * sind(F + 2 * D) + 0.017 * sind(2 * Mm + F);
    geo.moon = { lon: rev(lon), lat };
  }

  for (const name of ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']) {
    const p = orbitToXYZ(el[name].N, el[name].i, el[name].w, el[name].a, el[name].e, el[name].M);
    const gx = p.x - earth.x, gy = p.y - earth.y, gz = p.z - earth.z;
    geo[name] = {
      lon: rev(atan2d(gy, gx)),
      lat: atan2d(gz, Math.sqrt(gx * gx + gy * gy)),
    };
  }

  return { el, geo };
}

// Movimento aparente (direto/retrógrado) comparando a longitude geocêntrica
// de agora com a de 12h atrás. Sol e Lua nunca retrogradam vistos da Terra.
const RETRO_SAMPLE_DAYS = 0.5;

function retrogradeFlags(d, geoNow) {
  const { geo: geoPrev } = geoLongitudesAt(d - RETRO_SAMPLE_DAYS);
  const flags = { sun: false, moon: false };
  for (const name of ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']) {
    const delta = rev(geoNow[name].lon - geoPrev[name].lon + 180) - 180;
    flags[name] = delta < 0;
  }
  return { flags, geoPrev };
}

/**
 * @param {Date} date
 * @param {number} obsLat degrees, north positive
 * @param {number} obsLon degrees, east positive
 */
export function computeSky(date, obsLat, obsLon) {
  const d = (date.getTime() - EPOCH_MS) / 86400000;
  const ecl = 23.4393 - 3.563e-7 * d;
  const { el, geo } = geoLongitudesAt(d);
  const { flags: retro, geoPrev } = retrogradeFlags(d, geo);

  const Ls_sun = rev(el.sun.w + el.sun.M);
  const GMST0 = rev(Ls_sun + 180);
  const utHoursReal = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const GMST = rev(GMST0 + utHoursReal * 15);
  const LST = rev(GMST + obsLon);

  const RAMC = LST;
  const asc = rev(atan2d(-cosd(RAMC), sind(RAMC) * cosd(ecl) + tand(obsLat) * sind(ecl)));

  const bodies = {};
  for (const name of BODY_ORDER) {
    const g = geo[name];
    const eq = eclipticToEquatorial(g.lon, g.lat, ecl);
    const ha = rev(LST - eq.ra + 180) - 180;
    const pos = altAz(ha, eq.dec, obsLat);
    const signIdx = Math.floor(rev(g.lon) / 30);
    const degInSign = rev(g.lon) % 30;
    const houseIdx = Math.floor(rev(g.lon - asc) / 30);
    bodies[name] = {
      lon: g.lon, lat: g.lat, alt: pos.alt, az: pos.az,
      signIdx, degInSign, house: houseIdx + 1, retro: retro[name],
      prevLon: geoPrev[name].lon,
    };
  }

  return { ecl, lst: LST, asc, bodies };
}
