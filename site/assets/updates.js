(()=>{'use strict';
const form=document.querySelector('#updates-form');
const status=document.querySelector('#updates-status');
const unsubscribe=document.querySelector('#updates-unsubscribe');
if(!form||!status||!unsubscribe)return;
const submit=form.querySelector('button[type="submit"]');
const originalLabel=submit.textContent;
const storageKey='saras-updates-unsubscribe-token';
function announce(message,state){status.textContent=message;status.dataset.state=state||''}
function sync(){try{unsubscribe.hidden=!localStorage.getItem(storageKey)}catch{unsubscribe.hidden=true}}
async function send(method,payload){
  const response=await fetch('/api/updates',{method,headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json().catch(()=>({error:'The update service returned an invalid response.'}));
  if(!response.ok)throw new Error(result.error||'Could not save your request. Please try again.');
  return result;
}
sync();
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const data=new FormData(form);
  submit.disabled=true;submit.textContent='Joining…';announce('Saving your email preference…','pending');
  try{
    const result=await send('POST',{email:data.get('email'),consent:data.get('consent')==='on',website:data.get('website')});
    try{localStorage.setItem(storageKey,result.unsubscribeToken)}catch{}
    announce('You’re on the SARAS updates list. This does not create an app account or connect a laptop.','success');
    form.reset();sync();
  }catch(error){announce(error.message||'The updates service is temporarily unavailable. Please try again later.','error')}
  finally{submit.disabled=false;submit.textContent=originalLabel}
});
unsubscribe.addEventListener('click',async()=>{
  let token;try{token=localStorage.getItem(storageKey)}catch{}
  if(!token)return;
  unsubscribe.disabled=true;announce('Removing this browser’s subscription…','pending');
  try{
    await send('DELETE',{unsubscribeToken:token});
    try{localStorage.removeItem(storageKey)}catch{}
    announce('This browser has been unsubscribed.','success');sync();
  }catch(error){announce(error.message||'Could not unsubscribe right now. Please try again.','error')}
  finally{unsubscribe.disabled=false}
});
})();
