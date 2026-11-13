const $ = (s, root=document) => root.querySelector(s);

const continentScenes = [
  {id:"magi",name:"マギ大陸",place:"ベリル王国 — 翡翠の森",desc:"深い森と古城、清らかな滝が広がる緑豊かな大地。",palette:"magi"},
  {id:"akitsu",name:"秋津",place:"京洛 — 桜花の都",desc:"桜並木と古い町並み、雅やかな文化が息づく国。",palette:"akitsu"},
  {id:"risei",name:"璃星大陸",place:"雲閣港 — 水上の交易都市",desc:"山あいの港と楼閣を結ぶ水路に、交易船が行き交う。",palette:"risei"},
  {id:"narod",name:"ナロードナヤ",place:"白銀の雪原",desc:"果てしない雪原と氷山が連なる、静寂の北方大陸。",palette:"narod"},
  {id:"suez",name:"スエズ",place:"砂海 — 古代王朝の遺跡",desc:"黄金の砂丘と巨大な遺跡が眠る、太陽の大地。",palette:"suez"},
  {id:"profun",name:"プロフン",place:"深緑の密林 — 水晶の泉",desc:"巨大な樹木と鮮やかな花々、豊かな水に満ちた熱帯雨林。",palette:"profun"},
  {id:"kila",name:"キラウエア",place:"火山島 — 紅蓮の海岸",desc:"火山と青い海が隣り合う、熱気あふれる島々。",palette:"kila"}
];
let currentScene = continentScenes[Math.floor(Math.random()*continentScenes.length)];

const state = {
  gems: 1000, coins: 5000, view: "home",
  characters: [
    {id:"riku",name:"リク",role:"旅人",element:"風",icon:"🗡️",hp:120,maxHp:120,atk:24,rarity:4},
    {id:"mira",name:"ミラ",role:"魔法使い",element:"炎",icon:"🔥",hp:90,maxHp:90,atk:32,rarity:4},
    {id:"sena",name:"セナ",role:"守り手",element:"光",icon:"🛡️",hp:150,maxHp:150,atk:18,rarity:3}
  ],
  party:["riku","mira","sena"],
  enemy:{name:"森のスライム",icon:"🟢",hp:150,maxHp:150,atk:13},
  battleStarted:false, battleWon:false, turn:1, log:["マギ大陸の森で魔物が現れた！"], action:"attack",
  achievements:{firstBattle:false,firstSummon:false,win3:false},
  titles:[], notification:true
};
const defaults = structuredClone(state);
const saved = localStorage.getItem("epta-save-v02");
if(saved){try{const d=JSON.parse(saved);Object.assign(state,d)}catch(e){}}

