import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { startDotGrid } from './dot-grid';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

const canvas = document.querySelector<HTMLCanvasElement>('.hero-canvas');
if (canvas) startDotGrid(canvas, !reduceMotion);

// Reduced motion: no loader, no smoothing, no animation. Content is already final in the HTML.
if (reduceMotion) document.querySelector('.loader')?.remove();
else document.fonts.ready.then(init);

function init() {
  const smoother = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.1,
    effects: true,
    smoothTouch: false,
  });

  // Same-page anchors scroll through the smoother; cross-page ones navigate normally.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.hash);
      if (!target) return;
      e.preventDefault();
      smoother.scrollTo(target, true, 'top top');
    });
  });

  intro(() => {
    if (location.hash && document.querySelector(location.hash)) smoother.scrollTo(location.hash, true, 'top top');
  });
  chrome();
  sections();
  if (finePointer) pointerFx();
}

function intro(onDone: () => void) {
  const tl = gsap.timeline({ onComplete: onDone });
  const loader = document.querySelector<HTMLElement>('.loader');

  if (loader) {
    const count = loader.querySelector('.loader-count')!;
    const n = { v: 0 };
    tl.to(n, {
      v: 100,
      duration: 1.5,
      ease: 'power3.inOut',
      onUpdate: () => (count.textContent = String(Math.round(n.v)).padStart(3, '0')),
    })
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' })
      .set(loader, { display: 'none' });
  }

  const title = document.querySelector('.hero-title');
  if (title) {
    const split = SplitText.create(title, { type: 'lines,chars', mask: 'lines' });
    tl.from(split.chars, { yPercent: 115, rotate: 6, duration: 1.2, stagger: 0.03, ease: 'expo.out' }, loader ? '-=0.45' : 0)
      .from('[data-hero-fade]', { y: 30, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, '-=0.9')
      .from('.nav', { yPercent: -100, opacity: 0, duration: 0.8, ease: 'power3.out' }, '<');
  }
}

// Scroll progress bar + nav that hides on scroll down, returns on scroll up.
function chrome() {
  gsap.to('.progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  const nav = document.querySelector('.nav');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const hide = self.direction === 1 && self.scroll() > 300;
      gsap.to(nav, { yPercent: hide ? -110 : 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    },
  });
}

function sections() {
  gsap.to('.hero-inner', {
    yPercent: -18,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  // Skills marquee: loops forever, speeds up and flips with scroll velocity.
  const loops = gsap.utils.toArray<HTMLElement>('.marquee-track').map((track, i) =>
    gsap.fromTo(track, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 40, ease: 'none', repeat: -1 }),
  );
  if (loops.length) {
    const skew = gsap.quickTo('.marquee', 'skewX', { duration: 0.5, ease: 'power3' });
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const v = self.getVelocity();
        const boost = 1 + Math.min(Math.abs(v) / 300, 6);
        loops.forEach((loop) =>
          gsap.to(loop, {
            timeScale: self.direction * boost,
            duration: 0.2,
            overwrite: true,
            onComplete: () => void gsap.to(loop, { timeScale: self.direction, duration: 1.2 }),
          }),
        );
        skew(gsap.utils.clamp(-8, 8, v / -250));
      },
    });
    ScrollTrigger.addEventListener('scrollEnd', () => skew(0));
  }

  // About: pinned, words light up as you scroll.
  const aboutText = document.querySelector('.about-text');
  if (aboutText) {
    const split = SplitText.create(aboutText, { type: 'words' });
    gsap.from(split.words, {
      opacity: 0.1,
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: '.about', start: 'top top', end: '+=120%', pin: true, scrub: true },
    });
  }

  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const n = { v: 0 };
    el.textContent = '0';
    gsap.to(n, {
      v: end,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => (el.textContent = String(Math.round(n.v))),
    });
  });

  // Big headings rise in line by line.
  gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 1.1,
      stagger: 0.1,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  const line = document.querySelector('.timeline-line');
  if (line) {
    gsap.from(line, {
      scaleY: 0,
      transformOrigin: 'top',
      ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 60%', scrub: true },
    });
  }
  gsap.utils.toArray<HTMLElement>('.timeline-item').forEach((el) => {
    gsap.from(el, { x: -50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' } });
  });

  gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((list) => {
    gsap.from(list.children, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: list, start: 'top 85%' },
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // Contact headline: letters wave up, scrubbed to scroll.
  const contactTitle = document.querySelector('.contact-title');
  if (contactTitle) {
    const split = SplitText.create(contactTitle, { type: 'words,chars', mask: 'chars' });
    gsap.from(split.chars, {
      yPercent: 100,
      stagger: 0.03,
      ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top 80%', end: 'top 20%', scrub: true },
    });
  }

  // Horizontal pinned gallery on desktop; stacked cards on small screens.
  gsap.matchMedia().add('(min-width: 768px)', () => {
    const work = document.querySelector<HTMLElement>('.work');
    const track = document.querySelector<HTMLElement>('.projects-track');
    if (!work || !track) return;

    // Slide until the last card sits one gutter from the right edge.
    const distance = () => {
      const gutter = parseFloat(getComputedStyle(work).paddingLeft);
      return Math.max(0, track.scrollWidth + gutter * 2 - work.clientWidth);
    };
    gsap.set(work, { overflowX: 'hidden' });
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: work,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  });
}

function pointerFx() {
  document.documentElement.classList.add('has-cursor');

  const dotX = gsap.quickTo('.cursor', 'x', { duration: 0.1, ease: 'power3' });
  const dotY = gsap.quickTo('.cursor', 'y', { duration: 0.1, ease: 'power3' });
  const ringX = gsap.quickTo('.cursor-ring', 'x', { duration: 0.5, ease: 'power3' });
  const ringY = gsap.quickTo('.cursor-ring', 'y', { duration: 0.5, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    dotX(e.clientX);
    dotY(e.clientY);
    ringX(e.clientX);
    ringY(e.clientY);
  });

  document.querySelectorAll('a, button, .project-card').forEach((el) => {
    el.addEventListener('pointerenter', () => gsap.to('.cursor-ring', { scale: 2.2, duration: 0.3 }));
    el.addEventListener('pointerleave', () => gsap.to('.cursor-ring', { scale: 1, duration: 0.3 }));
  });

  // Magnetic elements lean toward the pointer.
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.35);
      y((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });

  // Project cards tilt in 3D toward the pointer.
  document.querySelectorAll<HTMLElement>('.project-card').forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      rx(((e.clientY - r.top) / r.height - 0.5) * -10);
      ry(((e.clientX - r.left) / r.width - 0.5) * 10);
    });
    card.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}
