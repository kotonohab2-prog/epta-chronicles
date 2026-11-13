/* EPTA CHRONICLES — compact swap button in battle header v1.6 */
(()=>{
 const previousBattle=battle;
 battle=function(){
  const template=document.createElement('template');
  template.innerHTML=previousBattle();
  const root=template.content;
  const top=root.querySelector('.anime-battle .battle-topline');
  const bar=root.querySelector('.anime-battle .epta-quick-swap-bar');
  if(top&&bar){
   const button=bar.querySelector('[data-epta-open-swap]');
   if(button){
    const container=document.createElement('span');
    container.className='epta-header-swap';
    container.appendChild(button);
    top.appendChild(container);
   }
   bar.remove();
  }
  return template.innerHTML;
 };
})();