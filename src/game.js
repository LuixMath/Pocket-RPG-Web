const SAVE_KEY = "pokemonVeyraRPG.save.v1";
const SETTINGS_KEY = "pokemonVeyraRPG.settings.v2";

let state = null;
let battle = null;
let modalSelection = null;
let deferredInstallPrompt = null;
let musicTimer = null;
let currentMusicMode = null;

const AUDIO = {
  ctx: null,
  master: null,
  music: null,
  sfx: null,
  unlocked: false,
  ensure() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.music = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.music.connect(this.master);
    this.sfx.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.unlocked = true;
    applyAudioSettings();
  },
  tone(freq, duration = .08, type = "square", target = "sfx", delay = 0, volume = .3) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + .01);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain);
    gain.connect(target === "music" ? this.music : this.sfx);
    osc.start(now);
    osc.stop(now + duration + .03);
  },
  noise(duration = .08, delay = 0, volume = .18) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    src.buffer = buffer; src.connect(gain); gain.connect(this.sfx); src.start(now); src.stop(now + duration);
  }
};

function audioSettings() {
  return state?.settings || loadSavedSettings();
}

function applyAudioSettings() {
  if (!AUDIO.ctx || !AUDIO.master) return;
  const settings = audioSettings();
  const volume = clamp(Number(settings.volume ?? 70), 0, 100) / 100;
  AUDIO.master.gain.value = volume;
  AUDIO.music.gain.value = settings.music === false ? 0 : .18;
  AUDIO.sfx.gain.value = settings.sfx === false ? 0 : .38;
}

function playSfx(name) {
  const settings = audioSettings();
  if (settings.sfx === false || !settings.motion && name === "step") return;
  AUDIO.ensure();
  if (!AUDIO.ctx) return;
  const seq = {
    tap: [[520,.035]],
    step: [[260,.04],[330,.035,.045]],
    open: [[420,.05],[640,.06,.055]],
    battleStart: [[160,.08],[220,.08,.08],[330,.1,.16],[660,.12,.28]],
    hit: [[110,.05],[90,.05,.045]],
    heal: [[440,.06],[660,.08,.07]],
    catch: [[520,.07],[620,.07,.1],[780,.16,.2]],
    fail: [[220,.08],[180,.12,.09]],
    faint: [[330,.08],[260,.08,.08],[180,.14,.16]],
    win: [[523,.08],[659,.08,.09],[784,.16,.18]],
    level: [[392,.07],[523,.07,.08],[659,.12,.16]]
  }[name];
  if (name === "hit") AUDIO.noise(.08, 0, .25);
  if (seq) seq.forEach(([freq,dur,delay=0]) => AUDIO.tone(freq,dur,"square","sfx",delay,.28));
}

const MUSIC_PATTERNS = {
  menu: [392,0,523,0,659,0,523,0],
  overworld: [262,330,392,330,294,370,440,370],
  battle: [220,247,262,330,294,262,247,220]
};

function startMusic(mode) {
  const settings = audioSettings();
  if (settings.music === false || settings.motion === false) return stopMusic();
  AUDIO.ensure();
  if (!AUDIO.ctx || currentMusicMode === mode) return;
  stopMusic();
  currentMusicMode = mode;
  let i = 0;
  const playNote = () => {
    if (!AUDIO.ctx || audioSettings().music === false) return;
    const pattern = MUSIC_PATTERNS[mode] || MUSIC_PATTERNS.overworld;
    const note = pattern[i % pattern.length];
    if (note) {
      AUDIO.tone(note, .1, "square", "music", 0, .18);
      AUDIO.tone(note / 2, .12, "triangle", "music", 0, .08);
    }
    i++;
  };
  playNote();
  musicTimer = window.setInterval(playNote, mode === "battle" ? 170 : 310);
}

function stopMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = null;
  currentMusicMode = null;
}

const $ = selector => document.querySelector(selector);
const app = $("#app");
const menuScreen = $("#menuScreen");
const gameScreen = $("#gameScreen");
const actionGrid = $("#actionGrid");
const mainText = $("#mainText");
const modal = $("#modal");
const modalContent = $("#modalContent");

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = list => list[Math.floor(Math.random() * list.length)];
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const pct = (value, max) => clamp(Math.round((value / max) * 100), 0, 100);

function freshState() {
  return {
    version: 2,
    player: {
      name: "Luiz",
      money: 1200,
      location: "brisa",
      party: [],
      box: [],
      bag: { pokeBall: 6, potion: 4, antidote: 1, paralyzeHeal: 1 },
      badges: [],
      seen: [],
      caught: [],
      repelSteps: 0
    },
    flags: { introActive: false, introStep: 0, introScene: "town" },
    routeProgress: {},
    settings: loadSavedSettings(),
    stats: { steps: 0, wins: 0, captures: 0, whites: 0 },
    lastSavedAt: null
  };
}

function pokemonData(id) {
  return POKEMON[id];
}

function calcStats(id, level) {
  const base = pokemonData(id).base;
  return {
    hp: Math.floor(((base.hp * 2) * level) / 100) + level + 10,
    atk: Math.floor(((base.atk * 2) * level) / 100) + 5,
    def: Math.floor(((base.def * 2) * level) / 100) + 5,
    spd: Math.floor(((base.spd * 2) * level) / 100) + 5
  };
}

function movesFor(id, level) {
  const learned = pokemonData(id).learn
    .filter(([learnLevel]) => learnLevel <= level)
    .map(([, move]) => move)
    .filter(move => MOVES[move]);
  const unique = [...new Set(learned)].slice(-4);
  return unique.map(key => ({ key, pp: MOVES[key].pp }));
}

function createMon(id, level, nickname = null) {
  const stats = calcStats(id, level);
  return {
    uid: uid(), id, nickname,
    name: pokemonData(id).name,
    types: [...pokemonData(id).types],
    level,
    exp: 0,
    nextExp: expToNext(level),
    maxHp: stats.hp,
    hp: stats.hp,
    stats,
    moves: movesFor(id, level),
    status: null,
    temp: { atk: 0, def: 0 }
  };
}

function expToNext(level) {
  return Math.floor(24 + Math.pow(level, 2.15) * 3.8);
}

function refreshMon(mon, keepHpRatio = true) {
  const ratio = keepHpRatio ? mon.hp / mon.maxHp : 1;
  const stats = calcStats(mon.id, mon.level);
  mon.name = pokemonData(mon.id).name;
  mon.types = [...pokemonData(mon.id).types];
  mon.stats = stats;
  mon.maxHp = stats.hp;
  mon.hp = clamp(Math.ceil(stats.hp * ratio), 1, stats.hp);
  const currentMoveKeys = mon.moves.map(m => m.key);
  const learned = movesFor(mon.id, mon.level);
  learned.forEach(move => {
    if (!currentMoveKeys.includes(move.key)) mon.moves.push(move);
  });
  mon.moves = mon.moves.slice(-4).map(m => ({ key: m.key, pp: Math.min(m.pp ?? MOVES[m.key].pp, MOVES[m.key].pp) }));
}

function addSeen(id) {
  if (!state.player.seen.includes(id)) state.player.seen.push(id);
}

function addCaught(id) {
  addSeen(id);
  if (!state.player.caught.includes(id)) state.player.caught.push(id);
}

function saveGame(silent = false) {
  if (!state?.player?.party?.length) return;
  state.lastSavedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  render();
  if (!silent) say("Jogo salvo.");
}

function defaultSettings() {
  return { text: "normal", motion: true, theme: "crystal", music: true, sfx: true, volume: 70 };
}

function normalizeSettings(parsed = {}) {
  return {
    text: parsed.text === "fast" ? "fast" : "normal",
    motion: parsed.motion !== false,
    theme: parsed.theme === "night" ? "night" : "crystal",
    music: parsed.music !== false,
    sfx: parsed.sfx !== false,
    volume: clamp(Number(parsed.volume ?? 70), 0, 100)
  };
}

function loadSavedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings();
  }
}

function saveOnlySettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const loaded = JSON.parse(raw);
    if (!loaded?.player?.party) return null;
    return migrateSave(loaded);
  } catch {
    return null;
  }
}

function migrateSave(loaded) {
  loaded.version = Math.max(Number(loaded.version || 1), 2);
  loaded.player.bag ||= {};
  loaded.player.box ||= [];
  loaded.player.badges ||= [];
  loaded.player.seen ||= [];
  loaded.player.caught ||= [];
  loaded.player.repelSteps ||= 0;
  loaded.flags ||= {};
  loaded.routeProgress ||= {};
  loaded.stats ||= { steps: 0, wins: 0, captures: 0, whites: 0 };
  loaded.settings = normalizeSettings({ ...loadSavedSettings(), ...(loaded.settings || {}) });
  loaded.player.party.forEach(mon => { mon.temp ||= { atk: 0, def: 0 }; mon.moves ||= movesFor(mon.id, mon.level); refreshMon(mon, true); });
  loaded.player.box.forEach(mon => { mon.temp ||= { atk: 0, def: 0 }; mon.moves ||= movesFor(mon.id, mon.level); refreshMon(mon, true); });
  return loaded;
}

