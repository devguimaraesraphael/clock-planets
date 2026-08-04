// Motor de interpretação astrológica: mapa semântico planeta × casa (com
// leituras próprias, não geradas por substituição de template), dignidade
// essencial, retrogradação, aspectos entre planetas, e uma síntese geral do
// momento que cruza tudo isso por "áreas da vida" (os quatro eixos de casas).
// Consome apenas a saída de computeSky() (src/ephemeris.js); não faz nenhum
// cálculo posicional.

import { BODY_ORDER, BODY_META, SIGNS, ROMAN, rev } from './ephemeris.js';

// --- Camada 1: leituras específicas de cada planeta em cada casa ---------
// 120 textos escritos individualmente — cada combinação tem conteúdo
// astrológico próprio, não é composta por substituição de palavras.

const PLANET_HOUSE_TEXTS = {
  sun: [
    'Você quer aparecer e ser você mesmo, sem pedir desculpas por isso.',
    'Sua autoestima passa pelo bolso hoje: ganhar e guardar bem dá uma sensação boa de valor próprio.',
    'Sua cabeça tá afiada — boa hora pra conversar, aprender coisa nova e trocar ideia.',
    'O clima pede casa, família e um cantinho seu, longe da exposição.',
    'Vontade de criar, paquerar ou simplesmente se divertir sem pensar demais.',
    'Energia voltada pro trabalho do dia a dia e pro corpo — produtividade tranquila.',
    'Você se vê melhor através do outro agora; parcerias ajudam a entender quem você é.',
    'Um assunto mais pesado ou íntimo pede atenção — pode incomodar, mas também transforma.',
    'Vontade de expandir a cabeça: estudar, viajar, pensar grande.',
    'Hora de aparecer no trabalho e assumir o crédito pelo que você faz bem.',
    'Você brilha mais em grupo agora — projetos coletivos e amizades de longo prazo.',
    'Fase mais recolhida, de descanso e bastidor, antes do próximo passo.',
  ],
  moon: [
    'Seu humor tá na cara hoje — o que você sente aparece sem filtro.',
    'Se sentir seguro passa por ter as contas em dia e cuidar do corpo.',
    'Sensibilidade solta na conversa; memórias e gente próxima mexem com você.',
    'Foco em casa e família — hora de se aconchegar e cuidar de quem você ama.',
    'Coração leve pra criar, brincar ou se apaixonar sem cobrança.',
    'Sua rotina reflete como você tá por dentro — cuidar do corpo é se cuidar.',
    'Você busca colo no outro agora; os relacionamentos pesam mais no emocional.',
    'Emoção forte rondando temas de intimidade ou perda — dói, mas abre espaço pro novo.',
    'Vontade de dar sentido maior às coisas — fé, estudo ou uma mudança de ares acalmam.',
    'A vida profissional pesa emocionalmente hoje; se expor no trabalho pode incomodar um pouco.',
    'Os amigos funcionam quase como família nesse momento.',
    'Sensibilidade crua e voltada pra dentro — sonhos e memórias antigas pedem silêncio.',
  ],
  mercury: [
    'Você fala de si com curiosidade e vontade de se explicar.',
    'Cabeça ligada em dinheiro — bom momento pra negociar e organizar as finanças.',
    'Mercúrio em casa própria: conversa, estudo e trocas rápidas fluem fácil.',
    'A conversa gira em torno de casa e família — hora de organizar o que ficou pra trás.',
    'Ideias soltas e leves, boas pra criar e brincar sem compromisso.',
    'Cabeça prática, voltada pra rotina, saúde e detalhes do trabalho.',
    'As conversas definem o relacionamento agora — negociar é a palavra do dia.',
    'Vontade de investigar o que tá escondido: segredos, dinheiro compartilhado, coisas complicadas.',
    'Cabeça grande, pensando em estudo, viagem ou filosofia.',
    'Falar bem no trabalho abre portas — a reputação se constrói pelo que você diz.',
    'Ideias circulando em grupo; papo com amigos e planos coletivos animam o dia.',
    'Pensamento mais pra dentro, quase sonhando acordado — intuição fala mais alto que lógica.',
  ],
  venus: [
    'Charme e bom gosto na medida certa hoje — você busca harmonia começando por si.',
    'O prazer passa pelo que você tem; cuidar do conforto material é um jeito de se valorizar.',
    'Afeto que passa pela palavra — conversa boa e contato leve suavizam o dia.',
    'Casa pedindo beleza e aconchego; clima gostoso em família.',
    'Território favorito de Vênus: romance e criatividade fluem com naturalidade.',
    'Cuidar bem do trabalho e dos hábitos do corpo vira fonte de prazer.',
    'Bom momento pra parceria — charme, atração e vontade de equilibrar guiam a relação.',
    'Intimidade e dinheiro compartilhado mexem com o afeto; desejo forte.',
    'Gosto mais refinado com viagem, cultura e boas ideias.',
    'Sua imagem pública ganha charme — reconhecimento vem através das relações.',
    'Afeto em grupo; amigos trazem prazer e sensação de pertencer.',
    'Um amor mais discreto ou idealizado, vivido em silêncio.',
  ],
  mars: [
    'Vontade de agir na hora, sem enrolação — coragem em primeiro plano.',
    'Energia focada em ganhar e proteger o que é seu.',
    'Fala direta e cabeça inquieta; a ação vem pela palavra e pelo deslocamento.',
    'Tensão em casa — questão de família pede posição firme, talvez um confronto.',
    'Paixão e iniciativa tomando conta da criatividade e do romance.',
    'Ritmo puxado no trabalho e no corpo — cuidado pra não se esgotar sem pausa.',
    'Atrito ou desafio direto com o outro; a parceria testa limite.',
    'Intensidade no talo: desejo, poder e crise se cruzam.',
    'Coragem pra arriscar em estudo, viagem ou crença nova.',
    'Ambição em alta na carreira — hora de tomar iniciativa e liderar.',
    'Energia de grupo; causas e alianças mobilizam a ação.',
    'Força mais pra dentro — batalha interna ou coragem silenciosa.',
  ],
  jupiter: [
    'Confiança em alta na forma como você se mostra — otimismo contagiante.',
    'Boa fase pro bolso; visão ampla favorece o crescimento material.',
    'Cabeça aberta pra aprender e compartilhar ideia sem economizar entusiasmo.',
    'Casa e família crescendo ou ganhando novo sentido — sensação boa de proteção.',
    'Criatividade generosa e romance animado; a sorte favorece o que vem do coração.',
    'Trabalho e saúde crescem com otimismo prático.',
    'Parceria que faz os dois crescerem — generosidade fortalece o vínculo.',
    'Expansão através de uma transformação — ganho ou aprendizado maior à vista.',
    'Território natural de Júpiter: estudo, filosofia e viagem abrem horizonte de verdade.',
    'Boas chances na carreira — reconhecimento público pode vir agora.',
    'Rede de contatos e projetos em grupo prosperando.',
    'Fé quieta e generosidade discreta — crescimento que não aparece muito, mas sustenta.',
  ],
  saturn: [
    'Peso de responsabilidade na forma como você se mostra — talvez cobrança demais de si.',
    'Segurança material se constrói devagar agora, com esforço e pé no chão.',
    'Pensamento mais lento e autocrítico; aprender exige paciência.',
    'Responsabilidade em casa — estrutura antiga da família pede revisão.',
    'Criatividade e romance passam por um teste de maturidade — menos leveza, mais compromisso.',
    'Rotina e saúde pedem disciplina — o trabalho se firma com método.',
    'Compromisso sério nos relacionamentos; a parceria pode ensinar um limite necessário.',
    'Transformação lenta e difícil — a crise pede estrutura pra ser atravessada, não evitada.',
    'Suas crenças são testadas pela realidade — expansão exige método, não só fé.',
    'Território natural de Saturno: carreira construída com esforço, mas o reconhecimento dura.',
    'Amizade e projeto em grupo pedem compromisso de verdade.',
    'Solidão que estrutura — algo ainda não resolvido pede silêncio pra ser processado.',
  ],
  uranus: [
    'Vontade repentina de ser mais autêntico, mesmo que quebre sua própria imagem.',
    'Dinheiro instável ou inovador — ganho inesperado ou necessidade de romper com o padrão de sempre.',
    'Cabeça rápida e fora da caixa; ideia e conversa inesperada marcam o dia.',
    'Mudança repentina em casa — o lar pede mais espaço e menos regra.',
    'Criatividade excêntrica e paquera inesperada — o prazer se renova quebrando a rotina.',
    'Mudança abrupta na rotina ou no trabalho — corpo e hábito pedem liberdade.',
    'Relacionamento com reviravolta; vontade de independência tensiona o combinado.',
    'Transformação repentina e imprevisível mexendo com dinheiro compartilhado ou intimidade.',
    'Ideia nova sacode suas crenças — expansão que vem da ruptura.',
    'Virada inesperada na carreira — originalidade chama atenção, mesmo incomodando.',
    'Território natural de Urano: causa e amizade inovadora movem o momento.',
    'Insight repentino vindo de dentro — libertação quieta de um padrão antigo.',
  ],
  neptune: [
    'Você fica mais sensível e idealizado hoje — os limites do seu Eu ficam mais porosos.',
    'Dinheiro e valor pessoal ganham um tom confuso — cuidado com expectativa fora da realidade.',
    'Fala mais poética e intuitiva, mas com risco de dispersar.',
    'Casa com clima nostálgico ou espiritual — memória e saudade se misturam.',
    'Romance e criatividade com um véu de idealização — inspiração forte, cuidado com ilusão.',
    'Sensibilidade aumentada pode virar cansaço difuso — vá com calma e se cuide.',
    'Relacionamento tocado por idealização — empatia forte, cuidado pra não perder o limite.',
    'Fronteira se dissolvendo em algo íntimo ou compartilhado — tema de perda e transformação.',
    'Fé e busca de sentido se expandem quase místicas — cuidado pra não fugir da realidade.',
    'Sua imagem pública fica nebulosa ou romantizada — pode ser mal compreendida.',
    'Sonho coletivo movimenta amizades — inspira, mas precisa de verificação prática.',
    'Território natural de Netuno: introspecção e espiritualidade se aprofundam.',
  ],
  pluto: [
    'Uma transformação funda em curso — você é forçado a se reinventar de raiz.',
    'Poder e controle atravessam sua relação com dinheiro — pode forçar rever seus valores.',
    'Pensamento intenso e investigativo; a conversa pode revelar verdade escondida.',
    'Raiz de família antiga vem à tona pra ser encarada — o lar passa por virada funda.',
    'Paixão intensa e criatividade que transforma — prazer misturado com poder.',
    'Crise ou reconstrução na rotina e na saúde — hábito velho precisa morrer pro novo nascer.',
    'Relacionamento entra numa zona de poder e intensidade — pode ter ruptura que regenera.',
    'Território natural de Plutão: intimidade e regeneração definem o momento.',
    'Suas crenças mais fundas são desafiadas — expansão exige atravessar o desconforto, não desviar.',
    'Poder e reputação se transformam em público — carreira pode dar uma virada sem volta.',
    'Grupo e aliança atravessam disputa de poder ou transformação coletiva.',
    'Processo interno profundo pede travessia silenciosa — o que tá escondido pressiona pra vir à tona.',
  ],
};

