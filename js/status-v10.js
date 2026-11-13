/* EPTA STATUS SYSTEM v1.0 — loaded after game.js and battle-v09.js */
const EPTA_STATUS={
 burn:{name:"火傷",icon:"🔥",group:"damage",persistent:true},
 poison:{name:"毒",icon:"☠",group:"damage",persistent:true},
 paralysis:{name:"麻痺",icon:"⚡",group:"control",persistent:true},
 freeze:{name:"凍結",icon:"❄",group:"control"},
 sleep:{name:"眠り",icon:"☾",group:"control"},
 confusion:{name:"混乱",icon:"🌀",group:"confusion"},
 flinch:{name:"怯み",icon:"✦",group:"control"},
 blind:{name:"幻惑",icon:"◉",group:"blind"}
};
Object.assign(STATUS_RULES,EPTA_STATUS);
function statusList(actor){if(!Array.isArray(actor.statusEffects))actor.statusEffects=[];return actor.statusEffects}
function addStatus(actor,id,rounds=null){
 const rule=EPTA_STATUS[id];if(!rule||!actor||actor.hp<=0)return false;
 const list=statusList(actor);
 if(list.some(s=>s.id===id||EPTA_STATUS[s.id]?.group===rule.group))return false;
 const duration=rule.persistent?null:id==="flinch"?1:Number.isInteger(rounds)?Math.max(1,rounds):1+Math.floor(Math.random()*3);
 list.push({id,remaining:duration});
 addLog(actor.name+"は"+rule.name+"状態になった！");
 return true;
}
function removeStatus(actor,id,announce=true){
 const list=statusList(actor),before=list.length;
 actor.statusEffects=list.filter(s=>s.id!==id);
 if(announce&&before!==actor.statusEffects.length)addLog(actor.name+"の"+EPTA_STATUS[id].name+"が解除された。");
}
function statusEffectiveSpeed(actor){return Math.max(1,Math.floor((actor.spd||0)*(statusList(actor).some(s=>s.id==="paralysis")?.5:1)))}
function statusDamage(actor,damage){
 return statusList(actor).some(s=>s.id==="burn")?Math.max(1,Math.floor(damage/2)):damage;
}
function statusCanAct(actor,action){
 const list=statusList(actor);
 if(list.some(s=>s.id==="flinch")){removeStatus(actor,"flinch",false);addLog(actor.name+"は怯んで動けない！");return false}
 if(list.some(s=>s.id==="freeze"||s.id==="sleep")){addLog(actor.name+"は動けない！");return false}
 if(list.some(s=>s.id==="paralysis")&&Math.random()<.2){addLog(actor.name+"は麻痺して動けない！");return false}
 if(list.some(s=>s.id==="confusion")&&Math.random()<.2){
   const damage=Math.max(1,Math.floor((actor.atk||10)/2));
   actor.hp=Math.max(0,actor.hp-damage);
   addLog(actor.name+"は混乱して自分を攻撃！ "+damage+"ダメージ。");
   if(actor.hp<=0){knockOut(actor);addLog(actor.name+"は戦闘不能になった！")}
   return false;
 }
 if((action==="attack"||action==="skill"||action==="enemy")&&list.some(s=>s.id==="blind")&&Math.random()<1/3){
   addLog(actor.name+"は幻惑で攻撃を外した！");return false;
 }
 return true;
}
function clearOnKO(actor){
 actor.guarding=false;actor.buffs=[];actor.debuffs=[];
 // 治療まで残る状態異常は戦闘不能になっても維持する
 actor.statusEffects=statusList(actor).filter(s=>EPTA_STATUS[s.id]?.persistent);
}
function setBackline(actor,backline){
 actor.backline=!!backline;
 if(backline){actor.buffs=[];actor.debuffs=[];removeStatus(actor,"confusion",false)}
}
function applyRoundEndStatuses(){
 for(const actor of [...state.party.map(char).filter(Boolean),state.enemy]){
  if(actor.hp<=0||actor.backline)continue;
  for(const status of [...statusList(actor)]){
   const id=status.id,rule=EPTA_STATUS[id];if(!rule)continue;
   if(id==="burn"||id==="poison"){
    const damage=Math.max(1,Math.floor(actor.maxHp/(id==="burn"?16:15)));
    actor.hp=Math.max(0,actor.hp-damage);
    addLog(actor.name+"は"+rule.name+"で"+damage+"ダメージ！");
    if(actor.hp<=0){knockOut(actor);addLog(actor.name+"は戦闘不能になった！");break}
   }
   if(id==="freeze"||id==="sleep"||id==="blind"){
    if(Math.random()<1/3){removeStatus(actor,id);continue}
   }
   if(Number.isInteger(status.remaining)){
    status.remaining--;
    if(status.remaining<=0)removeStatus(actor,id);
   }
  }
 }
}
function skipUnavailableInputs(){
 const flow=state.battleFlow;
 while(flow.inputIndex<state.party.length){
  const actor=char(state.party[flow.inputIndex]);
  if(!actor||actor.hp<=0||actor.backline){flow.inputIndex++;continue}
  // 状態異常は行動時に判定し、コマンド選択は可能にする
  break;
 }
}
function executeBattleRound(){
 const flow=state.battleFlow;flow.phase="execute";
 const entries=flow.commands.map(cmd=>({...cmd,spd:statusEffectiveSpeed(char(cmd.id)),tie:Math.random()}));
 entries.push({id:"enemy",action:"enemy",priority:0,spd:statusEffectiveSpeed(state.enemy),tie:Math.random()});
 entries.sort((a,b)=>b.priority-a.priority||b.spd-a.spd||a.tie-b.tie);
 flow.queue=entries.map(x=>x.id);
 for(const entry of entries){
  if(endBattleIfNeeded())break;
  if(entry.id==="enemy"){enemyTurn();continue}
  const actor=char(entry.id);if(!actor||actor.hp<=0||actor.backline)continue;
  actor.guarding=false;
  if(!statusCanAct(actor,entry.action))continue;
  if(entry.action==="attack"||entry.action==="skill"){
   if(entry.action==="skill"){if(actor.mp<10)continue;actor.mp-=10}
   const damage=eptaClassDamage(actor,state.enemy,statusDamage(actor,entry.action==="skill"?Math.round(actor.atk*1.55):actor.atk));
   state.enemy.hp=Math.max(0,state.enemy.hp-damage);
   addLog(actor.name+"の"+(entry.action==="skill"?"スキル":"攻撃")+"！ "+damage+"ダメージ。"+eptaClassLabel(actor,state.enemy));
   if(statusList(state.enemy).some(s=>s.id==="freeze")&&actor.element==="炎")removeStatus(state.enemy,"freeze");
  }else if(entry.action==="heal"){
   if(actor.mp<8)continue;actor.mp-=8;
   const healed=Math.min(actor.maxHp-actor.hp,Math.max(20,Math.round(actor.maxHp*.35)));
   actor.hp+=healed;addLog(actor.name+"はHPを"+healed+"回復した。");
  }else if(entry.action==="guard"){
   actor.guarding=true;addLog(actor.name+"は防御態勢！");
  }
 }
 if(endBattleIfNeeded())return;
 applyRoundEndStatuses();
 if(endBattleIfNeeded())return;
 state.turn++;beginBattleRound();
}
function enemyTurn(){
 const enemy=state.enemy;if(enemy.hp<=0||!statusCanAct(enemy,"enemy"))return;
 const living=activeParty();if(!living.length)return;
 const target=living[Math.floor(Math.random()*living.length)];
 const reduction=target.guarding?guardReduction(target,"physical"):0;
 const damage=eptaClassDamage(enemy,target,Math.max(1,Math.round(statusDamage(enemy,enemy.atk)*(1-reduction/100))));
 target.hp=Math.max(0,target.hp-damage);
 addLog(enemy.name+"の攻撃！ "+target.name+"に"+damage+"ダメージ。"+eptaClassLabel(enemy,target));
 if(target.hp<=0){knockOut(target);addLog(target.name+"は戦闘不能になった！")}
 if(statusList(target).some(s=>s.id==="freeze")&&enemy.element==="炎")removeStatus(target,"freeze");
}
function resetBattle(){
 state.enemy.hp=state.enemy.maxHp;state.enemy.statusEffects=[];
 state.battleWon=false;state.turn=1;
 state.party.map(char).filter(Boolean).forEach(c=>{
  c.hp=c.maxHp;c.mp=c.maxMp;c.guarding=false;
  c.statusEffects=statusList(c).filter(s=>EPTA_STATUS[s.id]?.persistent);
  c.buffs=[];c.debuffs=[];c.backline=false;
 });
 state.log=["森のスライムが現れた！"];
 beginBattleRound();render();
}
const eptaOriginalBattle=battle;
battle=function(){
 const base=eptaOriginalBattle();
 const actor=state.party.map(char).find(c=>c&&c.hp>0)||state.enemy;
 const statusHtml=a=>statusList(a).map(s=>'<span class="epta-status-chip" title="'+EPTA_STATUS[s.id]?.name+'">'+(EPTA_STATUS[s.id]?.icon||"•")+' '+(EPTA_STATUS[s.id]?.name||s.id)+(s.remaining!==null&&s.remaining!==undefined?' '+s.remaining+'T':'')+'</span>').join("")||'<small>状態異常なし</small>';
 const rows=state.party.map(char).filter(Boolean).map(c=>'<div class="epta-status-row"><b>'+c.name+'</b><span>'+statusHtml(c)+'</span></div>').join("");
 const choices=Object.entries(EPTA_STATUS).map(([id,r])=>'<button class="choice" data-action="status-test" data-status="'+id+'">'+r.icon+' '+r.name+'</button>').join("");
 return base.replace('</section>', '</section>',1).replace(/(<section class="battle-log-panel">)/,
 '<section class="epta-status-panel"><div class="battle-panel-heading">STATUS EFFECTS <small>状態異常</small></div>'+rows+'<div class="epta-status-row"><b>'+state.enemy.name+'</b><span>'+statusHtml(state.enemy)+'</span></div><details class="epta-status-test"><summary>状態異常テスト（試作版）</summary><p>対象：'+actor.name+'（先頭の生存味方）</p><div class="epta-status-test-buttons">'+choices+'</div><button class="choice" data-action="status-test-clear">対象の状態異常を治療</button></details></section>$1');
};
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-action]");if(!b)return;
 if(b.dataset.action!=="status-test"&&b.dataset.action!=="status-test-clear")return;
 const actor=state.party.map(char).find(c=>c&&c.hp>0)||state.enemy;
 if(b.dataset.action==="status-test-clear"){actor.statusEffects=[];addLog(actor.name+"の状態異常を治療した。")}
 else if(!addStatus(actor,b.dataset.status))toast("同じ分類の状態異常が既にあるで");
 render();
});
