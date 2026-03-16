function showPage(n) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.getElementById('page-' + n).classList.add('active');
  document.getElementById('nav-' + n).classList.add('active');
  window.scrollTo(0, 0);
}

function fp(tag, btn) {
  document.querySelectorAll('.fb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.ptile').forEach(t => {
    if (tag === 'all') {
      t.style.display = 'block';
    } else {
      const tags = t.dataset.tags ? t.dataset.tags.split(',') : [];
      t.style.display = tags.includes(tag) ? 'block' : 'none';
    }
  });
}

function renderOffres(offres) {
  document.getElementById('offres').innerHTML = offres.map(o => `
    <div class="offre" style="border-top:2px solid var(--${o.color});">
      <p class="offre-n" style="color:var(--${o.color});">${o.num}</p>
      <h3 class="offre-title" style="color:var(--${o.color});">${o.title}</h3>
      <p class="offre-desc">${o.desc}</p>
      <div class="offre-tags">
        ${o.tags.map(t => `<span class="otag" style="color:var(--${o.color});border-color:var(--${o.color});">${t}</span>`).join('')}
      </div>
      <div class="offre-bar bar-${o.color}"></div>
    </div>`).join('');
}

function renderSkills(skills) {
  document.getElementById('skills').innerHTML = skills.map(s => {
    const dots = Array.from({ length: 5 }, (_, i) =>
      `<div class="dot${i < s.level ? ' on' + (s.color === 'violet' ? '2' : '') : ''}"></div>`
    ).join('');
    return `<div class="ski"><span class="ski-n">${s.name}</span><div class="dots">${dots}</div></div>`;
  }).join('');
}

function renderValues(values) {
  document.getElementById('val-cards').innerHTML = values.map(v => `
    <div class="val-card ${v.variant}">
      <h4>${v.title}</h4>
      <p>${v.desc}</p>
    </div>`).join('');
}

function renderMaker(tiles) {
  document.getElementById('mgrid').innerHTML = tiles.map(t => `
    <div class="mtile">
      <img src="${t.img}" alt="${t.label}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
      <img src="${t.svg}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.6;" onerror="this.style.display='none'">
      <span class="mlabel">${t.label}</span>
    </div>`).join('');
}

function renderProjects(projects) {
  document.getElementById('pgrid').innerHTML = projects.map(p => {
    const labels = p.labels.map(l =>
      l.color
        ? `<span class="ptag" style="color:var(--${l.color});border-color:var(--${l.color});">${l.text}</span>`
        : `<span class="ptag">${l.text}</span>`
    ).join('');
    const studyBadge = p.study ? '<span class="study-b">★ étude</span>' : '';
    return `<div class="ptile" data-tags="${p.filterTags.join(',')}">
      <div class="ptile-vis" style="position:relative;">
        <img src="${p.img}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">
        <img src="${p.svg}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">
        ${studyBadge}
      </div>
      <div class="ptile-body">
        <p class="ptile-year">${p.year}</p>
        <h3 class="ptile-name">${p.name}</h3>
        <p class="ptile-desc">${p.desc}</p>
        <div class="ptile-tags">${labels}</div>
      </div>
    </div>`;
  }).join('');
}

const load = path => fetch(path).then(r => r.json());

Promise.all([
  load('assets/data/offres.json'),
  load('assets/data/projects.json'),
  load('assets/data/skills.json'),
  load('assets/data/values.json'),
  load('assets/data/maker.json'),
]).then(([offres, projects, skills, values, maker]) => {
  renderOffres(offres);
  renderProjects(projects);
  renderSkills(skills);
  renderValues(values);
  renderMaker(maker);
}).catch(err => console.error('Erreur chargement données:', err));
