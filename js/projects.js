/* ============================================================
   QiuGavintwproduct 個人作品集 - 作品資料檔
   新增作品：在 PROJECTS 陣列加入一筆物件即可，
   並在 /projects/<slug>/ 放置詳細頁 index.html。
   ============================================================ */
(function (global) {
  "use strict";

  var PROJECTS = [
    {
      id: "cephalopod",
      slug: "cephalopod",
      title: "澎湖頭足探險",
      shortDescription: "以澎湖真實頭足類為主題的互動教育遊戲，融合捕撈玩法、海洋圖鑑與保育知識。",
      description:
        "「澎湖頭足探險」是一款以澎湖海域頭足類為主題的互動教育遊戲。玩家扮演漁民出海捕撈，需要依照季節、時間與棲地選擇正確的作業海域，捕捉白魷、花枝、章魚等 16 種真實物種。遊戲內建完整海洋圖鑑、研究系統與保育知識，讓玩家在遊戲中認識澎湖的海洋生態。",
      categories: ["遊戲", "教育"],
      technologies: ["HTML5", "Canvas", "JavaScript", "Web Audio API"],
      thumbnail: "assets/thumbnails/cephalopod.png",
      screenshots: ["assets/thumbnails/cephalopod.png"],
      detailPage: "projects/cephalopod/",
      demoUrl: "projects/cephalopod/play/",
      githubUrl: "https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/cephalopod",
      createdAt: "2026-08-14",
      updatedAt: "2026-08-14",
      featured: true,
      accent: "#0e9ad8",
      features: [
        "16 種真實澎湖頭足類，每種皆有真實照片與詳細生態資料",
        "依季節、時間、棲地與天候設計的捕撈關卡",
        "完整海洋圖鑑與研究點數系統",
        "6 種可升級裝備：捲線器、聲納、照明燈、誘餌、研究設備、防墨裝置",
        "Web Audio API 即時合成音效與背景音樂，無需外部音檔",
        "保育知識與永續捕撈提示，寓教於樂"
      ],
      howToPlay: [
        "在近海移動船隻，尋找目標頭足類",
        "放下捕撈器捕捉目標物種",
        "依照關卡目標捕獲指定數量即可過關",
        "用研究點數升級裝備，挑戰更深海域"
      ],
      highlights: [
        "真實素材：16 種物種皆使用 Wikimedia Commons 合法授權照片",
        "生態正確性：每種頭足類皆有科學名、棲地、季節與行為設定",
        "聲納與夜間照明讓夜間捕撈更直觀",
        "支援全螢幕與音效音量調整"
      ]
    },
    {
      id: "typing-practice",
      slug: "typing-practice",
      title: "打字訓練中心",
      shortDescription: "為國高中生設計的英文打字訓練 Web App，包含課程、手指提示、遊戲化與錯誤分析。",
      description:
        "「打字訓練中心」是一款為國高中學生設計的英文打字訓練 Web App。透過循序漸進的課程、虛擬 QWERTY 鍵盤與手指提示，幫助使用者熟悉鍵盤位置並建立正確的輸入習慣。內建經驗值、等級、成就、每日任務與 60 秒極速挑戰等遊戲化機制，讓練習更有動力。",
      categories: ["工具", "教育"],
      technologies: ["HTML5", "CSS3", "JavaScript", "JSON"],
      thumbnail: "assets/thumbnails/typing.png",
      screenshots: ["assets/thumbnails/typing.png"],
      detailPage: "projects/typing-practice/",
      demoUrl: "projects/typing-practice/play/",
      githubUrl: "https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/typing-practice",
      createdAt: "2026-08-19",
      updatedAt: "2026-08-19",
      featured: true,
      accent: "#7c5cff",
      features: [
        "7 堂循序漸進課程：基準鍵 → Home Row → Top Row → Bottom Row → 混合 → 單字 → 句子",
        "虛擬 QWERTY 鍵盤即時高亮下一個按鍵，並標示手指",
        "即時統計：WPM、正確率、錯誤數、練習時間",
        "遊戲化系統：經驗值、等級、10 個成就、每日任務、連續練習 Streak",
        "60 秒極速挑戰與個人最佳紀錄",
        "錯誤分析與弱點自動課程推薦",
        "深 / 淺色主題與音效背景音樂（Autoplay Policy 安全處理）",
        "無障礙：aria-live、reduced-motion、鍵盤操作完整支援"
      ],
      howToPlay: [
        "在首頁選擇課程或直接開始練習",
        "按照虛擬鍵盤高亮的按鍵依序輸入",
        "Beginner 模式需修正錯誤後才能繼續，Normal 模式可跳過",
        "完成練習後查看成績、錯誤分析與獲得 XP"
      ],
      highlights: [
        "資料驅動課程，新增課程只需編輯 JSON 檔",
        "300+ 分級單字與 52 句生活化句子",
        "localStorage 儲存進度，不依賴後端",
        "防止作弊：禁用複製貼上與右鍵選單",
        "完整自動化測試（Node 執行，無第三方框架）"
      ]
    },
    {
      id: "search-visualizer",
      slug: "search-visualizer",
      title: "搜尋演算法視覺化",
      shortDescription: "用動畫看懂順序搜尋與二分搜尋，逐步展示比較過程與複雜度。",
      description:
        "「搜尋演算法視覺化」是一款教育用視覺化工具，以動畫逐步展示順序搜尋（Linear Search）與二分搜尋（Binary Search）的執行過程。每步操作都會搭配陣列狀態、比較次數統計與演算法程式碼高亮，讓抽象的搜尋邏輯變得容易理解。",
      categories: ["視覺化", "教育"],
      technologies: ["HTML5", "CSS3", "JavaScript"],
      thumbnail: "assets/thumbnails/search.png",
      screenshots: ["assets/thumbnails/search.png"],
      detailPage: "projects/search-visualizer/",
      demoUrl: "projects/search-visualizer/play/",
      githubUrl: "https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/search-visualizer",
      createdAt: "2026-08-14",
      updatedAt: "2026-08-14",
      featured: false,
      accent: "#34a853",
      features: [
        "順序搜尋：從頭到尾逐項比較，適合未排序資料",
        "二分搜尋：每次縮小一半搜尋範圍，需已排序資料",
        "自動產生排序資料與搜尋目標，可自訂資料筆數",
        "逐步動畫：比較、命中、未命中狀態清楚標示",
        "比較模式：同時比較兩種演算法的效率",
        "演算法程式碼與學習重點同步高亮"
      ],
      howToPlay: [
        "點「產生資料與搜尋目標」建立新的搜尋問題",
        "點擊「開始」播放演算法執行動畫",
        "使用上一步 / 下一步逐步觀察比較過程",
        "切換至比較模式觀察兩種演算法的效率差異"
      ],
      highlights: [
        "純邏輯步驟產生器，動畫與演算法分離，易於維護",
        "統計比較次數與搜尋效率",
        "適合教學展示與自學理解"
      ]
    },
    {
      id: "sorting-visualizer",
      slug: "sorting-visualizer",
      title: "排序演算法視覺化",
      shortDescription: "用動畫看懂氣泡、選擇、插入、合併與貪心五種排序，逐步展示交換與比較。",
      description:
        "「排序演算法視覺化」是一款教育用視覺化工具，以動畫逐步展示氣泡、選擇、插入、合併與貪心五種排序法的執行過程。每個步驟都會標示比較與交換的元素、更新複雜度統計，並同步高亮對應的演算法程式碼，讓排序邏輯一目瞭然。",
      categories: ["視覺化", "教育"],
      technologies: ["HTML5", "CSS3", "JavaScript"],
      thumbnail: "assets/thumbnails/sorting.png",
      screenshots: ["assets/thumbnails/sorting.png"],
      detailPage: "projects/sorting-visualizer/",
      demoUrl: "projects/sorting-visualizer/play/",
      githubUrl: "https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/sorting-visualizer",
      createdAt: "2026-08-13",
      updatedAt: "2026-08-30",
      featured: false,
      accent: "#f4a53d",
      features: [
        "氣泡排序：相鄰比較並逐趟把最大元素浮到末端",
        "選擇排序：每趟選出剩餘最小元素放到前方",
        "插入排序：逐步建立已排序子序列",
        "合併排序：分割再合併，示範分治法（額外空間 O(n)）",
        "貪心排序：每次挑選剩餘最大元素放入正確位置",
        "比較模式與競賽模式（Race）：同時播放觀察五種演算法的效率差異"
      ],
      howToPlay: [
        "點「產生新資料」建立隨機資料陣列",
        "選擇要觀看的排序演算法",
        "播放或逐步操作觀察排序過程",
        "使用比較模式一次觀看五種排序的效率，或以 Race 看誰最快完成"
      ],
      highlights: [
        "純邏輯步驟產生器，動畫與演算法分離，易於維護",
        "每步更新比較次數、交換次數與複雜度統計",
        "五種演算法皆通過自動化邏輯、UI 與真實瀏覽器驗證",
        "適合教學展示與自學理解"
      ]
    },
    {
      id: "gold-miner",
      slug: "gold-miner",
      title: "挖金礦 Gold Miner",
      shortDescription: "經典挖金礦小遊戲，操控鉤爪挖取黃金與寶石，避開岩石與炸藥。",
      description:
        "「挖金礦」是一款經典的鉤爪挖掘小遊戲。玩家操控鉤爪深入地下，抓取黃金、鑽石與神秘袋，避開無價值的岩石，並在商店升級裝備。遊戲包含 10 個關卡、目標金額、三種加速效果與多種道具，節奏明快、操作直覺。",
      categories: ["遊戲"],
      technologies: ["HTML5", "Canvas", "JavaScript", "Web Audio API"],
      thumbnail: "assets/thumbnails/gold-miner.png",
      screenshots: ["assets/thumbnails/gold-miner.png"],
      detailPage: "projects/gold-miner/",
      demoUrl: "projects/gold-miner/play/",
      githubUrl: "https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/gold-miner",
      createdAt: "2026-07-26",
      updatedAt: "2026-07-26",
      featured: false,
      accent: "#f4c542",
      features: [
        "經典鉤爪挖掘玩法，抓取黃金與鑽石",
        "10 個關卡，每個關卡有目標金額",
        "神秘袋隨機獎勵：金幣、鑽石、炸藥、加速、雙倍金錢",
        "商店系統：幸運草、力量飲料、鑽石拋光等永久升級",
        "Web Audio API 合成音效與粒子特效",
        "支援全螢幕與鍵盤 / 滑鼠雙操作"
      ],
      howToPlay: [
        "按 Space 或滑鼠左鍵發射鉤爪",
        "鉤中黃金與鑽石可獲得金錢",
        "按下鍵或滑鼠右鍵使用炸藥炸掉岩石",
        "達到目標金額即可過關"
      ],
      highlights: [
        "模組化場景架構（選單 / 倒數 / 遊玩 / 商店 / 結算）",
        "鏡頭震動、粒子系統與 Tween 動畫",
        "最高分與關卡進度自動儲存"
      ]
    },
    {
      id: "lunch-angel",
      slug: "lunch-angel",
      title: "午餐小天使",
      shortDescription: "高中生查詢校園午餐資訊的 LINE 聊天機器人（Node.js 後端專案）。",
      description:
        "「午餐小天使」是一支提供高中生查詢校園午餐資訊的 LINE 聊天機器人後端。它接收 LINE Messaging API 的 Webhook 事件、驗證簽名、解析學校午餐 PDF 菜單，並透過排程同步與即時回覆功能，讓學生能用 LINE 輕鬆查詢當日午餐。此專案以 Node.js 建置，屬後端服務，需搭配 LINE Official Account 與伺服器執行。",
      categories: ["工具", "Web"],
      technologies: ["Node.js", "Express", "LINE Messaging API", "pdfjs-dist"],
      thumbnail: "assets/thumbnails/lunch-angel.png",
      screenshots: ["assets/thumbnails/lunch-angel.png"],
      detailPage: "projects/lunch-angel/",
      demoUrl: null,
      githubUrl: "https://github.com/QiuGavintw/lunch-angel",
      createdAt: "2026-08-21",
      updatedAt: "2026-08-21",
      featured: false,
      accent: "#ff6b81",
      features: [
        "LINE Messaging API Webhook 事件接收與簽名驗證",
        "午餐菜單 PDF 解析與排程同步",
        "日期查詢與即時文字回覆",
        "完整單元測試（Node 原生 test runner）",
        "支援手機使用（LINE 聊天介面）"
      ],
      howToPlay: [],
      highlights: [
        "屬後端服務專案，需 Node.js 環境執行",
        "原始碼位於獨立 Repository：QiuGavintw/lunch-angel",
        "專案在 GitHub Pages 無法直接執行，此頁提供完整介紹與程式碼連結"
      ]
    },
    {
      id: "mahjong",
      slug: "mahjong",
      title: "台灣麻將",
      shortDescription: "以純 JavaScript 打造的四人台灣 16 張麻將單機遊戲，內建 AI 玩家、完整規則與計分、Canvas 牌桌、動畫與音效。",
      description:
        "「台灣麻將」是一款以純前端技術打造的四人台灣 16 張麻將單機遊戲。遊戲內建完整規則引擎（摸牌、捨牌、吃、碰、明槓、暗槓、加槓、胡牌、過水、海底河底、流局）與特殊事件（天胡、地胡、人胡、門清自摸、地聽、搶槓、海底撈月、河底撈魚、花牌八仙／七搶一），並以零和結算計算台數與支付。三位 AI 玩家採用向聽數決策與安全張風險加權，牌桌以 Canvas 繪製，真人可完整操作一局：開始、摸牌、捨牌、吃碰槓胡過、自摸／暗槓／加槓確認、結算、下一局、對局結束與重來。",
      categories: ["遊戲", "教育"],
      technologies: ["HTML5", "CSS3", "Canvas", "JavaScript", "ES Modules", "Web Audio API"],
      thumbnail: "assets/thumbnails/mahjong.svg",
      screenshots: ["assets/thumbnails/mahjong.svg"],
      detailPage: "projects/mahjong/",
      demoUrl: "projects/mahjong/play/",
      githubUrl: "https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/mahjong",
      createdAt: "2026-08-31",
      updatedAt: "2026-08-31",
      featured: false,
      accent: "#2f6f5e",
      features: [
        "完整台灣 16 張麻將規則：摸牌、捨牌、吃、碰、明槓、暗槓、加槓、胡（自摸／榮胡／一炮多響）、過水、海底河底、流局",
        "特殊事件：天胡、地胡、人胡、門清自摸、地聽、搶槓、海底撈月、河底撈魚、花牌八仙／七搶一",
        "台數與零和支付結算，一炮多響逐位計分",
        "三位 AI 玩家：向聽數決策＋安全張風險加權（balanced／aggressive／defensive 策略）",
        "Canvas 牌桌：真人手牌牌面、AI 只顯示背牌、河牌、副露、花、牌牆、目前玩家、莊家",
        "動畫：摸牌、捨牌、吃碰槓、花牌補牌、胡牌、回合切換（確定性時鐘＋requestAnimationFrame）",
        "音效與 BGM：Web Audio 程序合成、音量／靜音分離、Autoplay Policy 安全處理",
        "真人互動：自摸／暗槓／加槓確認、結算顯示、下一局、對局結束、重來"
      ],
      howToPlay: [
        "點「開始」發牌；輪到你時按「摸牌」",
        "點選手牌再按「捨牌」出牌",
        "AI 捨牌後可選擇「胡／碰／槓／吃／過」",
        "自摸、暗槓、加槓時會出現確認；一局結束按「結算」查看台數與支付",
        "本局結束後按「下一局」續局，或按「重來」重新開始"
      ],
      highlights: [
        "純前端、零依賴、ES Modules；決定性 RNG 使同一 seed 完全可重現",
        "核心規則與 UI 徹底分層：GameEngine → Adapter → GameUI → Canvas，全部 400+ 測試通過",
        "AI 手牌只顯示背牌與張數，隱私絕不外洩",
        "動畫與音效皆為確定性、可注入時鐘／fake backend 的可測試抽象"
      ]
    }
  ];

  PROJECTS.forEach(function (p, i) {
    if (!p.id) p.id = "project-" + (i + 1);
  });

  if (typeof module !== "undefined" && module.exports) {
    module.exports = PROJECTS;
  }
  global.PROJECTS = PROJECTS;
})(typeof window !== "undefined" ? window : globalThis);
