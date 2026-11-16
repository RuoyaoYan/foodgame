# 图片放这里

- 食材：`images/ingredients/<食材id>.png`
- 菜品：`images/dishes/<菜品id>.png`

文件名就是 `data/game.js` 里的 id，例如 `images/dishes/mapo_tofu.png`、`images/ingredients/tofu.png`。
放进去后刷新页面就会自动替换 emoji；没有图片的继续显示水彩贴纸 emoji。
建议：白底或透明底 PNG，正方形，512×512 左右（用 README 里的美术 prompt 生成）。

| 类型 | id |
|---|---|
| 菜品（images/dishes/） | mapo_tofu, twice_cooked_pork, kung_pao_chicken, red_oil_wontons, fuqi_feipian, zhong_dumplings, sweet_water_noodles, lai_tangyuan, boiled_cabbage, zhangcha_duck, zhajiangmian, jingjiang_rousi, carbonara, cacio_e_pepe, char_siu, har_gow, miso_soup, tempura, fish_and_chips, scone |
| 面粉（images/ingredients/） | noodles, wheat_flour, gelatin, shiratama_flour, starch, baking_powder, cinnamon, butter_crust, warabi_flour, soy_flour, buckwheat_flour, yeast, curry_powder, tart_shell, rice_flour, french_bread, choux, dough, hard_dough, monaka_shell, pizza_base, baguette, danish, croissant, hotdog_bun, toast, bagel_dough, bagel |
| 畜产（images/ingredients/） | pork, egg, sheep_milk, cheese, cream, custard, milk, butter, caramel, sausage, bacon, chicken, condensed_milk, yogurt, beef, lamb, duck |
| 农作物（images/ingredients/） | soybean, broad_bean, wheat, cucumber, black_pepper, tofu, red_bean, rice, glutinous_rice, matcha, black_tea, coffee_bean, pumpkin, sweet_potato, mugwort, potato, ginger, corn, black_sesame, lettuce, spinach, tomato, carrot, onion, rye, mushroom, hojicha, mint, edible_rose, oats, white_kidney_bean, spicy_spice, garlic, soy_milk, green_pepper, pea, celery, eggplant, mung_bean, napa_cabbage, daikon, peanut, chive, winter_melon, lotus_root, green_bean, bamboo_shoot |
| 生果（images/ingredients/） | almond, chestnut, strawberry, apple, melon, orange, cacao, banana, mango, lemon, blueberry, peach, grape, pomelo, raspberry, cherry, plum, mixed_nuts, vanilla, avocado, cranberry, pineapple, white_strawberry, muscat, pear, watermelon, coconut, fig, apricot |
| 其他（images/ingredients/） | agar, shiratama, sugar, shrimp, kuromitsu, soy_sauce, salt, nori, consomme, water, brandy, honey, sakura, wasanbon, chocolate, sakura_paste, fish_fillet, mentaiko, natural_yeast, gold_leaf, herring, food_coloring, koji, canned_fruit, soda_water, olive_oil, tapioca, salmon, shellfish, vinegar, raw_chocolate, miso, vanilla_icecream, cookie, strawberry_macaron, matcha_macaron, marshmallow, cotton_candy, mayonnaise, kelp |
