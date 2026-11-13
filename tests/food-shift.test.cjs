const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const M=require('../assets/js/food-shift-model.js');
const {validateInput,Coordinator}=require('../assets/js/food-shift-ui.js');
const config=id=>M.configs().find(c=>c.id===id);
const job=(arrival,kind,phase=0)=>({arrival,kind,phase,duration:kind?10:5});

test('three demand stories produce three different cost-minimal feasible strategies',()=>{
 for(const [key,id,cost] of [['shift','1-1-1',360],['steady','2-2-0',400],['small','0-0-1',160]]){
  const r=M.run(M.PRESETS[key]);assert.equal(r.recommended.config.id,id);assert.equal(r.recommended.cost,cost);assert.equal(r.days,240);
  assert.ok(r.recommended.pass);assert.equal(r.results.filter(x=>x.pass&&x.cost<cost).length,0);
  assert.equal(r.candidateCount,59);
  if(key==='shift'){
   assert.ok(r.recommended.flex[0][0]>r.recommended.flex[0][1]);assert.ok(r.recommended.flex[2][1]>r.recommended.flex[2][0]);
   const twoFlex=r.results.find(x=>x.config.id==='0-0-2');assert.ok(twoFlex.aggregate.every(s=>s.p90<=25));assert.equal(twoFlex.pass,false,'whole-day P90 must not hide a failed breakfast group');
  }
 }
});
test('raising only the flexible equipment price changes the shift story recommendation',()=>{
 const r=M.run({...M.DEFAULTS,costFlex:300},{days:120});assert.equal(r.recommended.config.group,'dedicated');assert.equal(r.recommended.cost,400);
});
test('the same arrivals are reproducible and stay inside their own demand periods',()=>{
 const days=M.makeDays(M.DEFAULTS,8);assert.deepEqual(days,M.makeDays(M.DEFAULTS,8));assert.notDeepEqual(days,M.makeDays(M.DEFAULTS,8,17));
 for(const day of days){let last=-1;for(const j of day){assert.ok(j.arrival>=last);last=j.arrival;const p=M.PERIODS[j.phase];assert.ok(j.arrival>=p.start&&j.arrival<p.end);assert.equal(j.duration,j.kind?10:5);}}
});
test('hand-calculated FCFS includes each mode change and never overlaps one machine',()=>{
 const p={...M.DEFAULTS,switchMinutes:2},d=M.simulateDay(p,config('0-0-1'),[job(0,0),job(1,1),job(2,0)]);
 assert.deepEqual(d.records.map(r=>[r.start,r.cookStart,r.end]),[[0,0,5],[5,7,17],[17,19,24]]);
 assert.equal(d.records.filter(r=>r.changed).length,2);assert.equal(d.lastFinish,24);
 const s=M.evaluate(p,config('0-0-1'),[[job(0,0),job(1,1),job(2,0)]]);assert.equal(s.setup,4);assert.equal(s.switches,2);
});
test('backlog crosses period boundaries and closing time without resetting the queue',()=>{
 const d=M.simulateDay(M.DEFAULTS,config('0-0-1'),[job(179,1),job(180,0,1),job(419,1,2)]);
 assert.deepEqual(d.records.map(r=>[r.start,r.end]),[[179,189],[189,194],[419,429]]);
 assert.deepEqual(d.backlog,[2-1,0,1]);assert.equal(d.lastFinish,429);
});
test('dedicated equipment takes compatible work before flexible equipment serves overflow',()=>{
 const d=M.simulateDay(M.DEFAULTS,config('1-1-1'),[job(0,0),job(0,1),job(0,0)]);
 assert.deepEqual(d.records.map(r=>[r.type,r.kind,r.start]),[[0,0,0],[1,1,0],[2,0,0]]);
});
test('finite peak overload creates long finite waits, not a fictitious infinite steady state',()=>{
 const r=M.evaluate(M.DEFAULTS,config('1-1-0'),M.makeDays(M.DEFAULTS,20));assert.equal(r.pass,false);assert.ok(r.stats[0][0].p90>25);assert.ok(Number.isFinite(r.stats[0][0].p90));assert.ok(r.backlog[0]>0);
});
test('zero demand does not recommend a purchase and unsupported foods cannot pass',()=>{
 const p={...M.DEFAULTS,morningA:0,morningB:0,bridgeA:0,bridgeB:0,lunchA:0,lunchB:0},r=M.run(p,{days:2});assert.equal(r.recommended,null);assert.equal(r.orders,0);assert.ok(r.results.every(x=>!x.pass&&x.stats.flat().every(s=>s===null)));
 const unsupported=M.evaluate(M.DEFAULTS,config('0-1-0'),[[job(0,0),job(1,1)]]);assert.equal(unsupported.unserved,1);assert.equal(unsupported.pass,false);assert.equal(unsupported.stats[0][0],null);
});
test('every schedule conserves order counts, cooking time and actual capacity',()=>{
 const p={...M.DEFAULTS,switchMinutes:3},day=M.makeDays(p,1)[0];
 for(const c of M.configs()){
  const d=M.simulateDay(p,c,day),ends=new Map();assert.equal(d.records.length+d.unserved.length,day.length);
  for(const r of d.records){assert.ok(r.start>=r.arrival);assert.ok(r.start>=(ends.get(r.lane)||0));assert.ok(Math.abs(r.end-r.cookStart-r.duration)<1e-8);if(r.type<2)assert.equal(r.type,r.kind);ends.set(r.lane,r.end);}
  for(const u of d.utilization){assert.ok(u.fraction>=0&&u.fraction<=1+1e-8);assert.ok(u.flex.reduce((a,b)=>a+b,0)<=1+1e-8);}
 }
});
test('invalid values, blank values and mismatched slider increments are rejected',()=>{
 for(const v of ['', ' ', '-1','Infinity','NaN','0.1','30.5'])assert.equal(validateInput('morningA',v).ok,false,v);
 for(const v of ['0','.5','18','30'])assert.equal(validateInput('morningA',v).ok,true,v);
 assert.equal(validateInput('switchMinutes','2.5').ok,false);assert.throws(()=>M.run({...M.DEFAULTS,lunchB:-1}));assert.throws(()=>M.run(M.DEFAULTS,{days:0}));assert.throws(()=>M.checkConfig({a:3,b:3,f:1}));
});
test('invalidating or superseding a request cannot display its stale result',async()=>{
 const resolvers=[],events=[],gate=new Coordinator(()=>new Promise(resolve=>resolvers.push(resolve)),e=>events.push(e));
 const first=gate.request(M.DEFAULTS);gate.invalidate('invalid');resolvers[0]({old:true});await first;assert.equal(gate.current,null);assert.equal(events.at(-1).status,'invalid');
 const second=gate.request(M.DEFAULTS),third=gate.request({...M.DEFAULTS,morningA:20});resolvers[2]({latest:true});await third;resolvers[1]({late:true});await second;assert.deepEqual(gate.current.bundle,{latest:true});assert.equal(gate.current.params.morningA,20);assert.ok(Object.isFrozen(gate.current.params));
});
test('worker imports the model and preserves the request revision',()=>{
 const context={self:null},messages=[];context.self=context;context.postMessage=m=>messages.push(m);context.importScripts=()=>vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/food-shift-model.js'),'utf8'),context);vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/food-shift-worker.js'),'utf8'),context);
 const p={...M.DEFAULTS,morningA:0,morningB:0,bridgeA:0,bridgeB:0,lunchA:0,lunchB:0};context.onmessage({data:{revision:19,params:p}});assert.equal(messages[0].revision,19);assert.equal(messages[0].bundle.recommended,null);assert.equal(messages[0].error,undefined);
});
test('food page explicitly includes the finite-day story, hybrids and switch time without loading the clinical controller',()=>{
 const text=fs.readFileSync(path.join(__dirname,'../resources/equipment-queue.html'),'utf8');for(const marker of ['07:00','14:00','混合配置','模式切換','240','fs-story-title','fs-strategies','fs-allocation','food-shift-ui.js'])assert.ok(text.includes(marker),marker);assert.equal(text.includes('src="/assets/js/equipment-queue-ui.js'),false);
});
