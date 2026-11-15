// 《寻味之旅》游戏数据 —— 策划可直接修改这里的数值，无需改代码。
// 注意：等号后面是标准 JSON，将来迁移 Godot 时可原样复制为 game.json。
window.GAME_DATA = {
  "config": {
    "startGold": 60,
    "baseIncome": 1,
    "offlineCapHours": 12,
    "startCity": "chengdu"
  },

  "cities": [
    { "id": "chengdu", "name": "成都", "emoji": "🐼", "unlockCost": 0,
      "desc": "天府之国，麻辣鲜香。" },
    { "id": "beijing", "name": "北京", "emoji": "🏯", "unlockCost": 2000,
      "desc": "皇城根下，酱香浓郁。" },
    { "id": "rome", "name": "罗马", "emoji": "🏛️", "unlockCost": 8000,
      "desc": "永恒之城，一碗面的艺术。" }
  ],

  "ingredients": [
    { "id": "tofu",        "name": "嫩豆腐",       "emoji": "⬜", "city": "chengdu", "price": 5 },
    { "id": "minced_pork", "name": "猪肉末",       "emoji": "🍖", "city": "chengdu", "price": 10 },
    { "id": "pork_belly",  "name": "猪五花",       "emoji": "🥓", "city": "chengdu", "price": 12 },
    { "id": "doubanjiang", "name": "郫县豆瓣酱",   "emoji": "🫙", "city": "chengdu", "price": 8 },
    { "id": "sichuan_pepper", "name": "汉源花椒", "emoji": "🟤", "city": "chengdu", "price": 8 },
    { "id": "garlic_sprout", "name": "青蒜",       "emoji": "🌿", "city": "chengdu", "price": 5 },

    { "id": "noodles",     "name": "手擀面",       "emoji": "🍜", "city": "beijing", "price": 20 },
    { "id": "yellow_paste","name": "六必居黄酱",   "emoji": "🟫", "city": "beijing", "price": 25 },
    { "id": "cucumber",    "name": "黄瓜丝",       "emoji": "🥒", "city": "beijing", "price": 15 },
    { "id": "tenderloin",  "name": "猪里脊",       "emoji": "🥩", "city": "beijing", "price": 30 },
    { "id": "sweet_paste", "name": "甜面酱",       "emoji": "🍯", "city": "beijing", "price": 20 },
    { "id": "scallion",    "name": "章丘大葱",     "emoji": "🧅", "city": "beijing", "price": 15 },
    { "id": "tofu_skin",   "name": "豆腐皮",       "emoji": "🫓", "city": "beijing", "price": 18 },

    { "id": "spaghetti",   "name": "意大利面",     "emoji": "🍝", "city": "rome", "price": 40 },
    { "id": "egg",         "name": "鸡蛋黄",       "emoji": "🥚", "city": "rome", "price": 30 },
    { "id": "guanciale",   "name": "风干猪颊肉",   "emoji": "🥓", "city": "rome", "price": 60 },
    { "id": "pecorino",    "name": "佩科里诺奶酪", "emoji": "🧀", "city": "rome", "price": 50 },
    { "id": "black_pepper","name": "黑胡椒",       "emoji": "⚫", "city": "rome", "price": 30 }
  ],

  "dishes": [
    { "id": "mapo_tofu", "name": "麻婆豆腐", "emoji": "🌶️", "city": "chengdu",
      "ingredients": ["tofu", "minced_pork", "doubanjiang", "sichuan_pepper"],
      "hint": "麻、辣、烫——嫩白的方块与碎肉在红油里相遇。",
      "recipePrice": 80, "incomeBonus": 4,
      "story": "相传清末成都北郊万福桥边，一位脸上有麻点的陈姓老板娘为过路挑夫烧豆腐，麻辣鲜香，人称“陈麻婆豆腐”。" },
    { "id": "twice_cooked_pork", "name": "回锅肉", "emoji": "🥘", "city": "chengdu",
      "ingredients": ["pork_belly", "doubanjiang", "garlic_sprout"],
      "hint": "先煮后炒，肥瘦相连的肉片卷成“灯盏窝”，配一抹绿。",
      "recipePrice": 80, "incomeBonus": 4,
      "story": "四川人家祭祀后把煮过的肉“回锅”再炒，因此得名。被誉为“川菜之首”，讲究肉片炒至卷曲如灯盏。" },

    { "id": "zhajiangmian", "name": "老北京炸酱面", "emoji": "🍜", "city": "beijing",
      "ingredients": ["noodles", "yellow_paste", "minced_pork", "cucumber"],
      "hint": "一碗面，一勺酱，碎肉要从南方带来，再码上清脆的绿丝。",
      "recipePrice": 300, "incomeBonus": 10,
      "story": "北京人讲究“菜码”，春有香椿、夏有黄瓜。炸酱要小火慢熬，酱香与肉香融为一体。" },
    { "id": "jingjiang_rousi", "name": "京酱肉丝", "emoji": "🌯", "city": "beijing",
      "ingredients": ["tenderloin", "sweet_paste", "scallion", "tofu_skin"],
      "hint": "甜酱裹肉丝，大葱作伴，用薄薄的“饼”卷起来吃。",
      "recipePrice": 300, "incomeBonus": 10,
      "story": "据说源自一位老人为孙子用豆腐皮卷酱肉丝与葱丝，后被厨师改良，成为北京家常名菜。" },

    { "id": "carbonara", "name": "罗马卡邦尼意面", "emoji": "🍝", "city": "rome",
      "ingredients": ["spaghetti", "egg", "guanciale", "pecorino", "black_pepper"],
      "hint": "金黄的蛋液、咸香的猪颊肉、羊奶酪与黑胡椒——不放奶油！",
      "recipePrice": 800, "incomeBonus": 20,
      "story": "正宗罗马做法只用蛋黄、猪颊肉、佩科里诺奶酪与黑胡椒，靠余温让蛋液变成丝滑酱汁。" },
    { "id": "cacio_e_pepe", "name": "黑胡椒奶酪面", "emoji": "🧀", "city": "rome",
      "ingredients": ["spaghetti", "pecorino", "black_pepper"],
      "hint": "极简的三样：面、羊奶酪、胡椒。少即是多。",
      "recipePrice": 800, "incomeBonus": 20,
      "story": "Cacio e Pepe 源自罗马牧羊人，干粮只需奶酪与胡椒便于携带，是罗马最古老的面食之一。" }
  ]
};