function setScreen(screen) {
  app.dataset.screen = screen;
  menuScreen.hidden = screen !== "menu";
  gameScreen.hidden = screen !== "game";
  if (screen === "menu" && !state) startMusic("menu");
}

function say(text) {
  mainText.textContent = text;
}

function iconForAction(label) {
  const key = label.toLowerCase();
  if (key.includes("lutar")) return "⚔";
  if (key.includes("mochila") || key.includes("bolsa")) return "▣";
  if (key.includes("pokémon") || key.includes("equipe")) return "●";
  if (key.includes("fugir") || key.includes("voltar")) return "↩";
  if (key.includes("avançar") || key.includes("viajar")) return "➜";
  if (key.includes("procurar") || key.includes("explorar")) return "⌕";
  if (key.includes("menu")) return "☰";
  if (key.includes("conversar")) return "!";
  if (key.includes("continuar")) return "▶";
  return "◆";
}

function action(label, handler, hint = "") {
  const btn = document.createElement("button");
  btn.className = "action-btn";
  btn.type = "button";
  btn.innerHTML = `<span class="btn-icon">${iconForAction(label)}</span><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ""}</span>`;
  btn.addEventListener("click", handler);
  actionGrid.appendChild(btn);
}

function render() {
  if (!state) return;
  document.body.classList.toggle("no-motion", !state.settings.motion);
  document.body.classList.toggle("night", state.settings.theme === "night");
  document.body.classList.toggle("fast-text", state.settings.text === "fast");
  applyAudioSettings();
  if (state.settings.music !== false) startMusic(battle ? "battle" : "overworld");
  else stopMusic();

  const loc = LOCATIONS[state.player.location];
  $("#locationName").textContent = state.flags.introActive ? (INTRO_STEPS[state.flags.introStep]?.title || loc.name) : loc.name;
  $("#chapterTag").textContent = state.flags.introActive ? "Introdução" : loc.chapter;
  $("#locationBackdrop").className = `location-backdrop ${state.flags.introActive ? (state.flags.introScene || loc.kind) : loc.kind}`;
  renderOverworld();
  $("#playerName").textContent = state.player.name;
  $("#playerMoney").textContent = `₽ ${state.player.money}`;
  $("#saveState").textContent = state.lastSavedAt ? `salvo ${new Date(state.lastSavedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "sem save";
  const objective = currentObjective();
  const objectiveEl = $("#objectiveText");
  if (objectiveEl) objectiveEl.textContent = objective;

  renderSide();
  renderActions();
  renderBattle();
}

function renderSide() {
  const badgeList = $("#badgeList");
  badgeList.innerHTML = "";
  const badgeOrder = ["coral", "crystal"];
  badgeOrder.forEach((badge, idx) => {
    const node = document.createElement("span");
    node.className = `badge ${state.player.badges.includes(badge) ? "" : "empty-badge"}`;
    node.title = badge === "coral" ? "Insígnia Coral" : "Insígnia Beacon";
    node.textContent = state.player.badges.includes(badge) ? ["C", "P"][idx] : "?";
    badgeList.appendChild(node);
  });

  const party = $("#partyList");
  party.innerHTML = "";
  state.player.party.forEach((mon, idx) => {
    const hpClass = pct(mon.hp, mon.maxHp) <= 25 ? "low" : pct(mon.hp, mon.maxHp) <= 55 ? "mid" : "";
    const row = document.createElement("div");
    row.className = "party-mon";
    row.innerHTML = `
      <img src="${monFront(mon.id)}" onerror="this.src='${monFallback(mon.id)}'" alt="${mon.name}">
      <div>
        <strong>${mon.nickname || mon.name} <span>Lv.${mon.level}</span></strong>
        <div class="hpbar ${hpClass}"><i style="width:${pct(mon.hp, mon.maxHp)}%"></i></div>
      </div>
      <small>${mon.hp}/${mon.maxHp}</small>
    `;
    row.addEventListener("click", () => showPokemonDetails(idx));
    party.appendChild(row);
  });
  if (!state.player.party.length) party.innerHTML = `<div class="dex-mini">Nenhum Pokémon.</div>`;

  const bag = $("#bagList");
  bag.innerHTML = "";
  Object.entries(state.player.bag).filter(([, qty]) => qty > 0).slice(0, 6).forEach(([key, qty]) => {
    const item = ITEMS[key];
    const row = document.createElement("div");
    row.className = "bag-row";
    row.innerHTML = `<img src="${item.icon}" alt="${item.name}"><strong>${item.name}</strong><span>x${qty}</span>`;
    bag.appendChild(row);
  });
  if (!bag.children.length) bag.innerHTML = `<div class="dex-mini">Mochila vazia.</div>`;

  $("#dexMini").textContent = `${state.player.seen.length} vistos • ${state.player.caught.length} capturados`;
}

function currentObjective() {
  if (state?.flags?.introActive) return "Siga a apresentação até o laboratório.";
  if (!state?.player?.party?.length) return "Escolha seu primeiro Pokémon.";
  if (!state.flags.rival_niko_1) return "Atravesse a Rota 01 e enfrente Niko.";
  if (!state.flags.trainer_lia) return "Treine na Rota 01 e vença Lia.";
  if (!state.flags.gym_coral) return "Passe pelo Amber Woods e conquiste a Insígnia Coral.";
  if (!state.flags.gym_crystal) return "Cruze a Lumen Cave e vença o Ginásio Noxport.";
  if (!state.flags.rival_niko_2) return "Explore North Reef e suba até o Mistpoint.";
  return "Pós-jogo: complete a Pokédex da região Veyra.";
}

function locationProgressText(id) {
  const loc = LOCATIONS[id];
  const trainers = (loc.trainers || []).length;
  const defeated = (loc.trainers || []).filter(t => state.flags[TRAINERS[t].flag]).length;
  const wildCount = new Set((loc.wild || []).map(row => row[0])).size;
  const locked = loc.requires?.badge && !state.player.badges.includes(loc.requires.badge);
  return `${locked ? "bloqueado" : "aberto"} • ${defeated}/${trainers} treinadores • ${wildCount} espécies`;
}

function isRouteLike(loc) {
  return Boolean(loc?.length && loc?.wild);
}

function routeProgress(id = state.player.location) {
  return clamp(Number(state.routeProgress?.[id] || 0), 0, LOCATIONS[id]?.length || 0);
}

function routeRemaining(id = state.player.location) {
  const loc = LOCATIONS[id];
  return Math.max(0, (loc?.length || 0) - routeProgress(id));
}

function routeIsComplete(id = state.player.location) {
  const loc = LOCATIONS[id];
  return !isRouteLike(loc) || routeProgress(id) >= loc.length;
}

function routeProgressLabel(id = state.player.location) {
  const loc = LOCATIONS[id];
  if (!isRouteLike(loc)) return "área aberta";
  return `${routeProgress(id)}/${loc.length} passos`;
}

function sceneFlash(kind = "step") {
  const stage = $("#locationBackdrop");
  if (!stage || !state?.settings?.motion) return;
  stage.classList.remove("flash-step", "flash-hit", "flash-catch", "flash-faint", "battle-wipe", "battle-ripple");
  void stage.offsetWidth;
  stage.classList.add(kind === "hit" ? "flash-hit" : kind === "catch" ? "flash-catch" : kind === "faint" ? "flash-faint" : kind === "ripple" ? "battle-ripple" : kind === "wipe" ? "battle-wipe" : "flash-step");
}

function spriteMonForLocation(loc) {
  if (battle) return enemyMon()?.id || null;
  if (state?.flags?.lastWildId && loc?.wild) return state.flags.lastWildId;
  return loc?.wild?.[0]?.[0] || null;
}

function renderOverworld() {
  const scene = $("#pixelScene");
  if (!scene || !state) return;
  const loc = LOCATIONS[state.player.location];
  const introScene = state.flags.introActive ? state.flags.introScene : null;
  const kind = introScene || loc.kind;
  const progress = routeProgressLabel();
  const wildId = spriteMonForLocation(loc);
  scene.className = `pixel-scene scene-${kind}`;
  const road = isRouteLike(loc) ? `<div class="route-meter"><i style="width:${pct(routeProgress(), loc.length)}%"></i><span>${progress}</span></div>` : "";
  const wild = wildId ? `<img class="scene-mon" src="${monFront(wildId)}" onerror="this.src='${monFallback(wildId)}'" alt="">` : "";
  const labBall = kind === "lab" ? `<div class="lab-balls"><span></span><span></span><span></span></div>` : "";
  const npc = npcSpriteForScene(kind);
  scene.innerHTML = `
    <div class="tile-layer"></div>
    ${road}
    <img class="overworld-sprite hero-sprite" src="assets/sprites/hero.gif" alt="">
    <img class="overworld-sprite npc-sprite" src="${npc}" alt="">
    ${wild}
    ${labBall}
  `;
}

function npcSpriteForScene(kind) {
  if (kind === "lab") return "assets/sprites/professor.png";
  if (kind === "bedroom") return "assets/sprites/mom.png";
  const loc = LOCATIONS[state.player.location];
  if (loc?.services?.includes("center")) return "assets/sprites/nurse.png";
  if (loc?.services?.includes("mart")) return "assets/sprites/shopkeeper.png";
  if ((loc?.trainers || []).some(id => id.includes("niko") && !state.flags[TRAINERS[id].flag])) return "assets/sprites/rival.png";
  return "assets/sprites/npc.png";
}

function talkToNpc() {
  const loc = LOCATIONS[state.player.location];
  const pool = loc.npcs || [];
  if (!pool.length) { say("Ninguém por perto tem algo novo para dizer."); return; }
  const key = pick(pool);
  say(NPC_LINES[key] || loc.text);
}

function renderActions() {
  actionGrid.innerHTML = "";

  if (battle) {
    renderBattleActions();
    return;
  }

  if (state.flags.introActive) {
    action("Continuar", advanceIntro, "história");
    action("Pular intro", skipIntroToStarter, "escolher inicial");
    return;
  }

  const loc = LOCATIONS[state.player.location];
  const hasLocalMenu = Boolean(loc.services?.length);

  if (isRouteLike(loc) && !routeIsComplete()) {
    action("Avançar", advanceRoute, `${routeRemaining()} passos restantes`);
    action("Procurar", searchWildOnly, "grama alta");
    action("Voltar", () => travel(state.player.lastLocation || loc.exits[0]), "caminho anterior");
    action("Menu", openGameMenu, "equipe, bolsa, dex");
    return;
  }

  action(loc.wild ? "Explorar" : "Olhar em volta", loc.wild ? searchWildOnly : () => say(loc.text), loc.wild ? "encontros e itens" : "descrição");
  if (hasLocalMenu) action("Local", openLocalMenu, "serviços da cidade");
  else action("Conversar", talkToNpc, "NPCs e dicas");
  action("Viajar", openTravelMenu, routeIsComplete() ? "rotas conectadas" : routeProgressLabel());
  action("Menu", openGameMenu, "equipe, bolsa, dex");
}

function openGameMenu() {
  playSfx("open");
  const loc = LOCATIONS[state.player.location];
  const boxButton = loc.services?.includes("center") ? `<button class="choice-btn" value="box" type="submit"><strong>PC / Box</strong><small>${state.player.box.length} guardados</small></button>` : "";
  modalContent.innerHTML = `
    <h3>Menu</h3>
    <div class="game-menu-grid">
      <button class="choice-btn" value="party" type="submit"><strong>Equipe</strong><small>Pokémon, golpes e EXP</small></button>
      <button class="choice-btn" value="bag" type="submit"><strong>Bolsa</strong><small>itens e cura</small></button>
      <button class="choice-btn" value="dex" type="submit"><strong>Pokédex</strong><small>${state.player.caught.length} capturados</small></button>
      <button class="choice-btn" value="journal" type="submit"><strong>Diário</strong><small>objetivo atual</small></button>
      <button class="choice-btn" value="map" type="submit"><strong>Mapa</strong><small>${routeProgressLabel()}</small></button>
      ${boxButton}
      <button class="choice-btn" value="save" type="submit"><strong>Salvar</strong><small>save local</small></button>
      <button class="choice-btn" value="settings" type="submit"><strong>Config</strong><small>texto, tema, movimento</small></button>
    </div>
    <div class="modal-actions"><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const value = e.submitter?.value;
    modal.close();
    if (value === "party") return openPartyMenu();
    if (value === "bag") return openBagMenu();
    if (value === "dex") return openDex();
    if (value === "journal") return openJournal();
    if (value === "map") return openMap();
    if (value === "box") return openBox();
    if (value === "save") return saveGame(false);
    if (value === "settings") return openSettings();
  };
  modal.showModal();
}

