(() => {
  'use strict';
  const select = document.getElementById('molecular-type-filter');
  const counter = document.getElementById('molecular-filter-count');
  if (!select || !counter) return;

  const sections = [...document.querySelectorAll('.molecular-method-section')];
  const cards = [...document.querySelectorAll('[data-molecular-kind]')];
  const resetAndJump = () => {
    if (select.value !== 'all') {
      select.value = 'all';
      update();
    }
  };
  const update = () => {
    const kind = select.value;
    let matches = 0;
    cards.forEach(card => {
      const visible = kind === 'all' || card.dataset.molecularKind === kind;
      card.hidden = !visible;
      if (visible) matches++;
    });
    // Hide empty method sections when filtering; the jump menu resets filters before navigating.
    sections.forEach(section => {
      section.hidden = ![...section.querySelectorAll('[data-molecular-kind]')].some(card => !card.hidden);
    });
    counter.textContent = kind === 'all'
      ? '已列出 ' + matches + ' 項設計與分析資源 · ' + matches + ' resources'
      : '符合條件：' + matches + ' 項 · ' + matches + ' matching resources';
  };
  select.addEventListener('change', update);
  document.querySelectorAll('.molecular-jump-nav a').forEach(a => a.addEventListener('click', resetAndJump));
  update();
})();
