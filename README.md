🎮 **在线试玩：https://ruoyaoyan.github.io/foodgame/**

# 吃

一款融合“放置经营”“食材探索”与“猜配方”的休闲图鉴收集游戏。本仓库目前是 **网页原型 v0.6（水彩手帐风；我的家 / 农场 / 厨房 / 店铺；面粉类、畜产类、农作物类开发中）**，用来验证核心循环；正式版计划用 Godot 制作并在 Steam 发行。

- [一、当前原型（已实现）](#一当前原型已实现)
- [二、原始策划文档](#二原始策划文档)
- [三、原型与原始策划的差异](#三原型与原始策划的差异)
- [四、开发说明](#四开发说明)
- [五、后续计划](#五后续计划)
- [六、参考：《洋果子店》食材分类](#六参考洋果子店食材分类)

---

## 一、当前原型（已实现）

### 核心循环
**农场持续产出 / 集市进货原材料 → 厨房选做法猜出加工品与菜品 → 店铺货架自动卖菜赚金币 → 开通新城市、升级农场、扩建货架、买家具**

界面底部是导航栏：🏠 我的家 · 🌾 农场 · 🍳 厨房 · 🏪 店铺 · 🗺️ 地图（集市从地图上的城市进入）。

### 画风：水彩 + 描边手帐风
- 纸张纹理背景、横线手帐页、手绘抖动的深棕描边（SVG 滤镜实现）。
- 卡片像贴在手帐上的纸片，顶部有和纸胶带，略微倾斜。
- 食材和菜品显示为“水彩贴纸”：水彩晕染底色 + 白边 + 棕色描边。
- 世界地图为水彩晕染的海洋与陆地，配手绘指南针；底部导航是一排水彩书签；开始界面有水彩泼溅。
- 字体：大标题“吃”用毛笔字（只加载这一个字），其余文字用电脑自带的楷体，不依赖网络、不会缺字。

### 图片接入
- 食材图（含加工品）放 `images/ingredients/<食材id>.png`，菜品图放 `images/dishes/<菜品id>.png`，刷新即自动替换 emoji。
- 详细 id 列表见 [`images/README.md`](images/README.md)。

### 开始界面
- 大字标题“吃”，背景飘落食物，“开始旅程 / 继续旅程”按钮。
- 有存档时显示进度概况（图鉴收集数、到过的城市、金币），并提供“重新开始”（点两次确认）。
- 游戏中点左上角“吃”可回到开始界面。

### 1. 🏠 我的家
- **水彩小房间**：买下的家具会摆进房间。
- **菜品图鉴**：6 道菜。未解锁显示一句提示，买过菜谱显示完整配方（含做法），解锁后显示历史渊源与售价。
- **食材图鉴**：按《洋果子店》的分类分页显示（面粉 / 畜产 / 农作物 / 其他，以后可加生果），每类再分“原本有的”和“需要自己做的”。原材料买过或收获过就点亮；加工品研发出来才点亮，未研发时显示提示。标着 🚧 的是**开发中**条目。
- **仓库**：成菜库存与食材库存。
- **家具**：花金币买家具，每件带一点小加成。
- **设置**：背景音乐 / 音效开关（素材尚未加入，先记住选择）、**开发者视图**（图鉴里显示所有条目和配方）、回到开始界面、重置存档（点两次确认）、关于。

| 家具 | 价格 | 加成 |
|---|---|---|
| 🪴 小盆栽 | 150 | 农场生长 +5% |
| 🪑 木餐桌 | 300 | 卖价 +5% |
| 🏺 腌菜坛子 | 500 | 农场生长 +10% |
| 📚 竹书架 | 700 | 顾客速度 +10% |
| 🐱 招财猫 | 1200 | 顾客速度 +15% |
| 🏮 暖黄吊灯 | 2000 | 卖价 +10% |

### 2. 🌾 农场（参考《洋果子店》）
- 每块地**选一次**种 / 养什么，之后**持续产出**原材料（关掉页面也会产），产出攒在地里，满了就停，点“收取”或“一键收取”放进仓库。可以随时换种 / 换养。
- **升级**地块（Lv.1 → Lv.5，🪙150 / 400 / 1000 / 2500）：每级产出速度 +50%，能攒的上限 +5 份。
- **扩建**：菜地 2 → 5 块（🪙300 / 1000 / 3000），畜栏 2 → 5 个（🪙400 / 1200 / 3500）。
- **受城市限制**：开通对应城市后才能种养。

| 项目 | 位置 | 需要城市 | 产出 | Lv.1 速度 |
|---|---|---|---|---|
| 🐖 猪 | 畜栏 | 成都 | 猪肉 | 每 40 秒 1 份 |
| 🌱 黄瓜 | 菜地 | 北京 | 黄瓜 | 每 20 秒 1 份 |
| 🐔 鸡 | 畜栏 | 罗马 | 鸡蛋 | 每 30 秒 1 份 |

### 3. 🍳 厨房
- **集市和农场只有未经加工的原材料**；豆腐、酱、面这类加工品要在厨房里自己做。
- 把食材放进锅里，再在锅边选一个**做法**：🪨磨 · 🫙发酵 · 🥢擀 · 🌬️风干 · 🔥炒 · 🍲煮，点“下锅！”。
- **加工品和菜品都要自己猜**：食材组合 + 做法都对才成功。加工品每次产 1–2 份进背包；菜品产 1 份成菜，可拿去店铺卖。
- **零惩罚**：猜错时食材全部退回，并给温馨提示——“食材对了但做法不对”、“好像少了点什么”、“有的食材是多余的”或“同一种食材放一份就够”。
- **已会做的**：研发过的加工品和菜品可以一键做（做 1 次 / 全做），缺的食材标红。

**原材料**（集市卖；🌾 = 农场也能产）

| 城市 | 原材料（单价） |
|---|---|
| 🐼 成都 | 黄豆 3、猪肉 10 🌾、辣椒 4、花椒 6、蚕豆 3、青蒜 4 |
| 🏯 北京 | 小麦 4、黄瓜 6 🌾、大葱 6 |
| 🏛️ 罗马 | 鸡蛋 8 🌾、羊奶 12、黑胡椒 10 |

**加工品**（要自己猜出来）

| 加工品 | 分类 | 配方 | 做法 | 产量 |
|---|---|---|---|---|
| 豆腐 | 农作物 | 黄豆 | 磨 | 2 |
| 郫县豆瓣酱 | 其他 | 蚕豆 + 辣椒 | 发酵 | 2 |
| 六必居黄酱 | 其他 | 黄豆 + 小麦 | 发酵 | 2 |
| 面条 | 面粉 | 小麦 | 擀 | 2 |
| 意大利面 | 面粉 | 小麦 + 鸡蛋 | 擀 | 2 |
| 佩科里诺奶酪 | 畜产 | 羊奶 | 发酵 | 1 |
| 风干猪颊肉 | 畜产 | 猪肉 + 黑胡椒 | 风干 | 2 |

**菜品**

| 城市 | 菜品 | 配方 | 做法 | 菜谱价格 | 售价 |
|---|---|---|---|---|---|
| 成都 | 麻婆豆腐 | 豆腐 + 猪肉 + 郫县豆瓣酱 + 花椒 | 炒 | 80 | 60 |
| 成都 | 回锅肉 | 猪肉 + 郫县豆瓣酱 + 青蒜 | 炒 | 80 | 50 |
| 北京 | 老北京炸酱面 | 面条 + 六必居黄酱 + 猪肉 + 黄瓜 | 煮 | 300 | 120 |
| 北京 | 京酱肉丝 | 猪肉 + 大葱 + 豆腐 | 炒 | 300 | 140 |
| 罗马 | 罗马卡邦尼意面 | 意大利面 + 鸡蛋 + 风干猪颊肉 + 佩科里诺奶酪 + 黑胡椒 | 煮 | 800 | 380 |
| 罗马 | 黑胡椒奶酪面 | 意大利面 + 佩科里诺奶酪 + 黑胡椒 | 煮 | 800 | 260 |

### 4. 🏪 店铺
- 初始 3 个货架，每个货架摆一种菜，最多 10 份。
- 顾客自动来买：每个货架约每 10 秒卖出一份（家具可加速），**关掉页面也继续卖**（最多结算 12 小时）。
- 卖光后显示“已售罄”，可以补货或撤下；可花金币扩建货架（600 / 1500 / 4000，最多 6 个）。
- **金币只来自店铺卖菜**。回到游戏时会弹窗告诉你离开期间卖了多少、农场攒了多少。

### 5. 🗺️ 地图与集市
- 手绘水彩世界地图，城市以图钉标出：成都（初始）、北京（🪙2000）、罗马（🪙8000）。已开通的航线以从成都出发的动态虚线显示。
- 点击城市：已开通的“逛集市”，未开通的花金币“开通航线”（开通后对应的农场项目也会解锁）。
- 集市按份卖当地原材料（买 1 / 买 5）；**各城市的食材可以混在一起用**；菜谱铺可买菜谱看完整配方。

### 6. 🌾 面粉类（开发中）
参考《洋果子店》的“粉类”，全部已加进食材图鉴（分类：面粉），标记为 🚧 开发中——还不能买、种或做，来源、价格、配方待定。打开“设置 → 开发者视图”可在图鉴里看到全部条目和参考配方。

**原本有的（12）**：小麦粉、鱼胶粉、白玉粉、葛粉（淀粉）、发粉、肉桂、牛油饼皮、蕨粉、黄豆粉、荞麦粉、酵母、咖喱粉

**需要自己做的（15）**

| 名称 | id | 《洋果子店》参考配方 |
|---|---|---|
| 塔皮 | tart_shell | 做曲奇时有机会顺带得到（副产品） |
| 米粉 | rice_flour | 做仙贝、和果子时有机会顺带得到（副产品） |
| 法式面包 | french_bread | 硬面粉团 · 烤 |
| 泡芙 | choux | 做可丽饼时有机会顺带得到（副产品） |
| 生面团 | dough | 小麦粉 + 牛奶 + 酵母 · 发酵 |
| 硬面粉团 | hard_dough | 小麦粉 + 黑麦 + 天然酵母 · 发酵 |
| 最中的饼皮 | monaka_shell | 糯米 + 水 · 烤 |
| 披萨饼底 | pizza_base | 未查到 |
| 法式长棍面包 | baguette | 未查到 |
| 丹麦酥 | danish | 生面团 + 牛油饼皮 |
| 牛角面包 | croissant | 牛油 + 牛油 + 生面团 · 烤 |
| 热狗包 | hotdog_bun | 牛奶 + 生面团 · 烤 |
| 吐司 | toast | 牛奶 + 牛油 + 生面团 · 烤 |
| 贝果面团 | bagel_dough | 未查到 |
| 贝果 | bagel | 未查到 |

### 7. 🐄 畜产类（开发中）
参考《洋果子店》的“畜产”，全部已加进食材图鉴（分类：畜产）。原有的 **猪肉、鸡蛋** 保持可用（集市可买、农场可产）；**羊奶、佩科里诺奶酪、风干猪颊肉** 也归在畜产。其余标记为 🚧 开发中。

**原本有的（开发中 11）**

| 名称 | id | 名称 | id |
|---|---|---|---|
| 奶油 | cream | 焦糖 | caramel |
| 吉士 | custard | 香肠 | sausage |
| 牛奶 | milk | 培根 | bacon |
| 奶油起司 | cream_cheese | 鸡肉 | chicken |
| 牛油 | butter | 烤牛肉 | roast_beef |
| 炼奶 | condensed_milk | | |

（猪肉 pork、鸡蛋 egg 已可用）

**需要自己做的（开发中 2）**

| 名称 | id | 《洋果子店》参考配方 |
|---|---|---|
| 起司 | cheese | 牛奶 + 盐 + 水 · 发酵 |
| 优格 | yogurt | 牛奶 + 天然酵母 |

### 8. 🥬 农作物类（开发中）
参考《洋果子店》的“农作物”，全部已加进食材图鉴（分类：农作物）。原有的 **黄豆、蚕豆** 保持可用；辣椒、花椒、青蒜、小麦、黄瓜、大葱、黑胡椒、豆腐 也归在农作物。其余标记为 🚧 开发中。

**原本有的（开发中 27）**

| 名称 | id | 名称 | id | 名称 | id |
|---|---|---|---|---|---|
| 红豆 | red_bean | 姜 | ginger | 黑麦 | rye |
| 米 | rice | 玉米 | corn | 杂菌 | mushroom |
| 糯米 | glutinous_rice | 黑芝麻 | black_sesame | 培茶 | hojicha |
| 抹茶 | matcha | 生菜 | lettuce | 薄荷 | mint |
| 红茶 | black_tea | 菠菜 | spinach | 食用玫瑰 | edible_rose |
| 咖啡豆 | coffee_bean | 番茄 | tomato | 燕麦片 | oats |
| 南瓜 | pumpkin | 胡萝卜 | carrot | 白腰豆 | white_kidney_bean |
| 红薯 | sweet_potato | 洋葱 | onion | 辛辣香料 | spicy_spice |
| 艾草 | mugwort | 马铃薯 | potato | 大蒜 | garlic |

（黄豆 soybean、蚕豆 broad_bean 已可用）

**需要自己做的（开发中 1）**

| 名称 | id | 《洋果子店》参考 |
|---|---|---|
| 豆浆 | soy_milk | 做含黄豆的食物时有机会顺带得到（副产品） |

**启用一个开发中条目**：在 `data/game.js` 里找到它，删掉 `"todo": true`，然后——
- 原本有的：补上 `"city"`（哪个城市的集市卖）和 `"price"`；
- 需要自己做的：补上 `"inputs"`（原料 id 列表）、`"method"`（做法 id）、`"yield"`（产量）、`"hint"`（未解锁时的提示）。

### 原型阶段已确认的决策
| 问题 | 决定 |
|---|---|
| 原型技术 | 先做网页原型（HTML/JS），验证好玩法和数值再迁移 Godot |
| 范围 | 三个城市：成都、北京、罗马 |
| 食材 | 集市和农场只有未经加工的原材料；加工品在厨房里自己做；各城市食材可以混用；按份购买，做菜消耗 |
| 食材分类 | 参考《洋果子店》：面粉、畜产、农作物、生果、其他；面粉类、畜产类、农作物类已按策划清单进图鉴（开发中） |
| 豆腐 / 酱 / 面 | 豆腐只有一种（嫩豆腐、老豆腐、豆腐皮都算豆腐）；去掉甜面酱；手擀面就是面条；猪肉末、猪五花、猪里脊统一为猪肉 |
| 京酱肉丝 | 不用酱：猪肉 + 大葱 + 豆腐 · 炒 |
| 做菜方式 | 食材组合 + 做法都要猜；可购买菜谱 |
| 风味罗盘 / 控火 QTE | 暂不加入 |
| 美术 | 水彩 + 描边手帐风界面；食材/菜品图由策划用 AI 生成后放入 `images/`，缺图时显示水彩贴纸 emoji |
| 字体 | 毛笔字只用于标题“吃”，其余用系统楷体（修复“回”字不显示） |
| 存档 | 浏览器本地存档，离线时店铺继续卖、农场继续产 |
| 名称 / 语言 | 游戏名为“吃”；暂时只做中文 |
| 收入来源 | 去掉每秒自动产金币，金币只来自店铺卖菜 |
| 店铺 | 货架自动售卖，可扩建 |
| 农场 | 参考《洋果子店》：选一次持续产出、攒在地里、升级、扩建；受城市限制；目前有猪、黄瓜、鸡 |
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
| 风味罗盘调味 | 暂不做，改为“猜食材组合 + 做法 + 购买菜谱” |
| 控火 QTE | 暂不做（做法按钮里的“炒 / 煮”先代替烹饪步骤） |
| 北京 5000 金币解锁 | 原型为 2000（加快测试节奏），可在数据文件里改 |
| AI 水彩插画 | 界面已改为水彩手帐风并预留图片位置，等待 AI 生成图片；3D 翻书动画用简化的卡片翻转代替 |
| 零惩罚机制 | ✅ 已实现：猜错全额退还食材并给提示 |
| 挂机与现实时间同步 | ✅ 已实现：店铺离线继续卖、农场离线继续长 |
| 图鉴永久增加秒收益 | 改为：图鉴解锁菜品，金币来自店铺卖菜 |
| 本地集市进货原子食材 | ✅ 集市只卖原材料；加工品在厨房自己做 |
| （新增） | 我的家、农场、店铺、家具、食材分类图鉴 |

---

## 四、开发说明

### 本地运行
直接双击 `index.html` 用浏览器打开，无需安装任何东西。
- 网址后加 `?debug`（如 `index.html?debug`），在“我的家 → 设置”里会出现调试按钮：“+5000 金币”和“时间快进 5 分钟”。
- “我的家 → 设置 → 开发者视图”打开后，图鉴里所有条目、配方都可见。
- “我的家 → 设置 → 重置存档”点两次可清空进度。

### 修改数值
所有数值都在 `data/game.js`：初始金币、离线结算上限、货架数量/容量/售卖间隔/扩建价格、城市开通价与经纬度、食材分类、做法、原材料（城市/价格）、加工品与菜品配方（原料/做法/产量/提示）、菜谱价格、售价、农场（地块数/扩建/升级价格、每级加成、产出速度）、家具（价格/加成/房间位置）。
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
- [x] 原材料 + 加工品 + 做法；洋果子店式农场
- [x] 食材分类图鉴；面粉类 27 种、畜产类 13 种、农作物类 28 种进图鉴（开发中）
- [ ] 面粉类、畜产类、农作物类：定来源、价格、配方，启用
- [ ] 其余分类（生果、其他）按《洋果子店》补充
- [ ] 农场补充更多种养项目（待策划提供）
- [ ] 背景音乐与音效
- [ ] 用上方 prompt 生成菜品与食材图片，放入 `images/`
- [ ] 风味罗盘（咸-甜 / 酸-辣 坐标轴）
- [ ] 控火 QTE
- [ ] 更多城市与菜品，完善数值曲线
- [ ] 迁移 Godot，打包 Steam 版本

---

## 六、参考：《洋果子店》食材分类
整理自《洋果子店ROSE～面包店也开幕了～》玩家攻略，供策划参考（游戏持续更新，可能不全）。

| 分类 | 食材 |
|---|---|
| 粉类 | 小麦粉、鱼胶粉、白玉粉、葛粉、发粉、肉桂、牛油饼皮、塔皮*、蕨粉、黄豆粉、荞麦粉、日本米粉*、法式面包、泡芙*、酵母、咖喱粉；需制作：生面团、硬面粉团、最中的饼皮、披萨饼底、法式长棍面包、丹麦酥、牛角面包、热狗面包、吐司、贝果面团、贝果 |
| 畜产 | 奶油、吉士、牛奶、奶油起司、鸡蛋、牛油、焦糖、香肠、起司（制作）、培根、鸡肉、猪肉、烤牛肉、炼奶、优格（制作） |
| 农作物 | 红豆、米、糯米、豆浆*、抹茶、红茶、咖啡豆、南瓜、红薯、黄豆、艾草、马铃薯、姜、玉米、黑芝麻、生菜、菠菜、番茄、胡萝卜、洋葱、黑麦、蚕豆、杂菌、薄荷、食用玫瑰 |
| 生果 | 杏仁、栗子、草莓、苹果、蜜瓜、橙子、可可、香蕉、芒果、柠檬、蓝莓、水蜜桃、葡萄、西柚、覆盆子、樱桃、梅、混合果仁、香草、牛油果、蔓越莓、菠萝、白草莓、麝香葡萄、西洋梨 |
| 其他 | 寒天、白玉、砂糖、鲜虾、黑蜜、酱油、盐、海苔、法式清汤、水、白兰地、蜂蜜、樱花、和三盆、巧克力、生巧克力*、天然酵母、金箔、油腌鲱鱼、食用色素、麴、生面、杂果罐头、碳酸水、珍珠、橄榄油、明太子、鱼排 |

\* 副产品：做别的东西时有机会顺带得到。
