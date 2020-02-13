import RnObj, { RnType } from "../../../../dist/rhodonite";
import ModuleManager from "../../system/ModuleManager";
import MemoryManager from "../../core/MemoryManager";
import Material from "../core/Material";
import ConstantVariableMaterialNode from "./ConstantVariableMaterialNode";
import VaryingVariableMaterialNode from "./VaryingVariableMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import AddMaterialNode from "./AddMaterialNode";
import EndMaterialNode from "./EndMaterialNode";
import Vector4 from "../../math/Vector4";
import { ShaderType } from "../../definitions/ShaderType";

const Rn: RnType = RnObj as any;

test('VaryingVariable works correctly 1', async () => {
  await ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated(1, 1, 1);

  Material.registerMaterial('MyMaterial', []);
  const material = Material.createMaterial('MyMaterial')!;

  const varying1 = new VaryingVariableMaterialNode(CompositionType.Vec4, ComponentType.Float);
  varying1.setVaryingVariableName('v_position');
  const constant1 = new ConstantVariableMaterialNode(CompositionType.Vec4, ComponentType.Float);
  constant1.setDefaultInputValue('value', new Vector4(4, 3, 2, 1));
  constant1.shaderType = ShaderType.VertexShader;

  const endMaterialNode = new EndMaterialNode();
  varying1.addVertexInputConnection(constant1, 'outValue', 'value');
  endMaterialNode.addVertexInputConnection(constant1, 'outValue', 'inPosition');
  endMaterialNode.addPixelInputConnection(varying1, 'outValue', 'inColor');

  // nodes are intentionally made the order random
  material.setMaterialNodes([endMaterialNode, varying1, constant1]);

  const returnValues = material.createProgramString();
  console.log(returnValues!.vertexShaderBody+returnValues!.pixelShaderBody)
 expect((returnValues!.vertexShaderBody+returnValues!.pixelShaderBody).replace(/\s+/g, "")).toEqual(`


    void constantVariable_1(
      out vec4 outValue) {
      outValue = vec4(4.0, 3.0, 2.0, 1.0);
    }

    void constantVariable_0(
      out vec4 outValue) {
      outValue = vec4(1.0, 2.0, 3.0, 4.0);
    }

void add(in float lfs, in float rhs, out float outValue) {
  outValue = lfs + rhs;
}
void add(in int lfs, in int rhs, out int outValue) {
  outValue = lfs + rhs;
}
void add(in vec2 lfs, in vec2 rhs, out vec2 outValue) {
  outValue = lfs + rhs;
}
void add(in vec3 lfs, in vec3 rhs, out vec3 outValue) {
  outValue = lfs + rhs;
}
void add(in vec4 lfs, in vec4 rhs, out vec4 outValue) {
  outValue = lfs + rhs;
}

    void end(in vec4 inPosition) {
      gl_Position = inPosition;
    }

    void main() {
    vec4 outValue_0_to_lhs_2;
vec4 outValue_1_to_rhs_2;
vec4 outValue_2_to_inPosition_3;
constantVariable_1(outValue_1_to_rhs_2);
constantVariable_0(outValue_0_to_lhs_2);
add(outValue_0_to_lhs_2, outValue_1_to_rhs_2, outValue_2_to_inPosition_3);
end(outValue_2_to_inPosition_3);

    }



    void constantVariable_1(
      out vec4 outValue) {
      outValue = vec4(4.0, 3.0, 2.0, 1.0);
    }

    void constantVariable_0(
      out vec4 outValue) {
      outValue = vec4(1.0, 2.0, 3.0, 4.0);
    }

void add(in float lfs, in float rhs, out float outValue) {
  outValue = lfs + rhs;
}
void add(in int lfs, in int rhs, out int outValue) {
  outValue = lfs + rhs;
}
void add(in vec2 lfs, in vec2 rhs, out vec2 outValue) {
  outValue = lfs + rhs;
}
void add(in vec3 lfs, in vec3 rhs, out vec3 outValue) {
  outValue = lfs + rhs;
}
void add(in vec4 lfs, in vec4 rhs, out vec4 outValue) {
  outValue = lfs + rhs;
}

    void end(in vec4 inColor) {
      vec4 rt0 = inColor;
      gl_FragColor = rt0;

    }

    void main() {
    vec4 outValue_1_to_inColor_3;
constantVariable_1(outValue_1_to_inColor_3);
end(outValue_1_to_inColor_3);

    }
    `.replace(/\s+/g, ""))
});