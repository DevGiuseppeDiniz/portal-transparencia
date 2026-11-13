import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main id="conteudo" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 font-bold tracking-tight">Página não encontrada</h1>
      <p>
        O endereço pode estar errado, ou o deputado não está mais em exercício. <Link href="/">Procure pelo nome ou pelo estado</Link>.
      </p>
    </main>
  );
}
