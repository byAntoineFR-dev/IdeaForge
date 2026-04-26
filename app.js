// ═══════════════════════════════════════════════
//  IDEAFORGE — APP LOGIC
// ═══════════════════════════════════════════════

const App = (() => {
  // ── STATE ────────────────────────────────────
  let state = {
    activeCategory: "action",
    currentIdea: null,
    savedIdeas: [],
    theme: "dark",
  };

  // ── DOM REFS ─────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── INIT ─────────────────────────────────────
  function init() {
    loadFromStorage();
    renderCategories();
    renderSaved();
    bindEvents();
    applyTheme(state.theme);
    spawnParticles();
  }

  // ── STORAGE ──────────────────────────────────
  function loadFromStorage() {
    try {
      const saved = localStorage.getItem("ideaforge_saved");
      const theme = localStorage.getItem("ideaforge_theme");
      if (saved) state.savedIdeas = JSON.parse(saved);
      if (theme) state.theme = theme;
    } catch (_) {}
  }

  function saveToStorage() {
    try {
      localStorage.setItem("ideaforge_saved", JSON.stringify(state.savedIdeas));
      localStorage.setItem("ideaforge_theme", state.theme);
    } catch (_) {}
  }

  // ── THEME ─────────────────────────────────────
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = $("#btn-theme");
    if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme(state.theme);
    saveToStorage();
  }

  // ── CATEGORIES ────────────────────────────────
  function renderCategories() {
    const grid = $("#categories-grid");
    if (!grid) return;

    grid.innerHTML = CATEGORIES.map((cat) => `
      <button
        class="category-card ${cat.id === state.activeCategory ? "active" : ""}"
        data-id="${cat.id}"
        data-cat-color="${cat.color}"
        data-cat-glow="${cat.glow}"
        data-cat-bg="${cat.bg}"
        style="
          --cat-color: ${cat.color};
          --cat-glow: ${cat.glow};
          --cat-bg: ${cat.bg};
        "
        aria-pressed="${cat.id === state.activeCategory}"
        title="${cat.label}"
      >
        <span class="category-emoji">${cat.emoji}</span>
        <span class="category-label">${cat.label}</span>
      </button>
    `).join("");
  }

  function selectCategory(id) {
    state.activeCategory = id;
    $$(".category-card").forEach((card) => {
      const active = card.dataset.id === id;
      card.classList.toggle("active", active);
      card.setAttribute("aria-pressed", active);
    });
  }

  // ── IDEA GENERATION ───────────────────────────
  function generate() {
    const btn = $("#btn-generate");
    const idea = generateIdea(state.activeCategory);
    if (!idea) return;

    state.currentIdea = idea;

    // Pulse animation
    btn.classList.add("pulsing");
    setTimeout(() => btn.classList.remove("pulsing"), 700);

    // Flash & reveal
    const placeholder = $("#idea-placeholder");
    const content = $("#idea-content");
    const card = $("#idea-card");

    if (placeholder) placeholder.style.display = "none";

    content.classList.remove("visible");
    void content.offsetWidth; // reflow

    const cat = CATEGORIES.find((c) => c.id === idea.category);

    content.innerHTML = `
      <div class="idea-badge" style="--cat-color-badge:${cat?.color || "var(--accent)"}; --cat-glow-badge:${cat?.glow || "var(--accent-glow)"}">
        ${cat?.emoji || "✨"} ${cat?.label || "Idée"}
      </div>
      <p class="idea-text">${formatIdeaText(idea.full)}</p>
      <div class="idea-tags">
        <span class="idea-tag">🎮 ${idea.mechanic}</span>
        <span class="idea-tag">🗺️ ${idea.setting}</span>
      </div>
    `;

    card.classList.add("has-idea");
    content.classList.add("visible");

    // Update action buttons
    updateActionButtons();
    triggerParticleBurst(cat?.color);
  }

  function formatIdeaText(text) {
    // Convert **text** to <strong>text</strong>
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  // ── ACTION BUTTONS ────────────────────────────
  function updateActionButtons() {
    const container = $("#action-buttons");
    if (!container || !state.currentIdea) return;

    const idea = state.currentIdea;
    const isSaved = state.savedIdeas.some((s) => s.id === idea.id);

    container.innerHTML = `
      <button class="btn-action ${idea.likes > 0 ? "liked" : ""}" id="btn-like" title="J'aime">
        ${idea.likes > 0 ? "❤️" : "🤍"} <span class="like-count">${idea.likes}</span>
      </button>
      <button class="btn-action ${isSaved ? "saved" : ""}" id="btn-save" title="${isSaved ? "Sauvegardée" : "Sauvegarder"}">
        ${isSaved ? "🔖 Sauvegardée" : "💾 Sauvegarder"}
      </button>
      <button class="btn-action" id="btn-share" title="Partager">
        📤 Partager
      </button>
      <button class="btn-action" id="btn-copy" title="Copier">
        📋 Copier
      </button>
    `;

    $("#btn-like")?.addEventListener("click", likeIdea);
    $("#btn-save")?.addEventListener("click", saveIdea);
    $("#btn-share")?.addEventListener("click", shareIdea);
    $("#btn-copy")?.addEventListener("click", copyIdea);
  }

  // ── LIKE ──────────────────────────────────────
  function likeIdea() {
    if (!state.currentIdea) return;
    state.currentIdea.likes = state.currentIdea.likes > 0 ? 0 : 1;

    // Update in saved if exists
    const idx = state.savedIdeas.findIndex((s) => s.id === state.currentIdea.id);
    if (idx !== -1) {
      state.savedIdeas[idx].likes = state.currentIdea.likes;
      saveToStorage();
      renderSaved();
    }

    updateActionButtons();

    if (state.currentIdea.likes > 0) {
      showToast("❤️ Super idée !");
      triggerHeartBurst();
    }
  }

  // ── SAVE ──────────────────────────────────────
  function saveIdea() {
    if (!state.currentIdea) return;

    const exists = state.savedIdeas.some((s) => s.id === state.currentIdea.id);
    if (exists) {
      state.savedIdeas = state.savedIdeas.filter((s) => s.id !== state.currentIdea.id);
      showToast("🗑️ Idée retirée");
    } else {
      state.savedIdeas.unshift({ ...state.currentIdea });
      showToast("💾 Idée sauvegardée !");
    }

    saveToStorage();
    renderSaved();
    updateActionButtons();
  }

  function deleteFromSaved(id) {
    state.savedIdeas = state.savedIdeas.filter((s) => s.id !== id);
    if (state.currentIdea?.id === id) updateActionButtons();
    saveToStorage();
    renderSaved();
    showToast("🗑️ Supprimée");
  }

  function clearAllSaved() {
    if (!state.savedIdeas.length) return;
    if (!confirm("Supprimer toutes les idées sauvegardées ?")) return;
    state.savedIdeas = [];
    saveToStorage();
    renderSaved();
    showToast("🧹 Tout effacé");
  }

  // ── SHARE ─────────────────────────────────────
  async function shareIdea() {
    if (!state.currentIdea) return;
    const cat = CATEGORIES.find((c) => c.id === state.currentIdea.category);
    const plain = state.currentIdea.full.replace(/\*\*/g, "");

    const shareData = {
      title: "IdeaForge — Idée de jeu",
      text: `${cat?.emoji || "🎮"} ${plain}\n\n— Généré sur IdeaForge`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}`);
        showToast("📋 Copié dans le presse-papier !");
      }
    } catch (_) {
      showToast("❌ Impossible de partager");
    }
  }

  // ── COPY ──────────────────────────────────────
  async function copyIdea() {
    if (!state.currentIdea) return;
    const plain = state.currentIdea.full.replace(/\*\*/g, "");
    try {
      await navigator.clipboard.writeText(plain);
      showToast("📋 Copié !");
    } catch (_) {
      showToast("❌ Erreur de copie");
    }
  }

  // ── RENDER SAVED ──────────────────────────────
  function renderSaved() {
    const list = $("#saved-list");
    const count = $("#saved-count");
    if (!list) return;

    if (count) count.textContent = state.savedIdeas.length;

    if (!state.savedIdeas.length) {
      list.innerHTML = `<div class="saved-empty">✨ Aucune idée sauvegardée<br><small>Génère des idées et sauvegarde tes préférées !</small></div>`;
      return;
    }

    list.innerHTML = state.savedIdeas.map((idea) => {
      const cat = CATEGORIES.find((c) => c.id === idea.category);
      const plain = idea.full.replace(/\*\*/g, "").substring(0, 90);
      return `
        <div class="saved-item" data-id="${idea.id}">
          <span class="saved-item-emoji">${cat?.emoji || "🎮"}</span>
          <div class="saved-item-text">
            <strong>${idea.subject}</strong><br>
            ${plain}${idea.full.replace(/\*\*/g, "").length > 90 ? "…" : ""}
          </div>
          ${idea.likes > 0 ? `<span class="saved-item-likes">❤️ ${idea.likes}</span>` : ""}
          <button class="saved-item-delete" data-delete="${idea.id}" title="Supprimer">✕</button>
        </div>
      `;
    }).join("");
  }

  // ── TOAST ─────────────────────────────────────
  function showToast(msg) {
    const container = $("#toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  // ── PARTICLES ─────────────────────────────────
  function spawnParticles() {
    const container = $("#particles");
    if (!container) return;

    for (let i = 0; i < 20; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        --dur: ${4 + Math.random() * 6}s;
        --delay: ${Math.random() * 8}s;
        opacity: 0;
      `;
      container.appendChild(p);
    }
  }

  function triggerParticleBurst(color) {
    const container = $("#particles");
    if (!container) return;

    for (let i = 0; i < 8; i++) {
      const p = document.createElement("div");
      p.style.cssText = `
        position: absolute;
        width: 4px; height: 4px;
        border-radius: 50%;
        background: ${color || "var(--accent)"};
        left: 50%; top: 50%;
        pointer-events: none;
        animation: burst-${i} 0.8s ease-out forwards;
      `;
      const angle = (i / 8) * 360;
      const dist = 60 + Math.random() * 80;
      const x = Math.cos((angle * Math.PI) / 180) * dist;
      const y = Math.sin((angle * Math.PI) / 180) * dist;

      const style = document.createElement("style");
      style.textContent = `@keyframes burst-${i} {
        from { transform: translate(0,0) scale(1); opacity: 1; }
        to { transform: translate(${x}px, ${y}px) scale(0); opacity: 0; }
      }`;
      document.head.appendChild(style);
      container.appendChild(p);
      setTimeout(() => { p.remove(); style.remove(); }, 900);
    }
  }

  function triggerHeartBurst() {
    const hearts = ["❤️", "💖", "💗", "💓"];
    const zone = $("#idea-card");
    if (!zone) return;
    const rect = zone.getBoundingClientRect();

    for (let i = 0; i < 5; i++) {
      const el = document.createElement("div");
      el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      el.style.cssText = `
        position: fixed;
        font-size: ${14 + Math.random() * 14}px;
        left: ${rect.left + Math.random() * rect.width}px;
        top: ${rect.top + Math.random() * rect.height}px;
        pointer-events: none;
        z-index: 999;
        animation: heart-fly 1s ease-out forwards;
        animation-delay: ${i * 0.1}s;
        opacity: 0;
      `;
      document.body.appendChild(el);

      const style = document.createElement("style");
      style.textContent = `@keyframes heart-fly {
        0% { opacity: 0; transform: translateY(0) scale(0.5); }
        30% { opacity: 1; transform: translateY(-20px) scale(1.2); }
        100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
      }`;
      document.head.appendChild(style);
      setTimeout(() => { el.remove(); style.remove(); }, 1200);
    }
  }

  // ── EVENT BINDINGS ────────────────────────────
  function bindEvents() {
    // Category selection
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".category-card");
      if (card) selectCategory(card.dataset.id);

      const del = e.target.closest("[data-delete]");
      if (del) deleteFromSaved(Number(del.dataset.delete));
    });

    // Generate
    $("#btn-generate")?.addEventListener("click", generate);

    // Theme
    $("#btn-theme")?.addEventListener("click", toggleTheme);

    // Clear saved
    $("#btn-clear-saved")?.addEventListener("click", clearAllSaved);

    // Keyboard shortcut: Space to generate
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        generate();
      }
    });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
