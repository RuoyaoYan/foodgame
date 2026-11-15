🎮 **在线试玩：https://ruoyaoyan.github.io/foodgame/**

# 吃

一款融合“放置经营”“食材探索”与“猜配方”的休闲图鉴收集游戏。本仓库目前是 **网页原型 v0.4（水彩 + 描边手帐风；我的家 / 农场 / 店铺）**，用来验证核心循环；正式版计划用 Godot 制作并在 Steam 发行。

- [一、当前原型（已实现）](#一当前原型已实现)
- [二、原始策划文档](#二原始策划文档)
- [三、原型与原始策划的差异](#三原型与原始策划的差异)
- [四、开发说明](#四开发说明)
- [五、后续计划](#五后续计划)

---

## 一、当前原型（已实现）

### 核心循环
**农场种养 / 集市进货 → 厨房猜配方研发新菜、批量出餐 → 店铺货架自动卖菜赚金币 → 开通新城市、扩建货架、买家具**

界面底部是导航栏：🏠 我的家 · 🌾 农场 · 🍳 厨房 · 🏪 店铺 · 🗺️ 地图（集市从地图上的城市进入）。

### 画风：水彩 + 描边手帐风
- 纸张纹理背景、横线手帐页、手绘抖动的深棕描边（SVG 滤镜实现）。
- 卡片像贴在手帐上的纸片，顶部有和纸胶带，略微倾斜。
- 食材和菜品显示为“水彩贴纸”：水彩晕染底色 + 白边 + 棕色描边。
- 世界地图为水彩晕染的海洋与陆地，配手绘指南针；底部导航是一排水彩书签；开始界面有水彩泼溅。

### 图片接入
- 食材图放 `images/ingredients/<食材id>.png`，菜品图放 `images/dishes/<菜品id>.png`，刷新即自动替换 emoji。
- 详细 id 列表见 [`images/README.md`](images/README.md)。

### 开始界面
- 大字标题“吃”，背景飘落食物，“开始旅程 / 继续旅程”按钮。
- 有存档时显示进度概况（图鉴收集数、到过的城市、金币），并提供“重新开始”（点两次确认）。
- 游戏中点左上角“吃”可回到开始界面。

### 1. 🏠 我的家
- **水彩小房间**：买下的家具会摆进房间。
- **菜品图鉴**：6 道菜的卡片。未解锁显示一句提示，买过菜谱显示完整配方，解锁后显示历史渊源与售价。
- **食材图鉴**：见过（买过或收获过）的食材会点亮，显示产地、集市价格和用在哪些已研发的菜里。
- **仓库**：成菜库存与食材库存。
- **家具**：花金币买家具，每件带一点小加成。
- **设置**：背景音乐 / 音效开关（素材尚未加入，先记住选择）、回到开始界面、重置存档（点两次确认）、关于。

| 家具 | 价格 | 加成 |
|---|---|---|
| 🪴 小盆栽 | 150 | 农场生长 +5% |
| 🪑 木餐桌 | 300 | 卖价 +5% |
| 🏺 腌菜坛子 | 500 | 农场生长 +10% |
| 📚 竹书架 | 700 | 顾客速度 +10% |
| 🐱 招财猫 | 1200 | 顾客速度 +15% |
| 🏮 暖黄吊灯 | 2000 | 卖价 +10% |

### 2. 🌾 农场
- 2 块菜地 + 2 个畜栏。花少量金币种下/养上，按现实时间生长（关掉页面也会长），成熟后点“收获”进仓库，比集市便宜。
- **受城市限制**：开通对应城市后才能种养。

| 项目 | 位置 | 需要城市 | 成本 | 时间 | 产出 |
|---|---|---|---|---|---|
| 🐖 养猪 | 畜栏 | 成都 | 30 | 3 分钟 | 猪肉末 ×4 |
| 🌱 种黄瓜 | 菜地 | 北京 | 20 | 2 分钟 | 黄瓜丝 ×4 |
| 🐔 养鸡 | 畜栏 | 罗马 | 60 | 2 分 30 秒 | 鸡蛋黄 ×4 |

### 3. 🍳 厨房
- 点击或拖动背包里的食材进锅，点“下锅！”。组合正好等于某道菜的配方就研发成功（不看顺序，每种食材放一份），并做好第 1 份成菜。
- **零惩罚**：猜错时食材全部退回，并给温馨提示——“好像少了点什么”、“有的食材是多余的”或“同一种食材放一份就够”。
- **已会做的菜**：研发过的菜可以一键出餐（做 1 份 / 全做），显示每种食材的库存，缺的标红。

### 4. 🏪 店铺
- 初始 3 个货架，每个货架摆一种菜，最多 10 份。
- 顾客自动来买：每个货架约每 10 秒卖出一份（家具可加速），**关掉页面也继续卖**（最多结算 12 小时）。
- 卖光后显示“已售罄”，可以补货或撤下；可花金币扩建货架（600 / 1500 / 4000，最多 6 个）。
- **金币只来自店铺卖菜**（已去掉原来的每秒自动产金币）。回到游戏时会弹窗告诉你离开期间卖了多少、农场有几处可以收获。

| 城市 | 菜品 | 配方 | 菜谱价格 | 售价 |
|---|---|---|---|---|
| 成都 | 麻婆豆腐 | 嫩豆腐 + 猪肉末 + 郫县豆瓣酱 + 汉源花椒 | 80 | 70 |
| 成都 | 回锅肉 | 猪五花 + 郫县豆瓣酱 + 青蒜 | 80 | 60 |
| 北京 | 老北京炸酱面 | 手擀面 + 六必居黄酱 + 猪肉末 + 黄瓜丝 | 300 | 160 |
| 北京 | 京酱肉丝 | 猪里脊 + 甜面酱 + 章丘大葱 + 豆腐皮 | 300 | 200 |
| 罗马 | 罗马卡邦尼意面 | 意大利面 + 鸡蛋黄 + 风干猪颊肉 + 佩科里诺奶酪 + 黑胡椒 | 800 | 450 |
| 罗马 | 黑胡椒奶酪面 | 意大利面 + 佩科里诺奶酪 + 黑胡椒 | 800 | 280 |

### 5. 🗺️ 地图与集市
- 手绘水彩世界地图，城市以图钉标出：成都、北京、罗马。已开通的航线以从成都出发的动态虚线显示。
- 点击城市：已开通的“逛集市”，未开通的花金币“开通航线”（开通后对应的农场项目也会解锁）。
- 集市按份卖当地食材（买 1 / 买 5）；**各城市的食材可以混在一起用**；菜谱铺可买菜谱看完整配方。

| 城市 | 开通费用 | 食材（单价） |
|---|---|---|
| 🐼 成都 | 初始城市 | 嫩豆腐 5、猪肉末 10、猪五花 12、郫县豆瓣酱 8、汉源花椒 8、青蒜 5 |
| 🏯 北京 | 2000 | 手擀面 20、六必居黄酱 25、黄瓜丝 15、猪里脊 30、甜面酱 20、章丘大葱 15、豆腐皮 18 |
| 🏛️ 罗马 | 8000 | 意大利面 40、鸡蛋黄 30、风干猪颊肉 60、佩科里诺奶酪 50、黑胡椒 30 |

### 原型阶段已确认的决策
| 问题 | 决定 |
|---|---|
| 原型技术 | 先做网页原型（HTML/JS），验证好玩法和数值再迁移 Godot |
| 范围 | 三个城市：成都、北京、罗马 |
| 食材 | 每个城市解锁各自的食材，所有食材可以混合使用；按份购买，做菜消耗 |
| 风味罗盘 | 暂不加入，重点放在食材收集与图鉴解锁 |
| 做菜方式 | 自由组合猜配方为主，加入“购买菜谱”功能 |
| 控火 QTE | 暂不加入 |
| 美术 | 水彩 + 描边手帐风界面；食材/菜品图由策划用 AI 生成后放入 `images/`，缺图时显示水彩贴纸 emoji |
| 存档 | 浏览器本地存档，离线时店铺继续卖、农场继续长 |
| 名称 | 游戏名为“吃” |
| 语言 | 暂时只做中文 |
| 收入来源 | 去掉每秒自动产金币，金币只来自店铺卖菜 |
| 店铺 | 货架自动售卖，可扩建 |
| 农场 | 种植 + 养殖，受城市限制；目前有黄瓜、猪肉、鸡蛋，更多待策划补充 |
| 我的家 | 图鉴（菜品 + 食材）、设置、仓库、家具装饰 |
| 家具 | 以装饰为主，每件带小加成 |
| 导航 | 底部导航栏 |

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
| AI 水彩插画 | 界面已改为水彩手帐风并预留图片位置，等待 AI 生成图片；3D 翻书动画用简化的卡片翻转代替 |
| 零惩罚机制 | ✅ 已实现：猜错全额退还食材并给提示 |
| 挂机与现实时间同步 | ✅ 已实现：店铺离线继续卖、农场离线继续长 |
| 图鉴永久增加秒收益 | 改为：图鉴解锁菜品，金币来自店铺卖菜 |
| （新增） | 我的家、农场、店铺、家具 |

---

## 四、开发说明

### 本地运行
直接双击 `index.html` 用浏览器打开，无需安装任何东西。
- 网址后加 `?debug`（如 `index.html?debug`），在“我的家 → 设置”里会出现调试按钮：“+5000 金币”和“时间快进 5 分钟”。
- “我的家 → 设置 → 重置存档”点两次可清空进度。

### 修改数值
所有数值都在 `data/game.js`：初始金币、离线结算上限、货架数量/容量/售卖间隔/扩建价格、城市开通价与经纬度、食材价格、菜谱配方、提示文案、菜谱价格、售价、农场项目（城市/成本/时间/产量）、家具（价格/加成/房间位置）。
等号后面是标准 JSON，迁移 Godot 时可原样复制为 `game.json`。

### 文件结构
| 文件 | 作用 |
|---|---|
| `index.html` | 页面结构（开始界面 + 我的家/农场/厨房/店铺/地图/集市 + 底部导航） |
| `style.css` | 治愈系手帐风样式 |
| `game.js` | 游戏逻辑：存档与离线结算、我的家、农场、厨房、店铺、地图、集市 |
| `worldmap.js` | 手绘风世界地图（简化大陆轮廓 + 城市图钉 + 航线） |
| `data/game.js` | 游戏数据（JSON） |
| `images/` | 食材与菜品图片（按 id 命名） |

### 部署
网站通过 GitHub Pages 从 `gh-pages` 分支发布。开发在 `main` 上进行，发布时执行：
```bash
git push origin main:gh-pages
```
约 1 分钟后网址自动更新。（也可以在 Settings → Pages 把来源改成 `main` 分支，之后只推 `main` 即可。）

---

## 五、后续计划
- [x] 水彩 + 描边手帐风界面
- [x] 我的家 / 农场 / 店铺 / 家具
- [ ] 农场补充更多种养项目（待策划提供）
- [ ] 背景音乐与音效
- [ ] 用上方 prompt 生成菜品与食材图片，放入 `images/`
- [ ] 风味罗盘（咸-甜 / 酸-辣 坐标轴）
- [ ] 控火 QTE
- [ ] 更多城市与菜品，完善数值曲线
- [ ] 迁移 Godot，打包 Steam 版本
