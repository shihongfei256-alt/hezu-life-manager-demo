const seedExpenses=[
  {icon:'💡',name:'9 月电费',meta:'生活账单 · 9 月 10 日',payer:'林一',split:'4 人均摊',amount:268.4},
  {icon:'🧻',name:'厨房纸',meta:'共用品 · 9 月 9 日',payer:'许言',split:'4 人均摊',amount:24.8},
  {icon:'🏠',name:'9 月房租',meta:'住房 · 9 月 1 日',payer:'林一',split:'4 人均摊',amount:1960},
  {icon:'📶',name:'宽带月费',meta:'生活账单 · 9 月 1 日',payer:'周周',split:'4 人均摊',amount:128},
  {icon:'🧼',name:'清洁用品',meta:'共用品 · 8 月 30 日',payer:'阿哲',split:'4 人均摊',amount:105.2}
];
const seedChores=[
  {id:1,title:'清洁厨房',area:'台面、灶台和水槽',owner:'林一',avatar:'林',tone:'me',status:'待完成',due:'今天 22:00',done:false,overdue:false},
  {id:2,title:'倒垃圾',area:'厨房和卫生间',owner:'周周',avatar:'周',tone:'a',status:'已完成',due:'昨天 21:08',done:true,overdue:false},
  {id:3,title:'清洁卫生间',area:'镜面、台盆和地面',owner:'许言',avatar:'许',tone:'b',status:'明天轮值',due:'明天 20:00',done:false,overdue:false},
  {id:4,title:'拖客厅',area:'客厅和走廊',owner:'阿哲',avatar:'阿',tone:'c',status:'已逾期',due:'昨天 19:00',done:false,overdue:true},
  {id:5,title:'冰箱整理',area:'检查过期食物',owner:'林一',avatar:'林',tone:'me',status:'周日轮值',due:'周日 18:00',done:false,overdue:false},
  {id:6,title:'浇绿植',area:'客厅与阳台',owner:'周周',avatar:'周',tone:'a',status:'已完成',due:'周五 08:30',done:true,overdue:false}
];
const supplies=[
  {id:1,icon:'🧻',name:'卷纸',meta:'卫生间 · 还剩 1 卷',state:'快用完',low:true},
  {id:2,icon:'🧴',name:'洗洁精',meta:'厨房 · 约剩 10%',state:'快用完',low:true},
  {id:3,icon:'🗑️',name:'垃圾袋',meta:'厨房 · 还剩 2 卷',state:'充足'},
  {id:4,icon:'🧺',name:'洗衣液',meta:'阳台 · 约剩 60%',state:'充足'},
  {id:5,icon:'🧽',name:'海绵擦',meta:'厨房 · 新拆一包',state:'充足'},
  {id:6,icon:'🌾',name:'大米',meta:'厨房 · 约剩 4kg',state:'充足'}
];
const state={
  expenses:JSON.parse(localStorage.getItem('roomie-expenses')||'null')||seedExpenses,
  chores:JSON.parse(localStorage.getItem('roomie-chores')||'null')||seedChores,
  supplies:JSON.parse(localStorage.getItem('roomie-supplies')||'null')||supplies
};
const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money=n=>Number(n).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
function persist(){localStorage.setItem('roomie-expenses',JSON.stringify(state.expenses));localStorage.setItem('roomie-chores',JSON.stringify(state.chores));localStorage.setItem('roomie-supplies',JSON.stringify(state.supplies))}
function showToast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2400)}
function switchView(view){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`${view}-view`));document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.querySelector('#main-content').focus({preventScroll:true});window.scrollTo({top:0,behavior:'smooth'});history.replaceState(null,'',`#${view}`)}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
document.querySelectorAll('[data-view-jump]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.viewJump)));
function renderExpenses(){const list=document.querySelector('#expense-list');list.innerHTML=state.expenses.map(e=>`<article class="expense-row"><span class="expense-cat" aria-hidden="true">${e.icon}</span><div><b>${esc(e.name)}</b><small>${esc(e.meta)}</small></div><span>${esc(e.payer)} 先付</span><span>${esc(e.split)}</span><b class="amount">¥ ${money(e.amount)}</b></article>`).join('');document.querySelector('#expense-count').textContent=state.expenses.length}
function renderChores(){const board=document.querySelector('#chore-board');board.innerHTML=state.chores.map(c=>`<article class="chore-card ${c.done?'done':''} ${c.overdue&&!c.done?'overdue':''}"><span class="status-tag">${c.done?'已完成':esc(c.status)}</span><h3>${esc(c.title)}</h3><p>${esc(c.area)} · ${esc(c.due)}</p><div class="chore-foot"><span class="chore-owner"><span class="avatar ${c.tone}">${c.avatar}</span>${esc(c.owner)}</span><button class="check-btn" type="button" data-chore="${c.id}" aria-label="${c.done?'撤销完成':'完成'}${esc(c.title)}">${c.done?'✓':'○'}</button></div></article>`).join('');board.querySelectorAll('[data-chore]').forEach(b=>b.addEventListener('click',()=>toggleChore(Number(b.dataset.chore))));renderToday()}
function toggleChore(id){const c=state.chores.find(x=>x.id===id);c.done=!c.done;if(c.done)c.overdue=false;persist();renderChores();showToast(c.done?`${c.title}已完成，辛苦啦`:`已撤销${c.title}的完成状态`)}
function renderToday(){const mine=state.chores.filter(c=>c.owner==='林一'&&!c.done);const low=state.supplies.filter(s=>s.low&&!s.claimed);const tasks=[...mine.slice(0,2).map(c=>({symbol:'✓',title:c.title,meta:`家务 · ${c.due}`,urgent:c.overdue,action:'完成',id:c.id,type:'chore'})),...low.slice(0,1).map(s=>({symbol:'!',title:`${s.name}快用完了`,meta:s.meta,urgent:true,action:'我去买',id:s.id,type:'supply'}))];document.querySelector('#today-task-list').innerHTML=tasks.length?tasks.map(t=>`<article class="task-card ${t.urgent?'urgent':''}"><span class="task-symbol" aria-hidden="true">${t.symbol}</span><span class="task-copy"><b>${esc(t.title)}</b><small>${esc(t.meta)}</small></span><button class="task-action" type="button" data-type="${t.type}" data-id="${t.id}">${t.action}</button></article>`).join(''):'<div class="task-card"><span class="task-symbol">✓</span><span class="task-copy"><b>今天都处理完了</b><small>家里很顺利，去做自己的事吧</small></span></div>';document.querySelector('#todo-count').textContent=tasks.length;document.querySelector('#todo-count').hidden=!tasks.length;document.querySelectorAll('#today-task-list [data-type]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.type==='chore')toggleChore(Number(b.dataset.id));else claimSupply(Number(b.dataset.id))}));const done=state.chores.filter(c=>c.done).length;document.querySelector('#completion-rate').textContent=Math.round(done/state.chores.length*100);document.querySelector('#completion-copy').textContent=`本周 ${done} / ${state.chores.length} 项`}
function renderSupplies(){document.querySelector('#supply-grid').innerHTML=state.supplies.map(s=>`<article class="supply-card"><div class="supply-top"><span class="supply-icon" aria-hidden="true">${s.icon}</span><span class="stock ${s.low?'low':''} ${s.claimed?'buying':''}">${s.claimed?'采购中':s.state}</span></div><h3>${esc(s.name)}</h3><p>${esc(s.meta)}</p><button type="button" data-supply="${s.id}">${s.claimed?'标记已买到':s.low?'我去买':'标记快用完'}</button></article>`).join('');document.querySelectorAll('[data-supply]').forEach(b=>b.addEventListener('click',()=>supplyAction(Number(b.dataset.supply))));renderToday()}
function claimSupply(id){const s=state.supplies.find(x=>x.id===id);s.claimed=true;persist();renderSupplies();showToast(`已认领${s.name}，其他室友不会重复购买`)}
function supplyAction(id){const s=state.supplies.find(x=>x.id===id);if(s.claimed){s.claimed=false;s.low=false;s.state='充足';s.meta=s.meta.split(' · ')[0]+' · 刚刚补充';showToast(`${s.name}已补充`)}else if(s.low){s.claimed=true;showToast(`已认领${s.name}`)}else{s.low=true;s.state='快用完';showToast(`已提醒室友补充${s.name}`)}persist();renderSupplies()}
const dialog=document.querySelector('#expense-dialog');document.querySelectorAll('[data-open-expense]').forEach(b=>b.addEventListener('click',()=>{dialog.showModal();setTimeout(()=>document.querySelector('#expense-name').focus(),0)}));document.querySelector('#expense-form').addEventListener('submit',e=>{if(e.submitter?.value==='cancel')return; e.preventDefault();const form=new FormData(e.currentTarget),name=form.get('name').trim(),amount=Number(form.get('amount'));if(!name||!amount)return;state.expenses.unshift({icon:'🧾',name,meta:`共同费用 · 今天`,payer:form.get('payer'),split:'4 人均摊',amount});persist();renderExpenses();dialog.close();e.currentTarget.reset();showToast(`已记录${name}，每人 ¥${money(amount/4)}`)});
document.querySelectorAll('[data-settle]').forEach(b=>b.addEventListener('click',()=>{b.classList.add('settled');b.textContent='已结清';b.disabled=true;showToast('这笔账已结清')}));
document.querySelector('#add-chore').addEventListener('click',()=>showToast('Demo 中已展示核心家务流程'));
document.querySelector('#add-supply').addEventListener('click',()=>showToast('Demo 中可直接操作现有用品'));
const now=new Date();document.querySelector('#today-date').textContent=new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(now);renderExpenses();renderChores();renderSupplies();switchView(['today','expenses','chores','supplies'].includes(location.hash.slice(1))?location.hash.slice(1):'today');
