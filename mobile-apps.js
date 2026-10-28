/* Progressive enhancement for the public Science Apps for Research, Learning & Play directory.
   No cookies, telemetry, remote APIs or saved user data. */
(() => {
  "use strict";
  const init = () => {
    const search = document.getElementById("mobile-app-query");
    const platform = document.getElementById("mobile-app-platform");
    const status = document.getElementById("mobile-app-filter-result");
    const noResults = document.getElementById("mobile-app-no-results");
    const sections = Array.from(document.querySelectorAll(".mobile-apps-section[data-mobile-group]"));
    if (!search || !platform || !status || !noResults || !sections.length) return;
    const records = sections.flatMap(section =>
      Array.from(section.querySelectorAll("[data-app-card]")).map(card => ({
        card,
        section,
        text: card.textContent.normalize("NFKC").toLocaleLowerCase(),
        platforms: (card.dataset.platform || "").trim().split(/\s+/)
      }))
    );
    const update = () => {
      const query = search.value.trim().normalize("NFKC").toLocaleLowerCase();
      const selected = platform.value;
      let total = 0;
      for (const entry of records) {
        const visible = (!query || entry.text.includes(query)) &&
          (selected === "all" || entry.platforms.includes(selected));
        entry.card.hidden = !visible;
        if (visible) total++;
      }
      for (const section of sections) {
        const visibleCount = section.querySelectorAll("[data-app-card]:not([hidden])").length;
        section.hidden = visibleCount === 0;
      }
      noResults.hidden = total !== 0;
      status.textContent = "符合條件 " + total + " 款 App · " + total + " matching apps";
    };
    // When navigating to a section, clear any filter hiding its cards.
    const nav = document.querySelector(".mobile-apps-jump");
    if (nav) {
      nav.addEventListener("click", event => {
        const link = event.target.closest("a[href^='#mobile-']");
        if (!link) return;
        if (search.value || platform.value !== "all") {
          search.value = "";
          platform.value = "all";
          update();
        }
      });
    }
    search.addEventListener("input", update);
    platform.addEventListener("change", update);
    update();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
