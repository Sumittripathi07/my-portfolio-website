// Interactive dot grid for the hero: dots drift away from the pointer and light up.
export function startDotGrid(canvas: HTMLCanvasElement, animate: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gap = 30;
  const radius = 150;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const mouse = { x: -9999, y: -9999 };
  let w = 0;
  let h = 0;
  let dots: { x: number; y: number; ox: number; oy: number }[] = [];

  function resize() {
    const dpr = Math.min(devicePixelRatio, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) dots.push({ x, y, ox: x, oy: y });
    }
    draw();
  }

  function draw() {
    ctx!.clearRect(0, 0, w, h);
    for (const d of dots) {
      const dx = d.ox - mouse.x;
      const dy = d.oy - mouse.y;
      const dist = Math.hypot(dx, dy) || 1;
      const f = Math.max(0, 1 - dist / radius);
      d.x += (d.ox + (dx / dist) * f * 28 - d.x) * 0.12;
      d.y += (d.oy + (dy / dist) * f * 28 - d.y) * 0.12;
      ctx!.globalAlpha = f > 0 ? 0.35 + f * 0.65 : 1;
      ctx!.fillStyle = f > 0 ? accent : 'rgba(242, 240, 233, 0.13)';
      ctx!.beginPath();
      ctx!.arc(d.x, d.y, 1.2 + f * 2, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.globalAlpha = 1;
  }

  resize();
  addEventListener('resize', resize);
  if (!animate) return;

  addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });

  // Only burn frames while the hero is on screen.
  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(canvas);
  (function loop() {
    if (visible) draw();
    requestAnimationFrame(loop);
  })();
}
