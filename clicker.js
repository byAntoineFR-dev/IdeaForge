// ═══════════════════════════════════════════════
//  LE CREUSET — CLICKER GAME ENGINE
// ═══════════════════════════════════════════════

const Clicker = (() => {

  // ── CONSTANTS ────────────────────────────────
  const SAVE_KEY = 'ideaforge_clicker';
  const TICK_MS  = 1000;
  const XP_PER_LEVEL = (lvl) => Math.floor(100 * Math.pow(1.4, lvl - 1));
  const PRESTIGE_COST = 50000;

  // ── AUTO-GENERATORS ──────────────────────────
  const AUTOS = [
    { id:'soufflet',  emoji:'💨', name:'Soufflet',     desc:'Attise les braises',           base:15,   spc:0.1,  mult:1.15 },
    { id:'marteau',   emoji:'🔨', name:'Marteau',       desc:'Frappe régulièrement',          base:80,   spc:0.5,  mult:1.15 },
    { id:'creuset',   emoji:'🫙', name:'Creuset',       desc:'Fond le minerai',               base:350,  spc:2,    mult:1.15 },
    { id:'apprenti',  emoji:'🧑‍🔧', name:'Apprenti',    desc:'Aide à la forge',               base:1200, spc:8,    mult:1.15 },
    { id:'golem',     emoji:'🗿', name:'Golem de fer', desc:'Forge sans relâche',            base:5000, spc:30,   mult:1.15 },
    { id:'dragon',    emoji:'🐉', name:'Dragon de feu', desc:'Souffle enflammé +200 s/s',   base:25000,spc:150,  mult:1.15 },
  ];

  // ── UPGRADES ─────────────────────────────────
  const UPGRADES = [
    { id:'u1', emoji:'🔥', name:'Flamme vive',      desc:'×2 clic',             cost:100,   effect:()=>{ S.clickMult*=2 },       cond:()=>S.totalClicks>=10 },
    { id:'u2', emoji:'⚙️', name:'Engrenage huilé',  desc:'×2 Soufflets',        cost:500,   effect:()=>{ boostAuto('soufflet',2) },cond:()=>countAuto('soufflet')>=5 },
    { id:'u3', emoji:'🌡️', name:'Four ardent',      desc:'×2 clic',             cost:1000,  effect:()=>{ S.clickMult*=2 },       cond:()=>S.totalSparks>=500 },
    { id:'u4', emoji:'🧲', name:'Aimant runique',   desc:'×3 Marteaux',         cost:3000,  effect:()=>{ boostAuto('marteau',3) },cond:()=>countAuto('marteau')>=5 },
    { id:'u5', emoji:'💎', name:'Pierre de forge',  desc:'×5 clic',             cost:8000,  effect:()=>{ S.clickMult*=5 },       cond:()=>S.level>=5 },
    { id:'u6', emoji:'🌊', name:'Métal liquide',    desc:'×3 Creusets',         cost:15000, effect:()=>{ boostAuto('creuset',3) },cond:()=>countAuto('creuset')>=5 },
    { id:'u7', emoji:'👁️', name:'Œil de cyclope',  desc:'×10 clic',            cost:50000, effect:()=>{ S.clickMult*=10 },      cond:()=>S.level>=10 },
    { id:'u8', emoji:'🌋', name:'Cœur de volcan',   desc:'×5 tous les autos',   cost:100000,effect:()=>{ S.globalAutoMult*=5 },  cond:()=>S.totalSparks>=50000 },
  ];

  // ── ACHIEVEMENTS ─────────────────────────────
  const ACHIEVEMENTS = [
    { id:'a1',  emoji:'🔨', name:'Premier coup',       cond:()=>S.totalClicks>=1 },
    { id:'a2',  emoji:'💥', name:'100 frappes',         cond:()=>S.totalClicks>=100 },
    { id:'a3',  emoji:'⚡', name:'1 000 Sparks',        cond:()=>S.totalSparks>=1000 },
    { id:'a4',  emoji:'🔥', name:'Feu sacré',           cond:()=>S.totalSparks>=10000 },
    { id:'a5',  emoji:'🏆', name:'Niveau 5',            cond:()=>S.level>=5 },
    { id:'a6',  emoji:'👑', name:'Niveau 10',           cond:()=>S.level>=10 },
    { id:'a7',  emoji:'🐉', name:'Dragon apprivoisé',   cond:()=>countAuto('dragon')>=1 },
    { id:'a8',  emoji:'♾️',  name:'Premier Prestige',   cond:()=>S.prestige>=1 },
    { id:'a9',  emoji:'🌟', name:'50 000 Sparks',       cond:()=>S.totalSparks>=50000 },
    { id:'a10', emoji:'💰', name:'Millionnaire',        cond:()=>S.totalSparks>=1000000 },
    { id:'a11', emoji:'🤖', name:'5 Golems',            cond:()=>countAuto('golem')>=5 },
    { id:'a12', emoji:'✨', name:'Double prestige',      cond:()=>S.prestige>=2 },
  ];

  // ── STATE ─────────────────────────────────────
  const DEFAULT_STATE = {
    sparks: 0,
    totalSparks: 0,
    totalClicks: 0,
    level: 1,
    xp: 0,
    clickMult: 1,
    globalAutoMult: 1,
    prestige: 0,
    prestigeMult: 1,
    autos: {},      // id → count
    autoMults: {},  // id → extra mult
    boughtUpgrades: [],
    unlockedAchievements: [],
    theme: 'dark',
    lastTick: Date.now(),
  };

  let S = { ...DEFAULT_STATE };
  let tickInterval = null;

  // ── SAVE / LOAD ───────────────────────────────
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch(_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) S = { ...DEFAULT_STATE, ...JSON.parse(raw) };
      // Offline sparks
      const elapsed = (Date.now() - (S.lastTick || Date.now())) / 1000;
      const offline = Math.floor(autoSPS() * Math.min(elapsed, 3600));
      if (offline > 0) {
        S.sparks += offline;
        S.totalSparks += offline;
        showToast(`⚡ +${fmt(offline)} Sparks gagnés hors-ligne !`);
      }
    } catch(_) {}
    S.lastTick = Date.now();
  }

  // ── HELPERS ───────────────────────────────────
  function fmt(n) {
    if (n >= 1e9) return (n/1e9).toFixed(1)+'B';
    if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
    if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
    return Math.floor(n).toString();
  }

  function countAuto(id) { return S.autos[id] || 0; }

  function boostAuto(id, mult) {
    S.autoMults[id] = (S.autoMults[id] || 1) * mult;
  }

  function autoCostFor(a, count) {
    return Math.floor(a.base * Math.pow(a.mult, count));
  }

  function autoSPS() {
    let total = 0;
    for (const a of AUTOS) {
      const cnt = countAuto(a.id);
      if (cnt > 0) {
        total += a.spc * cnt * (S.autoMults[a.id] || 1) * S.globalAutoMult * S.prestigeMult;
      }
    }
    return total;
  }

  function clickValue() {
    const base = 1 + Math.floor(autoSPS() * 0.1);
    return Math.max(1, Math.floor(base * S.clickMult * S.prestigeMult));
  }

  // ── CLICK ─────────────────────────────────────
  function handleClick(e) {
    const val = clickValue();
    S.sparks += val;
    S.totalSparks += val;
    S.totalClicks++;
    gainXP(1);
    spawnFloatSpark(val, e);
    triggerAnvilHit();
    checkAchievements();
    renderStats();
    save();
  }

  function gainXP(amount) {
    S.xp += amount;
    const needed = XP_PER_LEVEL(S.level);
    if (S.xp >= needed) {
      S.xp -= needed;
      S.level++;
      onLevelUp();
    }
  }

  function onLevelUp() {
    showToast(`🎉 Niveau ${S.level} atteint !`);
    const flash = document.createElement('div');
    flash.className = 'levelup-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 700);
    renderAll();
  }

  // ── BUY AUTO ──────────────────────────────────
  function buyAuto(id) {
    const a = AUTOS.find(x => x.id === id);
    if (!a) return;
    const cnt = countAuto(id);
    const cost = autoCostFor(a, cnt);
    if (S.sparks < cost) { showToast('⚠️ Pas assez de Sparks !'); return; }
    S.sparks -= cost;
    S.autos[id] = cnt + 1;
    checkAchievements();
    renderAll();
    save();
  }

  // ── BUY UPGRADE ───────────────────────────────
  function buyUpgrade(id) {
    if (S.boughtUpgrades.includes(id)) return;
    const u = UPGRADES.find(x => x.id === id);
    if (!u) return;
    if (S.sparks < u.cost) { showToast('⚠️ Pas assez de Sparks !'); return; }
    S.sparks -= u.cost;
    u.effect();
    S.boughtUpgrades.push(id);
    showToast(`✨ ${u.name} débloqué !`);
    checkAchievements();
    renderAll();
    save();
  }

  // ── PRESTIGE ──────────────────────────────────
  function doPrestige() {
    if (S.totalSparks < PRESTIGE_COST) return;
    if (!confirm('Prestige : reset complet en échange d\'un multiplicateur permanent ×2 ?')) return;
    S.prestige++;
    S.prestigeMult = Math.pow(2, S.prestige);
    const keep = { prestige: S.prestige, prestigeMult: S.prestigeMult, theme: S.theme, unlockedAchievements: S.unlockedAchievements };
    S = { ...DEFAULT_STATE, ...keep, lastTick: Date.now() };
    checkAchievements();
    showToast(`🌟 Prestige ${S.prestige} ! Mult ×${S.prestigeMult}`);
    renderAll();
    save();
  }

  // ── AUTO TICK ─────────────────────────────────
  function tick() {
    const sps = autoSPS();
    if (sps > 0) {
      S.sparks += sps;
      S.totalSparks += sps;
      gainXP(0.5);
    }
    S.lastTick = Date.now();
    checkAchievements();
    renderStats();
    save();
  }

  // ── ACHIEVEMENTS ──────────────────────────────
  function checkAchievements() {
    let newUnlock = false;
    for (const a of ACHIEVEMENTS) {
      if (!S.unlockedAchievements.includes(a.id) && a.cond()) {
        S.unlockedAchievements.push(a.id);
        showToast(`🏆 Succès : ${a.name} !`);
        newUnlock = true;
      }
    }
    if (newUnlock) renderAchievements();
  }

  // ── ANVIL ANIMATION ───────────────────────────
  function triggerAnvilHit() {
    const emoji = document.querySelector('.anvil-emoji');
    if (!emoji) return;
    emoji.classList.remove('hit');
    void emoji.offsetWidth;
    emoji.classList.add('hit');
    setTimeout(() => emoji.classList.remove('hit'), 120);
  }

  // ── FLOATING SPARKS ───────────────────────────
  function spawnFloatSpark(val, e) {
    const el = document.createElement('div');
    el.className = 'float-spark';
    el.textContent = `+${fmt(val)} ⚡`;
    const x = (e?.clientX ?? window.innerWidth/2) - 30 + (Math.random()-0.5)*40;
    const y = (e?.clientY ?? window.innerHeight/2) - 10;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  // ── RENDER ────────────────────────────────────
  function renderAll() {
    renderStats();
    renderAutos();
    renderUpgrades();
    renderAchievements();
    renderPrestige();
  }

  function renderStats() {
    const sps = autoSPS();
    setText('stat-sparks', `⚡ ${fmt(S.sparks)}`);
    setText('stat-prestige', `✦ Prestige ${S.prestige}`);
    setText('forge-level', `Niveau ${S.level} — Forgeron`);
    setText('spark-per-click', `+${fmt(clickValue())}`);
    setText('sps-display', `${fmt(sps)} sparks/s`);

    const needed = XP_PER_LEVEL(S.level);
    const pct = Math.min(100, (S.xp / needed) * 100);
    const fill = document.getElementById('xp-fill');
    if (fill) fill.style.width = pct + '%';
    setText('xp-cur', fmt(S.xp));
    setText('xp-max', fmt(needed));
  }

  function renderAutos() {
    const list = document.getElementById('auto-list');
    if (!list) return;
    list.innerHTML = AUTOS.map(a => {
      const cnt = countAuto(a.id);
      const cost = autoCostFor(a, cnt);
      const canAfford = S.sparks >= cost;
      const sps = (a.spc * (S.autoMults[a.id]||1) * S.globalAutoMult * S.prestigeMult).toFixed(1);
      return `
        <div class="auto-item ${cnt>0?'unlocked':'locked'}">
          <span class="auto-emoji">${a.emoji}</span>
          <div class="auto-info">
            <div class="auto-name">${a.name}</div>
            <div class="auto-desc">${a.desc} · ${sps} s/s chacun</div>
          </div>
          <div class="auto-count">${cnt}</div>
          <button class="auto-buy-btn" onclick="Clicker.buyAuto('${a.id}')" ${canAfford?'':'disabled'}>
            <span class="buy-cost">⚡ ${fmt(cost)}</span>
            <span class="buy-label">Acheter</span>
          </button>
        </div>
      `;
    }).join('');
  }

  function renderUpgrades() {
    const list = document.getElementById('upgrade-list');
    if (!list) return;
    const visible = UPGRADES.filter(u => u.cond() || S.boughtUpgrades.includes(u.id));
    if (!visible.length) {
      list.innerHTML = '<div style="font-size:12px;color:var(--text3);text-align:center;padding:12px">Continue à forger pour débloquer des améliorations…</div>';
      return;
    }
    list.innerHTML = visible.map(u => {
      const bought = S.boughtUpgrades.includes(u.id);
      const canAfford = S.sparks >= u.cost;
      return `
        <div class="upgrade-item ${bought?'bought':canAfford?'':'cant-afford'}"
             onclick="${bought?'':canAfford?`Clicker.buyUpgrade('${u.id}')`:''}" >
          <span class="upgrade-emoji">${u.emoji}</span>
          <div class="upgrade-info">
            <div class="upgrade-name">${u.name}</div>
            <div class="upgrade-desc">${u.desc}</div>
          </div>
          <span class="upgrade-cost">${bought?'✓':('⚡'+fmt(u.cost))}</span>
        </div>
      `;
    }).join('');
  }

  function renderAchievements() {
    const grid = document.getElementById('achievement-grid');
    if (!grid) return;
    grid.innerHTML = ACHIEVEMENTS.map(a => {
      const done = S.unlockedAchievements.includes(a.id);
      return `<div class="ach-item ${done?'unlocked':'locked'}" title="${a.name}">${a.emoji}</div>`;
    }).join('');
  }

  function renderPrestige() {
    const panel = document.getElementById('prestige-panel');
    if (!panel) return;
    const canPrestige = S.totalSparks >= PRESTIGE_COST;
    const nextMult = Math.pow(2, S.prestige + 1);
    setText('prestige-next-mult', `→ Multiplicateur ×${nextMult}`);
    setText('prestige-need', `Nécessite ${fmt(PRESTIGE_COST)} Sparks au total`);
    const btn = document.getElementById('btn-prestige');
    if (btn) btn.disabled = !canPrestige;
  }

  // ── UTILS ─────────────────────────────────────
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── TOAST ─────────────────────────────────────
  function showToast(msg) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 300); }, 2500);
  }

  // ── THEME ─────────────────────────────────────
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    S.theme = theme;
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function toggleTheme() {
    applyTheme(S.theme === 'dark' ? 'light' : 'dark');
    save();
  }

  // ── PARTICLES ─────────────────────────────────
  function spawnParticles() {
    const c = document.getElementById('particles');
    if (!c) return;
    for (let i = 0; i < 15; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${4+Math.random()*6}s;--delay:${Math.random()*8}s`;
      c.appendChild(p);
    }
  }

  // ── INIT ──────────────────────────────────────
  function init() {
    load();
    applyTheme(S.theme || 'dark');
    spawnParticles();
    renderAll();

    // Anvil click
    document.getElementById('anvil-btn')?.addEventListener('click', handleClick);

    // Theme
    document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);

    // Prestige
    document.getElementById('btn-prestige')?.addEventListener('click', doPrestige);

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handleClick({ clientX: window.innerWidth/2, clientY: window.innerHeight/2 });
      }
    });

    tickInterval = setInterval(tick, TICK_MS);
  }

  // Public API
  return { init, buyAuto, buyUpgrade };
})();

document.addEventListener('DOMContentLoaded', Clicker.init);