// 主人公5人：★5召喚キャラクター
if(!Array.isArray(state.summonedCharacters)) state.summonedCharacters=[];
// 既存セーブデータは天井導入時に一度だけ70回分を引き継ぐ
if(!Number.isInteger(state.pityCount)) state.pityCount = saved ? 70 : 0;
state.pityCount = Math.max(0, Math.min(79, state.pityCount));
// SPDは暫定値。既存のセーブにも適用する
// 試作キャラクターの防御・魔力ランク（本設定が決まるまでの仮値）
const demoGuardRanks={riku:{defense:"B",magic:"C"},mira:{defense:"D",magic:"A"},sena:{defense:"A",magic:"B"}};
const GUARD_REDUCTION={
  D:20,C:30,B:40,
  A:45,"A+":47,"A++":49,"A+++":51,
  AA:54,"AA+":56,"AA++":58,"AA+++":60,
  AAA:63,"AAA+":65,"AAA++":67,"AAA+++":69,
  S:72,"S+":74,"S++":76,"S+++":78,
  SS:81,"SS+":83,"SS++":85,"SS+++":87,SSS:90
};
function guardReduction(actor,damageType="physical"){
  const rank=damageType==="magic"?actor.magicRank:actor.defenseRank;
  return GUARD_REDUCTION[rank]??0;
}
const baseSpd={riku:110,mira:85,sena:65};
state.characters.forEach(c=>{if(!Number.isFinite(c.spd)) c.spd=baseSpd[c.id]||75; if(!Number.isFinite(c.maxMp)) c.maxMp=30; if(!Number.isFinite(c.mp)) c.mp=c.maxMp; const ranks=demoGuardRanks[c.id]; if(ranks){if(!c.defenseRank)c.defenseRank=ranks.defense;if(!c.magicRank)c.magicRank=ranks.magic;} if(typeof c.guarding!=="boolean")c.guarding=false;});
if(!Number.isFinite(state.enemy.spd)) state.enemy.spd=90;
if(!state.battleFlow || !Array.isArray(state.battleFlow.commands)) state.battleFlow={queue:[],commands:[],index:0,round:0,phase:"input",inputIndex:0,finished:false};
const protagonistPool=[
  {id:"kaisei",name:"松永海聖",role:"剣士",rarity:5,portrait:"kaisei-portrait.webp"},
  {id:"sho",name:"石原翔",role:"ライダー",rarity:5,portrait:"sho-portrait.webp"},
  {id:"yuki",name:"古木勇樹",role:"魔道士",rarity:5,portrait:"yuki-portrait.webp"},
  {id:"shunki",name:"野田沢隼輝",role:"ガンナー",rarity:5,portrait:"shunki-portrait.webp"},
  {id:"daiki",name:"今野大輝",role:"桜部隊隊長",rarity:5,portrait:"daiki-portrait.webp"}
];
const standardPool=[
  {id:"riku",name:"リク",rarity:4,icon:"🗡️"},
  {id:"mira",name:"ミラ",rarity:4,icon:"🔥"},
  {id:"sena",name:"セナ",rarity:3,icon:"🛡️"}
];
const gemPacks=[
  {id:"small",name:"お試し交換",gems:500,coins:1000,tag:"まずはお試し"},
  {id:"medium",name:"冒険者パック",gems:1200,coins:2200,tag:"おすすめ"},
  {id:"large",name:"大容量パック",gems:3000,coins:5000,tag:"人気"},
  {id:"mega",name:"特大パック",gems:6500,coins:10000,tag:"たっぷり"}
];
function save(){localStorage.setItem("epta-save-v02",JSON.stringify(state));}
function fmt(n){return n.toLocaleString("ja-JP")}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),1900)}
function addLog(msg){state.log.unshift(msg);state.log=state.log.slice(0,12)}
function char(id){return state.characters.find(c=>c.id===id)}
function setView(view){state.view=view;document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("selected",b.dataset.view===view));render()}
function head(title,sub){return `<div class="section-head"><div><h1>${title}</h1><p>${sub}</p></div><span class="tag">EPTA PROTOTYPE</span></div>`}
function home(){return `
<section class="home-dashboard reference-home">
  <div class="home-hero">
    <div class="hero-artwork scene-${currentScene.palette}">
      <div class="hero-copy">
        <div class="eyebrow">EPTA CONTINENT · SEVEN LANDS</div>
        <div class="location-label">${currentScene.name}　/　${currentScene.place}</div>
        <h1>七つの大陸が、<br>君を待っている。</h1>
        <p>${currentScene.desc}</p>
        <button class="btn hero-start" data-action="go-battle">冒険を始める <span>›</span></button>
      </div>
      <div class="hero-caption">A JOURNEY THROUGH SEVEN CONTINENTS</div>
      <button class="scene-shuffle" data-action="shuffle-scene"><span>⟳</span> 風景を切り替える</button>
    </div>
    <aside class="hero-side">
      <button class="profile-card" data-view="settings">
        <span class="profile-avatar">旅</span>
        <span class="profile-details"><small>ADVENTURER</small><b>旅人</b><span>冒険者 Lv.1</span></span>
        <span class="profile-arrow">›</span>
      </button>
      <section class="chapter-card">
        <div class="mini-heading"><span>MAIN STORY</span><span>01 / 07</span></div>
        <h2>旅立ちの序章</h2>
        <p>マギ大陸で始まる、小さな冒険。</p>
        <div class="chapter-progress"><span style="width:${state.achievements.firstBattle?35:8}%"></span></div>
        <div class="chapter-foot"><span>進行度</span><b>${state.achievements.firstBattle?35:8}%</b></div>
      </section>
      <button class="daily-card" data-view="records">
        <span class="daily-icon">☆</span>
        <span class="daily-copy"><b>冒険の記録</b><small>実績・称号を確認する</small></span>
        <strong>›</strong>
      </button>
    </aside>
  </div>
  <div class="home-panels">
    <section class="home-panel quick-panel">
      <div class="panel-title"><div><span class="eyebrow">QUICK ACCESS</span><h2>メニュー</h2></div><small>冒険の準備をしよう</small></div>
      <div class="home-shortcuts">
        <button data-view="party"><span class="shortcut-icon">♟</span><b>仲間</b><small>キャラクター編成</small></button>
        <button data-view="gacha"><span class="shortcut-icon">✧</span><b>召喚</b><small>新たな出会い</small></button>
        <button data-view="records"><span class="shortcut-icon">☆</span><b>実績・称号</b><small>冒険の足跡</small></button>
        <button data-view="settings"><span class="shortcut-icon">⚙</span><b>設定</b><small>ゲーム環境を調整</small></button>
      </div>
    </section>
    <section class="home-panel notice-panel">
      <div class="panel-title"><div><span class="eyebrow">NOTICE</span><h2>お知らせ</h2></div><span class="notice-count">01</span></div>
      <div class="notice-line"><span class="notice-dot"></span><div><b>エプタ大陸へようこそ！</b><small>この壮大な世界で、あなただけの物語を紡ごう。</small></div><time>NEW</time></div>
      <div class="notice-line muted-line"><span class="notice-dot"></span><div><b>ホーム画面アップデート</b><small>七つの大陸の風景をランダムに表示します。</small></div><time>INFO</time></div>
    </section>
  </div>
</section>`}
function party(){
  const owned=protagonistPool.filter(p=>state.summonedCharacters.includes(p.id));
  return `${head("キャラクター","仲間の情報を確認しよう。召喚で迎えた主人公はここに表示されます。")}
  <div class="grid2">${state.characters.map(c=>`<article class="card char"><div class="portrait ${c.element==="炎"?"fire":c.element==="風"?"wind":"light"}">${c.icon}</div><div><h3>${c.name} <span class="pill">★${c.rarity}</span></h3><p>${c.role} · ${c.element}属性</p><p>HP ${c.hp}/${c.maxHp} · 攻撃 ${c.atk}</p><span class="pill">パーティー${state.party.includes(c.id)?"編成中":"未編成"}</span></div></article>`).join("")}</div>
  <article class="card" style="margin-top:10px"><h3>召喚で迎えた主人公</h3>
  ${owned.length?`<div class="grid2">${owned.map(p=>`<article class="card char"><img src="${p.portrait}" alt="${p.name}" style="width:92px;height:120px;object-fit:contain;object-position:center top;border-radius:9px"><div><h3>${p.name} <span class="pill">★5</span></h3><p>${p.role}</p><span class="pill">所持</span></div></article>`).join("")}</div>`:`<p class="muted">まだ主人公を召喚していません。召喚で迎えると、ここに表示されます。</p>`}
  <h3 style="margin-top:16px">パーティー</h3><p class="muted">現在の試作編成：${state.party.map(id=>char(id)?.name).join(" / ")}</p><p class="muted">主人公5人の戦闘参加・編成機能は次の段階で実装します。</p></article>`;
}function battle(){
  const enemy=state.enemy;
  const members=state.party.map(char).filter(Boolean);
  const pct=(v,m)=>Math.max(0,Math.min(100,v/m*100));
  return `${head("冒険・バトル","マギ大陸・翡翠の森 — ターン制コマンドバトル")}
  <section class="anime-battle">
    <div class="battle-topline"><span><i></i> BATTLE AREA / MAGI CONTINENT</span><b>TURN <strong>${state.turn}</strong></b></div>
    <div class="battle-stage">
      <div class="stage-glow"></div><div class="stage-grid"></div>
      <div class="battle-side allies-side"><div class="side-label">YOUR PARTY <small>味方</small></div>
        <div class="battle-formation">${members.map((c,i)=>`<div class="battle-hero hero-${i+1} ${c.hp<=0?'is-down':''}"><div class="hero-orbit"></div><div class="hero-sprite">${c.icon}</div><div class="hero-nameplate"><b>${c.name}</b><small>${c.role} / ${c.element}</small></div><div class="hero-hp"><span style="width:${pct(c.hp,c.maxHp)}%"></span></div></div>`).join('')}
        ${members.length<4?`<div class="battle-hero empty-hero"><div class="empty-plus">＋</div><b>空き枠</b><small>仲間を編成できます</small></div>`:''}</div>
      </div>
      <div class="battle-mid-mark">VS</div>
      <div class="battle-side enemy-side"><div class="side-label">ENEMY <small>敵</small></div><div class="enemy-showcase ${enemy.hp<=0?'is-defeated':''}"><div class="enemy-rings"></div><div class="enemy-sprite">${enemy.icon}</div><div class="enemy-title"><b>${enemy.name}</b><small>${enemy.hp<=0?'DEFEATED':'魔物 / 通常種'}</small></div><div class="enemy-hp"><span style="width:${pct(enemy.hp,enemy.maxHp)}%"></span></div><div class="enemy-hp-label">HP ${enemy.hp.toLocaleString('ja-JP')} / ${enemy.maxHp}</div></div></div>
    </div>
    <div class="battle-lower">
      <section class="party-status-panel"><div class="battle-panel-heading">PARTY STATUS <small>パーティー状況</small></div><div class="battle-status-list">${members.map(c=>`<div class="battle-status"><span class="status-face">${c.icon}</span><div class="status-main"><b>${c.name}</b><div class="status-bars"><span class="status-hp"><i style="width:${pct(c.hp,c.maxHp)}%"></i></span><span class="status-mp"><i style="width:65%"></i></span></div><small>HP ${c.hp}/${c.maxHp}　MP --</small></div></div>`).join('')}</div></section>
      <section class="battle-command-panel"><div class="battle-panel-heading">COMMAND <small>行動を選択</small></div><div class="command-grid"><button class="battle-command primary-command" data-action="attack" ${enemy.hp<=0?'disabled':''}><span>⚔</span><b>攻撃</b><small>通常攻撃</small></button><button class="battle-command" data-action="skill" ${enemy.hp<=0?'disabled':''}><span>✧</span><b>スキル</b><small>強力な一撃</small></button><button class="battle-command" data-action="heal"><span>＋</span><b>回復</b><small>HPを全回復</small></button><button class="battle-command" data-action="guard"><span>◇</span><b>防御</b><small>敵の攻撃を軽減</small></button></div><div class="battle-actions-foot"><span>行動を選ぶとターンが進みます</span><button data-action="reset-battle">↻ 再挑戦</button></div></section>
    </div>
    <section class="battle-log-panel"><div class="battle-panel-heading">BATTLE LOG <small>戦闘ログ</small></div><div class="battle-log-lines">${state.log.slice(0,4).map((x,i)=>`<p class="${i===0?'latest-log':''}">› ${x}</p>`).join('')}</div></section>
    ${state.battleWon?`<div class="battle-victory"><b>VICTORY</b><span>勝利！ コイン +500</span></div>`:''}
  </section>`
}
function gacha(){
  return `${head("キャラクター召喚","召喚石を使って仲間を迎えよう。主人公5人は★5として登場します。")}
  <div class="grid2">
    <article class="card">
      <div class="eyebrow">STANDARD SUMMON</div><h2>旅立ちの召喚</h2>
      <p class="muted">★5：1% ／ ★4：14% ／ ★3：85%</p>
      <p class="muted">★5枠は主人公5人。各キャラクターの個別排出率は0.2%です。</p>
      <p><b>★5天井：${state.pityCount} / 80</b>　<span class="muted">あと${80-state.pityCount}回で★5主人公確定</span></p>
      <div style="height:10px;background:rgba(128,128,128,.25);border-radius:999px;overflow:hidden;margin-bottom:12px"><div style="height:100%;width:${state.pityCount/80*100}%;background:#D6AD65;border-radius:999px"></div></div>
      <div class="grid2" style="margin:12px 0">${protagonistPool.map(p=>`<div style="display:flex;align-items:center;gap:8px;min-width:0"><img src="${p.portrait}" alt="${p.name}" style="width:48px;height:64px;object-fit:contain;object-position:center top;border-radius:6px"><small>${p.name}<br>★5 · 0.2%</small></div>`).join("")}</div>
      <h2 style="color:var(--gold)">✧ ${fmt(state.gems)}</h2>
      <div class="command-row"><button class="btn" data-action="summon">1回召喚　100</button><button class="btn secondary" data-action="summon10">10回召喚　1,000</button></div>
    </article>
    <article class="card"><h3>召喚について</h3>
      <p class="muted">★5：主人公5人（各0.2%）</p>
      <p class="muted">★5が出なければ80回目に主人公5人からランダム確定。★5が出ると天井カウントはリセットされます。</p>
      <p class="muted">★4：リク・ミラ（各7%）</p>
      <p class="muted">★3：セナ（85%）</p>
      <p class="muted">重複して召喚した場合も結果に表示されます。主人公の所持状況はこの端末のセーブデータに保存されます。</p>
      <p class="muted">試作版のため、実際の課金やオンライン抽選はありません。</p>
    </article>
  </div>`;
  
}

