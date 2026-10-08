'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
class Range {
  constructor(sheet, row, col, rows=1, cols=1) { Object.assign(this,{sheet,row,col,rows,cols}); }
  setValues(values) { values.forEach((r,i)=>r.forEach((v,j)=> { this.sheet.data[this.row+i-1] ||= []; this.sheet.data[this.row+i-1][this.col+j-1]=v; })); return this; }
  getValues() { return Array.from({length:this.rows},(_,i)=>Array.from({length:this.cols},(_,j)=>this.sheet.data[this.row+i-1]?.[this.col+j-1] ?? '')); }
  setValue(v) { return this.setValues([[v]]); }
  getValue() { return this.getValues()[0][0]; }
  getRow() { return this.row; }
  setBackground(){return this;} setFontColor(){return this;} setFontWeight(){return this;} setNumberFormat(){return this;} createFilter(){return this;}
  createTextFinder(id) { const that=this; return { matchEntireCell(){return this;}, findNext(){for(let i=0;i<that.rows;i++) if(String(that.getValues()[i][0])===id) return new Range(that.sheet,that.row+i,that.col);return null;} }; }
}
class Sheet {
  constructor(){this.data=[];} getLastRow(){return this.data.length;}
  getRange(...args){return new Range(this,...args);} appendRow(row){this.data.push(row);}
  setFrozenRows(){} autoResizeColumns(){}
}
const props=new Map(), cache=new Map(), sheets=new Map();
const ss={getId:()=> 'sheet-test',getUrl:()=> 'https://docs.google.com/spreadsheets/d/sheet-test',setSpreadsheetTimeZone(){},getSheetByName:n=>sheets.get(n),insertSheet:n=>{const x=new Sheet();sheets.set(n,x);return x;}};
let seq=0, creates=0;
const backend=vm.createContext({console,Date,JSON,Number,String,Object,Error,
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v)})},
  SpreadsheetApp:{create:()=>{creates++;return ss;},openById:()=>ss,flush(){}},
  LockService:{getScriptLock:()=>({waitLock(){},tryLock:()=>true,releaseLock(){},hasLock:()=>true})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  Utilities:{getUuid:()=>`server-player-${++seq}`,formatDate:d=>d.toISOString()},Logger:{log(){}},
  ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})}
});
vm.runInContext(fs.readFileSync(path.join(root,'google-apps-script/Code.gs'),'utf8'),backend);
function get(action,cedula){return JSON.parse(backend.doGet({parameter:{action,cedula}}).text);}
function post(body){return JSON.parse(backend.doPost({postData:{contents:JSON.stringify(body)}}).text);}
backend.instalarInvictus();backend.instalarInvictus();assert.equal(creates,1,'instalador idempotente');
function client() {
 const values=new Map(),events=new Map();let networkFails=false;
 const localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const window={INVICTUS_CONFIG:{gasUrl:'https://script.google.com/macros/s/test-invictus/exec'},addEventListener:(n,f)=>events.set(n,f),dispatchEvent(){}};
 const document={querySelectorAll:()=>[],addEventListener(){},hidden:false};
 const navigator={onLine:false};
 const context=vm.createContext({window,document,localStorage,navigator,crypto:{randomUUID:()=>`client-uuid-${++seq}`},URL,AbortController,setTimeout,clearTimeout,setInterval(){},Event:class{constructor(type){this.type=type;}},console:{warn(){},error(){}},
 fetch:async(url,options)=>{if(networkFails)throw Error('sin red');const data=options.method==='POST'?post(JSON.parse(options.body)):get(new URL(url).searchParams.get('action'),new URL(url).searchParams.get('cedula'));return {ok:true,status:200,json:async()=>data};}});
 vm.runInContext(fs.readFileSync(path.join(root,'js/storage.js'),'utf8'),context);
 return {store:window.InvictusStorage,values,navigator,fail:v=>networkFails=v};
}
(async()=>{
 const a=client();
 const unknown=await a.store.profile('0012345');assert.equal(unknown.found,false);
 a.store.register('0012345','Ana','sofia');
 const data={cedula:'0012345',name:'Ana',avatar:'sofia',score:4500,accuracy:90,grade:'A',mode:'Campaña (4 Niv)',outcome:'VICTORIA',level:4,totalCorrect:18,totalAttempts:20,totalAccuracy:90,avgResponseMs:1000,avgScope:'Último nivel'};
 const result=a.store.saveResult(data);
 assert.equal(JSON.parse(a.values.get('invictus_cloud_queue_v1')).length,2,'cola offline conserva perfil y resultado');
 assert.equal(a.store.personal().records.length,1);
 a.navigator.onLine=true;a.fail(true);await a.store.flush();assert.equal(JSON.parse(a.values.get('invictus_cloud_queue_v1')).length,2,'error no descarta registros');
 a.fail(false);await a.store.flush();assert.equal(JSON.parse(a.values.get('invictus_cloud_queue_v1')).length,0,'solo borrar después de confirmación');
 assert.equal(sheets.get('Partidas').getLastRow(),2);
 assert.equal(sheets.get('Jugadores').data[1][1],'0012345','cédula mantiene ceros');
 const firstPlayer=sheets.get('Jugadores').data[1][0];
 assert.equal(post({action:'saveResult',record:result}).duplicate,true);assert.equal(sheets.get('Partidas').getLastRow(),2,'reintento no duplica');
 const b=client();b.navigator.onLine=true;const person=await b.store.profile('0012345');
 assert.equal(person.name,'Ana');assert.equal(person.stats.games,1);assert.equal(person.records[0].score,4500,'otra sesión recupera historial');
 b.navigator.onLine=false;b.store.register('0012345','Ana','mateo');b.store.saveResult({...data,score:6000,avatar:'mateo'});b.navigator.onLine=true;await b.store.flush();
 assert.equal(sheets.get('Jugadores').getLastRow(),2,'otra sesión usa la misma persona');
 assert.equal(sheets.get('Partidas').data[2][1],firstPlayer,'partidas enlazadas al ID canónico');
 const same=await a.store.profile('0012345');assert.equal(same.stats.games,2);assert.equal(same.stats.bestScore,6000);
 assert.equal(get('profile','9876543').found,false);
 assert.equal(get('profile','123.45').ok,false);
 assert.equal(post({action:'deleteAll',record:result}).ok,false,'API sin eliminación pública');
 assert.equal(post({action:'saveResult',record:{...result,id:'bad-id-123',score:-1}}).ok,false);
 assert.equal(post({action:'saveResult',record:{...result,id:'bad-id-456',cedula:'abc'}}).ok,false);
 assert.equal(post({action:'saveResult',record:{...result,id:'bad-id-789',avatar:'<script>'}}).ok,false);
 assert.equal(post({action:'registerPlayer',record:{...result,id:'formula-id-123',name:'=HYPERLINK("bad")',cedula:'9876543'}}).ok,true);
 assert.ok(String(sheets.get('Jugadores').data[2][2]).startsWith("'="),'protección de fórmulas en Sheets');
 for(let i=0;i<25;i++)assert.equal(post({action:'saveResult',record:{...result,id:'more-record-'+i,score:10000+i}}).ok,true);
 assert.equal(get('profile','0012345').records.length,27,'historial personal completo, no limitado al ranking');
 const ranking=get('ranking');assert.equal(ranking.records.length,20);assert.equal(ranking.records[0].score,10024);
 assert.equal('cedula' in ranking.records[0],false,'cédula no publicada en ranking');
 a.store.clearLocalCache();assert.equal(sheets.get('Partidas').getLastRow(),28,'limpiar caché no borra servidor');
 const c=client();c.values.set('invictus_qte_ranking',JSON.stringify([{name:'Ana',avatar:'sofia',score:3,accuracy:80,grade:'B',mode:'Examen Libre',date:'08/10'}, {name:'Otro',avatar:'mateo',score:5,accuracy:80,grade:'B',mode:'Examen Libre'}]));
 c.store.register('0012345','Ana','sofia');assert.equal(c.store.personal().records.length,1,'solo migrar alias identificado');
 c.store.register('0012345','Ana','sofia');assert.equal(c.store.personal().records.length,1,'migración sin duplicados');
 console.log('OK: instalación, cédula, historial entre sesiones, cola offline, reintento, deduplicación, validación, ranking y migración.');
})().catch(e=>{console.error(e);process.exitCode=1;});
