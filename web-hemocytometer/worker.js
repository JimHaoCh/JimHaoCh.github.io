/* Web-Hemocytometer v0.1: Pyodide/OpenCV worker. Pixel data stays on-device. */
const PYODIDE_CDN="https://cdn.jsdelivr.net/pyodide/v0.29.5/full/";
let py=null;
let initPromise=null;
async function init(){
 if(initPromise)return initPromise;
 initPromise=(async()=>{
  postMessage({kind:"status",message:"首次分析：下載 Pyodide 與 OpenCV-Python …"});
  importScripts(PYODIDE_CDN+"pyodide.js");
  py=await loadPyodide({indexURL:PYODIDE_CDN});
  await py.loadPackage(["numpy","opencv-python"]);
  const script=await fetch("./analysis.py",{cache:"no-store"});
  if(!script.ok)throw Error("無法載入 Python 影像分析檔。");
  await py.runPythonAsync(await script.text());
  postMessage({kind:"status",message:"影像分析引擎已就緒。"});
 })();
 try{await initPromise;}catch(e){initPromise=null;throw e;}
}
onmessage=async ({data})=>{
 if(data?.kind!=="detect")return;
 try{
  await init();
  py.FS.writeFile("/tmp/hemo-gray.bin",new Uint8Array(data.pixels));
  py.globals.set("hemo_options",JSON.stringify({
   width:data.width,height:data.height,threshold:data.threshold,
   minArea:data.minArea,maxArea:data.maxArea,polarity:data.polarity
  }));
  const response=await py.runPythonAsync("detect_from_file('/tmp/hemo-gray.bin', hemo_options)");
  py.FS.unlink("/tmp/hemo-gray.bin");
  postMessage({kind:"result",id:data.id,result:JSON.parse(response)});
 }catch(e){
  try{py?.FS.unlink("/tmp/hemo-gray.bin");}catch(_){}
  postMessage({kind:"error",id:data.id,message:String(e?.message||e).slice(0,700)});
 }
};
