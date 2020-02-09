
let p = null;

const load = async function (time) {

  await Rn.ModuleManager.getInstance().loadModule('webgl');
  Rn.MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  Rn.Material.registerMaterial('MyMaterial', []);
  const material = Rn.Material.createMaterial('MyMaterial');

  const constant1 = new Rn.ConstantVariableMaterialNode(Rn.CompositionType.Vec4, Rn.ComponentType.Float);
  constant1.setDefaultInputValue('value', new Rn.Vector4(1, 2, 3, 4));
  const constant2 = new Rn.ConstantVariableMaterialNode(Rn.CompositionType.Vec4, Rn.ComponentType.Float);
  constant2.setDefaultInputValue('value', new Rn.Vector4(4, 3, 2, 1));

  const addMaterialNode = new Rn.AddMaterialNode();
  addMaterialNode.addVertexInputConnection(constant1, 'outValue', 'lhs');
  addMaterialNode.addVertexInputConnection(constant2, 'outValue', 'rhs');

  const endMaterialNode = new Rn.EndMaterialNode();
  endMaterialNode.addVertexInputConnection(addMaterialNode, 'outValue', 'inPosition');
  endMaterialNode.addPixelInputConnection(addMaterialNode, 'outValue', 'inColor');

  // nodes are intentionally made the order random
  material.setMaterialNodes([endMaterialNode, addMaterialNode, constant1, constant2]);

  const returnValues = material.createProgramString();
  console.log(returnValues.vertexShader)
}

document.body.onload = load;