function openLocalMenu() {
  playSfx("open");
  const loc = LOCATIONS[state.player.location];
  const options = [];
  if (loc.services?.includes("home")) options.push(["home", "Casa", "curar equipe"]);
  if (loc.services?.includes("lab")) options.push(["lab", "Laboratório", "Professor Aroeira"]);
  if (loc.services?.includes("center")) options.push(["center", "Centro Pokémon", "curar equipe"]);
  if (loc.services?.includes("mart")) options.push(["mart", "Loja", "comprar itens"]);
  if (loc.services?.includes("gymCoral")) options.push(["gymCoral", "Ginásio Coral", "líder Dara"]);
  if (loc.services?.includes("gymCrystal")) options.push(["gymCrystal", "Ginásio Noxport", "líder Vitor"]);
  options.push(["talk", "Conversar", "NPCs e dicas"]);
  modalContent.innerHTML = `
    <h3>${loc.name}</h3>
    <p>${loc.text}</p>
    <div class="choice-grid">${options.map(([value, label, hint]) => `<button class="choice-btn" value="${value}" type="submit"><strong>${label}</strong><small>${hint}</small></button>`).join("")}</div>
    <div class="modal-actions"><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const value = e.submitter?.value;
    modal.close();
    if (value === "home") return healParty("Você descansou em casa.");
    if (value === "lab") return labAction();
    if (value === "center") return healParty("Equipe curada.");
    if (value === "mart") return openShop();
    if (value === "gymCoral") return startTrainerBattle("gymCoral");
    if (value === "gymCrystal") return startTrainerBattle("gymCrystal");
    if (value === "talk") return talkToNpc();
  };
  modal.showModal();
}

function openTravelMenu() {
  playSfx("open");
  const current = LOCATIONS[state.player.location];
  const canExitForward = routeIsComplete();
  const nodes = current.exits.map(id => {
    const next = LOCATIONS[id];
    const locked = next.requires?.badge && !state.player.badges.includes(next.requires.badge);
    const isBack = id === state.player.lastLocation;
    const disabled = locked || (!canExitForward && !isBack);
    const hint = locked ? "bloqueado" : disabled ? `${routeRemaining()} passos restantes` : isBack ? "voltar" : "ir";
    return `<button class="choice-btn" value="${id}" type="submit" ${disabled ? "disabled" : ""}><strong>${next.name}</strong><small>${hint}</small></button>`;
  }).join("");
  modalContent.innerHTML = `
    <h3>Viajar</h3>
    <p>${isRouteLike(current) ? `Progresso da área: ${routeProgressLabel()}.` : "Escolha o próximo caminho."}</p>
    <div class="choice-grid">${nodes}</div>
    <div class="modal-actions"><button class="mini-btn" value="map">Mapa completo</button><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const value = e.submitter?.value;
    modal.close();
    if (value === "map") return openMap();
    if (value && value !== "close") return travel(value);
  };
  modal.showModal();
}

function renderBattleActions() {
  if (battle.phase === "move") {
    activeMon().moves.forEach((slot, idx) => {
      const move = MOVES[slot.key];
      action(move.name, () => playerUseMove(idx), `${TYPES[move.type]} • PP ${slot.pp}/${move.pp}`);
    });
    action("Voltar", () => { battle.phase = "menu"; render(); }, "menu de batalha");
    return;
  }

  if (battle.phase === "bag") {
    const usable = Object.entries(state.player.bag).filter(([key, qty]) => qty > 0 && ["ball", "heal", "status"].includes(ITEMS[key].kind));
    usable.forEach(([key, qty]) => action(ITEMS[key].name, () => useBattleItem(key), `x${qty}`));
    action("Voltar", () => { battle.phase = "menu"; render(); }, "menu de batalha");
    return;
  }

  if (battle.phase === "switch") {
    state.player.party.forEach((mon, idx) => {
      const disabled = mon.hp <= 0 || idx === battle.playerIndex;
      const btnLabel = `${mon.nickname || mon.name}`;
      const hint = disabled ? (mon.hp <= 0 ? "desmaiado" : "em campo") : `Lv.${mon.level} • ${mon.hp}/${mon.maxHp}`;
      const handler = disabled ? () => {} : () => switchActive(idx);
      action(btnLabel, handler, hint);
      actionGrid.lastChild.disabled = disabled;
    });
    action("Voltar", () => { battle.phase = "menu"; render(); }, "menu de batalha");
    return;
  }

  action("Lutar", () => { battle.phase = "move"; render(); }, "escolher golpe");
  action("Mochila", () => { battle.phase = "bag"; render(); }, "itens e Poké Bolas");
  action("Pokémon", () => { battle.phase = "switch"; render(); }, "trocar equipe");
  action("Fugir", fleeBattle, battle.kind === "wild" ? "tentar escapar" : "não vale em batalha oficial");
}

