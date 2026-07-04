const SPRITE_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites";

const itemIcon = file => `${SPRITE_ROOT}/items/${file}.png`;
const monFront = id => `${SPRITE_ROOT}/pokemon/versions/generation-ii/crystal/${id}.png`;
const monBack = id => `${SPRITE_ROOT}/pokemon/versions/generation-ii/crystal/back/${id}.png`;
const monFallback = id => `${SPRITE_ROOT}/pokemon/${id}.png`;

const TYPES = {
  normal: "Normal", fire: "Fogo", water: "Água", grass: "Grama", electric: "Elétrico", dragon: "Dragão",
  flying: "Voador", poison: "Veneno", bug: "Inseto", rock: "Pedra", ground: "Terra",
  psychic: "Psíquico", ghost: "Fantasma"
};

const TYPE_CHART = {
  normal: { rock: .5, ghost: 0 },
  fire: { grass: 2, bug: 2, fire: .5, water: .5, rock: .5 },
  water: { fire: 2, rock: 2, ground: 2, water: .5, grass: .5 },
  grass: { water: 2, rock: 2, ground: 2, fire: .5, grass: .5, poison: .5, flying: .5, bug: .5 },
  electric: { water: 2, flying: 2, electric: .5, grass: .5, ground: 0 },
  flying: { grass: 2, bug: 2, electric: .5, rock: .5 },
  poison: { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5 },
  bug: { grass: 2, psychic: 2, fire: .5, flying: .5, poison: .5, ghost: .5 },
  rock: { fire: 2, flying: 2, bug: 2, ground: .5 },
  ground: { fire: 2, electric: 2, poison: 2, rock: 2, grass: .5, bug: .5, flying: 0 },
  psychic: { poison: 2, psychic: .5 },
  ghost: { ghost: 2, normal: 0, psychic: 0 },
  dragon: { dragon: 2 }
};

const MOVES = {
  tackle: { name: "Investida", type: "normal", power: 40, acc: 100, pp: 35, kind: "physical" },
  scratch: { name: "Arranhão", type: "normal", power: 40, acc: 100, pp: 35, kind: "physical" },
  growl: { name: "Rosnar", type: "normal", power: 0, acc: 100, pp: 40, effect: "atkDown" },
  tailWhip: { name: "Abanar Cauda", type: "normal", power: 0, acc: 100, pp: 30, effect: "defDown" },
  growth: { name: "Crescimento", type: "normal", power: 0, acc: 100, pp: 20, effect: "atkUp" },
  vineWhip: { name: "Chicote de Vinha", type: "grass", power: 45, acc: 100, pp: 25, kind: "physical" },
  ember: { name: "Brasa", type: "fire", power: 40, acc: 100, pp: 25, kind: "special", effectChance: .08, status: "burn" },
  waterGun: { name: "Jato d'Água", type: "water", power: 40, acc: 100, pp: 25, kind: "special" },
  gust: { name: "Tornado", type: "flying", power: 40, acc: 100, pp: 35, kind: "special" },
  quickAttack: { name: "Ataque Rápido", type: "normal", power: 40, acc: 100, pp: 30, priority: 1, kind: "physical" },
  thunderShock: { name: "Choque do Trovão", type: "electric", power: 40, acc: 100, pp: 30, kind: "special", effectChance: .1, status: "paralysis" },
  poisonSting: { name: "Ferrão Venenoso", type: "poison", power: 15, acc: 100, pp: 35, kind: "physical", effectChance: .25, status: "poison" },
  bite: { name: "Mordida", type: "normal", power: 60, acc: 100, pp: 25, kind: "physical" },
  rockThrow: { name: "Arremesso de Pedra", type: "rock", power: 50, acc: 90, pp: 15, kind: "physical" },
  confusion: { name: "Confusão", type: "psychic", power: 50, acc: 100, pp: 25, kind: "special" },
  absorb: { name: "Absorver", type: "grass", power: 20, acc: 100, pp: 25, kind: "special", drain: .5 },
  peck: { name: "Bicada", type: "flying", power: 35, acc: 100, pp: 35, kind: "physical" },
  mudSlap: { name: "Tapa de Lama", type: "ground", power: 20, acc: 100, pp: 20, kind: "special" },
  lick: { name: "Lambida", type: "ghost", power: 30, acc: 100, pp: 30, kind: "physical", effectChance: .15, status: "paralysis" }
};

