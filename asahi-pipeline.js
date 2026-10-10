function renderAsahiPipeline(){
  const root=document.getElementById('asahi-pipeline');
  if(!root||!window.ASAHI_POOL_SNAPSHOT_ROWS)return;
  const STAGES=window.ASAHI_POOL_STAGES,stageOf=window.asahiPoolStageOf;
  const defs={待查證:'尚未填任何 Qualification',查證中:'已填部分，尚未通過或淘汰',通過:'酒類資格、冷藏、決策者確認，且 Asahi 未覆蓋',試點候選:'通過且有 Pilot 意願，待核准者決定',淘汰:'資格為否、Asahi 已覆蓋或無意願'};
  const checks=[['酒類販售資格','是'],['冷藏空間','是'],['Asahi是否覆蓋','否'],['DecisionMaker',null],['Pilot意願',null]];
  const known=v=>v!==undefined&&v!==null&&String(v).trim()!==''&&String(v).trim()!=='Unknown';
  const q=row=>window.asahiPoolQualification?.get({id:row.id,name:row.name})?.data||{};
  const el=id=>document.getElementById(id);
  const cell=(tr,text,cls)=>{const td=document.createElement('td');td.textContent=text;if(cls)td.className=cls;tr.appendChild(td);return td;};
  const mark=(key,data)=>{
    const v=data[key];if(!known(v))return ['❓','Unknown'];
    if(key==='酒類販售資格'||key==='冷藏空間')return v==='是'?['✅','是']:['❌','否'];
    if(key==='Asahi是否覆蓋')return v==='否'?['✅','未覆蓋']:['❌','已覆蓋'];
    if(key==='DecisionMaker')return v==='尚未建立關係'?['❌',v]:['✅',v];
    return ['暫無意願','拒絕'].includes(v)?['❌',v]:['✅',v];
  };
  const render=()=>{
    const scopeTier=el('pipe-scope').value;
    const rows=window.ASAHI_POOL_SNAPSHOT_ROWS.filter(r=>!scopeTier||r.tier===scopeTier).map(r=>({...r,data:q(r)})).map(r=>({...r,stage:stageOf(r.data)}));
    const total=rows.length,count=name=>rows.filter(r=>r.stage===name).length;
    el('pipe-date').textContent=new Date().toLocaleDateString('zh-TW');
    const kpis=[['範圍店數',total],['已開始查證',total-count('待查證')],['通過',count('通過')],['試點候選',count('試點候選')],['淘汰',count('淘汰')]];
    el('pipe-kpis').replaceChildren(...kpis.map(([label,value])=>{const a=document.createElement('article'),s=document.createElement('span'),b=document.createElement('strong');s.textContent=label;b.textContent=value;a.append(s,b);return a;}));
    const funnel=el('pipe-funnel');funnel.replaceChildren();
    STAGES.forEach((name,i)=>{
      const tr=document.createElement('tr'),n=count(name),pct=total?n/total*100:0;
      const s=cell(tr,name);s.innerHTML='';const badge=document.createElement('span');badge.className=`pool-stage-badge stage-${i}`;badge.textContent=name;s.appendChild(badge);
      cell(tr,defs[name]);cell(tr,String(n),'num');
      const share=document.createElement('td'),bar=document.createElement('div'),fill=document.createElement('i'),label=document.createElement('small');
      bar.className='pipe-bar';fill.style.width=`${pct}%`;label.textContent=`${pct.toFixed(1)}%`;bar.appendChild(fill);share.append(bar,label);tr.appendChild(share);funnel.appendChild(tr);
    });
    const gaps=el('pipe-gaps');gaps.replaceChildren();
    const live=rows.filter(r=>r.stage!=='淘汰');
    checks.forEach(([key,label])=>{
      const tr=document.createElement('tr');
      cell(tr,{DecisionMaker:'決策者',Pilot意願:'Pilot 意願',Asahi是否覆蓋:'Asahi 未覆蓋'}[key]||key);
      cell(tr,String(live.filter(r=>!known(r.data[key])).length),'num');
      cell(tr,String(rows.filter(r=>known(r.data[key])&&mark(key,r.data)[0]==='❌').length),'num');
      gaps.appendChild(tr);
    });
    const order=name=>[3,2,1,0,4][STAGES.indexOf(name)];
    const list=rows.slice().sort((a,b)=>order(a.stage)-order(b.stage)||'ABC'.indexOf(a.tier)-'ABC'.indexOf(b.tier)||a.sourceRow-b.sourceRow);
    const body=el('pipe-list');body.replaceChildren();
    list.slice(0,60).forEach(r=>{
      const tr=document.createElement('tr');
      const s=document.createElement('td'),badge=document.createElement('span');badge.className=`pool-stage-badge stage-${STAGES.indexOf(r.stage)}`;badge.textContent=r.stage;s.appendChild(badge);tr.appendChild(s);
      const n=cell(tr,r.name);cell(tr,r.city||'未提供');
      let next='';
      checks.forEach(([key])=>{const [icon,text]=mark(key,r.data);cell(tr,`${icon} ${text}`);if(!next&&icon==='❓')next={酒類販售資格:'確認酒類販售資格',冷藏空間:'確認冷藏空間',Asahi是否覆蓋:'確認 Asahi 是否已覆蓋',DecisionMaker:'找到決策者',Pilot意願:'詢問 Pilot 意願'}[key];});
      cell(tr,r.stage==='淘汰'?'—':r.stage==='試點候選'?'送核准者決定':next||'詢問 Pilot 意願');
      const act=document.createElement('td'),btn=document.createElement('button');btn.type='button';btn.className='link-button';btn.textContent='編輯';btn.addEventListener('click',()=>window.asahiPoolQualification?.open(r));act.appendChild(btn);tr.appendChild(act);
      body.appendChild(tr);
    });
    el('pipe-list-note').textContent=list.length>60?`僅顯示前 60 家（共 ${list.length} 家）；完整清單請見「Asahi 客戶池初篩」。`:`共 ${list.length} 家`;
  };
  el('pipe-scope').addEventListener('change',render);
  window.addEventListener('asahi-pool-qualification-updated',render);
  render();
}
document.addEventListener('DOMContentLoaded',renderAsahiPipeline);
