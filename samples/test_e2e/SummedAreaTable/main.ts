// import Rn from '../../../dist/esm/index.mjs';
import Rn from '../../../dist/cjs';

declare const window: any;

let framebuffer: Rn.FrameBuffer;
let renderPassMain: Rn.RenderPass;
(async () => {
  const canvas = document.getElementById('world') as HTMLCanvasElement;
  await Rn.System.init({
    approach: Rn.ProcessApproach.Uniform,
    canvas,
    webglOption: {antialias: false},
  });

  // setup the Main RenderPass
})();
