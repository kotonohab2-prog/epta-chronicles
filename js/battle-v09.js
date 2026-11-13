/* EPTA CHRONICLES v0.9 - anime-style battle screen */
function battle(){
  const enemy=state.enemy;
  const members=state.party.map(char).filter(Boolean);
  const active=state.battleFlow.finished?null:currentBattleActor();
  const activeChar=active?char(active):null;
  const order=state.party.map(id=>state.battleFlow.commands?.find(x=>x.id===id)).filter(Boolean);
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
    <div style="padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.12)"><b>コマンド予約：</b> ${order.map(x=>`${char(x.id)?.name||x.id}：${({attack:"攻撃",skill:"スキル",heal:"回復",guard:"防御",flinch:"怯み"})[x.action]||x.action}`).join(" → ")||"未入力"}<div style="margin-top:7px;color:var(--gold)">${state.battleWon?"勝利！":state.battleFlow.finished?"戦闘終了":activeChar?`入力中：${activeChar.name}`:"行動確認中"}</div><button data-action="battle-back" ${!order.length||!canAct?"disabled":""}>← 前のキャラに戻る</button></div>
    <div class="battle-lower">
      <section class="party-status-panel"><div class="battle-panel-heading">PARTY STATUS <small>パーティー状況</small></div><div class="battle-status-list">${members.map(c=>`<div class="battle-status"><span class="status-face">${c.icon}</span><div class="status-main"><b>${c.name}</b><div class="status-bars"><span class="status-hp"><i style="width:${pct(c.hp,c.maxHp)}%"></i></span><span class="status-mp"><i style="width:${pct(c.mp,c.maxMp)}%"></i></span></div><small>HP ${c.hp}/${c.maxHp}　MP ${c.mp}/${c.maxMp}${c.guarding?`　🛡 防御中 (物理${guardReduction(c,"physical")}% / 魔法${guardReduction(c,"magic")}%)`:""}${statusList(c).map(s=>`　${STATUS_RULES[s.id]?.name||s.id}${s.remaining==null?"":` 残${s.remaining}`}`).join("")}</small></div></div>`).join("")}</div></section>
      <section class="battle-command-panel"><div class="battle-panel-heading">COMMAND <small>行動を選択</small></div><div class="command-grid">
        <button class="battle-command primary-command" data-action="attack" ${!canAct?'disabled':''}><span>⚔</span><b>攻撃</b><small>通常攻撃</small></button>
        <button class="battle-command" data-action="skill" ${!canAct||activeChar.mp<10?'disabled':''}><span>✧</span><b>スキル</b><small>MP 10 / 1.55倍</small></button>
        <button class="battle-command" data-action="heal" ${!canAct||activeChar.mp<8?"disabled":""}><span>＋</span><b>回復</b><small>自分を回復 / MP 8</small></button>
        <button class="battle-command" data-action="guard" ${!canAct?"disabled":""}><span>◇</span><b>防御</b><small>${activeChar?`物理${guardReduction(activeChar,"physical")}% / 魔法${guardReduction(activeChar,"magic")}%軽減`:"ランク別に軽減"}</small></button>
      </div><div class="battle-actions-foot"><span>味方全員のコマンドを決定すると行動開始</span><button data-action="reset-battle">↻ 再挑戦</button></div></section>
    </div>
    <section class="battle-log-panel"><div class="battle-panel-heading">状態異常一覧 <small>確認済みの仕様</small></div><p>☠ 毒：ラウンド終了時に継続ダメージ　／　🔥 火傷：ラウンド終了時に継続ダメージ　／　✦ 怯み：次の1回の行動を中止</p><p style="font-size:12px;opacity:.75">異なる状態異常は同時付与可。同じ状態異常は再付与しても残り時間を更新しません。後衛では毒・火傷の時間とダメージが停止します。ダメージ率・持続時間は未決定です。</p></section>
    <section class="battle-log-panel"><div class="battle-panel-heading">BATTLE LOG <small>戦闘ログ</small></div><div class="battle-log-lines">${state.log.slice(0,4).map((x,i)=>`<p class="${i===0?'latest-log':''}">› ${x}</p>`).join('')}</div></section>
    ${state.battleWon?'<div class="battle-victory"><b>VICTORY</b><span>勝利！ コイン +500</span></div>':''}
  </section>`;
}
