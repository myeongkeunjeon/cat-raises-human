// 공용 UI: 아래에서 올라오는 시트, 짧은 알림
let sheetEl, toastEl, toastTimer;

export function initUI(root) {
  sheetEl = document.createElement("div");
  sheetEl.className = "sheet-wrap hidden";
  sheetEl.innerHTML = `<div class="sheet-dim" data-close></div><div class="sheet"><button class="sheet-x" data-close aria-label="닫기">✕</button><div class="sheet-body"></div></div>`;
  sheetEl.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeSheet(); });
  toastEl = document.createElement("div");
  toastEl.className = "toast hidden";
  root.append(sheetEl, toastEl);
}

// html을 띄우고, 시트 안의 [data-act] 버튼을 누르면 onAct(act, el) 호출
export function openSheet(html, onAct) {
  const body = sheetEl.querySelector(".sheet-body");
  body.innerHTML = html;
  body.onclick = (e) => {
    const el = e.target.closest("[data-act]");
    if (el && onAct) onAct(el.dataset.act, el);
  };
  sheetEl.classList.remove("hidden");
}

export function closeSheet() {
  sheetEl.classList.add("hidden");
}

export function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add("hidden"), 2200);
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// 미니게임 화면: 두 손가락이 동시에 닿아도 확대·스크롤 제스처로 바뀌지 않게 막는다 (iOS는 user-scalable=no를 무시함)
export function lockGestures(el) {
  const stop = (e) => { if (!e.target.closest("[data-act]")) e.preventDefault(); };
  el.addEventListener("touchstart", stop, { passive: false });
  el.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  el.addEventListener("gesturestart", (e) => e.preventDefault()); // Safari 핀치
  el.addEventListener("dblclick", (e) => e.preventDefault());
}
