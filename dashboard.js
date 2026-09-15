const channels = [
  ['台北城市商旅', '台灣啤酒', '北區', '飯店', '未覆蓋缺口', '進行中', '低', '北區業務', '安排產品試飲'],
  ['台中宴會會館', '', '中區', '飯店宴會', '菜蟲獨有新通路', '候選', '低', '中區業務', '確認宴會採購規格'],
  ['高雄海鮮餐廳', 'Kirin', '南區', '中餐', '供應中斷', '候選', '中', '南區業務', '確認月採購量'],
  ['健康食光餐飲', '', '北區', '健康餐', '未覆蓋缺口', '待啟動', '低', '北區業務', '寄送 Dry Zero 試飲'],
  ['既有日式連鎖', 'Asahi', '中區', '連鎖餐飲', '既有經銷商覆蓋', '排除', '高', '中區業務', '暫不開發'],
];
const translations = {
  title: ['Asahi 通路合作 Dashboard', 'Asahi Channel Dashboard'], status: ['Pilot execution', 'Pilot execution'],
  print: ['列印簡報', 'Print brief'], eyebrow: ['Executive overview', 'Executive overview'],
  heroTitle: ['活用 IoT 冷鏈物流，切入中餐與飯店藍海通路', 'Use IoT cold-chain logistics to unlock hotel and dining channels'],
  heroCopy: ['以 Mapping 先行、Pilot 驗證、商務條件複製，建立 Asahi 的增量通路引擎。', 'Map first, validate with pilots, then scale Asahi incremental channels.'],
  pilotTarget: ['Pilot 目標客戶', 'Pilot target accounts'], accounts: ['Channel accounts', 'Channel accounts'],
  uncovered: ['Uncovered', 'Uncovered'], opportunities: ['Incremental opportunities', 'Incremental opportunities'],
  inProgress: ['In progress', 'In progress'], riskAlerts: ['Risk alerts', 'Risk alerts'], needReview: ['Need review', 'Need review'],
  funnelTitle: ['通路轉換進度', 'Channel conversion'], regionTitle: ['區域機會分布', 'Regional opportunities'],
  mappingTitle: ['新增通路與 Pilot 管理', 'Channel and Pilot management'], search: ['搜尋客戶或區域', 'Search customer or region'],
  customer: ['客戶', 'Customer'], region: ['區域', 'Region'], channel: ['通路', 'Channel'], risk: ['風險', 'Risk'],
  owner: ['負責人', 'Owner'], next: ['下一步', 'Next step'], categories: ['通路 Mapping 五分類', 'Five mapping categories'],
  roadmap: ['三階段落地', 'Three phases'], guardrail: ['合作防線', 'Guardrails'],
  briefTitle: ['把冷鏈配送變成 Asahi 的增量通路引擎', 'Turn cold-chain delivery into Asahi incremental growth'],
  briefCopy: ['先完成客戶 Mapping，再以 5–10 家 Pilot 驗證產品、配送與商務條件，最後建立可複製的正式分銷模式。', 'Map accounts, validate products and delivery with 5–10 pilots, then scale a repeatable distribution model.'],
};
let language = 0;
const $ = (id) => document.getElementById(id);
function render() {
  const query = ($('channel-search').value || '').toLowerCase();
  const rows = channels.filter((c) => c.join('').toLowerCase().includes(query));
  $('channel-table').innerHTML = rows.map((c) => `<tr><td><strong>${c[0]}</strong><small class="subtext">${c[1] || '尚無品牌資料'}</small></td><td>${c[2]}</td><td>${c[3]}</td><td><span class="mapping-tag ${['未覆蓋缺口','菜蟲獨有新通路'].includes(c[4]) ? 'opportunity' : 'neutral'}">${c[4]}</span></td><td><span class="status ${c[5] === '進行中' ? 'shipped' : c[5] === '排除' ? 'delivered' : 'pending'}">${c[5]}</span></td><td><span class="risk ${c[6]}">${c[6]}</span></td><td>${c[7]}</td><td>${c[8]}</td></tr>`).join('');
}
function translate() {
  document.querySelectorAll('[data-i18n]').forEach((el) => { const value = translations[el.dataset.i18n]; if (value) el.textContent = value[language]; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { const value = translations[el.dataset.i18nPlaceholder]; if (value) el.placeholder = value[language]; });
  $('language-toggle').textContent = language ? '中' : 'EN';
}
document.addEventListener('DOMContentLoaded', () => {
  render();
  $('channel-search').addEventListener('input', render);
  $('print-button').addEventListener('click', () => window.print());
  $('language-toggle').addEventListener('click', () => { language = language ? 0 : 1; translate(); });
});
