/* Pokémon Veyra — data layer
   Projeto fã não comercial. Pokémon e marcas pertencem à Nintendo, The Pokémon Company e GAME FREAK. */

const SPRITE_ROOT = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites';
const SHOWDOWN_ROOT = 'https://play.pokemonshowdown.com/sprites';
const crystalSprite = id => `${SPRITE_ROOT}/pokemon/versions/generation-ii/crystal/${id}.png`;
const crystalBackSprite = id => `${SPRITE_ROOT}/pokemon/versions/generation-ii/crystal/back/${id}.png`;
const defaultSprite = id => `${SPRITE_ROOT}/pokemon/${id}.png`;
const itemSprite = slug => `${SPRITE_ROOT}/items/${slug}.png`;
const trainerSprite = slug => `${SHOWDOWN_ROOT}/trainers/${slug}.png`;
const showdownPokemonSprite = slug => `${SHOWDOWN_ROOT}/gen2/${slug}.png`;
const showdownPokemonBackSprite = slug => `${SHOWDOWN_ROOT}/gen2-back/${slug}.png`;
const typeIcon = type => `${SHOWDOWN_ROOT}/types/${type}.png`;


const TYPES = {
  normal: { label: 'Normal', color: '#b8b8a8' }, fire: { label: 'Fogo', color: '#f08030' }, water: { label: 'Água', color: '#6890f0' },
  grass: { label: 'Grama', color: '#78c850' }, electric: { label: 'Elétrico', color: '#f8d030' }, bug: { label: 'Inseto', color: '#a8b820' },
  poison: { label: 'Veneno', color: '#a040a0' }, flying: { label: 'Voador', color: '#a890f0' }, ground: { label: 'Terra', color: '#e0c068' },
  rock: { label: 'Pedra', color: '#b8a038' }, psychic: { label: 'Psíquico', color: '#f85888' }, ghost: { label: 'Fantasma', color: '#705898' },
  dragon: { label: 'Dragão', color: '#7038f8' }, fighting: { label: 'Lutador', color: '#c03028' }
};

const TYPE_CHART = {
  fire: { grass: 2, bug: 2, water: .5, rock: .5, fire: .5, dragon: .5 },
  water: { fire: 2, rock: 2, ground: 2, water: .5, grass: .5, dragon: .5 },
  grass: { water: 2, rock: 2, ground: 2, fire: .5, grass: .5, poison: .5, flying: .5, bug: .5, dragon: .5 },
  electric: { water: 2, flying: 2, grass: .5, electric: .5, dragon: .5, ground: 0 },
  ground: { fire: 2, electric: 2, poison: 2, rock: 2, grass: .5, bug: .5, flying: 0 },
  rock: { fire: 2, bug: 2, flying: 2, fighting: .5, ground: .5 },
  psychic: { fighting: 2, poison: 2, psychic: .5 },
  ghost: { ghost: 2, psychic: 2, normal: 0 },
  bug: { grass: 2, psychic: 2, fire: .5, fighting: .5, poison: .5, flying: .5, ghost: .5 },
  flying: { grass: 2, bug: 2, fighting: 2, electric: .5, rock: .5 },
  fighting: { normal: 2, rock: 2, psychic: .5, poison: .5, flying: .5, bug: .5, ghost: 0 }
};

