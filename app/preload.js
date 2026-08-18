'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const invoke=(channel,...args)=>ipcRenderer.invoke(channel,...args);
const scannerEventChannels=['market-tick','analysis-updated','market-active','market-inactive','market-error','markets-changed','starting','started','stopping','stopped'];
const alertEventChannels=['triggered'];
const scannerListeners=new Map(), alertListeners=new Map();
function subscribe(map,allowed,prefix,eventName,callback){if(!allowed.includes(eventName)||typeof callback!=='function')throw new TypeError('Invalid event subscription');const channel=`${prefix}:${eventName}`,listener=(_event,payload)=>callback(payload);ipcRenderer.on(channel,listener);if(!map.has(eventName))map.set(eventName,new Map());const id=Symbol(eventName);map.get(eventName).set(id,listener);return()=>{ipcRenderer.removeListener(channel,listener);map.get(eventName)?.delete(id);};}
contextBridge.exposeInMainWorld('derivAnalytics',{
  getStatus:()=>invoke('app:get-status'),
  sessions:{list:()=>invoke('session:list'),get:(id)=>invoke('session:get',id)},
  replay:{start:(ticks,symbol)=>invoke('replay:start',ticks,symbol),pause:()=>invoke('replay:pause'),resume:()=>invoke('replay:resume'),stop:()=>invoke('replay:stop'),setSpeed:(speed)=>invoke('replay:speed',speed),status:()=>invoke('replay:status'),results:()=>invoke('replay:results')},
  settings:{getAll:()=>invoke('settings:get-all')},
  scanner:{start:()=>invoke('scanner:start'),stop:()=>invoke('scanner:stop'),getStatus:()=>invoke('scanner:get-status'),getMarkets:()=>invoke('scanner:get-markets'),setMarkets:(m)=>invoke('scanner:set-markets',m),refresh:()=>invoke('scanner:refresh'),configuration:{get:()=>invoke('scanner:config:get'),set:(m)=>invoke('scanner:config:set',m),reset:()=>invoke('scanner:config:reset')},on:(event,callback)=>subscribe(scannerListeners,scannerEventChannels,'scanner',event,callback)},
  alerts:{rules:{list:()=>invoke('alerts:rules:list'),create:(rule)=>invoke('alerts:rules:create',rule),update:(id,changes)=>invoke('alerts:rules:update',id,changes),remove:(id)=>invoke('alerts:rules:delete',id)},history:{list:(options)=>invoke('alerts:history:list',options),count:(options)=>invoke('alerts:history:count',options),acknowledge:(id)=>invoke('alerts:history:acknowledge',id)},status:()=>invoke('alerts:status'),process:(payload)=>invoke('alerts:process',payload),on:(event,callback)=>subscribe(alertListeners,alertEventChannels,'alert',event,callback)}
});
