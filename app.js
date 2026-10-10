const SEED=[...(window.APP_SEED||[]),...(window.LFF_INTROS||[])].map(x=>({...x,favorite:false,source:x.source||''}));
if(window.MINISTRY_SHORT){for(const s of SEED){const p=window.MINISTRY_SHORT[s.id];if(p)Object.assign(s,p)}}
const BUILTIN=new Set(SEED.map(x=>x.id));
const STATE_KEY='personalStudyStateV2';
const OLD_KEY='personalStudyDataV1';
const BASE_CATS=['봉사모임','봉사서론','개인연구','집회준비'];
const FAVORITES_CAT='즐겨찾기';
const $=s=>document.querySelector(s);

const SUPABASE_URL='https://rhphbkduummnientfgmp.supabase.co';
const SUPABASE_KEY='sb_publishable_fIylxaS2q2Na0X7iycwzTQ_G3E2bf4C';
const AUTH_KEY='personalStudyAuthV1';
const DIRTY_KEY='personalStudySyncDirtyV1';
const SERVER_KEY='personalStudyServerUpdatedAtV1';
let authSession=(()=>{try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null')}catch{return null}})();
let syncTimer=null;

function authHeaders(token){return {'apikey':SUPABASE_KEY,'Authorization':'Bearer '+(token||SUPABASE_KEY),'Content-Type':'application/json'}}
async function authFetch(path,opts={}){return fetch(SUPABASE_URL+'/auth/v1'+path,{...opts,headers:{...authHeaders(),...(opts.headers||{})}})}
async function refreshSession(){
  if(!authSession?.refresh_token)return false;
  try{
    const r=await authFetch('/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:authSession.refresh_token})});
    if(!r.ok)return false;
    const j=await r.json();authSession={...j,user:j.user};localStorage.setItem(AUTH_KEY,JSON.stringify(authSession));return true;
  }catch{return false}
}
async function ensureSession(){
  if(!authSession)return false;
  const exp=(authSession.expires_at||0)*1000;
  if(exp&&Date.now()>exp-60000)return refreshSession();
  return true;
}
function setSyncButton(label){
  const b=$('#syncBtn');if(!b)return;
  b.textContent=label;
  b.dataset.state=label;
  b.title=authSession?.user?.email?('로그인: '+authSession.user.email):'기기 동기화';
}
function friendlyAuthError(j,status){
  const code=String(j?.error_code||j?.code||'');
  const msg=String(j?.msg||j?.error_description||j?.message||'').toLowerCase();
  if(code==='invalid_credentials'||msg.includes('invalid login credentials'))return '이메일 또는 비밀번호가 맞지 않습니다.';
  if(code==='email_not_confirmed'||msg.includes('email not confirmed'))return '이메일 확인이 아직 완료되지 않았습니다.';
  if(code==='user_already_exists'||msg.includes('already registered')||msg.includes('already exists'))return '이미 가입된 이메일입니다. 로그인해 주세요.';
  if(code==='weak_password'||msg.includes('password'))return '비밀번호를 6자 이상으로 입력해 주세요.';
  if(status===429)return '요청이 많습니다. 잠시 후 다시 시도해 주세요.';
  return j?.msg||j?.error_description||j?.message||'처리 중 오류가 발생했습니다.';
}
function isStateEmpty(s){return !(s.custom?.length||Object.keys(s.overrides||{}).length||s.deleted?.length||Object.keys(s.favorites||{}).length||s.categories?.length||s.hiddenCategories?.length||Object.keys(s.subcategories||{}).length)}
async function cloudRead(){
  if(!await ensureSession())return null;
  const uid=authSession?.user?.id;if(!uid)return null;
  const r=await fetch(SUPABASE_URL+'/rest/v1/user_state?select=state,updated_at&user_id=eq.'+encodeURIComponent(uid),{headers:authHeaders(authSession.access_token)});
  if(!r.ok)throw new Error('read '+r.status);
  const rows=await r.json();return rows[0]||null;
}
async function cloudWrite(){
  if(!navigator.onLine||!await ensureSession())return false;
  const uid=authSession?.user?.id;if(!uid)return false;
  const now=new Date().toISOString();
  const r=await fetch(SUPABASE_URL+'/rest/v1/user_state?on_conflict=user_id',{method:'POST',headers:{...authHeaders(authSession.access_token),'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({user_id:uid,state,updated_at:now})});
  if(!r.ok)throw new Error('write '+r.status);
  const rows=await r.json();const t=rows?.[0]?.updated_at||now;
  localStorage.setItem(DIRTY_KEY,'0');localStorage.setItem(SERVER_KEY,t);setSyncButton('동기화됨');return true;
}
async function syncNow(first=false){
  if(!authSession||!navigator.onLine)return;
  setSyncButton('동기화 중…');
  try{
    const remote=await cloudRead();
    const dirty=localStorage.getItem(DIRTY_KEY)==='1';
    if(!remote){
      await cloudWrite();
    }else if(first&&isStateEmpty(state)){
      state=remote.state||state;localStorage.setItem(STATE_KEY,JSON.stringify(state));localStorage.setItem(DIRTY_KEY,'0');localStorage.setItem(SERVER_KEY,remote.updated_at||'');data=buildData();render();setSyncButton('동기화됨');
    }else if(dirty){
      await cloudWrite();
    }else{
      const last=localStorage.getItem(SERVER_KEY)||'';
      if(remote.updated_at&&remote.updated_at!==last){state=remote.state||state;localStorage.setItem(STATE_KEY,JSON.stringify(state));localStorage.setItem(SERVER_KEY,remote.updated_at);data=buildData();render()}
      setSyncButton('동기화됨');
    }
  }catch(e){setSyncButton('동기화 오류');console.warn('sync error',e)}
}
function scheduleSync(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow(false),500)}
function markDirty(){localStorage.setItem(DIRTY_KEY,'1');setSyncButton(authSession?'동기화 대기':'동기화');if(authSession&&navigator.onLine)scheduleSync()}
async function signIn(email,password){
  const r=await authFetch('/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
  const j=await r.json();if(!r.ok)throw new Error(friendlyAuthError(j,r.status));
  authSession={...j,user:j.user};localStorage.setItem(AUTH_KEY,JSON.stringify(authSession));await syncNow(true);return j;
}
async function signUp(email,password){
  const r=await authFetch('/signup',{method:'POST',body:JSON.stringify({email,password})});
  const j=await r.json();if(!r.ok)throw new Error(friendlyAuthError(j,r.status));
  if(j.access_token){authSession={...j,user:j.user};localStorage.setItem(AUTH_KEY,JSON.stringify(authSession));await syncNow(true)}
  return j;
}
function signOut(){authSession=null;localStorage.removeItem(AUTH_KEY);setSyncButton('동기화')}
function openSyncDialog(){
  let d=$('#syncDialog');if(!d){d=document.createElement('dialog');d.id='syncDialog';document.body.appendChild(d)}
  if(authSession?.user){
    d.innerHTML='<div class="authWrap"><h2>기기 동기화</h2><p><b>로그인됨</b><br>'+esc(authSession.user.email||'')+'</p><div class="authMessage authOk">이 계정으로 폴드7 · 아이패드 · PC에서 로그인하면 추가·수정·삭제·즐겨찾기가 동기화됩니다. 오프라인에서 수정한 내용은 인터넷 연결 후 자동으로 올라갑니다.</div><div class="authRow"><button id="syncNowBtn">지금 동기화</button><button id="logoutBtn" class="ghost">로그아웃</button></div><button id="syncClose" class="ghost">닫기</button></div>';
    d.querySelector('#syncNowBtn').onclick=async()=>{await syncNow(false);d.close()};
    d.querySelector('#logoutBtn').onclick=()=>{signOut();d.close()};
  }else{
    d.innerHTML='<div class="authWrap"><h2>기기 동기화</h2><p>폴드7 · 아이패드 · PC에서 <b>같은 이메일과 비밀번호</b>로 로그인하면 개인 자료가 함께 저장됩니다.</p><div class="authGrid"><input id="authEmail" type="email" autocomplete="email" placeholder="이메일"><div class="passwordRow"><input id="authPw" type="password" minlength="6" autocomplete="current-password" placeholder="비밀번호 (6자 이상)"><button type="button" id="pwToggle" class="ghost smallBtn">보기</button></div></div><div id="authMsg" class="authMessage" hidden></div><div class="authRow"><button id="loginBtn">로그인</button><button id="signupBtn" class="ghost">처음 가입</button></div><div class="authHint">처음 가입한 뒤에는 받은 확인 메일을 열어 인증하고, 다시 이 화면에서 로그인하세요.</div><button id="syncClose" class="ghost">닫기</button></div>';
    const msg=(t,err=false)=>{const m=d.querySelector('#authMsg');m.hidden=false;m.textContent=t;m.className='authMessage '+(err?'authErr':'authOk')};
    const email=()=>d.querySelector('#authEmail').value.trim();
    const pw=()=>d.querySelector('#authPw').value;
    d.querySelector('#pwToggle').onclick=()=>{const p=d.querySelector('#authPw');const show=p.type==='password';p.type=show?'text':'password';d.querySelector('#pwToggle').textContent=show?'숨기기':'보기'};
    d.querySelector('#loginBtn').onclick=async()=>{if(!email()||!pw())return msg('이메일과 비밀번호를 입력해 주세요.',true);try{msg('로그인 확인 중…');await signIn(email(),pw());d.close()}catch(e){msg(e.message,true)}};
    d.querySelector('#signupBtn').onclick=async()=>{if(!email()||pw().length<6)return msg('사용 가능한 이메일과 6자 이상의 비밀번호를 입력해 주세요.',true);try{msg('가입 처리 중…');const j=await signUp(email(),pw());if(j.access_token)d.close();else msg('가입 확인 메일을 보냈습니다. 메일에서 확인한 뒤 이 화면에서 로그인해 주세요.')}catch(e){msg(e.message,true)}};
  }
  d.querySelector('#syncClose').onclick=()=>d.close();d.showModal();
}

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
  let st={custom:[],overrides:{},deleted:[],favorites:{},categories:[],hiddenCategories:[],subcategories:{}};
  try{Object.assign(st,JSON.parse(localStorage.getItem(STATE_KEY)||'{}'))}catch{}
  st.custom=Array.isArray(st.custom)?st.custom:[];
  st.overrides=st.overrides||{};
  st.deleted=Array.isArray(st.deleted)?st.deleted:[];
  st.favorites=st.favorites||{};
  st.categories=Array.isArray(st.categories)?st.categories:[];
  st.hiddenCategories=Array.isArray(st.hiddenCategories)?st.hiddenCategories:[];
  st.subcategories=(st.subcategories&&typeof st.subcategories==='object'&&!Array.isArray(st.subcategories))?st.subcategories:{};
  if(!localStorage.getItem(STATE_KEY)){
    try{
      const old=JSON.parse(localStorage.getItem(OLD_KEY)||'[]');
      st.custom=old.filter(x=>!BUILTIN.has(x.id));
      for(const x of old){if(BUILTIN.has(x.id)&&x.favorite)st.favorites[x.id]=true}
    }catch{}
    localStorage.setItem(STATE_KEY,JSON.stringify(st));
    if(!isStateEmpty(st))localStorage.setItem(DIRTY_KEY,'1');
  }
  return st;
}
let state=loadState();
function getCategories(includeHidden=false){
  const hidden=new Set(state.hiddenCategories||[]);
  const base=includeHidden?BASE_CATS:BASE_CATS.filter(x=>!hidden.has(x));
  const custom=[...(state.categories||[])].filter(x=>x&&x!==FAVORITES_CAT);
  return [...new Set([...base,...custom]),FAVORITES_CAT];
}
function categoryExists(name){return getCategories(true).includes(name)}
function getSubcategories(category){
  const fromData=data.filter(x=>x.category===category).map(x=>x.subcategory).filter(Boolean);
  const saved=Array.isArray(state.subcategories?.[category])?state.subcategories[category]:[];
  return [...new Set([...saved,...fromData])];
}
function ensureSubcategoryStore(category){
  state.subcategories=state.subcategories||{};
  if(!Array.isArray(state.subcategories[category]))state.subcategories[category]=[];
  return state.subcategories[category];
}
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
  markDirty();
}
function formatContent(v){
  const s=String(v||'').replace(/\\n/g,'\n');
  return s.split(/\n\s*\n/).map(p=>'<p class="para">'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
}
function card(x){
  return '<article class="card compact" data-open="'+x.id+'"><div class="cardTop"><div><div class="meta">'+esc(x.subcategory)+'</div><h3>'+esc(x.title)+'</h3>'+(x.scripture?'<div class="scripture">'+scriptureHtml(x.scripture)+'</div>':'')+'</div><span>'+(x.favorite?'⭐':'')+'</span></div><div class="cardActions"><button class="fav" data-fav="'+x.id+'">'+(x.favorite?'즐겨찾기 해제':'☆ 즐겨찾기')+'</button><button data-edit="'+x.id+'">수정</button><button class="danger" data-del="'+x.id+'">삭제</button></div></article>';
}
function render(){
  const cats=getCategories();
  if(!cats.includes(tab))tab=cats.find(x=>x!==FAVORITES_CAT)||FAVORITES_CAT;
  $('#tabs').innerHTML=cats.map(c=>'<button class="'+(tab===c?'active':'')+'" data-tab="'+esc(c)+'">'+esc(c)+'</button>').join('');
  let base=tab===FAVORITES_CAT?data.filter(x=>x.favorite):data.filter(x=>x.category===tab);
  const subs=tab===FAVORITES_CAT?['전체',...new Set(base.map(x=>x.subcategory).filter(Boolean))]:['전체',...getSubcategories(tab)];
  if(!subs.includes(sub))sub='전체';
  $('#subcats').innerHTML=subs.map(s=>'<button class="chip '+(sub===s?'active':'')+'" data-sub="'+esc(s)+'">'+esc(s)+'</button>').join('')+(tab!==FAVORITES_CAT?'<button class="chip manageChip" data-manage-subcats="1">⚙ 소제목 관리</button>':'');
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
function populateEditorSubcategories(selected=''){
  const category=$('#category').value;
  let subs=getSubcategories(category);
  if(selected&&!subs.includes(selected))subs=[selected,...subs];
  if(!subs.length)subs=['미분류'];
  $('#subcategory').innerHTML='<option value="">소제목 선택</option>'+subs.map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join('');
  $('#subcategory').value=selected&&subs.includes(selected)?selected:subs[0];
}
function openEditor(x=null){
  editId=x?.id||null;
  $('#formTitle').textContent=x?'자료 수정':'새 자료';
  $('#category').innerHTML=getCategories().filter(c=>c!==FAVORITES_CAT).map(c=>'<option>'+esc(c)+'</option>').join('');
  $('#category').value=x?.category||(tab===FAVORITES_CAT?(getCategories().find(c=>c!==FAVORITES_CAT)||'개인연구'):tab);
  populateEditorSubcategories(x?.subcategory||'');
  for(const k of ['title','scripture','content','application','source'])$('#'+k).value=x?.[k]||'';
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


function addSubcategory(category,name){
  name=String(name||'').trim();
  if(!name)return '소제목 이름을 입력해 주세요.';
  if(name==='전체')return '“전체”는 사용할 수 없는 이름입니다.';
  if(getSubcategories(category).includes(name))return '이미 있는 소제목입니다.';
  ensureSubcategoryStore(category).push(name);
  persist();sub=name;render();return '';
}
function renameSubcategory(category,oldName,newName){
  newName=String(newName||'').trim();
  if(!newName)return '새 소제목 이름을 입력해 주세요.';
  if(newName==='전체')return '“전체”는 사용할 수 없는 이름입니다.';
  if(newName!==oldName&&getSubcategories(category).includes(newName))return '이미 있는 소제목입니다.';
  if(newName===oldName)return '';

  const matches=data.filter(x=>x.category===category&&x.subcategory===oldName);
  for(const x of matches){
    if(BUILTIN.has(x.id))state.overrides[x.id]={...(state.overrides[x.id]||{}),subcategory:newName};
    else{
      const item=state.custom.find(v=>v.id===x.id);
      if(item)item.subcategory=newName;
    }
  }

  const list=ensureSubcategoryStore(category);
  const i=list.indexOf(oldName);
  if(i>=0)list[i]=newName; else if(!list.includes(newName))list.push(newName);
  state.subcategories[category]=[...new Set(list.filter(Boolean))];

  if(sub===oldName)sub=newName;
  persist();render();return '';
}
function deleteSubcategory(category,name){
  const matches=data.filter(x=>x.category===category&&x.subcategory===name);
  const count=matches.length;
  const message=count
    ? '“'+name+'” 소제목을 삭제할까요?\n그 안의 자료 '+count+'개는 삭제하지 않고 “미분류”로 이동합니다.'
    : '“'+name+'” 소제목을 삭제할까요?';
  if(!confirm(message))return;

  if(count){
    for(const x of matches){
      if(BUILTIN.has(x.id))state.overrides[x.id]={...(state.overrides[x.id]||{}),subcategory:'미분류'};
      else{
        const item=state.custom.find(v=>v.id===x.id);
        if(item)item.subcategory='미분류';
      }
    }
    const list=ensureSubcategoryStore(category);
    if(!list.includes('미분류'))list.push('미분류');
  }

  const list=ensureSubcategoryStore(category);
  state.subcategories[category]=list.filter(x=>x!==name);
  if(sub===name)sub='전체';
  persist();render();openSubcategoryManager();
}
function openSubcategoryManager(){
  if(tab===FAVORITES_CAT)return;
  const category=tab;
  let d=$('#subcategoryManager');
  if(!d){d=document.createElement('dialog');d.id='subcategoryManager';document.body.appendChild(d)}
  const items=getSubcategories(category);
  const row=name=>'<div class="catRow"><span>'+esc(name)+'</span><div class="miniActions"><button type="button" class="ghost" data-sub-rename="'+esc(name)+'">이름 변경</button><button type="button" class="danger" data-sub-delete="'+esc(name)+'">삭제</button></div></div>';
  d.innerHTML='<div class="authWrap categoryManage"><h2>소제목 관리</h2><p><b>'+esc(category)+'</b> 안의 소제목을 추가하거나 이름을 바꿀 수 있습니다.</p><div class="catAdd"><input id="newSubcategoryName" placeholder="새 소제목 이름"><button id="subcategoryAddBtn" type="button">＋ 추가</button></div><div class="catList">'+(items.length?items.map(row).join(''):'<div class="emptySmall">등록된 소제목이 없습니다.</div>')+'</div><div class="authHint">소제목을 삭제해도 그 안의 자료는 삭제되지 않고 “미분류”로 이동합니다.</div><button id="subcategoryClose" class="ghost" type="button">닫기</button></div>';
  d.querySelector('#subcategoryAddBtn').onclick=()=>{const input=d.querySelector('#newSubcategoryName');const err=addSubcategory(category,input.value);if(err)alert(err);else openSubcategoryManager()};
  d.querySelector('#newSubcategoryName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();d.querySelector('#subcategoryAddBtn').click()}});
  d.querySelectorAll('[data-sub-rename]').forEach(b=>b.onclick=()=>{
    const oldName=b.dataset.subRename;
    const next=prompt('새 소제목 이름을 입력하세요.',oldName);
    if(next===null)return;
    const err=renameSubcategory(category,oldName,next);
    if(err)alert(err); else openSubcategoryManager();
  });
  d.querySelectorAll('[data-sub-delete]').forEach(b=>b.onclick=()=>deleteSubcategory(category,b.dataset.subDelete));
  d.querySelector('#subcategoryClose').onclick=()=>d.close();
  if(!d.open)d.showModal();
}

function addCategory(name){
  name=String(name||'').trim();
  if(!name)return '대주제 이름을 입력해 주세요.';
  if(name===FAVORITES_CAT)return '즐겨찾기는 기본 메뉴라 사용할 수 없는 이름입니다.';
  if(categoryExists(name))return '이미 있는 대주제입니다.';
  state.categories.push(name);
  state.hiddenCategories=state.hiddenCategories.filter(x=>x!==name);
  persist();tab=name;sub='전체';render();return '';
}
function deleteCategory(name){
  if(BASE_CATS.includes(name)){
    if(!confirm('기본 대주제 “'+name+'”를 숨길까요?\n자료는 삭제되지 않으며 나중에 다시 표시할 수 있습니다.'))return;
    if(!state.hiddenCategories.includes(name))state.hiddenCategories.push(name);
  }else{
    const count=(state.custom||[]).filter(x=>x.category===name).length;
    const msg=count?('“'+name+'” 대주제와 그 안의 사용자 추가 자료 '+count+'개를 삭제할까요?'):('“'+name+'” 대주제를 삭제할까요?');
    if(!confirm(msg))return;
    state.categories=state.categories.filter(x=>x!==name);
    state.custom=state.custom.filter(x=>x.category!==name);
    for(const [id,ov] of Object.entries(state.overrides||{})){
      if(ov?.category===name){
        const base=SEED.find(x=>x.id===id);
        if(base)state.overrides[id]={...ov,category:base.category};
      }
    }
  }
  if(tab===name)tab=getCategories().find(x=>x!==FAVORITES_CAT)||FAVORITES_CAT;
  persist();render();openCategoryManager();
}
function restoreCategory(name){
  state.hiddenCategories=state.hiddenCategories.filter(x=>x!==name);
  persist();render();openCategoryManager();
}
function openCategoryManager(){
  let d=$('#categoryManager');if(!d){d=document.createElement('dialog');d.id='categoryManager';document.body.appendChild(d)}
  const hidden=new Set(state.hiddenCategories||[]);
  const visibleBase=BASE_CATS.filter(x=>!hidden.has(x));
  const hiddenBase=BASE_CATS.filter(x=>hidden.has(x));
  const custom=state.categories||[];
  const row=(name,type)=>'<div class="catRow"><span>'+esc(name)+'</span><button type="button" class="'+(type==='restore'?'ghost':'danger')+'" data-cat-action="'+type+'" data-cat-name="'+esc(name)+'">'+(type==='restore'?'다시 표시':'삭제')+'</button></div>';
  d.innerHTML='<div class="authWrap categoryManage"><h2>대주제 관리</h2><p>새 대주제를 추가하거나 필요 없는 대주제를 정리할 수 있습니다.</p><div class="catAdd"><input id="newCategoryName" placeholder="새 대주제 이름"><button id="categoryAddBtn" type="button">＋ 추가</button></div><div class="catList">'+visibleBase.map(x=>row(x,'delete')).join('')+custom.map(x=>row(x,'delete')).join('')+'</div>'+(hiddenBase.length?'<div class="hiddenCats"><b>숨긴 기본 대주제</b>'+hiddenBase.map(x=>row(x,'restore')).join('')+'</div>':'')+'<button id="categoryClose" class="ghost" type="button">닫기</button></div>';
  d.querySelector('#categoryAddBtn').onclick=()=>{const input=d.querySelector('#newCategoryName');const err=addCategory(input.value);if(err)alert(err);else openCategoryManager()};
  d.querySelector('#newCategoryName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();d.querySelector('#categoryAddBtn').click()}});
  d.querySelectorAll('[data-cat-action]').forEach(b=>b.onclick=()=>{const n=b.dataset.catName;if(b.dataset.catAction==='restore')restoreCategory(n);else deleteCategory(n)});
  d.querySelector('#categoryClose').onclick=()=>d.close();
  if(!d.open)d.showModal();
}

document.addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(!b){const card=e.target.closest('.card');if(card?.dataset.open)openDetail(data.find(v=>v.id===card.dataset.open));return}
  if(b.dataset.manageSubcats){openSubcategoryManager()}
  else if(b.dataset.tab){tab=b.dataset.tab;sub='전체';render()}
  else if(b.dataset.sub){sub=b.dataset.sub;render()}
  else if(b.dataset.fav)setFavorite(b.dataset.fav);
  else if(b.dataset.edit)openEditor(data.find(v=>v.id===b.dataset.edit));
  else if(b.dataset.del&&confirm('이 자료를 삭제할까요?'))removeItem(b.dataset.del);
});
$('#search').addEventListener('input',render);
$('#addBtn').onclick=()=>openEditor();
$('#categoryManageBtn').onclick=openCategoryManager;
$('#syncBtn').onclick=openSyncDialog;
$('#cancel').onclick=()=>$('#editor').close();
$('#category').addEventListener('change',()=>populateEditorSubcategories(''));
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
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js?v=33',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});if('caches'in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('personal-study-v')&&k!=='personal-study-v33').map(k=>caches.delete(k))))}
render();
if(authSession){setSyncButton('로그인됨');syncNow(true)}else{setSyncButton('동기화')}
window.addEventListener('online',()=>{if(authSession)syncNow(false)});