const MOVES = {
  tackle: { name: 'Investida', type: 'normal', power: 40, pp: 35, acc: 95, fx: 'hit' },
  scratch: { name: 'Arranhão', type: 'normal', power: 40, pp: 35, acc: 100, fx: 'slash' },
  growl: { name: 'Rosnar', type: 'normal', power: 0, pp: 40, acc: 100, stat: { atk: -1 }, fx: 'debuff' },
  tailwhip: { name: 'Chicote', type: 'normal', power: 0, pp: 30, acc: 100, stat: { def: -1 }, fx: 'debuff' },
  quickattack: { name: 'Ataque Rápido', type: 'normal', power: 40, pp: 30, acc: 100, priority: 1, fx: 'dash' },
  ember: { name: 'Brasas', type: 'fire', power: 40, pp: 25, acc: 100, statusChance: { burn: .12 }, fx: 'fire' },
  watergun: { name: 'Jato d’Água', type: 'water', power: 40, pp: 25, acc: 100, fx: 'water' },
  vinewhip: { name: 'Chicote Cipó', type: 'grass', power: 45, pp: 25, acc: 100, fx: 'grass' },
  thundershock: { name: 'Choque', type: 'electric', power: 40, pp: 30, acc: 100, fx: 'spark' },
  gust: { name: 'Ventania', type: 'flying', power: 40, pp: 35, acc: 100, fx: 'wind' },
  peck: { name: 'Bicada', type: 'flying', power: 35, pp: 35, acc: 100, fx: 'hit' },
  poisonsting: { name: 'Ferrão', type: 'poison', power: 20, pp: 35, acc: 100, statusChance: { poison: .25 }, fx: 'poison' },
  leechlife: { name: 'Sugar Vida', type: 'bug', power: 35, pp: 15, acc: 100, drain: .5, fx: 'bug' },
  bite: { name: 'Mordida', type: 'normal', power: 60, pp: 25, acc: 100, fx: 'bite' },
  rockthrow: { name: 'Pedrada', type: 'rock', power: 50, pp: 15, acc: 90, fx: 'rock' },
  magnitude: { name: 'Magnitude', type: 'ground', power: 60, pp: 15, acc: 100, variable: true, fx: 'quake' },
  confusion: { name: 'Confusão', type: 'psychic', power: 50, pp: 25, acc: 100, fx: 'psychic' },
  lick: { name: 'Lambida', type: 'ghost', power: 30, pp: 30, acc: 100, fx: 'ghost' },
  twister: { name: 'Twister', type: 'dragon', power: 40, pp: 20, acc: 100, fx: 'wind' },
  splash: { name: 'Splash', type: 'normal', power: 0, pp: 40, acc: 100, fx: 'none' }
};

const LEARNSETS = {
  bulbasaur: [[1,'tackle'],[3,'growl'],[7,'vinewhip'],[12,'poisonsting']],
  charmander: [[1,'scratch'],[3,'growl'],[7,'ember'],[12,'bite']],
  squirtle: [[1,'tackle'],[3,'tailwhip'],[7,'watergun'],[12,'bite']],
  pidgey: [[1,'tackle'],[5,'gust'],[9,'quickattack']],
  rattata: [[1,'tackle'],[4,'tailwhip'],[8,'quickattack'],[13,'bite']],
  caterpie: [[1,'tackle']], weedle: [[1,'poisonsting']], pikachu: [[1,'quickattack'],[5,'growl'],[8,'thundershock']],
  oddish: [[1,'tackle'],[6,'growl'],[9,'vinewhip'],[14,'poisonsting']], bellsprout: [[1,'vinewhip'],[4,'growth'],[10,'poisonsting']],
  zubat: [[1,'leechlife'],[6,'bite']], geodude: [[1,'tackle'],[6,'rockthrow'],[12,'magnitude']], abra: [[1,'confusion']],
  magikarp: [[1,'splash'],[15,'tackle']], tentacool: [[1,'poisonsting'],[6,'watergun']], gastly: [[1,'lick'],[8,'confusion']],
  eevee: [[1,'tackle'],[5,'tailwhip'],[10,'quickattack'],[14,'bite']], dratini: [[1,'tackle'],[8,'twister']], onix: [[1,'tackle'],[9,'rockthrow']]
};
MOVES.growth = { name: 'Crescimento', type: 'normal', power: 0, pp: 20, acc: 100, stat: { atk: 1 }, fx: 'buff' };