const POKEMON = {
  1: { name: "Bulbasaur", types: ["grass", "poison"], base: { hp: 45, atk: 49, def: 49, spd: 45 }, catchRate: 45, exp: 64, learn: [[1,"tackle"], [3,"growl"], [7,"vineWhip"], [10,"poisonSting"], [13,"absorb"]] },
  2: { name: "Ivysaur", types: ["grass", "poison"], base: { hp: 60, atk: 62, def: 63, spd: 60 }, catchRate: 45, exp: 142, learn: [[1,"tackle"], [3,"growl"], [7,"vineWhip"], [10,"poisonSting"], [13,"absorb"]] },
  4: { name: "Charmander", types: ["fire"], base: { hp: 39, atk: 52, def: 43, spd: 65 }, catchRate: 45, exp: 62, learn: [[1,"scratch"], [3,"growl"], [7,"ember"], [10,"quickAttack"], [13,"bite"]] },
  5: { name: "Charmeleon", types: ["fire"], base: { hp: 58, atk: 64, def: 58, spd: 80 }, catchRate: 45, exp: 142, learn: [[1,"scratch"], [3,"growl"], [7,"ember"], [10,"quickAttack"], [13,"bite"]] },
  7: { name: "Squirtle", types: ["water"], base: { hp: 44, atk: 48, def: 65, spd: 43 }, catchRate: 45, exp: 63, learn: [[1,"tackle"], [3,"tailWhip"], [7,"waterGun"], [10,"bite"]] },
  8: { name: "Wartortle", types: ["water"], base: { hp: 59, atk: 63, def: 80, spd: 58 }, catchRate: 45, exp: 142, learn: [[1,"tackle"], [3,"tailWhip"], [7,"waterGun"], [10,"bite"]] },
  10: { name: "Caterpie", types: ["bug"], base: { hp: 45, atk: 30, def: 35, spd: 45 }, catchRate: 255, exp: 39, learn: [[1,"tackle"]] },
  11: { name: "Metapod", types: ["bug"], base: { hp: 50, atk: 20, def: 55, spd: 30 }, catchRate: 120, exp: 72, learn: [[1,"tackle"]] },
  12: { name: "Butterfree", types: ["bug", "flying"], base: { hp: 60, atk: 45, def: 50, spd: 70 }, catchRate: 45, exp: 178, learn: [[1,"tackle"], [10,"gust"], [12,"confusion"]] },
  13: { name: "Weedle", types: ["bug", "poison"], base: { hp: 40, atk: 35, def: 30, spd: 50 }, catchRate: 255, exp: 39, learn: [[1,"poisonSting"], [1,"tackle"]] },
  16: { name: "Pidgey", types: ["normal", "flying"], base: { hp: 40, atk: 45, def: 40, spd: 56 }, catchRate: 255, exp: 50, learn: [[1,"tackle"], [5,"gust"], [9,"quickAttack"]] },
  17: { name: "Pidgeotto", types: ["normal", "flying"], base: { hp: 63, atk: 60, def: 55, spd: 71 }, catchRate: 120, exp: 122, learn: [[1,"tackle"], [5,"gust"], [9,"quickAttack"]] },
  19: { name: "Rattata", types: ["normal"], base: { hp: 30, atk: 56, def: 35, spd: 72 }, catchRate: 255, exp: 51, learn: [[1,"tackle"], [4,"tailWhip"], [7,"quickAttack"], [12,"bite"]] },
  21: { name: "Spearow", types: ["normal", "flying"], base: { hp: 40, atk: 60, def: 30, spd: 70 }, catchRate: 255, exp: 52, learn: [[1,"peck"], [4,"growl"], [8,"quickAttack"]] },
  23: { name: "Ekans", types: ["poison"], base: { hp: 35, atk: 60, def: 44, spd: 55 }, catchRate: 255, exp: 58, learn: [[1,"tackle"], [4,"poisonSting"], [9,"bite"]] },
  25: { name: "Pikachu", types: ["electric"], base: { hp: 35, atk: 55, def: 40, spd: 90 }, catchRate: 190, exp: 112, learn: [[1,"tackle"], [5,"growl"], [7,"thunderShock"], [10,"quickAttack"]] },
  27: { name: "Sandshrew", types: ["ground"], base: { hp: 50, atk: 75, def: 85, spd: 40 }, catchRate: 255, exp: 60, learn: [[1,"scratch"], [6,"mudSlap"], [10,"poisonSting"]] },
  29: { name: "Nidoran♀", types: ["poison"], base: { hp: 55, atk: 47, def: 52, spd: 41 }, catchRate: 235, exp: 55, learn: [[1,"tackle"], [4,"growl"], [7,"poisonSting"], [11,"bite"]] },
  32: { name: "Nidoran♂", types: ["poison"], base: { hp: 46, atk: 57, def: 40, spd: 50 }, catchRate: 235, exp: 55, learn: [[1,"tackle"], [4,"growl"], [7,"poisonSting"], [11,"peck"]] },
  41: { name: "Zubat", types: ["poison", "flying"], base: { hp: 40, atk: 45, def: 35, spd: 55 }, catchRate: 255, exp: 49, learn: [[1,"tackle"], [6,"bite"], [10,"gust"]] },
  43: { name: "Oddish", types: ["grass", "poison"], base: { hp: 45, atk: 50, def: 55, spd: 30 }, catchRate: 255, exp: 64, learn: [[1,"absorb"], [5,"growl"], [9,"poisonSting"]] },
  46: { name: "Paras", types: ["bug", "grass"], base: { hp: 35, atk: 70, def: 55, spd: 25 }, catchRate: 190, exp: 57, learn: [[1,"scratch"], [5,"absorb"], [9,"poisonSting"]] },
  48: { name: "Venonat", types: ["bug", "poison"], base: { hp: 60, atk: 55, def: 50, spd: 45 }, catchRate: 190, exp: 61, learn: [[1,"tackle"], [6,"poisonSting"], [11,"confusion"]] },
  54: { name: "Psyduck", types: ["water"], base: { hp: 50, atk: 52, def: 48, spd: 55 }, catchRate: 190, exp: 64, learn: [[1,"scratch"], [5,"tailWhip"], [8,"waterGun"], [13,"confusion"]] },
  58: { name: "Growlithe", types: ["fire"], base: { hp: 55, atk: 70, def: 45, spd: 60 }, catchRate: 190, exp: 70, learn: [[1,"bite"], [6,"ember"], [10,"tackle"]] },
  60: { name: "Poliwag", types: ["water"], base: { hp: 40, atk: 50, def: 40, spd: 90 }, catchRate: 255, exp: 60, learn: [[1,"waterGun"], [5,"tailWhip"], [9,"mudSlap"]] },
  63: { name: "Abra", types: ["psychic"], base: { hp: 25, atk: 20, def: 15, spd: 90 }, catchRate: 200, exp: 62, learn: [[1,"confusion"]] },
  66: { name: "Machop", types: ["normal"], base: { hp: 70, atk: 80, def: 50, spd: 35 }, catchRate: 180, exp: 61, learn: [[1,"tackle"], [7,"quickAttack"], [11,"bite"]] },
  69: { name: "Bellsprout", types: ["grass", "poison"], base: { hp: 50, atk: 75, def: 35, spd: 40 }, catchRate: 255, exp: 60, learn: [[1,"vineWhip"], [5,"growth"], [8,"poisonSting"]] },
  74: { name: "Geodude", types: ["rock", "ground"], base: { hp: 40, atk: 80, def: 100, spd: 20 }, catchRate: 255, exp: 60, learn: [[1,"tackle"], [5,"rockThrow"], [9,"mudSlap"]] },
  92: { name: "Gastly", types: ["ghost", "poison"], base: { hp: 30, atk: 35, def: 30, spd: 80 }, catchRate: 190, exp: 62, learn: [[1,"lick"], [5,"confusion"], [10,"poisonSting"]] },
  95: { name: "Onix", types: ["rock", "ground"], base: { hp: 35, atk: 45, def: 160, spd: 70 }, catchRate: 45, exp: 77, learn: [[1,"tackle"], [6,"rockThrow"], [11,"mudSlap"]] },
  120: { name: "Staryu", types: ["water"], base: { hp: 30, atk: 45, def: 55, spd: 85 }, catchRate: 225, exp: 68, learn: [[1,"tackle"], [5,"waterGun"], [10,"quickAttack"]] },
  129: { name: "Magikarp", types: ["water"], base: { hp: 20, atk: 10, def: 55, spd: 80 }, catchRate: 255, exp: 40, learn: [[1,"tackle"]] },
  133: { name: "Eevee", types: ["normal"], base: { hp: 55, atk: 55, def: 50, spd: 55 }, catchRate: 45, exp: 65, learn: [[1,"tackle"], [5,"tailWhip"], [9,"quickAttack"], [13,"bite"]] },
  147: { name: "Dratini", types: ["dragon"], base: { hp: 41, atk: 64, def: 45, spd: 50 }, catchRate: 45, exp: 60, learn: [[1,"tackle"], [5,"growl"], [10,"quickAttack"], [15,"bite"]] }
};

