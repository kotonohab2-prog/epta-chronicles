/* EPTA CHRONICLES — front-only battle and quick-swap v1.4 */
(()=>{
let swapOpen=false;
const oldBattle=battle;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const art=c=>{const p=protagonistPool.find(x=>x.id===c.id);return p?'<img src="'+esc(p.id)+'-battle.webp" alt="" onerror="this.hidden=true">':'<span>'+esc(c.icon)+'</span>'};
battle=function(){
 const full=state.party;
 let html;
 try{
  // The existing renderer must see only the four active combatants.
  state.party=full.slice(0,4);
  html=oldBattle();
 }finally{
  state.party=full;
  eptaFormationSync();
 }
 // Remove the old always-visible formation panel. Its information is now in the popup.
 html=html.replace(/<section class="epta-formation-panel">[\s\S]*?<\/section>/,'');
 const front=full.slice(0,4).map(char).filter(Boolean);
 const reserve=full.slice(4,6).map(char).filter(Boolean);
 const flow=state.battleFlow;
 const actor=flow.phase==='input'?char(currentBattleActor()):null;
 const available=reserve.filter(c=>c.hp>0);
 const emergency=!front.some(c=>c.hp>0)&&available.length>0;
 const canSwap=!!actor&&actor.hp>0&&!state.battleWon&&available.length>0;
 const options=available.map(c=>{
  const ko=front.filter(x=>x.hp<=0);
  const ordinary=canSwap?'<button class="epta-swap-card" data-action="epta-swap" data-id="'+esc(c.id)+'">'+art(c)+'<b>'+esc(c.name)+'</b><small>HP '+c.hp+'/'+c.maxHp+'</small><span>'+esc(actor.name)+'と交代</span></button>':'';
  const dead=canSwap?ko.map(x=>'<button class="epta-swap-card" data-action="epta-replace" data-id="'+esc(c.id)+'" data-out="'+esc(x.id)+'">'+art(c)+'<b>'+esc(c.name)+'</b><small>'+esc(x.name)+'の戦闘不能枠へ</small><span>交代する</span></button>').join(''):'';
  const urgent=emergency?'<button class="epta-swap-card" data-action="epta-emergency" data-id="'+esc(c.id)+'">'+art(c)+'<b>'+esc(c.name)+'</b><small>HP '+c.hp+'/'+c.maxHp+'</small><span>緊急出撃</span></button>':'';
  return ordinary+dead+urgent;
 }).join('');
 const trigger='<div class="epta-quick-swap-bar"><span>⚔ 前衛 '+front.length+'人が戦闘中 <small>後衛は交代時のみ表示</small></span><button class="btn secondary" data-epta-open-swap '+(!(canSwap||emergency)?'disabled':'')+'>⇄ 交代</button></div>';
 const popup=swapOpen&&(canSwap||emergency)?'<div class="epta-swap-backdrop" data-epta-close-swap><section class="epta-swap-dialog" role="dialog" aria-modal="true" aria-label="交代する仲間を選択"><div class="epta-swap-head"><h2>⇄ 交代する仲間を選択</h2><button data-epta-close-swap aria-label="閉じる">×</button></div><p>'+(emergency?'前衛が全員戦闘不能！ 後衛から緊急出撃させよう。':'現在の行動者：'+esc(actor.name)+' ／ 交代は行動1回を消費')+'</p><div class="epta-swap-options">'+options+'</div><p class="muted">出撃した仲間は次のターンから行動できます。</p><button class="choice" data-epta-close-swap>キャンセル</button></section></div>':'';
 // Place the quick action above the battle log without changing combat logic.
 html=html.replace('<section class="battle-log-panel">',trigger+'<section class="battle-log-panel">');
 return html+popup;
};
document.addEventListener('click',e=>{
 if(e.target.closest('[data-epta-open-swap]')){swapOpen=true;render();return}
 if(e.target.closest('[data-epta-close-swap]')&&(e.target.matches('[data-epta-close-swap]')||e.target.closest('button[data-epta-close-swap]'))){swapOpen=false;render();return}
},true);
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');
 if(!b||!['epta-swap','epta-replace','epta-emergency'].includes(b.dataset.action))return;
 const incoming=char(b.dataset.id);
 if(!incoming)return;
 const actor=b.dataset.action==='epta-emergency'?null:char(currentBattleActor());
 const outgoing=b.dataset.out?char(b.dataset.out):actor;
 // Run after the original formation listener has applied the action and rerendered.
 setTimeout(()=>{
  swapOpen=false;
  const screen=document.querySelector('#screen');
  if(screen&&state.view==='battle')render();
  const overlay=document.createElement('div');
  overlay.className='epta-swap-flash';
  overlay.setAttribute('aria-live','polite');
  overlay.innerHTML='<div class="epta-swap-flash-inner"><span>✦</span><b>'+esc(outgoing?.name||'前衛')+' ⇄ '+esc(incoming.name)+'</b><small>交代！</small></div>';
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.remove(),540);
 },0);
});
})();
