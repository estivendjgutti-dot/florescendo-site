const catalog = document.querySelector('#catalogo');
if (catalog) {
  const cards = [...catalog.querySelectorAll('.catalog-card')];
  const filters = [...catalog.querySelectorAll('[data-filter]')];
  const more = catalog.querySelector('.catalog-more');
  const status = catalog.querySelector('.catalog-status');
  let category = 'Todos', limit = 8;
  function render() {
    const matches = cards.filter(card => category === 'Todos' || card.dataset.category === category);
    cards.forEach(card => {
      const visible = matches.indexOf(card) >= 0 && matches.indexOf(card) < limit;
      card.hidden = !visible;
      if (visible) {
        const img = card.querySelector('img');
        if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }
        if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
      }
    });
    more.hidden = limit >= matches.length;
    status.textContent = `${Math.min(limit, matches.length)} de ${matches.length} opções`;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  }
  filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; limit = 8; render(); }));
  more.addEventListener('click', () => { limit += 8; render(); });
  const dialog = document.querySelector('.catalog-dialog');
  const image = dialog.querySelector('img');
  const toggle = dialog.querySelector('[data-original]');
  let entry, original = false, data;
  async function getData() {
    if (!data) data = fetch('photos/catalogo/items.json').then(response => {
      if (!response.ok) throw new Error('Catálogo indisponível');
      return response.json();
    }).catch(error => { data = undefined; throw error; });
    return data;
  }
  function display() {
    image.src = original ? entry.original : entry.image.replace('-640.', '-960.');
    image.alt = entry.name + (original ? ' — foto original' : ' — catálogo');
    toggle.textContent = original ? 'Ver imagem do catálogo' : 'Ver foto original';
    dialog.querySelector('.catalog-detail-note').textContent = original ? 'Referência original recebida. Consulte o exemplar e o vaso disponíveis.' : `${entry.treatment}. ${entry.note} Consulte disponibilidade, porte e vaso.`;
  }
  catalog.querySelectorAll('[data-detail]').forEach(link => link.addEventListener('click', async event => {
    if (!dialog.showModal) return;
    event.preventDefault();
    try {
      entry = (await getData()).find(item => item.id === Number(link.dataset.detail));
      original = false;
      dialog.querySelector('h3').textContent = `${entry.name} · FC-${String(entry.id).padStart(2, '0')}`;
      dialog.querySelector('a').href = link.closest('article').querySelector('.text-link').href;
      display(); dialog.showModal();
    } catch { window.location.href = link.href; }
  }));
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  toggle.addEventListener('click', () => { original = !original; display(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  render();
}
