/* Web-Gram Stain Lite v0.1 — original, dependency-free, browser-only teaching algorithm.
 * Rule-based stain colour and component morphology; no AI model or clinical validation.
 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const ids=["upload","demoPos","demoNeg","demoMixed","detect","roiReset","undo","clear","contrast","minSize","maxSize","contrastVal","minSizeVal","maxSizeVal","viewer","status","demoTruth","detectInfo","studentGram","studentShape","studentArrangement","saveAnswer","reveal","studentSummary","resultPanel","posC","negC","posR","negR","review","gramResult","shapeResult","compareMessage","png","csv"];
const u={};ids.forEach(id=>u[id]=$(id));
const canvas=u.viewer,ctx=canvas.getContext("2d");
const src=document.createElement("canvas"),sc=src.getContext("2d",{willReadFrequently:true});
const COLOR={pc:"#7650a1",nc:"#c45379",pr:"#3b6db0",nr:"#ec8655",review:"#b88c1e"};
const LABEL={pc:"G+ cocci",nc:"G− cocci",pr:"G+ bacilli",nr:"G− bacilli",review:"Review"};
let loaded=false,sourceName="",marks=[],roi=null,mode="roi",drag=null,history=[],detected=false,revealed=false,studentSaved=null,demoKey="";
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function say(zh,en){u.status.textContent=zh;let s=document.createElement("span");s.className="en";s.textContent=en;u.status.appendChild(s);}
function allowedROI(){return roi||{x0:0,y0:0,x1:src.width,y1:src.height};}
function within(p){const r=allowedROI();return p.x>=r.x0&&p.y>=r.y0&&p.x<r.x1&&p.y<r.y1;}
function snapshot(){history.push(marks.map(m=>({...m})));if(history.length>20)history.shift();}
function updateControls(){
 u.detect.disabled=!loaded;
 u.roiReset.disabled=!loaded||!roi;
 u.saveAnswer.disabled=!loaded||!!studentSaved;
 u.reveal.disabled=!detected||!studentSaved||revealed;
 u.undo.disabled=!revealed||!history.length;
 u.clear.disabled=!revealed||!marks.length;
 u.png.disabled=u.csv.disabled=!revealed;
 document.querySelectorAll("[data-mode]").forEach(b=>{b.disabled=!loaded||(b.dataset.mode!=="roi"&&!revealed);b.classList.toggle("active",b.dataset.mode===mode);b.setAttribute("aria-pressed",String(b.dataset.mode===mode));});
 u.resultPanel.hidden=!revealed;
}
function draw(){
 if(!loaded){ctx.fillStyle="#eaf0f5";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#66809a";ctx.textAlign="center";ctx.font="20px system-ui";ctx.fillText("Upload Gram stain image / 上傳革蘭氏染色影像",canvas.width/2,canvas.height/2);return;}
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(src,0,0);
 if(roi){
  ctx.fillStyle="rgba(13,45,73,.26)";
  ctx.fillRect(0,0,src.width,roi.y0);ctx.fillRect(0,roi.y1,src.width,src.height-roi.y1);
  ctx.fillRect(0,roi.y0,roi.x0,roi.y1-roi.y0);ctx.fillRect(roi.x1,roi.y0,src.width-roi.x1,roi.y1-roi.y0);
  ctx.strokeStyle="#2b61ab";ctx.lineWidth=2;ctx.setLineDash([9,5]);ctx.strokeRect(roi.x0,roi.y0,roi.x1-roi.x0,roi.y1-roi.y0);ctx.setLineDash([]);
 }
 if(drag){ctx.strokeStyle="#2b61ab";ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.strokeRect(Math.min(drag.a.x,drag.b.x),Math.min(drag.a.y,drag.b.y),Math.abs(drag.b.x-drag.a.x),Math.abs(drag.b.y-drag.a.y));ctx.setLineDash([]);}
 if(!revealed)return;
 for(const m of marks){
  ctx.strokeStyle=COLOR[m.kind];ctx.lineWidth=2.4;
  const r=Math.max(7,m.r+3);
  ctx.beginPath();ctx.arc(m.x,m.y,r,0,2*Math.PI);ctx.stroke();
  ctx.fillStyle=COLOR[m.kind];ctx.fillRect(m.x+r-3,m.y-r-5,9,9);
 }
}
function resetAnalysis(keepStudent=true){
 marks=[];history=[];detected=false;revealed=false;u.detectInfo.textContent="";u.demoTruth.textContent="";u.compareMessage.textContent="";
 if(!keepStudent){studentSaved=null;u.studentGram.disabled=false;u.studentShape.disabled=false;u.studentArrangement.disabled=false;u.studentSummary.textContent="尚未提交學生判讀 / No student response yet.";}
 updateControls();draw();
}
function load(image,name,demo=""){
 const scale=Math.min(1,1100/image.width,770/image.height);
 src.width=Math.max(1,Math.round(image.width*scale));src.height=Math.max(1,Math.round(image.height*scale));
 sc.clearRect(0,0,src.width,src.height);sc.drawImage(image,0,0,src.width,src.height);
 canvas.width=src.width;canvas.height=src.height;loaded=true;sourceName=name;demoKey=demo;roi=null;mode="roi";
 u.studentGram.value="";u.studentShape.value="";u.studentArrangement.value="unknown";
 resetAnalysis(false);
 say("影像已載入。請先判讀、儲存答案，接著執行偵測。","Image loaded. Record your interpretation, run detection, then reveal the comparison.");
}
function seeded(seed){let s=seed|0;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296;};}
function synthetic(kind){
 const w=1000,h=630,c=document.createElement("canvas");c.width=w;c.height=h;const g=c.getContext("2d"),rnd=seeded(kind==="pos"?14571:kind==="neg"?57821:85331);
 g.fillStyle="#f1e9e9";g.fillRect(0,0,w,h);
 for(let i=0;i<460;i++){g.fillStyle=i%3?"rgba(187,150,154,.085)":"rgba(125,92,135,.05)";g.beginPath();g.ellipse(rnd()*w,rnd()*h,1+rnd()*14,1+rnd()*7,rnd()*Math.PI,0,Math.PI*2);g.fill();}
 const types=kind==="pos"?Array(64).fill("pc"):kind==="neg"?Array(64).fill("nr"):Array.from({length:64},(_,i)=>i%2?"nr":"pc");
 for(let i=types.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[types[i],types[j]]=[types[j],types[i]];}
 for(let i=0;i<64;i++){
  const x=63+(i%10)*97+(rnd()-.5)*25, y=45+Math.floor(i/10)*85+(rnd()-.5)*18,k=types[i],theta=rnd()*Math.PI*2;
  g.save();g.translate(x,y);g.rotate(theta);
  g.fillStyle=k==="pc"?"#89569b":"#da7593";g.strokeStyle=k==="pc"?"#6f4c90":"#c66b87";g.lineWidth=.9;
  g.beginPath();if(k==="pc"){g.ellipse(0,0,5.0+rnd()*1.3,4.6+rnd()*.7,0,0,2*Math.PI);}
  else{g.ellipse(0,0,13+rnd()*3,3.3+rnd(),0,0,2*Math.PI);}
  g.fill();g.stroke();g.restore();
 }
 load(c,"synthetic-gram-stain.png",kind);
}
function detect(){
 if(!loaded)return;
 const W=src.width,H=src.height,N=W*H,r=allowedROI(),img=sc.getImageData(0,0,W,H).data;
 const t=Number(u.contrast.value),min=Number(u.minSize.value),max=Number(u.maxSize.value);
 if(!Number.isFinite(t)||!Number.isFinite(min)||!Number.isFinite(max)||min<3||max<=min){say("請檢查分色門檻與面積設定。","Invalid threshold or object-size settings.");return;}
 const mask=new Uint8Array(N),xmin=Math.max(0,Math.floor(r.x0)),xmax=Math.min(W,Math.ceil(r.x1)),ymin=Math.max(0,Math.floor(r.y0)),ymax=Math.min(H,Math.ceil(r.y1));
 for(let y=ymin;y<ymax;y++)for(let x=xmin;x<xmax;x++){
  const i=y*W+x,k=i*4,R=img[k],G=img[k+1],B=img[k+2];
  if(Math.max(R,G,B)>249||Math.max(R,G,B)-Math.min(R,G,B)<t*.70)continue;
  const positive=B-G>t&&R-G>t*.23&&B>=R*.90;
  const negative=R-G>t&&R-B>t*.38&&B>=G+3;
  if(positive&&negative)mask[i]=(B-R>12)?1:2;
  else if(positive)mask[i]=1;
  else if(negative)mask[i]=2;
 }
 const queue=new Int32Array(N),found=[];let skipped=0;
 for(let y=ymin;y<ymax;y++)for(let x=xmin;x<xmax;x++){
  const p=y*W+x,klass=mask[p];if(!klass||klass>2)continue;
  let head=0,tail=1;queue[0]=p;mask[p]=3;
  let count=0,sx=0,sy=0,sxx=0,syy=0,sxy=0,l=x,rr=x,top=y,bottom=y;
  while(head<tail){
   const q=queue[head++],qx=q%W,qy=(q-qx)/W;
   count++;sx+=qx;sy+=qy;sxx+=qx*qx;syy+=qy*qy;sxy+=qx*qy;
   if(qx<l)l=qx;if(qx>rr)rr=qx;if(qy<top)top=qy;if(qy>bottom)bottom=qy;
   for(let yy=Math.max(ymin,qy-1);yy<=Math.min(ymax-1,qy+1);yy++)for(let xx=Math.max(xmin,qx-1);xx<=Math.min(xmax-1,qx+1);xx++){
    const next=yy*W+xx;if(mask[next]===klass){mask[next]=3;queue[tail++]=next;}
   }
  }
  if(count<min||count>max){skipped++;continue;}
  const cx=sx/count,cy=sy/count,vxx=sxx/count-cx*cx,vyy=syy/count-cy*cy,vxy=sxy/count-cx*cy;
  const discriminant=Math.sqrt(Math.max(0,(vxx-vyy)**2+4*vxy*vxy)),major=(vxx+vyy+discriminant)/2,minor=(vxx+vyy-discriminant)/2;
  const ratio=Math.sqrt((Math.max(0,major)+.5)/(Math.max(0,minor)+.5));
  const uncertain=ratio>1.55&&ratio<2.15||count>max*.80||rr-l>Math.sqrt(max)*3;
  const shape=ratio>=2.15?"r":"c";
  found.push({x:cx,y:cy,r:clamp(Math.sqrt(count/Math.PI)+1,5,32),kind:uncertain?"review":(klass===1?"p":"n")+shape,source:"rule"});
  if(found.length>=1200)break;
 }
 marks=found;history=[];detected=true;revealed=false;
 u.detectInfo.textContent="偵測 "+marks.length+" 個候選區域；篩除 "+skipped+" 個過小或過大的色塊。此數字屬色塊分割結果，無法視為已確認菌數。 / "+marks.length+" candidate components; "+skipped+" filtered. Counts are unverified.";
 say("規則式偵測完成。請先提交學生判讀，再揭示系統建議。","Rule-based detection complete. Submit your interpretation to reveal the results.");
 updateControls();draw();
}
function stats(){
 const n={pc:0,nc:0,pr:0,nr:0,review:0};marks.forEach(m=>n[m.kind]++);
 ["pc","nc","pr","nr","review"].forEach(k=>u[k==="pc"?"posC":k==="nc"?"negC":k==="pr"?"posR":k==="nr"?"negR":"review"].textContent=n[k]);
 const p=n.pc+n.pr,g=n.nc+n.nr,c=n.pc+n.nc,b=n.pr+n.nr;
 function label(a,z,lA,lZ){const total=a+z;if(!total)return{key:"uncertain",text:"無足夠候選 / Insufficient evidence"};if(a/total>=.8)return{key:lA,text:lA==="pos"?"偏向革蘭氏陽性 / Predominantly Gram-positive":"偏向球菌 / Predominantly cocci"};if(z/total>=.8)return{key:lZ,text:lZ==="neg"?"偏向革蘭氏陰性 / Predominantly Gram-negative":"偏向桿菌 / Predominantly bacilli"};return{key:"mixed",text:"混合候選型態 / Mixed candidate classes"};}
 const gram=label(p,g,"pos","neg"),shape=label(c,b,"cocci","bacilli");
 u.gramResult.textContent=gram.text;u.shapeResult.textContent=shape.text;
 const guess=studentSaved;
 if(guess){let gmatch=guess.gram===gram.key,sMatch=guess.shape===shape.key;
  const phrase=gmatch&&sMatch?"兩項與規則式結果一致 / Both match the rule-based suggestion.":gmatch||sMatch?"一項一致，另一項不同 / One matches; review the discrepancy.":"兩項均與規則式結果不同 / Both differ from the rule-based suggestion.";
  u.compareMessage.textContent=phrase+" 系統輸出並非標準答案；請以教師標註與顯微鏡複核。 / Automated suggestions are not ground truth; confirm against expert annotation.";
 }
 if(demoKey){const expected=demoKey==="pos"?"G+ cocci":demoKey==="neg"?"G− bacilli":"Mixed G+ cocci / G− bacilli";u.demoTruth.textContent="合成圖設計類別 / Synthetic example labels: "+expected+"。產生影像時設定各類 64 個（mixed 各 32），色塊偵測數會因接觸或分割而不同。";}
}
function getPoint(ev){const rect=canvas.getBoundingClientRect();return{x:clamp((ev.clientX-rect.left)*canvas.width/rect.width,0,canvas.width-1),y:clamp((ev.clientY-rect.top)*canvas.height/rect.height,0,canvas.height-1)};}
function edit(p){
 if(!revealed||!within(p))return;
 let idx=-1,best=Infinity;
 for(let i=0;i<marks.length;i++){const m=marks[i],d=Math.hypot(p.x-m.x,p.y-m.y);if(d<Math.max(13,m.r+7)&&d<best){best=d;idx=i;}}
 if(mode==="erase"&&idx<0)return;
 if(mode!=="erase"&&marks.length>=1200&&idx<0){say("已達 1,200 個候選標記上限。","Marker limit reached.");return;}
 snapshot();
 if(mode==="erase")marks.splice(idx,1);
 else if(idx>=0){marks[idx].kind=mode;marks[idx].source="manual";}
 else marks.push({x:p.x,y:p.y,r:8,kind:mode,source:"manual"});
 stats();draw();updateControls();
}
canvas.addEventListener("pointerdown",e=>{if(!loaded)return;const p=getPoint(e);if(mode==="roi"){drag={a:p,b:p};canvas.setPointerCapture(e.pointerId);draw();}else edit(p);});
canvas.addEventListener("pointermove",e=>{if(drag){drag.b=getPoint(e);draw();}});
function endROI(e){
 if(!drag)return;drag.b=getPoint(e);let {a,b}=drag;drag=null;
 const r={x0:Math.floor(Math.min(a.x,b.x)),y0:Math.floor(Math.min(a.y,b.y)),x1:Math.ceil(Math.max(a.x,b.x)),y1:Math.ceil(Math.max(a.y,b.y))};
 if(r.x1-r.x0>=18&&r.y1-r.y0>=18){roi=r;resetAnalysis(false);say("ROI 已更新。請在新區域重新判讀與偵測。","ROI updated. Repeat interpretation and detection for the selected region.");}else draw();
}
canvas.addEventListener("pointerup",endROI);
canvas.addEventListener("pointercancel",()=>{drag=null;draw();});
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.mode;updateControls();}));
[u.contrast,u.minSize,u.maxSize].forEach(x=>x.addEventListener("input",()=>{u.contrastVal.textContent=u.contrast.value;u.minSizeVal.textContent=u.minSize.value;u.maxSizeVal.textContent=u.maxSize.value;if(detected)resetAnalysis(true);}));
u.upload.addEventListener("change",()=>{const f=u.upload.files&&u.upload.files[0];if(!f)return;if(f.size>35*1024*1024){say("檔案超過 35 MB；請先縮小。","File exceeds 35 MB.");return;}if(!/^image\//.test(f.type)){say("請選擇影像檔案。","Select a valid image.");return;}const url=URL.createObjectURL(f),im=new Image();im.onload=()=>{load(im,f.name);URL.revokeObjectURL(url);};im.onerror=()=>{URL.revokeObjectURL(url);say("影像解碼失敗，請改用 JPG／PNG。","Image decoding failed; try JPG or PNG.");};im.src=url;});
u.demoPos.addEventListener("click",()=>synthetic("pos"));
u.demoNeg.addEventListener("click",()=>synthetic("neg"));
u.demoMixed.addEventListener("click",()=>synthetic("mixed"));
u.detect.addEventListener("click",detect);
u.roiReset.addEventListener("click",()=>{roi=null;resetAnalysis(false);say("ROI 已重設為整張照片。","Using the full image.");});
u.saveAnswer.addEventListener("click",()=>{
 if(!loaded)return;if(!u.studentGram.value||!u.studentShape.value){say("請先選擇染色反應與菌形。","Select a Gram-stain category and morphology.");return;}
 studentSaved={gram:u.studentGram.value,shape:u.studentShape.value,arrangement:u.studentArrangement.value};
 u.studentGram.disabled=u.studentShape.disabled=u.studentArrangement.disabled=true;
 u.studentSummary.textContent="已儲存學生答案 / Student response saved. Gram: "+u.studentGram.selectedOptions[0].text+"; Morphology: "+u.studentShape.selectedOptions[0].text+"; Arrangement: "+u.studentArrangement.selectedOptions[0].text+".";
 say("學生判讀已儲存。執行候選辨識後即可揭示比較。","Response saved. Run detection and reveal the comparison.");updateControls();
});
u.reveal.addEventListener("click",()=>{revealed=true;mode="roi";stats();draw();updateControls();say("系統建議已顯示。可進行人工修改，並匯出結果。","Suggestions revealed. Review, edit and export results.");});
u.undo.addEventListener("click",()=>{if(!history.length)return;marks=history.pop();stats();draw();updateControls();});
u.clear.addEventListener("click",()=>{if(!revealed)return;snapshot();marks=[];stats();draw();updateControls();});
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
u.png.addEventListener("click",()=>{if(!revealed)return;canvas.toBlob(b=>{if(b)download(b,"web-gram-stain-reviewed.png");},"image/png");});
u.csv.addEventListener("click",()=>{
 if(!revealed)return;
 function safe(v){let s=String(v??"");if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
 const lines=[["ID","x_px","y_px","radius_px","suggested_or_manual_class","source","image","ROI","educational_only"].map(safe).join(",")];
 marks.forEach((m,i)=>lines.push([i+1,m.x.toFixed(1),m.y.toFixed(1),m.r.toFixed(1),LABEL[m.kind],m.source,sourceName,roi?JSON.stringify(roi):"full","TRUE"].map(safe).join(",")));
 download(new Blob(["\ufeff"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"}),"web-gram-stain-markers.csv");
});
draw();updateControls();
})();