const EVOLUTIONS = {
  1: { level: 16, to: 2 },
  4: { level: 16, to: 5 },
  7: { level: 16, to: 8 },
  10: { level: 7, to: 11 },
  11: { level: 10, to: 12 },
  16: { level: 18, to: 17 }
};

const ITEMS = {
  pokeBall: { name: "Poké Bola", price: 200, icon: itemIcon("poke-ball"), kind: "ball", catchBonus: 1 },
  greatBall: { name: "Grande Bola", price: 600, icon: itemIcon("great-ball"), kind: "ball", catchBonus: 1.45 },
  potion: { name: "Poção", price: 300, icon: itemIcon("potion"), kind: "heal", amount: 20 },
  superPotion: { name: "Super Poção", price: 700, icon: itemIcon("super-potion"), kind: "heal", amount: 50 },
  antidote: { name: "Antídoto", price: 100, icon: itemIcon("antidote"), kind: "status", cures: ["poison"] },
  paralyzeHeal: { name: "Anti-Paralisia", price: 200, icon: itemIcon("paralyze-heal"), kind: "status", cures: ["paralysis"] },
  escapeRope: { name: "Corda de Fuga", price: 550, icon: itemIcon("escape-rope"), kind: "field" },
  repel: { name: "Repelente", price: 350, icon: itemIcon("repel"), kind: "field" }
};

