---
type: Project
title: 台灣麻將
description: 以純 JavaScript 打造的四人台灣 16 張麻將單機遊戲，內建 AI 玩家、完整規則與計分、Canvas 牌桌、動畫與音效。
tags: [遊戲, 教育, Canvas, AI, ES Modules]
status: in-development
resource: projects/mahjong/
demo: projects/mahjong/play/
github: https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/mahjong
generated: { by: human:qiugavin, at: 2026-11-18T00:00:00Z }
---

# 概述

「台灣麻將」是一款以純前端技術打造的四人台灣 16 張麻將單機遊戲。遊戲內建完整規則引擎（摸牌、捨牌、吃、碰、明槓、暗槓、加槓、胡牌、過水、海底河底、流局）與特殊事件（天胡、地胡、人胡、門清自摸、地聽、搶槓、海底撈月、河底撈魚、花牌八仙／七搶一），並以零和結算計算台數與支付。三位 AI 玩家採用向聽數決策與安全張風險加權，牌桌以 Canvas 繪製，真人可完整操作一局。

# 技術

| 項目 | 內容 |
|------|------|
| 技術棧 | HTML5、CSS3、Canvas、JavaScript、ES Modules、Web Audio API |
| 特色 | 純前端、零依賴、決定性 RNG、400+ 測試全數通過 |
| 建立日期 | 2026-08-31 |
| 狀態 | 開發中（in-development） |

# 功能亮點

* 完整台灣 16 張麻將規則：摸牌、捨牌、吃、碰、明槓、暗槓、加槓、胡（自摸／榮胡／一炮多響）、過水、海底河底、流局
* 特殊事件：天胡、地胡、人胡、門清自摸、地聽、搶槓、海底撈月、河底撈魚、花牌八仙／七搶一
* 台數與零和支付結算，一炮多響逐位計分
* 三位 AI 玩家：向聽數決策＋安全張風險加權（balanced／aggressive／defensive 策略）
* Canvas 牌桌：真人手牌牌面、AI 只顯示背牌、河牌、副露、花、牌牆、目前玩家、莊家
* 動畫：摸牌、捨牌、吃碰槓、花牌補牌、胡牌、回合切換（確定性時鐘＋requestAnimationFrame）
* 音效與 BGM：Web Audio 程序合成、音量／靜音分離、Autoplay Policy 安全處理
* 真人互動：自摸／暗槓／加槓確認、結算顯示、下一局、對局結束、重來

# 操作方式

1. 點「開始」發牌；輪到你時按「摸牌」
2. 點選手牌再按「捨牌」出牌
3. AI 捨牌後可選擇「胡／碰／槓／吃／過」
4. 自摸、暗槓、加槓時會出現確認；一局結束按「結算」查看台數與支付
5. 本局結束後按「下一局」續局，或按「重來」重新開始

# 架構

核心規則與 UI 徹底分層：GameEngine → Adapter → GameUI → Canvas，全部 400+ 測試通過。
AI 手牌只顯示背牌與張數，隱私絕不外洩。
動畫與音效皆為確定性、可注入時鐘／fake backend 的可測試抽象。
