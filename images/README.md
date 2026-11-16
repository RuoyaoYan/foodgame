# 图片放这里

- 食材：`images/ingredients/<食材id>.png`
- 菜品：`images/dishes/<菜品id>.png`

文件名就是 `data/game.js` 里的 id，例如 `images/dishes/mapo_tofu.png`、`images/ingredients/tofu.png`。
放进去后刷新页面就会自动替换 emoji；没有图片的继续显示水彩贴纸 emoji。
建议：白底或透明底 PNG，正方形，512×512 左右（用 README 里的美术 prompt 生成）。

| 类型 | id |
|---|---|
| 菜品 | mapo_tofu, twice_cooked_pork, zhajiangmian, jingjiang_rousi, carbonara, cacio_e_pepe |
| 成都原材料 | soybean, pork, chili, sichuan_pepper, broad_bean, garlic_sprout |
| 北京原材料 | wheat, cucumber, scallion |
| 罗马原材料 | egg, sheep_milk, black_pepper |
| 加工品（放在 ingredients 文件夹） | tofu, doubanjiang, yellow_paste, noodles, spaghetti, pecorino, guanciale |
| 面粉类·原本有的（开发中） | wheat_flour, gelatin, shiratama_flour, starch, baking_powder, cinnamon, butter_crust, warabi_flour, soy_flour, buckwheat_flour, yeast, curry_powder |
| 面粉类·需要自己做的（开发中） | tart_shell, rice_flour, french_bread, choux, dough, hard_dough, monaka_shell, pizza_base, baguette, danish, croissant, hotdog_bun, toast, bagel_dough, bagel |
