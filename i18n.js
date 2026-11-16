// 多语言（简体中文 / 日本語）
// 用法：
//   T("中文原文 {0}", 参数…)  —— 中文原文本身就是 key；当前语言是中文时原样返回，是日语时去 data/ja.js 的 ui 词典里查，查不到就退回中文。
//   data/ja.js 里的 data 部分是食材 / 料理 / 城市等“游戏数据”的日语名称，加载时直接覆盖到 GAME_DATA 上。
// 切换语言：存到 localStorage 后刷新页面（存档不受影响），这样所有文字都只需要在加载时决定一次，不会有半中半日的界面。
// 想再加一种语言：在 LANGS 里加一项，再照 data/ja.js 的格式写一个词典文件，并在 index.html 里引入即可。
(() => {
  const KEY = "xunwei_lang";
  const LANGS = [
    { id: "zh", name: "简体中文", locale: "zh-CN", htmlLang: "zh-CN" },
    { id: "ja", name: "日本語", locale: "ja-JP", htmlLang: "ja" },
  ];
  let lang = "zh";
  try {
    const saved = localStorage.getItem(KEY);
    if (LANGS.some(l => l.id === saved)) lang = saved;
    else if ((navigator.language || "").toLowerCase().startsWith("ja")) lang = "ja";   // 第一次打开：日语浏览器默认日语
  } catch (e) {}
  const info = LANGS.find(l => l.id === lang);
  document.documentElement.lang = info.htmlLang;

  // 日语词典只在需要时才加载（同步插入，保证排在 data/game.js 之前执行）
  if (lang === "ja") document.write('<script src="data/ja.js"><\/script>');

  const pack = () => (lang === "ja" ? window.GAME_JA : null);
  const fill = (s, args) => (args.length ? s.replace(/\{(\d+)\}/g, (m, i) => (args[i] === undefined ? "" : args[i])) : s);
  const missing = new Set();
  function T(key, ...args) {
    const p = pack();
    let s = key;
    if (p && p.ui) {
      if (Object.prototype.hasOwnProperty.call(p.ui, key)) s = p.ui[key];
      else if (location.search.includes("i18n")) { if (!missing.has(key)) { missing.add(key); console.warn("[i18n] 缺少翻译：", key); } }
    }
    return fill(s, args);
  }

  const CJK = /[㐀-鿿]/;
  // 把静态页面（index.html）里的文字换成当前语言：只在加载时跑一次
  function applyDOM(root = document.body) {
    const p = pack(); if (!p || !p.ui) return;
    const ui = p.ui;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      const raw = n.nodeValue; if (!CJK.test(raw)) return;
      const core = raw.trim();
      if (Object.prototype.hasOwnProperty.call(ui, core)) n.nodeValue = raw.replace(core, ui[core]);
    });
    root.querySelectorAll("[title],[placeholder]").forEach(el => {
      ["title", "placeholder"].forEach(a => {
        const v = el.getAttribute(a);
        if (v && Object.prototype.hasOwnProperty.call(ui, v)) el.setAttribute(a, ui[v]);
      });
    });
    if (ui["__title"]) document.title = ui["__title"];
  }

  // 把日语的“游戏数据”覆盖到 GAME_DATA 上（食材 / 料理 / 城市 / 成就……）
  function applyData(D) {
    const p = pack(); if (!p || !p.data) return;
    const d = p.data;
    const byId = (list, map, fields) => {
      if (!map) return;
      list.forEach(o => {
        const v = map[o.id]; if (!v) return;
        if (typeof v === "string") { o[fields[0]] = v; return; }
        fields.forEach((f, i) => { if (v[i] !== undefined && v[i] !== null) o[f] = v[i]; });
      });
    };
    byId(D.cities, d.cities, ["name", "desc"]);
    byId(D.categories, d.categories, ["name"]);
    byId(D.methods, d.methods, ["name"]);
    byId(D.ingredients, d.ingredients, ["name", "desc", "hint"]);
    byId(D.dishes, d.dishes, ["name", "hint", "story"]);
    byId(D.books, d.books, ["name", "desc"]);
    byId(D.achievementCategories, d.achievementCategories, ["name"]);
    byId(D.achievements, d.achievements, ["name", "desc"]);
    byId(D.furniture, d.furniture, ["name"]);
    byId(D.farm.items, d.farm, ["name"]);
    // “参考：洋果子店……”这类开发备注
    if (d.refs) D.ingredients.forEach(i => { if (i.ref && d.refs[i.ref]) i.ref = d.refs[i.ref]; });
  }

  function setLang(id) {
    if (!LANGS.some(l => l.id === id) || id === lang) return;
    try { localStorage.setItem(KEY, id); } catch (e) {}
    location.reload();
  }

  window.T = T;
  window.I18N = { lang, locale: info.locale, langs: LANGS, applyDOM, applyData, setLang, missing };
})();
