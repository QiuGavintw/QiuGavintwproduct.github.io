'use strict';

/* =========================================================
   打字訓練中心 — app.js
   模組：FingerMap / Storage / Timer / KeyboardView /
         PracticeEngine / Stats / LessonManager / Weakness /
         UI helpers / App
   ========================================================= */

/* ---------- 小工具 ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr() {
  const d = new Date(Date.now() - 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* =========================================================
   FingerMap — QWERTY 十指配置資料
   ========================================================= */
const FINGERS = {
  q: 'left-pinky', a: 'left-pinky', z: 'left-pinky',
  w: 'left-ring', s: 'left-ring', x: 'left-ring',
  e: 'left-middle', d: 'left-middle', c: 'left-middle',
  r: 'left-index', f: 'left-index', v: 'left-index', t: 'left-index', g: 'left-index', b: 'left-index',
  y: 'right-index', h: 'right-index', n: 'right-index', u: 'right-index', j: 'right-index', m: 'right-index',
  i: 'right-middle', k: 'right-middle', ',': 'right-middle',
  o: 'right-ring', l: 'right-ring', '.': 'right-ring',
  p: 'right-pinky', ';': 'right-pinky', '/': 'right-pinky',
  ' ': 'thumb'
};

const FINGER_LABELS = {
  'left-pinky':   { zh: '左手小指',   short: 'LP' },
  'left-ring':    { zh: '左手無名指', short: 'LR' },
  'left-middle':  { zh: '左手中指',   short: 'LM' },
  'left-index':   { zh: '左手食指',   short: 'LI' },
  'right-index':  { zh: '右手食指',   short: 'RI' },
  'right-middle': { zh: '右手中指',   short: 'RM' },
  'right-ring':   { zh: '右手無名指', short: 'RR' },
  'right-pinky':  { zh: '右手小指',   short: 'RP' },
  'thumb':        { zh: '拇指',       short: 'TH' }
};

const FINGER_ARROW = { left: '👈', right: '👉' };

const TYPING_KEYS = Object.keys(FINGERS).filter(k => k !== ' ');

function fingerOf(ch) {
  if (typeof ch !== 'string' || ch.length !== 1) return null;
  const n = /[a-zA-Z]/.test(ch) ? ch.toLowerCase() : ch;
  return FINGERS[n] || null;
}

/* =========================================================
   Weakness — 錯誤分析與弱點練習
   ========================================================= */
const Weakness = {
  analyzeErrorCounts(errorCounts) {
    const keys = Object.entries(errorCounts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const fingerCounts = {};
    for (const [key, count] of Object.entries(errorCounts)) {
      const f = fingerOf(key);
      if (!f) continue;
      fingerCounts[f] = (fingerCounts[f] || 0) + count;
    }
    const fingers = Object.entries(fingerCounts)
      .map(([finger, count]) => ({ finger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    return { keys, fingers };
  },

  combineErrorCounts(records) {
    const counts = {};
    for (const r of records) {
      if (!r.errorKeys || typeof r.errorKeys !== 'object') continue;
      for (const [k, c] of Object.entries(r.errorKeys)) {
        counts[k] = (counts[k] || 0) + c;
      }
    }
    return counts;
  },

  buildWeaknessTexts(keys) {
    const set = [...new Set(keys)]
      .map(k => String(k).toLowerCase())
      .filter(k => /^[a-z,./;]$/.test(k))
      .slice(0, 4);
    if (!set.length) return [];
    const texts = [];
    texts.push(set.map(k => k + k).join(' '));
    texts.push(set.map(k => k + k + k).join(' '));
    if (set.length >= 2) {
      const perms3 = this._perms(set.slice(0, 3));
      texts.push(perms3.map(p => p.join('')).join(' '));
    }
    if (set.length >= 3) {
      const permsAll = this._perms(set);
      texts.push(permsAll.map(p => p.join('')).join(' '));
    }
    const pairs = [];
    for (let i = 0; i < set.length; i++) {
      for (let j = 0; j < set.length; j++) {
        if (i !== j) pairs.push(set[i] + set[j]);
      }
    }
    texts.push(pairs.join(' '));
    if (set.length >= 2) {
      const mirror = [];
      for (let i = 0; i < set.length; i++) {
        for (let j = 0; j < set.length; j++) {
          if (i !== j) mirror.push(set[i] + set[j] + set[i]);
        }
      }
      texts.push(mirror.join(' '));
    }
    if (set.length === 4) {
      texts.push(set.join(''));
      texts.push(set.slice().reverse().join(''));
    }
    texts.push('asdf jkl; ' + set.join(' ') + ' asdf jkl;');
    return texts.filter(t => t.trim()).slice(0, 10);
  },

  _perms(arr) {
    if (arr.length <= 1) return [arr.slice()];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (const p of this._perms(rest)) out.push([arr[i]].concat(p));
    }
    return out;
  },

  buildWeaknessLesson(keys) {
    const set = [...new Set(keys)]
      .map(k => String(k).toLowerCase())
      .filter(k => /^[a-z,./;]$/.test(k))
      .slice(0, 4);
    return {
      id: 'weakness-custom',
      title: '🎯 加強弱點練習',
      level: 0,
      type: 'letters',
      requiredAccuracy: 85,
      requiredCompletions: 1,
      focusKeys: set,
      texts: this.buildWeaknessTexts(set)
    };
  }
};

/* =========================================================
   Gamification — XP / Level / 純邏輯
   ========================================================= */
const LEVEL_XP = [0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 3000];
const LEVEL_EXTRA_STEP = 500;

const LEVEL_NAMES = {
  1: '🐣 新手', 2: '🌱 初學者', 3: '🚶 熟練者', 4: '🏃 快手',
  5: '⚡ 高手', 6: '🚀 打字達人', 7: '👑 鍵盤王者',
  8: '🌟 星級打字員', 9: '💎 鑽石手', 10: '🔱 極致王者'
};

const Gamification = {
  xpForLevel(level) {
    if (level <= LEVEL_XP.length) return LEVEL_XP[level - 1];
    return LEVEL_XP[LEVEL_XP.length - 1] + (level - LEVEL_XP.length) * LEVEL_EXTRA_STEP;
  },

  getLevelFromXP(xp) {
    let lv = 1;
    while (xp >= this.xpForLevel(lv + 1)) lv += 1;
    return lv;
  },

  getXPForNextLevel(level) {
    return this.xpForLevel(level + 1);
  },

  getLevelName(level) {
    return LEVEL_NAMES[level] || '🌟 傳奇高手';
  },

  getLevelProgress(xp) {
    const level = this.getLevelFromXP(xp);
    const floor = this.xpForLevel(level);
    const next = this.getXPForNextLevel(level);
    const span = next - floor;
    const intoLevel = Math.max(0, xp - floor);
    const pct = span > 0 ? Math.min(100, Math.round(intoLevel / span * 100)) : 100;
    return { level, xp, floor, next, intoLevel, pct, name: this.getLevelName(level) };
  },

  /**
   * 計算一次練習獲得的 XP。
   * @param {{accuracy:number, wpm:number}} record
   * @param {{newPersonalBest?:boolean, courseCompleted?:boolean, dailyTaskBonus?:number[]}} ctx
   */
  calculatePracticeXP(record, ctx = {}) {
    let xp = 10;
    if ((record.accuracy || 0) >= 95) xp += 5;
    if (ctx.newPersonalBest) xp += 10;
    if (ctx.courseCompleted) xp += 15;
    if (Array.isArray(ctx.dailyTaskBonus) && ctx.dailyTaskBonus.length) {
      xp += 20 * ctx.dailyTaskBonus.length;
    }
    return Math.max(0, xp);
  }
};

/* =========================================================
   成就 / 每日任務定義 + AchievementManager
   ========================================================= */
const ACHIEVEMENT_DEFS = [
  { id: 'first-practice',        icon: '🐣', title: '初次練習',       description: '完成第一次練習' },
  { id: 'speed-30',              icon: '⚡',  title: '30 WPM',        description: '第一次達到 30 WPM' },
  { id: 'speed-50',              icon: '🚀',  title: '50 WPM',        description: '第一次達到 50 WPM' },
  { id: 'speed-80',              icon: '👑',  title: '80 WPM',        description: '第一次達到 80 WPM' },
  { id: 'perfect-accuracy',      icon: '🎯',  title: '精準打擊',      description: '單次練習正確率 100%' },
  { id: 'streak-3',              icon: '🔥',  title: '三日連續',      description: '連續練習 3 天' },
  { id: 'streak-7',              icon: '🔥',  title: '七日連續',      description: '連續練習 7 天' },
  { id: 'complete-lesson-1',     icon: '📚',  title: '完成第一課',    description: '完成 Lesson 1' },
  { id: 'complete-all-lessons',  icon: '🎓',  title: '完成全部基礎課程', description: '完成目前所有課程' },
  { id: 'breakthrough',          icon: '🏆',  title: '突破自己',      description: 'WPM 創下新的個人最佳' }
];

const DAILY_TASK_DEFS = [
  { id: 'practice-3',       title: '完成 3 次練習',       target: 3 },
  { id: 'accuracy-95',      title: '正確率達到 95%',      target: 1 },
  { id: 'speed-challenge',  title: '完成一次 60 秒挑戰',  target: 1 }
];

const SPEED_CHALLENGE_DURATION = 60000; // 60 秒極速挑戰
const SPEED_CHALLENGE_MIN_CHARS = 600;  // 挑戰文字至少字數（100 WPM × 60s ≈ 500 字，預留緩衝）
const DAILY_TASK_BONUS_XP = 20;

class AchievementManager {
  constructor(storage) {
    this.storage = storage;
  }

  getAchievements() {
    const unlocked = this.storage.data.gamification.achievements || {};
    return ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      unlocked: !!unlocked[def.id],
      unlockedAt: unlocked[def.id] ? unlocked[def.id].unlockedAt : null
    }));
  }

  getUnlockedCount() {
    return this.getAchievements().filter(a => a.unlocked).length;
  }

  isUnlocked(id) {
    return !!(this.storage.data.gamification.achievements || {})[id];
  }

  unlock(id, at = new Date().toISOString()) {
    const map = this.storage.data.gamification.achievements || {};
    if (map[id]) return false;
    map[id] = { unlockedAt: at };
    this.storage.data.gamification.achievements = map;
    this.storage.save();
    return true;
  }

  /**
   * 練習完成後檢查成就。回傳本次新解鎖的 id 清單。
   */
  checkAfterPractice(ctx) {
    const newly = [];
    const tryUnlock = id => {
      if (this.unlock(id)) newly.push(id);
    };
    const record = ctx.record || {};
    if (this.storage.data.stats.totalPractices >= 1) tryUnlock('first-practice');
    if (record.wpm >= 30) tryUnlock('speed-30');
    if (record.wpm >= 50) tryUnlock('speed-50');
    if (record.wpm >= 80) tryUnlock('speed-80');
    if (record.accuracy === 100) tryUnlock('perfect-accuracy');
    if ((ctx.streak || 0) >= 3) tryUnlock('streak-3');
    if ((ctx.streak || 0) >= 7) tryUnlock('streak-7');
    if (ctx.courseCompletedId === 'lesson-01') tryUnlock('complete-lesson-1');
    if (ctx.allLessonsCompleted) tryUnlock('complete-all-lessons');
    if (ctx.newPersonalBest) tryUnlock('breakthrough');
    return newly;
  }

  /**
   * 根據已儲存的進度補解鎖（例：載入舊資料時）。
   */
  checkCatchUp(ctx) {
    const newly = [];
    const tryUnlock = id => {
      if (this.unlock(id)) newly.push(id);
    };
    const pb = this.storage.data.personalBest || {};
    if (this.storage.data.stats.totalPractices >= 1) tryUnlock('first-practice');
    if ((pb.bestWpm || 0) >= 30) tryUnlock('speed-30');
    if ((pb.bestWpm || 0) >= 50) tryUnlock('speed-50');
    if ((pb.bestWpm || 0) >= 80) tryUnlock('speed-80');
    if ((ctx.streak || 0) >= 3) tryUnlock('streak-3');
    if ((ctx.streak || 0) >= 7) tryUnlock('streak-7');
    if (ctx.lessonOneCompleted) tryUnlock('complete-lesson-1');
    if (ctx.allLessonsCompleted) tryUnlock('complete-all-lessons');
    if (newly.length) this.storage.save();
    return newly;
  }
}

