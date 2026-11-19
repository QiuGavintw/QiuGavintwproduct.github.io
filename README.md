# Qiu Gavin 作品集 · QiuGavintwproduct

個人作品集網站原始碼。集結互動遊戲、海洋教育、演算法視覺化、打字訓練與實用工具，全部以純前端技術打造，可直接在瀏覽器中體驗。

- **網站網址**：<https://qiugavintw.github.io/QiuGavintwproduct.github.io/>
- **舊版介紹**：<https://qiugavintw.github.io/QiuGavintwproduct.github.io/about.html>（保留改版前首頁的 Hero／作品集介紹版面）
- **作者**：Qiu Gavin（[GitHub @QiuGavintw](https://github.com/QiuGavintw)）
- **技術**：HTML / CSS / 原生 JavaScript（零建置、零框架），部署於 GitHub Pages

## 內容

### 站內作品（含詳情頁）

| 作品 | 分類 | 說明 |
| --- | --- | --- |
| 澎湖頭足探險 | 遊戲 / 教育 | 海洋教育互動遊戲，認識澎湖常見頭足類 |
| 打字訓練中心 | 教育 / 工具 | 中英文打字練習與即時統計 |
| 搜尋演算法視覺化 | 視覺化 / 教育 | 線性搜尋、二分搜尋等演算法逐步視覺化 |
| 排序演算法視覺化 | 視覺化 / 教育 | 各種排序演算法動畫與複雜度比較 |
| 挖金礦 Gold Miner | 遊戲 | 經典黃金礦工網頁版 |
| 午餐小天使 | 工具 | 高中校園午餐查詢的 LINE 聊天機器人後端 |
| 二元樹視覺化 | 視覺化 / 教育 | 二元搜尋樹插入、搜尋、刪除與走訪動畫 |

### 外部專案（連到獨立 Repo / 網站）

| 專案 | 說明 |
| --- | --- |
| [澎湖縣長候選人政見分析](https://github.com/QiuGavintw/penghu-magistrate-candidates) | 2026 澎湖縣長選舉 6 位候選人政見蒐集、TF-IDF 相似度分析與 OKF 知識庫，含 GitHub Actions 每日自動刷新 |
| [教室座位編排工具](https://github.com/QiuGavintw/storing-seat) | 排排坐 / 分組座位編排，支援拖曳調整與匯出 |

## 專案結構

```
.
├── index.html              # 首頁（作品總覽、分類篩選）
├── about.html              # 舊版首頁介紹頁（沿用 css/style.css）
├── css/
│   ├── index.css           # 首頁樣式（實驗索引版面、日夜主題）
│   └── style.css           # 作品詳情頁樣式
├── js/
│   ├── projects.js         # 作品資料集（首頁卡片來源）
│   └── main.js             # 首頁索引渲染、分類篩選與主題切換
├── projects/<slug>/        # 各作品詳情頁
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
   | `detailPage` | 詳情頁路徑；外部專案可設 `null` |
   | `demoUrl` / `githubUrl` | 線上體驗與原始碼連結 |
   | `external` | `true` 表示外部獨立專案（卡片會連到其網站與 GitHub） |
   | `hidden` | 設為 `true` 時不在首頁與本清單顯示（檔案仍保留、可由網址存取） |
   | `createdAt` / `updatedAt` | 日期（`YYYY-MM-DD`，首頁依 `createdAt` 排序） |
   | `accent` / `features` | 主題色與特色列表 |

2. 若為站內作品，於 `projects/<slug>/` 建立詳情頁並在 `detailPage` 指向它。
3. 縮圖放到 `assets/thumbnails/`。

## 授權

除另有註明外，本專案採用 [MIT License](LICENSE)。
