import _Rn from '../../../dist/esm/index';
declare const Rn: typeof _Rn;

(async () => {
  const moduleName = 'webgl';
  const moduleManager = Rn.ModuleManager.getInstance();
  await moduleManager.loadModule(moduleName);

  Rn.MemoryManager.createInstanceIfNotCreated({
    cpuGeneric: 1,
    gpuInstanceData: 1,
    gpuVertexData: 1,
  });

  // Constant 1
  const constant1 = new Rn.ConstantVariableShaderNode(
    Rn.CompositionType.Vec4,
    Rn.ComponentType.Float
  );
  constant1.setDefaultInputValue(
    'value',
    Rn.Vector4.fromCopyArray([1, 2, 3, 4])
  );

  // Constant 2
  const constant2 = new Rn.ConstantVariableShaderNode(
    Rn.CompositionType.Vec4,
    Rn.ComponentType.Float
  );
  constant2.setDefaultInputValue(
    'value',
    Rn.Vector4.fromCopyArray([4, 3, 2, 1])
  );

  // Add (Constant 1 + Constant 2)
  const addShaderNode = new Rn.AddShaderNode(
    Rn.CompositionType.Vec4,
    Rn.ComponentType.Float
  );
  addShaderNode.addInputConnection(constant1, 'outValue', 'lhs');
  addShaderNode.addInputConnection(constant2, 'outValue', 'rhs');

  // Out
  const outPositionShaderNode = new Rn.OutPositionShaderNode();
  const outColorShaderNode = new Rn.OutColorShaderNode();
  outPositionShaderNode.addInputConnection(addShaderNode, 'outValue', 'value');
  outColorShaderNode.addInputConnection(constant2, 'outValue', 'value');

  const vertexRet = Rn.ShaderGraphResolver.createVertexShaderCode([
    outPositionShaderNode,
    addShaderNode,
    constant1,
    constant2,
  ]);
  const pixelRet = Rn.ShaderGraphResolver.createPixelShaderCode([
    outColorShaderNode,
    addShaderNode,
    constant1,
    constant2,
  ]);

  console.log('vertex shader');
  console.log(vertexRet.shader);
  console.log('pixel shader');
  console.log(pixelRet.shader);

  (window as any).vertexShader = vertexRet.shader;
  (window as any).pixelShader = pixelRet.shader;

  const pElem = document.createElement('p');
  pElem.setAttribute('id', 'rendered');
  pElem.innerText = 'Rendered.';
  document.body.appendChild(pElem);

  const rnMaterial = Rn.MaterialHelper.recreateCustomMaterial(
    vertexRet.shader,
    pixelRet.shader
  );
  console.log('material');
  console.log(rnMaterial);
})();
