/* Pokémon Veyra v1.5 — top-down GBC-style RPG */
(() => {
  const { crystalSprite, crystalBackSprite, defaultSprite, typeIcon, TYPES, TYPE_CHART, MOVES, LEARNSETS, DEX, ITEMS, TILE, MAPS, STARTERS, TRAINER_LOOK, ASSET_CREDITS } = window.VEYRA_DATA;
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
  const choice = arr => arr[Math.floor(Math.random()*arr.length)];
  const uid = () => Math.random().toString(36).slice(2,9);

  const canvas = $('#mapCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const VIEW_W = 240, VIEW_H = 160, TILE_SIZE = 16;
  canvas.width = VIEW_W; canvas.height = VIEW_H;

  const SAVE_KEY = 'pokemon-veyra-save-v16';
  const VERSION = '1.6.0';

  const defaultSettings = { music:true, sfx:true, volume:.24, motion:true, textSpeed:18, theme:'crystal', musicMode:'varied' };
  let state = null;
  let activeScreen = 'title';
  let menuOpen = false;
  let menuSection = 'party';
  let messageQueue = [];
  let typing = false;
  let battle = null;
  let locks = { move:false, dialog:false, battle:false };
  let lastRender = 0;
  let shake = 0;
  let encounterCooldown = 0;

  class AudioEngine {
    constructor(){ this.ctx=null; this.master=null; this.musicGain=null; this.current=null; this.timer=null; this.step=0; }
    ensure(){
      if(this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.master.gain.value = state?.settings?.volume ?? defaultSettings.volume;
      this.musicGain.gain.value = .55;
      this.musicGain.connect(this.master); this.master.connect(this.ctx.destination);
    }
    setVolume(v){ if(this.master) this.master.gain.value = v; }
    tone(freq, dur=.09, type='square', gain=.05){
      if(!state?.settings?.sfx) return;
      this.ensure(); if(!this.ctx) return;
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.value = gain; g.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.master); o.start(); o.stop(this.ctx.currentTime + dur);
    }
    sfx(name){
      if(!state?.settings?.sfx) return;
      const pack = {
        click:[[420,.04],[640,.04]], step:[[126,.025]], bump:[[80,.06],[60,.08]], heal:[[520,.05],[660,.05],[820,.08]],
        hit:[[140,.04],[92,.08]], dmg:[[180,.04],[120,.06]], catch:[[420,.05],[520,.05],[620,.07]], fail:[[220,.04],[180,.04],[130,.08]],
        win:[[660,.06],[880,.06],[990,.12]], lose:[[200,.08],[160,.1],[120,.14]], level:[[520,.05],[660,.05],[880,.05],[1040,.12]],
        start:[[120,.05],[180,.05],[260,.05],[360,.09]]
      }[name] || [[440,.06]];
      pack.forEach(([n,d],i)=>setTimeout(()=>this.tone(n,d,'square',.032),i*58));
    }
    play(track){
      if(!state?.settings?.music) return;
      this.ensure(); if(!this.ctx) return;
      if(this.current === track && this.timer) return;
      this.stop(); this.current = track; this.step = 0;
      const N = {c3:131,d3:147,e3:165,f3:175,g3:196,a3:220,b3:247,c4:262,d4:294,e4:330,f4:349,g4:392,a4:440,b4:494,c5:523,d5:587,e5:659,f5:698,g5:784,a5:880};
      const themes = {
        menu:{tempo:340, wave:'square', bass:[N.c3,N.g3,N.a3,N.g3], notes:[N.e4,0,N.g4,N.c5,0,N.b4,N.a4,0,N.g4,N.e4,0,N.d4,N.e4,N.g4,0,N.c5]},
        home:{tempo:420, wave:'triangle', bass:[N.c3,N.g3,N.f3,N.g3], notes:[N.e4,0,N.g4,0,N.c5,0,N.g4,0,N.f4,0,N.e4,0,N.d4,0,N.c4,0]},
        lab:{tempo:300, wave:'square', bass:[N.e3,N.g3,N.d3,N.a3], notes:[N.e4,N.g4,N.b4,0,N.a4,N.g4,0,N.e4,N.d4,N.f4,N.a4,0,N.g4,N.f4,N.e4,0]},
        cove:{tempo:360, wave:'square', bass:[N.g3,N.d3,N.e3,N.c3], notes:[N.g4,N.a4,N.b4,0,N.d5,N.b4,N.a4,0,N.g4,0,N.e4,N.g4,N.a4,0,N.g4,0]},
        route:{tempo:280, wave:'square', bass:[N.c3,N.g3,N.a3,N.f3], notes:[N.c5,N.d5,N.e5,0,N.d5,N.c5,N.a4,0,N.g4,N.a4,N.c5,0,N.d5,N.c5,N.a4,0]},
        forest:{tempo:390, wave:'triangle', bass:[N.a3,N.e3,N.f3,N.e3], notes:[N.e4,0,N.a4,0,N.g4,0,N.e4,0,N.d4,N.e4,0,N.g4,0,N.a4,0,N.e4]},
        cave:{tempo:470, wave:'sine', bass:[N.c3,0,N.d3,0], notes:[N.g3,0,N.a3,0,N.c4,0,N.a3,0,N.f3,0,N.g3,0,N.d3,0,0,0]},
        coast:{tempo:330, wave:'triangle', bass:[N.f3,N.c3,N.g3,N.c3], notes:[N.a4,N.c5,N.d5,0,N.e5,0,N.d5,N.c5,N.a4,0,N.g4,N.a4,N.c5,0,N.a4,0]},
        noxport:{tempo:310, wave:'square', bass:[N.d3,N.a3,N.g3,N.a3], notes:[N.d4,N.f4,N.a4,0,N.c5,N.a4,N.f4,0,N.g4,N.b4,N.d5,0,N.c5,N.b4,N.a4,0]},
        gym:{tempo:250, wave:'square', bass:[N.d3,N.d3,N.f3,N.a3], notes:[N.d4,N.f4,N.a4,N.d5,0,N.a4,N.f4,0,N.e4,N.g4,N.b4,N.e5,0,N.b4,N.g4,0]},
        battle:{tempo:180, wave:'square', bass:[N.c3,N.c3,N.g3,N.c3], notes:[N.c4,N.g4,N.c5,N.g4,N.d4,N.a4,N.d5,N.a4,N.e4,N.b4,N.e5,N.b4,N.f4,N.c5,N.f5,N.c5]}
      };
      const t = themes[track] || themes.route;
      this.timer = setInterval(()=>{
        if(!state.settings.music) return;
        const i = this.step % t.notes.length;
        const n = t.notes[i];
        if(n) this.musicTone(n, track==='battle'? .09 : .16, track==='battle'? .018 : .012, t.wave);
        if(i % 4 === 0){ const b=t.bass[(this.step/4|0)%t.bass.length]; if(b) this.musicTone(b, .18, .009, 'triangle'); }
        if(track==='battle' && i % 8 === 0) this.musicTone(70,.035,.012,'square');
        this.step++;
      }, t.tempo);
    }
    musicTone(freq, dur=.12, gain=.012, type='square'){
      this.ensure(); if(!this.ctx) return;
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(gain, this.ctx.currentTime + .015);
      g.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.musicGain || this.master); o.start(); o.stop(this.ctx.currentTime + dur + .02);
    }
    stop(){ if(this.timer) clearInterval(this.timer); this.timer=null; this.current=null; }
  }
  const audio = new AudioEngine();

  function newState(){
    return {
      version: VERSION,
      map: 'bedroom', x: 7, y: 7, face:'down', money: 0, steps: 0,
      playerName: 'Luiz', badges: [], flags:{ introDone:false, woke:false },
      bag:{}, keyItems:{}, party:[], box:[], seen:{}, caught:{}, defeated:{}, picked:{},
      quest: 'Acorde, desça e procure o Laboratório Aroeira.', settings:{...defaultSettings}, repel:0,
      routeProgress:{}, stats:{ caught:0, wins:0, playStarted:Date.now() }
    };
  }

  function save(){ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); toast('Jogo salvo.'); }
  function load(){
    try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }
  function eraseSave(){ localStorage.removeItem(SAVE_KEY); state = newState(); showScreen('title'); renderTitle(); }

  function addItem(item, qty=1){
    if(ITEMS[item]?.key) state.keyItems[item] = true;
    else state.bag[item] = (state.bag[item] || 0) + qty;
  }
  function takeItem(item, qty=1){
    if((state.bag[item] || 0) < qty) return false;
    state.bag[item] -= qty; if(state.bag[item] <= 0) delete state.bag[item]; return true;
  }
  function hasFlag(flag){ return !!state.flags[flag] || !!state.defeated[flag] || state.badges.includes(flag); }
  function setFlag(flag, value=true){ state.flags[flag] = value; }

  function makeMon(mon, level=5, wild=false){
    const spec = DEX[mon];
    const iv = wild ? Math.floor(Math.random()*5) : 3;
    const stats = calcStats(spec, level, iv);
    const moves = (LEARNSETS[mon] || [[1,'tackle']]).filter(([lvl]) => lvl <= level).slice(-4).map(([_, id]) => ({ id, pp: MOVES[id].pp }));
    return { uid:uid(), mon, name:spec.name, level, exp:0, next: nextExp(level), hp:stats.hp, maxHp:stats.hp, stats, moves, status:null, iv, fainted:false };
  }
  function calcStats(spec, level, iv=3){
    const b = spec.base;
    return {
      hp: Math.floor(((b.hp + iv) * 2 * level)/100) + level + 10,
      atk: Math.floor(((b.atk + iv) * 2 * level)/100) + 5,
      def: Math.floor(((b.def + iv) * 2 * level)/100) + 5,
      spd: Math.floor(((b.spd + iv) * 2 * level)/100) + 5
    };
  }
  function nextExp(level){ return Math.floor(20 + level * level * 6.2); }
  function healAll(){
    state.party.forEach(m => { m.stats = calcStats(DEX[m.mon], m.level, m.iv); m.maxHp = m.stats.hp; m.hp = m.maxHp; m.status = null; m.fainted=false; m.moves.forEach(x => x.pp = MOVES[x.id].pp); });
  }
  function activeMon(){ return state.party.find(m => m.hp > 0) || state.party[0]; }
  function addPokemon(mon){
    state.seen[mon.mon] = true; state.caught[mon.mon] = true;
    if(state.party.length < 6) state.party.push(mon); else state.box.push(mon);
    state.stats.caught = Object.keys(state.caught).length;
  }

  function showScreen(name){
    activeScreen = name;
    $$('.screen').forEach(s => s.classList.remove('is-active'));
    $(`#${name}Screen`)?.classList.add('is-active');
    document.body.dataset.screen = name;
    if(name === 'game') startMapMusic();
    if(name === 'title') audio.play('menu');
  }

  function renderTitle(){
    const canContinue = !!load();
    $('#titleActions').innerHTML = `
      <button class="primary" id="newGameBtn"><span>▶</span> Novo jogo</button>
      <button ${canContinue?'':'disabled'} id="continueBtn"><span>◆</span> Continuar</button>
      <button id="termsBtn"><span>©</span> Termos</button>
    `;
    $('#newGameBtn').onclick = () => { audio.ensure(); audio.sfx('click'); startNewGame(); };
    $('#continueBtn').onclick = () => { const s=load(); if(s){ state = mergeSave(s); audio.ensure(); audio.sfx('click'); showGame(); } };
    $('#termsBtn').onclick = () => showTerms();
  }
  function mergeSave(s){
    return { ...newState(), ...s, settings:{...defaultSettings, ...(s.settings||{})}, flags:{...(s.flags||{})}, bag:{...(s.bag||{})}, routeProgress:{...(s.routeProgress||{})} };
  }

  async function startNewGame(){
    state = newState();
    showScreen('cinematic');
    audio.play('lab');
    await cinematic([
      ['professor','Olá. Sou Aroeira. Eu estudo rotas que mudam com a maré e Pokémon que aparecem só quando o clima vira.'],
      ['professor','Treinadores apressados passam reto por itens, atalhos e encontros raros. Os bons observam o mapa.'],
      ['professor','Hoje você vai sair de Cove pela primeira vez. Antes disso, escolha bem seu parceiro.'],
      ['black','Um bipe antigo toca no quarto. A tela do relógio pisca 07:10.'],
      ['black','Você acorda com o som distante de Wingull e passos no laboratório ao leste.']
    ]);
    state.flags.introDone = true; state.flags.woke = true;
    showGame();
    await say(['Você acordou em Cove. O laboratório fica a leste da praça.']);
  }

  async function cinematic(lines){
    const box = $('#cinematicBox');
    for(const [who,text] of lines){
      box.dataset.who = who;
      box.innerHTML = `<div class="cinematic-portrait ${who}">${trainerPortraitHtml(who)}</div><p></p>`;
      await typeInto(box.querySelector('p'), text, state?.settings?.textSpeed ?? 22);
      await waitForTap(box);
    }
  }
  function waitForTap(node){ return new Promise(resolve => { const done=()=>{ node.removeEventListener('click', done); window.removeEventListener('keydown', done); resolve(); }; node.addEventListener('click', done); window.addEventListener('keydown', done, {once:true}); }); }
  function trainerPortraitHtml(who){ const role = who==='professor'?'professor':who==='black'?'':who; const src = role && TRAINER_LOOK[role]?.sprite; return src ? `<img src="${src}" alt=""/>` : ''; }
  function rolePortrait(role){ return TRAINER_LOOK[role]?.sprite || TRAINER_LOOK.npc.sprite; }

  function typeInto(el, text, speed=22){
    if(!state?.settings?.motion){ el.textContent = text; return Promise.resolve(); }
    return new Promise(resolve=>{ let i=0; const tick=()=>{ el.textContent = text.slice(0,i++); if(i<=text.length) setTimeout(tick, speed); else resolve(); }; tick(); });
  }

  function showGame(){
    showScreen('game');
    menuOpen=false; closeMenu(); closeBattle();
    updateHud(); renderMap(); renderDialogueHint(); startMapMusic();
  }
  function startMapMusic(){ if(!battle) audio.play(MAPS[state.map]?.music || 'route'); }

  function currentMap(){ return MAPS[state.map]; }
  function tileAt(map, x, y){
    const rows = map.rows; if(y<0 || y>=rows.length) return '#';
    const row = rows[y]; if(x<0 || x>=row.length) return '#';
    return row[x] || '#';
  }
  function isSolid(x,y){
    const ch = tileAt(currentMap(),x,y); if(TILE[ch]?.solid) return true;
    if(npcAt(x,y)) return true;
    return false;
  }
  function visibleNpc(n){ return !n.flag || hasFlag(n.flag) || n.trainer; }
  function npcAt(x,y){ return (currentMap().npcs || []).find(n => visibleNpc(n) && n.x===x && n.y===y && !(n.trainer && hasFlag(n.flag))); }
  function itemAt(x,y){ return (currentMap().items || []).find(it => it.x===x && it.y===y && !state.picked[it.id]); }
  function signAt(x,y){ return (currentMap().signs || []).find(s => s.x===x && s.y===y); }
  function frontTile(){ const d = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[state.face]; return {x:state.x+d[0], y:state.y+d[1]}; }

  function move(dir){
    if(activeScreen !== 'game' || menuOpen || locks.move || locks.dialog || battle) return;
    const delta = {up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir]; if(!delta) return;
    state.face = dir;
    const nx = state.x + delta[0], ny = state.y + delta[1];
    const lock = (currentMap().exits||[]).find(e => e.at.x===nx && e.at.y===ny && !hasFlag(e.lockedFlag));
    if(lock){ audio.sfx('bump'); say([lock.lockText]); renderMap(); return; }
    if(isSolid(nx,ny)){ audio.sfx('bump'); renderMap(); return; }
    state.x = nx; state.y = ny; state.steps++; audio.sfx('step');
    if(state.repel > 0) state.repel--;
    advanceRouteProgress();
    renderMap(); updateHud(); checkWarp(); maybeEncounter();
  }

  function advanceRouteProgress(){
    const map = currentMap(); if(!map.minSteps) return;
    state.routeProgress[state.map] = Math.min(map.minSteps, (state.routeProgress[state.map]||0) + 1);
  }
  function canLeaveRoute(){
    const map = currentMap(); if(!map.minSteps) return true;
    return (state.routeProgress[state.map]||0) >= map.minSteps;
  }
  async function checkWarp(){
    const map = currentMap();
    const warp = (map.warps || []).find(w => w.x===state.x && w.y===state.y);
    if(!warp) return;
    if(map.minSteps && !canLeaveRoute() && warp.y > 1){
      await say([`Você ainda não atravessou ${map.name}. Explore mais alguns passos.`]);
      return;
    }
    transition('fade');
    await sleep(260);
    state.map = warp.to; state.x = warp.tx; state.y = warp.ty; encounterCooldown = 4;
    updateHud(); renderMap(); startMapMusic();
  }
  function maybeEncounter(){
    if(encounterCooldown-- > 0) return;
    const map = currentMap(); const ch = tileAt(map,state.x,state.y);
    if(!TILE[ch]?.encounter && map.type !== 'cave' && map.type !== 'coast') return;
    if(!map.encounters || !state.party.length || state.repel>0) return;
    const rate = map.type === 'cave' ? .14 : map.type === 'coast' ? .11 : .095;
    if(Math.random() > rate) return;
    encounterCooldown = 8;
    const enc = weighted(map.encounters); const level = enc.min + Math.floor(Math.random()*(enc.max-enc.min+1));
    startBattle({ type:'wild', enemy: makeMon(enc.mon, level, true), source:'wild' });
  }
  function weighted(list){ const total=list.reduce((s,a)=>s+a.w,0); let r=Math.random()*total; for(const it of list){ r-=it.w; if(r<=0) return it; } return list[0]; }

  function renderMap(){
    const map = currentMap();
    ctx.clearRect(0,0,VIEW_W,VIEW_H);
    const camX = clamp(state.x*TILE_SIZE - VIEW_W/2 + TILE_SIZE/2, 0, Math.max(0, maxWidth(map)*TILE_SIZE - VIEW_W));
    const camY = clamp(state.y*TILE_SIZE - VIEW_H/2 + TILE_SIZE/2, 0, Math.max(0, map.rows.length*TILE_SIZE - VIEW_H));
    const sx = Math.floor(camX/TILE_SIZE), sy = Math.floor(camY/TILE_SIZE);
    const ex = sx + Math.ceil(VIEW_W/TILE_SIZE)+1, ey = sy + Math.ceil(VIEW_H/TILE_SIZE)+1;
    for(let y=sy; y<ey; y++) for(let x=sx; x<ex; x++) drawTile(tileAt(map,x,y), x*TILE_SIZE-camX, y*TILE_SIZE-camY, x, y);
    (map.items||[]).forEach(it=>{ if(!state.picked[it.id]) drawItem(it.x*TILE_SIZE-camX, it.y*TILE_SIZE-camY); });
    (map.npcs||[]).forEach(n => { if(visibleNpc(n) && !(n.trainer && hasFlag(n.flag))) drawPerson(n.x*TILE_SIZE-camX, n.y*TILE_SIZE-camY, n.role || 'npc', n.face); });
    drawPerson(state.x*TILE_SIZE-camX, state.y*TILE_SIZE-camY, 'hero', state.face, true);
    if(shake>0){ canvas.style.transform = `translate(${Math.sin(Date.now()/20)*2}px,0)`; shake--; } else canvas.style.transform = '';
  }
  function maxWidth(map){ return Math.max(...map.rows.map(r=>r.length)); }
  function drawTile(ch, x, y, tx, ty){
    const style = getComputedStyle(document.documentElement);
    const colors = {
      '.':'#d8e0a0', ',':'#9ccf6a', 'g':'#5fbf55', '#':'#796248', 'T':'#266b34', 'w':'#4aa3d8', 'p':'#d6c17f', '=':'#b78954', 'd':'#8b5a2b', 's':'#caa45a', 'b':'#6699cc', 'c':'#9c6b43', 'r':'#c85757', 'm':'#76a9c9', 'h':'#bc755a', 'l':'#796248', 'o':'#6c6a67', 'x':'#3e4558', 'f':'#89cc6a'
    };
    ctx.fillStyle = colors[ch] || '#d8e0a0'; ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
    if(ch === 'g'){ ctx.fillStyle = '#3f9d43'; for(let i=0;i<4;i++) ctx.fillRect(x+2+i*4,y+4+(i%2)*5,2,7); }
    if(ch === 'T'){ ctx.fillStyle='#1f5c2d'; ctx.fillRect(x+1,y+1,14,12); ctx.fillStyle='#68462e'; ctx.fillRect(x+6,y+10,4,6); }
    if(ch === 'w'){ ctx.fillStyle='#8ad4ff'; ctx.fillRect(x+2, y+5+(Math.sin((Date.now()/300)+tx)*1), 12, 2); }
    if(ch === 'p'){ ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fillRect(x+1,y+1,14,1); ctx.fillStyle='rgba(0,0,0,.08)'; ctx.fillRect(x+0,y+15,16,1); }
    if(ch === 'h'){ ctx.fillStyle='#6c3f36'; ctx.fillRect(x+1,y+1,14,5); ctx.fillStyle='#ead69d'; ctx.fillRect(x+2,y+6,12,9); ctx.fillStyle='#4a3328'; ctx.fillRect(x+6,y+9,4,6); }
    if(ch === 'o'){ ctx.fillStyle='#94918b'; ctx.fillRect(x+2,y+3,12,10); ctx.fillStyle='#4f4d4b'; ctx.fillRect(x+4,y+11,9,2); }
    if(ch === 'b'){ ctx.fillStyle='#2c80ba'; ctx.fillRect(x+2,y+3,12,10); ctx.fillStyle='#fff1d6'; ctx.fillRect(x+3,y+4,6,4); }
    if(ch === 's'){ ctx.fillStyle='#7a4d2a'; ctx.fillRect(x+7,y+6,2,10); ctx.fillStyle='#eacb68'; ctx.fillRect(x+3,y+2,10,6); }
    if(ch === 'c'){ ctx.fillStyle='#895636'; ctx.fillRect(x+1,y+7,14,7); ctx.fillStyle='#d9a764'; ctx.fillRect(x+1,y+5,14,3); }
    if(ch === 'm'){ ctx.fillStyle='#5287a8'; ctx.fillRect(x+2,y+2,12,12); ctx.fillStyle='#d4f1ff'; ctx.fillRect(x+4,y+4,8,4); }
    if(ch === 'f'){ ctx.fillStyle='#ff7bb5'; ctx.fillRect(x+4,y+5,2,2); ctx.fillStyle='#ffe36a'; ctx.fillRect(x+10,y+9,2,2); }
  }
  function drawPerson(x,y,role,face='down',hero=false){
    const p = TRAINER_LOOK[role] || TRAINER_LOOK.npc;
    const bob = hero && state.settings.motion ? Math.sin(Date.now()/110) * 1.1 : 0;
    const px = Math.round(x), py = Math.round(y + bob);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(px+3,py+13,10,2);
    // legs with tiny walking frame
    const step = hero ? ((state.steps % 2) ? 1 : 0) : 0;
    ctx.fillStyle = '#263238';
    ctx.fillRect(px+4,py+11,3,4+step); ctx.fillRect(px+9,py+11+step,3,4-step);
    // body outline + body
    ctx.fillStyle = '#101828'; ctx.fillRect(px+3,py+5,10,8);
    ctx.fillStyle = p.body; ctx.fillRect(px+4,py+6,8,6); ctx.fillRect(px+5,py+12,6,2);
    // face/head
    ctx.fillStyle = '#101828'; ctx.fillRect(px+4,py+1,8,6);
    ctx.fillStyle = '#f2c39b'; ctx.fillRect(px+5,py+2,6,5);
    // hair/hat
    ctx.fillStyle = p.hat || p.hair; ctx.fillRect(px+4,py,8,3); if(p.hat) ctx.fillRect(px+9,py+2,4,2);
    ctx.fillStyle = p.hair; if(!p.hat) ctx.fillRect(px+4,py+1,2,4);
    // facing indicator
    ctx.fillStyle = '#101828';
    if(face==='left') ctx.fillRect(px+4,py+4,1,1);
    else if(face==='right') ctx.fillRect(px+11,py+4,1,1);
    else if(face==='up') ctx.fillRect(px+6,py+1,4,1);
    else { ctx.fillRect(px+6,py+4,1,1); ctx.fillRect(px+10,py+4,1,1); }
    if(role==='professor'){ ctx.fillStyle='#fff'; ctx.fillRect(px+3,py+7,10,5); }
    if(role==='nurse'){ ctx.fillStyle='#fff'; ctx.fillRect(px+5,py+1,6,2); ctx.fillStyle='#ef5350'; ctx.fillRect(px+7,py+1,2,2); }
    ctx.restore();
  }
  function drawItem(x,y){
    ctx.fillStyle='rgba(0,0,0,.20)'; ctx.fillRect(x+4,y+12,8,3);
    ctx.fillStyle='#fff'; ctx.fillRect(x+4,y+4,8,8); ctx.fillStyle='#d84343'; ctx.fillRect(x+4,y+4,8,4); ctx.fillStyle='#222'; ctx.fillRect(x+4,y+7,8,2); ctx.fillStyle='#fff'; ctx.fillRect(x+7,y+6,2,2);
  }

  function updateHud(){
    const map = currentMap();
    $('#locName').textContent = map.name;
    $('#moneyText').textContent = `₽ ${state.money}`;
    $('#questText').textContent = state.quest;
    $('#partyHud').innerHTML = state.party.map((m,i)=>`<span class="mini-ball ${m.hp<=0?'fainted':''}" title="${m.name} Lv.${m.level}"></span>`).join('') || '<small>sem parceiro</small>';
    const mapProgress = map.minSteps ? Math.floor(((state.routeProgress[state.map]||0)/map.minSteps)*100) : 100;
    $('#routeProgress').style.width = `${clamp(mapProgress,0,100)}%`;
    $('#routeProgressWrap').hidden = !map.minSteps;
  }

  async function say(lines){
    locks.dialog = true;
    const box = $('#dialogue'); box.classList.add('show');
    for(const line of lines){
      box.innerHTML = '<p></p><span class="continue">toque</span>';
      await typeInto(box.querySelector('p'), line, state.settings.textSpeed);
      await waitForTap(box);
    }
    box.classList.remove('show'); locks.dialog = false; renderDialogueHint();
  }
  function renderDialogueHint(){ $('#dialogue').innerHTML = '<p>Use o direcional. A: interagir. B: menu.</p>'; }

  async function interact(){
    if(activeScreen !== 'game' || menuOpen || locks.dialog || battle) return;
    audio.ensure(); audio.sfx('click');
    const f = frontTile();
    const npc = npcAt(f.x,f.y) || npcAt(state.x,state.y);
    if(npc){ await handleNpc(npc); return; }
    const item = itemAt(state.x,state.y) || itemAt(f.x,f.y);
    if(item){ state.picked[item.id]=true; addItem(item.item,item.qty); await say([`Você encontrou ${item.qty}× ${ITEMS[item.item].name}.`]); updateHud(); renderMap(); return; }
    const sign = signAt(f.x,f.y); if(sign){ await say([sign.text]); return; }
    const ch = tileAt(currentMap(), f.x, f.y);
    if(TILE[ch]?.water && state.keyItems.oldrod){ fish(); return; }
    await say(['Nada interessante aqui.']);
  }

  async function handleNpc(npc){
    if(npc.trainer && !hasFlag(npc.flag)){ await say(npc.before || [`${npc.name} quer batalhar!`]); startBattle({type:'trainer', trainer:npc, enemyTeam:npc.team.map(t=>makeMon(t.mon,t.level,true))}); return; }
    if(npc.script === 'professorIntro'){ await professorScript(); return; }
    if(npc.script === 'heal'){ healAll(); audio.sfx('heal'); await say(['Seus Pokémon foram restaurados.', 'Volte sempre que precisar.']); saveSilent(); updateHud(); return; }
    if(npc.script === 'shop'){ openShop(); return; }
    const lines = (npc.afterFlag && hasFlag(npc.afterFlag) && npc.afterLines) ? npc.afterLines : (npc.lines || ['...']);
    await say(lines);
    if(npc.gift && !hasFlag(npc.gift.once) && (!npc.afterFlag || hasFlag(npc.afterFlag))){ addItem(npc.gift.item,npc.gift.qty); setFlag(npc.gift.once); await say([`Você recebeu ${npc.gift.qty}× ${ITEMS[npc.gift.item].name}.`]); }
  }

  async function professorScript(){
    if(!hasFlag('starterChosen')){
      await say(['Você veio. Bom.', 'Não vou te entregar um discurso gigante.', 'Escolha um parceiro. Depois prove que sabe cuidar dele.']);
      openStarterModal(); return;
    }
    await say(['Registre tudo na Dex. Vitória sem observação vira sorte.']);
  }
  function openStarterModal(){
    const modal = $('#modal'); modal.classList.add('open');
    modal.innerHTML = `<div class="modal-card starter-card"><h2>Escolha seu parceiro</h2><div class="starter-grid">${STARTERS.map(s=>`
      <button class="starter" data-mon="${s.mon}"><img src="${crystalSprite(DEX[s.mon].id)}" onerror="this.src='${defaultSprite(DEX[s.mon].id)}'"/><b>${DEX[s.mon].name}</b><small>${s.text}</small></button>`).join('')}</div></div>`;
    modal.querySelectorAll('.starter').forEach(btn=>btn.onclick=async()=>{
      const mon = btn.dataset.mon; modal.classList.remove('open'); modal.innerHTML='';
      addPokemon(makeMon(mon,5,false)); addItem('dex',1); addItem('pokeball',5); state.money=300;
      setFlag('starterChosen'); state.quest = 'Atravesse a Rota 01, vença Niko e chegue ao Bosque Baixo.';
      audio.sfx('level'); updateHud(); saveSilent(); renderMap();
      await say([`${DEX[mon].name} entrou para sua equipe.`, 'Você recebeu a Veyra Dex e 5 Poké Balls.', 'Agora sim: a rota ao sul está liberada.']);
    });
  }

  function fish(){
    const table = [{mon:'magikarp',min:5,max:8,w:80},{mon:'tentacool',min:7,max:10,w:20}];
    if(Math.random()<.55) say(['Nem uma mordida...']); else { const enc = weighted(table); startBattle({type:'wild', enemy:makeMon(enc.mon, enc.min + Math.floor(Math.random()*(enc.max-enc.min+1)), true), source:'fish'}); }
  }

  function transition(type='fade'){
    const t = $('#transition'); t.className = `transition ${type} play`; setTimeout(()=>t.className='transition', 520);
  }
  function toast(text){ const t=$('#toast'); t.textContent=text; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1500); }
  function saveSilent(){ localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }

  function openMenu(section='party'){
    if(battle || activeScreen !== 'game') return;
    menuOpen=true; menuSection=section; audio.sfx('click');
    $('#menu').classList.add('open'); renderMenu();
  }
  function closeMenu(){ menuOpen=false; $('#menu').classList.remove('open'); }
  function renderMenu(){
    $('#menu').innerHTML = `<div class="menu-card">
      <header><span class="menu-avatar"><img src="${rolePortrait('hero')}" alt=""></span><b>Menu</b><button id="closeMenu">×</button></header>
      <nav class="menu-nav">
        ${buttonTab('party','👥 Equipe')}${buttonTab('bag','🎒 Bolsa')}${buttonTab('dex','📘 Dex')}${buttonTab('quest','⭐ Jornada')}${buttonTab('settings','⚙ Config')}${buttonTab('terms','© Termos')}
      </nav>
      <section id="menuBody"></section>
    </div>`;
    $('#closeMenu').onclick = closeMenu;
    $$('.menu-nav button').forEach(btn=>btn.onclick=()=>{ menuSection=btn.dataset.section; renderMenu(); });
    renderMenuBody();
  }
  function buttonTab(id,label){ return `<button data-section="${id}" class="${menuSection===id?'active':''}">${label}</button>`; }
  function renderMenuBody(){
    const body = $('#menuBody');
    if(menuSection==='party') body.innerHTML = renderParty();
    if(menuSection==='bag') body.innerHTML = renderBag();
    if(menuSection==='dex') body.innerHTML = renderDex();
    if(menuSection==='quest') body.innerHTML = renderQuest();
    if(menuSection==='settings') body.innerHTML = renderSettings();
    if(menuSection==='terms') body.innerHTML = renderTermsHtml();
    bindMenuActions();
  }
  function renderParty(){
    if(!state.party.length) return '<p class="empty">Nenhum Pokémon na equipe.</p>';
    return `<div class="party-list">${state.party.map((m,i)=>`
      <article class="party-card ${m.hp<=0?'fainted':''}">
        <img src="${crystalSprite(DEX[m.mon].id)}" onerror="this.src='${defaultSprite(DEX[m.mon].id)}'">
        <div><b>${m.name}</b><span>Lv.${m.level} ${m.status?`· ${m.status}`:''}</span><div class="hp"><i style="width:${(m.hp/m.maxHp)*100}%"></i></div><small>${m.hp}/${m.maxHp} HP · EXP ${m.exp}/${m.next}</small></div>
        <button data-summary="${i}">Golpes</button>
      </article>`).join('')}</div><div class="menu-actions"><button id="saveBtn">Salvar</button><button id="healDebug">Organizar Box</button></div>`;
  }
  function renderBag(){
    const entries = Object.entries(state.bag);
    const keys = Object.keys(state.keyItems);
    return `<div class="bag-grid">${entries.length?entries.map(([id,qty])=>bagItem(id,qty)).join(''):'<p class="empty">Bolsa vazia.</p>'}</div>
      <h3>Itens-chave</h3><div class="key-grid">${keys.length?keys.map(id=>bagItem(id,'')).join(''):'<p class="empty">Nenhum item-chave.</p>'}</div>`;
  }
  function bagItem(id,qty){ const it=ITEMS[id]; const usable = qty && (it.heal || it.cure || it.repel || it.escape); return `<article class="bag-item"><img src="${it.icon}"/><b>${it.name}</b><small>${it.desc}</small><span>${qty?`×${qty}`:''}</span>${usable?`<button data-use-bag="${id}">Usar</button>`:''}</article>`; }
  function renderDex(){
    const mons = Object.keys(DEX).filter(k => state.seen[k] || state.caught[k] || ['bulbasaur','charmander','squirtle'].includes(k));
    return `<div class="dex-grid">${mons.map(k=>{ const d=DEX[k], seen=state.seen[k]||state.caught[k], caught=state.caught[k]; return `<button class="dex-card ${caught?'caught':seen?'seen':'unknown'}" data-dex="${k}"><img src="${seen?crystalSprite(d.id):''}" onerror="this.src='${defaultSprite(d.id)}'"><b>${seen?d.name:'????'}</b><small>${caught?'Capturado':seen?'Visto':'Desconhecido'}</small></button>`; }).join('')}</div>`;
  }
  function renderQuest(){
    return `<div class="quest-card"><h3>Jornada atual</h3><p>${state.quest}</p><div class="badge-row"><span class="badge ${state.badges.includes('beaconBadge')?'got':''}">Beacon</span></div><dl><dt>Passos</dt><dd>${state.steps}</dd><dt>Capturados</dt><dd>${Object.keys(state.caught).length}</dd><dt>Vitórias</dt><dd>${state.stats.wins}</dd><dt>Dinheiro</dt><dd>₽ ${state.money}</dd></dl><div class="menu-actions"><button id="saveBtn">Salvar</button><button id="eraseBtn">Apagar save</button></div></div>`;
  }
  function renderSettings(){
    return `<div class="settings-list">
      ${toggle('music','Música')}${toggle('sfx','Efeitos')}${toggle('motion','Animações')}
      <label>Volume <input id="volumeInput" type="range" min="0" max="1" step="0.05" value="${state.settings.volume}"></label>
      <label>Texto <select id="textSpeed"><option value="12">Rápido</option><option value="22">Normal</option><option value="38">Lento</option></select></label>
      <button id="saveBtn">Salvar</button>
    </div>`;
  }
  function toggle(id,label){ return `<label class="switch"><span>${label}</span><input data-setting="${id}" type="checkbox" ${state.settings[id]?'checked':''}></label>`; }
  function renderTermsHtml(){
    return `<div class="terms"><h3>Termos e créditos</h3><p>Projeto fã, individual, gratuito e não comercial, feito por Luiz Matheus / Luix Studios para estudo e portfólio.</p><p>Pokémon, nomes, sprites, itens, marcas e elementos relacionados pertencem à Nintendo, The Pokémon Company, Creatures Inc. e GAME FREAK. Este projeto não é afiliado, aprovado ou endossado por essas empresas.</p><p>${ASSET_CREDITS.pokemon}</p><p>${ASSET_CREDITS.trainers}</p><p>Mapas, UI, lógica, progressão e estrutura do jogo foram montados para este projeto.</p></div>`;
  }
  function bindMenuActions(){
    $('#saveBtn') && ($('#saveBtn').onclick = save);
    $('#eraseBtn') && ($('#eraseBtn').onclick = async()=>{ if(confirm('Apagar o save local?')) eraseSave(); });
    $$('#menuBody [data-summary]').forEach(btn=>btn.onclick=()=>showSummary(+btn.dataset.summary));
    $$('#menuBody [data-dex]').forEach(btn=>btn.onclick=()=>showDexDetail(btn.dataset.dex));
    $$('#menuBody [data-use-bag]').forEach(btn=>btn.onclick=()=>useItemFromMenu(btn.dataset.useBag));
    $$('#menuBody [data-setting]').forEach(inp=>inp.onchange=()=>{ state.settings[inp.dataset.setting]=inp.checked; if(inp.dataset.setting==='music') inp.checked?startMapMusic():audio.stop(); saveSilent(); });
    $('#volumeInput') && ($('#volumeInput').oninput=e=>{ state.settings.volume=+e.target.value; audio.setVolume(state.settings.volume); saveSilent(); });
    $('#textSpeed') && ($('#textSpeed').value = String(state.settings.textSpeed));
    $('#textSpeed') && ($('#textSpeed').onchange=e=>{ state.settings.textSpeed=+e.target.value; saveSilent(); });
  }
  async function useItemFromMenu(id){
    const it = ITEMS[id]; if(!it) return;
    if(it.heal || it.cure){
      const m = activeMon(); if(!m){ toast('Nenhum Pokémon na equipe.'); return; }
      if(it.heal){ if(m.hp>=m.maxHp){ toast('HP já está cheio.'); return; } if(!takeItem(id,1)) return; m.hp=clamp(m.hp+it.heal,0,m.maxHp); audio.sfx('heal'); toast(`${m.name} recuperou HP.`); }
      if(it.cure){ if(m.status!==it.cure){ toast('Não teve efeito.'); return; } if(!takeItem(id,1)) return; m.status=null; audio.sfx('heal'); toast(`${m.name} foi curado.`); }
      updateHud(); renderMenu(); saveSilent(); return;
    }
    if(it.repel){ if(!takeItem(id,1)) return; state.repel += it.repel; audio.sfx('click'); toast('Repelente ativado.'); renderMenu(); saveSilent(); return; }
    if(it.escape){
      if(!['cave'].includes(currentMap().type)){ toast('Não dá para usar aqui.'); return; }
      if(!takeItem(id,1)) return; state.map='noxport'; state.x=8; state.y=8; audio.sfx('click'); closeMenu(); showGame(); saveSilent(); return;
    }
    toast('Esse item não pode ser usado agora.');
  }

  function showSummary(i){
    const m=state.party[i];
    $('#modal').classList.add('open');
    $('#modal').innerHTML = `<div class="modal-card summary"><button class="x">×</button><div class="summary-head"><img src="${crystalSprite(DEX[m.mon].id)}" onerror="this.src='${defaultSprite(DEX[m.mon].id)}'"><div><h2>${m.name}</h2><p>Lv.${m.level} · ${DEX[m.mon].types.map(t=>TYPES[t].label).join('/')}</p></div></div><div class="stat-grid"><span>HP ${m.hp}/${m.maxHp}</span><span>ATK ${m.stats.atk}</span><span>DEF ${m.stats.def}</span><span>VEL ${m.stats.spd}</span></div><h3>Golpes</h3><div class="move-list">${m.moves.map(mm=>`<article><b>${MOVES[mm.id].name}</b><small>${TYPES[MOVES[mm.id].type].label} · PP ${mm.pp}/${MOVES[mm.id].pp} · Poder ${MOVES[mm.id].power || '-'}</small></article>`).join('')}</div></div>`;
    $('#modal .x').onclick=()=>$('#modal').classList.remove('open');
  }
  function showDexDetail(k){
    const d=DEX[k]; const seen = state.seen[k] || state.caught[k];
    $('#modal').classList.add('open');
    $('#modal').innerHTML = `<div class="modal-card summary"><button class="x">×</button><div class="summary-head"><img src="${seen?crystalSprite(d.id):''}" onerror="this.src='${defaultSprite(d.id)}'"><div><h2>${seen?d.name:'????'}</h2><p>${d.types.map(t=>TYPES[t].label).join(' / ')}</p></div></div><p>${seen?`Habitat: ${d.habitat}`:'Você ainda não viu este Pokémon.'}</p><h3>Golpes conhecidos</h3><div class="move-list">${(LEARNSETS[k]||[]).map(([lvl,id])=>`<article><b>Lv.${lvl} ${MOVES[id].name}</b><small>${TYPES[MOVES[id].type].label} · Poder ${MOVES[id].power||'-'}</small></article>`).join('')}</div></div>`;
    $('#modal .x').onclick=()=>$('#modal').classList.remove('open');
  }

  function openShop(){
    const stock = ['pokeball','greatball','potion','superpotion','antidote','burnheal','repel','escape'];
    $('#modal').classList.add('open');
    $('#modal').innerHTML = `<div class="modal-card shop"><button class="x">×</button><h2>Loja de Noxport</h2><p>Dinheiro: ₽ ${state.money}</p><div class="shop-grid">${stock.map(id=>`<button data-buy="${id}"><img src="${ITEMS[id].icon}"><b>${ITEMS[id].name}</b><span>₽ ${ITEMS[id].price}</span></button>`).join('')}</div></div>`;
    $('#modal .x').onclick=()=>$('#modal').classList.remove('open');
    $$('#modal [data-buy]').forEach(btn=>btn.onclick=()=>{ const id=btn.dataset.buy, price=ITEMS[id].price; if(state.money<price){ toast('Dinheiro insuficiente.'); return; } state.money-=price; addItem(id,1); audio.sfx('click'); updateHud(); openShop(); });
  }

  function startBattle(opts){
    if(battle) return;
    transition(opts.type==='trainer'?'wipe':'swirl'); audio.sfx('start');
    setTimeout(()=>{
      const player = activeMon(); if(!player || player.hp<=0){ say(['Você não tem Pokémon apto.']); return; }
      battle = { ...opts, player, enemyIndex:0, enemy: opts.enemy || opts.enemyTeam[0], log:[], phase:'action', enemyTeam: opts.enemyTeam || null, trainer: opts.trainer || null };
      state.seen[battle.enemy.mon]=true;
      showBattle();
    }, 380);
  }
  function showBattle(){
    audio.play('battle'); showScreen('battle'); renderBattle('action');
  }
  function closeBattle(){ battle=null; $('#battleScreen')?.classList.remove('is-active'); if(activeScreen==='battle') showScreen('game'); }
  function renderBattle(mode='action'){
    if(!battle) return;
    const p=battle.player, e=battle.enemy;
    $('#battleScreen').innerHTML = `<div class="battle-stage ${battle.type}">
      <div class="enemy-box combatant"><div class="nameplate"><b>${e.name}</b><span>Lv.${e.level}</span></div><div class="hp enemy-hp"><i style="width:${hpPct(e)}%"></i></div><img class="mon-sprite enemy-sprite" src="${crystalSprite(DEX[e.mon].id)}" onerror="this.src='${defaultSprite(DEX[e.mon].id)}'"></div>
      <div class="player-box combatant"><img class="mon-sprite player-sprite" src="${crystalBackSprite(DEX[p.mon].id)}" onerror="this.src='${crystalSprite(DEX[p.mon].id)}'"><div class="player-panel"><div class="nameplate"><b>${p.name}</b><span>Lv.${p.level}</span></div><div class="hp player-hp"><i style="width:${hpPct(p)}%"></i></div><small>${p.hp}/${p.maxHp} HP</small><div class="xp"><i style="width:${clamp((p.exp/p.next)*100,0,100)}%"></i></div><div class="balls">${state.party.map(m=>`<span class="mini-ball ${m.hp<=0?'fainted':''}"></span>`).join('')}</div></div></div>
      <div class="battle-dialog"><p id="battleText">${lastBattleText()}</p><div id="battleActions">${battleActions(mode)}</div></div>
    </div>`;
    bindBattleButtons(mode);
  }
  function hpPct(m){ return clamp((m.hp/m.maxHp)*100,0,100); }
  function lastBattleText(){ if(!battle.log.length) return battle.type==='wild'?`Um ${battle.enemy.name} selvagem apareceu!`:`${battle.trainer.name} enviou ${battle.enemy.name}!`; return battle.log[battle.log.length-1]; }
  function battleActions(mode){
    if(mode==='moves') return `<div class="move-buttons">${battle.player.moves.map((m,i)=>`<button data-move="${i}" ${m.pp<=0?'disabled':''}><b>${MOVES[m.id].name}</b><small><img class="type-icon" src="${typeIcon(MOVES[m.id].type)}" onerror="this.remove()"> ${TYPES[MOVES[m.id].type].label} · ${m.pp}/${MOVES[m.id].pp}</small></button>`).join('')}<button data-back>Voltar</button></div>`;
    if(mode==='bag') return `<div class="item-buttons">${['pokeball','greatball','potion','superpotion','antidote','burnheal'].filter(id=>state.bag[id]).map(id=>`<button data-use="${id}"><img src="${ITEMS[id].icon}">${ITEMS[id].name} ×${state.bag[id]}</button>`).join('') || '<button disabled>Bolsa vazia</button>'}<button data-back>Voltar</button></div>`;
    if(mode==='switch') return `<div class="switch-buttons">${state.party.map((m,i)=>`<button data-switch="${i}" ${m.hp<=0 || m.uid===battle.player.uid?'disabled':''}><img src="${crystalSprite(DEX[m.mon].id)}">${m.name} Lv.${m.level}</button>`).join('')}<button data-back>Voltar</button></div>`;
    return `<button data-mode="moves">⚔ Lutar</button><button data-mode="bag">▣ Bolsa</button><button data-mode="switch">● Pokémon</button><button data-run>↙ Fugir</button>`;
  }
  function bindBattleButtons(mode){
    $$('#battleActions [data-mode]').forEach(b=>b.onclick=()=>renderBattle(b.dataset.mode));
    $$('#battleActions [data-back]').forEach(b=>b.onclick=()=>renderBattle('action'));
    $$('#battleActions [data-move]').forEach(b=>b.onclick=()=>playerAttack(+b.dataset.move));
    $$('#battleActions [data-use]').forEach(b=>b.onclick=()=>useBattleItem(b.dataset.use));
    $$('#battleActions [data-switch]').forEach(b=>b.onclick=()=>switchMon(+b.dataset.switch));
    $('#battleActions [data-run]') && ($('#battleActions [data-run]').onclick=runBattle);
  }
  async function battleMessage(text, rerender=true){ battle.log.push(text); if(rerender) renderBattle('locked'); await sleep(state.settings.motion?760:120); }
  function calcMult(moveType, targetTypes){ return targetTypes.reduce((m,t)=>m*((TYPE_CHART[moveType] && TYPE_CHART[moveType][t] !== undefined) ? TYPE_CHART[moveType][t] : 1),1); }
  function calcDamage(attacker, defender, move){
    if(!move.power) return { dmg:0, mult:1, crit:false };
    const mult = calcMult(move.type, DEX[defender.mon].types);
    if(mult===0) return { dmg:0, mult, crit:false };
    const crit = Math.random() < .07;
    const varr = .88 + Math.random()*.18;
    let power = move.variable ? move.power + Math.floor(Math.random()*40)-20 : move.power;
    const raw = (((((2*attacker.level/5)+2)*power*(attacker.stats.atk/Math.max(1,defender.stats.def)))/50)+2) * mult * varr * (crit?1.7:1);
    return { dmg: Math.max(1, Math.floor(raw)), mult, crit };
  }
  async function playerAttack(idx){
    if(locks.battle) return; locks.battle=true;
    const p=battle.player, moveRef=p.moves[idx], move=MOVES[moveRef.id];
    if(moveRef.pp<=0){ locks.battle=false; return; }
    moveRef.pp--; await performMove(p,battle.enemy,move,'player');
    if(battle.enemy.hp<=0){ await enemyFainted(); locks.battle=false; return; }
    await enemyTurn(); locks.battle=false;
  }
  async function performMove(attacker, defender, move, side){
    await battleMessage(`${attacker.name} usou ${move.name}!`);
    if(Math.random()*100 > move.acc){ await battleMessage('Mas errou!'); return; }
    if(move.stat){ await battleMessage('Os atributos mudaram.'); return; }
    const res = calcDamage(attacker,defender,move);
    defender.hp = clamp(defender.hp - res.dmg, 0, defender.maxHp);
    animateHit(side==='player'?'enemy':'player', move.fx);
    audio.sfx('hit'); renderBattle('locked'); await sleep(state.settings.motion?650:80);
    if(res.mult===0) await battleMessage('Não teve efeito...');
    else if(res.mult>1) await battleMessage('Foi super efetivo!');
    else if(res.mult<1) await battleMessage('Não foi muito efetivo...');
    if(res.crit) await battleMessage('Golpe crítico!');
    if(move.drain && res.dmg>0){ const heal=Math.floor(res.dmg*move.drain); attacker.hp=clamp(attacker.hp+heal,0,attacker.maxHp); await battleMessage(`${attacker.name} drenou energia.`); }
    if(move.statusChance && defender.hp>0){ const [status,chance] = Object.entries(move.statusChance)[0]; if(!defender.status && Math.random()<chance){ defender.status=status; await battleMessage(`${defender.name} ficou ${status==='poison'?'envenenado':'queimado'}!`); } }
    await statusTick(defender);
  }
  async function statusTick(mon){
    if(!mon.status || mon.hp<=0) return;
    const loss = Math.max(1, Math.floor(mon.maxHp/12)); mon.hp=clamp(mon.hp-loss,0,mon.maxHp); renderBattle('locked'); audio.sfx('dmg');
    await battleMessage(`${mon.name} sofreu com ${mon.status==='poison'?'veneno':'queimadura'}.`);
  }
  function animateHit(target, fx){
    const el = target==='enemy' ? $('.enemy-sprite') : $('.player-sprite');
    if(!el || !state.settings.motion) return;
    el.classList.remove('hit','slash','spark','fire','water','faint'); void el.offsetWidth; el.classList.add(fx==='fire'?'fire':fx==='spark'?'spark':fx==='water'?'water':'hit'); setTimeout(()=>el.classList.remove('hit','fire','spark','water'),500);
  }
  async function enemyTurn(){
    const e=battle.enemy; if(e.hp<=0) return;
    const moves=e.moves.filter(m=>m.pp>0); const best = moves.sort((a,b)=>calcMult(MOVES[b.id].type, DEX[battle.player.mon].types)-calcMult(MOVES[a.id].type, DEX[battle.player.mon].types))[0] || e.moves[0];
    best.pp = Math.max(0,best.pp-1); await performMove(e,battle.player,MOVES[best.id],'enemy');
    if(battle.player.hp<=0) await playerFainted(); else renderBattle('action');
  }
  async function enemyFainted(){
    $('.enemy-sprite')?.classList.add('faint'); audio.sfx('win'); await battleMessage(`${battle.enemy.name} caiu!`);
    await gainExp(battle.player,battle.enemy);
    if(battle.type==='trainer' && battle.enemyTeam && battle.enemyIndex < battle.enemyTeam.length-1){ battle.enemyIndex++; battle.enemy=battle.enemyTeam[battle.enemyIndex]; state.seen[battle.enemy.mon]=true; await battleMessage(`${battle.trainer.name} enviou ${battle.enemy.name}!`); renderBattle('action'); return; }
    await finishBattle(true);
  }
  async function playerFainted(){
    $('.player-sprite')?.classList.add('faint'); audio.sfx('lose'); await battleMessage(`${battle.player.name} caiu!`);
    const next = state.party.find(m=>m.hp>0);
    if(next){ battle.player=next; await battleMessage(`Vai, ${next.name}!`); renderBattle('action'); return; }
    await battleMessage('Você perdeu a batalha...');
    state.money = Math.floor(state.money*.85); healAll(); state.map='cove'; state.x=7; state.y=10; await finishBattle(false); await say(['Você acordou em Cove com a equipe curada.']);
  }
  async function gainExp(mon, enemy){
    let amount = Math.floor((DEX[enemy.mon].exp * enemy.level)/7);
    if(battle.type==='trainer') amount = Math.floor(amount*1.35);
    mon.exp += amount; await battleMessage(`${mon.name} ganhou ${amount} EXP.`);
    while(mon.exp >= mon.next){ mon.exp -= mon.next; mon.level++; mon.stats=calcStats(DEX[mon.mon],mon.level,mon.iv); const gain=mon.stats.hp-mon.maxHp; mon.maxHp=mon.stats.hp; mon.hp+=gain; mon.next=nextExp(mon.level); audio.sfx('level'); await battleMessage(`${mon.name} subiu para o Lv.${mon.level}!`); learnMoves(mon); await maybeEvolve(mon); }
  }
  function learnMoves(mon){
    const known = mon.moves.map(m=>m.id);
    (LEARNSETS[mon.mon]||[]).filter(([lvl,id])=>lvl===mon.level && !known.includes(id)).forEach(([_,id])=>{ if(mon.moves.length>=4) mon.moves.shift(); mon.moves.push({id,pp:MOVES[id].pp}); battle.log.push(`${mon.name} aprendeu ${MOVES[id].name}!`); });
  }
  async function maybeEvolve(mon){
    const evo=DEX[mon.mon].evo; if(evo && mon.level>=evo.level){ await battleMessage(`${mon.name} está evoluindo!`); mon.mon=evo.to; mon.name=DEX[evo.to].name; state.seen[evo.to]=true; state.caught[evo.to]=true; mon.stats=calcStats(DEX[mon.mon],mon.level,mon.iv); mon.maxHp=mon.stats.hp; mon.hp=mon.maxHp; await battleMessage(`Parabéns! Agora é ${mon.name}.`); }
  }
  async function finishBattle(won){
    if(won){ state.stats.wins++; if(battle.type==='trainer' && battle.trainer){ state.defeated[battle.trainer.flag]=true; state.money += battle.trainer.reward || 200; if(battle.trainer.boss){ state.badges.push('beaconBadge'); state.quest = 'Você venceu o ginásio. Explore a Costa Nox atrás de Pokémon raros e complete a Dex.'; } await battleMessage(`Você recebeu ₽ ${battle.trainer.reward || 200}.`); if(battle.trainer.after) await battleMessage(battle.trainer.after[0]); } }
    saveSilent(); const oldMap=state.map; battle=null; showScreen('game'); updateHud(); renderMap(); audio.play(MAPS[oldMap]?.music || 'route');
  }
  async function runBattle(){
    if(battle.type==='trainer'){ await battleMessage('Não dá para fugir de uma batalha de treinador.'); renderBattle('action'); return; }
    if(Math.random()<.72){ await battleMessage('Você fugiu com segurança.'); battle=null; showScreen('game'); renderMap(); startMapMusic(); } else { await battleMessage('Não conseguiu fugir!'); await enemyTurn(); }
  }
  async function useBattleItem(id){
    if(locks.battle) return; locks.battle=true;
    if(!takeItem(id,1)){ locks.battle=false; return; }
    const it=ITEMS[id];
    if(it.catch){
      if(battle.type!=='wild'){ addItem(id,1); await battleMessage('Você não pode capturar Pokémon de treinador.'); locks.battle=false; renderBattle('action'); return; }
      audio.sfx('catch'); await battleMessage(`Você usou ${it.name}!`); $('.enemy-sprite')?.classList.add('capture'); await sleep(800);
      const e=battle.enemy; const hpFactor = (3*e.maxHp - 2*e.hp) / (3*e.maxHp); const chance = clamp((DEX[e.mon].catchRate/255) * hpFactor * it.catch + (e.status?.length ? .12 : 0), .05, .92);
      if(Math.random()<chance){ state.caught[e.mon]=true; state.seen[e.mon]=true; addPokemon({...e, uid:uid(), hp:e.hp, fainted:false}); audio.sfx('win'); await battleMessage(`Tum! ${e.name} foi capturado!`); battle=null; showScreen('game'); updateHud(); renderMap(); startMapMusic(); saveSilent(); locks.battle=false; return; }
      audio.sfx('fail'); await battleMessage(`${e.name} escapou!`); await enemyTurn(); locks.battle=false; return;
    }
    if(it.heal){ const m=battle.player; m.hp=clamp(m.hp+it.heal,0,m.maxHp); audio.sfx('heal'); await battleMessage(`${m.name} recuperou HP.`); await enemyTurn(); locks.battle=false; return; }
    if(it.cure){ if(battle.player.status===it.cure){ battle.player.status=null; await battleMessage(`${battle.player.name} foi curado.`); } else await battleMessage('Não teve efeito.'); await enemyTurn(); locks.battle=false; return; }
    locks.battle=false;
  }
  async function switchMon(i){
    if(locks.battle) return; locks.battle=true;
    battle.player=state.party[i]; await battleMessage(`Vai, ${battle.player.name}!`); await enemyTurn(); locks.battle=false;
  }

  function showTerms(){
    $('#modal').classList.add('open'); $('#modal').innerHTML = `<div class="modal-card summary"><button class="x">×</button>${renderTermsHtml()}</div>`; $('#modal .x').onclick=()=>$('#modal').classList.remove('open');
  }

  function bindControls(){
    const map = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
    window.addEventListener('keydown', e=>{
      if(e.repeat) return;
      if(map[e.key]){ e.preventDefault(); move(map[e.key]); }
      if(e.key==='z' || e.key==='Enter') interact();
      if(e.key==='x' || e.key==='Escape') menuOpen?closeMenu():openMenu();
    });
    $$('[data-dir]').forEach(b=>b.onclick=()=>move(b.dataset.dir));
    $('#aBtn').onclick=interact; $('#bBtn').onclick=()=>menuOpen?closeMenu():openMenu(); $('#menuBtn').onclick=()=>openMenu();
    $('#quickParty').onclick=()=>openMenu('party'); $('#quickBag').onclick=()=>openMenu('bag'); $('#quickDex').onclick=()=>openMenu('dex');
    $('#modal').addEventListener('click', e=>{ if(e.target.id==='modal') $('#modal').classList.remove('open'); });
  }

  function boot(){
    bindControls(); renderTitle(); showScreen('title');
    const tick = ts => { if(ts-lastRender>80 && activeScreen==='game' && !battle) { renderMap(); lastRender=ts; } requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
  boot();
})();