const DEX = {
  bulbasaur: { id: 1, name: 'Bulbasaur', types: ['grass','poison'], catchRate: 45, exp: 64, base: { hp:45, atk:49, def:49, spd:45 }, evo: { level:16, to:'ivysaur' }, habitat: 'Inicial' },
  ivysaur: { id: 2, name: 'Ivysaur', types: ['grass','poison'], catchRate: 45, exp: 142, base: { hp:60, atk:62, def:63, spd:60 }, habitat: 'Evolução' },
  charmander: { id: 4, name: 'Charmander', types: ['fire'], catchRate: 45, exp: 62, base: { hp:39, atk:52, def:43, spd:65 }, evo: { level:16, to:'charmeleon' }, habitat: 'Inicial' },
  charmeleon: { id: 5, name: 'Charmeleon', types: ['fire'], catchRate: 45, exp: 142, base: { hp:58, atk:64, def:58, spd:80 }, habitat: 'Evolução' },
  squirtle: { id: 7, name: 'Squirtle', types: ['water'], catchRate: 45, exp: 63, base: { hp:44, atk:48, def:65, spd:43 }, evo: { level:16, to:'wartortle' }, habitat: 'Inicial' },
  wartortle: { id: 8, name: 'Wartortle', types: ['water'], catchRate: 45, exp: 142, base: { hp:59, atk:63, def:80, spd:58 }, habitat: 'Evolução' },
  pidgey: { id: 16, name: 'Pidgey', types: ['normal','flying'], catchRate: 255, exp: 50, base: { hp:40, atk:45, def:40, spd:56 }, habitat: 'Rota 01, Clareira' },
  rattata: { id: 19, name: 'Rattata', types: ['normal'], catchRate: 255, exp: 51, base: { hp:30, atk:56, def:35, spd:72 }, habitat: 'Rota 01, Porto' },
  caterpie: { id: 10, name: 'Caterpie', types: ['bug'], catchRate: 255, exp: 39, base: { hp:45, atk:30, def:35, spd:45 }, habitat: 'Bosque Baixo' },
  weedle: { id: 13, name: 'Weedle', types: ['bug','poison'], catchRate: 255, exp: 39, base: { hp:40, atk:35, def:30, spd:50 }, habitat: 'Bosque Baixo' },
  pikachu: { id: 25, name: 'Pikachu', types: ['electric'], catchRate: 190, exp: 112, base: { hp:35, atk:55, def:40, spd:90 }, habitat: 'Bosque Baixo, raro' },
  oddish: { id: 43, name: 'Oddish', types: ['grass','poison'], catchRate: 255, exp: 64, base: { hp:45, atk:50, def:55, spd:30 }, habitat: 'Bosque Baixo' },
  bellsprout: { id: 69, name: 'Bellsprout', types: ['grass','poison'], catchRate: 255, exp: 60, base: { hp:50, atk:75, def:35, spd:40 }, habitat: 'Rota 02' },
  zubat: { id: 41, name: 'Zubat', types: ['poison','flying'], catchRate: 255, exp: 49, base: { hp:40, atk:45, def:35, spd:55 }, habitat: 'Gruta Nox' },
  geodude: { id: 74, name: 'Geodude', types: ['rock','ground'], catchRate: 255, exp: 60, base: { hp:40, atk:80, def:100, spd:20 }, habitat: 'Gruta Nox' },
  abra: { id: 63, name: 'Abra', types: ['psychic'], catchRate: 200, exp: 62, base: { hp:25, atk:20, def:15, spd:90 }, habitat: 'Bosque Baixo, raro' },
  magikarp: { id: 129, name: 'Magikarp', types: ['water'], catchRate: 255, exp: 40, base: { hp:20, atk:10, def:55, spd:80 }, habitat: 'Costa Nox' },
  tentacool: { id: 72, name: 'Tentacool', types: ['water','poison'], catchRate: 190, exp: 67, base: { hp:40, atk:40, def:35, spd:70 }, habitat: 'Costa Nox' },
  gastly: { id: 92, name: 'Gastly', types: ['ghost','poison'], catchRate: 190, exp: 95, base: { hp:30, atk:35, def:30, spd:80 }, habitat: 'Farol, noite' },
  eevee: { id: 133, name: 'Eevee', types: ['normal'], catchRate: 45, exp: 65, base: { hp:55, atk:55, def:50, spd:55 }, habitat: 'Mirante, raro' },
  dratini: { id: 147, name: 'Dratini', types: ['dragon'], catchRate: 45, exp: 60, base: { hp:41, atk:64, def:45, spd:50 }, habitat: 'Costa Nox, raro' },
  sandshrew: { id: 27, name: 'Sandshrew', types: ['ground'], catchRate: 255, exp: 60, base: { hp:50, atk:75, def:85, spd:40 }, habitat: 'Rota 02' },
  onix: { id: 95, name: 'Onix', types: ['rock','ground'], catchRate: 45, exp: 77, base: { hp:35, atk:45, def:160, spd:70 }, habitat: 'Gruta Nox, raro' }
};

