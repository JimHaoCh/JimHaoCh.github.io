const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const engine=require('../assets/js/mic-checkerboard-core.js');
const eq=(x,y,tol=1e-9)=>assert.ok(Math.abs(x-y)<tol,'Expected '+x+' ~ '+y);
test('96 wells, strict increasing concentrations and a visible-growth control',()=>{
 assert.equal(engine.A.length,8);assert.equal(engine.B.length,12);
 for(const name of ['synergy','indifferent','antagonism','blank']){
  const grid=engine.scenario(name);assert.equal(grid.length,8);
  assert.ok(grid.every(r=>r.length===12));
  assert.equal(grid[0][0],'growth');
 }
});
test('single-agent axes use lowest inhibited tested concentrations',()=>{
 for(const name of ['synergy','indifferent','antagonism']){
  const r=engine.calculate(engine.scenario(name));
  assert.equal(r.micA.type,'measured');
  assert.equal(r.micB.type,'measured');
  eq(r.micA.value,4);eq(r.micB.value,8);
  assert.equal(r.unknownCount,0);
 }
});
test('synergy synthetic example returns minimum FICI 0.5 from genuine combination well',()=>{
 const r=engine.calculate(engine.scenario('synergy'));
 eq(r.best.fici,0.5);
 assert.ok(r.best.concA>0&&r.best.concB>0);
 assert.equal(r.classification.key,'synergy');
 assert.equal(r.canReport,true);
});
test('non-interacting synthetic example has minimal FICI 1',()=>{
 const r=engine.calculate(engine.scenario('indifferent'));
 eq(r.best.fici,1);
 assert.equal(r.classification.key,'indifferent');
 assert.equal(r.canReport,true);
});
test('antagonistic synthetic example has FICI >4 with both agents present',()=>{
 const r=engine.calculate(engine.scenario('antagonism'));
 assert.ok(r.best.fici>4);
 eq(r.best.fici,6);
 assert.equal(r.classification.key,'antagonism');
});
test('standard class boundaries are documented and finite',()=>{
 assert.equal(engine.classify(0.5).key,'synergy');
 assert.equal(engine.classify(0.50001).key,'indifferent');
 assert.equal(engine.classify(4).key,'indifferent');
 assert.equal(engine.classify(4.1).key,'antagonism');
 assert.equal(engine.classify(0),null);
});
test('blank teaching plate never pretends to have usable MIC and FICI',()=>{
 const r=engine.calculate(engine.scenario('blank'));
 assert.equal(r.micA.type,'insufficient');
 assert.equal(r.micB.type,'insufficient');
 assert.equal(r.best,null);
 assert.equal(r.unknownCount,95);
});
test('invalid growth control suppresses all numeric MIC and FICI reporting',()=>{
 const g=engine.scenario('synergy');g[0][0]='inhibited';
 const r=engine.calculate(g);
 assert.equal(r.controlValid,false);assert.equal(r.best,null);
 assert.equal(r.micA.type,'invalid');
});
test('ambiguous and censored single-agent MIC do not silently become numeric',()=>{
 const g=engine.scenario('synergy');
 g[5][0]='unknown';
 let r=engine.calculate(g);
 assert.equal(r.micA.type,'insufficient');assert.equal(r.best,null);
 const c=engine.scenario('synergy');
 c.forEach(row=>row[0]='growth');
 r=engine.calculate(c);
 assert.equal(r.micA.type,'above');assert.equal(r.best,null);
 eq(r.micA.bound,8);
});
test('non-monotonic single agent result blocks FICI',()=>{
 const g=engine.scenario('synergy');g[7][0]='growth';
 const r=engine.calculate(g);
 assert.equal(r.micA.type,'invalid');assert.equal(r.best,null);
});
test('incomplete combo wells mark a numeric minimum as provisional',()=>{
 const g=engine.scenario('synergy');g[1][2]='unknown';
 const r=engine.calculate(g);
 assert.ok(r.best);
 assert.equal(r.partial,true);assert.equal(r.canReport,false);
});
test('reject corrupt plates and invalid zero-based axes',()=>{
 const grid=engine.scenario('synergy');grid[3][2]='garbage';
 assert.throws(()=>engine.calculate(grid),RangeError);
 assert.throws(()=>engine.calculate(engine.scenario('synergy'),[1,2,3],engine.B),RangeError);
 assert.throws(()=>engine.calculate(engine.scenario('synergy'),[0,1,1],engine.B),RangeError);
});
test('independent viable-count exercise correctly calculates MBC A and B',()=>{
 const a=engine.mbcScenario('A');
 const b=engine.mbcScenario('B');
 const resultA=engine.calculateMBC(a.doses,a.cfu,1000000);
 const resultB=engine.calculateMBC(b.doses,b.cfu,1000000);
 assert.equal(resultA.type,'measured');eq(resultA.value,4);
 assert.equal(resultB.type,'measured');eq(resultB.value,16);
 eq(resultA.threshold,1000);eq(resultB.threshold,1000);
});
test('MBC is censored or incomplete rather than inferred from absent bactericidal evidence',()=>{
 const a=engine.mbcScenario('A');
 let r=engine.calculateMBC(a.doses,a.doses.map(()=>100000),1000000);
 assert.equal(r.type,'above');eq(r.bound,32);
 const interrupted=a.cfu.slice();interrupted[2]=null;
 r=engine.calculateMBC(a.doses,interrupted,1000000);
 assert.equal(r.type,'insufficient');
 assert.throws(()=>engine.calculateMBC(a.doses,a.cfu,0),RangeError);
 assert.throws(()=>engine.calculateMBC(a.doses,[-3,...a.cfu.slice(1)],1000000),RangeError);
});
test('new local teaching UI, source articles and legacy diagnostics remain linked',()=>{
 const page=read('web-mic-checkerboard/index.html');
 const controls=['mic-plate','mic-mbc-rows','mic-hide-answer','mic-reveal','mic-mbc-baseline','mic-scenario','mic-export'];
 for(const x of controls)assert.ok(page.includes('id="'+x+'"'),x);
 assert.ok(page.includes('mic-checkerboard-app.js'));
 assert.ok(page.includes('mic-checkerboard-core.js'));
 assert.ok(page.includes('10.1093/jac/dkae233'));
 assert.ok(page.includes('存活菌落數資料'));
 const tools=JSON.parse(read('_data/online_tools.json'));
 const diag=tools.filter(x=>x.function_group==='diagnostics');
 for(const slug of ['web-cfu-lite','web-ast','web-gram-stain','web-biochemical','web-mic-checkerboard','web-gel-external','web-lfa-external']){
  assert.ok(diag.some(t=>t.slug===slug),'missing '+slug);
 }
 assert.ok(read('sitemap.xml').includes('https://jimhaoch.github.io/web-mic-checkerboard/'));
 assert.ok(read('resources/diagnostics.html').includes('MIC／Checkerboard'));
});
test('no patient data upload, hidden-answer mode and CSV export are client-side',()=>{
 const src=read('assets/js/mic-checkerboard-app.js');
 assert.ok(src.includes('mic-hide-answer'));
 assert.ok(src.includes('mic-reveal'));
 assert.ok(src.includes('new Blob('));
 assert.ok(!src.includes('fetch('));
 assert.ok(!src.includes('XMLHttpRequest'));
 assert.ok(!src.includes('localStorage'));
});