/* =========================================================
   AudioManager — 音效 / 背景音樂（安全 fallback）
   - 不依賴實際音檔：找不到檔案時一律安全停用，不產生 Console Error
   - 遵守瀏覽器 Autoplay Policy：背景音樂需先解鎖（使用者首次互動）才播放
   ========================================================= */
const SFX_FILES = {
  correct: './assets/sounds/correct.mp3',
  error: './assets/sounds/error.mp3',
  complete: './assets/sounds/complete.mp3',
  levelUp: './assets/sounds/level-up.mp3',
  achievement: './assets/sounds/achievement.mp3',
  button: './assets/sounds/button.mp3'
};

function clamp01(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

class AudioManager {
  constructor(opts = {}) {
    this.sfxEnabled = opts.sfxEnabled !== false;
    this.sfxVolume = clamp01(opts.sfxVolume);
    this.musicEnabled = opts.musicEnabled === true;
    this.musicVolume = clamp01(opts.musicVolume);
    this.unlocked = false;
    this._musicBroken = false;
    this._sfxCache = {};
    this.unavailable = typeof Audio === 'undefined' || typeof window === 'undefined';
    this.music = null;
    this._loadMusic();
  }

  _loadMusic() {
    if (this.unavailable) return;
    try {
      this.music = new Audio('./assets/sounds/background.mp3');
      this.music.loop = true;
      this.music.volume = this.musicVolume;
      this.music.addEventListener('error', () => {
        this._musicBroken = true;
        this.music = null;
      });
    } catch (e) {
      this._musicBroken = true;
      this.music = null;
    }
  }

  /**
   * 使用者首次互動後呼叫，解鎖 Audio（Autoplay Policy）。
   */
  unlock() {
    if (this.unavailable) return;
    this.unlocked = true;
    if (this.musicEnabled && this.music) {
      this.music.play().catch(() => {
        this._musicBroken = true;
      });
    }
  }

  _sfx(name) {
    if (this.unavailable || !this.sfxEnabled) return;
    if (this._sfxCache[name] === false) return; // 已確認損壞
    let el = this._sfxCache[name];
    if (!el) {
      try {
        el = new Audio(SFX_FILES[name]);
        el.volume = this.sfxVolume;
        el.addEventListener('error', () => {
          this._sfxCache[name] = false;
        });
        this._sfxCache[name] = el;
      } catch (e) {
        this._sfxCache[name] = false;
        return;
      }
    }
    try {
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) { /* noop */ }
  }

  playCorrect() { this._sfx('correct'); }
  playError() { this._sfx('error'); }
  playComplete() { this._sfx('complete'); }
  playLevelUp() { this._sfx('levelUp'); }
  playAchievement() { this._sfx('achievement'); }
  playButton() { this._sfx('button'); }

  setSfxVolume(v) {
    this.sfxVolume = clamp01(v);
    for (const k in this._sfxCache) {
      const el = this._sfxCache[k];
      if (el) el.volume = this.sfxVolume;
    }
  }

  setMusicVolume(v) {
    this.musicVolume = clamp01(v);
    if (this.music) this.music.volume = this.musicVolume;
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled && this.music) {
      if (this.unlocked) {
        this.music.play().catch(() => { this._musicBroken = true; });
      }
    } else if (this.music) {
      try { this.music.pause(); } catch (e) { /* noop */ }
    }
    return this.musicEnabled;
  }
}

/* =========================================================
   內建課程備援（file:// 開啟時 fetch 失敗用）
   ========================================================= */
const DEFAULT_LESSONS = [
  {
    id: 'lesson-01', title: '基準鍵 F J', level: 1, type: 'letters',
    requiredAccuracy: 85, requiredCompletions: 2, focusKeys: ['f', 'j'],
    intro: { head: '今天學習：左右食指', body: 'F 和 J 是基準鍵，上面有凸起的小點。', tip: '💡 F 和 J 上有凸起的小點，可以幫助你找到 Home Row。' },
    texts: ['ffff jjjj', 'ffjj fjfj', 'ff jj ff jj', 'fff jjj fff jjj', 'fjfj fjfj fjfj', 'fjjf jffj fjjf', 'fj fj fj fj fj fj', 'ff fff jjj jj f j']
  },
  {
    id: 'lesson-02', title: 'Home Row', level: 2, type: 'letters',
    requiredAccuracy: 85, requiredCompletions: 2, focusKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
    intro: { head: '今天學習：Home Row', body: 'Home Row 是手的起點：A S D F J K L ;', tip: '💡 打字時不要一直看鍵盤。' },
    texts: ['asdf jkl;', 'asdf jkl; asdf jkl;', 'aa ss dd ff jj kk ll ;;', 'sad lad fall lass', 'fjf jfj dkd kdk', 'asdf fdsa jkl; ;lkj']
  },
  {
    id: 'lesson-03', title: 'Top Row', level: 3, type: 'letters',
    requiredAccuracy: 85, requiredCompletions: 2, focusKeys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    intro: { head: '今天學習：Top Row', body: '上排：Q W E R T Y U I O P', tip: '💡 上排只需要手指往上伸。' },
    texts: ['qwer uiop', 'qq ww ee rr tt yy uu ii oo pp', 'qwertyuiop', 'we ri po uq ty', 'qwerty asdf jkl; uiop']
  },
  {
    id: 'lesson-04', title: 'Bottom Row', level: 4, type: 'letters',
    requiredAccuracy: 85, requiredCompletions: 2, focusKeys: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
    intro: { head: '今天學習：Bottom Row', body: '下排：Z X C V B N M , . /', tip: '💡 打完後回到 Home Row。' },
    texts: ['zxcv bnm , . /', 'zz xx cc vv bb nn mm ,, .. //', 'zxcvbnm ,. /', 'xc vb nm zx', 'zxcv asdf jkl; bnm']
  },
  {
    id: 'lesson-05', title: '混合鍵位', level: 5, type: 'letters',
    requiredAccuracy: 85, requiredCompletions: 2, focusKeys: [],
    intro: { head: '今天學習：混合鍵位', body: '把三排按鍵混合練習。', tip: '💡 不看鍵盤，憑感覺找按鍵位置。' },
    texts: ['qwerty asdfg zxcvb', 'qwertyuiop asdfghjkl; zxcvbnm', 'the quick brown fox', 'jumps over the lazy dog', 'abcdefghijklmnopqrstuvwxyz']
  },
  {
    id: 'lesson-06', title: '常見單字', level: 6, type: 'words',
    requiredAccuracy: 85, requiredCompletions: 2, focusKeys: [],
    intro: { head: '今天學習：常見單字', body: '練習常用英文單字。', tip: '💡 一次看整個單字。' },
    texts: []
  },
  {
    id: 'lesson-07', title: '英文句子', level: 7, type: 'sentences',
    requiredAccuracy: 85, requiredCompletions: 2, focusKeys: [],
    intro: { head: '今天學習：英文句子', body: '練習完整句子。', tip: '💡 句點後記得空一格。' },
    texts: []
  }
];

const WORDS_FALLBACK = {
  easy: ['apple', 'school', 'student', 'computer', 'keyboard', 'teacher', 'practice', 'learning', 'friend', 'class', 'book', 'desk'],
  medium: ['reading', 'writing', 'subject', 'science', 'history', 'music', 'library', 'family', 'breakfast', 'homework'],
  hard: ['beautiful', 'environment', 'important', 'interesting', 'education', 'together', 'remember', 'language']
};

const SENTENCES_FALLBACK = [
  'I like computer science.',
  'Learning to type takes practice.',
  'I can type faster every day.',
  'The quick brown fox jumps over the lazy dog.'
];

/* =========================================================
   Storage — localStorage 管理
   ========================================================= */
const STORAGE_KEY = 'typing_practice_v1';

class Storage {
  constructor() {
    this.data = this._load();
  }

  defaultData() {
    return {
      settings: {
        showKeyboard: true,
        showFingerHints: true,
        errorSound: true,
        sound: true,
        soundVolume: 0.5,
        music: false,
        musicVolume: 0.3,
        keyboardTheme: 'dark',
        difficulty: 'beginner',
        autoAdvance: true,
        theme: 'light',
        sfxEnabled: true,
        sfxVolume: 0.35,
        musicEnabled: false,
        musicVolume: 0.3
      },
      stats: {
        highestWpm: 0,
        bestAccuracy: 0,
        totalPractices: 0,
        totalTimeMs: 0,
        totalCorrectChars: 0,
        today: { date: '', count: 0, bestWpm: 0 },
        streak: 0,
        longestStreak: 0,
        lastPracticeDate: ''
      },
      achievements: [],
      dailyTasks: { date: null, tasks: [] },
      lessonProgress: {},
      gamification: {
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: '',
        achievements: {}
      },
      personalBest: {
        bestWpm: 0,
        bestAccuracy: 0,
        fastestCompletion: null
      },
      practiceHistory: []
    };
  }

  _load() {
    const def = this.defaultData();
    let raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }

    let parsed = null;
    if (raw) {
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    }
    if (!parsed || typeof parsed !== 'object') parsed = {};

    const data = {
      settings: { ...def.settings, ...(parsed.settings || {}) },
      stats: {
        ...def.stats,
        ...(parsed.stats || {}),
        today: { ...def.stats.today, ...(((parsed.stats || {}).today) || {}) }
      },
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      dailyTasks: { ...def.dailyTasks, ...(parsed.dailyTasks || {}) },
      lessonProgress: (parsed.lessonProgress && typeof parsed.lessonProgress === 'object') ? parsed.lessonProgress : {},
      gamification: { ...def.gamification, ...(parsed.gamification || {}) },
      personalBest: { ...def.personalBest, ...(parsed.personalBest || {}) },
      practiceHistory: Array.isArray(parsed.practiceHistory) ? parsed.practiceHistory : []
    };

