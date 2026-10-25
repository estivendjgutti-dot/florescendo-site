document.querySelectorAll('.event-case-video, .garden-transform-video').forEach(film => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let visible = false;
  let userPaused = false;
  let observerPaused = false;

  const allowAutoplay = () => !reducedMotion.matches && !connection?.saveData;
  const load = () => {
    const source = film.querySelector('source[data-src]');
    if (!source) return;
    source.src = source.dataset.src;
    delete source.dataset.src;
    film.load();
  };
  const play = () => {
    if (visible && !document.hidden && !userPaused && allowAutoplay()) {
      load();
      film.play().catch(() => {});
    }
  };
  const pause = () => {
    if (!film.paused) {
      observerPaused = true;
      film.pause();
    }
  };

  film.addEventListener('pause', () => {
    if (observerPaused) observerPaused = false;
    else if (visible && !document.hidden) userPaused = true;
  });
  film.addEventListener('play', () => { userPaused = false; });

  if ('IntersectionObserver' in window) {
    const loader = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        load();
        loader.disconnect();
      }
    }, { rootMargin: '300px' });
    loader.observe(film);

    const playback = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.15;
      if (visible) play();
      else pause();
    }, { threshold: [0, 0.15] });
    playback.observe(film);
  } else {
    load();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else play();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) pause();
    else play();
  });
});

const rentalGallery = document.querySelector('.rental-gallery');
if (rentalGallery) {
  const track = rentalGallery.querySelector('.rental-gallery-track');
  const cards = [...track.querySelectorAll('.rental-gallery-card')];
  const links = cards.map(card => card.querySelector('.rental-gallery-image'));
  const status = rentalGallery.querySelector('.rental-gallery-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const leftOf = card => card.offsetLeft - cards[0].offsetLeft;
  let scheduled = false;

  function updateStatus() {
    const visibleCards = cards.map((card, index) => ({ card, index }))
      .filter(({ card }) => leftOf(card) + card.offsetWidth > track.scrollLeft + 4 &&
        leftOf(card) < track.scrollLeft + track.clientWidth - 4);
    if (visibleCards.length) {
      const first = visibleCards[0].index + 1;
      const last = visibleCards.at(-1).index + 1;
      status.textContent = first === last ? `${first} de ${cards.length}` : `${first}–${last} de ${cards.length}`;
    }
  }

  function move(direction) {
    const max = track.scrollWidth - track.clientWidth;
    const current = track.scrollLeft;
    const offsets = cards.map(leftOf);
    let target;
    if (direction > 0) target = current >= max - 4 ? 0 : offsets.find(left => left > current + 4) ?? max;
    else target = current <= 4 ? max : offsets.findLast(left => left < current - 4) ?? 0;
    track.scrollTo({ left: Math.min(target, max), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  rentalGallery.querySelectorAll('[data-gallery-step]').forEach(button => {
    button.addEventListener('click', () => move(Number(button.dataset.galleryStep)));
  });
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  track.addEventListener('scroll', () => {
    if (!scheduled) requestAnimationFrame(() => { updateStatus(); scheduled = false; });
    scheduled = true;
  }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(updateStatus).observe(track);
  else window.addEventListener('resize', updateStatus);
  updateStatus();

  const dialog = document.querySelector('.rental-photo-dialog');
  let selected = 0;
  function displayPhoto(index) {
    selected = (index + links.length) % links.length;
    const link = links[selected];
    const image = dialog.querySelector('img');
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    dialog.querySelector('.rental-photo-caption').textContent = `${link.dataset.context} · ${link.dataset.caption}`;
    dialog.querySelector('.rental-photo-position').textContent = `${selected + 1} / ${links.length}`;
  }
  links.forEach((link, index) => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !dialog.showModal) return;
    event.preventDefault();
    displayPhoto(index);
    dialog.showModal();
  }));
  dialog.querySelector('[data-photo-close]').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-photo-step]').forEach(button => {
    button.addEventListener('click', () => displayPhoto(selected + Number(button.dataset.photoStep)));
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      displayPhoto(selected + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
}
