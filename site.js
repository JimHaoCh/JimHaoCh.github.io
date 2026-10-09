const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
function setMenu(open) {
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '關閉導覽選單' : '開啟導覽選單');
  nav.classList.toggle('open', open);
}
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menu.focus(); }
});
const papers = [...document.querySelectorAll('.paper')];
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  let count = 0;
  papers.forEach(paper => { paper.hidden = button.dataset.filter !== 'all' && paper.dataset.type !== button.dataset.filter; if (!paper.hidden) count++; });
  document.querySelector('#paper-count').textContent = `顯示 ${count} 篇論文 / Showing ${count} publications`;
}));
const dialog = document.querySelector('#image-dialog');
const largeImage = document.querySelector('#large-image');
let imageTrigger;
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  imageTrigger = button;
  largeImage.src = button.dataset.image;
  largeImage.alt = button.dataset.caption;
  document.querySelector('#image-caption').textContent = button.dataset.caption;
  dialog.showModal();
  document.body.classList.add('dialog-open');
  document.querySelector('#close-image').focus();
}));
document.querySelector('#close-image').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); largeImage.removeAttribute('src'); imageTrigger?.focus(); });
