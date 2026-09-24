import fs from 'node:fs';
import assert from 'node:assert/strict';
import {simulate} from '../engine.js';

const catalog=JSON.parse(fs.readFileSync(new URL('../data/municipal-rules.json',import.meta.url)));
const base={simulationDate:'2026-09-23',municipalityId:'3543402',income:7000,propertyValue:350000,birthDate:'1988-02-01',family:'single',program:'mcmv',system:'SAC',amountMode:'payment',maxInstallment:1604.28,insurance:'basic',months:420};
const passed=[];
function test(name,fn){fn();passed.push(name);}
function run(changes={}){return simulate({...base,...changes},catalog);}
function ok(changes={}){const r=run(changes);assert.equal(r.ok,true,JSON.stringify(r.errors));return r;}
function capped(changes={}){
 const r=ok(changes),p=r.paymentLimit;
 assert.equal(p.satisfied,true);
 assert.ok(r.firstSummary<=p.requested,`resumo ${r.firstSummary} > ${p.requested}`);
 assert.ok(r.schedule.rows[0].total<=p.requested,`cronograma ${r.schedule.rows[0].total} > ${p.requested}`);
 assert.ok(r.principal<=r.maximum);
 assert.equal(r.principal,p.maximum);
 assert.equal(Math.round((r.principal+r.ownFunds+r.fgtsUse+r.aid+r.subsidy.amount)*100),Math.round(r.propertyValue*100));
 assert.equal(p.peak.amount,Math.max(...r.schedule.rows.map(row=>row.total)));
 assert.equal(r.schedule.rows[p.peak.installment-1].date,p.peak.date);
 return r;
}

