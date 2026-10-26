const {test} = require('node:test');
const assert = require('node:assert/strict');
const {
  officialUrl, rocYear, examRecordFromCSV, mergeEntries,
  CSVStreamParser, fisherYates
} = require('../assets/js/moex-core.js');
const HEADER = '考試年度,考試名稱,考試及等別,類科組別,節次,科目全名,試題型態,試題網址,測驗式試題答案網址,備註';
const U = 'https://wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?c=308&code=115090&q=1&s=0501&t=Q';
test('MOEX URL validation blocks nonofficial hosts and empty/JS urls', () => {
  assert.equal(officialUrl(''), '');
  assert.equal(officialUrl(' javascript:alert(1) '), '');
  assert.equal(officialUrl('https://moex.gov.tw.evil.tld/file.pdf'), '');
  assert.equal(officialUrl(U), U);
  assert.equal(officialUrl('/exam/abc'), 'https://wwwq.moex.gov.tw/exam/abc');
});
test('ROC year conversion and safe domain checks', () => {
  assert.equal(rocYear(115), 115);
  assert.equal(rocYear('2026'), 115);
  assert.equal(rocYear('民國114年'), 114);
  assert.equal(rocYear('unparsable'), 0);
});
test('select only Medical Laboratory Scientist with official paper links', () => {
  const row={'考試年度':'115','考試名稱':'專技高考','考試及等別':'專技高考',
    '類科組別':'高等考試_醫事檢驗師','節次':'一','科目全名':'臨床血液學與血庫學',
    '試題型態':'測驗','試題網址':U,'測驗式試題答案網址':U.replace('t=Q','t=S'),'備註':''};
  const result=examRecordFromCSV(row);
  assert.equal(result.year,115);
  assert.equal(result.question,U);
  assert.equal(result.subject,'臨床血液學與血庫學');
  assert.equal(examRecordFromCSV({...row,'類科組別':'高等考試_醫事放射師'}),null);
  assert.equal(examRecordFromCSV({...row,'試題網址':'https://fake.com/a','測驗式試題答案網址':''}),null);
});
test('merge initial entries after CSV import, dedupe and preserve corrections', () => {
  const question=U;
  const imported=[{year:115,subject:'臨床血液學與血庫學',exam:'較長的官方考試標題',question,answer:U.replace('t=Q','t=S')}];
  const preload=[{year:115,subject:'臨床血液學與血庫學',exam:'簡稱不同但相同試卷',question,answer:'',correction:U.replace('t=Q','t=M')}];
  const merged=mergeEntries(imported,preload);
  assert.equal(merged.length,1);
  assert.equal(merged[0].correction,U.replace('t=Q','t=M'));
  assert.equal(merged[0].answer,U.replace('t=Q','t=S'));
});
test('CSV parses UTF-8 BOM, CRLF, quoted comma and escaped quotes at all chunk boundaries', () => {
  const line=`115,"專技高考,正式",專技高考,醫事檢驗師,一,臨床血液學與血庫學,測驗,"${U}","${U.replace('t=Q','t=S')}","更正""正式"""`;
  const csv='\ufeff'+HEADER+'\r\n'+line+'\r\n';
  for(const chunkSize of [1,2,3,7,11,59,1024]) {
    const rows=[], p=new CSVStreamParser(row=>rows.push(row));
    for(let i=0;i<csv.length;i+=chunkSize)p.write(csv.slice(i,i+chunkSize));
    const fields=p.finish();
    assert.equal(rows.length,1,`chunkSize=${chunkSize}`);
    assert(fields.includes('類科組別'));
    assert.equal(rows[0]['考試名稱'],'專技高考,正式');
    assert.equal(rows[0]['備註'],'更正"正式"');
    assert.equal(examRecordFromCSV(rows[0]).question,U);
  }
});
test('CSV stream rejects unclosed quote',()=>{
  const p=new CSVStreamParser(()=>{});
  p.write('a,b\nx,"bad');
  assert.throws(()=>p.finish(),/引號/);
});
test('Fisher-Yates shuffles without changing original array',()=>{
  const items=[1,2,3,4];
  assert.deepEqual(fisherYates(items,()=>0),[2,3,4,1]);
  assert.deepEqual(items,[1,2,3,4]);
});