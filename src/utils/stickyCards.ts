import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type InitStickyFeaturesRoot = ParentNode | Document;

export function initStickyFeatures(root?: InitStickyFeaturesRoot): void {
  const scope: ParentNode | Document = root ?? document;

  const wraps = Array.from(scope.querySelectorAll<HTMLElement>('[data-sticky-feature-wrap]'));
  if (wraps.length === 0) return;

  wraps.forEach((w) => {
    const visualWraps = Array.from(
      w.querySelectorAll<HTMLElement>('[data-sticky-feature-visual-wrap]')
    );
    const items = Array.from(w.querySelectorAll<HTMLElement>('[data-sticky-feature-item]'));
    const progressBar = w.querySelector<HTMLElement>('[data-sticky-feature-progress]');

    if (visualWraps.length !== items.length) {
      console.warn('[initStickyFeatures] visualWraps and items count do not match:', {
        visualWraps: visualWraps.length,
        items: items.length,
        wrap: w,
      });
    }

    const count = Math.min(visualWraps.length, items.length);
    if (count < 1) return;

    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DURATION = rm ? 0.01 : 0.75;
    const EASE = 'power4.inOut';
    const SCROLL_AMOUNT = 0.9;

    const getTexts = (el: Element): HTMLElement[] =>
      Array.from(el.querySelectorAll<HTMLElement>('[data-sticky-feature-text]'));

    // Initial state
    // Hide all visuals except the first (so reveals layer on top as you scroll)
    visualWraps.forEach((vw, i) => {
      gsap.set(vw, {
        clipPath: i === 0 ? 'inset(0% round 0.75em)' : 'inset(50% round 0.75em)',
      });
    });

    // Hide all text items except the first
    items.forEach((it, i) => {
      gsap.set(it, { autoAlpha: i === 0 ? 1 : 0 });
      // Ensure text children start hidden for non-active items
      if (i !== 0) {
        gsap.set(getTexts(it), { autoAlpha: 0, y: 30 });
      }
    });

    // Progress bar starts empty (if present)
    if (progressBar) {
      gsap.set(progressBar, { scaleX: 0, transformOrigin: '0% 50%' });
    }

    let currentIndex = 0;

    function animateOut(itemEl: HTMLElement): void {
      const texts = getTexts(itemEl);
      gsap.to(texts, {
        autoAlpha: 0,
        y: -30,
        ease: 'power4.out',
        duration: 0.4,
        overwrite: true,
        onComplete: () => {
          gsap.set(itemEl, { autoAlpha: 0 });
        },
      });
    }

    function animateIn(itemEl: HTMLElement): void {
      const texts = getTexts(itemEl);
      gsap.set(itemEl, { autoAlpha: 1 });
      gsap.fromTo(
        texts,
        {
          autoAlpha: 0,
          y: 30,
        },
        {
          autoAlpha: 1,
          y: 0,
          ease: 'power4.out',
          duration: DURATION,
          stagger: 0.1,
          overwrite: true,
        }
      );
    }

    function transition(fromIndex: number, toIndex: number): void {
      if (fromIndex === toIndex) return;

      // Guard array access
      const fromVisual = visualWraps[fromIndex];
      const toVisual = visualWraps[toIndex];
      const fromItem = items[fromIndex];
      const toItem = items[toIndex];

      if (!fromVisual || !toVisual || !fromItem || !toItem) return;

      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });

      if (fromIndex < toIndex) {
        tl.to(
          toVisual,
          {
            clipPath: 'inset(0% round 0.75em)',
            duration: DURATION,
            ease: EASE,
          },
          0
        );
      } else {
        tl.to(
          fromVisual,
          {
            clipPath: 'inset(50% round 0.75em)',
            duration: DURATION,
            ease: EASE,
          },
          0
        );
      }

      // Run text transitions (not on tl, matching your original behavior)
      animateOut(fromItem);
      animateIn(toItem);
    }

    const steps = Math.max(1, count - 1);

    ScrollTrigger.create({
      trigger: w,
      start: 'center center',
      // Make sure the pinned scroll distance matches the number of steps.
      // Because we map `self.progress` through `SCROLL_AMOUNT`, we need a longer end distance
      // so the last step isn't reached too early and the pin-spacer is tall enough.
      end: () => `+=${(steps * 100) / SCROLL_AMOUNT}%`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = Math.min(self.progress, SCROLL_AMOUNT) / SCROLL_AMOUNT;

        let idx = Math.floor(p * steps + 1e-6);
        idx = Math.max(0, Math.min(steps, idx));

        if (progressBar) {
          gsap.to(progressBar, {
            scaleX: p,
            ease: 'none',
            overwrite: true,
          });
        }

        if (idx !== currentIndex) {
          transition(currentIndex, idx);
          currentIndex = idx;
        }
      },
      markers: true,
    });
  });
}
