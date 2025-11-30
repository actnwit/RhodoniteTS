import Rn from '../../../../dist/esmdev';

const engine = await Rn.Engine.init({
  approach: Rn.ProcessApproach.None,
  canvas: document.getElementById('world') as HTMLCanvasElement,
});

test('MaterialTID are processed correctly', () => {
  const materialNode = new Rn.CustomMaterialContent({
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
  Rn.MaterialRepository.registerMaterial('MyMaterial0', materialNode);
  const _material0 = Rn.MaterialRepository.createMaterial(engine, 'MyMaterial0', materialNode)!;

  // 1st
  Rn.MaterialRepository.registerMaterial('MyMaterial1', materialNode);
  const _material1a = Rn.MaterialRepository.createMaterial(engine, 'MyMaterial1', materialNode)!;
  const material1b = Rn.MaterialRepository.createMaterial(engine, 'MyMaterial1', materialNode)!;

  expect(material1b.materialTID).toEqual(1);
});
