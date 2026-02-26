import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
// SplitText is a Club GSAP plugin. Your import path may differ depending on your setup.
// Common options:
//   import { SplitText } from 'gsap/SplitText';
//   import { SplitText } from 'gsap-trial/SplitText';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText, ScrollTrigger);

type SplitType = 'lines' | 'words' | 'chars';

type SplitTiming = {
  duration: number;
  stagger: number;
};

const splitConfig: Record<SplitType, SplitTiming> = {
  lines: { duration: 0.8, stagger: 0.08 },
  words: { duration: 0.6, stagger: 0.06 },
  chars: { duration: 0.4, stagger: 0.01 },
};

type SplitTextInstance = Partial<Record<SplitType, Element[]>>;

function getSplitType(el: HTMLElement): SplitType {
  const raw = el.dataset.splitReveal;
  if (raw === 'words' || raw === 'chars' || raw === 'lines') return raw;
  return 'lines';
}

function getTypesToSplit(type: SplitType): SplitType[] {
  if (type === 'lines') return ['lines'];
  if (type === 'words') return ['lines', 'words'];
  return ['lines', 'words', 'chars'];
}

export function initMaskTextScrollReveal(): void {
  document.querySelectorAll<HTMLElement>('[data-split="heading"]').forEach((wrap) => {
    const textEl = wrap.querySelector<HTMLElement>('h1,h2,h3,h4,h5,h6,p,span') ?? wrap;

    const type = getSplitType(wrap);
    const typesToSplit = getTypesToSplit(type);

    SplitText.create(textEl, {
      type: typesToSplit.join(', '),
      mask: 'lines',
      autoSplit: true,
      linesClass: 'line',
      wordsClass: 'word',
      charsClass: 'letter',
      onSplit: (instance: SplitTextInstance) => {
        const { lines } = instance;
        if (!lines || lines.length === 0) return;

        const config = splitConfig[type];

        // Create one reveal per line so the trigger is when THAT line hits the threshold
        lines.forEach((line) => {
          let targets: Element[] = [];

          if (type === 'lines') {
            targets = [line];
          } else if (type === 'words') {
            targets = Array.from(line.querySelectorAll('.word'));
          } else {
            targets = Array.from(line.querySelectorAll('.letter'));
          }

          if (targets.length === 0) return;

          gsap.from(targets, {
            yPercent: 110,
            duration: config.duration,
            stagger: config.stagger,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: line,
              start: 'clamp(top 80%)',
              // Play when scrolling down into view, reverse when scrolling back up past the start point
              toggleActions: 'play none none reverse',
              invalidateOnRefresh: true,
            },
          });
        });
      },
    });
  });
}
