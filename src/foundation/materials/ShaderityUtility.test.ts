import RnObj, { RnType } from "../../../dist/rhodonite";
import { ShaderityObject } from "shaderity";
import { ComponentType } from "../definitions/ComponentType";
import { CompositionType } from "../definitions/CompositionType";
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

// rn_data: WorldMatrix: componentType=Int, compositionType=Scalar, soloDatum=true, initialValue=(0,1,2)
// rn_data: ShadingModel: componentType=Float, compositionType=Vec3, soloDatum=false, initialValue=(0,1,2,3)

void main() {

}
`;
  const shaderityObject = {code: shaderText} as ShaderityObject;
  const shaderityUtility = Rn.ShaderityUtility.getInstance();
  const array = shaderityUtility.getShaderDataRefection(shaderityObject);
  expect(array[0].semantic.str).toBe('worldMatrix');
  expect(array[0].componentType).toBe(Rn.ComponentType.Int);
  expect(array[0].compositionType).toBe(Rn.CompositionType.Scalar);
  expect(array[0].soloDatum).toBe(true);
  expect(array[0].initialValue.isStrictEqual(new Rn.MutableVector3(0,1,2))).toBe(true);
  expect(array[1].semantic.str).toBe('shadingModel');
  expect(array[1].componentType).toBe(Rn.ComponentType.Float);
  expect(array[1].compositionType).toBe(Rn.CompositionType.Vec3);
  expect(array[1].soloDatum).toBe(false);
  expect(array[1].initialValue.isStrictEqual(new Rn.MutableVector4(0,1,2,3))).toBe(true);
});
