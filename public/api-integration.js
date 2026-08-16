/* Nexora RDS integration layer.
   Keeps the existing UI/rendering logic intact while moving authentication and persistence to the server. */
(function(){
  'use strict';
  const API_BASE = '/api';
  const CACHE = 'nexora_db_cache_v1';
  const resourceKeys = ['requests','announcements','attendance','daily_logs','tasks','inventory','bom'];
  let state = {};

  function readCache(){ try { state = JSON.parse(localStorage.getItem(CACHE)||'{}') || {}; } catch(e){ state={}; } return state; }
  function writeCache(){ localStorage.setItem(CACHE, JSON.stringify(state)); }
  readCache();

  async function api(path, options={}){
    const res = await fetch(API_BASE + path, {credentials:'same-origin', headers:{'Content-Type':'application/json', ...(options.headers||{})}, ...options});
    let body={}; try{ body=await res.json(); }catch(e){}
    if(!res.ok){ const err=new Error(body.error||`Request failed (${res.status})`); err.status=res.status; throw err; }
    return body;
  }

  function cacheEmployee(emp){ if(emp){ state.employee=emp; writeCache(); } }
  function cachedEmployee(){ return state.employee || null; }

  async function hydrate(){
    try{
      const me=await api('/auth/me');
      if(me.authenticated && me.employee){
        cacheEmployee(me.employee);
        document.body.classList.add('logged-in');
        const remote=await api('/state');
        resourceKeys.forEach(k=>{ if(remote[k] !== undefined) state[k]=remote[k]; });
        writeCache();
      } else {
        document.body.classList.remove('logged-in');
        state.employee=null; writeCache();
      }
    }catch(e){ console.warn('Nexora API unavailable; using cached public state.',e); }
  }

  // Server-backed authentication. The existing QR flow still supplies an employee ID; the PIN is verified server-side.
  window.loginEmployee = async function(idRaw,pinRaw){
    try{
      const body=await api('/auth/login',{method:'POST',body:JSON.stringify({id:idRaw,pin:pinRaw})});
      cacheEmployee(body.employee);
      document.body.classList.add('logged-in');
      if(window.showLoginOk) showLoginOk('Welcome, '+body.employee.name+'! Redirecting…');
      if(window.stopQrScan) stopQrScan();
      setTimeout(()=>showPage('dashboard'),450);
      return true;
    }catch(e){ if(window.showLoginError) showLoginError(e.message==='Invalid Employee ID or PIN' ? 'Invalid Employee ID or PIN.' : e.message); return false; }
  };

  window.manualLogin = function(){
    const input=document.getElementById('manual-emp-id'), pin=document.getElementById('manual-emp-pin');
    if(input) window.loginEmployee(input.value,pin?pin.value:'');
  };

  window.getSession = function(){ return cachedEmployee(); };
  window.portalLogout = async function(){
    try{ await api('/auth/logout',{method:'POST'}); }catch(e){}
    state.employee=null; writeCache(); document.body.classList.remove('logged-in'); showPage('home');
  };

  window.changeMyPin = async function(){
    const val=document.getElementById('new-pin-input')?.value.trim();
    if(!/^\d{4}$/.test(val||'')){ showToast('PIN must be exactly 4 digits.'); return; }
    try{ await api('/auth/change-pin',{method:'POST',body:JSON.stringify({pin:val})}); document.getElementById('new-pin-input').value=''; showToast('PIN updated securely ✅'); }
    catch(e){ showToast(e.message); }
  };

  // Replace browser-only persistence with PostgreSQL-backed state while preserving the existing UI's synchronous render functions.
  for(const resource of resourceKeys){
    const key=resource;
    const getterName='get'+({requests:'Requests',announcements:'Announcements',attendance:'Attendance',daily_logs:'DailyLogs',tasks:'Tasks',inventory:'Inventory',bom:'Bom'}[key]);
    const saverName='save'+({requests:'Requests',announcements:'Announcements',attendance:'Attendance',daily_logs:'DailyLogs',tasks:'Tasks',inventory:'Inventory',bom:'Bom'}[key]);
    if(key==='inventory'){
      window.seedInventory=function(){ if(!Array.isArray(state.inventory)){ state.inventory=[...(window.TOOLS_HARDWARE||[])].map(name=>({name,qty:5,lowThreshold:2})); writeCache(); sync('inventory',state.inventory); } };
    }
    window[getterName]=function(){
      if(key==='attendance' && (!state.attendance || typeof state.attendance!=='object' || Array.isArray(state.attendance))) state.attendance={};
      if(key!=='attendance' && !Array.isArray(state[key])) state[key]=[];
      return state[key];
    };
    window[saverName]=function(data){ state[key]=data; writeCache(); sync(key,data); };
  }

  async function sync(resource,data){
    try{ await api('/state/'+resource,{method:'POST',body:JSON.stringify({data})}); }
    catch(e){ console.error('Failed to persist '+resource,e); showToast('Saved locally; server sync failed.'); }
  }

  // Public forms are now database-backed. EmailJS may remain separately configured for notifications.
  window.submitContact = async function(){
    const fname=document.getElementById('c-fname').value.trim(), lname=document.getElementById('c-lname').value.trim(), email=document.getElementById('c-email').value.trim(), company=document.getElementById('c-company').value.trim(), type=document.getElementById('c-type').value, msg=document.getElementById('c-msg').value.trim();
    const ok=document.getElementById('c-ok'), err=document.getElementById('c-err'); ok.classList.remove('show'); err.classList.remove('show');
    if(!fname||!email){err.classList.add('show');return;}
    const btn=document.querySelector('[onclick="submitContact()"]'); if(btn){btn.disabled=true;btn.textContent='Sending…';}
    try{
      await api('/contact',{method:'POST',body:JSON.stringify({firstName:fname,lastName:lname,email,company,type,message:msg})});
      ok.classList.add('show'); ['c-fname','c-lname','c-email','c-company','c-msg'].forEach(id=>document.getElementById(id).value=''); document.getElementById('c-type').value='';
    }catch(e){err.textContent=e.message||'Unable to send message.';err.classList.add('show');}
    finally{if(btn){btn.disabled=false;btn.textContent='Send Message';}}
  };

  window.submitCareer = async function(){
    const n=document.getElementById('a-name').value.trim(), e=document.getElementById('a-email').value.trim(), p=document.getElementById('a-position').value, phone=document.getElementById('a-phone').value.trim(), exp=document.getElementById('a-exp').value.trim(), cover=document.getElementById('a-cover').value.trim();
    const ok=document.getElementById('a-ok'), err=document.getElementById('a-err'); ok.classList.remove('show'); err.classList.remove('show');
    if(!n||!e||!p){err.classList.add('show');return;}
    try{ await api('/careers',{method:'POST',body:JSON.stringify({name:n,email:e,phone,position:p,experience:exp,coverLetter:cover})}); ok.classList.add('show'); ['a-name','a-email','a-phone','a-exp','a-cover'].forEach(id=>document.getElementById(id).value=''); }
    catch(ex){err.textContent=ex.message||'Unable to submit application.';err.classList.add('show');}
  };

  window.submitSupport = async function(){
    const name=document.getElementById('s-name').value.trim(), email=document.getElementById('s-email').value.trim(), subject=document.getElementById('s-subject').value.trim(), priority=document.getElementById('s-priority').value, description=document.getElementById('s-desc').value.trim();
    const ok=document.getElementById('s-ok'), err=document.getElementById('s-err'); ok.classList.remove('show'); err.classList.remove('show');
    if(!name||!email||!subject){err.classList.add('show');return;}
    const btn=document.querySelector('#supportFormWrap button'); if(btn){btn.disabled=true;btn.textContent='Sending…';}
    try{ await api('/support',{method:'POST',body:JSON.stringify({name,email,subject,priority,description})}); ok.classList.add('show'); ['s-name','s-email','s-subject','s-desc'].forEach(id=>document.getElementById(id).value=''); document.getElementById('s-priority').value=''; }
    catch(ex){err.textContent=ex.message||'Unable to submit ticket.';err.classList.add('show');}
    finally{if(btn){btn.disabled=false;btn.textContent='Submit Ticket';}}
  };

  // Override leave requests so the existing leave UI continues to use the DB-backed request store.
  window.submitLeaveRequest = function(){
    const emp=getSession(); if(!emp)return; const from=document.getElementById('leave-from').value, to=document.getElementById('leave-to').value||from, reason=document.getElementById('leave-reason').value.trim();
    if(!from){showToast('Please select a start date.');return;}
    const list=getRequests(); list.unshift({reqId:'REQ-'+Date.now(),empId:emp.id,empName:emp.name,type:'leave',dateFrom:from,dateTo:to,notes:reason,status:'pending',date:new Date().toISOString()}); saveRequests(list); closeLeaveModal(); showToast('Leave request sent to the Founder ✅'); renderUpdates();
  };

  // Load server state before the user opens portal pages.
  document.addEventListener('DOMContentLoaded',()=>{ hydrate().then(()=>{ if(getSession()){ try{ renderDashboard(); renderProfile(); }catch(e){} } }); });
})();
