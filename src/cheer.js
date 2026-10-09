// 응원 가기: 근무 중인 집사에게 고양이가 간식 배달. 나타나는 츄르를 눌러 모은다.
// 모은 만큼 근무 시간이 줄고 호감도가 오른다. 근무 한 번에 최대 cheer.perShift번.
import { CONFIG } from "./config.js";
import { BUTLER_BY_ID } from "./data/butlers.js";
import { state, now, gainAffection } from "./state.js";
import { butlerSVG } from "./art.js";
import { play } from "./sound.js";

export function cheersLeft(id) {
  const w = state.butlers[id].work;
  return w ? CONFIG.cheer.perShift - (w.cheers || 0) : 0;
}

export function startCheer(id, onDone) {
  const C = CONFIG.cheer;
  const def = BUTLER_BY_ID[id];
  const place = state.butlers[id].work.place;
  let hits = 0, spawned = 0;

  const el = document.createElement("div");
  el.className = "cheer";
  el.innerHTML = `
    <div class="cheer-head">
      <h3>${CONFIG.workplaces[place].name}로 간식 배달!</h3>
      <p class="note">나타나는 츄르를 눌러 모아요</p>
    </div>
    <div class="cheer-field scene-${place}">
      <div class="cheer-butler">${butlerSVG(def)}</div>
    </div>
    <div class="cheer-score"><b>0</b> / ${C.snacks}</div>`;
  document.getElementById("app").append(el);
  const field = el.querySelector(".cheer-field");
  const scoreEl = el.querySelector(".cheer-score b");

  const timer = setInterval(() => {
    if (spawned >= C.snacks) {
      clearInterval(timer);
      return setTimeout(finish, 1100);
    }
    spawned++;
    const s = document.createElement("button");
    s.className = "snack";
    s.setAttribute("aria-label", "츄르");
    s.style.left = `${8 + Math.random() * 74}%`;
    s.style.top = `${6 + Math.random() * 60}%`;
    s.addEventListener("pointerdown", () => {
      hits++;
      scoreEl.textContent = hits;
      play("pop");
      navigator.vibrate?.(10);
      s.classList.add("got");
      setTimeout(() => s.remove(), 250);
    }, { once: true });
    field.append(s);
    setTimeout(() => s.isConnected && !s.classList.contains("got") && s.remove(), 1100);
  }, 900);

  function finish() {
    const b = state.butlers[id];
    let cut = 0, aff = 0;
    if (b.status === "working") {
      const w = b.work;
      cut = (w.end - w.start) * C.maxTimeCut * (hits / C.snacks);
      w.end = Math.max(now(), w.end - cut);
      w.cheers = (w.cheers || 0) + 1;
      aff = hits ? gainAffection(id, Math.round(C.affection * hits / C.snacks) || 1) : 0;
    }
    play(hits >= C.snacks / 2 ? "churu" : "pop");
    const mins = Math.round(cut / 60e3), secs = Math.round(cut / 1000);
    const panel = document.createElement("div");
    panel.className = "knead-result";
    panel.innerHTML = `
      <h2>${hits === C.snacks ? "완벽 배달!" : hits ? "배달 완료" : "앗, 놓쳤다"}</h2>
      <p class="note">${def.name}이(가) 힘이 났어요</p>
      <ul>
        <li>간식 <b>${hits} / ${C.snacks}</b></li>
        <li>근무 시간 <b>−${mins ? `${mins}분` : `${secs}초`}</b></li>
        ${aff ? `<li>호감도 <b>+${aff}</b></li>` : ""}
        <li class="note">남은 응원 ${cheersLeft(id)}번</li>
      </ul>
      <button class="btn primary" data-act="done">확인</button>`;
    el.append(panel);
    panel.querySelector("[data-act=done]").addEventListener("click", () => { el.remove(); onDone(); });
  }
}