const ITEMS = {
  pokeball: { name: 'Poké Ball', icon: itemSprite('poke-ball'), desc: 'Uma cápsula para capturar Pokémon selvagens.', price: 200, catch: 1 },
  greatball: { name: 'Great Ball', icon: itemSprite('great-ball'), desc: 'Uma Ball melhor, com taxa de captura superior.', price: 600, catch: 1.5 },
  potion: { name: 'Poção', icon: itemSprite('potion'), desc: 'Restaura 20 HP de um Pokémon.', price: 300, heal: 20 },
  superpotion: { name: 'Super Poção', icon: itemSprite('super-potion'), desc: 'Restaura 50 HP de um Pokémon.', price: 700, heal: 50 },
  antidote: { name: 'Antídoto', icon: itemSprite('antidote'), desc: 'Cura envenenamento.', price: 100, cure: 'poison' },
  burnheal: { name: 'Anti-Queimadura', icon: itemSprite('burn-heal'), desc: 'Cura queimadura.', price: 250, cure: 'burn' },
  repel: { name: 'Repelente', icon: itemSprite('repel'), desc: 'Reduz encontros por 80 passos.', price: 350, repel: 80 },
  escape: { name: 'Corda de Fuga', icon: itemSprite('escape-rope'), desc: 'Sai de cavernas e volta para a entrada.', price: 550, escape: true },
  oldrod: { name: 'Vara Velha', icon: itemSprite('old-rod'), desc: 'Permite pescar em pontos de água.', key: true },
  dex: { name: 'Veyra Dex', icon: itemSprite('poke-dex'), desc: 'Registra Pokémon vistos e capturados.', key: true }
};

const TILE = {
  '.': { kind:'floor', solid:false }, ',': { kind:'grass-light', solid:false }, 'g': { kind:'grass', solid:false, encounter:true },
  '#': { kind:'wall', solid:true }, 'T': { kind:'tree', solid:true }, 'w': { kind:'water', solid:true, water:true },
  'p': { kind:'path', solid:false }, '=': { kind:'bridge', solid:false }, 'd': { kind:'door', solid:false },
  's': { kind:'sign', solid:true }, 'b': { kind:'bed', solid:true }, 'c': { kind:'counter', solid:true }, 'r': { kind:'rug', solid:false },
  'm': { kind:'machine', solid:true }, 'h': { kind:'house', solid:true }, 'l': { kind:'ledge', solid:true }, 'o': { kind:'rock', solid:true },
  'x': { kind:'dark', solid:false }, 'f': { kind:'flower', solid:false }
};

const mapRows = txt => txt.trim().split('\n').map(row => row.replace(/\r/g, ''));

