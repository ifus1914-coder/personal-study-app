const SEED=[...(window.APP_SEED||[]),...(window.LFF_INTROS||[])].map(x=>({...x,favorite:false,source:x.source||''}));
if(window.MINISTRY_SHORT){for(const s of SEED){const p=window.MINISTRY_SHORT[s.id];if(p)Object.assign(s,p)}}
const BUILTIN=new Set(SEED.map(x=>x.id));
const STATE_KEY='personalStudyStateV2';
const OLD_KEY='personalStudyDataV1';
const CATS=['봉사모임','봉사서론','개인연구','집회준비','즐겨찾기'];
const $=s=>document.querySelector(s);
const esc=(s='')=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function loadState(){
  let st={custom:[],overrides:{},deleted:[],favorites:{}};
  try{Object.assign(st,JSON.parse(localStorage.getItem(STATE_KEY)||'{}'))}catch{}
  if(!localStorage.getItem(STATE_KEY)){
    try{
      const old=JSON.parse(localStorage.getItem(OLD_KEY)||'[]');
      st.custom=old.filter(x=>!BUILTIN.has(x.id));
      for(const x of old){if(BUILTIN.has(x.id)&&x.favorite)st.favorites[x.id]=true}
    }catch{}
    localStorage.setItem(STATE_KEY,JSON.stringify(st));
  }
  return st;
}
let state=loadState();
function buildData(){
  const deleted=new Set(state.deleted||[]);
  const built=SEED.filter(x=>!deleted.has(x.id)).map(s=>({...s,...(state.overrides?.[s.id]||{}),favorite:!!state.favorites?.[s.id]}));
  const custom=(state.custom||[]).map(x=>({...x,favorite:!!x.favorite}));
  return [...built,...custom];
}
let data=buildData(),tab='개인연구',sub='전체',editId=null;

