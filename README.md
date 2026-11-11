# TEAM FIGHTERS — O Combate dos Pesquisadores

Jogo de luta 2D para navegador com os integrantes do laboratório TEAM.
HTML5 + JavaScript (ES Modules) + Canvas 2D + Web Audio API + Gamepad API.
**Sem dependências, sem build, sem instalação**: é um site estático.

## Como rodar localmente

O jogo usa módulos ES, então precisa ser servido por HTTP (abrir o `index.html` direto do disco não funciona).

```bash
python3 serve.py
```

Abra <http://localhost:8765>. Alternativas equivalentes:

```bash
docker run --rm -p 8765:80 -v "$PWD":/usr/share/nginx/html:ro nginx:alpine
```

```bash
npx serve .
```

## Modos de jogo

| Modo | Descrição |
|---|---|
| **Jogar contra bot** | Escolha seu lutador, o adversário (ou aleatório), a dificuldade (Fácil / Normal / Difícil) e o cenário. |
| **2 jogadores** | Multiplayer local: dois teclados lógicos, dois gamepads ou teclado + gamepad. |
| **Treinamento** | Tempo infinito, vida que regenera, boneco configurável (parado, agachado, pulando, defendendo, bot), energia infinita, hitboxes visíveis e leitura de dano/combo. |
| **Torneio** | Quatro lutas em sequência contra outros integrantes (sorteados); a final é no laboratório real. Tela de campeão e contagem de títulos salva no navegador. |

## Controles padrão

| Ação | Jogador 1 (Teclado A) | Jogador 2 (Teclado B) | Gamepad (padrão Xbox) |
|---|---|---|---|
| Andar | A / D | ← / → | Direcional ou analógico |
| Pular | W | ↑ ou Num8 | ↑ |
| Agachar | S | ↓ ou Num5 | ↓ |
| Ataque leve | J | Num1 | X |
| Ataque forte | K | Num2 | Y |
| Poder 1 | U | Num4 | A |
| Poder 2 | I | Num6 | B |
| Supremo | O | Num3 | RB |
| Defesa | L | Num0 | LB |
| Pausa | Esc ou P | Esc ou P | Start |
| Tela cheia | F | F | — |

- **Notebook sem teclado numérico**: em *Configurações → Controles → Layout do Teclado B* escolha **Compacto** (setas + B N G H Y M).
- Tudo é remapeável em *Configurações → Controles* (teclas dos dois teclados e botões do gamepad).
- Nos modos de um jogador, qualquer teclado ou controle comanda o Jogador 1.
- Menus: setas ou WASD, Enter/Espaço/J confirma, Esc/K volta. Mouse também funciona.

### Sistema de luta

- **Combo básico**: leve, leve, leve. Leves cancelam em forte; golpes que acertam cancelam em poder ou supremo.
- **Defesa**: segure o botão de defesa *ou* segure para trás. Rasteiras (agachado + ataque) só são defendidas agachado; golpes aéreos só em pé.
- **Guarda**: a barra azul fina. Se zerar, a guarda quebra e o lutador fica tonto.
- **Corrida / esquiva**: dois toques para frente / para trás (a esquiva tem frames de invencibilidade).
- **Energia**: Poder 1 custa 20, Poder 2 custa 30, Supremo exige a barra cheia. A energia enche com o tempo, batendo e apanhando.

## Elenco

| Personagem | Estilo | Poder 1 | Poder 2 | Supremo |
|---|---|---|---|---|
| **Baiano** (Zune Drones) | Controle à distância | Esquadrão de Drones | Ataque Aéreo Zune | Enxame Zune |
| **Rinaldo** (O Faz-Tudo) | Versátil e imprevisível | Caixa de Ferramentas | Gambiarra Suprema (ventilador, choque ou foguete, sorteado) | O Faz-Tudo Resolve |
| **Tibas** (Eng. Mecânica) | Força e armadura | Braço Hidráulico | Turbina Mecânica | Engenharia de Destruição |
| **Ramas** (Computadores & IA) | Técnico | Ataque de IA | Sobrecarga Digital | Domínio da IA |
| **Elber** (Capivaras) | Invocador | Investida das Capivaras | Escudo Capivara | O Reino das Capivaras |
| **Peidin** (Fumaça & Fidget) | Controle de espaço | Cortina de Fumaça | Spinner Turbo | Pop-it Infernal |

### Finalizações

No golpe que decide a luta, o perdedor fica em pé, tonto, e aparece **FINALIZE!** (cerca de 5 segundos).
O comando **não aparece durante a luta**: é uma sequência de três direções e um botão que precisa ser memorizada
(ela fica listada em *Pausa → Comandos*).
Acertando, roda a cena de finalização; se errar, é só recomeçar a sequência; se o tempo acabar, é um nocaute comum.
"Frente" e "trás" são relativos ao lado para onde o lutador olha.

