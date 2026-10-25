/* Wall clock -> fixed engine ticks. Playback speed never enters combat logic or RNG. */
(()=>{'use strict';
 function create({state,step,onFrame=()=>{},onFinish=()=>{},request=cb=>requestAnimationFrame(cb),cancel=id=>cancelAnimationFrame(id),now=()=>performance.now()}){
  let running=false,fast=false,rate=1,acc=0,last=null,frame=null,lastPaint=0,token=0;
  function pump(ms){if(!running||fast)return 0;acc+=Math.max(0,ms)*rate/1000;let ticks=0;const dt=window.RIVALRY_ENGINE.DT;
   while(acc+1e-9>=dt&&state()?.status!=='finished'){step(state());acc-=dt;ticks++;}
   if(state()?.status==='finished'){pause();onFinish();}return ticks;
  }
  function loop(t){if(!running)return;const delta=last===null?0:t-last;last=t;pump(Math.min(delta,1000));if(t-lastPaint>=160){onFrame();lastPaint=t;}if(running)frame=request(loop);}
  function play(){if(running||!state()||state().status==='finished')return;running=true;last=null;frame=request(loop);}
  function pause(){running=false;fast=false;token++;last=null;if(frame!==null)cancel(frame);frame=null;onFrame();}
  function setSpeed(value){if(![.5,1,2,4,8].includes(Number(value)))throw Error('Unsupported playback speed');rate=Number(value);}
  function reset(){pause();acc=0;}
  function fastForward(){pause();if(!state()||state().status==='finished')return Promise.resolve();fast=true;const mine=++token;let count=0;
   return new Promise((resolve,reject)=>{function chunk(){if(mine!==token){resolve();return;}
    try{for(let n=0;n<500&&state().status!=='finished';n++){step(state());if(++count>250000)throw Error('Safety limit reached');}
     onFrame();if(state().status==='finished'){fast=false;onFinish();resolve();}else setTimeout(chunk,0);
    }catch(e){fast=false;reject(e);}}
    chunk();
   });
  }
  return Object.freeze({play,pause,reset,setSpeed,pump,fastForward,isRunning:()=>running,isFast:()=>fast,speed:()=>rate,fraction:()=>acc/window.RIVALRY_ENGINE.DT});
 }
 window.RIVALRY_PLAYBACK=Object.freeze({create});
})();
