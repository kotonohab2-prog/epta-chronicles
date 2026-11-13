/* EPTA CHRONICLES — battle display and swap animation fix v1.5 */
(()=>{
 const previousBattle=battle;
 battle=function(){
   let html=previousBattle();
   // The v1.2 formation wrapper restores all six members while rendering.
   // Limit the actual HTML shown on the battlefield, without changing state.party.
   const stage=html.match(/<div class="battle-formation">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<div class="battle-mid-mark">/);
   // Safer independent replacement: each hero has nested divs, so parse in a detached DOM.
   const template=document.createElement('template');
   template.innerHTML=html;
   const root=template.content;
   root.querySelectorAll('.battle-formation .battle-hero').forEach((el,i)=>{if(i>=4)el.remove()});
   root.querySelectorAll('.battle-status-list .battle-status').forEach((el,i)=>{if(i>=4)el.remove()});
   root.querySelectorAll('.epta-status-panel .epta-status-row').forEach((el,i)=>{if(i>=4&&i<6)el.remove()});
   // v1.4's regex only removed the opening section through its first nested closing tag.
   root.querySelectorAll('.epta-formation-panel').forEach(el=>el.remove());
   return template.innerHTML;
 };
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let animationPending=false;
 // Capture before the older formation handler changes battle state and redraws the screen.
 document.addEventListener('click',e=>{
   const btn=e.target.closest('[data-action="epta-swap"],[data-action="epta-replace"],[data-action="epta-emergency"]');
   if(!btn||state.view!=='battle'||animationPending)return;
   const id=btn.dataset.id, incoming=char(id);
   if(!incoming||incoming.hp<=0)return;
   const before=state.party.indexOf(id);
   const action=btn.dataset.action;
   const actor=action==='epta-emergency'?null:char(currentBattleActor());
   const outgoing=btn.dataset.out?char(btn.dataset.out):actor;
   const turn=state.turn;
   const count=state.battleFlow?.commands?.length??0;
   animationPending=true;
   setTimeout(()=>{
     animationPending=false;
     // Only animate accepted swaps: queued command or immediate emergency deployment.
     const changed=state.party.indexOf(id)!==before;
     const queued=(state.battleFlow?.commands||[]).some(x=>x.target===id&&['swap','replace'].includes(x.action));
     const accepted=changed||queued;
     if(!accepted)return;
     // Remove old overlay (if v1.4 also created one) and show a single effect.
     document.querySelectorAll('.epta-swap-flash').forEach(x=>x.remove());
     const el=document.createElement('div');
     el.className='epta-swap-flash epta-swap-flash-v15';
     el.setAttribute('aria-live','polite');
     el.innerHTML='<div class="epta-swap-flash-inner"><span>✦</span><b>'+escape(outgoing?.name||'前衛')+' ⇄ '+escape(incoming.name)+'</b><small>交代！</small></div>';
     document.body.appendChild(el);
     setTimeout(()=>el.remove(),650);
   },20);
 },true);
})();
