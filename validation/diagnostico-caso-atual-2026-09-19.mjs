import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import Decimal from '../vendor/decimal.mjs';

// Este diagnóstico preserva o estado ANTERIOR à correção, independentemente
// do motor atual. A regressão do motor corrigido está em tests/age-capacity.mjs.
const baselineRevision='8c0f6cf094deba1c6b9e10db04ec981739ffddfc';
const baselineSource=execFileSync('git',['show',`${baselineRevision}:engine.js`],{
  cwd:new URL('../',import.meta.url),encoding:'utf8',
}).replace("'./vendor/decimal.mjs'",JSON.stringify(new URL('../vendor/decimal.mjs',import.meta.url).href));
const {simulate,buildSchedule,computeCet,ageOn,parseDate}=await import('data:text/javascript,'+encodeURIComponent(baselineSource));

// Experimentos de diagnóstico; nenhuma regra de produção é modificada.
// O dia do nascimento oficial foi substituído por um dia sintético no mesmo mês.
// Ambos antecedem o vencimento (dia 19), preservando todos os reenquadramentos.
const catalog = JSON.parse(await fs.readFile(new URL('../data/municipal-rules.json', import.meta.url)));
const official = JSON.parse(await fs.readFile(new URL('caixa-price-usado-2026-09-19.json', import.meta.url)));
const D = x => new Decimal(x);
const money = x => D(x).toDecimalPlaces(2).toNumber();
const base = {
  birthDate: '1988-02-01', simulationDate: '2026-09-14',
  income: 3578, propertyValue: 264000, municipalityId: '3543402',
  program: 'mcmv', system: 'PRICE', months: 420, propertyType: 'used',
  cotista: true, family: 'single', insurance: 'basic', amountMode: 'max',
};
const run = patch => {
  const r = simulate({ ...base, ...patch }, catalog);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  return r;
};
const compact = r => ({
  principal: r.principal, ownFunds: r.ownFunds, subsidy: r.subsidy.amount,
  firstSummary: r.firstSummary, lastSummary: r.lastSummary,
  firstRow: r.schedule.rows[0], lastRow: r.schedule.rows.at(-1),
  cet: r.cet, cesh: r.cesh,
});
const original = run({});
assert.equal(original.principal, 183666.32);
assert.equal(original.ownFunds, 80007.68);
assert.equal(original.firstSummary, 1056.51);
assert.equal(original.lastSummary, 1011.32);

const normalized = {
  birthDate: '1998-08-01', simulationDate: '2026-09-19', subsidyMode: 'none',
};
const samePrincipal = buildSchedule({
  principal: official.profile.principal, propertyValue: 264000,
  months: 420, nominalAnnual: 5.5, system: 'PRICE',
  ...normalized, insuranceModel: 'mcmv', adminFee: 25, dfiRatePercent: .0071,
});
const differences = { paymentPI: [], balance: [], date: [], dfi: [], adminFee: [], mip: [], total: [] };
assert.equal(official.rows.length, 420);
for (let k = 0; k < 420; k++) {
  const a = official.rows[k], b = samePrincipal.rows[k];
  assert.equal(a.installment, k + 1);
  for (const key of Object.keys(differences)) {
    const actual = key === 'paymentPI' ? money(D(b.amortization).plus(b.interest)) : b[key];
    if (actual !== a[key]) differences[key].push(k + 1);
  }
}
for (const key of ['paymentPI', 'balance', 'date', 'dfi', 'adminFee']) assert.equal(differences[key].length, 0);
assert.equal(differences.mip.length, 94);

