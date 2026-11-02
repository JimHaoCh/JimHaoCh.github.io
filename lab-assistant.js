/* Bioflumen & Xensor Lab guide: curated, browser-local answers, no tracking. */
(() => {
  'use strict';
  const root = document.getElementById('lab-helper');
  const dataNode = document.getElementById('lab-helper-data');
  if (!root || !dataNode) return;
  let data;
  try { data = JSON.parse(dataNode.textContent); } catch (_) { return; }
  if (!data || !Array.isArray(data.groups) || !Array.isArray(data.entries)) return;
  const groups = new Map(data.groups.map(group => [group.id, group]));
  const entries = new Map(data.entries.map(entry => [entry.id, entry]));
  const $ = selector => root.querySelector(selector);
  const panel = $('.lab-helper__panel');
  const launcher = $('.lab-helper__launcher');
  const input = $('#lab-helper-input');
  const log = $('.lab-helper__messages');
  const language = $('.lab-helper__language');
  let lang = 'zh';
  let history = [{ type: 'home' }];
  const copy = {
    zh: {
      title:'實驗室小幫手', status:'● 研究・技術・合作資訊導覽', home:'主題', reset:'重新開始',
      placeholder:'輸入問題，例如：可以製作晶片嗎？', input:'輸入想了解的問題', send:'送出問題',
      note:'依網站公開資訊提供導覽，問題在瀏覽器內處理。', language:'Switch language to English',
      greet:'您好！我可以協助您了解研究方向、技術設備、合作方式與加入資訊。請選擇主題，或直接輸入問題。',
      choose:'選擇您想了解的問題：', related:'您可能也想了解', options:'找到幾個相關主題，請選擇：',
      empty:'目前沒有找到足夠吻合的內容。請換個關鍵字，或選擇下方主題、聯絡實驗室。',
      viewTopics:'查看所有主題', contact:'聯絡實驗室', link:'查看相關資訊',
      research:'研究與資訊導覽', topics:'主題選單'
    },
    en: {
      title:'Lab guide', status:'● Research · techniques · collaboration', home:'Topics', reset:'Start over',
      placeholder:'Ask a question, e.g. Can you make a chip?', input:'Enter your question', send:'Send question',
      note:'Answers use public website content; questions stay in your browser.', language:'切換成中文',
      greet:'Hello! Explore our research, techniques, facilities, collaboration and student opportunities. Select a topic or type a question.',
      choose:'Choose a question:', related:'You may also be interested in', options:'Here are some relevant topics. Please choose one:',
      empty:'No close match was found. Try another keyword, browse the topics or contact the lab.',
      viewTopics:'View all topics', contact:'Contact the lab', link:'Explore related information',
      research:'LAB INFORMATION', topics:'Explore topics'
    }
  };
  const t = key => copy[lang][key];
  const local = value => typeof value === 'string' ? value : (value?.[lang] || value?.zh || '');
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function safeHref(href) {
    if (typeof href !== 'string') return '';
    if (/^\/(?!\/)/.test(href) || /^https:\/\//i.test(href) || /^mailto:[^\s@]+@[^\s@]+$/i.test(href)) return href;
    return '';
  }
  function action(label, kind, id, className='') {
    const button = el('button', className, label);
    button.type = 'button';
    button.dataset.action = kind;
    if (id) button.dataset.id = id;
    return button;
  }
  function choices(container, specs, extraClass='') {
    const list = el('div', 'lab-helper__choices ' + extraClass);
    for (const spec of specs) list.append(action(spec.label, spec.action, spec.id));
    if (list.childElementCount) container.append(list);
  }
  function linkList(container, links) {
    const list = el('div', 'lab-helper__links');
    for (const link of links || []) {
      const href = safeHref(link.href);
      if (!href) continue;
      const a = el('a', '', local(link) + ' ↗');
      a.href = href;
      if (/^https:\/\//i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      list.append(a);
    }
    if (list.childElementCount) container.append(list);
  }
  function groupChoices(container) {
    choices(container, data.groups.map(group => ({label: group.icon + '  ' + local(group), action:'group', id:group.id})), 'lab-helper__choices--groups');
  }
  function resultChoices(container, ids) {
    choices(container, ids.map(id => entries.get(id)).filter(Boolean).map(entry => ({label: local(entry.title), action:'answer', id:entry.id})), 'lab-helper__choices--questions');
  }
  function botBubble() {
    const outer = el('div','lab-helper__message lab-helper__message--bot');
    const bubble = el('div','lab-helper__bubble');
    outer.append(bubble);
    log.append(outer);
    return bubble;
  }
  function renderItem(item) {
    if (item.type === 'user') {
      const outer = el('div','lab-helper__message lab-helper__message--user');
      outer.append(el('div','lab-helper__bubble', item.text));
      log.append(outer);
      return;
    }
    const bubble = botBubble();
    if (item.type === 'home') {
      bubble.append(el('span','lab-helper__eyebrow',t('research')));
      bubble.append(el('p','',t('greet')));
      groupChoices(bubble);
    } else if (item.type === 'group') {
      const group = groups.get(item.id);
      if (!group) return;
      bubble.append(el('strong','lab-helper__message-title',group.icon + '  ' + local(group)));
      bubble.append(el('p','',t('choose')));
      const questions = data.entries.filter(entry => entry.group === group.id).map(entry => entry.id);
      if (group.id === 'papers') questions.push('ebc','sputum','bacteria','ausic');
      resultChoices(bubble, questions);
    } else if (item.type === 'answer') {
      const entry = entries.get(item.id);
      if (!entry) return;
      bubble.append(el('strong','lab-helper__message-title',local(entry.title)));
      bubble.append(el('p','',local(entry.answer)));
      linkList(bubble,entry.links);
      const related = (entry.related || []).filter(id => entries.has(id)).slice(0,3);
      if (related.length) {
        bubble.append(el('span','lab-helper__related-label',t('related')));
        choices(bubble,related.map(id => ({label:local(entries.get(id).title),action:'answer',id})));
      }
    } else if (item.type === 'options') {
      bubble.append(el('p','',t('options')));
      resultChoices(bubble,item.ids);
      choices(bubble,[{label:t('viewTopics'),action:'home'}]);
    } else if (item.type === 'empty') {
      bubble.append(el('p','',t('empty')));
      choices(bubble,[{label:t('viewTopics'),action:'home'},{label:t('contact'),action:'answer',id:'contact'}]);
    }
  }
  function render() {
    root.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    $('.lab-helper__title').textContent=t('title');
    $('.lab-helper__status').textContent=t('status');
    $('.lab-helper__home').textContent=t('home');
    $('.lab-helper__reset').textContent=t('reset');
    $('.lab-helper__note').textContent=t('note');
    $('.lab-helper__form label').textContent=t('input');
    $('.lab-helper__send').setAttribute('aria-label',t('send'));
    input.placeholder=t('placeholder');
    language.textContent=lang==='zh'?'EN':'中文';
    language.setAttribute('aria-label',t('language'));
    log.replaceChildren();
    for (const item of history) renderItem(item);
    log.scrollTop=log.scrollHeight;
  }
  const norm = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
  function matches(query, term) {
    if (/^[a-z0-9]{1,4}$/.test(term)) {
      const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      return new RegExp('(^|[^a-z0-9])'+escaped+'(?=$|[^a-z0-9])','i').test(query);
    }
    return query.includes(term);
  }
  function search(inputValue) {
    const query = norm(inputValue);
    const ambiguous = {
      '細胞':['cell-culture','microscope','organ-chip'], 'cell':['cell-culture','microscope','organ-chip'], 'cells':['cell-culture','microscope','organ-chip'],
      '晶片':['chip-design','fabrication','materials'], 'chip':['chip-design','fabrication','materials'],
      '微流體':['microfluidics','chip-design','fabrication'], 'microfluidics':['microfluidics','chip-design','fabrication']
    };
    if (ambiguous[query]) return {ids:ambiguous[query]};
    const ranked=[];
    for (const entry of data.entries) {
      let best=0;
      for (const word of entry.keywords || []) {
        const term=norm(word);
        if (!term || !matches(query,term)) continue;
        const chars=term.replace(/\s/g,'').length;
        const score=10+Math.min(chars,24)*2+(query===term?15:0);
        if (score>best) best=score;
      }
      if (query===norm(entry.title.zh) || query===norm(entry.title.en)) best+=40;
      if (best) ranked.push({id:entry.id,score:best});
    }
    ranked.sort((a,b)=>b.score-a.score);
    if (!ranked.length) return {ids:[]};
    // Only choose an answer automatically when there is a distinct match.
    if (ranked.length===1 || ranked[0].score-ranked[1].score>=12) return {ids:[ranked[0].id]};
    return {ids:ranked.filter(x=>x.score>=ranked[0].score-12).slice(0,4).map(x=>x.id)};
  }
  function push(...items) {
    history.push(...items);
    if (history.length>50) history=[{type:'home'},...history.slice(-45)];
    render();
  }
  function open() {
    root.dataset.open='true';
    panel.hidden=false;
    launcher.setAttribute('aria-expanded','true');
    render();
    // Focus the title controls without summoning the mobile keyboard.
    language.focus({preventScroll:true});
  }
  function close(restoreFocus=true) {
    panel.hidden=true;
    root.dataset.open='false';
    launcher.setAttribute('aria-expanded','false');
    if (restoreFocus) launcher.focus({preventScroll:true});
  }
  launcher.addEventListener('click',open);
  $('.lab-helper__close').addEventListener('click',()=>close());
  language.addEventListener('click',()=>{lang=lang==='zh'?'en':'zh';render();});
  $('.lab-helper__home').addEventListener('click',()=>push({type:'home'}));
  $('.lab-helper__reset').addEventListener('click',()=>{history=[{type:'home'}];input.value='';render();});
  $('.lab-helper__form').addEventListener('submit',event=>{
    event.preventDefault();
    const value=input.value.trim();
    if (!value) {input.focus();return;}
    // Full English questions use English; acronyms such as CNC do not change language.
    if (!/[\u3400-\u9fff]/.test(value) && (value.match(/[A-Za-z]{2,}/g)||[]).length>=2) lang='en';
    const result=search(value);
    input.value='';
    const answer=result.ids.length===1?{type:'answer',id:result.ids[0]}:result.ids.length?{type:'options',ids:result.ids}:{type:'empty'};
    push({type:'user',text:value},answer);
  });
  log.addEventListener('click',event=>{
    const link=event.target.closest('a');
    if (link) { close(false); return; }
    const button=event.target.closest('button[data-action]');
    if (!button) return;
    const kind=button.dataset.action,id=button.dataset.id;
    const keyboard=event.detail===0;
    if (kind==='home') push({type:'home'});
    else if (kind==='group' && groups.has(id)) push({type:'user',text:local(groups.get(id))},{type:'group',id});
    else if (kind==='answer' && entries.has(id)) push({type:'user',text:local(entries.get(id).title)},{type:'answer',id});
    if (keyboard) log.focus({preventScroll:true});
  });
  document.addEventListener('keydown',event=>{
    if (event.key==='Escape' && root.dataset.open==='true') {event.preventDefault();close();}
  });
  root.hidden=false;
  render();
})();
