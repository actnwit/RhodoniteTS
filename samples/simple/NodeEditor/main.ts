import _Rn from '../../../dist/esm/index';

let p: any;

declare const Rn: typeof _Rn;

(async () => {
  await Rn.ModuleManager.getInstance().loadModule('webgl');
  Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  Rn.Material.registerMaterial('MyMaterial', []);
  const material = Rn.Material.createMaterial('MyMaterial');

  const constant1 = new Rn.ConstantVariableShaderNode(
    Rn.CompositionType.Vec4,
    Rn.ComponentType.Float
  );
  constant1.setDefaultInputValue('value', new Rn.Vector4(1, 2, 3, 4));
  const constant2 = new Rn.ConstantVariableShaderNode(
    Rn.CompositionType.Vec4,
    Rn.ComponentType.Float
  );
  constant2.setDefaultInputValue('value', new Rn.Vector4(4, 3, 2, 1));

  const addShaderNode = new Rn.AddShaderNode(
    Rn.CompositionType.Vec4,
    Rn.ComponentType.Float
  );
  addShaderNode.addInputConnection(constant1, 'outValue', 'lhs');
  addShaderNode.addInputConnection(constant2, 'outValue', 'rhs');

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
  const rnMaterial = Rn.MaterialHelper.recreateCustomMaterial(
    vertexRet.shader,
    pixelRet.shader
  );
  // const returnValues = material.createProgramString();
  // console.log(returnValues.pixelShader)
})();
