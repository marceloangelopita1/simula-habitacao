import fs from 'node:fs';
import assert from 'node:assert/strict';
import Decimal from '../vendor/decimal.mjs';
import {simulate,buildSchedule} from '../engine.js';

const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
const catalog=read('../data/municipal-rules.json');
const reference=read('../validation/caixa-arredondamento-2026-09-22.json');
const cents=x=>new Decimal(x).toDecimalPlaces(2).toNumber();
const run=patch=>{
 const r=simulate({...reference.input,...patch},catalog);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 return r;
};
const results=new Map(),remainingDifferences=[];
for(const c of reference.cases){
 const r=run(c.input);
 results.set(c.id,r);
 for(const field of ['principal','ownFunds','firstSummary'])assert.equal(r[field],c.expected[field],`${c.id}: ${field}`);
 // A regra SAC de 23/09 concilia também a última do imóvel de 314 mil.
 const delta=cents(new Decimal(r.lastSummary).minus(c.expected.lastSummary));
 assert.equal(delta,0,`${c.id}: última parcela, diferença ${delta}`);
 if(delta)remainingDifferences.push({case:c.id,field:'lastSummary',delta});
 // A mesma composição de recursos deve funcionar pelo modo de entrada.
 const entry=run({...c.input,amountMode:'entry',ownFunds:c.expected.ownFunds});
 assert.equal(entry.principal,r.principal,`${c.id}: entrada`);
 assert.equal(entry.firstSummary,r.firstSummary,`${c.id}: resumo por entrada`);
 if(c.plusFirstSummary!==undefined){
  const plus=run({...c.input,insurance:'plus'});
  assert.equal(plus.principal,r.principal,`${c.id}: capacidade Básico/Mais`);
  const plusDelta=cents(new Decimal(plus.firstSummary).minus(c.plusFirstSummary));
  assert.ok(Math.abs(plusDelta)<=(c.id==='max-314000'?.01:0),`${c.id}: resumo Mais, diferença ${plusDelta}`);
  if(plusDelta)remainingDifferences.push({case:c.id,field:'plusFirstSummary',delta:plusDelta});
 }
}

// Empates observados: 48,455 → 48,46 e 48,365 → 48,36. Os dois casos
// impedem tanto truncamento do total quanto arredondamento separado dos seguros.
assert.equal(results.get('tie-up').firstSummary,1657.05);
assert.equal(results.get('tie-down').firstSummary,1651.47);

const original=results.get(reference.partialSchedule.caseId);
assert.equal(reference.partialSchedule.rows.length,10);
for(const expected of reference.partialSchedule.rows){
 const actual=original.schedule.rows[expected.installment-1];
 for(const [key,value] of Object.entries(expected)){
  const actualValue=key==='paymentPI'?cents(new Decimal(actual.amortization).plus(actual.interest)):actual[key];
  assert.equal(actualValue,value,`Parcela ${expected.installment}: ${key}`);
 }
}
assert.equal(original.schedule.firstSummary,1779.85);
assert.equal(original.schedule.rows[0].total,1779.80);

// Resumos históricos também precisam ser protegidos: a suíte antiga já
// verificava suas planilhas inteiras, mas não a primeira/última do resumo.
const historical=read('./schedule-fixtures.json');
for(const [fixture,first,last] of [
 [historical[0],1777.61,489.74],
 [historical[1],1407.70,1354.92],
 [historical[2],2370.38,2299.56],
]){
 const s=buildSchedule({...fixture.input,system:fixture.input.system.toUpperCase()});
 assert.equal(s.firstSummary,first,`${fixture.case}: primeira do resumo`);
 assert.equal(s.lastSummary,last,`${fixture.case}: última do resumo`);
}

// Guarda de integração: avaliação e cobertura mais cara continuam sendo
// consideradas; o arredondamento da capacidade não muda o DFI do cronograma.
const appraised=run({propertyValue:315000,appraisal:314000,dfiOverride:.0072});
assert.equal(appraised.schedule.rows[0].dfi,22.61);
assert.ok(appraised.principal<original.principal);
assert.equal(original.schedule.rows[0].dfi,22.37);
assert.ok(run({propertyValue:315000,insurance:'expanded'}).principal<original.principal);
console.log(JSON.stringify({roundingRegression:{officialCases:reference.cases.length,additionalScheduleRows:10,historicalSummaries:3,remainingDifferences,failures:0}},null,2));
