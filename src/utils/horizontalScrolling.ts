import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type HorizontalScrollConditions = {
  isMobile: boolean;
  isMobileLandscape: boolean;
  isTablet: boolean;
  isDesktop: boolean;
};

type DisableBreakpoint = 'mobile' | 'mobileLandscape' | 'tablet' | null;

function getDisableBreakpoint(el: HTMLElement): DisableBreakpoint {
  const value = el.getAttribute('data-horizontal-scroll-disable');

  if (value === 'mobile' || value === 'mobileLandscape' || value === 'tablet') {
    return value;
  }

  return null;
}

export function initHorizontalScrolling(): void {
  const mm = gsap.matchMedia();

  mm.add(
    {
      isMobile: '(max-width: 479px)',
      isMobileLandscape: '(max-width: 767px)',
      isTablet: '(max-width: 991px)',
      isDesktop: '(min-width: 992px)',
    },
    (context) => {
      const conditions = context.conditions as HorizontalScrollConditions;
      const { isMobile, isMobileLandscape, isTablet } = conditions;

      const ctx = gsap.context(() => {
        const wrappers = document.querySelectorAll<HTMLElement>('[data-horizontal-scroll-wrap]');
        if (wrappers.length === 0) return;

        wrappers.forEach((wrap) => {
          const disable = getDisableBreakpoint(wrap);

          if (
            (disable === 'mobile' && isMobile) ||
            (disable === 'mobileLandscape' && isMobileLandscape) ||
            (disable === 'tablet' && isTablet)
          ) {
            return;
          }

          const panels = gsap.utils.toArray<HTMLElement>('[data-horizontal-scroll-panel]', wrap);
          if (panels.length < 2) return;

          gsap.to(panels, {
            x: () => -(wrap.scrollWidth - window.innerWidth),
            ease: 'none',
            scrollTrigger: {
              trigger: wrap,
              start: 'top top',
              end: () => `+=${wrap.scrollWidth - window.innerWidth}`,
              scrub: true,
              pin: true,
              invalidateOnRefresh: true,
            },
          });
        });
      });

      return () => {
        ctx.revert();
      };
    }
  );
}
