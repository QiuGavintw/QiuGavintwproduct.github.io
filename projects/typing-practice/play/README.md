# ⌨️ 打字訓練中心（Typing Practice）

一個給國高中學生的 **QWERTY 英文打字訓練 Web App**。
透過遊戲化、循序漸進的練習，幫助學生熟悉鍵盤位置、建立正確手指習慣、提升打字速度與正確率。

第一版為單機 Web App，無後端、無登入，資料存於瀏覽器 `localStorage`。

---

## ✨ 功能

- 首頁儀表板：今日最佳 WPM、個人最高 WPM、今日練習次數、連續練習天數
- 💡 今日建議：分析近期錯誤，推薦弱點練習
- 循序漸進課程：基準鍵 → Home Row → Top Row → Bottom Row → 混合 → 單字 → 句子
- 課程解鎖與進度：完成前一課（2 次且正確率 ≥ 85%）解鎖下一課，進度列顯示
- 虛擬 QWERTY 鍵盤：即時高亮「下一個按鍵」，按鍵下方顯示「所指派手指」短碼與顏色
- 手指提示：`👈 左手食指`（下一個按鍵使用哪一根手指）
- 第一堂課顯示「課程目標」教學卡（含小技巧）
- 即時統計：WPM、正確率、錯誤數、練習時間（隨時更新）
- 練習文字視覺化：已完成 / 目前字元 / 未完成 / 錯誤，四種狀態清楚區分
- 三二一倒數開始（3 → 2 → 1 → GO!）
- 暫停 / 繼續 / 重新開始 / 回首頁
- 兩種難度：**Beginner**（按錯需修正後繼續，預設）/ **Normal**（按錯可繼續並記錄）
- 完成結算：WPM、正確率、錯誤數、時間、字元數、個人最佳、新紀錄提示
- 📊 錯誤分析：最常錯按鍵 + 最常錯手指，提供 🎯 加強弱點自動課程
- 🎉 課程完成卡：完成課程後顯示最佳成績並可「繼續下一課」
- ⚡ **60 秒極速挑戰**：限定時間內全力打字，統計 WPM / 正確率
- 🌟 **經驗值與等級**：每次練習獲得 XP（基礎 10 + 高正確率 +5 / 破個人最佳 +10 / 完成課程 +15 / 每日任務 +20），共 10+ 等級
- 📋 **每日任務**：完成 3 次練習、正確率 95%、60 秒挑戰（每日重置，可領獎勵 XP）
- 🔥 **連續練習 Streak**：連續天數記錄與歷史最長天數
- 🏆 **個人最佳**：最佳 WPM / 最佳正確率 / 最快完成時間
- 🏆 **成就系統（10 個）**：初次練習、速度里程碑、精準打擊、連續練習、完成課程等，解鎖即時通知
- 📊 **個人統計 Dashboard**：總覽數字、個人最佳、今日任務、SVG 進步圖表（最近 10 次）、近期趨勢比較（前 5 vs 後 5 次）、統計比較表、練習紀錄表、今日任務表
- 防作弊：禁止 Ctrl+C / Ctrl+V / Ctrl+X / 右鍵選單 / 拖放貼上
- 課程資料存於 `data/*.json`（含 300+ 分級單字與 50+ 句子），無需改程式即可新增課程
- 直接雙擊 `index.html` 即可使用（`file://` 下有內建課程備援）
- Responsive：桌機優先，支援平板與手機
- 🔊 音效與 🎵 背景音樂：設定頁可開關與調整音量；音檔缺漏時自動安全停用；背景音樂需首次互動後播放（Autoplay Policy）
- 🎨 深 / 淺色主題：隨 localStorage 儲存，頁面載入前即套用，不閃白
- ♿ 無障礙：HUD / 提示 / 結果 / Toast 支援螢幕閱讀器朗讀；支援「減少動態效果」偏好
- ⚡ 60 秒挑戰文字至少 600 字符；練習中僅即時更新少數字元，打字流暢無延遲

---

## 🚀 使用方法

直接雙擊開啟，或使用任何靜態伺服器：

