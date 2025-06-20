import Rn from '../../../dist/esmdev/index.js';

const moduleName = 'webgl';
const moduleManager = Rn.ModuleManager.getInstance();
await moduleManager.loadModule(moduleName);

Rn.MemoryManager.createInstanceIfNotCreated({
  cpuGeneric: 1,
  gpuInstanceData: 1,
  gpuVertexData: 1,
});

// Constant 1
const constant1 = new Rn.ConstantVector4VariableShaderNode(Rn.ComponentType.Float);
constant1.setDefaultInputValue(Rn.Vector4.fromCopyArray([1, 2, 3, 4]));

// Constant 2
const constant2 = new Rn.ConstantVector4VariableShaderNode(Rn.ComponentType.Float);
constant2.setDefaultInputValue(Rn.Vector4.fromCopyArray([4, 3, 2, 1]));

// Add (Constant 1 + Constant 2)
const addShaderNode = new Rn.AddShaderNode(Rn.CompositionType.Vec4, Rn.ComponentType.Float);
addShaderNode.addInputConnection(constant1, constant1.getSocketOutput(), addShaderNode.getSocketInputLhs());
addShaderNode.addInputConnection(constant2, constant2.getSocketOutput(), addShaderNode.getSocketInputRhs());

// Out
const outPositionShaderNode = new Rn.OutPositionShaderNode();
const outColorShaderNode = new Rn.OutColorShaderNode();
outPositionShaderNode.addInputConnection(
  addShaderNode,
  addShaderNode.getSocketOutput(),
  outPositionShaderNode.getSocketInput()
);
outColorShaderNode.addInputConnection(constant2, constant2.getSocketOutput(), outColorShaderNode.getSocketInput());

const vertexRet = Rn.ShaderGraphResolver.createVertexShaderCode(
  [outPositionShaderNode, addShaderNode, constant1, constant2],
  []
);
const pixelRet = Rn.ShaderGraphResolver.createPixelShaderCode([
  outColorShaderNode,
  addShaderNode,
  constant1,
  constant2,
]);

console.log('vertex shader');
console.log(vertexRet);
console.log('pixel shader');
console.log(pixelRet);

(window as any).vertexShader = vertexRet;
(window as any).pixelShader = pixelRet;

const pElem = document.createElement('p');
pElem.setAttribute('id', 'rendered');
pElem.innerText = 'Rendered.';
document.body.appendChild(pElem);

// const rnMaterial = Rn.MaterialHelper.reuseOrRecreateCustomMaterial(vertexRet.shader, pixelRet.shader);
// console.log('material');
// console.log(rnMaterial);
