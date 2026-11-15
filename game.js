// 《吃》网页原型 —— 核心逻辑
(() => {
  const D = window.GAME_DATA;
  const SAVE_KEY = "xunwei_save_v1";
  const ING = Object.fromEntries(D.ingredients.map(i => [i.id, i]));
  const CITY = Object.fromEntries(D.cities.map(c => [c.id, c]));

  // ---------- 存档 ----------
  function newState() {
    return {
      gold: D.config.startGold,
      cities: [D.config.startCity],
      inventory: {},
      dishes: [],
      recipes: [],
      lastSeen: Date.now(),
    };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s.gold === "number") return Object.assign(newState(), s);
    } catch (e) {}
    return newState();
  }
  function save() {
    S.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }

  let S = load();

  // ---------- 语言 / Language ----------
  const LANG_KEY = "chi_lang";
  const EN = window.GAME_DATA_EN || { cities: {}, ingredients: {}, dishes: {} };
  let lang = (() => {
    try { const l = localStorage.getItem(LANG_KEY); if (l === "zh" || l === "en") return l; } catch (e) {}
    return (navigator.language || "zh").toLowerCase().startsWith("zh") ? "zh" : "en";
  })();
  function t(k, vars) {
    let str = (I18N[lang] && I18N[lang][k]) ?? I18N.zh[k] ?? k;
    if (vars) for (const v in vars) str = str.split(`{${v}}`).join(vars[v]);
    return str;
  }
  // 游戏数据的显示名：英文模式取 GAME_DATA_EN，缺失时回退中文
  const cityName = id => lang === "en" ? (EN.cities[id]?.name || CITY[id].name) : CITY[id].name;
  const cityDesc = id => lang === "en" ? (EN.cities[id]?.desc || CITY[id].desc) : CITY[id].desc;
  const ingName = id => lang === "en" ? (EN.ingredients[id] || ING[id].name) : ING[id].name;
  const dishText = (d, f) => lang === "en" ? (EN.dishes[d.id]?.[f] || d[f]) : d[f];
  function applyStatic() {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.title = t("pageTitle");
    document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.dataset.i18n));
    document.querySelectorAll("[data-i18n-html]").forEach(el => el.innerHTML = t(el.dataset.i18nHtml));
    document.querySelectorAll("[data-i18n-title]").forEach(el => el.title = t(el.dataset.i18nTitle));
    document.querySelectorAll("[data-lang]").forEach(b => b.classList.toggle("active", b.dataset.lang === lang));
    document.body.classList.toggle("lang-en", lang === "en");
  }
  function setLang(l) {
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    applyStatic(); renderTitle(); renderAll();
    $("cookMsg").textContent = ""; $("mapPopup").classList.add("hidden");
    if (resetArmed) { resetArmed = false; }
    $("resetBtn").textContent = t("reset");
    const dbg = document.querySelector(".debug-btn"); if (dbg) dbg.textContent = t("debug");
  }
  document.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
  let pot = [];
  let marketCity = D.config.startCity;

  // ---------- 经济 ----------
  function income() {
    return D.config.baseIncome + S.dishes.reduce((sum, id) => sum + dish(id).incomeBonus, 0);
  }
  function dish(id) { return D.dishes.find(d => d.id === id); }
  function spend(n) {
    if (S.gold < n) { toast(t("notEnough")); return false; }
    S.gold -= n; return true;
  }

  // 离线收益（进入游戏后再弹出提示）
  let offlineMsg = null;
  (function offline() {
    const capMs = D.config.offlineCapHours * 3600 * 1000;
    const away = Math.min(Date.now() - S.lastSeen, capMs);
    if (away > 5000) {
      const gain = Math.floor((away / 1000) * income());
      if (gain > 0) {
        S.gold += gain;
        offlineMsg = { away, gain };
      }
    }
  })();

  // ---------- 工具 ----------
  const $ = id => document.getElementById(id);
  const fmt = n => Math.floor(n).toLocaleString(t("locale"));
  function fmtTime(sec) {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return h ? t("timeH", { h, m }) : m ? t("timeM", { m, s }) : t("timeS", { s });
  }
  let toastTimer;
  function toast(text) {
    const t = $("toast");
    t.textContent = text; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }
  function showModal(html) {
    $("modalCard").innerHTML = html;
    $("modal").classList.remove("hidden");
  }
  $("modal").addEventListener("click", e => {
    if (e.target.id === "modal" || e.target.hasAttribute("data-close")) $("modal").classList.add("hidden");
  });

  // ---------- 标签页 ----------
  document.querySelectorAll(".tabs button").forEach(b => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  function switchTab(name) {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + name));
    renderAll();
  }

  // ---------- 开始界面 ----------
  const FOODS = ["🌶️","🥟","🍜","🍝","🧀","🥚","🍖","🫙","🥒","🧅","🍤","🥢","🍚","🫓"];
  $("floaters").innerHTML = Array.from({ length: 16 }, (_, i) => {
    const left = (i * 61) % 100, dur = 14 + (i * 7) % 12, delay = -((i * 3.7) % dur), size = 28 + (i * 11) % 30;
    return `<span style="left:${left}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:${delay}s">${FOODS[i % FOODS.length]}</span>`;
  }).join("");
  function renderTitle() {
    const started = S.dishes.length || S.cities.length > 1 || Object.keys(S.inventory).length || S.recipes.length;
    $("startBtn").textContent = started ? t("continue") : t("start");
    if (!newArmed) $("newGameBtn").textContent = t("newGame");
    $("newGameBtn").classList.toggle("hidden", !started);
    $("saveInfo").innerHTML = started
      ? t("saveInfo", { done: S.dishes.length, total: D.dishes.length, cities: S.cities.map(cityName).join(t("listSep")), gold: fmt(S.gold) })
      : "";
  }
  function enterGame() {
    const t = $("title");
    t.classList.add("leaving");
    setTimeout(() => t.classList.add("gone"), 600);
    if (offlineMsg) {
      const { away, gain } = offlineMsg; offlineMsg = null;
      setTimeout(() => showModal(`
        <div class="big">🌙</div>
        <h2>${t("welcomeBack")}</h2>
        <p>${t("offlineBody", { time: fmtTime(away / 1000), gold: fmt(gain) })}</p>
        <button class="primary" data-close>${t("ok")}</button>`), 450);
    }
    renderAll();
  }
  $("startBtn").addEventListener("click", enterGame);
  let newArmed = false;
  $("newGameBtn").addEventListener("click", () => {
    if (!newArmed) {
      newArmed = true; $("newGameBtn").textContent = t("newGameConfirm");
      setTimeout(() => { newArmed = false; $("newGameBtn").textContent = t("newGame"); }, 3000);
      return;
    }
    S = newState(); pot = []; offlineMsg = null; save(); enterGame();
  });
  $("homeBtn").addEventListener("click", () => {
    save(); renderTitle();
    const t = $("title"); t.classList.remove("gone");
    requestAnimationFrame(() => t.classList.remove("leaving"));
  });

  // ---------- 地图 ----------
  function renderWorld() {
    $("worldMap").innerHTML = WorldMap.render(
      D.cities.map(c => ({ ...c, name: cityName(c.id), open: S.cities.includes(c.id) })), D.config.startCity);
  }
  function openPopup(id, evt) {
    const c = CITY[id], open = S.cities.includes(id);
    const total = D.dishes.filter(d => d.city === id).length;
    const done = D.dishes.filter(d => d.city === id && S.dishes.includes(d.id)).length;
    const pop = $("mapPopup"), wrap = pop.parentElement.getBoundingClientRect();
    const pin = evt.target.closest(".pin").getBoundingClientRect();
    pop.style.left = (pin.left + pin.width / 2 - wrap.left) + "px";
    pop.style.top = (pin.top - wrap.top + 8) + "px";
    pop.innerHTML = `<button class="x" data-closepop>×</button>
      <div class="name">${open ? c.emoji : "🔒"} ${cityName(id)}</div>
      <div class="meta">${cityDesc(id)}<br>${open ? t("collection", { done, total }) : t("unlockNeed", { cost: fmt(c.unlockCost) })}</div>
      ${open ? `<button data-go="${id}">${t("goMarket")}</button>`
             : `<button data-unlock="${id}" ${S.gold < c.unlockCost ? "disabled" : ""}>${t("openRoute")}</button>`}`;
    pop.classList.remove("hidden");
  }
  $("worldMap").addEventListener("click", e => {
    const pin = e.target.closest(".pin");
    if (pin) openPopup(pin.dataset.city, e); else $("mapPopup").classList.add("hidden");
  });
  $("mapPopup").addEventListener("click", e => {
    if (e.target.hasAttribute("data-closepop")) { $("mapPopup").classList.add("hidden"); return; }
    handleCityAction(e);
    if (e.target.dataset.go || e.target.dataset.unlock) $("mapPopup").classList.add("hidden");
  });

  function renderMap() {
    $("cityList").innerHTML = D.cities.map(c => {
      const open = S.cities.includes(c.id);
      const total = D.dishes.filter(d => d.city === c.id).length;
      const done = D.dishes.filter(d => d.city === c.id && S.dishes.includes(d.id)).length;
      return `<div class="card ${open ? "" : "locked"}">
        <div class="big">${open ? c.emoji : "🔒"}</div>
        <div class="name">${cityName(c.id)}</div>
        <div class="meta">${cityDesc(c.id)}</div>
        <div class="meta">${open ? t("collection", { done, total }) : t("unlockNeed", { cost: fmt(c.unlockCost) })}</div>
        <div class="row">${open
          ? `<button data-go="${c.id}">${t("goMarket")}</button>`
          : `<button data-unlock="${c.id}" ${S.gold < c.unlockCost ? "disabled" : ""}>${t("openRoute")}</button>`}</div>
      </div>`;
    }).join("");
  }
  $("cityList").addEventListener("click", handleCityAction);
  function handleCityAction(e) {
    const go = e.target.dataset.go, un = e.target.dataset.unlock;
    if (go) { marketCity = go; switchTab("market"); }
    if (un && spend(CITY[un].unlockCost)) {
      S.cities.push(un); save();
      showModal(`<div class="big">✈️</div><h2>${t("routeOpened", { city: cityName(un) })}</h2>
        <p>${t("routeOpenedBody", { desc: cityDesc(un) })}</p>
        <button class="primary" data-close>${t("depart")}</button>`);
      marketCity = un; renderAll();
    }
  }

  // ---------- 集市 ----------
  function renderMarket() {
    if (!S.cities.includes(marketCity)) marketCity = S.cities[0];
    $("marketCityTabs").innerHTML = S.cities.map(id =>
      `<button data-city="${id}" class="${id === marketCity ? "active" : ""}">${CITY[id].emoji} ${cityName(id)}</button>`).join("");
    $("marketIngredients").innerHTML = D.ingredients.filter(i => i.city === marketCity).map(i => `
      <div class="card">
        <div class="big">${i.emoji}</div>
        <div class="name">${ingName(i.id)}</div>
        <div class="meta">🪙 ${i.price} ${t("perPortion")} · ${t("inBag", { n: S.inventory[i.id] || 0 })}</div>
        <div class="row">
          <button data-buy="${i.id}" data-n="1" ${S.gold < i.price ? "disabled" : ""}>${t("buy1")}</button>
          <button class="ghost" data-buy="${i.id}" data-n="5" ${S.gold < i.price * 5 ? "disabled" : ""}>${t("buy5")}</button>
        </div>
      </div>`).join("");
    $("marketRecipes").innerHTML = D.dishes.filter(d => d.city === marketCity).map(d => {
      const owned = S.recipes.includes(d.id) || S.dishes.includes(d.id);
      return `<div class="card">
        <div class="big">📜</div>
        <div class="name">${t("recipeOf", { dish: dishText(d, "name") })}</div>
        <div class="meta">${owned ? t("owned") : `🪙 ${fmt(d.recipePrice)}`}</div>
        <div class="row">${owned ? "" : `<button data-recipe="${d.id}" ${S.gold < d.recipePrice ? "disabled" : ""}>${t("buy")}</button>`}</div>
      </div>`;
    }).join("");
  }
  $("marketCityTabs").addEventListener("click", e => {
    if (e.target.dataset.city) { marketCity = e.target.dataset.city; renderMarket(); }
  });
  $("tab-market").addEventListener("click", e => {
    const id = e.target.dataset.buy;
    if (id) {
      const n = +e.target.dataset.n;
      if (spend(ING[id].price * n)) {
        S.inventory[id] = (S.inventory[id] || 0) + n; save();
        toast(t("bought", { item: `${ING[id].emoji} ${ingName(id)}`, n })); renderAll();
      }
    }
    const r = e.target.dataset.recipe;
    if (r && spend(dish(r).recipePrice)) {
      S.recipes.push(r); save();
      const d = dish(r);
      showModal(`<div class="big">📜</div><h2>${dishText(d, "name")}</h2>
        <p>${t("recipeLabel")}${d.ingredients.map(x => `${ING[x].emoji} ${ingName(x)}`).join(" + ")}</p>
        <p class="sub">${t("recipeSaved")}</p>
        <button class="primary" data-close>${t("gotIt")}</button>`);
      renderAll();
    }
  });

  // ---------- 厨房 ----------
  function available(id) { return (S.inventory[id] || 0) - pot.filter(x => x === id).length; }
  function renderKitchen() {
    const owned = D.ingredients.filter(i => (S.inventory[i.id] || 0) > 0);
    $("bag").innerHTML = owned.length ? owned.map(i => {
      const n = available(i.id);
      return `<div class="ing ${n <= 0 ? "empty" : ""}" draggable="${n > 0}" data-add="${i.id}">
        <span class="c">×${n}</span><div class="e">${i.emoji}</div><div class="n">${ingName(i.id)}</div></div>`;
    }).join("") : `<p class="sub">${t("bagEmpty")}</p>`;
    $("potItems").innerHTML = pot.map((id, idx) =>
      `<div class="ing" data-remove="${idx}" title="${t("takeOut")}"><div class="e">${ING[id].emoji}</div><div class="n">${ingName(id)}</div></div>`).join("");
  }
  function addToPot(id) {
    if (available(id) <= 0) return;
    pot.push(id); $("cookMsg").textContent = ""; renderKitchen();
  }
  $("bag").addEventListener("click", e => {
    const el = e.target.closest("[data-add]"); if (el) addToPot(el.dataset.add);
  });
  $("bag").addEventListener("dragstart", e => {
    const el = e.target.closest("[data-add]"); if (el) e.dataTransfer.setData("text/plain", el.dataset.add);
  });
  const potEl = $("pot");
  potEl.addEventListener("dragover", e => { e.preventDefault(); potEl.classList.add("over"); });
  potEl.addEventListener("dragleave", () => potEl.classList.remove("over"));
  potEl.addEventListener("drop", e => {
    e.preventDefault(); potEl.classList.remove("over");
    const id = e.dataTransfer.getData("text/plain"); if (ING[id]) addToPot(id);
  });
  $("potItems").addEventListener("click", e => {
    const el = e.target.closest("[data-remove]");
    if (el) { pot.splice(+el.dataset.remove, 1); renderKitchen(); }
  });
  $("clearPot").addEventListener("click", () => { pot = []; $("cookMsg").textContent = ""; renderKitchen(); });

  const key = arr => [...arr].sort().join("|");
  $("cookBtn").addEventListener("click", () => {
    const msg = $("cookMsg");
    if (!pot.length) { msg.textContent = t("potEmpty"); return; }
    const match = D.dishes.find(d => key(d.ingredients) === key(pot));
    if (!match) {
      // 零惩罚：食材原样退回，只给温馨提示
      const set = new Set(pot);
      const close = D.dishes.find(d => d.ingredients.every(x => set.has(x)) || [...set].every(x => d.ingredients.includes(x)));
      let tip = t("tipWrong");
      if (close && [...set].every(x => close.ingredients.includes(x))) tip = t("tipMissing");
      else if (close) tip = t("tipExtra");
      if (pot.length !== set.size) tip = t("tipDup");
      msg.textContent = tip; pot = []; renderKitchen(); return;
    }
    if (S.dishes.includes(match.id)) {
      msg.textContent = t("already", { dish: dishText(match, "name") }); pot = []; renderKitchen(); return;
    }
    pot.forEach(id => S.inventory[id]--);
    pot = [];
    S.dishes.push(match.id); save();
    msg.textContent = "";
    showModal(`<div class="big">${match.emoji}</div>
      <h2>${t("success", { dish: dishText(match, "name") })}</h2>
      <p>${dishText(match, "story")}</p>
      <p>${t("incomeGain")} <b style="color:var(--accent-2)">+${match.incomeBonus} ${t("coinsPerSec")}</b></p>
      <button class="primary" data-close>${t("addToJournal")}</button>`);
    lastUnlocked = match.id;
    renderAll();
  });

  // ---------- 手帐 ----------
  let lastUnlocked = null;
  function renderJournal() {
    $("journalCount").textContent = `${S.dishes.length}/${D.dishes.length}`;
    $("journal").innerHTML = D.dishes.map(d => {
      const got = S.dishes.includes(d.id);
      const cityOpen = S.cities.includes(d.city);
      const recipe = S.recipes.includes(d.id) || got;
      const recipeText = d.ingredients.map(x => `${ING[x].emoji} ${ingName(x)}`).join(" + ");
      return `<div class="card ${got ? "" : "locked"} ${d.id === lastUnlocked ? "flip" : ""}">
        <div class="big">${got ? d.emoji : cityOpen ? d.emoji : "🔒"}</div>
        <div class="name">${got || cityOpen ? dishText(d, "name") : t("unknown")}</div>
        <div class="meta">${CITY[d.city].emoji} ${cityName(d.city)} · +${d.incomeBonus}${t("perSec")}</div>
        ${got ? `<div class="story">${dishText(d, "story")}</div>` :
          cityOpen ? `<div class="meta">💡 ${dishText(d, "hint")}</div>` : `<div class="meta">${t("lockedUntil", { city: cityName(d.city) })}</div>`}
        ${recipe && cityOpen ? `<div class="recipe">${recipeText}</div>` : ""}
      </div>`;
    }).join("");
    lastUnlocked = null;
  }

  // ---------- 主循环 ----------
  function renderTop() {
    $("gold").textContent = fmt(S.gold);
    $("income").textContent = income();
  }
  function renderAll() { renderTop(); renderWorld(); renderMap();renderMarket(); renderKitchen(); renderJournal(); }

  let last = performance.now(), saveAcc = 0, uiAcc = 0;
  function tick(now) {
    const dt = Math.min((now - last) / 1000, 1); last = now;
    S.gold += income() * dt;
    saveAcc += dt; uiAcc += dt;
    renderTop();
    if (uiAcc > 1) {          // 每秒刷新一次按钮可用状态（不打断拖拽）
      uiAcc = 0;
      const active = document.querySelector(".panel.active").id;
      if (active === "tab-map") renderMap();
      if (active === "tab-market") renderMarket();
    }
    if (saveAcc > 5) { saveAcc = 0; save(); }
    requestAnimationFrame(tick);
  }
  window.addEventListener("beforeunload", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  $("resetBtn").addEventListener("click", () => {
    if (confirmReset()) { S = newState(); pot = []; save(); renderAll(); renderTitle(); toast(t("resetDone")); }
  });
  let resetArmed = false;
  function confirmReset() {    // 不用浏览器弹窗：点两次确认
    if (resetArmed) { resetArmed = false; $("resetBtn").textContent = t("reset"); return true; }
    resetArmed = true; $("resetBtn").textContent = t("resetConfirm");
    setTimeout(() => { resetArmed = false; $("resetBtn").textContent = t("reset"); }, 3000);
    return false;
  }

  // 测试用：网址后加 ?debug 显示加金币按钮
  if (location.search.includes("debug")) {
    const b = document.createElement("button");
    b.className = "link debug-btn"; b.textContent = t("debug");
    b.onclick = () => { S.gold += 5000; renderAll(); };
    document.querySelector("footer").appendChild(b);
  }

  applyStatic();
  $("resetBtn").textContent = t("reset");
  renderAll();
  renderTitle();
  requestAnimationFrame(tick);
})();
