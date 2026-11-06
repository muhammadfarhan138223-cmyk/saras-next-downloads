(()=>{'use strict';
const link=document.querySelector('#download-installer');
const status=document.querySelector('#download-status');
if(!link||!status)return;
const title=link.querySelector('strong');
const original=title?.textContent||'Download SARAS for Windows';
let timer=0;
link.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  if(link.dataset.downloadState==='starting'){event.preventDefault();return}
  link.dataset.downloadState='starting';link.setAttribute('aria-busy','true');
  if(title)title.textContent='Preparing your download…';
  status.textContent='Your browser is opening the Windows installer download. The file may take a moment to appear.';
  clearTimeout(timer);
  timer=window.setTimeout(()=>{
    delete link.dataset.downloadState;link.removeAttribute('aria-busy');
    if(title)title.textContent=original;
    status.textContent='If the installer did not appear in your Downloads, select the download button again.';
  },3200);
});
})();
