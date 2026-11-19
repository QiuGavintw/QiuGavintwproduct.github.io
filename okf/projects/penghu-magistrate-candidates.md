---
type: External Project
title: 澎湖縣長候選人政見分析
description: 2026 澎湖縣長選舉 6 位候選人政見蒐集、TF-IDF 相似度分析與 OKF 知識庫，含 GitHub Actions 每日自動刷新。
tags: [資料分析, 選舉, TF-IDF, GitHub Actions, OKF, 爬蟲]
status: stable
resource: https://github.com/QiuGavintw/penghu-magistrate-candidates
demo: https://qiugavintw.github.io/penghu-magistrate-candidates/
github: https://github.com/QiuGavintw/penghu-magistrate-candidates
generated: { by: human:qiugavin, at: 2026-11-18T00:00:00Z }
---

# 概述

「澎湖縣長候選人政見分析」是一套完整的選舉資料蒐集與分析系統，涵蓋 2026 年澎湖縣長選舉 6 位登記候選人的公開政見資料。系統以澎湖縣選舉委員會選舉公報為最優先來源，輔以候選人官方 Facebook 與主流媒體報導，透過 TF-IDF bigram cosine similarity 計算候選人間的政見相似度，並以 OKF v0.2 格式組織知識庫，供人類與 AI agent 使用。

# 技術

| 項目 | 內容 |
|------|------|
| 技術棧 | Python 3、requests、BeautifulSoup、pypdf、GitHub Actions |
| 特色 | 多來源融合、每日自動刷新、OKF v0.2 知識庫、TF-IDF 相似度分析 |
| 建立日期 | 2026-11-08 |
| 最後更新 | 2026-11-18 |
| 狀態 | 完成（選前持續更新至 2026-11-28 投票日） |

# 來源優先順序

| 優先順序 | 來源 | 說明 |
|----------|------|------|
| 1 | 選舉公報（CEC PDF） | 最正式來源，候選人所填列政見原文 |
| 2 | 候選人官方 Facebook | 葉竹林、吳淑瑾、陳盡川官方粉絲團 |
| 3 | 主流媒體報導 | 自由時報、中央社、NOWnews、新頭條 |
| 4 | 台灣選舉懶人包 | 結構化整理，現有 scraper 流程 |

# 功能亮點

* 米色主題互動式網頁（index.html），6 位候選人卡片式展示
* 搜尋功能（輸入姓名或關鍵字即時過濾）
* 政見相似度矩陣（TF-IDF bigram cosine similarity，6×6 對照表）
* 跨候選人最相似政見配對 Top 8（個別政見層面）
* OKF v0.2 知識庫（okf/ 目錄），供 AI agent 解析使用
* GitHub Actions 每日自動刷新（台北 08:00）
* 選舉公報 PDF 自動下載與套用（apply_ballot.py）
* 每項政見標記來源（選舉公報 / FB / 媒體），可逐筆查證

# 6 位候選人

| 號次 | 姓名 | 黨派 | 政見數 |
|------|------|------|--------|
| 1 | 許智富 | 無黨籍 | 6（食衣住行育樂） |
| 2 | 周倪安 | 台聯黨 | 8 |
| 3 | 葉竹林 | 無黨籍 | 9 |
| 4 | 吳淑瑾 | 民進黨 | 5 |
| 5 | 陳振中 | 國民黨 | 10（7-10 項 PDF 截斷） |
| 6 | 陳盡川 | 無黨籍 | 3 |

# 連結

* 網頁版：[GitHub Pages](https://qiugavintw.github.io/penghu-magistrate-candidates/)
* 資料集 repo：[GitHub](https://github.com/QiuGavintw/penghu-magistrate-candidates)
* 選舉公報 PDF：[CEC](https://bulletin.cec.gov.tw/01%E9%81%B8%E8%88%89%E5%85%AC%E5%A0%B1/04%E7%B8%A3%E5%B8%82%E9%95%B7/115%E5%B9%B4/%E6%BE%8E%E6%B9%96%E7%B8%A3%E7%B8%A3%E9%95%B7.pdf)
