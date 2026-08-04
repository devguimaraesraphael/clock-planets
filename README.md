# clock-planets — Astrolábio das Horas

Um astrolábio/orrery interativo que roda 100% no navegador: calcula a posição
geocêntrica dos planetas, do Sol e da Lua no instante atual a partir de
elementos keplerianos osculadores (época J2000, dados de Paul Schlyter / JPL),
sem nenhuma chamada externa de efemérides.

A partir da sua localização (detectada via geolocalização do navegador) e do
horário atual, calcula o Ascendente e monta as casas (sistema de Casas Iguais),
desenhando tudo em uma roda zodiacal em canvas 2D. Também é possível informar
o seu Signo Solar e Ascendente para ver o cruzamento entre o céu do momento e
o seu mapa pessoal.

## Requisitos

- [Node.js](https://nodejs.org/) (recomendado 18+)
- npm

## Como rodar

Opção mais simples — usa o script `start`, que instala as dependências (se
necessário) e sobe o servidor de desenvolvimento:

```bash
./start
```

Ou manualmente:

```bash
npm install
npm run dev
```

Depois abra o endereço mostrado no terminal (por padrão
[http://localhost:5173](http://localhost:5173)).

## Outros comandos

```bash
npm run build     # build de produção (gera a pasta dist/)
npm run preview   # serve o build de produção localmente
```

## Estrutura do projeto

- `index.html` — página principal
- `src/main.js` — ponto de entrada, liga geolocalização, seleção de signo/ascendente e renderização
- `src/ephemeris.js` — cálculo das posições planetárias, signos e casas
- `src/canvas2d.js` — desenho do astrolábio em canvas 2D
- `src/ledger.js` — renderização das tabelas de efemérides e interpretações
- `src/interpretations.js` — textos interpretativos astrológicos
- `src/style.css` — estilos visuais