```text
index.html
```

也可部署到 GitHub Pages（見下方部署章節）。

流程：首頁 → 開始練習 → 選擇課程 → 倒數 → 輸入 → 結算。

---

## 🧱 技術

- HTML5 / CSS3 / Vanilla JavaScript（無框架）
- JSON 資料檔（`data/*.json`）
- `localStorage` 儲存進度
- 不使用任何第三方套件

---

## 📁 專案結構

```text
typing-practice/
│
├── index.html          # 入口頁面（首頁 / 練習 / 結算）
├── style.css           # 全部樣式（含響應式、動畫、鍵盤、手指標示）
├── app.js              # 應用邏輯（模組化 class）
│
├── data/
│   ├── lessons.json    # 7 課課程（含解鎖條件、課程目標、小技巧）
│   ├── words.json      # 300+ 英文單字（easy / medium / hard 分級）
│   └── sentences.json  # 52 句生活化英文句子
│
├── tests/
│   ├── core.test.js    # Phase 1 核心邏輯測試（Node，無測試框架）
│   ├── phase2.test.js  # Phase 2 教學系統測試
│   ├── phase3.test.js  # Phase 3 遊戲化（XP / 等級 / 成就 / 任務 / Streak）測試
│   ├── ids.test.js     # index.html 與 app.js 的 id 交叉檢查
│   └── harness.js      # 共用測試環境（stub DOM + localStorage）
│
└── assets/
    ├── sounds/         # 音效檔預留位置
    └── images/         # 圖片預留位置
```

`app.js` 以 class / 模組拆分的概念模組：

```text
App / PracticeEngine / KeyboardView / Timer / Storage / Stats /
LessonManager / Weakness / FingerMap（FINGERS + FINGER_LABELS）/
Gamification（XP / 等級） / AchievementManager（成就 + 每日任務）
```

---

## 💾 localStorage 資料結構

儲存鍵：`typing_practice_v1`

```json
{
  "settings": {},
  "stats": {
    "highestWpm": 0,
    "bestAccuracy": 0,
    "totalPractices": 0,
    "totalTimeMs": 0,
    "totalCorrectChars": 0,
    "today": { "date": "", "count": 0, "bestWpm": 0 },
    "streak": 0,
    "longestStreak": 0,
    "lastPracticeDate": ""
  },
  "achievements": [],
  "dailyTasks": {
    "date": "2026-08-19",
    "tasks": [
      { "id": "practice-3", "title": "完成 3 次練習", "target": 3, "progress": 2, "completed": false },
      { "id": "accuracy-95", "title": "正確率達到 95%", "target": 1, "progress": 1, "completed": true },
      { "id": "speed-challenge", "title": "完成一次 60 秒挑戰", "target": 1, "progress": 0, "completed": false }
    ]
  },
  "lessonProgress": {
    "lesson-01": { "completions": 3, "bestWpm": 24, "bestAccuracy": 98, "completed": true }
  },
  "gamification": {
    "xp": 210,
    "level": 3,
    "currentStreak": 2,
    "longestStreak": 5,
    "lastPracticeDate": "2026-08-19",
    "achievements": { "first-practice": { "unlockedAt": "2026-08-19T02:10:00.000Z" } }
  },
  "personalBest": {
    "bestWpm": 42,
    "bestAccuracy": 98,
    "fastestCompletion": { "wpm": 38, "accuracy": 96, "duration": 47, "date": "2026-08-18" }
  },
  "practiceHistory": []
}
```

> Phase 1 / Phase 2 舊資料會自動**遷移**（migration）：補上 `gamification`、`personalBest`、
> 將舊 `dailyTasks` 物件與舊 streak 記錄轉為新結構，不會刪除任何練習紀錄。

每次完成練習新增一筆：

```json
{
  "date": "2026-08-19",
  "mode": "letters",
  "lessonId": "lesson-01",
  "lessonTitle": "基準鍵 F J",
  "wpm": 42,
  "accuracy": 96,
  "errors": 6,
  "duration": 60,
  "durationMs": 60000,
  "correctCharacters": 210,
  "totalCharacters": 219,
  "errorKeys": { "p": 3, "i": 2, "r": 1 },
  "speedChallenge": false,
  "completed": true,
  "xp": 35
}
```

