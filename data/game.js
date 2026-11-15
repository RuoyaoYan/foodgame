// 《吃》游戏数据 —— 策划可直接修改这里的数值，无需改代码。
// 等号后面是标准 JSON，将来迁移 Godot 时可原样复制为 game.json。
// 城市的 lat/lon 为经纬度，决定世界地图上图钉的位置。
window.GAME_DATA = {
  "config": {
    "startGold": 120,
    "offlineCapHours": 12,
    "startCity": "chengdu"
  },

  "shop": {
    "startShelves": 3,
    "shelfCapacity": 10,
    "sellIntervalSec": 10,
    "expandCosts": [600, 1500, 4000]
  },

  "cities": [
    { "id": "chengdu", "name": "成都", "emoji": "🐼", "unlockCost": 0,
      "lat": 30.7, "lon": 104.1, "desc": "天府之国，麻辣鲜香。" },
    { "id": "beijing", "name": "北京", "emoji": "🏯", "unlockCost": 2000,
      "lat": 39.9, "lon": 116.4, "desc": "皇城根下，酱香浓郁。" },
    { "id": "rome", "name": "罗马", "emoji": "🏛️", "unlockCost": 8000,
      "lat": 41.9, "lon": 12.5, "desc": "永恒之城，一碗面的艺术。" }
  ],

  "methods": [
    { "id": "grind",   "name": "磨",   "emoji": "🪨" },
    { "id": "ferment", "name": "发酵", "emoji": "🫙" },
    { "id": "roll",    "name": "擀",   "emoji": "🥢" },
    { "id": "cure",    "name": "风干", "emoji": "🌬️" },
    { "id": "stirfry", "name": "炒",   "emoji": "🔥" },
    { "id": "boil",    "name": "煮",   "emoji": "🍲" }
  ],

  "ingredients": [
    { "id": "soybean",        "kind": "raw", "name": "黄豆",   "emoji": "🫘", "city": "chengdu", "price": 3 },
    { "id": "pork",           "kind": "raw", "name": "猪肉",   "emoji": "🥩", "city": "chengdu", "price": 10 },
    { "id": "chili",          "kind": "raw", "name": "辣椒",   "emoji": "🌶️", "city": "chengdu", "price": 4 },
    { "id": "sichuan_pepper", "kind": "raw", "name": "花椒",   "emoji": "🟤", "city": "chengdu", "price": 6 },
    { "id": "broad_bean",     "kind": "raw", "name": "蚕豆",   "emoji": "🫛", "city": "chengdu", "price": 3 },
    { "id": "garlic_sprout",  "kind": "raw", "name": "青蒜",   "emoji": "🌿", "city": "chengdu", "price": 4 },

    { "id": "wheat",          "kind": "raw", "name": "小麦",   "emoji": "🌾", "city": "beijing", "price": 4 },
    { "id": "cucumber",       "kind": "raw", "name": "黄瓜",   "emoji": "🥒", "city": "beijing", "price": 6 },
    { "id": "scallion",       "kind": "raw", "name": "大葱",   "emoji": "🧅", "city": "beijing", "price": 6 },

    { "id": "egg",            "kind": "raw", "name": "鸡蛋",   "emoji": "🥚", "city": "rome", "price": 8 },
    { "id": "sheep_milk",     "kind": "raw", "name": "羊奶",   "emoji": "🥛", "city": "rome", "price": 12 },
    { "id": "black_pepper",   "kind": "raw", "name": "黑胡椒", "emoji": "⚫", "city": "rome", "price": 10 },

    { "id": "tofu",        "kind": "processed", "name": "豆腐",         "emoji": "⬜",
      "inputs": ["soybean"], "method": "grind", "yield": 2,
      "hint": "把一种豆子磨成浆，点卤凝成白白嫩嫩的方块。",
      "desc": "黄豆磨浆、煮沸、点卤而成。嫩豆腐、老豆腐、豆腐皮，都从这里开始。" },
    { "id": "doubanjiang", "kind": "processed", "name": "郫县豆瓣酱",   "emoji": "🫙",
      "inputs": ["broad_bean", "chili"], "method": "ferment", "yield": 2,
      "hint": "一种豆子配上红红的辣，交给时间慢慢酿。",
      "desc": "“川菜之魂”。蚕豆瓣与二荆条辣椒同缸发酵，晒足日头，红亮酱香。" },
    { "id": "yellow_paste","kind": "processed", "name": "六必居黄酱",   "emoji": "🟫",
      "inputs": ["soybean", "wheat"], "method": "ferment", "yield": 2,
      "hint": "豆子和麦子一起，在酱缸里发酵出浓浓的酱香。",
      "desc": "黄豆与面粉制曲发酵，北京老字号六必居的招牌，炸酱面离不开它。" },
    { "id": "noodles",     "kind": "processed", "name": "面条",         "emoji": "🍜",
      "inputs": ["wheat"], "method": "roll", "yield": 2,
      "hint": "只要一种谷物，揉成面团，擀开切条。",
      "desc": "小麦面粉加水揉面，擀薄切条，筋道爽滑。" },
    { "id": "spaghetti",   "kind": "processed", "name": "意大利面",     "emoji": "🍝",
      "inputs": ["wheat", "egg"], "method": "roll", "yield": 2,
      "hint": "谷物加上一样金黄的东西，擀出意大利风味的面。",
      "desc": "面粉与鸡蛋揉成金黄面团，擀压成条，是罗马面食的基础。" },
    { "id": "pecorino",    "kind": "processed", "name": "佩科里诺奶酪", "emoji": "🧀",
      "inputs": ["sheep_milk"], "method": "ferment", "yield": 1,
      "hint": "羊身上来的白色液体，发酵成咸香的硬块。",
      "desc": "Pecorino Romano，用羊奶制成的硬质奶酪，咸香浓郁，罗马人的心头好。" },
    { "id": "guanciale",   "kind": "processed", "name": "风干猪颊肉",   "emoji": "🥓",
      "inputs": ["pork", "black_pepper"], "method": "cure", "yield": 2,
      "hint": "一块肉撒满黑色的香料，挂起来交给风。",
      "desc": "Guanciale，猪颊肉以盐和黑胡椒腌制后风干，油脂丰润。" }
  ],

  "dishes": [
    { "id": "mapo_tofu", "name": "麻婆豆腐", "emoji": "🌶️", "city": "chengdu",
      "ingredients": ["tofu", "pork", "doubanjiang", "sichuan_pepper"], "method": "stirfry",
      "hint": "麻、辣、烫——嫩白的方块与碎肉在红油里相遇，下锅一炒。",
      "recipePrice": 80, "sellPrice": 60,
      "story": "相传清末成都北郊万福桥边，一位脸上有麻点的陈姓老板娘为过路挑夫烧豆腐，麻辣鲜香，人称“陈麻婆豆腐”。" },
    { "id": "twice_cooked_pork", "name": "回锅肉", "emoji": "🥘", "city": "chengdu",
      "ingredients": ["pork", "doubanjiang", "garlic_sprout"], "method": "stirfry",
      "hint": "肥瘦相连的肉片配一勺红酱、一抹绿，大火爆炒。",
      "recipePrice": 80, "sellPrice": 50,
      "story": "四川人家祭祀后把煮过的肉“回锅”再炒，因此得名。被誉为“川菜之首”，讲究肉片炒至卷曲如灯盏。" },

    { "id": "zhajiangmian", "name": "老北京炸酱面", "emoji": "🍜", "city": "beijing",
      "ingredients": ["noodles", "yellow_paste", "pork", "cucumber"], "method": "boil",
      "hint": "一锅水煮面，浇一勺酱和碎肉，再码上清脆的绿丝。",
      "recipePrice": 300, "sellPrice": 120,
      "story": "北京人讲究“菜码”，春有香椿、夏有黄瓜。炸酱要小火慢熬，酱香与肉香融为一体。" },
    { "id": "jingjiang_rousi", "name": "京酱肉丝", "emoji": "🌯", "city": "beijing",
      "ingredients": ["pork", "scallion", "tofu"], "method": "stirfry",
      "hint": "肉丝炒香，大葱作伴，用豆制的薄皮卷起来吃。",
      "recipePrice": 300, "sellPrice": 140,
      "story": "据说源自一位老人为孙子用豆腐皮卷酱肉丝与葱丝，后被厨师改良，成为北京家常名菜。" },

    { "id": "carbonara", "name": "罗马卡邦尼意面", "emoji": "🍝", "city": "rome",
      "ingredients": ["spaghetti", "egg", "guanciale", "pecorino", "black_pepper"], "method": "boil",
      "hint": "煮好的面拌上金黄蛋液、咸香猪颊肉、羊奶酪与黑胡椒——不放奶油！",
      "recipePrice": 800, "sellPrice": 380,
      "story": "正宗罗马做法只用蛋黄、猪颊肉、佩科里诺奶酪与黑胡椒，靠余温让蛋液变成丝滑酱汁。" },
    { "id": "cacio_e_pepe", "name": "黑胡椒奶酪面", "emoji": "🧀", "city": "rome",
      "ingredients": ["spaghetti", "pecorino", "black_pepper"], "method": "boil",
      "hint": "极简的三样：煮好的面、羊奶酪、胡椒。少即是多。",
      "recipePrice": 800, "sellPrice": 260,
      "story": "Cacio e Pepe 源自罗马牧羊人，干粮只需奶酪与胡椒便于携带，是罗马最古老的面食之一。" }
  ],

  "farm": {
    "fieldPlots": 2,
    "pens": 2,
    "fieldExpandCosts": [300, 1000, 3000],
    "penExpandCosts": [400, 1200, 3500],
    "upgradeCosts": [150, 400, 1000, 2500],
    "levelSpeedBonus": 0.5,
    "baseCap": 5,
    "capPerLevel": 5,
    "items": [
      { "id": "farm_pork",     "type": "animal", "name": "猪",   "emoji": "🐖", "produces": "pork",     "city": "chengdu", "produceSec": 40 },
      { "id": "farm_cucumber", "type": "crop",   "name": "黄瓜", "emoji": "🌱", "produces": "cucumber", "city": "beijing", "produceSec": 20 },
      { "id": "farm_egg",      "type": "animal", "name": "鸡",   "emoji": "🐔", "produces": "egg",      "city": "rome",    "produceSec": 30 }
    ]
  },

  "furniture": [
    { "id": "plant",    "name": "小盆栽",   "emoji": "🪴", "price": 150,  "effect": "farmSpeed",  "value": 0.05, "x": 12, "y": 62 },
    { "id": "table",    "name": "木餐桌",   "emoji": "🪑", "price": 300,  "effect": "sellPrice",  "value": 0.05, "x": 40, "y": 70 },
    { "id": "jar",      "name": "腌菜坛子", "emoji": "🏺", "price": 500,  "effect": "farmSpeed",  "value": 0.10, "x": 80, "y": 68 },
    { "id": "shelf",    "name": "竹书架",   "emoji": "📚", "price": 700,  "effect": "sellSpeed",  "value": 0.10, "x": 70, "y": 30 },
    { "id": "lucky_cat","name": "招财猫",   "emoji": "🐱", "price": 1200, "effect": "sellSpeed",  "value": 0.15, "x": 24, "y": 34 },
    { "id": "lamp",     "name": "暖黄吊灯", "emoji": "🏮", "price": 2000, "effect": "sellPrice",  "value": 0.10, "x": 50, "y": 10 }
  ]
};
