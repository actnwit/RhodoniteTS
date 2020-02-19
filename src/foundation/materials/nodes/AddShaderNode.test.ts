import RnObj, { RnType } from "../../../../dist/rhodonite";
import ModuleManager from "../../system/ModuleManager";
import MemoryManager from "../../core/MemoryManager";
import Material from "../core/Material";
import ScalarToVector4MaterialNode from "./ScalarToVector4ShaderNode";
import EndMaterialNode from "./OutPositionShaderNode";
import Scalar from "../../math/Scalar";
import AttributePositionShaderNode from "./AttributePositionShaderNode";

const Rn: RnType = RnObj as any;

test('AttributePosition works correctly 1', async () => {
  await ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  Material.registerMaterial('MyMaterial', []);
  const material = Material.createMaterial('MyMaterial')!;

  const a_position = new AttributePositionShaderNode()

  const endMaterialNode = new EndMaterialNode();
  endMaterialNode.addVertexInputConnection(a_position, 'outValue', 'inPosition');

  // nodes are intentionally made the order random
  material.setMaterialNodes([endMaterialNode, a_position]);

  const returnValues = material.createProgramString();
  expect((returnValues.vertexShaderBody).replace(/\s+/g, "")).toEqual(`

      in vec4 a_position;

      void attributePosition(out vec4 outValue) {
        outValue = a_position;
      }

          void end(in vec4 inPosition) {
            gl_Position = inPosition;
          }

          void main() {
          vec4 outValue_0_to_inPosition_1;
      attributePosition(outValue_0_to_inPosition_1);
      end(outValue_0_to_inPosition_1);

          }
`.replace(/\s+/g, ""))
});

