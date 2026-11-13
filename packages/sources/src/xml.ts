// Leitor de XML mínimo e estrito, para os webservices legados da Câmara (SRC-01d), que
// só falam XML. Escrito aqui para não adicionar dependência (regra 2 do CLAUDE.md).
//
// Cobre o subconjunto que essas respostas usam: declaração <?xml?>, elementos, texto,
// elementos vazios (<a />) e as entidades padrão/numéricas. Atributos são ignorados.
// Recusa DOCTYPE e entidades declaradas (XXE, "billion laughs") e qualquer coisa fora
// desse subconjunto: conteúdo da fonte é não confiável (SEG-06).

export interface NoXml {
  readonly nome: string;
  readonly filhos: readonly NoXml[];
  /** Texto direto do elemento (concatenado), sem os filhos. */
  readonly texto: string;
}

export class ErroXml extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroXml';
  }
}

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const NOME = /^[A-Za-z_][\w.-]*/;

function decodificar(texto: string): string {
  return texto.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-z]+);?/g, (bruto, ent: string) => {
    if (!bruto.endsWith(';')) throw new ErroXml(`entidade sem ";": ${bruto}`);
    if (ent.startsWith('#x')) return String.fromCodePoint(parseInt(ent.slice(2), 16));
    if (ent.startsWith('#')) return String.fromCodePoint(parseInt(ent.slice(1), 10));
    const valor = ENTIDADES[ent];
    if (valor === undefined) throw new ErroXml(`entidade desconhecida: &${ent};`);
    return valor;
  });
}

export function lerXml(entrada: string): NoXml {
  let i = 0;
  const xml = entrada.replace(/^﻿/, '');

  const pularEspacos = () => {
    while (i < xml.length && /\s/.test(xml[i]!)) i++;
  };

  pularEspacos();
  if (xml.startsWith('<?xml', i)) {
    const fim = xml.indexOf('?>', i);
    if (fim < 0) throw new ErroXml('declaração <?xml sem fim');
    i = fim + 2;
  }

  interface Aberto { nome: string; filhos: NoXml[]; texto: string }
  const pilha: Aberto[] = [];
  let raiz: NoXml | null = null;

  while (i < xml.length) {
    if (xml[i] !== '<') {
      const fim = xml.indexOf('<', i);
      const pedaco = xml.slice(i, fim < 0 ? xml.length : fim);
      const atual = pilha.at(-1);
      if (atual) atual.texto += decodificar(pedaco);
      else if (pedaco.trim() !== '') throw new ErroXml('texto fora do elemento raiz');
      i = fim < 0 ? xml.length : fim;
      continue;
    }
    if (xml.startsWith('<!--', i)) {
      const fim = xml.indexOf('-->', i);
      if (fim < 0) throw new ErroXml('comentário sem fim');
      i = fim + 3;
      continue;
    }
    if (xml.startsWith('<!', i) || xml.startsWith('<?', i)) {
      throw new ErroXml('DOCTYPE, CDATA e instruções de processamento não são aceitos');
    }
    const fecha = xml[i + 1] === '/';
    const fimTag = xml.indexOf('>', i);
    if (fimTag < 0) throw new ErroXml('tag sem ">"');
    const dentro = xml.slice(i + (fecha ? 2 : 1), fimTag);
    i = fimTag + 1;

    const nome = NOME.exec(dentro)?.[0];
    if (!nome) throw new ErroXml(`tag inválida: <${dentro}>`);

    if (fecha) {
      const aberto = pilha.pop();
      if (!aberto || aberto.nome !== nome) throw new ErroXml(`</${nome}> não fecha <${aberto?.nome ?? '?'}>`);
      const no: NoXml = { nome, filhos: aberto.filhos, texto: aberto.texto };
      const pai = pilha.at(-1);
      if (pai) pai.filhos.push(no);
      else if (raiz) throw new ErroXml('mais de um elemento raiz');
      else raiz = no;
      continue;
    }
    if (dentro.trimEnd().endsWith('/')) {
      const no: NoXml = { nome, filhos: [], texto: '' };
      const pai = pilha.at(-1);
      if (pai) pai.filhos.push(no);
      else if (raiz) throw new ErroXml('mais de um elemento raiz');
      else raiz = no;
      continue;
    }
    if (pilha.length >= 32) throw new ErroXml('aninhamento profundo demais');
    pilha.push({ nome, filhos: [], texto: '' });
  }

  if (pilha.length > 0) throw new ErroXml(`<${pilha.at(-1)!.nome}> sem fechamento`);
  if (!raiz) throw new ErroXml('documento vazio');
  return raiz;
}

/** Filhos diretos com o nome dado. */
export function filhos(no: NoXml, nome: string): NoXml[] {
  return no.filhos.filter((f) => f.nome === nome);
}

/** Texto (sem espaços nas pontas) do primeiro filho com o nome dado; null se não existir. */
export function textoDe(no: NoXml, nome: string): string | null {
  const f = no.filhos.find((f) => f.nome === nome);
  return f ? f.texto.trim() : null;
}
