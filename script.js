/* Respiro Urbano — app de página única (JS puro + LocalStorage). DADOS 100% FICTÍCIOS. */
'use strict';
const $ = s => document.querySelector(s);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const RES = {agua:'Água potável',banheiro:'Banheiros',descanso:'Descanso',sombra:'Sombra',acessivel:'Acessibilidade',silencio:'Espaço silencioso'};
const ICO = {agua:'💧',banheiro:'🚻',descanso:'🪑',sombra:'🌳',acessivel:'♿',silencio:'🤫'};
const CATS = ['Praça','Parque','Centro comunitário','Espaço de descanso','Ponto de apoio'];
const STATUS = ['Recebido','Em análise','Resolvido'];

/* ---------- Dados demonstrativos (fictícios) ---------- */
const mk = (id,nome,cat,rec,lat,lng,hor,acc,desc,r) => ({id,nome,cat,rec,lat,lng,hor,acc,desc,demo:true,end:'Endereço fictício nº '+id.slice(1)+' (demonstrativo)',ratings:r.map((s,i)=>({u:['Ana','Beto','Carla','Davi'][i%4],s,t:['Lugar tranquilo (comentário fictício).','Bom para descansar (comentário fictício).','Poderia ter mais sombra (comentário fictício).','Gostei muito (comentário fictício).'][i%4]}))});
const DEMO = [
 mk('d1','Praça Fictícia das Acácias','Praça',['agua','descanso','sombra','acessivel'],-23.5505,-46.6333,'06h–22h (fictício)','Rampas e piso tátil (fictício)','Praça arborizada com bancos e bebedouro, criada para demonstração.',[5,4,5]),
 mk('d2','Parque Demonstrativo Vale Verde','Parque',['agua','banheiro','sombra','descanso','acessivel'],-23.5570,-46.6420,'05h–20h (fictício)','Banheiro adaptado (fictício)','Parque amplo com trilhas curtas e áreas de sombra. Local inventado.',[5,5,4,4]),
 mk('d3','Centro Comunitário Exemplo Luz','Centro comunitário',['agua','banheiro','acessivel','silencio'],-23.5440,-46.6250,'08h–17h (fictício)','Entrada sem degraus (fictício)','Centro de apoio comunitário fictício com sala silenciosa.',[4,4]),
 mk('d4','Espaço de Descanso Modelo Ipê','Espaço de descanso',['descanso','sombra','silencio'],-23.5600,-46.6300,'24h (fictício)','Bancos com encosto (fictício)','Recanto sombreado para pausas rápidas. Dado demonstrativo.',[4,5,3]),
 mk('d5','Ponto de Apoio Fictício Entregador','Ponto de apoio',['agua','banheiro','descanso'],-23.5480,-46.6380,'07h–21h (fictício)','Rampa de acesso (fictício)','Ponto pensado para trabalhadores externos. Inventado para o protótipo.',[4,3]),
 mk('d6','Praça Imaginária do Sol Poente','Praça',['descanso','sombra','acessivel'],-23.5530,-46.6200,'Sempre aberta (fictício)','Calçada rebaixada (fictício)','Praça com árvores de grande porte, exemplo ilustrativo.',[3,4]),
 mk('d7','Parque Protótipo Águas Claras','Parque',['agua','sombra','silencio','descanso'],-23.5650,-46.6450,'06h–19h (fictício)','Trilha plana (fictício)','Parque com lago artificial inventado e áreas de leitura silenciosa.',[5,4,5]),
 mk('d8','Centro Comunitário Teste Esperança','Centro comunitário',['banheiro','agua','acessivel','descanso'],-23.5410,-46.6350,'09h–18h (fictício)','Banheiro e elevador (fictício)','Centro comunitário fictício com atendimento de apoio.',[4,5])
];
const SEED_REPORTS = [
 {id:1,local:'d1',tipo:'Bebedouro quebrado',desc:'Exemplo fictício de relato.',data:'2026-10-20',status:2,demo:true},
 {id:2,local:'d5',tipo:'Rampa obstruída',desc:'Exemplo fictício de relato.',data:'2026-10-28',status:1,demo:true}
];

