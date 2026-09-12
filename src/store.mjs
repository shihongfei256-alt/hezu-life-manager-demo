import{uid,equalSplits}from'./domain.mjs';
export const STORAGE_KEY='hezu-life-manager:v2:state';
export const BACKUP_KEY='hezu-life-manager:v2:backup';
const now=new Date();
const iso=(days=0,hour=20)=>{const d=new Date(now);d.setDate(d.getDate()+days);d.setHours(hour,0,0,0);return d.toISOString()};
const expense=(id,title,amountCents,payerId,participants,category,days=0)=>({id,houseId:'house_1',title,amountCents,occurredAt:iso(days,18),payerId,participantIds:participants,splits:equalSplits(amountCents,participants),splitMode:'equal',category,status:'pending',note:'',createdBy:payerId,createdAt:iso(days,18)});
export function seedState(){return{
  schemaVersion:2,
  session:{currentHouseId:'house_1',currentMemberId:'m1'},
  houses:[{id:'house_1',name:'梧桐里 3B',createdAt:iso(-120),adminMemberId:'m1'}],
  members:[
    {id:'m1',houseId:'house_1',displayName:'林一',avatar:'林',tone:'me',role:'admin',status:'active',joinedAt:iso(-120)},
    {id:'m2',houseId:'house_1',displayName:'周周',avatar:'周',tone:'a',role:'member',status:'active',joinedAt:iso(-110)},
    {id:'m3',houseId:'house_1',displayName:'许言',avatar:'许',tone:'b',role:'member',status:'active',joinedAt:iso(-100)},
    {id:'m4',houseId:'house_1',displayName:'阿哲',avatar:'阿',tone:'c',role:'member',status:'active',joinedAt:iso(-90)}
  ],
  expenses:[
    expense('e1','9 月房租',196000,'m1',['m1','m2','m3','m4'],'住房',-11),
    expense('e2','9 月电费',26840,'m1',['m1','m2','m3','m4'],'账单',-2),
    expense('e3','厨房纸',2480,'m3',['m1','m2','m3','m4'],'共用品',-3),
    expense('e4','宽带月费',12800,'m2',['m1','m2','m3','m4'],'账单',-11),
    expense('e5','清洁用品',10520,'m4',['m1','m2','m3','m4'],'共用品',-13)
  ],
  settlements:[
    {id:'st1',houseId:'house_1',fromMemberId:'m3',toMemberId:'m1',amountCents:5000,settledAt:iso(-1),createdBy:'m1',status:'active',note:'微信转账'}
  ],
  chores:[
    {id:'c1',templateId:'ct1',title:'清洁厨房',area:'台面、灶台和水槽',assigneeId:'m1',dueAt:iso(0,22),status:'pending',cadence:'每周',nextAssigneeId:'m2'},
    {id:'c2',templateId:'ct2',title:'倒垃圾',area:'厨房和卫生间',assigneeId:'m2',dueAt:iso(-1,21),status:'completed',completedBy:'m2',completedAt:iso(-1,21),cadence:'每两天',nextAssigneeId:'m3'},
    {id:'c3',templateId:'ct3',title:'清洁卫生间',area:'镜面、台盆和地面',assigneeId:'m3',dueAt:iso(1,20),status:'pending',cadence:'每周',nextAssigneeId:'m4'},
    {id:'c4',templateId:'ct4',title:'拖客厅',area:'客厅和走廊',assigneeId:'m4',dueAt:iso(-1,19),status:'overdue',cadence:'每周',nextAssigneeId:'m1'},
    {id:'c5',templateId:'ct5',title:'冰箱整理',area:'检查过期食物',assigneeId:'m1',dueAt:iso(1,18),status:'pending',cadence:'每周',nextAssigneeId:'m2'},
    {id:'c6',templateId:'ct6',title:'浇绿植',area:'客厅与阳台',assigneeId:'m2',dueAt:iso(-1,8),status:'completed',completedBy:'m2',completedAt:iso(-1,8),cadence:'每三天',nextAssigneeId:'m3'}
  ],
  supplies:[
    {id:'s1',houseId:'house_1',name:'卷纸',icon:'box',category:'清洁',location:'卫生间',unit:'卷',quantity:1,threshold:2,stockMode:'quantity',status:'low',lastRestockedAt:iso(-16)},
    {id:'s2',houseId:'house_1',name:'洗洁精',icon:'box',category:'清洁',location:'厨房',unit:'瓶',quantity:10,threshold:20,stockMode:'estimate',status:'low',lastRestockedAt:iso(-28)},
    {id:'s3',houseId:'house_1',name:'垃圾袋',icon:'box',category:'清洁',location:'厨房',unit:'卷',quantity:2,threshold:1,stockMode:'quantity',status:'sufficient',lastRestockedAt:iso(-7)},
    {id:'s4',houseId:'house_1',name:'洗衣液',icon:'box',category:'清洁',location:'阳台',unit:'瓶',quantity:60,threshold:20,stockMode:'estimate',status:'sufficient',lastRestockedAt:iso(-9)},
    {id:'s5',houseId:'house_1',name:'海绵擦',icon:'box',category:'清洁',location:'厨房',unit:'包',quantity:1,threshold:1,stockMode:'quantity',status:'sufficient',lastRestockedAt:iso(-3)},
    {id:'s6',houseId:'house_1',name:'大米',icon:'box',category:'食品',location:'厨房',unit:'kg',quantity:4,threshold:1,stockMode:'quantity',status:'sufficient',lastRestockedAt:iso(-12)}
  ],
  purchases:[],
  rules:[
    {id:'r1',houseId:'house_1',title:'安静时间',body:'工作日 23:00 后请降低音量；临时聚会提前在群里说一声。',version:2,effectiveAt:iso(-5),status:'published',createdBy:'m1',acknowledgedBy:['m1','m2','m3']},
    {id:'r2',houseId:'house_1',title:'共同费用',body:'公共支出当天记账，单笔超过 200 元先征求室友意见。',version:1,effectiveAt:iso(-20),status:'published',createdBy:'m1',acknowledgedBy:['m1','m2','m3','m4']}
  ],
  notifications:[
    {id:'n1',memberId:'m1',type:'rule',entityId:'r1',title:'确认新版安静时间',status:'unread',createdAt:iso(-4)},
    {id:'n2',memberId:'m1',type:'chore',entityId:'c1',title:'今晚 22:00 前清洁厨房',status:'unread',createdAt:iso(0,9)}
  ],
  activities:[
    {id:'a1',actorId:'m3',action:'购买',entityType:'supply',entityId:'s1',summary:'买了厨房纸，共同费用 ¥24.80',createdAt:iso(0,18)},
    {id:'a2',actorId:'m2',action:'完成',entityType:'chore',entityId:'c2',summary:'完成了倒垃圾',createdAt:iso(-1,21)},
    {id:'a3',actorId:'m1',action:'创建',entityType:'expense',entityId:'e2',summary:'记录了 9 月电费 ¥268.40',createdAt:iso(-2,18)}
  ]
}}

