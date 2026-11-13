import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <>
      <h1>Página não encontrada</h1>
      <p>
        O endereço pode estar errado, ou o deputado não está mais em exercício. <Link href="/">Procure pelo nome ou pelo estado</Link>.
      </p>
    </>
  );
}
