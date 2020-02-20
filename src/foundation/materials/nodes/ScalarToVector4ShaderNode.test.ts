import RnObj, { RnType } from "../../../../dist/rhodonite";
import ModuleManager from "../../system/ModuleManager";
import MemoryManager from "../../core/MemoryManager";
import Material from "../core/Material";
import ConstantVariableShaderNode from "./ConstantVariableShaderNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import ScalarToVector4MaterialNode from "./ScalarToVector4ShaderNode";
import EndMaterialNode from "./OutPositionShaderNode";
import Scalar from "../../math/Scalar";

const Rn: RnType = RnObj as any;

test('ScalarToVector4 works correctly 1', async () => {

  const constant1 = new ConstantVariableShaderNode(CompositionType.Scalar, ComponentType.Float);
  constant1.setDefaultInputValue('value', new Scalar(1));
  const constant2 = new ConstantVariableShaderNode(CompositionType.Scalar, ComponentType.Float);
  constant2.setDefaultInputValue('value', new Scalar(2));
  const constant3 = new ConstantVariableShaderNode(CompositionType.Scalar, ComponentType.Float);
  constant3.setDefaultInputValue('value', new Scalar(3));
  const constant4 = new ConstantVariableShaderNode(CompositionType.Scalar, ComponentType.Float);
  constant4.setDefaultInputValue('value', new Scalar(4));

  const scalarToVector4MaterialNode = new ScalarToVector4MaterialNode();
  scalarToVector4MaterialNode.addInputConnection(constant1, 'outValue', 'x');
  scalarToVector4MaterialNode.addInputConnection(constant2, 'outValue', 'y');
  scalarToVector4MaterialNode.addInputConnection(constant3, 'outValue', 'z');
  scalarToVector4MaterialNode.addInputConnection(constant4, 'outValue', 'w');

  const endMaterialNode = new EndMaterialNode();
  endMaterialNode.addInputConnection(scalarToVector4MaterialNode, 'outValue', 'inPosition');

  // nodes are intentionally made the order random
  material.setMaterialNodes([endMaterialNode, scalarToVector4MaterialNode, constant1, constant2, constant3, constant4]);

  const returnValues = material.createProgramString();
  expect((returnValues.vertexShaderBody+returnValues.pixelShaderBody).replace(/\s+/g, "")).toEqual(`


void constantVariable_3(
  out float outValue) {
  outValue = 4.0;
}

void constantVariable_2(
  out float outValue) {
  outValue = 3.0;
}

void constantVariable_1(
  out float outValue) {
  outValue = 2.0;
}

void constantVariable_0(
  out float outValue) {
  outValue = 1.0;
}

void scalarToVector4(in float x, in float y, in float z, in float w, out vec4 outValue) {
outValue.x = x;
outValue.y = y;
outValue.z = z;
outValue.w = w;
}

void end(in vec4 inPosition) {
  gl_Position = inPosition;
}

void main() {
float outValue_0_to_x_4;
float outValue_1_to_y_4;
float outValue_2_to_z_4;
float outValue_3_to_w_4;
vec4 outValue_4_to_inPosition_5;
constantVariable_3(outValue_3_to_w_4);
constantVariable_2(outValue_2_to_z_4);
constantVariable_1(outValue_1_to_y_4);
constantVariable_0(outValue_0_to_x_4);
scalarToVector4(outValue_0_to_x_4, outValue_1_to_y_4, outValue_2_to_z_4, outValue_3_to_w_4, outValue_4_to_inPosition_5);
end(outValue_4_to_inPosition_5);

}

void constantVariable_3(
  out float outValue) {
  outValue = 4.0;
}

void constantVariable_2(
  out float outValue) {
  outValue = 3.0;
}

void constantVariable_1(
  out float outValue) {
  outValue = 2.0;
}

void constantVariable_0(
  out float outValue) {
  outValue = 1.0;
}

void scalarToVector4(in float x, in float y, in float z, in float w, out vec4 outValue) {
outValue.x = x;
outValue.y = y;
outValue.z = z;
outValue.w = w;
}

void end(in vec4 inColor) {
  vec4 rt0 = inColor;
  gl_FragColor = rt0;

}

void main() {
end();

}
    `.replace(/\s+/g, ""))
});