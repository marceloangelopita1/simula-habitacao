// Auditoria por referências externas preservadas; não calcula expectativas
// com a fórmula implementada. SIMULA_ENGINE_URL permite comparar outra revisão.
import fs from 'node:fs';
import Decimal from '../vendor/decimal.mjs';
const {simulate,RULE_VERSION}=await import(process.env.SIMULA_ENGINE_URL||'../engine.js');
const read=file=>JSON.parse(fs.readFileSync(new URL(file,import.meta.url)));
const catalog=read('../data/municipal-rules.json');
const money=value=>new Decimal(value).toDecimalPlaces(2).toNumber();
const groups=[];
for(const name of ['centavos-2026-09-23','arredondamento-2026-09-22','sbpe-2026-09-22']){
 const ref=read(`../validation/caixa-${name}.json`);
 groups.push({name,cases:ref.cases.map(c=>({id:c.id,input:{...ref.input,...c.input},expected:c.expected,plusFirstSummary:c.plusFirstSummary,expandedFirstSummary:c.expandedFirstSummary}))});
}
const matrix=read('../validation/comparacao-matriz-2026-09-22.json');
groups.push({name:'matriz-independente',cases:matrix.cases.map(c=>({id:c.id,input:{...matrix.baseInput,...c.input},expected:c.observed}))});
const output={ruleVersion:RULE_VERSION,groups:[],totals:{cases:0,metrics:0,exact:0,different:0}};
for(const group of groups){
 const stats={name:group.name,cases:[],metrics:0,exact:0,differences:[]};
 for(const c of group.cases){
  const r=simulate(c.input,catalog);if(!r.ok)throw Error(`${c.id}: ${JSON.stringify(r.errors)}`);
  const actual={...r,subsidy:r.subsidy.amount,nominalDisplayed:r.nominalDisplayed??money(r.nominalAnnual),paymentPITotal:r.paymentPITotal??money(new Decimal(r.schedule.sums.amortization).plus(r.schedule.sums.interest))};
  const fields=Object.fromEntries(Object.entries(c.expected).filter(([,v])=>typeof v==='number'));
  for(const [insurance,key]of [['plus','plusFirstSummary'],['expanded','expandedFirstSummary']])if(c[key]!==undefined){
   const extra=simulate({...c.input,insurance},catalog);if(!extra.ok)throw Error(JSON.stringify(extra.errors));
   actual[key]=extra.firstSummary;fields[key]=c[key];
  }
  const checked={id:c.id,metrics:[],differences:[]};
  for(const [field,expected]of Object.entries(fields)){
   const value=money(actual[field]),delta=money(new Decimal(value).minus(expected));
   const metric={field,expected,actual:value,delta};checked.metrics.push(metric);stats.metrics++;
   if(delta){checked.differences.push(metric);stats.differences.push({case:c.id,...metric});}else stats.exact++;
  }
  stats.cases.push(checked);
 }
 output.groups.push(stats);output.totals.cases+=stats.cases.length;output.totals.metrics+=stats.metrics;output.totals.exact+=stats.exact;output.totals.different+=stats.differences.length;
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({ruleVersion:RULE_VERSION,totals:output.totals,groups:output.groups.map(({name,cases,metrics,exact,differences})=>({name,cases:cases.length,metrics,exact,differences}))},null,2));
