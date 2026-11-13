/* EPTA CHRONICLES - Class Affinity v1.1 */
const EPTA_CLASSES=["セイバー","ランサー","アーチャー","ライダー","アサシン","ガンナー","キャスター","バーサーカー","ルーラー"];
const EPTA_ADVANTAGES={
 "セイバー":["ランサー","ライダー"],
 "ランサー":["アーチャー","ガンナー","アサシン"],
 "アーチャー":["セイバー","キャスター"],
 "ライダー":["ランサー","ガンナー"],
 "アサシン":["ライダー","アーチャー","ルーラー"],
 "ガンナー":["セイバー","アサシン","ルーラー"],
 "キャスター":["アサシン","ライダー"],
 "バーサーカー":["キャスター","バーサーカー"],
 "ルーラー":["バーサーカー","キャスター"]
};
const EPTA_CLASS_BY_ID={riku:"セイバー",mira:"キャスター",sena:"ルーラー",kaisei:"セイバー",sho:"ライダー",yuki:"キャスター",shunki:"ガンナー",daiki:"セイバー"};
function eptaClassOf(actor){
 if(!actor)return null;
 if(EPTA_CLASSES.includes(actor.classId))return actor.classId;
 if(EPTA_CLASSES.includes(actor.role))return actor.role;
 return EPTA_CLASS_BY_ID[actor.id]||null;
}
function eptaClassMultiplier(attacker,defender){
 const a=eptaClassOf(attacker),d=eptaClassOf(defender);
 if(!a||!d)return 1;
 if(EPTA_ADVANTAGES[a]?.includes(d))return 1.5;
 if(EPTA_ADVANTAGES[d]?.includes(a))return .75;
 return 1;
}
function eptaClassDamage(attacker,defender,base){
 const m=eptaClassMultiplier(attacker,defender);
 return Math.max(1,Math.round(base*m));
}
function eptaClassLabel(attacker,defender){
 const m=eptaClassMultiplier(attacker,defender);
 return m===1.5?" 有利！×1.5":m===.75?" 不利…×0.75":"";
}
// The prototype slime has no class by default. A test selector enables matchup testing.
if(!EPTA_CLASSES.includes(state.enemy.classId))state.enemy.classId=null;
const eptaClassOriginalBattle=battle;
battle=function(){
 let html=eptaClassOriginalBattle();
 const actor=state.party.map(char).find(c=>c&&c.hp>0);
 const choices=['<button class="choice" data-action="epta-enemy-class" data-class="">無属性（等倍）</button>',...EPTA_CLASSES.map(c=>'<button class="choice" data-action="epta-enemy-class" data-class="'+c+'">'+c+'</button>')].join("");
 const panel='<section class="epta-status-panel"><div class="battle-panel-heading">CLASS AFFINITY <small>クラス相性 v1.1</small></div>'+
 '<p>敵：<b>'+(eptaClassOf(state.enemy)||"無属性")+'</b> ／ 攻撃側に有利 ×1.5・不利 ×0.75・等倍 ×1.0</p>'+
 '<div class="epta-status-row">'+state.party.map(char).filter(Boolean).map(c=>'<span style="display:inline-block;margin:3px 8px 3px 0">'+c.name+'：'+(eptaClassOf(c)||"未設定")+(eptaClassOf(state.enemy)?eptaClassLabel(c,state.enemy):"")+'</span>').join("")+'</div>'+
 '<details class="epta-status-test"><summary>敵クラス切替（テスト用）</summary><p>現在のスライムにクラスを仮設定して相性ダメージを確認できます。</p><div class="epta-status-test-buttons">'+choices+'</div></details></section>';
 return html.replace('<section class="battle-log-panel">',panel+'<section class="battle-log-panel">');
};
document.addEventListener("click",e=>{
 const btn=e.target.closest('[data-action="epta-enemy-class"]');
 if(!btn)return;
 state.enemy.classId=EPTA_CLASSES.includes(btn.dataset.class)?btn.dataset.class:null;
 addLog("敵のテスト用クラス："+(state.enemy.classId||"無属性"));
 render();
});
