import fs from 'node:fs';
import assert from 'node:assert/strict';
import Decimal from '../vendor/decimal.mjs';
import {simulate,localToday} from '../engine.js';

const read=file=>JSON.parse(fs.readFileSync(new URL(file,import.meta.url)));
const ref=read('../validation/caixa-centavos-2026-09-23.json');
const rows=read('../validation/'+ref.scheduleFile);
const catalog=read('../data/municipal-rules.json');
const money=x=>new Decimal(x).toDecimalPlaces(2).toNumber();
const run=input=>{const r=simulate({...ref.input,...input},catalog);assert.equal(r.ok,true,JSON.stringify(r.errors));return r;};
let first;
for(const c of ref.cases){
 const r=run(c.input);if(c.id===ref.scheduleCaseId)first=r;
 for(const mode of [{}, {amountMode:'entry',ownFunds:c.expected.ownFunds}, {amountMode:'fixed',principal:c.expected.principal}]){
  const result=run({...c.input,...mode});
  for(const [key,expected]of Object.entries(c.expected))assert.equal(result[key],expected,`${c.id}/${mode.amountMode||'original'}: ${key}`);
 }
 for(const [insurance,expected]of [['plus',c.plusFirstSummary],['expanded',c.expandedFirstSummary]]){
  const extra=run({...c.input,insurance});
  assert.equal(extra.principal,r.principal,`${c.id}: capacidade ${insurance}`);
  assert.equal(extra.firstSummary,expected,`${c.id}: primeira ${insurance}`);
  assert.equal(extra.lastSummary,c.expected.lastSummary,`${c.id}: última ${insurance}`);
 }
 assert.equal(r.nominalAnnual,10.9259,`${c.id}: precisão da taxa de cálculo`);
 assert.equal(r.nominalDisplayed,10.92,`${c.id}: taxa apresentada`);
 assert.equal(r.schedule.sums.extraPremium,0,'Reserva não é cobrança do seguro básico');
}
assert.equal(rows.length,420);
assert.equal(first.schedule.rows.length,420);
for(const [index,expected]of rows.entries()){
 assert.equal(expected.installment,index+1);
 const actual=first.schedule.rows[index];
 const values={...actual,paymentPI:money(new Decimal(actual.amortization).plus(actual.interest)),insurance:money(new Decimal(actual.mip).plus(actual.dfi))};
 for(const [key,value]of Object.entries(expected))assert.equal(values[key],value,`Parcela ${index+1}: ${key}`);
}
assert.equal(first.schedule.rows[0].total,4321.72);
assert.equal(first.schedule.rows.at(-1).total,891.48);
assert.equal(first.paymentPITotal,1051845.56);
assert.equal(first.schedule.sums.total,1168268.10);
assert.equal(money(first.cet),12.61);
assert.equal(money(first.cesh),7);
// A taxa exibida não deve contaminar os juros, mesmo em uma oferta manual.
const override=run({propertyValue:1500000,nominalOverride:10.9999});
assert.equal(override.nominalDisplayed,10.99);assert.equal(override.nominalAnnual,10.9999);
assert.notEqual(override.schedule.rows[0].interest,first.schedule.rows[0].interest);
// A API também usa o dia atual quando a data é omitida; registros explícitos
// permanecem determinísticos. Virada do dia/fuso são testados pela interface.
const input={...ref.input,propertyValue:1500000};delete input.simulationDate;
assert.equal(simulate(input,catalog).input.simulationDate,localToday());
assert.equal(first.input.simulationDate,'2026-09-23');
console.log(JSON.stringify({centavosRegression:{officialCases:ref.cases.length,officialRows:rows.length,modes:['max','entry','fixed'],insurancePackages:3,failures:0}},null,2));
