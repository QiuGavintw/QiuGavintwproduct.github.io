// exclusions.js — 台數互斥（不得加計）規則（docs/B、C、E 已確認，Q1-Q13）
// main 命中時，drops 清單內的台型全部不計；'*' 表示只保留 main 自身。
export const EXCLUSIONS = [
  // ---- 特殊胡（Q5）：天胡/地胡/人胡 只排除已明確指定的互斥項，其餘可並計 ----
  { main: 'tianhu', drops: ['dealer', 'dihu', 'renhu', 'diting'] },  // 天胡不另加莊家台
  { main: 'dihu', drops: ['tianhu', 'renhu', 'diting', 'menqing_zimo'] }, // 地胡不計門清自摸/地聽
  { main: 'renhu', drops: ['tianhu', 'dihu', 'diting'] },
  // ---- 花類特殊胡 ----
  { main: 'baxian', drops: ['huagang', 'zhenghua'] }, // Q12：八仙取代花槓/正花，其餘可並計
  { main: 'qiqiangyi', drops: ['*'] },
  // ---- 大／小四喜 ----
  { main: 'da_sixi', drops: ['quanfeng', 'menfeng', 'xiao_sixi'] },
  { main: 'xiao_sixi', drops: ['quanfeng', 'menfeng'] },
  // ---- 地聽（Q6）：固定 8 台，不另計門清/自摸/獨聽 ----
  { main: 'diting', drops: ['menqing', 'zimo', 'menqing_zimo', 'duiting'] },
  // ---- 暗刻 ----
  { main: 'wu_anke', drops: ['san_anke', 'si_anke'] },
  { main: 'si_anke', drops: ['san_anke'] },
  // ---- 三元 ----
  { main: 'da_sanyuan', drops: ['sanyuan', 'xiao_sanyuan'] },
  { main: 'xiao_sanyuan', drops: ['sanyuan'] },
  // ---- 自摸類 ----
  { main: 'menqing_zimo', drops: ['menqing', 'zimo'] },
  { main: 'haidi', drops: ['gangshang_zimo'] }, // 海底撈月優先於槓上自摸（C.7/Q8）
  { main: 'gangshang_zimo', drops: ['zimo', 'haidi'] },
  // ---- 全求人（Q7）----
  { main: 'quanqiuren', drops: ['duiting'] }
];

export function applyExclusions(eligibleIds, exclusions = EXCLUSIONS) {
  const eligible = eligibleIds.slice();
  // 特殊胡／八仙／七搶一：排除全部其他台型
  for (const e of exclusions) {
    if (e.drops.includes('*') && eligible.includes(e.main)) {
      return [e.main];
    }
  }
  const dropped = new Set();
  for (const e of exclusions) {
    // 已被優先規則排除的 main 不得再執行其有瑕疵的排除（例如 haidi 已排除 gangshang 後，
    // gangshang 不得反過來排除 haidi）
    if (e.drops.includes('*') || !eligible.includes(e.main) || dropped.has(e.main)) continue;
    for (const d of e.drops) {
      if (eligible.includes(d)) dropped.add(d);
    }
  }
  return eligible.filter((id) => !dropped.has(id));
}