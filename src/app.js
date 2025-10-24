const SCENES_URL = 'scenes/scenes.json';
const SAVE_KEY = 'heistGameSave_v1';

let scenes = {};
let state = {
  sceneId: 'start',
  inventory: [],
  stats: {stealth:5, notoriety:0}
};

// DOM
const sceneTitle = document.getElementById('sceneTitle');
const sceneText = document.getElementById('sceneText');
const choicesEl = document.getElementById('choices');
const inventoryList = document.getElementById('inventoryList');
const statusText = document.getElementById('statusText');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const bgmus = document.getElementById('bgmus');
const restartBtn = document.getElementById('restartBtn');
const blip = document.getElementById('blip');

saveBtn.addEventListener('click', saveGame);
loadBtn.addEventListener('click', ()=>{ loadGame(true) });
restartBtn.addEventListener('click', ()=>{ if(confirm('Restart the heist?')) resetGame() });

window.addEventListener('keydown', (e)=>{
  const n = Number(e.key);
  if(n>=1 && n<=9){
    const btn = document.querySelector(`#choices button[data-key='${n}']`);
    if(btn) btn.click();
  }
});

async function init(){
  const res = await fetch(SCENES_URL);
  scenes = await res.json();
  const saved = loadGame();
  if(!saved) render();
  // start background music
  try{ if(bgmus && typeof bgmus.play === 'function'){ bgmus.volume = 0.2; bgmus.play().catch(()=>{}); } }catch(e){}
}

function render(){
  const scene = scenes[state.sceneId];
  if(!scene){
    sceneTitle.textContent = 'Unknown';
    sceneText.textContent = 'The scene could not be found.';
    choicesEl.innerHTML = '';
    return;
  }

  sceneTitle.textContent = scene.title || 'Untitled';
  sceneText.textContent = '';
  typeText(scene.text, sceneText);

  // choices
  choicesEl.innerHTML = '';
  scene.choices.forEach((choice, idx)=>{
    if(choice.require && !checkRequirement(choice.require)) return; // hide
    const btn = document.createElement('button');
    btn.className = 'choice';
    btn.dataset.key = idx+1;
    btn.setAttribute('role','listitem');
    btn.setAttribute('aria-label', `${idx+1}. ${choice.text}`);
    btn.innerHTML = `<span class="label">${choice.text}</span><span class="key">${idx+1}</span>`;
    btn.addEventListener('click', ()=>{ applyChoice(choice) });
    choicesEl.appendChild(btn);
  });

  // focus first available choice for keyboard users
  const firstBtn = choicesEl.querySelector('button.choice');
  if(firstBtn) firstBtn.focus();

  renderInventory();
  renderStatus();
  // play a small blip when scene appears
  try{ if(blip && typeof blip.play === 'function'){ blip.currentTime = 0; blip.play().catch(()=>{}); } }catch(e){}
}

function typeText(text, el){
  el.textContent = '';
  let i=0;
  const speed = 8; // ms per char
  function step(){
    el.textContent = text.slice(0,i);
    i++;
    if(i<=text.length) setTimeout(step, speed);
  }
  step();
}

function applyChoice(choice){
  // effects
  if(choice.effects){
    if(choice.effects.add){
      choice.effects.add.forEach(item => { if(!state.inventory.includes(item)) state.inventory.push(item); });
    }
    if(choice.effects.remove){
      choice.effects.remove.forEach(item => { state.inventory = state.inventory.filter(i=>i!==item); });
    }
    if(choice.effects.stats){
      Object.entries(choice.effects.stats).forEach(([k,v])=>{ state.stats[k] = (state.stats[k]||0) + v; });
    }
  }

  // transition
  if(choice.load){
    // dynamic scenes file requested
    fetch(choice.load).then(r=>r.json()).then(extraScenes=>{
      // merge scenes but don't overwrite existing keys unless necessary
      scenes = Object.assign({}, scenes, extraScenes);
      if(choice.target){ state.sceneId = choice.target; }
      render();
      saveGame(false);
    }).catch(err=>{
      console.error('Failed to load scenes:', err);
      // fallback: still try to transition if target exists in current scenes
      if(choice.target){ state.sceneId = choice.target; render(); }
    });
    return; // already handled async render
  }

  if(choice.target){
    state.sceneId = choice.target;
    render();
  }

  // immediate save (auto)
  saveGame(false);
  try{ if(blip && typeof blip.play === 'function'){ blip.currentTime = 0; blip.play().catch(()=>{}); } }catch(e){}
}

