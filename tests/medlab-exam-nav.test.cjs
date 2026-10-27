const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const idx=JSON.parse(read('assets/data/moex_medlab.json'));
const items=idx.entries;
const page=read('resources/exam.html');
const js=read('assets/js/medlab-exam.js');
const style=read('online-tools.css');
test('Quick exam page offers direct year and subject navigation',()=>{
 for(const item of ['exam-mode-year','exam-mode-subject','exam-year-tabs','exam-session-tabs','exam-subject-tabs','exam-results','exam-result-title']){
  assert.ok(page.includes('id="'+item+'"'),item);
 }
 assert.ok(js.includes('function renderYearResult()'));
 assert.ok(js.includes('function renderSubjectResult()'));
});
test('Official PDF question and answer links are prominent while import is advanced',()=>{
 const advanced=page.indexOf('<details class="exam-advanced">');
 const questionAccess=page.indexOf('id="exam-results"');
 const practice=page.indexOf('<details class="exam-secondary-practice">');
 assert.ok(questionAccess>0&&advanced>questionAccess&&practice>advanced);
 assert.ok(page.includes('選年度')||page.includes('選擇考試年度'));
 assert.ok(js.includes("appendPdfLinks"));
 assert.ok(js.includes("更正答案"));
});
test('Mock quizzes are retained but never compete with the first-screen paper index',()=>{
 assert.ok(page.includes('id="practice-app"'));
 assert.ok(page.includes('id="practice-start"'));
 assert.ok(js.includes('function startQuiz('));
 assert.ok(js.includes('function populateSubjects(select)'));
 assert.ok(js.includes("populateSubjects($('practice-subject'))"));
 assert.ok(page.includes('exam-secondary-practice'));
});
test('Initial page data accurately documents coverage rather than inventing sessions',()=>{
 assert.equal(idx.records,items.length);
 const years=new Set(items.map(x=>x.year));
 assert.equal(years.size,idx.years.length);
 for(const item of items){
  assert.ok(Number.isInteger(item.year));
  assert.ok(item.subject);
  for(const k of ['question','answer','correction']){
   if(item[k]){
    const url=new URL(item[k]);
    assert.equal(url.protocol,'https:');
    assert.ok(url.hostname==='moex.gov.tw'||url.hostname.endsWith('.moex.gov.tw'));
   }
  }
 }
});
test('Only available years and sessions are shown; no guessed first/second session anchors',()=>{
 assert.ok(js.includes('const years=currentYears()'));
 assert.ok(js.includes('function availableSessions(year)'));
 assert.ok(js.includes('sessionOf(e)===selectedSession'));
 assert.ok(js.includes('exam-subject-missing'));
 assert.ok(!js.includes('t=Q'));
});
test('Mobile layout has collapsible advanced tools, real buttons and official source',()=>{
 assert.ok(style.includes('.exam-quick-switch{'));
 assert.ok(style.includes('.exam-subject-row{'));
 assert.ok(style.includes('@media(max-width:760px)'));
 assert.ok(page.includes('https://wwwq.moex.gov.tw/exam/wFrmExamQandASearch.aspx'));
 assert.ok(page.includes('https://data.gov.tw/dataset/170565'));
});
test('MOEX refresh script reads official CSV and never publishes unvalidated data',()=>{
 const py=read('scripts/sync_medlab_exam.py');
 assert.ok(py.includes('exam_session('));
 assert.ok(py.includes('Refusing to replace published index'));
 assert.ok(py.includes('previous_corrections()'));
 assert.ok(py.includes('session = exam_session('));
 assert.ok(py.includes('SUBJECT_PREFIXES'));
});

test('Optional CSV import is a three-step bilingual mobile guide with local feedback',()=>{
 const labels=['下載考選部資料','選擇剛下載的檔案','查看匯入結果'];
 for(const label of labels)assert.ok(page.includes(label),'Missing guide step: '+label);
 assert.equal((page.match(/class="exam-import-step-no"/g)||[]).length,3);
 for(const id of ['exam-import','exam-import-status','exam-import-view'])assert.ok(page.includes('id="'+id+'"'));
 assert.ok(page.includes('aria-live="polite"'));
 assert.ok(page.includes('type="file"'));
 assert.ok(page.includes('檔案不會上傳')||page.includes('不會上傳本站'));
 assert.ok(js.includes('importStatus.textContent=added>0'));
 assert.ok(js.includes("importStatus.classList.add('is-error')"));
 assert.ok(js.includes('const added=entries.length-oldCount'));
 assert.ok(style.includes('.exam-import-guide{'));
 assert.ok(style.includes('.exam-import-panel [hidden]{display:none!important}'));
 assert.ok(style.includes('@media(max-width:960px){.exam-import-guide{grid-template-columns:1fr}}'));
});
