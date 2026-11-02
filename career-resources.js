/* Local-only specialist career resource filter; no backend or tracking. */
(() => {
  "use strict";
  function init() {
    const panel = document.getElementById("career-filter");
    if (!panel) return;
    const buttons = [...panel.querySelectorAll("button[data-career-filter]")];
    const cards = [...document.querySelectorAll(".career-resource-card[data-career-type]")];
    const sections = [...document.querySelectorAll(".career-section")];
    const status = document.getElementById("career-filter-status");
    const navLinks = [...document.querySelectorAll(".career-jump-nav a[href^='#career-']")];
    if (!buttons.length || !cards.length || !status) return;
    function update(type) {
      let visible = 0;
      for (const card of cards) {
        const show = type === "all" || card.dataset.careerType === type;
        card.hidden = !show;
        if (show) visible++;
      }
      for (const section of sections) {
        const show = [...section.querySelectorAll(".career-resource-card")].some(card => !card.hidden);
        section.hidden = !show;
        const anchor = "#" + section.id;
        for (const link of navLinks) if (link.getAttribute("href") === anchor) link.hidden = !show;
      }
      for (const button of buttons) {
        button.setAttribute("aria-pressed", String(button.dataset.careerFilter === type));
      }
      const labels = {all:"全部",practice:"互動實作",course:"線上課程",credential:"證照與訓練資格",reference:"專業資料"};
      status.textContent = "顯示 " + visible + " 項「" + (labels[type] || labels.all) + "」資源 · " + visible + " resources shown";
    }
    buttons.forEach(button => button.addEventListener("click", () => update(button.dataset.careerFilter || "all")));
    update("all");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