function renderBattle() {
  const battleView = $("#battleView");
  const stage = $("#locationBackdrop");
  if (!battle) {
    battleView.hidden = true;
    stage?.classList.remove("in-battle");
    return;
  }
  battleView.hidden = false;
  stage?.classList.add("in-battle");
  const ally = activeMon();
  const foe = enemyMon();
  $("#enemySprite").src = monFront(foe.id);
  $("#enemySprite").onerror = () => { $("#enemySprite").src = monFallback(foe.id); };
  $("#playerSprite").src = monBack(ally.id);
  $("#playerSprite").onerror = () => { $("#playerSprite").src = monFallback(ally.id); };
  $("#enemyHud").innerHTML = hudHtml(foe, false, battle.enemyTeam, battle.enemyIndex);
  $("#playerHud").innerHTML = hudHtml(ally, true, state.player.party, battle.playerIndex);
}

function hudHtml(mon, showHp = false, team = [], activeIndex = 0) {
  const hpPercent = pct(mon.hp, mon.maxHp);
  const expPercent = showHp ? pct(mon.exp || 0, mon.nextExp || 1) : 0;
  const hpClass = hpPercent <= 25 ? "low" : hpPercent <= 55 ? "mid" : "";
  return `
    <div class="hud-top"><span>${mon.nickname || mon.name}</span><span>Lv.${mon.level}</span></div>
    <div class="team-slots">${teamSlotsHtml(team, activeIndex)}</div>
    <div class="hp-label"><b>HP</b><div class="hpbar ${hpClass}"><i style="width:${hpPercent}%"></i></div></div>
    ${showHp ? `<small class="hp-number">${mon.hp}/${mon.maxHp}</small><div class="expbar"><i style="width:${expPercent}%"></i></div>` : ""}
    ${mon.status ? `<small class="status-pill">${statusName(mon.status)}</small>` : ""}
  `;
}

function teamSlotsHtml(team = [], activeIndex = 0) {
  const total = Math.max(6, team.length || 0);
  return Array.from({ length: total }, (_, idx) => {
    const mon = team[idx];
    const cls = mon ? (mon.hp <= 0 ? "slot fainted" : idx === activeIndex ? "slot active" : "slot filled") : "slot";
    return `<span class="${cls}"></span>`;
  }).join("");
}

function labAction() {
  if (!state.flags.labGift) {
    state.flags.labGift = true;
    addItem("pokeBall", 4);
    say("Aroeira: leve estas Poké Bolas. Quero ver sua Pokédex crescer de verdade.");
    render();
    return;
  }
  say("Aroeira: capture, teste tipos e volte quando tiver novas insígnias.");
}

function healParty(message) {
  state.player.party.forEach(mon => {
    mon.hp = mon.maxHp;
    mon.status = null;
    mon.moves.forEach(slot => { slot.pp = MOVES[slot.key].pp; });
  });
  say(message);
  render();
}

function travel(id) {
  const current = LOCATIONS[state.player.location];
  const next = LOCATIONS[id];
  if (!next) return;
  if (next.requires?.badge && !state.player.badges.includes(next.requires.badge)) {
    say(next.requires.message);
    return;
  }
  if (isRouteLike(current) && !routeIsComplete() && id !== state.player.lastLocation) {
    say(`Você ainda não atravessou ${current.name}. Avance mais ${routeRemaining()} passo(s).`);
    return;
  }
  const previous = state.player.location;
  state.player.location = id;
  state.player.lastLocation = previous;
  if (isRouteLike(next)) state.routeProgress[id] = 0;
  state.stats.steps += 1;
  if (state.player.repelSteps > 0) state.player.repelSteps -= 1;
  playSfx("step");
  sceneFlash("step");
  say(next.text);
  render();
}

function advanceRoute() {
  const loc = LOCATIONS[state.player.location];
  if (!isRouteLike(loc)) return explore();
  if (routeIsComplete()) {
    say(`${loc.name} já foi atravessada. Escolha Viajar para seguir caminho.`);
    render();
    return;
  }

  state.routeProgress[state.player.location] = routeProgress() + 1;
  state.stats.steps += 1;
  if (state.player.repelSteps > 0) state.player.repelSteps -= 1;
  playSfx("step");
  sceneFlash("step");

  const undefeated = (loc.trainers || []).filter(id => !state.flags[TRAINERS[id].flag]);
  if (undefeated.length && Math.random() < .22) {
    startTrainerBattle(pick(undefeated));
    return;
  }

  if (loc.items?.length && Math.random() < .16) {
    const item = pick(loc.items);
    addItem(item, 1);
    say(`Passo ${routeProgress()}/${loc.length}. Você encontrou ${ITEMS[item].name}.`);
    render();
    return;
  }

  if (state.player.repelSteps > 0 && Math.random() < .65) {
    say(`Passo ${routeProgress()}/${loc.length}. O Repelente manteve a grama quieta.`);
    render();
    return;
  }

  if (Math.random() < .68) {
    const encounter = weightedEncounter(loc.wild);
    state.flags.lastWildId = encounter.id;
    startWildBattle(encounter.id, rand(encounter.min, encounter.max));
    return;
  }

  const done = routeIsComplete();
  say(done ? `${loc.name} foi atravessada. Agora dá para seguir pela saída.` : `Passo ${routeProgress()}/${loc.length}. Nada apareceu.`);
  render();
}

function searchWildOnly() {
  const loc = LOCATIONS[state.player.location];
  if (!loc.wild) {
    say(loc.text);
    return;
  }
  if (state.player.repelSteps > 0 && Math.random() < .7) {
    say("O Repelente manteve a grama quieta.");
    render();
    return;
  }
  const encounter = weightedEncounter(loc.wild);
  state.flags.lastWildId = encounter.id;
  startWildBattle(encounter.id, rand(encounter.min, encounter.max));
}

function explore() {
  const loc = LOCATIONS[state.player.location];
  if (isRouteLike(loc) && !routeIsComplete()) return advanceRoute();
  if (loc.wild) return searchWildOnly();
  say(loc.text);
  render();
}

function weightedEncounter(table) {
  const total = table.reduce((sum, row) => sum + row[3], 0);
  let roll = Math.random() * total;
  for (const [id, min, max, weight] of table) {
    roll -= weight;
    if (roll <= 0) return { id, min, max };
  }
  const [id, min, max] = table[0];
  return { id, min, max };
}

function activeMon() { return state.player.party[battle.playerIndex]; }
function enemyMon() { return battle.enemyTeam[battle.enemyIndex]; }

function firstHealthyIndex() {
  return state.player.party.findIndex(mon => mon.hp > 0);
}

function animateBattleSprite(kind) {
  if (!state?.settings?.motion) return;
  const target = kind.startsWith("enemy") ? $("#enemySprite") : $("#playerSprite");
  if (!target) return;
  target.classList.remove("anim-attack", "anim-hit", "anim-faint", "anim-enter");
  void target.offsetWidth;
  if (kind.endsWith("Attack")) target.classList.add("anim-attack");
  if (kind.endsWith("Hit")) target.classList.add("anim-hit");
  if (kind.endsWith("Faint")) target.classList.add("anim-faint");
  if (kind.endsWith("Enter")) target.classList.add("anim-enter");
}

function battleTransition(kind = "wild") {
  playSfx("battleStart");
  sceneFlash(kind === "trainer" || kind === "gym" ? "wipe" : "ripple");
}

function startWildBattle(id, level) {
  if (firstHealthyIndex() < 0) return whiteOut();
  const enemy = createMon(id, level);
  addSeen(id);
  battleTransition("wild");
  battle = {
    kind: "wild",
    enemyTeam: [enemy], enemyIndex: 0,
    playerIndex: firstHealthyIndex(), phase: "menu",
    log: [], turns: 1
  };
  say(`Um ${enemy.name} selvagem apareceu!`);
  render();
}

function baseStarterId() {
  const first = state?.player?.party?.[0];
  const id = first?.id || 1;
  if ([1, 2].includes(id)) return 1;
  if ([4, 5].includes(id)) return 4;
  if ([7, 8].includes(id)) return 7;
  return 1;
}

function rivalStarterFor(id) {
  return { 1: 4, 4: 7, 7: 1 }[id] || 4;
}

function evolvedStarter(id) {
  return { 1: 2, 4: 5, 7: 8 }[id] || id;
}

function syncRivalTeams() {
  const rival = rivalStarterFor(baseStarterId());
  if (TRAINERS.niko1) TRAINERS.niko1.team = [[rival, 5]];
  if (TRAINERS.niko2) TRAINERS.niko2.team = [[58, 18], [63, 18], [evolvedStarter(rival), 19]];
}

function startTrainerBattle(trainerId) {
  syncRivalTeams();
  const trainer = TRAINERS[trainerId];
  if (state.flags[trainer.flag]) {
    say(`${trainer.title} ${trainer.name}: já batalhamos. Continue treinando.`);
    return;
  }
  if (firstHealthyIndex() < 0) return whiteOut();
  const enemyTeam = trainer.team.map(([id, level]) => createMon(id, level));
  enemyTeam.forEach(mon => addSeen(mon.id));
  battleTransition(trainer.badge ? "gym" : "trainer");
  battle = {
    kind: trainer.badge ? "gym" : "trainer",
    trainerId,
    enemyTeam, enemyIndex: 0,
    playerIndex: firstHealthyIndex(), phase: "menu",
    log: [], turns: 1
  };
  say(`${trainer.title} ${trainer.name}: ${trainer.line}`);
  render();
}

