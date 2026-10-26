/* Pure utility functions shared by the MLS exam page and automated tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MLSExamCore = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const clean = value => String(value ?? '').trim();
  const pick = (row, ...names) => {
    for (const name of names) if (clean(row[name])) return clean(row[name]);
    return '';
  };
  function officialUrl(value) {
    const raw = clean(value);
    if (!raw) return '';
    try {
      const u = new URL(raw, 'https://wwwq.moex.gov.tw/');
      if (!['http:', 'https:'].includes(u.protocol)) return '';
      if (!(u.hostname === 'moex.gov.tw' || u.hostname.endsWith('.moex.gov.tw'))) return '';
      u.protocol = 'https:';
      u.username = '';
      u.password = '';
      return u.href;
    } catch (_) { return ''; }
  }
  function rocYear(value) {
    const match = clean(value).match(/\d{2,4}/);
    if (!match) return 0;
    const n = Number(match[0]);
    return n > 1911 ? n - 1911 : n;
  }
  function examRecordFromCSV(row) {
    const specialty = pick(row, '類科組別', '考試及等別', '類科名稱', '類科', '組別', '類別', '類科組別名稱');
    if (!specialty.includes('醫事檢驗師') && !specialty.includes('醫事檢驗')) return null;
    const year = rocYear(pick(row, '考試年度', '年度', '考試年'));
    const subject = pick(row, '科目全名', '科目名稱', '考試科目', '科目');
    const question = officialUrl(pick(row, '試題網址', '考畢試題網址', '試題連結'));
    const answer = officialUrl(pick(row, '測驗式試題答案網址', '答案網址', '測驗題標準答案網址', '標準答案網址'));
    if (!(year >= 101 && year <= 200) || !subject || !(question || answer)) return null;
    return {
      year, subject: subject.slice(0, 250), question, answer,
      exam: pick(row, '考試名稱', '考試及等別', '考試簡稱').slice(0, 250),
      session: pick(row, '節次', '考試節次', '考試次別').slice(0, 50),
      type: pick(row, '試題型態', '題型').slice(0, 50),
      notes: pick(row, '備註').slice(0, 150)
    };
  }
  function mergeEntries(...sources) {
    const index = new Map();
    for (const source of sources) {
      for (const item of source || []) {
        const year = rocYear(item.year);
        const question = officialUrl(item.question);
        const answer = officialUrl(item.answer);
        const correction = officialUrl(item.correction);
        const subject = clean(item.subject);
        if (!(year >= 101 && year <= 200) || !subject || !(question || answer)) continue;
        const row = {...item, year, subject, question, answer, correction};
        const key = [year, subject, question || answer].join('|');
        const existing = index.get(key);
        // Preserve verified corrections and PDF URLs from an earlier source.
        if (existing) index.set(key, {
          ...row, question: row.question || existing.question,
          answer: row.answer || existing.answer,
          correction: row.correction || existing.correction,
          notes: row.notes || existing.notes
        });
        else index.set(key, row);
      }
    }
    return [...index.values()].sort((a, b) => b.year - a.year ||
      String(a.exam || '').localeCompare(String(b.exam || ''), 'zh-Hant') ||
      a.subject.localeCompare(b.subject, 'zh-Hant'));
  }
  class CSVStreamParser {
    constructor(onRow, maxRows = 170000) {
      this.onRow = onRow;
      this.maxRows = maxRows;
      this.headers = null;
      this.row = [];
      this.cell = '';
      this.inQuotes = false;
      this.pendingQuote = false;
      this.afterCR = false;
      this.rowsSeen = 0;
    }
    emit() {
      this.row.push(this.cell);
      this.cell = '';
      if (this.row.length === 1 && !this.row[0].trim()) { this.row = []; return; }
      if (!this.headers) {
        this.headers = this.row.map(c => c.replace(/^\ufeff/, '').trim().replace(/\s+/g, ''));
      } else {
        this.rowsSeen += 1;
        if (this.rowsSeen > this.maxRows) throw new Error('CSV 列數超過安全上限。');
        const record = {};
        this.headers.forEach((field, i) => { record[field] = this.row[i] ?? ''; });
        this.onRow(record);
      }
      this.row = [];
    }
    write(text) {
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (this.afterCR) {
          this.afterCR = false;
          if (ch === '\n') continue;
        }
        if (this.pendingQuote) {
          this.pendingQuote = false;
          if (ch === '"') { this.cell += '"'; continue; }
          this.inQuotes = false;
        }
        if (this.inQuotes) {
          if (ch === '"') this.pendingQuote = true;
          else this.cell += ch;
        } else if (ch === '"' && !this.cell) {
          this.inQuotes = true;
        } else if (ch === ',') {
          this.row.push(this.cell); this.cell = '';
        } else if (ch === '\r' || ch === '\n') {
          this.emit();
          if (ch === '\r') this.afterCR = true;
        } else {
          this.cell += ch;
        }
      }
    }
    finish() {
      if (this.pendingQuote) { this.pendingQuote = false; this.inQuotes = false; }
      if (this.inQuotes) throw new Error('CSV 引號不完整。');
      if (this.cell || this.row.length) this.emit();
      return this.headers || [];
    }
  }
  function fisherYates(items, random = Math.random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  return {officialUrl, rocYear, examRecordFromCSV, mergeEntries, CSVStreamParser, fisherYates};
});