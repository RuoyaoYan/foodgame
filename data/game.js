// 《吃》游戏数据（城市的 lat/lon 为经纬度，决定世界地图上图钉的位置） —— 策划可直接修改这里的数值，无需改代码。
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
      "lat": 30.7, "lon": 104.1,
      "desc": "天府之国，麻辣鲜香。" },
    { "id": "beijing", "name": "北京", "emoji": "🏯", "unlockCost": 2000,
      "lat": 39.9, "lon": 116.4,
      "desc": "皇城根下，酱香浓郁。" },
    { "id": "rome", "name": "罗马", "emoji": "🏛️", "unlockCost": 8000,
      "lat": 41.9, "lon": 12.5,
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

// English translations of the game text, keyed by id (英文翻译，按 id 对应上面的数据)
window.GAME_DATA_EN = {
  "cities": {
    "chengdu": { "name": "Chengdu", "desc": "Land of abundance — numbing, spicy and fragrant." },
    "beijing": { "name": "Beijing", "desc": "In the shadow of the imperial city, rich with savory sauces." },
    "rome":    { "name": "Rome",    "desc": "The Eternal City, where a bowl of pasta is an art." }
  },
  "ingredients": {
    "tofu": "Silken Tofu", "minced_pork": "Minced Pork", "pork_belly": "Pork Belly",
    "doubanjiang": "Pixian Chili Bean Paste", "sichuan_pepper": "Hanyuan Sichuan Pepper", "garlic_sprout": "Garlic Sprouts",
    "noodles": "Hand-rolled Noodles", "yellow_paste": "Liubiju Soybean Paste", "cucumber": "Shredded Cucumber",
    "tenderloin": "Pork Tenderloin", "sweet_paste": "Sweet Bean Sauce", "scallion": "Zhangqiu Scallion", "tofu_skin": "Tofu Skin",
    "spaghetti": "Spaghetti", "egg": "Egg Yolk", "guanciale": "Guanciale", "pecorino": "Pecorino Romano", "black_pepper": "Black Pepper"
  },
  "dishes": {
    "mapo_tofu": { "name": "Mapo Tofu",
      "hint": "Numbing, spicy, piping hot — soft white cubes meet crumbled meat in red chili oil.",
      "story": "Legend says that in the late Qing dynasty, a pockmarked woman surnamed Chen cooked tofu for porters by Wanfu Bridge in northern Chengdu. Its fiery, numbing flavor became known as \"Pockmarked Grandma Chen's Tofu\"." },
    "twice_cooked_pork": { "name": "Twice-cooked Pork",
      "hint": "Boiled, then stir-fried: slices of fatty-lean pork curl into little \"lamp cups\", with a touch of green.",
      "story": "Sichuan families would \"return to the wok\" the pork boiled for ancestral offerings — hence the name. Often called the king of Sichuan dishes, the slices should curl like little oil lamps." },
    "zhajiangmian": { "name": "Old Beijing Zhajiang Noodles",
      "hint": "A bowl of noodles and a spoonful of sauce; the meat comes from the south, topped with crisp green shreds.",
      "story": "Beijingers take their toppings seriously — toon sprouts in spring, cucumber in summer. The sauce is simmered slowly until the soybean and pork aromas become one." },
    "jingjiang_rousi": { "name": "Shredded Pork in Beijing Sauce",
      "hint": "Pork shreds glazed in sweet sauce, joined by scallion and rolled up in a thin wrapper.",
      "story": "It is said an old man once rolled sauced pork and scallion in tofu skin for his grandson; chefs refined the idea into a beloved Beijing home-style dish." },
    "carbonara": { "name": "Roman Carbonara",
      "hint": "Golden yolk, salty pork cheek, sheep's cheese and black pepper — no cream!",
      "story": "The true Roman recipe uses only egg yolk, guanciale, pecorino and black pepper, relying on residual heat to turn the eggs into a silky sauce." },
    "cacio_e_pepe": { "name": "Cacio e Pepe",
      "hint": "Just three things: pasta, sheep's cheese and pepper. Less is more.",
      "story": "Born among Roman shepherds who carried cheese and pepper as easy provisions, Cacio e Pepe is one of Rome's oldest pasta dishes." }
  }
};