function playerUseMove(slotIndex) {
  const ally = activeMon();
  const foe = enemyMon();
  const slot = ally.moves[slotIndex];
  if (!slot || slot.pp <= 0) {
    say("Esse golpe não tem PP.");
    return;
  }

  let text = "";
  if (ally.status === "paralysis" && Math.random() < .25) {
    text = `${ally.nickname || ally.name} está paralisado e não conseguiu se mover.`;
  } else {
    slot.pp -= 1;
    text = useMove(ally, foe, slot.key, false);
  }

  if (foe.hp <= 0) {
    text += `\n${foe.name} desmaiou.`;
    afterEnemyFainted(text);
    return;
  }

  text += enemyTurn();
  finishRound(text);
}
function enemyTurn() {
  const foe = enemyMon();
  const ally = activeMon();
  if (foe.status === "paralysis" && Math.random() < .25) {
    return `\nO ${foe.name} está paralisado e não se moveu.`;
  }
  const slot = chooseEnemyMove(foe, ally);
  if (slot.pp > 0) slot.pp -= 1;
  return `\n${useMove(foe, ally, slot.key, true)}`;
}

function chooseEnemyMove(foe, ally) {
  const usable = foe.moves.filter(slot => slot.pp > 0);
  const pool = usable.length ? usable : foe.moves;
  const scored = pool.map(slot => {
    const move = MOVES[slot.key];
    const typeMult = move.power ? ally.types.reduce((mult, type) => mult * (TYPE_CHART[move.type]?.[type] ?? 1), 1) : .75;
    const stab = foe.types.includes(move.type) ? 1.5 : 1;
    return { slot, score: (move.power || 18) * typeMult * stab + Math.random() * 12 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.slot || pick(pool);
}

function finishRound(text) {
  if (!battle) return;
  if (activeMon().hp <= 0) {
    afterPlayerFainted(text);
    return;
  }
  if (enemyMon().hp > 0) {
    text += endTurnStatusText(enemyMon());
    if (enemyMon().hp <= 0) {
      text += `\n${enemyMon().name} desmaiou.`;
      afterEnemyFainted(text);
      return;
    }
  }
  if (activeMon().hp > 0) {
    text += endTurnStatusText(activeMon());
    if (activeMon().hp <= 0) {
      afterPlayerFainted(text);
      return;
    }
  }
  battle.turns += 1;
  battle.phase = "menu";
  say(text);
  render();
}

function endTurnStatusText(mon) {
  if (!mon?.status || mon.hp <= 0) return "";
  if (!["poison", "burn"].includes(mon.status)) return "";
  const damage = clamp(Math.floor(mon.maxHp / 8), 1, mon.hp);
  mon.hp = clamp(mon.hp - damage, 0, mon.maxHp);
  return `\n${mon.nickname || mon.name} sofreu com ${statusName(mon.status).toLowerCase()}.`;
}
function useMove(attacker, defender, moveKey, enemySide) {
  const move = MOVES[moveKey];
  const who = enemySide ? `O ${attacker.name}` : `${attacker.nickname || attacker.name}`;
  if (Math.random() * 100 > move.acc) return `${who} usou ${move.name}, mas errou.`;

  if (!move.power) {
    if (move.effect === "atkDown") {
      defender.temp.atk = clamp((defender.temp.atk || 0) - 1, -3, 3);
      return `${who} usou ${move.name}. Ataque de ${defender.name} caiu.`;
    }
    if (move.effect === "defDown") {
      defender.temp.def = clamp((defender.temp.def || 0) - 1, -3, 3);
      return `${who} usou ${move.name}. Defesa de ${defender.name} caiu.`;
    }
    if (move.effect === "atkUp") {
      attacker.temp.atk = clamp((attacker.temp.atk || 0) + 1, -3, 3);
      return `${who} usou ${move.name}. Ataque de ${attacker.nickname || attacker.name} subiu.`;
    }
    return `${who} usou ${move.name}.`;
  }

  const atkStage = 1 + ((attacker.temp.atk || 0) * .25);
  const defStage = 1 + ((defender.temp.def || 0) * .25);
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const typeMult = defender.types.reduce((mult, type) => mult * (TYPE_CHART[move.type]?.[type] ?? 1), 1);
  const random = (rand(88, 100) / 100);
  const burnDrop = attacker.status === "burn" && move.kind === "physical" ? .5 : 1;
  const crit = Math.random() < .0625 ? 1.5 : 1;
  const attack = Math.max(1, attacker.stats.atk * atkStage * burnDrop);
  const defense = Math.max(1, defender.stats.def * defStage);
  const raw = (((2 * attacker.level / 5 + 2) * move.power * (attack / defense)) / 50 + 2) * stab * typeMult * random * crit;
  const damage = typeMult === 0 ? 0 : clamp(Math.floor(raw), 1, defender.hp);
  defender.hp = clamp(defender.hp - damage, 0, defender.maxHp);
  animateBattleSprite(enemySide ? "enemyAttack" : "playerAttack");
  if (damage > 0) {
    playSfx("hit");
    animateBattleSprite(enemySide ? "playerHit" : "enemyHit");
    sceneFlash("hit");
  }

  let text = `${who} usou ${move.name}. Causou ${damage} de dano.`;
  if (crit > 1) text += " Golpe crítico.";
  if (typeMult > 1) text += " É super efetivo.";
  if (typeMult > 0 && typeMult < 1) text += " Não foi muito efetivo.";
  if (typeMult === 0) text += " Não afetou.";

  if (move.drain && damage > 0) {
    const heal = Math.ceil(damage * move.drain);
    attacker.hp = clamp(attacker.hp + heal, 0, attacker.maxHp);
    text += ` ${attacker.name} recuperou HP.`;
  }

  if (move.status && !defender.status && Math.random() < move.effectChance) {
    defender.status = move.status;
    text += ` ${defender.name} ficou com ${statusName(move.status).toLowerCase()}.`;
  }
  return text;
}

function afterEnemyFainted(text) {
  playSfx("faint");
  animateBattleSprite("enemyFaint");
  const defeated = enemyMon();
  const gained = Math.floor((pokemonData(defeated.id).exp * defeated.level) / 7);
  text += gainExp(activeMon(), gained);

  if (battle.enemyIndex < battle.enemyTeam.length - 1) {
    battle.enemyIndex += 1;
    addSeen(enemyMon().id);
    battle.phase = "menu";
    text += `\n${TRAINERS[battle.trainerId].name} enviou ${enemyMon().name}.`;
    say(text);
    render();
    return;
  }

  finishBattleWin(text);
}

function gainExp(mon, amount) {
  mon.exp += amount;
  let text = `\n${mon.nickname || mon.name} ganhou ${amount} EXP.`;
  while (mon.exp >= mon.nextExp) {
    mon.exp -= mon.nextExp;
    mon.level += 1;
    mon.nextExp = expToNext(mon.level);
    refreshMon(mon);
    text += `\n${mon.nickname || mon.name} subiu para o Lv.${mon.level}.`;
    const evo = EVOLUTIONS[mon.id];
    if (evo && mon.level >= evo.level) {
      const old = mon.name;
      mon.id = evo.to;
      refreshMon(mon);
      mon.hp = mon.maxHp;
      addSeen(mon.id);
      addCaught(mon.id);
      text += `\n${old} evoluiu para ${mon.name}.`;
    }
  }
  return text;
}

function finishBattleWin(text) {
  playSfx("win");
  if (battle.kind === "wild") {
    battle = null;
    state.stats.wins += 1;
    say(`${text}\nVitória.`);
    render();
    return;
  }

  const trainer = TRAINERS[battle.trainerId];
  state.flags[trainer.flag] = true;
  state.player.money += trainer.money;
  state.stats.wins += 1;

  let ending = `${text}\nVocê venceu ${trainer.title} ${trainer.name} e recebeu ₽ ${trainer.money}.`;
  if (trainer.badge && !state.player.badges.includes(trainer.badge)) {
    state.player.badges.push(trainer.badge);
    ending += `\nVocê recebeu a ${trainer.badgeName}.`;
    if (trainer.badge === "coral") ending += `\n${STORY_BEATS.firstBadge}`;
    if (trainer.badge === "crystal") ending += `\n${STORY_BEATS.secondBadge}`;
  }
  battle = null;
  say(ending);
  render();
}

function afterPlayerFainted(text) {
  playSfx("faint");
  sceneFlash("faint");
  animateBattleSprite("playerFaint");
  const next = firstHealthyIndex();
  if (next >= 0) {
    battle.playerIndex = next;
    battle.phase = "menu";
    say(`${text}\nVá, ${activeMon().name}!`);
    render();
    return;
  }
  battle = null;
  state.stats.whites += 1;
  const loss = Math.floor(state.player.money * .12);
  state.player.money -= loss;
  state.player.location = "brisa";
  healParty("whiteout");
  say(`${text}\nVocê apagou e voltou para Cove. Perdeu ₽ ${loss}.`);
  render();
}

function whiteOut() {
  state.player.location = "brisa";
  healParty("Sua equipe foi curada em Cove.");
}

function useBattleItem(key) {
  const item = ITEMS[key];
  if (!item || (state.player.bag[key] || 0) <= 0) return;

  if (item.kind === "ball") {
    if (battle.kind !== "wild") {
      say("Não dá para capturar Pokémon de outro treinador.");
      return;
    }
    state.player.bag[key] -= 1;
    const foe = enemyMon();
    const hpFactor = 1 - (foe.hp / foe.maxHp) * .72;
    const statusBonus = foe.status ? .14 : 0;
    const chance = clamp((pokemonData(foe.id).catchRate / 255) * item.catchBonus * (.28 + hpFactor) + statusBonus, .04, .94);
    if (Math.random() < chance) {
      addCaught(foe.id);
      state.stats.captures += 1;
      const caught = JSON.parse(JSON.stringify(foe));
      caught.uid = uid();
      caught.temp = { atk: 0, def: 0 };
      const sentToBox = state.player.party.length >= 6;
      if (sentToBox) state.player.box.push(caught);
      else state.player.party.push(caught);
      battle = null;
      playSfx("catch");
      sceneFlash("catch");
      say(`${item.name} balançou... clicou!\n${foe.name} foi capturado.${sentToBox ? " Foi enviado para o Box." : ""}`);
      render();
      return;
    }
    playSfx("fail");
    let text = `${item.name} balançou... ${foe.name} escapou.`;
    text += enemyTurn();
    finishRound(text);
    return;
  }

  if (item.kind === "heal") {
    choosePokemon("Usar em qual Pokémon?", mon => mon.hp > 0 && mon.hp < mon.maxHp, idx => {
      const mon = state.player.party[idx];
      state.player.bag[key] -= 1;
      mon.hp = clamp(mon.hp + item.amount, 0, mon.maxHp);
      playSfx("heal");
      let text = `${item.name} restaurou HP de ${mon.nickname || mon.name}.`;
      text += enemyTurn();
      finishRound(text);
    });
    return;
  }

  if (item.kind === "status") {
    choosePokemon("Curar qual Pokémon?", mon => item.cures.includes(mon.status), idx => {
      const mon = state.player.party[idx];
      state.player.bag[key] -= 1;
      mon.status = null;
      let text = `${item.name} curou ${mon.nickname || mon.name}.`;
      text += enemyTurn();
      finishRound(text);
    });
  }
}

function switchActive(idx) {
  if (idx === battle.playerIndex || state.player.party[idx].hp <= 0) return;
  battle.playerIndex = idx;
  let text = `Volte! Vá, ${activeMon().nickname || activeMon().name}.`;
  text += enemyTurn();
  finishRound(text);
}

function fleeBattle() {
  if (battle.kind !== "wild") {
    say("Não dá para fugir de uma batalha oficial.");
    return;
  }
  const ally = activeMon();
  const foe = enemyMon();
  const chance = clamp(.42 + ((ally.stats.spd - foe.stats.spd) / 120), .18, .9);
  if (Math.random() < chance) {
    battle = null;
    say("Você fugiu com segurança.");
    render();
  } else {
    let text = "Não deu para fugir.";
    text += enemyTurn();
    finishRound(text);
  }
}

function statusName(status) {
  return { poison: "Veneno", paralysis: "Paralisia", burn: "Queimadura" }[status] || status;
}

function addItem(key, qty) {
  state.player.bag[key] = (state.player.bag[key] || 0) + qty;
}

function removeItem(key, qty) {
  state.player.bag[key] = clamp((state.player.bag[key] || 0) - qty, 0, 999);
}

function openShop() {
  playSfx("open");
  const stock = state.player.badges.includes("crystal")
    ? ["pokeBall", "greatBall", "potion", "superPotion", "antidote", "paralyzeHeal", "repel", "escapeRope"]
    : state.player.badges.includes("coral")
      ? ["pokeBall", "potion", "superPotion", "antidote", "paralyzeHeal", "repel", "escapeRope"]
      : ["pokeBall", "potion", "antidote", "paralyzeHeal"];
  modalContent.innerHTML = `
    <h3>Loja</h3>
    <p>Dinheiro: ₽ ${state.player.money}</p>
    <div class="choice-grid shop-grid">
      ${stock.map(key => {
        const item = ITEMS[key];
        return `<button class="choice-btn" value="${key}" type="submit"><img src="${item.icon}" alt="${item.name}"><strong>${item.name}</strong><small>₽ ${item.price}</small></button>`;
      }).join("")}
    </div>
    <div class="modal-actions"><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const key = e.submitter?.value;
    if (!key || key === "close") return modal.close();
    const item = ITEMS[key];
    if (state.player.money < item.price) {
      say("Dinheiro insuficiente.");
      modal.close();
      return;
    }
    state.player.money -= item.price;
    addItem(key, 1);
    modal.close();
    say(`Você comprou ${item.name}.`);
    render();
  };
  modal.showModal();
}


function openBagMenu() {
  playSfx("open");
  const entries = Object.entries(state.player.bag).filter(([, qty]) => qty > 0);
  if (!entries.length) {
    say("Mochila vazia.");
    return;
  }
  modalContent.innerHTML = `
    <h3>Mochila</h3>
    <div class="choice-grid">
      ${entries.map(([key, qty]) => {
        const item = ITEMS[key];
        return `<button class="choice-btn" value="${key}" type="submit"><img src="${item.icon}" alt="${item.name}"><strong>${item.name}</strong><small>x${qty}</small></button>`;
      }).join("")}
    </div>
    <div class="modal-actions"><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const key = e.submitter?.value;
    if (key === "close") return modal.close();
    modal.close();
    useFieldItem(key);
  };
  modal.showModal();
}

function useFieldItem(key) {
  const item = ITEMS[key];
  if (!item || (state.player.bag[key] || 0) <= 0) return;

  if (item.kind === "heal") {
    choosePokemon("Usar em qual Pokémon?", mon => mon.hp > 0 && mon.hp < mon.maxHp, idx => {
      const mon = state.player.party[idx];
      removeItem(key, 1);
      mon.hp = clamp(mon.hp + item.amount, 0, mon.maxHp);
      playSfx("heal");
      say(`${item.name} restaurou HP de ${mon.nickname || mon.name}.`);
      render();
    });
    return;
  }

  if (item.kind === "status") {
    choosePokemon("Curar qual Pokémon?", mon => item.cures.includes(mon.status), idx => {
      const mon = state.player.party[idx];
      removeItem(key, 1);
      mon.status = null;
      say(`${item.name} curou ${mon.nickname || mon.name}.`);
      render();
    });
    return;
  }

  if (key === "repel") {
    removeItem(key, 1);
    state.player.repelSteps = 14;
    say("Você usou Repelente. Encontros selvagens ficam raros por alguns passos.");
    render();
    return;
  }

  if (key === "escapeRope") {
    removeItem(key, 1);
    state.player.location = "brisa";
    say("Você usou Corda de Fuga e voltou para Cove.");
    render();
    return;
  }

  say("Esse item não pode ser usado agora.");
}

function openBox() {
  if (!state.player.box.length) {
    say("O Box está vazio.");
    return;
  }
  modalContent.innerHTML = `
    <h3>PC / Box</h3>
    <p>${state.player.box.length} Pokémon guardados.</p>
    <div class="choice-grid">
      ${state.player.box.map((mon, idx) => `<button class="choice-btn" value="${idx}" type="submit" ${state.player.party.length >= 6 ? "disabled" : ""}>
        <img src="${monFront(mon.id)}" onerror="this.src='${monFallback(mon.id)}'" alt="${mon.name}">
        <strong>${mon.nickname || mon.name}</strong>
        <small>Lv.${mon.level}</small>
      </button>`).join("")}
    </div>
    <p>${state.player.party.length >= 6 ? "Equipe cheia. Depósito manual fica para a próxima versão." : "Escolha um Pokémon para trazer para a equipe."}</p>
    <div class="modal-actions"><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const value = e.submitter?.value;
    if (value === "close") return modal.close();
    const idx = Number(value);
    const [mon] = state.player.box.splice(idx, 1);
    state.player.party.push(mon);
    modal.close();
    say(`${mon.nickname || mon.name} saiu do Box e entrou na equipe.`);
    render();
  };
  modal.showModal();
}

function openPartyMenu() {
  playSfx("open");
  const rows = state.player.party.map((mon, idx) => `
    <button class="choice-btn" value="${idx}" type="submit">
      <img src="${monFront(mon.id)}" onerror="this.src='${monFallback(mon.id)}'" alt="${mon.name}">
      <strong>${mon.nickname || mon.name}</strong>
      <small>Lv.${mon.level} • HP ${mon.hp}/${mon.maxHp}</small>
    </button>`).join("");
  modalContent.innerHTML = `
    <h3>Equipe</h3>
    <div class="choice-grid">${rows}</div>
    <div class="modal-actions"><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const value = e.submitter?.value;
    if (value === "close") return modal.close();
    modal.close();
    showPokemonDetails(Number(value));
  };
  modal.showModal();
}

function showPokemonDetails(idx) {
  const mon = state.player.party[idx];
  if (!mon) return;
  const moves = mon.moves.map(slot => {
    const move = MOVES[slot.key];
    return `<div class="move-card"><b>${move.name}</b><span>${TYPES[move.type]} • PP ${slot.pp}/${move.pp}</span><small>${move.power ? `Poder ${move.power}` : "status"}</small></div>`;
  }).join("");
  modalContent.innerHTML = `
    <h3>${mon.nickname || mon.name}</h3>
    <div class="party-detail">
      <img src="${monFront(mon.id)}" onerror="this.src='${monFallback(mon.id)}'" alt="${mon.name}">
      <div>
        <p>Lv.${mon.level} • ${mon.types.map(t => TYPES[t]).join(" / ")}</p>
        <div class="hp-label"><b>HP</b><div class="hpbar"><i style="width:${pct(mon.hp, mon.maxHp)}%"></i></div></div>
        <small>${mon.hp}/${mon.maxHp} HP • EXP ${mon.exp}/${mon.nextExp}</small>
        <div class="expbar"><i style="width:${pct(mon.exp, mon.nextExp)}%"></i></div>
        <p>ATQ ${mon.stats.atk} • DEF ${mon.stats.def} • VEL ${mon.stats.spd}</p>
      </div>
    </div>
    <h4>Golpes</h4>
    <div class="move-grid">${moves}</div>
    <div class="modal-actions">
      <button class="mini-btn" value="potion">Usar Poção</button>
      <button class="mini-btn" value="close">Fechar</button>
    </div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const value = e.submitter?.value;
    if (value === "potion") {
      if ((state.player.bag.potion || 0) <= 0 || mon.hp <= 0 || mon.hp >= mon.maxHp) {
        modal.close(); say("Não dá para usar Poção agora."); return;
      }
      removeItem("potion", 1);
      mon.hp = clamp(mon.hp + ITEMS.potion.amount, 0, mon.maxHp);
      modal.close(); say(`Poção usada em ${mon.nickname || mon.name}.`); render(); return;
    }
    modal.close();
  };
  modal.showModal();
}

function choosePokemon(title, filter, callback) {
  const choices = state.player.party.map((mon, idx) => {
    const disabled = !filter(mon);
    return `<button class="choice-btn" value="${idx}" type="submit" ${disabled ? "disabled" : ""}>
      <img src="${monFront(mon.id)}" onerror="this.src='${monFallback(mon.id)}'" alt="${mon.name}">
      <strong>${mon.nickname || mon.name}</strong><small>HP ${mon.hp}/${mon.maxHp}${mon.status ? ` • ${statusName(mon.status)}` : ""}</small>
    </button>`;
  }).join("");
  modalContent.innerHTML = `<h3>${title}</h3><div class="choice-grid">${choices}</div><div class="modal-actions"><button class="mini-btn" value="close">Cancelar</button></div>`;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const value = e.submitter?.value;
    if (value === "close") return modal.close();
    modal.close();
    callback(Number(value));
  };
  modal.showModal();
}

function openMap() {
  playSfx("open");
  const current = LOCATIONS[state.player.location];
  const nodes = LOCATION_ORDER.map(id => {
    const loc = LOCATIONS[id];
    const locked = loc.requires?.badge && !state.player.badges.includes(loc.requires.badge);
    const isBack = id === state.player.lastLocation;
    const canTravel = !locked && current.exits.includes(id) && (routeIsComplete() || isBack);
    const here = id === state.player.location;
    const icon = loc.kind === "town" ? "⌂" : loc.kind === "cave" ? "◆" : loc.kind === "lake" ? "≈" : "•";
    return `<button class="choice-btn map-node ${here ? "current" : ""}" value="${id}" type="submit" ${(!canTravel || here) ? "disabled" : ""}>
      <span class="map-dot">${icon}</span>
      <span><strong>${loc.name}</strong><small>${locationProgressText(id)}</small></span>
      <small>${here ? "aqui" : locked ? "lock" : canTravel ? "ir" : isRouteLike(current) ? `${routeRemaining()} passos` : "rota"}</small>
    </button>`;
  }).join("");
  modalContent.innerHTML = `
    <h3>Mapa da Região Veyra</h3>
    <p>Use os caminhos ligados ao local atual. Bloqueios somem com insígnias.</p>
    <div class="map-list">${nodes}</div>
    <div class="modal-actions"><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const value = e.submitter?.value;
    if (!value || value === "close") return modal.close();
    modal.close();
    travel(value);
  };
  modal.showModal();
}

