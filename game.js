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
  const SH = D.shop;

  // ---------- 存档 ----------
  function newState() {
    return {
      gold: D.config.startGold,
      cities: [D.config.startCity],
      inventory: {},          // 食材库存
      dishes: [],             // 已研发（图鉴）
      recipes: [],            // 已购买的菜谱
      seenIngs: [],           // 见过的食材（食材图鉴）
      dishStock: {},          // 成菜库存
      shelfCount: SH.startShelves,
      shelves: [],            // [{dish, count, last}]
      fields: [], pens: [],   // [{item, readyAt}] 或 null
      furniture: [],
      settings: { music: true, sfx: true },
      sold: 0,
      lastSeen: Date.now(),
    };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s.gold === "number") {
        const st = Object.assign(newState(), s);
        if (!s.seenIngs) st.seenIngs = Object.keys(st.inventory);   // 旧存档迁移
        return st;
      }
    } catch (e) {}
    return newState();
  }
  function save() {
    S.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }
  let S = load();
  function normalize() {
    while (S.shelves.length < S.shelfCount) S.shelves.push({ dish: null, count: 0, last: Date.now() });
    while (S.fields.length < D.farm.fieldPlots) S.fields.push(null);
    while (S.pens.length < D.farm.pens) S.pens.push(null);
  }
  normalize();

  let pot = [];
  let marketCity = D.config.startCity;
  let currentTab = "home";
  let homeSub = "dishes";
  let lastUnlocked = null;

  // ---------- 加成 ----------
  const bonus = eff => S.furniture.reduce((s, id) => s + (FURN[id].effect === eff ? FURN[id].value : 0), 0);
  const priceOf = d => Math.round(d.sellPrice * (1 + bonus("sellPrice")));
  const sellIntervalMs = () => SH.sellIntervalSec * 1000 / (1 + bonus("sellSpeed"));
  const growMs = item => item.growSec * 1000 / (1 + bonus("farmSpeed"));

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
    const ready = [...S.fields, ...S.pens].filter(p => p && p.readyAt <= Date.now()).length;
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
  function spend(n) {
    if (S.gold < n) { toast("金币不够哦，先去店铺卖点菜吧"); return false; }
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
    const navTab = name === "market" ? "map" : name;
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
    const started = S.dishes.length || S.cities.length > 1 || S.seenIngs.length || S.recipes.length;
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
        ${m.ready ? `农场有 <b>${m.ready}</b> 处可以收获啦。` : ""}</p>
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
      const recipeText = d.ingredients.map(x => `${ING[x].emoji}${ING[x].name}`).join(" + ");
      return `<div class="card taped ${got ? "" : "locked"} ${d.id === lastUnlocked ? "flip" : ""}">
        ${cityOpen || got ? dishArt(d, "xl") : lockArt("xl")}
        <div class="name">${got || cityOpen ? d.name : "？？？"}</div>
        <div class="meta">${CITY[d.city].emoji} ${CITY[d.city].name} · 售价 🪙${priceOf(d)}</div>
        ${got ? `<div class="story">${d.story}</div>` :
          cityOpen ? `<div class="hint">${d.hint}</div>` : `<div class="meta">开通${CITY[d.city].name}航线后解锁</div>`}
        ${recipe && cityOpen ? `<div class="recipe">${recipeText}</div>` : ""}
      </div>`;
    }).join("");
    lastUnlocked = null;
  }
  function renderIngDex() {
    $("ingDex").innerHTML = D.ingredients.map(i => {
      const seen = S.seenIngs.includes(i.id);
      const uses = D.dishes.filter(d => d.ingredients.includes(i.id) && S.dishes.includes(d.id)).map(d => d.name);
      return `<div class="card ${seen ? "" : "locked"}">
        ${seen ? ingArt(i.id, "l") : lockArt("l")}
        <div class="name">${seen ? i.name : "？？？"}</div>
        <div class="meta">${CITY[i.city].emoji} ${CITY[i.city].name}${seen ? ` · 集市 🪙${i.price}` : ""}</div>
        ${seen ? `<div class="meta">用于：${uses.length ? uses.join("、") : "？"}</div>` : ""}
      </div>`;
    }).join("");
  }
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
          : `<button data-furn="${f.id}" ${S.gold < f.price ? "disabled" : ""}>🪙 ${fmt(f.price)}</button>`}</div>
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
    S.settings[b.dataset.setting] = !S.settings[b.dataset.setting]; save(); renderSettings();
  }));
  $("toTitleBtn").addEventListener("click", toTitle);
  $("resetBtn").addEventListener("click", e => twoClick(e.target, "重置", "再点一次确认", () => {
    S = newState(); normalize(); pot = []; save(); renderAll(); renderTitle(); toast("存档已重置");
  }));

  // ---------- 农场 ----------
  function renderPlots(kind) {
    const list = kind === "fields" ? S.fields : S.pens;
    const type = kind === "fields" ? "crop" : "animal";
    const now = Date.now();
    $(kind).innerHTML = list.map((p, idx) => {
      if (!p) {
        const opts = D.farm.items.filter(f => f.type === type).map(f => {
          const open = S.cities.includes(f.city);
          return `<button data-plant="${f.id}" data-kind="${kind}" data-idx="${idx}" ${!open || S.gold < f.cost ? "disabled" : ""}
            title="${open ? "" : "需先开通" + CITY[f.city].name}">${f.emoji} ${f.name} 🪙${f.cost}${open ? "" : " 🔒" + CITY[f.city].name}</button>`;
        }).join("");
        return `<div class="card plot empty-plot">${emoArt(type === "crop" ? "🟫" : "🛖", "l", kind + "e")}
          <div class="name">空${type === "crop" ? "菜地" : "畜栏"}</div>
          <div class="meta">${D.farm.items.filter(f => f.type === type).map(f => `${f.emoji}→${ING[f.produces].emoji}×${f.yield} · ${fmtTime(growMs(f) / 1000)}`).join("<br>")}</div>
          <div class="row col">${opts}</div></div>`;
      }
      const f = FARM[p.item], total = growMs(f), left = p.readyAt - now, ready = left <= 0;
      return `<div class="card plot ${ready ? "ready" : ""}">
        ${ready ? ingArt(f.produces, "l") : emoArt(f.emoji, "l", f.id)}
        <div class="name">${ready ? "可以收获啦！" : f.name.replace(/^(种|养)/, "") + " 生长中"}</div>
        <div class="bar"><i style="width:${ready ? 100 : Math.min(100, (1 - left / total) * 100)}%"></i></div>
        <div class="meta">${ready ? `${ING[f.produces].name} ×${f.yield}` : `还要 ${fmtTime(left / 1000)}`}</div>
        <div class="row">${ready ? `<button data-harvest="${idx}" data-kind="${kind}">收获</button>` : ""}</div>
      </div>`;
    }).join("");
  }
  function renderFarm() { renderPlots("fields"); renderPlots("pens"); }
  $("tab-farm").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    const kind = t.dataset.kind, idx = +t.dataset.idx;
    if (t.dataset.plant) {
      const f = FARM[t.dataset.plant];
      if (spend(f.cost)) {
        S[kind][idx] = { item: f.id, readyAt: Date.now() + growMs(f) }; save();
        toast(`${f.emoji} ${f.name}，${fmtTime(growMs(f) / 1000)} 后收获`); renderAll();
      }
    }
    if (t.dataset.harvest !== undefined) {
      const hi = +t.dataset.harvest, p = S[kind][hi], f = FARM[p.item];
      addIng(f.produces, f.yield); S[kind][hi] = null; save();
      toast(`收获 ${ING[f.produces].emoji} ${ING[f.produces].name} ×${f.yield}`); renderAll();
    }
  });

  // ---------- 厨房 ----------
  function available(id) { return (S.inventory[id] || 0) - pot.filter(x => x === id).length; }
  function renderKitchen() {
    const owned = D.ingredients.filter(i => (S.inventory[i.id] || 0) > 0);
    $("bag").innerHTML = owned.length ? owned.map(i => {
      const n = available(i.id);
      return `<div class="ing ${n <= 0 ? "empty" : ""}" draggable="${n > 0}" data-add="${i.id}">
        <span class="c">×${n}</span>${ingArt(i.id, "m")}<div class="n">${i.name}</div></div>`;
    }).join("") : `<p class="sub">背包空空的，去地图上的集市进货，或者去农场种点什么吧。</p>`;
    $("potItems").innerHTML = pot.map((id, idx) =>
      `<div class="ing" data-remove="${idx}" title="点击拿出">${ingArt(id, "s")}<div class="n">${ING[id].name}</div></div>`).join("");
    renderQuickCook();
  }
  const canMake = d => Math.min(...d.ingredients.map(x => S.inventory[x] || 0));
  function renderQuickCook() {
    const known = D.dishes.filter(d => S.dishes.includes(d.id));
    $("quickCook").innerHTML = known.length ? known.map(d => {
      const n = canMake(d);
      return `<div class="card">${dishArt(d, "m")}
        <div class="name">${d.name}</div>
        <div class="meta">${d.ingredients.map(x => `<span class="${(S.inventory[x] || 0) ? "" : "missing"}">${ING[x].emoji}${S.inventory[x] || 0}</span>`).join(" ")}</div>
        <div class="meta">库存 ${S.dishStock[d.id] || 0} 份 · 售价 🪙${priceOf(d)}</div>
        <div class="row">
          <button data-make="${d.id}" data-n="1" ${n < 1 ? "disabled" : ""}>做 1 份</button>
          <button class="ghost" data-make="${d.id}" data-n="${n}" ${n < 2 ? "disabled" : ""}>全做${n > 1 ? " ×" + n : ""}</button>
        </div></div>`;
    }).join("") : `<p class="sub">还没有研发出任何菜。先在锅里试试看吧！</p>`;
  }
  function makeDish(d, n) {
    n = Math.min(n, canMake(d)); if (n < 1) return 0;
    d.ingredients.forEach(x => S.inventory[x] -= n);
    S.dishStock[d.id] = (S.dishStock[d.id] || 0) + n;
    return n;
  }
  $("quickCook").addEventListener("click", e => {
    const id = e.target.dataset.make; if (!id) return;
    const n = makeDish(DISH[id], +e.target.dataset.n);
    if (n) { save(); toast(`做好了 ${DISH[id].emoji} ${DISH[id].name} ×${n}，去店铺上架吧`); renderAll(); }
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
    const match = D.dishes.find(d => key(d.ingredients) === key(pot));
    if (!match) {   // 零惩罚：食材原样退回，只给温馨提示
      const set = new Set(pot);
      const close = D.dishes.find(d => d.ingredients.every(x => set.has(x)) || [...set].every(x => d.ingredients.includes(x)));
      let tip = "这个组合好像不太对劲……食材已经退回背包，换个搭配试试吧。";
      if (close && [...set].every(x => close.ingredients.includes(x))) tip = "闻起来有点意思！好像还少了点什么。（食材已退回）";
      else if (close) tip = "味道有点杂，也许有的食材是多余的？（食材已退回）";
      if (pot.length !== set.size) tip = "同一种食材放一份就够啦。（食材已退回）";
      msg.textContent = tip; pot = []; renderKitchen(); return;
    }
    pot = [];
    makeDish(match, 1);
    if (S.dishes.includes(match.id)) {
      save(); msg.textContent = `做好了一份「${match.name}」，去店铺上架吧！`; renderAll(); return;
    }
    S.dishes.push(match.id); save();
    msg.textContent = "";
    lastUnlocked = match.id;
    showModal(`${dishArt(match, "xl")}
      <h2>研发成功：${match.name}！</h2>
      <p>${match.story}</p>
      <p>已做好 1 份，可以拿去店铺卖 <b style="color:var(--accent-2)">🪙${priceOf(match)}</b> / 份。<br>以后在厨房“已会做的菜”里可以一键出餐。</p>
      <button class="primary" data-close>收入图鉴</button>`);
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
    const extra = S.shelfCount - SH.startShelves;
    $("shelfExpand").innerHTML = extra < SH.expandCosts.length
      ? `<button class="primary" id="expandBtn" ${S.gold < SH.expandCosts[extra] ? "disabled" : ""}>🔨 扩建一个货架 · 🪙${fmt(SH.expandCosts[extra])}</button>`
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
    if (t.id === "expandBtn") {
      const cost = SH.expandCosts[S.shelfCount - SH.startShelves];
      if (spend(cost)) { S.shelfCount++; normalize(); save(); toast("小店多了一个货架！"); renderAll(); }
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
      ${open ? `<button data-go="${id}">逛集市</button>`
             : `<button data-unlock="${id}" ${S.gold < c.unlockCost ? "disabled" : ""}>开通航线</button>`}`;
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
        <div class="row">${open ? `<button data-go="${c.id}">逛集市</button>`
          : `<button data-unlock="${c.id}" ${S.gold < c.unlockCost ? "disabled" : ""}>开通航线</button>`}</div>
      </div>`;
    }).join("");
  }
  $("cityList").addEventListener("click", handleCityAction);
  function handleCityAction(e) {
    const go = e.target.dataset.go, un = e.target.dataset.unlock;
    if (go) { marketCity = go; switchTab("market"); }
    if (un && spend(CITY[un].unlockCost)) {
      S.cities.push(un); save();
      const farmNew = D.farm.items.filter(f => f.city === un).map(f => f.emoji + f.name.replace(/^(种|养)/, "")).join("、");
      showModal(`<div class="big">✈️</div><h2>${CITY[un].name}航线已开通！</h2>
        <p>${CITY[un].desc}<br>去当地集市看看有什么新食材吧。${farmNew ? `<br>农场也可以养/种 ${farmNew} 啦。` : ""}</p>
        <button class="primary" data-close>出发</button>`);
      marketCity = un; switchTab("market");
    }
  }

  // ---------- 集市 ----------
  $("backToMap").addEventListener("click", () => switchTab("map"));
  function renderMarket() {
    if (!S.cities.includes(marketCity)) marketCity = S.cities[0];
    $("marketTitle").textContent = `${CITY[marketCity].name} · 本地集市`;
    $("marketCityTabs").innerHTML = S.cities.map(id =>
      `<button data-city="${id}" class="${id === marketCity ? "active" : ""}">${CITY[id].emoji} ${CITY[id].name}</button>`).join("");
    $("marketIngredients").innerHTML = D.ingredients.filter(i => i.city === marketCity).map(i => `
      <div class="card">${ingArt(i.id, "l")}
        <div class="name">${i.name}</div>
        <div class="meta">🪙 ${i.price} / 份 · 仓库 ${S.inventory[i.id] || 0}</div>
        <div class="row">
          <button data-buy="${i.id}" data-n="1" ${S.gold < i.price ? "disabled" : ""}>买 1</button>
          <button class="ghost" data-buy="${i.id}" data-n="5" ${S.gold < i.price * 5 ? "disabled" : ""}>买 5</button>
        </div>
      </div>`).join("");
    $("marketRecipes").innerHTML = D.dishes.filter(d => d.city === marketCity).map(d => {
      const owned = S.recipes.includes(d.id) || S.dishes.includes(d.id);
      return `<div class="card">${emoArt("📜", "l", "recipe")}
        <div class="name">${d.name} 菜谱</div>
        <div class="meta">${owned ? "已拥有" : `🪙 ${fmt(d.recipePrice)}`}</div>
        <div class="row">${owned ? "" : `<button data-recipe="${d.id}" ${S.gold < d.recipePrice ? "disabled" : ""}>购买</button>`}</div>
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
      if (spend(ING[id].price * n)) { addIng(id, n); save(); toast(`买到了 ${ING[id].emoji} ${ING[id].name} ×${n}`); renderAll(); }
    }
    const r = e.target.dataset.recipe;
    if (r && spend(DISH[r].recipePrice)) {
      S.recipes.push(r); save();
      const d = DISH[r];
      showModal(`<div class="big">📜</div><h2>${d.name}</h2>
        <p>配方：${d.ingredients.map(x => `${ING[x].emoji} ${ING[x].name}`).join(" + ")}</p>
        <p class="sub">配方已记在“我的家 → 菜品图鉴”里。</p>
        <button class="primary" data-close>记住了</button>`);
      renderAll();
    }
  });

  // ---------- 渲染与主循环 ----------
  function renderTop() {
    $("gold").textContent = fmt(S.gold);
    $("onShelf").textContent = S.shelves.reduce((s, sh) => s + (sh.dish ? sh.count : 0), 0);
  }
  function renderAll() {
    renderTop();
    if (currentTab === "home") renderHome();
    if (currentTab === "farm") renderFarm();
    if (currentTab === "kitchen") renderKitchen();
    if (currentTab === "shop") renderShop();
    if (currentTab === "map") { renderWorld(); renderMap(); }
    if (currentTab === "market") renderMarket();
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
      if (currentTab === "market") renderMarket();
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
      [...S.fields, ...S.pens].forEach(p => { if (p) p.readyAt -= ms; });
      processShop(Date.now()); save(); renderAll(); toast("时间快进了 5 分钟");
    };
  }

  renderTitle();
  switchTab("home");
  preloadArt();
  requestAnimationFrame(tick);
})();
