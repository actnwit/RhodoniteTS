import RnObj, { RnType } from "../../../../dist/rhodonite";
import ModuleManager from "../../system/ModuleManager";
import MemoryManager from "../../core/MemoryManager";
import Material from "../core/Material";
import ConstantVariableMaterialNode from "./ConstantVariableMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import AddMaterialNode from "./AddMaterialNode";
import EndMaterialNode from "./EndMaterialNode";
import Vector4 from "../../math/Vector4";

const Rn: RnType = RnObj as any;

test('ConstantVariable works correctly 1', async () => {
  await ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  Material.registerMaterial('MyMaterial', []);
  const material = Material.createMaterial('MyMaterial')!;

  const constant1 = new ConstantVariableMaterialNode(CompositionType.Vec4, ComponentType.Float);
  constant1.setDefaultInputValue('value', new Vector4(1, 2, 3, 4));
  const constant2 = new ConstantVariableMaterialNode(CompositionType.Vec4, ComponentType.Float);
  constant2.setDefaultInputValue('value', new Vector4(4, 3, 2, 1));

  const addMaterialNode = new AddMaterialNode();
  addMaterialNode.addVertexInputConnection(constant1, 'outValue', 'lhs');
  addMaterialNode.addVertexInputConnection(constant2, 'outValue', 'rhs');

  const endMaterialNode = new EndMaterialNode();
  endMaterialNode.addVertexInputConnection(addMaterialNode, 'outValue', 'inPosition');
  endMaterialNode.addPixelInputConnection(addMaterialNode, 'outValue', 'inColor');

  // nodes are intentionally made the order random
  material.setMaterialNodes([endMaterialNode, addMaterialNode, constant1, constant2]);

  const returnValues = material.createProgramString();
  console.log(returnValues.vertexShader+'\n###\n'+returnValues.pixelShader)
 expect((returnValues.vertexShader+'\n###\n'+returnValues.pixelShader).replace(/\s+/g, "")).toEqual(`
      uniform bool u_vertexAttributesExistenceArray[11];

          }
`.replace(/\s+/g, ""))
});