    for (const k of Object.keys(def.stats)) {
      if (k === 'today') continue;
      if (typeof data.stats[k] !== 'number' || Number.isNaN(data.stats[k])) {
        data.stats[k] = def.stats[k];
      }
    }
    return migrateStorage(data);
  }

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (e) { /* 忽略配額問題 */ }
  }

  addPractice(record) {
    const stats = this.data.stats;
    const pb = this.data.personalBest;
    const prevWpmPB = pb.bestWpm;

    this.data.practiceHistory.push(record);
    if (this.data.practiceHistory.length > 500) {
      this.data.practiceHistory = this.data.practiceHistory.slice(-500);
    }

    if (record.wpm > stats.highestWpm) stats.highestWpm = record.wpm;
    if (record.accuracy > stats.bestAccuracy) stats.bestAccuracy = record.accuracy;
    stats.totalPractices += 1;
    stats.totalTimeMs += record.durationMs;
    stats.totalCorrectChars += record.correctCharacters;

    if (record.wpm > pb.bestWpm) pb.bestWpm = record.wpm;
    if (record.accuracy > pb.bestAccuracy) pb.bestAccuracy = record.accuracy;
    if (record.duration > 0 &&
        (!pb.fastestCompletion || record.duration < pb.fastestCompletion.duration)) {
      pb.fastestCompletion = {
        wpm: record.wpm,
        accuracy: record.accuracy,
        duration: record.duration,
        date: todayStr()
      };
    }

    const t = todayStr();
    if (stats.today.date === t) {
      stats.today.count += 1;
      if (record.wpm > stats.today.bestWpm) stats.today.bestWpm = record.wpm;
    } else {
      stats.today = { date: t, count: 1, bestWpm: record.wpm };
    }

    if (stats.lastPracticeDate !== t) {
      const y = yesterdayStr();
      stats.streak = stats.lastPracticeDate === y ? stats.streak + 1 : 1;
      stats.lastPracticeDate = t;
      if (stats.streak > stats.longestStreak) stats.longestStreak = stats.streak;
    }

    this.data.gamification.currentStreak = stats.streak;
    this.data.gamification.longestStreak = stats.longestStreak;
    this.data.gamification.lastPracticeDate = stats.lastPracticeDate;

    this.save();
    return { newRecord: prevWpmPB > 0 && record.wpm > prevWpmPB, prevBest: prevWpmPB };
  }

  clearAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
    this.data = this.defaultData();
  }
}

/* 每日任務（依日期建立） */
function freshDailyTasks(date) {
  const d = date || todayStr();
  return {
    date: d,
    tasks: DAILY_TASK_DEFS.map(t => ({
      id: t.id, title: t.title, target: t.target, progress: 0, completed: false
    }))
  };
}

/**
 * Storage Migration：
 * 讓 Phase 1 / Phase 2 舊資料自動補上新欄位，不刪除舊紀錄。
 */
function migrateStorage(data) {
  // 舊版音效設定遷移到新 AudioManager 設定
  const st = data.settings || (data.settings = {});
  if (st.sound === false && st.sfxEnabled === undefined) st.sfxEnabled = false;
  if (typeof st.soundVolume === 'number' && st.sfxVolume === undefined) st.sfxVolume = st.soundVolume;
  if (st.music === false && st.musicEnabled === undefined) st.musicEnabled = false;
  if (st.theme !== 'light' && st.theme !== 'dark') st.theme = 'light';

  // 新版音效 / 音樂設定預設值補齊
  if (st.sfxEnabled === undefined) st.sfxEnabled = true;
  if (typeof st.sfxVolume !== 'number') st.sfxVolume = 0.35;
  if (st.musicEnabled === undefined) st.musicEnabled = false;
  if (typeof st.musicVolume !== 'number') st.musicVolume = 0.3;

  data.gamification = data.gamification || {};
  const gacc = data.gamification.achievements;
  data.gamification.achievements = (gacc && typeof gacc === 'object' && !Array.isArray(gacc)) ? gacc : {};
  data.gamification.xp = Number.isFinite(data.gamification.xp) ? data.gamification.xp : 0;
  data.gamification.currentStreak = Number.isFinite(data.gamification.currentStreak) && data.gamification.currentStreak > 0
    ? data.gamification.currentStreak : (data.stats.streak || 0);
  data.gamification.longestStreak = Number.isFinite(data.gamification.longestStreak) && data.gamification.longestStreak > 0
    ? data.gamification.longestStreak : (data.stats.longestStreak || 0);
  data.gamification.lastPracticeDate = data.gamification.lastPracticeDate || data.stats.lastPracticeDate || '';

  data.personalBest = data.personalBest || { bestWpm: 0, bestAccuracy: 0, fastestCompletion: null };
  if (Number(data.personalBest.bestWpm) < data.stats.highestWpm) data.personalBest.bestWpm = data.stats.highestWpm;
  if (Number(data.personalBest.bestAccuracy) < data.stats.bestAccuracy) data.personalBest.bestAccuracy = data.stats.bestAccuracy;
  if (!data.personalBest.fastestCompletion || typeof data.personalBest.fastestCompletion !== 'object') {
    data.personalBest.fastestCompletion = null;
  }

  if (!data.dailyTasks || !Array.isArray(data.dailyTasks.tasks) || data.dailyTasks.date !== todayStr()) {
    data.dailyTasks = freshDailyTasks();
  }

  data.gamification.level = Gamification.getLevelFromXP(data.gamification.xp);

  if (!Number.isFinite(data.stats.streak)) data.stats.streak = 0;
  if (!Number.isFinite(data.stats.longestStreak)) data.stats.longestStreak = 0;
  if (!data.stats.today) data.stats.today = { date: '', count: 0, bestWpm: 0 };

  return data;
}

/* =========================================================
   Timer — 集中管理計時
   ========================================================= */
class Timer {
  constructor(onTick) {
    this._onTick = onTick || function () {};
    this._interval = null;
    this._running = false;
    this._base = 0;
    this._acc = 0;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._base = Date.now();
    this._interval = setInterval(() => this._onTick(this.getElapsedMs()), 200);
    this._onTick(this.getElapsedMs());
  }

  pause() {
    if (!this._running) return;
    this._acc += Date.now() - this._base;
    this._running = false;
    clearInterval(this._interval);
    this._interval = null;
  }

  resume() {
    if (this._running) return;
    this.start();
  }

  stop() {
    this._running = false;
    clearInterval(this._interval);
    this._interval = null;
  }

  reset() {
    this.stop();
    this._acc = 0;
    this._base = 0;
  }

  getElapsedMs() {
    return this._running ? this._acc + (Date.now() - this._base) : this._acc;
  }

  get running() { return this._running; }
}

/* =========================================================
   KeyboardView — 虛擬 QWERTY 鍵盤（含手指標示）
   ========================================================= */
const KB_LAYOUT = [
  [
    { t: '`', k: '`' }, { t: '1', k: '1' }, { t: '2', k: '2' },
    { t: '3', k: '3' }, { t: '4', k: '4' }, { t: '5', k: '5' },
    { t: '6', k: '6' }, { t: '7', k: '7' }, { t: '8', k: '8' },
    { t: '9', k: '9' }, { t: '0', k: '0' }, { t: '-', k: '-' },
    { t: '=', k: '=' }, { t: '⌫', k: 'Backspace', wide: true, mod: true }
  ],
  [
    { t: 'Tab', k: 'Tab', mod: true, wide: true },
    { t: 'Q', k: 'q' }, { t: 'W', k: 'w' }, { t: 'E', k: 'e' },
    { t: 'R', k: 'r' }, { t: 'T', k: 't' }, { t: 'Y', k: 'y' },
    { t: 'U', k: 'u' }, { t: 'I', k: 'i' }, { t: 'O', k: 'o' },
    { t: 'P', k: 'p' }, { t: '[', k: '[' }, { t: ']', k: ']' },
    { t: '\\', k: '\\' }
  ],
  [
    { t: 'Caps', k: 'CapsLock', mod: true, wide: true },
    { t: 'A', k: 'a' }, { t: 'S', k: 's' }, { t: 'D', k: 'd' },
    { t: 'F', k: 'f' }, { t: 'G', k: 'g' }, { t: 'H', k: 'h' },
    { t: 'J', k: 'j' }, { t: 'K', k: 'k' }, { t: 'L', k: 'l' },
    { t: ';', k: ';' }, { t: "'", k: "'" },
    { t: 'Enter ⌤', k: 'Enter', mod: true, wide: true }
  ],
  [
    { t: 'Shift', k: 'ShiftLeft', mod: true, wide: true },
    { t: 'Z', k: 'z' }, { t: 'X', k: 'x' }, { t: 'C', k: 'c' },
    { t: 'V', k: 'v' }, { t: 'B', k: 'b' }, { t: 'N', k: 'n' },
    { t: 'M', k: 'm' }, { t: ',', k: ',' }, { t: '.', k: '.' },
    { t: '/', k: '/' }, { t: 'Shift', k: 'ShiftRight', mod: true, wide: true }
  ],
  [{ t: 'space', k: ' ', space: true }]
];

class KeyboardView {
  constructor(rootEl) {
    this.root = rootEl;
    this._timeout = null;
  }

  build() {
    this.root.innerHTML = '';
    for (const row of KB_LAYOUT) {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      for (const item of row) {
        const key = document.createElement('div');
        key.className = 'kb-key';
        if (item.mod) key.classList.add('mod');
        if (item.wide) key.classList.add('wide');
        if (item.space) key.classList.add('space');
        key.dataset.key = item.k;
        key.textContent = item.t;
        key.setAttribute('aria-hidden', 'true');

        if (!item.space && !item.mod && !item.wide) {
          const finger = fingerOf(item.k);
          if (finger) {
            key.classList.add('f-' + finger);
            const lab = document.createElement('span');
            lab.className = 'kb-finger';
            lab.textContent = FINGER_LABELS[finger].short;
            key.appendChild(lab);
          }
        }
        rowEl.appendChild(key);
      }
      this.root.appendChild(rowEl);
    }
  }

  setFingerHints(on) {
    this.root.classList.toggle('hide-finger', !on);
  }

  _findKey(ch) {
    let n = ch;
    if (typeof n === 'string' && n.length === 1 && /[a-zA-Z]/.test(n)) n = n.toLowerCase();
    for (const el of this.root.querySelectorAll('.kb-key')) {
      if (el.dataset.key === n) return el;
    }
    return null;
  }

  setActive(ch) {
    this.clearActive();
    const el = this._findKey(ch);
    if (el) {
      el.classList.add('active');
      el.classList.add('flash-ok');
    }
  }

  setWrong(ch) {
    const el = this._findKey(ch);
    if (!el) return;
    el.classList.remove('wrong');
    void el.offsetWidth;
    el.classList.add('wrong');
    if (this._timeout) clearTimeout(this._timeout);
    this._timeout = setTimeout(() => el.classList.remove('wrong'), 360);
  }

  clearActive() {
    for (const el of this.root.querySelectorAll('.kb-key.active')) {
      el.classList.remove('active');
    }
  }

  reset() {
    this.clearActive();
    if (this._timeout) clearTimeout(this._timeout);
    for (const el of this.root.querySelectorAll('.kb-key.wrong')) {
      el.classList.remove('wrong');
    }
  }
}

/* =========================================================
   PracticeEngine — 練習引擎（beginner / normal）
   ========================================================= */
