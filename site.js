const menu = document.querySelector('.menu');
const nav = document.querySelector('#nav');
const moreMenu = document.querySelector('.nav-more');
const pageHeader = document.querySelector('header');
pageHeader?.classList.add('navigation-ready');
function setMenu(open) {
  if (!menu || !nav) return;
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '關閉全站選單' : `開啟全站選單，${nav.querySelectorAll('a').length} 個入口`);
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
  papers.forEach(paper => { paper.hidden = button.dataset.filter !== 'all' && !(paper.dataset.type || '').split(/\s+/).includes(button.dataset.filter); if (!paper.hidden) count++; });
  document.querySelector('#paper-count').textContent = `顯示 ${count} 篇論文 / Showing ${count} publications`;
  const empty = document.querySelector('#paper-empty');
  if (empty) empty.hidden = count !== 0;
  animateItems(papers.filter(paper => !paper.hidden).slice(0, 4));
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


// Motion enhances visible content; no content is hidden while waiting for JavaScript.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const motionAnimations = new Set();
let motionPaused = motionPreference.matches;
function animateItems(items) {
  if (motionPaused || motionPreference.matches) return;
  items.forEach((item, index) => {
    if (!item.animate) return;
    const animation = item.animate([
      {opacity: 0.35, transform: 'translateY(18px)'},
      {opacity: 1, transform: 'translateY(0)'}
    ], {duration: 520, delay: Math.min(index, 3) * 55, easing: 'cubic-bezier(.2,.65,.3,1)'});
    motionAnimations.add(animation);
    animation.onfinish = animation.oncancel = () => motionAnimations.delete(animation);
  });
}
let entranceObserver;
if ('IntersectionObserver' in window && !motionPreference.matches) {
  entranceObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting);
    animateItems(visible.map(entry => entry.target));
    visible.forEach(entry => entranceObserver.unobserve(entry.target));
  }, {threshold: 0.12});
  document.querySelectorAll('.section-title,.story-head,.research-index>a,.page-cards>a,.managed-card,.tech-card,.student').forEach(item => entranceObserver.observe(item));
}
motionPreference.addEventListener('change', event => {
  setMotionPaused(event.matches);
  if (event.matches) {
    entranceObserver?.disconnect();
    motionAnimations.forEach(animation => animation.cancel());
  }
});


// The visitor controls continuous motion and the guided workflow separately.
let stopDemoTour = () => {};
const motionToggle = document.querySelector('#motion-toggle');
function setMotionPaused(paused) {
  motionPaused = paused || motionPreference.matches;
  document.body.classList.toggle('motion-paused', motionPaused);
  if (motionPaused) {
    motionAnimations.forEach(animation => animation.cancel());
    stopDemoTour();
  }
  if (motionToggle) {
    motionToggle.setAttribute('aria-pressed', String(motionPaused));
    motionToggle.disabled = motionPreference.matches;
    motionToggle.innerHTML = motionPreference.matches
      ? '已減少動態<span lang="en">Reduced motion enabled</span>'
      : motionPaused ? '▶ 恢復動態<span lang="en">Resume motion</span>' : 'Ⅱ 暫停動態<span lang="en">Pause motion</span>';
  }
}
motionToggle?.addEventListener('click', () => setMotionPaused(!motionPaused));
setMotionPaused(motionPreference.matches);

