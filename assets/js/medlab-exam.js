(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  if (!$("exam-index")) return;
  const MOEX_SEARCH = "https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx";
  const DATASET = "https://wwwc.moex.gov.tw/main/Exam/wHandExamQandA_CSV.ashx";
  const SUBJECTS = [
    "臨床生理學與病理學",
    "臨床血液學與血庫學",
    "醫學分子檢驗學與臨床鏡檢學（包括寄生蟲學）",
    "微生物學與臨床微生物學（包括細菌與黴菌）",
    "生物化學與臨床生化學",
    "臨床血清免疫學與臨床病毒學"
  ];
  let entries = [];
  let shown = 40;
  let loadedOriginal = false;
  const status = $("exam-source-status");
  const setStatus = (msg, error=false) => { status.textContent=msg; status.classList.toggle("is-error",error); };
  const clean = value => String(value || "").trim();
  const sourceUrl = value => {
    const url = clean(value);
    try {
      const u = new URL(url,"https://wwwq.moex.gov.tw");
      if (u.protocol !== "https:" && u.protocol !== "http:") return "";
      if (!(u.hostname==="moex.gov.tw" || u.hostname.endsWith(".moex.gov.tw"))) return "";
      return u.href;
    } catch (_) { return ""; }
  };
  const yearNumber = x => {
    const m = clean(x).match(/\d{2,4}/);
    if (!m) return 0;
    const v=Number(m[0]); return v>1911?v-1911:v;
  };
  const pick = (row, ...keys) => { for (const key of keys) if (clean(row[key])) return clean(row[key]); return ""; };
  const normalized = row => {
    const specialty=pick(row,"類科組別","考試及等別","類科名稱","類科","組別","類別","類科組別名稱");
    if (!specialty.includes("醫事檢驗師") && !specialty.includes("醫事檢驗")) return null;
    const year=yearNumber(pick(row,"考試年度","年度","考試年"));
    const subject=pick(row,"科目全名","科目名稱","考試科目","科目");
    const question=sourceUrl(pick(row,"試題網址","考畢試題網址","試題連結"));
    const answer=sourceUrl(pick(row,"測驗式試題答案網址","答案網址","測驗題標準答案網址","標準答案網址"));
    const exam=pick(row,"考試名稱","考試及等別","考試簡稱");
    if (!(year>=90 && year<=200) || !subject || !(question || answer)) return null;
    return {year,subject,question,answer,exam,session:pick(row,"節次","考試節次","考試次別"),type:pick(row,"試題型態","題型"),notes:pick(row,"備註")};
  };
  const uniq = source => {
    const map=new Map();
    for (const raw of source) {
      const row={...raw,year:yearNumber(raw.year),question:sourceUrl(raw.question),answer:sourceUrl(raw.answer),correction:sourceUrl(raw.correction)};
      if (!row.year || !row.subject || !(row.question || row.answer)) continue;
      map.set([row.year,row.subject,row.exam,row.session,row.question].join("|"),row);
    }
    return Array.from(map.values()).sort((a,b)=>b.year-a.year || clean(a.exam).localeCompare(clean(b.exam),"zh-Hant") || clean(a.subject).localeCompare(clean(b.subject),"zh-Hant"));
  };
  function fillFilters() {
    const year=$("exam-year"), old=year.value;
    const years=[...new Set(entries.map(x=>x.year))].sort((a,b)=>b-a);
    year.replaceChildren(new Option("全部年度 / All years",""));
    for(const y of years) year.add(new Option("民國 "+y+" 年（"+(y+1911)+"）",String(y)));
    if(years.includes(Number(old)))year.value=old;
    const subject=$("exam-subject");
    if(subject.options.length<2){
      subject.replaceChildren(new Option("全部六大考科 / All subjects",""));
      for(const s of SUBJECTS)subject.add(new Option(s,s));
    }
  }
  function extLink(url, label) {
    const a=document.createElement("a");
    a.href=url; a.textContent=label;a.target="_blank";a.rel="noopener noreferrer external";
    a.className="exam-pdf-link";return a;
  }
  function render() {
    const year=Number($("exam-year").value), subject=$("exam-subject").value,
      term=$("exam-keyword").value.trim().toLowerCase();
    const filtered=entries.filter(x=>(!year || x.year===year) && (!subject || x.subject===subject)
      && (!term || [x.subject,x.exam,x.session,x.notes].join(" ").toLowerCase().includes(term)));
    $("exam-match-count").textContent=filtered.length+" 份符合篩選的試卷紀錄 · "+filtered.length+" matching records";
    const container=$("exam-results");container.replaceChildren();
    if(!filtered.length){
      const p=document.createElement("p");p.className="exam-empty";
      p.textContent="目前沒有符合條件的本機索引紀錄。可重新選擇條件、匯入考選部 CSV，或直接前往官方考畢試題查詢平台。";
      container.append(p);
    }
    for(const record of filtered.slice(0,shown)){
      const article=document.createElement("article");article.className="exam-result";
      const head=document.createElement("div");head.className="exam-result-head";
      const badge=document.createElement("span");badge.className="exam-result-year";
      badge.textContent="民國 "+record.year+" 年";
      const session=document.createElement("span");session.className="exam-result-session";
      session.textContent=record.session || (record.exam||"").match(/第[一二三四]次/)?.[0] || "考選部";
      head.append(badge,session);
      const title=document.createElement("h3");title.textContent=record.subject;
      const subtitle=document.createElement("p");subtitle.className="exam-result-source";
      subtitle.textContent=record.exam || "考選部醫事檢驗師國家考試";
      const links=document.createElement("div");links.className="exam-result-links";
      if(record.question)links.append(extLink(record.question,"試題 PDF ↗"));
      if(record.answer)links.append(extLink(record.answer,"標準答案 PDF ↗"));
      if(record.correction)links.append(extLink(record.correction,"更正答案 PDF ↗"));
      article.append(head,title,subtitle,links);
      container.append(article);
    }
    $("exam-more").hidden=filtered.length<=shown;
  }
  function parseCSVStream(text, onRow) {
    let quoted=false, cell="", row=[], header=null;
    const emit=()=>{
      row.push(cell);cell="";
      if(row.length===1 && !row[0].trim()) {row=[];return;}
      if(!header)header=row.map(x=>x.replace(/^\ufeff/,"").trim().replace(/\s+/g,""));
      else{
        const object={};header.forEach((key,i)=>{object[key]=row[i]||"";});onRow(object);
      }
      row=[];
    };
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(c==='"'){
        if(quoted && text[i+1]==='"'){cell+='"';i++;}
        else quoted=!quoted;
      }else if(c===','&&!quoted){row.push(cell);cell="";}
      else if((c==='\n'||c==='\r')&&!quoted){emit();if(c==='\r'&&text[i+1]==='\n')i++;}
      else cell+=c;
    }
    if(cell||row.length)emit();
    return header;
  }
  async function importCSV(file){
    if(!file)return;
    setStatus("正在讀取 CSV 並篩選醫事檢驗師… / Processing CSV…");
    await new Promise(resolve=>setTimeout(resolve,25));
    try{
      const buffer=await file.arrayBuffer();
      if(buffer.byteLength>65_000_000)throw Error("檔案過大，請確認為考選部開放 CSV。");
      let str=new TextDecoder("utf-8",{fatal:false}).decode(buffer);
      if(!str.slice(0,1200).includes("考試年度") && !str.slice(0,1200).includes("類科組別")){
        str=new TextDecoder("big5",{fatal:false}).decode(buffer);
      }
      const imported=[];
      const columns=parseCSVStream(str,row=>{const x=normalized(row);if(x)imported.push(x);});
      if(!columns?.some(x=>x.includes("考試")) || imported.length<1)throw Error("找不到可辨識的醫事檢驗師試題紀錄。請使用考選部資料集 170565 原始 CSV。");
      entries=uniq([...entries,...imported]);shown=40;fillFilters();render();
      setStatus("已匯入 "+imported.length+" 筆符合條件的官方試題連結資料；全部篩選於本機瀏覽器執行，不會上傳 CSV。");
    }catch(err){setStatus("匯入失敗："+err.message,true);}
  }
  ["exam-year","exam-subject","exam-keyword"].forEach(id=>$(id).addEventListener(id==="exam-keyword"?"input":"change",()=>{shown=40;render();}));
  $("exam-more").addEventListener("click",()=>{shown+=60;render();});
  $("exam-import").addEventListener("change",e=>importCSV(e.target.files[0]));
  $("exam-reset").addEventListener("click",()=>{$("exam-year").value="";$("exam-subject").value="";$("exam-keyword").value="";shown=40;render();});
  fetch("/assets/data/moex_medlab.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json();}).then(data=>{
    entries=uniq(data.entries||[]);fillFilters();render();
    setStatus("已載入 "+entries.length+" 筆經官方頁面核對的試題／答案連結（目前預載民國 114、115 年部分考次）。其他年度可由考選部 CSV 匯入，或直接至官方查詢平台。");
  }).catch(()=>{fillFilters();render();setStatus("本機預載索引暫時無法取得，請使用考選部官方連結或匯入 CSV。",true);});

  // Original practice bank, never presented as official examination questions.
  const quizBox=$("practice-app");
  let questions=[],pool=[],step=0,score=0,answered=false,wrongIds=new Set();
  const STORAGE_KEY="bioflumen-mls-practice-wrong-v1";
  try{wrongIds=new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"));}catch(_){}
  const persist=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify([...wrongIds]));}catch(_){}};
  const wrongCount=()=>$("practice-wrong-count").textContent="錯題紀錄："+wrongIds.size+" 題（僅儲存於本機瀏覽器）";
  function renderQuestion(){
    const area=$("practice-question");area.replaceChildren();wrongCount();
    if(step>=pool.length){
      const heading=document.createElement("h3");heading.textContent="測驗完成：答對 "+score+" / "+pool.length+" 題";
      const note=document.createElement("p");note.textContent="答錯題目已記錄於此裝置，可選擇「只複習錯題」再次練習。題目為本站原創教學題，並非考選部試題。";
      area.append(heading,note);$("practice-next").hidden=true;return;
    }
    answered=false;const q=pool[step];$("practice-next").hidden=true;
    const h=document.createElement("h3");h.textContent="第 "+(step+1)+" / "+pool.length+" 題｜"+q.subject;
    const stem=document.createElement("p");stem.className="practice-stem";stem.textContent=q.stem;
    const options=document.createElement("div");options.className="practice-options";
    const feedback=document.createElement("div");feedback.className="practice-feedback";feedback.setAttribute("aria-live","polite");
    for(let i=0;i<q.choices.length;i++){
      const b=document.createElement("button");b.type="button";b.className="practice-choice";b.textContent=String.fromCharCode(65+i)+". "+q.choices[i];
      b.addEventListener("click",()=>{
        if(answered)return;answered=true;
        const right=i===q.correct;
        if(right){score++;wrongIds.delete(q.id);}else wrongIds.add(q.id);
        persist();wrongCount();
        [...options.children].forEach((node,j)=>{node.disabled=true;if(j===q.correct)node.classList.add("is-correct");else if(j===i&&!right)node.classList.add("is-wrong");});
        feedback.textContent=(right?"答對！":"答錯，正確答案是 "+String.fromCharCode(65+q.correct)+"。")+" "+q.explanation;
        $("practice-next").hidden=false;
      });
      options.append(b);
    }
    area.append(h,stem,options,feedback);
  }
  function startQuiz(onlyWrong){
    const selected=$("practice-subject").value;
    pool=questions.filter(q=>(!selected||q.subject===selected)&&(!onlyWrong||wrongIds.has(q.id)));
    if(!pool.length){
      $("practice-question").textContent=onlyWrong?"目前這個科目沒有錯題紀錄。":"題庫尚未載入或沒有符合的題目。";
      $("practice-next").hidden=true;return;
    }
    pool=pool.sort(()=>Math.random()-.5).slice(0,12);step=0;score=0;renderQuestion();
  }
  $("practice-start").addEventListener("click",()=>startQuiz(false));
  $("practice-review").addEventListener("click",()=>startQuiz(true));
  $("practice-next").addEventListener("click",()=>{step++;renderQuestion();});
  $("practice-clear").addEventListener("click",()=>{
    if(!window.confirm("確定清除本裝置上的錯題紀錄？"))return;
    wrongIds.clear();persist();wrongCount();
  });
  fetch("/assets/data/mls_practice.json").then(r=>r.json()).then(data=>{
    questions=Array.isArray(data.questions)?data.questions:[];
    const select=$("practice-subject");select.add(new Option("全部考科 / All subjects",""));
    for(const s of SUBJECTS)select.add(new Option(s,s));
    wrongCount();
    quizBox.classList.remove("practice-loading");
    $("practice-question").textContent="原創題庫已載入："+questions.length+" 題，請選考科開始練習。";
  }).catch(()=>{$("practice-question").textContent="原創練習題暫時無法載入，請稍後再試。";});
})();