const PLANET_THEMES = {
  sun: 'sua energia e identidade',
  moon: 'suas emoções',
  mercury: 'sua cabeça e sua fala',
  venus: 'seu afeto e seu prazer',
  mars: 'sua ação e sua garra',
  jupiter: 'sua confiança e vontade de crescer',
  saturn: 'sua disciplina e seus limites',
  uranus: 'sua vontade de romper e ser diferente',
  neptune: 'sua intuição',
  pluto: 'sua transformação e seu poder',
};

export const HOUSE_TITLES = {
  1: 'Casa I — O Eu', 2: 'Casa II — Recursos', 3: 'Casa III — Comunicação',
  4: 'Casa IV — Raízes', 5: 'Casa V — Criação', 6: 'Casa VI — Serviço',
  7: 'Casa VII — Parceria', 8: 'Casa VIII — Transformação', 9: 'Casa IX — Horizonte',
  10: 'Casa X — Vocação', 11: 'Casa XI — Comunidade', 12: 'Casa XII — Dissolução',
};

const HOUSE_GROUP = {
  1: 'angular', 4: 'angular', 7: 'angular', 10: 'angular',
  2: 'sucedente', 5: 'sucedente', 8: 'sucedente', 11: 'sucedente',
  3: 'cadente', 6: 'cadente', 9: 'cadente', 12: 'cadente',
};

