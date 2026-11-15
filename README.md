🎮 **在线试玩：https://ruoyaoyan.github.io/foodgame/**

# 吃

一款融合“放置挂机”“食材探索”与“猜配方”的休闲图鉴收集游戏。本仓库目前是 **网页原型 v0.2**，用来验证核心循环；正式版计划用 Godot 制作并在 Steam 发行。

- [一、当前原型（已实现）](#一当前原型已实现)
- [二、原始策划文档](#二原始策划文档)
- [三、原型与原始策划的差异](#三原型与原始策划的差异)
- [四、开发说明](#四开发说明)
- [五、后续计划](#五后续计划)

---

## 一、当前原型（已实现）

### 核心循环
**挂机攒金币 → 世界地图开通城市 → 集市买食材 / 买菜谱 → 厨房自由组合猜配方 → 手帐图鉴解锁（永久增加每秒金币）**

### 开始界面
- 大字标题“吃”，背景飘落食物，“开始旅程 / 继续旅程”按钮。
- 有存档时显示进度概况（手帐收集数、到过的城市、金币），并提供“重新开始”（点两次确认）。
- 游戏中点左上角“吃”可回到开始界面。

### 1. 挂机金币
- 基础每秒 1 金币，每收录一道菜永久增加每秒收益。
- 存档保存在浏览器本地；关掉页面期间也按现实时间累计金币（最多 12 小时），回来时弹窗告诉你离开期间赚了多少。

### 2. 世界地图
- 手绘风世界地图，城市以图钉标出：成都、北京、罗马。
- 点击图钉：已开通的城市可“去集市”；未开通的显示所需金币，可“开通航线”。
- 已开通的航线以从成都出发的动态虚线显示。

| 城市 | 开通费用 | 简介 |
|---|---|---|
| 🐼 成都 | 初始城市 | 天府之国，麻辣鲜香 |
| 🏯 北京 | 2000 | 皇城根下，酱香浓郁 |
| 🏛️ 罗马 | 8000 | 永恒之城，一碗面的艺术 |

### 3. 集市
- 每个城市卖当地特有的食材，按份购买（买 1 / 买 5），做菜成功时才消耗。
- **各城市的食材可以混在一起用**（例如炸酱面要用成都买的猪肉末）。
- 菜谱铺：花金币买下某道菜的菜谱，即可在手帐里看到完整配方。

| 城市 | 食材（单价） |
|---|---|
| 成都 | 嫩豆腐 5、猪肉末 10、猪五花 12、郫县豆瓣酱 8、汉源花椒 8、青蒜 5 |
| 北京 | 手擀面 20、六必居黄酱 25、黄瓜丝 15、猪里脊 30、甜面酱 20、章丘大葱 15、豆腐皮 18 |
| 罗马 | 意大利面 40、鸡蛋黄 30、风干猪颊肉 60、佩科里诺奶酪 50、黑胡椒 30 |

### 4. 厨房：自由组合猜配方
- 点击或拖动背包里的食材进锅，点“下锅！”。
- 组合正好等于某道菜的配方就研发成功（不看顺序，每种食材放一份）。
- **零惩罚**：猜错时食材全部退回，并给温馨提示——“好像少了点什么”、“有的食材是多余的”或“同一种食材放一份就够”。
- 已收录的菜再做一次不消耗食材。

### 5. 美食手帐
- 6 道菜的图鉴卡片：未解锁显示一句提示，买过菜谱显示完整配方，解锁后显示历史渊源并带翻页动画。

| 城市 | 菜品 | 配方 | 菜谱价格 | 收益 |
|---|---|---|---|---|
| 成都 | 麻婆豆腐 | 嫩豆腐 + 猪肉末 + 郫县豆瓣酱 + 汉源花椒 | 80 | +4/秒 |
| 成都 | 回锅肉 | 猪五花 + 郫县豆瓣酱 + 青蒜 | 80 | +4/秒 |
| 北京 | 老北京炸酱面 | 手擀面 + 六必居黄酱 + 猪肉末 + 黄瓜丝 | 300 | +10/秒 |
| 北京 | 京酱肉丝 | 猪里脊 + 甜面酱 + 章丘大葱 + 豆腐皮 | 300 | +10/秒 |
| 罗马 | 罗马卡邦尼意面 | 意大利面 + 鸡蛋黄 + 风干猪颊肉 + 佩科里诺奶酪 + 黑胡椒 | 800 | +20/秒 |
| 罗马 | 黑胡椒奶酪面 | 意大利面 + 佩科里诺奶酪 + 黑胡椒 | 800 | +20/秒 |

### 原型阶段已确认的决策
| 问题 | 决定 |
|---|---|
| 原型技术 | 先做网页原型（HTML/JS），验证好玩法和数值再迁移 Godot |
| 范围 | 完整循环最小版，三个城市：成都、北京、罗马 |
| 食材 | 每个城市解锁各自的食材，所有食材可以混合使用；按份购买，做菜消耗 |
| 风味罗盘 | 暂不加入，重点放在食材收集与图鉴解锁 |
| 做菜方式 | 自由组合猜配方为主，加入“购买菜谱”功能 |
| 控火 QTE | 暂不加入 |
| 美术 | 先用 emoji / 色块占位，之后用下方 prompt 生成图片替换 |
| 存档 | 浏览器本地存档，离线也累计金币 |
| 名称 | 游戏名为“吃” |

---

## 二、原始策划文档

> 以下为策划 PDF 原文整理（原项目名《寻味之旅》，现已更名为“吃”）。

### 一、项目概述 (Project Overview)
《寻味之旅》是一款融合了“放置挂机”、“食材探索”与“调味解谜”的休闲图鉴收集游戏。玩家将游历大江南北，在各地集市采购最基础的原子食材，通过独特的“风味罗盘”系统还原出经典地方名菜，最终填满一本充满人间烟火气的美食手帐。

- **商业模式**：Steam 平台纯买断制（无内购、无广告、无版号限制）。
- **受众群体**：喜爱《洋果子店》、《潜水员戴夫》、星露谷物语等画风治愈、节奏舒缓、有强收集癖的休闲玩家。

### 二、技术与发行架构 (Technical Architecture)
| 模块 | 技术选型 / 方案 | 优势与原因 |
|---|---|---|
| 游戏引擎 | Godot Engine | 极其轻量，极度擅长 2D UI 交互；完美支持 MacBook 开发；一键打包 Windows .exe 以供 Steam 发行 |
| 数据管理 | JSON 文件驱动 | 食材属性、菜谱配方全部表格化。产品经理可以直接修改文本调整游戏数值，无需修改代码。 |
| 发行平台 | Steam (PC 端) | 避开国内 App Store 严苛的版号审查与内购限制，直接面向全球核心独立游戏玩家变现。 |
| 美术生产 | ChatGPT | |

### 三、核心玩法循环 (Core Gameplay Loop)
游戏采用“无挫败感”的治愈系设计，核心循环分为三个无缝衔接的阶段：

**1. 放置赚取【金币】与大地图探索**
- 挂机印钞：游戏时间与现实同步。已解锁的图鉴等级越高，每秒自动产出的【金币】就越多（例如：+15 金币/秒）。
- 城市解锁：消耗大量金币解锁新的大地图节点（如：花费 5000 金币解锁“北京”航线）。
- 本地集市：在已解锁城市的集市里，使用少量金币“进货”当地特有的原子食材（如成都的汉源花椒、郫县豆瓣酱）。

**2. 厨房研发：“风味罗盘”与“治愈控火”**
- 风味罗盘（调味）：界面左侧为巨大的十字坐标轴（横轴：咸-甜，纵轴：酸-辣）。玩家将背包中的基础食材拖入锅中，指针会产生带有物理阻尼感的平滑移动。目标是将指针调和至隐藏的“目标风味区间”。
- 控火 QTE（烹饪）：按住屏幕中央的铁锅，温度条上涨。在宽广的“绿色黄金区间”松手即可完美出锅。
- 零惩罚机制：如果调味偏离或火候不对，只会收到温馨提示，并且 100% 退还所有食材。拒绝压力！

**3. 手帐图鉴记录**
- 研发成功后，伴随平滑的 3D 翻书动画，解锁精美的 AI 水彩手绘风插画。
- 图鉴中包含菜品的历史渊源、文化科普，并永久增加全局的金币秒收益。

### 四、美术生成 Prompt

**菜品生成 Prompt（原版）**
```
A 2D game UI asset of a SMALLER, deep plate/bowl of Chinese Mapo Tofu. Pure solid white background. Camera & Perspective: 45-degree angle view (3/4 perspective). You must clearly see both the delicious food inside AND the thick, curved outer wall/body of the deep plate. Proportions & Content: Make the overall size of the plate/bowl noticeably smaller. Reduce the portion size by using FEWER tofu cubes (around 10 to 12 cubes in total). The food fills this smaller deep plate naturally without overflowing, looking slightly less crowded. Show the physical thickness and outer body of the plate. Do NOT make a huge empty rim. Art Style & Outlines: Studio Ghibli food animation style. CRITICAL: The entire object (plate and food) MUST have heavy, thick, organic watercolor-style outlines in dark warm brown. The outlines should feel painterly, weighty, and hand-drawn, NOT sharp vector lines. Soft, hand-painted watercolor textures for the food, making it look glowing, juicy, and appetizing. UI Element: Add a distinct drop shadow directly underneath the plate to make it look like a pop-up 3D UI sticker. ONLY the plate of food. NO table, NO chopsticks, NO background details. Pure solid white background only.
```

**菜品生成 Prompt（锁定版）**
```
A 2D game UI asset of a SMALLER, deep plate/bowl of 【填入菜品英文名，例如：Sweet and Sour Pork】. Pure solid white background.

CRITICAL CONTAINER LOCK: The food MUST be served in the EXACT SAME container as before: a thick-walled, rustic ceramic shallow bowl (deep plate). The exterior is a warm, earthy light beige/tan with a slightly mottled watercolor texture, a thick rounded upper rim, and a subtle dark painted band around the lower base.

Camera & Perspective: 45-degree angle view (3/4 perspective). You must clearly see both the delicious food inside AND the thick, curved outer wall/body of this specific beige deep plate.

Proportions & Content: Make the overall size of the plate/bowl noticeably smaller. The food fills this smaller deep plate naturally without overflowing, looking slightly less crowded. 【简单描述一下菜的样子，例如：around 10 to 12 pieces of glossy fried pork with a few pineapple chunks】. Show the physical thickness and outer body of the plate. Do NOT make a huge empty rim.

Art Style & Outlines: Studio Ghibli food animation style. CRITICAL: The entire object (plate and food) MUST have heavy, thick, organic watercolor-style outlines in dark warm brown. The outlines should feel painterly, weighty, and hand-drawn, NOT sharp vector lines. Soft, hand-painted watercolor textures for the food, making it look glowing, juicy, and appetizing.

UI Element: Add a distinct drop shadow directly underneath the plate to make it look like a pop-up 3D UI sticker. ONLY the plate of food. NO table, NO chopsticks, NO background details. Pure solid white background only.
```

**食材 Prompt**
```
A 2D game UI asset icon of 【a single chunky piece of raw pork】. Pure solid white background. Camera & Composition: 45-degree angle view (3/4 perspective) or slightly top-down. The ingredient should be a single, distinct object. Make the shape slightly deformed, chunky, round, and cute (Cartoonish proportions). Art Style & Outlines: Studio Ghibli 1990s anime food style. Soft, hand-painted watercolor textures. CRITICAL: The entire object MUST have a heavy, thick, organic watercolor-style outline in dark warm brown (exactly matching the art style of a Ghibli food illustration). The outlines should feel painterly and weighty. UI Element: Add a distinct, tight drop shadow directly underneath the ingredient to make it look like a pop-up 3D UI sticker. NO table, NO background details. Pure solid white background only.
```

---

## 三、原型与原始策划的差异

| 策划内容 | 原型现状 |
|---|---|
| 游戏名《寻味之旅》 | 更名为“吃” |
| Godot 引擎 | 先用网页原型验证；数据格式已按 JSON 设计，可直接迁移 |
| 风味罗盘调味 | 暂不做，改为“自由组合猜配方 + 购买菜谱” |
| 控火 QTE | 暂不做 |
| 北京 5000 金币解锁 | 原型为 2000（加快测试节奏），可在数据文件里改 |
| AI 水彩插画 | emoji 占位；3D 翻书动画用简化的卡片翻转代替 |
| 零惩罚机制 | ✅ 已实现：猜错全额退还食材并给提示 |
| 挂机与现实时间同步 | ✅ 已实现：含离线收益 |
| 图鉴永久增加秒收益 | ✅ 已实现 |

---

## 四、开发说明

### 本地运行
直接双击 `index.html` 用浏览器打开，无需安装任何东西。
- 网址后加 `?debug`（如 `index.html?debug`）会出现“+5000 金币”调试按钮。
- 页面底部“重置存档”点两次可清空进度。

### 修改数值
所有数值都在 `data/game.js`：初始金币、基础收益、离线收益上限、城市开通价与经纬度、食材价格、菜谱配方、提示文案、菜谱价格、每道菜的收益与介绍。
等号后面是标准 JSON，迁移 Godot 时可原样复制为 `game.json`。

### 文件结构
| 文件 | 作用 |
|---|---|
| `index.html` | 页面结构（开始界面 + 地图/集市/厨房/手帐） |
| `style.css` | 治愈系手帐风样式 |
| `game.js` | 游戏逻辑：挂机、存档、地图、集市、厨房、手帐 |
| `worldmap.js` | 手绘风世界地图（简化大陆轮廓 + 城市图钉 + 航线） |
| `data/game.js` | 游戏数据（JSON） |

### 部署
网站通过 GitHub Pages 从 `main` 分支根目录发布，推送到 `main` 后约 1 分钟自动更新。

---

## 五、后续计划
- [ ] 用上方 prompt 生成菜品与食材图片，替换 emoji
- [ ] 风味罗盘（咸-甜 / 酸-辣 坐标轴）
- [ ] 控火 QTE
- [ ] 更多城市与菜品，完善数值曲线
- [ ] 迁移 Godot，打包 Steam 版本