| Personagem | Finalização | Comando |
|---|---|---|
| Baiano | **Queda Livre** — os drones sobem com o adversário a 3000 m e soltam | ↓, frente, ↓, Poder 1 |
| Rinaldo | **Gambiarra Anatômica** — corta em três, remonta na ordem errada e prende com fita | trás, frente, trás, Ataque forte |
| Tibas | **Linha de Produção** — prensado e estampado, vira uma engrenagem com o próprio rosto | ↓, ↓, frente, Ataque forte |
| Ramas | **Exclusão Permanente** — compacta em .zip, joga na lixeira e esvazia | frente, trás, frente, Poder 2 |
| Elber | **Virou Capivara** — a manada briga numa nuvem de poeira e o adversário sai de lá capivara | trás, ↓, frente, Ataque leve |
| Peidin | **Spinner Humano** — gira o adversário como um spinner e assopra para a estratosfera | frente, ↓, trás, Poder 1 |

O bot também finaliza (25% no Fácil, 60% no Normal, 95% no Difícil). As cenas ficam em
[`src/characters/fatals.js`](src/characters/fatals.js).

### Qual foto virou qual personagem

A aparência de cada lutador (cabelo, óculos, barba, roupa, porte) foi modelada a partir das fotos de referência.
O mapeamento foto → personagem (confirmado pela equipe) fica em [`src/characters/index.js`](src/characters/index.js), na constante `PHOTO_OF`:

```js
export const PHOTO_OF = {
  baiano: 'foto6',   // camiseta azul-clara de mecatrônica, segurando o drone
  rinaldo: 'foto1',  // segurando o robô montado em discos
  tibas: 'foto5',    // camisa social e crachá de congresso
  ramas: 'foto2',    // camiseta ZUNE
  elber: 'foto3',    // óculos aviador, fones, celular e sacola
  peidin: 'peidin',  // polo preta, bigode e óculos de aro fino
};
```

Poderes e equipamentos acompanham o personagem, não a foto.
Os detalhes de cada aparência estão em [`src/characters/looks.js`](src/characters/looks.js).

## Cenários

1. **Laboratório TEAM** — recriado a partir da fotografia do laboratório (parede vermelha com painéis cinza, TV, armários, porta de vidro, forro com LED e ar cassete, robô humanoide, quadro branco, bancadas em primeiro plano).
2. Laboratório Principal · 3. Sala de Experimentos · 4. Laboratório Tecnológico · 5. Engenharia Mecânica · 6. Arena das Capivaras

## Estrutura do projeto

```
index.html, css/            página e estilo
serve.py                    servidor local sem cache
src/main.js                 laço de jogo (60 Hz), canvas responsivo, registro de cenas
src/core/                   config, utilitários, configurações salvas, entrada (teclado/gamepad/mouse), áudio, cenas
src/render/                 rig esquelético dos lutadores, poses/animações, conversor de pixel art, partículas, objetos, UI e HUD
src/characters/             aparências (looks) e os cinco personagens com poderes e cinemáticas
src/combat/                 lutador (máquina de estados), golpes base, entidades/projéteis, partida
src/ai/bot.js               inteligência artificial (3 dificuldades)
src/stages/                 seis arenas com paralaxe e elementos animados
src/scenes/                 telas: carregamento, título/menu, seleção, cenário, luta, vitória, torneio, configurações, controles, créditos
```

Toda a arte é gerada por código, em tempo real: os personagens têm esqueleto animado e são convertidos em
**pixel art 16-bit** (sprite de ~80 px, paleta de até 20 cores por personagem, contorno de 1 px) por
[`src/render/pixel.js`](src/render/pixel.js). Drones, capivaras, ferramentas e retratos passam pelo mesmo conversor.
Em *Configurações → Estilo dos personagens* dá para voltar ao desenho vetorial original.
Músicas e efeitos são sintetizados pela Web Audio API. Não há nenhum arquivo de terceiros no projeto.

## Publicar na internet

O projeto é 100% estático — basta publicar a pasta como está.

### GitHub Pages

```bash
git init -b main && git add . && git commit -m "TEAM FIGHTERS"
```

```bash
gh repo create team-fighters --public --source . --push
```

Depois, no repositório: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
O jogo fica em `https://SEU_USUARIO.github.io/team-fighters/`. O arquivo `.nojekyll` já está incluído.

### Netlify

Arraste a pasta para <https://app.netlify.com/drop>, ou:

```bash
npx netlify-cli deploy --prod --dir .
```

### Vercel

```bash
npx vercel --prod
```

Nenhuma configuração de build é necessária em nenhuma das plataformas (os arquivos `netlify.toml` e `vercel.json` só definem cache).

## Observações

- O áudio só começa após a primeira tecla/clique (política de autoplay dos navegadores).
- O jogo foi pensado para teclado e gamepad; não há controles de toque para celular.
- Configurações, remapeamentos e títulos de torneio ficam no `localStorage` do navegador.
