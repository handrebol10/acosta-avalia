import { PROTOCOLS } from '../lib/catalog'

const SECTIONS: { title: string; body: string; formula?: string; items?: string[] }[] = [
  {
    title: 'Por onde começar',
    body: 'Uma boa avaliação segue sempre a mesma ordem: anamnese (PAR-Q), sinais vitais, peso e estatura, perímetros, dobras cutâneas, fotos posturais e, por último, os testes físicos, para que o esforço não altere as medidas de repouso.',
    items: [
      'Reavalie no mesmo horário, com o mesmo avaliador e o mesmo protocolo.',
      'Intervalo recomendado entre avaliações: 60 a 90 dias.',
      'Evite treino intenso nas 24 h anteriores e grandes refeições 3 h antes.',
    ],
  },
  {
    title: 'IMC · Índice de Massa Corporal',
    body: 'Relação simples entre peso e altura, usada pela OMS para triagem populacional. Não diferencia gordura de músculo: um aluno musculoso pode ter IMC alto e baixo %G.',
    formula: 'IMC = peso (kg) ÷ estatura² (m)',
    items: ['< 18,5 abaixo do peso', '18,5 a 24,9 adequado', '25 a 29,9 sobrepeso', '≥ 30 obesidade (graus I, II e III)'],
  },
  {
    title: 'Densidade corporal → % de gordura',
    body: 'Os protocolos de dobras estimam a densidade do corpo. Como a gordura é menos densa que a massa magra, a densidade é convertida em %G pelas equações de Siri ou Brozek.',
    formula: 'Siri:   %G = (495 ÷ D) − 450\nBrozek: %G = (457 ÷ D) − 414,2',
  },
  {
    title: 'Método US Navy (só fita métrica)',
    body: 'Alternativa quando não há adipômetro. Usa a diferença entre perímetros do tronco e do pescoço em relação à estatura.',
    formula:
      'Homens:   %G = 86,010·log(abdômen − pescoço) − 70,041·log(estatura) + 36,76\nMulheres: %G = 163,205·log(cintura + quadril − pescoço) − 97,684·log(estatura) − 78,387\n(medidas em polegadas)',
  },
  {
    title: 'Indicadores de risco cardiometabólico',
    body: 'A gordura acumulada no abdômen tem relação mais forte com doenças cardiovasculares e diabetes do que o peso total.',
    items: [
      'Cintura (OMS): risco aumentado a partir de 94 cm (H) / 80 cm (M); muito aumentado a partir de 102 cm / 88 cm.',
      'Relação cintura/quadril: risco a partir de 0,90 (H) / 0,85 (M).',
      'Relação cintura/estatura: a cintura deve ser menor que metade da altura (< 0,50).',
    ],
  },
  {
    title: 'Gasto energético',
    body: 'A taxa metabólica basal (TMB) é a energia gasta em repouso. Quando há %G, o app usa Katch-McArdle (mais precisa, baseada na massa magra); senão, Mifflin-St Jeor.',
    formula: 'Katch-McArdle: TMB = 370 + 21,6 × massa magra (kg)\nMifflin-St Jeor: TMB = 10·peso + 6,25·estatura − 5·idade + 5 (H) ou − 161 (M)\nGasto diário = TMB × fator de atividade (1,2 a 1,725)',
  },
  {
    title: 'VO₂máx · capacidade aeróbia',
    body: 'Volume máximo de oxigênio que o corpo consegue usar por minuto, por kg. É um dos melhores preditores de saúde e longevidade. Classificação pela tabela do Cooper Institute.',
    formula:
      'Cooper 12 min: VO₂ = (distância m − 504,9) ÷ 44,73\nRockport: VO₂ = 132,853 − 0,0769·peso(lb) − 0,3877·idade + 6,315·sexo(H=1) − 3,2649·tempo(min) − 0,1565·FC\nBanco Queens: H = 111,33 − 0,42·FC · M = 65,81 − 0,1847·FC',
  },
  {
    title: 'Testes neuromotores',
    body: 'Flexão de braço e sentar e alcançar são classificados pelas tabelas do CSEP/ACSM, por sexo e faixa etária. O abdominal em 1 minuto e a preensão manual são registrados para acompanhar a evolução individual.',
  },
  {
    title: 'FMS · Functional Movement Screen',
    body: 'Triagem de 7 padrões de movimento, cada um pontuado de 0 a 3. Mais do que a nota total, observe as assimetrias entre os lados e qualquer dor (nota 0), que exige encaminhamento.',
    items: ['17–21: ótimo padrão de movimento', '15–16: bom', '≤ 14: risco aumentado de lesão'],
  },
  {
    title: 'Avaliação postural',
    body: 'Feita por observação nas vistas anterior, lateral e posterior, usando o fio de prumo como referência. Na lateral, o prumo deve passar pelo lóbulo da orelha, ombro, trocânter maior, à frente do joelho e à frente do maléolo lateral.',
  },
]

export default function Guide() {
  return (
    <div className="page guide">
      <div className="page-head">
        <div className="title">
          <span className="eyebrow">Didático</span>
          <h1>Guia de protocolos</h1>
          <p className="muted">O que o app calcula, como calcula e como explicar cada resultado ao seu aluno.</p>
        </div>
      </div>

      <section className="card">
        <h2 style={{ marginBottom: 14 }}>Protocolos de dobras cutâneas</h2>
        <div className="grid g2">
          {Object.values(PROTOCOLS).map((p) => (
            <div key={p.label} className="metric" style={{ gap: 8 }}>
              <h3>{p.label}</h3>
              <p className="small muted">{p.about}</p>
              <p className="small">
                <strong>Homens:</strong> {p.folds('M').join(', ')} · <strong>Mulheres:</strong> {p.folds('F').join(', ')}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid g2">
        {SECTIONS.map((s) => (
          <section className="card" key={s.title}>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            {s.formula && <div className="formula">{s.formula}</div>}
            {s.items && (
              <ul>
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