// Coeficientes compatíveis com TODAS as parcelas observadas, incluindo transições.
// A amostra observa idades 28–63; não valida idades menores que 28 nem outras apólices.
const observedBands = [[30,.0085],[35,.0108],[40,.0144],[45,.0244],[50,.0359],[55,.0645],[60,.0764],[65,.1296]];
const reconstructedRows = samePrincipal.rows.map(r => {
  const rate = observedBands.find(([max]) => ageOn(normalized.birthDate, r.date) <= max)[1];
  const mip = r.installment === 420 ? 0 : money(D(r.balance).mul(rate).div(100));
  return { ...r, mip, total: money(D(r.amortization).plus(r.interest).plus(mip).plus(r.dfi).plus(r.adminFee)) };
});
for (let k = 0; k < 420; k++) {
  assert.equal(reconstructedRows[k].mip, official.rows[k].mip, `MIP ${k+1}`);
  assert.equal(reconstructedRows[k].total, official.rows[k].total, `Total ${k+1}`);
}
const principal = official.profile.principal;
const initialInsurance = money(D(principal).mul('.000085')) + 18.74;
const assessment = money(D(principal).mul('.015'));
const netCredit = money(D(principal).minus(assessment).minus(initialInsurance));
const cet = computeCet(reconstructedRows, netCredit, normalized.simulationDate);
const cesh = reconstructedRows.reduce((s, r) => s + (r.mip + r.dfi) / Math.pow(1.008,
  12 * (parseDate(r.date) - parseDate(normalized.simulationDate)) / 86400000 / 365), 0) / principal * 100;
assert.equal(money(cet), official.profile.reportedCet);
assert.equal(money(cesh), official.profile.reportedCesh);

// A hipótese de truncamento de coeficiente já ajustava quatro registros SAC.
// Este PRICE adiciona validação independente; DFI precisa ser monetário (18,74).
const i = D(5.5).div(1200);
const coefficient = i.div(D(1).minus(D(1).plus(i).pow(-420))).plus('.000085');
const roundedDfi = money(D(264000).mul('.000071'));
const extraReference = money(D(264000).mul('.00006396'));
const capacity = D(3578).mul('.3').minus(25).minus(roundedDfi).minus(extraReference);
const truncatedCoefficient = coefficient.toDecimalPlaces(8, Decimal.ROUND_DOWN);
const recoveredMaximum = capacity.div(truncatedCoefficient).toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber();
assert.equal(recoveredMaximum, principal);
const sum = key => money(official.rows.reduce((s,r) => s.plus(r[key]), D(0)));

const result = {
  evidence: 'Duas abas reais do Chrome e 420 parcelas oficiais observadas em 19/09/2026.',
  inputPrivacy: 'Nascimento oficial substituído por data sintética equivalente para estes vencimentos. Sem CPF ou telefone.',
  original: compact(original),
  birthOnly: compact(run({ birthDate: normalized.birthDate })),
  sameAgeNoSubsidy: compact(run(normalized)),
  initialMipOnly: compact(run({ ...normalized, insurance: 'custom', customMipPercent: .0085, dfiOverride: .0071 })),
  subsidy: original.subsidy,
  scheduleComparison: Object.fromEntries(Object.entries(differences).map(([k,v]) => [k,{ count:v.length, first:v[0]??null, last:v.at(-1)??null }])),
  reconstructed: { observedBands, matchingRows:420, cet, cesh, assessment, initialInsurance:money(initialInsurance), netCredit },
  maximum: { coefficient:coefficient.toString(), truncatedCoefficient:truncatedCoefficient.toString(), roundedDfi, extraReference, capacity:capacity.toNumber(), recoveredMaximum },
  officialTotals: { paymentPI:sum('paymentPI'), mip:sum('mip'), dfi:sum('dfi'), adminFee:sum('adminFee'), total:sum('total') },
  limitations: [
    'Faixas recuperadas validadas apenas no contrato/apólice e nas idades observadas (28–63 anos).',
    'Truncamento reproduz o principal observado, mas não prova algoritmo interno universal.',
    'CAIXA sem desconto na composição observada; causa normativa do subsídio zero ainda não confirmada.',
    'Tarifa de avaliação de 1,5% é hipótese que reproduz o CET exibido; não foi apresentada separadamente na tela.',
    'Custom MIP constante serve apenas para isolar financiamento máximo; não reproduz custos futuros.',
  ],
};
await fs.writeFile(new URL('diagnostico-caso-atual-2026-09-19.json', import.meta.url), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