function records(){const ach=[["firstBattle","初めての勝利","バトルで初めて勝利する"],["firstSummon","新たな出会い","初めて召喚する"],["win3","森の探索者","バトルに3回勝利する（試作版では初回勝利で進捗を表示）"]];return `${head("実績・称号","冒険の足跡を確認しよう。")}<div class="grid2"><article class="card"><h3>実績</h3>${ach.map(([id,n,d])=>`<div class="setting-row"><div><b>${n}</b><div class="muted">${d}</div></div><span class="pill">${state.achievements[id]?"達成":"未達成"}</span></div>`).join("")}</article><article class="card"><h3>称号コレクション</h3><p class="muted">獲得した称号はここに保存されます。</p>${state.titles.length?state.titles.map(t=>`<div class="setting-row"><b>✦ ${t}</b><span class="pill">所持</span></div>`).join(""):`<div class="empty">まだ称号を獲得していません。</div>`}<p class="muted">称号の詳細な管理・検索・履歴機能は今後追加予定です。</p></article></div>`}
function settings(){return `${head("設定","試作版の基本設定。設定はこの端末のブラウザに保存されます。")}<article class="card"><div class="setting-row"><div><b>称号獲得通知</b><div class="muted">称号を獲得した際の簡易通知</div></div><button class="switch ${state.notification?"on":""}" data-action="toggle-notification" aria-label="称号獲得通知"></button></div><div class="setting-row"><div><b>セーブデータ</b><div class="muted">ブラウザのローカルストレージを使用</div></div><button class="choice" data-action="reset-save">データ初期化</button></div><p class="muted">アカウント同期・クラウド保存は未実装です。ブラウザのデータ削除でセーブが消える場合があります。</p></article>`}