for(const system of ['SAC','PRICE']){
 test(`${system}: teto menor, igual e maior que renda`,()=>{
  const normal=ok({system,amountMode:'max'});
  const low=capped({system}),equal=capped({system,maxInstallment:2100}),high=capped({system,maxInstallment:3000});
  assert.ok(low.principal<normal.principal);assert.ok(low.ownFunds>normal.ownFunds);
  assert.equal(equal.principal,normal.principal);assert.equal(high.principal,normal.principal);
  assert.ok(low.paymentLimit.limitingFactors.includes('payment'));
  assert.deepEqual(high.paymentLimit.limitingFactors,system==='SAC'?['income']:['quota']);
  for(const r of [low,equal,high]){
   assert.equal(r.input.income,normal.input.income);assert.equal(r.nominalAnnual,normal.nominalAnnual);
   assert.equal(r.program,normal.program);assert.equal(r.subsidy.amount,normal.subsidy.amount);
  }
 });
 test(`${system}: teto em centavos é monotônico`,()=>{
  let principal=0;
  for(const maxInstallment of [500,999.99,1000,1000.01,1604.27,1604.28,1604.29]){
   const r=capped({system,maxInstallment});assert.ok(r.principal>=principal);principal=r.principal;
  }
 });
 for(const insurance of ['basic','plus','expanded','custom'])test(`${system}: seguro ${insurance}`,()=>{
  capped({system,insurance,...(insurance==='custom'?{customMipPercent:.06,dfiOverride:.008}:{})});
 });
 for(const subsidyMode of ['quick','manual','none'])test(`${system}: subsídio ${subsidyMode}, FGTS e aporte`,()=>{
  const input={system,income:3000,propertyValue:240000,family:'dependents',subsidyMode,subsidyManual:8697,fgtsUse:10000,fgtsPropertyHistory:'clear',confirmedAid:13000,aidConfirmed:true,maxInstallment:700};
  const r=capped(input),normal=ok({...input,amountMode:'max'});
  assert.equal(r.subsidy.amount,normal.subsidy.amount);assert.equal(r.nominalAnnual,normal.nominalAnnual);
  assert.ok(r.principal<normal.principal);
 });
 test(`${system}: taxa zero e prazo de um mês`,()=>{capped({system,nominalOverride:0,months:1,maxInstallment:1604.28});});
}
test('Cálculo independente sem juros: orçamento menos reserva de R$ 6,40, por 100 meses',()=>{
 const r=capped({propertyValue:100000,months:100,nominalOverride:0,insurance:'custom',customMipPercent:0,dfiOverride:0,adminOverride:0,maxInstallment:500});
 assert.equal(r.principal,49360);assert.equal(r.firstSummary,493.60);assert.equal(r.schedule.rows[0].total,493.60);
});
test('Quota limita mesmo com parcela alta',()=>{
 const r=capped({propertyValue:100000,maxInstallment:3000});assert.equal(r.principal,80000);assert.deepEqual(r.paymentLimit.limitingFactors,['quota']);
});
test('Recursos limitam antes do teto e não produzem entrada negativa',()=>{
 const r=capped({propertyValue:200000,fgtsUse:150000,maxInstallment:3000});assert.equal(r.principal,50000);assert.equal(r.ownFunds,0);assert.deepEqual(r.paymentLimit.limitingFactors,['resources']);
});
test('Dois compradores mantêm prazo pela maior idade e seguro ponderado',()=>{
 const r=capped({family:'two',secondBirthDate:'1955-10-01',secondSharePercent:50});assert.ok(r.months<420);
 assert.ok(r.firstSummary<=1604.28&&r.schedule.rows[0].total<=1604.28);
});
for(const input of [
 {birthDate:'1985-10-01',propertyValue:200000,maxInstallment:1400},
 {program:'sbpe',income:20000,propertyValue:500000,birthDate:'1955-10-01',maxInstallment:5000},
])test(`MIP no primeiro vencimento: ${input.program||'mcmv'}`,()=>{
 const r=capped(input);assert.equal(r.paymentLimit.initialAdjustment,true);
 const next=ok({...input,amountMode:'fixed',principal:(Math.round(r.principal*100)+1)/100});
 assert.ok(next.firstSummary>input.maxInstallment||next.schedule.rows[0].total>input.maxInstallment,'o próximo centavo não deve caber');
});
test('PRICE evidencia parcela futura superior ao limite inicial',()=>{
 const r=capped({system:'PRICE'});assert.equal(r.paymentLimit.futureExceeds,true);assert.ok(r.paymentLimit.peak.installment>1);assert.ok(r.paymentLimit.peak.amount>1604.28);
});
for(const sbpeVariant of ['standard','linked'])for(const system of ['SAC','PRICE'])test(`SBPE ${sbpeVariant} ${system}`,()=>{
 const r=capped({program:'sbpe',income:16000,propertyValue:650000,sbpeVariant,system,maxInstallment:3000});
 assert.equal(r.months,system==='PRICE'?360:420);assert.equal(r.commitmentPercent,sbpeVariant==='linked'&&system==='PRICE'?25:30);
});
test('Classe Média e Pró-Cotista conservam enquadramento',()=>{
 for(const program of ['middle','pro']){
  const r=capped({program,income:10000,propertyValue:500000,activeFgts:true,maxInstallment:2000});assert.equal(r.program,program);
 }
});
test('Mínimo SBPE não gera resultado supostamente compatível',()=>{
 const r=run({program:'sbpe',income:10000,propertyValue:500000,relationship:'salary',maxInstallment:500});
 assert.equal(r.ok,false);assert.ok(r.errors.some(e=>e.field==='maxInstallment'&&e.message.includes('150 mil')));
});
for(const maxInstallment of [undefined,null,'',0,-1,NaN,Infinity,'inválido','1.604,28',100000000.01,.001,1000.001,true,[],[1200],{}])test(`Teto inválido: ${String(maxInstallment)}`,()=>{
 const r=run({maxInstallment});assert.equal(r.ok,false);assert.ok(r.errors.some(e=>e.field==='maxInstallment'));
});
test('Teto válido mas insuficiente para seguro e tarifa',()=>{
 const r=run({maxInstallment:25});assert.equal(r.ok,false);assert.ok(r.errors.some(e=>e.field==='maxInstallment'&&e.message.includes('financiamento positivo')));
});
for(const amountMode of ['max','fixed','entry'])test(`Modo ${amountMode} ignora teto inativo, inclusive inválido`,()=>{
 const params={amountMode,principal:100000,ownFunds:250000},expected=ok(params);
 for(const maxInstallment of [undefined,null,1,NaN,'inválido']){
  const r=ok({...params,maxInstallment});assert.equal(r.paymentLimit,null);assert.equal(r.input.maxInstallment,null);
  for(const key of ['principal','maximum','ownFunds','firstSummary','lastSummary','cet'])assert.equal(r[key],expected[key]);
 }
});
test('Modo por parcela ignora principal e entrada ocultos',()=>{
 const expected=capped(),r=capped({principal:999999999,ownFunds:999999999});assert.equal(r.principal,expected.principal);
});
console.log(JSON.stringify({suite:'Parcela máxima',checks:passed.length,failures:0,passed},null,2));
