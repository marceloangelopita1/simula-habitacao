import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const testsDir=path.dirname(fileURLToPath(import.meta.url));
const siteDir=path.dirname(testsDir);
const {buildSchedule,simulate,computeCet,nominalFromEffective,addMonths,ageOn,maxAgeMonths}=await import(pathToFileURL(path.join(siteDir,'engine.js')).href+'?test='+Date.now());
const fixtures=JSON.parse(fs.readFileSync(path.join(testsDir,'schedule-fixtures.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(siteDir,'data/municipal-rules.json'),'utf8'));
const results={reference:[],algebraic:[],failures:[]};
const cents=x=>Number(Number(x).toFixed(2));
function test(name,fn){try{const detail=fn();results.algebraic.push({name,passed:true,detail});}catch(error){results.failures.push({name,error:error.message});}}
for(const f of fixtures){
 const input={...f.input,system:f.input.system.toUpperCase()},out=buildSchedule(input),errors=[];
 assert.equal(out.rows.length,f.expected.rows.length);
 for(let k=0;k<out.rows.length;k++)for(const key of Object.keys(f.expected.rows[k])){
  const actual=out.rows[k][key],expected=f.expected.rows[k][key];
  if(key==='date'||key==='installment'){if(actual!==expected)errors.push({row:k+1,key,expected,actual});}
  else if(cents(actual)!==cents(expected))errors.push({row:k+1,key,expected,actual});
 }
 const upfront=f.expected.upfrontCosts.filter(x=>['Seguro/FGHAB à Vista','Tarifa para Avaliação de Bens Recebidos em Garantia','IOF'].includes(x.descricao)).reduce((a,x)=>a+ +x.valor,0);
 const cet=computeCet(out.rows,input.principal-upfront,input.simulationDate);
 if(cet.toFixed(4)!==Number(f.expected.reportedCET).toFixed(4))errors.push({field:'CET',expected:f.expected.reportedCET,actual:cet});
 if(out.cesh.toFixed(4)!==Number(f.expected.reportedCESH).toFixed(4))errors.push({field:'CESH',expected:f.expected.reportedCESH,actual:out.cesh});
 results.reference.push({case:f.case,rows:out.rows.length,errors,CET:cet,CESH:out.cesh,amortizationAdjustment:out.roundingAdjustment});
 if(errors.length)results.failures.push({name:f.case,error:errors});
}
const base={principal:300000,months:360,nominalAnnual:10,system:'PRICE',simulationDate:'2026-09-14',birthDate:'1988-02-01',propertyValue:400000,insuranceModel:'custom',adminFee:0,dfiRatePercent:0,customMipPercent:0,extraPremiumMonthly:0};
test('PRICE pure math first payment and final settlement',()=>{const s=buildSchedule(base);assert.equal(s.paymentPI,2632.71);assert.equal(s.rows[0].interest,2500);assert.equal(s.rows[0].amortization,132.71);assert.equal(s.rows.at(-1).balance,0);assert.equal(s.sums.amortization,300000);return s.rows.at(-1);});
test('SAC round-down must settle residue',()=>{const s=buildSchedule({...base,system:'SAC'});assert.equal(s.rows[0].amortization,833.33);assert.equal(s.rows.at(-1).balance,0);assert.equal(s.sums.amortization,300000);return s.rows.at(-1);});
test('PRICE zero interest odd cents',()=>{const s=buildSchedule({...base,principal:10000,months:3,nominalAnnual:0});assert.deepEqual(s.rows.map(x=>x.interest),[0,0,0]);assert.deepEqual(s.rows.map(x=>x.amortization),[3333.33,3333.33,3333.34]);return s.sums;});
test('Extra coverage excluded from CESH',()=>{const f=fixtures[0],o={...f.input,system:'SAC'};const a=buildSchedule(o),b=buildSchedule({...o,extraPremiumMonthly:33});assert.equal(a.cesh,b.cesh);assert.equal(cents(b.rows[0].total-a.rows[0].total),33);assert.equal(b.rows.at(-1).extraPremium,0);return b.cesh;});
test('DFI uses property value, not debt',()=>{const s=buildSchedule({...base,dfiRatePercent:.0066});assert.equal(s.rows[0].dfi,26.4);assert.equal(s.rows[100].dfi,26.4);return s.rows[0].dfi;});
test('Two borrowers MIP weighted, not oldest on whole debt',()=>{const s=buildSchedule({...base,insuranceModel:'sbpe',customMipPercent:null,birthDate:'1988-02-01',secondBirthDate:'1970-02-01',secondSharePercent:40});const after=s.rows[0].balance;const expected=cents(after*(.0154*.6+.1533*.4)/100);assert.equal(s.rows[0].mip,expected);return expected;});
test('Monthly date clipping preserves original day',()=>{assert.equal(addMonths('2027-01-31',1),'2027-02-28');assert.equal(addMonths('2027-01-31',2),'2027-03-31');assert.equal(addMonths('2028-01-31',1),'2028-02-29');return true;});
test('Age birthday boundary and maximum period',()=>{assert.equal(ageOn('1988-09-15','2026-09-14'),37);assert.equal(ageOn('1988-09-15','2026-09-15'),38);assert.equal(maxAgeMonths('1946-03-14','2026-09-14'),0);assert.equal(maxAgeMonths('1946-04-14','2026-09-14'),1);return true;});
test('Automatic SBPE nominal conversion',()=>{for(const [e,n]of [[11.49,10.9259],[11.29,10.7447],[11.19,10.6540]])assert.equal(Number(nominalFromEffective(e).toFixed(4)),n);return true;});
const simBase={birthDate:'1988-02-01',simulationDate:'2026-09-14',income:6000,propertyValue:350000,municipalityId:'3543402',program:'mcmv',system:'SAC',months:420,amountMode:'fixed',principal:193949.89,cotista:true,family:'single',relationship:'none',insurance:'basic',subsidyMode:'quick'};
test('simulate MCMV fixed data matches schedule',()=>{const s=simulate(simBase,catalog);assert.equal(s.ok,true,JSON.stringify(s.errors));assert.equal(s.schedule.rows[0].total,1777.55);assert.equal(s.schedule.rows.at(-1).total,489.73);assert.equal(s.cet.toFixed(4),'9.0491');assert.equal(s.cesh.toFixed(4),'4.4945');return {principal:s.principal,first:s.firstSummary,warnings:s.warnings};});
test('Maximum changes without hardcoded reference principal',()=>{const a=simulate({...simBase,amountMode:'max'},catalog),b=simulate({...simBase,amountMode:'max',income:6200},catalog);assert.ok(a.ok&&b.ok);assert.ok(b.principal>a.principal);assert.ok(Math.abs(a.principal-193949.89)<1);return {a:a.principal,b:b.principal};});
test('Appraisal binds quota and DFI consistently',()=>{const s=simulate({...simBase,amountMode:'max',income:9000,appraisal:200000},catalog);assert.equal(s.ok,true,JSON.stringify(s.errors));assert.ok(s.principal<=160000);assert.equal(s.schedule.rows[0].dfi,14.2);return {principal:s.principal,DFI:s.schedule.rows[0].dfi};});
test('SBPE PRICE clamps requested period to 360',()=>{const s=simulate({...simBase,program:'sbpe',relationship:'salary',propertyValue:500000,income:10000,principal:245560.88,system:'PRICE'},catalog);assert.equal(s.ok,true,JSON.stringify(s.errors));assert.equal(s.months,360);assert.equal(s.nominalAnnual,10.654);assert.equal(s.schedule.rows[0].total,2370.36);assert.equal(s.schedule.rows.at(-1).total,2306.34);assert.equal(s.cet.toFixed(4),'12.1245');return s.firstSummary;});
test('MCMV subsidy whole-real inferred scenarios',()=>{for(const [family,expected]of [['single',2609],['dependents',8697]]){const s=simulate({...simBase,income:3000,propertyValue:240000,principal:129966.62,family},catalog);assert.equal(s.ok,true,JSON.stringify(s.errors));assert.equal(s.subsidy.amount,expected);assert.equal(cents(s.ownFunds+s.subsidy.amount+s.principal),240000);}return true;});
test('Invalid numerical inputs rejected',()=>{for(const patch of [{income:NaN},{income:-1},{propertyValue:0},{months:1.5},{birthDate:'2026-02-30'},{principal:-5},{dfiOverride:-1}]){const s=simulate({...simBase,...patch},catalog);assert.equal(s.ok,false,JSON.stringify(patch));}return true;});
test('Upfront costs exhausting net credit are rejected',()=>{const s=simulate({...simBase,assessmentOverride:200000},catalog);assert.equal(s.ok,false);return s.errors;});
fs.writeFileSync(path.join(testsDir,'latest-results.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({reference:results.reference.map(({case:c,rows,errors,CET,CESH})=>({case:c,rows,errorCount:errors.length,CET,CESH})),algebraicPassed:results.algebraic.length,failures:results.failures},null,2));
if(results.failures.length)process.exitCode=1;
