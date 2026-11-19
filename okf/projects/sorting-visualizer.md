---
type: Project
title: 排序演算法視覺化
description: 用動畫看懂氣泡、選擇、插入、合併與貪心五種排序，逐步展示交換與比較。
tags: [視覺化, 教育, 演算法, 排序]
status: stable
resource: projects/sorting-visualizer/
demo: projects/sorting-visualizer/play/
github: https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/sorting-visualizer
generated: { by: human:qiugavin, at: 2026-11-18T00:00:00Z }
---

# 概述

「排序演算法視覺化」是一款教育用視覺化工具，以動畫逐步展示氣泡、選擇、插入、合併與貪心五種排序法的執行過程。每個步驟都會標示比較與交換的元素、更新複雜度統計，並同步高亮對應的演算法程式碼，讓排序邏輯一目瞭然。

# 技術

| 項目 | 內容 |
|------|------|
| 技術棧 | HTML5、CSS3、JavaScript |
| 特色 | 純邏輯步驟產生器、比較模式與 Race 競賽模式 |
| 建立日期 | 2026-08-13 |
| 最後更新 | 2026-08-30 |
| 狀態 | 完成 |

# 功能亮點

* 氣泡排序：相鄰比較並逐趟把最大元素浮到末端
* 選擇排序：每趟選出剩餘最小元素放到前方
* 插入排序：逐步建立已排序子序列
* 合併排序：分割再合併，示範分治法（額外空間 O(n)）
* 貪心排序：每次挑選剩餘最大元素放入正確位置
* 比較模式與競賽模式（Race）：同時播放觀察五種演算法的效率差異

# 操作方式

1. 點「產生新資料」建立隨機資料陣列
2. 選擇要觀看的排序演算法
3. 播放或逐步操作觀察排序過程
4. 使用比較模式一次觀看五種排序的效率，或以 Race 看誰最快完成
