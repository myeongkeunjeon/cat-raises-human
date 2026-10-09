// 고양이 고르기 + 이름 짓기 (튜토리얼 1번. 나머지 튜토리얼은 5단계)
import { CAT_TYPES, catSVG } from "../art.js";

export function showCatSelect(root, onDone) {
  let picked = "black";
  const el = document.createElement("div");
  el.className = "catselect";
  el.innerHTML = `
    <h1>함께할 고양이를 골라요</h1>
    <p class="note">이 고양이가 앞으로 집사들을 키우게 돼요</p>
    <div class="cat-grid">
      ${Object.entries(CAT_TYPES).map(([id, c]) => `
        <button class="cat-pick ${id === picked ? "on" : ""}" data-id="${id}" aria-label="${c.name} 선택">
          ${catSVG(id)}<span>${c.name}</span>
        </button>`).join("")}
    </div>
    <label for="catName" class="note">이름을 지어주세요</label>
    <input id="catName" type="text" maxlength="8" placeholder="예: 콩이" autocomplete="off">
    <div style="flex:1"></div>
    <button class="btn primary start">이 고양이와 시작하기</button>`;
  el.addEventListener("click", (e) => {
    const pick = e.target.closest(".cat-pick");
    if (pick) {
      picked = pick.dataset.id;
      el.querySelectorAll(".cat-pick").forEach((b) => b.classList.toggle("on", b === pick));
    }
    if (e.target.closest(".start")) {
      const name = el.querySelector("#catName").value.trim().slice(0, 8) || "냥이";
      el.remove();
      onDone(picked, name);
    }
  });
  root.append(el);
}