// --- Camada 2: dignidade essencial (tradicional, com domicílios modernos
// para os planetas transaturninos) ----------------------------------------
// índices de signo: 0 Áries ... 11 Peixes (mesma ordem de SIGNS)

const DIGNITY = {
  sun:     { domicile: [4],    exaltation: 0,  fall: 6,  detriment: [10] },
  moon:    { domicile: [3],    exaltation: 1,  fall: 7,  detriment: [9] },
  mercury: { domicile: [2, 5], exaltation: 5,  fall: 11, detriment: [8, 11] },
  venus:   { domicile: [1, 6], exaltation: 11, fall: 5,  detriment: [7, 0] },
  mars:    { domicile: [0, 7], exaltation: 9,  fall: 3,  detriment: [6, 1] },
  jupiter: { domicile: [8, 11], exaltation: 3, fall: 9,  detriment: [2, 5] },
  saturn:  { domicile: [9, 10], exaltation: 6, fall: 0,  detriment: [3, 4] },
  uranus:  { domicile: [10],   exaltation: 7,  fall: 1,  detriment: [4] },
  neptune: { domicile: [11],   exaltation: 4,  fall: 5,  detriment: [8] },
  pluto:   { domicile: [7],    exaltation: 0,  fall: 6,  detriment: [1] },
};

