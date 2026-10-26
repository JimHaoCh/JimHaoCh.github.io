(() => {
  'use strict';
  const core=window.MICCheckerboard;
  const $=id=>document.getElementById(id);
  if(!core||!$('mic-plate'))return;
  let grid=core.scenario('synergy');
  let mbc=core.mbcScenario('A');
  let reveal=true;
  const fmt=n=>Number.isFinite(n)?Number(n.toPrecision(5)).toLocaleString('en-US',{maximumFractionDigits:7}):'—';
  const text=(tag,cls,value)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    node.textContent=value;
    return node;
  };
  const statusSymbol={growth:'G',inhibited:'I',unknown:'?'};
  const mode=(s)=>s==='growth'?'生長 / Growth':s==='inhibited'?'未見生長 / No visible growth':'未判讀 / Unread';
  const rowLetter=i=>String.fromCharCode(65+i);
  const wellId=(i,j)=>rowLetter(i)+(j+1);
  function buildPlate(){
    const h=$('mic-plate-head'), body=$('mic-plate-body');
    h.replaceChildren();body.replaceChildren();
    const tr=document.createElement('tr');
    const x=text('th','', 'Drug A ↓ / B →');
    x.scope='col';tr.append(x);
    core.B.forEach((b,j)=>{
      const th=text('th','',(j+1).toString());
      th.scope='col'; th.append(text('span','',fmt(b)+' mg/L'));tr.append(th);
    });
    h.append(tr);
    core.A.forEach((a,i)=>{
      const row=document.createElement('tr');
      const th=text('th','',rowLetter(i));th.scope='row';th.append(text('span','',fmt(a)+' mg/L'));row.append(th);
      core.B.forEach((b,j)=>{
        const td=document.createElement('td');
        const button=document.createElement('button');
        button.type='button';button.dataset.row=i;button.dataset.col=j;
        button.className='mic-well';
        button.addEventListener('click',()=>{
          const order=['growth','inhibited','unknown'];
          const state=grid[i][j];
          grid[i][j]=order[(order.indexOf(state)+1)%order.length];
          $('mic-well-detail').textContent='已修改 '+wellId(i,j)+'（A '+fmt(a)+' mg/L，B '+fmt(b)+' mg/L） → '+mode(grid[i][j]);
          renderAnalysis();
        });
        td.append(button);row.append(td);
      });
      body.append(row);
    });
  }
  function paintPlate(best){
    const bestKey=best?best.row+'-'+best.col:null;
    $('mic-plate-body').querySelectorAll('button.mic-well').forEach(button=>{
      const i=Number(button.dataset.row),j=Number(button.dataset.col),s=grid[i][j];
      button.className='mic-well mic-well--'+s+
        (i===0&&j===0?' mic-well--control':i===0||j===0?' mic-well--axis':'')+
        ((i+'-'+j)===bestKey?' mic-well--best':'');
      button.replaceChildren(text('span','',wellId(i,j)),document.createTextNode(statusSymbol[s]));
      button.title=wellId(i,j)+' · A '+fmt(core.A[i])+' mg/L · B '+fmt(core.B[j])+' mg/L · '+mode(s);
      button.setAttribute('aria-label',button.title+'；按下切換狀態');
    });
  }
  function card(label,en,value,sub){
    const div=text('article','mic-analysis-card','');
    const p=text('p','mic-label',label);p.append(text('small','',en));
    div.append(p,text('strong','',value),text('p','',sub));
    return div;
  }
  function micText(obj){
    if(obj.type==='measured')return fmt(obj.value)+' mg/L';
    if(obj.type==='above')return '> '+fmt(obj.bound)+' mg/L';
    if(obj.type==='invalid')return'無法判讀 / Invalid';
    return'資料不足 / Incomplete';
  }
  function renderAnalysis(){
    const result=core.calculate(grid);
    paintPlate(result.best);
    const panel=$('mic-analysis');panel.replaceChildren();
    if($('mic-hide-answer').checked&&!reveal){
      panel.append(text('p','mic-analysis-note','課堂練習模式：先從左上角生長對照、第一列／欄推論兩藥 MIC，再從抑制孔估算 FICI；按「揭曉計算結果」核對。'));
      $('mic-reveal').hidden=false;return;
    }
    $('mic-reveal').hidden=!$('mic-hide-answer').checked;
    panel.append(
      card('藥物 A 單用 MIC','Agent A alone',micText(result.micA),'依第一欄 B = 0 推得 · '+(result.micA.reason||'最小無可見生長濃度')),
      card('藥物 B 單用 MIC','Agent B alone',micText(result.micB),'依第一列 A = 0 推得 · '+(result.micB.reason||'最小無可見生長濃度'))
    );
    if(result.best){
      panel.append(card('最低已觀察 FICI','Lowest observed FICI',fmt(result.best.fici),
        '孔位 '+result.best.well+'（A '+fmt(result.best.concA)+' + B '+fmt(result.best.concB)+' mg/L）'));
      panel.append(card('雙藥交互作用分類','Research teaching convention',result.classification.zh,result.classification.en));
      panel.append(card('FIC A 與 FIC B','Individual fractions',
        fmt(result.best.ficA)+' + '+fmt(result.best.ficB),
        'FICI = Acombo / MICA + Bcombo / MICB'));
    }else{
      panel.append(card('雙藥 FICI','Fractional inhibitory concentration','無法計算','須有有效對照、兩個可判定的單用 MIC 及至少一個組合抑制孔'));
    }
    panel.append(card('已判讀孔位','Readout coverage',(96-result.unknownCount)+'/96',
      '未判讀孔 '+result.unknownCount+' 個；此數值並非置信度'));
    const warn=result.reason;
    if(warn){
      const p=text('p','mic-analysis-note mic-analysis-note--warning','注意：'+({
        'Growth control failed; cannot interpret this plate':'無藥生長對照不成立，不能將整板解讀為有效 MIC／FICI。',
        'Both single-drug MICs must be determined from axis wells':'單用藥物軸未能確定兩藥 MIC，不能將大於測量範圍的數值當作定量 MIC。',
        'No inhibited combination wells with both agents present':'沒有同時含 A 與 B、且顯示抑制的孔位，無法推得雙藥 FICI。',
        'Unread combination wells: the displayed lowest observed FICI may change':'部分孔位尚未判讀；目前只顯示已觀察到的最低 FICI，完整資料可能改變結果。'
      }[warn]||warn));
      panel.append(p);
    }else panel.append(text('p','mic-analysis-note','本板為完整虛構範例，FICI 分類僅依所選研究慣例。實際實驗需重複、檢查濃度範圍和適用標準。'));
  }
  function loadPreset(){
    grid=core.scenario($('mic-scenario').value);
    reveal=!$('mic-hide-answer').checked;
    $('mic-well-detail').textContent='已載入：'+$('mic-scenario').selectedOptions[0].textContent+'。每一孔可點擊修改。';
    renderAnalysis();
  }
  function exportCSV(){
    let csv='well,agent_A_mg_L,agent_B_mg_L,growth_call\n';
    for(let i=0;i<core.A.length;i++)for(let j=0;j<core.B.length;j++){
      csv+=[wellId(i,j),core.A[i],core.B[j],grid[i][j]].join(',')+'\n';
    }
    const file=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(file);
    const a=document.createElement('a');a.href=url;a.download='web_mic_synthetic_checkerboard.csv';
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function showMBC(){
    const tbody=$('mic-mbc-rows');tbody.replaceChildren();
    const baseline=Number($('mic-mbc-baseline').value);
    const result=mbc.doses.map((dose,i)=>{
      const tr=document.createElement('tr');
      const heading=text('th','',fmt(dose));heading.scope='row';
      const td=document.createElement('td');
      const input=document.createElement('input');
      input.type='number';input.min='0';input.step='any';input.inputMode='decimal';
      input.setAttribute('aria-label','Concentration '+fmt(dose)+' mg/L, viable CFU per mL');
      input.value=mbc.cfu[i]===null?'':String(mbc.cfu[i]);
      input.dataset.index=i;
      input.addEventListener('input',()=>{
        mbc.cfu[i]=input.value.trim()===''?null:Number(input.value);
        renderMBCResult();
      });
      td.append(input);
      const relative=text('td','mic-mbc-percent','—');relative.dataset.relative=i;
      tr.append(heading,td,relative);tbody.append(tr);
      return tr;
    });
    renderMBCResult();
  }
  function renderMBCResult(){
    const output=$('mic-mbc-output');output.replaceChildren();
    const baselineInput=$('mic-mbc-baseline');
    const baseline=Number(baselineInput.value);
    if(!baselineInput.value.trim()||!baselineInput.checkValidity()||!Number.isFinite(baseline)||baseline<=0||
       mbc.cfu.some(v=>v!==null&&(!Number.isFinite(v)||v<0))){
      output.textContent='請輸入合法的起始 CFU/mL 與非負存活菌數，空白代表尚未讀取。';
      return;
    }
    $('mic-mbc-rows').querySelectorAll('[data-relative]').forEach(td=>{
      const v=mbc.cfu[Number(td.dataset.relative)];
      td.textContent=v===null?'未讀取 / Unread':fmt(v/baseline*100)+'%';
    });
    const result=core.calculateMBC(mbc.doses,mbc.cfu,baseline);
    const first=result.type==='measured'?'教學示例 MBC：'+fmt(result.value)+' mg/L':
      result.type==='above'?'此濃度範圍內未達 ≥99.9% 殺菌門檻':
      result.type==='invalid'?'存活數隨濃度出現不一致變化，須先檢查數據':
      '資料不足，暫不能估算 MBC';
    output.append(text('strong','',first));
    output.append(text('p','','此處採用 ≥99.9% 降低的門檻：存活 CFU/mL ≤ '+fmt(result.threshold)+'（起始 '+fmt(baseline)+' CFU/mL）。'));
    if(result.type==='above')output.append(text('p','','MBC > '+fmt(result.bound)+' mg/L；不是等於最高測試濃度。'));
    output.append(text('p','','請注意：本存活 CFU 數據與上方抑菌孔盤為兩個分開的虛構教學練習，不能由上方 MIC 直接換算 MBC。'));
  }
  $('mic-load').addEventListener('click',loadPreset);
  $('mic-export').addEventListener('click',exportCSV);
  $('mic-hide-answer').addEventListener('change',()=>{
    reveal=!$('mic-hide-answer').checked;renderAnalysis();
  });
  $('mic-reveal').addEventListener('click',()=>{reveal=true;renderAnalysis();});
  $('mic-mbc-agent').addEventListener('change',e=>{mbc=core.mbcScenario(e.target.value);showMBC();});
  $('mic-mbc-baseline').addEventListener('input',renderMBCResult);
  buildPlate();loadPreset();showMBC();
})();
