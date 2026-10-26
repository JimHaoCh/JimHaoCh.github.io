/* Original educational biochemistry engine; no third-party logic, remote calls or patient data. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BiochemicalTeachingEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TEST_ORDER=['gram','shape','arrangement','catalase','oxidase','coagulase','indole','urease','lactose','citrate','motility','h2s','bile_esculin','pyr'];
  function analyze(observations,organisms){
    if(!observations||typeof observations!=='object'||!Array.isArray(organisms))throw new TypeError('Invalid observations/reference panel');
    const observed=Object.entries(observations).filter(([k,v])=>v!==''&&v!=null&&v!=='unknown');
    const ranked=organisms.map(org=>{
      const matched=[],contradicted=[],variable=[],unspecified=[];
      for(const [id,value] of observed){
        const expected=org.profile?.[id];
        if(expected==null)unspecified.push(id);
        else if(expected==='v')variable.push(id);
        else if(expected===value)matched.push(id);
        else contradicted.push(id);
      }
      return {id:org.id,name:org.name,name_zh:org.name_zh,matched,contradicted,variable,unspecified,
        compatible:contradicted.length===0,profile:org.profile,note_zh:org.note_zh,note_en:org.note_en};
    });
    ranked.sort((a,b)=>a.contradicted.length-b.contradicted.length||b.matched.length-a.matched.length||a.name.localeCompare(b.name));
    return {observedCount:observed.length,compatible:ranked.filter(r=>r.compatible),ranked};
  }
  function suggest(observations,organisms,tests){
    const assessment=analyze(observations,organisms);
    const compatible=assessment.compatible;
    if(compatible.length<=1)return null;
    const candidates=[];
    for(const test of tests){
      if(test.section!=='biochem'||observations[test.id])continue;
      let positive=0,negative=0;
      for(const species of compatible){
        const v=species.profile[test.id];
        if(v==='+')positive++;else if(v==='-')negative++;
      }
      const count=positive+negative;
      if(!positive||!negative||count<2)continue;
      const balance=4*positive*negative/(count*count);
      const coverage=count/compatible.length;
      const score=balance*coverage;
      candidates.push({id:test.id,zh:test.zh,en:test.en,score,positive,negative,coverage,
        priority:TEST_ORDER.indexOf(test.id)});
    }
    candidates.sort((a,b)=>b.score-a.score||a.priority-b.priority||a.id.localeCompare(b.id));
    return candidates[0]||null;
  }
  function caseResult(guessId,caseData,observations,organisms){
    const target=organisms.find(x=>x.id===caseData.target);
    if(!target)throw new RangeError('Unknown case target');
    const assessment=analyze(observations,organisms);
    const targetMatch=assessment.ranked.find(x=>x.id===target.id);
    return {correct:guessId===target.id,targetId:target.id,targetName:target.name,
      note_zh:target.note_zh,note_en:target.note_en,contradictions:targetMatch.contradicted,
      variable:targetMatch.variable};
  }
  return Object.freeze({analyze,suggest,caseResult,TEST_ORDER});
});
