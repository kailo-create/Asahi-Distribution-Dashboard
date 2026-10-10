function renderAsahiPipeline(){
  const root=document.getElementById('asahi-pipeline');
  if(!root||!window.ASAHI_POOL_SNAPSHOT_ROWS)return;
  const STAGES=window.ASAHI_POOL_STAGES,stageOf=window.asahiPoolStageOf;
  const defs={待查證:'尚未填任何 Qualification',查證中:'已填部分，尚未通過或淘汰',通過:'酒類資格、冷藏、決策者確認，且 Asahi 未覆蓋',試點候選:'通過且有 Pilot 意願，待核准者決定',淘汰:'資格為否、Asahi 已覆蓋或無意願'};
  const potential={A:['高','hi'],B:['中','mid'],C:['待確認場景','lo']};
  const ACTIONS=['確認資格','電話聯繫','現場拜訪','送樣／試飲','提案'];
  const checks=[['酒類販售資格'],['冷藏空間'],['Asahi是否覆蓋'],['DecisionMaker'],['Pilot意願']];
  const known=v=>v!==undefined&&v!==null&&String(v).trim()!==''&&String(v).trim()!=='Unknown';
  const q=row=>window.asahiPoolQualification?.get({id:row.id,name:row.name})?.data||{};
  const el=id=>document.getElementById(id);
  const cell=(tr,text,cls)=>{const td=document.createElement('td');td.textContent=text;if(cls)td.className=cls;tr.appendChild(td);return td;};
  const kpi=([label,value])=>{const a=document.createElement('article'),s=document.createElement('span'),b=document.createElement('strong');s.textContent=label;b.textContent=value;a.append(s,b);return a;};
  const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const monday=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;};
  const thisWeek=fmt(monday(new Date())),nextWeek=fmt(new Date(monday(new Date()).getTime()+7*864e5+36e5));
  const mark=(key,data)=>{
    const v=data[key];if(!known(v))return ['❓','Unknown'];
    if(key==='酒類販售資格'||key==='冷藏空間')return v==='是'?['✅','是']:['❌','否'];
    if(key==='Asahi是否覆蓋')return v==='否'?['✅','未覆蓋']:['❌','已覆蓋'];
    if(key==='DecisionMaker')return v==='尚未建立關係'?['❌',v]:['✅',v];
    return ['暫無意願','拒絕'].includes(v)?['❌',v]:['✅',v];
  };
  const nextOf=(r)=>{
    if(r.stage==='淘汰')return '—';
    if(r.stage==='試點候選')return '送核准者決定';
    const m={酒類販售資格:'確認酒類販售資格',冷藏空間:'確認冷藏空間',Asahi是否覆蓋:'確認 Asahi 是否已覆蓋',DecisionMaker:'找到決策者',Pilot意願:'詢問 Pilot 意願'};
    const miss=checks.find(([key])=>!known(r.data[key]));
    return miss?m[miss[0]]:'詢問 Pilot 意願';
  };
  const namesCell=(tr,list)=>{
    const td=document.createElement('td');
    if(!list.length){td.textContent='—';tr.appendChild(td);return;}
    const d=document.createElement('details'),sm=document.createElement('summary'),body=document.createElement('div');
    sm.textContent=`${list.length} 家`;body.className='pipe-names';body.textContent=list.map(r=>r.name).join('、');
    d.append(sm,body);if(list.length<=40)d.open=true;td.appendChild(d);tr.appendChild(td);
  };
  const noteSync=text=>{el('pipe-sync-note').textContent=text;};
  const render=()=>{
    const scopeTier=el('pipe-scope').value;
    const all=window.ASAHI_POOL_SNAPSHOT_ROWS.map(r=>({...r,data:q(r)})).map(r=>({...r,stage:stageOf(r.data)}));
    const weekly=window.asahiPoolWeekly?.all()||{};
    const rows=all.filter(r=>!scopeTier||r.tier===scopeTier).map(r=>({...r,plan:weekly[r.id]||{action:'',done:false,week:''}}));
    const total=rows.length,count=name=>rows.filter(r=>r.stage===name).length;
    el('pipe-date').textContent=new Date().toLocaleDateString('zh-TW');

    const wk=rows.filter(r=>r.plan.week===thisWeek&&r.plan.action),doneN=wk.filter(r=>r.plan.done).length;
    el('pipe-week-label').textContent=`會議週別：${thisWeek}　下週週別：${nextWeek}`;
    el('pipe-week-kpis').replaceChildren(...[['本週目標行動',wk.length],['本週已完成',doneN],['預計達成率',wk.length?`${(doneN/wk.length*100).toFixed(1)}%`:'—'],['待執行／待跟進',wk.length-doneN],['下週已排定',rows.filter(r=>r.plan.week===nextWeek&&r.plan.action).length]].map(kpi));

    const tierCount=t=>all.filter(r=>r.tier===t).length;
    el('pipe-potential-kpis').replaceChildren(...[['高潛力｜A 直接啤酒情境（店）',tierCount('A')],['中潛力｜B 搭餐優先（店）',tierCount('B')],['待確認｜C 先確認場景（店）',tierCount('C')]].map(kpi));
    const types=new Map();
    all.forEach(r=>{const k=`${r.tier}|${r.type||'店型未填'}`;const o=types.get(k)||{tier:r.tier,type:r.type||'店型未填（請複核）',n:0,adv:0,list:[]};o.n+=1;o.list.push(r);if(['通過','試點候選'].includes(r.stage))o.adv+=1;types.set(k,o);});
    const pot=el('pipe-potential');pot.replaceChildren();
    [...types.values()].sort((a,b)=>'ABC'.indexOf(a.tier)-'ABC'.indexOf(b.tier)||b.n-a.n).forEach(o=>{
      const tr=document.createElement('tr');cell(tr,o.type);cell(tr,`${potential[o.tier][0]}（${o.tier}）`,`pipe-pot ${potential[o.tier][1]}`);
      cell(tr,String(o.n),'num');cell(tr,`${(o.n/all.length*100).toFixed(1)}%`);cell(tr,String(o.adv),'num');namesCell(tr,o.list);pot.appendChild(tr);
    });

    el('pipe-kpis').replaceChildren(...[['範圍店數',total],['已開始查證',total-count('待查證')],['通過',count('通過')],['試點候選',count('試點候選')],['淘汰',count('淘汰')]].map(kpi));
    const reached=[total,total-count('待查證'),count('通過')+count('試點候選'),count('試點候選')];
    const labels=['範圍店數','已開始查證','通過資格','試點候選'];
    const funnel=el('pipe-funnel');funnel.replaceChildren();
    reached.forEach((n,i)=>{
      const row=document.createElement('div'),label=document.createElement('span'),bar=document.createElement('div'),fill=document.createElement('i'),num=document.createElement('strong'),conv=document.createElement('small');
      row.className='pipe-funnel-row';label.textContent=labels[i];bar.className='pipe-funnel-bar';
      fill.style.width=`${total?Math.max(n/total*100,n?2:0):0}%`;fill.className=`f${i}`;bar.appendChild(fill);
      num.textContent=`${n} 家`;
      conv.textContent=i===0?'100%':`佔範圍 ${total?(n/total*100).toFixed(1):0}%｜較上一層 ${reached[i-1]?(n/reached[i-1]*100).toFixed(1):'—'}%`;
      row.append(label,bar,num,conv);funnel.appendChild(row);
    });
    const dropped=document.createElement('div');dropped.className='pipe-funnel-drop';dropped.textContent=`淘汰：${count('淘汰')} 家（資格為否、Asahi 已覆蓋或無意願，不計入漏斗各層）`;funnel.appendChild(dropped);
    const board=el('pipe-board');board.replaceChildren();
    STAGES.forEach((name,i)=>{
      const col=document.createElement('section'),head=document.createElement('header'),h=document.createElement('strong'),n=document.createElement('span'),d=document.createElement('small'),chips=document.createElement('div');
      const list=rows.filter(r=>r.stage===name);
      col.className=`pipe-col stage-${i}`;h.textContent=name;n.textContent=`${list.length} 家`;d.textContent=defs[name];
      head.append(h,n,d);chips.className='pipe-chips';
      if(!list.length){const e=document.createElement('em');e.textContent='目前沒有店家';chips.appendChild(e);}
      list.forEach(r=>{const c=document.createElement('button');c.type='button';c.className='pipe-chip';c.title=`${r.type||'店型未填'}｜${r.city||''}`;c.textContent=r.name;c.addEventListener('click',()=>window.asahiPoolQualification?.open(r));chips.appendChild(c);});
      col.append(head,chips);board.appendChild(col);
    });
    const gaps=el('pipe-gaps');gaps.replaceChildren();
    const live=rows.filter(r=>r.stage!=='淘汰');
    checks.forEach(([key])=>{
      const tr=document.createElement('tr');
      cell(tr,{DecisionMaker:'決策者',Pilot意願:'Pilot 意願',Asahi是否覆蓋:'Asahi 未覆蓋'}[key]||key);
      cell(tr,String(live.filter(r=>!known(r.data[key])).length),'num');
      cell(tr,String(rows.filter(r=>known(r.data[key])&&mark(key,r.data)[0]==='❌').length),'num');
      gaps.appendChild(tr);
    });

    const order=name=>[3,2,1,0,4][STAGES.indexOf(name)];
    const onlyWeek=el('pipe-only-week').checked;
    let list=rows.filter(r=>!onlyWeek||(r.plan.action&&[thisWeek,nextWeek].includes(r.plan.week)));
    list=list.sort((a,b)=>order(a.stage)-order(b.stage)||'ABC'.indexOf(a.tier)-'ABC'.indexOf(b.tier)||a.sourceRow-b.sourceRow);
    const body=el('pipe-list');body.replaceChildren();
    const save=(r,patch,box)=>{
      noteSync('儲存中…');
      Promise.resolve(window.asahiPoolWeekly.set(r.id,patch)).then(res=>noteSync(res?.synced?'已儲存並同步共用表':'已儲存在此瀏覽器（連接共用表後才會同步）')).catch(err=>noteSync(`本機已儲存，但共用表同步失敗：${err.message}`));
    };
    list.slice(0,60).forEach(r=>{
      const tr=document.createElement('tr');
      const s=document.createElement('td'),badge=document.createElement('span');badge.className=`pool-stage-badge stage-${STAGES.indexOf(r.stage)}`;badge.textContent=r.stage;s.appendChild(badge);tr.appendChild(s);
      cell(tr,r.name);cell(tr,r.type||'店型未填');
      checks.forEach(([key])=>{const [icon,text]=mark(key,r.data);cell(tr,`${icon} ${text}`);});
      cell(tr,nextOf(r));
      const wkTd=document.createElement('td'),wsel=document.createElement('select');
      [['','未排定'],[thisWeek,'本週'],[nextWeek,'下週']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;wsel.appendChild(o);});
      wsel.value=[thisWeek,nextWeek].includes(r.plan.week)?r.plan.week:'';wkTd.appendChild(wsel);tr.appendChild(wkTd);
      const acTd=document.createElement('td'),asel=document.createElement('select');
      ['',...ACTIONS].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v||'—';asel.appendChild(o);});
      asel.value=r.plan.action;acTd.appendChild(asel);tr.appendChild(acTd);
      const dnTd=document.createElement('td'),box=document.createElement('input');box.type='checkbox';box.checked=!!r.plan.done;box.disabled=!r.plan.action;dnTd.appendChild(box);tr.appendChild(dnTd);
      wsel.addEventListener('change',()=>save(r,{week:wsel.value}));
      asel.addEventListener('change',()=>save(r,{action:asel.value,week:asel.value&&!wsel.value?thisWeek:wsel.value}));
      box.addEventListener('change',()=>save(r,{done:box.checked}));
      const act=document.createElement('td'),btn=document.createElement('button');btn.type='button';btn.className='link-button';btn.textContent='編輯資格';btn.addEventListener('click',()=>window.asahiPoolQualification?.open(r));act.appendChild(btn);tr.appendChild(act);
      body.appendChild(tr);
    });
    el('pipe-list-note').textContent=list.length>60?`僅顯示前 60 家（共 ${list.length} 家）。`:`共 ${list.length} 家`;
  };
  el('pipe-scope').addEventListener('change',render);
  el('pipe-only-week').addEventListener('change',render);
  window.addEventListener('asahi-pool-qualification-updated',render);
  window.addEventListener('asahi-pool-weekly-updated',render);
  render();
}
document.addEventListener('DOMContentLoaded',renderAsahiPipeline);
