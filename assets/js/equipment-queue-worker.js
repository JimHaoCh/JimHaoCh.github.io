"use strict";
importScripts('/assets/js/equipment-queue-model.js?v=20261114-2');
self.onmessage=event=>{
 const {params,revision}=event.data;
 try{self.postMessage({revision,bundle:self.ResourceModel.run(params)});}
 catch(error){self.postMessage({revision,error:String(error.message||error)});}
};