/* ---------- Estado persistente ---------- */
const KEY = 'respiroUrbano.v1';
const initState = () => ({user:null,mine:[],rat:{},fav:[],rep:SEED_REPORTS,act:[],cfg:{big:0,hc:0}});
let S;
try { S = Object.assign(initState(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { S = initState(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('Não foi possível salvar (armazenamento cheio).', 1); } };
const log = t => { S.act.unshift({t, d:new Date().toLocaleString('pt-BR')}); S.act = S.act.slice(0,30); };

/* ---------- Utilitários ---------- */
const all = () => [...DEMO, ...S.mine];
const find = id => all().find(s => s.id === id);
const ratingsOf = s => [...(s.ratings||[]), ...(S.rat[s.id]||[])];
const avg = s => { const r = ratingsOf(s); return r.length ? r.reduce((a,b)=>a+b.s,0)/r.length : 0; };
const stars = n => n ? '★'.repeat(Math.round(n)) + '☆'.repeat(5-Math.round(n)) + ' ' + n.toFixed(1) : 'Sem avaliações';
/* Índice de acolhimento (demonstrativo): 60% recursos + 40% avaliação média */
const acolh = s => Math.round(s.rec.length/6*60 + avg(s)/5*40);
function toast(msg, err){ const t=$('#toast'); t.textContent=msg; t.className='show'+(err?' err':''); clearTimeout(toast.h); toast.h=setTimeout(()=>t.className='',3200); }
const tags = rec => rec.map(r=>`<span class="tag">${ICO[r]} ${RES[r]}</span>`).join('');
const demoNote = '<p class="box warn">⚠️ Dados de demonstração: locais, endereços, coordenadas, horários e comentários são fictícios e não representam serviços reais.</p>';

/* ---------- Componentes ---------- */
function card(s){
  const fav = S.fav.includes(s.id);
  const img = s.foto ? `style="background-image:url('${s.foto}')"` : '';
  return `<article class="card"><div class="img" ${img} role="img" aria-label="Imagem ilustrativa de ${esc(s.cat)}">${s.foto?'':ICO[s.rec[0]]||'🌿'}</div>
  <h3>${esc(s.nome)}</h3><p><span class="tag">${esc(s.cat)}</span>${s.demo?'<span class="tag">Fictício</span>':'<span class="tag">Pendente de verificação</span>'}</p>
  <p>${tags(s.rec)}</p><p class="star" aria-label="Avaliação ${avg(s).toFixed(1)} de 5">${stars(avg(s))}</p>
  <p><small>♿ ${esc(s.acc)} · Índice de acolhimento: <b>${acolh(s)}/100</b></small></p>
  <div class="row"><button class="pri" data-act="open" data-id="${s.id}">Ver detalhes</button>
  <button data-act="fav" data-id="${s.id}" aria-pressed="${fav}" aria-label="${fav?'Remover de':'Adicionar aos'} favoritos: ${esc(s.nome)}">${fav?'♥ Favorito':'♡ Favoritar'}</button></div></article>`;
}
function openDlg(html){ const d=$('#dlg'); d.innerHTML=html; if(!d.open) d.showModal(); }
const closeBtn = '<button data-act="close" class="icon" style="float:right" aria-label="Fechar janela">✕</button>';

function detail(id){
  const s = find(id); if(!s) return;
  openDlg(`${closeBtn}<h2 id="dlg-t">${esc(s.nome)}</h2>
  <div class="card" style="box-shadow:none"><div class="img" role="img" aria-label="Fotografia ilustrativa">${ICO[s.rec[0]]}</div></div>
  <p>${esc(s.desc)}</p><p>${tags(s.rec)}</p>
  <ul class="clean"><li>📍 ${esc(s.end)}</li><li>🕒 Horário informado: ${esc(s.hor)}</li><li>♿ ${esc(s.acc)}</li><li>🌿 Índice de acolhimento: <b>${acolh(s)}/100</b> (demonstrativo)</li><li class="star">${stars(avg(s))}</li></ul>
  ${s.demo?'<p class="box warn">Dados fictícios para demonstração.</p>':'<p class="box warn">Cadastro comunitário pendente de verificação.</p>'}
  <h3>Comentários</h3><ul class="clean">${ratingsOf(s).map(r=>`<li><b>${esc(r.u)}</b> <span class="star">${'★'.repeat(r.s)}</span><br>${esc(r.t)}</li>`).join('')||'<li>Ainda sem comentários.</li>'}</ul>
  <form data-form="rate" data-id="${s.id}"><label for="rs">Sua avaliação</label><select id="rs">${[5,4,3,2,1].map(n=>`<option value="${n}">${n} estrela${n>1?'s':''}</option>`).join('')}</select>
  <label for="rt">Comentário</label><textarea id="rt" rows="2" required></textarea><div class="row" style="margin-top:10px">
  <button class="pri">Avaliar</button>
  <button type="button" data-act="fav" data-id="${s.id}">♡ Favoritar</button>
  <button type="button" data-act="report" data-id="${s.id}">⚠ Reportar problema</button></div></form>`);
}

/* ---------- Telas ---------- */
let F = {q:'', cat:'', sort:'', fav:false};
const VIEWS = {
 inicio(){
   const n = all(), recs = [...n].sort((a,b)=>acolh(b)-acolh(a)).slice(0,3);
   return `<section class="hero"><div><h1>A cidade também precisa cuidar de quem vive nela.</h1>
   <p>Encontre água, banheiros, sombra, bancos e espaços acessíveis durante seus deslocamentos — e ajude a comunidade a mapear o que falta.</p>
   <form class="search" data-form="home-search" role="search"><label for="hq" class="sr" style="position:absolute;left:-999px">Buscar espaços</label>
   <input id="hq" type="search" placeholder="Ex.: sombra, banheiro, silencioso..."><button class="pri" style="background:#10a56b;border-color:#10a56b">Buscar</button>
   <a class="btn" href="#/mapa" style="background:#fff">Explorar mapa</a></form>
   <div class="stats"><div class="stat"><b>${n.length}</b>espaços cadastrados</div><div class="stat"><b>${n.reduce((a,s)=>a+ratingsOf(s).length,0)}</b>avaliações</div><div class="stat"><b>${S.mine.length+S.rep.length}</b>contribuições</div></div></div></section>
   <section>${demoNote}<h2>Como funciona</h2><div class="grid">
   <div class="box"><h3>1. Busque</h3>Pesquise por nome ou pelo recurso que você precisa.</div>
   <div class="box"><h3>2. Descubra</h3>Veja no mapa e no catálogo, com avaliações e acessibilidade.</div>
   <div class="box"><h3>3. Contribua</h3>Cadastre locais, avalie e reporte problemas.</div></div></section>
   <section><h2>Categorias de espaços</h2><div class="row">${CATS.map(c=>`<a class="btn" href="#/catalogo" data-cat="${c}">${c}</a>`).join('')}</div></section>
   <section><h2>Espaços recomendados</h2><div class="grid">${recs.map(card).join('')}</div></section>
   <section><h2>Impacto social</h2><p>Mais informação reduz o esforço de quem precisa de apoio no trajeto: idosos, pessoas com deficiência, gestantes, entregadores e trabalhadores externos.</p></section>`;
 },
 painel(){
   const n = all(), nome = S.user ? S.user.nome : 'visitante';
   return `<section><h1>Olá, ${esc(nome)}!</h1>${demoNote}
   <div class="grid"><div class="box stat"><b>${n.length}</b>espaços disponíveis</div><div class="box stat"><b>${n.reduce((a,s)=>a+ratingsOf(s).length,0)}</b>avaliações</div><div class="box stat"><b>${S.mine.length+S.rep.filter(r=>!r.demo).length}</b>suas contribuições</div></div>
   <h2>Atalhos</h2><div class="row"><a class="btn pri" href="#/contribuir">Cadastrar espaço</a><a class="btn" href="#/relatos">Reportar problema</a><a class="btn" href="#/mapa">Abrir mapa</a><a class="btn" href="#/favoritos">Favoritos</a></div>
   <h2>Últimos espaços adicionados</h2><div class="grid">${n.slice(-3).reverse().map(card).join('')}</div>
   <h2>Atividades recentes</h2>${actList()}
   <h2>Painel de impacto</h2><div class="box">Relatos resolvidos: <b>${S.rep.filter(r=>r.status===2).length}</b> de ${S.rep.length} · Locais pendentes de verificação: <b>${S.mine.length}</b></div></section>`;
 },
 mapa(){
   return `<section><h1>Mapa interativo</h1>${demoNote}<div class="filters" role="group" aria-label="Filtros do mapa">${Object.keys(RES).map(k=>`<label><input type="checkbox" data-mf="${k}"> ${ICO[k]} ${RES[k]}</label>`).join('')}</div>
   <div id="map" role="region" aria-label="Mapa com pontos de apoio fictícios"></div><div id="maplist" class="grid"></div></section>`;
 },
 catalogo(){
   return `<section><h1>Catálogo de espaços</h1>
   <form class="search" data-form="cat-filter" role="search"><label for="cq" style="position:absolute;left:-999px">Buscar</label><input id="cq" type="search" value="${esc(F.q)}" placeholder="Nome ou recurso (ex.: sombra)">
   <select id="cc" aria-label="Categoria"><option value="">Todas as categorias</option>${CATS.map(c=>`<option ${F.cat===c?'selected':''}>${c}</option>`).join('')}</select>
   <select id="cs" aria-label="Ordenação"><option value="">Ordenar: padrão</option><option value="a" ${F.sort?'selected':''}>Melhor avaliação</option></select><button class="pri">Filtrar</button></form>
   <div id="cat-list" class="grid"></div></section>`;
 },
 favoritos(){
   const l = all().filter(s=>S.fav.includes(s.id));
   return `<section><h1>Favoritos</h1>${l.length?`<div class="grid">${l.map(card).join('')}</div>`:'<div class="empty">♡ Você ainda não favoritou nenhum espaço.<br><a href="#/catalogo">Explorar catálogo</a></div>'}</section>`;
 },
 contribuir(){
   return `<section><h1>Contribuir com a comunidade</h1><p class="box warn">Novos cadastros ficam <b>pendentes de verificação</b> até serem revisados.</p>
   <form class="box" data-form="add"><label for="n">Nome do local</label><input id="n" required maxlength="80">
   <label for="c">Categoria</label><select id="c">${CATS.map(c=>`<option>${c}</option>`).join('')}</select>
   <label for="e">Endereço</label><input id="e" required><label for="d">Descrição</label><textarea id="d" rows="3" required></textarea>
   <fieldset><legend>Recursos disponíveis</legend>${Object.keys(RES).map(k=>`<label style="font-weight:400;display:inline-block;margin-right:12px"><input type="checkbox" name="rec" value="${k}"> ${RES[k]}</label>`).join('')}</fieldset>
   <label for="h">Horário de funcionamento</label><input id="h" required><label for="a">Informações de acessibilidade</label><input id="a" required>
   <label for="f">Fotografia (opcional, até 200 KB)</label><input id="f" type="file" accept="image/*"><p><button class="pri">Cadastrar espaço</button></p></form></section>`;
 },
 relatos(){
   const opts = all().map(s=>`<option value="${s.id}" ${VIEWS._pre===s.id?'selected':''}>${esc(s.nome)}</option>`).join('');
   return `<section><h1>Reportar problemas</h1><p class="box warn">Relatos são comunitários e <b>não representam protocolos oficiais da prefeitura</b>.</p>
   <form class="box" data-form="report"><label for="rl">Local relacionado</label><select id="rl">${opts}</select>
   <label for="rp">Tipo de problema</label><select id="rp">${['Bebedouro quebrado','Rampa obstruída','Banheiro fechado','Banco danificado','Falta de iluminação','Local inacessível'].map(t=>`<option>${t}</option>`).join('')}</select>
   <label for="rd">Descrição</label><textarea id="rd" rows="3" required></textarea><label for="rdt">Data</label><input id="rdt" type="date" required value="${new Date().toISOString().slice(0,10)}">
   <p><button class="pri">Enviar relato</button></p></form>
   <h2>Histórico de melhorias</h2>${S.rep.length?`<ul class="clean">${S.rep.map((r,i)=>`<li><b>${esc(r.tipo)}</b> — ${esc((find(r.local)||{}).nome||'Local removido')}<br><small>${esc(r.data)} · ${esc(r.desc)}${r.demo?' (fictício)':''}</small><br><span class="tag">${STATUS[r.status]}</span>
   ${r.status<2?`<button data-act="next" data-i="${i}">Simular próximo status</button>`:''}</li>`).join('')}</ul>`:'<div class="empty">Nenhum relato ainda.</div>'}</section>`;
 },
 perfil(){
   if(!S.user) return `<section><h1>Entrar ou cadastrar</h1><p class="box warn">Autenticação <b>apenas demonstrativa</b>, sem segurança de produção. Senhas não são armazenadas.</p>
   <form class="box" data-form="login"><label for="un">Nome</label><input id="un" required><label for="ue">E-mail (demonstrativo)</label><input id="ue" type="email" required>
   <label for="up">Senha (não será salva)</label><input id="up" type="password" required minlength="4"><p><button class="pri">Entrar / Cadastrar</button></p></form></section>`;
   const u = S.user, fav = all().filter(s=>S.fav.includes(s.id));
   return `<section><h1><span aria-hidden="true">🧑</span> ${esc(u.nome)}</h1><p>${esc(u.email)}</p>
   <div class="grid"><div class="box stat"><b>${S.mine.length+S.rep.filter(r=>!r.demo).length}</b>contribuições</div><div class="box stat"><b>${fav.length}</b>favoritos</div></div>
   <h2>Seus espaços cadastrados</h2>${S.mine.length?`<ul class="clean">${S.mine.map(s=>`<li>${esc(s.nome)} <button class="danger" data-act="del" data-id="${s.id}">Excluir</button></li>`).join('')}</ul>`:'<div class="empty">Você ainda não cadastrou espaços.</div>'}
   <h2>Histórico de atividades</h2>${actList()}
   <div class="row" style="margin-top:16px"><button data-act="logout">Sair</button><button class="danger" data-act="reset">Apagar todos os dados locais</button></div></section>`;
 },
 sobre(){
   return `<section><h1>Sobre o projeto</h1><div class="box"><h3>Problema identificado</h3>Informações sobre infraestrutura de acolhimento urbano são fragmentadas, dificultando que cidadãos encontrem espaços adequados às suas necessidades durante os deslocamentos.
   <h3>Solução proposta</h3>Uma plataforma digital colaborativa para centralizar informações sobre espaços públicos e recursos de apoio urbano.
   <h3>Público-alvo</h3>Idosos, pessoas com deficiência, pessoas com mobilidade reduzida, trabalhadores externos, entregadores, gestantes e cidadãos em geral.
   <h3>Objetivos sociais</h3>Inclusão digital, acessibilidade, cidadania, sustentabilidade urbana, responsabilidade social e inovação social.</div>${demoNote}</section>`;
 }
};
function actList(){ return S.act.length?`<ul class="clean">${S.act.slice(0,6).map(a=>`<li>${esc(a.t)}<br><small>${esc(a.d)}</small></li>`).join('')}</ul>`:'<div class="empty">Nenhuma atividade ainda.</div>'; }

/* ---------- Lógica de listas ---------- */
function drawCatalog(){
  const q = F.q.toLowerCase();
  let l = all().filter(s => (!F.cat||s.cat===F.cat) && (!q || (s.nome+' '+s.desc+' '+s.rec.map(r=>RES[r]).join(' ')).toLowerCase().includes(q)));
  if(F.sort) l.sort((a,b)=>avg(b)-avg(a));
  $('#cat-list').innerHTML = l.length ? l.map(card).join('') : '<div class="empty" style="grid-column:1/-1">🔍 Nenhum espaço encontrado. Tente outro termo.</div>';
}
let map, layer;
function drawMap(){
  const on = [...document.querySelectorAll('[data-mf]:checked')].map(c=>c.dataset.mf);
  const l = all().filter(s => on.every(k=>s.rec.includes(k)));
  $('#maplist').innerHTML = (window.L ? '' : '<p class="box warn">Mapa indisponível; exibindo lista alternativa.</p>') + (l.length ? l.map(card).join('') : '<div class="empty">Nenhum espaço com esses filtros.</div>');
  if(!window.L) return;
  if(!map){ map = L.map('map').setView([-23.552,-46.633],13); L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map); layer = L.layerGroup().addTo(map); }
  layer.clearLayers();
  l.forEach(s => L.marker([s.lat||-23.552,s.lng||-46.633]).addTo(layer).bindPopup(`<b>${esc(s.nome)}</b><br>${esc(s.end)}<br>${s.rec.map(r=>RES[r]).join(', ')}<br>${stars(avg(s))}<br>${esc(s.hor)}<br><i>Dado fictício</i><br><button onclick="detail('${s.id}')">Ver detalhes</button>`));
}

/* ---------- Roteamento ---------- */
function route(){
  const v = (location.hash.replace('#/','')||'inicio'); const name = VIEWS[v] ? v : 'inicio';
  if(map){ map.remove(); map = null; }
  $('#app').innerHTML = VIEWS[name]();
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href')==='#/'+(name==='inicio'?'':name)));
  $('nav').classList.remove('open'); $('.menu-btn').setAttribute('aria-expanded','false');
  if(name==='catalogo') drawCatalog(); if(name==='mapa') drawMap();
  window.scrollTo(0,0); $('#app').focus();
}
window.addEventListener('hashchange', route);

/* ---------- Eventos (delegação) ---------- */
document.addEventListener('click', e => {
  const c = e.target.closest('[data-cat]'); if(c){ F.cat = c.dataset.cat; }
  const b = e.target.closest('[data-act]'); if(!b) return;
  const {act,id,i} = b.dataset;
  if(act==='menu'){ const o=$('nav').classList.toggle('open'); b.setAttribute('aria-expanded',o); }
  if(act==='big'){ S.cfg.big^=1; applyCfg(); save(); }
  if(act==='hc'){ S.cfg.hc^=1; applyCfg(); save(); }
  if(act==='close') $('#dlg').close();
  if(act==='open') detail(id);
  if(act==='fav'){ const k=S.fav.indexOf(id); if(k<0){S.fav.push(id);log('Favoritou '+find(id).nome);toast('Adicionado aos favoritos.');}else{S.fav.splice(k,1);toast('Removido dos favoritos.');} save(); refresh(); }
  if(act==='report'){ VIEWS._pre=id; $('#dlg').close(); location.hash='#/relatos'; route(); }
  if(act==='next'){ S.rep[i].status++; log('Relato mudou para '+STATUS[S.rep[i].status]); save(); route(); }
  if(act==='del' && confirm('Excluir este espaço? Esta ação não pode ser desfeita.')){ S.mine=S.mine.filter(s=>s.id!==id); S.fav=S.fav.filter(f=>f!==id); save(); toast('Espaço excluído.'); route(); }
  if(act==='logout'){ S.user=null; save(); route(); }
  if(act==='reset' && confirm('Apagar TODOS os dados locais? Esta ação não pode ser desfeita.')){ localStorage.removeItem(KEY); S=initState(); applyCfg(); toast('Dados apagados.'); route(); }
});
document.addEventListener('change', e => { if(e.target.matches('[data-mf]')) drawMap(); });
function refresh(){ const v=location.hash.replace('#/',''); if($('#dlg').open) detail($('#dlg form')?.dataset.id); route(); }

document.addEventListener('submit', async e => {
  const f = e.target.closest('form'); if(!f || !f.dataset.form) return; e.preventDefault();
  const kind = f.dataset.form;
  if(kind==='home-search'){ F={q:$('#hq').value,cat:'',sort:'',fav:false}; location.hash='#/catalogo'; }
  if(kind==='cat-filter'){ F.q=$('#cq').value; F.cat=$('#cc').value; F.sort=$('#cs').value; drawCatalog(); }
  if(kind==='rate'){ const id=f.dataset.id; (S.rat[id]=S.rat[id]||[]).push({u:S.user?S.user.nome:'Você',s:+$('#rs').value,t:$('#rt').value.trim()}); log('Avaliou '+find(id).nome); save(); toast('Avaliação registrada!'); detail(id); route(); }
  if(kind==='login'){ S.user={nome:$('#un').value.trim(),email:$('#ue').value.trim()}; log('Entrou na conta demonstrativa'); save(); toast('Bem-vindo(a)!'); route(); }
  if(kind==='report'){ S.rep.unshift({id:Date.now(),local:$('#rl').value,tipo:$('#rp').value,desc:$('#rd').value.trim(),data:$('#rdt').value,status:0}); log('Reportou: '+$('#rp').value); save(); toast('Relato enviado (comunitário, não oficial).'); route(); }
  if(kind==='add'){
    const rec=[...f.querySelectorAll('[name=rec]:checked')].map(c=>c.value);
    if(!rec.length) return toast('Selecione ao menos um recurso.',1);
    let foto=''; const file=$('#f').files[0];
    if(file){ if(file.size>200000) return toast('Imagem acima de 200 KB.',1); foto=await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(file);}); }
    const s={id:'u'+Date.now(),nome:$('#n').value.trim(),cat:$('#c').value,end:$('#e').value.trim(),desc:$('#d').value.trim(),rec,hor:$('#h').value.trim(),acc:$('#a').value.trim(),foto,pend:true,ratings:[]};
    S.mine.push(s); log('Cadastrou '+s.nome); save(); toast('Cadastrado! Pendente de verificação.'); location.hash='#/catalogo'; F={q:'',cat:'',sort:'',fav:false};
  }
});

function applyCfg(){
  document.body.classList.toggle('big',!!S.cfg.big); document.body.classList.toggle('hc',!!S.cfg.hc);
  document.querySelector('[data-act=big]').setAttribute('aria-pressed',!!S.cfg.big); document.querySelector('[data-act=hc]').setAttribute('aria-pressed',!!S.cfg.hc);
}
applyCfg(); route();
