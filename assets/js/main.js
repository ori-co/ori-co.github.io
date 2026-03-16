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

function renderProjects(projects) {
  const grid = document.getElementById('pgrid');
  grid.innerHTML = projects.map(p => {
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

fetch('assets/data/projects.json')
  .then(r => r.json())
  .then(renderProjects)
  .catch(() => console.error('Impossible de charger projects.json'));
