import Rn from '../../../../dist/esmdev';

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.None,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

test('MaterialTID are processed correctly', () => {
  const materialNode = new Rn.CustomMaterialContent(engine, {
    name: 'material test',
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: {
      code: '',
      shaderStage: 'vertex',
      isFragmentShader: false,
    },
    pixelShader: {
      code: '',
      shaderStage: 'fragment',
      isFragmentShader: true,
    },
    additionalShaderSemanticInfo: [],
  });

  // 0st
  engine.materialRepository.registerMaterial(engine, 'MyMaterial0', materialNode);
  const _material0 = engine.materialRepository.createMaterial(engine, 'MyMaterial0', materialNode)!;

  // 1st
  engine.materialRepository.registerMaterial(engine, 'MyMaterial1', materialNode);
  const _material1a = engine.materialRepository.createMaterial(engine, 'MyMaterial1', materialNode)!;
  const material1b = engine.materialRepository.createMaterial(engine, 'MyMaterial1', materialNode)!;

  expect(material1b.materialTID).toEqual(1);
});

test('uniform updates do not invalidate render pipelines', () => {
  const materialNode = new Rn.CustomMaterialContent(engine, {
    name: 'pipeline version test material',
    isSkinning: false,
    isLighting: false,
    isMorphing: false,
    vertexShader: {
      code: '',
      shaderStage: 'vertex',
      isFragmentShader: false,
    },
    pixelShader: {
      code: '',
      shaderStage: 'fragment',
      isFragmentShader: true,
    },
    additionalShaderSemanticInfo: [
      {
        semantic: 'testValue' as any,
        componentType: Rn.ComponentType.Float,
        compositionType: Rn.CompositionType.Scalar,
        stage: Rn.ShaderType.PixelShader,
        initialValue: 0,
        min: 0,
        max: 100,
      },
    ],
  });

  engine.materialRepository.registerMaterial(engine, 'PipelineVersionTest', materialNode);
  const material = engine.materialRepository.createMaterial(engine, 'PipelineVersionTest', materialNode)!;
  material.calcFingerPrint();

  const pipelineStateVersion = material.pipelineStateVersion;
  const bindingStateVersion = engine.materialRepository.bindingStateVersion;

  // Uniform values live in the storage buffer. Updating one must not force a
  // new render pipeline nor invalidate cached render bundles.
  material.setParameter('testValue' as any, 1);
  expect(material.pipelineStateVersion).toBe(pipelineStateVersion);
  expect(engine.materialRepository.bindingStateVersion).toBe(bindingStateVersion);

  // Pipeline-affecting state changes must still invalidate the cached pipeline.
  material.alphaMode = Rn.AlphaMode.Blend;
  expect(material.pipelineStateVersion).toBeGreaterThan(pipelineStateVersion);
  expect(engine.materialRepository.bindingStateVersion).toBeGreaterThan(bindingStateVersion);
});
