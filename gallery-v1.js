(()=>{
'use strict';
const DB='planner-photo-gallery-v1-fixed',STORE='photos';
let currentKey='';
const $=id=>document.getElementById(id);
function ensureUI(){
 if($('photoGalleryModal')) return;
 const wrap=document.createElement('div');
 wrap.innerHTML='<div id="photoGalleryModal" class="photo-gallery-modal hidden"><div class="photo-gallery-card"><div class="photo-gallery-head"><h2 id="photoGalleryTitle">📸 Fotos</h2><button type="button" class="photo-gallery-close" id="photoGalleryClose">×</button></div><label class="photo-gallery-add">📸 Adicionar fotos<input id="photoGalleryInput" class="photo-gallery-input" type="file" accept="image/*,.heic,.heif" multiple></label><div id="photoGalleryStatus" class="photo-gallery-status"></div><div id="photoGalleryGrid" class="photo-gallery-grid"></div></div></div><div id="photoGalleryLightbox" class="photo-gallery-lightbox hidden"><button type="button" id="photoGalleryLightboxClose">×</button><img id="photoGalleryLightboxImg" alt="Foto ampliada"></div>';
 document.body.appendChild(wrap.firstElementChild);document.body.appendChild(wrap.lastElementChild);
 $('photoGalleryClose').onclick=close;$('photoGalleryModal').onclick=e=>{if(e.target.id==='photoGalleryModal')close()};$('photoGalleryLightboxClose').onclick=()=>{$('photoGalleryLightbox').classList.add('hidden')};
 $('photoGalleryInput').onchange=async e=>{const files=[...e.target.files||[]];if(!files.length)return;setStatus('Salvando fotos… 💗');try{for(let i=0;i<files.length;i++)await saveFile(files[i],i);setStatus(files.length+' foto(s) salva(s)! 💗');await render()}catch(err){console.error(err);setStatus('Não foi possível salvar: '+(err.message||'erro'))}e.target.value=''};
}
function open(type,id,title){ensureUI();currentKey=type+':'+id;$('photoGalleryTitle').textContent='📸 Fotos — '+(title||'');$('photoGalleryModal').classList.remove('hidden');render();}
window.openPhotoGallery=open;
function close(){if($('photoGalleryModal'))$('photoGalleryModal').classList.add('hidden');}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function fileData(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file)})}
async function saveFile(file,i){const dataUrl=await fileData(file);const db=await openDB();await new Promise((resolve,reject)=>{const q=db.transaction(STORE,'readwrite').objectStore(STORE).add({album:currentKey,name:file.name||'Foto',dataUrl,created:Date.now()+i});q.onsuccess=resolve;q.onerror=()=>reject(q.error)})}
async function getPhotos(){const db=await openDB();return new Promise((resolve,reject)=>{const q=db.transaction(STORE,'readonly').objectStore(STORE).getAll();q.onsuccess=()=>resolve((q.result||[]).filter(x=>x.album===currentKey).sort((a,b)=>(a.created||0)-(b.created||0)));q.onerror=()=>reject(q.error)})}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
async function render(){ensureUI();const grid=$('photoGalleryGrid');grid.innerHTML='<div class="photo-gallery-empty">Carregando… 💗</div>';try{const photos=await getPhotos();if(!photos.length){grid.innerHTML='<div class="photo-gallery-empty">Ainda não há fotos nesta viagem/passeio. 💗</div>';return}grid.innerHTML=photos.map(p=>'<article class="photo-gallery-item"><img src="'+p.dataUrl+'" alt="'+esc(p.name||'Foto')+'"><div class="photo-gallery-caption">'+esc(p.name||'Foto')+'</div><div class="photo-gallery-actions"><button type="button" class="photo-gallery-delete" data-photo-delete="'+p.id+'">🗑 Excluir foto</button></div></article>').join('');grid.querySelectorAll('img').forEach(img=>img.onclick=()=>{$('photoGalleryLightboxImg').src=img.src;$('photoGalleryLightbox').classList.remove('hidden')});grid.querySelectorAll('[data-photo-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Deseja excluir esta foto?'))return;const db=await openDB();await new Promise((resolve,reject)=>{const q=db.transaction(STORE,'readwrite').objectStore(STORE).delete(Number(b.dataset.photoDelete));q.onsuccess=resolve;q.onerror=()=>reject(q.error)});await render()})}catch(e){console.error(e);grid.innerHTML='<div class="photo-gallery-empty">Não foi possível carregar as fotos.</div>'}}
function setStatus(t){ensureUI();$('photoGalleryStatus').textContent=t}
ensureUI();
document.addEventListener('click',function(e){
  const b=e.target.closest('.photo-gallery-trigger');
  if(!b)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const card=b.closest('.content-card');
  const list=b.closest('#tripList,#outingList');
  const type=list?.id==='tripList'?'trip':list?.id==='outingList'?'outing':'';
  const edit=card?.querySelector('button[onclick*="editItem"]');
  const raw=edit?.getAttribute('onclick')||'';
  const m=raw.match(/editItem\(\s*['"](?:trip|outing)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/);
  if(!type||!m)return;
  const h=card?.querySelector('h3')?.textContent||'Fotos';
  const title=h.replace(type==='trip'?'✈️':'🎡','').trim();
  open(type,m[1],title);
},true);
})();