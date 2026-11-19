---
type: Project
title: 搜尋演算法視覺化
description: 用動畫看懂順序搜尋與二分搜尋，逐步展示比較過程與複雜度。
tags: [視覺化, 教育, 演算法]
status: stable
resource: projects/search-visualizer/
demo: projects/search-visualizer/play/
github: https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/search-visualizer
generated: { by: human:qiugavin, at: 2026-11-18T00:00:00Z }
---

# 概述

「搜尋演算法視覺化」是一款教育用視覺化工具，以動畫逐步展示順序搜尋（Linear Search）與二分搜尋（Binary Search）的執行過程。每步操作都會搭配陣列狀態、比較次數統計與演算法程式碼高亮，讓抽象的搜尋邏輯變得容易理解。

# 技術

| 項目 | 內容 |
|------|------|
| 技術棧 | HTML5、CSS3、JavaScript |
| 特色 | 純邏輯步驟產生器，動畫與演算法分離 |
| 建立日期 | 2026-08-14 |
| 狀態 | 完成 |

# 功能亮點

* 順序搜尋：從頭到尾逐項比較，適合未排序資料
* 二分搜尋：每次縮小一半搜尋範圍，需已排序資料
* 自動產生排序資料與搜尋目標，可自訂資料筆數
* 逐步動畫：比較、命中、未命中狀態清楚標示
* 比較模式：同時比較兩種演算法的效率
* 演算法程式碼與學習重點同步高亮

# 操作方式

1. 點「產生資料與搜尋目標」建立新的搜尋問題
2. 點擊「開始」播放演算法執行動畫
3. 使用上一步 / 下一步逐步觀察比較過程
4. 切換至比較模式觀察兩種演算法的效率差異