const flowDemo = document.querySelector('#flow-demo');
if (flowDemo) {
  const stepButtons = [...flowDemo.querySelectorAll('[data-demo-step]')];
  const panels = [...flowDemo.querySelectorAll('.demo-panel')];
  const tourButton = document.querySelector('#demo-tour');
  const stageNames = ['採樣 · Sampling', '流動 · Microfluidics', '感測 · Sensing', '讀值 · Readout'];
  let selectedStep = 0;
  let tourTimer = null;
  let inView = !('IntersectionObserver' in window);
  function chooseStep(index, announce = false) {
    selectedStep = (index + stepButtons.length) % stepButtons.length;
    flowDemo.dataset.step = String(selectedStep);
    stepButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selectedStep)));
    flowDemo.querySelector('.demo-panel-list').setAttribute('aria-live', announce ? 'polite' : 'off');
    panels.forEach((panel, i) => { panel.hidden = i !== selectedStep; });
    document.querySelector('#demo-stage-number').textContent = String(selectedStep + 1).padStart(2, '0');
    document.querySelector('#demo-stage-name').textContent = stageNames[selectedStep];
    animateItems([panels[selectedStep]]);
  }
  function setTour(playing) {
    clearInterval(tourTimer);
    tourTimer = null;
    const enabled = playing && !motionPaused && !motionPreference.matches;
    tourButton.setAttribute('aria-pressed', String(enabled));
    tourButton.innerHTML = enabled ? 'Ⅱ 停止導覽<span lang="en">Stop tour</span>' : '▶ 自動導覽<span lang="en">Play tour</span>';
    if (enabled) tourTimer = setInterval(() => {
      if (inView && !document.hidden) chooseStep(selectedStep + 1);
    }, 5000);
  }
  stopDemoTour = () => setTour(false);
  stepButtons.forEach((button, index) => button.addEventListener('click', () => { setTour(false); chooseStep(index, true); }));
  tourButton.addEventListener('click', () => {
    if (motionPreference.matches) return;
    if (motionPaused) setMotionPaused(false);
    setTour(tourTimer === null);
  });
  const syncTourAvailability = () => { tourButton.disabled = motionPreference.matches; };
  syncTourAvailability();
  motionPreference.addEventListener('change', syncTourAvailability);
  if ('IntersectionObserver' in window) {
    const demoObserver = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      flowDemo.classList.toggle('demo-in-view', inView);
    }, {threshold: 0.1});
    demoObserver.observe(flowDemo);
  } else flowDemo.classList.add('demo-in-view');
  window.addEventListener('pagehide', () => setTour(false));
  flowDemo.classList.add('demo-ready');
  flowDemo.querySelector('.demo-controls').hidden = false;
  chooseStep(0);
}

// Keep the mobile menu within the available viewport as fonts and widths change.
if (pageHeader && 'ResizeObserver' in window) {
  new ResizeObserver(() => document.documentElement.style.setProperty('--header-height', `${pageHeader.offsetHeight}px`)).observe(pageHeader);
}

// Course filters enhance the server-rendered catalogue. The full list works without JavaScript.
const courseForm = document.querySelector('.course-filters');
if (courseForm) {
  const cards = [...document.querySelectorAll('[data-course]')];
  const search = document.querySelector('#course-search');
  const year = document.querySelector('#course-year');
  const semester = document.querySelector('#course-semester');
  const normalize = text => text.normalize('NFKC').toLocaleLowerCase().trim();
  function filterCourses() {
    const query = normalize(search.value);
    let count = 0;
    cards.forEach(card => {
      const matches = (!query || normalize(card.dataset.search).includes(query)) &&
        (year.value === 'all' || card.dataset.year === year.value) &&
        (semester.value === 'all' || card.dataset.semester === semester.value);
      card.hidden = !matches;
      if (matches) count++;
    });
    document.querySelector('#course-count').textContent = `顯示 ${count} 門課程 / Showing ${count} courses`;
    document.querySelector('#course-empty').hidden = count > 0;
    scheduleScrollUpdate();
  }
  courseForm.hidden = false;
  courseForm.addEventListener('submit', event => event.preventDefault());
  courseForm.addEventListener('input', filterCourses);
  courseForm.addEventListener('change', filterCourses);
  courseForm.addEventListener('reset', event => {
    event.preventDefault();
    search.value = '';
    year.value = 'all';
    semester.value = 'all';
    filterCourses();
  });
  filterCourses();
}

// Collaboration entry: preselect the existing inquiry category without overwriting user input.
if (new URLSearchParams(location.search).get('inquiry') === 'industry') {
  const inquiryType = document.querySelector('#contact-type');
  if (inquiryType && !inquiryType.value) inquiryType.value = '產學合作 / Industry–academia collaboration';
  const message = document.querySelector('#contact-message');
  if (message) message.placeholder = '請提供用途、尺寸／線寬／深度、材料、數量、圖面準備狀態及預計時程。 / Application, dimensions, material, quantity, drawings and timeline.';
}
