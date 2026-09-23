import fs from 'node:fs';
import {simulate,mcmvRate,calculateSubsidy,maxAgeMonths} from '../engine.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../data/municipal-rules.json',import.meta.url)));
const rp=catalog.municipalities.find(x=>x.ibge==='3543402');
const base={income:3000,propertyValue:240000,birthDate:'1988-02-01',family:'dependents',program:'mcmv',amountMode:'fixed',principal:100000};
const results=[];
function test(name,fn){try{const detail=fn();results.push({name,pass:true,detail});}catch(e){results.push({name,pass:false,error:String(e.message)});}}
function eq(v,w){if(v!==w)throw Error(`obtido ${v}; esperado ${w}`);}
function run(changes={}){return simulate({...base,...changes},catalog);}
function ok(changes={}){const r=run(changes);if(!r.ok)throw Error(JSON.stringify(r.errors));return r;}
function blocked(changes,field){const r=run(changes);eq(r.ok,false);if(field&&!r.errors.some(e=>e.field===field))throw Error(JSON.stringify(r.errors));return r.errors;}
const incomeRows=[[2160,4.25],[2160.01,4.5],[2850,4.5],[2850.01,4.75],[3200,4.75],[3200.01,5],[3500,5],[3500.01,5.5],[4000,5.5],[4000.01,6.5],[5000,6.5],[5000.01,7.66],[9600,7.66],[9600.01,null]];
for(const [income,rate] of incomeRows)for(const region of ['N','NE','CO','SE','S'])for(const cotista of [true,false])test(`taxa ${income} ${region} cotista=${cotista}`,()=>eq(mcmvRate(income,cotista,region),rate===null?null:rate+(cotista?0:.5)-(['N','NE'].includes(region)&&income<=3500?.25:0)));
test('Ribeirão teto e fatores',()=>{eq(rp.propertyLimit,264000);eq(rp.fpop,1.1);eq(catalog.fdByUf.SP,2.07);});
test('limite local exato preserva juros populares',()=>eq(ok({propertyValue:264000}).nominalAnnual,4.75));
test('um centavo acima local usa exceção F3 sem descontos',()=>{const r=ok({propertyValue:264000.01});eq(r.nominalAnnual,7.66);eq(r.subsidy.amount,0);});
test('exceção local com renda 2850 não isenta administração',()=>eq(ok({income:2850,propertyValue:264000.01}).adminFee,25));
test('400000 é admitido na F3',()=>ok({propertyValue:400000}));
test('400000,01 fora das Faixas 1–3',()=>blocked({propertyValue:400000.01},'propertyValue'));
test('9600 é admitido na F3',()=>eq(ok({income:9600}).nominalAnnual,7.66));
test('9600,01 fora das Faixas 1–3',()=>blocked({income:9600.01},'income'));
test('Classe Média permite renda inferior a 9600',()=>eq(ok({program:'middle',income:6000,propertyValue:500000}).nominalAnnual,10));
test('Classe Média limites exatos',()=>ok({program:'middle',income:13000,propertyValue:600000}));
test('Classe Média renda acima limite',()=>blocked({program:'middle',income:13000.01,propertyValue:600000},'income'));
test('Classe Média imóvel acima limite',()=>blocked({program:'middle',income:13000,propertyValue:600000.01},'propertyValue'));
test('auto sugere Classe Média após 400 mil',()=>eq(ok({program:'auto',propertyValue:400000.01}).program,'middle'));
test('auto sugere SBPE após 600 mil',()=>eq(ok({program:'auto',propertyValue:600000.01}).program,'sbpe'));
test('MCMV novo quota padrão 80 SAC e PRICE',()=>{for(const system of ['SAC','PRICE'])eq(ok({system}).quota,80);});
test('MCMV PRICE quota máxima 80',()=>blocked({system:'PRICE',quotaOverride:80.01},'quotaOverride'));
test('MCMV SAC quota normativa máxima 90',()=>{eq(ok({quotaOverride:90}).quota,90);return blocked({quotaOverride:90.01},'quotaOverride');});
test('MCMV usado não herda 60 Classe Média nem 65 antiga',()=>{const r=ok({propertyType:'used'});eq(r.quota,80);if(!r.warnings.some(x=>x.includes('usado')&&x.includes('homologada')))throw Error('Falta aviso quota usada.');});
test('Classe Média usado SP cap 60 ambos sistemas',()=>{for(const system of ['SAC','PRICE']){eq(ok({program:'middle',propertyType:'used',system}).quota,60);blocked({program:'middle',propertyType:'used',system,quotaOverride:60.01},'quotaOverride');}});
test('Classe Média novo SAC 90',()=>eq(ok({program:'middle',quotaOverride:90}).quota,90));
test('Classe Média novo PRICE bloqueia 80,01',()=>blocked({program:'middle',system:'PRICE',quotaOverride:80.01},'quotaOverride'));
test('Pró-Cotista usado exige renda até 12 mil',()=>{ok({program:'pro',propertyType:'used',income:12000,activeFgts:true});return blocked({program:'pro',propertyType:'used',income:12000.01,activeFgts:true},'income');});
test('Pró-Cotista usado quota 50',()=>{eq(ok({program:'pro',propertyType:'used',activeFgts:true}).quota,50);return blocked({program:'pro',propertyType:'used',activeFgts:true,quotaOverride:50.01},'quotaOverride');});
test('Pró-Cotista saldo inativo na fronteira 10%',()=>{ok({program:'pro',activeFgts:false,appraisal:250000,fgtsTotalBalance:25000});return blocked({program:'pro',activeFgts:false,appraisal:250000,fgtsTotalBalance:24999.99},'fgtsTotalBalance');});
test('Pró-Cotista exige três anos FGTS',()=>blocked({program:'pro',activeFgts:true,cotista:false},'cotista'));
test('Pró-Cotista não aceita avaliação acima SFH',()=>blocked({program:'pro',activeFgts:true,income:100000,propertyValue:2300000,appraisal:2300000},'appraisal'));
test('SBPE admite outro SFH sem uso FGTS',()=>ok({program:'sbpe',otherSfh:true}));
test('FGTS na entrada não aceita avaliação acima SFH',()=>blocked({program:'sbpe',income:100000,propertyValue:2300000,appraisal:2300000,fgtsUse:10000},'fgtsUse'));
test('MCMV outro SFH exige análise específica',()=>blocked({otherSfh:true},'otherSfh'));
test('FGTS outra propriedade exige análise específica',()=>blocked({program:'sbpe',fgtsUse:1000,otherProperty:true},'fgtsUse'));
test('benefício anterior MCMV exige análise de todos descontos',()=>blocked({income:2800,previousBenefit:true},'previousBenefit'));
test('SBPE benefício anterior não bloqueia sozinho',()=>ok({program:'sbpe',previousBenefit:true}));
test('desconto de administração renda 2850/2850,01',()=>{eq(ok({income:2850}).adminFee,0);eq(ok({income:2850.01}).adminFee,25);});
test('subsídio de aquisição renda 4000/4000,01',()=>{if(!(ok({income:4000}).subsidy.amount>0))throw Error('Falta desconto 4000.');eq(ok({income:4000.01}).subsidy.amount,0);});
test('subsídio sem área reproduz caso familiar 8697',()=>eq(ok().subsidy.amount,8697));
test('subsídio sem área reproduz caso unipessoal 2609',()=>eq(ok({family:'single'}).subsidy.amount,2609));
test('subsídio normativo apto50 9187,16',()=>{const r=ok({subsidyMode:'area',propertyKind:'apartment',propertyArea:50});eq(r.subsidy.amount,9187.16);eq(r.subsidy.factors.fuh,5.5);});
test('subsídio usado aplica mínimo após redutores cumulativos',()=>{const r=ok({subsidyMode:'area',propertyKind:'apartment',propertyArea:50,propertyType:'used',family:'single'});eq(r.subsidy.factors.reducer,.15);eq(r.subsidy.amount,0);});
test('FUH piso zero, teto 10, casa46 =0',()=>{for(const [kind,area,expected] of [['apartment',20,0],['apartment',39,0],['apartment',59,10],['apartment',90,10],['house',46,0],['house',66,10]])eq(ok({subsidyMode:'area',propertyKind:kind,propertyArea:area}).subsidy.factors.fuh,expected);});
test('FD_fin negativo preservado',()=>{const v=ok().subsidy.factors.fdFin;if(Math.abs(v-(-4.437525943517788))>1e-10)throw Error(v);});
test('subsídio manual fora de enquadramento desconsiderado',()=>eq(ok({income:5000,subsidyMode:'manual',subsidyManual:8000}).subsidy.amount,0));
test('aporte precisa confirmação',()=>blocked({confirmedAid:13000},'aidConfirmed'));
test('aporte confirmado pode compor entrada',()=>eq(ok({confirmedAid:13000,aidConfirmed:true}).aid,13000));
test('recursos acima preço não geram entrada negativa',()=>blocked({fgtsUse:200000,confirmedAid:50000,aidConfirmed:true}));
test('cronograma de obra não é tratado como aquisição pronta',()=>blocked({purpose:'construction'},'purpose'));
test('prazo considera comprador mais velho',()=>{const r=ok({family:'two',secondBirthDate:'1950-09-14',secondSharePercent:50});eq(r.months,54);});
test('idade exata80a6m sem prazo',()=>blocked({birthDate:'1946-03-14'},'birthDate'));
test('menor não emancipado fora piloto',()=>blocked({birthDate:'2010-01-01'},'birthDate'));
test('município inválido rejeitado',()=>blocked({municipalityId:'0000000'},'municipalityId'));
test('catálogo íntegro',()=>{eq(catalog.municipalities.length,5571);eq(new Set(catalog.municipalities.map(m=>m.ibge)).size,5571);if(catalog.municipalities.some(m=>!Number.isFinite(m.fpop)||!Number.isFinite(m.propertyLimit)||!Number.isFinite(catalog.fdByUf[m.uf])))throw Error('Fator ausente.');});
for(const [label,changes,cap] of [
 ['SP familiar',{},55000],['SP unipessoal',{family:'single'},16500],['SP usado',{propertyType:'used'},27500],['SP usado unipessoal',{propertyType:'used',family:'single'},8250],
 ['CCI familiar',{cci:true},49500],['CCI unipessoal',{cci:true,family:'single'},14850],['CCI usado unipessoal',{cci:true,propertyType:'used',family:'single'},7425],
 ['Norte familiar',{municipalityId:'1302603'},65000]
])test(`subsídio manual teto exato e +0,01 ${label}`,()=>{eq(ok({...changes,subsidyMode:'manual',subsidyManual:cap}).subsidy.amount,cap);return blocked({...changes,subsidyMode:'manual',subsidyManual:cap+.01},'subsidyManual');});
test('saldo total FGTS inválido não é aceito',()=>{blocked({program:'pro',activeFgts:true,fgtsTotalBalance:-1},'fgtsTotalBalance');blocked({program:'pro',activeFgts:true,fgtsTotalBalance:Infinity},'fgtsTotalBalance');return blocked({program:'pro',activeFgts:true,fgtsTotalBalance:NaN},'fgtsTotalBalance');});
test('FGTS histórico recente bloqueia, desconhecido avisa',()=>{blocked({fgtsUse:1000,fgtsPropertyHistory:'recent'},'fgtsPropertyHistory');const r=ok({fgtsUse:1000,fgtsPropertyHistory:'unknown'});if(!r.warnings.some(w=>w.includes('histórico ainda não foi confirmado')))throw Error('Falta aviso histórico.');});
test('SBPE acima SFH identifica SFI exploratório',()=>{const r=ok({program:'sbpe',income:100000,propertyValue:2300000});eq(r.programName,'SBPE • SFI');if(!r.warnings.some(w=>w.includes('SFI exploratório')))throw Error('Falta aviso SFI.');});
test('Classe Média usado NE não herda cap60 Sudeste',()=>{for(const [system,quota] of [['SAC',90],['PRICE',80]])eq(ok({program:'middle',municipalityId:'2927408',propertyType:'used',system,quotaOverride:quota}).quota,quota);});
test('subsídio abaixo do mínimo bruto é zero',()=>{const m=catalog.municipalities.find(m=>m.uf==='MG'&&m.fpop===.85);const r=ok({income:3700,municipalityId:m.ibge,propertyValue:210000});if(!(r.subsidy.raw<1500))throw Error(`Cenário não ativa mínimo: ${r.subsidy.raw}`);eq(r.subsidy.amount,0);});
test('mínimo após redutor zera estimativa e preserva aviso de fronteira',()=>{const r=ok({income:3700,family:'single'});eq(r.subsidy.amount,0);if(!r.warnings.some(w=>w.includes('proximidades desse mínimo')))throw Error('Falta cautela mínimo após redutor.');const s=ok({income:4000});if(!s.warnings.some(w=>w.includes('piso −10'))||!s.warnings.some(w=>w.includes('expressão quadrática')))throw Error('Falta cautela fatores/fronteira.');});
const summary={testedAt:new Date().toISOString(),total:results.length,passed:results.filter(x=>x.pass).length,failed:results.filter(x=>!x.pass).length};
fs.writeFileSync(new URL('./boundary-results.json',import.meta.url),JSON.stringify({summary,results},null,2));
console.log(JSON.stringify({...summary,failures:results.filter(x=>!x.pass)},null,2));
if(summary.failed)process.exitCode=1;
