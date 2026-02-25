import { dotFlipHover } from '$utils/dotFlipHover';
import { initBackgroundZoom } from '$utils/imageToBackgroundZoom';
import { initWallCycle } from '$utils/logoWall';

window.Webflow ||= [];
window.Webflow.push(() => {
  initWallCycle();
  dotFlipHover();
  initBackgroundZoom();
});
