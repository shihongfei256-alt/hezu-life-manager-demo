import{uid,equalSplits,getSupplyStatus}from'./domain.mjs';
export const STORAGE_KEY='hezu-life-manager:v3:state';
export const BACKUP_KEY='hezu-life-manager:v3:backup';
const V2_KEY='hezu-life-manager:v2:state',V2_BACKUP='hezu-life-manager:v2:backup';
const now=new Date();
const iso=(days=0,hour=20)=>{const date=new Date(now);date.setDate(date.getDate()+days);date.setHours(hour,0,0,0);return date.toISOString()};
const expense=(id,title,amountCents,payerId,participants,category,days=0)=>({id,houseId:'house_1',title,amountCents,occurredAt:iso(days,18),payerId,participantIds:participants,splits:equalSplits(amountCents,participants),splitMode:'equal',category,status:'pending',note:'',createdBy:payerId,createdAt:iso(days,18)});
const rotations=['m1','m2','m3','m4'];

export function seedState(){return{
  schemaVersion:3,
  session:{currentHouseId:'house_1',currentMemberId:'m1'},
  houses:[{id:'house_1',name:'梧桐里 3B',createdAt:iso(-120),adminMemberId:'m1'}],
  members:[
    {id:'m1',houseId:'house_1',displayName:'林一',avatar:'林',tone:'me',role:'admin',status:'active',joinedAt:iso(-120)},
    {id:'m2',houseId:'house_1',displayName:'周周',avatar:'周',tone:'a',role:'member',status:'active',joinedAt:iso(-110)},
    {id:'m3',houseId:'house_1',displayName:'许言',avatar:'许',tone:'b',role:'member',status:'active',joinedAt:iso(-100)},
    {id:'m4',houseId:'house_1',displayName:'阿哲',avatar:'阿',tone:'c',role:'member',status:'active',joinedAt:iso(-90)}
  ],
  expenses:[
    expense('e1','9 月房租',196000,'m1',rotations,'住房',-11),
    expense('e2','9 月电费',26840,'m1',rotations,'账单',-2),
    expense('e3','厨房纸',2480,'m3',rotations,'共用品',-3),
    expense('e4','宽带月费',12800,'m2',rotations,'账单',-11),
    expense('e5','清洁用品',10520,'m4',rotations,'共用品',-13)
  ],
  settlements:[{id:'st1',houseId:'house_1',fromMemberId:'m3',toMemberId:'m1',amountCents:5000,settledAt:iso(-1),createdBy:'m3',status:'active',note:'微信转账'}],
  settlementAllocations:[{id:'sa1',settlementId:'st1',expenseId:'e1',memberId:'m3',amountCents:5000}],
  choreTemplates:[
    {id:'ct1',houseId:'house_1',title:'清洁厨房',area:'台面、灶台和水槽',cadence:'每周',rotationOrder:rotations,active:true},
    {id:'ct2',houseId:'house_1',title:'倒垃圾',area:'厨房和卫生间',cadence:'每两天',rotationOrder:rotations,active:true},
    {id:'ct3',houseId:'house_1',title:'清洁卫生间',area:'镜面、台盆和地面',cadence:'每周',rotationOrder:rotations,active:true},
    {id:'ct4',houseId:'house_1',title:'拖客厅',area:'客厅和走廊',cadence:'每周',rotationOrder:rotations,active:true},
    {id:'ct5',houseId:'house_1',title:'冰箱整理',area:'检查过期食物',cadence:'每周',rotationOrder:rotations,active:true},
    {id:'ct6',houseId:'house_1',title:'浇绿植',area:'客厅与阳台',cadence:'每三天',rotationOrder:rotations,active:true}
  ],
  chores:[
    {id:'c1',houseId:'house_1',templateId:'ct1',title:'清洁厨房',area:'台面、灶台和水槽',assigneeId:'m1',dueAt:iso(0,22),status:'pending',cadence:'每周'},
    {id:'c2',houseId:'house_1',templateId:'ct2',title:'倒垃圾',area:'厨房和卫生间',assigneeId:'m2',dueAt:iso(-1,21),status:'completed',completedBy:'m2',completedAt:iso(-1,21),cadence:'每两天'},
    {id:'c3',houseId:'house_1',templateId:'ct3',title:'清洁卫生间',area:'镜面、台盆和地面',assigneeId:'m3',dueAt:iso(1,20),status:'pending',cadence:'每周'},
    {id:'c4',houseId:'house_1',templateId:'ct4',title:'拖客厅',area:'客厅和走廊',assigneeId:'m4',dueAt:iso(-1,19),status:'pending',cadence:'每周'},
    {id:'c5',houseId:'house_1',templateId:'ct5',title:'冰箱整理',area:'检查过期食物',assigneeId:'m1',dueAt:iso(1,18),status:'pending',cadence:'每周'},
    {id:'c6',houseId:'house_1',templateId:'ct6',title:'浇绿植',area:'客厅与阳台',assigneeId:'m2',dueAt:iso(-1,8),status:'completed',completedBy:'m2',completedAt:iso(-1,8),cadence:'每三天'}
  ],
  supplies:[
    {id:'s1',houseId:'house_1',name:'卷纸',icon:'🧻',category:'清洁',location:'卫生间',unit:'卷',quantity:1,threshold:2,capacity:12,stockMode:'quantity',status:'low',lastRestockedAt:iso(-16)},
    {id:'s2',houseId:'house_1',name:'洗洁精',icon:'🧴',category:'清洁',location:'厨房',unit:'瓶',quantity:10,threshold:20,capacity:100,stockMode:'estimate',status:'low',lastRestockedAt:iso(-28)},
    {id:'s3',houseId:'house_1',name:'垃圾袋',icon:'🗑️',category:'清洁',location:'厨房',unit:'卷',quantity:2,threshold:1,capacity:6,stockMode:'quantity',status:'sufficient',lastRestockedAt:iso(-7)},
    {id:'s4',houseId:'house_1',name:'洗衣液',icon:'🫧',category:'清洁',location:'阳台',unit:'瓶',quantity:60,threshold:20,capacity:100,stockMode:'estimate',status:'sufficient',lastRestockedAt:iso(-9)},
    {id:'s5',houseId:'house_1',name:'海绵擦',icon:'🧽',category:'清洁',location:'厨房',unit:'包',quantity:1,threshold:1,capacity:4,stockMode:'quantity',status:'low',lastRestockedAt:iso(-3)},
    {id:'s6',houseId:'house_1',name:'大米',icon:'🍚',category:'食品',location:'厨房',unit:'kg',quantity:4,threshold:1,capacity:5,stockMode:'quantity',status:'sufficient',lastRestockedAt:iso(-12)}
  ],
  purchases:[{id:'p1',houseId:'house_1',supplyId:'s1',buyerId:'m3',quantityPurchased:6,amountCents:2480,purchasedAt:iso(-3,18),stockedAt:iso(-3,18),status:'stocked',createExpense:true,linkedExpenseId:'e3'}],
  inventoryEvents:[{id:'ie1',houseId:'house_1',supplyId:'s1',type:'restock',change:6,before:0,after:6,actorId:'m3',createdAt:iso(-3,18)}],
  rules:[
    {id:'r1',houseId:'house_1',title:'安静时间',body:'工作日 23:00 后请降低音量；临时聚会提前在群里说一声。',version:2,effectiveAt:iso(-5),status:'published',createdBy:'m1',acknowledgedBy:['m1','m2','m3'],versions:[{version:1,body:'工作日 23:00 后请降低音量。',effectiveAt:iso(-50),publishedAt:iso(-55)},{version:2,body:'工作日 23:00 后请降低音量；临时聚会提前在群里说一声。',effectiveAt:iso(-5),publishedAt:iso(-7)}]},
    {id:'r2',houseId:'house_1',title:'共同费用',body:'公共支出当天记账，单笔超过 200 元先征求室友意见。',version:1,effectiveAt:iso(-20),status:'published',createdBy:'m1',acknowledgedBy:rotations,versions:[{version:1,body:'公共支出当天记账，单笔超过 200 元先征求室友意见。',effectiveAt:iso(-20),publishedAt:iso(-22)}]}
  ],
  notifications:[
    {id:'n1',houseId:'house_1',memberId:'m1',type:'rule',entityId:'r1',title:'确认新版安静时间',status:'unread',createdAt:iso(-4)},
    {id:'n2',houseId:'house_1',memberId:'m1',type:'chore',entityId:'c1',title:'今晚 22:00 前清洁厨房',status:'unread',createdAt:iso(0,9)},
    {id:'n3',houseId:'house_1',memberId:'m2',type:'expense',entityId:'e2',title:'9 月电费待结算',status:'unread',createdAt:iso(-2,18)}
  ],
  activities:[
    {id:'a1',houseId:'house_1',actorId:'m3',action:'购买',entityType:'supply',entityId:'s1',summary:'买了厨房纸，共同费用 ¥24.80',createdAt:iso(-3,18)},
    {id:'a2',houseId:'house_1',actorId:'m2',action:'完成',entityType:'chore',entityId:'c2',summary:'完成了倒垃圾',createdAt:iso(-1,21)},
    {id:'a3',houseId:'house_1',actorId:'m1',action:'创建',entityType:'expense',entityId:'e2',summary:'记录了 9 月电费 ¥268.40',createdAt:iso(-2,18)}
  ]
}}

