// SIMULA_URL e PLAYWRIGHT_MODULE seguem as demais suítes opcionais de UI.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'pt-BR',timezoneId:'America/Sao_Paulo',reducedMotion:'reduce',acceptDownloads:true});
const page=await context.newPage(),errors=[],passed=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(name,value)=>{assert.ok(value,name);passed.push(name);};
const url=process.env.SIMULA_URL||'http://127.0.0.1:4173';
const calculate=async()=>{await page.locator('#simulate-button').click();await page.locator('.result-card').waitFor();assert.equal(await page.locator('.stale-banner').count(),0);};
const compact=text=>text.replace(/\s/g,'');
const input=page.locator('#maxInstallment');
const history=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('simula-habitacao.tests.v1')||'[]'));
try{
 await page.clock.setFixedTime(new Date('2026-09-23T15:00:00Z'));
 await page.goto(url);await page.locator('#loading').waitFor({state:'hidden'});
 check('Quatro modos disponíveis',await page.locator('#amountMode option').count()===4);
 check('Teto começa oculto e desativado',!await input.isVisible()&&await input.isDisabled());
 await page.locator('#income').fill('7000');await page.locator('#birthDate').fill('01021988');await page.locator('#propertyValue').fill('350000');
 await page.locator('#amountMode').selectOption('payment');
 check('Novo modo exibe campo obrigatório',await input.isVisible()&&await input.getAttribute('required')!==null);
 check('Ajuda explica encargo inicial e variação futura',/Limite inicial, com seguro e tarifa; parcelas futuras podem variar/.test(await page.locator('#max-installment-hint').textContent()));
 for(const value of ['', '0', '-1', 'inválido']){
  await input.fill(value);await page.locator('#simulate-button').click();
  check('Erro acessível no teto: '+value,await input.getAttribute('aria-invalid')==='true'&&await page.locator('#form-errors').isVisible());
 }
 await page.locator('#form-errors a[href="#maxInstallment"]').click();
 check('Link de erro foca o campo correto',await input.evaluate(e=>e===document.activeElement));
 await input.fill('1.604,28');await calculate();
 check('Moeda brasileira preservada',await input.inputValue()==='1.604,28');
 const summary=compact(await page.locator('.payment-limit-summary').innerText());
 check('Resumo mostra teto, primeiro encargo e motivo',summary.includes('R$1.604,28')&&summary.includes('Primeiroencargo')&&summary.includes('parcelamáximainformada'));
 check('Título identifica cálculo de máximo',await page.locator('.result-metrics').innerText().then(t=>t.includes('Financiamento máximo para a parcela informada')));
 await page.locator('#go-compare').click();
 check('Comparação preserva contexto do teto',compact(await page.locator('#comparison-context').innerText()).includes('Parcelamáximainicial:R$1.604,28'));
 await page.locator('#save-case').click();let saved=(await history())[0];
 check('Histórico salva modo, teto e metadados',saved.input.amountMode==='payment'&&saved.input.maxInstallment===1604.28&&saved.result.paymentLimit.satisfied);
 const before=saved.result.principal;
 await input.fill('1200');
 check('Alterar teto invalida resultado e comparação',await page.locator('.stale-banner').isVisible()&&!await page.locator('#comparison-section').isVisible());
 await calculate();await page.locator('#go-compare').click();await page.locator('#save-case').click();
 saved=(await history())[0];check('Teto menor reduz financiamento',saved.result.principal<before);
 await page.locator('#amountMode').selectOption('max');await calculate();
 check('Teto oculto não aparece no resultado',await page.locator('.payment-limit-summary').count()===0&&await input.isDisabled());
 await page.locator('#go-compare').click();await page.locator('#save-case').click();
 check('Teto inativo não vai para registro de outro modo',(await history())[0].input.maxInstallment===null);
 for(const [mode,field,value]of [['fixed','#principal','100000'],['entry','#ownFunds','250000']]){
  await page.locator('#amountMode').selectOption(mode);await page.locator(field).fill(value);await calculate();
  check('Modo existente '+mode+' continua funcionando',await page.locator('.payment-limit-summary').count()===0);
 }
 await page.locator('#amountMode').selectOption('payment');
 check('Voltar ao modo restaura valor digitado',await input.inputValue()==='1.200,00');
 await input.fill('1604,28');await page.locator('input[name=system][value=PRICE]').check();await calculate();
 check('PRICE avisa excesso futuro',await page.locator('.payment-limit-warning').isVisible());
 const futureText=await page.locator('.payment-limit-warning').innerText();
 check('Aviso inclui mês e valor da maior parcela',/parcela \d+, em \d\d\/\d\d\/\d{4}, chega a R\$/.test(futureText));
 await page.emulateMedia({media:'print'});
 check('Teto e alerta permanecem na impressão',await page.locator('.payment-limit-summary').isVisible()&&await page.locator('.payment-limit-warning').isVisible());
 await page.emulateMedia({media:'screen'});
 await page.locator('#go-compare').click();await page.locator('#save-case').click();
 const paymentSaved=(await history())[0];
 await page.locator('[data-view=historico]').click();
 check('Cartão do histórico identifica teto',compact(await page.locator('.history-card').first().innerText()).includes('LimiteinicialR$1.604,28'));
 const downloadPromise=page.waitForEvent('download');await page.locator('#export-tests').click();
 const download=await downloadPromise,data=JSON.parse(await fs.readFile(await download.path(),'utf8'));
 check('Exportação contém teto e resultado',data.records[0].input.maxInstallment===1604.28&&data.records[0].result.paymentLimit.futureExceeds);
 const imported=structuredClone(paymentSaved);imported.id='imported-payment-limit';imported.label='Teto importado';
 await page.locator('#import-file').setInputFiles({name:'limite.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schemaVersion:1,records:[imported]}))});
 check('Importação preserva dados',(await history()).some(r=>r.id===imported.id&&r.input.maxInstallment===1604.28));
 await page.locator('[data-open-case="imported-payment-limit"]').click();
 check('Reabrir teto restaura modo, moeda e alerta',await page.locator('#amountMode').inputValue()==='payment'&&await input.inputValue()==='1.604,28'&&await page.locator('.payment-limit-warning').isVisible());
 check('Reabertura não altera registro salvo',JSON.stringify((await history()).find(r=>r.id===imported.id))===JSON.stringify(imported));
 const legacy=structuredClone(paymentSaved);legacy.id='legacy-no-payment-field';legacy.label='Registro antigo';legacy.input.amountMode='fixed';legacy.input.principal=legacy.result.principal;delete legacy.input.maxInstallment;delete legacy.result.paymentLimit;legacy.ruleVersion='2026-09-23.piloto.2';
 await page.evaluate(record=>{const h=JSON.parse(localStorage.getItem('simula-habitacao.tests.v1'));h.push(record);localStorage.setItem('simula-habitacao.tests.v1',JSON.stringify(h));},legacy);
 await page.reload();await page.locator('#loading').waitFor({state:'hidden'});await page.locator('[data-view=historico]').click();await page.locator('[data-open-case="legacy-no-payment-field"]').click();
 check('Registro antigo abre sem migração ou teto oculto',await page.locator('#amountMode').inputValue()==='fixed'&&await input.inputValue()===''&&await page.locator('.payment-limit-summary').count()===0);
 for(const preset of ['mcmv-sac','mcmv-price','sbpe-price']){
  await page.locator('.examples-menu > summary').click();await page.locator(`[data-preset="${preset}"]`).click();await page.locator('#go-compare').click();
  check('Exemplo preservado: '+preset,await page.locator('#comparison-status').innerText()==='Sem diferenças nos 9 campos informados.'&&await input.inputValue()==='');
 }
 await page.locator('#amountMode').selectOption('payment');await input.fill('1604,28');await calculate();
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  await input.scrollIntoViewIfNeeded();check('Campo sem overflow em '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.payment-limit-summary').scrollIntoViewIfNeeded();check('Resultado sem overflow em '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 if(process.env.SIMULA_SCREENSHOT_DIR){
  await fs.mkdir(process.env.SIMULA_SCREENSHOT_DIR,{recursive:true});
  await page.screenshot({path:process.env.SIMULA_SCREENSHOT_DIR+'/payment-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:process.env.SIMULA_SCREENSHOT_DIR+'/payment-mobile.png',fullPage:true});
 }
 await page.locator('#new-simulation').click();
 check('Limpar remove teto e volta à renda',await input.inputValue()===''&&await input.isDisabled()&&await page.locator('#amountMode').inputValue()==='max');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({suite:'Parcela máxima na interface',checks:passed.length,failures:0,passed},null,2));
}finally{await browser.close();}
