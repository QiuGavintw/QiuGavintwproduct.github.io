---
type: Project
title: 合唱比賽計時計分系統
description: 給合唱比賽現場工作人員使用的純前端計時與評分工具，整合隊伍管理、三評審加權評分、超時扣分、排名與多格式匯出。
tags: [工具, 教育, 前端, 計時, 評分, localStorage]
status: stable
resource: projects/choir-scoring/
demo: projects/choir-scoring/play/
github: https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/choir-scoring
generated: { by: human:qiugavin, at: 2026-11-25T00:00:00Z }
---

# 概述

「合唱比賽計時計分系統」是為音樂比賽現場工作人員設計的計時＋評分工具。同一畫面即可完成計時、隊伍管理、評分輸入、排名與匯出；不需要伺服器、不需安裝套件，直接以瀏覽器開啟 `計時系統.html` 即可使用。

# 技術

| 項目 | 內容 |
|------|------|
| 技術棧 | HTML5、CSS3、原生 JavaScript、localStorage |
| 特色 | 純前端、零後端、零依賴、資料僅存本機 |
| 建立日期 | 2026-11-25 |
| 狀態 | 完成 |

# 功能亮點

* 計時：正數／倒數同步、暫停續算、重置、1 秒～99 分鐘設定、提醒時間與超時負數顯示
* 評分：指定曲與自選曲兩張卡片，每細項由 3 位評審給分（0–100，step 0.5）後加權平均
* 扣分：可設定「每 x 秒扣 y 分」，未滿 x 秒以 x 秒計，即時反映於總分
* 隊伍管理：班級名稱與出場順序可新增、改名、刪除與調整順序
* 歷史與排名：儲存當下隊伍名稱快照，採競爭排名（同分並列、下一名跳號），另設最佳指揮獎標記
* 匯出：UTF-8 BOM CSV、Excel 相容 `.xls`、列印用 HTML
* 介面：深色／明亮主題、登記分數模式、快捷鍵與 RWD 響應式

# 操作方式

1. 直接開啟 `projects/choir-scoring/play/計時系統.html`
2. 設定比賽時間與提醒，必要時調整扣分規則與隊伍順序
3. 按「開始」計時，於指定曲／自選曲卡片輸入三位評審分數
4. 按「儲存紀錄」寫入歷史與排名，需要時切換登記分數模式
5. 按「匯出」輸出 CSV、Excel 相容檔或列印用 HTML

# 資料與隱私

* 所有設定、分數草稿、歷史紀錄與主題皆儲存於瀏覽器 `localStorage`
* 不傳送至伺服器；清除草稿與歷史紀錄皆需再次確認

# 檔案說明

* `計時系統.html`：主要入口
* `style.css`：深色控制室視覺與響應式版面
* `js/`：storage、timer、teams、scoring、history、ui、export、app 等模組
* `tests/`：瀏覽器端測試頁面與測試腳本
* `高一合唱.xlsx`：原始評分表

# 注意事項

* 不同瀏覽器或裝置的 `localStorage` 不會互通，重要紀錄請先匯出保存
