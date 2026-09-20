import fs from 'node:fs';
import assert from 'node:assert/strict';
import Decimal from '../vendor/decimal.mjs';
import {simulate,mipPercent} from '../engine.js';

const catalog=JSON.parse(fs.readFileSync(new URL('../data/municipal-rules.json',import.meta.url)));
const money=x=>new Decimal(x).toDecimalPlaces(2).toNumber();
const base={income:3578,propertyValue:264000,municipalityId:'3543402',propertyType:'used',program:'mcmv',system:'PRICE',months:420,cotista:true,family:'single',insurance:'basic',simulationDate:'2026-09-19',amountMode:'max',subsidyMode:'none'};
const results=[];
for(const [fixture,birthDate] of [
 ['caixa-price-usado-2026-09-19.json','1998-08-01'],
 ['caixa-price-usado-38-2026-09-19.json','1988-02-01'],
]){
 const official=JSON.parse(fs.readFileSync(new URL('../validation/'+fixture,import.meta.url)));
 const r=simulate({...base,birthDate},catalog);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 for(const field of ['principal','ownFunds','firstSummary','lastSummary'])assert.equal(r[field],official.profile[field],`${fixture}: ${field}`);
 assert.equal(money(r.cet),official.profile.reportedCet,`${fixture}: CET`);
 assert.equal(money(r.cesh),official.profile.reportedCesh,`${fixture}: CESH`);
 assert.equal(r.schedule.rows.length,420);
 assert.equal(official.rows.length,420);
 for(let k=0;k<420;k++){
  const actual=r.schedule.rows[k],expected=official.rows[k];
  assert.equal(expected.installment,k+1);
  for(const field of ['date','balance','mip','dfi','adminFee','total'])assert.equal(actual[field],expected[field],`${fixture}: ${k+1} ${field}`);
  assert.equal(money(new Decimal(actual.amortization).plus(actual.interest)),expected.paymentPI,`${fixture}: ${k+1} prestação`);
 }
 // A estimativa de subsídio é uma limitação separada: não confundir o ajuste
 // do seguro/capacidade com uma homologação da entrada automática.
 const quick=simulate({...base,birthDate,subsidyMode:'quick'},catalog);
 assert.equal(quick.subsidy.amount,326);
 assert.equal(quick.principal,r.principal);
 assert.equal(money(quick.ownFunds+326),r.ownFunds);
 results.push({age:official.profile.entryAge,rows:420,principal:r.principal,cet:r.cet,cesh:r.cesh});
}

// Os quatro máximos de fontes anteriores permanecem exatos após o ajuste PRICE.
for(const [program,income,propertyValue,principal] of [
 ['mcmv',6000,350000,193949.89],['mcmv',3000,240000,129966.62],
 ['sbpe',6000,350000,145734.57],['sbpe',10000,500000,245931.65],
]){
 const r=simulate({...base,program,income,propertyValue,birthDate:'1988-02-01',propertyType:'new',system:'SAC',simulationDate:'2026-09-14'},catalog);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.principal,principal,`${program} SAC renda ${income}`);
}
// O recálculo oficial desta sessão também forneceu um máximo SAC aos 38 anos.
assert.equal(simulate({...base,birthDate:'1988-02-01',system:'SAC'},catalog).principal,142477.50);

// O aniversário efetivo, e não apenas o ano, aciona a faixa seguinte.
assert.equal(mipPercent('mcmv','1998-08-01','2029-07-31'),.0085);
assert.equal(mipPercent('mcmv','1998-08-01','2029-08-01'),.0108);
assert.equal(mipPercent('mcmv','1998-08-01','2034-07-31'),.0108);
assert.equal(mipPercent('mcmv','1998-08-01','2034-08-01'),.0144);
assert.equal(mipPercent('sbpe','1998-08-01','2026-09-19'),.0154);
assert.equal(mipPercent('mcmv','1998-08-01','2026-09-19',.0123),.0123);
// A quota continua prevalecendo quando a renda comporta mais que o imóvel.
assert.equal(simulate({...base,income:9000,birthDate:'1998-08-01'},catalog).principal,211200);
console.log(JSON.stringify({ageCapacityRegression:results,historicalMaximums:5,failures:0},null,2));
