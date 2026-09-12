export const uid=(prefix='id')=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
export const yuan=cents=>(cents/100).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
export const toCents=value=>Math.round(Number(value)*100);

export function equalSplits(amountCents,memberIds){
  if(!Number.isInteger(amountCents)||amountCents<1||!memberIds.length)throw new Error('分摊参数无效');
  const base=Math.floor(amountCents/memberIds.length),remainder=amountCents-base*memberIds.length;
  return memberIds.map((memberId,index)=>({memberId,amountCents:base+(index<remainder?1:0)}));
}

export function weightedSplits(amountCents,memberIds,weights){
  const values=memberIds.map(id=>Number(weights[id]||0));
  const total=values.reduce((sum,n)=>sum+n,0);
  if(total<=0)throw new Error('分摊权重必须大于 0');
  const raw=values.map(n=>amountCents*n/total);
  const floors=raw.map(Math.floor);
  let remainder=amountCents-floors.reduce((sum,n)=>sum+n,0);
  const order=raw.map((n,i)=>({i,f:n-floors[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
  for(let i=0;i<remainder;i++)floors[order[i].i]++;
  return memberIds.map((memberId,index)=>({memberId,amountCents:floors[index]}));
}

export function customAmountSplits(amountCents,memberIds,amounts){
  const splits=memberIds.map(memberId=>({memberId,amountCents:toCents(amounts[memberId]||0)}));
  if(splits.some(s=>s.amountCents<0)||splits.reduce((sum,s)=>sum+s.amountCents,0)!==amountCents)throw new Error('自定义金额之和必须等于费用金额');
  return splits;
}

export function buildSplits(amountCents,memberIds,mode,values={}){
  if(mode==='amount')return customAmountSplits(amountCents,memberIds,values);
  if(mode==='ratio'||mode==='shares')return weightedSplits(amountCents,memberIds,values);
  return equalSplits(amountCents,memberIds);
}

export function calculateBalances(state){
  const balances=Object.fromEntries(state.members.filter(m=>m.status==='active').map(m=>[m.id,0]));
  state.expenses.filter(e=>e.status!=='void').forEach(expense=>{
    expense.splits.forEach(split=>{
      if(split.memberId===expense.payerId)return;
      balances[split.memberId]=(balances[split.memberId]||0)-split.amountCents;
      balances[expense.payerId]=(balances[expense.payerId]||0)+split.amountCents;
    });
  });
  state.settlements.filter(s=>s.status==='active').forEach(settlement=>{
    balances[settlement.fromMemberId]=(balances[settlement.fromMemberId]||0)+settlement.amountCents;
    balances[settlement.toMemberId]=(balances[settlement.toMemberId]||0)-settlement.amountCents;
  });
  const total=Object.values(balances).reduce((sum,n)=>sum+n,0);
  if(total!==0)throw new Error(`余额不守恒：${total}`);
  return balances;
}

export function suggestTransfers(balances){
  const debtors=Object.entries(balances).filter(([,n])=>n<0).map(([id,n])=>({id,amount:-n})).sort((a,b)=>b.amount-a.amount);
  const creditors=Object.entries(balances).filter(([,n])=>n>0).map(([id,n])=>({id,amount:n})).sort((a,b)=>b.amount-a.amount);
  const transfers=[];let i=0,j=0;
  while(i<debtors.length&&j<creditors.length){
    const amount=Math.min(debtors[i].amount,creditors[j].amount);
    if(amount>0)transfers.push({fromMemberId:debtors[i].id,toMemberId:creditors[j].id,amountCents:amount});
    debtors[i].amount-=amount;creditors[j].amount-=amount;
    if(debtors[i].amount===0)i++;if(creditors[j].amount===0)j++;
  }
  return transfers;
}

export function expenseStatus(expense,state){
  if(expense.status==='void')return '已作废';
  const involved=expense.splits.filter(s=>s.memberId!==expense.payerId).reduce((sum,s)=>sum+s.amountCents,0);
  const settled=state.settlements.filter(s=>s.status==='active'&&s.expenseId===expense.id).reduce((sum,s)=>sum+s.amountCents,0);
  if(settled<=0)return '待结算';
  if(settled>=involved)return '已结清';
  return '部分结算';
}

export function activeMonthExpenses(state){
  const now=new Date();
  return state.expenses.filter(e=>e.status!=='void'&&new Date(e.occurredAt).getFullYear()===now.getFullYear()&&new Date(e.occurredAt).getMonth()===now.getMonth());
}

export function monthMetrics(state,currentMemberId){
  const monthExpenses=activeMonthExpenses(state);
  const completed=state.chores.filter(c=>c.status==='completed').length;
  const included=state.chores.filter(c=>c.status!=='skipped').length||1;
  return {
    expenseCents:monthExpenses.reduce((sum,e)=>sum+e.amountCents,0),
    balanceCents:calculateBalances(state)[currentMemberId]||0,
    choreRate:Math.round(completed/included*100),
    choreCopy:`本周 ${completed} / ${included} 项`,
    replenished:state.purchases.filter(p=>p.status==='stocked').length
  };
}

export function transitionSupply(supply,action,currentMemberId){
  const allowed={sufficient:['markLow'],low:['claim','restore'],purchasing:['cancel','bought'],bought:['stock']};
  if(!allowed[supply.status]?.includes(action))throw new Error('当前状态不能执行此操作');
  if(action==='markLow')supply.status='low';
  if(action==='restore')supply.status='sufficient';
  if(action==='claim'){supply.status='purchasing';supply.claimedBy=currentMemberId;supply.claimedAt=new Date().toISOString();}
  if(action==='cancel'){supply.status='low';supply.claimedBy=null;supply.claimedAt=null;}
  if(action==='bought')supply.status='bought';
  if(action==='stock'){supply.status='sufficient';supply.claimedBy=null;supply.claimedAt=null;supply.lastRestockedAt=new Date().toISOString();}
  return supply;
}