const DIGNITY_LABEL = { domicilio: 'domicílio', exaltacao: 'exaltação', exilio: 'exílio', queda: 'queda' };

const DIGNITY_CLAUSE = {
  domicilio: 'Em casa própria, isso flui fácil e natural pra você.',
  exaltacao: 'Nesse signo, isso fica ainda mais forte e claro do que o normal.',
  exilio: 'Nesse signo, dá mais trabalho — exige um esforço extra pra se expressar bem.',
  queda: 'Nesse signo, isso fica meio sem jeito — vale ter paciência e ir com calma.',
};

function dignityOf(planet, signIdx) {
  const d = DIGNITY[planet];
  if (d.domicile.includes(signIdx)) return 'domicilio';
  if (d.exaltation === signIdx) return 'exaltacao';
  if (d.fall === signIdx) return 'queda';
  if (d.detriment.includes(signIdx)) return 'exilio';
  return null;
}

const RETRO_CLAUSE = 'Retrógrado, isso pede uma revisão em vez de algo novo — feche pontas soltas antes de seguir em frente.';

/**
 * Texto cru da combinação planeta-casa, sem dignidade/retrogradação — usado
 * no tooltip do astrolábio (leitura rápida, antes de qualquer camada extra).
 */
export function rawPlanetHouseText(planetKey, houseNum) {
  return PLANET_HOUSE_TEXTS[planetKey][houseNum - 1];
}

/**
 * Leitura completa de UM corpo: texto específico da combinação planeta-casa
 * + dignidade essencial no signo + retrogradação, com peso para a síntese
 * geral do momento.
 */
export function planetHouseReading(planetKey, body) {
  const houseNum = body.house;
  const base = PLANET_HOUSE_TEXTS[planetKey][houseNum - 1];
  const dignity = dignityOf(planetKey, body.signIdx);
  const parts = [base];
  if (dignity) parts.push(DIGNITY_CLAUSE[dignity]);
  if (body.retro) parts.push(RETRO_CLAUSE);

  const group = HOUSE_GROUP[houseNum];
  let weight = HEADLINE_WEIGHT[planetKey] * GROUP_WEIGHT[group];
  if (dignity === 'domicilio' || dignity === 'exaltacao') weight += 2;
  if (dignity === 'exilio' || dignity === 'queda') weight -= 1;
  if (body.retro) weight += 1;

  return {
    planet: planetKey, house: houseNum, grupo: group, dignity, retro: body.retro,
    text: parts.join(' '), weight,
  };
}

const HEADLINE_WEIGHT = { sun: 5, moon: 5, mercury: 2, venus: 2, mars: 3, jupiter: 2, saturn: 2, uranus: 1, neptune: 1, pluto: 1 };
const GROUP_WEIGHT = { angular: 3, sucedente: 2, cadente: 1 };

// --- Camada 3: aspectos entre planetas ------------------------------------

const ASPECTS = [
  { key: 'conjuncao', name: 'conjunção', angle: 0,   nature: 'se mistura com',        tension: 'neutro' },
  { key: 'sextil',    name: 'sextil',    angle: 60,  nature: 'combina fácil com',      tension: 'harmonico' },
  { key: 'quadratura', name: 'quadratura', angle: 90, nature: 'entra em atrito com',   tension: 'duro' },
  { key: 'trigono',   name: 'trígono',   angle: 120, nature: 'flui direitinho com',    tension: 'harmonico' },
  { key: 'oposicao',  name: 'oposição',  angle: 180, nature: 'puxa pro lado oposto de', tension: 'duro' },
];

