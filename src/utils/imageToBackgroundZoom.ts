import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, Flip);

type ScrollRangeArgs = {
  trigger: Element;
  start: string;
  endTrigger: Element;
  end: string;
};

export function initBackgroundZoom(): void {
  const containers = Array.from(document.querySelectorAll<HTMLElement>('[data-bg-zoom-init]'));
  if (containers.length === 0) return;

  let masterTimeline: gsap.core.Timeline | null = null;

  const getScrollRange = ({ trigger, start, endTrigger, end }: ScrollRangeArgs): number => {
    const st = ScrollTrigger.create({ trigger, start, endTrigger, end });
    const range = Math.max(1, st.end - st.start);
    st.kill();
    return range;
  };

  const bgZoomTimeline = (): void => {
    if (masterTimeline) {
      masterTimeline.kill();
      masterTimeline = null;
    }

    const first = containers[0];
    const firstTrigger = first.querySelector<HTMLElement>('[data-bg-zoom-start]') ?? first;

    masterTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: firstTrigger,
        start: 'clamp(top bottom)', // Change to "center center" to start from center of [data-bg-zoom-start]
        endTrigger: containers[containers.length - 1],
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    containers.forEach((container) => {
      const startEl = container.querySelector<HTMLElement>('[data-bg-zoom-start]');
      const endEl = container.querySelector<HTMLElement>('[data-bg-zoom-end]');
      const contentEl = container.querySelector<HTMLElement>('[data-bg-zoom-content]');
      const darkEl = container.querySelector<HTMLElement>('[data-bg-zoom-dark]');
      const imgEl = container.querySelector<HTMLElement>('[data-bg-zoom-img]');

      if (!startEl || !endEl || !contentEl) return;

      const startRadius = getComputedStyle(startEl).borderRadius;
      const endRadius = getComputedStyle(endEl).borderRadius;
      const hasRadius = startRadius !== '0px' || endRadius !== '0px';

      contentEl.style.overflow = hasRadius ? 'hidden' : '';
      if (hasRadius) gsap.set(contentEl, { borderRadius: startRadius });

      // Initial fit (no animation)
      // Flip.fit typings can be loose; we don't need its return value here.
      Flip.fit(contentEl, startEl, { scale: false });

      // Part 1 - Move from Start to End position
      const zoomScrollRange = getScrollRange({
        trigger: startEl,
        start: 'clamp(top bottom)', // Change to "center center" to start from center of [data-bg-zoom-start]
        endTrigger: endEl,
        end: 'center center',
      });

      // Part 2 - End position to out of view
      const afterScrollRange = getScrollRange({
        trigger: endEl,
        start: 'center center',
        endTrigger: container,
        end: 'bottom top',
      });

      // Master Timeline: add Flip tween if it returns something usable
      const fitTween = Flip.fit(contentEl, endEl, {
        duration: zoomScrollRange,
        ease: 'none',
        scale: false,
      }) as unknown as gsap.core.Animation | null;

      if (fitTween) masterTimeline!.add(fitTween);

      // Border Radius
      if (hasRadius) {
        masterTimeline!.to(
          contentEl,
          {
            borderRadius: endRadius,
            duration: zoomScrollRange,
          },
          '<'
        );
      }

      // Content Y Position
      masterTimeline!.to(contentEl, {
        y: `+=${afterScrollRange}`,
        duration: afterScrollRange,
      });

      // Dark Overlay
      if (darkEl) {
        gsap.set(darkEl, { opacity: 0 });
        masterTimeline!.to(
          darkEl,
          {
            opacity: 0.75,
            duration: afterScrollRange * 0.25,
          },
          '<'
        );
      }

      // Image scale
      if (imgEl) {
        gsap.set(imgEl, { scale: 1, transformOrigin: '50% 50%' });
        masterTimeline!.to(
          imgEl,
          {
            scale: 1.25,
            yPercent: -10,
            duration: afterScrollRange,
          },
          '<'
        );
      }
    });

    ScrollTrigger.refresh();
  };

  bgZoomTimeline();

  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(bgZoomTimeline, 100);
  });
}
