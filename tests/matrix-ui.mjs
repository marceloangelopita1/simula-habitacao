// Fluxos locais críticos da matriz. Mesmo runtime opcional de sbpe-ui.mjs.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},locale:'pt-BR',reducedMotion:'reduce'});
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
const compact=text=>text.replace(/\s/g,'');
const summary=async()=>compact(await page.locator('.result-card').innerText());
const open=async selector=>{const el=page.locator(selector);if(!await el.evaluate(e=>e.open))await el.locator(':scope > summary').click();};
const calculate=async()=>{await page.locator('#simulate-button').click();await page.locator('.result-card').waitFor();assert.equal(await page.locator('.stale-banner').count(),0);};
const initial=async(income,value)=>{
 await page.goto(process.env.SIMULA_URL||'http://127.0.0.1:4173');
 await page.locator('#income').fill(income);
 await page.locator('#birthDate').fill('01021988');
 await page.locator('#propertyValue').fill(value);
 await open('#advanced-options');await open('#adjustments-details');
 await page.locator('#simulationDate').fill('2026-09-22');
};
try{
 // Classe Média: a UI usa a mesma linha de seguro do controle independente.
 await initial('13000','600000');
 await page.locator('#cotista').selectOption('no');
 await page.locator('#family').selectOption('dependents');
 await page.locator('#uf').selectOption('CE');
 await page.locator('#municipalityId').selectOption('2304400');
 await page.locator('input[name=system][value=PRICE]').check();
 await calculate();
 for(const value of ['ClasseMédia','R$434.062,64','R$165.937,36','11,38%','5,4799%'])assert.ok((await summary()).includes(value),value);
 await page.locator('summary').filter({hasText:'Recursos para a compra e custos'}).click();
 assert.match(await page.locator('#result-panel').innerText(),/avaliação é uma hipótese de comparação/);
 await page.locator('#go-compare').click();await page.locator('#save-case').click();
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('simula-habitacao.tests.v1')));
 assert.equal(saved[0].result.principal,434062.64);
 assert.equal(saved[0].result.insuranceModel,'mcmv');
 assert.equal(saved[0].result.ruleVersion,'2026-09-23.piloto.2');

 // Subsídio, CET e a vinculação sem isenção automática.
 await initial('3578','264000');
 await page.locator('#family').selectOption('dependents');
 await page.locator('input[name=system][value=SAC]').check();
 const requirements=page.locator('details').filter({has:page.locator('summary').filter({hasText:'Enquadramento e requisitos'})}).last();
 await requirements.locator(':scope > summary').click();
 await page.locator('#linkedProject').check();
 await calculate();
 for(const value of ['R$142.477,50','R$119.348,50','R$2.174,00','6,70%'])assert.ok((await summary()).includes(value),value);
 await page.locator('#assessmentOverride').fill('0');await calculate();
 assert.ok((await summary()).includes('6,54%'),'Isenção explícita afeta CET');
 await page.locator('#assessmentOverride').fill('');
 await page.locator('#propertyType').selectOption('used');await calculate();
 for(const value of ['R$121.522,50','R$0,00','6,87%'])assert.ok((await summary()).includes(value),value);

 // SBPE Especial: resumo, planilha e CESH são confrontados separadamente.
 await initial('21000','780000');
 await page.locator('#sbpeVariant').selectOption('linked');
 await open('#financing-options');
 await page.locator('#insurance').selectOption('plus');await calculate();
 for(const value of ['R$530.386,96','R$6.300,00','5,9910%'])assert.ok((await summary()).includes(value),value);
 await open('#schedule-details');
 const first=compact(await page.locator('#schedule-body tr').first().innerText());
 for(const value of ['49,92','6.299,85'])assert.ok(first.includes(value),value);
 await page.locator('summary').filter({hasText:'Premissas e pontos para conferir'}).click();
 assert.ok(!(await page.locator('#result-panel').innerText()).includes('adicionais não entram'));
 await page.locator('#go-compare').click();await page.locator('#save-case').click();
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('simula-habitacao.tests.v1')));
 assert.equal(saved[0].result.schedule.firstRow.extraPremium,49.92);
 assert.ok(saved[0].result.cesh>5.99);
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`);
 }
 assert.deepEqual(errors,[]);
 console.log('Matriz UI: Classe Média, subsídio, CET, tarifa/isenção, Especial, CESH, cronograma, histórico e larguras 320/390/768 aprovados.');
}finally{await browser.close();}
