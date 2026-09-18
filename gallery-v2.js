(function(){
'use strict';
var DB='planner-photo-gallery-v1-fixed';
var STORE='photos';
var currentKey='';
function byId(id){return document.getElementById(id);}
function ensureUI(){
  if(byId('photoGalleryModal')) return;
  var d=document.createElement('div');
  d.innerHTML='<div id="photoGalleryModal" class="photo-gallery-modal hidden"><div class="photo-gallery-card"><div class="photo-gallery-head"><h2 id="photoGalleryTitle">📸 Fotos</h2><button type="button" class="photo-gallery-close" id="photoGalleryClose">×</button></div><label class="photo-gallery-add">📸 Adicionar fotos<input id="photoGalleryInput" class="photo-gallery-input" type="file" accept="image/*" multiple></label><div id="photoGalleryStatus" class="photo-gallery-status"></div><div id="photoGalleryGrid" class="photo-gallery-grid"></div></div></div><div id="photoGalleryLightbox" class="photo-gallery-lightbox hidden"><button type="button" id="photoGalleryLightboxClose">×</button><img id="photoGalleryLightboxImg" alt="Foto ampliada"></div>';
  document.body.appendChild(d.firstElementChild);
  document.body.appendChild(d.lastElementChild);
  byId('photoGalleryClose').onclick=closeGallery;
  byId('photoGalleryModal').onclick=function(e){if(e.target===byId('photoGalleryModal'))closeGallery();};
  byId('photoGalleryLightboxClose').onclick=function(){byId('photoGalleryLightbox').classList.add('hidden');};
  byId('photoGalleryInput').onchange=function(e){saveFiles(e.target.files);e.target.value='';};
}
function openGallery(type,id,title){
  ensureUI();
  currentKey=String(type)+':'+String(id);
  byId('photoGalleryTitle').textContent='📸 Fotos — '+(title||'');
  byId('photoGalleryModal').classList.remove('hidden');
  renderPhotos();
}
window.openPhotoGallery=openGallery;
function closeGallery(){var m=byId('photoGalleryModal');if(m)m.classList.add('hidden');}
function openDB(){
  return new Promise(function(resolve,reject){
    var r=indexedDB.open(DB,1);
    r.onupgradeneeded=function(){if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id',autoIncrement:true});};
    r.onsuccess=function(){resolve(r.result);};
    r.onerror=function(){reject(r.error);};
  });
}
function readFile(file){
  return new Promise(function(resolve,reject){
    var r=new FileReader();
    r.onload=function(){resolve(r.result);};
    r.onerror=function(){reject(r.error);};
    r.readAsDataURL(file);
  });
}
function addPhoto(row){
  return openDB().then(function(db){return new Promise(function(resolve,reject){
    var q=db.transaction(STORE,'readwrite').objectStore(STORE).add(row);
    q.onsuccess=resolve;q.onerror=function(){reject(q.error);};
  });});
}
function getPhotos(){
  return openDB().then(function(db){return new Promise(function(resolve,reject){
    var q=db.transaction(STORE,'readonly').objectStore(STORE).getAll();
    q.onsuccess=function(){resolve((q.result||[]).filter(function(x){return x.album===currentKey;}).sort(function(a,b){return (a.created||0)-(b.created||0);});};
    q.onerror=function(){reject(q.error);};
  });});
}
function setStatus(t){ensureUI();byId('photoGalleryStatus').textContent=t;}
function saveFiles(files){
  var list=Array.prototype.slice.call(files||[]);
  if(!list.length)return;
  setStatus('Salvando '+list.length+' foto(s)… 💗');
  var chain=Promise.resolve();
  list.forEach(function(file,index){
    chain=chain.then(function(){return readFile(file).then(function(dataUrl){return addPhoto({album:currentKey,name:file.name||'Foto',dataUrl:dataUrl,created:Date.now()+index});});});
  });
  chain.then(function(){setStatus(list.length+' foto(s) salva(s)! 💗');return renderPhotos();}).catch(function(e){console.error(e);setStatus('Não foi possível salvar: '+(e&&e.message?e.message:'erro'));});
}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];});}
function renderPhotos(){
  ensureUI();
  var grid=byId('photoGalleryGrid');
  grid.innerHTML='<div class="photo-gallery-empty">Carregando… 💗</div>';
  return getPhotos().then(function(photos){
    if(!photos.length){grid.innerHTML='<div class="photo-gallery-empty">Ainda não há fotos nesta viagem/passeio. 💗</div>';return;}
    grid.innerHTML=photos.map(function(p){return '<article class="photo-gallery-item"><img src="'+p.dataUrl+'" alt="'+esc(p.name||'Foto')+'"><div class="photo-gallery-caption">'+esc(p.name||'Foto')+'</div><div class="photo-gallery-actions"><button type="button" class="photo-gallery-delete" data-photo-delete="'+p.id+'">🗑 Excluir foto</button></div></article>';}).join('');
    Array.prototype.forEach.call(grid.querySelectorAll('img'),function(img){img.onclick=function(){byId('photoGalleryLightboxImg').src=img.src;byId('photoGalleryLightbox').classList.remove('hidden');};});
    Array.prototype.forEach.call(grid.querySelectorAll('[data-photo-delete]'),function(btn){btn.onclick=function(){if(!confirm('Deseja excluir esta foto?'))return;openDB().then(function(db){return new Promise(function(resolve,reject){var q=db.transaction(STORE,'readwrite').objectStore(STORE).delete(Number(btn.getAttribute('data-photo-delete')));q.onsuccess=resolve;q.onerror=function(){reject(q.error);};});}).then(renderPhotos);};});
  }).catch(function(e){console.error(e);grid.innerHTML='<div class="photo-gallery-empty">Não foi possível carregar as fotos.</div>';});
}
ensureUI();
document.addEventListener('click',function(e){
  var b=e.target&&e.target.closest?e.target.closest('.photo-gallery-trigger'):null;
  if(!b)return;
  var card=b.closest('.content-card');
  var edit=card?card.querySelector('button[onclick*="editItem"]'):null;
  var raw=edit?edit.getAttribute('onclick'):'';
  var m=raw.match(/editItem\(\s*['"](?:trip|outing)['"]\s*,\s*['"]([^'"]+)['"]/);
  var list=b.closest('#tripList,#outingList');
  var type=list&&list.id==='tripList'?'trip':list&&list.id==='outingList'?'outing':'';
  if(!type||!m)return;
  e.preventDefault();
  e.stopPropagation();
  var h=card&&card.querySelector('h3')?card.querySelector('h3').textContent:'Fotos';
  var title=h.replace(type==='trip'?'✈️':'🎡','').trim();
  openGallery(type,m[1],title);
},true);
})();