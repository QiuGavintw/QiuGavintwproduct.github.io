# Qiu Gavin 作品集 · QiuGavintwproduct

個人作品集網站原始碼。集結互動遊戲、海洋教育、演算法視覺化、打字訓練與實用工具，全部以純前端技術打造，可直接在瀏覽器中體驗。

- **網站網址**：<https://qiugavintw.github.io/QiuGavintwproduct.github.io/>
- **作品集介紹**：<https://qiugavintw.github.io/QiuGavintwproduct.github.io/about.html>（與首頁共用實驗索引設計系統，保留改版前文案）
- **作者**：Qiu Gavin（[GitHub @QiuGavintw](https://github.com/QiuGavintw)）
- **技術**：HTML / CSS / 原生 JavaScript（零建置、零框架），部署於 GitHub Pages

## 內容

### 站內作品（各有獨立介紹頁）

| 作品 | 分類 | 說明 |
| --- | --- | --- |
| 澎湖頭足探險 | 遊戲 / 教育 | 海洋教育互動遊戲，認識澎湖常見頭足類 |
| 打字訓練中心 | 教育 / 工具 | 中英文打字練習與即時統計 |
| 搜尋演算法視覺化 | 視覺化 / 教育 | 線性搜尋、二分搜尋等演算法逐步視覺化 |
| 排序演算法視覺化 | 視覺化 / 教育 | 各種排序演算法動畫與複雜度比較 |
| 挖金礦 Gold Miner | 遊戲 | 經典黃金礦工網頁版 |
| 午餐小天使 | 工具 | 高中校園午餐查詢的 LINE 聊天機器人後端 |
| 二元樹視覺化 | 視覺化 / 教育 | 二元搜尋樹插入、搜尋、刪除與走訪動畫 |
| 合唱比賽計時計分系統 | 工具 / 教育 | 合唱比賽計時、三評審加權評分、超時扣分、排名與匯出 |

### 外部專案（另有站內介紹頁，可連到獨立 Repo / 網站）

| 專案 | 站內介紹頁 | 說明 |
| --- | --- | --- |
| 澎湖縣長候選人政見分析 | `projects/penghu-magistrate/` | 2026 澎湖縣長選舉 6 位候選人政見蒐集、TF-IDF 相似度分析與 OKF 知識庫，含 GitHub Actions 每日自動刷新 |
| 教室座位編排工具 | `projects/storing-seat/` | 排排坐 / 分組座位編排，支援拖曳調整與匯出 |

## 專案結構

```
.
├── index.html              # 首頁（作品總覽、分類篩選）
├── about.html              # 作品集介紹頁（與首頁共用新版設計系統）
├── css/
│   ├── index.css           # 首頁與作品介紹頁共用的 Experimental Index 樣式
│   └── style.css           # 相容舊版詳情頁樣式（現行介紹頁未使用）
├── js/
│   ├── projects.js         # 作品資料集（首頁與介紹頁共同來源）
│   ├── main.js             # 首頁索引渲染、分類篩選與主題切換
│   └── detail.js           # 作品介紹頁渲染（標本框、章節索引、內容區塊）
├── projects/<slug>/        # 各作品獨立介紹頁
├── assets/                 # 縮圖、favicon 等靜態資源
│   └── thumbnails/
├── okf/                    # OKF v0.2 知識庫（專案索引與紀錄）
│   ├── index.md
│   ├── log.md
│   └── projects/*.md
├── archive/                # 舊版 / 備份頁面
├── tests/                  # 前端自動化測試
└── 404.html, robots.txt, sitemap.xml
```

## 本機預覽

純靜態網站，無需建置。任選一種方式開啟：

```bash
# Python 內建伺服器
python -m http.server 8000

# 或 Node.js
npx serve .
```

再開啟 <http://localhost:8000/>。

## 新增作品

1. 在 `js/projects.js` 的 `PROJECTS` 陣列加入一筆物件，需包含下列欄位：

   | 欄位 | 說明 |
   | --- | --- |
   | `id` / `slug` | 唯一識別碼 |
   | `title` / `shortDescription` / `description` | 標題與簡介（首頁用短描述） |
   | `categories` | 分類陣列（遊戲 / 教育 / 工具 / 視覺化 / 資料分析 / Web） |
   | `thumbnail` | 縮圖路徑（`assets/thumbnails/…`） |
   | `detailPage` | 獨立介紹頁路徑；建議每筆作品都建立（含外部專案） |
   | `demoUrl` / `githubUrl` | 線上體驗與原始碼連結 |
   | `external` | `true` 表示外部獨立專案（卡片會連到其網站與 GitHub） |
   | `hidden` | 設為 `true` 時不在首頁與本清單顯示（檔案仍保留、可由網址存取） |
   | `createdAt` / `updatedAt` | 日期（`YYYY-MM-DD`，首頁依 `createdAt` 排序） |
   | `accent` / `features` | 主題色與特色列表 |

2. 於 `projects/<slug>/` 建立介紹頁外殼（載入 `js/projects.js` 與 `js/detail.js`），並在 `detailPage` 指向它。
3. 縮圖放到 `assets/thumbnails/`。

## 授權

除另有註明外，本專案採用 [MIT License](LICENSE)。
