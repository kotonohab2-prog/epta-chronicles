/* EPTA CHRONICLES v0.9 - anime-style battle screen */
function battle(){
  const enemy=state.enemy;
  const members=state.party.map(char).filter(Boolean);
  const active=state.battleFlow.finished?null:currentBattleActor();
  const activeChar=active&&active!=="enemy"?char(active):null;
  const order=state.battleFlow.queue.slice(state.battleFlow.index).filter(id=>battleAlive(id));
  const canAct=!!activeChar&&enemy.hp>0&&!state.battleWon;
  const pct=(v,m)=>Math.max(0,Math.min(100,v/m*100));
  return `${head("冒険・バトル","マギ大陸・翡翠の森 — ターン制コマンドバトル")}
  <section class="anime-battle">
    <div class="battle-topline"><span><i></i> BATTLE AREA / MAGI CONTINENT</span><b>TURN <strong>${state.turn}</strong></b></div>
    <div class="battle-stage">
      <div class="battle-side allies-side"><div class="side-label">YOUR PARTY<small>味方</small></div>
        <div class="battle-formation">${members.map((c,i)=>`<div class="battle-hero hero-${i+1} ${c.hp<=0?'is-down':''}"><div class="hero-orbit"></div><div class="hero-sprite">${c.icon}</div><div class="hero-nameplate"><b>${c.name}</b><small>${c.role} / ${c.element}</small></div><div class="hero-hp"><span style="width:${pct(c.hp,c.maxHp)}%"></span></div></div>`).join("")}
        ${members.length<4?'<div class="battle-hero empty-hero"><div class="empty-plus">＋</div><b>空き枠</b><small>仲間を編成できます</small></div>':''}</div>
      </div>
      <div class="battle-mid-mark">VS</div>
      <div class="battle-side enemy-side"><div class="side-label">ENEMY<small>敵</small></div><div class="enemy-showcase ${enemy.hp<=0?'is-defeated':''}"><div class="enemy-rings"></div><div class="enemy-sprite">${enemy.icon}</div><div class="enemy-title"><b>${enemy.name}</b><small>${enemy.hp<=0?'DEFEATED':'魔物 / 通常種'}</small></div><div class="enemy-hp"><span style="width:${pct(enemy.hp,enemy.maxHp)}%"></span></div><div class="enemy-hp-label">HP ${enemy.hp.toLocaleString('ja-JP')} / ${enemy.maxHp}</div></div></div>
    </div>
    <div style="padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.12)"><b>行動順：</b> ${order.map(id=>id==="enemy"?`<span style="margin-right:12px">🟢 ${enemy.name} (SPD ${enemy.spd})</span>`:`<span style="margin-right:12px">${char(id).icon} ${char(id).name} (SPD ${char(id).spd})</span>`).join(" → ")}<div style="margin-top:7px;color:var(--gold)">${state.battleWon?"勝利！":state.battleFlow.finished?"戦闘終了":activeChar?`行動中：${activeChar.name}`:"敵の行動中"}</div></div>
    <div class="battle-lower">
      <section class="party-status-panel"><div class="battle-panel-heading">PARTY STATUS <small>パーティー状況</small></div><div class="battle-status-list">${members.map(c=>`<div class="battle-status"><span class="status-face">${c.icon}</span><div class="status-main"><b>${c.name}</b><div class="status-bars"><span class="status-hp"><i style="width:${pct(c.hp,c.maxHp)}%"></i></span><span class="status-mp"><i style="width:${pct(c.mp,c.maxMp)}%"></i></span></div><small>HP ${c.hp}/${c.maxHp}　MP ${c.mp}/${c.maxMp}</small></div></div>`).join("")}</div></section>
      <section class="battle-command-panel"><div class="battle-panel-heading">COMMAND <small>行動を選択</small></div><div class="command-grid">
        <button class="battle-command primary-command" data-action="attack" ${!canAct?'disabled':''}><span>⚔</span><b>攻撃</b><small>通常攻撃</small></button>
        <button class="battle-command" data-action="skill" ${!canAct||activeChar.mp<10?'disabled':''}><span>✧</span><b>スキル</b><small>MP 10 / 1.55倍</small></button>
        <button class="battle-command" data-action="heal" ${!canAct||activeChar.mp<8?"disabled":""}><span>＋</span><b>回復</b><small>自分を回復 / MP 8</small></button>
        <button class="battle-command" data-action="guard" ${!canAct?"disabled":""}><span>◇</span><b>防御</b><small>被ダメージ半減</small></button>
      </div><div class="battle-actions-foot"><span>キャラクターごとに行動を選択</span><button data-action="reset-battle">↻ 再挑戦</button></div></section>
    </div>
    <section class="battle-log-panel"><div class="battle-panel-heading">BATTLE LOG <small>戦闘ログ</small></div><div class="battle-log-lines">${state.log.slice(0,4).map((x,i)=>`<p class="${i===0?'latest-log':''}">› ${x}</p>`).join('')}</div></section>
    ${state.battleWon?'<div class="battle-victory"><b>VICTORY</b><span>勝利！ コイン +500</span></div>':''}
  </section>`;
}
