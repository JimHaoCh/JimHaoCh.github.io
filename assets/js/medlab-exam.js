/* MOEX link-only directory and original, browser-local practice exercises. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  if (!$('exam-index')) return;
  const Core = window.MLSExamCore;
  if (!Core) {
    const el = $('exam-source-status');
    if (el) el.textContent = '試題索引元件載入失敗，請重新整理或使用考選部官方查詢連結。';
    return;
  }
  const SUBJECTS = [
    '臨床生理學與病理學', '臨床血液學與血庫學',
    '醫學分子檢驗學與臨床鏡檢學（包括寄生蟲學）',
    '微生物學與臨床微生物學（包括細菌與黴菌）',
    '生物化學與臨床生化學', '臨床血清免疫學與臨床病毒學'
  ];
  let entries = [], shown = 40, importedCount = 0, initialLoaded = false;
  const status = $('exam-source-status');
  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  };
  const option = (label, value) => new Option(label, value);
  function populateSubjects(select) {
    select.replaceChildren(option('全部六大考科 / All subjects', ''));
    for (const subject of SUBJECTS) select.add(option(subject, subject));
  }
  function fillYearFilter() {
    const select = $('exam-year');
    const selected = select.value;
    const years = [...new Set(entries.map(item => item.year))].sort((a, b) => b - a);
    select.replaceChildren(option('全部年度 / All years', ''));
    for (const year of years) select.add(option('民國 ' + year + ' 年（' + (year + 1911) + '）', String(year)));
    select.value = years.includes(Number(selected)) ? selected : '';
  }
  function pdfLink(url, label) {
    const a = document.createElement('a');
    a.href = url;
    a.textContent = label;
    a.className = 'exam-pdf-link';
    a.target = '_blank';
    a.rel = 'noopener noreferrer external';
    return a;
  }
  function render() {
    const year = Number($('exam-year').value);
    const subject = $('exam-subject').value;
    const term = $('exam-keyword').value.trim().toLocaleLowerCase();
    const filtered = entries.filter(row => (!year || row.year === year) &&
      (!subject || row.subject === subject) &&
      (!term || [row.subject, row.exam, row.session, row.notes].join(' ').toLocaleLowerCase().includes(term)));
    $('exam-match-count').textContent = `${filtered.length} 份符合篩選的紀錄 · ${filtered.length} matching records`;
    const results = $('exam-results');
    results.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'exam-empty';
      empty.textContent = '目前沒有符合條件的索引資料。可調整條件、匯入考選部 CSV，或至考選部官方查詢平台。';
      results.append(empty);
    }
    for (const record of filtered.slice(0, shown)) {
      const card = document.createElement('article'); card.className = 'exam-result';
      const head = document.createElement('div'); head.className = 'exam-result-head';
      const badge = document.createElement('span'); badge.className = 'exam-result-year';
      badge.textContent = `民國 ${record.year} 年`;
      const session = document.createElement('span'); session.className = 'exam-result-session';
      session.textContent = record.session || (record.exam || '').match(/第[一二三四]次/)?.[0] || '考選部';
      head.append(badge, session);
      const title = document.createElement('h3'); title.textContent = record.subject;
      const subtitle = document.createElement('p'); subtitle.className = 'exam-result-source';
      subtitle.textContent = record.exam || '考選部醫事檢驗師國家考試';
      const links = document.createElement('div'); links.className = 'exam-result-links';
      if (record.question) links.append(pdfLink(record.question, '試題 PDF ↗'));
      if (record.answer) links.append(pdfLink(record.answer, '標準答案 PDF ↗'));
      if (record.correction) links.append(pdfLink(record.correction, '更正答案 PDF ↗'));
      card.append(head, title, subtitle, links);
      results.append(card);
    }
    $('exam-more').hidden = filtered.length <= shown;
  }
  function setEntries(additional) {
    entries = Core.mergeEntries(entries, additional);
    shown = 40;
    fillYearFilter();
    render();
  }
  function updateIndexStatus() {
    const parts = [`目前索引 ${entries.length} 筆官方試題／答案連結`];
    if (importedCount) parts.push(`其中本機 CSV 匯入 ${importedCount} 筆（可能與預載資料重複）`);
    if (!initialLoaded) parts.push('預載資料暫時無法取得，仍可匯入 CSV');
    parts.push('預載資料非完整歷年題庫；答案更正請以考選部公告為準。');
    setStatus(parts.join('；'));
  }
  async function importCSV(file) {
    if (!file) return;
    const input = $('exam-import');
    input.disabled = true;
    setStatus('正在本機讀取 CSV；大型檔案可能需要較長處理時間…');
    try {
      if (file.size > 65_000_000) throw new Error('檔案超過 65 MB 安全上限。');
      const firstBytes = await file.slice(0, 4096).arrayBuffer();
      const probe = new TextDecoder('utf-8').decode(firstBytes);
      const encoding = /考試年度|類科組別/.test(probe) ? 'utf-8' : 'big5';
      const decoder = new TextDecoder(encoding, {fatal: false});
      const imported = [];
      const parser = new Core.CSVStreamParser(row => {
        const entry = Core.examRecordFromCSV(row);
        if (entry) imported.push(entry);
      });
      const size = 128 * 1024;
      for (let offset = 0; offset < file.size; offset += size) {
        const chunk = await file.slice(offset, Math.min(offset + size, file.size)).arrayBuffer();
        parser.write(decoder.decode(chunk, {stream: true}));
        if (offset % (size * 16) === 0) {
          setStatus(`正在匯入官方 CSV：${Math.min(100, Math.round((offset + chunk.byteLength) * 100 / file.size))}%`);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      parser.write(decoder.decode());
      const headers = parser.finish();
      if (!headers.includes('考試年度') || !headers.includes('類科組別') || !headers.includes('科目全名')) {
        throw new Error('欄位格式不符合考選部資料集 170565。');
      }
      if (!imported.length) throw new Error('找不到醫事檢驗師試題紀錄，請確認資料檔案正確。');
      setEntries(imported);
      importedCount += imported.length;
      updateIndexStatus();
    } catch (error) {
      setStatus('匯入失敗：' + (error?.message || '檔案格式無法辨識'), true);
    } finally {
      input.disabled = false;
      input.value = '';
    }
  }
  populateSubjects($('exam-subject'));
  ['exam-year', 'exam-subject', 'exam-keyword'].forEach(id => {
    $(id).addEventListener(id === 'exam-keyword' ? 'input' : 'change', () => {shown = 40; render();});
  });
  $('exam-more').addEventListener('click', () => {shown += 60; render();});
  $('exam-reset').addEventListener('click', () => {
    $('exam-year').value = '';
    $('exam-subject').value = '';
    $('exam-keyword').value = '';
    shown = 40;
    render();
  });
  $('exam-import').addEventListener('change', event => {void importCSV(event.target.files[0]);});
  fetch('/assets/data/moex_medlab.json', {cache:'no-cache'})
    .then(response => {if (!response.ok) throw new Error('HTTP ' + response.status); return response.json();})
    .then(data => {initialLoaded = true; setEntries(data.entries || []); updateIndexStatus();})
    .catch(() => {fillYearFilter(); render(); updateIndexStatus();});

  // Original study questions: deliberately separate from official exam PDFs.
  let questions = [], pool = [], step = 0, score = 0, answered = false;
  const STORAGE_KEY = 'bioflumen-mls-practice-wrong-v1';
  let wrongIds = new Set();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(parsed)) wrongIds = new Set(parsed.filter(id => typeof id === 'string'));
  } catch (_) { /* Private browsing or old invalid data. */ }
  const persist = () => {try {localStorage.setItem(STORAGE_KEY, JSON.stringify([...wrongIds]));} catch (_) {}};
  const wrongCount = () => {
    $('practice-wrong-count').textContent = `錯題紀錄：${wrongIds.size} 題（僅存在本機）`;
  };
  function renderQuestion() {
    const area = $('practice-question');
    area.replaceChildren(); wrongCount();
    $('practice-next').hidden = true;
    if (step >= pool.length) {
      const title = document.createElement('h3');
      title.textContent = `練習結束：答對 ${score} / ${pool.length} 題`;
      const note = document.createElement('p');
      note.textContent = '錯題已記錄於這個瀏覽器，可按「只複習錯題」再次練習。本題庫由本站原創，並非考選部試卷。';
      area.append(title, note); return;
    }
    answered = false;
    const q = pool[step];
    const title = document.createElement('h3');
    title.textContent = `第 ${step + 1} / ${pool.length} 題｜${q.subject}`;
    const stem = document.createElement('p'); stem.className = 'practice-stem'; stem.textContent = q.stem;
    const options = document.createElement('div'); options.className = 'practice-options';
    const feedback = document.createElement('div'); feedback.className = 'practice-feedback';
    feedback.setAttribute('aria-live', 'polite');
    q.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'practice-choice';
      button.textContent = String.fromCharCode(65 + index) + '. ' + choice;
      button.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const correct = index === q.correct;
        if (correct) {score++; wrongIds.delete(q.id);} else wrongIds.add(q.id);
        persist(); wrongCount();
        [...options.children].forEach((node, i) => {
          node.disabled = true;
          if (i === q.correct) node.classList.add('is-correct');
          else if (i === index && !correct) node.classList.add('is-wrong');
        });
        feedback.textContent = (correct ? '答對！' : '答錯，正確答案是 ' + String.fromCharCode(65 + q.correct) + '。') + ' ' + q.explanation;
        $('practice-next').hidden = false;
      });
      options.append(button);
    });
    area.append(title, stem, options, feedback);
  }
  function startQuiz(incorrectOnly = false) {
    const subject = $('practice-subject').value;
    const found = questions.filter(q => (!subject || q.subject === subject) &&
      (!incorrectOnly || wrongIds.has(q.id)));
    if (!found.length) {
      $('practice-question').textContent = incorrectOnly ? '這個科目目前沒有錯題。' : '目前沒有符合的原創練習題。';
      $('practice-next').hidden = true;
      return;
    }
    pool = Core.fisherYates(found).slice(0, 12);
    step = 0; score = 0;
    renderQuestion();
  }
  $('practice-start').disabled = true;
  $('practice-review').disabled = true;
  $('practice-start').addEventListener('click', () => startQuiz());
  $('practice-review').addEventListener('click', () => startQuiz(true));
  $('practice-next').addEventListener('click', () => {step++; renderQuestion();});
  $('practice-clear').addEventListener('click', () => {
    if (!window.confirm('要清除此裝置的錯題紀錄嗎？')) return;
    wrongIds.clear(); persist(); wrongCount();
  });
  populateSubjects($('practice-subject'));
  fetch('/assets/data/mls_practice.json', {cache:'no-cache'})
    .then(response => {if (!response.ok) throw new Error('HTTP ' + response.status); return response.json();})
    .then(data => {
      questions = Array.isArray(data.questions) ? data.questions.filter(q => Array.isArray(q.choices) && q.choices.length === 4 &&
        Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4 && q.id && q.subject) : [];
      $('practice-start').disabled = !questions.length;
      $('practice-review').disabled = !questions.length;
      $('practice-app').classList.remove('practice-loading');
      $('practice-question').textContent = `原創練習題已載入 ${questions.length} 題，選擇考科後開始練習。`;
      wrongCount();
    })
    .catch(() => { $('practice-question').textContent = '練習題載入失敗，請重新整理頁面。'; });
})();