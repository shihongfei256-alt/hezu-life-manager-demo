import test,{beforeEach}from'node:test';
import assert from'node:assert/strict';
import{STORAGE_KEY,BACKUP_KEY,seedState,loadState,saveState,parseImportedState}from'../dist/store.mjs';

class MemoryStorage{constructor(){this.data=new Map()}getItem(key){return this.data.has(key)?this.data.get(key):null}setItem(key,value){this.data.set(String(key),String(value))}removeItem(key){this.data.delete(key)}key(index){return[...this.data.keys()][index]??null}get length(){return this.data.size}}
globalThis.localStorage=new MemoryStorage();
beforeEach(()=>{globalThis.localStorage=new MemoryStorage()});

test('saveState 保存主数据并在再次保存时生成备份',()=>{const first=seedState();saveState(first);assert.ok(localStorage.getItem(STORAGE_KEY));first.houses[0].name='新房屋';saveState(first);assert.ok(localStorage.getItem(BACKUP_KEY));assert.equal(JSON.parse(localStorage.getItem(BACKUP_KEY)).houses[0].name,'梧桐里 3B')});
test('loadState 可从未完成的 temp 保存恢复',()=>{const data=seedState();data.houses[0].name='崩溃前数据';localStorage.setItem(`${STORAGE_KEY}:temp`,JSON.stringify(data));const loaded=loadState();assert.equal(loaded.houses[0].name,'崩溃前数据');assert.equal(localStorage.getItem(`${STORAGE_KEY}:temp`),null)});
test('v2 数据自动迁移 settlement allocation 与业务数组',()=>{const data=seedState();data.schemaVersion=2;delete data.settlementAllocations;delete data.choreTemplates;delete data.inventoryEvents;localStorage.setItem('hezu-life-manager:v2:state',JSON.stringify(data));const loaded=loadState();assert.equal(loaded.schemaVersion,3);assert.ok(Array.isArray(loaded.settlementAllocations));assert.ok(Array.isArray(loaded.choreTemplates));assert.ok(Array.isArray(loaded.inventoryEvents))});
test('损坏数据回退到示例数据',()=>{localStorage.setItem(STORAGE_KEY,'{broken');const loaded=loadState();assert.equal(loaded.schemaVersion,3);assert.equal(loaded.houses[0].name,'梧桐里 3B')});
test('导入备份拒绝缺少核心实体的数据',()=>{assert.throws(()=>parseImportedState('{"foo":1}'),/缺少成员或费用/)});
