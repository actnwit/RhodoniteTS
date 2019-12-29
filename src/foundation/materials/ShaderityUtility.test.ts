import RnObj, { RnType } from "../../../dist/rhodonite";
import { ShaderityObject } from "shaderity";
import MutableScalar from "../math/MutableScalar";
import MutableVector2 from "../math/MutableVector2";
const Rn: RnType = RnObj as any;

test('ShaderityUtility parse rn_data correctly', async () => {

  const shaderText = `
in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in float a_instanceID;
in vec2 a_texcoord;
in vec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
out vec3 v_color;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;
out vec2 v_texcoord;
out vec3 v_baryCentricCoord;


uniform float u_worldMatrix;
uniform float shadingModel; // initialValue=0
uniform vec2 u_screenInfo; // soloDatum=true, initialValue=(100,100)

void main() {

}
`;
  const shaderityObject = {code: shaderText} as ShaderityObject;
  const shaderityUtility = Rn.ShaderityUtility.getInstance();

  const array = shaderityUtility.getShaderDataRefection(shaderityObject).shaderSemanticsInfoArray;
  expect(array[0].semantic.str).toBe('worldMatrix');
  expect(array[0].componentType).toBe(Rn.ComponentType.Float);
  expect(array[0].compositionType).toBe(Rn.CompositionType.Scalar);
  expect(array[0].soloDatum).toBe(false);
  expect(array[0].none_u_prefix).toBe(false);
  expect(array[1].semantic.str).toBe('shadingModel');
  expect(array[1].soloDatum).toBe(false);
  expect(array[1].initialValue.isStrictEqual(new MutableScalar(0))).toBe(true);
  expect(array[1].none_u_prefix).toBe(true);
  expect(array[2].semantic.str).toBe('screenInfo');
  expect(array[2].soloDatum).toBe(true);
  expect(array[2].initialValue.isStrictEqual(new MutableVector2(100,100))).toBe(true);
  expect(array[2].none_u_prefix).toBe(false);

});
