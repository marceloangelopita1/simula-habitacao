import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import Decimal from '../vendor/decimal.mjs';
import { simulate, mipPercent, RULE_VERSION } from '../engine.js';

// Investigação: não altera as regras do motor. As alternativas são contrafactuais.
const root = new URL('../', import.meta.url);
const catalog = JSON.parse(await fs.readFile(new URL('data/municipal-rules.json', root)));
const base = {
  birthDate: '1988-02-01', simulationDate: '2026-09-14',
  income: 6000, propertyValue: 350000, municipalityId: '3543402',
  program: 'mcmv', system: 'SAC', months: 420, amountMode: 'fixed',
  principal: 193949.89, cotista: true, family: 'single',
  relationship: 'none', insurance: 'basic', subsidyMode: 'quick',
};
const run = patch => {
  const result = simulate({ ...base, ...patch }, catalog);
  if (!result.ok) throw Error(JSON.stringify(result.errors));
  return result;
};
const compact = r => ({
  principal: r.principal, ownFunds: r.ownFunds, months: r.months,
  nominalAnnual: r.nominalAnnual, firstSummary: r.firstSummary,
  lastSummary: r.lastSummary, firstRow: r.schedule.rows[0],
  lastRow: r.schedule.rows.at(-1), cet: r.cet,
  cetActualDates: r.cetActualDates, cesh: r.cesh,
  initialInsurance: r.initialInsurance, assessment: r.assessment,
  amortizationAdjustment: r.schedule.roundingAdjustment,
});
const sha = data => createHash('sha256').update(data).digest('hex');
const deployment = {};
for (const name of ['release.json', 'engine.js', 'app.js', 'data/municipal-rules.json']) {
  const response = await fetch(`https://marceloangelopita1.github.io/simula-habitacao/${name}`);
  if (!response.ok) throw Error(`Publicação: ${name}: HTTP ${response.status}`);
  const remote = Buffer.from(await response.arrayBuffer());
  if (name === 'release.json') deployment.release = JSON.parse(remote);
  else {
    const local = await fs.readFile(new URL(name, root));
    deployment[name] = { localSha256: sha(local), publishedSha256: sha(remote), equal: local.equals(remote) };
  }
}

// Resumos históricos preservados em app.js; não são consultas novas à CAIXA.
const cases = [
  { name: 'MCMV SAC', patch: {}, officialSummary: { first: 1777.61, last: 489.74 } },
  { name: 'MCMV PRICE', patch: { system: 'PRICE' }, officialSummary: { first: 1407.70, last: 1354.92 } },
  { name: 'SBPE PRICE salário', patch: {
    program: 'sbpe', system: 'PRICE', relationship: 'salary',
    income: 10000, propertyValue: 500000, principal: 245560.88, months: 360,
  }, officialSummary: { first: 2370.38, last: 2299.56 } },
];
const references = cases.map(({ name, patch, officialSummary }) => ({
  name, input: { ...base, ...patch }, officialSummary,
  result: compact(run(patch)),
  resultWithSimulationDate19September: compact(run({ ...patch, simulationDate: '2026-09-19' })),
}));

// Os quatro principais oficiais são os registrados em validation/matematica.md.
// Hipótese formulada com essa amostra: ainda não há caso oficial novo de validação.
const maximumCases = [
  ['MCMV renda 6000', {}, 193949.89],
  ['MCMV renda 3000', { income: 3000, propertyValue: 240000 }, 129966.62],
  ['SBPE renda 6000', { program: 'sbpe' }, 145734.57],
  ['SBPE renda 10000', { program: 'sbpe', income: 10000, propertyValue: 500000 }, 245931.65],
];
const maximumHypothesis = maximumCases.map(([name, patch, official]) => {
  const r = run({ ...patch, amountMode: 'max' });
  const D = value => new Decimal(value);
  const additional = D(r.propertyValue)
    .mul(r.insuranceModel === 'mcmv' ? '.00006396' : '.00015878')
    .toDecimalPlaces(2);
  const numerator = D(r.input.income).mul('.3').minus(r.adminFee)
    .minus(D(r.propertyValue).mul(r.dfiRatePercent).div(100)).minus(additional);
  const coefficient = D(1).div(r.months).plus(D(r.nominalAnnual).div(1200))
    .plus(D(mipPercent(r.insuranceModel, r.input.birthDate, r.input.simulationDate)).div(100));
  const truncatedCoefficient = coefficient.toDecimalPlaces(8, Decimal.ROUND_DOWN);
  const estimatedWithTruncation = numerator.div(truncatedCoefficient)
    .toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber();
  return {
    name, input: r.input, official, original: r.principal,
    originalMinusOfficial: D(r.principal).minus(official).toNumber(),
    numerator: numerator.toString(), coefficient: coefficient.toString(),
    truncatedCoefficient: truncatedCoefficient.toString(),
    estimatedWithTruncation, matchesHistoricalOfficial: estimatedWithTruncation === official,
  };
});
const sbpe = cases[2].patch;
const sensitivities = [
  ['MCMV básico', {}],
  ['MCMV Mais', { insurance: 'plus' }],
  ['MCMV Ampliado', { insurance: 'expanded' }],
  ['Nascimento sintético diferente, também 38 anos', { birthDate: '1988-09-01' }],
  ['Avaliação sem tarifa', { assessmentOverride: 0 }],
  ['Máximo com seguro básico', { amountMode: 'max' }],
  ['Máximo com seguro Mais', { amountMode: 'max', insurance: 'plus' }],
  ['SBPE taxa nominal automática', sbpe],
  ['SBPE nominal digitada com duas casas', { ...sbpe, nominalOverride: 10.65 }],
].map(([name, patch]) => ({ name, patch, result: compact(run(patch)) }));
const report = {
  investigatedAt: new Date().toISOString(), ruleVersion: RULE_VERSION,
  evidenceScope: {
    currentBrowserTabsObserved: false, newOfficialSimulations: 0,
    blocker: 'node_repl rejeita sandboxCwd file:///home/mapita/projetos/simula-habitacao, inclusive após js_reset.',
    historicalSources: ['app.js', 'tests/schedule-fixtures.json', 'validation/matematica.md'],
    limitation: 'A hipótese de truncamento foi ajustada aos quatro casos históricos; não é validação independente nem acesso à implementação da CAIXA.',
  },
  deployment, references, maximumHypothesis, sensitivities,
};
const destination = new URL('diagnostico-2026-09-19.json', import.meta.url);
await fs.writeFile(destination, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  output: destination.pathname,
  publishedFilesMatch: Object.values(deployment).filter(x => 'equal' in x).every(x => x.equal),
  summaryMatches: references.map(x => ({
    case: x.name,
    first: x.result.firstSummary === x.officialSummary.first,
    last: x.result.lastSummary === x.officialSummary.last,
  })),
  maximumHypothesisMatches: maximumHypothesis.filter(x => x.matchesHistoricalOfficial).length,
  maximumCaseCount: maximumHypothesis.length,
}, null, 2));