function persist(){
  localStorage.setItem(STATE_KEY,JSON.stringify(state));
  data=buildData();
}
function formatContent(v){
  const s=String(v||'').replace(/\\n/g,'\n');
  return s.split(/\n\s*\n/).map(p=>'<p class="para">'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
}
function card(x){
  return '<article class="card compact" data-open="'+x.id+'"><div class="cardTop"><div><div class="meta">'+esc(x.subcategory)+'</div><h3>'+esc(x.title)+'</h3>'+(x.scripture?'<div class="scripture">'+esc(x.scripture)+'</div>':'')+'</div><span>'+(x.favorite?'⭐':'')+'</span></div><div class="cardActions"><button class="fav" data-fav="'+x.id+'">'+(x.favorite?'즐겨찾기 해제':'☆ 즐겨찾기')+'</button><button data-edit="'+x.id+'">수정</button><button class="danger" data-del="'+x.id+'">삭제</button></div></article>';
}
function render(){
  $('#tabs').innerHTML=CATS.map(c=>'<button class="'+(tab===c?'active':'')+'" data-tab="'+c+'">'+c+'</button>').join('');
  let base=tab==='즐겨찾기'?data.filter(x=>x.favorite):data.filter(x=>x.category===tab);
  const subs=['전체',...new Set(base.map(x=>x.subcategory).filter(Boolean))];
  if(!subs.includes(sub))sub='전체';
  $('#subcats').innerHTML=subs.map(s=>'<button class="chip '+(sub===s?'active':'')+'" data-sub="'+s+'">'+s+'</button>').join('');
  const q=$('#search').value.trim().toLowerCase();
  const rows=base.filter(x=>(sub==='전체'||x.subcategory===sub)&&(!q||[x.title,x.scripture,x.content,x.application,(x.keywords||[]).join(' ')].join(' ').toLowerCase().includes(q)));
  $('#list').innerHTML=rows.length?rows.map(card).join(''):'<div class="empty">해당 자료가 없습니다.<br>＋ 새 자료로 직접 추가할 수 있습니다.</div>';
}
function openDetail(x){
  if(!x)return;
  let d=$('#detail');
  if(!d){d=document.createElement('dialog');d.id='detail';document.body.appendChild(d)}
  d.innerHTML='<div class="detailWrap"><button class="detailClose" aria-label="닫기">✕</button><div class="meta">'+esc(x.category)+' · '+esc(x.subcategory)+'</div><h2>'+esc(x.title)+'</h2>'+(x.scripture?'<div class="scripture">'+esc(x.scripture)+'</div>':'')+'<div class="detailBody">'+formatContent(x.content)+'</div>'+(x.application?'<div class="detailApply"><b>적용:</b> '+esc(x.application)+'</div>':'')+'<div class="tags">'+(x.keywords||[]).map(k=>'<span class="tag">#'+esc(k)+'</span>').join('')+'</div>'+(x.source?'<p><a target="_blank" rel="noopener" href="'+esc(x.source)+'">JW Library로 열기 ↗</a></p>':'')+'</div>';
  d.querySelector('.detailClose').onclick=()=>d.close();
  d.showModal();
}
function openEditor(x=null){
  editId=x?.id||null;
  $('#formTitle').textContent=x?'자료 수정':'새 자료';
  $('#category').innerHTML=CATS.slice(0,4).map(c=>'<option>'+c+'</option>').join('');
  $('#category').value=x?.category||(tab==='즐겨찾기'?'개인연구':tab);
  for(const k of ['subcategory','title','scripture','content','application','source'])$('#'+k).value=x?.[k]||'';
  $('#keywords').value=(x?.keywords||[]).join(', ');
  $('#editor').showModal();
}
function setFavorite(id){
  if(BUILTIN.has(id))state.favorites[id]=!state.favorites[id];
  else{const x=state.custom.find(v=>v.id===id);if(x)x.favorite=!x.favorite}
  persist();render();
}
function removeItem(id){
  if(BUILTIN.has(id)){if(!state.deleted.includes(id))state.deleted.push(id);delete state.overrides[id];delete state.favorites[id]}
  else state.custom=state.custom.filter(x=>x.id!==id);
  persist();render();
}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(!b){const card=e.target.closest('.card');if(card?.dataset.open)openDetail(data.find(v=>v.id===card.dataset.open));return}
  if(b.dataset.tab){tab=b.dataset.tab;sub='전체';render()}
  else if(b.dataset.sub){sub=b.dataset.sub;render()}
  else if(b.dataset.fav)setFavorite(b.dataset.fav);
  else if(b.dataset.edit)openEditor(data.find(v=>v.id===b.dataset.edit));
  else if(b.dataset.del&&confirm('이 자료를 삭제할까요?'))removeItem(b.dataset.del);
});
$('#search').addEventListener('input',render);
$('#addBtn').onclick=()=>openEditor();
$('#cancel').onclick=()=>$('#editor').close();
$('#form').onsubmit=e=>{
  e.preventDefault();
  const old=data.find(x=>x.id===editId);
  const obj={id:editId||String(Date.now()),category:$('#category').value,subcategory:$('#subcategory').value.trim(),title:$('#title').value.trim(),scripture:$('#scripture').value.trim(),content:$('#content').value.trim(),application:$('#application').value.trim(),keywords:$('#keywords').value.split(',').map(x=>x.trim()).filter(Boolean),source:$('#source').value.trim(),favorite:old?.favorite||false};
  if(editId&&BUILTIN.has(editId)){
    const base=SEED.find(x=>x.id===editId)||{};
    state.overrides[editId]={...obj};
    if(obj.favorite)state.favorites[editId]=true;else delete state.favorites[editId];
  }else if(editId){
    state.custom=state.custom.map(x=>x.id===editId?obj:x);
  }else{
    state.custom.unshift(obj);
  }
  persist();$('#editor').close();tab=obj.category;sub='전체';render();
};
let deferred;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#installBtn').hidden=false});
$('#installBtn').onclick=async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;$('#installBtn').hidden=true}};
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js?v=25',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});if('caches'in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('personal-study-v')&&k!=='personal-study-v25').map(k=>caches.delete(k))))}
render();