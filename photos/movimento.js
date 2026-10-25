// Motion enhances the existing layout; content never depends on it to be visible.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const running = new Set();
  const revealed = new WeakSet();
  const activeMedia = new Set();
  const header = document.querySelector('.site-header, .c-header');
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  header?.append(progress);

  function animate(element, frames, options) {
    if (preference.matches) return;
    const animation = element.animate(frames, options);
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
  }

  const targets = document.querySelectorAll([
    '.section-head', '.section-intro', '.proof-item', '.card', '.catalog-card',
    '.content-card', '.info-box', '.care-card', '.event-case-media', '.event-case-copy',
    '.garden-comparison > h2', '.garden-comparison > p', '.garden-comparison figure',
    '.garden-transform > div', '.garden-transform > figure', '.rental-gallery',
    '.contact-copy', '.form-card', '.quote-form', '.location-media', '.location-copy',
    '.content-cta', '.partner-band-inner', '.event-preview'
  ].join(','));
  const entrance = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting || target.hidden || !target.getClientRects().length) continue;
      if (!revealed.has(target)) {
        revealed.add(target);
        const siblings = [...target.parentElement.children];
        const stagger = target.matches('.card, .catalog-card, .content-card, .info-box, .care-card, .proof-item')
          ? Math.min(siblings.indexOf(target) % 4, 3) * 65 : 0;
        animate(target, [
          { opacity: 0, transform: 'translateY(26px) scale(.98)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' }
        ], { duration: 680, delay: stagger, easing: 'cubic-bezier(.16,1,.3,1)' });
        const photo = target.matches('.card') ? target.querySelector('.card-media img') : null;
        if (photo) animate(photo, [{ transform: 'scale(1.075)' }, { transform: 'scale(1)' }],
          { duration: 1150, delay: stagger, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
      entrance.unobserve(target);
    }
  }, { threshold: .08, rootMargin: '0px 0px -22px 0px' });
  targets.forEach(target => entrance.observe(target));

  const accents = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    target.classList.toggle('motion-playing', isIntersecting);
  }));
  document.querySelectorAll('.ornament, .rental-gallery-controls').forEach(target => accents.observe(target));

  // Only decorative media moves with scrolling; the hero and video frames stay fixed.
  const mediaObserver = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) activeMedia.add(target);
      else activeMedia.delete(target);
    });
    schedule();
  });
  document.querySelectorAll('.iphone-duo-render, .location-media img').forEach(media => mediaObserver.observe(media));
  let scheduled = false;
  function update() {
    scheduled = false;
    if (preference.matches) return;
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
    activeMedia.forEach(media => {
      const rect = media.getBoundingClientRect();
      const offset = Math.max(-9, Math.min(9, (innerHeight / 2 - rect.top - rect.height / 2) * .025));
      media.style.translate = `0 ${offset}px`;
    });
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  schedule();

  // Tactile feedback also works on touch screens, without relying on hover.
  document.addEventListener('click', event => {
    const target = event.target.closest('button, .btn, .c-button, .text-link');
    if (!target || target.disabled) return;
    animate(target, [{ transform: 'scale(.95)' }, { transform: 'scale(1)' }],
      { duration: 260, easing: 'cubic-bezier(.16,1,.3,1)' });
  });
  document.querySelectorAll('.rental-photo-dialog img').forEach(image => {
    image.addEventListener('load', () => {
      if (image.closest('dialog')?.open) animate(image,
        [{ opacity: .3, transform: 'scale(.98)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: 360, easing: 'ease-out' });
    });
  });
  preference.addEventListener('change', () => {
    if (preference.matches) {
      running.forEach(animation => animation.cancel());
      document.querySelectorAll('.iphone-duo-render, .location-media img').forEach(media => media.style.removeProperty('translate'));
    } else schedule();
  });
})();
