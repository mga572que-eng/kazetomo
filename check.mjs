import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
let errors=0;
const fail=m=>{console.error(m);errors++;};
for(const f of fs.readdirSync(root).filter(f=>/\.(js|mjs)$/.test(f))) {
  try{execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'pipe'});}catch(e){fail(f+': '+e.stderr);}
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
 const u=m[1]; if(/^(https?:|data:|#|\/\/)/.test(u))continue;
 const file=u.split(/[?#]/)[0]; if(file&&!fs.existsSync(path.join(root,file)))fail('Missing HTML asset: '+file);
}
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const core=sw.match(/const CORE = (\[[^;]+\]);/);
if(!core)fail('CORE list not found'); else for(const m of core[1].matchAll(/'([^']+)'/g))if(!fs.existsSync(path.join(root,m[1])))fail('Missing SW asset: '+m[1]);
const build=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).build;
const pwa=fs.readFileSync(path.join(root,'pwa.js'),'utf8').match(/const BUILD = '([^']+)'/)?.[1];
const cache=sw.match(/const CACHE = 'kazetomo-([^']+)'/)?.[1];
if(build!==pwa||build!==cache)fail('PWA build mismatch');
{ /* 古い index.html／sw.js で 上書きして モジュールが 消えるのを ふせぐ：ルートの .js（sw.js 以外）は 読みこみと キャッシュの 両方に ある */
  const srcs=new Set([...html.matchAll(/<script[^>]*src="([^"?]+)/g)].map(m=>m[1].replace(/^\.\//,''))), coreL=core?[...core[1].matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]):[];
  for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.js')&&f!=='sw.js')){ if(!srcs.has(f))fail('Module not loaded by index.html: '+f); if(!coreL.includes(f))fail('Module missing from SW CORE: '+f); } }
if(/fonts\.googleapis\.com[^"']*display=swap/.test(html))fail('Web font must use display=optional (display=swap moves text and buttons while fonts load)');
for(const m of html.matchAll(/<script[^>]*src="([^"]+)"/g))if(m[1].includes('?v=')&&!m[1].endsWith('?v='+build))fail('Script build mismatch: '+m[1]);
console.log(errors?'Check failed':'PASS: syntax, assets, PWA build '+build);
process.exitCode=errors?1:0;
