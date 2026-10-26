'use strict';
importScripts('./model.js');
self.onmessage=e=>{const {id,type,...args}=e.data;try{let result;if(type==='sample')result=self.RIVALRY_PREDICT.sample(args.pred,args.n,args.seed);else if(type==='predict'){const state=self.RIVALRY_PREDICT.fit(args.matches,args.asOf);result=self.RIVALRY_PREDICT.predict(state,args.a,args.b,args.best,args.maps);}else throw Error('Unknown request');self.postMessage({id,result})}catch(err){self.postMessage({id,error:err.message})}};
