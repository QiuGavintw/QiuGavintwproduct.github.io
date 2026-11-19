---
type: External Project
title: 教室座位編排工具（storing-seat）
description: 純前端單頁式教室座位編排工具，支援抽號排座、CSV/Excel 匯入、拖曳微調、多格式匯出。
tags: [工具, 教育, 前端, localStorage, RWD]
status: stable
resource: https://github.com/QiuGavintw/storing-seat
demo: https://qiugavintw.github.io/storing-seat/
github: https://github.com/QiuGavintw/storing-seat
generated: { by: human:qiugavin, at: 2026-11-18T00:00:00Z }
---

# 概述

「教室座位編排工具」是一個純前端、單頁式的「一般教室座位編排」網頁工具，適合單班級／單教室情境。可在瀏覽器中設定教室佈局、匯入學生名單、依規則自動抽號排座，並支援手動微調與多種匯出方式。資料預設儲存於本機瀏覽器（localStorage），無需後端與資料庫。

# 技術

| 項目 | 內容 |
|------|------|
| 技術棧 | HTML、CSS、JavaScript、SheetJS（Excel）、html2canvas（PNG）、Google Fonts |
| 特色 | 純前端、零後端、localStorage 自動儲存、RWD 響應式、深色模式 |
| 狀態 | 完成 |
| 線上版 | [GitHub Pages](https://qiugavintw.github.io/storing-seat/) |

# 功能亮點

## 教室佈局
* 自訂行列數、顯示黑板與教師桌（左/中/右）、設定講台與空區/禁用格、鎖定座位

## 名單管理
* 貼上 CSV、上傳 CSV/Excel（.csv/.xlsx/.xls）、手動新增與編輯
* 提供範例 CSV/Excel 下載
* 建議欄位：學號、中文名、性別、前後需求、組別、備註、固定座位、限制標記

## 排位規則
* 隨機／依學號／依姓名排序
* 多種填入方向（橫排、直排、S 型）
* 前後排需求、男女盡量間隔、分組分散、限制標記分開、固定座位

## 互動調整
* 拖曳交換座位
* 右鍵選單（鎖定/禁用/指派等）
* 復原/重做
* 編排歷史版本

## 檢視與輸出
* 座位圖字級調整、放大座位圖、全螢幕檢視
* 匯出/匯入 JSON、匯出名單 CSV、匯出 PNG、列印/存 PDF

## 介面
* 繁體中文（zh-TW）、深色模式、RWD（桌機優先並支援平板/手機）、本機自動儲存

# 操作方式

1. **設定教室佈局**：設定行數／列數、黑板與教師桌位置，點選格子切換類型
2. **匯入學生名單**：貼上 CSV、上傳檔案或手動新增
3. **設定排位規則**：選擇基底排列模式、填入方向、前後排與分散選項
4. **抽號編排**：點「🎲 抽號編排座位」，拖曳微調、右鍵操作
5. **匯出與列印**：匯出 JSON/CSV/PNG，或列印存 PDF

# 隱私與資料

* 所有名單與排位資料僅儲存在使用者本機瀏覽器，不會上傳至伺服器
* 匯出的檔案由使用者自行保存與分享

# 注意事項

* Excel 匯入與 PNG 匯出需可連線至 CDN（SheetJS、html2canvas）
* 離線或受限網路環境下，相關功能可能受影響
