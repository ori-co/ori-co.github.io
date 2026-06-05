# AR Demo — TODO

## En cours
- [x] Camera + tracking sur Galaxy A06
- [x] ImageTarget_faceB + 3 plateformes GLB
- [x] Tap sur disque → enfants visibles (`disc-reveal`)

## À faire (ordre suggéré)

### Expérience AR
- [ ] **Graphique "cherche le marker"** — UI overlay avant détection de l'image target (disparaît quand la carte est reconnue)
- [ ] **Animation d'apparition des plateformes** — expand scale au tap, puis objets dessus qui pop progressivement
- [ ] **CTA HTML** — [Visiter le site] [Se connecter] en overlay HTML
  - Tenter `window.postMessage` depuis 8thwall pour les afficher après les plateformes
  - Fallback : CTA toujours visibles

### Bugs
- [ ] **Flickering de luminosité** sur les plateformes au premier rendu

### Habillage
- [ ] Dark theme, Syne + DM Mono (cohérent avec le site)

## Nice to have
- [ ] Gravité sur les objets 3D mobiles des plateformes
