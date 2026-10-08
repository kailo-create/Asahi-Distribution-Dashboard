/* Lightweight UI language switcher. It preserves the source-language text so
   data, customer names, and form values are never changed. */
(() => {
  const button = document.getElementById('language-toggle');
  if (!button) return;

  const preferenceKey = 'asahi-dashboard-language';
  const originalText = new WeakMap();
  const originalAttrs = new WeakMap();
  let language = localStorage.getItem(preferenceKey) === 'en' ? 'en' : 'zh-Hant';
  let applying = false;

  const terms = {
    'Asahi 客戶機會指揮中心': 'Asahi Customer Opportunity Command Center',
    '決策摘要': 'Decision Summary', 'Asahi 客戶池初篩': 'Asahi Customer Pool Screening',
    '下一步待辦': 'Next Actions', '機會分析': 'Opportunity Analysis', '客戶資料': 'Customer Data',
    '列印簡報': 'Print Brief', '下一個該聯繫誰？': 'Who should we contact next?',
    '本週決策摘要': 'This Week’s Decision Summary', '先處理最需要業務行動的客戶': 'Focus first on customers needing sales action',
    '資料載入中': 'Loading data', '本週優先聯繫': 'Priority contacts this week',
    '策略潛力 × 執行準備度皆高': 'High strategic potential × high execution readiness',
    '本週 Must Attack': 'Must Attack this week', '人工指定優先': 'Manually prioritized',
    '已排負責人': 'Owner assigned', 'Owner 已設定': 'Owner assigned', '需要管理介入': 'Management intervention needed',
    '等待回覆': 'Waiting for reply', '機會池待補資料': 'Opportunity pool data needed', '核心資格尚未完整確認': 'Core qualification is incomplete',
    '健康餐客戶': 'Healthy-meal customers', '高潛力': 'High potential', 'Rollout 門店': 'Rollout stores', 'Asahi 新通路': 'New Asahi channels',
    '機會池與執行風險': 'Opportunity pool & execution risk',
    '優先機會池': 'Priority opportunity pool', '關鍵資格已完整': 'Key qualification complete',
    '進攻名單有負責人、日期與下一步': 'Attack-list entries with owner, date & next step', '逾期未完成行動': 'Overdue incomplete actions',
    '既有客戶營收實績': 'Existing customer revenue', '近 12 個月營收合計（來源單位 M）': 'Total revenue, last 12 months (source unit M)',
    '有營收資料的客戶': 'Customers with revenue data', '新開發 Pipeline 預估': 'New-business pipeline estimate',
    '可立即推進': 'Ready to proceed', '待驗證條件': 'Conditions to validate', '暫不投入': 'Do not invest yet',
    '已填目標門店': 'Target stores entered', '有月銷額估算': 'Monthly sales estimate entered',
    '新開發未加權預估月銷額（NT$/月）': 'New-business unweighted monthly sales estimate (NT$/month)',
    'Pipeline 階段存量': 'Pipeline stage volume', '開啟來源試算表': 'Open source spreadsheet', '匯出候選名單': 'Export candidate list',
    '團隊共用 Qualification': 'Team-shared qualification', '連接共用表': 'Connect shared sheet', '重新載入共用資料': 'Reload shared data',
    'A｜直接啤酒情境': 'A | Direct beer occasions', 'B｜餐飲搭餐優先': 'B | Food-pairing priority', 'C｜先確認場景': 'C | Confirm occasion first',
    '未列入本次候選': 'Not included in this candidate set', '符合候選條件': 'Eligible candidates', '篩選邏輯': 'Screening logic',
    '搜尋店名、店型或城市': 'Search name, store type, or city', '所有候選類別': 'All candidate tiers',
    '初篩': 'Screening', '店家': 'Customer', '來源店型': 'Source store type', '城市': 'City', '啤酒 Qualification': 'Beer qualification', '來源列': 'Source row',
    '行動優先': 'Action priority', '本週進攻名單 / Attack List': 'This week’s Attack List', '可編輯作戰表': 'Editable action plan',
    '目前沒有可產生的業務待辦，請先完成資料 Qualification。': 'No sales actions can be generated yet. Complete qualification first.',
    '進階分析（機會矩陣 / 區域 / 類型分布）': 'Advanced analytics (matrix / region / type)', '機會矩陣': 'Opportunity matrix',
    '區域分析': 'Regional analysis', '機會類型分析': 'Opportunity type analysis', '健康通路開發進度': 'Healthy-channel development progress',
    '資料補齊清單': 'Data completion queue', '下一步要補什麼資料？': 'What data should be completed next?',
    '原始資料與 Qualification': 'Raw data & qualification', '同步每日資料': 'Sync daily data', '資料來源設定': 'Data source settings',
    '匯入 CSV': 'Import CSV', '重新載入客戶總表': 'Reload customer master list', '客戶機會資料庫': 'Customer opportunity database',
    '搜尋客戶、類型或狀態': 'Search customer, type, or status', '快速篩選': 'Quick filter', '所有區域': 'All regions',
    '依優先行動': 'Sort by action priority', '依策略潛力': 'Sort by strategic potential', '依執行準備度': 'Sort by execution readiness',
    '依門店': 'Sort by stores', '依近12月M': 'Sort by last 12-month M', '依客戶': 'Sort by customer',
    '重新載入': 'Reload', '儲存': 'Save', '詳情': 'Details', '操作': 'Actions', '加入本週': 'Add this week',
    '加入 Attack List': 'Add to Attack List', '已在本週': 'Already added this week', '編輯 Qualification': 'Edit qualification',
    '酒類：': 'Alcohol: ', '啤酒：': 'Beer: ', 'Unknown': 'Unknown', '未提供': 'Not provided',
    '尚未載入資料': 'No data loaded', '尚未建立': 'Not created', '資料載入中…': 'Loading data…',
    '同步中，請稍候…': 'Syncing, please wait…', '已載入 ': 'Loaded ', ' 筆': ' records', ' 家': ' stores', ' 客戶': ' customers'
  };
  const attributeNames = ['placeholder', 'aria-label', 'title'];
  const replacements = Object.entries(terms).sort((a, b) => b[0].length - a[0].length);
  const translate = value => replacements.reduce((text, [zh, en]) => text.split(zh).join(en), value);

  function applyTextNode(node) {
    const source = originalText.has(node) ? originalText.get(node) : node.nodeValue;
    if (!originalText.has(node)) originalText.set(node, source);
    node.nodeValue = language === 'en' ? translate(source) : source;
  }
  function applyElement(el) {
    [...el.childNodes].forEach(node => { if (node.nodeType === Node.TEXT_NODE) applyTextNode(node); else if (node.nodeType === Node.ELEMENT_NODE) applyElement(node); });
    attributeNames.forEach(name => {
      if (!el.hasAttribute(name)) return;
      let attrs = originalAttrs.get(el);
      if (!attrs) { attrs = {}; originalAttrs.set(el, attrs); }
      if (!(name in attrs)) attrs[name] = el.getAttribute(name);
      el.setAttribute(name, language === 'en' ? translate(attrs[name]) : attrs[name]);
    });
  }
  function setLanguage(next) {
    language = next;
    applying = true;
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    applyElement(document.body);
    button.textContent = language === 'en' ? '中文' : 'EN';
    button.setAttribute('aria-label', language === 'en' ? 'Switch to Traditional Chinese' : 'Switch to English');
    button.setAttribute('aria-pressed', String(language === 'en'));
    document.title = language === 'en' ? 'Asahi Zero-Sugar Channel Command Center' : 'Asahi Zero-Sugar Channel Command Center';
    localStorage.setItem(preferenceKey, language);
    applying = false;
    document.dispatchEvent(new CustomEvent('dashboard-language-change', { detail: { language } }));
  }

  button.addEventListener('click', () => setLanguage(language === 'en' ? 'zh-Hant' : 'en'));
  new MutationObserver(mutations => {
    if (applying || language !== 'en') return;
    mutations.forEach(mutation => {
      if (mutation.type === 'characterData') applyTextNode(mutation.target);
      mutation.addedNodes.forEach(node => { if (node.nodeType === Node.TEXT_NODE) applyTextNode(node); else if (node.nodeType === Node.ELEMENT_NODE) applyElement(node); });
    });
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  setLanguage(language);
})();