const LOCATIONS = {
  brisa: {
    name: "Cove", chapter: "Capítulo 1", kind: "town",
    text: "Vento salgado, casas baixas e o laboratório do Professor Aroeira perto da torre antiga.",
    exits: ["rota01"], services: ["home", "lab", "mart"], npcs: ["mae", "aroeira"]
  },
  rota01: {
    name: "Rota 01", chapter: "Capítulo 1", kind: "route", length: 4,
    text: "Gramado curto, placas baixas e grama alta nas laterais. A travessia leva alguns passos.",
    exits: ["brisa", "bosque"],
    wild: [[16,2,4,34], [19,2,4,34], [10,2,4,18], [13,3,4,14]],
    items: ["pokeBall", "potion"], trainers: ["niko1", "lia"], npcs: ["guardaRota"]
  },
  bosque: {
    name: "Amber Woods", chapter: "Capítulo 2", kind: "forest", length: 5,
    text: "Folhas antigas cobrem a trilha. A luz passa em blocos, como numa tela de Game Boy.",
    exits: ["rota01", "coral"],
    wild: [[10,4,6,25], [13,4,6,25], [46,5,7,18], [48,6,8,15], [25,5,7,7], [43,5,7,10]],
    items: ["antidote", "pokeBall", "repel"], trainers: ["tino", "nara"], npcs: ["batedora"]
  },
  coral: {
    name: "Coral City", chapter: "Capítulo 2", kind: "town",
    text: "Uma cidade costeira com cais antigo, ginásio pequeno e uma loja sempre cheia.",
    exits: ["bosque", "rota02"], services: ["center", "mart", "gymCoral"], npcs: ["pescadorCoral", "daraHint"]
  },
  rota02: {
    name: "Rota 02", chapter: "Capítulo 3", kind: "route", length: 5,
    text: "A estrada sobe em direção às pedras. O caminho é maior do que parece no mapa.",
    exits: ["coral", "gruta"],
    wild: [[21,7,10,24], [23,7,10,16], [29,7,10,18], [32,7,10,18], [43,7,10,16], [58,8,10,8]],
    items: ["potion", "superPotion", "paralyzeHeal"], trainers: ["caio", "mika"], npcs: ["corredorRota02"]
  },
  gruta: {
    name: "Lumen Cave", chapter: "Capítulo 3", kind: "cave", length: 6, requires: { badge: "coral", message: "O guarda libera a Lumen Cave só para quem venceu o Ginásio Coral." },
    text: "Pedras brilham no escuro. Cada sala da gruta pede atenção ao HP e ao PP.",
    exits: ["rota02", "cristal"],
    wild: [[41,9,12,30], [74,9,12,28], [95,10,13,9], [92,10,13,13], [27,9,11,20]],
    items: ["escapeRope", "superPotion"], trainers: ["bruno"], npcs: ["mineiro"]
  },
  cristal: {
    name: "Noxport", chapter: "Capítulo 4", kind: "town",
    text: "Faróis apagados, pedra molhada e um ginásio construído no velho cais.",
    exits: ["gruta", "lago"], services: ["center", "mart", "gymCrystal"], npcs: ["curadoraBeacon", "vitorHint"]
  },
  lago: {
    name: "North Reef", chapter: "Pós-jogo", kind: "lake", length: 5, requires: { badge: "crystal", message: "North Reef só abre depois da Insígnia Beacon." },
    text: "Água escura e mansa. A passagem avança por píeres quebrados e poças rasas.",
    exits: ["cristal", "mirante"],
    wild: [[60,12,16,30], [54,12,16,25], [120,14,17,16], [129,10,15,29]],
    items: ["superPotion", "pokeBall"], trainers: ["iris"], npcs: ["barqueiro"]
  },
  mirante: {
    name: "Mistpoint", chapter: "Pós-jogo", kind: "route", length: 6, requires: { badge: "crystal", message: "Mistpoint fica além da passagem liberada pela Insígnia Beacon." },
    text: "O mar some na neblina abaixo. A subida até o mirante exige preparo.",
    exits: ["lago"],
    wild: [[25,15,18,18], [58,15,18,18], [63,14,17,18], [133,16,18,8], [147,16,20,5], [17,16,19,33]],
    items: ["greatBall", "superPotion", "repel"], trainers: ["serena", "niko2"], npcs: ["pesquisadorNeblina"]
  }
};

