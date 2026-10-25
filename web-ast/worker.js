/* Isolated local worker; no network, models or Python runtimes required. */
importScripts("./engine.js");
self.onmessage=({data})=>{
  if(data?.type!=="analyze")return;
  try{
    const result=self.WebASTEngine.analyze(new Uint8ClampedArray(data.buffer),data.width,data.height,data.settings);
    self.postMessage({type:"result",result});
  }catch(e){self.postMessage({type:"error",message:e?.message||String(e)});}
};