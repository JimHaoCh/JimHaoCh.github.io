/* Guided ECG / EEG learning routes. Browser-only filtering, no tracking. */
(() => {
  "use strict";

  function init() {
    const panel = document.getElementById("physiology-route-filter");
    if (!panel) return;
    const subjectButtons = [...panel.querySelectorAll("button[data-physio-subject]")];
    const trackButtons = [...panel.querySelectorAll("button[data-physio-track]")];
    const cards = [...document.querySelectorAll(
      "#clinical-ecg .reference-card[data-practice-track], #clinical-eeg .reference-card[data-practice-track]"
    )];
    const sections = {
      ecg: document.getElementById("clinical-ecg"),
      eeg: document.getElementById("clinical-eeg")
    };
    const status = document.getElementById("physio-route-status");
    if (!subjectButtons.length || !trackButtons.length || !cards.length || !status) return;

    let subject = "all";
    let track = "all";

    function update() {
      const bySubject = {ecg: 0, eeg: 0};
      for (const card of cards) {
        const matchesSubject = subject === "all" || card.dataset.practiceSubject === subject;
        const matchesTrack = track === "all" || card.dataset.practiceTrack === track;
        card.hidden = !(matchesSubject && matchesTrack);
        if (!card.hidden && Object.prototype.hasOwnProperty.call(bySubject, card.dataset.practiceSubject)) {
          bySubject[card.dataset.practiceSubject]++;
        }
      }
      for (const name of ["ecg", "eeg"]) {
        if (sections[name]) sections[name].hidden = bySubject[name] === 0;
      }
      for (const button of subjectButtons) {
        button.setAttribute("aria-pressed", String(button.dataset.physioSubject === subject));
      }
      for (const button of trackButtons) {
        button.setAttribute("aria-pressed", String(button.dataset.physioTrack === track));
      }
      const routeLabels = {
        all: "全部教材", foundation: "基礎辨識",
        cases: "臨床案例", simulation: "動態模擬"
      };
      const total = bySubject.ecg + bySubject.eeg;
      status.textContent = "目前顯示 " + total + " 筆「" + routeLabels[track] + "」教材" +
        "（ECG " + bySubject.ecg + "、EEG " + bySubject.eeg +
        "）。請向下前往對應主題開啟練習網站。";
    }

    subjectButtons.forEach(button => button.addEventListener("click", () => {
      subject = button.dataset.physioSubject || "all";
      update();
    }));
    trackButtons.forEach(button => button.addEventListener("click", () => {
      track = button.dataset.physioTrack || "all";
      update();
    }));

    /* Shortcut links always reveal their target, including after filtering. */
    const navLinks = [...document.querySelectorAll(
      ".physiology-quick-grid a[href^='#clinical-'], .clinical-jump-nav a[href^='#clinical-']"
    )];
    navLinks.forEach(link => link.addEventListener("click", () => {
      const href = link.getAttribute("href");
      if (href !== "#clinical-ecg" && href !== "#clinical-eeg") return;
      subject = href === "#clinical-ecg" ? "ecg" : "eeg";
      track = "all";
      update();
    }));
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once: true});
  } else {
    init();
  }
})();