function openJournal() {
  playSfx("open");
  const badges = state.player.badges.length ? state.player.badges.map(b => b === "coral" ? "Insígnia Coral" : "Insígnia Beacon").join(" • ") : "nenhuma";
  modalContent.innerHTML = `
    <h3>Diário</h3>
    <div class="journal-list">
      <div class="journal-item">Objetivo<small>${currentObjective()}</small></div>
      <div class="journal-item">Local atual<small>${LOCATIONS[state.player.location].name}</small></div>
      <div class="journal-item">Insígnias<small>${badges}</small></div>
      <div class="journal-item">Progresso<small>${state.stats.wins} vitórias • ${state.stats.captures} capturas • ${state.stats.steps} viagens</small></div>
      <div class="journal-item">Assinatura<small>Jogo feito por ${state.player.name || "Luiz Matheus"} / Luix Studios.</small></div>
    </div>
    <div class="modal-actions"><button class="mini-btn primary" value="save">Salvar agora</button><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    if (e.submitter?.value === "save") saveGame(false);
    modal.close();
  };
  modal.showModal();
}

function openDex() {
  playSfx("open");
  const ids = Object.keys(POKEMON).map(Number).sort((a, b) => a - b);
  const cards = ids.map(id => {
    const seen = state.player.seen.includes(id);
    const caught = state.player.caught.includes(id);
    const mon = POKEMON[id];
    return `<button class="dex-card ${seen ? "" : "unseen"}" value="${id}" type="submit" ${seen ? "" : "disabled"}>
      <img src="${monFront(id)}" onerror="this.src='${monFallback(id)}'" alt="${seen ? mon.name : "Pokémon não visto"}">
      <strong>${seen ? mon.name : "???"}</strong>
      <small>#${String(id).padStart(3, "0")} • ${caught ? "capturado" : seen ? "visto" : "não visto"}</small>
    </button>`;
  }).join("");
  modalContent.innerHTML = `
    <h3>Pokédex Veyra</h3>
    <p>${state.player.seen.length} vistos • ${state.player.caught.length} capturados</p>
    <div class="dex-grid">${cards}</div>
    <div class="modal-actions"><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const value = e.submitter?.value;
    modal.close();
    if (value && value !== "close") showDexDetails(Number(value));
  };
  modal.showModal();
}

