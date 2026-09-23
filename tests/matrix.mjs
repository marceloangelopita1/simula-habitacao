// Referências externas: ler apenas inputs e observed da auditoria,
// nunca os resultados antigos do próprio motor (ours) como referência.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import Decimal from '../vendor/decimal.mjs';
import {simulate,calculateSubsidy,RULE_VERSION} from '../engine.js';

const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
const reference=read('../validation/comparacao-matriz-2026-09-22.json');
const catalog=read('../data/municipal-rules.json');
const money=x=>new Decimal(x).toDecimalPlaces(2).toNumber();
const difference=(actual,expected)=>money(new Decimal(actual).minus(expected));
const inputOf=c=>({...reference.baseInput,...c.input});
const run=input=>{const r=simulate(input,catalog);assert.equal(r.ok,true,JSON.stringify(r.errors));return r;};

// Resíduos identificados na auditoria e preservados explicitamente. Não
// usar tolerância global que esconda nova divergência em outra métrica.
const known={
 S03:{paymentPITotal:1.77},
 S07:{principal:-.86,ownFunds:.86,lastSummary:.01,paymentPITotal:-3.28},
 S08:{principal:-.86,ownFunds:.86,lastSummary:.01,cet:-.01,paymentPITotal:-3.28},
 S09:{principal:-.86,ownFunds:.86,firstSummary:.01,lastSummary:.01,paymentPITotal:-3.28},
 S10:{paymentPITotal:2},S11:{paymentPITotal:1.2},S13:{paymentPITotal:1.13},
 S14:{paymentPITotal:.9},S17:{paymentPITotal:.9},S19:{paymentPITotal:.9},S20:{paymentPITotal:.9},
 S22:{lastSummary:.01},S23:{paymentPITotal:1.15},S24:{lastSummary:.01},
 S25:{firstSummary:-.01},S26:{firstSummary:-.01},S28:{paymentPITotal:2.01},
 S29:{firstSummary:.01,lastSummary:.01,paymentPITotal:.05},
 S30:{principal:-.86,ownFunds:.86,firstSummary:-.01,lastSummary:-.01,paymentPITotal:-3.31},
};
const results=new Map(),remainingDifferences=[];
let metrics=0,officialRows=0;
assert.equal(reference.cases.length,30);
assert.equal(new Set(reference.cases.map(c=>c.id)).size,30);
for(const c of reference.cases){
 const r=run(inputOf(c));results.set(c.id,r);
 const actual={...r,subsidy:r.subsidy.amount,nominalDisplayed:r.nominalAnnual,paymentPITotal:money(new Decimal(r.schedule.sums.amortization).plus(r.schedule.sums.interest))};
 for(const [key,expected] of Object.entries(c.observed)){
  if(typeof expected!=='number')continue;
  assert.equal(typeof actual[key],'number',`${c.id}: métrica ${key}`);
  const delta=difference(money(actual[key]),expected);
  const expectedDelta=key==='nominalDisplayed'&&r.program==='sbpe'?.01:known[c.id]?.[key]??0;
  assert.equal(delta,expectedDelta,`${c.id}: ${key}`);
  if(delta)remainingDifferences.push({case:c.id,field:key,delta});
  metrics++;
 }
 assert.equal(money(r.principal+r.ownFunds+r.subsidy.amount),r.propertyValue,`${c.id}: composição de recursos`);
 // Fixar o principal oficial isola a apólice do resíduo do máximo SBPE.
 const fixed=run({...inputOf(c),amountMode:'fixed',principal:c.observed.principal});
 for(const [name,index] of [['firstRow',0],['sampleRow211',210],['lastRow',fixed.months-1]]){
  const expected=c.observed[name];if(!expected)continue;
  const row=fixed.schedule.rows[index];
  const values={...row,n:row.installment,due:row.date,admin:row.adminFee,paymentPI:money(row.amortization+row.interest),pi:money(row.amortization+row.interest),dfiDfc:money(row.dfi+row.extraPremium)};
  for(const [key,value] of Object.entries(expected))assert.equal(values[key],value,`${c.id}: ${name} ${key}`);
  officialRows++;
 }
}