class PracticeEngine {
  constructor(lesson, opts = {}) {
    this.lesson = lesson;
    this.mode = opts.mode || 'beginner';
    this.texts = lesson.texts.slice();
    this.textIndex = 0;
    this.index = 0;
    this.errors = 0;
    this.correctChars = 0;
    this.errorCounts = {};
    this.text = this.texts[0];
    this.wrongChar = null;
  }

  reset() {
    this.textIndex = 0;
    this.index = 0;
    this.errors = 0;
    this.correctChars = 0;
    this.errorCounts = {};
    this.text = this.texts[0];
    this.wrongChar = null;
  }

  get expected() { return this.text[this.index]; }

  get isDone() {
    return this.textIndex >= this.texts.length;
  }

  _hasNext() {
    return this.textIndex < this.texts.length - 1;
  }

  _advanceText() {
    this.textIndex += 1;
    this.text = this.texts[this.textIndex];
    this.index = 0;
    this.wrongChar = null;
  }

  _keyOf(ch) {
    return /^[a-zA-Z]$/.test(ch) ? ch.toLowerCase() : ch;
  }

  _recordError(expectedChar, key) {
    this.errors += 1;
    if (this.mode === 'beginner') this.wrongChar = key;
    const k = this._keyOf(expectedChar);
    this.errorCounts[k] = (this.errorCounts[k] || 0) + 1;
  }

  /**
   * 處理一次按鍵。
   * @returns {{type:'correct'|'error'|'clearError'|'finish'|'none', key?:string, textChanged?:boolean}}
   */
  handleKey(key) {
    if (key === 'Backspace') {
      if (this.wrongChar !== null) {
        this.wrongChar = null;
        return { type: 'clearError' };
      }
      return { type: 'none' };
    }

    const exp = this.expected;
    const isLetter = /^[a-zA-Z]$/.test(exp);
    const matches = isLetter ? key.toLowerCase() === exp.toLowerCase() : key === exp;
    const normal = this.mode === 'normal';

    if (matches || normal) {
      if (matches) {
        this.correctChars += 1;
        this.wrongChar = null;
      } else {
        this._recordError(exp, key);
      }
      this.index += 1;
      if (this.index >= this.text.length) {
        if (this._hasNext()) {
          this._advanceText();
          return { type: matches ? 'correct' : 'error', key, textChanged: true };
        }
        this.textIndex += 1;
        return { type: 'finish', key };
      }
      return { type: matches ? 'correct' : 'error', key };
    }

    this._recordError(exp, key);
    return { type: 'error', key };
  }

  get totalTyped() {
    return this.correctChars + this.errors;
  }
}

/* =========================================================
   Stats — 成績計算
   ========================================================= */
const Stats = {
  compute(correctChars, errors, elapsedMs) {
    const total = correctChars + errors;
    const minutes = Math.max(elapsedMs, 1000) / 60000; // 至少 1 秒，避免除以 0
    const wpm = Math.round(correctChars / 5 / minutes);
    const accuracyRaw = total > 0 ? (correctChars / total) * 100 : 100;
    const accuracy = Math.round(accuracyRaw * 10) / 10;
    return {
      wpm,
      accuracy,
      totalChars: total,
      correctChars,
      errors,
      durationMs: elapsedMs,
      durationSec: Math.round(elapsedMs / 1000)
    };
  },
  fmtAccuracy(v) {
    return String(v);
  }
};

/* =========================================================
   LessonManager — 課程 / 單字 / 句子資料載入
   ========================================================= */
class LessonManager {
  constructor() {
    this.lessons = [];
    this.words = { easy: [], medium: [], hard: [] };
    this.sentences = [];
    this._ready = false;
  }

  async _safeFetch(url) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch fail');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async load() {
    const [lessonsData, wordsData, sentencesData] = await Promise.all([
      this._safeFetch('./data/lessons.json'),
      this._safeFetch('./data/words.json'),
      this._safeFetch('./data/sentences.json')
    ]);

    this.lessons = (lessonsData && Array.isArray(lessonsData.lessons) && lessonsData.lessons.length)
      ? lessonsData.lessons
      : DEFAULT_LESSONS.map(l => ({ ...l, texts: l.texts.slice() }));

    this.words = wordsData && typeof wordsData === 'object'
      ? { easy: wordsData.easy || [], medium: wordsData.medium || [], hard: wordsData.hard || [] }
      : WORDS_FALLBACK;

    const sentArr = Array.isArray(sentencesData)
      ? sentencesData
      : (sentencesData && Array.isArray(sentencesData.sentences) ? sentencesData.sentences : null);
    this.sentences = sentArr && sentArr.length ? sentArr : SENTENCES_FALLBACK.slice();

    this._resolveDynamicTexts();
    this._ready = true;
    return this.lessons;
  }

  _resolveDynamicTexts() {
    for (const l of this.lessons) {
      if (l.type === 'words') {
        const pool = [...this.words.easy.slice(0, 12), ...this.words.medium.slice(0, 8), ...this.words.hard.slice(0, 4)];
        l.texts = shuffle(pool);
      } else if (l.type === 'sentences') {
        l.texts = shuffle(this.sentences).slice(0, 10);
      }
    }
  }

  list() {
    return this.lessons;
  }
}

/* =========================================================
   UI — 小工具
   ========================================================= */
let _toastTimer = null;
function showToast(msg, ms = 2400) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

/* =========================================================
   圖表 / 統計小工具
   ========================================================= */