function showDexDetails(id) {
  const mon = POKEMON[id];
  if (!mon || !state.player.seen.includes(id)) return openDex();
  const caught = state.player.caught.includes(id);
  const learn = mon.learn.map(([lvl, move]) => `<span>${lvl}: ${MOVES[move]?.name || move}</span>`).join("");
  const areas = LOCATION_ORDER.filter(locId => LOCATIONS[locId].wild?.some(row => row[0] === id)).map(locId => LOCATIONS[locId].name).join(" • ") || "registro especial";
  modalContent.innerHTML = `
    <h3>#${String(id).padStart(3, "0")} ${mon.name}</h3>
    <div class="dex-detail">
      <img src="${monFront(id)}" onerror="this.src='${monFallback(id)}'" alt="${mon.name}">
      <div>
        <p><b>${mon.types.map(t => TYPES[t]).join(" / ")}</b></p>
        <p>Status: ${caught ? "capturado" : "visto"}</p>
        <p>Onde aparece: ${areas}</p>
        <div class="move-chip-list">${learn}</div>
      </div>
    </div>
    <div class="modal-actions"><button class="mini-btn" value="back">Voltar</button><button class="mini-btn" value="close">Fechar</button></div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    const value = e.submitter?.value;
    modal.close();
    if (value === "back") openDex();
  };
  modal.showModal();
}
function openSettings() {
  playSfx("open");
  const saved = loadGame();
  const settings = state?.settings || saved?.settings || loadSavedSettings();
  modalContent.innerHTML = `
    <h3>Configurações</h3>
    <div class="modal-row">
      <label>Texto</label>
      <select name="text">
        <option value="normal" ${settings.text === "normal" ? "selected" : ""}>Normal</option>
        <option value="fast" ${settings.text === "fast" ? "selected" : ""}>Rápido</option>
      </select>
    </div>
    <div class="modal-row">
      <label>Tema</label>
      <select name="theme">
        <option value="crystal" ${settings.theme === "crystal" ? "selected" : ""}>Crystal</option>
        <option value="night" ${settings.theme === "night" ? "selected" : ""}>Noite</option>
      </select>
    </div>
    <div class="modal-row">
      <label>Movimento</label>
      <select name="motion">
        <option value="true" ${settings.motion ? "selected" : ""}>Ligado</option>
        <option value="false" ${!settings.motion ? "selected" : ""}>Reduzido</option>
      </select>
    </div>
    <div class="modal-row two-cols">
      <label>Música</label>
      <select name="music">
        <option value="true" ${settings.music ? "selected" : ""}>Ligada</option>
        <option value="false" ${!settings.music ? "selected" : ""}>Desligada</option>
      </select>
    </div>
    <div class="modal-row two-cols">
      <label>Efeitos</label>
      <select name="sfx">
        <option value="true" ${settings.sfx ? "selected" : ""}>Ligados</option>
        <option value="false" ${!settings.sfx ? "selected" : ""}>Desligados</option>
      </select>
    </div>
    <div class="modal-row">
      <label>Volume</label>
      <input name="volume" type="range" min="0" max="100" step="5" value="${settings.volume ?? 70}">
    </div>
    <div class="modal-actions">
      <button class="mini-btn primary" value="save">Salvar</button>
      <button class="mini-btn" value="close">Fechar</button>
    </div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    if (e.submitter?.value === "close") return modal.close();
    const data = new FormData(modalContent);
    const nextSettings = normalizeSettings({
      text: data.get("text"),
      theme: data.get("theme"),
      motion: data.get("motion") === "true",
      music: data.get("music") === "true",
      sfx: data.get("sfx") === "true",
      volume: Number(data.get("volume") || 70)
    });
    if (state?.player?.party?.length) {
      state.settings = nextSettings;
      saveGame(true);
      render();
    } else {
      saveOnlySettings(nextSettings);
    }
    modal.close();
  };
  modal.showModal();
}

