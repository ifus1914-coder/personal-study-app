(()=>{
'use strict';

const $=s=>document.querySelector(s);
const DIALOG=$('#meetingProgramDialog');
const PAGES=$('#programPages');
const EMPTY=$('#programEmpty');
const FILE_INPUT=$('#programFile');
const FILE_NAME=$('#programFileName');
const NOTE_BTN=$('#addProgramNoteBtn');
const HL_BTN=$('#highlightProgramBtn');
const SCRIPTURE_INPUT=$('#programScriptureInput');
const SCRIPTURE_BTN=$('#programScriptureBtn');
const SCRIPTURE_WRAP=$('#scriptureFrameWrap');
const ISSUE_SELECT=$('#officialIssueSelect');
const OFFICIAL_BTN=$('#loadOfficialProgramBtn');
const WEEK_SELECT=$('#officialWeekSelect');
const OFFICIAL_VIEW=$('#officialProgramView');
const OFFICIAL_TITLE=$('#officialProgramTitle');
const OFFICIAL_LIST=$('#officialProgramList');
const DB_NAME='personalStudyMeetingProgramDB';
const DB_STORE='files';
const CURRENT_KEY='meetingProgramCurrentV1';
const ANNO_PREFIX='meetingProgramAnnoV1:';

let currentMeta=null;
let currentBlobUrl='';
let noteMode=false;
let highlightMode=false;

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE)};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function putBlob(id,blob){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(DB_STORE,'readwrite');
    tx.objectStore(DB_STORE).put(blob,id);
    tx.oncomplete=()=>resolve(true);
    tx.onerror=()=>reject(tx.error);
  });
}
async function getBlob(id){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const req=db.transaction(DB_STORE,'readonly').objectStore(DB_STORE).get(id);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error);
  });
}
function docId(file){return [file.name,file.size,file.lastModified].join(':')}
function annoKey(){return currentMeta?ANNO_PREFIX+currentMeta.id:''}
function loadAnno(){
  try{return JSON.parse(localStorage.getItem(annoKey())||'{"notes":[],"highlights":[]}')}catch{return {notes:[],highlights:[]}}
}
function saveAnno(a){if(currentMeta)localStorage.setItem(annoKey(),JSON.stringify(a))}
function setMode(kind){
  noteMode=kind==='note'?!noteMode:false;
  highlightMode=kind==='highlight'?!highlightMode:false;
  NOTE_BTN.classList.toggle('activeTool',noteMode);
  HL_BTN.classList.toggle('activeTool',highlightMode);
  if(noteMode)PAGES.classList.add('noteCursor');else PAGES.classList.remove('noteCursor');
}
function cleanupBlobUrl(){if(currentBlobUrl){URL.revokeObjectURL(currentBlobUrl);currentBlobUrl=''}}
function clearPages(){cleanupBlobUrl();PAGES.innerHTML='';EMPTY.hidden=false}
function pageAnnoHost(pageEl){return pageEl.querySelector('.annotationLayer')}
function makePageShell(pageNo,width,height){
  const page=document.createElement('div');
  page.className='programPage';
  page.dataset.page=String(pageNo);
  page.style.width=width+'px';
  page.style.height=height+'px';
  const annotation=document.createElement('div');
  annotation.className='annotationLayer';
  page.appendChild(annotation);
  PAGES.appendChild(page);
  return page;
}
function saveNoteText(id,text){
  const a=loadAnno();const n=a.notes.find(x=>x.id===id);if(n){n.text=text;saveAnno(a)}
}
function createNoteEl(note,pageEl){
  const el=document.createElement('div');
  el.className='programNote';
  el.dataset.noteId=note.id;
  el.style.left=(note.x*100)+'%';
  el.style.top=(note.y*100)+'%';
  el.innerHTML='<div class="noteHandle">⋮⋮</div><div class="noteText" contenteditable="true"></div><button class="noteDelete" type="button" aria-label="메모 삭제">×</button>';
  el.querySelector('.noteText').textContent=note.text||'메모';
  el.querySelector('.noteText').addEventListener('input',e=>saveNoteText(note.id,e.currentTarget.textContent||''));
  el.querySelector('.noteDelete').onclick=e=>{
    e.stopPropagation();
    const a=loadAnno();a.notes=a.notes.filter(x=>x.id!==note.id);saveAnno(a);el.remove();
  };
  const handle=el.querySelector('.noteHandle');
  handle.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();
    handle.setPointerCapture(e.pointerId);
    const host=pageEl.getBoundingClientRect();
    const start={x:e.clientX,y:e.clientY,left:parseFloat(el.style.left),top:parseFloat(el.style.top)};
    const move=ev=>{
      const dx=(ev.clientX-start.x)/host.width*100,dy=(ev.clientY-start.y)/host.height*100;
      el.style.left=Math.max(0,Math.min(92,start.left+dx))+'%';
      el.style.top=Math.max(0,Math.min(94,start.top+dy))+'%';
    };
    const up=ev=>{
      handle.releasePointerCapture(ev.pointerId);
      handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);
      const a=loadAnno(),n=a.notes.find(x=>x.id===note.id);
      if(n){n.x=parseFloat(el.style.left)/100;n.y=parseFloat(el.style.top)/100;saveAnno(a)}
    };
    handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',up);
  });
  pageAnnoHost(pageEl).appendChild(el);
}
function createHighlightEl(h,pageEl){
  const el=document.createElement('div');
  el.className='programHighlight';
  el.style.left=(h.x*100)+'%';el.style.top=(h.y*100)+'%';
  el.style.width=(h.w*100)+'%';el.style.height=(h.h*100)+'%';
  el.title='하이라이트';
  el.onclick=e=>{
    if(confirm('이 하이라이트를 삭제할까요?')){
      const a=loadAnno();a.highlights=a.highlights.filter(x=>x.id!==h.id);saveAnno(a);
      document.querySelectorAll('[data-highlight-id="'+h.id+'"]').forEach(x=>x.remove());
    }
    e.stopPropagation();
  };
  el.dataset.highlightId=h.id;
  pageAnnoHost(pageEl).appendChild(el);
}
function restoreAnnotations(){
  if(!currentMeta)return;
  const a=loadAnno();
  for(const pageEl of PAGES.querySelectorAll('.programPage')){
    const page=Number(pageEl.dataset.page);
    a.notes.filter(n=>n.page===page).forEach(n=>createNoteEl(n,pageEl));
    a.highlights.filter(h=>h.page===page).forEach(h=>createHighlightEl(h,pageEl));
  }
}
function addNoteAt(pageEl,clientX,clientY){
  const r=pageEl.getBoundingClientRect();
  const note={id:'n'+Date.now()+Math.random().toString(16).slice(2),page:Number(pageEl.dataset.page),x:(clientX-r.left)/r.width,y:(clientY-r.top)/r.height,text:''};
  const a=loadAnno();a.notes.push(note);saveAnno(a);createNoteEl(note,pageEl);
  setMode('');
  requestAnimationFrame(()=>pageEl.querySelector('[data-note-id="'+note.id+'"] .noteText')?.focus());
}
function selectionHighlights(){
  if(!highlightMode)return;
  const sel=window.getSelection();if(!sel||sel.isCollapsed)return;
  const anchor=sel.anchorNode?.parentElement?.closest('.programPage');
  const focus=sel.focusNode?.parentElement?.closest('.programPage');
  if(!anchor||anchor!==focus){sel.removeAllRanges();return}
  const pageEl=anchor;
  const pr=pageEl.getBoundingClientRect();
  const rects=[...sel.getRangeAt(0).getClientRects()].filter(r=>r.width>1&&r.height>1);
  if(!rects.length){sel.removeAllRanges();return}
  const a=loadAnno();
  for(const r of rects){
    const h={id:'h'+Date.now()+Math.random().toString(16).slice(2),page:Number(pageEl.dataset.page),x:(r.left-pr.left)/pr.width,y:(r.top-pr.top)/pr.height,w:r.width/pr.width,h:r.height/pr.height};
    a.highlights.push(h);createHighlightEl(h,pageEl);
  }
  saveAnno(a);sel.removeAllRanges();setMode('');
}
function renderImage(blob){
  clearPages();EMPTY.hidden=true;currentBlobUrl=URL.createObjectURL(blob);
  const img=new Image();
  img.onload=()=>{
    const max=1000,scale=Math.min(1,max/img.naturalWidth);
    const w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);
    const page=makePageShell(1,w,h);
    img.className='programImage';img.style.width='100%';img.style.height='100%';
    page.insertBefore(img,page.firstChild);
    restoreAnnotations();
  };
  img.src=currentBlobUrl;
}
async function renderPdf(blob){
  clearPages();EMPTY.hidden=true;
  if(!window.pdfjsLib){EMPTY.hidden=false;EMPTY.innerHTML='PDF 보기 모듈을 불러오지 못했습니다.<br><small>인터넷 연결을 확인해 주세요.</small>';return}
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const buf=await blob.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:buf}).promise;
  for(let n=1;n<=pdf.numPages;n++){
    const p=await pdf.getPage(n);
    const base=p.getViewport({scale:1});
    const scale=Math.min(1.55,980/base.width);
    const viewport=p.getViewport({scale});
    const pageEl=makePageShell(n,viewport.width,viewport.height);
    const canvas=document.createElement('canvas');
    canvas.className='pdfCanvas';canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
    pageEl.insertBefore(canvas,pageEl.firstChild);
    await p.render({canvasContext:canvas.getContext('2d'),viewport}).promise;

    const textContent=await p.getTextContent();
    const layer=document.createElement('div');layer.className='pdfTextLayer';
    layer.style.width=viewport.width+'px';layer.style.height=viewport.height+'px';
    for(const item of textContent.items){
      if(!item.str)continue;
      const tx=pdfjsLib.Util.transform(viewport.transform,item.transform);
      const angle=Math.atan2(tx[1],tx[0]);
      const fontHeight=Math.hypot(tx[2],tx[3]);
      const span=document.createElement('span');
      span.textContent=item.str;
      span.style.left=tx[4]+'px';
      span.style.top=(tx[5]-fontHeight)+'px';
      span.style.fontSize=fontHeight+'px';
      span.style.transform='rotate('+angle+'rad)';
      span.style.transformOrigin='0 0';
      layer.appendChild(span);
    }
    pageEl.insertBefore(layer,pageEl.querySelector('.annotationLayer'));
  }
  restoreAnnotations();
}
async function renderCurrent(){
  if(!currentMeta){clearPages();return}
  FILE_NAME.textContent=' · '+currentMeta.name;
  const blob=await getBlob(currentMeta.id);
  if(!blob){clearPages();EMPTY.innerHTML='저장된 파일을 찾을 수 없습니다. 다시 업로드해 주세요.';return}
  if(currentMeta.type==='application/pdf')await renderPdf(blob);
  else if(currentMeta.type.startsWith('image/'))renderImage(blob);
  else{clearPages();EMPTY.innerHTML='워드 파일은 고정 배치가 깨질 수 있습니다.<br><small>워드에서 PDF로 저장한 뒤 업로드해 주세요.</small>'}
}