const TRAINERS = {
  niko1: { name: "Niko", title: "Rival", money: 300, flag: "rival_niko_1", team: [[4,5]], line: "Não vou esperar você ficar pronto. Batalha agora." },
  lia: { name: "Lia", title: "Jovem Treinadora", money: 220, flag: "trainer_lia", team: [[16,4], [19,4]], line: "Vamos ver se seu primeiro parceiro aguenta." },
  tino: { name: "Tino", title: "Colecionador", money: 310, flag: "trainer_tino", team: [[10,6], [13,6], [46,7]], line: "Insetos também vencem batalha séria." },
  nara: { name: "Nara", title: "Escoteira", money: 350, flag: "trainer_nara", team: [[25,7]], line: "Se piscar, o choque chega primeiro." },
  caio: { name: "Caio", title: "Corredor", money: 420, flag: "trainer_caio", team: [[21,9], [27,10]], line: "Velocidade resolve muita coisa." },
  mika: { name: "Mika", title: "Criadora", money: 460, flag: "trainer_mika", team: [[29,9], [32,9], [43,10]], line: "Equipe equilibrada não depende de sorte." },
  bruno: { name: "Bruno", title: "Montanhista", money: 520, flag: "trainer_bruno", team: [[74,11], [95,12]], line: "Pedra contra pressa. Aposto na pedra." },
  iris: { name: "Iris", title: "Pescadora", money: 650, flag: "trainer_iris", team: [[54,15], [120,16]], line: "No lago, quem controla o ritmo vence." },
  serena: { name: "Serena", title: "Treinadora Ace", money: 980, flag: "trainer_serena", team: [[133,17], [25,18]], line: "Aqui em cima, só passa quem entende ritmo de equipe." },
  niko2: { name: "Niko", title: "Rival", money: 1200, flag: "rival_niko_2", team: [[58,18], [63,18], [147,19]], line: "Duas insígnias não encerram nossa disputa." },
  gymCoral: { name: "Dara", title: "Líder Coral", money: 1200, flag: "gym_coral", badge: "coral", badgeName: "Insígnia Coral", team: [[43,11], [25,12]], line: "O ginásio testa leitura, não força bruta." },
  gymCrystal: { name: "Vitor", title: "Líder Noxport", money: 1800, flag: "gym_crystal", badge: "crystal", badgeName: "Insígnia Beacon", team: [[74,15], [92,15], [95,16]], line: "Uma boa defesa força o adversário a pensar." }
};

