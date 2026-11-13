// Barreira 1 — pacotes inventados pela IA (slopsquatting) e dependências não revisadas.
//
// Toda dependência declarada em qualquer package.json precisa:
//   1. estar aprovada em security/dependencias-aprovadas.json (motivo, quem, quando);
//   2. existir no registro do npm (404 = nome provavelmente inventado);
//   3. ter idade mínima, repositório declarado, downloads mínimos e não estar deprecated;
//   4. usar faixa semver comum (sem git, URL, file:, alias npm:, tag "latest").
// Pacotes internos do monorepo só podem ser referenciados com "workspace:" (evita
// dependency confusion). Roda ANTES de qualquer install.

import { join } from 'node:path';
import { RAIZ, erro, info, finalizar, lerJson, manifestos, buscar, rel } from './lib.mjs';

const IDADE_MINIMA_DIAS = 90;
const DOWNLOADS_MINIMOS_SEMANA = 1000;
const CAMPOS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const SPEC_SEMVER = /^[\w\s.^~<>=|*+-]+$/;

const politica = await lerJson(join(RAIZ, 'security/dependencias-aprovadas.json'));
const aprovados = politica.pacotes ?? {};
const projetos = await manifestos();
const internos = new Set(projetos.map((p) => p.json.name).filter(Boolean));

/** nome -> [{ arquivo, campo, spec }] */
const declaradas = new Map();
for (const { caminho, json } of projetos) {
  for (const campo of CAMPOS) {
    for (const [nome, spec] of Object.entries(json[campo] ?? {})) {
      if (!declaradas.has(nome)) declaradas.set(nome, []);
      declaradas.get(nome).push({ arquivo: rel(caminho), campo, spec: String(spec) });
    }
  }
}

const externas = [];
for (const [nome, usos] of declaradas) {
  let externa = false;
  for (const { arquivo, spec } of usos) {
    if (spec.startsWith('workspace:')) {
      if (!internos.has(nome)) erro(`${arquivo}: "${nome}" usa workspace: mas não existe pacote interno com esse nome.`);
      continue;
    }
    if (internos.has(nome)) {
      erro(`${arquivo}: "${nome}" é pacote interno e deve usar "workspace:*" (risco de dependency confusion).`);
      continue;
    }
    if (spec.includes(':') || spec.includes('/') || !SPEC_SEMVER.test(spec) || !/\d/.test(spec)) {
      erro(`${arquivo}: "${nome}": "${spec}" não é uma faixa semver do registro. Git, URL, file:, alias npm: e tags são proibidos.`);
      continue;
    }
    externa = true;
  }
  if (externa) externas.push(nome);
}

for (const nome of externas) {
  const onde = declaradas.get(nome).map((u) => u.arquivo).join(', ');
  const aprovacao = aprovados[nome];
  const excecoes = aprovacao?.excecoes ?? {};

  if (!aprovacao) {
    erro(`"${nome}" (${onde}) não está em security/dependencias-aprovadas.json. Toda dependência nova precisa de revisão humana.`);
  } else {
    for (const campo of ['motivo', 'aprovadoPor', 'aprovadoEm']) {
      if (!aprovacao[campo]) erro(`security/dependencias-aprovadas.json: "${nome}" sem o campo "${campo}".`);
    }
  }

  const reg = await buscar(`https://registry.npmjs.org/${nome.replace('/', '%2F')}`);
  if (reg.status === 404) {
    erro(`"${nome}" (${onde}) NÃO EXISTE no registro do npm. Provável nome inventado pela IA. Remova; não tente instalar.`);
    continue;
  }
  if (reg.status !== 200 || !reg.json) {
    erro(`"${nome}": falha ao consultar o registro (${reg.status ?? reg.erro}). Falha fechada: rode de novo.`);
    continue;
  }
  const meta = reg.json;

  if (meta.time?.unpublished) erro(`"${nome}" foi despublicado do npm.`);

  const criado = meta.time?.created ? new Date(meta.time.created) : null;
  const idadeDias = criado ? Math.floor((Date.now() - criado.getTime()) / 86_400_000) : 0;
  if (idadeDias < IDADE_MINIMA_DIAS && !excecoes.idade) {
    erro(`"${nome}" foi criado há ${idadeDias} dia(s) (mínimo ${IDADE_MINIMA_DIAS}). Pacote novo demais para confiar.`);
  }

  const ultima = meta['dist-tags']?.latest;
  if (ultima && meta.versions?.[ultima]?.deprecated) {
    erro(`"${nome}" está deprecated: ${meta.versions[ultima].deprecated}`);
  }

  if (!meta.repository && !meta.versions?.[ultima]?.repository && !excecoes.repositorio) {
    erro(`"${nome}" não declara repositório de código-fonte.`);
  }

  const dl = await buscar(`https://api.npmjs.org/downloads/point/last-week/${nome}`);
  if (dl.status !== 200 || typeof dl.json?.downloads !== 'number') {
    erro(`"${nome}": falha ao consultar downloads (${dl.status ?? dl.erro}). Falha fechada.`);
  } else if (dl.json.downloads < DOWNLOADS_MINIMOS_SEMANA && !excecoes.downloads) {
    erro(`"${nome}" tem ${dl.json.downloads} downloads/semana (mínimo ${DOWNLOADS_MINIMOS_SEMANA}).`);
  }

  info(`  · ${nome}: existe, ${idadeDias} dias, ${dl.json?.downloads ?? '?'} downloads/semana`);
}

for (const nome of Object.keys(aprovados)) {
  if (!declaradas.has(nome)) info(`  · aviso: "${nome}" está aprovado mas não é usado; remova da lista.`);
}

info(`${externas.length} dependência(s) externa(s) verificada(s).`);
finalizar('Dependências (pacotes inventados / não revisados)');