function legacyToV2(){
  const state=seedState(),oldExpenses=localStorage.getItem('roomie-expenses'),oldChores=localStorage.getItem('roomie-chores'),oldSupplies=localStorage.getItem('roomie-supplies');
  if(!oldExpenses&&!oldChores&&!oldSupplies)return state;
  try{
    localStorage.setItem('hezu-life-manager:v1:backup',JSON.stringify({expenses:oldExpenses,chores:oldChores,supplies:oldSupplies,backedUpAt:new Date().toISOString()}));
    if(oldExpenses){const data=JSON.parse(oldExpenses);if(Array.isArray(data))state.expenses=data.map((e,i)=>expense(uid('e'),e.name||`历史费用 ${i+1}`,Math.max(1,Math.round(Number(e.amount||0)*100)),state.members.find(m=>m.displayName===e.payer)?.id||'m1',state.members.map(m=>m.id),e.category||'其他',-30));}
  }catch(error){state.migrationWarning='检测到旧数据，但迁移失败；原始数据已保留。'}
  return state;
}

export function loadState(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return legacyToV2();const state=JSON.parse(raw);if(state.schemaVersion!==2||!Array.isArray(state.members))throw new Error('unsupported');return state}catch(error){
    try{const backup=localStorage.getItem(BACKUP_KEY);if(backup)return JSON.parse(backup)}catch{}
    const fallback=seedState();fallback.migrationWarning='本地数据无法读取，已载入示例数据。';return fallback;
  }
}
export function saveState(state){
  const serialized=JSON.stringify(state);JSON.parse(serialized);
  const previous=localStorage.getItem(STORAGE_KEY);if(previous)localStorage.setItem(BACKUP_KEY,previous);
  localStorage.setItem(`${STORAGE_KEY}:temp`,serialized);localStorage.setItem(STORAGE_KEY,serialized);localStorage.removeItem(`${STORAGE_KEY}:temp`);
}
export function resetState(){Object.keys(localStorage).filter(k=>k.startsWith('hezu-life-manager:')||k.startsWith('roomie-')).forEach(k=>localStorage.removeItem(k));return seedState()}