`errorKeys` 記錄本次每個「應輸入字元」的錯誤次數，用於錯誤分析與弱點推薦。

讀取時會自動防護：資料不存在 → 建立預設值；JSON 解析失敗 → 還原預設值，不會白屏。

---

## 📦 GitHub Pages 部署

1. 將 `typing-practice/` 推上 GitHub 儲存庫
2. 進入儲存庫 **Settings → Pages**
3. Source 選擇 `Deploy from a branch`，branch 選 `main`、資料夾選 `/`
4. 等待部署完成即可瀏覽

注意：所有資源皆使用相對路徑（`./style.css`、`./app.js`、`./data/lessons.json`），
不依賴 localhost，可直接在 GitHub Pages 運行。

---

## 🗓️ 開發 Phase

- ✅ **Phase 1 — Core MVP**：首頁、練習頁、虛擬鍵盤、鍵盤高亮、字母輸入、正確/錯誤判斷、計時器、WPM、正確率、暫停、重新開始、結算畫面、基本 localStorage
- ✅ **Phase 2 — Teaching**：手指映射與提示、7 課課程與解鎖、課程進度、Beginner/Normal 難度、錯誤分析、弱點練習、今日建議、課程完成卡、設定頁
- ✅ **Phase 3 — Gamification**：Level、EXP、成就、每日任務、連續練習、個人最佳、60 秒極速挑戰、統計 Dashboard、SVG 進步圖表
- ✅ **Phase 4 — Polish**：音效 SFX 與背景音樂管理（含 Autoplay Policy 解鎖與檔案缺漏安全 fallback）、深/淺色主題（並隨 localStorage 於首頁載入前套用）、響應式強化、無障礙（aria-live / role=status / 鍵盤提示 / reduced-motion）、Timer 穩定性、渲染效能優化、Console 清理

---

## 🧪 測試方法

### 自動測試（核心邏輯 + 教學系統 + 遊戲化）

需要 Node.js：

```text
node tests\core.test.js    # Phase 1：33 項
node tests\phase2.test.js  # Phase 2：61 項
node tests\phase3.test.js  # Phase 3：94 項
node tests\phase4.test.js  # Phase 4：103 項
node tests\ids.test.js     # 全站 id 交叉檢查：8 項
```

Phase 1 涵蓋：課程載入備援、錯誤判定、Backspace 修正、長按重複忽略、功能鍵忽略、Ctrl 組合鍵防作弊、暫停/繼續、WPM 與正確率計算、完成結算與儲存、重新開始重置、NaN 防護。

Phase 2 涵蓋：手指映射、課程解鎖規則、課程進度與持久化、錯誤字元/手指統計、弱點課程產生、Beginner/Normal 行為、課程介紹卡、設定與清除資料、單字/句子資料完整性。

Phase 3 涵蓋：Storage migration、XP/等級門檻與計算、成就解鎖與持久化、每日任務、Streak 加值、個人最佳（WPM/正確率/最快完成）、60 秒挑戰課程產生、結果頁 XP 顯示、Dashboard SVG 圖表與三種比較表格。

Phase 4 涵蓋：AudioManager 安全 fallback（無 Audio / 無音檔不崩潰）、音量 clamp、音效/音樂開關與音量持久化、主題套用與持久化（含舊資料遷移預設值補齊）、設定 Modal 同步、Timer 單一 interval 與暫停/繼續/停止、Finish Guard 單次結算、60 秒挑戰最短字數下限、每日任務不重複完成、清除資料重設、Console / 絕對路徑 / 無障礙屬性靜態檢查。

### 手動測試清單

**鍵盤**
- 依序輸入 `Q A Z`、`S D F`、`J K L`、`;`、空白、`Backspace`、`Enter`
- 確認正確鍵高亮、錯誤鍵搖動、錯誤後需修正才能繼續
- 按住單鍵不放，確認不會連續跳字

