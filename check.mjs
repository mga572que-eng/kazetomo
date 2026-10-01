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
for(const m of html.matchAll(/<script[^>]*src="([^"]+)"/g))if(m[1].includes('?v=')&&!m[1].endsWith('?v='+build))fail('Script build mismatch: '+m[1]);
console.log(errors?'Check failed':'PASS: syntax, assets, PWA build '+build);
process.exitCode=errors?1:0;