function svgLineChart(pointList, opts = {}) {
  const width = opts.width || 560;
  const height = opts.height || 220;
  const padL = opts.padL || 46;
  const padB = opts.padB || 26;
  const padT = 16;
  const padR = 14;
  const step = opts.step || 5;
  const rawMax = pointList.length ? Math.max.apply(null, pointList.map(Number)) : 0;
  const yMax = opts.yMax != null ? opts.yMax : (Math.ceil(rawMax / step) * step) || step;
  const yMin = opts.yMin != null ? opts.yMin : 0;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const n = pointList.length;

  const px = i => padL + (n > 1 ? i / (n - 1) : 0.5) * innerW;
  const py = v => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;
  const round = v => Math.round(v * 10) / 10;

  const parts = [];
  for (let g = yMin + step; g <= yMax; g += step) {
    if (g <= yMin) continue;
    const gy = round(py(g));
    parts.push(`<line x1="${padL}" y1="${gy}" x2="${width - padR}" y2="${gy}" class="gline"/>`);
    parts.push(`<text x="${padL - 6}" y="${gy + 4}" class="glabel" text-anchor="end">${Math.round(g)}</text>`);
  }

  const pts = pointList.map((v, i) => [round(px(i)), round(py(v))]);
  if (pts.length) {
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    parts.push(`<path d="${d}" class="poly" fill="none"/>`);
  }
  pointList.forEach((v, i) => {
    const p = pts[i];
    const info = opts.pointTitle ? opts.pointTitle(v, i) : `第 ${i + 1} 次\n${Math.round(v)}`;
    parts.push(`<circle cx="${p[0]}" cy="${p[1]}" r="4.5" class="dot"><title>${info}</title></circle>`);
  });

  const xLabelIdx = opts.xLabels || (n > 1 ? [0, Math.floor((n - 1) / 2), n - 1] : [0]);
  xLabelIdx.forEach(i => {
    parts.push(`<text x="${round(px(i))}" y="${height - 6}" class="glabel" text-anchor="middle">${i + 1}</text>`);
  });

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${opts.ariaLabel || '進步圖表'}">${parts.join('')}</svg>`;
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function pctChange(cur, prev) {
  if (!prev || !cur) return 0;
  return Math.round((cur - prev) / prev * 100);
}

function fmtDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h} 小時 ${m} 分`;
  if (m > 0) return `${m} 分 ${s} 秒`;
  return `${s} 秒`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

/* =========================================================
   App — 應用主體
   ========================================================= */
class App {
  constructor() {
    this.screen = 'home';
    this.phase = 'idle'; // idle | countdown | active | paused | finished
    this.currentLesson = null;
    this.engine = null;
    this.timerStarted = false;
    this.charEls = [];
    this._cd = [];
    this._cdEnv = 0;
    this._introLesson = null;
    this._lastWeakKeys = [];
    this._recKeys = [];
    this._speedChallenge = false;

    this.storage = new Storage();
    this.settings = this.storage.data.settings;
    this.achievements = new AchievementManager(this.storage);
    this.audio = new AudioManager({
      sfxEnabled: this.settings.sfxEnabled !== false,
      sfxVolume: this.settings.sfxVolume,
      musicEnabled: this.settings.musicEnabled === true,
      musicVolume: this.settings.musicVolume
    });
    this._applyTheme(this.settings.theme);
    this._unlockAudioOnce = () => this.audio.unlock();
    document.addEventListener('pointerdown', this._unlockAudioOnce, { once: true });
    document.addEventListener('keydown', this._unlockAudioOnce, { once: true });
    document.addEventListener('click', e => {
      const t = e && e.target;
      if (t && typeof t.closest === 'function' && t.closest('.btn')) this.audio.playButton();
    });
    this.lessons = new LessonManager();
    this.keyboard = new KeyboardView($('#keyboard'));
    this.timer = new Timer(() => {
      if (this.phase !== 'active') return;
      this.updateHud();
      if (this._speedChallenge && this.timer.getElapsedMs() >= SPEED_CHALLENGE_DURATION) {
        this._finishPractice();
      }
    });

    this._cacheEls();
    this._bindEvents();
  }

  async init() {
    this.keyboard.build();
    await this.lessons.load();
    this._applySettings();
    const list = this.lessons.list();
    this.achievements.checkCatchUp({
      streak: this.storage.data.gamification.currentStreak || 0,
      lessonOneCompleted: this._isLessonCompleted(list[0]),
      allLessonsCompleted: list.length > 0 && list.every(l => this._isLessonCompleted(l))
    });
    this.refreshHome();
  }

  _cacheEls() {
    this.el = {
      home: $('#screen-home'),
      practice: $('#screen-practice'),
      result: $('#screen-result'),
      lessonModal: $('#lesson-modal'),
      lessonList: $('#lesson-list'),
      introModal: $('#intro-modal'),
      introHead: $('#intro-head'),
      introBody: $('#intro-body'),
      introTip: $('#intro-tip'),
      settingsModal: $('#settings-modal'),
      confirmModal: $('#confirm-modal'),
      countdown: $('#countdown-overlay'),
      countdownNum: $('#countdown-number'),
      pauseModal: $('#pause-modal'),
      toast: $('#toast'),
      practiceTitle: $('#practice-title'),
      practiceHint: $('#practice-hint'),
      practiceText: $('#practice-text'),
      fingerHint: $('#finger-hint'),
      fhKey: $('#fh-key'),
      fhFinger: $('#fh-finger'),
      homeRecommend: $('#home-recommend'),
      recText: $('#rec-text'),
      hudWpm: $('#hud-wpm'),
      hudAccuracy: $('#hud-accuracy'),
      hudErrors: $('#hud-errors'),
      hudTime: $('#hud-time'),
      resultWpm: $('#result-wpm'),
      resultAccuracy: $('#result-accuracy'),
      resultErrors: $('#result-errors'),
      resultTime: $('#result-time'),
      resultCorrect: $('#result-correct'),
      resultTotal: $('#result-total'),
      resultRecord: $('#result-record'),
      resultRecordText: $('#result-record-text'),
      resultRecordSub: $('#result-record-sub'),
      resultBest: $('#result-best'),
      resultXp: $('#result-xp'),
      resultErrorAnalysis: $('#result-error-analysis'),
      errorKeys: $('#error-keys'),
      weakestFinger: $('#weakest-finger'),
      courseComplete: $('#result-course-complete'),
      ccTitle: $('#cc-title'),
      ccBest: $('#cc-best'),
      ccNext: $('#cc-next'),
      setFingerHints: $('#set-finger-hints'),
      setShowKeyboard: $('#set-show-keyboard'),
      modeBeginner: $('#mode-beginner'),
      modeNormal: $('#mode-normal'),
      themeLight: $('#theme-light'),
      themeDark: $('#theme-dark'),
      setSfx: $('#set-sfx'),
      sfxVolume: $('#sfx-volume'),
      sfxVolumeOut: $('#sfx-volume-out'),
      setMusic: $('#set-music'),
      musicVolume: $('#music-volume'),
      musicVolumeOut: $('#music-volume-out'),
      homeLevel: $('#home-level'),
      levelName: $('#level-name'),
      levelXp: $('#level-xp'),
      levelBar: $('#level-bar'),
      streakText: $('#streak-text'),
      taskList: $('#task-list'),
      dashWpmNum: $('#dash-wpm'),
      dashAccNum: $('#dash-acc'),
      dashErrNum: $('#dash-err'),
      dashTimeNum: $('#dash-time'),
      dashCountNum: $('#dash-count'),
      dashStreakNum: $('#dash-streak'),
      dashXpNum: $('#dash-xp'),
      dashLevelNum: $('#dash-level'),
      dashPbWpm: $('#dash-pb-wpm'),
      dashPbAcc: $('#dash-pb-acc'),
      dashPbTime: $('#dash-pb-time'),
      statsChartTitle: $('#stats-chart-title'),
      statsChart: $('#stats-chart'),
      statsTrend: $('#stats-trend'),
      statsTable: $('#stats-table'),
      statsTableTitle: $('#stats-table-title'),
      statScreen: $('#screen-stats'),
      statsTitle: $('#stats-title'),
      statsTasks: $('#stats-tasks'),
      statsTasksSub: $('#stats-tasks-sub'),
      statsRecent: $('#stats-recent'),
      statsRecentSub: $('#stats-recent-sub'),
      statsBest: $('#stats-best'),
      statsBestSub: $('#stats-best-sub'),
      dashBack: $('#btn-dash-back'),
      dashTasks: $('#btn-dash-tasks'),
      dashRecord: $('#btn-dash-record'),
      achScreen: $('#screen-ach'),
      achCount: $('#ach-count'),
      achTotal: $('#ach-total'),
      achGrid: $('#ach-grid'),
      achClose: $('#btn-ach-close'),
      btnDash: $('#btn-dash'),
      btnAchievements: $('#btn-achievements')
    };
  }

  _bindEvents() {
    // 首頁
    $('#btn-start').addEventListener('click', e => {
      e.currentTarget.blur();
      this.openLessonModal();
    });
    $('#btn-stats').addEventListener('click', e => {
      e.currentTarget.blur();
      this.openStats();
    });
    $('#btn-achievements').addEventListener('click', e => {
      e.currentTarget.blur();
      this.openAchievements();
    });
    $('#btn-dash').addEventListener('click', e => {
      e.currentTarget.blur();
      this.openStats();
    });
    $('#btn-dash-back').addEventListener('click', e => {
      e.currentTarget.blur();
      this.goHome();
    });
    $('#btn-dash-tasks').addEventListener('click', e => {
      e.currentTarget.blur();
      this._renderStatsDashboard();
      this._renderStatsTable('tasks');
    });
    $('#btn-dash-record').addEventListener('click', e => {
      e.currentTarget.blur();
      this._renderStatsDashboard();
      this._renderStatsTable('record');
    });
    $('#btn-speed-challenge').addEventListener('click', e => {
      e.currentTarget.blur();
      this.startSpeedChallenge();
    });
    $('#btn-ach-close').addEventListener('click', e => {
      e.currentTarget.blur();
      this.closeAchievements();
    });
    $('#btn-settings').addEventListener('click', e => {
      e.currentTarget.blur();
      this.openSettings();
    });
    $('#btn-weakness-home').addEventListener('click', e => {
      e.currentTarget.blur();
      this.startWeaknessPractice(this._recKeys);
    });

    // 課程選擇
    $('#btn-lesson-close').addEventListener('click', () => this.closeLessonModal());

    // 課程介紹
    $('#btn-intro-start').addEventListener('click', e => {
      e.currentTarget.blur();
      this.closeIntroAndStart();
    });

    // 設定
    $('#btn-settings-close').addEventListener('click', () => this.closeSettings());
    $('#btn-clear-data').addEventListener('click', () => {
      this.el.confirmModal.classList.remove('hidden');
    });
    $('#btn-confirm-cancel').addEventListener('click', () => {
      this.el.confirmModal.classList.add('hidden');
    });
    $('#btn-confirm-ok').addEventListener('click', () => {
      this.el.confirmModal.classList.add('hidden');
      this.clearAllData();
    });
    $('#mode-beginner').addEventListener('click', () => this.setDifficulty('beginner'));
    $('#mode-normal').addEventListener('click', () => this.setDifficulty('normal'));
    $('#set-finger-hints').addEventListener('change', e => {
      this.settings.showFingerHints = e.target.checked;
      this.storage.save();
      this._applySettings();
    });
    $('#set-show-keyboard').addEventListener('change', e => {
      this.settings.showKeyboard = e.target.checked;
      this.storage.save();
      this._applySettings();
    });

    // 主題 / 音效 / 音樂
    $('#theme-light').addEventListener('click', () => this.setTheme('light'));
    $('#theme-dark').addEventListener('click', () => this.setTheme('dark'));
    $('#set-sfx').addEventListener('change', e => this.setSfxEnabled(e.target.checked));
    $('#sfx-volume').addEventListener('input', e => this.setSfxVolume(Number(e.target.value) / 100));
    $('#set-music').addEventListener('change', e => this.setMusicEnabled(e.target.checked));
    $('#music-volume').addEventListener('input', e => this.setMusicVolume(Number(e.target.value) / 100));

    // 練習頁
    $('#btn-practice-home').addEventListener('click', e => {
      e.currentTarget.blur();
      this.goHome();
    });
    $('#btn-restart').addEventListener('click', e => {
      e.currentTarget.blur();
      this.restartPractice();
    });
    $('#btn-pause').addEventListener('click', e => {
      e.currentTarget.blur();
      this.pausePractice();
    });

    // 暫停 Modal
    $('#btn-resume').addEventListener('click', e => {
      e.currentTarget.blur();
      this.resumePractice();
    });
    $('#btn-restart-pause').addEventListener('click', e => {
      e.currentTarget.blur();
      this.hidePause();
      this.restartPractice();
    });
    $('#btn-home-pause').addEventListener('click', e => {
      e.currentTarget.blur();
      this.hidePause();
      this.goHome();
    });

    // 結果頁
    $('#btn-again').addEventListener('click', e => {
      e.currentTarget.blur();
      this.restartPractice();
    });
    $('#btn-analysis').addEventListener('click', e => {
      e.currentTarget.blur();
      this.el.resultErrorAnalysis.classList.toggle('hidden');
    });
    $('#btn-result-home').addEventListener('click', e => {
      e.currentTarget.blur();
      this.goHome();
    });
    $('#btn-weakness').addEventListener('click', e => {
      e.currentTarget.blur();
      this.startWeaknessPractice(this._lastWeakKeys);
    });
    $('#btn-next-lesson').addEventListener('click', e => {
      e.currentTarget.blur();
      this.continueToNextLesson();
    });

    // 鍵盤輸入
    document.addEventListener('keydown', e => this.onKeydown(e));

    // 防作弊
    for (const ev of ['copy', 'cut', 'paste', 'drop', 'dragstart', 'contextmenu']) {
      document.addEventListener(ev, e => this.onCheatEvent(ev, e));
    }
    $('#practice-text').addEventListener('paste', e => e.preventDefault());
  }

  /* ---------- 畫面切換 ---------- */
  showScreen(name) {
    this.el.home.classList.toggle('hidden', name !== 'home');
    this.el.practice.classList.toggle('hidden', name !== 'practice');
    this.el.result.classList.toggle('hidden', name !== 'result');
    if (this.el.statScreen) this.el.statScreen.classList.toggle('hidden', name !== 'stats');
    if (this.el.achScreen) this.el.achScreen.classList.toggle('hidden', name !== 'ach');
    this.screen = name;
  }

  goHome() {
    this._cancelCountdown();
    this.timer.reset();
    this.timerStarted = false;
    this.phase = 'idle';
    this.hidePause();
    this.closeIntroModal();
    this.refreshHome();
    this.showScreen('home');
    window.scrollTo(0, 0);
  }

  refreshHome() {
    const s = this.storage.data.stats;
    const t = todayStr();
    const today = s.today.date === t ? s.today : { bestWpm: 0, count: 0 };
    $('#stat-today-wpm').textContent = today.bestWpm;
    $('#stat-best-wpm').textContent = s.highestWpm;
    $('#stat-today-count').textContent = today.count;
    $('#stat-streak').textContent = s.streak;

    const g = this.storage.data.gamification;
    const xp = g.xp || 0;
    const prog = Gamification.getLevelProgress(xp);
    const levelName = prog.name;
    const pct = prog.pct;
    $('#home-level').textContent = `Lv.${g.level} ${levelName}`;
    $('#level-xp').textContent = `Lv.${g.level} 進度 ${xp} / ${prog.next} XP`;
    $('#level-bar').style.width = `${Math.min(100, pct)}%`;
    $('#level-name').textContent = levelName;
    $('#streak-text').textContent = `🔥 連續練習 ${g.currentStreak} 天（歷史最長 ${g.longestStreak} 天）`;

    this._renderDailyTasks();
    this._refreshRecommendation();
  }

  _renderDailyTasks() {
    const list = this.storage.data.dailyTasks;
    const t = todayStr();
    if (!list || !Array.isArray(list.tasks) || list.date !== t) {
      list.tasks = freshDailyTasks().tasks;
      list.date = t;
    }
    this.el.taskList.innerHTML = '';
    list.tasks.forEach(task => {
      const done = task.progress >= task.target;
      const div = document.createElement('div');
      div.className = 'task-item' + (done ? ' done' : '');
      div.innerHTML =
        `<span class="task-title">${done ? '✅ ' : '⬜ '}${esc(task.title)}</span>` +
        `<span class="task-progress">${task.progress} / ${task.target}</span>`;
      this.el.taskList.appendChild(div);
    });
  }

  /* ---------- 個人統計（Dashboard） ---------- */
  openStats() {
    this._renderStatsDashboard();
    this.showScreen('stats');
    window.scrollTo(0, 0);
  }

  _effectiveRecords() {
    return this.storage.data.practiceHistory.filter(
      r => r.totalCharacters > 0 && r.completed === true);
  }

  _renderStatsDashboard() {
    const eff = this._effectiveRecords();
    const s = this.storage.data.stats;
    const g = this.storage.data.gamification;
    const pb = this.storage.data.personalBest;

    this.el.statsTitle.textContent = '個人統計總覽';
    this.el.dashWpmNum.textContent = eff.length ? Math.round(average(eff.map(r => r.wpm))) : '—';
    this.el.dashAccNum.textContent = eff.length ? `${Math.round(average(eff.map(r => r.accuracy)))}%` : '—';
    this.el.dashErrNum.textContent = eff.reduce((a, r) => a + (r.errors || 0), 0);
    this.el.dashTimeNum.textContent = fmtDuration(s.totalTimeMs / 1000);
    this.el.dashCountNum.textContent = `${s.totalPractices} 次`;
    this.el.dashStreakNum.textContent = `${g.currentStreak} 天`;
    this.el.dashXpNum.textContent = `${g.xp} XP`;
    this.el.dashLevelNum.textContent = `Lv.${g.level}`;

    this.el.dashPbWpm.textContent = `${pb.bestWpm} WPM`;
    this.el.dashPbAcc.textContent = `${pb.bestAccuracy}%`;
    this.el.dashPbTime.textContent = pb.fastestCompletion ? `${pb.fastestCompletion.duration} 秒` : '—';

    this.el.statsBest.textContent = `🏆 最佳 WPM：${pb.bestWpm}　·　最佳正確率：${pb.bestAccuracy}%`;
    this.el.statsBestSub.textContent = pb.fastestCompletion
      ? `最快完成：${pb.fastestCompletion.duration} 秒（${pb.fastestCompletion.wpm} WPM / ${pb.fastestCompletion.accuracy}%）`
      : '尚未有練習紀錄';

    const recent = eff.slice(-10);
    this.el.statsRecent.textContent = `最近 ${Math.min(10, recent.length)} 次練習`;
    this.el.statsRecentSub.textContent = recent.length
      ? `平均 ${Math.round(average(recent.map(r => r.wpm)))} WPM / ${Math.round(average(recent.map(r => r.accuracy)))}%`
      : '還沒有有效練習紀錄';

    const tasks = this.storage.data.dailyTasks.tasks || [];
    const doneCount = tasks.filter(t => t.completed).length;
    this.el.statsTasks.textContent = `今日任務 ${doneCount}/${tasks.length}`;
    this.el.statsTasksSub.textContent = tasks.filter(t => !t.completed).length
      ? '完成所有任務可獲得額外 XP 獎勵！'
      : '今日全部完成，太棒了！';

    this.el.statsChartTitle.textContent = 'WPM ｜ 最近 10 次';
    this.el.statsChart.innerHTML = eff.length > 1
      ? svgLineChart(eff.slice(-10).map(r => r.wpm), {
          ariaLabel: '最近 10 次 WPM 走勢',
          pointTitle: (v, i) => `第 ${i + 1} 次\n${Math.round(v)} WPM`
        })
      : '<p class="muted">至少需要 2 次有效練習才能顯示趨勢圖</p>';

    const cmp = this._compareGroups(eff);
    const arrow = cmp.pct > 0 ? '▲' : cmp.pct < 0 ? '▼' : '—';
    this.el.statsTrend.textContent = cmp.cur > 0 && cmp.prev > 0
      ? `較前 5 次 ${arrow} ${Math.abs(cmp.pct)}%`
      : '完成 6 次以上練習可比較近期變化';

    this._renderStatsTable('compare');
  }

  _compareGroups(eff) {
    const cur = average(eff.slice(-5).map(r => r.wpm));
    const prev = average(eff.slice(-10, -5).map(r => r.wpm));
    return { cur, prev, pct: pctChange(cur, prev) };
  }

  _renderStatsTable(mode) {
    const eff = this._effectiveRecords();
    const pb = this.storage.data.personalBest;
    const g = this.storage.data.gamification;
    const cmp = this._compareGroups(eff);
    let title = '';
    let rows = [];

    if (mode === 'tasks') {
      title = '今日任務';
      rows = (this.storage.data.dailyTasks.tasks || []).map(t => [
        t.title, `${t.progress} / ${t.target}`, t.completed ? '✅ 已完成' : '待完成'
      ]);
    } else if (mode === 'record') {
      title = '練習紀錄（最近 10 筆）';
      rows = eff.slice(-10).reverse().map(r => [
        r.date,
        r.mode === 'speed' ? '60 秒挑戰' : (r.lessonTitle || r.mode),
        `${r.wpm} WPM`,
        `${r.accuracy}%`,
        `${r.duration} 秒`
      ]);
    } else {
      title = '統計比較表';
      rows = [
        ['最佳 WPM', `${pb.bestWpm}`, '歷史最佳'],
        ['最佳正確率', `${pb.bestAccuracy}%`, '歷史最佳'],
        ['最快完成', pb.fastestCompletion ? `${pb.fastestCompletion.duration} 秒` : '—', '速度最快的一次'],
        ['平均 WPM', `${Math.round(average(eff.map(r => r.wpm)))}`, '全部有效練習'],
        ['平均正確率', `${Math.round(average(eff.map(r => r.accuracy)))}%`, '全部有效練習'],
        ['近期 5 次 WPM', `${Math.round(cmp.cur)}`, '最後 5 次'],
        ['前 5 次 WPM', `${Math.round(cmp.prev)}`, '倒數 6~10 次'],
        ['進步幅度', `${cmp.cur >= cmp.prev ? '▲' : '▼'} ${Math.abs(cmp.pct)}%`, '兩群組比較'],
        ['連續天數', `${g.currentStreak} 天`, `歷史最長 ${g.longestStreak} 天`],
        ['總練習數', `${this.storage.data.stats.totalPractices}`, '含弱點練習']
      ];
    }

    this.el.statsTableTitle.textContent = title;
    const headRow = ['項目', '數值', '備註'];
    let html = '<thead><tr>' + headRow.map(h => `<th>${esc(h)}</th>`).join('') + '</tr></thead><tbody>';
    for (const r of rows) {
      html += '<tr>' + r.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>';
    }
    html += '</tbody>';
    this.el.statsTable.innerHTML = html;
  }

  /* ---------- 成就 ---------- */
  openAchievements() {
    const list = this.achievements.getAchievements();
    const unlocked = list.filter(a => a.unlocked).length;
    this.el.achCount.textContent = `${unlocked} / ${list.length}`;
    this.el.achTotal.textContent = list.length;
    this.el.achGrid.innerHTML = '';
    for (const a of list) {
      const card = document.createElement('div');
      card.className = 'ach-card' + (a.unlocked ? ' unlocked' : ' locked');
      card.innerHTML =
        `<div class="ach-icon">${a.icon}</div>` +
        `<div class="ach-name">${esc(a.title)}</div>` +
        `<div class="ach-desc">${esc(a.description)}</div>` +
        (a.unlocked ? `<div class="ach-time">${this._fmtDate(a.unlockedAt)}</div>` : '<div class="ach-time">尚未解鎖</div>');
      this.el.achGrid.appendChild(card);
    }
    this.showScreen('ach');
    window.scrollTo(0, 0);
  }

  closeAchievements() {
    this.goHome();
  }

  _fmtDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
  }

  _refreshRecommendation() {
    const counts = Weakness.combineErrorCounts(this.storage.data.practiceHistory);
    const analysis = Weakness.analyzeErrorCounts(counts);
    const keys = analysis.keys.slice(0, 3);
    this.el.homeRecommend.classList.toggle('hidden', this.screen === 'practice');
    if (!keys.length) {
      this._recKeys = [];
      this.el.homeRecommend.classList.remove('hidden');
      this.el.recText.textContent = '完成幾次練習後，我們就能分析你的弱點！';
      $('#btn-weakness-home').classList.add('hidden');
      return;
    }
    this._recKeys = keys.map(k => k.key);
    const topFingers = analysis.fingers.slice(0, 2).map(f => FINGER_LABELS[f.finger].zh);
    this.el.recText.textContent =
      `你最近最容易打錯：\n${keys.map(k => `「${String(k.key).toUpperCase()}」`).join(' / ')}\n\n` +
      `建議：\n🎯 加強${topFingers.join('與')}`;
    $('#btn-weakness-home').classList.remove('hidden');
  }

  /* ---------- 設定 ---------- */
  openSettings() {
    this.el.modeBeginner.classList.toggle('active', this.settings.difficulty !== 'normal');
    this.el.modeNormal.classList.toggle('active', this.settings.difficulty === 'normal');
    this.el.setFingerHints.checked = this.settings.showFingerHints !== false;
    this.el.setShowKeyboard.checked = this.settings.showKeyboard !== false;
    this.el.themeLight.classList.toggle('active', this.settings.theme !== 'dark');
    this.el.themeDark.classList.toggle('active', this.settings.theme === 'dark');
    this.el.setSfx.checked = this.audio.sfxEnabled;
    this.el.sfxVolume.value = Math.round(clamp01(this.settings.sfxVolume) * 100);
    this.el.sfxVolumeOut.textContent = `${Math.round(clamp01(this.settings.sfxVolume) * 100)}%`;
    this.el.setMusic.checked = this.audio.musicEnabled;
    this.el.musicVolume.value = Math.round(clamp01(this.settings.musicVolume) * 100);
    this.el.musicVolumeOut.textContent = `${Math.round(clamp01(this.settings.musicVolume) * 100)}%`;
    this.el.settingsModal.classList.remove('hidden');
  }

  closeSettings() {
    this.el.settingsModal.classList.add('hidden');
  }

  setDifficulty(mode) {
    this.settings.difficulty = mode;
    this.storage.save();
    this.el.modeBeginner.classList.toggle('active', mode !== 'normal');
    this.el.modeNormal.classList.toggle('active', mode === 'normal');
    showToast(mode === 'normal' ? '難度：Normal（按錯可繼續）' : '難度：Beginner（按錯需修正）');
  }

  clearAllData() {
    this.storage.clearAll();
    this.settings = this.storage.data.settings;
    this._applySettings();
    this._applyTheme(this.settings.theme);
    this.audio.sfxEnabled = this.settings.sfxEnabled !== false;
    this.audio.musicEnabled = this.settings.musicEnabled === true;
    this.audio.setSfxVolume(this.settings.sfxVolume);
    this.audio.setMusicVolume(this.settings.musicVolume);
    this.refreshHome();
    showToast('已清除所有紀錄');
  }

  _applySettings() {
    this.keyboard.setFingerHints(this.settings.showFingerHints !== false);
    const kb = $('#keyboard');
    kb.style.display = this.settings.showKeyboard === false ? 'none' : '';
    this.el.fingerHint.classList.toggle('hidden', this.settings.showFingerHints === false);
  }

  /* ---------- 主題 / 音效 / 音樂 ---------- */
  _applyTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light';
    try {
      const root = document.documentElement;
      if (root) root.dataset.theme = t;
    } catch (e) { /* noop */ }
    this.settings.theme = t;
    return t;
  }

  setTheme(theme) {
    const t = this._applyTheme(theme);
    this.storage.save();
    this.el.themeLight.classList.toggle('active', t === 'light');
    this.el.themeDark.classList.toggle('active', t === 'dark');
    showToast(t === 'light' ? '🎨 主題：淺色' : '🎨 主題：深色');
  }

  setSfxEnabled(on) {
    const enabled = !!on;
    this.audio.sfxEnabled = enabled;
    this.settings.sfxEnabled = enabled;
    this.storage.save();
    this.el.setSfx.checked = enabled;
    showToast(enabled ? '🔊 音效已開啟' : '🔇 音效已關閉');
  }

  setSfxVolume(v) {
    const vol = clamp01(v);
    this.audio.setSfxVolume(vol);
    this.settings.sfxVolume = vol;
    this.storage.save();
    this.el.sfxVolume.value = Math.round(vol * 100);
    this.el.sfxVolumeOut.textContent = `${Math.round(vol * 100)}%`;
  }

  setMusicEnabled(on) {
    const enabled = !!on;
    this.audio.musicEnabled = enabled;
    this.settings.musicEnabled = enabled;
    this.storage.save();
    this.el.setMusic.checked = enabled;
    if (!enabled && this.audio.music) {
      try { this.audio.music.pause(); } catch (e) { /* noop */ }
    }
    showToast(enabled ? '🎵 背景音樂已開啟' : '🎵 背景音樂已關閉');
  }

  setMusicVolume(v) {
    const vol = clamp01(v);
    this.audio.setMusicVolume(vol);
    this.settings.musicVolume = vol;
    this.storage.save();
    this.el.musicVolume.value = Math.round(vol * 100);
    this.el.musicVolumeOut.textContent = `${Math.round(vol * 100)}%`;
  }

  /* ---------- 課程 / 進度 ---------- */
  _getProgress(lesson) {
    return this.storage.data.lessonProgress[lesson.id] ||
      { completions: 0, bestWpm: 0, bestAccuracy: 0, completed: false };
  }

  _isLessonCompleted(lesson) {
    const p = this._getProgress(lesson);
    const reqAcc = lesson.requiredAccuracy || 85;
    const reqCom = lesson.requiredCompletions || 2;
    return p.completions >= reqCom && p.bestAccuracy >= reqAcc;
  }

  _isLessonUnlocked(lesson, idx) {
    if (idx === 0) return true;
    const list = this.lessons.list();
    const prev = list[idx - 1];
    if (!prev) return true;
    return this._isLessonCompleted(prev);
  }

  _nextLesson(lesson) {
    const list = this.lessons.list();
    const idx = list.findIndex(l => l.id === lesson.id);
    if (idx >= 0 && idx + 1 < list.length) return list[idx + 1];
    return null;
  }

  openLessonModal() {
    const list = this.lessons.list();
    this.el.lessonList.innerHTML = '';
    list.forEach((l, idx) => {
      const unlocked = this._isLessonUnlocked(l, idx);
      const prog = this._getProgress(l);
      const completed = this._isLessonCompleted(l);
      const reqCom = l.requiredCompletions || 2;
      const pct = completed ? 100 : Math.min(100, Math.round(prog.completions / reqCom * 100));
      const badge = `<span class="lv-badge">Lv.${l.level}</span>`;

      if (!unlocked) {
        const div = document.createElement('div');
        div.className = 'lesson-item locked';
        div.innerHTML = badge +
          `<span class="lesson-info"><strong>${l.title}</strong>` +
          `<span class="lesson-desc">🔒 尚未解鎖</span></span>`;
        this.el.lessonList.appendChild(div);
        return;
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lesson-item';
      const status = completed
        ? `<span class="lesson-desc lesson-done">✅ 已完成 · 最佳 ${prog.bestWpm} WPM / ${prog.bestAccuracy}%</span>`
        : `<span class="lesson-desc">${l.type === 'words' ? '單字練習' : l.type === 'sentences' ? '句子練習' : '字母練習'} · 完成 ${Math.min(prog.completions, reqCom)}/${reqCom} 次</span>`;
      btn.innerHTML = badge +
        `<span class="lesson-info"><strong>${l.title}</strong>${status}</span>` +
        `<span class="prog-track"><span class="prog-fill" style="width:${pct}%"></span></span>`;
      btn.addEventListener('click', () => {
        this.closeLessonModal();
        this.startPractice(l);
      });
      this.el.lessonList.appendChild(btn);
    });
    this.el.lessonModal.classList.remove('hidden');
  }

  closeLessonModal() {
    this.el.lessonModal.classList.add('hidden');
  }

  /* ---------- 課程介紹 ---------- */
  _showIntroModal(lesson) {
    this._introLesson = lesson;
    this.el.introHead.textContent = lesson.intro.head;
    this.el.introBody.textContent = lesson.intro.body;
    this.el.introTip.textContent = lesson.intro.tip || '';
    this.el.introModal.classList.remove('hidden');
  }

  closeIntroModal() {
    this._introLesson = null;
    this.el.introModal.classList.add('hidden');
  }

  closeIntroAndStart() {
    const lesson = this._introLesson;
    this.closeIntroModal();
    if (lesson) this.startCountdown();
  }

  /* ---------- 練習流程 ---------- */
  startPractice(lesson) {
    this._speedChallenge = false;
    this.currentLesson = lesson;
    this.engine = new PracticeEngine(lesson, { mode: this.settings.difficulty });
    this.timer.reset();
    this.timerStarted = false;
    this.phase = 'countdown';

    this.el.practiceTitle.textContent = `${lesson.title}（Lv.${lesson.level}）`;
    this.el.practiceHint.textContent = '準備...請看倒數';
    this.keyboard.reset();
    this.renderText();
    this.resetHud();
    this._applySettings();

    this.showScreen('practice');
    window.scrollTo(0, 0);

    const seen = (this.storage.data.lessonProgress[lesson.id] || {}).completions > 0;
    if (lesson.intro && !seen) {
      this._showIntroModal(lesson);
    } else {
      this.startCountdown();
    }
  }

  startWeaknessPractice(keys) {
    if (!keys || !keys.length) {
      showToast('還沒有足夠資料產生弱點練習，先完成幾次練習吧！');
      return;
    }
    const lesson = Weakness.buildWeaknessLesson(keys);
    if (!lesson.texts.length) {
      showToast('暫時無法產生弱點練習');
      return;
    }
    this.startPractice(lesson);
  }

  /**
   * 60 秒極速挑戰：計時器到 60 秒自動結束，統計 WPM / 正確率。
   */
  startSpeedChallenge() {
    const lesson = this._buildSpeedChallenge();
    this._speedChallenge = true;
    this.startPractice(lesson);
  }

  _buildSpeedChallenge() {
    const pool = [];
    if (this.lessons.words && Array.isArray(this.lessons.words.easy)) {
      for (const w of this.lessons.words.easy) pool.push(w);
    }
    if (this.lessons.words && Array.isArray(this.lessons.words.medium)) {
      for (const w of this.lessons.words.medium) pool.push(w);
    }
    if (!pool.length) {
      for (const k of TYPING_KEYS) pool.push(k);
    }
    const words = [];
    let len = 0;
    while (len <= SPEED_CHALLENGE_MIN_CHARS) {
      const w = pool[Math.floor(Math.random() * pool.length)];
      words.push(w);
      len += w.length + 1;
    }
    return {
      id: 'speed-challenge',
      type: 'speed',
      title: '60 秒極速挑戰',
      level: 1,
      texts: [words.join(' ')],
      mode: 'free'
    };
  }

  continueToNextLesson() {
    const next = this._nextLesson(this.currentLesson);
    if (next) this.startPractice(next);
  }

  renderText() {
    const text = this.engine.text;
    const frag = document.createDocumentFragment();
    this.charEls = [];
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      frag.appendChild(span);
      this.charEls.push(span);
    }
    this.el.practiceText.innerHTML = '';
    this.el.practiceText.appendChild(frag);
    this._markAll();
    this._updateFingerHint();
  }

  updateSpans() {
    // 效能：每次按鍵只更新「前一個 / 目前 / 下一個」三個字元，不做整段重繪
    const eng = this.engine;
    if (eng.isDone) return;
    this._mark(eng.index - 1);
    this._mark(eng.index);
    this._mark(eng.index + 1);
  }

  _mark(i) {
    const eng = this.engine;
    const span = this.charEls[i];
    if (!span) return;
    span.className = 'char';
    if (i < eng.index) {
      span.classList.add('done');
    } else if (i === eng.index) {
      span.classList.add(eng.wrongChar !== null ? 'wrong' : 'current');
    } else {
      span.classList.add('todo');
    }
  }

  _markAll() {
    const eng = this.engine;
    if (eng.isDone) return;
    for (let i = 0; i < this.charEls.length; i++) this._mark(i);
  }

  resetHud() {
    this.el.hudWpm.textContent = '0';
    this.el.hudAccuracy.textContent = '100';
    this.el.hudErrors.textContent = '0';
    this.el.hudTime.textContent = '0';
  }

  _updateFingerHint() {
    if (this.settings.showFingerHints === false) {
      this.el.fingerHint.classList.add('hidden');
      return;
    }
    const eng = this.engine;
    if (!eng || eng.isDone) return;
    const ch = eng.expected;
    const finger = fingerOf(ch);
    this.el.fhKey.textContent = ch === ' ' ? 'space' : ch.toUpperCase();
    if (finger && finger !== 'thumb') {
      const side = finger.startsWith('left') ? 'left' : 'right';
      this.el.fhFinger.textContent = `${FINGER_ARROW[side]} ${FINGER_LABELS[finger].zh}`;
    } else if (ch === ' ') {
      this.el.fhFinger.textContent = '拇指（空白鍵）';
    } else {
      this.el.fhFinger.textContent = '—';
    }
  }

  startCountdown() {
    this._cancelCountdown();
    this._cdEnv += 1;
    const env = this._cdEnv;
    this.phase = 'countdown';
    this.el.countdown.classList.remove('hidden');

    const steps = ['3', '2', '1', 'GO!'];
    const waits = [700, 700, 700, 450];
    const go = (i) => {
      if (env !== this._cdEnv) return;
      if (i >= steps.length) {
        this.el.countdown.classList.add('hidden');
        this.phase = 'active';
        this.el.practiceHint.textContent = '請輸入下方文字 ↓';
        this._updateFingerHint();
        return;
      }
      this.el.countdownNum.textContent = steps[i];
      this._cd.push(setTimeout(() => go(i + 1), waits[i]));
    };
    go(0);
  }

  _cancelCountdown() {
    this._cdEnv += 1;
    for (const t of this._cd) clearTimeout(t);
    this._cd = [];
    this.el.countdown.classList.add('hidden');
  }

  restartPractice() {
    if (this.currentLesson) this.startPractice(this.currentLesson);
  }

  /* ---------- 按鍵處理 ---------- */
  onKeydown(e) {
    if (this.screen !== 'practice') return;

    if (e.key === 'Escape') {
      if (this.phase === 'active') { this.pausePractice(); }
      else if (this.phase === 'paused') { this.resumePractice(); }
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      this.preventCheat(e);
      return;
    }

    if (this.phase !== 'active') {
      if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
      return;
    }

    const key = e.key;
    if (key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta' ||
        key === 'CapsLock' || key === 'Tab') {
      return;
    }

    if (e.repeat) return;

    if (key === ' ' || key === 'Enter') e.preventDefault();

    if (key.length > 1 && key !== 'Backspace') return;

    const res = this.engine.handleKey(key);
    if (res.type === 'none') return;

    if (!this.timerStarted) {
      this.timer.start();
      this.timerStarted = true;
    }

    this._applyKeyResult(res);
  }

  onCheatEvent(type, e) {
    if (this.screen !== 'practice') return;
    if (this.phase === 'finished' || this.phase === 'idle') return;
    e.preventDefault();
    e.stopPropagation();
    showToast('⚠️ 請使用鍵盤輸入，不能直接貼上文字。');
  }

  preventCheat(e) {
    e.preventDefault();
    if (this.phase === 'active' || this.phase === 'paused' || this.phase === 'countdown') {
      showToast('⚠️ 請使用鍵盤輸入，不能直接貼上文字。');
    }
  }

  _applyKeyResult(res) {
    const eng = this.engine;
    const beginner = eng.mode !== 'normal';

    if (res.type === 'clearError') {
      this.updateSpans();
      this._updateFingerHint();
      this.el.practiceHint.textContent = '請輸入下方文字 ↓';
      return;
    }

    if (res.type === 'error') {
      this.audio.playError();
      this.keyboard.setWrong(res.key);
      if (beginner) {
        this.el.practiceHint.textContent = `❌ 應該輸入「${eng.expected}」，剛剛按了「${res.key}」——請修正後繼續`;
      } else {
        this.el.practiceHint.textContent = `❌ 按錯「${res.key}」，已記錄錯誤`;
      }
    } else if (res.type === 'correct') {
      this.audio.playCorrect();
      this.keyboard.setActive(eng.expected);
      this.el.practiceHint.textContent = '請輸入下方文字 ↓';
    } else if (res.type === 'finish') {
      this.audio.playComplete();
      this._finishPractice();
      return;
    }

    if (res.textChanged) {
      this.renderText();
    } else {
      this.updateSpans();
      this._updateFingerHint();
    }
    this.updateHud();
  }

  updateHud() {
    const eng = this.engine;
    const elapsedMs = this.timer.getElapsedMs();
    const st = Stats.compute(eng.correctChars, eng.errors, elapsedMs);
    this.el.hudWpm.textContent = this.timerStarted ? st.wpm : 0;
    this.el.hudAccuracy.textContent = Math.round(st.accuracy);
    this.el.hudErrors.textContent = eng.errors;
    this.el.hudTime.textContent = Math.floor(elapsedMs / 1000);
  }

  /* ---------- 暫停 / 繼續 ---------- */
  pausePractice() {
    if (this.phase !== 'active') return;
    this.timer.pause();
    this.phase = 'paused';
    this.el.pauseModal.classList.remove('hidden');
  }

  resumePractice() {
    if (this.phase !== 'paused') return;
    this.hidePause();
    this.phase = 'active';
    this.timer.resume();
  }

  hidePause() {
    this.el.pauseModal.classList.add('hidden');
  }

  /* ---------- 完成 ---------- */
  _finishPractice() {
    // Finish Guard：Timer、按鍵、完成文字同時觸發時只結算一次
    if (this.phase === 'finished') return;
    this.phase = 'finished';
    this.timer.stop();
    const eng = this.engine;
    const elapsedMs = this.timer.getElapsedMs();
    const st = Stats.compute(eng.correctChars, eng.errors, elapsedMs);
    const lesson = this.currentLesson;

    const record = {
      date: todayStr(),
      mode: lesson ? lesson.type : 'letters',
      lessonId: lesson ? lesson.id : '',
      lessonTitle: lesson ? lesson.title : '',
      wpm: st.wpm,
      accuracy: st.accuracy,
      errors: st.errors,
      duration: st.durationSec,
      durationMs: st.durationMs,
      correctCharacters: st.correctChars,
      totalCharacters: st.totalChars,
      errorKeys: Object.keys(eng.errorCounts).length ? { ...eng.errorCounts } : undefined,
      speedChallenge: !!this._speedChallenge,
      completed: this._speedChallenge ? true : eng.isDone
    };

    const { newRecord, prevBest } = this.storage.addPractice(record);
    const g = this.storage.data.gamification;

    // 課程進度（極速挑戰不列入課程）
    let courseInfo = { nextLesson: null, showComplete: false };
    const isRealLesson = lesson && this.lessons.list().some(l => l.id === lesson.id);
    if (isRealLesson) {
      courseInfo = this._updateLessonProgress(lesson, st);
    }

    // 每日任務（有效練習 = 有輸入且完成）
    const dailyBonus = this._bumpDailyTasks(record);

    // XP / 等級
    const xpGain = Gamification.calculatePracticeXP(st, {
      newPersonalBest: newRecord,
      courseCompleted: courseInfo.showComplete,
      dailyTaskBonus: dailyBonus
    });
    record.xp = xpGain;
    const prevLevel = g.level;
    g.xp = Math.max(0, g.xp + xpGain);
    g.level = Gamification.getLevelFromXP(g.xp);

    // 成就（練習後檢查）
    const allLessons = this.lessons.list();
    const newlyUnlocked = this.achievements.checkAfterPractice({
      record,
      streak: g.currentStreak,
      newPersonalBest: newRecord,
      courseCompletedId: courseInfo.showComplete ? lesson.id : null,
      allLessonsCompleted: allLessons.length > 0 && allLessons.every(l => this._isLessonCompleted(l))
    });

    this.storage.save();

    this.el.resultWpm.textContent = st.wpm;
    this.el.resultAccuracy.textContent = Stats.fmtAccuracy(st.accuracy) + '%';
    this.el.resultErrors.textContent = st.errors;
    this.el.resultTime.textContent = st.durationSec;
    this.el.resultCorrect.textContent = st.correctChars;
    this.el.resultTotal.textContent = st.totalChars;
    this.el.resultBest.textContent = `🏆 個人最佳：${this.storage.data.personalBest.bestWpm} WPM`;
    this.el.resultXp.textContent = xpGain
      ? `經驗值 +${xpGain} XP　·　目前 Lv.${g.level} ${Gamification.getLevelName(g.level)}`
      : '';

    if (newRecord) {
      this.el.resultRecord.classList.remove('hidden');
      this.el.resultRecordText.textContent = '🏆 新紀錄！';
      this.el.resultRecordSub.textContent = `你的速度：${prevBest} → ${st.wpm} WPM`;
    } else {
      this.el.resultRecord.classList.add('hidden');
    }

    if (g.level > prevLevel) {
      this.audio.playLevelUp();
      showToast(`🌟 升級！Lv.${prevLevel} → Lv.${g.level} ${Gamification.getLevelName(g.level)}`);
    }
    if (dailyBonus.length) {
      showToast(`📋 每日任務完成 ×${dailyBonus.length}，獎勵 +${20 * dailyBonus.length} XP`);
    }
    newlyUnlocked.forEach(id => {
      const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
      if (def) {
        this.audio.playAchievement();
        showToast(`${def.icon} 解鎖成就：${def.title}！`);
      }
    });

    this._speedChallenge = false;
    this._renderErrorAnalysis(eng.errorCounts);
    this._renderCourseComplete(courseInfo);

    this.showScreen('result');
    window.scrollTo(0, 0);
  }

  /**
   * 更新今日任務進度，回傳本回合新完成的任務 id 清單。
   * （任務獎勵 XP 由 calculatePracticeXP 統一加入，避免重複計算）
   */
  _bumpDailyTasks(record) {
    const t = todayStr();
    const list = this.storage.data.dailyTasks;
    if (!list || !Array.isArray(list.tasks) || list.date !== t) {
      this.storage.data.dailyTasks = freshDailyTasks(t);
    }
    const tasks = this.storage.data.dailyTasks.tasks;
    const isEffective = record.totalCharacters > 0 && record.completed === true;
    const completedThisRound = [];
    for (const task of tasks) {
      if (task.completed) continue;
      if (task.id === 'practice-3' && isEffective) task.progress += 1;
      if (task.id === 'accuracy-95' && isEffective && record.accuracy >= 95) task.progress = task.target;
      if (task.id === 'speed-challenge' && isEffective && record.speedChallenge) task.progress = task.target;
      if (task.progress >= task.target) {
        task.completed = true;
        completedThisRound.push(task.id);
      }
    }
    return completedThisRound;
  }

  _updateLessonProgress(lesson, st) {
    const data = this.storage.data;
    const cur = data.lessonProgress[lesson.id] ||
      { completions: 0, bestWpm: 0, bestAccuracy: 0, completed: false };
    const wasCompleted = cur.completed;

    cur.completions += 1;
    cur.bestWpm = Math.max(cur.bestWpm, st.wpm);
    cur.bestAccuracy = Math.max(cur.bestAccuracy, st.accuracy);

    const reqAcc = lesson.requiredAccuracy || 85;
    const reqCom = lesson.requiredCompletions || 2;
    if (cur.completions >= reqCom && cur.bestAccuracy >= reqAcc) cur.completed = true;

    data.lessonProgress[lesson.id] = cur;
    this.storage.save();

    const nextLesson = this._nextLesson(lesson);
    return {
      showComplete: !wasCompleted && cur.completed,
      nextLesson
    };
  }

  _renderErrorAnalysis(errorCounts) {
    const analysis = Weakness.analyzeErrorCounts(errorCounts);
    const keysBox = this.el.errorKeys;
    keysBox.innerHTML = '';
    if (!analysis.keys.length) {
      this.el.resultErrorAnalysis.classList.add('hidden');
      this._lastWeakKeys = [];
      return;
    }
    this.el.resultErrorAnalysis.classList.remove('hidden');
    for (const { key, count } of analysis.keys) {
      const row = document.createElement('div');
      row.className = 'ea-row';
      const k = document.createElement('span');
      k.className = 'ea-key';
      k.textContent = String(key).toUpperCase();
      const c = document.createElement('span');
      c.className = 'ea-count';
      c.textContent = count + ' 次';
      row.appendChild(k);
      row.appendChild(c);
      keysBox.appendChild(row);
    }
    const weakest = analysis.fingers[0];
    this.el.weakestFinger.textContent = weakest
      ? `最常錯的手指：${FINGER_LABELS[weakest.finger].zh}`
      : '最常錯的手指：—';
    this._lastWeakKeys = analysis.keys.slice(0, 4).map(x => x.key);
  }

  _renderCourseComplete(info) {
    if (!info.showComplete) {
      this.el.courseComplete.classList.add('hidden');
      return;
    }
    const lesson = this.currentLesson;
    const prog = this._getProgress(lesson);
    this.el.courseComplete.classList.remove('hidden');
    this.el.ccTitle.textContent = lesson.title;
    this.el.ccBest.textContent = `最佳速度：${prog.bestWpm} WPM　·　最佳正確率：${prog.bestAccuracy}%`;
    if (info.nextLesson) {
      this.el.ccNext.textContent = `下一課已解鎖：${info.nextLesson.title}`;
      $('#btn-next-lesson').classList.remove('hidden');
    } else {
      this.el.ccNext.textContent = '所有課程皆已完成！';
      $('#btn-next-lesson').classList.add('hidden');
    }
  }
}

/* ---------- 啟動 ---------- */
const app = new App();
app.init();