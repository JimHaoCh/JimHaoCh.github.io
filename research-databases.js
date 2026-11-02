/* Open biomedical database browser. Entirely local, no analytics or external requests. */
(() => {
  "use strict";
  function init() {
    const keyword = document.getElementById("database-keyword");
    const access = document.getElementById("database-access-filter");
    const format = document.getElementById("database-format-filter");
    const reset = document.getElementById("database-filter-reset");
    const status = document.getElementById("database-filter-status");
    if (!keyword || !access || !format || !reset || !status) return;
    const cards = [...document.querySelectorAll(".database-resource-card")];
    const sections = [...document.querySelectorAll(".database-section")];
    const norm = text => String(text || "").normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
    function update() {
      let count = 0;
      const query = norm(keyword.value);
      for (const card of cards) {
        const text = norm(card.dataset.dbSearch + " " + card.textContent);
        const show = (!query || text.includes(query)) &&
          (access.value === "all" || card.dataset.dbAccess === access.value) &&
          (format.value === "all" || card.dataset.dbFormat === format.value);
        card.hidden = !show;
        if (show) count++;
      }
      for (const section of sections) {
        section.hidden = ![...section.querySelectorAll(".database-resource-card")].some(c => !c.hidden);
      }
      status.textContent = "顯示 " + count + " / " + cards.length + " 個資料庫 · " + count + " matching databases";
      reset.disabled = !query && access.value === "all" && format.value === "all";
    }
    function clear() {
      keyword.value = "";
      access.value = "all";
      format.value = "all";
      update();
    }
    keyword.addEventListener("input", update);
    access.addEventListener("change", update);
    format.addEventListener("change", update);
    reset.addEventListener("click", () => { clear(); keyword.focus(); });
    document.querySelectorAll(".database-jump-nav a[href^='#database-section-']").forEach(link => {
      link.addEventListener("click", clear);
    });
    update();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
