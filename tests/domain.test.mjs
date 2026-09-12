import test from'node:test';
import assert from'node:assert/strict';
import{equalSplits,buildSplits,calculateBalances,suggestTransfers}from'../dist/domain.mjs';

test('100 元三人均分保持金额守恒且余数稳定',()=>{
  const splits=equalSplits(10000,['a','b','c']);
  assert.deepEqual(splits.map(s=>s.amountCents),[3334,3333,3333]);
  assert.equal(splits.reduce((n,s)=>n+s.amountCents,0),10000);
});

test('按份数分摊保持金额守恒',()=>{
  const splits=buildSplits(9999,['a','b','c'],'shares',{a:1,b:2,c:3});
  assert.equal(splits.reduce((n,s)=>n+s.amountCents,0),9999);
  assert.deepEqual(splits.map(s=>s.amountCents),[1667,3333,4999]);
});

test('费用和结算后的全屋净余额始终为零',()=>{
  const state={members:[{id:'a',status:'active'},{id:'b',status:'active'},{id:'c',status:'active'}],expenses:[{status:'pending',payerId:'a',splits:equalSplits(10000,['a','b','c'])}],settlements:[{status:'active',fromMemberId:'b',toMemberId:'a',amountCents:1000}]};
  const balances=calculateBalances(state);
  assert.equal(Object.values(balances).reduce((n,v)=>n+v,0),0);
  assert.deepEqual(balances,{a:5666,b:-2333,c:-3333});
});

test('建议转账覆盖全部债务',()=>{
  const transfers=suggestTransfers({a:6000,b:-2500,c:-3500});
  assert.equal(transfers.reduce((n,t)=>n+t.amountCents,0),6000);
  assert.equal(transfers.length,2);
});
