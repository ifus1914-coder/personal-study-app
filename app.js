const KEY='personalStudyDataV1';
const mk=(id,category,subcategory,title,scripture,content,application,keywords)=>({id,category,subcategory,title,scripture,content,application,keywords,favorite:false,source:''});
const seed=[
mk('i1','봉사서론','서론 모음','봉사 서론 모음','','호별 방문, 재방문, 비공식 증거에서 사용할 수 있는 서론을 주제별로 모아두고 상황에 맞게 수정합니다.','오늘 봉사에서 사용할 서론 하나를 미리 준비합니다.',['봉사서론','서론','첫마디']),
mk('m1','봉사모임','호별','잘 듣는 것이 좋은 대화의 시작입니다','야고보서 1:19','상대방이 말할 때 먼저 잘 듣고 관심과 필요를 알아봅니다.','오늘 한 사람의 이야기를 진심으로 끝까지 들어봅니다.',['듣기','대화']),
mk('m2','봉사모임','호별','좋은 반응이 없어도 낙심하지 마십시오','전도서 11:6','우리의 역할은 충실하게 씨를 뿌리는 것입니다. 결과가 바로 보이지 않아도 낙심하지 않습니다.','반응보다 친절하고 기쁘게 씨를 뿌리는 데 집중합니다.',['낙심','씨']),
mk('m3','봉사모임','호별','질문 하나로 대화를 이어 가는 방법','잠언 20:5','좋은 질문으로 상대방의 생각을 길어 올리고 답할 시간을 충분히 줍니다.','짧은 대답 뒤에 생각을 묻는 질문을 하나 더 해봅니다.',['질문','대화']),
mk('m4','봉사모임','호별','동료 전도인을 격려하는 봉사','데살로니가 전서 5:11','함께 봉사하는 사람의 잘한 점을 찾아 구체적으로 격려하고 서로 도와줍니다.','오늘 동료에게 진심 어린 격려를 한 번 합니다.',['격려','동료']),
mk('m5','봉사모임','호별','무관심한 사람을 만났을 때','골로새서 4:6','상대방의 의사를 존중하면서 마지막까지 친절하고 따뜻한 인상을 남깁니다.','거절을 받아도 마지막 인사를 따뜻하게 합니다.',['무관심','친절']),
mk('m6','봉사모임','호별','JW.ORG를 효과적으로 활용하기','','많은 것을 한꺼번에 보여 주기보다 상대방에게 지금 필요한 자료 하나를 찾도록 도와줍니다.','봉사 전에 사용할 주제 하나를 미리 찾아둡니다.',['JW.ORG','자료']),
mk('m7','봉사모임','호별','사람을 숫자가 아니라 한 사람으로 보십시오','마태복음 9:36','예수처럼 각 사람의 사정과 필요에 관심을 갖고 부드럽게 대합니다.','무엇을 말할지보다 이 사람이 어떤 사람인지 먼저 생각합니다.',['관심','동정심']),
mk('m8','봉사모임','호별','여호와께 맡기고 즐겁게 봉사하십시오','고린도 전서 3:6, 7','우리는 심고 물을 주지만 자라게 하시는 분은 하느님입니다. 결과에 대한 부담을 내려놓습니다.','할 수 있는 일을 충실히 하고 결과는 여호와께 맡깁니다.',['기쁨','결과']),
mk('e1','봉사모임','공개증거','사람들이 다가오기 쉬운 전도인이 되려면','고린도 전서 13:4, 5','따뜻한 표정과 편안한 자세로 사람들이 부담 없이 다가올 수 있게 합니다.','오늘 전시대에서 표정과 자세가 따뜻한지 의식해 봅니다.',['공개증거','전시대','다가오기']),
mk('e2','봉사모임','공개증거','먼저 관찰하고 관심사를 알아낸다','요한복음 4:6-9','상대방을 먼저 관찰하고 관심사를 파악해 그 사람에게 맞는 대화를 시작합니다.','지나가는 사람의 상황과 관심을 관찰한 뒤 자연스럽게 말을 건넵니다.',['공개증거','관찰','관심사']),
mk('e3','봉사모임','공개증거','전시대 봉사의 목표는 대화를 시작하는 것이다','요한복음 6:44','출판물을 전하는 데 그치지 않고 성경에 관한 자연스러운 대화와 연구로 이어지도록 돕습니다.','자료 배부보다 좋은 대화를 시작하는 데 초점을 둡니다.',['공개증거','전시대','대화']),
mk('e4','봉사모임','공개증거','반응이 적어도 우리의 수고는 헛되지 않는다','고린도 전서 15:58','즉각적인 반응보다 충실한 노력 자체가 가치 있다는 점을 기억합니다.','반응이 적어도 기쁨과 좋은 태도를 유지합니다.',['공개증거','인내','수고']),
mk('e5','봉사모임','공개증거','전시대는 말없이도 증거한다','마태복음 24:14','전시대와 우리의 단정하고 친절한 모습 자체가 지나가는 사람들에게 좋은 인상을 줄 수 있습니다.','사람이 다가오지 않아도 좋은 인상을 주는 태도를 유지합니다.',['공개증거','전시대','증거']),
mk('e6','봉사모임','공개증거','반대하는 사람에게 온화하게 대응한다','잠언 15:1','논쟁하려 하지 않고 온화하고 침착하게 대응하며 필요하면 대화를 정중히 마칩니다.','평정심과 안전을 우선하며 부드럽게 대답합니다.',['공개증거','온화','반대']),
mk('e7','봉사모임','공개증거','꾸준한 봉사는 신뢰와 친숙함을 만든다','갈라디아서 6:9','같은 장소에서 꾸준히 봉사하면 반복해서 보는 사람들이 친숙함과 신뢰를 느낄 수 있습니다.','전에 본 사람을 기억하고 따뜻하게 인사합니다.',['공개증거','꾸준함','신뢰']),
mk('e8','봉사모임','공개증거','다가오는 사람에게는 보이지 않는 사연이 있다','야고보서 1:19','다가오는 사람에게 바로 설명하기보다 먼저 충분히 듣고 그 사람의 필요를 이해합니다.','말하기보다 먼저 잘 듣는 것을 목표로 합니다.',['공개증거','듣기','관심']),
mk('p1','개인연구','성경 인물','성경 인물 연구','','인물의 배경, 선택, 믿음, 결과를 살펴보고 배울 점을 기록합니다.','내 상황에 적용할 한 가지를 적어봅니다.',['인물']),
mk('p2','개인연구','여호와의 특성','여호와의 특성 연구','','한 가지 특성을 정하고 관련 성구와 기록에서 그 특성이 어떻게 나타나는지 연구합니다.','그 특성을 본받을 방법을 정합니다.',['여호와','특성']),
mk('p3','개인연구','예수의 본','예수의 말과 행동에서 배우기','','복음서의 한 장면을 선택해 예수의 생각, 말, 행동을 관찰합니다.','예수의 태도를 오늘 어떻게 본받을지 기록합니다.',['예수','본']),
mk('p4','개인연구','성구 연구','한 성구 깊이 연구하기','','문맥, 핵심 표현, 관련 성구, 배경 자료를 살펴봅니다.','이 성구가 내 결정과 생활에 어떤 영향을 주는지 적습니다.',['성구','문맥']),
mk('p5','개인연구','성경 질문','궁금했던 성경 질문','','질문을 하나 정하고 성경과 공식 자료에서 근거를 찾아 결론을 정리합니다.','알게 된 점을 짧게 설명할 수 있도록 정리합니다.',['질문']),
mk('p6','개인연구','그리스도인 특성','기르고 싶은 그리스도인 특성','','한 가지 특성을 정하고 좋은 본과 실천 방법을 연구합니다.','이번 주 실천 목표를 하나 정합니다.',['특성','생활']),
mk('p7','개인연구','봉사 적용','봉사에 적용할 개인 연구','','봉사에서 개선하고 싶은 점을 정해 성경 원칙과 실제 적용 방법을 연구합니다.','다음 봉사에서 한 가지를 직접 사용합니다.',['봉사','적용']),
mk('p8','개인연구','가족·생활','가족과 일상생활에 적용하기','','가족 관계와 일상에서 도움이 필요한 주제를 정해 성경 원칙을 찾습니다.','가정에서 실천할 구체적인 행동을 정합니다.',['가족','생활']),
mk('w1','집회준비','평일 집회','평일 집회 준비','','성경 읽기 범위와 각 부분의 핵심점을 미리 살펴보고 해설할 점을 기록합니다.','해설할 한 가지 요점을 준비합니다.',['평일집회']),
mk('w2','집회준비','주말 집회','공개 강연 준비','','주제와 주요 성구를 미리 살펴보고 듣고 싶은 질문을 정리합니다.','강연에서 얻은 적용점을 기록합니다.',['공개강연']),
mk('w3','집회준비','파수대 연구','파수대 연구 준비','','각 항의 질문에 답하고 핵심 성구가 요점과 어떻게 연결되는지 살펴봅니다.','나에게 특히 필요한 한 가지를 표시합니다.',['파수대']),
mk('w4','집회준비','해설 준비','짧고 명확한 해설 준비','','질문에 직접 답하는 핵심 문장과 보충 요점을 구분해 준비합니다.','30초 안에 자연스럽게 말할 수 있게 정리합니다.',['해설'])
];
let data=JSON.parse(localStorage.getItem(KEY)||'null')||seed;
for(const s of seed){let old=data.find(x=>x.id===s.id);if(!old)data.push(s);else if(/^m[1-8]$/.test(s.id))old.subcategory='호별'}
localStorage.setItem(KEY,JSON.stringify(data));
let tab='개인연구',sub='전체',editId=null;
const $=s=>document.querySelector(s),cats=['봉사모임','봉사서론','개인연구','집회준비','즐겨찾기'];
const esc=(s='')=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function card(x){return '<article class="card" data-open="'+x.id+'"><div class="cardTop"><div><div class="meta">'+esc(x.category)+' · '+esc(x.subcategory)+'</div><h3>'+esc(x.title)+'</h3></div><span>'+(x.favorite?'⭐':'')+'</span></div>'+(x.scripture?'<div class="scripture">'+esc(x.scripture)+'</div>':'')+'<div class="body">'+esc(x.content)+'</div>'+(x.application?'<p><b>적용:</b> '+esc(x.application)+'</p>':'')+'<div class="tags">'+(x.keywords||[]).map(k=>'<span class="tag">#'+esc(k)+'</span>').join('')+'</div>'+(x.source?'<p><a target="_blank" rel="noopener" href="'+esc(x.source)+'">공식 자료 열기 ↗</a></p>':'')+'<div class="cardActions"><button class="fav" data-fav="'+x.id+'">'+(x.favorite?'즐겨찾기 해제':'☆ 즐겨찾기')+'</button><button data-edit="'+x.id+'">수정</button><button class="danger" data-del="'+x.id+'">삭제</button></div></article>'}
function render(){ $('#tabs').innerHTML=cats.map(c=>'<button class="'+(tab===c?'active':'')+'" data-tab="'+c+'">'+c+'</button>').join('');let base=tab==='즐겨찾기'?data.filter(x=>x.favorite):data.filter(x=>x.category===tab);let subs=['전체',...new Set(base.map(x=>x.subcategory))];if(!subs.includes(sub))sub='전체';$('#subcats').innerHTML=subs.map(s=>'<button class="chip '+(sub===s?'active':'')+'" data-sub="'+s+'">'+s+'</button>').join('');let q=$('#search').value.trim().toLowerCase();let rows=base.filter(x=>(sub==='전체'||x.subcategory===sub)&&(!q||[x.title,x.scripture,x.content,x.application,(x.keywords||[]).join(' ')].join(' ').toLowerCase().includes(q)));$('#list').innerHTML=rows.length?rows.map(card).join(''):'<div class="empty">해당 자료가 없습니다.<br>＋ 새 자료로 직접 추가할 수 있습니다.</div>'}
function openEditor(x=null){editId=x?.id||null;$('#formTitle').textContent=x?'자료 수정':'새 자료';$('#category').innerHTML=cats.slice(0,4).map(c=>'<option>'+c+'</option>').join('');$('#category').value=x?.category||(tab==='즐겨찾기'?'개인연구':tab);for(const k of ['subcategory','title','scripture','content','application','source'])$('#'+k).value=x?.[k]||'';$('#keywords').value=(x?.keywords||[]).join(', ');$('#editor').showModal()}
document.addEventListener('click',e=>{let b=e.target.closest('button');if(!b){let card=e.target.closest('.card');if(card&&card.dataset.open)openEditor(data.find(v=>v.id===card.dataset.open));return;}if(b.dataset.tab){tab=b.dataset.tab;sub='전체';render()}else if(b.dataset.sub){sub=b.dataset.sub;render()}else if(b.dataset.fav){let x=data.find(v=>v.id===b.dataset.fav);x.favorite=!x.favorite;save();render()}else if(b.dataset.edit)openEditor(data.find(v=>v.id===b.dataset.edit));else if(b.dataset.del&&confirm('이 자료를 삭제할까요?')){data=data.filter(v=>v.id!==b.dataset.del);save();render()}});
$('#search').addEventListener('input',render);$('#addBtn').onclick=()=>openEditor();$('#cancel').onclick=()=>$('#editor').close();
$('#form').onsubmit=e=>{e.preventDefault();let old=data.find(x=>x.id===editId);let obj={id:editId||String(Date.now()),category:$('#category').value,subcategory:$('#subcategory').value.trim(),title:$('#title').value.trim(),scripture:$('#scripture').value.trim(),content:$('#content').value.trim(),application:$('#application').value.trim(),keywords:$('#keywords').value.split(',').map(x=>x.trim()).filter(Boolean),source:$('#source').value.trim(),favorite:old?.favorite||false};if(editId)data=data.map(x=>x.id===editId?obj:x);else data.unshift(obj);save();$('#editor').close();tab=obj.category;sub='전체';render()};
let deferred;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#installBtn').hidden=false});$('#installBtn').onclick=async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;$('#installBtn').hidden=true}};
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');render();