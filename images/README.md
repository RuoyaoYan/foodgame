# 图片放这里

- 食材：`images/ingredients/<食材id>.png`
- 菜品：`images/dishes/<菜品id>.png`

文件名就是 `data/game.js` 里的 id，例如 `images/dishes/mapo_tofu.png`、`images/ingredients/tofu.png`。
放进去后刷新页面就会自动替换 emoji；没有图片的继续显示水彩贴纸 emoji。
建议：白底或透明底 PNG，正方形，512×512 左右（用 README 里的美术 prompt 生成）。

| 类型 | id |
|---|---|
| 菜品 | mapo_tofu, twice_cooked_pork, zhajiangmian, jingjiang_rousi, carbonara, cacio_e_pepe |
| 成都食材 | tofu, minced_pork, pork_belly, doubanjiang, sichuan_pepper, garlic_sprout |
| 北京食材 | noodles, yellow_paste, cucumber, tenderloin, sweet_paste, scallion, tofu_skin |
| 罗马食材 | spaghetti, egg, guanciale, pecorino, black_pepper |
