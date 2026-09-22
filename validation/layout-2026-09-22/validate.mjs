// Independent browser acceptance checks. Set PLAYWRIGHT_MODULE to an installed
// Playwright entry point; no runtime dependency is added to the application.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = fileURLToPath(new URL('./', import.meta.url));
const baselineRef = process.env.SIMULA_BASELINE || '078a0f8df5e94ff3f55041e581b3fc4c0a4ffb43';
const url = process.env.SIMULA_URL || 'http://127.0.0.1:4173';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'pt-BR', reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [], passed = [];
page.on('pageerror', e => errors.push(e.message));
const check = (name, value) => { assert.ok(value, name); passed.push(name); };
const screenshot = name => page.screenshot({ path: `${output}${name}.png` });
const start = async () => { await page.goto(url); await page.locator('#view-simular:not([hidden])').waitFor(); };
const fill = async () => { await page.locator('#income').fill('6000'); await page.locator('#birthDate').fill('01021988'); await page.locator('#propertyValue').fill('350000'); };
const calculate = async () => { await page.locator('#simulate-button').click(); await page.locator('.result-card').waitFor(); };
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
const actionVisible = () => page.locator('#simulate-button').evaluate(e => { const r=e.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight && document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('#simulate-button')===e; });
try {
  // A baseline rendered from the original Git revision, using the same browser.
  const baseline = await context.newPage();
  await baseline.route('**/*', async route => {
    const name = new URL(route.request().url()).pathname.slice(1) || 'index.html';
    if (['index.html', 'styles.css', 'app.js'].includes(name)) {
      const body = execFileSync('git', ['show', `${baselineRef}:${name}`], { encoding: 'utf8' });
      await route.fulfill({ body, contentType: name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':'text/html' });
    } else await route.continue();
  });
  await baseline.goto(url);
  await baseline.locator('.result-card').waitFor();
  await baseline.screenshot({ path: `${output}before-desktop.png` });
  await baseline.close();

  for (const [width,height] of [[1920,1080],[1440,900],[1366,768],[1280,720],[1280,640],[1024,768],[768,1024],[390,844],[320,740]]) {
    await page.setViewportSize({width,height}); await start();
    check(`${width}×${height}: no horizontal overflow`, !await overflow());
    check(`${width}×${height}: Simular visible on entry`, await actionVisible());
    check(`${width}×${height}: no unsolicited results`, !await page.locator('.results-column').isVisible());
    check(`${width}×${height}: birth date starts empty with a format hint`, await page.locator('#birthDate').inputValue()==='' && await page.locator('#birthDate').getAttribute('placeholder')==='dd/mm/aaaa');
    if (width>=1024) {
      const hiddenFields = await page.locator('.essential-fields input, .essential-fields select').evaluateAll(es => {
        const bottom=document.querySelector('.form-actions').getBoundingClientRect().top;
        return es.filter(e=>e.checkVisibility() && getComputedStyle(e).opacity!=='0').filter(e=>e.getBoundingClientRect().bottom>bottom).map(e=>e.id);
      });
      check(`${width}×${height}: all essential fields above action bar (${hiddenFields})`, hiddenFields.length===0);
    }
    await screenshot(`initial-${width}x${height}`);
    await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
    check(`${width}×${height}: Simular visible after scroll`, await actionVisible());
  }
  await page.setViewportSize({width:1440,height:900}); await start();
  check('No experiment-name field in the page', await page.locator('#caseLabel').count()===0);
  check('Optional settings collapsed initially', !await page.locator('#insurance').isVisible());
  await page.locator('#simulate-button').click();
  check('Empty submission explains errors', await page.locator('#form-errors').isVisible());
  check('Error summary receives keyboard focus', await page.locator('#form-errors').evaluate(e=>e===document.activeElement));
  await page.locator('#form-errors a[href="#income"]').click();
  check('Error link focuses the input', await page.locator('#income').evaluate(e=>e===document.activeElement));
  await fill();
  check('Numeric date becomes Brazilian date on blur', await page.locator('#birthDate').inputValue()==='01/02/1988');
  await calculate();
  check('A valid simulation produces results', await page.locator('.result-card').isVisible());
  check('Results receive keyboard focus', await page.locator('#result-panel').evaluate(e=>e===document.activeElement));
  check('Results are below the complete form', await page.evaluate(()=>document.querySelector('.results-column').getBoundingClientRect().top>=document.querySelector('#simulation-form').getBoundingClientRect().bottom));
  check('Comparison is optional and collapsed', await page.locator('#comparison-section').evaluate(e=>!e.open));
  check('Simular remains visible at result', await actionVisible());
  await screenshot('result-desktop');
  await page.screenshot({path:`${output}full-desktop.png`,fullPage:true});
  await page.locator('#go-compare').click();
  check('Compare action opens the comparison', await page.locator('#comparison-section').evaluate(e=>e.open));
  await page.locator('#save-case').click();
  await page.locator('[data-view="historico"]').click();
  check('Save works without a test name', await page.locator('.history-card').count()===1);
  check('Simulation action is absent on history', !await page.locator('#simulate-button').isVisible());
  await page.locator('[data-open-case]').click();
  check('Saved simulation restores Brazilian date', await page.locator('#birthDate').inputValue()==='01/02/1988');
  await page.locator('#income').fill('6500');
  check('Edited inputs invalidate old results', await page.locator('.stale-banner').isVisible());
  check('Outdated comparison is hidden', !await page.locator('#comparison-section').isVisible());
  await calculate();
  check('Recalculation removes stale result', await page.locator('.stale-banner').count()===0);

  for (const preset of ['mcmv-sac','mcmv-price','sbpe-price']) {
    await page.locator('.examples-menu > summary').click();
    await page.locator(`[data-preset="${preset}"]`).click();
    check(`${preset}: comparison values still match the reference`, await page.locator('#comparison-status').textContent()==='Sem diferenças nos 9 campos informados.');
    check(`${preset}: no hidden override goes unannounced`, /ajuste/.test(await page.locator('#options-hint').textContent()));
  }
  await page.locator('#new-simulation').click(); await fill();
  await page.locator('#amountMode').selectOption('fixed');
  check('Fixed amount reveals its input', await page.locator('#principal').isVisible());
  await page.locator('#principal').fill('193949,89'); await calculate();
  await page.locator('#amountMode').selectOption('entry');
  check('Entry mode replaces the fixed-amount input', await page.locator('#ownFunds').isVisible() && !await page.locator('#principal').isVisible());
  await page.locator('#ownFunds').fill('160000'); await calculate();
  await page.locator('#family').selectOption('two');
  check('Second buyer appears when necessary', await page.locator('#secondBirthDate').isVisible());
  await page.locator('#simulate-button').click();
  check('Missing second birth date is reported', await page.locator('#secondBirthDate').getAttribute('aria-invalid')==='true');
  await page.locator('#secondBirthDate').fill('01021990'); await calculate();
  await page.locator('#family').selectOption('single');
  await page.locator('#advanced-options > summary').click();
  await page.locator('#adjustments-details > summary').click();
  await page.locator('#nominalOverride').fill('99');
  await page.locator('#advanced-options > summary').click();
  await page.locator('#simulate-button').click();
  check('Nested settings open automatically when invalid', await page.locator('#nominalOverride').isVisible());
  await screenshot('nested-error-desktop');
  await page.locator('#nominalOverride').fill('');
  await page.locator('#financing-options > summary').click();
  await page.locator('#insurance').selectOption('custom');
  check('Custom insurance reveals coefficients', await page.locator('#customMipPercent').isVisible());
  await page.locator('#customMipPercent').fill('0,02');
  await page.locator('#dfiOverride').fill('0,01'); await calculate();
  await page.locator('#schedule-details > summary').click();
  await page.locator('#next-page').click();
  check('Installment pagination works', await page.locator('#page-label').textContent()==='13–24');
  const downloadEvent=page.waitForEvent('download'); await page.locator('#download-schedule').click();
  check('Installments export as CSV', (await downloadEvent).suggestedFilename()==='cronograma-simula.csv');
  await page.locator('[data-view="regras"]').click();
  check('Rules page remains accessible', await page.locator('#view-regras').isVisible());
  check('Rules page has no horizontal overflow', !await overflow());
  await page.locator('[data-view="simular"]').click();
  await page.locator('#new-simulation').click();
  check('Clear returns focus to income', await page.locator('#income').evaluate(e=>e===document.activeElement));
  check('Clear removes optional overrides', await page.locator('#nominalOverride').inputValue()==='' && await page.locator('#insurance').inputValue()==='basic');
  await page.locator('#income').press('Tab');
  check('Keyboard order follows the form', await page.locator('#birthDate').evaluate(e=>e===document.activeElement));
  await page.locator('#birthDate').fill('31/02/1988'); await page.locator('#income').fill('6000'); await page.locator('#propertyValue').fill('350000');
  await page.locator('#simulate-button').click();
  check('Impossible date is rejected', await page.locator('#birthDate').getAttribute('aria-invalid')==='true');

  for(const [width,height] of [[390,844],[320,740],[768,1024]]) {
    await page.setViewportSize({width,height}); await start(); await fill(); await calculate();
    check(`${width}: mobile simulation works without overflow`, !await overflow());
    check(`${width}: result action remains visible`, await actionVisible());
    await screenshot(`result-${width}`);
    await page.locator('#go-compare').click();
    check(`${width}: comparison is usable without page overflow`, !await overflow());
    await screenshot(`comparison-${width}`);
    await page.locator('#new-simulation').click();
    check(`${width}: clear is usable from result`, await page.locator('#income').inputValue()==='' && await actionVisible());
    let occluded=[];
    for(let step=0;step<16;step++) {
      await page.keyboard.press('Tab');
      const focus=await page.evaluate(()=>{
        const e=document.activeElement, r=e.getBoundingClientRect();
        const inBar=!!e.closest('.form-actions');
        return {id:e.id||e.name||e.tagName,hidden:!inBar&&(r.top<0||r.bottom>document.querySelector('.form-actions').getBoundingClientRect().top)};
      });
      if(focus.hidden)occluded.push(focus.id);
      if(focus.id==='simulate-button')break;
    }
    check(`${width}: keyboard focus stays above the action bar (${occluded})`, occluded.length===0);
  }
  check('No uncaught JavaScript errors', errors.length===0);
  await writeFile(`${output}checks.json`,JSON.stringify({passed:passed.length,checks:passed,errors},null,2)+'\n');
  console.log(JSON.stringify({passed:passed.length,errors,output}));
} catch (error) {
  await screenshot('failure');
  console.error(error);
  await writeFile(`${output}checks.json`,JSON.stringify({passed:passed.length,checks:passed,errors,failure:error.message},null,2)+'\n');
  process.exitCode=1;
} finally { await browser.close(); }
