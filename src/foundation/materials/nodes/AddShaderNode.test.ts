import RnObj, { RnType } from "../../../../dist/rhodonite";
import ModuleManager from "../../system/ModuleManager";
import MemoryManager from "../../core/MemoryManager";
import Material from "../core/Material";
import ScalarToVector4MaterialNode from "./ScalarToVector4ShaderNode";
import OutPositionNode from "./OutPositionShaderNode";
import Scalar from "../../math/Scalar";
import AttributePositionShaderNode from "./AttributePositionShaderNode";
import ShaderGraphResolver from "../core/ShaderGraphResolver";

const Rn: RnType = RnObj as any;

test('AttributePosition works correctly 1', async () => {
  await ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  Material.registerMaterial('MyMaterial', []);
  const material = Material.createMaterial('MyMaterial')!;

  const a_position = new AttributePositionShaderNode()

  const outPositionNode = new OutPositionNode();
  outPositionNode.addInputConnection(a_position, 'outValue', 'value');

  // nodes are intentionally made the order random
  const retVal = ShaderGraphResolver.createVertexShaderCode([outPositionNode, a_position]);

  expect((retVal.shaderBody).replace(/\s+/g, "")).toEqual(`

    in vec4 a_position;

    void attributePosition(out vec4 outValue) {
      outValue = a_position;
    }

        void outPosition(in vec4 inPosition) {
          gl_Position = inPosition;
        }

        void main() {
        #ifdef RN_IS_FASTEST_MODE
      float materialSID = u_currentComponentSIDs[0];

      int lightNumber = 0;
      #ifdef RN_IS_LIGHTING
        lightNumber = int(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.LightComponentTID} */]);
      #endif

      float skeletalComponentSID = -1.0;
      #ifdef RN_IS_SKINNING
        skeletalComponentSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.SkeletalComponentTID} */];
      #endif

    #else

      float materialSID = u_materialSID;

      int lightNumber = 0;
      #ifdef RN_IS_LIGHTING
        lightNumber = get_lightNumber(0.0, 0);
      #endif

      float skeletalComponentSID = -1.0;
      #ifdef RN_IS_SKINNING
        skeletalComponentSID = float(get_skinningMode(0.0, 0));
      #endif

    #endif
    vec4 outValue_0_to_1=vec4(0.0,0.0,0.0,0.0);
    attributePosition(outValue_0_to_1);
    outPosition(outValue_0_to_1);

        }

`.replace(/\s+/g, ""))
});

