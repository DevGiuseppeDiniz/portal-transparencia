import { FONTES } from '@portal/sources';

// Página provisória do esqueleto: prova que o app compila, é gerado estaticamente e lê
// um pacote interno. A home real (busca por UF/nome, DEC-02) vem com o MVP.
export default function Inicio() {
  return (
    <main>
      <h1>Portal Parlamentar</h1>
      <p>Em construção. Fontes de dados previstas:</p>
      <ul>
        {FONTES.map((fonte) => (
          <li key={fonte.id}>
            {fonte.id} — {fonte.nome}
          </li>
        ))}
      </ul>
    </main>
  );
}
