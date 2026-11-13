/* EPTA CHRONICLES — 4 front + 2 reserve formation v1.2 */
function eptaFormationSync(){
 if(!Array.isArray(state.party))state.party=[];
 state.party=[...new Set(state.party.filter(id=>!!char(id)))].slice(0,6);
 state.party.forEach((id,i)=>{const c=char(id);if(c)c.backline=i>=4});
}
eptaFormationSync();
const eptaFormationOldSync=syncOwnedBattleCharacters;
syncOwnedBattleCharacters=function(){
 eptaFormationOldSync();
 // Old sync restricts to four; retain the previous six-slot arrangement.
 eptaFormationSync();
};
const eptaFormationOldParty=party;
party=function(){
 const output=eptaFormationOldParty();
 return output.replace('出撃メンバー（','編成メンバー（').replace('<section class="card"><h2>編成メンバー','<section class="card"><p class="muted">前衛は1〜4枠、後衛は5〜6枠。後衛は戦闘中に行動できません。</p><h2>編成メンバー');
};
const eptaFormationOldBattle=battle;
battle=function(){
 eptaFormationSync();
 let output=eptaFormationOldBattle();
 const pct=(v,m)=>m?Math.max(0,Math.min(100,Math.round(v/m*100))):0;
 const front=state.party.slice(0,4).map(char).filter(Boolean),reserve=state.party.slice(4,6).map(char).filter(Boolean);
 const portrait=c=>{const p=protagonistPool.find(x=>x.id===c.id);return p?'<img src="'+p.id+'-battle.webp" alt="" style="width:40px;height:48px;object-fit:contain" onerror="this.style.display=\'none\'">':'<span style="font-size:26px">'+c.icon+'</span>'};
 const row=(c,i)=>'<div class="epta-formation-unit">'+portrait(c)+'<div><b>'+c.name+'</b><small>HP '+c.hp+'/'+c.maxHp+'　MP '+c.mp+'/'+c.maxMp+(c.hp<=0?'　戦闘不能':'')+'</small><div class="epta-formation-hp"><i style="width:'+pct(c.hp,c.maxHp)+'%"></i></div></div><span class="epta-formation-pos">'+(i<4?'前衛':'後衛')+'</span></div>';
 const flow=state.battleFlow;
 const actor=flow.phase==='input'?char(currentBattleActor()):null;
 const available=reserve.filter(c=>c.hp>0);
 const ko=front.filter(c=>c.hp<=0);
 const canSwap=!!actor&&actor.hp>0&&!state.battleWon;
 const panel='<section class="epta-formation-panel"><div class="battle-panel-heading">FORMATION <small>前衛4人・後衛2人</small></div><div class="epta-formation-columns"><div><h3>⚔ 前衛（戦闘参加）</h3>'+front.map((c,i)=>row(c,i)).join('')+'</div><div><h3>◇ 後衛（待機）</h3>'+reserve.map((c,i)=>row(c,i+4)).join('')+(reserve.length===0?'<p class="muted">後衛が未編成です</p>':'')+'</div></div>'+
 (canSwap&&available.length?'<div class="epta-formation-actions"><b>交代コマンド（行動1回消費）</b><p>現在の行動者：'+actor.name+' ／ 出撃した仲間は次ターンから行動可能</p>'+available.map(c=>'<button class="choice" data-action="epta-swap" data-id="'+c.id+'">'+c.name+'と交代</button>').join('')+(ko.length?'<p>戦闘不能枠を交代させる：</p>'+ko.flatMap(dead=>available.map(c=>'<button class="choice" data-action="epta-replace" data-id="'+c.id+'" data-out="'+dead.id+'">'+dead.name+' → '+c.name+'</button>')).join(''):'')+'</div>':'')+
 (!front.some(c=>c.hp>0)&&available.length?'<div class="epta-formation-actions"><b>前衛全滅：緊急交代</b><p>後衛から前衛に出す仲間を選んでな。出撃ターンは行動できません。</p>'+available.map(c=>'<button class="btn" data-action="epta-emergency" data-id="'+c.id+'">'+c.name+'を出撃</button>').join('')+'</div>':'')+'</section>';
 output=output.replace('<section class="battle-log-panel">',panel+'<section class="battle-log-panel">');
 return output;
};
const eptaFormationOldSkip=skipUnavailableInputs;
skipUnavailableInputs=function(){
 eptaFormationOldSkip();
 if(state.battleFlow.inputIndex>=Math.min(4,state.party.length)&&state.battleFlow.phase==='input'&&state.battleFlow.commands.length===0&&!activeParty().length&&state.party.slice(4).some(id=>char(id)?.hp>0)){
  state.battleFlow.phase='emergency';
 }
};
const eptaFormationOldCurrent=currentBattleActor;
currentBattleActor=function(){
 if(state.battleFlow?.phase==='emergency')return null;
 return eptaFormationOldCurrent();
};
const eptaFormationOldDo=doBattleAction;
doBattleAction=function(action){
 if(state.battleFlow?.phase==='emergency'){toast('後衛から交代する仲間を選んでな');return}
 return eptaFormationOldDo(action);
};
const eptaFormationOldEnd=endBattleIfNeeded;
endBattleIfNeeded=function(){
 if(state.enemy.hp<=0)return eptaFormationOldEnd();
 if(!state.party.map(char).some(c=>c&&c.hp>0))return eptaFormationOldEnd();
 return false;
};
const eptaFormationOldReset=resetBattle;
resetBattle=function(){eptaFormationOldReset();eptaFormationSync();render()};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 const action=b.dataset.action;
 if(!['epta-swap','epta-replace','epta-emergency'].includes(action))return;
 if(state.enemy.hp<=0||state.battleWon)return;
 const incoming=char(b.dataset.id);
 if(!incoming||incoming.hp<=0||state.party.indexOf(incoming.id)<4)return;
 const flow=state.battleFlow;
 if(action==='epta-emergency'){
  if(activeParty().length||!state.party.slice(0,4).every(id=>!char(id)||char(id).hp<=0))return;
  const slot=state.party.findIndex(id=>char(id)?.hp<=0);
  if(slot<0||slot>=4)return;
  const from=state.party.indexOf(incoming.id);
  const outgoing=char(state.party[slot]);
  [state.party[slot],state.party[from]]=[state.party[from],state.party[slot]];
  setBackline(outgoing,true);setBackline(incoming,false);
  incoming.eptaJustSwapped=state.turn;
  addLog(incoming.name+'が緊急出撃！');
  state.turn++;beginBattleRound();render();return;
 }
 if(flow.phase!=='input')return;
 const id=currentBattleActor(),actor=char(id);
 if(!actor||actor.hp<=0)return;
 const cmd={id,action:action==='epta-swap'?'swap':'replace',target:incoming.id,priority:0};
 if(action==='epta-replace'){
  const outgoing=char(b.dataset.out);
  if(!outgoing||outgoing.hp>0||state.party.indexOf(outgoing.id)>=4)return;
  cmd.outgoing=outgoing.id;
 }
 flow.commands.push(cmd);flow.inputIndex++;skipUnavailableInputs();
 if(flow.inputIndex>=Math.min(4,state.party.length))executeBattleRound();
 render();
});