const LOCATION_ORDER = ["brisa", "rota01", "bosque", "coral", "rota02", "gruta", "cristal", "lago", "mirante"];

const NPC_LINES = {
  mae: "Mãe: salvei um lanche na mochila. Treine com calma, não com pressa.",
  aroeira: "Aroeira: o essencial é simples: tipo, HP, PP e saber quando trocar.",
  guardaRota: "Guarda: treinadores da rota costumam desafiar quem passa. Tenha Poções.",
  batedora: "Batedora: dizem que um Pikachu aparece pouco no Amber Woods.",
  pescadorCoral: "Pescador: no mar, Água vence Pedra. Mas Elétrico muda tudo.",
  daraHint: "Aluna do ginásio: Dara usa Grama e Elétrico. Fogo ou Voador ajudam bastante.",
  corredorRota02: "Corredor: golpes rápidos não são só bonitos. Às vezes salvam uma batalha.",
  mineiro: "Mineiro: se ficar preso na gruta, Corda de Fuga resolve.",
  curadoraBeacon: "Curadora: antes do ginásio Noxport, confira PP. Defesa alta cansa a equipe.",
  vitorHint: "Guia do ginásio: Vitor gosta de Pedra. Água e Grama costumam abrir caminho.",
  barqueiro: "Barqueiro: depois da Insígnia Beacon, North Reef fica liberado.",
  pesquisadorNeblina: "Pesquisador: o Mistpoint tem espécies raras. Não gaste Grandes Bolas à toa."
};

const STORY_BEATS = {
  intro: "Bem-vindo ao mundo dos Pokémon. Em Veyra, pequenas cidades vivem entre mata, farol e rotas antigas. Hoje você acorda em Cove para receber seu primeiro parceiro do Professor Aroeira.",
  firstBadge: "Com a Insígnia Coral, o guarda da Lumen Cave passa a respeitar seu nome.",
  secondBadge: "A Insígnia Beacon libera a passagem da North Reef. A jornada continua além dos créditos."
};

const INTRO_STEPS = [
  { scene: "bedroom", title: "Quarto", text: "A tela pisca. O rádio antigo chia no criado-mudo. Lá fora, Wingull cortam o céu de Cove." },
  { scene: "bedroom", title: "Mãe", text: "Mãe: o Professor Aroeira passou cedo. Disse que você finalmente tem idade para carregar uma Pokédex." },
  { scene: "town", title: "Cove", text: "Você desce as escadas. A brisa do mar entra pela porta. O laboratório fica depois da placa azul." },
  { scene: "lab", title: "Laboratório", text: "Aroeira: este mundo é dividido entre rotas, cidades e escolhas. Pokémon crescem quando você batalha, mas vencem quando você cuida deles." },
  { scene: "lab", title: "Primeiro parceiro", text: "Aroeira coloca três Poké Bolas na bancada. A jornada começa quando você escolhe uma delas." }
];