// Mudar o seguro não pode usar o prêmio do cronograma na reserva de capacidade
// ou no resumo: as duas apresentações oficiais têm coeficientes diferentes.
for(const [basic,extra] of [['S01','S02'],['S05','S06'],['S07','S08'],['S07','S09']]){
 const a=results.get(basic),b=results.get(extra);
 assert.equal(a.principal,b.principal);
 assert.equal(a.capacityReferenceExtra,b.capacityReferenceExtra);
 assert.ok(b.cesh>a.cesh);
 assert.equal(b.schedule.rows.at(-1).extraPremium,0);
}
assert.equal(results.get('S02').schedule.rows[0].extraPremium,49.92);
assert.equal(results.get('S09').schedule.rows[0].extraPremium,124.02);
assert.equal(difference(results.get('S02').firstSummary,results.get('S01').firstSummary),49.89);

// A reserva não vira cobrança no seguro básico, inclusive na Classe Média.
for(const id of ['S25','S26','S27','S28','S29']){
 const r=results.get(id);
 assert.equal(r.schedule.sums.extraPremium,0);
 assert.equal(r.capacityReferenceExtra,38.38);
 assert.equal(r.insuranceModel,'mcmv');
 assert.equal(r.assessment,money(new Decimal(r.principal).mul('.015')));
 const c=reference.cases.find(c=>c.id===id);
 assert.equal(run({...inputOf(c),program:'auto'}).principal,r.principal);
}
assert.equal(results.get('S27').schedule.rows[210].mip,233.66);
assert.equal(results.get('S27').schedule.rows.at(-1).total,3122.50);

// Mesma modalidade, com e sem vinculação: não inferir isenção pelo checkbox.
assert.equal(results.get('S19').cet,results.get('S20').cet);
assert.equal(results.get('S19').assessment,2137.16);
const c19=inputOf(reference.cases.find(c=>c.id==='S19'));
assert.equal(run({...c19,assessmentOverride:0}).assessment,0);
assert.equal(run({...c19,assessmentOverride:500}).assessment,500);
const manual=run({...c19,amountMode:'fixed',principal:100000,subsidyMode:'manual',subsidyManual:1000});
assert.equal(manual.subsidy.amount,1000,'Não zerar um desconto oficial informado apenas pela hipótese do mínimo automático');
assert.equal(manual.ownFunds,163000);
assert.equal(manual.cetNetCredit,money(manual.principal+1000-manual.assessment-manual.initialInsurance));
const noSub=run({...c19,subsidyMode:'none'});
assert.equal(noSub.subsidy.amount,0);
assert.ok(noSub.cet>results.get('S19').cet);
assert.equal(noSub.firstSummary,results.get('S19').firstSummary);

// Guardas sintéticas da política de mínimo após redutores adotada.
// Não representam novas observações da CAIXA.
const municipality=catalog.municipalities.find(m=>m.ibge==='3543402');
const subsidyInput={income:3000,propertyValue:264000,family:'single',propertyType:'used',subsidyMode:'area',propertyKind:'apartment',propertyArea:39};
for(const fpop of [.85,1.1]){
 const s=calculateSubsidy(subsidyInput,{...municipality,fpop},catalog.fdByUf.SP,4.75);
 assert.equal(s.factors.reducer,.15);
 assert.equal(s.amount,0);
}
assert.equal(run({...c19,insurance:'custom',customMipPercent:.02,dfiOverride:.01}).schedule.rows[0].dfi,26.40);
console.log(JSON.stringify({suite:'Matriz CAIXA 22/09/2026',ruleVersion:RULE_VERSION,officialCases:30,metrics,officialRows,remainingDifferences},null,2));
