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
      <div class="grid2" style="margin:12px 0">${protagonistPool.map(p=>`<div style="display:flex;align-items:center;gap:8px;min-width:0"><img src="${p.portrait}" alt="${p.name}" style="width:48px;height:64px;object-fit:contain;object-position:center top;border-radius:6px"><small>${p.name}<br>★5 · 0.2%</small></div>`).join("")}</div>
      <h2 style="color:var(--gold)">✧ ${fmt(state.gems)}</h2>
      <div class="command-row"><button class="btn" data-action="summon">1回召喚　100</button><button class="btn secondary" data-action="summon10">10回召喚　1,000</button></div>
    </article>
    <article class="card"><h3>召喚について</h3>
      <p class="muted">★5：主人公5人（各0.2%）</p>
      <p class="muted">★4：リク・ミラ（各7%）</p>
      <p class="muted">★3：セナ（85%）</p>
      <p class="muted">重複して召喚した場合も結果に表示されます。主人公の所持状況はこの端末のセーブデータに保存されます。</p>
      <p class="muted">試作版のため、実際の課金やオンライン抽選はありません。</p>
    </article>
  </div>`;
}function records(){const ach=[["firstBattle","初めての勝利","バトルで初めて勝利する"],["firstSummon","新たな出会い","初めて召喚する"],["win3","森の探索者","バトルに3回勝利する（試作版では初回勝利で進捗を表示）"]];return `${head("実績・称号","冒険の足跡を確認しよう。")}<div class="grid2"><article class="card"><h3>実績</h3>${ach.map(([id,n,d])=>`<div class="setting-row"><div><b>${n}</b><div class="muted">${d}</div></div><span class="pill">${state.achievements[id]?"達成":"未達成"}</span></div>`).join("")}</article><article class="card"><h3>称号コレクション</h3><p class="muted">獲得した称号はここに保存されます。</p>${state.titles.length?state.titles.map(t=>`<div class="setting-row"><b>✦ ${t}</b><span class="pill">所持</span></div>`).join(""):`<div class="empty">まだ称号を獲得していません。</div>`}<p class="muted">称号の詳細な管理・検索・履歴機能は今後追加予定です。</p></article></div>`}
function settings(){return `${head("設定","試作版の基本設定。設定はこの端末のブラウザに保存されます。")}<article class="card"><div class="setting-row"><div><b>称号獲得通知</b><div class="muted">称号を獲得した際の簡易通知</div></div><button class="switch ${state.notification?"on":""}" data-action="toggle-notification" aria-label="称号獲得通知"></button></div><div class="setting-row"><div><b>セーブデータ</b><div class="muted">ブラウザのローカルストレージを使用</div></div><button class="choice" data-action="reset-save">データ初期化</button></div><p class="muted">アカウント同期・クラウド保存は未実装です。ブラウザのデータ削除でセーブが消える場合があります。</p></article>`}
function render(){const s=$("#screen");s.innerHTML=({home,battle,party,gacha,records,settings}[state.view]||home)();$("#gems").textContent=fmt(state.gems);$("#coins").textContent=fmt(state.coins);save()}
function win(){if(state.battleWon)return;state.battleWon=true;state.achievements.firstBattle=true;state.coins+=500;state.titles.push("森の初勝利");addLog("魔物を倒した！ コインを500枚獲得。");toast("実績達成：初めての勝利")}
function enemyTurn(){if(state.enemy.hp<=0)return;const living=state.party.map(char).filter(c=>c&&c.hp>0);if(!living.length){addLog("仲間は全員倒れてしまった……");return}const target=living[Math.floor(Math.random()*living.length)];target.hp=Math.max(0,target.hp-state.enemy.atk);addLog(`${state.enemy.name}の攻撃！ ${target.name}に${state.enemy.atk}ダメージ。`)}
function doAttack(skill=false){if(state.enemy.hp<=0){toast("魔物はすでに倒れているで");return}let damage=0;state.party.map(char).filter(c=>c&&c.hp>0).forEach(c=>{let d=skill?Math.round(c.atk*1.55):c.atk;damage+=d});state.enemy.hp=Math.max(0,state.enemy.hp-damage);addLog(`${skill?"魔法攻撃":"全員の攻撃"}！ ${damage}ダメージを与えた。`);if(state.enemy.hp<=0){win()}else{enemyTurn()}state.turn++;render()}
function summon(count){
  const cost=count*100;
  if(state.gems<cost){toast("召喚石が足りません");return}
  state.gems-=cost;
  const pool=[...protagonistPool,...standardPool];
  const got=[];
  for(let i=0;i<count;i++){
    const roll=Math.random()*100;
    const rarity=roll<1?5:roll<15?4:3;
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
if(a==="shuffle-scene"){const options=continentScenes.filter(s=>s.id!==currentScene.id);currentScene=options[Math.floor(Math.random()*options.length)];render();toast(`${currentScene.name}の風景に切り替えたで`)}if(a==="attack")doAttack(false);if(a==="skill")doAttack(true);if(a==="guard"){if(state.enemy.hp>0){addLog("全員が防御態勢を取った！ 次の敵の攻撃を軽減。");const before=state.enemy.atk;state.enemy.atk=Math.max(1,Math.floor(before*.5));enemyTurn();state.enemy.atk=before;state.turn++;render();}}
if(a==="heal"){state.party.map(char).filter(Boolean).forEach(c=>c.hp=c.maxHp);addLog("仲間全員のHPを回復した。");render();toast("全員を回復したで")}
if(a==="reset-battle"){state.enemy.hp=state.enemy.maxHp;state.battleWon=false;state.turn=1;state.party.map(char).filter(Boolean).forEach(c=>c.hp=c.maxHp);state.log=["森のスライムが現れた！"];render()}
if(a==="summon")summon(1);if(a==="summon10")summon(10);
if(a==="toggle-notification"){state.notification=!state.notification;render();toast("通知設定を変更したで")}
if(a==="reset-save"){showModal("セーブデータ初期化","<p>この端末に保存した試作版データを初期化します。よろしいですか？</p><button class='btn danger' data-action='confirm-reset'>初期化する</button>")}
if(a==="confirm-reset"){localStorage.removeItem("epta-save-v02");location.reload()}
if(a==="close-modal")$("#modal-root").innerHTML="";
});
function showModal(title,body){const root=$("#modal-root");root.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><b>${title}</b><button data-action="close-modal">×</button></div><div class="modal-body">${body}</div><button class="btn secondary" data-action="close-modal">戻る</button></div></div>`}
render();
