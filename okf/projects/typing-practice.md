---
type: Project
title: 打字訓練中心
description: 為國高中生設計的英文打字訓練 Web App，包含課程、手指提示、遊戲化與錯誤分析。
tags: [工具, 教育, 打字, 前端]
status: stable
resource: projects/typing-practice/
demo: projects/typing-practice/play/
github: https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/typing-practice
tags_extra: [featured]
generated: { by: human:qiugavin, at: 2026-11-18T00:00:00Z }
---

# 概述

「打字訓練中心」是一款為國高中學生設計的英文打字訓練 Web App。透過循序漸進的課程、虛擬 QWERTY 鍵盤與手指提示，幫助使用者熟悉鍵盤位置並建立正確的輸入習慣。內建經驗值、等級、成就、每日任務與 60 秒極速挑戰等遊戲化機制，讓練習更有動力。

# 技術

| 項目 | 內容 |
|------|------|
| 技術棧 | HTML5、CSS3、JavaScript、JSON |
| 特色 | 資料驅動課程（JSON）、localStorage 進度、無第三方框架 |
| 建立日期 | 2026-08-19 |
| 狀態 | 完成（Featured） |

# 功能亮點

* 7 堂循序漸進課程：基準鍵 → Home Row → Top Row → Bottom Row → 混合 → 單字 → 句子
* 虛擬 QWERTY 鍵盤即時高亮下一個按鍵，並標示手指
* 即時統計：WPM、正確率、錯誤數、練習時間
* 遊戲化系統：經驗值、等級、10 個成就、每日任務、連續練習 Streak
* 60 秒極速挑戰與個人最佳紀錄
* 錯誤分析與弱點自動課程推薦
* 深 / 淺色主題與音效背景音樂（Autoplay Policy 安全處理）
* 無障礙：aria-live、reduced-motion、鍵盤操作完整支援

# 操作方式

1. 在首頁選擇課程或直接開始練習
2. 按照虛擬鍵盤高亮的按鍵依序輸入
3. Beginner 模式需修正錯誤後才能繼續，Normal 模式可跳過
4. 完成練習後查看成績、錯誤分析與獲得 XP

# 測試

含 4 套自動化測試（Node 執行，無第三方框架）：core、ids、phase2、phase3、phase4。
