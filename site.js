const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
const moreMenu = document.querySelector('.nav-more');
const pageHeader = document.querySelector('header');
function setMenu(open) {
  if (!menu || !nav) return;
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '關閉導覽選單' : '開啟導覽選單');
  nav.classList.toggle('open', open);
  if (!open && moreMenu) moreMenu.open = false;
}
function closeNavigation() { setMenu(false); if (moreMenu) moreMenu.open = false; }
menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
  if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) closeNavigation();
}));
document.addEventListener('click', event => { if (pageHeader && !pageHeader.contains(event.target)) closeNavigation(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && (nav?.classList.contains('open') || moreMenu?.open)) {
    const mobileOpen = nav?.classList.contains('open');
    closeNavigation();
    (mobileOpen ? menu : moreMenu?.querySelector('summary'))?.focus();
  }
});
// Measure the collapsed header; explicitly scroll even when the hash is unchanged.
let anchorFrame = 0;
function scrollToAnchor(target, smooth = true, focus = false) {
  cancelAnimationFrame(anchorFrame);
  anchorFrame = requestAnimationFrame(() => {
    const offset = (pageHeader?.offsetHeight || 0) + 24;
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    window.scrollTo({top, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant'});
    if (focus) { target.setAttribute('tabindex', '-1'); target.focus({preventScroll: true}); }
  });
}
function pagePath(path) { return path.replace(/index\.html$/, ''); }
document.querySelectorAll('a[href]').forEach(link => link.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target === '_blank' || link.hasAttribute('download')) return;
  const destination = new URL(link.href, location.href);
  if (destination.origin !== location.origin || pagePath(destination.pathname) !== pagePath(location.pathname) || !destination.hash) return;
  let id;
  try { id = decodeURIComponent(destination.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  closeNavigation();
  if (location.hash !== destination.hash) history.pushState(null, '', destination.hash);
  scrollToAnchor(target, true, true);
}));
window.addEventListener('popstate', () => {
  closeNavigation();
  let target;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
  if (target) scrollToAnchor(target, false);
  else if (!location.hash) window.scrollTo({top:0, behavior:'instant'});
});
window.addEventListener('load', () => {
  let target;
  try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
  if (target) scrollToAnchor(target, false);
});
window.addEventListener('resize', () => { if (innerWidth > 860) setMenu(false); });
window.addEventListener('pageshow', closeNavigation);
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
if (dialog && largeImage && imageFrame) {
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
}
const navLinks = [...(nav?.querySelectorAll('a') || [])];
const sectionLinks = navLinks.map(link => {
  const url = new URL(link.href, location.href);
  return {link, section: pagePath(url.pathname) === pagePath(location.pathname) && url.hash ? document.getElementById(url.hash.slice(1)) : null};
}).filter(item => item.section);
const progress = document.querySelector('#reading-progress');
const backToTop = document.querySelector('.back-to-top');
let scrollQueued = false;
function updateScrollUI() {
  scrollQueued = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.width = `${max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0}%`;
  pageHeader?.classList.toggle('is-scrolled', window.scrollY > 30);
  if (backToTop) backToTop.hidden = window.scrollY < 700;
  let active = null;
  let closestTop = -Infinity;
  sectionLinks.forEach(({link, section}) => {
    const top = section.getBoundingClientRect().top;
    if (top <= (pageHeader?.offsetHeight || 0) + 130 && top > closestTop) { closestTop = top; active = link; }
  });
  sectionLinks.forEach(({link}) => { if (link === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  if (moreMenu) moreMenu.classList.toggle('has-active-page', !!moreMenu.querySelector('[aria-current]'));
}
function scheduleScrollUpdate() { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScrollUI); } }
window.addEventListener('scroll', scheduleScrollUpdate, {passive:true});
window.addEventListener('resize', scheduleScrollUpdate);
window.addEventListener('load', scheduleScrollUpdate);
updateScrollUI();

const contactMessage = document.querySelector('#contact-message');
if (contactMessage) {
  const updateMessageCount = () => { document.querySelector('#message-count').textContent = `${contactMessage.value.length} / ${contactMessage.maxLength}`; };
  contactMessage.addEventListener('input', updateMessageCount);
  window.addEventListener('pageshow', updateMessageCount);
  updateMessageCount();
}
