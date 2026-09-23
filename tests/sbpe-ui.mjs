// Verificação local opcional. Inicie npm start e informe PLAYWRIGHT_MODULE
// quando o Playwright não estiver instalado no ambiente padrão.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},locale:'pt-BR',reducedMotion:'reduce'});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const summary=async()=>(await page.locator('.result-card').innerText()).replace(/\s/g,'');
const calculate=async()=>{await page.locator('#simulate-button').click();await page.locator('.result-card').waitFor();};
try{
 await page.goto(process.env.SIMULA_URL||'http://127.0.0.1:4173');
 await page.locator('#income').fill('21000');
 await page.locator('#birthDate').fill('01021988');
 await page.locator('#propertyValue').fill('780000');
 assert.equal(await page.locator('#sbpe-variant-field').isVisible(),true);
 assert.equal(await page.locator('#sbpeVariant').inputValue(),'standard');
 await page.locator('#advanced-options > summary').click();
 await page.locator('#adjustments-details > summary').click();
 await page.locator('#simulationDate').fill('2026-09-22');
 await calculate();
 assert.ok((await summary()).includes('R$524.033,79'));
 await page.locator('#sbpeVariant').selectOption('linked');
 assert.equal(await page.locator('.stale-banner').isVisible(),true);
 await calculate();
 const sac=await summary();
 for(const value of ['SBPE•empreendimentoCAIXA','R$530.386,96','R$249.613,04','R$6.250,11','R$1.299,33','90%'])assert.ok(sac.includes(value),value);
 await page.locator('#go-compare').click();
 await page.locator('#save-case').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('simula-habitacao.tests.v1')));
 assert.equal(saved[0].input.sbpeVariant,'linked');
 assert.equal(saved[0].result.principal,530386.96);
 await page.locator('input[name=system][value=PRICE]').check();
 await calculate();
 for(const value of ['R$532.531,01','R$5.200,11','360meses','80%'])assert.ok((await summary()).includes(value),value);
 await page.locator('summary').filter({hasText:'Totais e detalhes do cálculo'}).click();
 assert.match(await page.locator('#result-panel').innerText(),/Limite de renda usado no máximo\s+25,00%/);
 await page.locator('[data-view=historico]').click();
 await page.locator('[data-open-case]').first().click();
 assert.equal(await page.locator('#sbpeVariant').inputValue(),'linked');
 assert.ok((await summary()).includes('R$530.386,96'));
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:844});
  await page.locator('#sbpeVariant').scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`);
 }
 if(process.env.SIMULA_UI_SCREENSHOT)await page.screenshot({path:process.env.SIMULA_UI_SCREENSHOT});
 await page.locator('#income').fill('6000');
 await page.locator('#propertyValue').fill('350000');
 assert.equal(await page.locator('#sbpe-variant-field').isVisible(),false);
 await calculate();
 assert.ok((await summary()).includes('MCMV'));
 assert.deepEqual(errors,[]);
 console.log('SBPE UI: seleção, SAC/PRICE, histórico, enquadramento MCMV e larguras 320/390/768 aprovados.');
}finally{await browser.close();}
