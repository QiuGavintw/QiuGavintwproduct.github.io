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
      shortDescription: "用動畫看懂氣泡排序、選擇排序與插入排序，逐步展示交換與比較。",
      description:
        "「排序演算法視覺化」是一款教育用視覺化工具，以動畫逐步展示氣泡排序、選擇排序與插入排序的執行過程。每個步驟都會標示比較與交換的元素、更新複雜度統計，並同步高亮對應的演算法程式碼，讓排序邏輯一目瞭然。",
      categories: ["視覺化", "教育"],
      technologies: ["HTML5", "CSS3", "JavaScript"],
      thumbnail: "assets/thumbnails/sorting.png",
      screenshots: ["assets/thumbnails/sorting.png"],
      detailPage: "projects/sorting-visualizer/",
      demoUrl: "projects/sorting-visualizer/play/",
      githubUrl: "https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/sorting-visualizer",
      createdAt: "2026-08-13",
      updatedAt: "2026-08-13",
      featured: false,
      accent: "#f4a53d",
      features: [
        "氣泡排序：相鄰比較並逐趟把最大元素浮到末端",
        "選擇排序：每趟選出最小元素放到前方",
        "插入排序：逐步建立已排序子序列",
        "三種排序法比較模式，同時播放觀察效率差異",
        "逐步動畫：比較 / 交換 / 已排序狀態清楚標示",
        "演算法程式碼與學習重點同步高亮"
      ],
      howToPlay: [
        "點「產生新資料」建立隨機資料陣列",
        "選擇要觀看的排序演算法",
        "播放或逐步操作觀察排序過程",
        "使用比較模式一次觀看三種排序的效率"
      ],
      highlights: [
        "純邏輯步驟產生器，動畫與演算法分離，易於維護",
        "每步更新比較次數、交換次數與複雜度統計",
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
      id: "snake",
      slug: "snake",
      title: "貪吃蛇",
      shortDescription: "經典貪吃蛇全面進化版，道具、成就、主題與多種模式一次滿足。",
      description:
        "「貪吃蛇」是一款經典貪吃蛇遊戲的全面進化版本。除了基本吃食物成長玩法，更加入加速、凍結、穿牆等道具系統，以及主題切換、成就系統、音效與 Combo 特效。支援經典、闖關與時間挑戰等多種模式，甚至提供雙人對戰。",
      categories: ["遊戲"],
      technologies: ["HTML5", "Canvas", "JavaScript", "Web Audio API"],
      thumbnail: "assets/thumbnails/snake.png",
      screenshots: ["assets/thumbnails/snake.png"],
      detailPage: "projects/snake/",
      demoUrl: "projects/snake/play/",
      githubUrl: "https://github.com/QiuGavintw/QiuGavintwproduct.github.io/tree/master/projects/snake",
      createdAt: "2026-07-20",
      updatedAt: "2026-07-20",
      featured: false,
      accent: "#34c759",
      features: [
        "經典貪吃蛇玩法，支援方向鍵與滑桿控制",
        "道具系統：加速、凍結、穿牆，磁鐵吸引果實",
        "多種遊戲模式：經典、闖關、時間挑戰、雙人對戰",
        "成就系統與里程碑語音提示",
        "主題切換與粒子特效（Combo VFX）",
        "Web Audio API 即時合成音效與背景音樂",
        "最高分與等級自動儲存"
      ],
      howToPlay: [
        "使用方向鍵或 WASD 控制蛇的移動",
        "吃到食物可讓蛇變長並獲得分數",
        "拾取道具獲得特殊能力",
        "避免撞牆或咬到自己，雙人模式避免互撞"
      ],
      highlights: [
        "畫布全向量繪製，支援不同視窗尺寸",
        "豐富的 VFX 與粒子特效",
        "多模式玩法增加耐玩度"
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
