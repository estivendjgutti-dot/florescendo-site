(() => {
  const canvas = document.getElementById('scroll-canvas');
  if (!canvas) return;

  const context = canvas.getContext('2d', { alpha: false });
  const frameCount = 301;
  const framePath = index => `photos/scroll-frames/frame-${String(index + 1).padStart(4, '0')}.webp`;
  const frames = new Map();
  let wantedFrame = 0;
  let lastDrawnFrame = -1;
  let drawQueued = false;
  let demandQueued = false;

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    drawNearestFrame();
  }

  function loadFrame(index) {
    index = Math.max(0, Math.min(frameCount - 1, index));
    if (frames.has(index)) return frames.get(index).promise;
    const image = new Image();
    const record = { image, loaded: false, promise: null };
    record.promise = new Promise(resolve => {
      image.onload = () => { record.loaded = true; queueDraw(); trimCache(); resolve(); };
      image.onerror = resolve;
    });
    image.decoding = 'async';
    image.src = framePath(index);
    frames.set(index, record);
    return record.promise;
  }

  function trimCache() {
    for (const [index, record] of frames) {
      if (record.loaded && index % 4 !== 0 && Math.abs(index - wantedFrame) > 12) {
        record.image.removeAttribute('src');
        frames.delete(index);
      }
    }
  }

  function queueDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => {
      drawQueued = false;
      drawNearestFrame();
    });
  }

  function queueDemand() {
    if (demandQueued) return;
    demandQueued = true;
    requestAnimationFrame(() => {
      demandQueued = false;
      loadFrame(wantedFrame).then(queueDraw);
      loadFrame(wantedFrame - 1);
      loadFrame(wantedFrame + 1);
      trimCache();
    });
  }

  function drawNearestFrame() {
    if (!canvas.width || !canvas.height || !frames.size) return;
    let best = null;
    let distance = Infinity;
    for (const [index, record] of frames) {
      if (!record.loaded) continue;
      const nextDistance = Math.abs(index - wantedFrame);
      if (nextDistance < distance) { best = record.image; distance = nextDistance; }
    }
    if (!best || lastDrawnFrame === wantedFrame && distance === 0) return;

    const scale = Math.max(canvas.width / best.naturalWidth, canvas.height / best.naturalHeight);
    const width = best.naturalWidth * scale;
    const height = best.naturalHeight * scale;
    context.drawImage(best, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    lastDrawnFrame = wantedFrame;
  }

  function updateFromScroll() {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    wantedFrame = Math.round(progress * (frameCount - 1));
    lastDrawnFrame = -1;
    queueDemand();
    queueDraw();
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('scroll', updateFromScroll, { passive: true });
  resizeCanvas();
  updateFromScroll();

  // Pass 1: sparse keyframes from the full clip, so the whole scroll range appears quickly.
  const firstPass = Array.from({ length: frameCount }, (_, index) => index).filter(index => index % 16 === 0);
  Promise.all(firstPass.map(loadFrame)).then(async () => {
    // Pass 2: add quarter-step intermediates across the full clip.
    const secondPass = Array.from({ length: frameCount }, (_, index) => index).filter(index => index % 4 === 0 && index % 16 !== 0);
    for (let index = 0; index < secondPass.length; index += 8) {
      await Promise.all(secondPass.slice(index, index + 8).map(loadFrame));
    }
    // Pass 3: fill every remaining frame for the smoothest possible scrubbing.
    const thirdPass = Array.from({ length: frameCount }, (_, index) => index).filter(index => index % 4 !== 0);
    for (let index = 0; index < thirdPass.length; index += 8) {
      await Promise.all(thirdPass.slice(index, index + 8).map(loadFrame));
    }
  });
})();
