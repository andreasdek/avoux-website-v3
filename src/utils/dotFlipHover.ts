import { Flip } from 'gsap/Flip';

export function dotFlipHover(): void {
  const containers = document.querySelectorAll<HTMLElement>('[avoux-dot="container"]');

  containers.forEach((container) => {
    const dot = container.querySelector<HTMLElement>('[avoux-dot="target"]');
    if (!dot) return;

    const items = container.querySelectorAll<HTMLElement>('[avoux-dot="item"]');
    if (items.length === 0) return;

    items.forEach((item) => {
      item.addEventListener('mouseenter', () => {
        const state = Flip.getState(dot);

        item.insertBefore(dot, item.firstChild);

        Flip.from(state, {
          duration: 0.45,
          ease: 'cubic-bezier(0.35, 1.5, 0.6, 1)',
          prune: true,
        });
      });
    });
  });
}
