import { dotFlipHover } from '$utils/dotFlipHover';
import { initWallCycle } from '$utils/logoWall';

window.Webflow ||= [];
window.Webflow.push(() => {
  initWallCycle();
  dotFlipHover();
});
