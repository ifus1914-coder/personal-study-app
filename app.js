const SEED=[...(window.APP_SEED||[]),...(window.LFF_INTROS||[])].map(x=>({...x,favorite:false,source:x.source||''}));
if(window.MINISTRY_SHORT){for(const s of SEED){const p=window.MINISTRY_SHORT[s.id];if(p)Object.assign(s,p)}}
const BUILTIN=new Set(SEED.map(x=>x.id));
const STATE_KEY='personalStudyStateV2';
const OLD_KEY='personalStudyDataV1';
const CATS=['봉사모임','봉사서론','개인연구','집회준비','즐겨찾기'];
const $=s=>document.querySelector(s);
const esc=(s='')=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const BIBLE_BOOKS={
'창세기':1,'창':1,'출애굽기':2,'출':2,'레위기':3,'레':3,'민수기':4,'민':4,'신명기':5,'신':5,
'여호수아':6,'수':6,'사사기':7,'삿':7,'룻기':8,'룻':8,'사무엘상':9,'사무엘 전서':9,'삼상':9,'사무엘하':10,'사무엘 후서':10,'삼하':10,
'열왕기상':11,'왕상':11,'열왕기하':12,'왕하':12,'역대기상':13,'대상':13,'역대기하':14,'대하':14,'에스라':15,'라':15,
'느헤미야':16,'느':16,'에스더':17,'더':17,'욥기':18,'욥':18,'시편':19,'시':19,'잠언':20,'잠':20,'전도서':21,'전':21,
'아가':22,'아':22,'이사야':23,'사':23,'예레미야':24,'렘':24,'애가':25,'애':25,'에스겔':26,'겔':26,'다니엘':27,'단':27,
'호세아':28,'호':28,'요엘':29,'욜':29,'아모스':30,'암':30,'오바댜':31,'옵':31,'요나':32,'욘':32,'미가':33,'미':33,
'나훔':34,'나':34,'하박국':35,'합':35,'스바냐':36,'습':36,'학개':37,'학':37,'스가랴':38,'슥':38,'말라기':39,'말':39,
'마태복음':40,'마태':40,'마':40,'마가복음':41,'마가':41,'막':41,'누가복음':42,'누가':42,'눅':42,'요한복음':43,'요한':43,'요':43,
'사도행전':44,'행':44,'로마서':45,'롬':45,'고린도 전서':46,'고린도전서':46,'고전':46,'고린도 후서':47,'고린도후서':47,'고후':47,
'갈라디아서':48,'갈':48,'에베소서':49,'엡':49,'빌립보서':50,'빌':50,'골로새서':51,'골':51,
'데살로니가 전서':52,'데살로니가전서':52,'살전':52,'데살로니가 후서':53,'데살로니가후서':53,'살후':53,
'디모데 전서':54,'디모데전서':54,'딤전':54,'디모데 후서':55,'디모데후서':55,'딤후':55,'디도서':56,'딛':56,'빌레몬서':57,'몬':57,
'히브리서':58,'히':58,'야고보서':59,'약':59,'베드로 전서':60,'베드로전서':60,'벧전':60,'베드로 후서':61,'베드로후서':61,'벧후':61,
'요한 1서':62,'요한1서':62,'요일':62,'요한 2서':63,'요한2서':63,'요이':63,'요한 3서':64,'요한3서':64,'요삼':64,
'유다서':65,'유':65,'요한 계시록':66,'계시록':66,'계':66
};
function bibleFinder(ref){
  const s=String(ref||'').trim();
  if(!s)return '';
  const names=Object.keys(BIBLE_BOOKS).sort((a,b)=>b.length-a.length);
  const name=names.find(n=>s.startsWith(n));
  if(!name)return '';
  const rest=s.slice(name.length).trim();
  const m=rest.match(/^(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+)|\s*,\s*(\d+))?)?/);
  if(!m)return '';
  const book=String(BIBLE_BOOKS[name]).padStart(2,'0');
  const ch=String(Number(m[1])).padStart(3,'0');
  const v1=m[2]?String(Number(m[2])).padStart(3,'0'):'000';
  let code=book+ch+v1;
  const v2=m[3]||m[4];
  if(v2)code+='-'+book+ch+String(Number(v2)).padStart(3,'0');
  return 'https://www.jw.org/finder?pub=nwtsty&bible='+code+'&wtlocale=KO&srcid=share';
}
function jwLibraryUrl(url){
  if(!url)return '';
  try{
    const u=new URL(url,location.href);
    if(u.hostname==='www.jw.org'&&(u.pathname==='/finder'||u.pathname==='/open'))return u.href;
    const bible=u.searchParams.get('bible'),docid=u.searchParams.get('docid'),pub=u.searchParams.get('pub'),lank=u.searchParams.get('lank');
    if(bible)return 'https://www.jw.org/finder?pub=nwtsty&bible='+encodeURIComponent(bible)+'&wtlocale=KO&srcid=share';
    if(docid)return 'https://www.jw.org/finder?wtlocale=KO&docid='+encodeURIComponent(docid)+'&srcid=share';
    if(lank)return 'https://www.jw.org/open?lank='+encodeURIComponent(lank)+'&wtlocale=KO';
    if(pub)return 'https://www.jw.org/finder?wtlocale=KO&pub='+encodeURIComponent(pub)+'&srcid=share';
    if(u.hostname.includes('wol.jw.org')){
      let m=u.pathname.match(/\/d\/r\d+\/lp-ko\/(\d+)/);
      if(m)return 'https://www.jw.org/finder?wtlocale=KO&docid='+m[1]+'&srcid=share';
      m=u.pathname.match(/\/publication\/r\d+\/lp-ko\/([^/]+)/);
      if(m)return 'https://www.jw.org/finder?wtlocale=KO&pub='+encodeURIComponent(m[1])+'&srcid=share';
    }
    return u.href;
  }catch{return url}
}
function scriptureHtml(ref){
  const href=bibleFinder(ref);
  return href?'<a class="scriptureLink" href="'+href+'">'+esc(ref)+' ↗</a>':esc(ref);
}


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
  return '<article class="card compact" data-open="'+x.id+'"><div class="cardTop"><div><div class="meta">'+esc(x.subcategory)+'</div><h3>'+esc(x.title)+'</h3>'+(x.scripture?'<div class="scripture">'+scriptureHtml(x.scripture)+'</div>':'')+'</div><span>'+(x.favorite?'⭐':'')+'</span></div><div class="cardActions"><button class="fav" data-fav="'+x.id+'">'+(x.favorite?'즐겨찾기 해제':'☆ 즐겨찾기')+'</button><button data-edit="'+x.id+'">수정</button><button class="danger" data-del="'+x.id+'">삭제</button></div></article>';
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
  d.innerHTML='<div class="detailWrap"><button class="detailClose" aria-label="닫기">✕</button><div class="meta">'+esc(x.category)+' · '+esc(x.subcategory)+'</div><h2>'+esc(x.title)+'</h2>'+(x.scripture?'<div class="scripture">'+scriptureHtml(x.scripture)+'</div>':'')+'<div class="detailBody">'+formatContent(x.content)+'</div>'+(x.application?'<div class="detailApply"><b>적용:</b> '+esc(x.application)+'</div>':'')+'<div class="tags">'+(x.keywords||[]).map(k=>'<span class="tag">#'+esc(k)+'</span>').join('')+'</div>'+(x.source?'<p><a target="_blank" rel="noopener" href="'+esc(jwLibraryUrl(x.source))+'">JW Library로 열기 ↗</a></p>':'')+'</div>';
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
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js?v=26',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});if('caches'in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('personal-study-v')&&k!=='personal-study-v26').map(k=>caches.delete(k))))}
render();