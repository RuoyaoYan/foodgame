// 《吃》网页原型 —— 核心逻辑
// 循环：农场/集市拿食材 → 厨房猜配方研发、出餐 → 店铺货架自动卖菜赚金币 → 开通城市、买家具
(() => {
  const D = window.GAME_DATA;
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
  // 所有“锅里能做出来的东西”：加工品 + 菜品
  const RECIPES = [...PROC.map(i => ({ ...i, ingredients: i.inputs, isProc: true })), ...D.dishes];
  const FM = D.farm;
  const SH = D.shop;

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
      methods: D.methods.filter(m => !m.unlockCost).map(m => m.id),   // 已解锁的做法
      sold: 0,
      lastSeen: Date.now(),
    };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s.gold === "number") {
        const st = migrate(Object.assign(newState(), s), s);
        st.settings = Object.assign({ music: true, sfx: true, devView: false }, st.settings);
        return st;
      }
    } catch (e) {}
    return newState();
  }
  // 旧存档迁移：v0.4 之前的食材 id 合并/改名，旧农场格式清空
  function migrate(st, raw) {
    const RENAME = { minced_pork: "pork", pork_belly: "pork", tenderloin: "pork", tofu_skin: "tofu",
      pecorino: "cheese", cream_cheese: "cheese", raw_noodles: "noodles" };
    const DROP = ["sweet_paste"];
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
    st.recipes = (st.recipes || []).filter(k => DISH[k]);
    const base = D.methods.filter(m => !m.unlockCost).map(m => m.id);
    st.methods = [...new Set([...base, ...(st.methods || [])])].filter(k => D.methods.some(m => m.id === k));
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
  const priceOf = d => Math.round(d.sellPrice * (1 + bonus("sellPrice")));
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
  const fmt = n => Math.floor(n).toLocaleString("zh-CN");
  function fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return h ? `${h}小时${m}分` : m ? `${m}分${s}秒` : `${s}秒`;
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
  const G = () => DEV() ? Infinity : S.gold;
  function spend(n) {
    if (DEV()) return true;
    if (G() < n) { toast("金币不够哦，先去店铺卖点菜吧"); return false; }
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
  // 把图片放到 images/ingredients/<食材id>.png 或 images/dishes/<菜品id>.png 就会自动替换 emoji
  const WASH = ["#f4c3a6", "#c8dcae", "#b9d5e4", "#f3db97", "#eeb3ab", "#d3c5e6", "#f1cf9f", "#bfe0d2"];
  const artOK = {};
  function washOf(id) { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return WASH[h % WASH.length]; }
  const artSrc = (kind, id) => `images/${kind}/${id}.png`;
  function preloadArt() {
    [...D.ingredients.map(i => ["ingredients", i.id]), ...D.dishes.map(d => ["dishes", d.id])].forEach(([kind, id]) => {
      const img = new Image();
      img.onload = () => { artOK[kind + "/" + id] = true; renderAll(); };
      img.src = artSrc(kind, id);
    });
  }
  function art(kind, id, emoji, size = "m", washOverride) {
    const has = kind && artOK[kind + "/" + id];
    return `<span class="sticker ${size}" style="--wash:${washOverride || washOf(id)}">${has
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
    $("startBtn").textContent = started ? "继续旅程" : "开始旅程";
    $("newGameBtn").classList.toggle("hidden", !started);
    $("saveInfo").innerHTML = started
      ? `图鉴 ${S.dishes.length}/${D.dishes.length} · 已到过 ${S.cities.map(c => CITY[c].name).join("、")} · 🪙 ${fmt(S.gold)}`
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
        <h2>欢迎回来！</h2>
        <p>你离开了 ${fmtTime(m.away / 1000)}。<br>
        ${m.sold ? `小店卖出了 <b>${m.sold}</b> 份菜，赚了 <b>🪙 ${fmt(m.gold)}</b>。<br>` : ""}
        ${m.ready ? `农场攒了 <b>${m.ready}</b> 份食材等你收取。` : ""}</p>
        <button class="primary" data-close>好的</button>`), 450);
    }
    switchTab(currentTab);
  }
  $("startBtn").addEventListener("click", enterGame);
  $("newGameBtn").addEventListener("click", e => twoClick(e.target, "重新开始", "再点一次确认（会清空存档）", () => {
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
    if (homeSub === "dishes") renderJournal();
    if (homeSub === "ingredients") renderIngDex();
    if (homeSub === "storage") renderStorage();
    if (homeSub === "furniture") renderFurniture();
    if (homeSub === "settings") renderSettings();
  }
  function renderRoom() {
    const items = S.furniture.map(id => {
      const f = FURN[id];
      return `<div class="room-item" style="left:${f.x}%;top:${f.y}%" title="${f.name}">${emoArt(f.emoji, "l", f.id)}</div>`;
    }).join("");
    $("room").innerHTML = `<div class="room-wall"><div class="room-window">🌤️</div></div><div class="room-floor"></div>
      ${items}${S.furniture.length ? "" : `<div class="room-empty">房间空空的……去“家具”里挑几件吧</div>`}`;
  }
  function renderJournal() {
    $("journal").innerHTML = D.dishes.map(d => {
      const got = S.dishes.includes(d.id);
      const cityOpen = S.cities.includes(d.city);
      const recipe = S.recipes.includes(d.id) || got;
      return `<div class="card taped ${got ? "" : "locked"} ${d.id === lastUnlocked ? "flip" : ""}">
        ${cityOpen || got ? dishArt(d, "xl") : lockArt("xl")}
        <div class="name">${got || cityOpen ? d.name : "？？？"}</div>
        <div class="meta">${CITY[d.city].emoji} ${CITY[d.city].name} · 售价 🪙${priceOf(d)}</div>
        ${got ? `<div class="story">${d.story}</div>` :
          cityOpen ? `<div class="hint">${d.hint}</div>` : `<div class="meta">开通${CITY[d.city].name}航线后解锁</div>`}
        ${recipe && cityOpen ? `<div class="recipe">${recipeText(d)}</div>` : ""}
      </div>`;
    }).join("");
    lastUnlocked = null;
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
        body = `<div class="todo-badge">🚧 开发中</div>
          <div class="meta">${i.kind === "raw" ? "原本有的（来源、价格待定）" : "需要自己做的（配方待定）"}</div>
          ${show ? `<div class="story">${i.desc || ""}</div>${i.ref ? `<div class="recipe">${i.ref}</div>` : ""}` : ""}`;
      } else if (i.kind === "raw") {
        body = `<div class="meta">${CITY[i.city].emoji} ${CITY[i.city].name}${show ? ` · 集市 🪙${i.price}` : ""}</div>
          ${show ? `<div class="meta">用于：${uses.length ? uses.join("、") : "？"}</div>` : ""}`;
      } else {
        body = show ? `<div class="story">${i.desc}</div><div class="recipe">${recipeText({ ...i, ingredients: i.inputs })}</div>
                 <div class="meta">用于：${uses.length ? uses.join("、") : "？"}</div>`
              : `<div class="hint">${i.hint}</div>`;
      }
      return `<div class="card ${unlocked ? "" : "locked"} ${i.todo ? "todo" : ""}">
        ${show ? ingArt(i.id, "l") : lockArt("l")}
        <div class="name">${show ? i.name : "？？？"}</div>
        <div class="meta cat-tag">${CAT[i.category].emoji} ${CAT[i.category].name} · ${i.kind === "raw" ? "原材料" : "加工品"}</div>
        ${body}
      </div>`;
    };
    const cats = D.categories.filter(c => D.ingredients.some(i => i.category === c.id));
    const count = c => {
      const list = D.ingredients.filter(i => i.category === c.id);
      const got = list.filter(i => i.kind === "raw" ? S.seenIngs.includes(i.id) : S.processed.includes(i.id)).length;
      return `${got}/${list.length}`;
    };
    $("dexCats").innerHTML = `<button data-dexcat="all" class="${dexCat === "all" ? "active" : ""}">全部</button>` +
      cats.map(c => `<button data-dexcat="${c.id}" class="${dexCat === c.id ? "active" : ""}">${c.emoji} ${c.name} <small>${count(c)}</small></button>`).join("");
    const shown = dexCat === "all" ? cats : cats.filter(c => c.id === dexCat);
    $("ingDex").innerHTML = shown.map(c => {
      const list = D.ingredients.filter(i => i.category === c.id);
      const raw = list.filter(i => i.kind === "raw"), proc = list.filter(i => i.kind === "processed");
      return `<div class="bag-label wide cat-head">${c.emoji} ${c.name}</div>
        ${raw.length ? `<div class="bag-label wide sub-head">原本有的</div>${raw.map(card).join("")}` : ""}
        ${proc.length ? `<div class="bag-label wide sub-head">需要自己做的</div>${proc.map(card).join("")}` : ""}`;
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
      <div class="name">${d.name}</div><div class="meta">×${S.dishStock[d.id]} · 售价 🪙${priceOf(d)}</div></div>`).join("")
      : `<p class="sub">还没有做好的菜。</p>`;
    const is = D.ingredients.filter(i => (S.inventory[i.id] || 0) > 0);
    $("storageIngs").innerHTML = is.length ? is.map(i => `<div class="card">${ingArt(i.id, "m")}
      <div class="name">${i.name}</div><div class="meta">×${S.inventory[i.id]}</div></div>`).join("")
      : `<p class="sub">仓库里没有食材。</p>`;
  }
  const EFFECT_TEXT = { sellPrice: "卖价", sellSpeed: "顾客速度", farmSpeed: "农场生长" };
  function renderFurniture() {
    $("furnitureList").innerHTML = D.furniture.map(f => {
      const owned = S.furniture.includes(f.id);
      return `<div class="card">${emoArt(f.emoji, "l", f.id)}
        <div class="name">${f.name}</div>
        <div class="meta">${EFFECT_TEXT[f.effect]} +${pct(f.value)}</div>
        <div class="row">${owned ? `<span class="meta">✔ 已摆放</span>`
          : `<button data-furn="${f.id}" ${G() < f.price ? "disabled" : ""}>🪙 ${fmt(f.price)}</button>`}</div>
      </div>`;
    }).join("");
  }
  $("furnitureList").addEventListener("click", e => {
    const id = e.target.dataset.furn;
    if (id && spend(FURN[id].price)) {
      S.furniture.push(id); save();
      toast(`${FURN[id].emoji} ${FURN[id].name} 摆进家里啦！${EFFECT_TEXT[FURN[id].effect]} +${pct(FURN[id].value)}`);
      renderAll();
    }
  });
  function renderSettings() {
    document.querySelectorAll("[data-setting]").forEach(b => {
      const on = S.settings[b.dataset.setting];
      b.textContent = on ? "开" : "关"; b.classList.toggle("on", on);
    });
  }
  document.querySelectorAll("[data-setting]").forEach(b => b.addEventListener("click", () => {
    S.settings[b.dataset.setting] = !S.settings[b.dataset.setting]; save(); renderAll();
  }));
  $("toTitleBtn").addEventListener("click", toTitle);
  $("resetBtn").addEventListener("click", e => twoClick(e.target, "重置", "再点一次确认", () => {
    S = newState(); normalize(); pot = []; save(); renderAll(); renderTitle(); toast("存档已重置");
  }));

  // ---------- 农场（参考《洋果子店》：选一次，持续产出，可升级、扩建） ----------
  function renderPlots(kind) {
    const list = S[kind], type = kind === "fields" ? "crop" : "animal";
    const label = type === "crop" ? "菜地" : "畜栏";
    const now = Date.now();
    const options = D.farm.items.filter(f => f.type === type);
    let html = list.map((p, idx) => {
      const lvl = `<span class="lv">Lv.${p.level}</span>`;
      const upCost = FM.upgradeCosts[p.level - 1];
      const upBtn = upCost !== undefined
        ? `<button class="ghost" data-upgrade="${idx}" data-kind="${kind}" ${G() < upCost ? "disabled" : ""}>升级 🪙${fmt(upCost)}</button>`
        : `<span class="meta">已满级</span>`;
      const pick = options.map(f => {
        const open = S.cities.includes(f.city);
        return `<button class="${p.item === f.id ? "picked" : "ghost"}" data-assign="${f.id}" data-kind="${kind}" data-idx="${idx}"
          ${!open || p.item === f.id ? "disabled" : ""}>${f.emoji} ${f.name}${open ? "" : " 🔒" + CITY[f.city].name}</button>`;
      }).join("");
      if (!p.item) {
        return `<div class="card plot empty-plot">${lvl}${emoArt(type === "crop" ? "🟫" : "🛖", "l", kind + "e")}
          <div class="name">空${label}</div>
          <div class="meta">选一样来${type === "crop" ? "种" : "养"}，之后会一直产出</div>
          <div class="row col">${pick}</div>
          <div class="row">${upBtn}</div></div>`;
      }
      const f = FARM[p.item], iv = plotIv(p), cap = plotCap(p), n = plotStored(p, now);
      const full = n >= cap, prog = full ? 1 : ((now - p.last) % iv) / iv;
      const prod = ING[f.produces];
      return `<div class="card plot ${n ? "ready" : ""}">${lvl}
        ${emoArt(f.emoji, "l", f.id)}
        <div class="name">${f.name} → ${prod.emoji} ${prod.name}</div>
        <div class="stash">${n ? `${prod.emoji}`.repeat(Math.min(n, 8)) + (n > 8 ? "…" : "") : "<span class='meta'>还没有产出</span>"}</div>
        <div class="meta">已攒 <b>${n}</b> / ${cap} 份 · 每 ${fmtTime(iv / 1000)} 产 1 份</div>
        <div class="bar"><i style="width:${prog * 100}%"></i></div>
        <div class="meta">${full ? "满了！快收取，不然不会再长" : `下一份 ${fmtTime((iv - (now - p.last) % iv) / 1000)}`}</div>
        <div class="row">
          <button data-collect="${idx}" data-kind="${kind}" ${n ? "" : "disabled"}>收取${n ? " ×" + n : ""}</button>
          ${upBtn}
        </div>
        <details class="swap" data-swap="${kind}${idx}" ${openSwaps.has(kind + idx) ? "open" : ""}><summary>换${type === "crop" ? "种" : "养"}别的</summary><div class="row col">${pick}</div></details>
      </div>`;
    }).join("");
    const costs = kind === "fields" ? FM.fieldExpandCosts : FM.penExpandCosts;
    const extra = list.length - (kind === "fields" ? FM.fieldPlots : FM.pens);
    html += extra < costs.length
      ? `<div class="card plot add-plot">${emoArt("➕", "l", kind + "add")}<div class="name">扩建${label}</div>
          <div class="meta">去商店街的五金店扩建</div>
          <div class="row"><button class="ghost" data-goshop="hardware">去五金店</button></div></div>`
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
    $("collectAll").textContent = total ? `一键收取 ×${total}` : "一键收取";
  }
  $("collectAll").addEventListener("click", () => {
    let n = 0; [...S.fields, ...S.pens].forEach(p => n += collectPlot(p));
    if (n) { save(); toast(`收取了 ${n} 份食材，已放进仓库`); renderAll(); }
  });
  $("tab-farm").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t || t.disabled) return;
    const kind = t.dataset.kind;
    if (t.dataset.assign) {
      const p = S[kind][+t.dataset.idx], f = FARM[t.dataset.assign];
      if (p.item) collectPlot(p);
      p.item = f.id; p.last = Date.now(); save();
      toast(`${f.emoji} 开始${f.type === "crop" ? "种" : "养"}${f.name}，会一直产出${ING[f.produces].name}`); renderAll();
    }
    if (t.dataset.collect !== undefined) {
      const p = S[kind][+t.dataset.collect], prod = ING[FARM[p.item].produces], n = collectPlot(p);
      if (n) { save(); toast(`收取 ${prod.emoji} ${prod.name} ×${n}`); renderAll(); }
    }
    if (t.dataset.upgrade !== undefined) {
      const p = S[kind][+t.dataset.upgrade], cost = FM.upgradeCosts[p.level - 1];
      if (cost !== undefined && spend(cost)) {
        if (p.item) collectPlot(p);
        p.level++; if (p.item) p.last = Date.now(); save();
        toast(`升到 Lv.${p.level}！产得更快、能攒更多`); renderAll();
      }
    }
  });

  // ---------- 厨房 ----------
  // 锅里放食材 + 选一个做法 → 加工品或菜品（都要自己猜）
  const known = r => r.isProc ? S.processed.includes(r.id) : S.dishes.includes(r.id);
  const methodText = id => `${METHOD[id].emoji}${METHOD[id].name}`;
  function recipeText(r) { return r.ingredients.map(x => `${ING[x].emoji}${ING[x].name}`).join(" + ") + ` · ${methodText(r.method)}`; }
  function available(id) { return (S.inventory[id] || 0) - pot.filter(x => x === id).length; }
  function renderMethods() {
    $("methods").innerHTML = D.methods.map(m => {
      const ok = DEV() || S.methods.includes(m.id);
      return `<button class="method ${method === m.id ? "on" : ""} ${ok ? "" : "locked"}" data-method="${m.id}" ${ok ? "" : `title="去商店街的五金店解锁"`}>
        <span>${ok ? m.emoji : "🔒"}</span>${m.name}</button>`;
    }).join("");
  }
  $("methods").addEventListener("click", e => {
    const b = e.target.closest("[data-method]"); if (!b) return;
    if (!DEV() && !S.methods.includes(b.dataset.method)) { toast(`“${METHOD[b.dataset.method].name}”还没解锁，去商店街的五金店看看吧`); return; }
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
      : `<p class="sub">背包空空的，去地图上的集市进货，或者去农场收取吧。</p>`;
    $("potItems").innerHTML = pot.map((id, idx) =>
      `<div class="ing" data-remove="${idx}" title="点击拿出">${ingArt(id, "s")}<div class="n">${ING[id].name}</div></div>`).join("");
    $("potMethod").textContent = method ? `做法：${methodText(method)}` : "还没选做法";
    renderQuickCook();
  }
  const canMake = r => Math.min(...r.ingredients.map(x => S.inventory[x] || 0));
  function renderQuickCook() {
    const list = RECIPES.filter(known);
    const card = r => {
      const n = canMake(r);
      const out = r.isProc ? `得到 ${r.emoji}×${r.yield} · 仓库 ${S.inventory[r.id] || 0}` : `库存 ${S.dishStock[r.id] || 0} 份 · 售价 🪙${priceOf(r)}`;
      return `<div class="card">${r.isProc ? ingArt(r.id, "m") : dishArt(r, "m")}
        <div class="name">${r.name}</div>
        <div class="meta">${r.ingredients.map(x => `<span class="${(S.inventory[x] || 0) ? "" : "missing"}">${ING[x].emoji}${S.inventory[x] || 0}</span>`).join(" ")} · ${methodText(r.method)}</div>
        <div class="meta">${out}</div>
        <div class="row">
          <button data-make="${r.id}" data-n="1" ${n < 1 ? "disabled" : ""}>做 1 次</button>
          <button class="ghost" data-make="${r.id}" data-n="${n}" ${n < 2 ? "disabled" : ""}>全做${n > 1 ? " ×" + n : ""}</button>
        </div></div>`;
    };
    const procs = list.filter(r => r.isProc), dishes = list.filter(r => !r.isProc);
    $("quickCook").innerHTML = list.length
      ? `${procs.length ? `<div class="bag-label wide">加工品</div>${procs.map(card).join("")}` : ""}
         ${dishes.length ? `<div class="bag-label wide">菜品</div>${dishes.map(card).join("")}` : ""}`
      : `<p class="sub">还没有研发出任何东西。先在锅里试试看吧！</p>`;
  }
  // 做 n 次：加工品进背包（每次产 yield 份），菜品进成菜库存
  function make(r, n) {
    n = Math.min(n, canMake(r)); if (n < 1) return 0;
    r.ingredients.forEach(x => S.inventory[x] -= n);
    if (r.isProc) addIng(r.id, n * r.yield);
    else S.dishStock[r.id] = (S.dishStock[r.id] || 0) + n;
    return n;
  }
  $("quickCook").addEventListener("click", e => {
    const id = e.target.dataset.make; if (!id) return;
    const r = RECIPES.find(x => x.id === id), n = make(r, +e.target.dataset.n);
    if (n) {
      save();
      toast(r.isProc ? `加工好了 ${r.emoji} ${r.name} ×${n * r.yield}` : `做好了 ${r.emoji} ${r.name} ×${n}，去店铺上架吧`);
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
    if (!pot.length) { msg.textContent = "锅里还是空的呢～"; return; }
    if (!method) { msg.textContent = "先在锅边选一个做法吧"; return; }
    const set = new Set(pot);
    const back = () => { pot = []; renderKitchen(); };
    if (pot.length !== set.size) { msg.textContent = "同一种食材放一份就够啦。（食材已退回）"; return back(); }
    const sameIngs = RECIPES.filter(r => key(r.ingredients) === key(pot));
    const match = sameIngs.find(r => r.method === method);
    if (!match) {   // 零惩罚：食材原样退回，只给温馨提示
      let tip = "这个组合好像不太对劲……食材已经退回背包，换个搭配试试吧。";
      const close = RECIPES.find(r => r.ingredients.every(x => set.has(x)) || [...set].every(x => r.ingredients.includes(x)));
      if (sameIngs.length) tip = `食材对了！但“${METHOD[method].name}”好像不是正确的做法……（食材已退回）`;
      else if (close && [...set].every(x => close.ingredients.includes(x))) tip = "闻起来有点意思！好像还少了点什么。（食材已退回）";
      else if (close) tip = "味道有点杂，也许有的食材是多余的？（食材已退回）";
      msg.textContent = tip; return back();
    }
    pot = [];
    make(match, 1);
    if (known(match)) {
      save();
      msg.textContent = match.isProc ? `加工好了 ${match.name} ×${match.yield}，已放进背包。` : `做好了一份「${match.name}」，去店铺上架吧！`;
      renderAll(); return;
    }
    msg.textContent = "";
    if (match.isProc) {
      S.processed.push(match.id); save();
      showModal(`${ingArt(match.id, "xl")}
        <h2>新加工品：${match.name}！</h2>
        <p>${match.desc}</p>
        <p>得到 ${match.emoji} ${match.name} ×${match.yield}，已放进背包。<br>配方：${recipeText(match)}</p>
        <button class="primary" data-close>收入食材图鉴</button>`);
    } else {
      S.dishes.push(match.id); save();
      lastUnlocked = match.id;
      showModal(`${dishArt(match, "xl")}
        <h2>研发成功：${match.name}！</h2>
        <p>${match.story}</p>
        <p>已做好 1 份，可以拿去店铺卖 <b style="color:var(--accent-2)">🪙${priceOf(match)}</b> / 份。<br>以后在厨房“已会做的”里可以一键出餐。</p>
        <button class="primary" data-close>收入图鉴</button>`);
    }
    renderAll();
  });

  // ---------- 店铺 ----------
  function renderShop() {
    const iv = sellIntervalMs(), now = Date.now();
    const bp = bonus("sellPrice"), bs = bonus("sellSpeed");
    $("shopBonus").innerHTML = `每个货架约 ${(iv / 1000).toFixed(1)} 秒卖出一份${bp ? ` · 卖价 +${pct(bp)}` : ""}${bs ? ` · 顾客速度 +${pct(bs)}` : ""} · 累计卖出 ${S.sold} 份`;
    const stocked = D.dishes.filter(d => (S.dishStock[d.id] || 0) > 0);
    $("shelves").innerHTML = S.shelves.map((sh, idx) => {
      if (!sh.dish) {
        return `<div class="card shelf empty-shelf">${emoArt("🧺", "l", "shelf" + idx)}
          <div class="name">空货架 ${idx + 1}</div>
          <div class="row col">${stocked.length ? stocked.map(d =>
            `<button data-stock="${d.id}" data-idx="${idx}">摆上 ${d.emoji}${d.name}（${S.dishStock[d.id]}）</button>`).join("")
            : `<span class="meta">没有成菜可以上架，先去厨房做菜吧</span>`}</div></div>`;
      }
      const d = DISH[sh.dish], stock = S.dishStock[d.id] || 0;
      const prog = sh.count > 0 ? Math.min(1, (now - sh.last) / iv) : 0;
      return `<div class="card shelf ${sh.count ? "" : "sold-out"}">${dishArt(d, "l")}
        <div class="name">${d.name}</div>
        <div class="meta">${sh.count ? `在售 ${sh.count}/${SH.shelfCapacity} 份 · 🪙${priceOf(d)}/份` : "已售罄！"}</div>
        <div class="bar"><i style="width:${prog * 100}%"></i></div>
        <div class="meta">${sh.count ? `下一位顾客 ${fmtTime((iv - (now - sh.last)) / 1000)}` : `库存还有 ${stock} 份`}</div>
        <div class="row">
          <button data-restock="${idx}" ${!stock || sh.count >= SH.shelfCapacity ? "disabled" : ""}>补货</button>
          <button class="ghost" data-unstock="${idx}">撤下</button>
        </div></div>`;
    }).join("");
    $("shelfExpand").innerHTML = S.shelfCount - SH.startShelves < SH.expandCosts.length
      ? `<button class="ghost" data-goshop="hardware">🔨 想要更多货架？去商店街的五金店扩建</button>`
      : `<span class="sub">货架已经扩建到最大啦</span>`;
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
      if (n) { save(); toast(`上架了 ${DISH[t.dataset.stock].name} ×${n}`); renderAll(); }
    }
    if (t.dataset.restock !== undefined) {
      const sh = S.shelves[+t.dataset.restock], n = stockShelf(sh, sh.dish);
      if (n) { save(); toast(`补货 ×${n}`); renderAll(); }
    }
    if (t.dataset.unstock !== undefined) {
      const sh = S.shelves[+t.dataset.unstock];
      S.dishStock[sh.dish] = (S.dishStock[sh.dish] || 0) + sh.count;
      sh.dish = null; sh.count = 0; save(); renderAll();
    }
  });

  // ---------- 地图 ----------
  function renderWorld() {
    $("worldMap").innerHTML = WorldMap.render(
      D.cities.map(c => ({ ...c, open: S.cities.includes(c.id) })), D.config.startCity);
  }
  function cityProgress(id) {
    const total = D.dishes.filter(d => d.city === id).length;
    const done = D.dishes.filter(d => d.city === id && S.dishes.includes(d.id)).length;
    return `图鉴 ${done}/${total}`;
  }
  function openPopup(id, evt) {
    const c = CITY[id], open = S.cities.includes(id);
    const pop = $("mapPopup"), wrap = pop.parentElement.getBoundingClientRect();
    const pin = evt.target.closest(".pin").getBoundingClientRect();
    pop.style.left = (pin.left + pin.width / 2 - wrap.left) + "px";
    pop.style.top = (pin.top - wrap.top + 8) + "px";
    pop.innerHTML = `<button class="x" data-closepop>×</button>
      <div class="name">${open ? c.emoji : "🔒"} ${c.name}</div>
      <div class="meta">${c.desc}<br>${open ? cityProgress(id) : `开通需要 🪙 ${fmt(c.unlockCost)}`}</div>
      ${open ? `<button data-go="${id}">逛商店街</button>`
             : `<button data-unlock="${id}" ${G() < c.unlockCost ? "disabled" : ""}>开通航线</button>`}`;
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
        <div class="meta">${open ? cityProgress(c.id) : `开通需要 🪙 ${fmt(c.unlockCost)}`}</div>
        <div class="row">${open ? `<button data-go="${c.id}">逛商店街</button>`
          : `<button data-unlock="${c.id}" ${G() < c.unlockCost ? "disabled" : ""}>开通航线</button>`}</div>
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
      showModal(`<div class="big">✈️</div><h2>${CITY[un].name}航线已开通！</h2>
        <p>${CITY[un].desc}<br>去当地集市看看有什么新食材吧。${farmNew ? `<br>农场也可以养/种 ${farmNew} 啦。` : ""}</p>
        <button class="primary" data-close>出发</button>`);
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
          <div class="meta">${i.city ? `${CITY[i.city].emoji} ${CITY[i.city].name} · ` : ""}🪙 ${pr} / 份${i.todo ? "（临时价）" : ""}</div>
          <div class="meta">仓库 ${S.inventory[i.id] || 0}</div>
          <div class="row">
            <button data-buy="${i.id}" data-n="1" ${G() < pr ? "disabled" : ""}>买 1</button>
            <button class="ghost" data-buy="${i.id}" data-n="10" ${G() < pr * 10 ? "disabled" : ""}>买 10</button>
          </div></div>`;
      }).join("");
    }).join("") || `<p class="sub">还没有可买的食材。</p>`;
  }
  function renderBookstore() {
    const list = D.dishes.filter(d => DEV() || S.cities.includes(d.city));
    $("bookstore").innerHTML = D.cities.filter(c => list.some(d => d.city === c.id)).map(c =>
      `<div class="bag-label wide cat-head">${c.emoji} ${c.name}</div>` + list.filter(d => d.city === c.id).map(d => {
        const owned = S.recipes.includes(d.id) || S.dishes.includes(d.id);
        return `<div class="card">${emoArt("📜", "l", "recipe")}
          <div class="name">${d.name} 菜谱</div>
          <div class="meta">${owned ? "已拥有" : `🪙 ${fmt(d.recipePrice)}`}</div>
          <div class="row">${owned ? "" : `<button data-recipe="${d.id}" ${G() < d.recipePrice ? "disabled" : ""}>购买</button>`}</div>
        </div>`;
      }).join("")).join("");
  }
  function renderHardware() {
    const methods = D.methods.filter(m => m.unlockCost).map(m => {
      const own = S.methods.includes(m.id);
      return `<div class="card">${emoArt(m.emoji, "l", "m-" + m.id)}
        <div class="name">${m.name}</div><div class="meta">新的食材制作方式</div>
        <div class="row">${own ? `<span class="meta">✔ 已解锁</span>`
          : `<button data-method-buy="${m.id}" ${G() < m.unlockCost ? "disabled" : ""}>🪙 ${fmt(m.unlockCost)}</button>`}</div></div>`;
    }).join("");
    const plotCard = (k, label, emoji) => {
      const costs = k === "fields" ? FM.fieldExpandCosts : FM.penExpandCosts;
      const extra = S[k].length - (k === "fields" ? FM.fieldPlots : FM.pens);
      return `<div class="card">${emoArt(emoji, "l", "hw-" + k)}
        <div class="name">新${label}</div><div class="meta">现有 ${S[k].length} 块</div>
        <div class="row">${extra < costs.length
          ? `<button data-expand="${k}" ${G() < costs[extra] ? "disabled" : ""}>🪙 ${fmt(costs[extra])}</button>`
          : `<span class="meta">已到上限</span>`}</div></div>`;
    };
    const extraShelf = S.shelfCount - SH.startShelves;
    const shelf = `<div class="card">${emoArt("🧺", "l", "hw-shelf")}
      <div class="name">新货架</div><div class="meta">现有 ${S.shelfCount} 个</div>
      <div class="row">${extraShelf < SH.expandCosts.length
        ? `<button data-shelf-buy="1" ${G() < SH.expandCosts[extraShelf] ? "disabled" : ""}>🪙 ${fmt(SH.expandCosts[extraShelf])}</button>`
        : `<span class="meta">已到上限</span>`}</div></div>`;
    $("hardware").innerHTML = `<div class="bag-label wide cat-head">🍳 新食材制作方式</div>${methods}
      <div class="bag-label wide cat-head">🌾 新农场</div>${plotCard("fields", "菜地", "🟫")}${plotCard("pens", "畜栏", "🛖")}
      <div class="bag-label wide cat-head">🏪 新店（货架）</div>${shelf}`;
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
    normalize(); save(); toast(`农场多了一块${k === "fields" ? "菜地" : "畜栏"}！`); renderAll();
  }
  $("tab-market").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t || t.disabled) return;
    const id = t.dataset.buy;
    if (id) {
      const n = +t.dataset.n, i = ING[id];
      if (spend(priceOfIng(i) * n)) { addIng(id, n); save(); toast(`买到了 ${i.emoji} ${i.name} ×${n}`); renderAll(); }
    }
    const r = t.dataset.recipe;
    if (r && spend(DISH[r].recipePrice)) {
      S.recipes.push(r); save();
      const d = DISH[r];
      showModal(`<div class="big">📜</div><h2>${d.name}</h2>
        <p>配方：${recipeText(d)}</p>
        <p class="sub">配方已记在“我的家 → 菜品图鉴”里。</p>
        <button class="primary" data-close>记住了</button>`);
      renderAll();
    }
    if (t.dataset.methodBuy) {
      const m = METHOD[t.dataset.methodBuy];
      if (spend(m.unlockCost)) { S.methods.push(m.id); save(); toast(`解锁了新做法：${m.emoji} ${m.name}`); renderAll(); }
    }
    if (t.dataset.expand) expandPlot(t.dataset.expand);
    if (t.dataset.shelfBuy) {
      const cost = SH.expandCosts[S.shelfCount - SH.startShelves];
      if (cost !== undefined && spend(cost)) { S.shelfCount++; normalize(); save(); toast("小店多了一个货架！"); renderAll(); }
    }
  });
  // 农场 / 店铺里的“去五金店”按钮
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-goshop]"); if (!b) return;
    streetTab = b.dataset.goshop; switchTab("market");
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
      uiAcc = 0; renderTop();
      if (currentTab === "shop") renderShop();
      if (currentTab === "farm") renderFarm();
      if (currentTab === "market") renderStreet();
      if (currentTab === "map") renderMap();
      if (currentTab === "home" && homeSub === "furniture") renderFurniture();
    }
    if (saveAcc > 5) { saveAcc = 0; save(); }
    requestAnimationFrame(tick);
  }
  window.addEventListener("beforeunload", save);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

  // 测试用：网址后加 ?debug，在“设置”里出现调试按钮
  if (location.search.includes("debug")) {
    $("debugRow").innerHTML = `<div class="setting-row"><span>🧪 调试</span><span>
      <button class="ghost" id="dbgGold">+5000 金币</button>
      <button class="ghost" id="dbgTime">时间快进 5 分钟</button></span></div>`;
    $("dbgGold").onclick = () => { S.gold += 5000; renderAll(); };
    $("dbgTime").onclick = () => {
      const ms = 5 * 60 * 1000;
      S.shelves.forEach(sh => sh.last -= ms);
      [...S.fields, ...S.pens].forEach(p => { p.last -= ms; });
      processShop(Date.now()); save(); renderAll(); toast("时间快进了 5 分钟");
    };
  }

  renderTitle();
  switchTab("home");
  preloadArt();
  requestAnimationFrame(tick);
})();
