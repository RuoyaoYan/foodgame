// 《吃》网页原型 —— 核心逻辑
// 循环：农场/集市拿食材 → 厨房猜配方研发、出餐 → 店铺货架自动卖菜赚金币 → 开通城市、买家具
(() => {
  const D = window.GAME_DATA;
  I18N.applyData(D);      // 非中文时，把食材 / 料理 / 城市等名称换成当前语言
  I18N.applyDOM();        // 把 index.html 里的固定文字换成当前语言
  const SAVE_KEY = "xunwei_save_v1";
  const ING = Object.fromEntries(D.ingredients.map(i => [i.id, i]));
  const CITY = Object.fromEntries(D.cities.map(c => [c.id, c]));
  const DISH = Object.fromEntries(D.dishes.map(d => [d.id, d]));
  const FARM = Object.fromEntries(D.farm.items.map(f => [f.id, f]));
  const FURN = Object.fromEntries(D.furniture.map(f => [f.id, f]));
  const METHOD = Object.fromEntries(D.methods.map(m => [m.id, m]));
  // todo = 开发中：只进图鉴，不能买、种、做
  const RAW = D.ingredients.filter(i => i.kind === "raw" && !i.todo);
  const PROC = D.ingredients.filter(i => i.kind === "processed" && !i.todo);
  const CAT = Object.fromEntries(D.categories.map(c => [c.id, c]));
  // 所有“锅里能做出来的东西”：加工品 + 料理
  const RECIPES = [...PROC.map(i => ({ ...i, ingredients: i.inputs, isProc: true })), ...D.dishes];
  const FM = D.farm;
  const SH = D.shop;
  const BOOK = Object.fromEntries(D.books.map(b => [b.id, b]));
  const bookOf = dishId => D.books.find(b => b.dishes.includes(dishId));
  // 菜的“出处”：有关卡的国家显示国家，没有关卡的外国菜显示 origin 国名，都没有就显示“世界”
  const placeOf = d => d.city && CITY[d.city] ? CITY[d.city] : { emoji: "🌍", name: T(d.origin || "世界") };

  // ---------- 存档 ----------
  function newState() {
    return {
      gold: D.config.startGold,
      cities: [D.config.startCity],
      inventory: {},          // 食材库存
      dishes: [],             // 已研发的菜（图鉴）
      processed: [],          // 已研发的加工品
      recipes: [],            // 已购买的菜谱
      seenIngs: [],           // 见过的食材（食材图鉴）
      dishStock: {},          // 成菜库存
      shelfCount: SH.startShelves,
      shelves: [],            // [{dish, count, last}]
      fieldCount: FM.fieldPlots, penCount: FM.pens,
      fields: [], pens: [],   // [{item, last, level}]，item 为 null 表示空地
      furniture: [],
      settings: { music: true, sfx: true, devView: false },
      mastery: {},            // 料理熟练度点数 { 料理id: 点数 }
      stats: { bought: 0, cooked: 0 },
      methodsUsed: [],        // 用过的做法（成就）
      achievements: [],       // 已达成的成就
      methods: D.methods.filter(m => !m.unlockCost).map(m => m.id),   // 已解锁的做法
      books: D.books.filter(b => !b.price).map(b => b.id),              // 已拥有的食谱书
      sold: 0,
      v: 2,                   // 存档版本：2 = 关卡改为国家、食谱书按主题重编
      lastSeen: Date.now(),
    };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s.gold === "number") {
        const st = migrate(Object.assign(newState(), s), s);
        st.stats = Object.assign({ bought: 0, cooked: 0 }, st.stats);
        st.settings = Object.assign({ music: true, sfx: true, devView: false }, st.settings);
        return st;
      }
    } catch (e) {}
    return newState();
  }
  // 旧存档迁移：v0.4 之前的食材 id 合并/改名，旧农场格式清空
  function migrate(st, raw) {
    const RENAME = { minced_pork: "pork", pork_belly: "pork", tenderloin: "pork", tofu_skin: "tofu",
      pecorino: "cheese", cream_cheese: "cheese", raw_noodles: "noodles",
      spaghetti: "noodles", chili: "spicy_spice", sichuan_pepper: "spicy_spice", scallion: "onion", nori: "seaweed" };
    const DROP = ["sweet_paste", "doubanjiang", "yellow_paste", "guanciale", "garlic_sprout"];
    const fixMap = obj => {
      const out = {};
      for (const [k, v] of Object.entries(obj || {})) {
        const id = RENAME[k] || k;
        if (DROP.includes(id) || !ING[id]) continue;
        out[id] = (out[id] || 0) + v;
      }
      return out;
    };
    st.inventory = fixMap(st.inventory);
    if (!raw.seenIngs) st.seenIngs = Object.keys(st.inventory);
    st.seenIngs = [...new Set(st.seenIngs.map(k => RENAME[k] || k))].filter(k => ING[k]);
    st.processed = [...new Set((st.processed || []).map(k => RENAME[k] || k))].filter(k => ING[k]);
    st.dishes = (st.dishes || []).filter(k => DISH[k]);
    // 已删除的菜：从成菜库存和货架上清掉
    st.dishStock = Object.fromEntries(Object.entries(st.dishStock || {}).filter(([k]) => DISH[k]));
    (st.shelves || []).forEach(sh => { if (sh.dish && !DISH[sh.dish]) { sh.dish = null; sh.count = 0; } });
    st.recipes = (st.recipes || []).filter(k => DISH[k]);
    const base = D.methods.filter(m => !m.unlockCost).map(m => m.id);
    st.methods = [...new Set([...base, ...(st.methods || [])])].filter(k => D.methods.some(m => m.id === k));
    // v0.11：关卡由城市改为国家。旧城市 id 合并成国家；旧食谱书按里面的菜折算成新书
    const MG = D.migration || {};
    st.cities = [...new Set([D.config.startCity, ...(st.cities || []).map(c => (MG.cityMap || {})[c] || c)])].filter(c => CITY[c]);
    // 只在 v2 之前的旧存档上折算一次旧书，之后不再重复发书
    const legacy = !(raw.v >= 2);
    const legacyDishes = legacy ? (st.books || []).flatMap(k => (MG.oldBookDishes || {})[k] || []) : [];
    st.v = 2;
    // 食谱书：赠送的书 + 旧存档里已经研发过 / 买过菜谱的菜所在的书
    const owned = new Set([...D.books.filter(b => !b.price).map(b => b.id), ...(st.books || [])]);
    legacyDishes.forEach(id => { const b = bookOf(id); if (b) owned.add(b.id); });
    [...st.dishes, ...st.recipes].forEach(id => { const b = bookOf(id); if (b) owned.add(b.id); });
    st.books = [...owned].filter(k => BOOK[k]);
    const okPlot = p => p && typeof p === "object" && "level" in p;
    st.fields = (st.fields || []).filter(okPlot);
    st.pens = (st.pens || []).filter(okPlot);
    return st;
  }
  function save() {
    S.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }
  let S = load();
  function normalize() {
    while (S.shelves.length < S.shelfCount) S.shelves.push({ dish: null, count: 0, last: Date.now() });
    while (S.fields.length < S.fieldCount) S.fields.push({ item: null, last: Date.now(), level: 1 });
    while (S.pens.length < S.penCount) S.pens.push({ item: null, last: Date.now(), level: 1 });
  }
  normalize();

  let pot = [];
  let streetTab = "food";     // 商店街：food 食品街 / books 书店 / hardware 五金店
  let currentTab = "home";
  let homeSub = "dishes";
  let lastUnlocked = null;
  let method = null;          // 厨房当前选择的做法
  let dexCat = "all";         // 食材图鉴当前分类

  // ---------- 加成 ----------
  const bonus = eff => S.furniture.reduce((s, id) => s + (FURN[id].effect === eff ? FURN[id].value : 0), 0);
  // 熟练度
  const MS = D.mastery;
  const masteryLv = id => { const xp = S.mastery[id] || 0; let lv = 1; MS.levels.forEach((need, i) => { if (xp >= need) lv = i + 1; }); return lv; };
  const nextNeed = id => MS.levels[masteryLv(id)];   // undefined = 满级
  const priceOf = d => Math.round(d.sellPrice * (1 + bonus("sellPrice")) * (1 + MS.priceBonusPerLevel * (masteryLv(d.id) - 1)));
  const masteryText = id => { const lv = masteryLv(id), nx = nextNeed(id); return nx !== undefined ? T("熟练度 Lv.{0}（{1}/{2}）", lv, S.mastery[id] || 0, nx) : T("熟练度 Lv.{0}（满级）", lv); };
  function gainMastery(id, n) {
    const before = masteryLv(id);
    S.mastery[id] = (S.mastery[id] || 0) + n; S.stats.cooked += n;
    const after = masteryLv(id);
    if (after > before) setTimeout(() => toast(T("⭐ {0} 熟练度升到 Lv.{1}！售价 +{2}%", DISH[id].name, after, Math.round(MS.priceBonusPerLevel * (after - 1) * 100))), 900);
  }
  const sellIntervalMs = () => SH.sellIntervalSec * 1000 / (1 + bonus("sellSpeed"));
  // 农场：每块地持续产出，产出攒在地里（有上限），点一下收取
  const plotIv = p => FARM[p.item].produceSec * 1000 / ((1 + FM.levelSpeedBonus * (p.level - 1)) * (1 + bonus("farmSpeed")));
  const plotCap = p => FM.baseCap + FM.capPerLevel * (p.level - 1);
  const plotStored = (p, now = Date.now()) => p.item ? Math.min(plotCap(p), Math.floor((now - p.last) / plotIv(p))) : 0;
  function collectPlot(p) {
    const n = plotStored(p);
    if (n > 0) {
      addIng(FARM[p.item].produces, n);
      p.last = n >= plotCap(p) ? Date.now() : p.last + n * plotIv(p);
    }
    return n;
  }

  // ---------- 店铺结算（在线、离线同一套逻辑） ----------
  function processShop(now) {
    const iv = sellIntervalMs(), capMs = D.config.offlineCapHours * 3600 * 1000;
    let gold = 0, sold = 0;
    S.shelves.forEach(sh => {
      if (!sh.dish || sh.count <= 0) return;
      if (now - sh.last > capMs) sh.last = now - capMs;
      while (sh.count > 0 && now - sh.last >= iv) {
        sh.count--; sh.last += iv; gold += priceOf(DISH[sh.dish]); sold++;
      }
    });
    S.gold += gold; S.sold += sold;
    return { gold, sold };
  }

  // 离线结算（进入游戏后弹出）
  let offlineMsg = null;
  (function offline() {
    const away = Date.now() - S.lastSeen;
    const r = processShop(Date.now());
    const ready = [...S.fields, ...S.pens].reduce((s, p) => s + plotStored(p), 0);
    if (away > 30000 && (r.sold > 0 || ready > 0)) offlineMsg = { away, ...r, ready };
  })();

  // ---------- 工具 ----------
  const $ = id => document.getElementById(id);
  // 流畅度：这些容器每秒都会被刷新，但多数时候内容并没有变。给它们的 innerHTML 加一道“没变就不写”的闸，
  // 避免整片 DOM 被销毁重建（食品街一次有上百张卡片）。
  (function dedupeInnerHTML(ids) {
    const desc = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    ids.forEach(id => {
      const el = document.getElementById(id); if (!el) return;
      let last = null;
      Object.defineProperty(el, "innerHTML", {
        configurable: true,
        get() { return desc.get.call(this); },
        set(v) { if (v === last) return; last = v; desc.set.call(this, v); },
      });
    });
  })(["room", "codexGrid", "unlockedList", "dexCats", "ingDex", "storageDishes", "storageIngs", "furnitureList", "achList",
      "fields", "pens", "shopBonus", "shelves", "shelfExpand", "cityList", "foodStreet", "bookstore", "hardware",
      "bag", "potItems", "methods", "quickCook", "bookViewerList", "saveInfo"]);
  const fmt = n => Math.floor(n).toLocaleString(I18N.locale);
  function fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return h ? T("{0}小时{1}分", h, m) : m ? T("{0}分{1}秒", m, s) : T("{0}秒", s);
  }
  const pct = v => Math.round(v * 100) + "%";
  let toastTimer;
  function toast(text) {
    const t = $("toast");
    t.textContent = text; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }
  function showModal(html) { $("modalCard").innerHTML = html; $("modal").classList.remove("hidden"); }
  $("modal").addEventListener("click", e => {
    if (e.target.id === "modal" || e.target.hasAttribute("data-close")) $("modal").classList.add("hidden");
  });
  // 开发者模式：金钱无限、所有东西都能买
  const DEV = () => S.settings.devView;
  const hasBook = dishId => DEV() || S.books.includes((bookOf(dishId) || {}).id);
  // 买了食谱书 = 知道这本书里所有料理的完整配方
  const G = () => DEV() ? Infinity : S.gold;
  function spend(n) {
    if (DEV()) return true;
    if (G() < n) { toast(T("金币不够哦，先去店铺卖点菜吧")); return false; }
    S.gold -= n; return true;
  }
  function addIng(id, n) {
    S.inventory[id] = (S.inventory[id] || 0) + n;
    if (!S.seenIngs.includes(id)) S.seenIngs.push(id);
  }
  function twoClick(btn, label, confirmLabel, action) {   // 不用浏览器弹窗的二次确认
    if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = label; action(); return; }
    btn.dataset.armed = "1"; btn.textContent = confirmLabel;
    setTimeout(() => { delete btn.dataset.armed; btn.textContent = label; }, 3000);
  }

  // ---------- 美术：图片位置 + 水彩贴纸 ----------
  // 把图片放到 images/ingredients/<食材id>.png 或 images/dishes/<料理id>.png 就会自动替换 emoji
  const WASH = ["#f4c3a6", "#c8dcae", "#b9d5e4", "#f3db97", "#eeb3ab", "#d3c5e6", "#f1cf9f", "#bfe0d2"];
  const artOK = {};
  function washOf(id) { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return WASH[h % WASH.length]; }
  const artSrc = (kind, id) => `images/${kind}/${id}.png`;
  let artDirty = false;
  function preloadArt() {
    const jobs = [...D.ingredients.map(i => ["ingredients", i.id]), ...D.dishes.map(d => ["dishes", d.id])];
    const idle = window.requestIdleCallback || (fn => setTimeout(fn, 60));
    (function batch() {          // 每批 20 张，放在空闲时间里，不和首屏抢带宽 / 主线程
      jobs.splice(0, 20).forEach(([kind, id]) => {
        const img = new Image();
        img.fetchPriority = "low";
        img.onload = () => {
          artOK[kind + "/" + id] = true;
          if (!artDirty) { artDirty = true; requestAnimationFrame(() => { artDirty = false; renderAll(); }); }   // 多张图同时到达，只重绘一次
        };
        img.src = artSrc(kind, id);
      });
      if (jobs.length) idle(batch);
    })();
  }
  function art(kind, id, emoji, size = "m", washOverride) {
    const has = kind && artOK[kind + "/" + id];
    return `<span class="sticker ${size}${has ? " has-img" : ""}" style="--wash:${washOverride || washOf(id)}">${has
      ? `<img src="${artSrc(kind, id)}" alt="">` : `<span class="emo">${emoji}</span>`}</span>`;
  }
  const ingArt = (id, size) => art("ingredients", id, ING[id].emoji, size);
  const dishArt = (d, size) => art("dishes", d.id, d.emoji, size);
  const lockArt = size => art(null, "lock", "🔒", size, "#e4dccd");
  const emoArt = (emoji, size, key) => art(null, key || emoji, emoji, size);

  // ---------- 导航 ----------
  $("bottomNav").addEventListener("click", e => {
    const b = e.target.closest("[data-tab]"); if (b) switchTab(b.dataset.tab);
  });
  function switchTab(name) {
    currentTab = name;
    const navTab = name;
    document.querySelectorAll("#bottomNav button").forEach(b => b.classList.toggle("active", b.dataset.tab === navTab));
    document.querySelectorAll(".panel").forEach(p => p.classList.toggle("active", p.id === "tab-" + name));
    $("mapPopup").classList.add("hidden");
    window.scrollTo({ top: 0 });
    renderAll();
  }

  // ---------- 开始界面 ----------
  const FOODS = ["🌶️","🥟","🍜","🍝","🧀","🥚","🍖","🫙","🥒","🧅","🍤","🥢","🍚","🫓"];
  $("floaters").innerHTML = Array.from({ length: 16 }, (_, i) => {
    const left = (i * 61) % 100, dur = 14 + (i * 7) % 12, delay = -((i * 3.7) % dur), size = 28 + (i * 11) % 30;
    return `<span style="left:${left}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:${delay}s">${FOODS[i % FOODS.length]}</span>`;
  }).join("");
  function renderTitle() {
    const started = S.dishes.length || S.processed.length || S.cities.length > 1 || S.seenIngs.length || S.recipes.length;
    $("startBtn").textContent = started ? T("继续旅程") : T("开始旅程");
    $("newGameBtn").classList.toggle("hidden", !started);
    $("saveInfo").innerHTML = started
      ? T("图鉴 {0}/{1} · 已到过 {2} · 🪙 {3}", S.dishes.length, D.dishes.length, S.cities.map(c => CITY[c].name).join("、"), fmt(S.gold))
      : "";
  }
  function enterGame() {
    const t = $("title");
    t.classList.add("leaving");
    setTimeout(() => t.classList.add("gone"), 600);
    if (offlineMsg) {
      const m = offlineMsg; offlineMsg = null;
      setTimeout(() => showModal(`
        <div class="big">🌙</div>
        <h2>${T("欢迎回来！")}</h2>
        <p>${T("你离开了 {0}。", fmtTime(m.away / 1000))}<br>
        ${m.sold ? `${T("小店卖出了 <b>{0}</b> 份菜，赚了 <b>🪙 {1}</b>。", m.sold, fmt(m.gold))}<br>` : ""}
        ${m.ready ? T("农场攒了 <b>{0}</b> 份食材等你收取。", m.ready) : ""}</p>
        <button class="primary" data-close>${T("好的")}</button>`), 450);
    }
    switchTab(currentTab);
  }
  $("startBtn").addEventListener("click", enterGame);
  $("newGameBtn").addEventListener("click", e => twoClick(e.target, T("重新开始"), T("再点一次确认（会清空存档）"), () => {
    S = newState(); normalize(); pot = []; offlineMsg = null; currentTab = "home"; save(); enterGame();
  }));
  function toTitle() {
    save(); renderTitle();
    const t = $("title"); t.classList.remove("gone");
    requestAnimationFrame(() => t.classList.remove("leaving"));
  }
  $("homeBtn").addEventListener("click", toTitle);

  // ---------- 我的家 ----------
  $("homeTabs").addEventListener("click", e => {
    const b = e.target.closest("[data-home]"); if (!b) return;
    homeSub = b.dataset.home; renderHome();
  });
  function renderHome() {
    document.querySelectorAll("#homeTabs button").forEach(b => b.classList.toggle("active", b.dataset.home === homeSub));
    document.querySelectorAll(".home-sub").forEach(el => el.classList.toggle("hidden", el.id !== "home-" + homeSub));
    renderRoom();
    if (homeSub === "dishes") renderCodexEntry();
    renderCodex();
    if (homeSub === "unlocked") renderUnlocked();
    if (homeSub === "ingredients") renderIngDex();
    if (homeSub === "storage") renderStorage();
    if (homeSub === "furniture") renderFurniture();
    if (homeSub === "achievements") renderAchievements();
  }
  function renderRoom() {
    const items = S.furniture.map(id => {
      const f = FURN[id];
      return `<div class="room-item" style="left:${f.x}%;top:${f.y}%" title="${f.name}">${emoArt(f.emoji, "l", f.id)}</div>`;
    }).join("");
    $("room").innerHTML = `<div class="room-wall"><div class="room-window">🌤️</div></div><div class="room-floor"></div>
      ${items}${S.furniture.length ? "" : `<div class="room-empty">${T("房间空空的……去“家具”里挑几件吧")}</div>`}`;
  }
  // ---------- 料理图鉴（全屏页）：按序号排、一页固定不滚动、翻页；未解锁只显示“？” ----------
  let codexQuery = "", codexPage = 0, codexPer = 32;
  const codexList = () => D.dishes.slice().sort((a, b) => a.no - b.no);
  const codexGot = d => S.dishes.includes(d.id) || DEV();   // 开发者模式：全部可见
  // 搜索：国家、食谱书名对所有料理有效；料理名 / 食材 / 做法只对已解锁的有效（避免剧透）
  function codexMatch(d, q) {
    if (!q) return true;
    const hay = [placeOf(d).name, bookOf(d.id).name, ...(codexGot(d) ? [d.name, METHOD[d.method].name, ...d.ingredients.map(x => ING[x].name)] : [])].join(" ");
    return hay.toLowerCase().includes(q.toLowerCase());
  }
  function renderCodexEntry() {
    $("codexEntryTotal").innerHTML = T("已解锁 <b>{0}</b> / {1} 道料理", D.dishes.filter(codexGot).length, D.dishes.length);
  }
  function codexLayout() {
    const g = $("codexGrid"), W = g.clientWidth, H = g.clientHeight;
    const cols = Math.max(7, Math.min(12, Math.floor(W / 118)));       // 每行至少 7 个
    const cw = (W - (cols - 1) * 7) / cols, ch = cw * 1.22;             // 卡片宽高比约 1:1.22
    const rows = Math.max(2, Math.floor((H + 8) / (ch + 8)));
    g.style.setProperty("--cols", cols); g.style.setProperty("--rows", rows);
    codexPer = cols * rows;
  }
  function renderCodex() {
    if ($("codex").classList.contains("hidden")) return;
    codexLayout();
    const q = codexQuery.trim();
    const list = codexList().filter(d => codexMatch(d, q));
    const pages = Math.max(1, Math.ceil(list.length / codexPer));
    codexPage = Math.max(0, Math.min(pages - 1, codexPage));
    const cur = list.slice(codexPage * codexPer, (codexPage + 1) * codexPer);
    let html = cur.map(d => {
      if (!codexGot(d)) return `<div class="cx-card locked"><div class="cx-pic"><span class="cx-q">?</span></div><div class="cx-bar"></div></div>`;
      return `<div class="cx-card ${d.id === lastUnlocked ? "flip" : ""}" data-dish="${d.id}" title="${d.name}">
        <div class="cx-pic">${codexPic(d)}</div>
        <div class="cx-bar"><span class="cx-no">${String(d.no).padStart(3, "0")}</span><span class="cx-nm">${d.name}</span></div></div>`;
    }).join("");
    if (!list.length) html = `<p class="sub cx-none">${T("没有找到和“{0}”有关的料理。", q)}</p>`;
    else for (let i = cur.length; i < codexPer; i++) html += `<div class="cx-card cx-empty"></div>`;
    $("codexGrid").innerHTML = html;
    $("codexTotal").innerHTML = T("已解锁 <b>{0}</b> / {1} 道料理", D.dishes.filter(codexGot).length, D.dishes.length);
    $("codexPgN").textContent = pages; $("codexPgIn").value = codexPage + 1; $("codexPgIn").max = pages;
    $("codexPrev").disabled = codexPage === 0; $("codexNext").disabled = codexPage >= pages - 1;
    $("codexDots").innerHTML = pages > 1 && pages <= 24 ? Array.from({ length: pages }, (_, i) => `<button class="cx-dot ${i === codexPage ? "on" : ""}" data-p="${i}"></button>`).join("") : "";
    lastUnlocked = null;
  }
  // 图鉴里的料理图：有图用图，没图用 emoji（尺寸跟着卡片走）
  const codexPic = d => artOK["dishes/" + d.id] ? `<img src="${artSrc("dishes", d.id)}" alt="">` : `<span class="cx-emo">${d.emoji}</span>`;
  const codexGo = p => { codexPage = p; renderCodex(); };
  function openCodex() { $("codex").classList.remove("hidden"); document.body.style.overflow = "hidden"; renderCodex(); }
  function closeCodex() { $("codex").classList.add("hidden"); document.body.style.overflow = ""; }
  $("openCodex").addEventListener("click", openCodex);
  $("codexClose").addEventListener("click", closeCodex);
  $("codexPrev").addEventListener("click", () => codexGo(codexPage - 1));
  $("codexNext").addEventListener("click", () => codexGo(codexPage + 1));
  $("codexPgIn").addEventListener("change", e => codexGo((+e.target.value || 1) - 1));
  $("codexDots").addEventListener("click", e => { const b = e.target.closest("[data-p]"); if (b) codexGo(+b.dataset.p); });
  $("codexGrid").addEventListener("click", openDishCard);
  let cxSwipe = null;
  $("codexGrid").addEventListener("pointerdown", e => { cxSwipe = e.clientX; });
  $("codexGrid").addEventListener("pointerup", e => { if (cxSwipe !== null && Math.abs(e.clientX - cxSwipe) > 60) codexGo(codexPage + (e.clientX < cxSwipe ? 1 : -1)); cxSwipe = null; });
  document.addEventListener("keydown", e => {
    if ($("codex").classList.contains("hidden") || !$("modal").classList.contains("hidden")) return;
    if (e.target.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") codexGo(codexPage - 1);
    if (e.key === "ArrowRight") codexGo(codexPage + 1);
    if (e.key === "Escape") closeCodex();
  });
  window.addEventListener("resize", () => {
    if ($("codex").classList.contains("hidden")) return;
    const first = codexPage * codexPer; codexLayout(); codexPage = Math.floor(first / codexPer); renderCodex();
  });
  // 我的家 → 已解锁料理：按已拥有的食谱书分组，只显示已经研发出来的料理
  function renderUnlocked() {
    const books = D.books.filter(b => DEV() || S.books.includes(b.id));
    let html = books.map(b => {
      const got = b.dishes.map(id => DISH[id]).filter(d => S.dishes.includes(d.id));
      const cards = got.length ? got.map(d => `<div class="card dish-mini" data-dish="${d.id}" title="${d.name}">${dishArt(d, "m")}
        <div class="name">${d.name}</div><div class="meta">Lv.${masteryLv(d.id)}</div></div>`).join("")
        : `<p class="sub wide">${T("这本书里还没有解锁的料理，去厨房研发吧。")}</p>`;
      return `<div class="bag-label wide cat-head">${b.emoji} 《${b.name}》 <small>${got.length}/${b.dishes.length}</small></div>` + cards;
    }).join("");
    if (!books.length) html = `<p class="sub wide">${T("还没有食谱书，去商店街的书店看看吧。")}</p>`;
    $("unlockedList").innerHTML = html;
  }
  const debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  $("codexSearch").addEventListener("input", debounce(e => { codexQuery = e.target.value; codexPage = 0; renderCodex(); }));
  $("unlockedList").addEventListener("click", openDishCard);
  function openDishCard(e) {
    const el = e.target.closest("[data-dish]"); if (!el) return;
    const d = DISH[el.dataset.dish], got = S.dishes.includes(d.id), own = hasBook(d.id);
    if (!own && !got) { toast(T("去书店买《{0}》后解锁", bookOf(d.id).name)); return; }
    showModal(`${dishArt(d, "xl")}
      <h2>${d.name}</h2>
      <p class="sub">${placeOf(d).emoji} ${placeOf(d).name} · 《${bookOf(d.id).name}》 · ${T("售价 🪙{0}", priceOf(d))}</p>
      <div class="recipe">${recipeText(d)}</div>
      ${got ? `<p>${d.story}</p><p class="sub">${masteryText(d.id)} ${T("· 每升一级售价 +{0}%", Math.round(MS.priceBonusPerLevel * 100))}</p>`
            : `<p class="hint">💡 ${d.hint}</p><p class="sub">${T("还没研发：按配方去厨房做一次吧。")}</p>`}
      <p><button class="primary" data-close>${T("合上")}</button></p>`);
  }
  function renderIngDex() {
    const dev = S.settings.devView;
    const usesOf = id => [...D.dishes.filter(d => dev || S.dishes.includes(d.id)), ...PROC.filter(p => dev || S.processed.includes(p.id))]
      .filter(r => (r.ingredients || r.inputs).includes(id)).map(r => r.name);
    const card = i => {
      const unlocked = i.kind === "raw" ? S.seenIngs.includes(i.id) : S.processed.includes(i.id);
      const show = unlocked || dev;
      const uses = usesOf(i.id);
      let body;
      if (i.todo) {
        body = `<div class="todo-badge">${T("🚧 开发中")}</div>
          <div class="meta">${i.kind === "raw" ? T("原本有的（来源、价格待定）") : T("需要自己做的（配方待定）")}</div>
          ${show ? `<div class="story">${i.desc || ""}</div>${i.ref ? `<div class="recipe">${i.ref}</div>` : ""}` : ""}`;
      } else if (i.kind === "raw") {
        body = `<div class="meta">${CITY[i.city].emoji} ${CITY[i.city].name}${show ? ` ${T("· 集市 🪙{0}", i.price)}` : ""}</div>
          ${show ? `<div class="meta">${T("用于：")}${uses.length ? uses.join("、") : "？"}</div>` : ""}`;
      } else {
        body = show ? `<div class="story">${i.desc}</div><div class="recipe">${recipeText({ ...i, ingredients: i.inputs })}</div>
                 <div class="meta">${T("用于：")}${uses.length ? uses.join("、") : "？"}</div>`
              : `<div class="hint">${i.hint}</div>`;
      }
      return `<div class="card ${unlocked ? "" : "locked"} ${i.todo ? "todo" : ""}">
        ${show ? ingArt(i.id, "l") : lockArt("l")}
        <div class="name">${show ? i.name : "？？？"}</div>
        <div class="meta cat-tag">${CAT[i.category].emoji} ${CAT[i.category].name} · ${i.kind === "raw" ? T("原材料") : T("加工品")}</div>
        ${body}
      </div>`;
    };
    const cats = D.categories.filter(c => D.ingredients.some(i => i.category === c.id));
    const count = c => {
      const list = D.ingredients.filter(i => i.category === c.id);
      const got = list.filter(i => i.kind === "raw" ? S.seenIngs.includes(i.id) : S.processed.includes(i.id)).length;
      return `${got}/${list.length}`;
    };
    $("dexCats").innerHTML = `<button data-dexcat="all" class="${dexCat === "all" ? "active" : ""}">${T("全部")}</button>` +
      cats.map(c => `<button data-dexcat="${c.id}" class="${dexCat === c.id ? "active" : ""}">${c.emoji} ${c.name} <small>${count(c)}</small></button>`).join("");
    const shown = dexCat === "all" ? cats : cats.filter(c => c.id === dexCat);
    $("ingDex").innerHTML = shown.map(c => {
      const list = D.ingredients.filter(i => i.category === c.id);
      const raw = list.filter(i => i.kind === "raw"), proc = list.filter(i => i.kind === "processed");
      return `<div class="bag-label wide cat-head">${c.emoji} ${c.name}</div>
        ${raw.length ? `<div class="bag-label wide sub-head">${T("原本有的")}</div>${raw.map(card).join("")}` : ""}
        ${proc.length ? `<div class="bag-label wide sub-head">${T("需要自己做的")}</div>${proc.map(card).join("")}` : ""}`;
    }).join("");
    $("devNote").classList.toggle("hidden", !dev);
  }
  $("dexCats").addEventListener("click", e => {
    const b = e.target.closest("[data-dexcat]"); if (!b) return;
    dexCat = b.dataset.dexcat; renderIngDex();
  });
  function renderStorage() {
    const ds = D.dishes.filter(d => (S.dishStock[d.id] || 0) > 0);
    $("storageDishes").innerHTML = ds.length ? ds.map(d => `<div class="card">${dishArt(d, "m")}
      <div class="name">${d.name}</div><div class="meta">×${S.dishStock[d.id]} ${T("· 售价 🪙{0}", priceOf(d))}</div></div>`).join("")
      : `<p class="sub">${T("还没有做好的菜。")}</p>`;
    const is = D.ingredients.filter(i => (S.inventory[i.id] || 0) > 0);
    $("storageIngs").innerHTML = is.length ? is.map(i => `<div class="card">${ingArt(i.id, "m")}
      <div class="name">${i.name}</div><div class="meta">×${S.inventory[i.id]}</div></div>`).join("")
      : `<p class="sub">${T("仓库里没有食材。")}</p>`;
  }
  const EFFECT_TEXT = { sellPrice: T("卖价"), sellSpeed: T("顾客速度"), farmSpeed: T("农场生长") };
  function renderFurniture() {
    $("furnitureList").innerHTML = D.furniture.map(f => {
      const owned = S.furniture.includes(f.id);
      return `<div class="card">${emoArt(f.emoji, "l", f.id)}
        <div class="name">${f.name}</div>
        <div class="meta">${EFFECT_TEXT[f.effect]} +${pct(f.value)}</div>
        <div class="row">${owned ? `<span class="meta">${T("✔ 已摆放")}</span>`
          : `<button data-furn="${f.id}" ${G() < f.price ? "disabled" : ""}>🪙 ${fmt(f.price)}</button>`}</div>
      </div>`;
    }).join("");
  }
  $("furnitureList").addEventListener("click", e => {
    const id = e.target.dataset.furn;
    if (id && spend(FURN[id].price)) {
      S.furniture.push(id); save();
      toast(T("{0} {1} 摆进家里啦！{2} +{3}", FURN[id].emoji, FURN[id].name, EFFECT_TEXT[FURN[id].effect], pct(FURN[id].value)));
      renderAll();
    }
  });
  function renderSettings() {
    document.querySelectorAll("[data-setting]").forEach(b => {
      const on = S.settings[b.dataset.setting];
      b.textContent = on ? T("开") : T("关"); b.classList.toggle("on", on);
    });
  }
  document.querySelectorAll("[data-setting]").forEach(b => b.addEventListener("click", () => {
    S.settings[b.dataset.setting] = !S.settings[b.dataset.setting]; save(); renderAll();
  }));
  $("toTitleBtn").addEventListener("click", toTitle);
  // 语言切换：存下选择后刷新页面（存档不受影响）
  function renderLangButtons(box) {
    box.innerHTML = I18N.langs.map(l => `<button class="${l.id === I18N.lang ? "picked" : "ghost"}" data-lang="${l.id}" lang="${l.id === "zh" ? "zh-CN" : l.id}">${l.name}</button>`).join("");
    box.addEventListener("click", e => {
      const b = e.target.closest("[data-lang]"); if (!b || b.dataset.lang === I18N.lang) return;
      save(); I18N.setLang(b.dataset.lang);
    });
  }
  renderLangButtons($("langBtns")); renderLangButtons($("titleLang"));
  $("resetBtn").addEventListener("click", e => twoClick(e.target, T("重置"), T("再点一次确认"), () => {
    S = newState(); normalize(); pot = []; save(); renderAll(); renderTitle(); toast(T("存档已重置"));
  }));

  // ---------- 农场（参考《洋果子店》：选一次，持续产出，可升级、扩建） ----------
  function renderPlots(kind) {
    const list = S[kind], type = kind === "fields" ? "crop" : "animal";
    const label = type === "crop" ? T("菜地") : T("畜栏");
    const now = Date.now();
    const options = D.farm.items.filter(f => f.type === type);
    let html = list.map((p, idx) => {
      const lvl = `<span class="lv">Lv.${p.level}</span>`;
      const upCost = FM.upgradeCosts[p.level - 1];
      const upBtn = upCost !== undefined
        ? `<button class="ghost" data-upgrade="${idx}" data-kind="${kind}" ${G() < upCost ? "disabled" : ""}>${T("升级 🪙{0}", fmt(upCost))}</button>`
        : `<span class="meta">${T("已满级")}</span>`;
      const pick = options.map(f => {
        const open = S.cities.includes(f.city);
        return `<button class="${p.item === f.id ? "picked" : "ghost"}" data-assign="${f.id}" data-kind="${kind}" data-idx="${idx}"
          ${!open || p.item === f.id ? "disabled" : ""}>${f.emoji} ${f.name}${open ? "" : " 🔒" + CITY[f.city].name}</button>`;
      }).join("");
      if (!p.item) {
        return `<div class="card plot empty-plot">${lvl}${emoArt(type === "crop" ? "🟫" : "🛖", "l", kind + "e")}
          <div class="name">${T("空{0}", label)}</div>
          <div class="meta">${type === "crop" ? T("选一样来种，之后会一直产出") : T("选一样来养，之后会一直产出")}</div>
          <div class="row col">${pick}</div>
          <div class="row">${upBtn}</div></div>`;
      }
      const f = FARM[p.item], iv = plotIv(p), cap = plotCap(p), n = plotStored(p, now);
      const full = n >= cap, prog = full ? 1 : ((now - p.last) % iv) / iv;
      const prod = ING[f.produces];
      return `<div class="card plot ${n ? "ready" : ""}">${lvl}
        ${emoArt(f.emoji, "l", f.id)}
        <div class="name">${f.name} → ${prod.emoji} ${prod.name}</div>
        <div class="stash">${n ? `${prod.emoji}`.repeat(Math.min(n, 8)) + (n > 8 ? "…" : "") : `<span class='meta'>${T("还没有产出")}</span>`}</div>
        <div class="meta">${T("已攒 <b>{0}</b> / {1} 份 · 每 {2} 产 1 份", n, cap, fmtTime(iv / 1000))}</div>
        <div class="bar"><i style="width:${prog * 100}%"></i></div>
        <div class="meta">${full ? T("满了！快收取，不然不会再长") : T("下一份 {0}", fmtTime((iv - (now - p.last) % iv) / 1000))}</div>
        <div class="row">
          <button data-collect="${idx}" data-kind="${kind}" ${n ? "" : "disabled"}>${T("收取")}${n ? " ×" + n : ""}</button>
          ${upBtn}
        </div>
        <details class="swap" data-swap="${kind}${idx}" ${openSwaps.has(kind + idx) ? "open" : ""}><summary>${type === "crop" ? T("换种别的") : T("换养别的")}</summary><div class="row col">${pick}</div></details>
      </div>`;
    }).join("");
    const costs = kind === "fields" ? FM.fieldExpandCosts : FM.penExpandCosts;
    const extra = list.length - (kind === "fields" ? FM.fieldPlots : FM.pens);
    html += extra < costs.length
      ? `<div class="card plot add-plot">${emoArt("➕", "l", kind + "add")}<div class="name">${T("扩建{0}", label)}</div>
          <div class="meta">${T("去商店街的五金店扩建")}</div>
          <div class="row"><button class="ghost" data-goshop="hardware">${T("去五金店")}</button></div></div>`
      : "";
    $(kind).innerHTML = html;
  }
  const openSwaps = new Set();
  $("tab-farm").addEventListener("toggle", e => {
    const d = e.target; if (!d.dataset || !d.dataset.swap) return;
    if (d.open) openSwaps.add(d.dataset.swap); else openSwaps.delete(d.dataset.swap);
  }, true);
  function renderFarm() {
    renderPlots("fields"); renderPlots("pens");
    const total = [...S.fields, ...S.pens].reduce((s, p) => s + plotStored(p), 0);
    $("collectAll").disabled = !total;
    $("collectAll").textContent = total ? T("一键收取 ×{0}", total) : T("一键收取");
  }
  $("collectAll").addEventListener("click", () => {
    let n = 0; [...S.fields, ...S.pens].forEach(p => n += collectPlot(p));
    if (n) { save(); toast(T("收取了 {0} 份食材，已放进仓库", n)); renderAll(); }
  });
  $("tab-farm").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t || t.disabled) return;
    const kind = t.dataset.kind;
    if (t.dataset.assign) {
      const p = S[kind][+t.dataset.idx], f = FARM[t.dataset.assign];
      if (p.item) collectPlot(p);
      p.item = f.id; p.last = Date.now(); save();
      toast(`${f.emoji} ` + (f.type === "crop" ? T("开始种{0}，会一直产出{1}", f.name, ING[f.produces].name) : T("开始养{0}，会一直产出{1}", f.name, ING[f.produces].name))); renderAll();
    }
    if (t.dataset.collect !== undefined) {
      const p = S[kind][+t.dataset.collect], prod = ING[FARM[p.item].produces], n = collectPlot(p);
      if (n) { save(); toast(`${T("收取")} ${prod.emoji} ${prod.name} ×${n}`); renderAll(); }
    }
    if (t.dataset.upgrade !== undefined) {
      const p = S[kind][+t.dataset.upgrade], cost = FM.upgradeCosts[p.level - 1];
      if (cost !== undefined && spend(cost)) {
        if (p.item) collectPlot(p);
        p.level++; if (p.item) p.last = Date.now(); save();
        toast(T("升到 Lv.{0}！产得更快、能攒更多", p.level)); renderAll();
      }
    }
  });

  // ---------- 厨房 ----------
  // 锅里放食材 + 选一个做法 → 加工品或料理（都要自己猜）
  const known = r => r.isProc ? S.processed.includes(r.id) : S.dishes.includes(r.id);
  const methodText = id => `${METHOD[id].emoji}${METHOD[id].name}`;
  function recipeText(r) { return r.ingredients.map(x => `${ING[x].emoji}${ING[x].name}`).join(" + ") + ` · ${methodText(r.method)}`; }
  function available(id) { return (S.inventory[id] || 0) - pot.filter(x => x === id).length; }
  function renderMethods() {
    $("methods").innerHTML = D.methods.map(m => {
      const ok = DEV() || S.methods.includes(m.id);
      return `<button class="method ${method === m.id ? "on" : ""} ${ok ? "" : "locked"}" data-method="${m.id}" ${ok ? "" : `title="${T("去商店街的五金店解锁")}"`}>
        <span>${ok ? m.emoji : "🔒"}</span>${m.name}</button>`;
    }).join("");
  }
  $("methods").addEventListener("click", e => {
    const b = e.target.closest("[data-method]"); if (!b) return;
    if (!DEV() && !S.methods.includes(b.dataset.method)) { toast(T("“{0}”还没解锁，去商店街的五金店看看吧", METHOD[b.dataset.method].name)); return; }
    method = method === b.dataset.method ? null : b.dataset.method; renderMethods();
  });
  function renderKitchen() {
    renderMethods();
    const owned = D.ingredients.filter(i => (S.inventory[i.id] || 0) > 0);
    const bagItem = i => {
      const n = available(i.id);
      return `<div class="ing ${n <= 0 ? "empty" : ""} ${i.kind}" draggable="${n > 0}" data-add="${i.id}">
        <span class="c">×${n}</span>${ingArt(i.id, "m")}<div class="n">${i.name}</div></div>`;
    };
    $("bag").innerHTML = owned.length
      ? D.categories.map(c => {
          const list = owned.filter(i => i.category === c.id);
          return list.length ? `<div class="bag-label">${c.emoji} ${c.name}</div>${list.map(bagItem).join("")}` : "";
        }).join("")
      : `<p class="sub">${T("背包空空的，去地图上的集市进货，或者去农场收取吧。")}</p>`;
    $("potItems").innerHTML = pot.map((id, idx) =>
      `<div class="ing" data-remove="${idx}" title="${T("点击拿出")}">${ingArt(id, "s")}<div class="n">${ING[id].name}</div></div>`).join("");
    $("potMethod").textContent = method ? `${T("做法：")}${methodText(method)}` : T("还没选做法");
    renderQuickCook();
  }
  const canMake = r => { const need = {}; r.ingredients.forEach(x => { need[x] = (need[x] || 0) + 1; }); return Math.min(...Object.entries(need).map(([x, c]) => Math.floor((S.inventory[x] || 0) / c))); };
  function renderQuickCook() {
    const list = RECIPES.filter(known);
    const card = r => {
      const n = canMake(r);
      const out = r.isProc ? T("得到 {0}×{1} · 仓库 {2}", r.emoji, r.yield, S.inventory[r.id] || 0) : T("库存 {0} 份 · 🪙{1} · Lv.{2}", S.dishStock[r.id] || 0, priceOf(r), masteryLv(r.id));
      return `<div class="card">${r.isProc ? ingArt(r.id, "m") : dishArt(r, "m")}
        <div class="name">${r.name}</div>
        <div class="meta">${r.ingredients.map(x => `<span class="${(S.inventory[x] || 0) ? "" : "missing"}">${ING[x].emoji}${S.inventory[x] || 0}</span>`).join(" ")} · ${methodText(r.method)}</div>
        <div class="meta">${out}</div>
        <div class="row">
          <button data-make="${r.id}" data-n="1" ${n < 1 ? "disabled" : ""}>${T("做 1 次")}</button>
          <button class="ghost" data-make="${r.id}" data-n="${n}" ${n < 2 ? "disabled" : ""}>${T("全做")}${n > 1 ? " ×" + n : ""}</button>
        </div></div>`;
    };
    const procs = list.filter(r => r.isProc), dishes = list.filter(r => !r.isProc);
    $("quickCook").innerHTML = list.length
      ? `${procs.length ? `<div class="bag-label wide">${T("加工品")}</div>${procs.map(card).join("")}` : ""}
         ${dishes.length ? `<div class="bag-label wide">${T("料理")}</div>${dishes.map(card).join("")}` : ""}`
      : `<p class="sub">${T("还没有研发出任何东西。先在锅里试试看吧！")}</p>`;
  }
  // 做 n 次：加工品进背包（每次产 yield 份），料理进成菜库存
  function make(r, n) {
    n = Math.min(n, canMake(r)); if (n < 1) return 0;
    r.ingredients.forEach(x => S.inventory[x] -= n);
    if (r.isProc) addIng(r.id, n * r.yield);
    else { S.dishStock[r.id] = (S.dishStock[r.id] || 0) + n; gainMastery(r.id, n); }
    if (!S.methodsUsed.includes(r.method)) S.methodsUsed.push(r.method);
    return n;
  }
  $("quickCook").addEventListener("click", e => {
    const id = e.target.dataset.make; if (!id) return;
    const r = RECIPES.find(x => x.id === id), n = make(r, +e.target.dataset.n);
    if (n) {
      save();
      toast(r.isProc ? T("加工好了 {0} {1} ×{2}", r.emoji, r.name, n * r.yield) : T("做好了 {0} {1} ×{2}，去店铺上架吧", r.emoji, r.name, n));
      renderAll();
    }
  });
  function addToPot(id) {
    if (available(id) <= 0) return;
    pot.push(id); $("cookMsg").textContent = ""; renderKitchen();
  }
  $("bag").addEventListener("click", e => { const el = e.target.closest("[data-add]"); if (el) addToPot(el.dataset.add); });
  $("bag").addEventListener("dragstart", e => { const el = e.target.closest("[data-add]"); if (el) e.dataTransfer.setData("text/plain", el.dataset.add); });
  const potEl = $("pot");
  potEl.addEventListener("dragover", e => { e.preventDefault(); potEl.classList.add("over"); });
  potEl.addEventListener("dragleave", () => potEl.classList.remove("over"));
  potEl.addEventListener("drop", e => {
    e.preventDefault(); potEl.classList.remove("over");
    const id = e.dataTransfer.getData("text/plain"); if (ING[id]) addToPot(id);
  });
  $("potItems").addEventListener("click", e => {
    const el = e.target.closest("[data-remove]"); if (el) { pot.splice(+el.dataset.remove, 1); renderKitchen(); }
  });
  $("clearPot").addEventListener("click", () => { pot = []; $("cookMsg").textContent = ""; renderKitchen(); });

  const key = arr => [...arr].sort().join("|");
  $("cookBtn").addEventListener("click", () => {
    const msg = $("cookMsg");
    if (!pot.length) { msg.textContent = T("锅里还是空的呢～"); return; }
    if (!method) { msg.textContent = T("先在锅边选一个做法吧"); return; }
    const set = new Set(pot);
    const back = () => { pot = []; renderKitchen(); };
    const sameIngs = RECIPES.filter(r => key(r.ingredients) === key(pot));
    const match = sameIngs.find(r => r.method === method && (r.isProc || hasBook(r.id)));
    const needBook = sameIngs.find(r => r.method === method && !r.isProc && !hasBook(r.id));
    if (needBook) {
      msg.textContent = T("这道菜好像记在《{0}》里……去商店街的书店买下这本食谱书再来研发吧。（食材已退回）", bookOf(needBook.id).name);
      return back();
    }
    if (!match) {   // 零惩罚：食材原样退回，只给温馨提示
      let tip = T("这个组合好像不太对劲……食材已经退回背包，换个搭配试试吧。");
      const close = RECIPES.find(r => r.ingredients.every(x => set.has(x)) || [...set].every(x => r.ingredients.includes(x)));
      if (sameIngs.length) tip = T("食材对了！但“{0}”好像不是正确的做法……（食材已退回）", METHOD[method].name);
      else if (close && [...set].every(x => close.ingredients.includes(x))) tip = T("闻起来有点意思！好像还少了点什么。（食材已退回）");
      else if (close) tip = T("味道有点杂，也许有的食材是多余的？（食材已退回）");
      msg.textContent = tip; return back();
    }
    pot = [];
    make(match, 1);
    if (known(match)) {
      save();
      msg.textContent = match.isProc ? T("加工好了 {0} ×{1}，已放进背包。", match.name, match.yield) : T("做好了一份「{0}」，去店铺上架吧！", match.name);
      renderAll(); return;
    }
    msg.textContent = "";
    if (match.isProc) {
      S.processed.push(match.id); save();
      showModal(`${ingArt(match.id, "xl")}
        <h2>${T("新加工品：{0}！", match.name)}</h2>
        <p>${match.desc}</p>
        <p>${T("得到 {0} {1} ×{2}，已放进背包。", match.emoji, match.name, match.yield)}<br>${T("配方：{0}", recipeText(match))}</p>
        <button class="primary" data-close>${T("收入食材图鉴")}</button>`);
    } else {
      S.dishes.push(match.id); save();
      lastUnlocked = match.id;
      showModal(`${dishArt(match, "xl")}
        <h2>${T("研发成功：{0}！", match.name)}</h2>
        <p>${match.story}</p>
        <p>${T("已做好 1 份，可以拿去店铺卖 <b style=\"color:var(--accent-2)\">🪙{0}</b> / 份。", priceOf(match))}<br>${T("以后在厨房“已会做的”里可以一键出餐。")}</p>
        <button class="primary" data-close>${T("收入图鉴")}</button>`);
    }
    renderAll();
  });

  // ---------- 店铺 ----------
  function renderShop() {
    const iv = sellIntervalMs(), now = Date.now();
    const bp = bonus("sellPrice"), bs = bonus("sellSpeed");
    $("shopBonus").innerHTML = T("每个货架约 {0} 秒卖出一份", (iv / 1000).toFixed(1)) + (bp ? " " + T("· 卖价 +{0}", pct(bp)) : "") + (bs ? " " + T("· 顾客速度 +{0}", pct(bs)) : "") + " " + T("· 累计卖出 {0} 份", S.sold);
    const stocked = D.dishes.filter(d => (S.dishStock[d.id] || 0) > 0);
    $("shelves").innerHTML = S.shelves.map((sh, idx) => {
      if (!sh.dish) {
        return `<div class="card shelf empty-shelf">${emoArt("🧺", "l", "shelf" + idx)}
          <div class="name">${T("空货架 {0}", idx + 1)}</div>
          <div class="row col">${stocked.length ? stocked.map(d =>
            `<button data-stock="${d.id}" data-idx="${idx}">${T("摆上 {0}{1}（{2}）", d.emoji, d.name, S.dishStock[d.id])}</button>`).join("")
            : `<span class="meta">${T("没有成菜可以上架，先去厨房做菜吧")}</span>`}</div></div>`;
      }
      const d = DISH[sh.dish], stock = S.dishStock[d.id] || 0;
      const prog = sh.count > 0 ? Math.min(1, (now - sh.last) / iv) : 0;
      return `<div class="card shelf ${sh.count ? "" : "sold-out"}">${dishArt(d, "l")}
        <div class="name">${d.name}</div>
        <div class="meta">${sh.count ? T("在售 {0}/{1} 份 · 🪙{2}/份", sh.count, SH.shelfCapacity, priceOf(d)) : T("已售罄！")}</div>
        <div class="bar"><i style="width:${prog * 100}%"></i></div>
        <div class="meta">${sh.count ? T("下一位顾客 {0}", fmtTime((iv - (now - sh.last)) / 1000)) : T("库存还有 {0} 份", stock)}</div>
        <div class="row">
          <button data-restock="${idx}" ${!stock || sh.count >= SH.shelfCapacity ? "disabled" : ""}>${T("补货")}</button>
          <button class="ghost" data-unstock="${idx}">${T("撤下")}</button>
        </div></div>`;
    }).join("");
    $("shelfExpand").innerHTML = S.shelfCount - SH.startShelves < SH.expandCosts.length
      ? `<button class="ghost" data-goshop="hardware">${T("🔨 想要更多货架？去商店街的五金店扩建")}</button>`
      : `<span class="sub">${T("货架已经扩建到最大啦")}</span>`;
  }
  function stockShelf(sh, dishId) {
    const room = SH.shelfCapacity - (sh.dish === dishId ? sh.count : 0), n = Math.min(room, S.dishStock[dishId] || 0);
    if (n <= 0) return 0;
    if (sh.count === 0 || sh.dish !== dishId) { sh.last = Date.now(); sh.count = 0; }
    sh.dish = dishId; sh.count += n; S.dishStock[dishId] -= n;
    return n;
  }
  $("tab-shop").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.stock) {
      const n = stockShelf(S.shelves[+t.dataset.idx], t.dataset.stock);
      if (n) { save(); toast(T("上架了 {0} ×{1}", DISH[t.dataset.stock].name, n)); renderAll(); }
    }
    if (t.dataset.restock !== undefined) {
      const sh = S.shelves[+t.dataset.restock], n = stockShelf(sh, sh.dish);
      if (n) { save(); toast(T("补货 ×{0}", n)); renderAll(); }
    }
    if (t.dataset.unstock !== undefined) {
      const sh = S.shelves[+t.dataset.unstock];
      S.dishStock[sh.dish] = (S.dishStock[sh.dish] || 0) + sh.count;
      sh.dish = null; sh.count = 0; save(); renderAll();
    }
  });

  // ---------- 地图 ----------
  // ---------- 世界地图：缩放 + 拖动 ----------
  const MAP_FULL = { x: 6, y: 0, w: 356, h: 132 };
  let mapView = { ...MAP_FULL };
  const MIN_W = 40;
  function clampView(v) {
    v.w = Math.max(MIN_W, Math.min(MAP_FULL.w, v.w)); v.h = v.w * MAP_FULL.h / MAP_FULL.w;
    v.x = Math.max(MAP_FULL.x, Math.min(MAP_FULL.x + MAP_FULL.w - v.w, v.x));
    v.y = Math.max(MAP_FULL.y, Math.min(MAP_FULL.y + MAP_FULL.h - v.h, v.y));
    return v;
  }
  function applyView() {
    const svg = $("worldMap").querySelector("svg"); if (!svg) return;
    svg.setAttribute("viewBox", `${mapView.x} ${mapView.y} ${mapView.w} ${mapView.h}`);
    const k = Math.max(0.35, mapView.w / MAP_FULL.w);   // 放大时图钉和城市名保持差不多大小
    svg.querySelectorAll(".pin").forEach(g => g.setAttribute("transform", `translate(${g.dataset.x},${g.dataset.y}) scale(${k})`));
    svg.querySelectorAll(".route").forEach(r => r.style.strokeWidth = 0.9 * k);
    $("mapZoomLabel").textContent = Math.round(MAP_FULL.w / mapView.w * 100) + "%";
    $("mapPopup").classList.add("hidden");
  }
  // 以地图上某点（0–1 的相对位置）为中心缩放
  function zoomAt(factor, fx = 0.5, fy = 0.5) {
    const nw = Math.max(MIN_W, Math.min(MAP_FULL.w, mapView.w / factor));
    const px = mapView.x + mapView.w * fx, py = mapView.y + mapView.h * fy;
    const nh = nw * MAP_FULL.h / MAP_FULL.w;
    mapView = clampView({ x: px - nw * fx, y: py - nh * fy, w: nw, h: nh });
    applyView();
  }
  (function setupMapControls() {
    const box = $("worldMap");
    const rel = (cx, cy) => { const r = box.getBoundingClientRect(); return [(cx - r.left) / r.width, (cy - r.top) / r.height]; };
    box.addEventListener("wheel", e => {
      e.preventDefault();
      const [fx, fy] = rel(e.clientX, e.clientY);
      zoomAt(e.deltaY < 0 ? 1.25 : 0.8, fx, fy);
    }, { passive: false });
    let drag = null, moved = false;
    const pointers = new Map();
    let pinch = null;
    box.addEventListener("pointerdown", e => {
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), w: mapView.w };
        drag = null; return;
      }
      drag = { x: e.clientX, y: e.clientY, vx: mapView.x, vy: mapView.y }; moved = false;
    });
    window.addEventListener("pointermove", e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const [fx, fy] = rel((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        zoomAt((mapView.w / pinch.w) * (d / pinch.d), fx, fy); moved = true; return;
      }
      if (!drag) return;
      const r = box.getBoundingClientRect();
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; box.classList.add("dragging"); }
      mapView = clampView({ ...mapView, x: drag.vx - dx / r.width * mapView.w, y: drag.vy - dy / r.height * mapView.h });
      applyView();
    });
    const end = e => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; if (!pointers.size) { drag = null; box.classList.remove("dragging"); } };
    window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
    // 拖动后松手不算点击
    box.addEventListener("click", e => { if (moved) { e.stopPropagation(); moved = false; } }, true);
    $("mapZoomIn").addEventListener("click", () => zoomAt(1.5));
    $("mapZoomOut").addEventListener("click", () => zoomAt(1 / 1.5));
    $("mapZoomReset").addEventListener("click", () => { mapView = { ...MAP_FULL }; applyView(); });
  })();
  function renderWorld() {
    $("worldMap").innerHTML = WorldMap.render(
      D.cities.map(c => ({ ...c, open: S.cities.includes(c.id) })), D.config.startCity);
    applyView();
  }
  function cityProgress(id) {
    const total = D.dishes.filter(d => d.city === id).length;
    const done = D.dishes.filter(d => d.city === id && S.dishes.includes(d.id)).length;
    return T("图鉴 {0}/{1}", done, total);
  }
  function openPopup(id, evt) {
    const c = CITY[id], open = S.cities.includes(id);
    const pop = $("mapPopup"), wrap = pop.parentElement.getBoundingClientRect();
    const pin = evt.target.closest(".pin").getBoundingClientRect();
    pop.style.left = (pin.left + pin.width / 2 - wrap.left) + "px";
    pop.style.top = (pin.top - wrap.top + 8) + "px";
    pop.innerHTML = `<button class="x" data-closepop>×</button>
      <div class="name">${open ? c.emoji : "🔒"} ${c.name}</div>
      <div class="meta">${c.desc}<br>${open ? cityProgress(id) : T("开通需要 🪙 {0}", fmt(c.unlockCost))}</div>
      ${open ? `<button data-go="${id}">${T("逛商店街")}</button>`
             : `<button data-unlock="${id}" ${G() < c.unlockCost ? "disabled" : ""}>${T("开通航线")}</button>`}`;
    pop.classList.remove("hidden");
  }
  $("worldMap").addEventListener("click", e => {
    const pin = e.target.closest(".pin");
    if (pin) openPopup(pin.dataset.city, e); else $("mapPopup").classList.add("hidden");
  });
  $("mapPopup").addEventListener("click", e => {
    if (e.target.hasAttribute("data-closepop")) { $("mapPopup").classList.add("hidden"); return; }
    handleCityAction(e);
  });
  function renderMap() {
    $("cityList").innerHTML = D.cities.map(c => {
      const open = S.cities.includes(c.id);
      return `<div class="card taped ${open ? "" : "locked"}">
        ${open ? emoArt(c.emoji, "xl", c.id) : lockArt("xl")}
        <div class="name">${c.name}</div>
        <div class="meta">${c.desc}</div>
        <div class="meta">${open ? cityProgress(c.id) : T("开通需要 🪙 {0}", fmt(c.unlockCost))}</div>
        <div class="row">${open ? `<button data-go="${c.id}">${T("逛商店街")}</button>`
          : `<button data-unlock="${c.id}" ${G() < c.unlockCost ? "disabled" : ""}>${T("开通航线")}</button>`}</div>
      </div>`;
    }).join("");
  }
  $("cityList").addEventListener("click", handleCityAction);
  function handleCityAction(e) {
    const go = e.target.dataset.go, un = e.target.dataset.unlock;
    if (go) { streetTab = "food"; switchTab("market"); }
    if (un && spend(CITY[un].unlockCost)) {
      S.cities.push(un); save();
      const farmNew = D.farm.items.filter(f => f.city === un).map(f => f.emoji + f.name).join("、");
      showModal(`<div class="big">✈️</div><h2>${T("{0}航线已开通！", CITY[un].name)}</h2>
        <p>${CITY[un].desc}<br>${T("去当地集市看看有什么新食材吧。")}${farmNew ? `<br>${T("农场也可以养/种 {0} 啦。", farmNew)}` : ""}</p>
        <button class="primary" data-close>${T("出发")}</button>`);
      streetTab = "food"; switchTab("market");
    }
  }

  // ---------- 商店街：食品街 / 书店 / 五金店 ----------
  const priceOfIng = i => i.price || D.config.todoPrice;
  // 食品街：正常模式卖“已开通城市的、已启用的原材料”；开发者模式什么都卖
  const buyableIngs = () => DEV() ? D.ingredients : RAW.filter(i => S.cities.includes(i.city));
  function renderStreet() {
    document.querySelectorAll("#streetTabs button").forEach(b => b.classList.toggle("active", b.dataset.street === streetTab));
    document.querySelectorAll(".street-sub").forEach(el => el.classList.toggle("hidden", el.id !== "street-" + streetTab));
    if (streetTab === "food") renderFoodStreet();
    if (streetTab === "books") renderBookstore();
    if (streetTab === "hardware") renderHardware();
  }
  function renderFoodStreet() {
    const list = buyableIngs();
    $("foodStreet").innerHTML = D.categories.map(c => {
      const items = list.filter(i => i.category === c.id);
      if (!items.length) return "";
      return `<div class="bag-label wide cat-head">${c.emoji} ${c.name}</div>` + items.map(i => {
        const pr = priceOfIng(i);
        return `<div class="card ${i.todo ? "todo" : ""}">${ingArt(i.id, "l")}
          <div class="name">${i.name}</div>
          <div class="meta">${i.city ? `${CITY[i.city].emoji} ${CITY[i.city].name} · ` : ""}🪙 ${pr} ${T("/ 份")}${i.todo ? T("（临时价）") : ""}</div>
          <div class="meta">${T("仓库")} ${S.inventory[i.id] || 0}</div>
          <div class="row">
            <button data-buy="${i.id}" data-n="1" ${G() < pr ? "disabled" : ""}>${T("买 1")}</button>
            <button class="ghost" data-buy="${i.id}" data-n="10" ${G() < pr * 10 ? "disabled" : ""}>${T("买 10")}</button>
          </div></div>`;
      }).join("");
    }).join("") || `<p class="sub">${T("还没有可买的食材。")}</p>`;
  }
  function renderBookstore() {
    // 书店只卖书：小卡片一行放好几本，不显示书里有哪些菜（买了以后去“我的家 → 已解锁料理”看）
    $("bookstore").innerHTML = D.books.map(b => {
      const own = S.books.includes(b.id);
      return `<div class="card book-mini ${own ? "" : "locked"}">${emoArt(b.emoji, "m", "book-" + b.id)}
        <div class="name">《${b.name}》</div>
        <div class="meta">${b.desc}</div>
        <div class="meta">${T("共 {0} 道菜", b.dishes.length)}</div>
        <div class="row">${own ? `<span class="meta">${T("✔ 已拥有")}</span>`
          : `<button data-book="${b.id}" ${G() < b.price ? "disabled" : ""}>${T("购买 🪙{0}", fmt(b.price))}</button>`}</div></div>`;
    }).join("");
  }
  function renderHardware() {
    const methods = D.methods.filter(m => m.unlockCost).map(m => {
      const own = S.methods.includes(m.id);
      return `<div class="card">${emoArt(m.emoji, "l", "m-" + m.id)}
        <div class="name">${m.name}</div><div class="meta">${T("新的食材制作方式")}</div>
        <div class="row">${own ? `<span class="meta">${T("✔ 已解锁")}</span>`
          : `<button data-method-buy="${m.id}" ${G() < m.unlockCost ? "disabled" : ""}>🪙 ${fmt(m.unlockCost)}</button>`}</div></div>`;
    }).join("");
    const plotCard = (k, label, emoji) => {
      const costs = k === "fields" ? FM.fieldExpandCosts : FM.penExpandCosts;
      const extra = S[k].length - (k === "fields" ? FM.fieldPlots : FM.pens);
      return `<div class="card">${emoArt(emoji, "l", "hw-" + k)}
        <div class="name">${T("新{0}", label)}</div><div class="meta">${T("现有 {0} 块", S[k].length)}</div>
        <div class="row">${extra < costs.length
          ? `<button data-expand="${k}" ${G() < costs[extra] ? "disabled" : ""}>🪙 ${fmt(costs[extra])}</button>`
          : `<span class="meta">${T("已到上限")}</span>`}</div></div>`;
    };
    const extraShelf = S.shelfCount - SH.startShelves;
    const shelf = `<div class="card">${emoArt("🧺", "l", "hw-shelf")}
      <div class="name">${T("新货架")}</div><div class="meta">${T("现有 {0} 个", S.shelfCount)}</div>
      <div class="row">${extraShelf < SH.expandCosts.length
        ? `<button data-shelf-buy="1" ${G() < SH.expandCosts[extraShelf] ? "disabled" : ""}>🪙 ${fmt(SH.expandCosts[extraShelf])}</button>`
        : `<span class="meta">${T("已到上限")}</span>`}</div></div>`;
    $("hardware").innerHTML = `<div class="bag-label wide cat-head">${T("🍳 新食材制作方式")}</div>${methods}
      <div class="bag-label wide cat-head">${T("🌾 新农场")}</div>${plotCard("fields", T("菜地"), "🟫")}${plotCard("pens", T("畜栏"), "🛖")}
      <div class="bag-label wide cat-head">${T("🏪 新店（货架）")}</div>${shelf}`;
  }
  $("streetTabs").addEventListener("click", e => {
    const b = e.target.closest("[data-street]"); if (!b) return;
    streetTab = b.dataset.street; renderStreet();
  });
  function expandPlot(k) {
    const costs = k === "fields" ? FM.fieldExpandCosts : FM.penExpandCosts;
    const extra = S[k].length - (k === "fields" ? FM.fieldPlots : FM.pens);
    if (extra >= costs.length || !spend(costs[extra])) return;
    if (k === "fields") S.fieldCount++; else S.penCount++;
    normalize(); save(); toast(T("农场多了一块{0}！", k === "fields" ? T("菜地") : T("畜栏"))); renderAll();
  }
  $("tab-market").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t || t.disabled) return;
    const id = t.dataset.buy;
    if (id) {
      const n = +t.dataset.n, i = ING[id];
      if (spend(priceOfIng(i) * n)) { addIng(id, n); S.stats.bought += n; save(); toast(`${T("买到了")} ${i.emoji} ${i.name} ×${n}`); renderAll(); }
    }
    if (t.dataset.book) {
      const b = BOOK[t.dataset.book];
      if (spend(b.price)) {
        S.books.push(b.id); save();
        showModal(`<div class="big">${b.emoji}</div><h2>${T("买下了《{0}》！", b.name)}</h2>
          <p>${b.desc}<br>${T("书里的 {0} 道菜已经记进“我的家 → 料理图鉴”，看着提示去厨房研发吧。", b.dishes.length)}</p>
          <button class="primary" data-close>${T("翻开看看")}</button>`);
        renderAll();
      }
    }
    if (t.dataset.methodBuy) {
      const m = METHOD[t.dataset.methodBuy];
      if (spend(m.unlockCost)) { S.methods.push(m.id); save(); toast(`${T("解锁了新做法：")}${m.emoji} ${m.name}`); renderAll(); }
    }
    if (t.dataset.expand) expandPlot(t.dataset.expand);
    if (t.dataset.shelfBuy) {
      const cost = SH.expandCosts[S.shelfCount - SH.startShelves];
      if (cost !== undefined && spend(cost)) { S.shelfCount++; normalize(); save(); toast(T("小店多了一个货架！")); renderAll(); }
    }
  });
  // 农场 / 店铺里的“去五金店”按钮
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-goshop]"); if (!b) return;
    streetTab = b.dataset.goshop; switchTab("market");
  });

  // ---------- 成就 ----------
  const ACAT = D.achievementCategories;
  function achProgress(a) {
    switch (a.type) {
      case "dishes": return S.dishes.filter(id => DISH[id]).length;
      case "bought": return S.stats.bought;
      case "methodUsed": return S.methodsUsed.includes(a.method) ? 1 : 0;
      case "methodsUnlocked": return S.methods.length;
      case "masteryLv": return Math.max(1, ...Object.keys(S.mastery).filter(id => DISH[id]).map(masteryLv));
      case "cooked": return S.stats.cooked;
    }
    return 0;
  }
  function checkAchievements() {
    let got = 0;
    D.achievements.forEach(a => {
      if (S.achievements.includes(a.id) || achProgress(a) < a.target) return;
      S.achievements.push(a.id); S.gold += a.reward; got++;
      setTimeout(() => toast(T("🏆 达成成就「{0}」！奖励 🪙{1}", a.name, a.reward)), 300 + got * 1900);
    });
    if (got) { save(); renderTop(); }
  }
  function renderAchievements() {
    const done = S.achievements.length, total = D.achievements.length;
    $("achList").innerHTML = `<div class="dex-total wide">${T("已达成 <b>{0}</b> / {1} 个成就", done, total)}</div>` + ACAT.map(c => {
      const list = D.achievements.filter(a => a.cat === c.id);
      const n = list.filter(a => S.achievements.includes(a.id)).length;
      return `<div class="bag-label wide cat-head">${c.emoji} ${c.name} <small>${n}/${list.length}</small></div>` + list.map(a => {
        const ok = S.achievements.includes(a.id), v = Math.min(achProgress(a), a.target);
        return `<div class="card ach ${ok ? "done" : "locked"}">
          <div class="ach-icon">${ok ? "🏆" : c.emoji}</div>
          <div class="name">${a.name}</div>
          <div class="meta">${a.desc}</div>
          <div class="bar"><i style="width:${v / a.target * 100}%"></i></div>
          <div class="meta">${ok ? T("✔ 已达成") : `${v} / ${a.target}`} · 🪙${a.reward}</div>
        </div>`;
      }).join("");
    }).join("");
  }

  // ---------- 厨房：查看食谱书（可搜索，可一键放进锅里） ----------
  let bookQuery = "";
  function openBookViewer() { $("bookViewer").classList.remove("hidden"); $("bookSearch").value = bookQuery; renderBookViewer(); $("bookSearch").focus(); }
  function renderBookViewer() {
    const q = bookQuery.trim().toLowerCase();
    const books = D.books.filter(b => DEV() || S.books.includes(b.id));
    let html = books.map(b => {
      const list = b.dishes.map(id => DISH[id]).filter(d => !q || [d.name, METHOD[d.method].name, placeOf(d).name, ...d.ingredients.map(x => ING[x].name)].join(" ").toLowerCase().includes(q));
      if (!list.length) return "";
      return `<div class="bv-book">${b.emoji} 《${b.name}》</div>` + list.map(d => {
        const got = S.dishes.includes(d.id), mOk = DEV() || S.methods.includes(d.method);
        const ings = d.ingredients.map(x => `<span class="${(S.inventory[x] || 0) ? "" : "missing"}">${ING[x].emoji}${ING[x].name}</span>`).join(" + ");
        return `<div class="bv-row">
          ${dishArt(d, "s")}
          <div class="bv-main"><b>${d.name}</b> ${got ? `<small>✔ Lv.${masteryLv(d.id)}</small>` : `<small>${T("未研发")}</small>`}<br>
            <span class="bv-ings">${ings} · ${METHOD[d.method].emoji}${METHOD[d.method].name}${mOk ? "" : " 🔒"}</span></div>
          <button class="ghost" data-fill="${d.id}">${T("放进锅里")}</button>
        </div>`;
      }).join("");
    }).join("");
    if (!books.length) html = `<p class="sub">${T("还没有食谱书，去商店街的书店看看吧。")}</p>`;
    else if (!html) html = `<p class="sub">${T("没有找到和“{0}”有关的食谱。", bookQuery)}</p>`;
    $("bookViewerList").innerHTML = html;
  }
  $("openBooks").addEventListener("click", openBookViewer);
  $("bookSearch").addEventListener("input", debounce(e => { bookQuery = e.target.value; renderBookViewer(); }));
  $("bookViewer").addEventListener("click", e => {
    if (e.target.id === "bookViewer" || e.target.hasAttribute("data-closebv")) { $("bookViewer").classList.add("hidden"); return; }
    const b = e.target.closest("[data-fill]"); if (!b) return;
    const d = DISH[b.dataset.fill];
    pot = []; const missing = [];
    d.ingredients.forEach(x => { if (available(x) > 0) pot.push(x); else if (!missing.includes(ING[x].name)) missing.push(ING[x].name); });
    if (DEV() || S.methods.includes(d.method)) method = d.method;
    $("bookViewer").classList.add("hidden");
    renderKitchen();
    $("cookMsg").textContent = missing.length ? T("还缺：{0}。先去商店街或农场弄来吧。", missing.join("、")) : T("「{0}」的食材已经放好，点“下锅！”吧。", d.name);
  });

  // ---------- 渲染与主循环 ----------
  function renderTop() {
    $("gold").textContent = DEV() ? "∞" : fmt(S.gold);
    $("onShelf").textContent = S.shelves.reduce((s, sh) => s + (sh.dish ? sh.count : 0), 0);
  }
  function renderAll() {
    renderTop();
    if (currentTab === "home") renderHome();
    if (currentTab === "farm") renderFarm();
    if (currentTab === "kitchen") renderKitchen();
    if (currentTab === "shop") renderShop();
    if (currentTab === "map") { renderWorld(); renderMap(); }
    if (currentTab === "market") renderStreet();
    if (currentTab === "settings") renderSettings();
  }

  let shopAcc = 0, uiAcc = 0, saveAcc = 0, last = performance.now();
  function tick(now) {
    const dt = Math.min((now - last) / 1000, 1); last = now;
    shopAcc += dt; uiAcc += dt; saveAcc += dt;
    if (shopAcc > 0.25) {
      shopAcc = 0;
      const r = processShop(Date.now());
      if (r.sold) {
        renderTop();
        const c = $("shelfStat"); c.classList.remove("ping"); void c.offsetWidth; c.classList.add("ping");
      }
    }
    if (uiAcc > 1) {          // 每秒刷新计时与按钮状态（厨房不刷新，避免打断拖拽）
      uiAcc = 0; renderTop(); checkAchievements();
      if (currentTab === "shop") renderShop();
      if (currentTab === "farm") renderFarm();
      if (currentTab === "market") renderStreet();
      if (currentTab === "map") renderMap();
      if (currentTab === "home" && homeSub === "furniture") renderFurniture();
    }
    if (saveAcc > 5) { saveAcc = 0; save(); }
  }
  window.addEventListener("beforeunload", save);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { save(); return; }
    last = performance.now(); shopAcc = 1; uiAcc = 2;     // 切回来：马上结算店铺、刷新界面
    tick(last); renderAll();
  });

  // 测试用：网址后加 ?debug，在“设置”里出现调试按钮
  if (location.search.includes("debug")) {
    $("debugRow").innerHTML = `<div class="setting-row"><span>${T("🧪 调试")}</span><span>
      <button class="ghost" id="dbgGold">${T("+5000 金币")}</button>
      <button class="ghost" id="dbgTime">${T("时间快进 5 分钟")}</button></span></div>`;
    $("dbgGold").onclick = () => { S.gold += 5000; renderAll(); };
    $("dbgTime").onclick = () => {
      const ms = 5 * 60 * 1000;
      S.shelves.forEach(sh => sh.last -= ms);
      [...S.fields, ...S.pens].forEach(p => { p.last -= ms; });
      processShop(Date.now()); save(); renderAll(); toast(T("时间快进了 5 分钟"));
    };
  }

  renderTitle();
  switchTab("home");
  preloadArt();
  setInterval(() => { if (!document.hidden) tick(performance.now()); }, 250);   // 页面不可见时不跑；店铺 / 农场按时间戳结算，不依赖帧率
})();
