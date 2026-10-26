/* Educational-only MIC / FICI / MBC arithmetic. Synthetic data and no remote services. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MICCheckerboard=factory===undefined?null:api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const A=Object.freeze([0,0.125,0.25,0.5,1,2,4,8]);
  const B=Object.freeze([0,0.03125,0.0625,0.125,0.25,0.5,1,2,4,8,16,32]);
  const LABELS=Object.freeze({growth:'生長 / Growth',inhibited:'未見生長 / No visible growth',unknown:'未判讀 / Unread'});
  const STATUS=['growth','inhibited','unknown'];
  function validate(concs){if(!Array.isArray(concs)||concs.length<3||concs[0]!==0||concs.some((v,i)=>!Number.isFinite(v)||v<0||(i>0&&v<=concs[i-1])))throw new RangeError('Concentrations must start at zero and increase strictly');}
  function validateGrid(grid,a=A,b=B){
    validate(a);validate(b);
    if(!Array.isArray(grid)||grid.length!==a.length||grid.some(row=>!Array.isArray(row)||row.length!==b.length||row.some(v=>!STATUS.includes(v))))throw new RangeError('Expected a rectangular growth, inhibited or unknown matrix');
  }
  function getMIC(states,doses){
    if(states.length!==doses.length)throw new RangeError('Axis length mismatch');
    if(states[0]!=='growth')return{type:'invalid',reason:'Control without drug A/B must show growth'};
    const first=states.findIndex((s,i)=>i>0&&s==='inhibited');
    if(first<0){
      return states.slice(1).every(s=>s==='growth')
        ? {type:'above',bound:doses[doses.length-1]}
        : {type:'insufficient',reason:'Some single-drug wells are unread'};
    }
    if(states.slice(1,first).some(s=>s!=='growth'))return{type:'insufficient',reason:'Lower-dose single-drug well is unread'};
    if(states.slice(first+1).some(s=>s==='growth'))return{type:'invalid',reason:'Growth reappears at a higher dose (non-monotonic)'};
    if(states.slice(first+1).some(s=>s==='unknown'))return{type:'insufficient',reason:'Higher-dose single-drug well is unread'};
    return{type:'measured',value:doses[first],index:first};
  }
  function classify(fici){
    if(!Number.isFinite(fici)||fici<=0)return null;
    if(fici<=0.5+1e-10)return{key:'synergy',zh:'協同作用（教學門檻）',en:'Synergy (teaching convention)'};
    if(fici<=4+1e-10)return{key:'indifferent',zh:'無明確交互作用（教學門檻）',en:'Indifference / no defined interaction'};
    return{key:'antagonism',zh:'拮抗作用（教學門檻）',en:'Antagonism (teaching convention)'};
  }
  function calculate(grid,a=A,b=B){
    validateGrid(grid,a,b);
    const controlValid=grid[0][0]==='growth';
    const micA=getMIC(grid.map(row=>row[0]),a);
    const micB=getMIC(grid[0],b);
    const measured=controlValid&&micA.type==='measured'&&micB.type==='measured';
    const candidates=[];
    if(measured)for(let i=1;i<a.length;i++)for(let j=1;j<b.length;j++){
      if(grid[i][j]!=='inhibited')continue;
      const ficA=a[i]/micA.value,ficB=b[j]/micB.value;
      candidates.push({row:i,col:j,well:String.fromCharCode(65+i)+(j+1),concA:a[i],concB:b[j],ficA,ficB,fici:ficA+ficB});
    }
    candidates.sort((x,y)=>x.fici-y.fici||x.concA-y.concA||x.concB-y.concB);
    const best=candidates[0]||null;
    const unknownCount=grid.flat().filter(v=>v==='unknown').length;
    return{
      controlValid,micA,micB,best,candidatesCount:candidates.length,unknownCount,
      classification:best?classify(best.fici):null,
      canReport:!!best&&!unknownCount,partial:!!best&&unknownCount>0,
      reason:!controlValid?'Growth control failed; cannot interpret this plate':!measured?'Both single-drug MICs must be determined from axis wells':!best?'No inhibited combination wells with both agents present':unknownCount?'Unread combination wells: the displayed lowest observed FICI may change':null
    };
  }
  function scenario(name){
    if(!['synergy','indifferent','antagonism','blank'].includes(name))throw new RangeError('Unknown teaching scenario');
    return A.map((a,i)=>B.map((b,j)=>{
      if(i===0&&j===0)return'growth';
      if(name==='blank')return'unknown';
      let noGrowth;
      if(name==='synergy')noGrowth=a>=4||b>=8||(a>0&&b>0&&a>=1&&b>=2);
      else if(name==='indifferent')noGrowth=a/4+b/8>=1;
      else noGrowth=a===0?b>=8:b===0?a>=4:(a>=8&&b>=32);
      return noGrowth?'inhibited':'growth';
    }));
  }
  function calculateMBC(doses,viable,baseline){
    validate(doses);
    if(!Array.isArray(viable)||viable.length!==doses.length)throw new RangeError('MBC dose and viability lengths differ');
    if(!Number.isFinite(baseline)||baseline<=0)throw new RangeError('MBC baseline must be positive');
    for(const x of viable)if(x!=null&&(!Number.isFinite(x)||x<0))throw new RangeError('Viable counts must be non-negative');
    const threshold=baseline/1000;
    const first=viable.findIndex((v,i)=>i>0&&v!==null&&v<=threshold);
    if(first<0)return{type:viable.slice(1).some(v=>v===null)?'insufficient':'above',threshold,bound:doses[doses.length-1]};
    if(viable.slice(1,first).some(v=>v===null))return{type:'insufficient',threshold};
    if(viable.slice(first+1).some(v=>v!==null&&v>threshold))return{type:'invalid',threshold,reason:'Higher doses show more viable CFU than the MBC criterion'};
    return{type:'measured',value:doses[first],threshold,index:first};
  }
  function mbcScenario(agent){
    if(agent==='A')return{doses:[0,0.5,1,2,4,8,16,32],cfu:[1100000,500000,70000,20000,800,25,0,0]};
    if(agent==='B')return{doses:[0,1,2,4,8,16,32,64],cfu:[1100000,800000,300000,12000,7000,700,80,0]};
    throw new RangeError('Unknown synthetic MBC drug');
  }
  return Object.freeze({A,B,LABELS,calculate,getMIC,classify,scenario,calculateMBC,mbcScenario,validateGrid});
});
