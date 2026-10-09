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
  scheduleScrollUpdate();
}));
const members = [...document.querySelectorAll('[data-member-role]')];
document.querySelectorAll('[data-member-filter]').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.memberFilter;
  document.querySelectorAll('[data-member-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  document.querySelectorAll('[data-member-group]').forEach(group => { group.hidden = filter !== 'all' && group.dataset.memberGroup !== filter; });
  const count = members.filter(member => filter === 'all' || member.dataset.memberRole === filter).length;
  document.querySelector('#member-count').textContent = `顯示 ${count} 位成員 / Showing ${count} members`;
  scheduleScrollUpdate();
}));
const dialog = document.querySelector('#image-dialog');
const largeImage = document.querySelector('#large-image');
const imageFrame = document.querySelector('.dialog-image');
const imageButtons = [...document.querySelectorAll('[data-image]')];
const zoomButton = document.querySelector('#zoom-image');
let imageTrigger;
let imageIndex = 0;
function setZoom(zoomed) {
  imageFrame.classList.toggle('is-zoomed', zoomed);
  zoomButton.setAttribute('aria-pressed', String(zoomed));
  zoomButton.textContent = zoomed ? '符合視窗 / Fit' : '放大細節 / Zoom';
}
function displayImage(index) {
  imageIndex = (index + imageButtons.length) % imageButtons.length;
  const source = imageButtons[imageIndex];
  largeImage.src = source.dataset.image;
  largeImage.alt = source.dataset.caption;
  document.querySelector('#image-caption').textContent = source.dataset.caption;
  document.querySelector('#gallery-position').textContent = `${imageIndex + 1} / ${imageButtons.length}`;
  imageFrame.scrollTop = 0;
  imageFrame.scrollLeft = 0;
  setZoom(false);
}
imageButtons.forEach((button, index) => button.addEventListener('click', () => {
  imageTrigger = button;
  displayImage(index);
  dialog.showModal();
  document.body.classList.add('dialog-open');
  document.querySelector('#close-image').focus();
}));
document.querySelector('#prev-image').addEventListener('click', () => displayImage(imageIndex - 1));
document.querySelector('#next-image').addEventListener('click', () => displayImage(imageIndex + 1));
zoomButton.addEventListener('click', () => setZoom(zoomButton.getAttribute('aria-pressed') !== 'true'));
largeImage.addEventListener('click', () => setZoom(zoomButton.getAttribute('aria-pressed') !== 'true'));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); displayImage(imageIndex + (event.key === 'ArrowRight' ? 1 : -1)); }
});
document.querySelector('#close-image').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); largeImage.removeAttribute('src'); setZoom(false); imageTrigger?.focus({preventScroll:true}); });
const navLinks = [...nav.querySelectorAll('a')];
const navSections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
const pageHeader = document.querySelector('header');
const progress = document.querySelector('#reading-progress');
const backToTop = document.querySelector('.back-to-top');
let scrollQueued = false;
function updateScrollUI() {
  scrollQueued = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0}%`;
  pageHeader.classList.toggle('is-scrolled', window.scrollY > 30);
  backToTop.hidden = window.scrollY < 700;
  let active = -1;
  let closestTop = -Infinity;
  navSections.forEach((section, index) => {
    const top = section.getBoundingClientRect().top;
    if (top <= pageHeader.offsetHeight + 130 && top > closestTop) { closestTop = top; active = index; }
  });
  navLinks.forEach((link, index) => { if (index === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
}
function scheduleScrollUpdate() { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScrollUI); } }
window.addEventListener('scroll', scheduleScrollUpdate, {passive:true});
window.addEventListener('resize', scheduleScrollUpdate);
window.addEventListener('load', scheduleScrollUpdate);
updateScrollUI();