function issueStartCode(d=new Date()){
  let y=d.getFullYear(),m=d.getMonth()+1;
  if(m%2===0)m-=1;
  return y*100+m;
}
function shiftIssue(code,steps){
  let y=Math.floor(code/100),m=code%100;
  m+=steps*2;
  while(m>12){m-=12;y++}
  while(m<1){m+=12;y--}
  return y*100+m;
}
function issueLabel(code){
  const y=Math.floor(code/100),m=code%100;
  return y+'년 '+m+'-'+(m+1)+'월';
}
function populateIssueSelect(){
  if(!ISSUE_SELECT)return;
  const cur=issueStartCode();
  const codes=[shiftIssue(cur,1),cur,shiftIssue(cur,-1),shiftIssue(cur,-2),shiftIssue(cur,-3),shiftIssue(cur,-4),shiftIssue(cur,-5)];
  ISSUE_SELECT.innerHTML=codes.map(code=>'<option value="'+code+'"'+(code===cur?' selected':'')+'>'+issueLabel(code)+'</option>').join('');
}

const PROGRAM_API='https://rhphbkduummnientfgmp.supabase.co/functions/v1/jw-meeting-program';

function programNoteKey(source,title){
  return 'meetingProgramSectionNoteV1:'+btoa(unescape(encodeURIComponent(source+'|'+title))).replace(/=+$/,'');
}
function getProgramNote(source,title){return localStorage.getItem(programNoteKey(source,title))||''}
function setProgramNote(source,title,text){localStorage.setItem(programNoteKey(source,title),text)}