function allocateExistingSettlements(state){
  state.settlementAllocations??=[];const already=new Set(state.settlementAllocations.map(item=>item.settlementId));
  state.settlements.filter(item=>item.status==='active'&&!already.has(item.id)).forEach(settlement=>{
    let remaining=settlement.amountCents;
    const expenses=state.expenses.filter(expense=>expense.status!=='void'&&expense.payerId===settlement.toMemberId&&expense.splits.some(split=>split.memberId===settlement.fromMemberId)).sort((a,b)=>new Date(a.occurredAt)-new Date(b.occurredAt));
    for(const expense of expenses){if(!remaining)break;const split=expense.splits.find(item=>item.memberId===settlement.fromMemberId);if(!split||split.memberId===expense.payerId)continue;const used=state.settlementAllocations.filter(item=>item.expenseId===expense.id&&item.memberId===settlement.fromMemberId).reduce((sum,item)=>sum+item.amountCents,0),amount=Math.min(remaining,Math.max(0,split.amountCents-used));if(amount){state.settlementAllocations.push({id:uid('sa'),settlementId:settlement.id,expenseId:expense.id,memberId:settlement.fromMemberId,amountCents:amount});remaining-=amount}}
  })
}

export function normalizeState(input){
  if(!input||!Array.isArray(input.members)||!Array.isArray(input.expenses))throw new Error('备份文件缺少成员或费用数据');
  const state=input,currentHouseId=state.session?.currentHouseId||state.houses?.[0]?.id||'house_1';state.schemaVersion=3;state.session??={currentHouseId,currentMemberId:state.members[0]?.id};state.session.currentHouseId=currentHouseId;
  ['settlements','settlementAllocations','chores','choreTemplates','supplies','purchases','inventoryEvents','rules','notifications','activities'].forEach(key=>state[key]??=[]);
  const addHouse=item=>{item.houseId??=currentHouseId;return item};state.members.forEach(addHouse);state.expenses.forEach(addHouse);state.settlements.forEach(addHouse);state.supplies.forEach(addHouse);state.purchases.forEach(addHouse);state.inventoryEvents.forEach(addHouse);state.notifications.forEach(addHouse);state.activities.forEach(addHouse);if(!state.members.some(member=>member.id===state.session.currentMemberId&&member.status==='active'&&member.houseId===currentHouseId))state.session.currentMemberId=state.members.find(member=>member.status==='active'&&member.houseId===currentHouseId)?.id;
  state.chores.forEach(chore=>{addHouse(chore);if(chore.status==='overdue')chore.status='pending';chore.cadence??='一次性'});
  const templateIds=new Set(state.choreTemplates.map(item=>item.id));state.chores.forEach(chore=>{if(!templateIds.has(chore.templateId)){state.choreTemplates.push({id:chore.templateId||uid('ct'),houseId:currentHouseId,title:chore.title,area:chore.area,cadence:chore.cadence,rotationOrder:state.members.filter(member=>member.status==='active').map(member=>member.id),active:true});chore.templateId=state.choreTemplates.at(-1).id;templateIds.add(chore.templateId)}});
  state.supplies.forEach(supply=>{supply.capacity??=supply.stockMode==='estimate'?100:Math.max(Number(supply.quantity)||1,(Number(supply.threshold)||0)*4);if(supply.status==='bought')supply.status='purchasing';supply.status=getSupplyStatus(supply)});
  state.purchases.forEach(purchase=>{purchase.houseId??=currentHouseId;purchase.purchasedAt??=purchase.completedAt||purchase.claimedAt||new Date().toISOString();purchase.stockedAt??=purchase.status==='stocked'?purchase.completedAt||purchase.purchasedAt:null;purchase.quantityPurchased??=1});
  state.rules.forEach(rule=>{rule.versions??=[{version:rule.version||1,body:rule.body,effectiveAt:rule.effectiveAt,publishedAt:rule.effectiveAt}];rule.acknowledgedBy??=[]});allocateExistingSettlements(state);return state;
}

