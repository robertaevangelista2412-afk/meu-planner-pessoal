const STORAGE = 'meu-planner-pessoal-v1';
const state = JSON.parse(localStorage.getItem(STORAGE) || '{"events":[],"tasks":[],"people":[],"notes":[]}');
let taskFilter = 'all';

function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); render(); }
function id(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function escapeHtml(v=''){ return String(v).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function fmtDate(date){ if(!date) return ''; return new Intl.DateTimeFormat('pt-BR',{dateStyle:'medium'}).format(new Date(date+'T12:00:00')); }
function setView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===name));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  document.getElementById('pageTitle').textContent = ({dashboard:'Dashboard',agenda:'Agenda',tasks:'Tarefas',people:'Pessoas importantes',notes:'Anotações'})[name];
}
function render(){
  const today = new Date();
  document.getElementById('todayLabel').textContent = new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(today);
  document.getElementById('heroDate').textContent = new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(today);
  const h = today.getHours();
  document.getElementById('greeting').textContent = h<12?'Bom dia!':h<18?'Boa tarde!':'Boa noite!';
  document.getElementById('statEvents').textContent = state.events.length;
  document.getElementById('statTasks').textContent = state.tasks.filter(t=>!t.done).length;
  document.getElementById('statPeople').textContent = state.people.length;
  document.getElementById('statNotes').textContent = state.notes.length;

  const upcoming = [...state.events].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')).slice(0,4);
  document.getElementById('upcomingEvents').innerHTML = upcoming.length ? upcoming.map(eventCard).join('') : '<div class="list-empty">Nenhum compromisso cadastrado.</div>';
  const openTasks = state.tasks.filter(t=>!t.done).slice(0,5);
  document.getElementById('upcomingTasks').innerHTML = openTasks.length ? openTasks.map(taskCard).join('') : '<div class="list-empty">Nenhuma tarefa pendente.</div>';

  document.getElementById('eventList').innerHTML = state.events.length ? [...state.events].sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')).map(eventCard).join('') : empty('Ainda não há compromissos. Clique em “Novo compromisso” para começar.');
  const filtered = state.tasks.filter(t=>taskFilter==='all'||taskFilter==='open'?!t.done:taskFilter==='done'?t.done:true);
  document.getElementById('taskList').innerHTML = filtered.length ? filtered.map(taskCard).join('') : empty('Nenhuma tarefa nesta categoria.');
  document.getElementById('peopleList').innerHTML = state.people.length ? state.people.map(personCard).join('') : empty('Adicione as pessoas importantes para você.');
  document.getElementById('notesList').innerHTML = state.notes.length ? state.notes.map(noteCard).join('') : empty('Nenhuma anotação ainda.');
}
function empty(text){ return '<div class="list-empty">'+escapeHtml(text)+'</div>'; }
function eventCard(e){ return '<article class="content-card"><div><h3>'+escapeHtml(e.title)+'</h3><p>'+escapeHtml(e.details||'')+'</p><div class="meta"><span class="badge">📅 '+fmtDate(e.date)+'</span>'+(e.time?'<span class="badge">◷ '+escapeHtml(e.time)+'</span>':'')+'</div></div>'+actions('event',e.id)+'</article>'; }
function taskCard(t){ return '<article class="content-card"><div><h3 class="task-title '+(t.done?'done':'')+'">'+escapeHtml(t.title)+'</h3><p>'+escapeHtml(t.details||'')+'</p><div class="meta">'+(t.date?'<span class="badge">📌 '+fmtDate(t.date)+'</span>':'')+(t.done?'<span class="badge done">Concluída</span>':'<span class="badge">Pendente</span>')+'</div></div><div class="card-actions"><button class="icon-btn" onclick="toggleTask(\''+t.id+'\')" title="Concluir">'+(t.done?'↶':'✓')+'</button><button class="icon-btn danger" onclick="removeItem(\'task\',\''+t.id+'\')" title="Excluir">🗑</button></div></article>'; }
function personCard(p){ const initials=p.name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase(); return '<article class="person-card"><div class="avatar">'+escapeHtml(initials||'?')+'</div><h3>'+escapeHtml(p.name)+'</h3><p>'+escapeHtml(p.info||'')+'</p><div class="card-actions"><button class="icon-btn danger" onclick="removeItem(\'person\',\''+p.id+'\')">🗑 Excluir</button></div></article>'; }
function noteCard(n){ return '<article class="note-card"><h3>'+escapeHtml(n.title)+'</h3><p>'+escapeHtml(n.text||'')+'</p><div class="card-actions"><button class="icon-btn danger" onclick="removeItem(\'note\',\''+n.id+'\')">🗑 Excluir</button></div></article>'; }
function actions(type,itemId){ return '<div class="card-actions"><button class="icon-btn danger" onclick="removeItem(\''+type+'\',\''+itemId+'\')" title="Excluir">🗑</button></div>'; }

const forms = {
 event:{title:'Novo compromisso',fields:'<label>Compromisso<input name="title" required placeholder="Ex.: Consulta, reunião, aniversário..." /></label><label>Data<input type="date" name="date" required /></label><label>Horário<input type="time" name="time" /></label><label>Detalhes<textarea name="details" placeholder="Observações importantes"></textarea></label>'},
 task:{title:'Nova tarefa',fields:'<label>Tarefa<input name="title" required placeholder="O que você precisa fazer?" /></label><label>Data limite<input type="date" name="date" /></label><label>Detalhes<textarea name="details" placeholder="Informações adicionais"></textarea></label>'},
 person:{title:'Adicionar pessoa importante',fields:'<label>Nome<input name="name" required placeholder="Nome da pessoa" /></label><label>Informações<textarea name="info" placeholder="Telefone, aniversário, observações, detalhes importantes..."></textarea></label>'},
 note:{title:'Nova anotação',fields:'<label>Título<input name="title" required placeholder="Título da anotação" /></label><label>Anotação<textarea name="text" required placeholder="Escreva aqui..."></textarea></label>'}
};
function openModal(type){
 const cfg=forms[type]; document.getElementById('modalTitle').textContent=cfg.title;
 document.getElementById('entryForm').innerHTML='<div class="form-grid">'+cfg.fields+'<div class="form-actions"><button type="button" class="secondary" id="cancelModal">Cancelar</button><button class="primary" type="submit">Salvar</button></div></div>';
 document.getElementById('modal').classList.remove('hidden');
 document.getElementById('entryForm').onsubmit=(ev)=>{ev.preventDefault(); const data=Object.fromEntries(new FormData(ev.target).entries()); data.id=id(); if(type==='task')data.done=false; state[type==='person'?'people':type==='note'?'notes':type==='event'?'events':'tasks'].push(data); closeModal(); save();};
 document.getElementById('cancelModal').onclick=closeModal;
}
function closeModal(){ document.getElementById('modal').classList.add('hidden'); }
window.removeItem=(type,itemId)=>{ const key=type==='event'?'events':type==='task'?'tasks':type==='person'?'people':'notes'; state[key]=state[key].filter(x=>x.id!==itemId); save(); };
window.toggleTask=(itemId)=>{ const t=state.tasks.find(x=>x.id===itemId); if(t){t.done=!t.done;save();} };

document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>setView(b.dataset.go));
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>openModal(b.dataset.add));
document.getElementById('quickAdd').onclick=()=>openModal('task');
document.getElementById('closeModal').onclick=closeModal;
document.getElementById('modal').onclick=(e)=>{if(e.target.id==='modal')closeModal()};
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{taskFilter=b.dataset.filter;document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));render();});
render();