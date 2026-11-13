import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ErroXml, filhos, lerXml, textoDe } from './xml.ts';

test('lerXml: declaração, aninhamento, vazio e entidades', () => {
  const r = lerXml('<?xml version="1.0" encoding="utf-8"?>\n<a x="1"><b>Ação &amp; &#233;&#x21;</b><c /><b>2</b><!-- nota --></a>');
  assert.equal(r.nome, 'a');
  assert.deepEqual(filhos(r, 'b').map((b) => b.texto), ['Ação & é!', '2']);
  assert.equal(textoDe(r, 'c'), '');
  assert.equal(textoDe(r, 'z'), null);
});

test('lerXml: raiz vazia', () => {
  assert.deepEqual(lerXml('<?xml version="1.0"?>\n<dia />'), { nome: 'dia', filhos: [], texto: '' });
});

test('lerXml: recusa DOCTYPE/entidades declaradas (XXE) e CDATA', () => {
  assert.throws(() => lerXml('<!DOCTYPE a [<!ENTITY x SYSTEM "file:///etc/passwd">]><a>&x;</a>'), ErroXml);
  assert.throws(() => lerXml('<a><![CDATA[x]]></a>'), ErroXml);
  assert.throws(() => lerXml('<a>&x;</a>'), /entidade desconhecida/);
});

test('lerXml: recusa XML malformado', () => {
  for (const ruim of ['', '<a>', '<a></b>', '<a/><b/>', 'texto<a/>', '<a><', '<1/>']) {
    assert.throws(() => lerXml(ruim), ErroXml, JSON.stringify(ruim));
  }
});
