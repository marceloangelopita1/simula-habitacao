import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {RULE_VERSION} from '../engine.js';
const site=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.join(site,'dist');
const files=['index.html','styles.css','app.js','engine.js','favicon.svg','data/municipal-rules.json','vendor/decimal.mjs','vendor/decimal-LICENSE.md'];
await fs.rm(destination,{recursive:true,force:true});
const hashes={};
for(const file of files){
  const bytes=await fs.readFile(path.join(site,file));
  const target=path.join(destination,file);
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,bytes);
  hashes[file]=createHash('sha256').update(bytes).digest('hex');
}
await fs.writeFile(path.join(destination,'.nojekyll'),'');
await fs.writeFile(path.join(destination,'release.json'),JSON.stringify({ruleVersion:RULE_VERSION,commit:process.env.GITHUB_SHA||null,files:hashes},null,2)+'\n');
console.log(`Site pronto: ${files.length} arquivos de execução em dist/.`);
