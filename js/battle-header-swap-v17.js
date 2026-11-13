/* EPTA CHRONICLES — reliable battle header swap control v1.7 */
(()=>{
 const previousBattle=battle;
 battle=function(){
  const template=document.createElement('template');
  template.innerHTML=previousBattle();
  const root=template.content;
  const header=root.querySelector('.battle-topline');
  const bars=root.querySelectorAll('.epta-quick-swap-bar');
  // Always create the control in the header, even if a prior renderer removed the old bar.
  if(header){
   header.querySelectorAll('.epta-header-swap').forEach(x=>x.remove());
   const reserve=state.party.slice(4,6).map(char).filter(Boolean).some(c=>c.hp>0);
   const active=state.battleFlow?.phase==='input'?char(currentBattleActor()):null;
   const frontAlive=state.party.slice(0,4).map(char).filter(Boolean).some(c=>c.hp>0);
   const enabled=reserve&&!state.battleWon&&((active&&active.hp>0)||!frontAlive);
   const wrapper=document.createElement('span');
   wrapper.className='epta-header-swap';
   const button=document.createElement('button');
   button.type='button';
   button.className='epta-swap-top-button';
   button.setAttribute('data-epta-open-swap','');
   button.textContent='⇄ 交代';
   button.disabled=!enabled;
   wrapper.appendChild(button);
   header.appendChild(wrapper);
  }
  bars.forEach(x=>x.remove());
  return template.innerHTML;
 };
})();