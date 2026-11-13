"use strict";
importScripts('/assets/js/food-shift-model.js?v=20261114-4');
self.onmessage=function(event){const {revision,params}=event.data;try{self.postMessage({revision,bundle:self.FoodShiftModel.run(params)});}catch(error){self.postMessage({revision,error:error.message});}};
