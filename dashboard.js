/* Static customer intelligence model. CSV values are always rendered with textContent. */
const HEADERS = ['追蹤對象','追蹤分類','區域／類型','等級','門店','近12月M','近12月kg','元/kg','近30天','歷史最大月營收'];
const SAMPLE = [];
let records = [], language = 0;
const $ = id => document.getElementById(id);
const num = v => {
 const raw=String(v ?? '').replace(/[,，$￥\s]/g,'');
 const suffix=raw.slice(-1).toUpperCase();
 const multiplier=suffix==='K'?1000:suffix==='M'?1000000:1;
 const n=Number(suffix==='K'||suffix==='M'?raw.slice(0,-1):raw);
 return Number.isFinite(n) ? n*multiplier : 0;
};
function model(row) {
 const r = {}; HEADERS.forEach((h,i) => r[h] = String(row[i] ?? '').trim());
 r.revenue=num(r['近12月M']); r.kg=num(r['近12月kg']); r.price=num(r['元/kg']); r.recent=num(r['近30天']); r.maxRevenue=num(r['歷史最大月營收']); r.stores=num(r['門店']);
 return r;
}
function normalize(key) { const vals=records.map(r=>r[key]); const min=Math.min(...vals), max=Math.max(...vals); return r=>max===min?50:(r[key]-min)/(max-min)*100; }
function score(r) { const weights=[['revenue',25],['kg',20],['maxRevenue',20],['recent',15],['tierScore',10],['stores',10]]; return weights.reduce((s,[k,w])=>s+(k==='tierScore'?r.tierScore:r._n[k](r))*w/100,0); }
function calculate() {
 const norms={revenue:normalize('revenue'),kg:normalize('kg'),maxRevenue:normalize('maxRevenue'),recent:normalize('recent'),stores:normalize('stores')};
 records.forEach(r=>{r.tierScore={A:100,B:65,C:30,'KA-Elite':100,'KA-Core':90,'KA-Growth':80,'KA-Pilot':70,'Regular-A':65,'Regular-B':50,'Regular-C':35,'Regular-D':20,'未分級':20}[r['等級']]??(num(r['等級'])||50);r._n=norms;r.score=Math.round(score(r));r.band=r.score>=70?'Priority 1':r.score>=40?'Priority 2':'Priority 3';const cat=r['追蹤分類'];r.opportunity=['未覆蓋缺口','菜蟲獨有新通路','供應中斷'].includes(cat);r.asahiOpportunity=r.score>=70&&['未覆蓋缺口','菜蟲獨有新通路'].includes(cat);r.strategic=r.score>=85;r.mapping=cat||'待分類';r.pilot=r.score>=70?'優先候選':r.score>=40?'評估中':'長尾追蹤';});
}
function text(parent, value, tag='span', cls='') { const el=document.createElement(tag); if(cls)el.className=cls; el.textContent=value; parent.appendChild(el); return el; }
function populateFilters() { [['region-filter','區域／類型'],['tier-filter','等級'],['category-filter','追蹤分類']].forEach(([id,key])=>{const select=$(id), current=select.value; select.replaceChildren(); text(select,'所有選項','option'); [...new Set(records.map(r=>r[key]).filter(Boolean))].sort().forEach(v=>text(select,v,'option')); select.value=current;}); }
function renderTable() {
 const q=($('channel-search').value||'').toLowerCase(), pf=$('priority-filter').value, sort=$('sort-select').value;
 const region=$('region-filter').value, tier=$('tier-filter').value, category=$('category-filter').value;
 let rows=records.filter(r=>Object.values(r).join(' ').toLowerCase().includes(q)).filter(r=>!region||r['區域／類型']===region).filter(r=>!tier||r['等級']===tier).filter(r=>!category||r['追蹤分類']===category).filter(r=>!pf||(pf==='strategic'?r.strategic:pf==='opportunity'?r.asahiOpportunity:pf==='high'?r.score>=70:pf==='medium'?r.score>=40&&r.score<70:r.score<40));
 rows.sort((a,b)=>sort==='name'?a['追蹤對象'].localeCompare(b['追蹤對象'],'zh'):sort==='revenue'?b.revenue-a.revenue:sort==='kg'?b.kg-a.kg:sort==='stores'?b.stores-a.stores:sort==='recent'?b.recent-a.recent:b.score-a.score);
 const body=$('customer-table'); body.replaceChildren();
 rows.forEach(r=>{
  const tr=document.createElement('tr');
  const cell=(value, tag='span', cls='')=>{const td=document.createElement('td');text(td,value,tag,cls);tr.appendChild(td);};
  cell(r['追蹤對象'],'strong');
  cell(r['追蹤分類']);
  cell(r['區域／類型']);
  cell(r['等級']);
  cell(r['門店']);
  cell(r['近12月M']);
  cell(r['近12月kg']);
  cell(r['元/kg']);
  cell(r['近30天']);
  cell(r['歷史最大月營收']);
  cell(`${r.strategic?'🔥 ':r.asahiOpportunity?'⭐ ':''}${r.score} · ${r.band}`,'span',`score ${r.score>=70?'high':r.score>=40?'medium':'low'}`);
  cell(r.mapping,'span',`mapping-tag ${r.opportunity?'opportunity':'neutral'}`);
  cell(r.pilot,'span',`status ${r.pilot==='候選'||r.pilot==='優先候選'?'pending':'delivered'}`);
  const action=document.createElement('td');
  const btn=document.createElement('button');
  btn.className='link-button';
  btn.textContent='詳情';
  btn.addEventListener('click',()=>openDrawer(r));
  action.appendChild(btn);
  tr.appendChild(action);
  body.appendChild(tr);
 });
}
function renderTargets() {}
function bars(id,key) {
 const box=$(id);box.replaceChildren();const map={};
 records.forEach(r=>{const k=r[key]||'未填寫';if(!map[k])map[k]={count:0,revenue:0,kg:0,score:0};map[k].count++;map[k].revenue+=r.revenue;map[k].kg+=r.kg;map[k].score+=r.score;});
 const max=Math.max(...Object.values(map).map(v=>v.count),1);
 Object.entries(map).sort((a,b)=>b[1].count-a[1].count).forEach(([label,v])=>{
  const row=document.createElement('div');row.className='bar-row';
  text(row,`${label} · ${v.count}戶`,'span','bar-label');
  const visual=document.createElement('div');visual.className='bar-visual';
  const bar=document.createElement('i');bar.style.setProperty('--value',`${v.count/max*100}%`);visual.appendChild(bar);
  text(visual,`營收 ${v.revenue.toLocaleString()} · kg ${v.kg.toLocaleString()} · 平均分 ${Math.round(v.score/v.count)}`,'b','bar-value');
  row.appendChild(visual);box.appendChild(row);
 });
}
function renderMatrix(){const box=$('value-matrix');box.querySelectorAll('.dot').forEach(e=>e.remove());records.forEach(r=>{const d=document.createElement('button');d.className=`dot ${r.band.toLowerCase()}`;d.title=`${r['追蹤對象']} · ${r.score}`;d.style.left=`${Math.min(94,8+r._n.revenue(r)*84)}%`;d.style.bottom=`${Math.min(88,8+r._n.recent(r)*76)}%`;d.addEventListener('click',()=>openDrawer(r));box.appendChild(d);});}
function insight(r){const signal=r.recent>=7?'近期互動活躍，適合立即安排試飲與採購會議。':r.recent<=2?'近期互動偏低，先以需求訪談與樣品喚回。':'有穩定活動，可用小批量 Pilot 驗證。';return `${r['追蹤對象']} 位於${r['區域／類型']}，近12月營收 ${r['近12月M']||'未填'}、${r['近12月kg']||'未填'} kg。${signal} 建議由區域業務確認門店與商務條件，並追蹤 Mapping → Pilot → Listing。`;}
function openDrawer(r){const c=$('drawer-content');c.replaceChildren();text(c,r['追蹤對象'],'h2');text(c,`${r['追蹤分類']} · ${r['區域／類型']}`,'p','subtext');text(c,`Pilot Priority Score ${r.score}/100 (${r.band})`,'div','drawer-score');text(c,'Commercial Insight','h3');text(c,insight(r),'p');const dl=document.createElement('dl');[['近12月M',r['近12月M']],['近12月kg',r['近12月kg']],['元/kg',r['元/kg']],['近30天',r['近30天']],['歷史最大月營收',r['歷史最大月營收']],['門店',r['門店']]].forEach(([k,v])=>{text(dl,k,'dt');text(dl,v||'—','dd');});c.appendChild(dl);$('detail-drawer').classList.add('open');$('detail-drawer').setAttribute('aria-hidden','false');$('drawer-backdrop').classList.add('open');}
function closeDrawer(){$('detail-drawer').classList.remove('open');$('detail-drawer').setAttribute('aria-hidden','true');$('drawer-backdrop').classList.remove('open');}
function render(){calculate();populateFilters();$('metric-customers').textContent=records.length;$('metric-priority').textContent=records.filter(r=>r.score>=70).length;$('metric-pilot').textContent=records.filter(r=>r.pilot==='候選'||r.pilot==='優先候選').length;$('metric-revenue').textContent=records.reduce((s,r)=>s+r.revenue,0).toLocaleString();$('metric-kg').textContent=records.reduce((s,r)=>s+r.kg,0).toLocaleString();$('metric-active').textContent=records.filter(r=>r.recent>0).length;$('metric-potential').textContent=records.reduce((s,r)=>s+r.maxRevenue,0).toLocaleString();$('metric-opportunities').textContent=records.filter(r=>r.asahiOpportunity).length;renderTable();renderTargets();bars('region-chart','區域／類型');bars('category-chart','追蹤分類');renderMatrix();}
function parseCSV(input){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<input.length;i++){const ch=input[i],next=input[i+1];if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;}else if(ch==='"')quoted=!quoted;else if(ch===','&&!quoted){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}else cell+=ch;}if(cell||row.length){row.push(cell);rows.push(row);}return rows;}
function importCSV(file){const reader=new FileReader();reader.onload=()=>{try{const rows=parseCSV(String(reader.result).replace(/^\uFEFF/,'')),header=rows.shift()?.map(v=>v.trim());if(!header||HEADERS.some(h=>!header.includes(h)))throw Error('欄位標題不完整');const ix=HEADERS.map(h=>header.indexOf(h));records=rows.map(row=>model(ix.map(i=>row[i]??''))).filter(r=>r['追蹤對象']);$('import-status').textContent=`已匯入 ${records.length} 筆客戶資料`;render();}catch(e){$('import-status').textContent=`匯入失敗：${e.message}`;}};reader.readAsText(file);}
const SOURCE_URL='https://docs.google.com/spreadsheets/d/1csq9-Q31rc0YI2BCO4TXZuJg-mkJrd9kr3t2DXmxP70/export?format=csv&gid=0';
async function loadSource(){try{const response=await fetch(SOURCE_URL);if(!response.ok)throw Error(`來源回應 ${response.status}`);const rows=parseCSV((await response.text()).replace(/^\uFEFF/,'')),header=rows.shift()?.map(v=>v.trim());if(!header||HEADERS.some(h=>!header.includes(h)))throw Error('來源欄位標題不完整');const ix=HEADERS.map(h=>header.indexOf(h));records=rows.map(row=>model(ix.map(i=>row[i]??''))).filter(r=>r['追蹤對象']);$('import-status').textContent=`已載入客戶總表：${records.length} 筆`;render();}catch(e){records=SAMPLE.map(model);$('import-status').textContent=`客戶總表載入失敗：${e.message}。目前顯示空資料，請匯入 CSV。`;render();}}
const translations={title:['Asahi 客戶情報 Dashboard','Asahi Customer Intelligence Dashboard'],status:['Pilot execution','Pilot execution'],print:['列印簡報','Print brief'],eyebrow:['Executive overview','Executive overview'],heroTitle:['客戶開發優先級與價值分析','Customer development priority and value analysis'],heroCopy:['以客戶總表數據判斷開發順序、商業價值與後續追蹤重點。','Use customer master data to determine development order, commercial value, and follow-up focus.'],pilotTarget:['Pilot 目標客戶','Pilot target accounts'],kpiCustomers:['客戶總數','Customers'],kpiOpportunity:['Opportunity','Opportunity'],kpiPilot:['Pilot','Pilot'],kpiPriority:['高優先級','High priority'],importTitle:['客戶總表資料','Customer master data'],importHint:['目前資料來自共享客戶總表；也可匯入相同欄位的 CSV。','Loaded from the shared customer master; matching CSV files are also supported.'],importButton:['匯入 CSV','Import CSV'],reset:['重新載入客戶總表','Reload customer master'],targetsTitle:['Pilot target analysis','Pilot target analysis'],matrixTitle:['價值矩陣（營收 × 近30天）','Value matrix (revenue × recent activity)'],regionTitle:['區域機會分布','Regional opportunities'],categoryTitle:['追蹤分類分析','Tracking category analysis'],tableTitle:['客戶資料與 Pilot 管理','Customer and Pilot management'],search:['搜尋客戶、門店或區域','Search customer, store or region'],categories:['通路 Mapping 五分類','Five mapping categories'],roadmap:['三階段落地','Three phases'],guardrail:['合作防線','Guardrails'],briefTitle:['把冷鏈配送變成 Asahi 的增量通路引擎','Turn cold-chain delivery into Asahi incremental growth'],briefCopy:['先完成客戶 Mapping，再以 5–10 家 Pilot 驗證產品、配送與商務條件，最後建立可複製的正式分銷模式。','Map accounts, validate products and delivery with 5–10 pilots, then scale a repeatable distribution model.']};
function translate(){document.querySelectorAll('[data-i18n]').forEach(e=>{const v=translations[e.dataset.i18n];if(v)e.textContent=v[language];});document.querySelectorAll('[data-i18n-placeholder]').forEach(e=>{const v=translations[e.dataset.i18nPlaceholder];if(v)e.placeholder=v[language];});$('language-toggle').textContent=language?'中':'EN';}
document.addEventListener('DOMContentLoaded',()=>{$('channel-search').addEventListener('input',renderTable);['priority-filter','region-filter','tier-filter','category-filter','sort-select'].forEach(id=>$(id).addEventListener('change',renderTable));$('csv-file').addEventListener('change',e=>e.target.files[0]&&importCSV(e.target.files[0]));$('reset-data').addEventListener('click',loadSource);$('print-button').addEventListener('click',()=>window.print());$('language-toggle').addEventListener('click',()=>{language=language?0:1;translate();});$('drawer-close').addEventListener('click',closeDrawer);$('drawer-backdrop').addEventListener('click',closeDrawer);loadSource();});
