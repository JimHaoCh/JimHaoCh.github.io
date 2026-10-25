/* Web-CFU Lite v0.1 — browser-only educational colony counting.
   No uploaded image is transmitted to a server.
*/
(function () {
"use strict";
const $=id=>document.getElementById(id);
const canvas=$("plateCanvas"),ctx=canvas.getContext("2d");
const base=document.createElement("canvas"),baseCtx=base.getContext("2d",{willReadFrequently:true});
const state={loaded:false,analyzed:false,mode:"inspect",roi:null,items:[],autoBaseline:0,
  nextId:1,history:[],dragging:null,dragMoved:false,demo:false,reference:null,filename:""};
const MAX_SIDE=900,MAX_BYTES=30*1024*1024;
const hints={
  inspect:"檢視模式：青色標記為自動辨識；綠色標記為手動新增。請核對照片中的每一個菌落。",
  plate:"調整培養皿：點擊或拖曳圓心移動；拖曳右側圓點改變半徑。完成後重新執行自動辨識。",
  add:"新增菌落：在培養皿範圍內點一下可補上一個標記。",
  remove:"刪除標記：點一下要移除的菌落標記，可使用「復原」撤銷。"
};
function status(msg){$("status").textContent=msg;}
function num(v){return Number.isFinite(v)?String(v):"—";}
function resetForImage(w,h,filename,demo,reference){
  canvas.width=base.width=w;canvas.height=base.height=h;
  state.roi={cx:w/2,cy:h/2,r:Math.min(w,h)*.454};
  state.items=[];state.nextId=1;state.history=[];state.loaded=true;state.analyzed=false;
  state.autoBaseline=0;state.demo=demo;state.reference=reference;state.filename=filename;
  state.dragging=null;
  $("detect").disabled=false;$("undo").disabled=true;
  setMode("inspect");refresh();render();
}
function clearResultsForROI(){
  state.items=[];state.autoBaseline=0;state.analyzed=false;state.history=[];$("undo").disabled=true;
  refresh();
}
function renderEmpty(){
  canvas.width=800;canvas.height=600;
  const g=ctx.createLinearGradient(0,0,800,600);
  g.addColorStop(0,"#1d4350");g.addColorStop(1,"#0e2335");
  ctx.fillStyle=g;ctx.fillRect(0,0,800,600);
  ctx.textAlign="center";ctx.fillStyle="#d4e5e9";ctx.font="21px system-ui";
  ctx.fillText("Colony counting laboratory",400,283);
  ctx.font="14px system-ui";ctx.fillText("上傳培養皿照片，或選擇合成示範圖",400,315);
  ctx.textAlign="left";
}
function render(){
  if(!state.loaded||!state.roi){renderEmpty();return;}
  const w=base.width,h=base.height;
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(base,0,0);
  ctx.save();
  ctx.strokeStyle=state.mode==="plate"?"#ffc66b":"#88fff0";
  ctx.lineWidth=Math.max(2,w/450);
  ctx.setLineDash([Math.max(5,w/100),Math.max(4,w/155)]);
  ctx.beginPath();ctx.arc(state.roi.cx,state.roi.cy,state.roi.r,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);
  if(state.mode==="plate"){
    ctx.fillStyle="#ffc66b";
    ctx.beginPath();ctx.arc(state.roi.cx,state.roi.cy,8,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(state.roi.cx+state.roi.r,state.roi.cy,10,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#173b51";ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(state.roi.cx-13,state.roi.cy);ctx.lineTo(state.roi.cx+13,state.roi.cy);
    ctx.moveTo(state.roi.cx,state.roi.cy-13);ctx.lineTo(state.roi.cx,state.roi.cy+13);ctx.stroke();
  }
  if(state.analyzed){
    const ids=$("showIds").checked && state.items.length<=300;
    for(let i=0;i<state.items.length;i++){
      const item=state.items[i],manual=item.source==="manual";
      ctx.strokeStyle=manual?"#88f2ac":"#12d5df";
      ctx.fillStyle=manual?"#88f2ac":"#12d5df";
      ctx.lineWidth=Math.max(1.4,w/550);
      const r=Math.max(5,Math.min(22,Number(item.r)||6));
      ctx.beginPath();ctx.arc(item.x,item.y,r+2,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(item.x,item.y,1.5,0,Math.PI*2);ctx.fill();
      if(ids){
        ctx.font="bold 11px system-ui";ctx.fillText(String(i+1),item.x+r+3,item.y-3);
      }
    }
  }
  ctx.restore();
}
function setMode(mode){
  state.mode=mode;
  for(const button of document.querySelectorAll("[data-mode]")){
    const active=button.dataset.mode===mode;
    button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active));
  }
  $("toolHint").textContent=state.loaded?hints[mode]:"請先載入照片，再進行人工校正。";
  canvas.style.cursor=mode==="inspect"?"default":"crosshair";
  render();
}
function updateCFU(){
  const method=$("cultureMethod").value,n=state.items.length;
  const output=$("cfuValue"),note=$("cfuNote"),range=$("rangeNote");
  if(!state.analyzed){
    output.textContent="—";note.textContent="請先上傳照片並完成菌落計數。";
  }else if(method==="streak"){
    output.textContent="不適用";note.textContent="四區劃線／分離培養缺乏定量接種與稀釋條件，不能換算 CFU/mL。";
  }else if(method!=="quantitative"){
    output.textContent="—";note.textContent="請選擇培養方式。";
  }else{
    const exp=Number($("dilution").value),vol=Number($("volume").value);
    const validExp=$("dilution").value.trim()!==""&&Number.isInteger(exp)&&exp>=-15&&exp<=0;
    const validVol=$("volume").value.trim()!==""&&Number.isFinite(vol)&&vol>0&&vol<=10;
    if(!validExp||!validVol){
      output.textContent="—";note.textContent="請輸入有效的稀釋指數（-15 至 0）及接種體積（mL）。";
    }else{
      const result=n/(vol*Math.pow(10,exp));
      output.textContent=result===0?"0 CFU/mL":result.toExponential(2)+" CFU/mL";
      note.textContent=n+" ÷ ("+vol+" mL × 10^"+exp+") = "+result.toPrecision(4)+" CFU/mL（估計值）";
    }
  }
  if(!state.analyzed){
    range.textContent="教學常見可計數範圍：每皿 30–300 個菌落；實際依課程指定方法及 SOP 判讀。";
  }else if(n===0){
    range.textContent="本圖未辨識到菌落。請確認培養皿範圍、辨識參數與實際影像；零菌落仍涉及偵測極限。";
  }else if(n<30){
    range.textContent="目前少於 30 個菌落；低菌落數估計的不確定度需依適用 SOP 討論。";
  }else if(n>300){
    range.textContent="目前超過 300 個候選菌落，請檢查菌落重疊及是否屬於 TNTC；可計數範圍依 SOP。";
  }else{
    range.textContent="目前在常見的 30–300 個菌落教學參考範圍內；仍需確認接種方法及 SOP。";
  }
}
function refresh(){
  const hasResult=state.analyzed,n=state.items.length;
  $("totalCount").textContent=hasResult?num(n):"—";
  $("autoCount").textContent=hasResult?num(state.autoBaseline):"—";
  const change=n-state.autoBaseline;
  $("correctionCount").textContent=hasResult?(change>0?"+":"")+change:"—";
  $("exportPng").disabled=!hasResult;
  $("exportCsv").disabled=!hasResult;
  updateCFU();
}
function performDetection(){
  if(!state.loaded){status("請先上傳照片。");return;}
  try{
    const options={
      mode:$("contrastMode").value,
      threshold:Number($("sensitivity").value),
      minArea:Number($("minArea").value),
      maxArea:Number($("maxArea").value)
    };
    if(!Number.isFinite(options.maxArea)||options.maxArea<options.minArea){
      status("最大菌落面積必須大於最小菌落面積。");return;
    }
    status("正在分析培養皿內的局部亮度差與連通區域…");
    const image=baseCtx.getImageData(0,0,base.width,base.height);
    const {candidates,diagnostics}=window.WebCFUDetector.detect(image,state.roi,options);
    state.items=candidates.map((item,i)=>({...item,id:i+1}));
    state.nextId=state.items.length+1;
    state.autoBaseline=state.items.length;state.analyzed=true;state.history=[];
    $("undo").disabled=true;
    refresh();render();
    const reference=state.demo?"合成示範設定為 "+state.reference+" 個目標；":"";
    status(reference+"辨識完成："+state.autoBaseline+" 個候選菌落。請核對標記並用新增／刪除功能修正。"+
      (state.autoBaseline===0?" 可調低靈敏度數值或改變菌落明暗模式。":"")+
      (diagnostics.positivePixels>base.width*base.height*.1?" 局部亮度差過大，請檢查光照與閾值。":""));
  }catch(error){
    status("自動辨識失敗："+(error?.message||String(error)));
    console.error(error);
  }
}
function pushUndo(){
  state.history.push({items:state.items.map(i=>({...i})),nextId:state.nextId});
  if(state.history.length>30)state.history.shift();
  $("undo").disabled=false;
}
function inCircle(p){
  const dx=p.x-state.roi.cx,dy=p.y-state.roi.cy;
  return dx*dx+dy*dy<=state.roi.r*state.roi.r;
}
function getPoint(e){
  const rect=canvas.getBoundingClientRect();
  return{x:(e.clientX-rect.left)*canvas.width/rect.width,
         y:(e.clientY-rect.top)*canvas.height/rect.height};
}
function clamp(v,a,b){return Math.min(b,Math.max(a,v));}
function updateROI(p){
  if(state.dragging==="resize"){
    const max=Math.min(state.roi.cx,state.roi.cy,base.width-state.roi.cx,base.height-state.roi.cy);
    state.roi.r=clamp(Math.hypot(p.x-state.roi.cx,p.y-state.roi.cy),30,Math.max(30,max-3));
  }else if(state.dragging==="center"){
    const r=state.roi.r;
    state.roi.cx=clamp(p.x,r+3,base.width-r-3);
    state.roi.cy=clamp(p.y,r+3,base.height-r-3);
  }
  render();
}
canvas.addEventListener("pointerdown",e=>{
  if(!state.loaded||e.button!==0)return;
  const p=getPoint(e);
  if(state.mode==="plate"){
    const handle={x:state.roi.cx+state.roi.r,y:state.roi.cy};
    const dist=Math.hypot(p.x-handle.x,p.y-handle.y);
    state.dragging=dist<Math.max(22,canvas.width*.032)?"resize":"center";
    state.dragMoved=true;
    try{canvas.setPointerCapture(e.pointerId);}catch(_){}
    updateROI(p);
    return;
  }
  if(!state.analyzed||!inCircle(p))return;
  if(state.mode==="add"){
    pushUndo();
    state.items.push({x:p.x,y:p.y,r:5,area:0,source:"manual",id:state.nextId++});
    refresh();render();status("已手動新增 1 個菌落標記，請繼續檢查。");
  }else if(state.mode==="remove"){
    let chosen=-1,best=Infinity;
    for(let i=0;i<state.items.length;i++){
      const q=state.items[i],d=Math.hypot(q.x-p.x,q.y-p.y);
      if(d<best){best=d;chosen=i;}
    }
    const tolerance=Math.max(12,canvas.width*.021);
    if(chosen<0||best>tolerance){
      status("附近沒有可刪除的標記，請點選標記中心。");return;
    }
    pushUndo();state.items.splice(chosen,1);
    refresh();render();status("已刪除 1 個候選菌落標記。");
  }
});
canvas.addEventListener("pointermove",e=>{
  if(!state.dragging)return;
  updateROI(getPoint(e));
});
function finishDrag(){
  if(!state.dragging)return;
  state.dragging=null;
  clearResultsForROI();render();
  status("培養皿圓形範圍已調整。請重新按「開始自動圈選菌落」。");
}
canvas.addEventListener("pointerup",finishDrag);
canvas.addEventListener("pointercancel",finishDrag);
$("undo").addEventListener("click",()=>{
  if(!state.history.length)return;
  const previous=state.history.pop();
  state.items=previous.items;state.nextId=previous.nextId;
  $("undo").disabled=!state.history.length;
  refresh();render();status("已復原上一步人工標記操作。");
});
for(const b of document.querySelectorAll("[data-mode]"))b.addEventListener("click",()=>setMode(b.dataset.mode));
$("showIds").addEventListener("change",render);
for(const id of ["sensitivity","minArea"]){
  $(id).addEventListener("input",()=>{$(id+"Value").textContent=$(id).value;});
}
for(const id of ["cultureMethod","dilution","volume"]){
  $(id).addEventListener("input",updateCFU);$(id).addEventListener("change",updateCFU);
}
$("detect").addEventListener("click",performDetection);
function randomMaker(seed){
  let s=seed>>>0;
  return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};
}
function createDemo(){
  const w=780,h=680,cx=w/2,cy=h/2,r=300,rng=randomMaker(113);
  resetForImage(w,h,"synthetic-colonies",true,72);
  baseCtx.fillStyle="#d9e3e6";baseCtx.fillRect(0,0,w,h);
  baseCtx.fillStyle="#869ba4";baseCtx.beginPath();baseCtx.arc(cx+2,cy+5,r+13,0,Math.PI*2);baseCtx.fill();
  baseCtx.fillStyle="#f5f7f7";baseCtx.beginPath();baseCtx.arc(cx,cy,r+9,0,Math.PI*2);baseCtx.fill();
  const grad=baseCtx.createRadialGradient(cx-80,cy-90,20,cx,cy,r);
  grad.addColorStop(0,"#f3d7b6");grad.addColorStop(.85,"#eac9a9");grad.addColorStop(1,"#d4a984");
  baseCtx.fillStyle=grad;baseCtx.beginPath();baseCtx.arc(cx,cy,r,0,Math.PI*2);baseCtx.fill();
  baseCtx.strokeStyle="#f6e3ce";baseCtx.lineWidth=5;
  baseCtx.beginPath();baseCtx.arc(cx,cy,r-6,0,Math.PI*2);baseCtx.stroke();
  const positions=[];let attempts=0;
  while(positions.length<72&&attempts++<7000){
    const x=cx+(rng()*2-1)*r*.83,y=cy+(rng()*2-1)*r*.83;
    if(Math.hypot(x-cx,y-cy)>r*.81)continue;
    if(positions.some(p=>Math.hypot(p.x-x,p.y-y)<23))continue;
    const radius=3.3+rng()*4.2;
    positions.push({x,y,radius});
  }
  for(const p of positions){
    const cg=baseCtx.createRadialGradient(p.x-.8,p.y-.8,.1,p.x,p.y,p.radius+2);
    cg.addColorStop(0,"#71473b");cg.addColorStop(.7,"#916447");cg.addColorStop(1,"#c99b72");
    baseCtx.fillStyle=cg;baseCtx.beginPath();baseCtx.arc(p.x,p.y,p.radius+2,0,Math.PI*2);baseCtx.fill();
  }
  // Keep plate ROI just inside the strong ring so edge highlights are excluded.
  state.roi={cx,cy,r:r};
  state.reference=positions.length;render();performDetection();
  $("cultureMethod").value="quantitative";updateCFU();
}
$("demo").addEventListener("click",createDemo);
function drawPhoto(img,name){
  const s=Math.min(1,MAX_SIDE/Math.max(img.naturalWidth,img.naturalHeight));
  const w=Math.max(1,Math.round(img.naturalWidth*s)),h=Math.max(1,Math.round(img.naturalHeight*s));
  if(w<60||h<60)throw new Error("照片解析度過低。");
  resetForImage(w,h,name,false,null);
  baseCtx.fillStyle="#f3f3f3";baseCtx.fillRect(0,0,w,h);
  baseCtx.drawImage(img,0,0,w,h);
  render();performDetection();
}
$("photo").addEventListener("change",async()=>{
  const file=$("photo").files?.[0];if(!file)return;
  if(file.size>MAX_BYTES){status("照片檔案超過 30 MB。請先縮小圖片再上傳。");return;}
  if(!file.type.startsWith("image/") && !/\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name)){
    status("請選擇影像檔案。");return;
  }
  const url=URL.createObjectURL(file),img=new Image();
  try{
    await new Promise((resolve,reject)=>{
      img.onload=resolve;img.onerror=()=>reject(new Error("瀏覽器無法解析這個影像格式。請轉成 JPG 或 PNG。"));
      img.src=url;
    });
    drawPhoto(img,file.name);
  }catch(error){status("讀取失敗："+(error?.message||error));}
  finally{URL.revokeObjectURL(url);}
});
function download(blob,filename){
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
$("exportPng").addEventListener("click",()=>{
  if(!state.analyzed)return;
  canvas.toBlob(blob=>{
    if(!blob){status("PNG 匯出失敗。");return;}
    download(blob,"web-cfu-lite-annotated.png");
  },"image/png");
});
$("exportCsv").addEventListener("click",()=>{
  if(!state.analyzed)return;
  const culture=$("cultureMethod").value,exp=$("dilution").value,vol=$("volume").value;
  const cfu=$("cfuValue").textContent;
  const rows=[["id","source","x_px","y_px","area_px2","total_colonies","culture_method","dilution_exponent","volume_mL","cfu_per_mL"].join(",")];
  for(let i=0;i<state.items.length;i++){
    const p=state.items[i];
    rows.push([i+1,p.source,p.x.toFixed(2),p.y.toFixed(2),p.area||"",state.items.length,
      culture,exp,vol,culture==="quantitative"&&Number.isFinite(Number(cfu.split(" ")[0]))?cfu.split(" ")[0]:""].join(","));
  }
  if(!state.items.length)rows.push(["","","","","","0",culture,exp,vol,""].join(","));
  download(new Blob(["\ufeff"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"}),"web-cfu-lite-colony-data.csv");
});
renderEmpty();updateCFU();
})();