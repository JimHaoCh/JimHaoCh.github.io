const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source=read('assets/js/medlab-exam.js');
const official=JSON.parse(read('assets/data/moex_medlab.json'));
const practice=JSON.parse(read('assets/data/mls_practice.json'));
const core=require('../assets/js/moex-core.js');
function environment(){
  const elements=new Map();
  class FakeNode{
    constructor(tag='div'){
      this.tag=tag;this.children=[];this.dataset={};this.attributes={};
      this.value='';this.hidden=false;this.disabled=false;this.textContent='';this.className='';
      this.listeners={};
      const names=new Set();
      this.classList={
        add:k=>names.add(k),remove:k=>names.delete(k),contains:k=>names.has(k),
        toggle:(k,b)=>{if(b===undefined)b=!names.has(k);if(b)names.add(k);else names.delete(k);return b}
      };
    }
    append(...nodes){this.children.push(...nodes.map(v=>typeof v==='string'?Object.assign(new FakeNode('text'),{textContent:v}):v));}
    replaceChildren(...nodes){this.children=[];this.textContent='';this.append(...nodes);}
    add(node){this.append(node);}
    setAttribute(k,v){this.attributes[k]=String(v);}
    addEventListener(k,fn){this.listeners[k]=fn;}
    click(){this.listeners.click?.({target:this,preventDefault(){}});}
    input(){this.listeners.input?.({target:this});}
  }
  const ids=Array.from(read('resources/exam.html').matchAll(/\bid="([^"]+)"/g)).map(m=>m[1]);
  for(const id of ids)elements.set(id,new FakeNode('div'));
  elements.get('exam-keyword').value='';
  const Option=function(label,value){const o=new FakeNode('option');o.textContent=label;o.value=value;return o;};
  const document={
    createElement:tag=>new FakeNode(tag),
    getElementById:id=>elements.get(id)||null
  };
  const fetch=url=>{
    if(url==='/assets/data/moex_medlab.json')return Promise.resolve({ok:true,json:()=>Promise.resolve(official)});
    if(url==='/assets/data/mls_practice.json')return Promise.resolve({ok:true,json:()=>Promise.resolve(practice)});
    return Promise.reject(new Error('Unexpected URL '+url));
  };
  const window={MLSExamCore:core,confirm:()=>true};
  const localStorage={getItem:()=>null,setItem:()=>{}};
  vm.runInNewContext(source,{document,window,localStorage,fetch,Option,console,URL,TextDecoder,File,Array,Set,Map,Promise,setTimeout},{timeout:5000});
  return {elements,get:id=>elements.get(id)};
}
const settled=()=>new Promise(resolve=>setImmediate(resolve));
test('Executable smoke test: indexed years, selected session and all six PDF rows load',async()=>{
  const x=environment();await settled();
  assert.equal(x.get('exam-year-tabs').children.length,2);
  assert.equal(x.get('exam-session-tabs').children.length,2);
  assert.equal(x.get('exam-results').children.length,6);
  assert.match(x.get('exam-match-count').textContent,/6 \/ 6 科/);
  const row=x.get('exam-results').children[0];
  assert.ok(row.children.some(c=>c.children?.some(n=>String(n.href||'').includes('moex.gov.tw'))),'No official PDF buttons');
  assert.match(x.get('exam-result-title').textContent,/115 年第二次/);
});
test('Executable smoke test: switch to historical year then the first session',async()=>{
  const x=environment();await settled();
  x.get('exam-year-tabs').children[1].click();
  assert.match(x.get('exam-result-title').textContent,/114 年第二次/);
  x.get('exam-session-tabs').children[0].click();
  assert.match(x.get('exam-result-title').textContent,/114 年第一次/);
  assert.equal(x.get('exam-results').children.length,6);
});
test('Executable smoke test: subject-first mode lists archived sessions',async()=>{
  const x=environment();await settled();
  x.get('exam-mode-subject').click();
  assert.equal(x.get('exam-subject-view').hidden,false);
  assert.equal(x.get('exam-year-view').hidden,true);
  x.get('exam-subject-tabs').children[3].click();
  assert.match(x.get('exam-result-title').textContent,/臨床微生物學/);
  assert.equal(x.get('exam-results').children.length,4);
});
test('Executable smoke test: keyword search does not falsely label the other five subjects missing',async()=>{
  const x=environment();await settled();
  x.get('exam-keyword').value='微生物';
  x.get('exam-keyword').input();
  assert.equal(x.get('exam-results').children.length,1);
  assert.match(x.get('exam-match-count').textContent,/符合關鍵字的 1 科/);
  x.get('exam-reset').click();
  assert.equal(x.get('exam-results').children.length,6);
});
test('Executable smoke test: original quizzes initialize correctly when nested in optional details',async()=>{
  const x=environment();await settled();
  assert.equal(x.get('practice-subject').children.length,7,'Six subject choices plus all-subject option');
  assert.equal(x.get('practice-start').disabled,false);
  x.get('practice-start').click();
  assert.ok(x.get('practice-question').children.length>=3,'Practice question was not rendered');
});
test('Latest official metadata includes two exam sessions per year but no invented other years',()=>{
  const items=official.entries;
  assert.equal(items.length,24);
  for(const year of [114,115])for(const session of ['第一次','第二次']){
    const cohort=items.filter(x=>x.year===year&&x.exam.includes(session));
    assert.equal(cohort.length,6,year+' '+session);
  }
  for(const item of items){
    for(const key of ['question','answer','correction'])if(item[key]){
      const u=new URL(item[key]);assert.equal(u.protocol,'https:');
      assert.ok(u.hostname.endsWith('moex.gov.tw'));
    }
  }
});

test('Executable smoke test: selecting official CSV displays success and jumps to the added year',async()=>{
 const x=environment();await settled();
 const url='https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=308&code=113020&q=1&s=0501&t=Q';
 const csv='考試年度,考試名稱,類科組別,節次,科目全名,試題型態,試題網址,測驗式試題答案網址,備註\\n'
 +'113,113年第一次專技高考,高等考試_醫事檢驗師,一,臨床血液學與血庫學,測驗,'
 +url+','+url.replace('t=Q','t=S')+',\\n';
 const bytes=new TextEncoder().encode(csv);
 const file={name:'moex.csv',size:bytes.length,slice:(from,to)=>({
  arrayBuffer:async()=>bytes.slice(from,to).buffer
 })};
 const picker=x.get('exam-import');
 picker.listeners.change({target:{files:[file]}});
 await new Promise(resolve=>setTimeout(resolve,25));
 assert.match(x.get('exam-import-status').textContent,/匯入成功：新增 1 份/);
 assert.equal(x.get('exam-import-view').hidden,false);
 assert.match(x.get('exam-result-title').textContent,/113 年第一次/);
 assert.equal(x.get('exam-year-tabs').children.length,3);
});
test('Executable smoke test: invalid CSV produces a visible local error',async()=>{
 const x=environment();await settled();
 const bytes=new TextEncoder().encode('wrong,format\\nabc,123\\n');
 const file={name:'wrong.csv',size:bytes.length,slice:(from,to)=>({
  arrayBuffer:async()=>bytes.slice(from,to).buffer
 })};
 x.get('exam-import').listeners.change({target:{files:[file]}});
 await new Promise(resolve=>setTimeout(resolve,25));
 assert.match(x.get('exam-import-status').textContent,/匯入失敗/);
 assert.equal(x.get('exam-import-view').hidden,true);
});
