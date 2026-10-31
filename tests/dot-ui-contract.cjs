// Source/asset contracts only: not rendered contrast, native hit-testing or screen-reader certification.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'../dist');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const htmls=walk(root).filter(f=>f.endsWith('.html'));
assert.equal(htmls.length,30,'all thirty existing pages covered');
for(const file of htmls){const html=fs.readFileSync(file,'utf8');for(const asset of ['dot-ui.css','dot-ui.js']){const matches=[...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(m=>m[1]).filter(v=>v.split('?')[0].endsWith(asset));assert.equal(matches.length,1,`${path.relative(root,file)} includes ${asset} once`);const target=matches[0].split('?')[0];assert(!/^(?:[a-z]+:|\/)/i.test(target),'asset paths must be project-relative');assert.equal(path.resolve(path.dirname(file),target),path.join(root,asset),'nested-page path resolves to shared asset');}}
const css=fs.readFileSync(path.join(root,'dot-ui.css'),'utf8'),js=fs.readFileSync(path.join(root,'dot-ui.js'),'utf8');
assert(/html::-webkit-scrollbar\{width:20px/.test(css));
assert(/html::-webkit-scrollbar-track:vertical\{margin-top:16px;margin-bottom:16px\}/.test(css));
assert(/min-height:48px/.test(css));
assert(/scrollbar-width:auto/.test(css));
assert(/forced-colors:active/.test(css));
assert(!/100vh\s*-\s*160px/.test(fs.readFileSync(path.join(root,'index.html'),'utf8')),'old short rail removed');
assert(js.includes("closest('a,button,.open-slot')"),'icon conversion scoped to controls');
assert(js.includes("closest('svg,script,style,textarea,[contenteditable]')"),'do not modify artwork, script, styles, editing fields');
assert(js.includes("!n.closest('svg')"),'observer does not reprocess inserted svg icon subtrees');
assert(js.includes("svg.setAttribute('aria-hidden','true')"));
assert(js.includes("svg.setAttribute('focusable','false')"));
assert(js.includes("!control.hasAttribute('aria-label')"),'preserve explicit accessible names');
assert(!/\b(?:fetch|XMLHttpRequest|eval)\s*\(/.test(js),'decorator does not transmit or evaluate text');
assert(!/addEventListener\(['"](?:wheel|touchmove|pointermove|keydown)/.test(js),'native scroll inputs are not intercepted');
console.log(`PASS shared dot controls: ${htmls.length} HTML relative assets; native full rail; bounded control scope; SVG/editable exclusions; accessibility and no-network source contracts. Not browser verification.`);