function orbFor(a, b) {
  return (a === 'sun' || a === 'moon' || b === 'sun' || b === 'moon') ? 8 : 6;
}

function sepDeg(lonA, lonB) {
  const raw = Math.abs(rev(lonA - lonB + 180) - 180);
  return Math.min(raw, 360 - raw);
}

const TREND_CLAUSE = {
  aplicando: 'Esse assunto ainda tá crescendo.',
  separando: 'Esse assunto já passou do auge.',
};

/**
 * Todos os aspectos maiores ativos entre os 10 corpos (não só conjunção):
 * conjunção, sextil, quadratura, trígono e oposição, cada um com sua
 * natureza (harmônica, dura ou neutra), a exatidão (orbe) do momento, e se
 * está "aplicando" (o orbe tá fechando, o tema ainda crescendo) ou
 * "separando" (o orbe tá abrindo, o tema já passou do pico) — comparando a
 * posição de agora com a de 12h atrás.
 */
export function findAspects(bodies) {
  const out = [];
  for (let i = 0; i < BODY_ORDER.length; i++) {
    for (let j = i + 1; j < BODY_ORDER.length; j++) {
      const a = BODY_ORDER[i], b = BODY_ORDER[j];
      const sep = sepDeg(bodies[a].lon, bodies[b].lon);
      const orb = orbFor(a, b);
      for (const asp of ASPECTS) {
        const exactness = Math.abs(sep - asp.angle);
        if (exactness <= orb) {
          const la = BODY_META[a].label, lb = BODY_META[b].label;
          const sepPrev = sepDeg(bodies[a].prevLon, bodies[b].prevLon);
          const exactnessPrev = Math.abs(sepPrev - asp.angle);
          const trend = exactness < exactnessPrev ? 'aplicando' : exactness > exactnessPrev ? 'separando' : null;
          out.push({
            a, b, aspect: asp.key, tension: asp.tension, orb: exactness, trend,
            weight: (HEADLINE_WEIGHT[a] + HEADLINE_WEIGHT[b]) * (asp.tension === 'duro' ? 2 : 1) / (1 + exactness),
            text: `${la} e ${lb} em ${asp.name} (orbe ${exactness.toFixed(1)}°): ${PLANET_THEMES[a]} ${asp.nature} ${PLANET_THEMES[b]}.${trend ? ' ' + TREND_CLAUSE[trend] : ''}`,
          });
          break;
        }
      }
    }
  }
  return out.sort((x, y) => y.weight - x.weight);
}

// --- Camada 4: áreas da vida (os quatro eixos de casas) -------------------

const LIFE_AREAS = {
  fogo:  { label: 'quem você é e pra onde quer ir',      houses: [1, 5, 9] },
  terra: { label: 'trabalho, corpo e dinheiro',          houses: [2, 6, 10] },
  ar:    { label: 'conversa, parceria e vida social',    houses: [3, 7, 11] },
  agua:  { label: 'emoção, intimidade e mundo interior', houses: [4, 8, 12] },
};

function areaOfHouse(houseNum) {
  for (const [key, area] of Object.entries(LIFE_AREAS)) {
    if (area.houses.includes(houseNum)) return key;
  }
  return null;
}

// --- Camada 5: síntese geral do momento -----------------------------------
// Bancos de frases variados, escolhidos deterministicamente a partir da
// configuração real do céu (proporção de aspectos duros/harmônicos,
// quantidade de retrógrados, dignidade média) — não por sorte aleatória,
// para que a leitura não "pisque" a cada atualização sem motivo.

const OPENINGS = {
  tenso: [
    'Tá pegando fogo em {area} — chegou a hora de resolver o que vinha sendo empurrado com a barriga.',
    'A pressão tá subindo em {area}: melhor virar a chave do que esperar acomodar sozinho.',
    'Não tá fácil na área de {area} agora, mas esse atrito é o que empurra o próximo passo.',
    '{area_cap} tá num ponto de virada — mudança parece inevitável nas próximas semanas.',
  ],
  fluido: [
    'Boa hora pra avançar em {area} — as coisas fluem com menos travas que o normal.',
    '{area_cap} tá numa maré boa; o que você plantar agora tende a dar certo fácil.',
    'Momento tranquilo em {area}: aproveite a abertura pra firmar o que já vinha construindo.',
    'As portas se abrem sozinhas em {area} — hora de topar e seguir em frente.',
  ],
  misto: [
    'Contraste em {area}: coisa boa e obstáculo convivendo lado a lado, então olhe com calma.',
    '{area_cap} tá num vai-e-vem — nem travado, nem resolvido; vale mais olhar com cuidado do que agir no impulso.',
    'Equilíbrio delicado em {area} agora: um passo pra frente, outro de ajuste, sem certeza ainda.',
    'Sinal misto rondando {area} — melhor observar o que se firma do que reagir de cara.',
  ],
};