async function loadWeeks(){
  const code=Number(ISSUE_SELECT?.value||issueStartCode());
  if(!WEEK_SELECT)return;
  WEEK_SELECT.disabled=true;
  WEEK_SELECT.innerHTML='<option>주차 불러오는 중…</option>';
  try{
    const r=await fetch(PROGRAM_API+'?action=list&issue='+encodeURIComponent(code),{cache:'no-store'});
    if(!r.ok)throw new Error('주차 목록을 가져오지 못했습니다.');
    const j=await r.json();
    const weeks=Array.isArray(j.weeks)?j.weeks:[];
    if(!weeks.length)throw new Error('주차 프로그램을 찾지 못했습니다.');
    WEEK_SELECT.innerHTML=weeks.map((w,i)=>'<option value="'+escapeHtml(w.url)+'">'+escapeHtml(w.title)+'</option>').join('');
    WEEK_SELECT.disabled=false;
  }catch(e){
    WEEK_SELECT.innerHTML='<option>불러오기 실패</option>';
    WEEK_SELECT.disabled=true;
  }
}

function showOfficialView(){
  OFFICIAL_VIEW.hidden=false;
  EMPTY.hidden=true;
  PAGES.hidden=true;
}
function hideOfficialView(){
  OFFICIAL_VIEW.hidden=true;
  PAGES.hidden=false;
}
function renderOfficialProgram(data){
  showOfficialView();
  const source=data.source||'';
  OFFICIAL_TITLE.innerHTML='<div><b>'+escapeHtml(data.title||'집회 프로그램')+'</b></div><a target="_blank" rel="noopener" href="'+escapeHtml(source)+'">JW.ORG 원문 열기 ↗</a>';
  const sections=Array.isArray(data.sections)?data.sections:[];
  OFFICIAL_LIST.innerHTML=sections.map((s,i)=>{
    const hasBody=String(s.body||'').trim().length>0;
    const note=getProgramNote(source,s.title);
    return '<article class="programSection" data-program-section="'+i+'">'
      +'<button type="button" class="programSectionHead" aria-expanded="false"><span>'+escapeHtml(s.title)+'</span><span class="programChevron">›</span></button>'
      +'<div class="programSectionBody" hidden>'
      +(hasBody?'<div class="officialText">'+escapeHtml(s.body).replace(/\n/g,'<br>')+'</div>':'')
      +'<label class="sectionNoteLabel">내 메모<textarea class="sectionNote" rows="5" placeholder="이 부분에 자유롭게 메모하세요.">'+escapeHtml(note)+'</textarea></label>'
      +'</div></article>';
  }).join('')||'<div class="programEmpty">프로그램 항목을 찾지 못했습니다.</div>';

  OFFICIAL_LIST.querySelectorAll('.programSection').forEach((el,i)=>{
    const head=el.querySelector('.programSectionHead');
    const body=el.querySelector('.programSectionBody');
    head.onclick=()=>{
      const open=body.hidden;
      body.hidden=!open;
      head.setAttribute('aria-expanded',open?'true':'false');
      el.classList.toggle('open',open);
    };
    const ta=el.querySelector('.sectionNote');
    if(ta)ta.addEventListener('input',()=>setProgramNote(source,sections[i].title,ta.value));
  });
}

