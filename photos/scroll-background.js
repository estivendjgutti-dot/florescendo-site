(() => {
  const panel = document.getElementById('scroll-reveal');
  const canvas = document.getElementById('scroll-canvas');
  if (!panel || !canvas) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Preserve the section blush while metadata/frame data is still loading.
  const context = canvas.getContext('2d');
  const video = document.createElement('video');
  let ready = false;
  let progress = 0;
  let drawQueued = false;
  const fps = 24;
  let targetTime = 0;

  function seekLatestFrame() {
    if (!ready || video.seeking || reducedMotion.matches) return;
    if (Math.abs(video.currentTime - targetTime) >= .5 / fps) video.currentTime = targetTime;
  }

  video.muted = true;
  video.playsInline = true;
  video.preload = 'none';

  function draw() {
    if (!ready || video.readyState < 2 || !canvas.width || !canvas.height) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
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
    const headerHeight = document.querySelector('header')?.getBoundingClientRect().height || 80;
    // Complete all 24 fps frames before the panel passes behind the header.
    const entry = viewport * .85;
    const finish = headerHeight + 32;
    // Keep the mobile pacing intact; desktop scroll wheels often travel farther per gesture.
    const desktopPacing = window.innerWidth > 600 ? 1.35 : 1;
    progress = Math.max(0, Math.min(1, (entry - rect.top) / Math.max(1, (entry - finish) * desktopPacing)));
    const reveal = reducedMotion.matches ? 1 : Math.min(1, progress / .18);
    panel.style.setProperty('--inset', `${((1 - reveal) * 50).toFixed(2)}%`);
    panel.style.setProperty('--video-opacity', reveal.toFixed(3));
    if (ready && Number.isFinite(video.duration) && !reducedMotion.matches) {
      const lastFrame = Math.max(0, Math.ceil(video.duration * fps) - 1);
      targetTime = Math.round(progress * lastFrame) / fps;
      seekLatestFrame();
    }
  }

  video.addEventListener('loadedmetadata', () => {
    ready = true;
    resize();
    syncToScroll();
  });
  video.addEventListener('seeked', () => { draw(); seekLatestFrame(); });
  video.addEventListener('loadeddata', queueDraw);
  window.addEventListener('resize', () => { resize(); syncToScroll(); }, { passive: true });
  window.addEventListener('scroll', syncToScroll, { passive: true });
  reducedMotion.addEventListener?.('change', syncToScroll);

  resize();
  syncToScroll();
  const startVideo = () => {
    if (video.getAttribute('src')) return;
    video.src = 'photos/paisagistas-scroll.mp4';
    video.preload = 'auto';
    video.load();
  };
  if ('IntersectionObserver' in window) {
    const loadObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        startVideo();
        loadObserver.disconnect();
      }
    }, { rootMargin: '250px' });
    loadObserver.observe(panel);
  } else startVideo();
})();
