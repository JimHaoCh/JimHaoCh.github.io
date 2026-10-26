const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const html=p=>fs.readFileSync(path.join(root,p),'utf8');
const engine=require('../assets/js/biochemical-engine.js');
const assays=data('assets/data/biochemical-tests.json').tests;
const organisms=data('assets/data/biochemical-organisms.json').organisms;
const cases=data('assets/data/biochemical-cases.json').cases;
const assess=o=>engine.analyze(o,organisms);
test('Ten distinct educational reference organisms and 14 documented test types',()=>{
  assert.equal(organisms.length,10);assert.equal(assays.length,14);
  assert.equal(new Set(organisms.map(x=>x.id)).size,10);
  assert.equal(new Set(assays.map(x=>x.id)).size,14);
  for(const item of organisms)for(const key of ['id','name','name_zh','note_zh','note_en','profile'])assert.ok(item[key],item.id+' '+key);
});
test('Every profile value is a supported categorical, binary or variable observation',()=>{
 const map=new Map(assays.map(t=>[t.id,t]));
 for(const organism of organisms){
   for(const [key,value] of Object.entries(organism.profile)){
     const t=map.get(key);assert.ok(t,'Undefined test '+key);
     const valid=t.kind==='binary'?['+','-','v']:t.kind==='shape'?['coccus','rod','v']:['clusters','chains','single','v'];
     assert.ok(valid.includes(value),'Bad profile '+organism.id+' '+key+' '+value);
   }
 }
});
test('Gram-positive clustered cocci separate by coagulase in the teaching panel',()=>{
 const r=assess({gram:'+',shape:'coccus',arrangement:'clusters',catalase:'+'});
 assert.deepEqual(r.compatible.map(x=>x.id).sort(),['saureus','sepidermidis']);
 assert.equal(engine.suggest({gram:'+',shape:'coccus',arrangement:'clusters',catalase:'+'},organisms,assays).id,'coagulase');
 const rr=assess({gram:'+',shape:'coccus',arrangement:'clusters',catalase:'+',coagulase:'+'});
 assert.deepEqual(rr.compatible.map(x=>x.id),['saureus']);
});
test('Cocci in chains can be separated by bile esculin when catalase− and PYR+',()=>{
 const observations={gram:'+',shape:'coccus',arrangement:'chains',catalase:'-',pyr:'+'};
 const r=assess(observations);
 assert.deepEqual(r.compatible.map(x=>x.id).sort(),['efaecalis','spyogenes']);
 assert.equal(engine.suggest(observations,organisms,assays).id,'bile_esculin');
});
test('Typical E. coli and Klebsiella synthetic biochemical differences',()=>{
 const e=assess({gram:'-',shape:'rod',oxidase:'-',lactose:'+',indole:'+',citrate:'-'});
 assert.ok(e.compatible.some(x=>x.id==='ecoli'));
 assert.ok(!e.compatible.some(x=>x.id==='kpneumoniae'));
 const k=assess({gram:'-',shape:'rod',oxidase:'-',lactose:'+',motility:'-',indole:'-'});
 assert.ok(k.compatible.some(x=>x.id==='kpneumoniae'));
 assert.ok(!k.compatible.some(x=>x.id==='ecoli'));
});
test('Variable reactions never cause a hard contradiction',()=>{
 for(const answer of ['+','-']){
   const r=assess({gram:'-',shape:'rod',urease:answer});
   const kleb=r.ranked.find(x=>x.id==='kpneumoniae');
   assert.ok(kleb.compatible);
   assert.ok(kleb.variable.includes('urease'));
 }
});
test('No candidate is misrepresented as a diagnosis when observations conflict',()=>{
 const r=assess({gram:'+',shape:'rod'});
 assert.equal(r.compatible.length,0);
 assert.equal(engine.suggest({gram:'+',shape:'rod'},organisms,assays),null);
 assert.ok(r.ranked.every(x=>x.contradicted.length>0));
});
test('Eight entirely synthetic cases have consistent target phenotypes',()=>{
 assert.equal(cases.length,8);
 for(const item of cases){
  const target=organisms.find(x=>x.id===item.target);
  assert.ok(target,item.id+' target');
  const profile=target.profile;
  for(const [key,val] of Object.entries(item.initial)){
    assert.equal(profile[key],val,item.id+': '+key);
  }
  const r=engine.caseResult(item.target,item,item.initial,organisms);
  assert.ok(r.correct);
  assert.equal(r.contradictions.length,0);
 }
});
test('Wrong synthetic-case guess is correctly flagged with grounded target',()=>{
 const caseData=cases[0];
 const r=engine.caseResult('ecoli',caseData,caseData.initial,organisms);
 assert.equal(r.correct,false);
 assert.equal(r.targetId,'saureus');
});
test('The standalone page loads original code locally and never submits specimen data',()=>{
 const page=html('web-biochemical/index.html');
 for(const rel of ['biochemical-engine.js','biochemical-app.js','biochemical.css','bio-case-select','bio-candidates','bio-reveal','bio-check-guess']){
  assert.ok(page.includes(rel),rel);
 }
 const app=html('assets/js/biochemical-app.js');
 assert.ok(app.includes("Promise.all("));
 assert.ok(!app.includes("XMLHttpRequest"));
 assert.ok(!app.includes("POST"));
 assert.ok(!app.includes("localStorage"));
});
test('Navigation lists the tool and preserves CFU, AST, Gram and existing external links',()=>{
 const tools=data('_data/online_tools.json');
 const diag=tools.filter(x=>x.function_group==='diagnostics');
 for(const slug of ['web-biochemical','web-cfu-lite','web-ast','web-gram-stain','web-gel-external','web-lfa-external'])
  assert.ok(diag.some(x=>x.slug===slug),slug);
 assert.ok(html('sitemap.xml').includes('web-biochemical/'));
});
test('All tool facts are original bilingual teaching copy rather than copying a third-party dataset',()=>{
 const page=html('web-biochemical/index.html');
 assert.ok(page.includes('本工具另行撰寫程式與虛構案例'));
 assert.ok(page.includes('非臨床'));
 assert.ok(page.includes('10 個範例菌'));
 assert.ok(organisms.every(o=>o.note_zh&&o.note_en));
});
