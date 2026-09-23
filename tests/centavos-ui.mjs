// Interface local, sem usar ou modificar a sessão real da CAIXA.
// SIMULA_URL e PLAYWRIGHT_MODULE seguem as demais suítes opcionais de UI.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},locale:'pt-BR',timezoneId:'America/Sao_Paulo',reducedMotion:'reduce',acceptDownloads:true});
const page=await context.newPage(),errors=[],passed=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,value)=>{assert.ok(value,name);passed.push(name);};
const url=process.env.SIMULA_URL||'http://127.0.0.1:4173';
const date=()=>page.locator('#simulationDate').inputValue();
const open=async selector=>{if(!await page.locator(selector).evaluate(e=>e.open))await page.locator(selector+' > summary').click();};
const calculate=async()=>{await page.locator('#simulate-button').click();await page.locator('.result-card').waitFor();assert.equal(await page.locator('.stale-banner').count(),0);};
const compact=text=>text.replace(/\s/g,'');
try{
 await page.clock.install({time:new Date('2026-09-23T01:00:00Z')}); // 22/09 em SP.
 await page.goto(url);await page.locator('#loading').waitFor({state:'hidden'});
 check('Abertura usa data local, não a data UTC',await date()==='2026-09-22');
 check('Data-base também é legível em dia/mês/ano',await page.locator('#simulation-date-hint').textContent()==='22/09/2026 · Atualizada automaticamente para o dia de hoje.');
 await page.locator('#income').fill('15200');await page.locator('#birthDate').fill('01021988');
 await page.locator('#propertyValue').fill('1500000');await page.locator('#cotista').selectOption('no');
 await page.locator('#family').selectOption('dependents');await page.locator('#propertyType').selectOption('used');
 await calculate();
 await page.clock.fastForward('03:00:00');
 check('Virada do dia atualiza data automática',await date()==='2026-09-23');
 check('Virada do dia invalida resultado anterior',await page.locator('.stale-banner').isVisible());
 await calculate();
 const summary=compact(await page.locator('.result-card').innerText());
 for(const expected of ['R$360.643,51','R$1.139.356,49','R$4.321,84','R$891,50','10,92%/11,49%','12,61%'])check('Resumo oficial: '+expected,summary.includes(expected));
 await page.locator('summary').filter({hasText:'Totais e detalhes do cálculo'}).click();
 const details=await page.locator('#result-panel').innerText();
 check('Precisão nominal de cálculo preservada',/10,9259%/.test(details));
 check('Total financeiro do resumo visível',/Soma das parcelas financeiras · resumo\s+R\$\s*1\.051\.845,56/.test(details));
 await page.locator('#go-compare').click();
 for(const [key,value]of Object.entries({principal:'360643,51',ownFunds:'1139356,49',firstSummary:'4321,84',lastSummary:'891,50',nominalAnnual:'10,92'}))await page.locator('#official-'+key).fill(value);
 check('Comparação usa a taxa apresentada',await page.locator('#comparison-status').innerText()==='Sem diferenças nos 5 campos informados.');
 await page.locator('#save-case').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('simula-habitacao.tests.v1')));
 check('Histórico guarda data e precisão de cálculo',saved[0].input.simulationDate==='2026-09-23'&&saved[0].result.nominalAnnual===10.9259&&saved[0].result.nominalDisplayed===10.92&&saved[0].stats.different===0);
 const savedSnapshot=JSON.stringify(saved);
 await open('#schedule-details');
 const downloadPromise=page.waitForEvent('download');await page.locator('#download-schedule').click();
 const download=await downloadPromise,csv=await fs.readFile(await download.path(),'utf8');
 const exported=csv.trim().replace(/^\uFEFF/,'').split(/\r?\n/).slice(1).map(line=>line.split(';').map(s=>s.slice(1,-1).replaceAll('""','"')));
 const official=JSON.parse(await fs.readFile(new URL('../validation/caixa-centavos-parcelas-2026-09-23.json',import.meta.url)));
 assert.equal(exported.length,official.length);
 const num=value=>Number(value.replaceAll('.','').replace(',','.'));
 for(const [i,row]of exported.entries()){
  const o=official[i];assert.equal(Number(row[0]),o.installment);assert.equal(row[1],o.date.split('-').reverse().join('/'));
  for(const [column,key]of [[4,'mip'],[5,'dfi'],[6,'adminFee'],[8,'total'],[9,'balance']])assert.equal(num(row[column]),o[key],`CSV ${i+1}: ${key}`);
  assert.equal(Math.round((num(row[2])+num(row[3]))*100),Math.round(o.paymentPI*100),`CSV ${i+1}: prestação financeira`);
 }
 check('CSV reproduz as 420 parcelas oficiais',true);
 await open('#advanced-options');await open('#adjustments-details');
 await page.locator('#simulationDate').fill('2026-09-14');
 await page.clock.fastForward('24:00:00');
 check('Data manual não avança com o relógio',await date()==='2026-09-14');
 await calculate();
 check('Recalcular mantém a data manual',await date()==='2026-09-14');
 await page.locator('#use-today').click();
 check('Usar hoje retoma modo automático',await date()==='2026-09-24');
 await page.clock.setSystemTime(new Date('2026-09-25T15:00:00Z'));
 await calculate();
 check('Submissão atualiza a data mesmo sem temporizador',await date()==='2026-09-25');
 await page.locator('[data-view=historico]').click();await page.locator('[data-open-case]').first().click();
 check('Reabrir histórico preserva sua data explícita',await date()==='2026-09-23');
 await page.clock.fastForward('24:00:00');
 check('Histórico reaberto continua reproduzível após a virada',await date()==='2026-09-23');
 check('Registro salvo permanece intacto',await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('simula-habitacao.tests.v1'))))===savedSnapshot);
 for(const preset of ['mcmv-sac','mcmv-price','sbpe-price']){
  await page.locator('.examples-menu > summary').click();await page.locator(`[data-preset="${preset}"]`).click();
  check(preset+': data histórica preservada',await date()==='2026-09-14');
  await page.locator('#go-compare').click();
  assert.equal(await page.locator('#comparison-status').innerText(),'Sem diferenças nos 9 campos informados.',preset+': '+await page.locator('#comparison-body').innerText());
  check(preset+': referências continuam exatas',true);
 }
 await page.locator('#new-simulation').click();
 check('Limpar dados volta ao dia atual',await date()==='2026-09-26');
 check('Nova simulação começa vazia',await page.locator('#income').inputValue()===''&&!await page.locator('.results-column').isVisible());
 await page.clock.setSystemTime(new Date('2028-02-29T15:00:00Z'));
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 check('Retomar aba atualiza inclusive 29 de fevereiro',await date()==='2028-02-29');
 await open('#advanced-options');await open('#adjustments-details');
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:844});await page.locator('#use-today').scrollIntoViewIfNeeded();
  check('Sem overflow com data e botão em '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 const east=await browser.newContext({timezoneId:'Pacific/Kiritimati'}),other=await east.newPage();
 await other.clock.setFixedTime(new Date('2026-09-23T11:30:00Z'));await other.goto(url);await other.locator('#loading').waitFor({state:'hidden'});
 check('Fuso a leste usa dia local seguinte',await other.locator('#simulationDate').inputValue()==='2026-09-24');await east.close();
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({suite:'Data-base e centavos na interface',checks:passed.length,officialCsvRows:420,failures:0,passed},null,2));
}finally{await browser.close();}