function retroClause(retroList) {
  if (retroList.length >= 3) {
    return `Com ${retroList.length} planetas retrógrados (${retroList.map((n) => BODY_META[n].label).join(', ')}), esse é mais um momento de revisar do que de estrear coisa nova — feche as pontas soltas antes.`;
  }
  if (retroList.length >= 1) {
    return `Com ${retroList.map((n) => BODY_META[n].label).join(' e ')} retrógrado(s), tem um assunto específico pedindo uma segunda olhada antes de seguir em frente.`;
  }
  return 'Sem ninguém retrógrado agora, dá pra tomar decisão e seguir sem enrolação.';
}

function dignityClause(score) {
  if (score >= 3) return 'Tem planeta forte, em casa própria, na configuração de agora — você tem recurso interno de verdade pra sustentar o que decidir.';
  if (score <= -2) return 'Vários planetas tão em terreno mais difícil agora — vá com mais paciência e cobre menos resultado imediato de você mesmo.';
  return null;
}

const INVITATIONS = {
  'tenso|alto':  'O recado de agora é: recue, revise, e só depois aja.',
  'tenso|baixo': 'O recado de agora é: tenha coragem de agir, mesmo sem garantia nenhuma.',
  'fluido|alto': 'O recado de agora é: avance, mas cuide dos detalhes que ainda pedem ajuste.',
  'fluido|baixo': 'O recado de agora é: aproveite a maré e vá sem hesitar.',
  'misto|alto':  'O recado de agora é: revise um ponto específico antes de se comprometer de vez.',
  'misto|baixo': 'O recado de agora é: observe mais um pouco antes de se comprometer de vez.',
};

// --- Camada 6: regente do momento (o dono do signo que está subindo) ------
// O planeta que rege o Ascendente funciona como o "protagonista" da leitura:
// sua própria casa e dignidade dão o tom de como esse protagonismo se expressa.

const RULER_OF_SIGN = [
  'mars', 'venus', 'mercury', 'moon', 'sun', 'mercury',
  'venus', 'pluto', 'jupiter', 'saturn', 'uranus', 'neptune',
];

function chartRuler(sky, readings) {
  const signIdx = Math.floor(rev(sky.asc) / 30);
  const planet = RULER_OF_SIGN[signIdx];
  const reading = readings.find((r) => r.planet === planet);
  const meta = BODY_META[planet];
  return {
    planet, sign: SIGNS[signIdx][1],
    text: `Quem manda no momento é ${meta.label}, dono do seu Ascendente em ${SIGNS[signIdx][1]}. ${reading.text}`,
  };
}

// --- Camada 7: fase da Lua -------------------------------------------------

const MOON_PHASES = [
  { max: 12, key: 'nova', label: 'Lua Nova', text: 'Lua Nova: bom momento pra plantar uma semente ou começar algo, mesmo sem saber onde vai dar.' },
  { max: 172, key: 'crescente', label: 'Lua Crescente', text: 'Lua Crescente: a energia tá construindo — hora de agir e dar continuidade ao que começou.' },
  { max: 192, key: 'cheia', label: 'Lua Cheia', text: 'Lua Cheia: as coisas ficam claras e à mostra — hora de colher ou perceber o que já amadureceu.' },
  { max: 348, key: 'minguante', label: 'Lua Minguante', text: 'Lua Minguante: hora de soltar, encerrar e limpar o terreno pro próximo ciclo.' },
  { max: 360, key: 'nova', label: 'Lua Nova', text: 'Lua Nova: bom momento pra plantar uma semente ou começar algo, mesmo sem saber onde vai dar.' },
];

function moonPhase(sunLon, moonLon) {
  const diff = rev(moonLon - sunLon);
  return MOON_PHASES.find((p) => diff <= p.max);
}

// --- Camada 8: equilíbrio de elemento e modalidade -------------------------
// Onde os 10 corpos estão concentrados por elemento (fogo/terra/ar/água) e
// por modalidade (cardinal/fixo/mutável) — um jeito simples de flagrar o
// "clima geral" do céu além da leitura corpo a corpo.

