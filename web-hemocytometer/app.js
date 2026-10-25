import {MODES,regions,counted,groupSummary} from "./math.js?v=1";
const $=id=>document.getElementById(id);
const canvas=$("imageCanvas"),ctx=canvas.getContext("2d");
const source=document.createElement("canvas"),sx=source.getContext("2d",{willReadFrequently:true});
const S={ready:false,name:"",roi:null,tool:"roi",drag:null,points:[],fields:[],saved:false,busy:false,mode:"culture",worker:null,request:0};
const fmt=new Intl.NumberFormat("zh-TW",{maximumFractionDigits:2});
function status(t){$("status").textContent=t;}
function progress(v){$("progress").hidden=false;$("progress").value=v;}
function params(){return {d:Number($("dilution").value),h:Number($("depth").value)};}
function inside(){return S.roi?S.points.filter(p=>counted(p,S.roi,S.mode)):[];}
function update(){
 const n=S.roi?inside().length:null;
 $("fieldCount").textContent=n===null?"—":fmt.format(n);
 $("excludedCount").textContent=n===null?"—":fmt.format(S.points.length-n);
 $("fieldArea").textContent=S.roi?MODES[S.mode].area.toFixed(2)+" mm²":"—";
 $("detect").disabled=!S.roi||S.busy||S.saved;
 $("clearPoints").disabled=!S.roi||S.busy||S.saved||!S.points.length;
 $("saveField").disabled=!S.roi||S.busy||S.saved||!S.points.length;
 $("exportPNG").disabled=!S.ready;
 $("undoField").disabled=!S.fields.length||S.busy;
 $("clearSession").disabled=!S.fields.length||S.busy;
 $("exportCSV").disabled=!S.fields.length||S.busy;
 $("demo").disabled=S.busy;
 const {d,h}=params(),valid=d>0&&h>0;
 const total=valid?groupSummary(S.fields,d,h):null;
 $("totalCount").textContent=fmt.format(S.fields.reduce((a,f)=>a+f.count,0));
 $("totalFields").textContent=String(S.fields.length);
 $("cellsUL").textContent=total&&total.perUL!==null?fmt.format(total.perUL):"—";
 $("cellsML").textContent=total&&total.perML!==null?fmt.format(total.perML):"—";
 $("formula").textContent=total&&total.area>0?
 "總細胞 "+total.count+" × 稀釋倍率 "+d+" ÷（面積 "+fmt.format(total.area)+" mm² × 深度 "+h+" mm）= "+fmt.format(total.perUL)+" cells/µL；× 1000 = "+fmt.format(total.perML)+" cells/mL。":
 "濃度公式：總細胞數 × 稀釋倍率 ÷（總計數面積 × 計數室深度）。";
 const rows=$("fieldRows");rows.replaceChildren();
 if(!S.fields.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=4;td.textContent="尚未加入計數視野";tr.append(td);rows.append(tr);}
 else S.fields.forEach((f,i)=>{const tr=document.createElement("tr");[i+1,f.count,f.area.toFixed(2),f.name].forEach(v=>{const td=document.createElement("td");td.textContent=String(v);tr.append(td);});rows.append(tr);});
}
function boundary(b){
 ctx.lineWidth=2;ctx.strokeStyle="#12dab0";
 ctx.beginPath();ctx.moveTo(b.x+b.w,b.y);ctx.lineTo(b.x,b.y);ctx.lineTo(b.x,b.y+b.h);ctx.stroke();
 ctx.strokeStyle="#f07b7b";ctx.setLineDash([7,5]);
 ctx.beginPath();ctx.moveTo(b.x+b.w,b.y);ctx.lineTo(b.x+b.w,b.y+b.h);ctx.lineTo(b.x,b.y+b.h);ctx.stroke();
 ctx.setLineDash([]);
}
function render(){
 if(!S.ready){
  canvas.width=900;canvas.height=600;ctx.fillStyle="#19394b";ctx.fillRect(0,0,900,600);
  ctx.fillStyle="#d1e3e7";ctx.textAlign="center";ctx.font="22px system-ui";
  ctx.fillText("Hemocytometer microscopy view",450,288);ctx.font="15px system-ui";
  ctx.fillText("請上傳圖片或載入示範",450,322);ctx.textAlign="left";return;
 }
 if(canvas.width!==source.width)canvas.width=source.width;
 if(canvas.height!==source.height)canvas.height=source.height;
 ctx.drawImage(source,0,0);
 if(S.roi){
  const r=S.roi;ctx.fillStyle="rgba(244,211,102,.1)";ctx.fillRect(r.x,r.y,r.w,r.h);
  if(S.mode==="rbc"){
   for(let a=0;a<5;a++)for(let b=0;b<5;b++)
    if(((a===0||a===4)&&(b===0||b===4))||(a===2&&b===2)){
     ctx.fillStyle="rgba(245,205,62,.21)";
     ctx.fillRect(r.x+b*r.w/5,r.y+a*r.h/5,r.w/5,r.h/5);
    }
   ctx.strokeStyle="#e7e6e0";ctx.lineWidth=1;ctx.setLineDash([4,4]);
   for(let k=1;k<5;k++){
    ctx.beginPath();ctx.moveTo(r.x+k*r.w/5,r.y);ctx.lineTo(r.x+k*r.w/5,r.y+r.h);ctx.stroke();
    ctx.beginPath();ctx.moveTo(r.x,r.y+k*r.h/5);ctx.lineTo(r.x+r.w,r.y+k*r.h/5);ctx.stroke();
   }ctx.setLineDash([]);
  }
  ctx.strokeStyle="#f7cc68";ctx.lineWidth=2;ctx.strokeRect(r.x,r.y,r.w,r.h);
  regions(r,S.mode).forEach(boundary);
  ctx.font="bold 15px system-ui";ctx.fillStyle="#ffd46d";
  ctx.fillText(S.mode==="rbc"?"RBC｜五個指定中格":"1 mm² 大格",Math.max(6,r.x),Math.max(18,r.y-10));
 }
 if(S.drag){
  const p=S.drag,b=p.end||p;ctx.fillStyle="rgba(20,200,174,.14)";
  const x=Math.min(p.x,b.x),y=Math.min(p.y,b.y),w=Math.abs(p.x-b.x),h=Math.abs(p.y-b.y);
  ctx.fillRect(x,y,w,h);ctx.strokeStyle="#14ceb3";ctx.lineWidth=3;
  ctx.setLineDash([7,5]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);
 }
 let number=0;
 S.points.forEach(p=>{
  const inc=S.roi&&counted(p,S.roi,S.mode),color=inc?"#08c99c":"#f06370";
  ctx.fillStyle=inc?"rgba(6,200,142,.18)":"rgba(239,90,90,.15)";
  ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.beginPath();
  ctx.arc(p.x,p.y,Math.max(4,p.r),0,2*Math.PI);ctx.fill();ctx.stroke();
  if(inc&&S.points.length<=150){ctx.fillStyle="#fff";ctx.font="bold 11px system-ui";ctx.fillText(String(++number),p.x+5,p.y-6);}
 });
}
function setTool(t){S.tool=t;[["roi","roiTool"],["add","addTool"],["remove","removeTool"]].forEach(([name,id])=>$(id).classList.toggle("active",name===t));}
function coords(e){const r=canvas.getBoundingClientRect();return {
 x:Math.max(0,Math.min(canvas.width,(e.clientX-r.left)*canvas.width/r.width)),
 y:Math.max(0,Math.min(canvas.height,(e.clientY-r.top)*canvas.height/r.height))
};}
canvas.addEventListener("pointerdown",e=>{
 if(!S.ready||S.busy||S.saved)return;
 if(S.tool==="roi"){S.drag={...coords(e)};S.drag.end=S.drag;canvas.setPointerCapture(e.pointerId);}
});
canvas.addEventListener("pointermove",e=>{if(S.drag){S.drag.end=coords(e);render();}});
canvas.addEventListener("pointercancel",()=>{S.drag=null;render();});
canvas.addEventListener("pointerup",e=>{
 if(!S.ready||S.busy||S.saved)return;
 const p=coords(e);
 if(S.tool==="roi"&&S.drag){
  const a=S.drag;S.drag=null;const x=Math.min(a.x,p.x),y=Math.min(a.y,p.y),w=Math.abs(a.x-p.x),h=Math.abs(a.y-p.y);
  if(w<40||h<40){status("框選範圍太小；請選擇完整的大格。");render();return;}
  S.roi={x,y,w,h};S.points=[];status(w/h<.8||w/h>1.25?
  "格線框的長寬比偏離 1:1，請確認是否選擇完整的正方形大格。":
  "格線已選定。可自動偵測或手動點選細胞。");
  update();render();return;
 }
 if(!S.roi)return;
 if(S.tool==="add"){
  S.points.push({x:p.x,y:p.y,r:5.5,method:"manual"});status("已新增人工候選標記。");
 }else if(S.tool==="remove"){
  let target=-1,dist=Infinity;S.points.forEach((o,i)=>{const d=Math.hypot(o.x-p.x,o.y-p.y);if(d<dist){dist=d;target=i;}});
  if(target>=0&&dist<=Math.max(18,S.points[target].r+10)){S.points.splice(target,1);status("已刪除候選細胞標記。");}
  else status("請點選候選細胞圓圈附近以刪除。");
 }else return;
 update();render();
});
function initializeImage(w,h,name){S.ready=true;S.name=name;S.roi=null;S.points=[];S.saved=false;source.width=w;source.height=h;update();}
function demo(){
 const W=800,H=700;initializeImage(W,H,"Synthetic grid demo");
 let seed=83;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 sx.fillStyle="#e1e8d9";sx.fillRect(0,0,W,H);
 for(let i=0;i<2000;i++){sx.fillStyle=rand()>.5?"#d7ddd1":"#edf2e4";sx.fillRect(rand()*W,rand()*H,2,2);}
 const R={x:140,y:80,w:520,h:520};
 sx.strokeStyle="#88978f";sx.lineWidth=2;sx.strokeRect(R.x,R.y,R.w,R.h);
 for(let j=1;j<5;j++){const x=R.x+j*R.w/5,y=R.y+j*R.h/5;
  sx.strokeStyle="#a6b0a6";sx.lineWidth=1.5;
  sx.beginPath();sx.moveTo(x,R.y);sx.lineTo(x,R.y+R.h);sx.stroke();
  sx.beginPath();sx.moveTo(R.x,y);sx.lineTo(R.x+R.w,y);sx.stroke();
 }
 for(let k=0;k<130;k++){
  const x=R.x+8+rand()*(R.w-16),y=R.y+8+rand()*(R.h-16),r=5+rand()*2;
  sx.fillStyle="#8d8c9e";sx.beginPath();sx.arc(x,y,r,0,2*Math.PI);sx.fill();
  sx.fillStyle="#f0ded9";sx.beginPath();sx.arc(x,y,r-1.8,0,2*Math.PI);sx.fill();
 }
 S.roi=R;update();render();
 status("已載入合成 Neubauer 影像，框選範圍已示範設定。按「自動圈選候選細胞」開始，或切換人工計數。");
}
async function photo(file){
 if(!file)return;if(file.size>22*1048576){status("檔案超過 22 MB，請先縮小圖片。");return;}
 const url=URL.createObjectURL(file),img=new Image();
 try{
  await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(Error("無法解碼圖片"));img.src=url;});
  const scale=Math.min(1,1150/Math.max(img.naturalWidth,img.naturalHeight));
  const w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);
  initializeImage(w,h,file.name);sx.drawImage(img,0,0,w,h);render();
  status("已載入照片。請拖曳框選完整 1 × 1 mm 計數大格。");
 }catch(e){status("圖片載入失敗："+e.message);}finally{URL.revokeObjectURL(url);}
}
function crop(){
 const r=S.roi,pad=24,x=Math.max(0,Math.floor(r.x-pad)),y=Math.max(0,Math.floor(r.y-pad));
 const w=Math.min(source.width-x,Math.ceil(r.x+r.w+pad)-x);
 const h=Math.min(source.height-y,Math.ceil(r.y+r.h+pad)-y);
 const rgba=sx.getImageData(x,y,w,h).data,gray=new Uint8Array(w*h);
 for(let p=0,i=0;p<gray.length;p++,i+=4)gray[p]=(77*rgba[i]+150*rgba[i+1]+29*rgba[i+2])>>>8;
 return {x,y,w,h,pixels:gray.buffer};
}
async function detect(){
 if(!S.roi||S.busy||S.saved)return;
 const min=Number($("minArea").value),max=Number($("maxArea").value);
 if(!(min>=2&&max>min)){status("請檢查細胞最小及最大面積設定。");return;}
 const c=crop();S.busy=true;update();progress(5);const id=++S.request;
 S.worker??=new Worker("./worker.js?v=1");
 try{
  const data=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{S.worker.terminate();S.worker=null;reject(Error("OpenCV 分析逾時，請用手動計數或桌面瀏覽器。"));},150000);
   S.worker.onmessage=({data})=>{
    if(data.id&&data.id!==id)return;
    if(data.kind==="status"){status(data.message);progress(45);}
    if(data.kind==="result"){clearTimeout(timer);resolve(data.result);}
    if(data.kind==="error"){clearTimeout(timer);reject(Error(data.message));}
   };
   S.worker.onerror=e=>{clearTimeout(timer);reject(Error(e.message||"分析程序錯誤"));};
   S.worker.postMessage({kind:"detect",id,pixels:c.pixels,width:c.w,height:c.h,minArea:min,maxArea:max,
    threshold:Number($("threshold").value),polarity:$("polarity").value},[c.pixels]);
  });
  S.points=data.cells.map(p=>({x:p.x+c.x,y:p.y+c.y,r:p.r,method:"opencv"}));
  progress(100);setTool("remove");
  status("偵測 "+data.rawCount+" 個候選物件，目前計入 "+inside().length+" 個。請人工確認及修正後加入總計。"+
   (data.limited?"候選數過多，只顯示前 1500 個。":""));
 }catch(e){progress(0);status("自動偵測失敗："+e.message+"。仍可切換「增加細胞」手動計數。");}
 finally{S.busy=false;update();render();}
}
function save(){
 if(!S.roi||S.saved||!S.points.length)return;
 const f={count:inside().length,area:MODES[S.mode].area,name:S.name,mode:S.mode};
 S.fields.push(f);S.saved=true;update();status("已加入第 "+S.fields.length+" 個視野，納入 "+f.count+" 個細胞。上傳下一張照片可繼續累計。");
}
function download(blob,name){
 const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2500);
}
function csv(){
 const {d,h}=params();if(!(d>0&&h>0)){status("請輸入有效的稀釋倍率與計數室深度。");return;}
 const s=groupSummary(S.fields,d,h),rows=["view,mode,count,area_mm2,source"];
 const quote=t=>'"'+String(t).replaceAll('"','""')+'"';
 S.fields.forEach((f,i)=>rows.push([i+1,f.mode,f.count,f.area,quote(f.name)].join(",")));
 rows.push("total_cells,"+s.count,"total_area_mm2,"+s.area,"dilution,"+d,"depth_mm,"+h,
 "cells_per_uL,"+s.perUL,"cells_per_mL,"+s.perML,"disclaimer,Educational estimation; verify manually.");
 download(new Blob(["\ufeff",rows.join("\r\n")],{type:"text/csv;charset=utf-8"}),"web-hemocytometer.csv");
}
$("demo").addEventListener("click",demo);
$("photo").addEventListener("change",e=>photo(e.target.files?.[0]));
$("detect").addEventListener("click",detect);
$("roiTool").addEventListener("click",()=>setTool("roi"));
$("addTool").addEventListener("click",()=>setTool("add"));
$("removeTool").addEventListener("click",()=>setTool("remove"));
$("saveField").addEventListener("click",save);
$("clearPoints").addEventListener("click",()=>{S.points=[];update();render();status("已清除候選標記。");});
$("exportCSV").addEventListener("click",csv);
$("exportPNG").addEventListener("click",()=>{
 if(!S.ready)return;canvas.toBlob(b=>{if(b)download(b,"web-hemocytometer-overlay.png");},"image/png");
});
$("undoField").addEventListener("click",()=>{S.fields.pop();S.saved=false;update();status("已移除最後一個視野，可修改目前標記並重新加入。");});
$("clearSession").addEventListener("click",()=>{
 if(!confirm("確定清空所有已加入視野？"))return;
 S.fields=[];S.saved=false;update();status("已清空本次計數統計。");
});
$("preset").addEventListener("change",e=>{
 if(S.fields.length&&!confirm("切換計數模式會清空已累計視野，確定繼續？")){e.target.value=S.mode;return;}
 S.mode=e.target.value;S.fields=[];S.points=[];S.saved=false;
 $("dilution").value=MODES[S.mode].dilution;
 $("presetHelp").textContent=MODES[S.mode].guide;
 update();render();status("已切換至 "+MODES[S.mode].label+"，請重新進行細胞標記。");
});
["dilution","depth"].forEach(id=>$(id).addEventListener("input",update));
$("presetHelp").textContent=MODES[S.mode].guide;update();render();
