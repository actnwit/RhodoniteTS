import WEB4DS from './web4dv/web4dvImporter.js';

(async function () {
  Rn.Config.maxEntityNumber = 10;
  Rn.Config.maxLightNumberInShader = 1;
  Rn.Config.maxVertexMorphNumberInShader = 1;
  Rn.Config.maxMaterialInstanceForEachType = 2;
  Rn.Config.maxSkeletonNumber = 1;
  Rn.Config.maxCameraNumber = 1;
  Rn.Config.maxSkeletalBoneNumber = 1;
  Rn.Config.dataTextureWidth = Math.pow(2, 3);
  Rn.Config.dataTextureHeight = Math.pow(2, 4);
  Rn.Config.maxMorphTargetNumber = 0;
  Rn.MemoryManager.createInstanceIfNotCreated(1.25, 1, 0);


  await Promise.all([
    Rn.ModuleManager.getInstance().loadModule('webgl'),
    Rn.ModuleManager.getInstance().loadModule('pbr')
  ]);

  const system = Rn.System.getInstance();
  const rnCanvasElem = document.getElementById('world');
  const gl = system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, rnCanvasElem);

  Rn.MeshRendererComponent.isViewFrustumCullingEnabled = false;

  /************************
  * START 4Dviews' WEB4DV *
  ************************/
  // 4Dviews: Constructor(s)
  const sequences4D = [];
  let current4DSequence = null;

  const expression = new Rn.Expression();

  // to try this sample, you need to prepare 4ds samples data and write the path to them here
  // you can get the sample data from [the official 4D VIEWS website](https://www.4dviews.com/).
  const model4DS01 = new WEB4DS(
    'id(Arbitrary id)',
    'DESKTOP.4ds (4D Views file for desktop)',
    'MOBILE.4ds (4D Views file for mobile)',
    'AUDIO.wav (audio file of 4D Views. if there is no audio file, you set empty string here)',
    [0.45, -0.8, 0.2],
    gl
  );

  sequences4D.push(model4DS01);
  // sequences4D.push(model4DS02);

  current4DSequence = sequences4D[0];
  sequences4D[0].load(true, false, draw);

  let clickEventName;
  if ('ontouchstart' in document) {
    clickEventName = 'touchstart';
  } else {
    clickEventName = 'mousedown';
  }

  document.getElementById('btnLoad').addEventListener(clickEventName, function () {
    model4DS01.isDrawing = false;
    sequences4D[0].destroy(function () {
      sequences4D[0].load();
    });
  });

  document.getElementById('btnPlay').addEventListener(clickEventName, function () {
    if (current4DSequence) current4DSequence.play();
  });

  document.getElementById('btnPause').addEventListener(clickEventName, function () {
    if (current4DSequence) current4DSequence.pause();
  });

  document.getElementById('btnMute').addEventListener(clickEventName, function () {
    if (current4DSequence) current4DSequence.mute();
  });

  document.getElementById('btnUnmute').addEventListener(clickEventName, function () {
    if (current4DSequence) current4DSequence.unmute();
  });


  function draw() {
    try {
      if (model4DS01.isDrawing) {
        system.process([model4DS01.expression]);
      }
      requestAnimationFrame(draw);
    } catch (e) {
      alert("e");
      alert(e);
    }
  }
})();

