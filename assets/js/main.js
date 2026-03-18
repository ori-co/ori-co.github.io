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

function toggleLang() {
  const current = localStorage.getItem('lang') || 'fr';
  localStorage.setItem('lang', current === 'fr' ? 'en' : 'fr');
  location.reload();
}

let _ui = {};

function renderUI(ui) {
  _ui = ui;
  document.documentElement.lang = ui.lang;
  document.getElementById('lang-toggle').textContent = ui.lang === 'fr' ? 'EN' : 'FR';

  ['home', 'portfolio', 'about'].forEach(p => {
    document.getElementById(`nav-label-${p}`).textContent = ui.nav[p];
  });

  document.getElementById('btn-portfolio').textContent = ui.hero.btnPortfolio;
  document.getElementById('btn-contact').textContent   = ui.hero.btnContact;

  document.getElementById('label-offres').textContent = ui.offres.label;
  document.getElementById('title-offres').textContent = ui.offres.title;

  document.getElementById('title-portfolio').textContent = ui.portfolio.title;
  Object.entries(ui.portfolio.filters).forEach(([tag, label]) => {
    const btn = document.getElementById(`fb-${tag}`);
    if (btn) btn.textContent = label;
  });

  document.getElementById('label-name').textContent    = ui.contact.labelName;
  document.getElementById('label-email').textContent   = ui.contact.labelEmail;
  document.getElementById('label-mission').textContent = ui.contact.labelMission;
  document.getElementById('label-message').textContent = ui.contact.labelMessage;
  document.getElementById('input-name').placeholder    = ui.contact.placeholderName;
  document.getElementById('textarea-msg').placeholder  = ui.contact.placeholderMsg;
  document.getElementById('btn-send').textContent      = ui.contact.btnSend;

  document.getElementById('label-stack').textContent      = ui.about.labelStack;
  document.getElementById('label-experience').textContent = ui.about.labelExperience;
  document.getElementById('label-perso').textContent      = ui.about.labelPerso;
}

