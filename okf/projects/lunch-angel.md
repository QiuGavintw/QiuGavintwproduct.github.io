---
type: Project
title: 午餐小天使
description: 高中生查詢校園午餐資訊的 LINE 聊天機器人（Node.js 後端專案）。
tags: [工具, Web, Node.js, LINE, 後端]
status: stable
resource: https://github.com/QiuGavintw/lunch-angel
github: https://github.com/QiuGavintw/lunch-angel
generated: { by: human:qiugavin, at: 2026-11-18T00:00:00Z }
---

# 概述

「午餐小天使」是一支提供高中生查詢校園午餐資訊的 LINE 聊天機器人後端。它接收 LINE Messaging API 的 Webhook 事件、驗證簽名、解析學校午餐 PDF 菜單，並透過排程同步與即時回覆功能，讓學生能用 LINE 輕鬆查詢當日午餐。此專案以 Node.js 建置，屬後端服務，需搭配 LINE Official Account 與伺服器執行。

# 技術

| 項目 | 內容 |
|------|------|
| 技術棧 | Node.js、Express、LINE Messaging API、pdfjs-dist |
| 特色 | 後端服務、Webhook 事件、PDF 解析、排程同步 |
| 建立日期 | 2026-08-21 |
| 狀態 | 完成 |
| 獨立 Repo | [QiuGavintw/lunch-angel](https://github.com/QiuGavintw/lunch-angel) |

# 功能亮點

* LINE Messaging API Webhook 事件接收與簽名驗證
* 午餐菜單 PDF 解析與排程同步
* 日期查詢與即時文字回覆
* 完整單元測試（Node 原生 test runner）
* 支援手機使用（LINE 聊天介面）

# 注意

* 屬後端服務專案，需 Node.js 環境執行
* GitHub Pages 無法直接執行，此頁提供完整介紹與程式碼連結
* 需搭配 LINE Official Account 與伺服器執行