function startNewGame() {
  AUDIO.ensure();
  modalContent.innerHTML = `
    <h3>Novo jogo</h3>
    <p>${STORY_BEATS.intro}</p>
    <div class="modal-row">
      <label>Nome do treinador</label>
      <input name="player" maxlength="14" value="Luiz" autocomplete="off">
    </div>
    <div class="modal-actions">
      <button class="mini-btn primary" value="start">Começar</button>
      <button class="mini-btn" value="close">Cancelar</button>
    </div>
  `;
  modalContent.onsubmit = e => {
    e.preventDefault();
    if (e.submitter?.value === "close") return modal.close();
    const data = new FormData(modalContent);
    const name = String(data.get("player") || "Luiz").trim().slice(0, 14) || "Luiz";
    state = freshState();
    state.player.name = name;
    state.player.location = "brisa";
    state.flags.introActive = true;
    state.flags.introStep = 0;
    state.flags.introScene = INTRO_STEPS[0].scene;
    modal.close();
    setScreen("game");
    playIntroStep();
    render();
  };
  modal.showModal();
}

function playIntroStep() {
  const step = INTRO_STEPS[state.flags.introStep];
  if (!step) return openStarterChoice();
  state.flags.introScene = step.scene;
  say(step.text);
  render();
}

function advanceIntro() {
  state.flags.introStep += 1;
  if (state.flags.introStep >= INTRO_STEPS.length) return openStarterChoice();
  playIntroStep();
}

function skipIntroToStarter() {
  state.flags.introStep = INTRO_STEPS.length;
  state.flags.introScene = "lab";
  openStarterChoice();
}

function openStarterChoice() {
  modalContent.innerHTML = `
    <h3>Escolha seu parceiro</h3>
    <p>Aroeira: uma Poké Bola muda a rota inteira. Escolha com calma.</p>
    <div class="starter-grid">
      ${starterButton(1, "Bulbasaur", "seguro, resistente, ótimo contra Pedra e Água")}
      ${starterButton(4, "Charmander", "ofensivo, rápido, bom contra Inseto e Grama")}
      ${starterButton(7, "Squirtle", "defensivo, estável, forte contra Pedra e Fogo")}
    </div>
    <div class="modal-actions">
      <button class="mini-btn primary" value="start">Confirmar</button>
    </div>
  `;
  modalSelection = 1;
  modalContent.querySelectorAll(".choice-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      modalSelection = Number(btn.dataset.id);
      modalContent.querySelectorAll(".choice-btn").forEach(b => b.classList.remove("primary"));
      btn.classList.add("primary");
    });
  });
  modalContent.onsubmit = e => {
    e.preventDefault();
    const starter = createMon(modalSelection || 1, 5);
    state.player.party.push(starter);
    addSeen(starter.id);
    addCaught(starter.id);
    state.flags.starter = true;
    state.flags.introActive = false;
    state.flags.introScene = "town";
    state.flags.introDone = true;
    modal.close();
    say(`Aroeira: ${starter.name} agora é seu parceiro. A Rota 01 espera lá fora.`);
    saveGame(true);
    render();
  };
  modal.showModal();
}

function starterButton(id, name, hint = "") {
  return `<button class="choice-btn ${id === 1 ? "primary" : ""}" data-id="${id}" type="button">
    <img src="${monFront(id)}" onerror="this.src='${monFallback(id)}'" alt="${name}">
    <strong>${name}</strong>
    <small>${hint}</small>
  </button>`;
}

function continueGame() {
  AUDIO.ensure();
  const loaded = loadGame();
  if (!loaded) {
    state = freshState();
    openSettings();
    state = null;
    alert("Nenhum save encontrado.");
    return;
  }
  state = loaded;
  battle = null;
  setScreen("game");
  const loc = LOCATIONS[state.player.location];
  say(loc.text);
  render();
}


function isStandaloneMode() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || "");
}

function updateInstallUI() {
  const btn = $("#installBtn");
  const hint = $("#installHint");
  if (!btn || !hint) return;

  if (isStandaloneMode()) {
    btn.hidden = true;
    hint.hidden = true;
    return;
  }

  btn.hidden = false;
  hint.hidden = false;
  btn.textContent = deferredInstallPrompt ? "Instalar como app" : "Instalar no celular";
  hint.textContent = isIOSDevice()
    ? "No iPhone: Safari → Compartilhar → Adicionar à Tela de Início."
    : "Também funciona como atalho/app quando publicado no GitHub Pages.";
}

function openInstallHelp() {
  const ios = isIOSDevice();
  modalContent.innerHTML = `
    <h3>Instalar no celular</h3>
    <p>${ios
      ? "No iPhone, abra pelo Safari, toque no botão Compartilhar e escolha Adicionar à Tela de Início. Depois o jogo abre como app, sem a barra do navegador."
      : "Quando o navegador permitir, toque em Instalar. Se não aparecer, use o menu do navegador e escolha Instalar app ou Adicionar à tela inicial."}</p>
    <p>O save continua no próprio aparelho. Depois de publicado no GitHub Pages, o jogo também guarda arquivos principais em cache para abrir mais rápido.</p>
    <div class="modal-actions"><button class="mini-btn primary" value="close">Entendi</button></div>
  `;
  modalContent.onsubmit = e => { e.preventDefault(); modal.close(); };
  modal.showModal();
}

async function handleInstallClick() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch {}
    deferredInstallPrompt = null;
    updateInstallUI();
    return;
  }
  openInstallHelp();
}

function setupInstallExperience() {
  const btn = $("#installBtn");
  if (!btn) return;
  btn.addEventListener("click", handleInstallClick);
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallUI();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    updateInstallUI();
  });
  updateInstallUI();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!/^https?:$/.test(window.location.protocol)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function init() {
  document.addEventListener("pointerdown", () => AUDIO.ensure(), { once: true });
  document.addEventListener("click", event => { if (event.target.closest("button")) playSfx("tap"); });
  setupInstallExperience();
  registerServiceWorker();
  $("#newGameBtn").addEventListener("click", startNewGame);
  $("#continueBtn").addEventListener("click", continueGame);
  $("#settingsBtn").addEventListener("click", openSettings);
  $("#quickSaveBtn").addEventListener("click", () => saveGame(false));
  $("#mapTopBtn").addEventListener("click", openMap);
  $("#dockMenuBtn").addEventListener("click", openGameMenu);
  $("#dockPartyBtn").addEventListener("click", openPartyMenu);
  $("#dockMapBtn").addEventListener("click", openMap);
  $("#dockSaveBtn").addEventListener("click", () => saveGame(false));
  $("#openSettingsBtn").addEventListener("click", openSettings);
  $("#toMenuBtn").addEventListener("click", () => { battle = null; setScreen("menu"); });
  if (!loadGame()) $("#continueBtn").disabled = true;
}

init();
