/* Official MOEX link-only year-first and subject-first index; no reproduced PDFs. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  if(!$('exam-index'))return;
  const Core=window.MLSExamCore;
  if(!Core){$('exam-source-status').textContent='索引元件載入失敗，請使用考選部官方連結。';return;}
  const SUBJECTS=[
    {id:'phys',name:'臨床生理學與病理學',short:'臨床生理與病理'},
    {id:'hemo',name:'臨床血液學與血庫學',short:'血液學與血庫'},
    {id:'molecular',name:'醫學分子檢驗學與臨床鏡檢學（包括寄生蟲學）',short:'分子與臨床鏡檢'},
    {id:'micro',name:'微生物學與臨床微生物學（包括細菌與黴菌）',short:'臨床微生物學'},
    {id:'biochem',name:'生物化學與臨床生化學',short:'臨床生化學'},
    {id:'immuno',name:'臨床血清免疫學與臨床病毒學',short:'免疫與病毒學'}
  ];
  const SUBJECT_PREFIXES=[
    ['臨床生理學','phys'],['臨床血液學','hemo'],['醫學分子檢驗學','molecular'],
    ['微生物學與臨床微生物學','micro'],['生物化學與臨床生化學','biochem'],['臨床血清免疫學','immuno']
  ];
  const OPTION=(title,value)=>new Option(title,value);
  const source=$('exam-source-status');
  const status=(text,error=false)=>{source.textContent=text;source.classList.toggle('is-error',error);};
  const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
  const subjectId=record=>SUBJECT_PREFIXES.find(([prefix])=>String(record.subject||'').startsWith(prefix))?.[1]||'other';
  const sessionOf=record=>{
    const exam=String(record.exam||''),session=String(record.session||'');
    const match=exam.match(/第([一二三四])次/);
    if(match)return '第'+match[1]+'次';
    if(/^第[一二三四]次$/.test(session))return session;
    return '未標示考次';
  };
  const sessionSort=(a,b)=>'第一二三四'.indexOf(a[1])-'第一二三四'.indexOf(b[1]);
  let entries=[],mode='year',selectedYear=0,selectedSession='',selectedSubject='micro',shown=15,importedCount=0,initialLoaded=false;
  let loadedAt='';
  const currentYears=()=>[...new Set(entries.map(e=>e.year))].sort((a,b)=>b-a);
  const button=(cls,label,handler,active=false)=>{
    const b=el('button',cls+(active?' is-active':''),label);
    b.type='button';b.setAttribute('aria-pressed',String(active));b.addEventListener('click',handler);
    return b;
  };
  function pdf(url,zh,en,important=false){
    const safe=Core.officialUrl(url);
    if(!safe)return null;
    const a=el('a','exam-quick-link'+(important?' exam-quick-link-primary':''),zh);
    a.append(el('small','',en+' ↗'));a.href=safe;a.target='_blank';a.rel='noopener noreferrer external';
    return a;
  }
  function filterText(record){
    const term=$('exam-keyword').value.trim().toLocaleLowerCase();
    return !term||[record.subject,record.exam,record.session,record.notes,sessionOf(record)].join(' ').toLocaleLowerCase().includes(term);
  }
  function renderYearTabs(){
    const years=currentYears(),tabs=$('exam-year-tabs');
    tabs.replaceChildren();$('exam-year-count').textContent=years.length+' 個收錄年度';
    for(const year of years){
      const yearText='民國 '+year+' 年';
      const b=button('exam-year-button',yearText,()=>{selectedYear=year;selectedSession='';render();},selectedYear===year);
      b.append(el('small','',String(year+1911)));tabs.append(b);
    }
  }
  function availableSessions(year){
    const groups=[...new Set(entries.filter(e=>e.year===year).map(sessionOf))];
    return groups.sort(sessionSort);
  }
  function renderSessionTabs(){
    const sessions=availableSessions(selectedYear);
    if(!sessions.includes(selectedSession))selectedSession=sessions.includes('第二次')?'第二次':sessions[0]||'';
    const tabs=$('exam-session-tabs');tabs.replaceChildren();
    for(const session of sessions){
      const count=new Set(entries.filter(e=>e.year===selectedYear&&sessionOf(e)===session).map(subjectId).filter(s=>s!=='other')).size;
      const b=button('exam-session-button',session,()=>{selectedSession=session;render();},selectedSession===session);
      b.append(el('small','',count+' / 6 科收錄'));
      tabs.append(b);
    }
    if(!sessions.length)tabs.append(el('p','exam-empty','目前尚無此年度的官方試卷索引。'));
  }
  function renderSubjectTabs(){
    const tabs=$('exam-subject-tabs');tabs.replaceChildren();
    for(const item of SUBJECTS){
      const count=entries.filter(e=>subjectId(e)===item.id).length;
      const b=button('exam-subject-button',item.short,()=>{selectedSubject=item.id;shown=15;render();},selectedSubject===item.id);
      b.append(el('small','',count+' 份已收錄試卷'));
      tabs.append(b);
    }
  }
  function appendPdfLinks(target,record){
    const links=el('div','exam-quick-actions');
    const question=pdf(record.question,'試題','Question PDF',true);
    const answer=pdf(record.answer,record.correction?'原標準答案':'標準答案','Answer PDF');
    const correction=pdf(record.correction,'更正答案','Amended key',true);
    for(const item of [question,correction,answer])if(item)links.append(item);
    if(!links.children.length)links.append(el('span','exam-no-link','官方原始連結未收錄'));
    target.append(links);
  }
  function renderYearResult(){
    const selected=entries.filter(e=>e.year===selectedYear&&sessionOf(e)===selectedSession&&filterText(e));
    $('exam-result-title').textContent='民國 '+selectedYear+' 年'+selectedSession+' · 六大考科';
    const sourceRecord=selected.find(record=>record.source_page);
    $('exam-external-official').href=Core.officialUrl(sourceRecord?.source_page)||'https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx';
    const panel=$('exam-results');panel.replaceChildren();
    const bySubject=new Map();
    for(const record of selected){
      const key=subjectId(record);
      if(key==='other')continue;
      if(!bySubject.has(key))bySubject.set(key,record);
    }
    $('exam-match-count').textContent='已收錄 '+bySubject.size+' / 6 科 · 點「試題」直接開啟考選部 PDF';
    for(const item of SUBJECTS){
      const record=bySubject.get(item.id);
      const row=el('article','exam-subject-row'+(!record?' exam-subject-missing':''));
      const name=el('div','exam-subject-description');
      name.append(el('h4','',item.name),el('p','',record?'考選部正式試卷與標準答案':'此考次尚未有可確認的官方連結'));
      row.append(name);
      if(record)appendPdfLinks(row,record);
      else{
        const link=pdf('https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx','至考選部查詢','Official search');
        row.append(link);
      }
      panel.append(row);
    }
    $('exam-more').hidden=true;
  }
  function renderSubjectResult(){
    $('exam-external-official').href='https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx';
    const item=SUBJECTS.find(s=>s.id===selectedSubject);
    $('exam-result-title').textContent=item.short+' · 歷年考古題';
    const matching=entries.filter(e=>subjectId(e)===selectedSubject&&filterText(e))
      .sort((a,b)=>b.year-a.year||sessionOf(b).localeCompare(sessionOf(a),'zh-Hant'));
    $('exam-match-count').textContent='找到 '+matching.length+' 份官方索引（僅顯示已收錄考次）';
    const results=$('exam-results');results.replaceChildren();
    if(!matching.length)results.append(el('p','exam-empty','此科暫無符合的官方連結；可取消關鍵字或前往考選部查詢。'));
    for(const record of matching.slice(0,shown)){
      const row=el('article','exam-subject-row');
      const name=el('div','exam-subject-description');
      name.append(el('h4','','民國 '+record.year+' 年 · '+sessionOf(record)));
      name.append(el('p','',record.subject));
      row.append(name);appendPdfLinks(row,record);results.append(row);
    }
    $('exam-more').hidden=matching.length<=shown;
  }
  function render(){
    const years=currentYears();
    if(!years.includes(selectedYear))selectedYear=years[0]||0;
    $('exam-year-view').hidden=mode!=='year';
    $('exam-subject-view').hidden=mode!=='subject';
    $('exam-mode-year').classList.toggle('is-active',mode==='year');
    $('exam-mode-subject').classList.toggle('is-active',mode==='subject');
    $('exam-mode-year').setAttribute('aria-pressed',String(mode==='year'));
    $('exam-mode-subject').setAttribute('aria-pressed',String(mode==='subject'));
    if(!years.length){
      $('exam-results').replaceChildren(el('p','exam-empty','官方索引目前未載入。請使用考選部官方連結，或在進階區匯入官方 CSV。'));
      $('exam-result-title').textContent='尚未讀取到試卷資料';
      $('exam-match-count').textContent='目前 0 筆';$('exam-more').hidden=true;
      return;
    }
    renderYearTabs();renderSessionTabs();renderSubjectTabs();
    if(mode==='year')renderYearResult();else renderSubjectResult();
  }
  function setEntries(incoming){
    entries=Core.mergeEntries(entries,incoming);
    shown=15;render();updateIndexStatus();
  }
  function updateIndexStatus(){
    const years=currentYears();
    const parts=['官方連結索引：'+entries.length+' 份試卷、'+years.length+' 個年度'];
    if(loadedAt)parts.push('資料更新時間 '+loadedAt.slice(0,10)+'（UTC）');
    if(importedCount)parts.push('本機匯入 '+importedCount+' 筆');
    if(!initialLoaded)parts.push('未能載入預設索引');
    parts.push('此索引並非保證涵蓋全部考次；如有更正答案請以考選部公告為準');
    status(parts.join(' · '),!initialLoaded);
  }
  async function importCSV(file){
    if(!file)return;
    const input=$('exam-import');input.disabled=true;
    status('正在瀏覽器本機讀取官方 CSV…');
    try{
      if(file.size>65_000_000)throw new Error('CSV 超過 65 MB 限制');
      const firstBytes=await file.slice(0,4096).arrayBuffer();
      const probe=new TextDecoder('utf-8').decode(firstBytes);
      const encoding=/考試年度|類科組別/.test(probe)?'utf-8':'big5';
      const decoder=new TextDecoder(encoding,{fatal:false});
      const incoming=[];
      const parser=new Core.CSVStreamParser(row=>{const record=Core.examRecordFromCSV(row);if(record)incoming.push(record);});
      const block=128*1024;
      for(let offset=0;offset<file.size;offset+=block){
        const part=await file.slice(offset,Math.min(offset+block,file.size)).arrayBuffer();
        parser.write(decoder.decode(part,{stream:true}));
        if(offset%(block*16)===0)await new Promise(resolve=>setTimeout(resolve,0));
      }
      parser.write(decoder.decode());
      const columns=parser.finish();
      if(!columns.includes('考試年度')||!columns.includes('類科組別')||!columns.includes('科目全名'))throw new Error('CSV 不是考選部資料集 170565 的格式');
      if(!incoming.length)throw new Error('沒有找到醫事檢驗師的官方索引資料');
      importedCount+=incoming.length;
      setEntries(incoming);
    }catch(error){status('匯入失敗：'+(error?.message||'格式無法讀取'),true);}
    finally{input.disabled=false;input.value='';}
  }
  $('exam-mode-year').addEventListener('click',()=>{mode='year';render();});
  $('exam-mode-subject').addEventListener('click',()=>{mode='subject';render();});
  $('exam-more').addEventListener('click',()=>{shown+=30;render();});
  $('exam-keyword').addEventListener('input',()=>{shown=15;render();});
  $('exam-reset').addEventListener('click',()=>{$('exam-keyword').value='';render();});
  $('exam-import').addEventListener('change',event=>{void importCSV(event.target.files?.[0]);});
  fetch('/assets/data/moex_medlab.json',{cache:'no-cache'})
    .then(response=>{if(!response.ok)throw new Error('HTTP '+response.status);return response.json();})
    .then(data=>{initialLoaded=true;loadedAt=data.curated_on||data.retrieved_at_utc||'';setEntries(data.entries||[]);})
    .catch(()=>{render();updateIndexStatus();});
  render();
  // Original study questions: deliberately separate from official exam PDFs.
  let questions = [], pool = [], step = 0, score = 0, answered = false;
  const STORAGE_KEY = 'bioflumen-mls-practice-wrong-v1';
  let wrongIds = new Set();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(parsed)) wrongIds = new Set(parsed.filter(id => typeof id === 'string'));
  } catch (_) { /* Private browsing or old invalid data. */ }
  const persist = () => {try {localStorage.setItem(STORAGE_KEY, JSON.stringify([...wrongIds]));} catch (_) {}};
  const wrongCount = () => {
    $('practice-wrong-count').textContent = `錯題紀錄：${wrongIds.size} 題（僅存在本機）`;
  };
  function renderQuestion() {
    const area = $('practice-question');
    area.replaceChildren(); wrongCount();
    $('practice-next').hidden = true;
    if (step >= pool.length) {
      const title = document.createElement('h3');
      title.textContent = `練習結束：答對 ${score} / ${pool.length} 題`;
      const note = document.createElement('p');
      note.textContent = '錯題已記錄於這個瀏覽器，可按「只複習錯題」再次練習。本題庫由本站原創，並非考選部試卷。';
      area.append(title, note); return;
    }
    answered = false;
    const q = pool[step];
    const title = document.createElement('h3');
    title.textContent = `第 ${step + 1} / ${pool.length} 題｜${q.subject}`;
    const stem = document.createElement('p'); stem.className = 'practice-stem'; stem.textContent = q.stem;
    const options = document.createElement('div'); options.className = 'practice-options';
    const feedback = document.createElement('div'); feedback.className = 'practice-feedback';
    feedback.setAttribute('aria-live', 'polite');
    q.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'practice-choice';
      button.textContent = String.fromCharCode(65 + index) + '. ' + choice;
      button.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const correct = index === q.correct;
        if (correct) {score++; wrongIds.delete(q.id);} else wrongIds.add(q.id);
        persist(); wrongCount();
        [...options.children].forEach((node, i) => {
          node.disabled = true;
          if (i === q.correct) node.classList.add('is-correct');
          else if (i === index && !correct) node.classList.add('is-wrong');
        });
        feedback.textContent = (correct ? '答對！' : '答錯，正確答案是 ' + String.fromCharCode(65 + q.correct) + '。') + ' ' + q.explanation;
        $('practice-next').hidden = false;
      });
      options.append(button);
    });
    area.append(title, stem, options, feedback);
  }
  function startQuiz(incorrectOnly = false) {
    const subject = $('practice-subject').value;
    const found = questions.filter(q => (!subject || q.subject === subject) &&
      (!incorrectOnly || wrongIds.has(q.id)));
    if (!found.length) {
      $('practice-question').textContent = incorrectOnly ? '這個科目目前沒有錯題。' : '目前沒有符合的原創練習題。';
      $('practice-next').hidden = true;
      return;
    }
    pool = Core.fisherYates(found).slice(0, 12);
    step = 0; score = 0;
    renderQuestion();
  }
  $('practice-start').disabled = true;
  $('practice-review').disabled = true;
  $('practice-start').addEventListener('click', () => startQuiz());
  $('practice-review').addEventListener('click', () => startQuiz(true));
  $('practice-next').addEventListener('click', () => {step++; renderQuestion();});
  $('practice-clear').addEventListener('click', () => {
    if (!window.confirm('要清除此裝置的錯題紀錄嗎？')) return;
    wrongIds.clear(); persist(); wrongCount();
  });
  populateSubjects($('practice-subject'));
  fetch('/assets/data/mls_practice.json', {cache:'no-cache'})
    .then(response => {if (!response.ok) throw new Error('HTTP ' + response.status); return response.json();})
    .then(data => {
      questions = Array.isArray(data.questions) ? data.questions.filter(q => Array.isArray(q.choices) && q.choices.length === 4 &&
        Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4 && q.id && q.subject) : [];
      $('practice-start').disabled = !questions.length;
      $('practice-review').disabled = !questions.length;
      $('practice-app').classList.remove('practice-loading');
      $('practice-question').textContent = `原創練習題已載入 ${questions.length} 題，選擇考科後開始練習。`;
      wrongCount();
    })
    .catch(() => { $('practice-question').textContent = '練習題載入失敗，請重新整理頁面。'; });
})();