const plants=["Işıkkent","Torbalı","Gaziemir","Özbek","Çeşme","Çiğli","Koyundere","Aliağa","Zeytindağ","Akhisar","Aydın","Tekirdağ","Kıraç","Çorlu"];
const seed=[];
let shipments=JSON.parse(localStorage.getItem('betonexa_personal_shipments')||'null')||seed;
let weekStart=getMonday(new Date());
const $=id=>document.getElementById(id);
const save=()=>localStorage.setItem('betonexa_personal_shipments',JSON.stringify(shipments));
const iso=d=>{const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)};
const trDate=s=>new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(s+'T12:00:00'));
const trLong=d=>new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d);
function getMonday(d){const x=new Date(d);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);x.setHours(12,0,0,0);return x}
function init(){plants.forEach(p=>$('plant').add(new Option(p,p)));$('todayText').textContent=trLong(new Date());$('date').value=iso(new Date());$('time').value='08:00';if(localStorage.getItem('betonexa_personal_login')==='1')showApp();if(localStorage.getItem('betonexa_theme')==='dark')document.body.classList.add('dark');renderAll();}
function showApp(){localStorage.setItem('betonexa_personal_login','1');$('login').classList.add('hidden');$('app').classList.remove('hidden')}
$('loginBtn').onclick=()=>{if($('password').value==='1234')showApp();else alert('Şifre hatalı.')};
$('eye').onclick=()=>{$('password').type=$('password').type==='password'?'text':'password'};
$('logout').onclick=()=>{localStorage.removeItem('betonexa_personal_login');location.reload()};
$('themeBtn').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('betonexa_theme',document.body.classList.contains('dark')?'dark':'light')};
function switchView(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));$(id).classList.add('active-view');document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===id));const names={dashboard:'Hazır Beton Sevkiyat Yönetimi',calendar:'Sevkiyat Takvimi',shipments:'Tüm Sevkiyatlar',reports:'Raporlar',settings:'Ayarlar'};$('pageTitle').textContent=names[id]}
document.querySelectorAll('.nav').forEach(n=>n.onclick=()=>switchView(n.dataset.view));document.querySelectorAll('[data-go]').forEach(n=>n.onclick=()=>switchView(n.dataset.go));
function card(s){return `<article class="shipment-card" data-id="${s.id}"><div class="time-box">${s.time}<small>${trDate(s.date)}</small></div><div><div class="site-name">${esc(s.site)}</div><small>${esc(s.company)} • ${esc(s.plant)}</small></div><div class="meta"><b>${esc(s.concreteClass)} / ${esc(s.slump)}</b><small>${esc(s.pumpStatus==='Pompalı'?s.pumpType:'Pompasız')}</small></div><div class="badge">${num(s.amount)} m³</div><button class="icon" type="button">›</button></article>`}
function esc(v=''){return String(v).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function num(v){return new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2}).format(Number(v)||0)}
function bindCards(){document.querySelectorAll('.shipment-card,.mini-event,.conflict-link').forEach(x=>x.onclick=()=>openModal(shipments.find(s=>String(s.id)===String(x.dataset.id))))}
function renderAll(){renderDashboard();renderList();renderCalendar();renderReports()}
function renderDashboard(){
  const today=iso(new Date()),month=today.slice(0,7);
  const td=shipments.filter(s=>s.date===today);
  const recent=[...shipments].sort((a,b)=>Number(b.id)-Number(a.id)).slice(0,10);
  const conflicts=getUpcomingConflicts(today);
  $('kpiToday').textContent=td.length;
  $('kpiTodayM3').textContent=num(sum(td));
  $('kpiMonthM3').textContent=num(sum(shipments.filter(s=>s.date.startsWith(month))));
  $('kpiPumped').textContent=num(sum(shipments.filter(s=>s.pumpStatus==='Pompalı')));
  $('todayList').innerHTML=td.length?[...td].sort(sorter).map(card).join(''):'<div class="empty">Bugün için kayıtlı sevkiyat yok.</div>';
  $('recentList').innerHTML=recent.length?recent.map(card).join(''):'<div class="empty">Henüz sevkiyat kaydı yok.</div>';
  $('conflictPanel').classList.toggle('hidden',!conflicts.length);
  $('conflictCount').textContent=conflicts.length;
  $('conflictList').innerHTML=conflicts.map(conflictCard).join('');
  bindCards();
}
function getUpcomingConflicts(today){
  const watched=new Set(["47'lik","52'lik","56'lık"]),groups=new Map();
  shipments.filter(s=>s.date>=today&&s.pumpStatus==='Pompalı'&&watched.has(s.pumpType)).forEach(s=>{
    const key=`${s.date}|${s.time}|${s.pumpType}`;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(s);
  });
  return [...groups.values()].filter(g=>g.length>1).sort((a,b)=>sorter(a[0],b[0]));
}
function conflictCard(group){
  const first=group[0];
  return `<article class="conflict-card"><div><b>${trDate(first.date)} • ${first.time}</b><small>${esc(first.pumpType)} pompa için ${group.length} sevkiyat çakışıyor</small></div><div class="conflict-sites">${group.map(s=>`<button type="button" class="conflict-link" data-id="${s.id}">${esc(s.site)} • ${esc(s.company)}</button>`).join('')}</div></article>`;
}
function sum(arr){return arr.reduce((a,b)=>a+(Number(b.amount)||0),0)}function sorter(a,b){return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)}
function renderList(){const q=$('search').value.toLocaleLowerCase('tr-TR'),f=$('filter').value,today=iso(new Date());let a=shipments.filter(s=>{if(f==='today'&&s.date!==today)return false;if(f==='pumped'&&s.pumpStatus!=='Pompalı')return false;if(f==='unpumped'&&s.pumpStatus!=='Pompasız')return false;return `${s.company} ${s.site} ${s.plant}`.toLocaleLowerCase('tr-TR').includes(q)}).sort(sorter);$('shipmentList').innerHTML=a.length?a.map(card).join(''):'<div class="empty">Kayıt bulunamadı.</div>';bindCards()}
$('search').oninput=renderList;$('filter').onchange=renderList;
function renderCalendar(){const days=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];const end=new Date(weekStart);end.setDate(end.getDate()+6);$('weekLabel').textContent=`${trDate(iso(weekStart))} – ${trDate(iso(end))}`;$('weekGrid').innerHTML=days.map((name,i)=>{const d=new Date(weekStart);d.setDate(d.getDate()+i);const key=iso(d),items=shipments.filter(s=>s.date===key).sort(sorter);return `<div class="day-column ${key===iso(new Date())?'today':''}"><div class="day-head">${name}<small>${trDate(key)}</small></div>${items.map(s=>`<div class="mini-event" data-id="${s.id}"><b>${s.time} • ${esc(s.site)}</b>${esc(s.company)}<br>${num(s.amount)} m³ • ${esc(s.pumpStatus==='Pompalı'?s.pumpType:'Pompasız')}</div>`).join('')}</div>`}).join('');bindCards()}
$('prevWeek').onclick=()=>{weekStart.setDate(weekStart.getDate()-7);renderCalendar()};$('nextWeek').onclick=()=>{weekStart.setDate(weekStart.getDate()+7);renderCalendar()};$('thisWeek').onclick=()=>{weekStart=getMonday(new Date());renderCalendar()};
function renderReports(){$('rCount').textContent=shipments.length;$('rM3').textContent=num(sum(shipments));$('rPump').textContent=num(sum(shipments.filter(s=>s.pumpStatus==='Pompalı')));$('rCompanies').textContent=new Set(shipments.map(s=>s.company).filter(Boolean)).size;const map={};shipments.forEach(s=>map[s.company]=(map[s.company]||0)+(Number(s.amount)||0));const rows=Object.entries(map).sort((a,b)=>b[1]-a[1]),max=Math.max(...rows.map(x=>x[1]),1);$('companyReport').innerHTML=rows.length?rows.map(([n,v])=>`<div class="report-row"><b>${esc(n)}</b><div class="bar"><i style="width:${v/max*100}%"></i></div><strong>${num(v)} m³</strong></div>`).join(''):'<div class="empty">Henüz raporlanacak veri yok.</div>'}
function openModal(item){$('shipmentForm').reset();$('editId').value=item?.id||'';$('modalTitle').textContent=item?'Sevkiyatı Düzenle':'Yeni Sevkiyat';$('date').value=item?.date||iso(new Date());$('time').value=item?.time||'08:00';$('plant').value=item?.plant||plants[0];$('company').value=item?.company||'';$('site').value=item?.site||'';$('concreteClass').value=item?.concreteClass||'C30/37';$('slump').value=item?.slump||'S3';$('amount').value=item?.amount||'';$('pumpStatus').value=item?.pumpStatus||'Pompalı';$('pumpType').value=item?.pumpType||"47'lik";$('contactName').value=item?.contactName||'';$('phone').value=item?.phone||'';$('note').value=item?.note||'';$('deleteBtn').classList.toggle('hidden',!item);togglePump();checkConflict();$('modal').classList.remove('hidden')}
function closeModal(){$('modal').classList.add('hidden')}$('addBtn').onclick=()=>openModal();$('closeModal').onclick=closeModal;$('cancelBtn').onclick=closeModal;document.querySelector('.backdrop').onclick=closeModal;
function togglePump(){$('pumpType').disabled=$('pumpStatus').value==='Pompasız';checkConflict()}$('pumpStatus').onchange=togglePump;['date','time','pumpType'].forEach(id=>$(id).onchange=checkConflict);
function checkConflict(){const id=$('editId').value,watched=["47'lik","52'lik","56'lık"];const c=$('pumpStatus').value==='Pompalı'&&watched.includes($('pumpType').value)&&shipments.some(s=>String(s.id)!==String(id)&&s.date===$('date').value&&s.time===$('time').value&&s.pumpStatus==='Pompalı'&&s.pumpType===$('pumpType').value);$('conflict').classList.toggle('hidden',!c)}
$('shipmentForm').onsubmit=e=>{e.preventDefault();const id=$('editId').value||Date.now();const record={id:Number(id),date:$('date').value,time:$('time').value,plant:$('plant').value,company:$('company').value.trim(),site:$('site').value.trim(),concreteClass:$('concreteClass').value,slump:$('slump').value,amount:Number($('amount').value),pumpStatus:$('pumpStatus').value,pumpType:$('pumpStatus').value==='Pompalı'?$('pumpType').value:'',contactName:$('contactName').value.trim(),phone:$('phone').value.trim(),note:$('note').value.trim()};const i=shipments.findIndex(s=>String(s.id)===String(id));if(i>=0)shipments[i]=record;else shipments.push(record);save();closeModal();renderAll()};
$('deleteBtn').onclick=()=>{const id=$('editId').value;if(confirm('Bu sevkiyat silinsin mi?')){shipments=shipments.filter(s=>String(s.id)!==String(id));save();closeModal();renderAll()}};
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
$('exportJson').onclick=()=>download(`betonexa-yedek-${iso(new Date())}.json`,JSON.stringify(shipments,null,2),'application/json');
$('importJson').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!Array.isArray(data))throw Error();shipments=data;save();renderAll();alert('Yedek başarıyla yüklendi.')}catch{alert('Geçersiz yedek dosyası.')}};
$('exportCsv').onclick=()=>{const heads=['Tarih','Saat','Santral','Firma','Şantiye','Beton Sınıfı','Özellik','Metraj','Pompa Durumu','Pompa Boyu','Sorumlu','Telefon','Not'];const rows=shipments.sort(sorter).map(s=>[s.date,s.time,s.plant,s.company,s.site,s.concreteClass,s.slump,s.amount,s.pumpStatus,s.pumpType,s.contactName,s.phone,s.note].map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';'));download(`betonexa-sevkiyatlar-${iso(new Date())}.csv`,'\ufeff'+heads.join(';')+'\n'+rows.join('\n'),'text/csv;charset=utf-8')};
$('clearData').onclick=()=>{if(confirm('Tüm sevkiyat kayıtları kalıcı olarak silinsin mi?')){shipments=[];save();renderAll()}};
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
init();
