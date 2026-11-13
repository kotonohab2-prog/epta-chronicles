/* EPTA CHRONICLES — tap-to-swap party editor v1.3 */
(()=>{
let selected=null;
const owned=()=>state.characters.filter(c=>c&&(!protagonistPool.some(p=>p.id===c.id)||state.summonedCharacters.includes(c.id)));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const art=c=>{if(!c)return '<span class="epta-tap-plus">＋</span>';const p=protagonistPool.find(x=>x.id===c.id);return p?'<img src="'+esc(p.portrait)+'" alt="" loading="lazy">':'<span class="epta-tap-emoji">'+esc(c.icon)+'</span>'};
const oldParty=party;
party=function(){
 eptaFormationSync();
 const roster=owned(), current=state.party;
 const tile=(c,i,kind)=>'<button type="button" class="epta-tap-tile '+(selected&&selected.kind===kind&&selected.index===i?'is-selected':'')+' '+(c?'':'is-empty')+'" data-epta-tap-kind="'+kind+'" data-epta-tap-index="'+i+'" aria-pressed="'+(!!selected&&selected.kind===kind&&selected.index===i)+'">'+art(c)+'<span class="epta-tap-name">'+esc(c?.name||(kind==='slot'?'空き枠':'未所持'))+'</span>'+(c?'<small>★'+esc(c.rarity)+' · HP '+esc(c.maxHp)+'</small>':'<small>タップして配置</small>')+'</button>';
 const slots=(start,end)=>Array.from({length:end-start},(_,n)=>tile(char(current[start+n]),start+n,'slot')).join('');
 const hint=selected?(selected.kind==='slot'?'選択中：'+(char(current[selected.index])?.name||'空き枠')+' ／ 移動先の枠か所持キャラをタップ':'選択中：'+(roster[selected.index]?.name||'')+' ／ 配置先の枠をタップ'):'キャラクターか配置枠をタップして選択。次に入れ替え先をタップ！';
 return head('パーティ編成','前衛4人・後衛2人。タップで簡単に配置や入れ替えができます。変更は自動保存されます。')+
 '<div class="epta-tap-layout"><section class="card epta-tap-roster"><div class="epta-tap-heading"><h2>所持キャラクター <small>('+roster.length+'人)</small></h2><span>① 選ぶ</span></div><div class="epta-tap-roster-grid">'+roster.map((c,i)=>tile(c,i,'roster')).join('')+'</div></section>'+
 '<section class="card epta-tap-board"><div class="epta-tap-heading"><h2>編成中のパーティ</h2><span>'+current.length+' / 6人</span></div><div class="epta-tap-group front"><h3>⚔ 前衛 <small>戦闘に参加する4人</small></h3><div class="epta-tap-slot-grid">'+slots(0,4)+'</div></div><div class="epta-tap-group back"><h3>◇ 後衛 <small>交代まで待機する2人</small></h3><div class="epta-tap-slot-grid">'+slots(4,6)+'</div></div><div class="epta-tap-help" aria-live="polite">'+esc(hint)+'</div><div class="epta-tap-buttons"><button class="choice" data-epta-tap-cancel>選択解除</button><button class="choice" data-epta-tap-remove '+(!selected?'disabled':'')+'>選択した仲間を外す</button><button class="btn" data-epta-tap-done>編成完了 ✓</button></div><p class="muted">※ 編成を変更すると進行中の戦闘は最初からになります。最低1人は必要です。</p></section></div>';
};
function redraw(){render()}
function commit(next){
 if(next.length<1){toast('最低1人は編成してな');return false}
 if(next.length>6||new Set(next).size!==next.length)return false;
 state.party=next;eptaFormationSync();selected=null;resetBattle();toast('編成を更新したで');return true;
}
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-epta-tap-kind]');
 if(t){
  const kind=t.dataset.eptaTapKind,index=Number(t.dataset.eptaTapIndex);
  if(!Number.isInteger(index))return;
  const roster=owned(), partyIds=[...state.party],id=kind==='roster'?roster[index]?.id:partyIds[index];
  if(!selected){selected={kind,index};redraw();return}
  if(selected.kind===kind&&selected.index===index){selected=null;redraw();return}
  const sourceId=selected.kind==='roster'?roster[selected.index]?.id:partyIds[selected.index];
  if(!sourceId){selected=null;toast('先にキャラクターを選んでな');redraw();return}
  if(kind==='roster'&&selected.kind==='roster'){selected={kind,index};redraw();return}
  if(kind==='roster'){
   const existing=partyIds.indexOf(id);
   if(existing<0){selected={kind,index};redraw();return}
   if(selected.kind==='slot'){
    const at=selected.index,from=partyIds.indexOf(id);
    if(at>=partyIds.length){selected=null;toast('手前の空き枠から配置してな');redraw();return}
    [partyIds[at],partyIds[from]]=[partyIds[from],partyIds[at]];
    commit(partyIds);
   }
   return;
  }
  const target=index,from=partyIds.indexOf(sourceId);
  if(target>partyIds.length){toast('手前の空き枠から配置してな');selected=null;redraw();return}
  if(from===target){selected=null;redraw();return}
  if(from>=0){
   if(target===partyIds.length){partyIds.splice(from,1);partyIds.push(sourceId)}
   else [partyIds[from],partyIds[target]]=[partyIds[target],partyIds[from]];
  }else if(target===partyIds.length)partyIds.push(sourceId);
  else partyIds[target]=sourceId;
  commit(partyIds);return;
 }
 if(e.target.closest('[data-epta-tap-cancel]')){selected=null;redraw()}
 if(e.target.closest('[data-epta-tap-done]')){selected=null;redraw();toast('編成を保存したで')}
 if(e.target.closest('[data-epta-tap-remove]')){
  if(!selected)return;
  const id=selected.kind==='roster'?owned()[selected.index]?.id:state.party[selected.index];
  if(!id||!state.party.includes(id)){selected=null;redraw();return}
  commit(state.party.filter(x=>x!==id));
 }
});
})();