function shop(){
  return `${head("召喚石ショップ","ゲーム内コインを召喚石に交換しよう。実際のお金は一切使いません。")}
  <div class="grid2">
    <article class="card">
      <div class="eyebrow">VIRTUAL EXCHANGE</div>
      <h2>召喚石交換所</h2>
      <p class="muted">所持コイン：🪙 ${fmt(state.coins)} ／ 所持召喚石：✧ ${fmt(state.gems)}</p>
      <div class="grid2">
        ${gemPacks.map(p=>`
          <article class="card">
            <span class="pill">${p.tag}</span>
            <h2 style="color:var(--gold)">✧ ${fmt(p.gems)}</h2>
            <h3>${p.name}</h3>
            <p>必要コイン：🪙 ${fmt(p.coins)}</p>
            <button class="btn" data-action="buy-gems" data-pack="${p.id}" ${state.coins<p.coins?"disabled":""}>交換する</button>
          </article>
        `).join("")}
      </div>
    </article>
    <article class="card">
      <h3>交換について</h3>
      <p class="muted">このショップは仮想ショップです。実際のお金は使用しません。</p>
      <p class="muted">ゲーム内コインを消費して召喚石を獲得できます。</p>
      <p class="muted">召喚石100個で1回召喚、1,000個で10回召喚できます。</p>
    </article>
  </div>`;
}
function render(){if(state.view==="battle")ensureBattleReady();const s=$("#screen");s.innerHTML=({home,battle,party,gacha,shop,records,settings}[state.view]||home)();$("#gems").textContent=fmt(state.gems);$("#coins").textContent=fmt(state.coins);save()}
function win(){
  if(state.battleWon)return;
  state.battleWon=true;state.battleFlow.finished=true;
  state.achievements.firstBattle=true;state.coins+=500;
  if(!state.titles.includes("森の初勝利"))state.titles.push("森の初勝利");
  addLog("魔物を倒した！ コインを500枚獲得。");toast("勝利！");
}
function battleActor(key){return key==="enemy"?state.enemy:char(key)}
function battleAlive(key){const c=battleActor(key);return !!c&&c.hp>0}