**計時器**
- 開始（第一個按鍵開始計時）、暫停（時間停止）、繼續（時間接續）、完成（停止）、重新開始（歸零）

**統計**
- WPM 隨輸入即時更新；正確率 = 正確字元 / 總輸入字元 × 100；錯誤即時累計

**儲存**
- 完成練習 → 重整頁面 → 首頁統計有更新
- 清除 localStorage → 回到預設值，不白屏

**防作弊**
- Ctrl+V / Ctrl+C / Ctrl+X、滑鼠右鍵、拖放文字 → 應出現警告提示且不計入成績

**Phase 2 教學系統**
- 課程 Modal：第一課可開始，其他課顯示 🔒；完成第一課 2 次且 ≥85% 後解鎖第二課
- 第一次進入每課顯示「課程目標」卡；之後不再顯示
- 手指提示：下一鍵 G 顯示「👈 左手食指」；按鍵下方顯示手指短碼 / 顏色
- 設定切換 Normal：按錯會跳過並記錄錯誤；切回 Beginner 需修改回
- 完成含錯誤的練習：結果頁顯示錯誤分析（最常錯按鍵 + 手指）；點「🎯 加強弱點」進入弱點課程
- 首頁「今日建議」根據歷史錯誤顯示弱點推薦；清除資料後回到預設
- 重新整理頁面後，課程進度 / 難度設定與所有統計都保留

**Phase 3 遊戲化**
- 首頁：等級卡（Lv. 與進度條）、經驗值進度、連續天數、今日任務清單
- 練習結算：顯示「+XP」與等級；升級 / 達成每日任務 / 解鎖成就時出現通知
- 完成 3 次有效練習：今日任務「完成 3 次練習」progress 增加；正確率 ≥95% 自動完成任務
- 點首頁「⚡ 60 秒極速挑戰」：60 秒倒數結束自動結算，完成今日任務
- 「📊 我的成績」：總覽數字、個人最佳、SVG 折線圖（最近 10 次）、近期趨勢、比較表 / 任務表 / 紀錄表
- 「🏆 我的成就」：10 個成就卡片，已解鎖 / 未解鎖狀態與日期

**Phase 4 設定與外觀**
- 設定頁：🎨 主題（淺 / 深，隨 localStorage 儲存，下次開啟即套用）、🔊 音效與音量、🎵 背景音樂與音量
- 首次頁面載入前即套用主題，避免深色使用者閃白
- 音效：每鍵正確 / 錯誤、完成、升級、成就、按鈕點擊時觸發；音檔不存在時自動安全停用，不產生 Console Error
- 背景音樂遵循瀏覽器 Autoplay Policy：需使用者首次互動（點擊 / 按鍵）後才播放
- 60 秒挑戰文字最少 600 字符，確保計時期間輸入充足不提前結束
- 移除「鍵盤」區塊的即時重繪：僅更新目前 / 前一 / 後一三個字元，避免打字延遲
- 手機（≤520px）：隱藏手指短碼與部分功能鍵，鍵盤更緊湊
- 無障礙：HUD / 練習提示 / 結果 / Toast 皆宣告 `aria-live`；`prefers-reduced-motion` 關閉所有動畫；虛擬鍵盤標注僅為位置提示
- Console 乾淨：無 `console.log`、無 `debugger`、無絕對路徑、無 localhost 依賴

---

## 🔭 未來規劃

- 提供正式音效 / 背景音樂檔放入 `assets/sounds/`（未提供時 App 自動安全停用，不需改程式碼）
- 更多課程類型與字庫擴充（全部資料 JSON 驅動，無需改程式）
- 記憶式練習排程（間隔重複，強化弱點字元）
- 成就與每日任務擴充

---

## 📜 備註

- 音效檔未提供前，App 會安全停用音效與音樂，不會使用假 URL，也不會產生 Console Error。
- `data/words.json`（331 字，easy/medium/hard）與 `data/sentences.json`（52 句）為單字 / 句子課程的資料來源。
- 所有測試需在終端機執行；本專案無瀏覽器自動化測試，UI 動畫與音效需手動於瀏覽器驗證。
