/* Zero-Sugar Channel Opportunity Engine V1. Raw fields never get overwritten. */
const RAW_HEADERS = ['追蹤對象','追蹤分類','區域／類型','等級','門店','近12月M','近12月kg','元/kg','近30天','歷史最大月營收'];
const QUAL_HEADERS = ['目前酒類狀態','目前啤酒品牌','Asahi是否覆蓋','DecisionMaker','關係強度','Pilot意願','酒類販售資格','冷藏空間','HQ統一採購','排他合約','品牌示範價值','PipelineStage','NextAction','備註','In Attack List','Manual Cuisine Type','Manual Priority','Manual Region','Owner','Target Date','CEO Note','Attack Status','Blocker Reason','Store Count Override','Group / Brand Owner','Channel Type','Auto Health Segment','Manual Health Segment','Health Attack Priority','杯裝 / 瓶裝販售能力','可否做套餐','可否做零糖質主題活動','價格敏感度','上架難度','決策週期','Pilot Start Date','Pilot Stores','Initial Order','Weekly Sales','Monthly Sales','Repeat Order','Sell-through','Pilot Result','Rollout Readiness','CustomerId','Inactive'];
const CUISINE_TYPES = ['Healthy / Fitness Meal','Japanese','Japanese / Izakaya','Korean','Italian','American','Southeast Asian','Hotpot / Grill','Cafe / Brunch','Bento / Catering','Bar / Bistro','Dessert / Bakery','Chinese / Taiwanese','Retail / Takeout','Unknown'];
const ATTACK_STATUSES = ['Not Started','Contacted','Meeting Scheduled','Sampling Proposed','Pilot Proposed','Waiting Reply','Blocked','Won','Lost','Paused'];
const PRIORITIES = ['Must Attack','High Priority','Medium Priority','Watch','Not Now'];
const CHANNEL_TYPES = ['健康餐','健身 / 運動','日式餐飲','餐酒館','咖啡早午餐','便當 / 團膳','火鍋燒肉','一般餐飲','零售 / 外帶','未確認'];
const REGIONS = ['北區','中區','南區','東區','離島','全區 / 總部','未確認'];
const HEALTH_SEGMENTS = ['健康餐','健身餐','低醣 / 生酮','高蛋白','沙拉 / 輕食','健康便當','運動 / 健身場景','一般餐飲','非健康餐','未確認'];
const HEALTH_PRIORITIES = ['Core Target','Test Target','Not Health Fit','Unknown'];
const cuisineRules = [
  { type:'Healthy / Fitness Meal', keywords:['健康餐','健康便當','健身餐','健身','低醣','低糖','高蛋白','沙拉','輕食','體態管理','健康管理'], strength:'high' },
  { type:'Japanese', keywords:['日式','日本料理','壽司','生魚片','丼飯','拉麵','居酒屋','和食','日料'], strength:'high' },
  { type:'Korean', keywords:['韓式','韓食','韓烤','韓國料理','泡菜'], strength:'high' },
  { type:'Italian', keywords:['義式','義大利麵','義大利料理','pizza','披薩','燉飯'], strength:'high' },
  { type:'American', keywords:['美式','漢堡','bbq','炸雞','美國料理'], strength:'high' },
  { type:'Southeast Asian', keywords:['泰式','越式','越南','南洋','東南亞','馬來','新加坡'], strength:'high' },
  { type:'Hotpot / Grill', keywords:['火鍋','燒肉','串燒','烤肉','涮涮鍋'], strength:'high' },
  { type:'Cafe / Brunch', keywords:['咖啡','早午餐','brunch','cafe','咖啡廳','咖啡館'], strength:'medium' },
  { type:'Bento / Catering', keywords:['便當','團膳','自助餐','餐盒','外燴'], strength:'medium' },
  { type:'Bar / Bistro', keywords:['酒吧','餐酒館','bistro','bar','酒館'], strength:'high' },
  { type:'Dessert / Bakery', keywords:['甜點','烘焙','麵包','蛋糕','糕點'], strength:'high' },
  { type:'Chinese / Taiwanese', keywords:['中式','台菜','台灣菜','小吃','麵食','熱炒'], strength:'high' }
];
const SOURCE_URL = 'https://docs.google.com/spreadsheets/d/1csq9-Q31rc0YI2BCO4TXZuJg-mkJrd9kr3t2DXmxP70/export?format=csv&gid=0';
const STORAGE_KEY = 'asahi-zero-sugar-qualification-v1';
const SOURCE_CONFIG = {
  sourceName: '每日 Apps Script 資料源',
  sourceType: 'csv',
  sourceUrl: 'https://script.google.com/a/macros/tsaitung.com/s/AKfycbzLVPX120VJYf351B7ByZfSKyoGXkb42ubhila-Er4TjxnqVrrEAD4XSeQuNKD8tYQ9lw/exec',
  fallbackUrl: SOURCE_URL,
  fallbackName: 'Google Sheet 匯出',
  lastSyncedAt: null
};
const MANUAL_FIELDS = ['In Attack List','Manual Priority','Owner','Target Date','Attack Status','CEO Note','Manual Region','Manual Cuisine Type','Manual Health Segment','Health Attack Priority','NextAction','Blocker Reason'];
function normalizeCustomerName(name){
  return String(name || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
}
function normalizeSourceRow(row){
  const aliasMap = {
    '追蹤對象': ['追蹤對象','customerName','name','客戶名稱','店名'],
    '追蹤分類': ['追蹤分類','category','分類'],
    '區域／類型': ['區域／類型','區域/類型','region','區域'],
    '等級': ['等級','tier','level'],
    '門店': ['門店','stores','門市數'],
    '近12月M': ['近12月M','last12mRevenue','近12月營收'],
    '近12月kg': ['近12月kg','last12mKg'],
    '元/kg': ['元/kg','pricePerKg','元/公斤'],
    '近30天': ['近30天','last30d'],
    '歷史最大月營收': ['歷史最大月營收','maxMonthlyRevenue']
  };
  const out = {};
  RAW_HEADERS.forEach(header => {
    const aliases = aliasMap[header] || [header];
    let value = '';
    for (const key of aliases) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        value = row[key];
        break;
      }
    }
    out[header] = value === '' ? (header === '追蹤對象' ? '' : 'Unknown') : value;
  });
  out.customerId = row['customerId'] || row['CustomerId'] || row['客戶代碼'] || '';
  return out;
}
function mergeRecordsByCustomerIdOrName(sourceRows){
  const saved = loadQual();
  const result = { added: 0, updated: 0, unmatched: 0, records: [] };
  const seenNames = new Set();
  const byId = {};
  Object.keys(saved).forEach(name => {
    const id = saved[name] && saved[name]['CustomerId'];
    if (id) byId[id] = name;
  });
  sourceRows.forEach(normalized => {
    const rawName = normalized['追蹤對象'];
    if (!rawName) { result.unmatched++; return; }
    const normName = normalizeCustomerName(rawName);
    let matchKey = null;
    if (normalized.customerId && byId[normalized.customerId]) {
      matchKey = byId[normalized.customerId];
    } else if (saved[rawName]) {
      matchKey = rawName;
    } else {
      matchKey = Object.keys(saved).find(name => normalizeCustomerName(name) === normName) || null;
    }
    const existingQual = matchKey ? saved[matchKey] : null;
    const qual = { ...(existingQual || {}) };
    if (normalized.customerId) qual['CustomerId'] = normalized.customerId;
    qual['Inactive'] = '';
    const raw = RAW_HEADERS.map(header => normalized[header]);
    const record = model(raw, qual);
    saveQual(rawName, record.qualificationData);
    seenNames.add(rawName);
    if (matchKey && matchKey !== rawName) {
      const live = loadQual();
      delete live[matchKey];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(live));
    }
    result.records.push(record);
    if (existingQual) result.updated++; else result.added++;
  });
  const savedAfter = loadQual();
  Object.keys(savedAfter).forEach(name => {
    if (!seenNames.has(name) && !Array.from(seenNames).some(n => normalizeCustomerName(n) === normalizeCustomerName(name))) {
      const qual = savedAfter[name];
      if (qual && qual['Inactive'] !== 'Yes') {
        qual['Inactive'] = 'Yes';
        saveQual(name, qual);
      }
    }
  });
  return result;
}
async function fetchSourceRows(url){
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const json = JSON.parse(trimmed);
    const arr = Array.isArray(json) ? json : (json.records || json.data || []);
    return arr.map(row => normalizeSourceRow(row));
  }
  const rows = parseCSV(trimmed);
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).filter(r => r.some(v => v !== '')).map(r => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = r[i]; });
    return normalizeSourceRow(obj);
  });
}
async function syncDailyData(){
  const statusEl = $('sync-status');
  if (statusEl) { statusEl.hidden = false; statusEl.className = 'notice loading'; statusEl.textContent = '同步中，請稍候…'; }
  let sourceRows = null;
  let usedSource = SOURCE_CONFIG.sourceName;
  let errorMessage = '';
  try {
    sourceRows = await fetchSourceRows(SOURCE_CONFIG.sourceUrl);
  } catch (err) {
    errorMessage = String(err && err.message || err);
    try {
      sourceRows = await fetchSourceRows(SOURCE_CONFIG.fallbackUrl);
      usedSource = SOURCE_CONFIG.fallbackName;
    } catch (err2) {
      if (statusEl) {
        statusEl.className = 'notice error';
        statusEl.textContent = '同步失敗：' + errorMessage + '（備援來源也失敗：' + String(err2 && err2.message || err2) + '）。請改用手動匯入 CSV。';
      }
      return;
    }
  }
  if (!sourceRows || !sourceRows.length) {
    if (statusEl) { statusEl.className = 'notice error'; statusEl.textContent = '同步完成，但沒有讀取到任何資料列。請確認來源是否正確。'; }
    return;
  }
  const mergeResult = mergeRecordsByCustomerIdOrName(sourceRows);
  records = mergeResult.records;
  calculate();
  SOURCE_CONFIG.lastSyncedAt = new Date();
  render();
  if (statusEl) {
    statusEl.className = 'notice success';
    statusEl.textContent = `同步成功（來源：${usedSource}）。載入 ${sourceRows.length} 筆、新增 ${mergeResult.added} 筆、更新 ${mergeResult.updated} 筆、無法匹配 ${mergeResult.unmatched} 筆。`;
  }
  const meta = {
    'sync-source-name': usedSource,
    'sync-last-time': SOURCE_CONFIG.lastSyncedAt.toLocaleString('zh-TW'),
    'sync-count': String(sourceRows.length),
    'sync-added': String(mergeResult.added),
    'sync-updated': String(mergeResult.updated),
    'sync-unmatched': String(mergeResult.unmatched)
  };
  Object.keys(meta).forEach(id => { const el = $(id); if (el) el.textContent = meta[id]; });
}
const scoringConfig = {
  strategicPotential: { consumerFit: 0.30, commercialScale: 0.20, categoryCreation: 0.25, rightToWin: 0.15, showcaseValue: 0.10 },
  thresholds: { highPotential: 70, pilotNowPotential: 70, pilotNowReadiness: 70, healthFit: 70 },
  categoryFit: [
    { keywords: ['健康餐','健身餐','低醣','低糖','高蛋白','健身','運動','健康管理'], score: 100, label: '健康／健身／低醣' },
    { keywords: ['健康生活','體態','飲食控制'], score: 90, label: '健康生活型態' },
    { keywords: ['沙拉','輕食','健康便當'], score: 85, label: '沙拉／輕食／健康便當' },
    { keywords: ['團膳'], score: 10, label: '團膳／低酒類場景' },
    { keywords: ['傳統','一般餐飲'], score: 30, label: '傳統／一般餐飲' }
  ]
};
const $ = id => document.getElementById(id);
let records = [], currentRecord = null, funnelFilter = '', actionView = 'attack';
const text = (parent, value, tag='span', cls='') => { const el=document.createElement(tag); if(cls) el.className=cls; el.textContent=value ?? ''; parent.appendChild(el); return el; };
const num = value => { const raw=String(value ?? '').replace(/[,，$￥\s]/g,''); const suffix=raw.slice(-1).toUpperCase(); const multiplier=suffix==='K'?1000:suffix==='M'?1000000:1; const n=Number(suffix==='K'||suffix==='M'?raw.slice(0,-1):raw); return Number.isFinite(n)?n*multiplier:0; };
const unknown = value => !String(value ?? '').trim() || ['unknown','unk','未知','不明','—','-'].includes(String(value).trim().toLowerCase());
const escapeCsv = value => { const s=String(value ?? ''); return /[",\r\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
function parseCSV(input) { const rows=[]; let row=[], cell='', quoted=false; for(let i=0;i<input.length;i++){const ch=input[i],next=input[i+1]; if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;} else if(ch==='"') quoted=!quoted; else if(ch===','&&!quoted){row.push(cell);cell='';} else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';} else cell+=ch;} if(cell||row.length){row.push(cell);rows.push(row);} return rows; }
function loadQual() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); } catch(e) { return {}; } }
function saveQual(name, data) { const all=loadQual(); all[name]=data; localStorage.setItem(STORAGE_KEY,JSON.stringify(all)); }
function model(raw, qual={}) {
  const r={rawData:{},qualificationData:{...qual},calculatedMetrics:{}};
  RAW_HEADERS.forEach((h,i)=>{r.rawData[h]=String(raw[i]??'').trim();});
  QUAL_HEADERS.forEach((h,i)=>{if(raw[i]!==undefined && i>=RAW_HEADERS.length && !unknown(raw[i])) r.qualificationData[h]=String(raw[i]).trim();});
  r.name=r.rawData['追蹤對象']; r.category=r.rawData['追蹤分類']; r.region=r.rawData['區域／類型']; r.tier=r.rawData['等級']; r.stores=num(r.rawData['門店']); r.revenue=num(r.rawData['近12月M']); r.kg=num(r.rawData['近12月kg']); r.recent=num(r.rawData['近30天']); r.maxRevenue=num(r.rawData['歷史最大月營收']);
  return r;
}
function inferCuisineType(r) {
  const haystack = Object.values(r.rawData).concat(Object.values(r.qualificationData)).join(' ').toLowerCase();
  const matches = cuisineRules.flatMap(rule => rule.keywords.filter(keyword => haystack.includes(keyword.toLowerCase())).map(keyword => ({type:rule.type, keyword, strength:rule.strength})));
  if (!matches.length) return {type:'Unknown', confidence:'Unknown', signals:[], reason:'沒有命中明確 Cuisine Type 關鍵字'};
  const grouped = cuisineRules.map(rule => ({...rule, hits:matches.filter(match => match.type===rule.type)})).filter(rule => rule.hits.length);
  grouped.sort((a,b) => (b.hits.length - a.hits.length) || (b.strength==='high'?1:0) - (a.strength==='high'?1:0));
  const winner = grouped[0];
  const confidence = winner.strength==='high' || winner.hits.length>=2 ? 'High' : winner.strength==='medium' ? 'Medium' : 'Low';
  return {type:winner.type, confidence, signals:winner.hits.map(hit=>hit.keyword), reason:`命中${winner.hits.length}個${winner.strength==='low'?'低辨識度':'明確'}關鍵字`};
}
function inferHealth(r,cuisine) {
  const haystack=Object.values(r.rawData).concat(Object.values(r.qualificationData)).join(' ').toLowerCase();
  const rules=[
    ['低醣 / 生酮',['低醣','低糖','生酮']],
    ['高蛋白',['高蛋白','蛋白質']],
    ['健身餐',['健身餐','健身','運動餐','體態']],
    ['健康便當',['健康便當','健康餐盒']],
    ['沙拉 / 輕食',['沙拉','輕食']],
    ['健康餐',['健康餐','健康飲食','健康管理']],
    ['運動 / 健身場景',['健身房','運動中心','瑜伽','跑團']]
  ];
  for(const [segment,keywords] of rules){const hits=keywords.filter(k=>haystack.includes(k));if(hits.length)return {segment,fit:segment==='一般餐飲'?40:90,priority:'Core Target',reason:`命中健康通路關鍵字：${hits.join('、')}`,signals:hits};}
  if(['Cafe / Brunch','Bento / Catering'].includes(cuisine.type))return {segment:cuisine.type==='Cafe / Brunch'?'沙拉 / 輕食':'健康便當',fit:65,priority:'Test Target',reason:'Cuisine 類型具健康餐延伸可能，需確認實際菜單',signals:[cuisine.type]};
  return {segment:'未確認',fit:40,priority:'Unknown',reason:'尚未命中明確健康通路關鍵字',signals:[]};
}
function percentile(key) { const values=records.map(r=>Math.log1p(Math.max(0,r[key]))).sort((a,b)=>a-b); return r=>{if(!values.length)return 50; const value=Math.log1p(Math.max(0,r[key])); const rank=values.filter(v=>v<=value).length; return values.length===1?50:Math.round(rank/(values.length-1)*100);}; }
function categoryFit(r) { const hay=`${r.category} ${r.region}`; return scoringConfig.categoryFit.find(item=>item.keywords.some(k=>hay.includes(k))) || {score:50,label:'一般餐飲／待確認'}; }
function tierScore(tier) { return ({'KA-Elite':100,'KA-Core':90,'KA-Growth':80,'KA-Pilot':70,'Regular-A':65,'Regular-B':50,'Regular-C':35,'Regular-D':20,A:90,B:70,C:50,D:30})[tier] ?? 50; }
function valueOf(r,key,map) { return map[key] ? map[key](r) : 50; }
function knownAverage(values, fallback=50) { const known=values.filter(v=>v!==null && v!==undefined); return known.length ? known.reduce((a,b)=>a+b,0)/known.length : fallback; }
function alcoholScore(value) { if(unknown(value))return null; return {'已有 Asahi':100,'有啤酒但沒有 Asahi':85,'已有販售啤酒':80,'已有販售酒類':70,'完全沒有酒類':60}[value] ?? 50; }
function decisionScore(value) { if(unknown(value))return null; return {'已直接接觸老闆':100,'已直接接觸採購':95,'有窗口可以介紹':80,'一般業務窗口':55,'尚未建立關係':20}[value] ?? 50; }
function willingnessScore(value) { if(unknown(value))return null; return {'已確認願意 Pilot':100,'有興趣':80,'待洽談':55,'暫無意願':25,'拒絕':0}[value] ?? 50; }
function boolScore(value) { if(unknown(value))return null; return ['是','可','有','Yes','yes','true','True'].includes(String(value).trim()) ? 100 : 20; }
function calculate() {
  const rev=percentile('revenue'), kg=percentile('kg'), max=percentile('maxRevenue'), stores=percentile('stores'), recent=percentile('recent');
  records.forEach(r=>{
    const fit=categoryFit(r), q=r.qualificationData, cuisine=inferCuisineType(r), manualCuisine=unknown(q['Manual Cuisine Type'])?'':q['Manual Cuisine Type'], healthInfo=inferHealth(r,cuisine), manualHealth=unknown(q['Manual Health Segment'])?'':q['Manual Health Segment'], healthPriority=unknown(q['Health Attack Priority'])?'':q['Health Attack Priority'], healthSegment=manualHealth||healthInfo.segment, health=healthInfo.fit>=scoringConfig.thresholds.healthFit;
    const commercial=knownAverage([stores(r)*0.5,rev(r)*0.2,kg(r)*0.15,max(r)*0.15]);
    const right=knownAverage([rev(r),kg(r),recent(r),tierScore(r.tier)]);
    const categoryCreation=health ? knownAverage([fit.score, stores(r), q['品牌示範價值']&&!unknown(q['品牌示範價值'])?num(q['品牌示範價值']):null]) : fit.score;
    const showcase=unknown(q['品牌示範價值']) ? 50 : Math.max(0,Math.min(100,num(q['品牌示範價值'])));
    const potential=Math.round(fit.score*scoringConfig.strategicPotential.consumerFit+commercial*scoringConfig.strategicPotential.commercialScale+categoryCreation*scoringConfig.strategicPotential.categoryCreation+right*scoringConfig.strategicPotential.rightToWin+showcase*scoringConfig.strategicPotential.showcaseValue);
    const ops=[boolScore(q['酒類販售資格']),boolScore(q['冷藏空間']),boolScore(q['HQ統一採購']),boolScore(q['排他合約'])===null?null:100-boolScore(q['排他合約'])+20];
    const readiness=Math.round(knownAverage([alcoholScore(q['目前酒類狀態']),decisionScore(q['DecisionMaker']),willingnessScore(q['Pilot意願']),...ops]));
    const coverage=q['Asahi是否覆蓋'], alcohol=q['目前酒類狀態'], noAsahi=unknown(coverage)||!['是','已有 Asahi','Yes','yes'].includes(coverage);
    const existingAsahi=['是','已有 Asahi','Yes','yes'].includes(coverage)||alcohol==='已有 Asahi';
    const healthyAlcohol=health && !unknown(alcohol);
    const type=existingAsahi?'Existing Asahi':health&&['有啤酒但沒有 Asahi','已有販售啤酒','已有販售酒類'].includes(alcohol)?'Conversion Pilot':health&&alcohol==='完全沒有酒類'?'Category Creation Pilot':health&&r.stores>=3&&potential>=scoringConfig.thresholds.highPotential?'Strategic Rollout':potential>=scoringConfig.thresholds.highPotential&&noAsahi?'Asahi Incremental Channel':'Traditional Alcohol';
    const quadrant=potential>=70&&readiness>=70?'PILOT NOW':potential>=70?'STRATEGIC BET':readiness>=70?'QUICK WIN':'LONG TERM / LOW PRIORITY';
    const missing=['目前酒類狀態','目前啤酒品牌','Asahi是否覆蓋','DecisionMaker','Pilot意願','酒類販售資格','冷藏空間','HQ統一採購'].filter(k=>unknown(q[k]));
    const confidenceFields=[r.rawData['追蹤分類'],r.rawData['門店'],r.rawData['近12月M'],r.rawData['近12月kg'],r.rawData['近30天'],...['目前酒類狀態','目前啤酒品牌','Asahi是否覆蓋','DecisionMaker','Pilot意願','酒類販售資格','冷藏空間','HQ統一採購','PipelineStage'].map(k=>q[k])];
    const confidence=Math.round((confidenceFields.filter(v=>!unknown(v)).length/confidenceFields.length)*100);
    const stage=q['PipelineStage']||'Universe';
    const manualPriority=unknown(q['Manual Priority'])?'':q['Manual Priority'];
    const manualRegion=unknown(q['Manual Region'])?'':q['Manual Region'];
    const cuisineType=manualCuisine||cuisine.type;
    r.regionDisplay=manualRegion||r.region;
    r.calculatedMetrics={consumerFit:fit.score,consumerFitLabel:fit.label,commercialScale:Math.round(commercial),categoryCreation:Math.round(categoryCreation),rightToWin:Math.round(right),showcaseValue:Math.round(showcase),strategicPotential:Math.max(0,Math.min(100,potential)),executionReadiness:Math.max(0,Math.min(100,readiness)),opportunityType:type,quadrant,health,healthChannelFit:healthInfo.fit,autoHealthSegment:healthInfo.segment,manualHealthSegment:manualHealth,healthSegment,healthAttackPriority:healthPriority||healthInfo.priority,healthFitReason:manualHealth?'人工指定，優先於系統判定':healthInfo.reason,healthSignals:healthInfo.signals,confidence,confidenceLabel:confidence>=75?'High':confidence>=45?'Medium':'Low',missing,stage,alcohol:alcohol||'Unknown',coverage:coverage||'Unknown',nextAction:q['NextAction']||'',autoCuisineType:cuisine.type,cuisineType,cuisineTypeDisplay:cuisineType,cuisineSource:manualCuisine?'Manual':cuisine.type==='Unknown'?'Unknown':'Auto',cuisineConfidence:cuisine.confidence,cuisineSignals:cuisine.signals,cuisineReason:manualCuisine?'人工指定，優先於系統判定':cuisine.reason||'沒有命中明確關鍵字',manualCuisineType:manualCuisine,manualPriority,manualRegion,regionDisplay:r.regionDisplay,owner:q.Owner||'',targetDate:q['Target Date']||'',attackStatus:q['Attack Status']||'Not Started',ceoNote:q['CEO Note']||'',blockerReason:q['Blocker Reason']||'',inAttackList:q['In Attack List']==='Yes'||(['Must Attack','High Priority','Medium Priority','Watch'].includes(manualPriority)&&manualPriority!=='Not Now'),relationshipSignals:[]};
    if(health) r.calculatedMetrics.relationshipSignals.push('健康餐客群高度適配');
    if(r.stores>=3) r.calculatedMetrics.relationshipSignals.push(`${r.rawData['門店']} 家門店具 Rollout 潛力`);
    if(r.recent>0) r.calculatedMetrics.relationshipSignals.push('近30天仍有交易關係');
    if(existingAsahi) r.calculatedMetrics.relationshipSignals.push('目前已使用 Asahi，屬既有帳戶');
    else if(noAsahi) r.calculatedMetrics.relationshipSignals.push('尚未確認 Asahi 覆蓋');
    if(r.calculatedMetrics.cuisineType==='Healthy / Fitness Meal') r.calculatedMetrics.relationshipSignals.push('健康／健身餐型，零糖質產品適配度較高');
    if(['Japanese','Bar / Bistro','Hotpot / Grill'].includes(r.calculatedMetrics.cuisineType)) r.calculatedMetrics.relationshipSignals.push('適合評估餐酒或啤酒搭配導入');
    if(r.calculatedMetrics.cuisineType==='Cafe / Brunch') r.calculatedMetrics.relationshipSignals.push('需先確認酒類販售資格與消費時段');
    if(r.calculatedMetrics.cuisineType==='Bento / Catering') r.calculatedMetrics.relationshipSignals.push('即飲酒類場景較弱，需先完成場景 Qualification');
  });
}
function metric(r){return r.calculatedMetrics;}
function populateSelect(id, values, label='所有選項') { const s=$(id); if(!s)return; const current=s.value; s.replaceChildren();const all=document.createElement('option');all.value='';all.textContent=label;s.appendChild(all); [...new Set(values.filter(Boolean))].sort().forEach(v=>{const option=document.createElement('option');option.value=v;option.textContent=v;s.appendChild(option);}); if([...s.options].some(o=>o.value===current))s.value=current; else s.value=''; }
function populateFilters(){ populateSelect('region-filter',records.map(r=>r.regionDisplay),'所有區域');populateSelect('priority-filter',records.map(r=>metric(r).manualPriority||'未設定'),'所有人工優先級');populateSelect('opportunity-filter',records.map(r=>metric(r).opportunityType),'所有機會類型');populateSelect('cuisine-filter',records.map(r=>metric(r).cuisineTypeDisplay),'所有 Cuisine Type');populateSelect('quadrant-filter',records.map(r=>metric(r).quadrant),'所有象限');populateSelect('alcohol-filter',records.map(r=>metric(r).alcohol),'所有酒類狀態');populateSelect('stage-filter',records.map(r=>metric(r).stage),'所有 Pipeline Stage');populateSelect('confidence-filter',records.map(r=>metric(r).confidenceLabel),'所有 Data Confidence');populateSelect('health-segment-filter',records.map(r=>metric(r).healthSegment),'所有健康餐分類');populateSelect('health-priority-filter',records.map(r=>metric(r).healthAttackPriority),'所有健康攻擊優先級');populateSelect('owner-filter',records.map(r=>metric(r).owner),'所有 Owner');populateSelect('attack-status-filter',records.map(r=>metric(r).attackStatus),'所有 Attack Status');}
function isCallToday(r){const m=metric(r);return m.quadrant==='PILOT NOW'||(m.strategicPotential>=scoringConfig.thresholds.highPotential&&m.confidence>=75);}
function filteredRecords() {
  const q=($('channel-search').value||'').toLowerCase(), health=$('health-filter')?.value||'', filters=[['region-filter',r=>r.regionDisplay],['priority-filter',r=>metric(r).manualPriority||'未設定'],['opportunity-filter',r=>metric(r).opportunityType],['cuisine-filter',r=>metric(r).cuisineTypeDisplay],['quadrant-filter',r=>metric(r).quadrant],['alcohol-filter',r=>metric(r).alcohol],['stage-filter',r=>metric(r).stage],['confidence-filter',r=>metric(r).confidenceLabel],['health-segment-filter',r=>metric(r).healthSegment],['health-priority-filter',r=>metric(r).healthAttackPriority],['owner-filter',r=>metric(r).owner],['attack-status-filter',r=>metric(r).attackStatus]];
  let rows=records.filter(r=>`${r.name} ${r.category} ${r.regionDisplay} ${Object.values(r.qualificationData).join(' ')}`.toLowerCase().includes(q));
  if(health)rows=rows.filter(r=>metric(r).health); filters.forEach(([id,get])=>{const value=$(id)?.value;if(value)rows=rows.filter(r=>get(r)===value);});
  if(funnelFilter==='health') rows=rows.filter(r=>metric(r).health);
  if(funnelFilter==='potential') rows=rows.filter(r=>metric(r).strategicPotential>=scoringConfig.thresholds.highPotential);
  if(funnelFilter==='qualified') rows=rows.filter(r=>metric(r).confidence>=75);
  if(funnelFilter==='pilot') rows=rows.filter(r=>metric(r).stage==='Pilot Candidate'||metric(r).quadrant==='PILOT NOW');
  if(funnelFilter==='live') rows=rows.filter(r=>metric(r).stage==='Pilot Live');
  if(funnelFilter==='rollout') rows=rows.filter(r=>metric(r).stage==='Rollout');
  const quick=$('quick-filter')?.value;
  if(quick==='call') rows=rows.filter(isCallToday);
  if(quick==='pilot') rows=rows.filter(r=>metric(r).quadrant==='PILOT NOW');
  if(quick==='missing') rows=rows.filter(r=>metric(r).confidence<75);
  if(quick==='potential') rows=rows.filter(r=>metric(r).strategicPotential>=scoringConfig.thresholds.highPotential);
  if(quick==='healthy') rows=rows.filter(r=>metric(r).cuisineType==='Healthy / Fitness Meal');
  if(quick==='japanese') rows=rows.filter(r=>metric(r).cuisineType==='Japanese');
  if(quick==='bar') rows=rows.filter(r=>metric(r).cuisineType==='Bar / Bistro');
  if(quick==='unknown-cuisine') rows=rows.filter(r=>metric(r).cuisineType==='Unknown');
  if(quick==='must-attack') rows=rows.filter(r=>metric(r).manualPriority==='Must Attack');
  if(quick==='attack-list') rows=rows.filter(r=>metric(r).inAttackList);
  if(quick==='health-core') rows=rows.filter(r=>metric(r).healthAttackPriority==='Core Target');
  if(quick==='health-fit') rows=rows.filter(r=>metric(r).healthChannelFit>=70);
  if(quick==='no-owner') rows=rows.filter(r=>!metric(r).owner);
  if(quick==='waiting') rows=rows.filter(r=>metric(r).attackStatus==='Waiting Reply');
  if(quick==='blocked') rows=rows.filter(r=>metric(r).attackStatus==='Blocked');
  if(quick==='not-now') rows=rows.filter(r=>metric(r).manualPriority==='Not Now');
  if(quick==='high-priority') rows=rows.filter(r=>metric(r).manualPriority==='High Priority');
  if(quick==='manual-priority') rows=rows.filter(r=>!!metric(r).manualPriority);
  if(quick==='manual-region') rows=rows.filter(r=>!!metric(r).manualRegion);
  if(quick==='manual-cuisine') rows=rows.filter(r=>!!metric(r).manualCuisineType);
  const sort=$('sort-select').value; return rows.sort((a,b)=>sort==='potential'?metric(b).strategicPotential-metric(a).strategicPotential:sort==='readiness'?metric(b).executionReadiness-metric(a).executionReadiness:sort==='stores'?b.stores-a.stores:sort==='revenue'?b.revenue-a.revenue:sort==='name'?a.name.localeCompare(b.name,'zh'):actionRank(b)-actionRank(a));
}
function actionRank(r){const m=metric(r),priority={'Must Attack':10000,'High Priority':7000,'Medium Priority':4000,'Watch':1000,'Not Now':-3000}[m.manualPriority]??0,healthPriority={'Core Target':800,'Test Target':400,'Not Health Fit':-500,'Unknown':0}[m.healthAttackPriority]??0,status=['Won','Lost','Paused'].includes(m.attackStatus)?0:500,date=m.targetDate?Math.max(0,100-Math.max(0,(new Date(m.targetDate)-Date.now())/86400000)):0;return priority+(m.inAttackList?1200:0)+healthPriority+m.healthChannelFit*2+(m.cuisineType==='Healthy / Fitness Meal'?300:0)+status+date+(m.quadrant==='PILOT NOW'?400: m.quadrant==='STRATEGIC BET'?300:m.quadrant==='QUICK WIN'?200:0)+m.strategicPotential+m.executionReadiness+(m.confidence*0.5)-(m.missing.length*2);}
function badge(value, cls=''){return `<span class="data-badge ${cls}">${value}</span>`;}
function priorityClass(value){return String(value||'').toLowerCase().replace(/\s+/g,'-');}
function recommendation(r){const m=metric(r);if(m.missing.length)return `補問：${m.missing[0]}`;if(m.quadrant==='PILOT NOW')return '安排 HQ／店點 Pilot 會議';if(m.opportunityType==='Category Creation Pilot')return '確認酒類資格，設計健康餐套餐 Pilot';return '安排需求訪談與決策者確認';}
function actionLabel(r){const m=metric(r);if(m.quadrant==='PILOT NOW')return 'Call Today';if(m.confidence<75)return 'Qualify First';if(m.strategicPotential>=70)return 'Pilot Candidate';return 'Monitor';}
const ATTACK_HEADERS=['客戶','Priority','Health Fit','Health Segment','Cuisine / 區域','Owner','Target Date','Attack Status','Next Action','CEO Note','操作'];
const ATTACK_PLACEHOLDERS={'Owner':'負責人','Target Date':'選日期','NextAction':'下一步','CEO Note':'管理備註'};
function actionEditor(parent,label,key,value,options=[],cls=''){const wrap=document.createElement('label');wrap.className=`action-editor action-cell${cls?' '+cls:''}`;text(wrap,label,'span','cell-label');if(options.length){const select=document.createElement('select');select.dataset.key=key;const values=['',...options];values.forEach(v=>text(select,v||'未設定','option'));select.value=value||'';wrap.appendChild(select);}else{const input=document.createElement('input');input.dataset.key=key;input.value=value||'';if(ATTACK_PLACEHOLDERS[key])input.placeholder=ATTACK_PLACEHOLDERS[key];if(key==='Target Date')input.type='date';wrap.appendChild(input);}parent.appendChild(wrap);return wrap;}
function actionCell(parent,label,value,tag='span',cls=''){const cell=document.createElement('div');cell.className=`action-cell${cls?' '+cls+'-wrap':''}`;text(cell,label,'span','cell-label');text(cell,value,tag,cls);parent.appendChild(cell);return cell;}
function showToast(message){const notice=$('import-status');if(notice){notice.className='notice success';notice.textContent=message;}}
function saveAction(r,row){row.querySelectorAll('[data-key]').forEach(el=>{r.qualificationData[el.dataset.key]=el.value||'Unknown';});saveQual(r.name,r.qualificationData);calculate();render();showToast('已儲存本週作戰設定');}
function removeFromWeek(r){r.qualificationData['Manual Priority']='Not Now';r.qualificationData['Attack Status']='Paused';saveQual(r.name,r.qualificationData);calculate();render();showToast('已移出本週進攻名單');}
function addToAttack(r, priority='High Priority'){r.qualificationData['In Attack List']='Yes';if(priority)r.qualificationData['Manual Priority']=priority;r.qualificationData['Attack Status']=r.qualificationData['Attack Status']||'Not Started';saveQual(r.name,r.qualificationData);calculate();render();showToast(`已將 ${r.name} 加入本週進攻名單`);}
function renderAttackRow(r,table){const m=metric(r),row=document.createElement('div');row.className='next-action-card';actionCell(row,'客戶',r.name,'strong','name-cell');actionEditor(row,'Priority','Manual Priority',m.manualPriority,PRIORITIES);actionCell(row,'Health Fit',`${m.healthChannelFit}/100`,'span','health-cell');actionCell(row,'Health Segment',m.healthSegment,'span','health-segment-cell');actionCell(row,'Cuisine / 區域',`${m.cuisineTypeDisplay} · ${m.regionDisplay}`,'span','cuisine-cell');actionEditor(row,'Owner','Owner',m.owner);actionEditor(row,'Target Date','Target Date',m.targetDate);actionEditor(row,'Attack Status','Attack Status',m.attackStatus,ATTACK_STATUSES);actionEditor(row,'Next Action','NextAction',m.nextAction||recommendation(r));actionEditor(row,'CEO Note','CEO Note',m.ceoNote);const actionsCell=document.createElement('div');actionsCell.className='action-cell action-row-buttons-cell';text(actionsCell,'操作','span','cell-label');const actions=document.createElement('div');actions.className='action-row-buttons';const save=document.createElement('button');save.className='action-save';save.textContent='儲存';save.addEventListener('click',()=>saveAction(r,row));const detail=document.createElement('button');detail.className='link-button';detail.textContent='詳情';detail.addEventListener('click',()=>openDrawer(r));const remove=document.createElement('button');remove.className='link-button danger-link';remove.textContent='移出名單';remove.addEventListener('click',()=>removeFromWeek(r));actions.append(save,detail,remove);actionsCell.appendChild(actions);row.appendChild(actionsCell);table.appendChild(row);}
function renderRecommendationRow(r,table){const m=metric(r),row=document.createElement('div');row.className='next-action-card recommendation-row';actionCell(row,'客戶',r.name,'strong','name-cell');actionCell(row,'Priority','System Recommended','span','system-badge');actionCell(row,'Health Fit',`${m.healthChannelFit}/100`,'span','health-cell');actionCell(row,'Health Segment',m.healthSegment,'span','health-segment-cell');actionCell(row,'Cuisine / 區域',`${m.cuisineTypeDisplay} · ${m.regionDisplay}`,'span','cuisine-cell');actionCell(row,'Owner',m.owner||'未指派');actionCell(row,'Target Date',m.targetDate||'—');actionCell(row,'Attack Status',m.attackStatus);actionCell(row,'Next Action',m.nextAction||recommendation(r));actionCell(row,'CEO Note',m.ceoNote||'—');const actionsCell=document.createElement('div');actionsCell.className='action-cell action-row-buttons-cell';text(actionsCell,'操作','span','cell-label');const actions=document.createElement('div');actions.className='action-row-buttons';const add=document.createElement('button');add.className='action-save';add.textContent='加入本週';add.addEventListener('click',()=>addToAttack(r));const detail=document.createElement('button');detail.className='link-button';detail.textContent='詳情';detail.addEventListener('click',()=>openDrawer(r));actions.append(add,detail);actionsCell.appendChild(actions);row.appendChild(actionsCell);table.appendChild(row);}
function renderActions(){const box=$('next-actions');box.replaceChildren();const controls=document.createElement('div');controls.className='attack-controls';const attackTab=document.createElement('button');attackTab.className=actionView==='attack'?'active':'';attackTab.textContent='本週進攻名單';attackTab.addEventListener('click',()=>{actionView='attack';renderActions();});const recTab=document.createElement('button');recTab.className=actionView==='recommendation'?'active':'';recTab.textContent='系統推薦名單';recTab.addEventListener('click',()=>{actionView='recommendation';renderActions();});const picker=document.createElement('select');const defaultOption=document.createElement('option');defaultOption.value='';defaultOption.textContent='新增進攻客戶…';picker.appendChild(defaultOption);records.forEach(r=>{const option=document.createElement('option');option.value=r.name;option.textContent=r.name;picker.appendChild(option);});picker.addEventListener('change',()=>{const r=records.find(item=>item.name===picker.value);if(r)addToAttack(r);picker.value='';});controls.append(attackTab,recTab,picker);box.appendChild(controls);const rows=actionView==='attack'?[...records].filter(r=>metric(r).inAttackList&&metric(r).manualPriority!=='Not Now'&&metric(r).attackStatus!=='Paused').sort((a,b)=>actionRank(b)-actionRank(a)):[...records].sort((a,b)=>actionRank(b)-actionRank(a)).slice(0,10);const wrap=document.createElement('div');wrap.className='attack-table-wrap';const table=document.createElement('div');table.className='action-table';const header=document.createElement('div');header.className='action-table-header';ATTACK_HEADERS.forEach(label=>text(header,label,'div','action-table-head'));table.appendChild(header);if(!rows.length){const empty=document.createElement('div');empty.className='action-table-empty-row';text(empty,actionView==='attack'?'目前尚未加入本週進攻客戶。請從系統推薦名單或客戶資料庫加入。':'目前沒有符合條件的系統推薦客戶。','span');table.appendChild(empty);}else{rows.forEach(r=>actionView==='attack'?renderAttackRow(r,table):renderRecommendationRow(r,table));}wrap.appendChild(table);box.appendChild(wrap);}
function renderMatrix(){const box=$('opportunity-matrix');box.querySelectorAll('.account-dot').forEach(e=>e.remove());records.forEach(r=>{const m=metric(r),dot=document.createElement('button');dot.className=`account-dot ${m.opportunityType.replace(/\s/g,'-')}`;dot.title=`${r.name} · Strategic ${m.strategicPotential} · Readiness ${m.executionReadiness}`;dot.style.left=`${Math.max(3,Math.min(97,m.executionReadiness))}%`;dot.style.bottom=`${Math.max(3,Math.min(97,m.strategicPotential))}%`;dot.style.width=dot.style.height=`${Math.max(10,Math.min(28,10+r.stores*1.5))}px`;dot.addEventListener('click',()=>openDrawer(r));box.appendChild(dot);});}
function renderFunnel(){const stages=['Universe','Health Channel Identified','High Potential','Qualified','Pilot Candidate','Pilot Live','Rollout'];const filters=['','health','potential','qualified','pilot','live','rollout'];const box=$('health-funnel');box.replaceChildren();if(!records.length){text(box,'尚未載入資料，無法顯示健康通路目標漏斗。','p','subtext');return;}const counts=stages.map((s,i)=>i===0?records.length:i===1?records.filter(r=>metric(r).health).length:i===2?records.filter(r=>metric(r).strategicPotential>=70).length:i===3?records.filter(r=>metric(r).confidence>=75).length:i===4?records.filter(r=>metric(r).stage==='Pilot Candidate'||metric(r).quadrant==='PILOT NOW').length:i===5?records.filter(r=>metric(r).stage==='Pilot Live').length:records.filter(r=>metric(r).stage==='Rollout').length);stages.forEach((s,i)=>{const b=document.createElement('button');b.className='funnel-step';b.addEventListener('click',()=>{funnelFilter=filters[i];renderTable();});text(b,counts[i],'strong');text(b,s,'span');box.appendChild(b);});}
function renderBars(){const box=$('opportunity-chart');box.replaceChildren();if(!records.length){text(box,'尚未載入資料，無法顯示 Opportunity Type 分布。','p','subtext');return;}const map={};records.forEach(r=>{const key=metric(r).opportunityType;map[key]=(map[key]||0)+1;});const max=Math.max(...Object.values(map),1);Object.entries(map).sort((a,b)=>b[1]-a[1]).forEach(([key,value])=>{const row=document.createElement('div');row.className='bar-row';text(row,`${key} · ${value}`,'span','bar-label');const visual=document.createElement('div');visual.className='bar-visual';const bar=document.createElement('i');bar.style.setProperty('--value',`${value/max*100}%`);visual.appendChild(bar);text(visual,`${value} 戶`,'b','bar-value');row.appendChild(visual);box.appendChild(row);});}
function renderRegions(){const box=$('region-chart');box.replaceChildren();if(!records.length){text(box,'尚未載入資料，無法顯示區域分布。','p','subtext');return;}const map={};records.filter(r=>metric(r).health).forEach(r=>{const key=r.regionDisplay||'未填寫';map[key]??={count:0,stores:0,potential:0};map[key].count++;map[key].stores+=r.stores;map[key].potential+=metric(r).strategicPotential;});if(!Object.keys(map).length){text(box,'目前沒有健康餐通路符合條件的客戶。','p','subtext');return;}const max=Math.max(...Object.values(map).map(v=>v.count),1);Object.entries(map).sort((a,b)=>b[1].count-a[1].count).forEach(([key,v])=>{const row=document.createElement('div');row.className='bar-row';text(row,`${key} · ${v.count} 戶`,'span','bar-label');const visual=document.createElement('div');visual.className='bar-visual';const bar=document.createElement('i');bar.style.setProperty('--value',`${v.count/max*100}%`);visual.appendChild(bar);text(visual,`${v.stores} 店 · 平均 Potential ${Math.round(v.potential/v.count)}`,'b','bar-value');row.appendChild(visual);box.appendChild(row);});}
function renderQueue(){const box=$('qualification-queue');box.replaceChildren();const rows=records.filter(r=>metric(r).health&&metric(r).strategicPotential>=70&&metric(r).missing.length).sort((a,b)=>metric(b).strategicPotential-metric(a).strategicPotential).slice(0,6);if(!rows.length){text(box,'目前沒有待補資料的高潛力客戶。','p','subtext');return;}rows.forEach(r=>{const item=document.createElement('button');item.className='queue-item';item.addEventListener('click',()=>openDrawer(r));text(item,r.name,'strong');text(item,`Strategic ${metric(r).strategicPotential} · Missing: ${metric(r).missing.slice(0,3).join('、')}`,'small');box.appendChild(item);});}
function why(r){const m=metric(r),reasons=[...m.relationshipSignals];if(m.consumerFit>=85)reasons.unshift('健康／零糖質消費者適配高');if(r.stores>=3)reasons.push('多店具備 Rollout Leverage');if(m.alcohol==='完全沒有酒類')reasons.push('無酒類不扣分，適合作為 Category Creation Pilot');return reasons.slice(0,5);}
function risks(r){const m=metric(r),items=m.missing.slice(0,5).map(v=>`尚未確認：${v}`);if(m.alcohol==='完全沒有酒類')items.push('目前無酒類銷售紀錄，需確認 Category Creation 條件');if(m.coverage==='Unknown')items.push('Asahi Coverage 尚未確認');return items.length?items:['目前沒有明顯資料缺口'];}
function field(parent,label,key,value,options){const wrap=document.createElement('label');text(wrap,label,'span');if(options){const select=document.createElement('select');select.dataset.key=key;text(select,'Unknown','option');options.filter(v=>v!=='Unknown').forEach(v=>text(select,v,'option'));select.value=unknown(value)?'Unknown':value;wrap.appendChild(select);}else if(['CEO Note','備註','NextAction'].includes(key)){const area=document.createElement('textarea');area.dataset.key=key;area.value=unknown(value)?'':value||'';wrap.appendChild(area);}else{const input=document.createElement('input');input.dataset.key=key;input.value=unknown(value)?'':value||'';wrap.appendChild(input);}parent.appendChild(wrap);}
function openDrawer(r){
  currentRecord=r;
  const c=$('drawer-content');
  c.replaceChildren();
  const m=metric(r),q=r.qualificationData;
  text(c,r.name,'h2');
  text(c,`${r.category||'—'} · ${m.regionDisplay||'—'} · ${r.tier||'—'}`,'p','subtext');
  const scoreGrid=document.createElement('div');
  scoreGrid.className='drawer-score-grid';
  [['Strategic Potential',m.strategicPotential],['Execution Readiness',m.executionReadiness],['Data Confidence',`${m.confidence}%`]].forEach(([k,v])=>{const box=document.createElement('div');text(box,k,'small');text(box,v,'strong');scoreGrid.appendChild(box);});
  c.appendChild(scoreGrid);
  text(c,m.manualPriority||m.opportunityType,'div',`drawer-opportunity ${m.manualPriority?'priority-badge '+priorityClass(m.manualPriority):''}`);
  text(c,'為什麼值得處理？','h3');
  const ul=document.createElement('ul');
  why(r).forEach(v=>text(ul,v,'li'));
  c.appendChild(ul);
  text(c,'風險／待補資料','h3');
  const riskList=document.createElement('ul');
  risks(r).forEach(v=>text(riskList,v,'li'));
  c.appendChild(riskList);
  text(c,'客戶概況','h3');
  const dl=document.createElement('dl');
  [['門店',r.rawData['門店']],['原始區域',r.region],['顯示區域',m.regionDisplay],['Cuisine Type',m.cuisineTypeDisplay],['近12月M',r.rawData['近12月M']],['近12月kg',r.rawData['近12月kg']],['元/kg',r.rawData['元/kg']],['近30天',r.rawData['近30天']],['歷史最大月營收',r.rawData['歷史最大月營收']],['Consumer Fit',`${m.consumerFit} · ${m.consumerFitLabel}`],['Commercial Scale',m.commercialScale],['Category Creation',m.categoryCreation],['Right to Win',m.rightToWin]].forEach(([k,v])=>{text(dl,k,'dt');text(dl,v||'—','dd');});
  c.appendChild(dl);

  const allFields=[];
  const addSection=(title,fields)=>{
    text(c,title,'h3');
    const form=document.createElement('div');
    form.className='drawer-form';
    fields.forEach(f=>field(form,f.label,f.key,q[f.key],f.options));
    c.appendChild(form);
    allFields.push(form);
  };

  addSection('作戰設定',[
    {label:'In Attack List / 本週進攻名單',key:'In Attack List',options:['Yes','No']},
    {label:'進攻優先級 Manual Priority',key:'Manual Priority',options:PRIORITIES},
    {label:'Owner / 負責人',key:'Owner'},
    {label:'Target Date / 預計聯繫日',key:'Target Date'},
    {label:'Attack Status',key:'Attack Status',options:ATTACK_STATUSES},
    {label:'下一步行動 Next Action',key:'NextAction'},
    {label:'CEO Note / 管理備註',key:'CEO Note'},
    {label:'Blocker Reason',key:'Blocker Reason',options:['找不到決策者','無酒類販售資格','沒有冷藏空間','排他合約','價格疑慮','品牌不適配','門店執行意願低','等待總部回覆','資料不足','其他']}
  ]);

  text(c,'健康餐通路判定','h3');
  text(c,`Auto Health Segment：${m.autoHealthSegment}`,'p','cuisine-reason');
  text(c,`Final Health Segment：${m.healthSegment} · Health Channel Fit ${m.healthChannelFit}/100`,'p','cuisine-reason');
  text(c,`Health Fit Reason：${m.healthFitReason}`,'p','cuisine-reason');
  const healthForm=document.createElement('div');
  healthForm.className='drawer-form';
  field(healthForm,'Manual Health Segment','Manual Health Segment',q['Manual Health Segment'],HEALTH_SEGMENTS);
  field(healthForm,'Health Attack Priority','Health Attack Priority',q['Health Attack Priority'],HEALTH_PRIORITIES);
  c.appendChild(healthForm);
  allFields.push(healthForm);

  text(c,'Cuisine / 區域修正','h3');
  text(c,`Auto Cuisine Type：${m.autoCuisineType}（Confidence：${m.cuisineConfidence}）`,'p','cuisine-reason');
  text(c,`Final Cuisine Type：${m.cuisineTypeDisplay}（${m.cuisineSource}）`,'p','cuisine-reason');
  text(c,`命中關鍵字：${m.cuisineSignals.join('、')||'無（待確認）'}`,'p','cuisine-signals');
  text(c,`判定原因：${m.cuisineReason}`,'p','cuisine-reason');
  text(c,`Region Display：${m.regionDisplay}`,'p','cuisine-reason');
  const cuisineForm=document.createElement('div');
  cuisineForm.className='drawer-form';
  field(cuisineForm,'Manual Cuisine Type','Manual Cuisine Type',q['Manual Cuisine Type'],CUISINE_TYPES);
  field(cuisineForm,'Manual Region','Manual Region',q['Manual Region']);
  field(cuisineForm,'Channel Type','Channel Type',q['Channel Type'],CHANNEL_TYPES);
  field(cuisineForm,'Store Count Override','Store Count Override',q['Store Count Override']);
  field(cuisineForm,'Group / Brand Owner','Group / Brand Owner',q['Group / Brand Owner']);
  c.appendChild(cuisineForm);
  allFields.push(cuisineForm);

  addSection('酒類與上架條件',[
    {label:'目前酒類狀態',key:'目前酒類狀態',options:['已有販售酒類','已有販售啤酒','有啤酒但沒有 Asahi','已有 Asahi','完全沒有酒類']},
    {label:'目前啤酒品牌',key:'目前啤酒品牌'},
    {label:'Asahi Coverage',key:'Asahi是否覆蓋',options:['是','否']},
    {label:'酒類販售資格',key:'酒類販售資格',options:['是','否']},
    {label:'冷藏空間',key:'冷藏空間',options:['是','否']},
    {label:'杯裝 / 瓶裝販售能力',key:'杯裝 / 瓶裝販售能力',options:['是','否']},
    {label:'可否做套餐',key:'可否做套餐',options:['是','否']},
    {label:'可否做零糖質主題活動',key:'可否做零糖質主題活動',options:['是','否']},
    {label:'是否有排他合約',key:'排他合約',options:['是','否']},
    {label:'價格敏感度',key:'價格敏感度',options:['Low','Medium','High','Unknown']},
    {label:'上架難度',key:'上架難度',options:['Easy','Medium','Hard','Blocked','Unknown']}
  ]);

  addSection('決策與關係',[
    {label:'Decision Maker',key:'DecisionMaker',options:['已直接接觸老闆','已直接接觸採購','有窗口可以介紹','一般業務窗口','尚未建立關係']},
    {label:'關係強度',key:'關係強度',options:['Strong','Medium','Weak','No Relationship','Unknown']},
    {label:'Pilot 意願',key:'Pilot意願',options:['已確認願意 Pilot','有興趣','待洽談','暫無意願','拒絕']},
    {label:'HQ 統一採購',key:'HQ統一採購',options:['是','否']},
    {label:'決策週期',key:'決策週期',options:['店長可決定','區經理可決定','總部採購決定','老闆決定','未知']}
  ]);

  addSection('Pilot / Rollout',[
    {label:'Pilot Start Date',key:'Pilot Start Date'},
    {label:'Pilot Stores',key:'Pilot Stores'},
    {label:'Initial Order',key:'Initial Order'},
    {label:'Weekly Sales',key:'Weekly Sales'},
    {label:'Monthly Sales',key:'Monthly Sales'},
    {label:'Repeat Order',key:'Repeat Order'},
    {label:'Sell-through',key:'Sell-through'},
    {label:'Pilot Result',key:'Pilot Result',options:['Testing','Successful','Scale','Failed','Paused']},
    {label:'Rollout Readiness',key:'Rollout Readiness',options:['Ready','Need Proof','Need HQ Approval','Not Ready','Unknown']}
  ]);

  addSection('其他',[
    {label:'Pipeline Stage',key:'PipelineStage',options:['Universe','Health Channel Identified','High Potential','Qualified','Pilot Candidate','Pilot Live','Rollout','Paused']},
    {label:'備註',key:'備註'}
  ]);

  const save=document.createElement('button');
  save.className='drawer-save';
  save.textContent='儲存 Qualification';
  save.addEventListener('click',()=>{
    allFields.forEach(form=>form.querySelectorAll('[data-key]').forEach(el=>{r.qualificationData[el.dataset.key]=el.value||'Unknown';}));
    saveQual(r.name,r.qualificationData);
    calculate();
    render();
    openDrawer(r);
    showToast('已儲存客戶作戰資料');
  });
  c.appendChild(save);
  const rec=document.createElement('p');
  rec.className='drawer-recommendation';
  rec.textContent=`建議下一步：${m.nextAction||recommendation(r)}`;
  c.appendChild(rec);
  $('detail-drawer').classList.add('open');
  $('detail-drawer').setAttribute('aria-hidden','false');
  $('drawer-backdrop').classList.add('open');
}
function closeDrawer(){$('detail-drawer').classList.remove('open');$('detail-drawer').setAttribute('aria-hidden','true');$('drawer-backdrop').classList.remove('open');currentRecord=null;}
function render(){
  calculate();
  populateFilters();
  const metricIds = ['metric-health','metric-high-potential','metric-pilot-now','metric-call-today','metric-category-creation','metric-conversion','metric-rollout','metric-incremental','metric-qualification','metric-must-attack','metric-owned','metric-blocked','metric-waiting'];
  if (!records.length) {
    metricIds.forEach(id => { const el = $(id); if (el) el.textContent = '—'; });
    $('summary-period').textContent = '尚未載入資料';
    $('empty-state').hidden = false;
    $('empty-state-message').textContent = '尚未載入任何客戶資料。請同步每日資料、重新載入 Google Sheet，或匯入 CSV。';
  } else {
    const health=records.filter(r=>metric(r).health),high=records.filter(r=>metric(r).strategicPotential>=70),pilot=records.filter(r=>metric(r).quadrant==='PILOT NOW'),creation=records.filter(r=>metric(r).opportunityType==='Category Creation Pilot'),conversion=records.filter(r=>metric(r).opportunityType==='Conversion Pilot'),rollout=records.filter(r=>metric(r).opportunityType==='Strategic Rollout'),incremental=records.filter(r=>metric(r).opportunityType==='Asahi Incremental Channel'),must=records.filter(r=>metric(r).manualPriority==='Must Attack'),owned=records.filter(r=>metric(r).owner),blocked=records.filter(r=>metric(r).attackStatus==='Blocked'),waiting=records.filter(r=>metric(r).attackStatus==='Waiting Reply');
    $('metric-health').textContent=health.length;$('metric-high-potential').textContent=high.length;$('metric-pilot-now').textContent=pilot.length;$('metric-call-today').textContent=records.filter(isCallToday).length;$('metric-category-creation').textContent=creation.length;$('metric-conversion').textContent=conversion.length;$('metric-rollout').textContent=rollout.reduce((s,r)=>s+r.stores,0);$('metric-incremental').textContent=incremental.length;$('metric-qualification').textContent=high.filter(r=>metric(r).confidence<75).length;
    ['metric-must-attack','metric-owned','metric-blocked','metric-waiting'].forEach((id,i)=>$(id).textContent=[must.length,owned.length,blocked.length,waiting.length][i]);
    $('summary-period').textContent=`已載入 ${records.length} 筆 · ${new Date().toLocaleString('zh-TW')}`;
    $('empty-state').hidden = true;
  }
  renderAttention();
  renderActions();
  renderMatrix();
  renderFunnel();
  renderBars();
  renderRegions();
  renderQueue();
  renderTable();
}
function renderAttention(){
  const box=$('ceo-attention');
  if(!box)return;
  box.replaceChildren();
  if(!records.length){
    text(box,'尚未載入資料，無法產生 CEO Attention 項目。','span','attention-empty');
    return;
  }
  const today=new Date().toISOString().slice(0,10);
  const high=records.filter(r=>{const m=metric(r);return (m.manualPriority==='Must Attack'&&!m.owner)||(m.targetDate&&m.targetDate<today&&!['Won','Lost','Paused'].includes(m.attackStatus))||(m.attackStatus==='Blocked'&&!m.blockerReason);});
  const medium=records.filter(r=>{const m=metric(r);return !high.includes(r)&&(m.attackStatus==='Waiting Reply'||(m.manualPriority==='High Priority'&&!m.targetDate));});
  const low=records.filter(r=>{const m=metric(r);return !high.includes(r)&&!medium.includes(r)&&m.healthAttackPriority==='Core Target'&&m.confidence<75;});
  if(!high.length&&!medium.length&&!low.length){
    text(box,'目前沒有需要 CEO 介入的項目','span','attention-empty');
    return;
  }
  const reasonFor=(r,tier)=>{const m=metric(r);
    if(tier==='high'){
      if(m.manualPriority==='Must Attack'&&!m.owner)return 'Must Attack 尚未指派負責人';
      if(m.targetDate&&m.targetDate<today)return 'Target Date 已過期';
      return 'Blocked 但尚未填寫原因';
    }
    if(tier==='medium'){
      if(m.attackStatus==='Waiting Reply')return '等待客戶回覆中';
      return 'High Priority 尚未設定 Target Date';
    }
    return '健康餐 Core Target 但資料不足';
  };
  const renderGroup=(title,tier,rows)=>{
    if(!rows.length)return;
    const group=document.createElement('div');
    group.className=`attention-group ${tier}`;
    text(group,title,'h4','attention-group-title');
    rows.slice(0,8).forEach(r=>{
      const row=document.createElement('button');
      row.className='attention-item';
      row.addEventListener('click',()=>openDrawer(r));
      text(row,r.name,'strong');
      text(row,reasonFor(r,tier),'span');
      group.appendChild(row);
    });
    box.appendChild(group);
  };
  renderGroup('高優先','high',high);
  renderGroup('中優先','medium',medium);
  renderGroup('低優先','low',low);
}
function importRows(rows){const header=rows.shift()?.map(v=>v.trim()), names=header||[];if(!header||!RAW_HEADERS.every(h=>names.includes(h)))throw Error('CSV 至少必須包含原始客戶欄位');const saved=loadQual(),rawIndex=RAW_HEADERS.map(h=>names.indexOf(h)),qualIndex=QUAL_HEADERS.map(h=>names.indexOf(h));records=rows.map(row=>{const raw=rawIndex.map(i=>row[i]??'');const imported=Object.fromEntries(QUAL_HEADERS.map((h,i)=>[h,qualIndex[i]>=0?row[qualIndex[i]]||'Unknown':'Unknown']));return model(raw,{...imported,...(saved[raw[0]]||{})});}).filter(r=>r.name);render();}
function importCSV(file){const reader=new FileReader();reader.onload=()=>{try{importRows(parseCSV(String(reader.result).replace(/^\uFEFF/,'')));$('import-status').className='notice success';$('import-status').textContent=`載入成功：${records.length} 筆 CSV 資料；人工 Qualification 已保留`;$('source-label').textContent='CSV 匯入';$('last-updated').textContent=new Date().toLocaleString('zh-TW');}catch(e){$('import-status').className='notice error';$('import-status').textContent=`載入失敗：${e.message}。請確認 CSV 欄位完整。`;}};reader.readAsText(file);}
async function loadSource(){records=[];render();$('import-status').className='notice loading';$('import-status').textContent='資料載入中，正在讀取 Google Sheet…';$('source-label').textContent='Google Sheet';try{const response=await fetch(SOURCE_URL);if(!response.ok)throw Error(`來源回應 ${response.status}`);const raw=await response.text(),rows=parseCSV(raw.replace(/^\uFEFF/,''));if(rows.length<2||rows.slice(1).every(row=>row.every(cell=>!String(cell).trim())))throw Error('來源資料為空，請檢查 Google Sheet 權限或內容');importRows(rows);if(!records.length)throw Error('來源資料為空，請檢查 Google Sheet 權限或內容');$('import-status').className='notice success';$('import-status').textContent=`載入成功：${records.length} 筆客戶資料；酒類與決策資料請逐步補齊`;$('last-updated').textContent=new Date().toLocaleString('zh-TW');}catch(e){records=[];$('import-status').className='notice error';$('import-status').textContent=e.message.includes('來源資料為空')?`來源資料為空：${e.message.replace('來源資料為空，','')}`:`載入失敗：${e.message}。請匯入 CSV。`;$('last-updated').textContent='—';render();}}
function renderTable(){const body=$('customer-table');body.replaceChildren();filteredRecords().forEach(r=>{const m=metric(r),tr=document.createElement('tr'),cell=(v,tag='span',cls='')=>{const td=document.createElement('td');text(td,v,tag,cls);tr.appendChild(td);};cell(r.name,'strong');cell(m.inAttackList?'是':'否','span',`attack-state ${m.inAttackList?'is-attack':''}`);cell(m.manualPriority||'未設定','span',`priority-badge ${priorityClass(m.manualPriority)}`);cell(m.healthSegment,'span','health-cell');cell(`${m.healthChannelFit}/100`,'span',`score-cell ${m.healthChannelFit>=70?'score-high':'score-mid'}`);cell(`${m.cuisineTypeDisplay} · ${m.cuisineSource}`,'span',`cuisine-badge cuisine-${m.cuisineConfidence.toLowerCase()}`);cell(m.regionDisplay||'—');cell(`${m.strategicPotential}/100`,'span',`score-cell ${m.strategicPotential>=70?'score-high':'score-mid'}`);cell(`${m.executionReadiness}/100`,'span',`score-cell ${m.executionReadiness>=70?'score-high':'score-mid'}`);cell(`${m.confidenceLabel} ${m.confidence}%`,'span',`confidence-${m.confidenceLabel.toLowerCase()}`);cell(m.nextAction||recommendation(r),'span','next-action-cell');const action=document.createElement('td'),add=document.createElement('button');add.className='link-button';add.textContent=m.inAttackList?'已在本週':'加入本週';add.disabled=m.inAttackList;add.addEventListener('click',()=>addToAttack(r));const btn=document.createElement('button');btn.className='link-button';btn.textContent='詳情';btn.addEventListener('click',()=>openDrawer(r));action.append(add,btn);tr.appendChild(action);body.appendChild(tr);});}
function exportCSV(){const calculatedHeaders=['InAttackList','RawRegion','ManualRegion','RegionDisplay','StrategicPotential','ExecutionReadiness','OpportunityType','Quadrant','DataConfidence','AutoHealthSegment','ManualHealthSegment','FinalHealthSegment','HealthChannelFit','HealthAttackPriority','HealthFitReason','AutoCuisineType','ManualCuisineType','CuisineType','CuisineSource','CuisineConfidence','CuisineSignals'];const headers=[...RAW_HEADERS,...QUAL_HEADERS,...calculatedHeaders];const lines=[headers.map(escapeCsv).join(',')];records.forEach(r=>{const m=metric(r);const values={InAttackList:m.inAttackList?'Yes':'No',RawRegion:r.region,ManualRegion:m.manualRegion||'',RegionDisplay:m.regionDisplay,StrategicPotential:m.strategicPotential,ExecutionReadiness:m.executionReadiness,OpportunityType:m.opportunityType,Quadrant:m.quadrant,DataConfidence:`${m.confidence}%`,AutoHealthSegment:m.autoHealthSegment,ManualHealthSegment:m.manualHealthSegment||'',FinalHealthSegment:m.healthSegment,HealthChannelFit:m.healthChannelFit,HealthAttackPriority:m.healthAttackPriority,HealthFitReason:m.healthFitReason,AutoCuisineType:m.autoCuisineType,ManualCuisineType:m.manualCuisineType||'',CuisineType:m.cuisineTypeDisplay,CuisineSource:m.cuisineSource,CuisineConfidence:m.cuisineConfidence,CuisineSignals:m.cuisineSignals.join(' | ')};lines.push(headers.map(h=>escapeCsv(RAW_HEADERS.includes(h)?r.rawData[h]:QUAL_HEADERS.includes(h)?r.qualificationData[h]||'Unknown':values[h]??'')).join(','));});const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='asahi-zero-sugar-opportunity.csv';a.click();URL.revokeObjectURL(url);}
document.addEventListener('DOMContentLoaded',()=>{['channel-search','quick-filter','region-filter','priority-filter','health-segment-filter','health-priority-filter','owner-filter','attack-status-filter','opportunity-filter','cuisine-filter','quadrant-filter','alcohol-filter','stage-filter','confidence-filter','sort-select'].forEach(id=>$(id)?.addEventListener('input',renderTable));$('csv-file')?.addEventListener('change',e=>e.target.files[0]&&importCSV(e.target.files[0]));$('export-csv')?.addEventListener('click',exportCSV);$('reset-data')?.addEventListener('click',loadSource);$('empty-reload')?.addEventListener('click',loadSource);$('print-button')?.addEventListener('click',()=>window.print());$('drawer-close')?.addEventListener('click',closeDrawer);$('drawer-backdrop')?.addEventListener('click',closeDrawer);
  $('sync-daily')?.addEventListener('click',syncDailyData);
  $('empty-sync')?.addEventListener('click',syncDailyData);
  $('source-settings-toggle')?.addEventListener('click',()=>{const panel=$('source-settings');if(panel)panel.hidden=!panel.hidden;});
  if($('source-settings-name'))$('source-settings-name').textContent=SOURCE_CONFIG.sourceName;
  if($('source-settings-url'))$('source-settings-url').textContent=SOURCE_CONFIG.sourceUrl;
  if($('source-settings-fallback'))$('source-settings-fallback').textContent=SOURCE_CONFIG.fallbackUrl;
  if($('import-status'))$('import-status').textContent='資料載入中…';loadSource();});