const STATUS_RULES={
  poison:{name:"毒",icon:"☠",kind:"damage"},
  burn:{name:"火傷",icon:"🔥",kind:"damage"},
  flinch:{name:"怯み",icon:"✦",kind:"skip"}
};
// 継続ダメージ率・持続ターン数は未確定。デモでの付与は行わず、将来のスキル実装時に指定する。
function statusList(actor){if(!Array.isArray(actor.statusEffects))actor.statusEffects=[];return actor.statusEffects}
function addStatus(actor,id,rounds=null){
  if(!STATUS_RULES[id]||actor.hp<=0)return false;
  const list=statusList(actor);
  if(list.some(s=>s.id===id))return false;
  list.push({id,remaining:Number.isInteger(rounds)?rounds:null});
  return true;
}
function clearOnKO(actor){
  actor.guarding=false;actor.buffs=[];actor.debuffs=[];actor.statusEffects=[];
}
function knockOut(actor){actor.hp=0;clearOnKO(actor)}
function setBackline(actor,backline){
  actor.backline=!!backline;
  if(backline){actor.buffs=[];actor.debuffs=[]}
}
function activeParty(){return state.party.map(char).filter(c=>c&&!c.backline&&c.hp>0)}
function applyRoundEndStatuses(){
  for(const actor of [...state.party.map(char).filter(Boolean),state.enemy]){
    if(actor.hp<=0||actor.backline)continue;
    for(const status of [...statusList(actor)]){
      if(status.id==="poison"||status.id==="burn"){
        // ダメージ量は未確定。effect.damageが設定された場合のみ適用する。
        const damage=Math.max(0,Math.floor(Number(status.damage)||0));
        if(damage){actor.hp=Math.max(0,actor.hp-damage);addLog(`${actor.name}は${STATUS_RULES[status.id].name}で${damage}ダメージ！`)}
        if(actor.hp<=0){knockOut(actor);addLog(`${actor.name}は戦闘不能になった！`);break}
      }
      if(Number.isInteger(status.remaining)){
        status.remaining--;
        if(status.remaining<=0){actor.statusEffects=actor.statusEffects.filter(s=>s!==status);addLog(`${actor.name}の${STATUS_RULES[status.id].name}が治った。`)}
      }
    }
  }
}
function ensureFlow(){
  if(!state.battleFlow||!Array.isArray(state.battleFlow.queue)||!Array.isArray(state.battleFlow.commands)){
    state.battleFlow={queue:[],commands:[],index:0,round:0,phase:"input",inputIndex:0,finished:false};
  }
}
function beginBattleRound(){
  if(state.enemy.hp<=0||state.battleWon)return;
  ensureFlow();
  state.battleFlow={queue:[],commands:[],index:0,round:state.turn,phase:"input",inputIndex:0,finished:false};
  addLog(`ラウンド${state.turn}：味方の行動を選択してな！`);
  skipUnavailableInputs();
}
function skipUnavailableInputs(){
  const flow=state.battleFlow;
  while(flow.inputIndex<state.party.length){
    const actor=char(state.party[flow.inputIndex]);
    if(!actor||actor.hp<=0||actor.backline){flow.inputIndex++;continue}
    if(statusList(actor).some(s=>s.id==="flinch")){
      flow.commands.push({id:actor.id,action:"flinch",priority:0});
      flow.inputIndex++;continue;
    }
    break;
  }
}
function currentBattleActor(){
  ensureFlow();
  if(state.battleFlow.round!==state.turn)beginBattleRound();
  if(state.battleFlow.phase!=="input")return null;
  skipUnavailableInputs();
  return state.party[state.battleFlow.inputIndex]||null;
}
function backBattleInput(){
  const flow=state.battleFlow;
  if(flow.phase!=="input"||!flow.commands.length)return;
  const previous=flow.commands.pop();
  flow.inputIndex=state.party.indexOf(previous.id);
  render();
}
function endBattleIfNeeded(){
  if(state.enemy.hp<=0){win();return true}
  if(!activeParty().length){state.battleFlow.finished=true;state.battleFlow.phase="finished";addLog("仲間は全員倒れてしまった……");return true}
  return false;
}
function executeBattleRound(){
  const flow=state.battleFlow;
  flow.phase="execute";
  const entries=flow.commands.map(cmd=>({...cmd,spd:char(cmd.id)?.spd||0,tie:Math.random()}));
  entries.push({id:"enemy",action:"enemy",priority:0,spd:state.enemy.spd||0,tie:Math.random()});
  entries.sort((a,b)=>b.priority-a.priority||b.spd-a.spd||a.tie-b.tie);
  flow.queue=entries.map(x=>x.id);
  for(const entry of entries){
    if(endBattleIfNeeded())break;
    if(entry.id==="enemy"){enemyTurn();continue}
    const actor=char(entry.id);
    if(!actor||actor.hp<=0||actor.backline)continue;
    const flinch=statusList(actor).find(s=>s.id==="flinch");
    if(flinch){actor.statusEffects=actor.statusEffects.filter(s=>s!==flinch);addLog(`${actor.name}は怯んで動けない！`);continue}
    if(entry.action==="flinch")continue;
    actor.guarding=false;
    if(entry.action==="attack"||entry.action==="skill"){
      const damage=entry.action==="skill"?Math.round(actor.atk*1.55):actor.atk;
      if(entry.action==="skill"){if(actor.mp<10)continue;actor.mp-=10}
      // 敵が複数になった場合は実行直前に生存対象へ再抽選する
      state.enemy.hp=Math.max(0,state.enemy.hp-damage);
      addLog(`${actor.name}の${entry.action==="skill"?"スキル":"攻撃"}！ ${damage}ダメージ。`);
    }else if(entry.action==="heal"){
      if(actor.mp<8)continue;
      actor.mp-=8;
      const healed=Math.min(actor.maxHp-actor.hp,Math.max(20,Math.round(actor.maxHp*.35)));
      actor.hp+=healed;addLog(`${actor.name}はHPを${healed}回復した。`);
    }else if(entry.action==="guard"){
      actor.guarding=true;addLog(`${actor.name}は防御態勢！ 物理${guardReduction(actor,"physical")}%・魔法${guardReduction(actor,"magic")}%軽減。`);
    }
  }
  if(endBattleIfNeeded())return;
  applyRoundEndStatuses();
  if(endBattleIfNeeded())return;
  state.turn++;
  beginBattleRound();
}
function enemyTurn(){
  if(state.enemy.hp<=0)return;
  const living=activeParty();
  if(!living.length)return;
  const target=living[Math.floor(Math.random()*living.length)];
  const reduction=target.guarding?guardReduction(target,"physical"):0;
  const damage=Math.max(1,Math.round(state.enemy.atk*(1-reduction/100)));
  target.hp=Math.max(0,target.hp-damage);
  addLog(`${state.enemy.name}の攻撃！ ${target.name}に${damage}ダメージ。`);
  if(target.hp<=0){knockOut(target);addLog(`${target.name}は戦闘不能になった！`)}
}
function doBattleAction(action){
  if(state.enemy.hp<=0||state.battleWon){toast("戦闘は終了しているで");return}
  ensureBattleReady();
  const flow=state.battleFlow;
  if(flow.finished)return;
  const id=currentBattleActor();
  if(!id)return;
  const actor=char(id);
  if(action==="skill"&&actor.mp<10){toast("MPが足りません");return}
  if(action==="heal"&&actor.mp<8){toast("MPが足りません");return}
  if(!["attack","skill","heal","guard"].includes(action))return;
  flow.commands.push({id,action,priority:0});
  flow.inputIndex++;
  skipUnavailableInputs();
  if(flow.inputIndex>=state.party.length)executeBattleRound();
  render();
}
function resetBattle(){
  state.enemy.hp=state.enemy.maxHp;state.enemy.statusEffects=[];state.battleWon=false;state.turn=1;
  state.party.map(char).filter(Boolean).forEach(c=>{c.hp=c.maxHp;c.mp=c.maxMp;c.guarding=false;c.statusEffects=[];c.buffs=[];c.debuffs=[];c.backline=false});
  state.log=["森のスライムが現れた！"];
  beginBattleRound();render();
}
function ensureBattleReady(){
  ensureFlow();
  if(state.enemy.hp<=0||state.battleWon||state.battleFlow.finished)return;
  if(state.battleFlow.round!==state.turn||!state.battleFlow.queue.length&&state.battleFlow.phase!=="input")beginBattleRound();
}
function summon(count){
  const cost=count*100;
  if(state.gems<cost){toast("召喚石が足りません");return}
  state.gems-=cost;
  const pool=[...protagonistPool,...standardPool];
  const got=[];
  for(let i=0;i<count;i++){
    const roll=Math.random()*100;
    const rarity=state.pityCount>=79||roll<1?5:roll<15?4:3;
    state.pityCount=rarity===5?0:state.pityCount+1;
    const choices=pool.filter(p=>p.rarity===rarity);
    const item=choices[Math.floor(Math.random()*choices.length)];
    const isNew=item.rarity===5&&!state.summonedCharacters.includes(item.id);
    if(item.rarity===5&&isNew) state.summonedCharacters.push(item.id);
    got.push({...item,isNew});
  }
  state.achievements.firstSummon=true;
  addLog("召喚："+got.map(x=>x.name+"（★"+x.rarity+"）").join("、"));
  render();
  showModal("召喚結果",got.map(x=>`
    <div class="result-row" style="display:flex;align-items:center;gap:12px;margin:10px 0">
      ${x.portrait?`<img src="${x.portrait}" alt="${x.name}" style="width:68px;height:88px;object-fit:contain;object-position:center top;border-radius:7px">`:`<span style="font-size:28px">${x.icon||"✧"}</span>`}
      <div><b>${x.name}（★${x.rarity}）</b><small style="display:block;color:var(--muted)">${x.rarity===5?(x.isNew?"新たな主人公が仲間になった！":"所持済みの主人公"):"召喚成功"}</small></div>
    </div>`).join(""));
}function showModal(title,body){const root=$("#modal-root");root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><b>${title}</b><button data-action="close-modal">×</button></div><div class="modal-body">${body}</div><button class="btn" data-action="close-modal">閉じる</button></div></div>`}
document.addEventListener("click",e=>{const v=e.target.closest("[data-view]");if(v){setView(v.dataset.view);return}const b=e.target.closest("[data-action]");if(!b)return;const a=b.dataset.action;
if(a==="go-battle")setView("battle");
if(a==="shuffle-scene"){const options=continentScenes.filter(s=>s.id!==currentScene.id);currentScene=options[Math.floor(Math.random()*options.length)];render();toast(`${currentScene.name}の風景に切り替えたで`)}
if(["attack","skill","guard","heal"].includes(a))doBattleAction(a);
if(a==="reset-battle")resetBattle();if(a==="battle-back")backBattleInput()
if(a==="summon")summon(1);if(a==="summon10")summon(10);                                      
if(a==="buy-gems"){
  const pack=gemPacks.find(p=>p.id===b.dataset.pack);
  if(!pack){toast("商品が見つかりません");return}
  if(state.coins<pack.coins){
    toast("コインが足りません！");
    return;
  }
  state.coins-=pack.coins;
  state.gems+=pack.gems;
  addLog(pack.name+"を交換した。");
  render();
  toast(pack.gems+"個の召喚石を獲得！");
}
if(a==="toggle-notification"){state.notification=!state.notification;render();toast("通知設定を変更したで")}
if(a==="reset-save"){showModal("セーブデータ初期化","<p>この端末に保存した試作版データを初期化します。よろしいですか？</p><button class='btn danger' data-action='confirm-reset'>初期化する</button>")}
if(a==="confirm-reset"){localStorage.removeItem("epta-save-v02");location.reload()}
if(a==="close-modal")$("#modal-root").innerHTML="";
});
function showModal(title,body){const root=$("#modal-root");root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><b>${title}</b><button data-action="close-modal">×</button></div><div class="modal-body">${body}</div><button class="btn secondary" data-action="close-modal">戻る</button></div></div>`}
render();
