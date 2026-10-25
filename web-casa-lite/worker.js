/* Web-CASA Lite · local-only Pyodide processing worker */
const PYODIDE_VERSION = "0.29.5";
const CDN = "https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/";
let pyodide;
let ready = false;
async function initialize() {
  if (ready) return;
  postMessage({ type: "status", text: "載入 Pyodide Python 執行環境…" });
  importScripts(CDN + "pyodide.js");
  pyodide = await loadPyodide({ indexURL: CDN });
  postMessage({ type: "status", text: "載入 NumPy、SciPy、OpenCV-Python；第一次開啟需下載套件…" });
  await pyodide.loadPackage(["numpy", "scipy", "opencv-python"]);
  postMessage({ type: "status", text: "載入精子影像分析演算法…" });
  const res = await fetch("./analysis.py", { cache: "no-cache" });
  if (!res.ok) throw new Error("無法讀取 analysis.py (" + res.status + ")");
  await pyodide.runPythonAsync(await res.text());
  ready = true;
}
onmessage = async ({ data }) => {
  if (data.type !== "analyze") return;
  try {
    await initialize();
    postMessage({ type: "status", text: "Python 執行影像偵測、物件追蹤與 CASA 計算…" });
    pyodide.FS.writeFile("/tmp/webcasa_frames.bin", new Uint8Array(data.buffer));
    const args = {
      width: data.width, height: data.height, frames: data.frames,
      times: data.times, scale: data.scale, jump: data.jump, contrast: data.contrast
    };
    pyodide.globals.set("webcasa_args_json", JSON.stringify(args));
    const json = await pyodide.runPythonAsync("analyze_from_file('/tmp/webcasa_frames.bin', webcasa_args_json)");
    const result = JSON.parse(json);
    pyodide.FS.unlink("/tmp/webcasa_frames.bin");
    postMessage({ type: "result", result });
  } catch (error) {
    try { pyodide?.FS.unlink("/tmp/webcasa_frames.bin"); } catch (_) {}
    postMessage({ type: "error", message: (error?.message || String(error)).slice(0, 1100) });
  }
};