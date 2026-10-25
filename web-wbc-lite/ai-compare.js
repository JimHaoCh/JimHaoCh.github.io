/* Web-WBC Lite v0.2: experimental ML opinions, never clinical predictions. */
(function(){
"use strict";
const $=x=>document.getElementById(x),AI=window.WebWBCAI;
const LABELS={neutrophil:"NEU · 嗜中性球",lymphocyte:"LYM · 淋巴球",monocyte:"MON · 單核球",eosinophil:"EOS · 嗜酸性球",basophil:"BAS · 嗜鹼性球"};
const API="https://datasets-server.huggingface.co/rows",DATASET="nirschl-lab/acevedo_et_al_2020";
let model=null,mode="off",busy=false,revision=0,predictions=[];
const setup=document.createElement("section");
setup.className="ai-setup";
setup.innerHTML='<div class="ai-heading"><strong>AI 建議比較 · Experimental ML</strong><span class="chip">v0.2</span></div>'
 +'<p class="tip">學生先判讀，之後再看模型與專家標籤。WBC-NCA 13 類 AML 權重的授權和類別相容性仍待確認，本版本以輕量 kNN 影像特徵分類器做實際的教學用推論。</p>'
 +'<div class="ai-buttons"><button id="aiDemo" type="button" class="secondary">離線示意圖 AI</button><button id="aiReal" type="button" class="secondary">準備 PBC 真實影像 AI</button><button id="aiOff" type="button" class="secondary">停用 AI</button></div>'
 +'<div class="ai-status" id="aiSetupStatus" role="status" aria-live="polite">AI 尚未啟用。可以直接開始原本的分類練習。</div>';
$("quizSetup").append(setup);
const compare=document.createElement("section");compare.id="aiCompare";compare.className="ai-compare hidden";
compare.setAttribute("aria-live","polite");
compare.innerHTML='<div class="ai-heading"><strong>學生判讀 vs AI 建議 vs 專家標籤</strong><span class="chip" id="aiModelTag">ML</span></div><div id="aiPredictions" class="ai-predictions"></div><p class="tip">kNN 為實驗性特徵模型；鄰近樣本票權重不是經校正的信心分數。這個模型不具臨床適用性。</p>';
$("feedback").insertAdjacentElement("afterend",compare);
const report=document.createElement("section");report.className="ai-summary";
report.innerHTML='<h4>AI 教學比較統計</h4><div id="aiSummaryText" class="ai-stats">本次尚未完成 AI 推論。</div><p class="tip">這是本次練習的模型比較紀錄，不是獨立驗證或臨床診斷準確率。</p>';
$("summaryStats").insertAdjacentElement("afterend",report);
function say(s){$("aiSetupStatus").textContent=s;}
function lock(v){busy=v;["aiDemo","aiReal","aiOff"].forEach(id=>$(id).disabled=v);}
function image(src){
 return new Promise((resolve,reject)=>{
  const img=new Image();img.crossOrigin="anonymous";let done=false;
  const timer=setTimeout(()=>finish(false,"影像讀取逾時"),15000);
  function finish(ok,e){if(done)return;done=true;clearTimeout(timer);ok?resolve(e):reject(Error(e));}
  img.onload=()=>finish(true,img);img.onerror=()=>finish(false,"遠端影像拒絕跨來源讀取或格式不支援");img.src=src;
 });
}
async function batchFeatures(cells){
 const out=[];let pos=0,finished=0;
 async function worker(){
  while(pos<cells.length){
   const cell=cells[pos++];
   try{const pic=await image(cell.src);out.push({label:cell.key,features:AI.fromCanvas(pic)});}catch(_){}
   finished++;
   if(finished%10===0||finished===cells.length)say("模型特徵處理 "+finished+"/"+cells.length+"，可用 "+out.length+" 張");
  }
 }
 await Promise.all(Array.from({length:Math.min(4,cells.length)},worker));
 return out;
}
async function trainSchematic(){
 const tabs=[...$("learnTypes").querySelectorAll("button")],samples=[];
 for(let i=0;i<5;i++){
  tabs[i].click();
  const pic=await image($("learnImage").src);
  samples.push({label:AI.KEYS[i],features:AI.fromCanvas(pic)});
  for(let j=0;j<6;j++){
   const cv=document.createElement("canvas");cv.width=cv.height=140;
   const ctx=cv.getContext("2d");
   ctx.fillStyle="#f0d7dd";ctx.fillRect(0,0,140,140);
   ctx.drawImage(pic,(j%3-1)*2,(j%3-1)*2,140*(.96+(j%3)*.02),140*(.96+(j%3)*.02));
   samples.push({label:AI.KEYS[i],features:AI.fromCanvas(cv)});
  }
  say("示意圖特徵建立 "+(i+1)+"/5");
 }
 tabs[0].click();return samples;
}
async function trainRows(offset){
 const q=new URLSearchParams({dataset:DATASET,config:"default",split:"train",offset:String(offset),length:"100"});
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),17000);
 try{
  const r=await fetch(API+"?"+q.toString(),{signal:ctrl.signal});
  if(!r.ok)throw Error("Dataset Viewer HTTP "+r.status);
  const json=await r.json();
  return (json.rows||[]).map(x=>{
   const key=String(x.row?.label_name||"").trim().toLowerCase(),src=x.row?.image?.src||x.row?.image?.url;
   return AI.KEYS.includes(key)&&typeof src==="string"?{key,src,id:x.row_idx}:null;
  }).filter(Boolean);
 }finally{clearTimeout(timer);}
}
async function trainPBC(){
 say("取得 PBC train split 索引；考題使用獨立的 test split。");
 const offsets=[0,550,1100,1800,2650,3600,4750,5950,7200,8400,9600,10750,11700];
 const settled=await Promise.allSettled(offsets.map(trainRows));
 const seen=new Set(),by=Object.fromEntries(AI.KEYS.map(k=>[k,[]]));
 for(const item of settled){
  if(item.status!=="fulfilled")continue;
  for(const row of item.value){if(seen.has(row.id))continue;seen.add(row.id);by[row.key].push(row);}
 }
 if(AI.KEYS.some(k=>by[k].length<12))throw Error("五個類別中至少一類訓練影像不足；無法完成模型。");
 const selected=AI.KEYS.flatMap(k=>by[k].slice(0,12));
 say("正在取得 60 張 PBC train split 顯微影像的特徵；首次準備需要網路連線。");
 const data=await batchFeatures(selected);
 if(AI.KEYS.some(k=>data.filter(x=>x.label===k).length<5))
  throw Error("部分圖片主機拒絕 Canvas 讀取（可能為 CORS 問題），已停止模型初始化。");
 return data;
}
async function prepare(kind){
 if(busy)return;lock(true);mode="off";model=null;const seq=++revision;
 try{
  say(kind==="schematic"?"建立離線形態示意圖特徵樣本…":"建立真實 PBC 影像特徵分類器…");
  const data=kind==="schematic"?await trainSchematic():await trainPBC();
  if(seq!==revision)return;
  model=AI.fit(data);mode=kind;
  say("已啟用 "+(kind==="schematic"?"示意圖":"PBC train split")+" 特徵 kNN（"+data.length+" 張訓練影像）。只適用相同來源的題目，未驗證分類準確率。");
 }catch(e){mode="off";model=null;say("無法準備 AI："+e.message+"。一般練習功能不受影響。");}
 finally{lock(false);}
}
$("aiDemo").addEventListener("click",()=>prepare("schematic"));
$("aiReal").addEventListener("click",()=>prepare("pbc"));
$("aiOff").addEventListener("click",()=>{model=null;mode="off";revision++;say("已停用 AI。");});
function show(student,expert,output,tag,error){
 compare.classList.remove("hidden");$("aiModelTag").textContent=tag;
 const div=$("aiPredictions");div.replaceChildren();
 [["學生選擇",LABELS[student]||"—"],["AI 建議",output?LABELS[output.label]:"無法推論"],["專家標籤",LABELS[expert]||"—"]].forEach(([head,content])=>{
  const row=document.createElement("div"),a=document.createElement("span"),b=document.createElement("strong");
  row.className="ai-row";a.textContent=head;b.textContent=content;row.append(a,b);div.append(row);
 });
 const p=document.createElement("p");p.className="ai-votes";
 p.textContent=output?("相近樣本加權票數："+Math.round(output.topVoteShare*100)+"%（非可信度）；學生與 AI："+(student===output.label?"一致":"不同")+"；AI 與專家："+(expert===output.label?"一致":"不同")):(error||"目前沒有 AI 推論結果。");
 div.append(p);
}
async function afterAnswer(e){
 const button=e.target.closest("button[data-answer]");
 if(!button||$("feedback").classList.contains("hidden"))return;
 const chosen=button.dataset.answer,expert=$("answerButtons").querySelector(".right")?.dataset.answer;
 if(!expert)return;
 const source=$("questionSource").textContent.includes("Schematic")?"schematic":"pbc";
 const q=$("questionNumber").textContent,rev=revision;
 if(!model){show(chosen,expert,null,"未啟用","尚未啟用 AI；請在開始練習前準備模型。");return;}
 if(source!==mode){show(chosen,expert,null,"來源不匹配","模型訓練資料與考題來源不同；請選擇相應的 AI 模式。");return;}
 compare.classList.remove("hidden");$("aiPredictions").textContent="模型正從圖片像素進行推論…";
 try{
  const vec=AI.fromCanvas($("questionImage")),pred=AI.infer(model,vec);
  if(q!==$("questionNumber").textContent||rev!==revision)return;
  show(chosen,expert,pred,source==="pbc"?"PBC kNN":"示意圖 kNN");
  predictions.push({question:q,student:chosen,expert,ai:pred.label,domain:mode,vote:pred.topVoteShare});
 }catch(err){if(q===$("questionNumber").textContent)show(chosen,expert,null,"推論失敗",err.message);}
}
$("answerButtons").addEventListener("click",e=>{
 const btn=e.target.closest("button[data-answer]");
 if(!btn)return;
 // Runs after the original child click handler; prediction never reads expert label.
 Promise.resolve().then(()=>afterAnswer(e));
});
function clear(){predictions=[];compare.classList.add("hidden");}
$("startDemo").addEventListener("click",clear);
$("startReal").addEventListener("click",clear);
$("retryQuiz").addEventListener("click",clear);
$("skipBadImage").addEventListener("click",()=>compare.classList.add("hidden"));
$("nextQuestion").addEventListener("click",()=>{
 compare.classList.add("hidden");
 Promise.resolve().then(()=>{
  if($("quizSummary").classList.contains("hidden"))return;
  const n=predictions.length,agree=predictions.filter(p=>p.ai===p.student).length,correct=predictions.filter(p=>p.ai===p.expert).length;
  $("aiSummaryText").textContent=n?
   "獨立 AI 推論 "+n+" 題；學生與 AI 一致 "+agree+" 題；AI 與專家標籤一致 "+correct+" 題（"+(100*correct/n).toFixed(1)+"%）。沒有臨床準確率意義。":
   "沒有成功完成的 AI 推論；可以在下一次練習前先準備模型。";
 });
});
})();