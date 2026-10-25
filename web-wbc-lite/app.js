/* Web-WBC Lite v0.1 — NYCU MLS education; no clinical or AI diagnosis. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const TYPES=[
 ["neutrophil","NEU","Neutrophil","嗜中性球","成熟嗜中性球常有 2–5 葉分葉核，染色質粗凝，細胞質淡粉紫色、細顆粒。","觀察分葉核與細顆粒；Band neutrophil 應另行判讀。"],
 ["lymphocyte","LYM","Lymphocyte","淋巴球","成熟小淋巴球的圓形深染核常占細胞大部分體積，周圍是一圈窄的藍色細胞質。","注意核質比例與染色質緻密程度。"],
 ["monocyte","MON","Monocyte","單核球","單核球通常體積較大，具腎形或摺疊狀細胞核、較鬆散染色質及灰藍色細胞質。","觀察核凹陷、灰藍細胞質及可能的空泡。"],
 ["eosinophil","EOS","Eosinophil","嗜酸性球","嗜酸性球常見雙葉核，細胞質具有粗大紅橘色嗜酸性顆粒。","雙葉核與紅橘色顆粒是辨識要點。"],
 ["basophil","BAS","Basophil","嗜鹼性球","嗜鹼性球的深藍紫色粗大顆粒常會遮蔽細胞核。","注意紫藍色顆粒；題庫會增加稀少類型的練習比例。"]
];
const INDEX=Object.fromEntries(TYPES.map((t,i)=>[t[0],i]));
const DATASET="nirschl-lab/acevedo_et_al_2020", API="https://datasets-server.huggingface.co/rows";
const S={tab:"learn",learn:0,learnImages:{},pool:[],loading:false,quiz:[],answers:[],pos:0,answered:false,bad:false,origin:"",
 marks:[],smearReady:false,manualType:0,smearFilename:""};
let smearImg=null;
const shuffle=(a)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function status(x){$("status").textContent=x;}
function fullName(t){return t[2]+" · "+t[3];}
function drawing(type,seed){
 // Programmatic morphology *illustration*, explicitly not real microscopy.
 const key=typeof type==="string"?type:type[0];const n=Number(seed)||1;
 let bg="",granules="",nucleus="";
 for(let i=0;i<9;i++){
  const x=33+(i*87+n*13)%295,y=28+(i*61+n*17)%300;
  if((x-180)*(x-180)+(y-180)*(y-180)<110*110)continue;
  bg+='<ellipse cx="'+x+'" cy="'+y+'" rx="21" ry="20" fill="#eac5cc" stroke="#c6929c" stroke-width="2"/><ellipse cx="'+x+'" cy="'+y+'" rx="9" ry="8" fill="#f8dee3"/>';
 }
 switch(key){
 case "neutrophil":nucleus='<path d="M142 144 Q169 117 183 149 L189 169 Q215 149 229 172 Q236 199 213 207 L196 213 Q191 245 167 228 Q146 218 155 195 Q126 179 142 144 Z" fill="#65477d" stroke="#4c325f" stroke-width="5"/>';break;
 case "lymphocyte":nucleus='<circle cx="183" cy="181" r="65" fill="#654484" stroke="#4c315d" stroke-width="5"/>';break;
 case "monocyte":nucleus='<path d="M125 147 C144 103 216 119 231 157 Q241 176 213 188 Q181 174 172 205 Q169 224 187 241 Q143 241 128 208 Q117 178 125 147 Z" fill="#776186" stroke="#58466b" stroke-width="5"/>';break;
 case "eosinophil":nucleus='<ellipse cx="154" cy="164" rx="29" ry="43" fill="#694476" transform="rotate(-18 154 164)"/><ellipse cx="210" cy="190" rx="27" ry="42" fill="#694476" transform="rotate(20 210 190)"/>';break;
 default:nucleus='<path d="M130 156 Q155 109 214 132 Q243 158 215 222 Q183 244 143 215 Q120 186 130 156 Z" fill="#59406b" stroke="#3f2c5a" stroke-width="4"/>';
 }
 const count=key==="basophil"?75:key==="eosinophil"?72:key==="neutrophil"?26:9;
 for(let i=0;i<count;i++){
  const a=2*Math.PI*(i*.6180339+n*.031),dist=7+Math.sqrt((i+.7)/count)*75;
  const x=(183+Math.cos(a)*dist).toFixed(1),y=(182+Math.sin(a)*dist).toFixed(1);
  const color=key==="basophil"?"#453063":key==="eosinophil"?"#ed7541":key==="neutrophil"?"#b9a1ad":"#9eb3c4";
  const r=key==="basophil"?4:key==="eosinophil"?3:1.5;
  granules+='<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+color+'" opacity=".85"/>';
 }
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 360"><rect width="360" height="360" fill="#f0d7dd"/>'+bg+'<circle cx="183" cy="182" r="87" fill="#bfd4e1" stroke="#91a8b8" stroke-width="4"/>'+nucleus+granules+'<text x="350" y="350" text-anchor="end" font-size="12" fill="#714f59">SCHEMATIC</text></svg>';
 return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
function tab(name){
 S.tab=name;["learn","quiz","review"].forEach(k=>{
  $(k+"Panel").classList.toggle("hidden",name!==k);
  const button=document.querySelector('[data-tab="'+k+'"]');button.classList.toggle("active",name===k);
  button.setAttribute("aria-selected",String(name===k));
 });
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>tab(b.dataset.tab)));
TYPES.forEach((t,i)=>{const b=document.createElement("button");b.textContent=t[1];b.title=fullName(t);b.onclick=()=>learn(i);$("learnTypes").append(b);});
function learn(i){
 S.learn=i;const t=TYPES[i],cell=S.learnImages[t[0]],img=$("learnImage");
 $("learnTitle").textContent=fullName(t);$("learnFeatures").textContent=t[4];$("learnTips").textContent=t[5];
 $("learnTypes").querySelectorAll("button").forEach((b,j)=>b.classList.toggle("active",j===i));
 img.src=cell?cell.src:drawing(t,i);img.alt=(cell?"PBC 顯微鏡影像：":"白血球示意圖：")+fullName(t);
 $("learnImageNote").textContent=cell?"PBC · CC BY 4.0":"Schematic illustration · 教學示意圖";
 $("learnSource").textContent=cell?"Acevedo et al. (2020) / MicroBench，來源標示 CC BY 4.0，類別依專家標註。":"SVG 程式繪製的細胞形態教學示意圖，非真實檢體。";
}
$("learnImage").addEventListener("error",()=>{
 const t=TYPES[S.learn],img=$("learnImage");if(img.src.startsWith("data:"))return;
 S.learnImages[t[0]]=null;img.src=drawing(t,S.learn);
 $("learnImageNote").textContent="遠端圖片無法讀取 · 顯示示意圖";
 status("PBC 圖像無法讀取，已切換為教學示意圖。");
});
learn(0);
function parseRow(row,index){
 const key=String(row.label_name||"").trim().toLowerCase().replaceAll("_"," ");
 if(!(key in INDEX))return null;
 const src=typeof row.image==="string"?row.image:(row.image?.src||row.image?.url);
 if(typeof src!=="string"||!(src.startsWith("https://")||src.startsWith("data:image/")))return null;
 return {key,src,source:"pbc",rowIndex:index,imageId:String(row.image_id||"")};
}
async function fetchChunk(offset){
 const args=new URLSearchParams({dataset:DATASET,config:"default",split:"test",offset:String(offset),length:"100"});
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),16000);
 try{
  const response=await fetch(API+"?"+args.toString(),{signal:ctrl.signal,cache:"no-store"});
  if(!response.ok)throw Error("Dataset Viewer HTTP "+response.status);
  const data=await response.json();
  if(!Array.isArray(data.rows))throw Error("資料列格式不正確。");
  return data.rows.map(r=>parseRow(r.row,r.row_idx)).filter(Boolean);
 }finally{clearTimeout(timer);}
}
async function getPool(){
 if(S.pool.length>=115)return S.pool;
 const offsets=[0,420,850,1280,1710,2140,2570,2990];
 const result=await Promise.allSettled(offsets.map(fetchChunk));
 const seen=new Map(S.pool.map(x=>[x.rowIndex,x]));
 let success=0;
 result.forEach(x=>{if(x.status==="fulfilled"){success++;x.value.forEach(y=>seen.set(y.rowIndex,y));}});
 S.pool=[...seen.values()];
 if(!success||!S.pool.length)throw Error("PBC Dataset Viewer 目前無法回傳資料（可能為網路或 CORS 限制）。");
 return S.pool;
}
$("loadLearning").addEventListener("click",async()=>{
 if(S.loading)return;S.loading=true;$("loadLearning").disabled=true;
 status("正在連接 PBC 公開資料集…");
 try{
  const pool=await getPool();
  TYPES.forEach(t=>{S.learnImages[t[0]]=pool.find(c=>c.key===t[0])||null;});
  learn(S.learn);status("已讀取 PBC 專家標註影像，可逐類觀察細胞形態。");
 }catch(e){status("PBC 題庫載入失敗："+e.message+"；目前仍提供內建示意圖。");}
 finally{S.loading=false;$("loadLearning").disabled=false;}
});
function selectBalanced(pool,n){
 const byType=TYPES.map(t=>shuffle(pool.filter(x=>x.key===t[0]))),per=n/5;
 if(!Number.isInteger(per)||byType.some(group=>group.length<per))
  throw Error("本次公開資料不足以建立五類各 "+per+" 題的平衡題庫；請選擇示意練習。");
 return shuffle(byType.flatMap(group=>group.slice(0,per)));
}
function demoItems(n){
 const a=[];for(let i=0;i<n;i++){const t=TYPES[i%5];a.push({key:t[0],source:"schematic",src:drawing(t,i+1),imageId:"schematic-"+i,rowIndex:i});}
 return shuffle(a);
}
function buttons(parent,handler){
 parent.replaceChildren();
 TYPES.forEach((t,i)=>{
  const b=document.createElement("button");b.className="choice";b.dataset.answer=t[0];
  b.textContent=(i+1)+". "+fullName(t);b.onclick=()=>handler(t[0]);parent.append(b);
 });
}
function start(items,origin){
 S.quiz=items;S.pos=0;S.answers=[];S.answered=false;S.bad=false;S.origin=origin;
 $("quizSetup").classList.add("hidden");$("quizSummary").classList.add("hidden");$("quizGame").classList.remove("hidden");
 $("quizSourceLabel").textContent=origin==="pbc"?"PBC · Expert-labelled":"Schematic · 教學示意";
 nextDisplay();
}
function nextDisplay(){
 if(S.pos>=S.quiz.length){summary();return;}
 const q=S.quiz[S.pos];S.answered=false;S.bad=false;
 $("questionNumber").textContent=(S.pos+1)+" / "+S.quiz.length;
 $("quizProgress").max=S.quiz.length;$("quizProgress").value=S.answers.length;
 const good=S.answers.filter(a=>a.correct).length;
 $("correctSoFar").textContent=S.answers.length?"目前正確率 "+(good/S.answers.length*100).toFixed(1)+"%":"尚未作答";
 $("feedback").classList.add("hidden");$("nextQuestion").classList.add("hidden");$("skipBadImage").classList.add("hidden");
 buttons($("answerButtons"),answer);
 $("questionSource").textContent=q.source==="pbc"?"PBC · CC BY 4.0":"Schematic · 非真實鏡檢";
 $("questionImage").src=q.src;$("questionImage").alt="白血球分類題目 "+(S.pos+1);
}
$("questionImage").addEventListener("error",()=>{
 if(S.answered||!S.quiz.length||S.pos>=S.quiz.length)return;
 S.bad=true;$("feedback").textContent="此張遠端圖像無法載入。請跳過，不會算成錯誤。";
 $("feedback").classList.remove("hidden");$("skipBadImage").classList.remove("hidden");
 $("answerButtons").querySelectorAll("button").forEach(b=>b.disabled=true);
});
function answer(chosen){
 if(S.answered||S.bad||!S.quiz[S.pos])return;
 const q=S.quiz[S.pos],correct=q.key===chosen;
 S.answers.push({question:S.pos+1,trueLabel:q.key,studentLabel:chosen,correct,source:q.source,rowIndex:q.rowIndex,imageId:q.imageId,src:q.src});
 S.answered=true;
 const t=TYPES[INDEX[q.key]];
 $("feedback").textContent=(correct?"答對！ ":"需要複習。")+"正確答案："+fullName(t)+"。"+t[4];
 $("feedback").classList.remove("hidden");
 $("answerButtons").querySelectorAll("button").forEach(b=>{
  b.disabled=true;
  if(b.dataset.answer===q.key)b.classList.add("right");
  if(b.dataset.answer===chosen&&!correct)b.classList.add("wrong");
 });
 $("quizProgress").value=S.answers.length;
 $("nextQuestion").textContent=S.pos===S.quiz.length-1?"查看結果":"下一題";
 $("nextQuestion").classList.remove("hidden");
 const good=S.answers.filter(a=>a.correct).length;
 $("correctSoFar").textContent="已作答 "+S.answers.length+" 題 · 正確率 "+(good/S.answers.length*100).toFixed(1)+"%";
}
$("nextQuestion").addEventListener("click",()=>{
 if(!S.answered)return;S.pos++;nextDisplay();
});
$("skipBadImage").addEventListener("click",()=>{
 if(!S.bad)return;S.quiz.splice(S.pos,1);S.bad=false;
 status("已跳過無法載入的影像，最後會依實際完成的題數計算成績。");nextDisplay();
});
document.addEventListener("keydown",e=>{
 if(S.tab!=="quiz"||$("quizGame").classList.contains("hidden")||e.ctrlKey||e.altKey||e.metaKey||
   ["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName))return;
 if(e.key==="Enter"&&S.answered){$("nextQuestion").click();return;}
 const n=Number(e.key)-1;if(n>=0&&n<5)answer(TYPES[n][0]);
});
$("startDemo").addEventListener("click",()=>{start(demoItems(Number($("quizLength").value)),"schematic");status("示意題庫已建立。這些繪圖用於熟悉計數操作及形態概念。");});
$("startReal").addEventListener("click",async()=>{
 if(S.loading)return;S.loading=true;$("startReal").disabled=true;$("startDemo").disabled=true;
 status("正在載入 PBC 五種類型的專家標註影像，請保持網路連線…");
 try{
  const pool=await getPool(),n=Number($("quizLength").value),chosen=selectBalanced(pool,n);
  TYPES.forEach(t=>{S.learnImages[t[0]]=pool.find(x=>x.key===t[0])||null;});
  learn(S.learn);start(chosen,"pbc");
  status("已取得 "+chosen.length+" 張 PBC 顯微圖像的題目索引。圖片於每題顯示時才載入。");
 }catch(e){status("PBC 真實影像題庫目前無法使用："+e.message+" 你可以改用示意圖練習。");}
 finally{S.loading=false;$("startReal").disabled=false;$("startDemo").disabled=false;}
});
function summary(){
 $("quizGame").classList.add("hidden");$("quizSummary").classList.remove("hidden");
 const n=S.answers.length,ok=S.answers.filter(a=>a.correct).length;
 const stats=$("summaryStats");stats.replaceChildren();
 [["實際作答",n+" 題"],["分類正確",ok+" 題"],["正確率",n?(100*ok/n).toFixed(1)+"%":"—"]].forEach(([name,v])=>{
  const div=document.createElement("div"),small=document.createElement("small"),strong=document.createElement("strong");
  div.className="summary-box";small.textContent=name;strong.textContent=v;div.append(small,strong);stats.append(div);
 });
 const dist=$("quizDistribution");dist.replaceChildren();
 const title=document.createElement("h4");title.textContent="學生判讀數量（本次平衡練習題庫）";dist.append(title);
 TYPES.forEach(t=>{
  const count=S.answers.filter(a=>a.studentLabel===t[0]).length;
  const row=document.createElement("div"),name=document.createElement("span"),track=document.createElement("div"),bar=document.createElement("div"),value=document.createElement("strong");
  row.className="distribution-row";name.textContent=t[1]+" "+t[3];track.className="track";bar.className="bar";bar.style.width=(n?100*count/n:0)+"%";
  track.append(bar);value.textContent=count+" / "+n;row.append(name,track,value);dist.append(row);
 });
 const table=document.createElement("table"),head=document.createElement("thead"),tr=document.createElement("tr");
 ["True / Pred.",...TYPES.map(t=>t[1])].forEach(s=>{const th=document.createElement("th");th.textContent=s;tr.append(th);});
 head.append(tr);table.append(head);
 const body=document.createElement("tbody");
 TYPES.forEach((t,i)=>{
  const row=document.createElement("tr"),th=document.createElement("th");th.textContent=t[1];row.append(th);
  TYPES.forEach((u,j)=>{
   const cell=document.createElement("td");cell.textContent=String(S.answers.filter(a=>a.trueLabel===t[0]&&a.studentLabel===u[0]).length);
   if(i===j)cell.className="diag";row.append(cell);
  });body.append(row);
 });table.append(body);$("confusionTable").replaceChildren(table);
 const misses=$("mistakeList");misses.replaceChildren();
 for(const a of S.answers.filter(x=>!x.correct)){
  const div=document.createElement("div"),img=document.createElement("img"),p=document.createElement("p");
  div.className="mistake";img.src=a.src;img.alt="錯題 "+a.question;
  p.textContent="#"+a.question+"　你選："+TYPES[INDEX[a.studentLabel]][1]+"；正確："+TYPES[INDEX[a.trueLabel]][1];
  div.append(img,p);misses.append(div);
 }
 if(!misses.children.length){const p=document.createElement("p");p.textContent="本次沒有誤判。";misses.append(p);}
 status("練習完成，正確 "+ok+"／"+n+" 題。可下載題目與判讀紀錄。");
}
$("retryQuiz").addEventListener("click",()=>{
 S.quiz=[];S.answers=[];$("quizSetup").classList.remove("hidden");$("quizGame").classList.add("hidden");$("quizSummary").classList.add("hidden");
 $("quizSourceLabel").textContent="尚未開始";
});
function download(rows,filename){
 const esc=x=>'"'+String(x??"").replaceAll('"','""')+'"';
 const text="\ufeff"+rows.map(r=>r.map(esc).join(",")).join("\r\n"),blob=new Blob([text],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
$("downloadQuiz").addEventListener("click",()=>{
 download([["question","image_source","image_id","dataset_test_row","expert_label","student_label","correct"],...S.answers.map(a=>[a.question,a.source,a.imageId,a.rowIndex,a.trueLabel,a.studentLabel,a.correct])],"web-wbc-quiz.csv");
});
const cv=$("smearCanvas"),ct=cv.getContext("2d");
function drawSmear(){
 ct.clearRect(0,0,cv.width,cv.height);
 if(smearImg)ct.drawImage(smearImg,0,0,cv.width,cv.height);
 else{
  ct.fillStyle="#dce6e9";ct.fillRect(0,0,cv.width,cv.height);ct.fillStyle="#6c8290";ct.textAlign="center";
  ct.font="17px sans-serif";ct.fillText("請先上傳血液抹片影像",cv.width/2,cv.height/2);ct.textAlign="left";
 }
 const colors=["#00bbcc","#8299ed","#e29b45","#df688e","#9575b6"];
 S.marks.forEach((a,i)=>{
  ct.strokeStyle=colors[a.type];ct.fillStyle=colors[a.type];ct.lineWidth=2;
  ct.beginPath();ct.arc(a.x,a.y,Math.max(9,cv.width*.019),0,Math.PI*2);ct.stroke();
  ct.font="bold 13px sans-serif";ct.fillText(String(i+1),a.x+13,a.y-7);
 });
}
function manualCount(){
 $("manualTotal").textContent=S.marks.length+" / 100";
 $("manualCounts").replaceChildren();
 TYPES.forEach((t,i)=>{
  const row=document.createElement("div"),name=document.createElement("span"),val=document.createElement("strong");
  name.textContent=t[1]+" "+t[3];val.textContent=String(S.marks.filter(a=>a.type===i).length);
  row.append(name,val);$("manualCounts").append(row);
 });
 buttons($("manualTypes"),key=>{S.manualType=INDEX[key];manualCount();});
 $("manualTypes").querySelectorAll("button").forEach(b=>b.classList.toggle("active",INDEX[b.dataset.answer]===S.manualType));
}
$("smearFile").addEventListener("change",async()=>{
 const file=$("smearFile").files?.[0];if(!file)return;
 if(file.size>25*1024*1024){status("影像超過 25 MB，請先壓縮。");return;}
 const url=URL.createObjectURL(file),img=new Image();
 try{
  await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(Error("圖片無法解碼，請使用 JPG 或 PNG。"));img.src=url;});
  const scale=Math.min(1,1100/Math.max(img.naturalWidth,img.naturalHeight));
  cv.width=Math.round(img.naturalWidth*scale);cv.height=Math.round(img.naturalHeight*scale);
  if(cv.width<40||cv.height<40)throw Error("圖像解析度不足。");
  smearImg=img;S.smearReady=true;S.marks=[];S.smearFilename=file.name;
  drawSmear();manualCount();status("已讀取本機血液抹片。請選擇 WBC 類型並點選細胞位置。");
 }catch(e){status("讀取失敗："+e.message);}
 finally{URL.revokeObjectURL(url);}
});
cv.addEventListener("pointerdown",e=>{
 if(!S.smearReady||S.marks.length>=100)return;
 const rect=cv.getBoundingClientRect(),x=(e.clientX-rect.left)*cv.width/rect.width,y=(e.clientY-rect.top)*cv.height/rect.height;
 if(!Number.isFinite(x)||!Number.isFinite(y))return;
 S.marks.push({x,y,type:S.manualType});drawSmear();manualCount();
 if(S.marks.length===100)status("已完成 100 顆白血球的人工計數，可匯出記錄。");
});
$("manualUndo").addEventListener("click",()=>{S.marks.pop();drawSmear();manualCount();});
$("manualReset").addEventListener("click",()=>{S.marks=[];drawSmear();manualCount();status("人工計數已重設。");});
$("downloadManual").addEventListener("click",()=>{
 if(!S.marks.length){status("尚未標記任何細胞。");return;}
 download([["index","wbc_type","x_px","y_px","image_filename"],...S.marks.map((a,i)=>[i+1,TYPES[a.type][0],a.x.toFixed(1),a.y.toFixed(1),S.smearFilename])],"web-wbc-manual.csv");
});
drawSmear();manualCount();
})();