<p align="center">
  <img src="public/logo.svg" width="96" alt="ACOSTA Avalia" />
</p>

<h1 align="center">ACOSTA Avalia</h1>

<p align="center">
  App de <strong>avaliação física</strong> moderno, minimalista e didático, feito para personal trainers.<br/>
  Identidade visual do <strong>Método ACOSTA</strong>.
</p>

---

## O que ele faz

Reúne num lugar só o que os principais apps do mercado (Avaliação Física PRO, HAPE, Sanny, PhysioCode, PostureScreen e MFIT) fazem de melhor:

| Área | Recursos |
|---|---|
| **Gestão de alunos** | Cadastro, busca, histórico de avaliações e alerta de reavaliação (60+ dias) |
| **Anamnese** | PAR-Q com alerta automático, histórico de saúde, hábitos e nível de atividade |
| **Antropometria** | Peso, estatura, 16 perímetros, IMC, RCQ e relação cintura/estatura |
| **Composição corporal** | Dobras cutâneas (Jackson & Pollock 3 e 7, Guedes, Durnin & Womersley, Faulkner), equações de Siri/Brozek, método US Navy e bioimpedância |
| **Metabolismo** | TMB por Katch-McArdle ou Mifflin-St Jeor e gasto energético diário |
| **Postural** | Fotos anterior, lateral e posterior com grade e fio de prumo, além de um checklist de 25 desvios |
| **Funcional** | Flexão de braço, abdominal, banco de Wells, preensão manual, VO₂máx (Cooper, Rockport, banco de Queens) e FMS completo |
| **Relatório em PDF** | PDF completo com a sua marca: todas as medidas, PAR-Q, dobras, testes, FMS, fotos posturais, gráficos de evolução, histórico e assinatura, com numeração de páginas |
| **Envio ao aluno** | Baixar PDF, compartilhar com o arquivo anexado (celular e Windows 11), WhatsApp e e-mail já endereçados ao aluno com mensagem pronta |
| **Evolução** | Gráficos de peso, %G, massa magra, massa gorda, IMC, perímetros e VO₂máx |
| **Didático** | Cada medida tem uma dica de como medir, cada protocolo é explicado, e há uma página de guia com todas as fórmulas |

Os resultados são calculados **ao vivo**, enquanto você digita, e tudo é salvo automaticamente.

## Usar online

**https://handrebol10.github.io/acosta-avalia/**

Abre direto no navegador, sem instalar nada, inclusive no celular ou tablet. Os dados continuam salvos só no aparelho em que você estiver usando. A versão online e a versão local guardam dados **separados**: para passar de uma para a outra, use **Ajustes → Exportar / Restaurar backup**.

## Como usar no seu computador

1. Instale o [Node.js](https://nodejs.org) (versão LTS), uma vez só.
2. Baixe este repositório (botão verde **Code → Download ZIP**) e extraia a pasta.
3. Dê dois cliques em **`Iniciar ACOSTA Avalia.bat`**.

Na primeira vez ele instala as dependências (leva cerca de 1 minuto). Depois disso, o app abre sozinho no navegador em `http://localhost:5180`. Deixe a janela preta aberta enquanto usa o app.

Pelo terminal:

```bash
npm install
npm run dev
```

## Seus dados

- Tudo fica salvo **somente no seu computador**, no próprio navegador (IndexedDB). Nada vai para a internet.
- Em **Ajustes → Backup**, exporte um arquivo `.json` com todos os alunos, avaliações e fotos. Faça isso com frequência e guarde no Drive ou num pendrive.
- Para usar em outro computador, basta importar esse backup.

## Referências usadas nos cálculos

- Jackson & Pollock (1978, 1980) · Guedes (1985) · Durnin & Womersley (1974) · Faulkner (1968) · Siri (1961) · Brozek (1963)
- Hodgdon & Beckett, método US Navy (1984)
- OMS: IMC, cintura e relação cintura/quadril
- American Council on Exercise: faixas de % de gordura
- Diretrizes Brasileiras de Hipertensão (2020)
- Cooper Institute: VO₂máx · CSEP/ACSM: flexão de braço e sentar e alcançar
- Cook et al., Functional Movement Screen

> Os valores são estimativas por equações de referência. Servem para acompanhar a evolução de cada aluno e não substituem uma avaliação clínica.

## Tecnologia

React 19 + TypeScript + Vite. Sem servidor e sem banco de dados externo.

```bash
npm run build    # gera a versão final em dist/
npm run deploy   # gera e publica a versão online no GitHub Pages (branch gh-pages)
```

---

<p align="center"><sub>Feito para o Método ACOSTA · personalonlineacosta.com.br</sub></p>
