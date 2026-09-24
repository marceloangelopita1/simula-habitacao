import {simulate,ageOn,localToday,RULE_VERSION} from './engine.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=v=>Number.isFinite(+v)?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(+v):'—';
const number=(v,d=2)=>Number.isFinite(+v)?new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(+v):'—';
// Accept the Brazilian date format (also without slashes on numeric keyboards).
// The engine and saved records continue to receive ISO dates.
const birthValue=raw=>{
 const value=/^\d{8}$/.test(raw)?raw.slice(0,2)+'/'+raw.slice(2,4)+'/'+raw.slice(4):raw;
 return /^\d{2}\/\d{2}\/\d{4}$/.test(value)?value.split('/').reverse().join('-'):'';
};
const dateLabel=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')?v.split('-').reverse().join('/'):'—';
export function parseNumeric(value){
 let s=String(value??'').trim().replace(/^R\$\s*/,'').replace(/\s/g,'');if(s==='')return null;
 if(!/^-?[\d.,]+$/.test(s))return NaN;
 if(s.includes(',')){if((s.match(/,/g)||[]).length!==1||!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+),\d*$/.test(s))return NaN;s=s.replace(/\./g,'').replace(',','.');}
 else if(/^-?\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
 else if((s.match(/\./g)||[]).length>1)return NaN;
 return Number(s);
}
const storageKey='simula-habitacao.tests.v1';
let catalog,current=null,dirty=false,history=[],currentPreset=null,pageNo=0,storageAvailable=true,automaticSimulationDate=true;
const compareFields=[['principal','Financiamento','money',2],['ownFunds','Entrada com recursos próprios','money',2],['subsidy','Subsídio de entrada','money',2],['firstSummary','Primeira parcela · resumo','money',2],['lastSummary','Última parcela · resumo','money',2],['nominalAnnual','Juros nominais anuais','percent',2],['effectiveAnnual','Juros efetivos anuais','percent',2],['cet','CET anual · comparação mensal','percent',2],['cesh','CESH do seguro','percent',4]];
const presets={
 'mcmv-sac':{label:'Exemplo da pesquisa · MCMV SAC',input:{program:'mcmv',system:'SAC',income:6000,propertyValue:350000,principal:193949.89,months:420,amountMode:'fixed'},official:{principal:193949.89,ownFunds:156050.11,subsidy:0,firstSummary:1777.61,lastSummary:489.74,nominalAnnual:7.66,effectiveAnnual:7.93,cet:9.05,cesh:4.4945}},
 'mcmv-price':{label:'Exemplo da pesquisa · MCMV PRICE',input:{program:'mcmv',system:'PRICE',income:6000,propertyValue:350000,principal:193949.89,months:420,amountMode:'fixed'},official:{principal:193949.89,ownFunds:156050.11,subsidy:0,firstSummary:1407.70,lastSummary:1354.92,nominalAnnual:7.66,effectiveAnnual:7.93,cet:9,cesh:5.6002}},
 'sbpe-price':{label:'Exemplo da pesquisa · SBPE PRICE',input:{program:'sbpe',system:'PRICE',income:10000,propertyValue:500000,principal:245560.88,months:360,amountMode:'fixed',relationship:'salary'},official:{principal:245560.88,ownFunds:254439.12,subsidy:0,firstSummary:2370.38,lastSummary:2299.56,nominalAnnual:10.65,effectiveAnnual:11.19,cet:12.12,cesh:6.2841}}
};
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,5000);}
function readHistory(){try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');history=Array.isArray(saved)?saved.filter(validRecord):[];}catch{history=[];storageAvailable=false;}updateHistoryCount();}
function writeHistory(next){try{localStorage.setItem(storageKey,JSON.stringify(next));history=next;updateHistoryCount();return true;}catch{storageAvailable=false;toast('Não foi possível salvar no navegador. Exporte os testes para preservar os dados.');return false;}}
function updateHistoryCount(){$('#history-count').textContent=history.length;}
function populateStates(){const states=[...new Set(catalog.municipalities.map(m=>m.uf))].sort();$('#uf').innerHTML=states.map(uf=>`<option value="${uf}">${uf}</option>`).join('');$('#uf').value='SP';populateCities('3543402');}
function populateCities(selected){const list=catalog.municipalities.filter(m=>m.uf===$('#uf').value).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));$('#municipalityId').innerHTML=list.map(m=>`<option value="${m.ibge}">${esc(m.name)}</option>`).join('');if(selected&&list.some(m=>m.ibge===selected))$('#municipalityId').value=selected;updateCityHint();}
function updateCityHint(){const m=catalog.municipalities.find(m=>m.ibge===$('#municipalityId').value);$('#municipalityId').title=m?`Habitação popular: limite local de ${brl(m.propertyLimit)}. Outras faixas têm limites próprios.`:'';}
function setVisible(id,yes){$('#'+id).hidden=!yes;}
function updateOptionsHint(){
 const changed=$$('#advanced-options input, #advanced-options select').filter(e=>{
  if(e.type==='checkbox')return e.checked!==e.defaultChecked;
  if(e.tagName==='SELECT')return e.value!==([...e.options].find(o=>o.defaultSelected)||e.options[0]).value;
  if(['fgtsUse','confirmedAid','purchaseCosts'].includes(e.id))return (parseNumeric(e.value)??0)!==0;
  if(e.hasAttribute('data-money'))return parseNumeric(e.value)!==parseNumeric(e.defaultValue);
  return e.value!==e.defaultValue;
 }).length;
 $('#options-hint').textContent=changed?`${changed} ajuste${changed>1?'s':''} ativo${changed>1?'s':''}`:'FGTS, seguro e ajustes';
}
function updateConditional(){
 const paymentMode=$('#amountMode').value==='payment';
 setVisible('max-installment-field',paymentMode);$('#maxInstallment').disabled=!paymentMode;$('#maxInstallment').required=paymentMode;
 const program=$('#program').value, income=parseNumeric($('#income').value), value=parseNumeric($('#propertyValue').value);
 setVisible('sbpe-variant-field',program==='sbpe'||(program==='auto'&&income>0&&value>0&&(income>13000||value>600000)));
 setVisible('fgts-history-field',(parseNumeric($('#fgtsUse').value)||0)>0);setVisible('second-buyer-fields',$('#family').value==='two');setVisible('principal-field',$('#amountMode').value==='fixed');setVisible('own-funds-field',$('#amountMode').value==='entry');setVisible('area-fields',$('#subsidyMode').value==='area');setVisible('subsidy-manual-field',$('#subsidyMode').value==='manual');setVisible('pro-fields',$('#program').value==='pro');setVisible('relationship-field',['auto','sbpe'].includes($('#program').value));setVisible('aid-confirmation',(parseNumeric($('#confirmedAid').value)||0)>0);
 $('#subsidy-mode-hint').textContent=$('#subsidyMode').value==='area'?'A área altera o fator do imóvel. O resultado pode diferir do padrão da interface oficial.':$('#subsidyMode').value==='quick'?'Sem área, usamos FUH=0 e valor em reais inteiros. É uma hipótese de comparação.':$('#subsidyMode').value==='manual'?'Valor mantido apenas quando o enquadramento admite subsídio de entrada.':'O cálculo não usará subsídio de entrada.';
 updateOptionsHint();
 $('#simulation-date-hint').textContent=`${dateLabel($('#simulationDate').value)} · ${automaticSimulationDate?'Atualizada automaticamente para o dia de hoje.':'Data informada para reproduzir esta simulação.'}`;
 const age=ageOn(birthValue($('#birthDate').value),$('#simulationDate').value);$('#age-hint').textContent=Number.isFinite(age)&&age>=0?`${dateLabel(birthValue($('#birthDate').value))} · ${age} anos na data da simulação.`:'Usada no prazo e no seguro.';
 const n=+$('#months').value;$('#term-hint').textContent=Number.isInteger(n)&&n>0?`${Math.floor(n/12)} anos${n%12?' e '+n%12+' meses':''}.`:'Informe o prazo em meses.';
}
const moneyIds=['maxInstallment','income','propertyValue','appraisal','fgtsUse','confirmedAid','purchaseCosts','principal','ownFunds','subsidyManual','fgtsTotalBalance','adminOverride','assessmentOverride'];
const numberIds=['months','secondSharePercent','propertyArea','nominalOverride','quotaOverride','dfiOverride','customMipPercent','commitmentPercent'];
const boolIds=['aidConfirmed','cci','otherProperty','otherSfh','previousBenefit','fgtsLocalEligible','linkedProject','activeFgts'];
function readInput(){const d={};for(const [k,v]of new FormData($('#simulation-form')))d[k]=v;for(const k of [...moneyIds,...numberIds])d[k]=parseNumeric($('#'+k).value);for(const k of boolIds)d[k]=$('#'+k).checked;d.cotista=$('#cotista').value==='yes';for(const k of ['fgtsUse','confirmedAid','purchaseCosts'])if(d[k]===null)d[k]=0;d.birthDate=birthValue($('#birthDate').value);d.secondBirthDate=birthValue($('#secondBirthDate').value);d.purpose='purchase';if(d.amountMode!=='payment')d.maxInstallment=null;return d;}
function restoreInput(input){
 $('#simulation-form').reset();$$('#simulation-form details').forEach(d=>d.open=false);
 automaticSimulationDate=input.simulationDate==null;
 $('#simulationDate').defaultValue=localToday();$('#simulationDate').value=input.simulationDate??localToday();
 $('#uf').value='SP';populateCities('3543402');
 const m=catalog.municipalities.find(x=>x.ibge===input.municipalityId);if(m){$('#uf').value=m.uf;populateCities(m.ibge);}
 for(const [k,v]of Object.entries(input)){
  if(k==='system'){$(`input[name=system][value="${v==='PRICE'?'PRICE':'SAC'}"]`).checked=true;continue;}
  if(k==='cotista'){$('#cotista').value=v?'yes':'no';continue;}
  const e=document.getElementById(k);if(!e||!['INPUT','SELECT','TEXTAREA'].includes(e.tagName)||['uf','municipalityId','simulationDate'].includes(k))continue;
  if(e.type==='checkbox')e.checked=!!v;else e.value=v==null||v===''?'':moneyIds.includes(k)?number(v):['birthDate','secondBirthDate'].includes(k)?dateLabel(v):v;
 }
 updateConditional();clearErrors();
}
function refreshAutomaticDate(){
 if(!catalog||!automaticSimulationDate||$('#simulationDate').value===localToday())return;
 $('#simulationDate').defaultValue=localToday();$('#simulationDate').value=localToday();markDirty();
}
function markDirty(){
 updateConditional();$('#action-status').textContent=current?'Dados alterados. Simule novamente.':'Preencha os dados para simular.';if(!current||dirty)return;dirty=true;currentPreset=null;
 $('#comparison-section').hidden=true;$('#comparison-body').innerHTML='';$('#comparison-notes').value='';
 $('#result-panel').innerHTML='<div class="stale-banner" role="status">Dados alterados. Clique em <strong>Simular</strong> para atualizar o resultado.</div><div class="stale-content">'+$('#result-panel').innerHTML+'</div>';
 $$('#result-panel button').forEach(b=>b.disabled=true);
}
function clearErrors(){$('#form-errors').hidden=true;$$('[aria-invalid=true]').forEach(e=>e.removeAttribute('aria-invalid'));}
function revealField(input){for(let d=input.closest('details');d;d=d.parentElement.closest('details'))d.open=true;}
function showErrors(errors){
 const labels={maxInstallment:'parcela máxima',income:'renda familiar',propertyValue:'valor do imóvel',principal:'financiamento',months:'prazo',subsidyManual:'subsídio',customMipPercent:'MIP',quotaOverride:'quota',propertyArea:'área',secondSharePercent:'participação',nominalOverride:'juros',confirmedAid:'aporte',fgtsUse:'FGTS',appraisal:'avaliação'};
 $('#form-errors').innerHTML='<strong>Vamos conferir alguns dados:</strong><ul>'+errors.map(e=>`<li><a href="#${esc(e.field)}">${esc(e.message.replace(`valor de ${e.field}`,`valor de ${labels[e.field]||e.field}`))}</a></li>`).join('')+'</ul>';
 $('#form-errors').hidden=false;for(const e of errors){const input=document.getElementById(e.field);if(input){input.setAttribute('aria-invalid','true');revealField(input);}}
 $('#form-errors').focus();
}
function calculate({scroll=false,official=null,preset=null}={}){
 refreshAutomaticDate();
 clearErrors();let result;
 try{result=simulate(readInput(),catalog);}catch(e){result={ok:false,errors:[{field:'income',message:'Não foi possível calcular. Confira os valores, as datas e os ajustes informados.'}]};console.error(e);}
 if(!result.ok){showErrors(result.errors);$('#comparison-section').hidden=true;dirty=true;current=null;renderEmpty();$('#action-status').textContent='Confira os campos indicados.';return false;}
 current=result;dirty=false;currentPreset=preset;pageNo=0;renderResult();renderComparison(official);$('#action-status').textContent='Simulação atualizada.';if(scroll){$('#result-panel').focus({preventScroll:true});$('#result-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}return true;
}
function renderEmpty(){$('#result-panel').innerHTML='';$('.results-column').hidden=true;}
function metric(label,value,note='',cls=''){return `<div><span class="metric-label">${esc(label)}</span><strong class="metric-value ${cls}">${esc(value)}</strong>${note?`<span class="metric-note">${esc(note)}</span>`:''}</div>`;}
function summaryList(rows){return '<div class="result-list">'+rows.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')+'</div>';}
const paymentReasonLabels={payment:'parcela máxima informada',income:'capacidade pela renda',quota:'quota de financiamento',resources:'composição dos recursos para a compra',initialPayment:'ajuste do primeiro encargo, incluindo seguro e arredondamentos'};
function paymentReasons(limit){return limit.limitingFactors.map(key=>paymentReasonLabels[key]||key).join('; ');}
function paymentLimitSummary(r){
 const p=r.paymentLimit;if(!p)return '';
 return `<section class="payment-limit-summary" aria-label="Limite de parcela"><h3>Parcela inicial compatível com o limite informado</h3>${summaryList([['Limite informado',brl(p.requested)],['Primeiro encargo · cronograma',brl(r.schedule.rows[0].total)],['Financiamento limitado por',paymentReasons(p)],['Maior parcela projetada',brl(p.peak.amount)+' · parcela '+p.peak.installment+' · '+dateLabel(p.peak.date)]])}<p>O limite é inicial, com seguro e tarifa. As parcelas futuras podem variar com o seguro e a TR; esta projeção não inclui TR futura.</p>${p.futureExceeds?`<p class="payment-limit-warning"><strong>A parcela ${p.peak.installment}, em ${dateLabel(p.peak.date)}, chega a ${brl(p.peak.amount)} e supera o limite informado.</strong> Confira essa condição antes de usar a simulação para uma aprovação condicional.</p>`:''}</section>`;
}
function renderResult(){
 $('.results-column').hidden=false;const r=current,first=r.schedule.rows[0],last=r.schedule.rows.at(-1);const totalInsurance=first.mip+first.dfi+first.extraPremium;
 const components=[['Amortização',first.amortization,'#4b8c69'],['Juros',first.interest,'#bad4bb'],['Seguros',totalInsurance,'#e0cb8f'],['Tarifa',first.adminFee,'#ced6c7']];
 const points=r.schedule.rows.filter((_,k)=>k===0||k===r.months-1||k%Math.ceil(r.months/45)===0).map((row,k,arr)=>`${(k/(arr.length-1)*440).toFixed(1)},${(88-row.balance/r.principal*75).toFixed(1)}`).join(' ');
 const maxLabel=r.input.amountMode==='payment'?'Financiamento máximo para a parcela informada':r.input.amountMode==='max'?'Financiamento máximo estimado':'Valor financiado';
 $('#result-panel').innerHTML=`<div class="result-top"><h2>Sua simulação</h2><span class="tag">● Estimativa para validar</span></div><article class="result-card"><div class="result-banner"><div class="eyebrow">${currentPreset?'EXEMPLO DA PESQUISA':'CENÁRIO CALCULADO'}</div><h3>${esc(r.programName)}</h3><p>${esc(r.municipality.name)} / ${esc(r.municipality.uf)} · Imóvel ${r.input.propertyType==='new'?'novo':'usado'} · ${r.input.system} / TR</p></div><div class="result-metrics">${metric(maxLabel,brl(r.principal))}${metric('Entrada com dinheiro próprio',brl(r.ownFunds),'Sem FGTS e aportes')}${metric('Subsídio de entrada',brl(r.subsidy.amount),'Estimativa / valor informado','small-value')}${metric('Prazo aplicado',r.months+' meses',number(r.months/12,1)+' anos','small-value')}</div><div class="payment-box">${metric('Primeira parcela · resumo',brl(r.firstSummary),'Com seguro e tarifa')}${metric('Última parcela · resumo',brl(r.lastSummary),'Sem TR futura')}</div>${paymentLimitSummary(r)}${!r.capacityApproved?'<p class="capacity-note">O valor informado supera a capacidade estimada por renda. Resultado exploratório.</p>':''}${summaryList([['Juros nominais / efetivos a.a.',number(r.nominalDisplayed)+'% / '+number(r.effectiveAnnual)+'%'],['Quota máxima aplicada',number(r.quota,0)+'%'],['Seguro selecionado',({basic:'Básico · MIP + DFI',plus:'Mais / Especial · estimado',expanded:'Ampliado · estimado',custom:'Coeficientes informados'})[r.insurance]],['CET anual · meses iguais',number(r.cet)+'%'],['CESH · indicador do seguro',number(r.cesh,4)+'%']])}<p class="summary-footnote">O resumo e o cronograma podem diferir por arredondamento e ajuste final, como nos testes da CAIXA. CESH não é uma taxa anual de juros.</p><div class="result-actions"><button type="button" class="button primary" id="go-compare">Comparar com a CAIXA <span aria-hidden="true">↓</span></button><button type="button" class="button secondary" id="print-result">Imprimir</button></div></article><details class="result-detail insight-detail"><summary>Composição da parcela e evolução do saldo</summary><div class="insight-card"><span class="small muted">Cronograma: <strong>${brl(first.total)}</strong> · resumo: ${brl(r.firstSummary)}</span><div class="breakdown-bars" aria-hidden="true">${components.map(([,v,c])=>`<span style="width:${v/first.total*100}%;background:${c}"></span>`).join('')}</div><div class="breakdown-legend">${components.map(([label,v,c])=>`<div><i style="background:${c}"></i><span>${label}</span><strong>${brl(v)}</strong></div>`).join('')}</div><svg class="chart" viewBox="0 0 440 104" role="img" aria-label="Saldo devedor diminui ao longo do prazo até zero"><path d="M0 88H440" stroke="#e7eddf" fill="none"/><polygon points="0,88 ${points} 440,88" fill="#eef5e9"/><polyline points="${points}" stroke="#8aaf72" fill="none" stroke-width="2" stroke-linecap="round"/></svg><div class="chart-labels"><span>Saldo devedor · início</span><span>${r.months} meses · saldo zero</span></div></div></details><details class="result-detail"><summary>Recursos para a compra e custos</summary><dl>${[['Preço do imóvel',brl(r.propertyValue)],['Financiamento',brl(r.principal)],['Subsídio',brl(r.subsidy.amount)],['FGTS utilizado',brl(r.fgtsUse)],['Aporte confirmado',brl(r.aid)],['Recursos próprios para o preço',brl(r.ownFunds)],['Avaliação',brl(r.assessment)],['Seguro inicial',brl(r.initialInsurance)],['ITBI/cartório/outros informados',brl(r.purchaseCosts)],['Dinheiro próprio + custos',brl(r.totalCash)]].map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl><p>No CET, somamos financiamento e subsídio e descontamos avaliação estimada e seguro inicial. A avaliação é uma hipótese de comparação; informe a tarifa ou isenção confirmada pela CAIXA nos ajustes.</p></details><details class="result-detail"><summary>Totais e detalhes do cálculo</summary><p>No SAC, a soma financeira do resumo não inclui o acerto residual da última amortização. O total de encargos da planilha inclui esse acerto, seguros e tarifas.</p><p>O máximo considera um seguro de referência. O adicional usado na capacidade não é cobrado no cronograma do seguro básico.</p><dl>${[['Soma das parcelas financeiras · resumo',brl(r.paymentPITotal)],['Amortização + juros · planilha',brl(r.schedule.sums.amortization+r.schedule.sums.interest)],['Total de juros, sem TR',brl(r.schedule.sums.interest)],['Total de encargos do cronograma',brl(r.schedule.sums.total)],['MIP + DFI no prazo',brl(r.schedule.sums.mip+r.schedule.sums.dfi)],['1ª / última na planilha',brl(first.total)+' / '+brl(last.total)],['Crédito considerado no CET',brl(r.cetNetCredit)],['CET mensal anualizado (precisão)',number(r.cet,4)+'%'],['CET por datas corridas / 365',number(r.cetActualDates,4)+'%'],['Taxa nominal usada no cálculo',number(r.nominalAnnual,4)+'% a.a.'],['Comprometimento inicial da renda',number(r.incomeCommitment)+'%'],['Limite de renda usado no máximo',number(r.commitmentPercent)+'%'],['Adicional de referência na capacidade',brl(r.capacityReferenceExtra)],['Máximo estimado por renda/quota',brl(r.maximum)]].map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl></details><details class="result-detail"><summary>Premissas e pontos para conferir (${r.warnings.length})</summary><ul>${[...r.warnings,...r.assumptions].map(v=>`<li>${esc(v)}</li>`).join('')}</ul></details>${r.subsidy.factors?`<details class="result-detail"><summary>Memória do subsídio</summary><dl>${Object.entries(r.subsidy.factors).map(([k,v])=>`<dt>${esc(({income:'Renda',incomeFactor:'Fator renda',financingDemand:'Demanda teórica',vvi:'VVI limitado',fdUf:'Fator estadual',fdFin:'Fator financeiro',fuh:'Fator do imóvel (FUH)',fpop:'Fator populacional',cap:'Teto do desconto',reducer:'Multiplicador dos redutores'})[k]||k)}</dt><dd>${number(v,4)}</dd>`).join('')}</dl><p>${esc(r.subsidy.reason)}</p></details>`:''}<details class="result-detail" id="schedule-details"><summary>Ver as ${r.months} parcelas / baixar planilha</summary><div class="schedule-section"><div class="schedule-tools"><button type="button" class="button secondary" id="download-schedule">Baixar CSV</button><div class="schedule-pages"><button type="button" id="prev-page" aria-label="Parcelas anteriores">←</button><span id="page-label"></span><button type="button" id="next-page" aria-label="Próximas parcelas">→</button></div></div><p class="table-scroll-hint">Deslize a tabela para ver todos os componentes →</p><div class="table-wrap" tabindex="0" role="region" aria-label="Cronograma de parcelas, role para ver todas as colunas"><table class="schedule-table"><thead><tr><th>Nº / data</th><th>Amort.</th><th>Juros</th><th>MIP</th><th>DFI</th><th>Tarifa</th><th>Adic.</th><th>Encargo</th><th>Saldo</th></tr></thead><tbody id="schedule-body"></tbody></table></div></div></details>`;
 $('#go-compare').onclick=()=>{$('#comparison-section').open=true;$('#comparison-section > summary').focus({preventScroll:true});$('#comparison-section').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};$('#print-result').onclick=()=>window.print();$('#download-schedule').onclick=downloadSchedule;$('#prev-page').onclick=()=>{pageNo--;renderSchedulePage();};$('#next-page').onclick=()=>{pageNo++;renderSchedulePage();};renderSchedulePage();
}
function renderSchedulePage(){const start=pageNo*12,end=Math.min(start+12,current.months);$('#schedule-body').innerHTML=current.schedule.rows.slice(start,end).map(r=>`<tr><td>${r.installment}<br><span class="small muted">${dateLabel(r.date)}</span></td>${['amortization','interest','mip','dfi','adminFee','extraPremium','total','balance'].map(k=>`<td>${number(r[k])}</td>`).join('')}</tr>`).join('');$('#page-label').textContent=`${start+1}–${end}`;$('#prev-page').disabled=pageNo===0;$('#next-page').disabled=end>=current.months;}
function resultValue(r,key){return key==='subsidy'?r.subsidy.amount:key==='nominalAnnual'?(r.nominalDisplayed??r.nominalAnnual):r[key];}
function renderComparison(official=null){
 $('#comparison-section').hidden=false;$('#comparison-section').open=false;$('#comparison-notes').value='';$('#official-date').value=current.input.simulationDate;
 $('#comparison-context').textContent=(current.paymentLimit?`Parcela máxima inicial: ${brl(current.paymentLimit.requested)} · limitado por ${paymentReasons(current.paymentLimit)}. `:'')+(currentPreset?'Exemplo da pesquisa: valores oficiais já preenchidos para conferir o motor. ':'')+`${current.programName} · ${current.input.system} · ${current.months} meses · financiamento ${brl(current.principal)} · seguro ${current.insurance==='basic'?'básico':current.insurance}. Entrada própria exclui FGTS, subsídio e aporte; não copie uma entrada bruta sem ajustar.`;
 $('#comparison-body').innerHTML=compareFields.map(([key,label,type,d])=>`<tr><td><label for="official-${key}">${esc(label)}</label></td><td>${type==='money'?brl(resultValue(current,key)):number(resultValue(current,key),d)+'%'}</td><td><input id="official-${key}" data-compare="${key}" inputmode="decimal" placeholder="${type==='money'?'R$ 0,00':'0,00%'}" value="${official?.[key]!=null?number(official[key],d):''}" aria-label="${esc(label)} na CAIXA"></td><td id="delta-${key}" aria-live="polite">—</td></tr>`).join('');
 $$('[data-compare]').forEach(e=>e.addEventListener('input',updateComparison));updateComparison();
}
function comparisonValues(){const values={};for(const [key]of compareFields){const el=$('#official-'+key);if(!el)continue;const n=parseNumeric(el.value);if(n!==null)values[key]=n;}return values;}
function comparisonStats(values,result=current){let filled=0,different=0,invalid=0;for(const [key,,type,d]of compareFields){if(values[key]==null)continue;if(!Number.isFinite(values[key])||values[key]<0){invalid++;continue;}filled++;const delta=+(+resultValue(result,key).toFixed(d)-+values[key].toFixed(d)).toFixed(d);if(delta!==0)different++;}return {filled,different,invalid};}
function updateComparison(){
 const values=comparisonValues();for(const [key,,type,d]of compareFields){const v=values[key],cell=$('#delta-'+key),field=$('#official-'+key);field.removeAttribute('aria-invalid');cell.className='';if(v==null){cell.textContent='—';continue;}if(!Number.isFinite(v)||v<0){cell.textContent='Valor inválido';cell.className='diff-bad';field.setAttribute('aria-invalid','true');continue;}const delta=+(+resultValue(current,key).toFixed(d)-+v.toFixed(d)).toFixed(d);cell.textContent=delta===0?'Igual':(delta>0?'+':'−')+(type==='money'?brl(Math.abs(delta)):number(Math.abs(delta),d)+' p.p.');cell.className=delta===0?'diff-ok':'diff-bad';}
 const s=comparisonStats(values);$('#comparison-status').innerHTML=s.invalid?`<span class="diff-bad">Confira ${s.invalid} valor(es) oficial(is) inválido(s).</span>`:!s.filled?'Informe os valores oficiais que deseja conferir.':s.different?`<strong>${s.different} diferença(s)</strong> em ${s.filled} campo(s) informado(s).`:`<span class="diff-ok">Sem diferenças nos ${s.filled} campos informados.</span>`;
 $('#save-case').disabled=dirty||s.invalid>0;
}
function compactResult(r){const {input,schedule,...other}=r;return {...other,schedule:{sums:schedule.sums,firstSummary:schedule.firstSummary,lastSummary:schedule.lastSummary,initialInsurance:schedule.initialInsurance,roundingAdjustment:schedule.roundingAdjustment,firstRow:schedule.rows[0],lastRow:schedule.rows.at(-1)}};}
function saveCase(){
 if(!current||dirty)return;const official=comparisonValues(),stats=comparisonStats(official);if(stats.invalid)return;
 if(!$('#official-date').value&&stats.filled){toast('Informe a data do resultado oficial.');$('#official-date').focus();return;}
 const record={id:crypto.randomUUID?.()||`case-${Date.now()}-${Math.random().toString(16).slice(2)}`,createdAt:new Date().toISOString(),schemaVersion:1,ruleVersion:RULE_VERSION,label:current.input.caseLabel?.trim()||`${current.programName} · ${current.municipality.name}`,input:structuredClone(current.input),result:compactResult(current),official,officialDate:$('#official-date').value,notes:$('#comparison-notes').value,stats};
 if(writeHistory([record,...history]))toast(stats.different?'Teste salvo com diferenças. Exporte para compartilhar os achados.':'Teste salvo neste navegador.');
}
function csvEscape(v){let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function download(name,text,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function downloadSchedule(){if(!current||dirty)return;const headings=['parcela','vencimento','amortizacao','juros','MIP','DFI','tarifa','adicionais','encargo','saldo'];const rows=current.schedule.rows.map(r=>[r.installment,dateLabel(r.date),...['amortization','interest','mip','dfi','adminFee','extraPremium','total','balance'].map(k=>number(r[k]))]);download('cronograma-simula.csv','\uFEFF'+[headings,...rows].map(r=>r.map(csvEscape).join(';')).join('\r\n'),'text/csv;charset=utf-8');}
function validRecord(r){return !!(r&&r.schemaVersion===1&&typeof r.id==='string'&&r.id.length<150&&r.input&&r.result&&typeof r.result.principal==='number'&&Number.isFinite(r.result.principal)&&r.result.subsidy&&typeof r.result.subsidy.amount==='number'&&typeof r.label==='string'&&r.label.length<=200&&typeof r.notes==='string'&&r.notes.length<=5000&&r.official&&typeof r.official==='object'&&!Array.isArray(r.official)&&compareFields.every(([key])=>r.official[key]==null||(typeof r.official[key]==='number'&&Number.isFinite(r.official[key])&&r.official[key]>=0))&&compareFields.every(([key])=>typeof resultValue(r.result,key)==='number'&&Number.isFinite(resultValue(r.result,key)))&&typeof r.result.programName==='string'&&typeof r.result.municipality?.name==='string');}
function exportTests(){if(!history.length){toast('Salve um teste antes de exportar.');return;}download('testes-simula-habitacao.json',JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),ruleVersion:RULE_VERSION,records:history},null,2),'application/json');toast('Arquivo exportado. Ele inclui os dados e as observações dos testes.');}
async function importTests(file){
 if(!file)return;if(file.size>8*1024*1024){toast('Arquivo muito grande. O limite é 8 MB.');return;}
 try{const data=JSON.parse(await file.text());if(data.schemaVersion!==1||!Array.isArray(data.records)||data.records.length>1000||!data.records.every(validRecord))throw Error('schema');
  const known=new Set(history.map(x=>x.id)),fresh=data.records.filter(r=>!known.has(r.id));
  if(writeHistory([...fresh,...history])){renderHistory();toast(`${fresh.length} teste(s) importado(s).`);}
 }catch{toast('Arquivo inválido. Use um JSON exportado por este piloto.');}finally{$('#import-file').value='';}
}
function renderHistory(){
 const diffs=history.filter(r=>comparisonStats(r.official,r.result).different>0).length,checked=history.filter(r=>comparisonStats(r.official,r.result).filled>0).length;
 $('#history-summary').innerHTML=[[history.length,'testes salvos'],[checked,'com valores oficiais'],[diffs,'com diferenças']].map(([v,l])=>`<div class="history-stat"><strong>${v}</strong><span>${l}</span></div>`).join('');
 $('#history-list').innerHTML=history.length?history.map(r=>{const s=comparisonStats(r.official,r.result);return `<article class="history-card"><div><h3>${esc(r.label)}</h3><span class="tag ${s.different?'red':s.filled?'green':''}">${s.different?s.different+' diferença(s)':s.filled?'Sem diferenças em '+s.filled+' campos':'Ainda não comparado'}</span><p>${esc(r.result.programName)} · ${esc(r.input.system)} · ${esc(r.result.municipality.name)} · ${dateLabel(r.input.simulationDate)}</p>${r.notes?'<p>'+esc(r.notes.slice(0,160))+'</p>':''}</div><div class="history-values">Financiamento<strong>${brl(r.result.principal)}</strong><p>1ª parcela ${brl(r.result.firstSummary)}</p>${r.input.amountMode==='payment'?'<p>Limite inicial '+brl(r.input.maxInstallment)+'</p>':''}</div><div class="history-actions"><button type="button" data-open-case="${esc(r.id)}">Abrir como novo teste</button><button type="button" class="delete-case" data-delete-case="${esc(r.id)}">Excluir</button></div></article>`;}).join(''):'<div class="result-empty"><div><h2>Seu histórico começa no primeiro teste.</h2><p>Simule um cenário e clique em “Salvar teste neste navegador”.</p><button class="button primary" type="button" id="history-go-simulate">Fazer uma simulação</button></div></div>';
 $$('[data-open-case]').forEach(b=>b.onclick=()=>openCase(b.dataset.openCase));$$('[data-delete-case]').forEach(b=>b.onclick=()=>{const old=history;const r=history.find(r=>r.id===b.dataset.deleteCase);if(writeHistory(history.filter(r=>r.id!==b.dataset.deleteCase))){renderHistory();toast(`Teste “${r.label}” excluído. O arquivo exportado, se houver, permanece disponível.`);}});if($('#history-go-simulate'))$('#history-go-simulate').onclick=()=>setView('simular');
}
function openCase(id){const record=history.find(r=>r.id===id);if(!record)return;restoreInput(record.input);setView('simular');if(calculate()){currentPreset=null;$('#comparison-notes').value=record.notes;toast('Dados carregados em um novo rascunho. O teste salvo permanece intacto; refaça a conferência.');}}
function setView(view){if(!['simular','historico','regras'].includes(view))view='simular';for(const name of ['simular','historico','regras'])$('#view-'+name).hidden=name!==view;$$('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});if(view==='historico')renderHistory();location.hash=view;window.scrollTo({top:0,behavior:'instant'});}
function resetSimulation({focus=false}={}){restoreInput({birthDate:'',income:null,propertyValue:null,amountMode:'max'});current=null;dirty=false;currentPreset=null;$('#comparison-section').hidden=true;renderEmpty();$('#action-status').textContent='Preencha os dados para simular.';if(focus){window.scrollTo({top:0,behavior:'instant'});$('#income').focus({preventScroll:true});}}
function loadPreset(key){$('.examples-menu').open=false;const p=presets[key];restoreInput({birthDate:'1988-02-01',simulationDate:'2026-09-14',municipalityId:'3543402',family:'single',cotista:true,insurance:'basic',...p.input});setView('simular');calculate({official:p.official,preset:key});}
async function init(){
 try{const res=await fetch('./data/municipal-rules.json');if(!res.ok)throw Error('municipal');catalog=await res.json();populateStates();readHistory();$('#loading').hidden=true;$('#engine-version').textContent=`Motor ${RULE_VERSION} · ${catalog.municipalities.length.toLocaleString('pt-BR')} municípios no catálogo. Toda simulação é uma estimativa até ser conferida no escopo desejado.`;
  $('#simulation-form').addEventListener('submit',e=>{e.preventDefault();calculate({scroll:true});});
  const formChanged=e=>{if(e.target.id==='simulationDate')automaticSimulationDate=false;markDirty();};
  $('#simulation-form').addEventListener('input',formChanged);$('#simulation-form').addEventListener('change',formChanged);$('#uf').addEventListener('change',()=>{populateCities();markDirty();});$('#municipalityId').addEventListener('change',updateCityHint);
  $('#use-today').onclick=()=>{automaticSimulationDate=true;refreshAutomaticDate();updateConditional();};
  window.addEventListener('focus',refreshAutomaticDate);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAutomaticDate();});
  setInterval(refreshAutomaticDate,60000);
  ['birthDate','secondBirthDate'].forEach(id=>$('#'+id).addEventListener('blur',()=>{const value=birthValue($('#'+id).value);if(value)$('#'+id).value=dateLabel(value);updateConditional();}));
  $$('[data-money]').forEach(e=>e.addEventListener('blur',()=>{const v=parseNumeric(e.value);if(v!==null&&Number.isFinite(v))e.value=number(v);}));
  $$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$$('[data-preset]').forEach(b=>b.onclick=()=>loadPreset(b.dataset.preset));$('.brand').onclick=e=>{e.preventDefault();setView('simular');};
  $('#new-simulation').onclick=()=>resetSimulation({focus:true});
  $('#form-errors').addEventListener('click',e=>{const link=e.target.closest('a');if(!link)return;const field=document.getElementById(link.hash.slice(1));if(field){e.preventDefault();revealField(field);field.focus();}});
  $('#program').addEventListener('change',()=>{if($('#program').value==='pro')revealField($('#activeFgts'));});
  $('#insurance').addEventListener('change',()=>{if($('#insurance').value==='custom')$('#adjustments-details').open=true;});
  $('#save-case').onclick=saveCase;$('#comparison-form').addEventListener('submit',e=>e.preventDefault());$('#export-tests').onclick=exportTests;$('#import-tests').onclick=()=>$('#import-file').click();$('#import-file').onchange=()=>importTests($('#import-file').files[0]);
  const firstView=location.hash.slice(1);resetSimulation();setView(firstView);if(!storageAvailable)toast('O armazenamento local está indisponível neste navegador.');
 }catch(e){console.error(e);$('#loading').innerHTML='Não foi possível carregar as regras. Confira sua conexão e tente novamente. Se abriu os arquivos no computador, inicie o servidor local indicado nas instruções. <button type="button" id="reload">Tentar novamente</button>';$('#reload').onclick=()=>location.reload();}
}
init();