const MAPS = {
  bedroom: {
    name: 'Seu quarto', type: 'interior', music:'home', spawn: { x: 7, y: 7 },
    rows: mapRows(`
##############
#............#
#..bbbb..mm..#
#..bbbb......#
#............#
#....rrr.....#
#....rrr.....#
#............#
#......d.....#
##############`),
    warps: [{ x:6,y:8,to:'home',tx:6,ty:7 },{ x:7,y:8,to:'home',tx:7,ty:7 }],
    npcs: [],
    signs: [{x:10,y:2,text:'PC antigo. Na tela: “Salvar no cartucho? Sim/Não”.'}]
  },
  home: {
    name: 'Casa', type: 'interior', music:'home', spawn: { x: 6, y: 7 },
    rows: mapRows(`
##############
#............#
#..cc........#
#............#
#....rrr.....#
#....rrr.....#
#............#
#.....dd.....#
##############`),
    warps: [{ x:5,y:7,to:'cove',tx:7,ty:10 },{ x:6,y:7,to:'cove',tx:7,ty:10 },{ x:7,y:7,to:'bedroom',tx:7,ty:7 }],
    npcs: [{ id:'mom', role:'mom', name:'Mãe', x:3,y:5, face:'down', lines:['Você acordou cedo hoje.','O professor deixou recado no laboratório.','Depois de receber seu parceiro, volte aqui. Tenho algo para sua jornada.'], afterFlag:'starterChosen', afterLines:['Agora sim. Leve esta Poção. E não corra dentro de grutas.'], gift:{ item:'potion', qty:1, once:'momPotion' } }]
  },
  cove: {
    name: 'Cove', type:'town', music:'cove', spawn: { x: 7, y: 10 },
    rows: mapRows(`
TTTTTTTTTTTTTTTTTTTTTTTT
T,,,,,,,,,,,,,,,,,,,,,,T
T,,hhhhh,,,,,,hhhhhh,,,T
T,,hhhhh,,,,,,hhhhhh,,,T
T,,hhhhh,,pp,,hhhhhh,,,T
T,,,,,,,,,pp,,,,,,,,,,,T
T,,ffff,,pppp,,ffff,,,,T
T,,ffff,,pppp,,ffff,,,,T
T,,,,,,,,,pp,,,,,,,,,,,T
T,,hhhhh,,pp,,hhhhhh,,,T
T,,hhhhh,,pp,,hhhhhh,,,T
T,,hhhhh,,pp,,hhhhhh,,,T
T,,,,,,,,,pp,,,,,,,,,,,T
T,,,,,,,,,pp,,,,,,,,,,,T
T,,,,,,,,,pp,,,,,,,,,,,T
TTTTTTTTTppTTTTTTTTTTTT
TTTTTTTTTppTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTTTTTTTT`),
    warps: [
      { x:7,y:4,to:'home',tx:6,ty:7 },
      { x:16,y:4,to:'lab',tx:7,ty:10 },
      { x:9,y:16,to:'route1',tx:9,ty:1 },{ x:10,y:16,to:'route1',tx:10,ty:1 }
    ],
    exits: [{ at:{x:9,y:16}, lockedFlag:'starterChosen', lockText:'Sem um Pokémon, é perigoso sair da vila.' }],
    npcs: [
      { id:'oldman', role:'npc', name:'Senhor', x:5,y:8, face:'right', lines:['Cove é pequena, mas todo treinador começa em algum lugar.','Ande pela grama alta com cuidado. Nem todo encontro é justo.'] },
      { id:'girl', role:'npc', name:'Lia', x:17,y:8, face:'left', lines:['Dizem que um Pikachu aparece quando as flores tremem no bosque.','Não é comum. Mas acontece.'] }
    ],
    signs: [{x:11,y:7,text:'COVE — vila inicial da Região Veyra.'}]
  },
  lab: {
    name: 'Lab. Aroeira', type:'interior', music:'lab', spawn: {x:7,y:10},
    rows: mapRows(`
################
#....mmmmmm....#
#....m....m....#
#..............#
#..cc......cc..#
#..cc......cc..#
#..............#
#.....rrrr.....#
#.....rrrr.....#
#..............#
#......dd......#
################`),
    warps: [{x:6,y:10,to:'cove',tx:16,ty:5},{x:7,y:10,to:'cove',tx:16,ty:5}],
    npcs: [
      { id:'prof', role:'professor', name:'Prof. Aroeira', x:7,y:4, face:'down', script:'professorIntro' },
      { id:'rivalLab', role:'rival', name:'Niko', x:10,y:8, face:'left', flag:'starterChosen', lines:['Escolheu mesmo esse? Boa.','Me encontra na Rota 01 quando parar de apertar todos os botões.'] }
    ],
    signs: [{x:4,y:1,text:'Pesquisas de campo: maré, neblina e adaptação de espécies.'}]
  },
  route1: {
    name: 'Rota 01', type:'route', music:'route', spawn:{x:9,y:1}, minSteps:34,
    rows: mapRows(`
TTTTTTTTTppTTTTTTTTTTTT
T,,,,,,,,pp,,,,,,,,,,,,T
T,,gggg,,pp,,gggggg,,,T
T,,gggg,,pp,,gggggg,,,T
T,,,,,,,,pp,,,,,,,,,,,,T
T,,ffff,,pppp,,ffff,,,T
T,,,,,,,,,,pp,,,,,,,,,,T
T,,gggggg,,pp,,gggg,,,T
T,,gggggg,,pp,,gggg,,,T
T,,,,,,,,,,pp,,,,,,,,,,T
T,,oooo,,,,pp,,,,,,,,,,T
T,,oooo,,,,pp,,gggggg,T
T,,,,,,,,,,pp,,gggggg,T
T,,,,,,,,,,pp,,,,,,,,,,T
T,,,,,,pppppppp,,,,,,,,T
T,,,,,,pp,,,,pp,,,,,,,,T
TTTTTTTppTTTTppTTTTTTTT
TTTTTTTppTTTTppTTTTTTTT`),
    warps: [{x:9,y:0,to:'cove',tx:9,ty:15},{x:10,y:0,to:'cove',tx:10,ty:15},{x:7,y:17,to:'forest',tx:7,ty:1},{x:14,y:17,to:'noxport',tx:8,ty:1}],
    encounters: [{mon:'pidgey',min:2,max:5,w:38},{mon:'rattata',min:2,max:5,w:34},{mon:'caterpie',min:3,max:5,w:16},{mon:'weedle',min:3,max:5,w:12}],
    npcs: [
      { id:'rivalRoute1', role:'rival', name:'Niko', x:12,y:5, face:'left', trainer:true, team:[{mon:'rattata',level:5},{mon:'pidgey',level:5}], reward:320, before:['Você demorou. Vamos ver se seu parceiro aguenta uma batalha de verdade.'], after:['Nada mal. Mas na próxima eu não vou economizar golpe.'], flag:'rival1Defeated' },
      { id:'bugKid', role:'npc', name:'Téo', x:4,y:12, face:'right', trainer:true, team:[{mon:'caterpie',level:4},{mon:'weedle',level:4}], reward:180, before:['Eu conto passos até achar Pokémon. Quer testar minha teoria?'], after:['Minha teoria precisa de mais dados.'], flag:'bugKidDefeated' }
    ],
    items: [{ id:'r1ball', item:'pokeball', qty:1, x:18,y:12 }, { id:'r1repel', item:'repel', qty:1, x:3,y:2 }],
    signs: [{x:12,y:14,text:'Rota 01 — Cove ao norte, Bosque Baixo ao sul.'}]
  },
  forest: {
    name:'Bosque Baixo', type:'forest', music:'forest', spawn:{x:7,y:1}, minSteps:42,
    rows: mapRows(`
TTTTTTTppTTTTTTTTTTTTTT
TggggggppgggggggggggggT
TgTTTggppggTTTTggTTTggT
TgT,TggppggT,,TggT,TggT
TgT,TggppggT,,TggT,TggT
TgT,TggppggT,,TggT,TggT
TggggggppgggggggggggggT
TggTTTTppppppTTTTTTgggT
TggT,,,,,,,,,,,,,,TgggT
TggT,gggggggggggg,TgggT
TggT,ggTTTTTTgggg,TgggT
TggT,ggT,,,,Tgggg,TgggT
TggT,ggT,ff,Tgggg,TgggT
TggT,ggT,,,,Tgggg,TgggT
TggT,ggTTTTTTgggg,TgggT
TggT,gggggggggggg,TgggT
TggTTTTTTTTTTTTTTTggggT
TgggggggggggggggggggggT
TTTTTTTTTTppTTTTTTTTTTT
TTTTTTTTTTppTTTTTTTTTTT`),
    warps: [{x:7,y:0,to:'route1',tx:7,ty:16},{x:10,y:19,to:'cave',tx:5,ty:1},{x:11,y:19,to:'cave',tx:6,ty:1}],
    encounters: [{mon:'caterpie',min:4,max:7,w:28},{mon:'weedle',min:4,max:7,w:24},{mon:'oddish',min:5,max:8,w:23},{mon:'pidgey',min:4,max:7,w:12},{mon:'pikachu',min:6,max:8,w:8},{mon:'abra',min:7,max:8,w:5}],
    npcs: [
      { id:'picnic', role:'npc', name:'Mara', x:17,y:8, face:'left', trainer:true, team:[{mon:'oddish',level:7},{mon:'pidgey',level:7}], reward:420, before:['O bosque parece calmo, mas ele pune pressa.'], after:['Você presta atenção no ritmo da luta. Gosto disso.'], flag:'picnicDefeated' }
    ],
    items: [{ id:'forestPotion', item:'potion', qty:1, x:11,y:12 }, { id:'forestGreat', item:'greatball', qty:1, x:3,y:17 }],
    signs: [{x:12,y:18,text:'Bosque Baixo — saída para Gruta Nox.'}]
  },
  cave: {
    name:'Gruta Nox', type:'cave', music:'cave', spawn:{x:5,y:1}, minSteps:48,
    rows: mapRows(`
oooooooooooooooooooo
oxxxxppxxxxxxxxxxxo
oxxxoppxxooooxxxxxo
oxxxoppxxxxoxxxxxxo
oxxxoppppppoxxxooox
oxxxoxxxxxppxxxoxxo
oxxxoxxxxxppxxxoxxo
oxxoooxxxxppxxxoxxo
oxxxxxxxxppppppoxxo
oxxxoooxxppxxxxoxxo
oxxxoxxxxppxxxxoxxo
oxxxoxxxppppxxxxxxo
oxxxoxxxppxoooooxxo
oxxxxxxxppxxxxxxxxo
oooooooooppoooooooo
oooooooooppoooooooo`),
    warps: [{x:5,y:0,to:'forest',tx:10,ty:18},{x:6,y:0,to:'forest',tx:11,ty:18},{x:9,y:15,to:'coast',tx:8,ty:1},{x:10,y:15,to:'coast',tx:9,ty:1}],
    encounters: [{mon:'zubat',min:6,max:10,w:45},{mon:'geodude',min:7,max:10,w:35},{mon:'sandshrew',min:8,max:10,w:12},{mon:'onix',min:9,max:11,w:8}],
    npcs: [{ id:'hiker', role:'npc', name:'Breno', x:6,y:8, face:'right', trainer:true, team:[{mon:'geodude',level:9},{mon:'zubat',level:8}], reward:560, before:['Se sua barra de HP cai rápido demais, treine antes de forçar caminho.'], after:['Boa leitura de tipo. Isso ganha ginásio.'], flag:'hikerDefeated' }],
    items: [{ id:'caveEscape', item:'escape', qty:1, x:16,y:13 }, { id:'caveAntidote', item:'antidote', qty:1, x:14,y:4 }]
  },
  coast: {
    name:'Costa Nox', type:'coast', music:'coast', spawn:{x:8,y:1}, minSteps:38,
    rows: mapRows(`
TTTTTTTTppTTTTTTTTTTTT
T,,,,,,pp,,,,,,,,,,,,T
T,,ffffppffff,,,,,,,,T
T,,,,,,pp,,,,,,,,,,,,T
T,,,,,,pppppppp,,,,,,T
T,,,,,,,,,,,,pp,,,,,,T
T,wwwwwww,,,,pp,,wwwwT
T,wwwwwww,,,,pp,,wwwwT
T,wwwwwww,,,,pp,,wwwwT
T,,,,,,,,,,,,pp,,,,,,T
T,,gggggg,,,,pp,gggg,T
T,,gggggg,,,,pp,gggg,T
T,,,,,,,,,,,,pp,,,,,,T
T,,,,,,,pppppp,,,,,,,T
TTTTTTTTppTTTTTTTTTTT
TTTTTTTTppTTTTTTTTTTT`),
    warps: [{x:8,y:0,to:'cave',tx:9,ty:14},{x:9,y:0,to:'cave',tx:10,ty:14},{x:8,y:15,to:'noxport',tx:8,ty:1},{x:9,y:15,to:'noxport',tx:9,ty:1}],
    encounters: [{mon:'pidgey',min:8,max:11,w:24},{mon:'rattata',min:8,max:11,w:20},{mon:'tentacool',min:8,max:12,w:20},{mon:'magikarp',min:5,max:10,w:24},{mon:'dratini',min:9,max:11,w:4}],
    npcs: [{ id:'fisher', role:'npc', name:'Nilo', x:15,y:9, face:'left', trainer:true, team:[{mon:'magikarp',level:8},{mon:'tentacool',level:10}], reward:600, before:['O mar ensina paciência. A batalha também.'], after:['Você fisgou minha estratégia.'], flag:'fisherDefeated' }],
    items: [{ id:'coastRod', item:'oldrod', qty:1, x:4,y:5, key:true }],
    signs: [{x:11,y:13,text:'Costa Nox — Noxport ao sul.'}]
  },
  noxport: {
    name:'Noxport', type:'town', music:'noxport', spawn:{x:8,y:1},
    rows: mapRows(`
TTTTTTTTppTTTTTTTTTTTT
T,,,,,,pp,,,,,,,,,,,,T
T,,hhhhpphhh,,,hhhh,,T
T,,hhhhpphhh,,,hhhh,,T
T,,,,,,pp,,,,,,,,,,,,T
T,,ffffppffff,,,ff,,,T
T,,,,,,pppppppppp,,,,T
T,,,,,,,,,,,,,,pp,,,,T
T,,hhhh,,,,hhhhpp,,,,T
T,,hhhh,,,,hhhhpp,,,,T
T,,,,,,,,,,,,,,pp,,,,T
T,,hhhh,,,,,,,ppp,,,,T
T,,hhhh,,,,,,,pp,,,,,T
T,,,,,,,,,,,,ppp,,,,,T
TTTTTTTTTTTTTppTTTTTT
TTTTTTTTTTTTTppTTTTTT`),
    warps: [{x:8,y:0,to:'coast',tx:8,ty:14},{x:9,y:0,to:'coast',tx:9,ty:14},{x:14,y:15,to:'gym',tx:7,ty:10}],
    npcs: [
      { id:'nurseOutside', role:'nurse', name:'Enfermeira', x:4,y:7, face:'right', script:'heal' },
      { id:'seller', role:'shopkeeper', name:'Loja', x:16,y:7, face:'left', script:'shop' },
      { id:'sailorTip', role:'npc', name:'Marinheiro', x:6,y:12, face:'right', lines:['O líder do farol usa Pokémon de pedra e água.','Não entre com equipe ferida só porque o botão está brilhando.'] }
    ],
    signs: [{x:12,y:6,text:'NOXPORT — porto, farol e primeiro ginásio.'}]
  },
  gym: {
    name:'Ginásio Noxport', type:'gym', music:'gym', spawn:{x:7,y:10},
    rows: mapRows(`
################
#..............#
#....oooooo....#
#....o....o....#
#....o....o....#
#....oooooo....#
#..............#
#...rrrrrrrr...#
#...rrrrrrrr...#
#..............#
#......dd......#
################`),
    warps: [{x:6,y:10,to:'noxport',tx:14,ty:14},{x:7,y:10,to:'noxport',tx:14,ty:14}],
    npcs: [
      { id:'gymGuide', role:'npc', name:'Guia', x:3,y:8, face:'right', lines:['O layout é simples. A luta não.','Use status, cure no momento certo e olhe o tipo antes de atacar.'] },
      { id:'leader', role:'rival', name:'Líder Kael', x:8,y:3, face:'down', trainer:true, boss:true, team:[{mon:'geodude',level:12},{mon:'tentacool',level:12},{mon:'onix',level:14}], reward:1200, before:['Eu guardo a luz do farol. Mostre que sabe atravessar a neblina.'], after:['Você não só venceu. Você leu a batalha. Leve a Insígnia Beacon.'], flag:'beaconBadge' }
    ]
  }
};

