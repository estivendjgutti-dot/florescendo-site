const film = document.querySelector('.event-case-video');

if (film) {
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
}
