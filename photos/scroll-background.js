(() => {
  const panel = document.getElementById('scroll-reveal');
  const canvas = document.getElementById('scroll-canvas');
  if (!panel || !canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const context = canvas.getContext('2d', { alpha: false });
  const video = document.createElement('video');
  let ready = false;
  let progress = 0;
  let drawQueued = false;

  video.src = 'photos/florescendo-desktop.mp4';
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';

  function draw() {
    if (!ready || !canvas.width || !canvas.height) return;
    const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    const width = video.videoWidth * scale;
    const height = video.videoHeight * scale;
    context.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  }

  function queueDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => {
      drawQueued = false;
      draw();
    });
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(panel.clientWidth * ratio);
    canvas.height = Math.round(panel.clientHeight * ratio);
    queueDraw();
  }

  function syncToScroll() {
    const rect = panel.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    progress = Math.max(0, Math.min(1, (viewport * .82 - rect.top) / (rect.height + viewport * .3)));
    panel.style.setProperty('--inset', `${((1 - progress) * 50).toFixed(2)}%`);
    panel.style.setProperty('--video-opacity', (0.35 + progress * 0.65).toFixed(3));
    if (ready && Number.isFinite(video.duration) && !reducedMotion.matches) {
      const target = Math.min(video.duration - .04, progress * video.duration);
      if (Math.abs(video.currentTime - target) > .035 && !video.seeking) video.currentTime = target;
      queueDraw();
    }
  }

  video.addEventListener('loadedmetadata', () => {
    ready = true;
    resize();
    syncToScroll();
  });
  video.addEventListener('seeked', queueDraw);
  video.addEventListener('loadeddata', queueDraw);
  window.addEventListener('resize', () => { resize(); syncToScroll(); }, { passive: true });
  window.addEventListener('scroll', syncToScroll, { passive: true });
  reducedMotion.addEventListener?.('change', syncToScroll);

  if (reducedMotion.matches) {
    panel.style.setProperty('--inset', '0%');
    panel.style.setProperty('--video-opacity', '1');
    panel.classList.add('motion-reduced');
    return;
  }
  resize();
  syncToScroll();
  video.load();
})();