async function loadOfficialProgram(){
  const url=WEEK_SELECT?.value||'';
  if(!url||!/^https:\/\//.test(url)){alert('먼저 주차를 선택해 주세요.');return}
  OFFICIAL_BTN.disabled=true;OFFICIAL_BTN.textContent='불러오는 중…';
  try{
    const r=await fetch(PROGRAM_API+'?action=detail&url='+encodeURIComponent(url),{cache:'no-store'});
    if(!r.ok)throw new Error('공식 주간 프로그램을 불러오지 못했습니다.');
    const data=await r.json();
    renderOfficialProgram(data);
    FILE_NAME.textContent=' · '+(data.title||'공식 프로그램');
  }catch(e){
    alert((e?.message||'공식 프로그램을 불러오지 못했습니다.')+'\n잠시 후 다시 시도해 주세요.');
  }finally{
    OFFICIAL_BTN.disabled=false;OFFICIAL_BTN.textContent='공식 프로그램 불러오기';
  }
}

async function handleFile(file){
  hideOfficialView();
  if(!file)return;
  const ext=file.name.toLowerCase();
  if(ext.endsWith('.docx')){
    alert('워드 파일은 작성하면서 내용이 밀릴 수 있어 원본 배치 유지가 어렵습니다.\n워드에서 PDF로 저장한 뒤 업로드하는 방식을 권장합니다.');
    return;
  }
  if(file.type!=='application/pdf'&&!file.type.startsWith('image/')){alert('PDF 또는 이미지 파일을 선택해 주세요.');return}
  const meta={id:docId(file),name:file.name,type:file.type,size:file.size,lastModified:file.lastModified};
  await putBlob(meta.id,file);currentMeta=meta;localStorage.setItem(CURRENT_KEY,JSON.stringify(meta));await renderCurrent();
}
function scriptureUrl(ref){
  try{return typeof bibleFinder==='function'?bibleFinder(ref):''}catch{return ''}
}
function showScripture(){
  const ref=SCRIPTURE_INPUT.value.trim();if(!ref)return;
  const url=scriptureUrl(ref);
  if(!url){SCRIPTURE_WRAP.innerHTML='<div class="scripturePlaceholder">성구 형식을 확인해 주세요.<br>예: 이사야 43:4</div>';return}
  SCRIPTURE_WRAP.innerHTML='<div class="scriptureSideTitle">'+escapeHtml(ref)+'</div><iframe class="scriptureFrame" title="'+escapeHtml(ref)+'" src="'+escapeHtml(url)+'"></iframe><a class="scriptureFallback" target="_blank" rel="noopener" href="'+escapeHtml(url)+'">JW Library에서 전체 보기 ↗</a>';
}
function escapeHtml(s){return String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function openWorkspace(){
  if(!DIALOG.open)DIALOG.showModal();
  if(currentMeta&&!OFFICIAL_VIEW?.hidden)return;
  if(currentMeta)renderCurrent().catch(()=>{});
}
function closeWorkspace(){DIALOG.close();setMode('')}

populateIssueSelect();
ISSUE_SELECT?.addEventListener('change',async()=>{await loadWeeks().then(()=>loadOfficialProgram()).catch(()=>{});await loadOfficialProgram()});
WEEK_SELECT?.addEventListener('change',loadOfficialProgram);
OFFICIAL_BTN?.addEventListener('click',loadOfficialProgram);
loadWeeks();
$('#meetingProgramBtn')?.addEventListener('click',openWorkspace);
$('#closeProgramBtn')?.addEventListener('click',closeWorkspace);
FILE_INPUT?.addEventListener('change',e=>handleFile(e.target.files?.[0]).finally(()=>{e.target.value=''}));
NOTE_BTN?.addEventListener('click',()=>setMode('note'));
HL_BTN?.addEventListener('click',()=>setMode('highlight'));
SCRIPTURE_BTN?.addEventListener('click',showScripture);
SCRIPTURE_INPUT?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();showScripture()}});
PAGES?.addEventListener('click',e=>{
  if(!noteMode)return;
  const page=e.target.closest('.programPage');if(page)addNoteAt(page,e.clientX,e.clientY);
});
PAGES?.addEventListener('mouseup',()=>setTimeout(selectionHighlights,0));
DIALOG?.addEventListener('click',e=>{if(e.target===DIALOG)closeWorkspace()});

try{currentMeta=JSON.parse(localStorage.getItem(CURRENT_KEY)||'null')}catch{currentMeta=null}
if(currentMeta)FILE_NAME.textContent=' · '+currentMeta.name;
})();