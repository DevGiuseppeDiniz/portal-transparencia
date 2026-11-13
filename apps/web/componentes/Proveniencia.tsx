// Rodapé padrão de cada métrica (PRI-07, DEC-07): o mesmo texto em todas, para não virar
// retórica de credibilidade seletiva (parecer REF-13, 2026-11-13).

import Link from 'next/link';
import type { ProvenienciaPublicada } from '@portal/metrics/publicacao';
import { data, dataDeIso } from '../lib/formato';

export function Proveniencia({ p, linkDados }: { p: ProvenienciaPublicada; linkDados: string }) {
  return (
    <p className="leading-relaxed">
      Fonte: {p.fontes.map((f, i) => (
        <span key={f.id}>
          {i > 0 && ', '}
          <a href={f.url} rel="noopener noreferrer">{f.nome}</a>
        </span>
      ))}
      . Período {data(p.periodo.inicio)} a {data(p.periodo.fim)}. Dados coletados até {dataDeIso(p.ultimaColeta)}. Método{' '}
      <Link href={`/metodo#${p.metrica.toLowerCase()}`}>{p.versaoMetodo}</Link>. <Link href={linkDados}>Ver os dados usados nesta conta</Link>.
    </p>
  );
}