function legacyToV3(){
  const state=seedState(),oldExpenses=localStorage.getItem('roomie-expenses'),oldChores=localStorage.getItem('roomie-chores'),oldSupplies=localStorage.getItem('roomie-supplies');if(!oldExpenses&&!oldChores&&!oldSupplies)return state;
  try{localStorage.setItem('hezu-life-manager:v1:backup',JSON.stringify({expenses:oldExpenses,chores:oldChores,supplies:oldSupplies,backedUpAt:new Date().toISOString()}));
    if(oldExpenses){const data=JSON.parse(oldExpenses);if(Array.isArray(data))state.expenses=data.map((item,index)=>expense(uid('e'),String(item.name||`历史费用 ${index+1}`).trim(),Math.max(1,Math.round(Number(item.amount||0)*100)),state.members.find(member=>member.displayName===item.payer)?.id||'m1',rotations,item.category||'其他',-30))}
    if(oldChores){const data=JSON.parse(oldChores);if(Array.isArray(data))data.forEach((item,index)=>{const templateId=uid('ct'),title=String(item.title||item.name||`历史家务 ${index+1}`).trim();state.choreTemplates.push({id:templateId,houseId:'house_1',title,area:item.area||'公共区域',cadence:item.cadence||'一次性',rotationOrder:rotations,active:true});state.chores.push({id:uid('c'),houseId:'house_1',templateId,title,area:item.area||'公共区域',assigneeId:item.assigneeId||'m1',dueAt:item.dueAt||iso(0),status:item.completed?'completed':'pending',cadence:item.cadence||'一次性'})})}
    if(oldSupplies){const data=JSON.parse(oldSupplies);if(Array.isArray(data))data.forEach((item,index)=>state.supplies.push({id:uid('s'),houseId:'house_1',name:String(item.name||`历史用品 ${index+1}`).trim(),icon:item.icon||'📦',category:item.category||'其他',location:item.location||'公共区域',unit:item.unit||'件',quantity:Number(item.quantity)||0,threshold:Number(item.threshold)||1,capacity:Number(item.capacity)||10,stockMode:'quantity',status:Number(item.quantity)<=0?'depleted':Number(item.quantity)<=Number(item.threshold||1)?'low':'sufficient',lastRestockedAt:item.lastRestockedAt||iso(-30)}))}
  }catch(error){state.migrationWarning='检测到旧数据，但部分迁移失败；原始数据已保留。'}return state;
}

