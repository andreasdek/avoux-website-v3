import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

type WallRoot = HTMLElement;
type WallItem = HTMLElement;
type WallTarget = HTMLElement;

export function initWallCycle(): void {
  const loopDelay = 1.5; // Loop Duration
  const duration = 0.9; // Animation Duration

  document.querySelectorAll<WallRoot>('[data-wall-cycle-init]').forEach((root) => {
    const list = root.querySelector<HTMLElement>('[data-wall-list]');
    if (!list) return;

    const items = Array.from(list.querySelectorAll<WallItem>('[data-wall-item]'));

    const shuffleFront = root.getAttribute('data-wall-shuffle') !== 'false';

    const originalTargets: WallTarget[] = items
      .map((item) => item.querySelector<WallTarget>('[data-wall-target]'))
      .filter((el): el is WallTarget => el !== null);

    let visibleItems: WallItem[] = [];
    let visibleCount = 0;

    // pool are DOM nodes we rotate through; they are clones initially, then recycled
    let pool: WallTarget[] = [];

    // pattern holds indices into visibleItems
    let pattern: number[] = [];
    let patternIndex = 0;

    let tl: gsap.core.Timeline | null = null;

    function isVisible(el: Element): el is HTMLElement {
      return el instanceof HTMLElement && window.getComputedStyle(el).display !== 'none';
    }

    function shuffleArray<T>(arr: readonly T[]): T[] {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function setup(): void {
      if (tl) tl.kill();

      visibleItems = items.filter(isVisible);
      visibleCount = visibleItems.length;

      if (visibleCount === 0) {
        tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay }).pause();
        return;
      }

      pattern = shuffleArray(Array.from({ length: visibleCount }, (_, i) => i));
      patternIndex = 0;

      // Remove all injected targets (including originals that may still be around)
      items.forEach((item) => {
        item.querySelectorAll<WallTarget>('[data-wall-target]').forEach((old) => old.remove());
      });

      // Clone originals (deep clone)
      pool = originalTargets.map((n) => n.cloneNode(true) as WallTarget);

      let front: WallTarget[];
      let rest: WallTarget[];

      if (shuffleFront) {
        const shuffledAll = shuffleArray(pool);
        front = shuffledAll.slice(0, visibleCount);
        rest = shuffleArray(shuffledAll.slice(visibleCount));
      } else {
        front = pool.slice(0, visibleCount);
        rest = shuffleArray(pool.slice(visibleCount));
      }

      pool = front.concat(rest);

      for (let i = 0; i < visibleCount; i++) {
        const container = visibleItems[i];
        const parent =
          container.querySelector<HTMLElement>('[data-wall-target-parent]') ?? container;

        const next = pool.shift();
        if (!next) break;

        parent.appendChild(next);
      }

      tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
      tl.call(swapNext);
      tl.play();
    }

    function swapNext(): void {
      const nowCount = items.filter(isVisible).length;
      if (nowCount !== visibleCount) {
        setup();
        return;
      }

      if (!pool.length || visibleCount === 0) return;

      const idx = pattern[patternIndex % visibleCount];
      patternIndex += 1;

      const container = visibleItems[idx];
      if (!container) return;

      // Note: `:has()` isn't supported in all browsers. Keep if you target modern browsers.
      const parent: HTMLElement =
        container.querySelector<HTMLElement>('[data-wall-target-parent]') ??
        container.querySelector<HTMLElement>('*:has(> [data-wall-target])') ??
        container;

      const existing = parent.querySelectorAll<WallTarget>('[data-wall-target]');
      if (existing.length > 1) return;

      const current = parent.querySelector<WallTarget>('[data-wall-target]');
      const incoming = pool.shift();
      if (!incoming) return;

      gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
      parent.appendChild(incoming);

      if (current) {
        gsap.to(current, {
          yPercent: -50,
          autoAlpha: 0,
          duration,
          ease: 'expo.inOut',
          onComplete: () => {
            current.remove();
            pool.push(current);
          },
        });
      }

      gsap.to(incoming, {
        yPercent: 0,
        autoAlpha: 1,
        duration,
        delay: 0.1,
        ease: 'expo.inOut',
      });
    }

    setup();

    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => tl?.play(),
      onLeave: () => tl?.pause(),
      onEnterBack: () => tl?.play(),
      onLeaveBack: () => tl?.pause(),
    });

    document.addEventListener('visibilitychange', () => {
      if (!tl) return;
      if (document.hidden) {
        tl.pause();
      } else {
        tl.play();
      }
    });
  });
}
