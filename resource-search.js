/* Cross-category search for Bioflumen & Xensor Lab.
   Standalone, no external JavaScript, no remote AI, no tracking and no account. */
(() => {
  "use strict";
  const GROUPS = [
    ["微流體", "微流道", "微流控", "微流", "microfluidics", "microfluidic", "microchannel", "microfluid"],
    ["壓降", "壓損", "流阻", "水力阻力", "壓差", "pressure drop", "hydraulic resistance", "flow resistance"],
    ["雷諾", "reynolds", "reynolds number", "層流", "laminar"],
    ["液滴", "droplet", "滴液", "微液滴", "乳化", "emulsion"],
    ["擴散", "diffusion", "混合", "mixing", "mixers"],
    ["白血球", "血球", "白血球分類", "wbc", "leukocyte", "blood cell", "hematology", "血液學"],
    ["菌落", "菌落計數", "細菌計數", "cfu", "colony", "colonies", "colony counting"],
    ["微生物", "細菌", "菌種", "病原菌", "microbiology", "bacteria", "bacterial"],
    ["藥敏", "抗藥性", "抗生素感受性", "ast", "antimicrobial susceptibility", "antibiotic resistance", "mic"],
    ["革蘭氏", "革蘭", "gram stain", "gram staining", "gram"],
    ["細胞計數", "cell counting", "counting chamber", "hemocytometer", "hemocytometre", "計數盤"],
    ["細胞存活率", "trypan blue", "viability", "台盼藍", "細胞活性"],
    ["pcr", "qPCR", "核酸擴增", "聚合酶連鎖", "擴增"],
    ["引子", "引子設計", "primer", "primers", "primer design", "寡核酸", "oligonucleotide"],
    ["核酸", "dna", "rna", "分子生物", "molecular biology"],
    ["蛋白質", "protein", "蛋白結構", "pdb", "alphafold"],
    ["比色", "顏色", "色彩", "colorimetry", "colorimetric", "rgb", "吸光度", "absorbance"],
    ["感測器", "感測", "sensor", "sensing", "biosensor", "生物感測"],
    ["電化學", "electrochemical", "electrochemistry", "電極", "electrode", "potentiostat"],
    ["光學", "螢光", "fluorescence", "optics", "optical", "顯微鏡", "顯微影像", "顯微", "影像分析", "microscopy", "imagej"],
    ["電泳", "凝膠", "gel", "electrophoresis", "lateral flow", "側向層析", "lfa"],
    ["海報", "學術海報", "poster", "模板", "template", "簡報", "presentation", "ppt"],
    ["國考", "考古題", "歷屆試題", "moex", "national exam", "licensing", "醫檢師"],
    ["3d cad", "cad", "機構設計", "微影", "製程", "光罩", "gds", "cnc", "mold"],
    ["遊戲", "game", "趣味", "解謎", "學遊"],
    ["細胞", "cell", "cell biology", "細胞器", "organelle"]
  ];
  const CATEGORIES = {
    exam: "國考與專業學習", imaging: "顯微與影像分析",
    diagnostics: "微生物與檢驗判讀", molecular: "分子檢驗與生物資訊",
    engineering: "微流體與工程設計", templates: "簡報與海報",
    apps: "科學研究學遊App"
  };
  const TYPES = {
    web: "線上即用", app: "手機 App", software: "安裝軟體",
    reference: "專業資料", download: "下載資源"
  };
  const norm = value => String(value || "").normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
  const safeURL = value => {
    const url = String(value || "").trim();
    return /^https:\/\//i.test(url) || /^\/(?!\/)/.test(url) ? url : "";
  };
  const stopWords = ["我想要", "我想", "我要", "幫我", "有沒有", "有什麼", "可以", "如何", "怎麼", "請問", "哪裡", "尋找", "請幫我", "推薦", "我要用", "想找", "想要找", "一個", "工具", "軟體", "網站", "我", "找", "用", "算"];
  const aliasGroups = GROUPS.map(terms => terms.map(norm));
  const keyParts = item => ({
    title: norm(item.title), subtitle: norm(item.subtitle), tags: norm(item.tags),
    description: norm(item.description) + " " + norm(item.description_en),
    provider: norm(item.provider)
  });
  function editDistanceOne(a,b) {
    if (Math.abs(a.length-b.length)>1 || Math.min(a.length,b.length)<4) return false;
    let i=0,j=0,errors=0;
    while(i<a.length && j<b.length) {
      if(a[i]===b[j]) {i++; j++; continue;}
      if(++errors>1) return false;
      if(a.length>b.length) i++;
      else if(a.length<b.length) j++;
      else {i++;j++;}
    }
    return true;
  }
  function searchScore(item, query, selectedCategory, selectedType) {
    if(selectedCategory!=="all" && item.category!==selectedCategory) return -1;
    if(selectedType!=="all" && item.type!==selectedType) return -1;
    if(!query) return 1;
    const q=norm(query), fields=item._searchParts;
    const exactSegments=[fields.title,fields.subtitle,fields.tags,fields.description,fields.provider];
    const clean=stopWords.reduce((v,w) => v.replaceAll(w," "),q).replace(/\s+/g," ").trim();
    let score=0;
    if(fields.title.includes(q)) score+=170;
    if(fields.subtitle.includes(q)) score+=120;
    if(fields.tags.includes(q)) score+=80;
    if(fields.description.includes(q)) score+=45;
    if(clean.length>=2 && clean!==q) {
      if(fields.title.includes(clean)) score+=100;
      if(fields.subtitle.includes(clean)) score+=80;
      if(fields.tags.includes(clean)) score+=45;
      if(fields.description.includes(clean)) score+=28;
    }
    const matchedGroups=aliasGroups.filter(group => group.some(term => term.length>=2 && (q.includes(term) || (term.includes(q) && q.length>=3))));
    let hits=0;
    for (const group of matchedGroups) {
      let weight=0;
      for (const term of group) {
        if(term.length<2) continue;
        if(fields.title.includes(term)) weight=Math.max(weight,75);
        if(fields.subtitle.includes(term) || fields.tags.includes(term)) weight=Math.max(weight,60);
        if(fields.description.includes(term)) weight=Math.max(weight,28);
      }
      if(weight) {score+=weight;hits++;}
    }
    if(matchedGroups.length>1) {
      score+=hits===matchedGroups.length ? 65 : -22*(matchedGroups.length-hits);
    }
    const englishTerms=(q.match(/[a-z][a-z0-9-]{2,}/g)||[]).filter(t=>!["the","for","and","app","how","what","tool","tools","use","find","with"].includes(t));
    for(const term of englishTerms) {
      if(fields.title.includes(term))score+=55;
      else if(fields.subtitle.includes(term)||fields.tags.includes(term))score+=36;
      else if(fields.description.includes(term))score+=14;
      else if(fields.title.split(/[^a-z0-9]+/).some(word=>editDistanceOne(term,word)))score+=20;
    }
    const hanChunks=(clean.match(/[\u3400-\u9fff]{2,}/g)||[]);
    for(const chunk of hanChunks) {
      if(fields.title.includes(chunk))score+=55;
      else if(fields.subtitle.includes(chunk) || fields.tags.includes(chunk))score+=36;
      else if(fields.description.includes(chunk))score+=16;
      else if(chunk.length>=4) {
        const grams=[...chunk].slice(0,-1).map((c,i)=>c+chunk[i+1]);
        const matched=grams.filter(g=>exactSegments.some(segment=>segment.includes(g))).length;
        if(matched>=2)score+=Math.min(28,matched*5);
      }
    }
    return score;
  }
  function create(tag,className,textValue) {
    const element=document.createElement(tag);
    if(className) element.className=className;
    if(textValue!==undefined)element.textContent=textValue;
    return element;
  }
  function link(label,url,extraClass) {
    const safe=safeURL(url);
    if(!safe)return null;
    const a=create("a",extraClass || "",label+" ↗");
    a.href=safe;
    if(safe.startsWith("https://")){a.target="_blank";a.rel="noopener noreferrer external";}
    return a;
  }
  function createCard(item) {
    const article=create("article","resource-search-card");
    const top=create("div","resource-search-card-top");
    top.append(create("span","resource-search-category",CATEGORIES[item.category]||"線上資源"));
    top.append(create("span","resource-search-type",TYPES[item.type]||"資源"));
    article.append(top);
    article.append(create("h3","resource-search-title",item.title));
    if(item.subtitle && norm(item.subtitle)!==norm(item.title))article.append(create("p","resource-search-subtitle",item.subtitle));
    if(item.description)article.append(create("p","resource-search-description",item.description));
    if(item.provider)article.append(create("p","resource-search-provider",item.provider));
    const actions=create("div","resource-search-actions");
    if(item.type==="app"){
      if(item.android_url){const a=link("Google Play",item.android_url,"resource-search-action");if(a)actions.append(a);}
      if(item.ios_url){const a=link("App Store",item.ios_url,"resource-search-action");if(a)actions.append(a);}
      const related=link("查看 App 分類",item.path,"resource-search-secondary");
      if(related)actions.append(related);
    }else{
      const actionType={web:"開啟工具",software:"查看軟體",reference:"開啟資源",download:"取得資源"}[item.type] || "開啟";
      const primary=link(actionType,item.url,"resource-search-action");
      if(primary)actions.append(primary);
      if(item.path && item.path!==item.url){
        const secondary=link("查看分類",item.path,"resource-search-secondary");
        if(secondary)actions.append(secondary);
      }
    }
    article.append(actions);
    return article;
  }
  const init=async()=>{
    const input=document.getElementById("resource-search-input");
    const category=document.getElementById("resource-search-category");
    const type=document.getElementById("resource-search-type");
    const results=document.getElementById("resource-search-results");
    const status=document.getElementById("resource-search-status");
    const more=document.getElementById("resource-search-more");
    const clear=document.getElementById("resource-search-clear");
    const suggestions=document.querySelectorAll("[data-resource-query]");
    if(!input||!category||!type||!results||!status||!more||!clear) return;
    let rows=[],shown=8,ready=false;
    function render(){
      const query=input.value.trim();
      const active=!!query || category.value!=="all" || type.value!=="all";
      clear.hidden=!active;
      results.replaceChildren();
      more.hidden=true;
      if(!active){status.textContent="輸入需求，或點選下方常見搜尋範例。";return;}
      if(!ready){status.textContent="正在載入檢索資料…";return;}
      const found=rows.map(item=>({item,score:searchScore(item,query,category.value,type.value)}))
        .filter(x=>query ? x.score>0 : x.score>=0)
        .sort((a,b)=>b.score-a.score || a.item.title.localeCompare(b.item.title,"zh-Hant"));
      status.textContent=found.length ? "找到 "+found.length+" 項資源，依相關性排序 · "+found.length+" results" :
        "找不到完全符合的資源，請縮短關鍵字或調整分類。";
      for(const entry of found.slice(0,shown))results.append(createCard(entry.item));
      more.hidden=found.length<=shown;
      if(!more.hidden)more.textContent="顯示更多結果（還有 "+(found.length-shown)+" 項）";
    }
    const update=()=>{shown=8;render();};
    input.addEventListener("input",update);
    category.addEventListener("change",update);
    type.addEventListener("change",update);
    more.addEventListener("click",()=>{shown+=8;render();});
    clear.addEventListener("click",()=>{input.value="";category.value="all";type.value="all";update();input.focus();});
    suggestions.forEach(button=>button.addEventListener("click",()=>{
      input.value=button.dataset.resourceQuery || "";
      category.value="all";type.value="all";update();input.focus();
    }));
    try{
      const response=await fetch("/resources/search-index.json?v=20261028-1",{cache:"no-cache"});
      if(!response.ok)throw new Error("HTTP "+response.status);
      const data=await response.json();
      if(!Array.isArray(data))throw new Error("Search index malformed");
      const ids=new Set();
      rows=data.filter(x=>x && x.title && safeURL(x.url) && CATEGORIES[x.category] && TYPES[x.type])
        .filter(x=>{const id=String(x.id || x.url);if(ids.has(id))return false;ids.add(id);return true;})
        .map(x=>({...x,_searchParts:keyParts(x)}));
      ready=true;
      render();
    }catch(err){
      status.textContent="搜尋資料暫時無法載入，仍可使用下方七大分類瀏覽。請稍後重新整理。";
      more.hidden=true;
      clear.hidden=true;
      results.replaceChildren();
    }
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
