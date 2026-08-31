// payment.js — 計分支付（每份支付額＝底 500＋台×200；支付者為莊家多付一台值）
// 已確認語意：放槍＝放槍者付一份；自摸＝三家各付全額。
import { BASE_SCORE } from './RuleDefinition.js';

export function calculatePayment({
  tai,
  winBy, // 'ron' | 'tsumo'（八仙/七搶一由引擎視為 tsumo）
  winnerSeat,
  dealerSeat,
  discarderSeat,
  base = BASE_SCORE.base,
  perTai = BASE_SCORE.perTai
}) {
  const amount = base + tai * perTai;
  if (winBy === 'ron') {
    const payer = { seat: discarderSeat, amount: amount + (discarderSeat === dealerSeat ? perTai : 0) };
    return { payers: [payer], total: payer.amount };
  }
  const payers = [];
  for (let s = 0; s < 4; s++) {
    if (s === winnerSeat) continue;
    payers.push({ seat: s, amount: amount + (s === dealerSeat ? perTai : 0) });
  }
  return { payers, total: payers.reduce((a, p) => a + p.amount, 0) };
}