const STARTERS = [
  { mon:'bulbasaur', level:5, text:'calmo, resistente e bom para controlar lutas longas.' },
  { mon:'charmander', level:5, text:'rápido, agressivo e perigoso quando acerta primeiro.' },
  { mon:'squirtle', level:5, text:'seguro, defensivo e forte contra caminhos de pedra.' }
];

const TRAINER_LOOK = {
  hero: { body:'#2f65ff', hair:'#263238', hat:'#e84242', sprite: trainerSprite('ethan-gen2') },
  npc:{ body:'#43a047', hair:'#5d4037', sprite: trainerSprite('youngster-gen2') },
  professor:{ body:'#f8f8f8', hair:'#8d6e63', sprite: trainerSprite('oak-gen2') },
  mom:{ body:'#f06292', hair:'#5d4037', sprite: trainerSprite('beauty-gen2') },
  rival:{ body:'#f57c00', hair:'#263238', sprite: trainerSprite('blue-gen2') },
  nurse:{ body:'#ef5350', hair:'#795548', sprite: trainerSprite('nurse') },
  shopkeeper:{ body:'#7e57c2', hair:'#263238', sprite: trainerSprite('clerk') }
};

const ASSET_CREDITS = {
  pokemon: 'PokeAPI/sprites — sprites de Pokémon e itens carregados via GitHub.',
  trainers: 'Sprites locais de overworld criados para este projeto; retratos remotos auxiliares vêm do Pokémon Showdown quando online.',
  note: 'Uso fã, gratuito e não comercial. Pokémon e marcas pertencem à Nintendo, The Pokémon Company, Creatures Inc. e GAME FREAK.'
};

window.VEYRA_DATA = { SPRITE_ROOT, SHOWDOWN_ROOT, crystalSprite, crystalBackSprite, defaultSprite, itemSprite, trainerSprite, showdownPokemonSprite, showdownPokemonBackSprite, typeIcon, TYPES, TYPE_CHART, MOVES, LEARNSETS, DEX, ITEMS, TILE, MAPS, STARTERS, TRAINER_LOOK, ASSET_CREDITS };
