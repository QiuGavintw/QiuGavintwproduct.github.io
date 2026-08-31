// dom.js — Phase 12：renderer 共用的 DOM 安全工具（只用 createElement/textContent/appendChild）
export function textEl(doc, tag, text, cls) {
  const el = doc.createElement(tag);
  el.textContent = text;
  if (cls) el.className = cls;
  return el;
}

export const ContainerHelper = {
  clear(doc, container) {
    if (!container) return;
    while (container.lastChild) container.removeChild(container.lastChild);
  },
  // 建立並填入文字的子節點
  textEl
};