(() => {
  const carousel = document.querySelector('.work-carousel');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('.work-slide')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, visible = false, gesture = null;
  const modulo = value => (value + slides.length) % slides.length;
  function render() {
    slides.forEach((slide, position) => {
      const main = position === index;
      slide.classList.toggle('is-main', main);
      slide.classList.toggle('is-prev', position === modulo(index - 1));
      slide.classList.toggle('is-next', position === modulo(index + 1));
      slide.setAttribute('aria-hidden', String(!main));
      const video = slide.querySelector('video');
      if (video) {
        if (main && visible && !reduced.matches) {
          const source = video.querySelector('source[data-src]');
          if (source) { source.src = source.dataset.src; delete source.dataset.src; video.load(); }
          video.play().catch(() => {});
        }
        else video.pause();
      }
    });
    carousel.querySelector('.work-count').textContent = `${index + 1} / ${slides.length}`;
  }
  function move(step) { index = modulo(index + step); render(); }
  carousel.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => move(Number(button.dataset.step))));
  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  const stage = carousel.querySelector('.work-stage');
  stage.querySelectorAll('img').forEach(img => { img.draggable = false; });
  stage.addEventListener('pointerdown', event => {
    gesture = { x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointerup', event => {
    if (!gesture) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => { gesture = null; });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; render(); }, { threshold: .2 }).observe(carousel);
  reduced.addEventListener('change', render);
  render();
})();