const ELEMENT_OF_SIGN = ['fogo', 'terra', 'ar', 'agua'];
const ELEMENT_TEXT = {
  fogo: 'Muita energia de fogo espalhada pelo céu agora — vontade de agir e aparecer domina o clima.',
  terra: 'Muita energia de terra espalhada pelo céu agora — o foco tá em fazer, construir e garantir o concreto.',
  ar: 'Muita energia de ar espalhada pelo céu agora — a cabeça e a conversa comandam o momento.',
  agua: 'Muita energia de água espalhada pelo céu agora — o emocional fala mais alto que a razão.',
};

const MODALITY_OF_SIGN = ['cardinal', 'fixo', 'mutavel'];
const MODALITY_TEXT = {
  cardinal: 'Clima de começar coisas novas predomina.',
  fixo: 'Clima de segurar e persistir no que já existe predomina.',
  mutavel: 'Clima de se adaptar e mudar de direção predomina.',
};

function dominantOf(bodies, table, textMap, minCount) {
  const counts = {};
  for (const key of Object.keys(textMap)) counts[key] = 0;
  for (const name of BODY_ORDER) counts[table[bodies[name].signIdx % table.length]]++;
  const [topKey, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return topCount >= minCount ? textMap[topKey] : null;
}

// --- Camada 9: concentração em signo (stellium) ---------------------------

function findStellium(bodies) {
  const bySign = {};
  for (const name of BODY_ORDER) {
    const s = bodies[name].signIdx;
    (bySign[s] ||= []).push(name);
  }
  const [signIdx, names] = Object.entries(bySign)
    .filter(([, list]) => list.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)[0] || [];
  if (!names) return null;
  const labels = names.map((n) => BODY_META[n].label).join(', ');
  return `Tem uma concentração forte em ${SIGNS[Number(signIdx)][1]} agora (${labels}) — o tema desse signo domina o céu.`;
}

/**
 * Algoritmo principal: recebe a saída on-time de computeSky(date, lat, lon)
 * e devolve a interpretação completa do momento — leitura por corpo,
 * aspectos ativos, regente do momento, fase da Lua, equilíbrio de
 * elemento/modalidade, concentração em signo, e uma síntese geral que cruza
 * tudo isso com as quatro áreas da vida (eixos de casas).
 */
export function interpretMoment(sky) {
  const readings = BODY_ORDER.map((name) => planetHouseReading(name, sky.bodies[name]));
  const aspects = findAspects(sky.bodies);
  const ruler = chartRuler(sky, readings);
  const moon = moonPhase(sky.bodies.sun.lon, sky.bodies.moon.lon);
  const elementNote = dominantOf(sky.bodies, ELEMENT_OF_SIGN, ELEMENT_TEXT, 4);
  const modalityNote = dominantOf(sky.bodies, MODALITY_OF_SIGN, MODALITY_TEXT, 5);
  const stellium = findStellium(sky.bodies);

  // área da vida dominante: soma dos pesos das leituras por eixo de casas
  const areaScore = { fogo: 0, terra: 0, ar: 0, agua: 0 };
  for (const r of readings) areaScore[areaOfHouse(r.house)] += r.weight;
  const dominantAreaKey = Object.entries(areaScore).sort((a, b) => b[1] - a[1])[0][0];
  const areaLabel = LIFE_AREAS[dominantAreaKey].label;

  // tom geral: proporção de aspectos duros vs harmônicos, ponderada por peso
  let hard = 0, harmonic = 0;
  for (const a of aspects) {
    if (a.tension === 'duro') hard += a.weight;
    else if (a.tension === 'harmonico') harmonic += a.weight;
  }
  const total = hard + harmonic;
  let tom = 'misto';
  if (total > 0) {
    if (hard / total >= 0.62) tom = 'tenso';
    else if (harmonic / total >= 0.62) tom = 'fluido';
  }

  const retroList = BODY_ORDER.filter((name) => sky.bodies[name].retro);
  const dignityScore = readings.reduce((sum, r) => {
    if (r.dignity === 'domicilio' || r.dignity === 'exaltacao') return sum + 1;
    if (r.dignity === 'exilio' || r.dignity === 'queda') return sum - 1;
    return sum;
  }, 0);

  // escolha determinística da variante de frase: a própria configuração do
  // céu (nº de retrógrados + peso da área dominante, arredondado) decide o
  // índice — mesma leitura astrológica sempre soa igual, leituras diferentes
  // variam de fato.
  const pool = OPENINGS[tom];
  const idx = (retroList.length + Math.round(areaScore[dominantAreaKey])) % pool.length;
  const opening = pool[idx]
    .replaceAll('{area}', areaLabel)
    .replaceAll('{area_cap}', areaLabel[0].toUpperCase() + areaLabel.slice(1));

  const pressureLevel = (hard >= harmonic) ? 'alto' : 'baixo';
  const invitation = INVITATIONS[`${tom}|${pressureLevel}`];

  const topAspect = aspects[0] ? aspects[0].text : 'Nenhum aspecto maior ativo entre os planetas neste instante — céu comparativamente silencioso.';
  const dClause = dignityClause(dignityScore);

  const synthesis = [
    opening, topAspect, stellium, elementNote, modalityNote,
    retroClause(retroList), dClause, invitation,
  ].filter(Boolean).join(' ');

  return {
    readings,
    aspects,
    synthesis,
    dominantArea: { key: dominantAreaKey, label: areaLabel },
    tom,
    ruler,
    moon,
    stellium,
  };
}

// --- Camada 10: cruzamento com o mapa do usuário (trânsito pessoal) -------
// O usuário só informa o Signo Solar e o Ascendente (não hora/local de
// nascimento), então isso é necessariamente aproximado: usamos o meio de
// cada signo (15°) como "grau natal" de referência. É o suficiente pra
// cruzar com sentido — casas natais (sistema de Casas Iguais a partir do
// Ascendente informado) e aspectos exatos ficam mais grosseiros que os do
// céu do instante, que usa o Ascendente real calculado por local/hora.

const NATAL_ORB = 5;

function natalHouseOf(transitLon, ascSignIdx) {
  return Math.floor(rev(transitLon - ascSignIdx * 30) / 30) + 1;
}

function aspectsToNatalPoint(sky, natalLon, pointLabel, pointClause) {
  const out = [];
  for (const name of BODY_ORDER) {
    const sep = sepDeg(sky.bodies[name].lon, natalLon);
    for (const asp of ASPECTS) {
      const exactness = Math.abs(sep - asp.angle);
      if (exactness <= NATAL_ORB) {
        out.push({
          planet: name, aspect: asp.key, tension: asp.tension, orb: exactness,
          weight: HEADLINE_WEIGHT[name] * (asp.tension === 'duro' ? 2 : 1) / (1 + exactness),
          text: `${BODY_META[name].label} agora ${asp.nature} ${pointLabel} (${asp.name}, orbe ${exactness.toFixed(1)}°) — ${pointClause}`,
        });
        break;
      }
    }
  }
  return out.sort((x, y) => y.weight - x.weight);
}

/**
 * Cruza o céu do instante (sky, de computeSky) com o Signo Solar e o
 * Ascendente que o usuário informou: em que casa natal (aproximada) cada
 * planeta tá passando agora, e quais planetas tocam o Sol natal ou o
 * Ascendente natal por aspecto — os dois pontos mais sensíveis a trânsito.
 */
export function personalReadings(sky, userSunSignIdx, userAscSignIdx) {
  const byHouse = BODY_ORDER.map((name) => {
    const house = natalHouseOf(sky.bodies[name].lon, userAscSignIdx);
    return {
      planet: name, house, retro: sky.bodies[name].retro,
      text: rawPlanetHouseText(name, house),
      weight: HEADLINE_WEIGHT[name] * GROUP_WEIGHT[HOUSE_GROUP[house]],
    };
  }).sort((a, b) => b.weight - a.weight);

  const natalSunLon = userSunSignIdx * 30 + 15;
  const natalAscLon = userAscSignIdx * 30 + 15;
  const toSun = aspectsToNatalPoint(sky, natalSunLon, 'o seu Sol natal', 'mexe direto com sua essência e sua vontade de brilhar.');
  const toAsc = aspectsToNatalPoint(sky, natalAscLon, 'o seu Ascendente', 'mexe com a forma como você aparece pro mundo, sua primeira impressão.');

  const topHit = [...toSun, ...toAsc].sort((a, b) => a.orb - b.orb)[0];
  const headline = topHit
    ? `O que mais te toca pessoalmente agora: ${topHit.text}`
    : 'Nenhum planeta em trânsito faz aspecto exato com seu Sol ou Ascendente natal neste instante — dia mais tranquilo, sem grande alvoroço pessoal.';

  return { byHouse, toSun, toAsc, headline };
}
