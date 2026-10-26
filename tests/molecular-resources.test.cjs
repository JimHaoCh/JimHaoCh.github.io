const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = filename => JSON.parse(fs.readFileSync(path.join(root,'_data',filename), 'utf8'));
const methods = data('molecular_methods.json');
const tools = data('molecular_design_tools.json');
const professional = data('professional_resources.json');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

test('all seven molecular method sections are unique and populated', () => {
  const ids = methods.map(x => x.id);
  assert.deepEqual(ids, ['pcr', 'lamp', 'rpa', 'nasba', 'rca', 'hda_sda', 'structure']);
  for (const id of ids) assert.ok(tools.some(x => x.method === id), id);
});

test('original resources retained including NUPACK, NCBI and official LAMP pages', () => {
  for (const slug of ['neb-lamp','eiken-primerexplorer','nupack','primer3plus','primedrpa','glapd','lamprimers-iq']) {
    assert.ok(tools.find(x => x.slug === slug), slug);
  }
  for (const slug of ['blast','primer-blast']) assert.ok(professional.find(x => x.slug === slug),slug);
});

test('all resource metadata includes honest usage and bilingual classification', () => {
  const kinds = new Set(['web','code','guide','database','analysis']);
  const access = new Set(['open','install','account','subscription','caution']);
  for (const t of tools) {
    assert.ok(kinds.has(t.kind),t.slug);
    assert.ok(access.has(t.access_kind),t.slug);
    for (const name of ['name','provider','purpose_zh','purpose_en','description_zh','description_en','notice_zh','notice_en','kind_zh','kind_en','url']) assert.ok(t[name],name+': '+t.slug);
    if (t.kind==='code') assert.equal(t.access_kind,'install',t.slug);
  }
});

test('no duplicate resources or suspicious/outdated primerexplorer links', () => {
  assert.equal(tools.length,new Set(tools.map(t => t.slug)).size);
  for (const item of tools) {
    for (const key of ['url','source_url','help_url']) if (item[key]) {
      const u = new URL(item[key]);
      assert.equal(u.protocol,'https:',item.slug);
      assert.notEqual(u.hostname,'primerexplorer.jp','unsafe old Eiken domain');
    }
  }
  assert.equal(tools.find(t=>t.slug==='eiken-primerexplorer').url, 'https://primerexplorer.eiken.co.jp/e/');
});

test('molecular HTML uses dynamic categories and includes type controls', () => {
  const s=read('resources/molecular.html');
  assert.ok(s.includes('site.data.molecular_methods'));
  assert.ok(s.includes('site.data.molecular_design_tools'));
  assert.ok(s.includes('id="molecular-type-filter"'));
  assert.ok(s.includes('molecular-filter.js'));
  assert.ok(s.includes('molecular_kind="web"'));
});

test('front page count accounts for newly indexed resources', () => {
  const s=read('courses.html');
  assert.ok(s.includes('site.data.molecular_design_tools.size'));
});

test('resource filter script is present and includes all method cards', () => {
  const s=read('assets/js/molecular-filter.js');
  assert.ok(s.includes('[data-molecular-kind]'));
  assert.ok(s.includes("select.addEventListener('change', update)"));
  assert.ok(s.includes('resetAndJump'));
});
