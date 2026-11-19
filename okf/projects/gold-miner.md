---
type: Project
title: 挖金礦 Gold Miner
description: 經典挖金礦小遊戲，操控鉤爪挖取黃金與寶石，避開岩石與炸藥。
tags: [遊戲, Canvas, Web Audio]
status: stable
resource: projects/gold-miner/
demo: projects/gold-miner/play/
github: https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/gold-miner
generated: { by: human:qiugavin, at: 2026-11-18T00:00:00Z }
---

# 概述

「挖金礦」是一款經典的鉤爪挖掘小遊戲。玩家操控鉤爪深入地下，抓取黃金、鑽石與神秘袋，避開無價值的岩石，並在商店升級裝備。遊戲包含 10 個關卡、目標金額、三種加速效果與多種道具，節奏明快、操作直覺。

# 技術

| 項目 | 內容 |
|------|------|
| 技術棧 | HTML5、Canvas、JavaScript、Web Audio API |
| 特色 | 模組化場景架構、粒子系統、鏡頭震動、Tween 動畫 |
| 建立日期 | 2026-07-26 |
| 狀態 | 完成 |

# 功能亮點

* 經典鉤爪挖掘玩法，抓取黃金與鑽石
* 10 個關卡，每個關卡有目標金額
* 神秘袋隨機獎勵：金幣、鑽石、炸藥、加速、雙倍金錢
* 商店系統：幸運草、力量飲料、鑽石拋光等永久升級
* Web Audio API 合成音效與粒子特效
* 支援全螢幕與鍵盤 / 滑鼠雙操作

# 操作方式

1. 按 Space 或滑鼠左鍵發射鉤爪
2. 鉤中黃金與鑽石可獲得金錢
3. 按下鍵或滑鼠右鍵使用炸藥炸掉岩石
4. 達到目標金額即可過關

# 架構亮點

* 模組化場景架構（選單 / 倒數 / 遊玩 / 商店 / 結算）
* 鏡頭震動、粒子系統與 Tween 動畫
* 最高分與關卡進度自動儲存
