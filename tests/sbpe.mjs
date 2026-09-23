import fs from 'node:fs';
import assert from 'node:assert/strict';
import Decimal from '../vendor/decimal.mjs';
import {simulate,mipPercent} from '../engine.js';

const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
const catalog=read('../data/municipal-rules.json');
const reference=read('../validation/caixa-sbpe-2026-09-22.json');
const cents=v=>new Decimal(v).toDecimalPlaces(2).toNumber();
const run=input=>{
 const r=simulate({...reference.input,...input},catalog);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 return r;
};
const results=new Map(),remainingDifferences=[];
for(const c of reference.cases){
 const r=run(c.input);results.set(c.id,r);
 for(const [key,expected] of Object.entries(c.expected)){
  const actual=key==='paymentPITotal'?cents(new Decimal(r.schedule.sums.amortization).plus(r.schedule.sums.interest)):cents(r[key]);
  const delta=cents(new Decimal(actual).minus(expected));
  assert.equal(delta,c.knownDifferences?.[key]??0,`${c.id}: ${key}`);
  if(delta)remainingDifferences.push({case:c.id,field:key,delta});
 }
 // Entrada e principal fixo reproduzem o mesmo resumo observado. No controle
 // comum, usam o principal oficial: sua diferença de capacidade é independente.
 for(const input of [{amountMode:'entry',ownFunds:c.expected.ownFunds},{amountMode:'fixed',principal:c.expected.principal}]){
  const fixed=run({...c.input,...input});
  assert.equal(fixed.principal,c.expected.principal,`${c.id}: ${input.amountMode}`);
  for(const field of ['firstSummary','lastSummary'])assert.equal(cents(new Decimal(fixed[field]).minus(c.expected[field])),c.knownFixedDifferences?.[field]??0,`${c.id}: ${field} fixo`);
 }
 if(c.plusFirstSummary!==undefined&&c.input.sbpeVariant!=='standard'){
  const plus=run({...c.input,insurance:'plus'});
  assert.equal(plus.principal,r.principal,`${c.id}: seguro Especial mantém a capacidade`);
  assert.equal(plus.firstSummary,c.plusFirstSummary,`${c.id}: resumo Especial`);
 }
}

let rowCount=0;
for(const capture of reference.schedules){
 const r=results.get(capture.caseId);
 assert.equal(capture.rows.length,r.months,`${capture.caseId}: captura completa`);
 for(const [index,expected] of capture.rows.entries()){
  assert.equal(expected.installment,index+1,'Sequência sem lacunas ou duplicatas');
  const actual=r.schedule.rows[index];
  assert.equal(actual.date,expected.date);
  const values={...actual,paymentPI:cents(new Decimal(actual.amortization).plus(actual.interest)),insurance:cents(new Decimal(actual.mip).plus(actual.dfi))};
  for(const key of ['paymentPI','mip','dfi','insurance','adminFee','total','balance'])assert.equal(values[key],expected[key],`${capture.caseId}, parcela ${index+1}: ${key}`);
  rowCount++;
 }
}

// O aniversário muda o coeficiente; idade de contratação não congela a faixa.
for(const [date,rate] of [['2028-01-31',.3259],['2028-02-01',.4894],['2033-01-31',.4894],['2033-02-01',.5312],['2037-07-22',.5312]])assert.equal(mipPercent('sbpe','1957-02-01',date),rate,date);
const linked=results.get('linked-sac-original'),standard=run({sbpeVariant:'standard'});
assert.equal(linked.assessment,0);
assert.equal(standard.assessment,841.44);
assert.equal(linked.capacityReferenceExtra,49.89);
assert.equal(standard.capacityReferenceExtra,123.85);
assert.equal(linked.commitmentPercent,30);
assert.equal(results.get('linked-price-360').commitmentPercent,25);
assert.equal(linked.schedule.sums.extraPremium,0,'Reserva de capacidade não vira cobrança no básico');
assert.equal(run({assessmentOverride:841.44}).assessment,841.44,'Preserva tarifa oficial informada');
assert.equal(run({system:'PRICE',commitmentPercent:20}).commitmentPercent,20);
assert.ok(run({system:'PRICE',commitmentPercent:20}).principal<results.get('linked-price-360').principal);
assert.equal(run({sbpeVariant:'standard',linkedProject:true}).principal,standard.principal,'Dispensa MCMV não seleciona SBPE vinculado');
assert.equal(run({program:'auto'}).principal,linked.principal,'Enquadramento automático preserva a modalidade SBPE');
const oldInput={...reference.input};delete oldInput.sbpeVariant;
assert.equal(simulate(oldInput,catalog).principal,standard.principal,'Registros antigos mantêm o SBPE comum');
for(const [system,cap] of [['SAC',90],['PRICE',80]]){
 assert.equal(run({system,quotaOverride:cap}).quota,cap);
 assert.equal(simulate({...reference.input,system,quotaOverride:cap+.01},catalog).ok,false);
 assert.equal(simulate({...reference.input,system,sbpeVariant:'standard',quotaOverride:cap},catalog).ok,false);
}
assert.equal(simulate({...reference.input,sbpeVariant:'invalid'},catalog).ok,false);
const mcmv={program:'mcmv',income:6000,propertyValue:350000,linkedProject:false};
assert.equal(run({...mcmv,sbpeVariant:'linked'}).principal,run({...mcmv,sbpeVariant:'standard'}).principal);
assert.equal(run({...mcmv,sbpeVariant:'linked'}).assessment,run({...mcmv,sbpeVariant:'standard'}).assessment);
assert.equal(run({...mcmv,linkedProject:true}).assessment,run(mcmv).assessment,'Vinculação MCMV não presume dispensa');
assert.equal(run({...mcmv,linkedProject:true,assessmentOverride:0}).assessment,0,'Isenção oficial explícita continua disponível');
console.log(JSON.stringify({suite:'SBPE 22/09/2026',cases:reference.cases.length,officialRows:rowCount,remainingDifferences},null,2));