function checkRequirement(req){
  if(req.inventory){
    return req.inventory.every(i=>state.inventory.includes(i));
  }
  if(req.stats){
    return Object.entries(req.stats).every(([k,v])=> (state.stats[k]||0) >= v);
  }
  return true;
}

function renderInventory(){
  inventoryList.innerHTML = '';
  if(state.inventory.length===0){
    const li = document.createElement('li'); li.textContent = '(empty)'; inventoryList.appendChild(li); return;
  }
  state.inventory.forEach(item=>{const li = document.createElement('li'); li.textContent = item; inventoryList.appendChild(li)});
}

function renderStatus(){
  statusText.textContent = `Stealth: ${state.stats.stealth} | Notoriety: ${state.stats.notoriety}`;
}

function saveGame(alertUser=true){
  try{
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    if(alertUser) alert('Game saved.');
    return true;
  }catch(e){console.error(e); if(alertUser) alert('Failed to save.'); return false}
}

function loadGame(suppressAlert=false){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return false;
    state = JSON.parse(raw);
    // sanity: if the saved sceneId no longer exists in the loaded scenes,
    // provide backward compatibility for older saves and a safe fallback.
    if(!scenes[state.sceneId]){
      if(state.sceneId === 'lobby' && scenes['louvre_lobby']){
        state.sceneId = 'louvre_lobby';
      } else {
        state.sceneId = 'start';
      }
    }
    render();
    if(!suppressAlert) alert('Loaded saved game.');
    return true;
  }catch(e){console.error(e); if(!suppressAlert) alert('Failed to load.'); return false}
}

function resetGame(){
  // reset runtime state
  state = {sceneId:'start', inventory:[], stats:{stealth:5, notoriety:0}};
  localStorage.removeItem(SAVE_KEY);
  // reload the base scenes file to clear any dynamically loaded scenes
  fetch(SCENES_URL).then(r=>r.json()).then(base=>{ scenes = base; render(); }).catch(err=>{ console.error('Failed to reload base scenes:', err); scenes = {}; render(); });
}

// Core logic idea
function triggerTimeBomb(duration = 10) {
  const bomb = document.createElement('div');
  bomb.id = 'timeBomb';
  bomb.textContent = `💣 Time left: ${duration}s`;
  document.querySelector('#scene').appendChild(bomb);

  let timer = duration;
  const interval = setInterval(() => {
    timer--;
    bomb.textContent = `💣 Time left: ${timer}s`;
    if (timer <= 0) {
      clearInterval(interval);
      explode();
    }
  }, 1000);

  // Clicking the bomb defuses it
  bomb.addEventListener('click', () => {
    clearInterval(interval);
    bomb.textContent = '💥 Defused!';
    setTimeout(() => bomb.remove(), 1000);
  });
}

function explode() {
  document.body.classList.add('explode');
  document.querySelector('#sceneText').textContent = '💥 You hesitated too long!';
  setTimeout(() => location.reload(), 3000); // or trigger game over
}

// =====================
// 🤖 AI Overlord Feature
// =====================

const aiCommands = [
  "Press any key to prove your loyalty.",
  "Do not click anything for 5 seconds.",
  "Say 'yes master' aloud.",
  "Find the red button now!",
  "Your mouse belongs to me."
];

function triggerAIOverlord() {
  const aiBox = document.createElement('div');
  aiBox.id = 'aiOverlord';
  aiBox.textContent = "I am the AI Overlord. You will obey.";
  document.body.appendChild(aiBox);

  setTimeout(() => issueCommand(aiBox), 2000);
}

function issueCommand(aiBox) {
  aiBox.textContent = aiCommands[Math.floor(Math.random() * aiCommands.length)];
  aiBox.classList.add('active');

  // Vanish after 8 seconds
  setTimeout(() => {
    aiBox.remove();
  }, 8000);
}

// Example: trigger AI Overlord randomly every few scenes
setTimeout(triggerAIOverlord, Math.random() * 30000 + 10000);


// =====================
// 🕵️ Hidden Team Bio
// =====================

const secretCode = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'
];
let enteredKeys = [];

window.addEventListener('keydown', (e) => {
  enteredKeys.push(e.key);
  if (enteredKeys.slice(-secretCode.length).join('') === secretCode.join('')) {
    revealTeamBio();
  }
});

function revealTeamBio() {
  const secret = document.getElementById('teamSecret');
  if (secret) secret.classList.remove('hidden');
}


init();
