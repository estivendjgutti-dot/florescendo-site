(() => {
  const canvas = document.getElementById('scroll-canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d', { alpha: false });
  const video = document.createElement('video');
  const mobileQuery = window.matchMedia('(max-width: 850px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopSource = 'photos/florescendo-desktop.mp4';
  let wantedProgress = 0;
  let drawQueued = false;
  let seekQueued = false;
  let activeSource = '';

  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    queueDraw();
  }

  function queueDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => {
      drawQueued = false;
      drawFrame();
    });
  }

  function drawFrame() {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !canvas.width || !canvas.height) return;
    const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    const width = video.videoWidth * scale;
    const height = video.videoHeight * scale;
    context.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  }

  function syncSource() {
    // The mobile cut is 29 MB. Mobile visitors get the lightweight hero video instead.
    if (mobileQuery.matches || reducedMotionQuery.matches) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      activeSource = '';
      canvas.hidden = true;
      return;
    }
    canvas.hidden = false;
    const nextSource = desktopSource;
    if (activeSource === nextSource) return;
    activeSource = nextSource;
    context.clearRect(0, 0, canvas.width, canvas.height);
    video.src = nextSource;
    video.load();
    seekQueued = false;
  }

  function seekToProgress() {
    if (video.readyState < HTMLMediaElement.HAVE_METADATA || !Number.isFinite(video.duration)) return;
    const targetTime = Math.min(video.duration - 0.04, Math.max(0, wantedProgress * video.duration));
    if (Math.abs(video.currentTime - targetTime) < 0.04 || video.seeking) return;
    video.currentTime = targetTime;
  }

  function updateFromScroll() {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    wantedProgress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    if (seekQueued) return;
    seekQueued = true;
    requestAnimationFrame(() => {
      seekQueued = false;
      seekToProgress();
      queueDraw();
    });
  }

  video.addEventListener('loadedmetadata', () => { seekToProgress(); queueDraw(); });
  video.addEventListener('seeked', () => { queueDraw(); updateFromScroll(); });
  video.addEventListener('loadeddata', queueDraw);
  video.addEventListener('error', () => { context.clearRect(0, 0, canvas.width, canvas.height); });
  window.addEventListener('resize', () => { resizeCanvas(); syncSource(); updateFromScroll(); }, { passive: true });
  window.addEventListener('scroll', updateFromScroll, { passive: true });
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', syncSource);
  else mobileQuery.addListener(syncSource);
  if (reducedMotionQuery.addEventListener) reducedMotionQuery.addEventListener('change', syncSource);
  else reducedMotionQuery.addListener(syncSource);

  resizeCanvas();
  syncSource();
  updateFromScroll();
})();
