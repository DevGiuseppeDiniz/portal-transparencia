// Como calculamos (06-auditoria, camada 2): o mais importante primeiro, listas, voz ativa e
// limitações explícitas (DSG-07, Lei 15.263/2025 como padrão de redação).

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Como calculamos' };

const REPO = 'https://github.com/DevGiuseppeDiniz/portal-transparencia';

export default function Metodo() {
  return (
    <>
      <h1>Como calculamos</h1>
      <p>
        Este site não dá nota, não faz ranking e não diz se um deputado é bom ou ruim. Mostra três números de cada deputado, sempre ao lado da
        comparação com os demais, e o caminho para conferir cada um na fonte oficial.
      </p>
      <ul>
        <li>Todo dado vem da Câmara dos Deputados. Guardamos uma cópia de cada arquivo baixado, com data e código de integridade (SHA-256).</li>
        <li>
          A comparação mostra todos os deputados no gráfico, não só a média. Estar acima ou abaixo da mediana não é, por si, bom ou ruim.
        </li>
        <li>Dado que falta aparece como “sem dado”, nunca como zero.</li>
        <li>
          O código de coleta e de cálculo é aberto: <a href={REPO}>{REPO.replace('https://', '')}</a>.
        </li>
      </ul>

      <h2 id="met-01">Presença em sessões deliberativas (MET-01)</h2>
      <ul>
        <li>
          <strong>O que conta:</strong> os dias com sessão deliberativa no Plenário da Câmara, desde 1º de fevereiro de 2023, em que o deputado
          estava em exercício. Um dia com duas sessões conta uma vez, como no registro oficial de frequência.
        </li>
        <li>
          <strong>Porcentagem:</strong> dias com presença ÷ dias de sessão. Ausência justificada (licença de saúde, missão autorizada) conta como
          ausência na porcentagem e aparece separada, com o motivo.
        </li>
        <li>
          <strong>Comparação:</strong> mediana e distribuição dos deputados em exercício com pelo menos 30 dias de sessão.
        </li>
        <li>
          <strong>Limitações:</strong> sessões conjuntas do Congresso não entram (o serviço da Câmara não as informa por dia), por isso o total pode
          ser um pouco menor que o da página de presença da Câmara. Dias marcados “Presença (~)” têm presença no dia e ausência na ata da sessão;
          pelo Ato da Mesa 191/2017, a ata prevalece, e eles não contam como presença.
        </li>
        <li>
          <strong>Fontes:</strong> frequência oficial (serviço SitCamaraWS da Câmara) e calendário de eventos (dados abertos da Câmara).
        </li>
      </ul>

      <h2 id="met-02">Uso da cota para despesas do mandato (MET-02)</h2>
      <ul>
        <li>
          <strong>O que é a cota:</strong> a Cota para o Exercício da Atividade Parlamentar paga despesas do mandato, como passagens, combustível,
          escritório e divulgação. O valor mensal muda conforme o estado.
        </li>
        <li>
          <strong>Período:</strong> os 12 meses fechados mais recentes cujo prazo de 90 dias para apresentar notas já acabou. Meses mais recentes
          ainda podem receber notas.
        </li>
        <li>
          <strong>Gasto:</strong> soma do valor líquido de todas as notas dos meses em que o deputado estava em exercício.
        </li>
        <li>
          <strong>Valor-base:</strong> soma do valor mensal da cota do estado nesses meses (Ato da Mesa 43/2009, valores do Ato 270/2023 e do Ato
          244/2026). Não inclui adicionais por cargo nem o saldo acumulado no ano; o que passar do saldo anual é descontado do salário do deputado.
          Por isso o percentual pode passar de 100%.
        </li>
        <li>
          <strong>Comparação:</strong> deputados do mesmo estado, com pelo menos 6 meses em exercício no período, porque o valor da cota muda de um
          estado para outro.
        </li>
        <li>
          <strong>Privacidade:</strong> fornecedor pessoa física aparece sem nome e sem CPF. CPF de deputado e nome de passageiros não são
          publicados aqui.
        </li>
      </ul>

      <h2 id="met-03">Projetos de lei como autor principal (MET-03)</h2>
      <ul>
        <li>
          <strong>O que conta:</strong> projetos de lei, de lei complementar e propostas de emenda à Constituição apresentados desde fevereiro de
          2023 em que o deputado é o primeiro autor.
        </li>
        <li>
          <strong>Estágios:</strong> apresentado; recebeu parecer em comissão; passou das comissões (foi ao Plenário ou foi aprovado direto nas
          comissões); aprovado na Câmara; virou lei. Cada estágio inclui os projetos que foram além dele.
        </li>
        <li>
          <strong>À parte:</strong> projetos apensados a outro (tramitam juntos, e o conteúdo pode seguir no projeto principal), arquivados,
          retirados e devolvidos.
        </li>
        <li>
          <strong>Comparação:</strong> mediana da Câmara em cada estágio, e quantos deputados tiveram ao menos um projeto próprio transformado em
          lei.
        </li>
        <li>
          <strong>Limitações:</strong> não mostra relatoria de projetos de outros deputados, coautoria, emendas, fiscalização nem votos. Projetos
          recentes ainda não tiveram tempo de avançar. Ainda não há ajuste por cargo ou tempo de mandato.
        </li>
      </ul>

      <h2 id="fontes">Fontes oficiais</h2>
      <ul>
        <li>
          <a href="https://dadosabertos.camara.leg.br">Dados Abertos da Câmara dos Deputados</a> (deputados, histórico do mandato, eventos e
          proposições)
        </li>
        <li>
          <a href="https://www.camara.leg.br/transparencia/gastos-parlamentares">Cota parlamentar: arquivos anuais e notas fiscais</a>
        </li>
        <li>
          <a href="https://www.camara.leg.br/SitCamaraWS/sessoesreunioes.asmx">Frequência em Plenário (serviço SitCamaraWS)</a>
        </li>
      </ul>

      <h2 id="erros">Encontrou um erro?</h2>
      <p>
        Abra um registro no <a href={`${REPO}/issues`}>repositório do projeto</a>, com o endereço da página e o que está diferente da fonte oficial.
        Correções ficam registradas publicamente, com data.
      </p>
    </>
  );
}
