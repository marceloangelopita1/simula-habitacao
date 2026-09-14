import Decimal from './vendor/decimal.mjs';
Decimal.set({precision:42,rounding:Decimal.ROUND_HALF_UP});
export const RULE_VERSION='2026-09-14.piloto.1';
const D=x=>new Decimal(x);
const money=x=>D(x).toDecimalPlaces(2).toNumber();
const jr=x=>D(x).toDecimalPlaces(4).toDecimalPlaces(2);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const bands={mcmv:[[40,.0144],[45,.0244],[50,.0359],[55,.0645],[60,.0764],[65,.1296],[70,.2005],[100,.3729]],sbpe:[[40,.0154],[45,.0252],[50,.0386],[55,.0676],[60,.1533],[65,.2731],[100,.3259]]};
export function parseDate(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return null;
 const [y,m,d]=s.split('-').map(Number),v=new Date(Date.UTC(y,m-1,d));
 return v.getUTCFullYear()===y&&v.getUTCMonth()===m-1&&v.getUTCDate()===d?v:null;
}
export function addMonths(s,n){
 const d=parseDate(s);if(!d)throw Error('Data inválida.');
 const month=d.getUTCMonth()+n,y=d.getUTCFullYear()+Math.floor(month/12),m=((month%12)+12)%12;
 return new Date(Date.UTC(y,m,Math.min(d.getUTCDate(),new Date(Date.UTC(y,m+1,0)).getUTCDate()))).toISOString().slice(0,10);
}
export function ageOn(birth,when){
 const b=parseDate(birth),d=parseDate(when);if(!b||!d)return NaN;
 let a=d.getUTCFullYear()-b.getUTCFullYear();
 if(d.getUTCMonth()<b.getUTCMonth()||(d.getUTCMonth()===b.getUTCMonth()&&d.getUTCDate()<b.getUTCDate()))a--;
 return a;
}
export function maxAgeMonths(birth,when){
 if(!parseDate(birth)||!parseDate(when))return 0;
 const end=addMonths(birth,80*12+6);let n=0;
 while(n<420&&addMonths(when,n+1)<=end)n++;
 return n;
}
export function nominalFromEffective(e){return D(1).plus(D(e).div(100)).pow(D(1).div(12)).minus(1).mul(1200).toNumber();}
export function effectiveFromNominal(n){return D(1).plus(D(n).div(1200)).pow(12).minus(1).mul(100).toNumber();}
export function mipPercent(model,birth,date,custom=null){
 if(custom!==null&&custom!==undefined)return +custom;
 const a=ageOn(birth,date);return (bands[model]||bands.sbpe).find(([max])=>a<=max)?.[1]??.3729;
}
function weightedMip(o,date){
 const second=Number(o.secondSharePercent||0)/100;
 return mipPercent(o.insuranceModel,o.birthDate,date,o.customMipPercent)*(1-second)+(second?mipPercent(o.insuranceModel,o.secondBirthDate,date,o.customMipPercent)*second:0);
}
export function buildSchedule(o){
 const {principal,months,nominalAnnual,system,simulationDate,propertyValue}=o;
 if(!Number.isFinite(+principal)||principal<=0||!Number.isInteger(+months)||months<1||months>420||nominalAnnual<0||nominalAnnual>100||!['SAC','PRICE'].includes(system)||!parseDate(simulationDate)||!parseDate(o.birthDate))throw Error('Parâmetros inválidos para o cronograma.');
 const F=D(principal),i=D(nominalAnnual).div(1200),n=+months;
 const A0=F.div(n).toDecimalPlaces(2),P=i.isZero()?F.div(n).toDecimalPlaces(2):F.mul(i).div(D(1).minus(D(1).plus(i).pow(-n))).toDecimalPlaces(2);
 let B=F;const rows=[];const sums={amortization:0,interest:0,mip:0,dfi:0,adminFee:0,extraPremium:0,total:0};
 const dfi=money(D(propertyValue).mul(o.dfiRatePercent??(o.insuranceModel==='mcmv'?.0071:.0066)).div(100));
 for(let t=1;t<=n;t++){
  const date=addMonths(simulationDate,t),J=jr(B.mul(i));
  let A=system==='SAC'?A0:Decimal.min(B,P.minus(J));
  if(t===n)A=system==='PRICE'?B:Decimal.max(B,A0);
  if(A.lt(0))throw Error('A prestação não amortiza a dívida. Confira a taxa e o prazo.');
  B=Decimal.max(0,B.minus(A));
  const mip=t===n?0:money(B.mul(weightedMip(o,date)).div(100));
  const df=t===n?0:dfi,admin=+(o.adminFee??25),extra=t===n?0:money(o.extraPremiumMonthly||0);
  const row={installment:t,date,amortization:A.toNumber(),interest:J.toNumber(),balance:B.toNumber(),mip,dfi:df,adminFee:admin,extraPremium:extra,total:money(A.plus(J).plus(mip).plus(df).plus(admin).plus(extra))};
  rows.push(row);for(const key in sums)sums[key]=money(D(sums[key]).plus(row[key]));
 }
 const mipInitial=money(F.mul(weightedMip(o,simulationDate)).div(100));
 const initialInsurance=money(D(mipInitial).plus(dfi));
 const rawPayment=system==='SAC'?F.div(n).plus(F.mul(i)):(i.isZero()?F.div(n):F.mul(i).div(D(1).minus(D(1).plus(i).pow(-n))));
 // O resumo usa componentes sem os arredondamentos intermediários da planilha.
 const firstSummary=money(rawPayment.plus(F.mul(weightedMip(o,simulationDate)).div(100)).plus(D(propertyValue).mul(o.dfiRatePercent??(o.insuranceModel==='mcmv'?.0071:.0066)).div(100)).plus(o.adminFee??25).plus(o.extraPremiumMonthly||0));
 const lastSummary=money((system==='SAC'?A0.mul(D(1).plus(i)):P).plus(o.adminFee??25));
 const d0=parseDate(simulationDate),days=rows.map(r=>(parseDate(r.date)-d0)/86400000);
 const cesh=rows.reduce((s,r,k)=>s+(r.mip+r.dfi)/Math.pow(1.008,12*days[k]/365),0)/+F*100;
 return {rows,sums,firstSummary,lastSummary,initialInsurance,cesh,roundingAdjustment:money(D(sums.amortization).minus(F)),paymentPI:P.toNumber()};
}
export function computeCet(rows,netCredit,simulationDate,actualDates=false){
 if(netCredit<=0)return null;
 const base=parseDate(simulationDate),times=rows.map((r,k)=>actualDates?(parseDate(r.date)-base)/86400000/365:(k+1)/12);
 const f=rate=>rows.reduce((s,r,k)=>s+r.total/Math.pow(1+rate,times[k]),0)-netCredit;
 let lo=-.999,hi=1;while(f(hi)>0&&hi<10000)hi*=2;
 if(!Number.isFinite(f(lo))||f(hi)>0)return null;
 for(let k=0;k<90;k++){const mid=(lo+hi)/2;if(f(mid)>0)lo=mid;else hi=mid;}
 return (lo+hi)/2*100;
}
export function mcmvRate(income,cotista,region){
 const thresholds=[2160,2850,3200,3500,4000,5000,9600],rates=[4.25,4.5,4.75,5,5.5,6.5,7.66];
 let idx=thresholds.findIndex(v=>income<=v);if(idx<0)return null;
 return rates[idx]+(cotista?0:.5)-(['N','NE'].includes(region)&&idx<=3?.25:0);
}
export function calculateSubsidy(input,municipality,fdUf,rate,eligible=true){
 const warnings=[];const R=+input.income;
 if(!eligible||input.subsidyMode==='none'||R>4000||input.previousBenefit)return {amount:0,raw:0,warnings,reason:input.previousBenefit?'Benefício habitacional anterior informado.':'Sem desconto de entrada neste enquadramento.'};
 if(input.subsidyMode==='manual')return {amount:money(input.subsidyManual||0),raw:null,warnings:['Subsídio informado manualmente: confira se consta no resultado oficial.'],reason:'Valor informado para comparação.'};
 if(municipality.fpop==null||fdUf==null)return {amount:0,raw:null,warnings:['Fatores municipais incompletos; informe o subsídio oficial.'],reason:'Fatores indisponíveis.'};
 const b=D(2).mul(50000).mul(D(1900).div(50000).minus(1)).div(1950),a=b.neg().div(3900);
 const Fr=a.mul(D(R).minus(1750).pow(2)).plus(b.mul(D(R).minus(1750))).plus(50000);
 const j=D(rate).div(1200),vvi=Decimal.min(input.propertyValue,D(municipality.propertyLimit).mul(.675));
 const pv=j.isZero()?D(.25).mul(R).mul(420):D(.25).mul(R).mul(D(1).minus(D(1).plus(j).pow(-420))).div(j);
 const finRaw=D(10).minus(D(40).mul(pv.div(vvi).minus(.5))).toNumber();
 const fdFin=clamp(finRaw,-10,10),fd=clamp(fdUf,-10,10);
 if(finRaw< -10||fdUf< -10)warnings.push('O piso −10 dos fatores foi aplicado como hipótese; confirme o subsídio oficial neste cenário.');
 let fuh=0;
 if(input.subsidyMode==='area')fuh=clamp(10*(+input.propertyArea-(input.propertyKind==='house'?46:39))/20,0,10);
 else warnings.push('Subsídio sem área: fator do imóvel FUH=0 e valor em reais inteiros, hipóteses compatíveis com os dois testes oficiais.');
 const raw=Decimal.max(0,Fr.mul(D(1).plus(D(fd).plus(fdFin).plus(fuh).div(100))).mul(municipality.fpop));
 const cap=input.cci?49500:(municipality.regionCode==='N'?65000:55000);
 let v=Decimal.min(cap,raw);let factor=D(1);
 if(input.family==='single')factor=factor.mul(.3);
 if(input.propertyType==='used')factor=factor.mul(.5);
 v=v.mul(factor);
 if(raw.lt(1500))v=D(0);
 else if(v.gt(0)&&v.lt(1500))warnings.push('O redutor deixou o desconto abaixo de R$ 1.500. A ordem desse mínimo precisa de conferência oficial.');
 if(R>3700)warnings.push('Subsídio acima de renda R$ 3.700 usa a expressão quadrática publicada; a fronteira exige validação oficial.');
 const amount=input.subsidyMode==='area'?money(v):v.toDecimalPlaces(0).toNumber();
 return {amount,raw:raw.toNumber(),warnings,reason:amount?'Estimativa pela fórmula do Manual 034.':'Fórmula abaixo do mínimo do desconto.',factors:{income:R,incomeFactor:Fr.toNumber(),financingDemand:pv.toNumber(),vvi:vvi.toNumber(),fdUf:fd,fdFin,fuh,fpop:municipality.fpop,cap,reducer:factor.toNumber()}};
}
export function simulate(raw,catalog){
 const input={simulationDate:'2026-09-14',municipalityId:'3543402',program:'auto',system:'SAC',months:420,propertyType:'new',purpose:'purchase',family:'single',cotista:true,relationship:'none',amountMode:'max',subsidyMode:'quick',insurance:'basic',fgtsUse:0,confirmedAid:0,purchaseCosts:0,secondSharePercent:0,...raw};
 const warnings=[],errors=[];const error=(field,message)=>errors.push({field,message});
 if(input.simulationDate!=='2026-09-14')warnings.push('Data diferente da pesquisa: as regras comerciais permanecem as de 14/09/2026; as datas e idades do cronograma acompanham a data informada.');
 const finite=(key,min,max=1e10)=>{const x=+input[key];if(!Number.isFinite(x)||x<min||x>max)error(key,`Confira o valor de ${key}.`);return x;};
 const municipality=catalog?.municipalities?.find(x=>x.ibge===input.municipalityId);
 if(!municipality)error('municipalityId','Selecione um município da lista.');
 if(!parseDate(input.simulationDate))error('simulationDate','Informe uma data válida para a simulação.');
 if(!parseDate(input.birthDate))error('birthDate','Informe a data de nascimento do primeiro comprador.');
 else if(ageOn(input.birthDate,input.simulationDate)<18)error('birthDate','Este piloto atende compradores a partir de 18 anos. Menores emancipados exigem conferência específica.');
 finite('income',.01,1e8);finite('propertyValue',1,1e9);finite('months',1,420);
 if(!Number.isInteger(+input.months))error('months','O prazo deve ser um número inteiro de meses.');
 if(!['SAC','PRICE'].includes(input.system))error('system','Selecione SAC ou PRICE.');
 for(const [key,values] of Object.entries({program:['auto','mcmv','middle','sbpe','pro'],family:['single','dependents','two'],propertyType:['new','used'],amountMode:['max','fixed','entry'],insurance:['basic','plus','expanded','custom'],subsidyMode:['quick','area','none','manual'],relationship:['none','account','salary']}))if(!values.includes(input[key]))error(key,'Selecione uma opção válida.');
 for(const key of ['fgtsUse','confirmedAid','purchaseCosts'])finite(key,0,1e9);
 if(input.purpose!=='purchase')error('purpose','Obras e empréstimo com garantia exigem outro fluxo de liberações. Este piloto calcula aquisição residencial pronta.');
 if(input.family==='two'){
  if(!parseDate(input.secondBirthDate)||ageOn(input.secondBirthDate,input.simulationDate)<18)error('secondBirthDate','Informe um nascimento válido para o segundo comprador, a partir de 18 anos.');
  finite('secondSharePercent',.01,99.99);
 }else input.secondSharePercent=0;
 const optional={nominalOverride:[0,50],quotaOverride:[1,100],adminOverride:[0,10000],assessmentOverride:[0,1e7],dfiOverride:[0,2],customMipPercent:[0,5],subsidyManual:[0,65000],fgtsTotalBalance:[0,1e9],commitmentPercent:[1,30]};
 for(const [k,[min,max]] of Object.entries(optional))if(input[k]!==null&&input[k]!==undefined&&input[k]!=='')finite(k,min,max);
 if(input.amountMode==='fixed')finite('principal',.01,1e9);
 if(input.amountMode==='entry')finite('ownFunds',0,1e9);
 if(input.appraisal!=null&&input.appraisal!=='')finite('appraisal',1,1e9);
 if(input.subsidyMode==='area')finite('propertyArea',1,10000);
 if(input.insurance==='custom'&&(input.customMipPercent==null||input.dfiOverride==null))error('customMipPercent','Informe os coeficientes MIP e DFI da apólice.');
 if(errors.length)return {ok:false,errors,warnings,ruleVersion:RULE_VERSION};
 const R=+input.income,V=+input.propertyValue,base=Math.min(V,+input.appraisal||V),region=municipality.regionCode;
 let program=input.program;
 if(program==='auto')program=R<=9600&&V<=400000?'mcmv':R<=13000&&V<=600000?'middle':'sbpe';
 let nominal,quota=80,programName,subEligible=false;
 if(program==='mcmv'){
  programName=R<=3200?'MCMV • Faixa 1':R<=5000?'MCMV • Faixa 2':'MCMV • Faixa 3';
  if(R>9600)error('income','MCMV Faixas 1–3: renda limitada a R$ 9.600. Experimente Classe Média ou SBPE.');
  if(V>400000)error('propertyValue','MCMV Faixas 1–3: imóvel limitado a R$ 400 mil.');
  nominal=mcmvRate(R,input.cotista,region)??8.16;
  if(R<=5000&&V>municipality.propertyLimit){nominal=input.cotista?7.66:8.16;programName='MCMV • condições da Faixa 3';warnings.push(`Imóvel acima do limite local de ${municipality.propertyLimit}: aplicada a exceção até R$ 400 mil, com juros da Faixa 3 e sem descontos.`);}
  else subEligible=R<=4000&&V<=municipality.propertyLimit;
  if(input.propertyType==='used')warnings.push('A quota MCMV de usado ainda não foi homologada. Informe a quota da oferta CAIXA nos ajustes para melhorar a comparação.');
  else warnings.push('Quota MCMV de 80% baseada nos testes de imóvel novo; a oferta depende do perfil.');
 }else if(program==='middle'){
  programName='MCMV • Classe Média';nominal=10;
  if(R>13000)error('income','Classe Média: renda limitada a R$ 13 mil.');
  if(V>600000)error('propertyValue','Classe Média: imóvel limitado a R$ 600 mil.');
  quota=input.propertyType==='used'&&['S','SE'].includes(region)?60:80;
  warnings.push('Classe Média: enquadramento normativo aplicado; seguro e oferta comercial ainda precisam de testes oficiais nesta linha.');
 }else if(program==='pro'){
  programName='Pró-Cotista';nominal=8.66;quota=input.propertyType==='used'?50:80;
  if(!input.cotista)error('cotista','Pró-Cotista exige pelo menos três anos sob FGTS.');
  if(!input.activeFgts&&(+input.fgtsTotalBalance||0)<.1*(+input.appraisal||V))error('fgtsTotalBalance','Sem vínculo FGTS ativo, informe saldo de pelo menos 10% da avaliação para Pró-Cotista.');
  if(input.propertyType==='used'&&R>12000)error('income','Pró-Cotista usado: renda limitada a R$ 12 mil na regra pesquisada.');
  warnings.push('Pró-Cotista depende de recursos disponíveis e oferta CAIXA. Teto de imóvel, quota de novo e apólice devem ser confirmados; este resultado é exploratório.');
 }else{
  programName='SBPE';nominal=nominalFromEffective(input.relationship==='salary'?11.19:input.relationship==='account'?11.29:11.49);
  nominal=D(nominal).toDecimalPlaces(4).toNumber();
  quota=input.system==='SAC'?80:70;
  warnings.push('Taxa SBPE baseada no perfil consultado em 14/09/2026; relacionamento e salário não garantem a mesma oferta para todos.');
 }
 if(program==='mcmv'&&input.previousBenefit)error('previousBenefit','Benefício habitacional anterior pode impedir também descontos de juros e administração. Este caso requer análise específica no MCMV, inclusive a exceção de benefício apenas para material. Compare uma alternativa em SBPE ou Pró-Cotista quando elegível.');
 if(program==='pro'&&(+input.appraisal||V)>2250000)error('appraisal','Pró-Cotista: a avaliação do imóvel deve respeitar o teto SFH de R$ 2,25 milhões.');
 if(program!=='sbpe'&&(input.otherProperty||input.otherSfh))error(input.otherProperty?'otherProperty':'otherSfh','Há imóvel local ou financiamento SFH informado. O enquadramento desta linha requer análise específica; use SBPE para testar uma alternativa.');
 if(input.fgtsUse>0&&(!input.cotista||input.otherProperty||input.otherSfh||input.fgtsLocalEligible===false))error('fgtsUse','Uso de FGTS exige os requisitos de tempo, moradia/trabalho, propriedade e SFH. Confira o enquadramento.');
 if(input.fgtsUse>0){
  if((+input.appraisal||V)>2250000)error('fgtsUse','Uso de FGTS na entrada: a avaliação deve respeitar o teto de R$ 2,25 milhões.');
  if(input.fgtsPropertyHistory==='recent')error('fgtsPropertyHistory','O imóvel adquirido com FGTS há menos de três anos não atende ao interstício pesquisado para novo uso do FGTS.');
  if(!input.fgtsPropertyHistory||input.fgtsPropertyHistory==='unknown')warnings.push('Confira se passaram pelo menos três anos desde a aquisição anterior deste imóvel com FGTS. O histórico ainda não foi confirmado.');
 }
 if(program==='sbpe'&&(+input.appraisal||V)>2250000){programName='SBPE • SFI';warnings.push('Avaliação acima do teto SFH: cenário SBPE/SFI exploratório. Taxa e seguro dessa faixa de imóvel não foram homologados pelos testes.');}
 if(input.confirmedAid>0){
  if(!input.aidConfirmed)error('aidConfirmed','Confirme que o aporte informado está habilitado para este empreendimento e pode ser combinado nesta compra.');
  warnings.push('Aporte local informado pelo usuário. Casa Paulista exige empreendimento habilitado, renda até três salários mínimos e disponibilidade; R$ 13 mil não é universal.');
 }
 let months=Math.min(+input.months,maxAgeMonths(input.birthDate,input.simulationDate),input.family==='two'?maxAgeMonths(input.secondBirthDate,input.simulationDate):420,program==='sbpe'&&input.system==='PRICE'?360:420);
 if(months<1)error('birthDate','Não há prazo disponível dentro do limite de 80 anos e seis meses.');
 if(months<+input.months)warnings.push(`Prazo ajustado de ${input.months} para ${months} meses por idade ou pela condição PRICE/SBPE observada.`);
 if(input.nominalOverride!=null&&input.nominalOverride!==''){nominal=+input.nominalOverride;warnings.push('Juros nominais informados manualmente. O enquadramento e o subsídio normativo mantêm a taxa de referência do programa.');}
 if(input.quotaOverride!=null&&input.quotaOverride!=='')quota=+input.quotaOverride;
 const normativeCap=program==='middle'?(input.propertyType==='used'&&['S','SE'].includes(region)?60:input.system==='SAC'?90:80):program==='pro'&&input.propertyType==='used'?50:program==='sbpe'?(input.system==='SAC'?80:70):input.system==='SAC'?90:80;
 if(quota>normativeCap)error('quotaOverride',`A quota ultrapassa o limite de ${normativeCap}% aplicado à modalidade.`);
 if(errors.length)return {ok:false,errors,warnings,ruleVersion:RULE_VERSION};
 if(input.subsidyMode==='manual'&&program==='mcmv'&&subEligible){
  const manualCap=(input.cci?49500:region==='N'?65000:55000)*(input.family==='single'?.3:1)*(input.propertyType==='used'?.5:1);
  if(+input.subsidyManual>manualCap+.001)return {ok:false,errors:[{field:'subsidyManual',message:`O subsídio informado supera o teto aplicável de R$ ${manualCap.toFixed(2).replace('.',',')} após os redutores. Para registrar uma oferta divergente, use os campos da comparação oficial, sem alterar o subsídio do cálculo.`}],warnings,ruleVersion:RULE_VERSION};
 }
 const subsidyRate=mcmvRate(R,input.cotista,region)??nominal;
 const subsidy=calculateSubsidy(input,municipality,catalog.fdByUf[municipality.uf],subsidyRate,program==='mcmv'&&subEligible);
 warnings.push(...subsidy.warnings);
 if(input.subsidyMode==='manual'&&!subEligible&&+input.subsidyManual>0)warnings.push('Subsídio manual desconsiderado: este enquadramento não admite desconto de entrada no motor.');
 const insuranceModel=program==='mcmv'?'mcmv':'sbpe';
 const adminFee=input.adminOverride!=null&&input.adminOverride!==''?+input.adminOverride:(program==='mcmv'&&R<=2850&&V<=municipality.propertyLimit?0:25);
 const dfiRatePercent=input.dfiOverride!=null&&input.dfiOverride!==''?+input.dfiOverride:insuranceModel==='mcmv'?.0071:.0066;
 const extraPremiumMonthly=input.insurance==='plus'?money(D(V).mul('.00006396')):input.insurance==='expanded'?money(D(V).mul('.00015878')):0;
 if(extraPremiumMonthly)warnings.push('Coberturas adicionais projetadas como valor mensal constante a partir dos resumos observados; cronograma desses pacotes ainda não homologado.');
 if(input.insurance==='custom')warnings.push('Coeficiente MIP manual constante: mudanças futuras por idade não estão incorporadas nesta opção.');
 const ages=[ageOn(input.birthDate,input.simulationDate),...(input.family==='two'?[ageOn(input.secondBirthDate,input.simulationDate)]:[])];
 if(ages.some(a=>a!==38))warnings.push('Tabela de seguro estendida a partir do perfil de entrada aos 38 anos. Outras idades de contratação exigem conferência da apólice.');
 if(input.family==='two')warnings.push('Seguro ponderado pela participação informada de cada comprador; a composição ainda não foi conciliada com um caso oficial.');
 const insuranceOpts={insuranceModel,birthDate:input.birthDate,secondBirthDate:input.secondBirthDate,secondSharePercent:input.secondSharePercent,customMipPercent:input.insurance==='custom'?+input.customMipPercent:null};
 const referenceExtra=insuranceModel==='mcmv'?money(D(V).mul('.00006396')):money(D(V).mul('.00015878'));
 const capExtra=Math.max(extraPremiumMonthly,referenceExtra);
 const mi=D(weightedMip(insuranceOpts,input.simulationDate)).div(100),i=D(nominal).div(1200);
 const coeff=input.system==='SAC'?D(1).div(months).plus(i):(i.isZero()?D(1).div(months):i.div(D(1).minus(D(1).plus(i).pow(-months))));
 const incomeLimit=D(R).mul(input.commitmentPercent||30).div(100);
 const affordable=Decimal.max(0,incomeLimit.minus(adminFee).minus(D(+input.appraisal||V).mul(dfiRatePercent).div(100)).minus(capExtra).div(coeff.plus(mi)));
 const capByQuota=D(base).mul(quota).div(100);
 const resourceCap=D(V).minus(input.fgtsUse).minus(subsidy.amount).minus(input.confirmedAid);
 const maximum=money(Decimal.max(0,Decimal.min(affordable,capByQuota,resourceCap)));
 let principal=input.amountMode==='fixed'?money(input.principal):input.amountMode==='entry'?money(resourceCap.minus(input.ownFunds)):maximum;
 if(program==='pro'&&principal>2250000)error('principal','Pró-Cotista: o financiamento deve respeitar o teto SFH de R$ 2,25 milhões.');
 if(principal<=0)error('principal','Não há valor positivo a financiar com esta renda e composição de recursos.');
 if(D(principal).gt(capByQuota.plus(.01)))error('principal',`O financiamento supera a quota de ${quota}% sobre a base de compra/avaliação.`);
 if(D(principal).gt(resourceCap.plus(.01)))error('fgtsUse','Financiamento, FGTS, subsídio e aporte excedem o preço do imóvel.');
 if(program==='sbpe'&&input.relationship!=='none'&&principal<150000)error('principal','No fluxo de relacionamento/TR pesquisado, o financiamento mínimo foi R$ 150 mil. Experimente balcão ou outro valor.');
 if(input.amountMode!=='max'&&principal>maximum+1)warnings.push('Valor informado acima da capacidade estimada por renda. As parcelas são um cálculo exploratório, sem indicação de aprovação.');
 if(input.amountMode!=='max'&&principal>maximum+.01&&principal<=maximum+1)warnings.push('Há diferença de até R$ 1 entre o principal informado e a capacidade aproximada; o motor não usa isso para inferir reprovação por renda.');
 if(input.amountMode==='max')warnings.push('Financiamento máximo estimado por quota e renda, usando o seguro de referência mais completo observado. A busca interna da CAIXA ainda não foi reproduzida ao centavo.');
 if(errors.length)return {ok:false,errors,warnings,ruleVersion:RULE_VERSION};
 const schedule=buildSchedule({principal,months,nominalAnnual:nominal,system:input.system,simulationDate:input.simulationDate,propertyValue:+input.appraisal||V,...insuranceOpts,adminFee,dfiRatePercent,extraPremiumMonthly});
 const assessment=input.assessmentOverride!=null&&input.assessmentOverride!==''?+input.assessmentOverride:program==='mcmv'?(input.linkedProject?0:money(D(principal).mul('.015'))):841.44;
 warnings.push('Tarifa de avaliação aplicada por hipótese do produto; confira o valor oficial. ITBI e cartório são informados separadamente.');
 if(schedule.roundingAdjustment!==0)warnings.push(`A soma da amortização difere do principal em R$ ${schedule.roundingAdjustment.toFixed(2)} pela convenção de arredondamento observada no SAC.`);
 const netCredit=money(D(principal).minus(assessment).minus(schedule.initialInsurance));
 if(netCredit<=0)return {ok:false,errors:[{field:'assessmentOverride',message:'Avaliação e seguro inicial atingem ou superam o financiamento. Confira os custos à vista para calcular o CET.'}],warnings,ruleVersion:RULE_VERSION};
 const cet=computeCet(schedule.rows,netCredit,input.simulationDate),cetActualDates=computeCet(schedule.rows,netCredit,input.simulationDate,true);
 const ownFunds=money(resourceCap.minus(principal));
 return {ok:true,input,ruleVersion:RULE_VERSION,status:'estimate',program,programName,municipality,principal,maximum,ownFunds,fgtsUse:+input.fgtsUse,aid:+input.confirmedAid,subsidy,propertyValue:V,months,quota,nominalAnnual:nominal,effectiveAnnual:effectiveFromNominal(nominal),adminFee,assessment,dfiRatePercent,insuranceModel,insurance:input.insurance,firstSummary:schedule.firstSummary,lastSummary:schedule.lastSummary,schedule,cet,cetActualDates,cesh:schedule.cesh,initialInsurance:schedule.initialInsurance,purchaseCosts:+input.purchaseCosts,totalCash:money(D(ownFunds).plus(input.purchaseCosts).plus(assessment).plus(schedule.initialInsurance)),incomeCommitment:schedule.firstSummary/R*100,capacityApproved:principal<=maximum+1,warnings:[...new Set(warnings)],errors,assumptions:['Cronograma sem projeção da TR futura.','CET de comparação usa períodos mensais iguais; o cálculo por datas corridas aparece nos detalhes.','CESH considera MIP e DFI; coberturas adicionais não entram nesse indicador.']};
}
