(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const engine=window.BiochemicalTeachingEngine;
  if(!engine||!$('bio-app'))return;
  const state={observations:{},selectedCase:null,organisms:[],tests:[],cases:[]};
  const source=$('bio-status');
  const explain=$('bio-case-feedback');
  const cases=$('bio-case-select');
  const guess=$('bio-guess');
  const missing='尚未判讀 / Not tested';
  const choiceLabel={
    '+':'陽性 (+) / Positive','-':'陰性 (−) / Negative',
    'coccus':'球菌 / Coccus','rod':'桿菌 / Rod',
    'clusters':'葡萄串狀 / Clusters','chains':'鏈狀 / Chains',
    'single':'單個或不規則 / Single or irregular'
  };
  const make=(tag,className,text)=>{
    const x=document.createElement(tag);
    if(className)x.className=className;
    if(text!==undefined)x.textContent=text;
    return x;
  };
  const choices=test=>test.kind==='binary'?['+','-']:test.kind==='shape'?['coccus','rod']:['clusters','chains','single'];
  function buildInputs(){
    for(const test of state.tests){
      const wrapper=make('label','bio-field');
      wrapper.htmlFor='bio-input-'+test.id;
      const heading=make('strong','',test.zh);
      heading.append(make('small','',test.en));
      const input=make('select','bio-select');
      input.id=wrapper.htmlFor;
      input.dataset.id=test.id;
      input.append(new Option(missing,''));
      for(const value of choices(test))input.append(new Option(choiceLabel[value],value));
      input.addEventListener('change',()=>{
        if(input.value)state.observations[test.id]=input.value;
        else delete state.observations[test.id];
        explain.hidden=true;
        render();
      });
      const help=make('span','bio-field-help',test.help_zh);
      const helpEn=make('small','',test.help_en);help.append(helpEn);
      wrapper.append(heading,input,help);
      $('bio-'+test.section).append(wrapper);
    }
  }
  function syncInputs(){
    document.querySelectorAll('#bio-app select[data-id]').forEach(input=>{
      input.value=state.observations[input.dataset.id]||'';
    });
  }
  function addSpeciesRow(parent,record,observed){
    const article=make('article','bio-candidate');
    const row=make('div','bio-candidate-top');
    const head=make('h4','',record.name);
    const count=make('span','bio-match-pill',record.matched.length+' 項符合 · '+record.contradicted.length+' 項衝突');
    row.append(head,count);
    article.append(row,make('p','bio-candidate-zh',record.name_zh));
    if(record.contradicted.length){
      const names=record.contradicted.map(id=>state.tests.find(t=>t.id===id)?.zh||id).join('、');
      article.append(make('p','bio-conflict','衝突項目 / Conflicting results：'+names));
    }else{
      article.append(make('p','bio-candidate-note',record.note_zh));
    }
    if(record.variable.length)article.append(make('p','bio-variability','可變反應 / Variable：'+record.variable.map(id=>state.tests.find(t=>t.id===id)?.zh||id).join('、'));
    parent.append(article);
  }
  function render(){
    const report=engine.analyze(state.observations,state.organisms);
    const target=state.selectedCase?state.organisms.find(x=>x.id===state.selectedCase.target):null;
    const candidates=report.compatible;
    const first=$('bio-candidates');first.replaceChildren();
    $('bio-match-count').textContent=report.observedCount+' 項已輸入 · '+candidates.length+' / '+state.organisms.length+' 個範例檔案未出現明確衝突';
    if(!report.observedCount)first.append(make('p','bio-result-empty','請先輸入 Gram stain、菌形或生化試驗結果；尚無任何鑑別依據。'));
    else if(!candidates.length){
      first.append(make('p','bio-result-empty','本版有限菌種資料中沒有完全符合的組合；可能是試驗結果不典型、需覆核，或菌種不在清單內。'));
      const next=make('details','bio-disagreements');next.append(make('summary','','查看衝突最少的參考菌（不是鑑定結果）'));
      for(const x of report.ranked.slice(0,3))addSpeciesRow(next,x,state.observations);
      first.append(next);
    }else{
      for(const x of candidates.slice(0,10))addSpeciesRow(first,x,state.observations);
      if(candidates.length>10)first.append(make('p','bio-result-empty','其餘候選菌未列出。'));
    }
    const scopedTests=target?state.tests.filter(t=>['+','-'].includes(target.profile[t.id])):state.tests;
    const suggestion=engine.suggest(state.observations,state.organisms,scopedTests);
    const recommendation=$('bio-next-test');
    recommendation.replaceChildren();
    if(!report.observedCount)recommendation.textContent='先完成革蘭氏染色與菌形記錄，再選擇必要的試驗。';
    else if(suggestion){
      const x=state.tests.find(t=>t.id===suggestion.id);
      recommendation.append(make('strong','','推薦下一步：'+x.zh+' / '+x.en));
      recommendation.append(make('p','','目前範例候選中的已知典型反應可分為 '+suggestion.positive+' 個陽性與 '+suggestion.negative+' 個陰性；此建議僅依區分度排序，不代表臨床檢驗流程。'));
    }else recommendation.textContent=candidates.length<=1?'目前小型教學資料庫已無其他可明確區分的候選，仍不可據此確認臨床菌種。':'目前沒有可明確切分剩餘候選的未做試驗；請檢查資料或改用其他臨床方法。';
    $('bio-reveal').disabled=!state.selectedCase||!suggestion;
    $('bio-reveal').dataset.next=suggestion?suggestion.id:'';
    const caseLabel=$('bio-case-intro');
    if(state.selectedCase){
      caseLabel.replaceChildren(make('strong','',state.selectedCase.title_zh),make('p','',state.selectedCase.intro_zh),make('p','bio-case-en',state.selectedCase.intro_en));
    }else{
      caseLabel.textContent='手動探索：輸入任意示範試驗組合；如需練習未知菌，請從上方載入虛構案例。';
    }
  }
  function loadCase(){
    state.selectedCase=state.cases.find(x=>x.id===cases.value)||null;
    state.observations=state.selectedCase?{...state.selectedCase.initial}:{};
    syncInputs();
    guess.value='';
    explain.hidden=true;
    render();
    source.textContent=state.selectedCase?'已載入虛構案例，請選下一項試驗；答案不會自動顯示。':'已切換為自由探索模式。';
  }
  function revealNext(){
    if(!state.selectedCase)return;
    const key=$('bio-reveal').dataset.next;
    if(!key)return;
    const target=state.organisms.find(x=>x.id===state.selectedCase.target);
    const value=target?.profile[key];
    if(value!=='+'&&value!=='-')return;
    state.observations[key]=value;
    syncInputs();
    explain.hidden=true;
    render();
    const test=state.tests.find(x=>x.id===key);
    source.textContent='虛構檢驗結果：'+test.zh+' '+(value==='+'?'陽性 (+)':'陰性 (−)')+'。請解釋此結果排除了哪些典型反應不符的菌。';
  }
  function checkGuess(){
    if(!state.selectedCase){
      explain.hidden=false;
      explain.replaceChildren(make('p','','請先選擇一個虛構案例，再進行猜測。'));
      return;
    }
    if(!guess.value){
      explain.hidden=false;
      explain.replaceChildren(make('p','','請先在「我認為的菌種」選單選擇一個候選。'));
      return;
    }
    const count=Object.keys(state.observations).filter(id=>state.tests.some(x=>x.id===id&&x.section==='biochem')).length;
    if(count<2){
      explain.hidden=false;
      explain.replaceChildren(make('p','','請至少參考兩項生化反應結果，再嘗試判讀。'));
      return;
    }
    const r=engine.caseResult(guess.value,state.selectedCase,state.observations,state.organisms);
    explain.hidden=false;explain.replaceChildren();
    explain.append(make('h4','',r.correct?'本次練習與預設答案一致 ✓':'本次練習與預設答案不同'));
    explain.append(make('p','','案例預設參考：'+r.targetName+'。'+r.note_zh));
    if(r.contradictions.length)explain.append(make('p','','注意：你輸入的結果與本案例預設菌種有矛盾，應先重新確認該試驗：'+r.contradictions.map(id=>state.tests.find(t=>t.id===id)?.zh||id).join('、')+'。'));
    explain.append(make('p','bio-case-en','These are synthetic teaching patterns only; other species and atypical strains can share the same reactions.'));
  }
  function reset(){
    state.selectedCase=null;state.observations={};cases.value='';guess.value='';
    syncInputs();explain.hidden=true;source.textContent='所有已輸入的試驗結果已清除 / All observations cleared.';render();
  }
  $('bio-load-case').addEventListener('click',loadCase);
  $('bio-reset').addEventListener('click',reset);
  $('bio-reveal').addEventListener('click',revealNext);
  $('bio-check-guess').addEventListener('click',checkGuess);
  Promise.all([
    fetch('/assets/data/biochemical-tests.json').then(r=>{if(!r.ok)throw Error('Tests '+r.status);return r.json();}),
    fetch('/assets/data/biochemical-organisms.json').then(r=>{if(!r.ok)throw Error('Profiles '+r.status);return r.json();}),
    fetch('/assets/data/biochemical-cases.json').then(r=>{if(!r.ok)throw Error('Cases '+r.status);return r.json();})
  ]).then(([t,p,c])=>{
    if(!Array.isArray(t.tests)||!Array.isArray(p.organisms)||!Array.isArray(c.cases)||!t.tests.length||!p.organisms.length)throw Error('Invalid dataset');
    state.tests=t.tests;state.organisms=p.organisms;state.cases=c.cases;
    for(const item of c.cases)cases.append(new Option(item.title_zh,item.id));
    for(const item of p.organisms)guess.append(new Option(item.name+' — '+item.name_zh,item.id));
    buildInputs();syncInputs();render();
    $('bio-load-case').disabled=false;$('bio-reset').disabled=false;$('bio-check-guess').disabled=false;
    source.textContent='資料已載入：'+p.organisms.length+' 個簡化參考菌種、'+t.tests.length+' 項觀察與生化試驗、'+c.cases.length+' 個虛構案例。所有計算均在瀏覽器進行。';
  }).catch(err=>{
    source.textContent='教學資料載入失敗，請重新整理網頁，或前往下方外部參考資源。 / Could not load teaching data.';
    console.error('Web-Biochemical data unavailable:',err);
  });
})();