const parse=value=>normalizeState(JSON.parse(value));
export function loadState(){
  try{const temp=localStorage.getItem(`${STORAGE_KEY}:temp`);if(temp){const recovered=parse(temp);localStorage.setItem(STORAGE_KEY,temp);localStorage.removeItem(`${STORAGE_KEY}:temp`);recovered.migrationWarning='检测到未完成的保存，已恢复最近数据。';return recovered}
    const raw=localStorage.getItem(STORAGE_KEY);if(raw)return parse(raw);const old=localStorage.getItem(V2_KEY);if(old){localStorage.setItem(V2_BACKUP,old);const migrated=parse(old);migrated.migrationWarning='旧版数据已安全升级到 v3。';return migrated}return legacyToV3();
  }catch(error){try{const backup=localStorage.getItem(BACKUP_KEY)||localStorage.getItem(V2_BACKUP);if(backup){const recovered=parse(backup);recovered.migrationWarning='主数据异常，已恢复最近备份。';return recovered}}catch{}const fallback=seedState();fallback.migrationWarning='本地数据无法读取，已载入示例数据。';return fallback}
}
export function saveState(state){const serialized=JSON.stringify(normalizeState(state));JSON.parse(serialized);const previous=localStorage.getItem(STORAGE_KEY);if(previous)localStorage.setItem(BACKUP_KEY,previous);localStorage.setItem(`${STORAGE_KEY}:temp`,serialized);localStorage.setItem(STORAGE_KEY,serialized);localStorage.removeItem(`${STORAGE_KEY}:temp`)}
export function parseImportedState(raw){return normalizeState(JSON.parse(raw))}
export function resetState(){Object.keys(localStorage).filter(key=>key.startsWith('hezu-life-manager:')||key.startsWith('roomie-')).forEach(key=>localStorage.removeItem(key));return seedState()}
