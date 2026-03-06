import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { dotFlipHover } from '$utils/dotFlipHover';
import { initHorizontalScrolling } from '$utils/horizontalScrolling';
import { initWallCycle } from '$utils/logoWall';
import { initStickyFeatures } from '$utils/stickyCards';

window.Webflow ||= [];
window.Webflow.push(() => {
  // 1) Init all modules (order can matter, but keep modules independent)
  initWallCycle();
  dotFlipHover();
  initStickyFeatures();
  initHorizontalScrolling();

  // 2) ONE global refresh after everything is created
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });

  // 3) Optional: refresh once images/fonts are loaded (Flip measurements love this)
  window.addEventListener(
    'load',
    () => {
      ScrollTrigger.refresh();
    },
    { once: true }
  );
});