function renderProfile(p) {
  document.title = p.name;
  document.getElementById('nav-logo').textContent = p.initials;
  ['hero-name','about-name','port-name'].forEach(id => {
    document.getElementById(id).textContent = "// " + p.name;
  });

  document.getElementById('hero-tag').textContent = p.role;
  document.getElementById('hero-title').innerHTML = p.hero.titleHtml;
  document.getElementById('hero-sub').textContent = p.hero.sub;

  document.getElementById('contact-title').textContent = p.contact.title;
  document.getElementById('contact-text').textContent = p.contact.text;
  document.getElementById('contact-linkedin').href = p.linkedin;
  document.getElementById('mission-select').innerHTML =
    '<option>— Sélectionner —</option>' +
    p.contact.missionTypes.map(t => `<option>${t}</option>`).join('');

  const form = document.querySelector('.cform');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.btn-send');
    const data = {
      name:    document.getElementById('input-name').value,
      email:   form.querySelector('input[type="email"]').value,
      mission: form.querySelector('select').value,
      message: document.getElementById('textarea-msg').value,
    };
    btn.textContent = '…';
    btn.disabled = true;
    try {
      const res = await fetch(`https://formspree.io/f/${p.formspreeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        btn.textContent = _ui.lang === 'en' ? 'Sent ✓' : 'Message envoyé ✓';
        btn.style.background = 'var(--cyan)';
        form.reset();
      } else {
        throw new Error();
      }
    } catch {
      btn.textContent = _ui.lang === 'en' ? 'Error — retry' : 'Erreur — réessayer';
      btn.style.background = 'var(--ocre)';
      btn.disabled = false;
    }
  });

  document.getElementById('about-hero-title').innerHTML = p.about.heroTitleHtml;
  document.getElementById('about-hero-sub').innerHTML = p.about.bio.map(t => `<p>${t}</p>`).join('');
  document.getElementById('about-timeline').innerHTML =
    `<div class="timeline">${p.about.timeline.map(t => `
      <div class="tl-item${t.current ? ' tl-current' : ''}${t.edu ? ' tl-edu' : ''}">
        <span class="tl-year">${t.period}</span>
        <div class="tl-body">
          <span class="tl-title">${t.title}</span>
          <span class="tl-detail">${t.detail}</span>
        </div>
      </div>`).join('')}</div>`;

  ['home', 'portfolio', 'about'].forEach(page => {
    document.getElementById(`footer-copy-${page}`).textContent = p.copyright;
    document.getElementById(`footer-role-${page}`).textContent = p.role;
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
  document.getElementById('skills').innerHTML = skills.map(cat => `
    <div class="skill-cat">
      <p class="skill-cat-label" style="color:var(--${cat.color})">${cat.category}</p>
      <div class="tech-tags">${cat.items.map(i => `<span class="tech-tag">${i}</span>`).join('')}</div>
    </div>`).join('');
}
// Version avec niveau (dots) — conservée pour référence
// function renderSkills(skills) {
//   document.getElementById('skills').innerHTML = skills.map(s => {
//     const dots = Array.from({ length: 5 }, (_, i) =>
//       `<div class="dot${i < s.level ? ' on' + (s.color === 'violet' ? '2' : '') : ''}"></div>`
//     ).join('');
//     return `<div class="ski"><span class="ski-n">${s.name}</span><div class="dots">${dots}</div></div>`;
//   }).join('');
// }

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

let _projects = [];

function renderProjects(projects) {
  _projects = projects;
  document.getElementById('pgrid').innerHTML = projects.map(p => {
    const labels = p.labels.map(l =>
      l.color
        ? `<span class="ptag" style="color:var(--${l.color});border-color:var(--${l.color});">${l.text}</span>`
        : `<span class="ptag">${l.text}</span>`
    ).join('');
    const studyBadge = p.study ? '<span class="study-b">★ étude</span>' : '';
    return `<div class="ptile${p.wip ? ' ptile-wip' : ''}" data-tags="${p.filterTags.join(',')}"${p.wip ? ' style="cursor:default;opacity:0.55;"' : ` onclick="openProject('${p.id}')"`}>
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

let _lbImages = [], _lbIndex = 0;

function openProject(id) {
  const p = _projects.find(x => x.id === id);
  if (!p) return;

  const firstColored = p.labels.find(l => l.color);
  const accent = firstColored ? `var(--${firstColored.color})` : 'var(--cyan)';
  document.querySelector('.pmodal').style.borderTop = `3px solid ${accent}`;

  document.getElementById('pmodal-year').textContent = p.year;
  document.getElementById('pmodal-name').textContent = p.name;

  const labels = p.labels.map(l =>
    l.color
      ? `<span class="ptag" style="color:var(--${l.color});border-color:var(--${l.color});">${l.text}</span>`
      : `<span class="ptag">${l.text}</span>`
  ).join('');
  const studyBadge = p.study ? '<span class="study-b" style="position:static;display:inline-block;margin-left:0.5rem;">★ étude</span>' : '';
  document.getElementById('pmodal-tags').innerHTML = labels + studyBadge;

  const images = (p.gallery && p.gallery.length) ? p.gallery : [p.img];
  _lbImages = images;
  document.getElementById('pmodal-gallery').innerHTML = images.map((src, i) =>
    `<img src="${src}" alt="" class="gallery-img" onclick="openLightbox(${i})" onerror="this.style.display='none'">`
  ).join('');

  const videoEl = document.getElementById('pmodal-video');
  if (p.video) {
    videoEl.innerHTML = `<video controls preload="metadata"><source src="${p.video}" type="video/mp4"></video>`;
  } else { videoEl.innerHTML = ''; }

  document.getElementById('pmodal-desc').innerHTML = p.fullDesc || `<p>${p.desc}</p>`;

  const techEl = document.getElementById('pmodal-tech');
  if (p.tech && p.tech.length) {
    techEl.innerHTML = `<p class="pmodal-section-label">${_ui.modal.stack}</p><div class="tech-tags">${p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>`;
    techEl.style.display = '';
  } else { techEl.style.display = 'none'; }

  const linksEl = document.getElementById('pmodal-links');
  if (p.links && p.links.length) {
    const icons = { web: '↗', youtube: '▶', github: '⌥' };
    linksEl.innerHTML = `<p class="pmodal-section-label" style="margin-top:1.5rem;">${_ui.modal.liens}</p><div class="pmodal-links-list">${
      p.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="plink plink-${l.type || 'web'}">${icons[l.type] || '↗'} ${l.label}</a>`).join('')
    }</div>`;
    linksEl.style.display = '';
  } else { linksEl.style.display = 'none'; }

  document.getElementById('proj-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProjModal() {
  document.getElementById('proj-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function openLightbox(index) {
  _lbIndex = index;
  document.getElementById('lb-img').src = _lbImages[index];
  document.getElementById('lightbox').classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

function lbNav(dir) {
  _lbIndex = (_lbIndex + dir + _lbImages.length) % _lbImages.length;
  document.getElementById('lb-img').src = _lbImages[_lbIndex];
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('lightbox').classList.contains('open')) closeLightbox();
    else closeProjModal();
  }
  if (document.getElementById('lightbox').classList.contains('open')) {
    if (e.key === 'ArrowLeft') lbNav(-1);
    if (e.key === 'ArrowRight') lbNav(1);
  }
});

const load = path => fetch(path).then(r => r.json());
const lang = localStorage.getItem('lang') || 'fr';
const suffix = lang === 'en' ? '-en' : '';

Promise.all([
  load(`assets/data/profile${suffix}.json`),
  load(`assets/data/offres${suffix}.json`),
  load('assets/data/projects.json'),
  load(`assets/data/ui${suffix}.json`),
]).then(([profile, offres, projects, ui]) => {
  renderUI(ui);
  renderProfile(profile);
  renderOffres(offres);
  renderProjects(projects);
  renderSkills(profile.about.skills);
  renderValues(profile.about.values);
  renderMaker(profile.about.maker);
}).catch(err => console.error('Erreur chargement données:', err));
