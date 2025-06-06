import type { ShaderityObject } from 'shaderity';
import Rn from '../../../../dist/esm';
import { ShaderityUtilityWebGL } from './ShaderityUtilityWebGL';

test.skip('ShaderityUtility parse rn_data correctly', async () => {
  const shaderText = `
in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
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
uniform sampler2D u_diffuseColorTexture; // initialValue=(7,white)

void main() {

}
`;
  const shaderityObject = { code: shaderText } as ShaderityObject;

  const array = ShaderityUtilityWebGL.getShaderDataReflection(shaderityObject);
  expect(array.shaderSemanticsInfoArray[0].semantic).toBe('worldMatrix');
  expect(array.shaderSemanticsInfoArray[0].componentType).toBe(Rn.ComponentType.Float);
  expect(array.shaderSemanticsInfoArray[0].compositionType).toBe(Rn.CompositionType.Scalar);
  expect(array.shaderSemanticsInfoArray[0].soloDatum).toBe(false);
  expect(array.shaderSemanticsInfoArray[1].semantic).toBe('shadingModel');
  expect(array.shaderSemanticsInfoArray[1].soloDatum).toBe(false);
  expect(array.shaderSemanticsInfoArray[1].initialValue.isStrictEqual(Rn.MutableScalar.zero())).toBe(true);
  expect(array.shaderSemanticsInfoArray[2].semantic).toBe('screenInfo');
  expect(array.shaderSemanticsInfoArray[2].soloDatum).toBe(true);
  expect(
    array.shaderSemanticsInfoArray[2].initialValue.isStrictEqual(Rn.MutableVector2.fromCopyArray2([100, 100]))
  ).toBe(true);
  expect(array.shaderSemanticsInfoArray[3].semantic).toBe('diffuseColorTexture');
  expect(array.shaderSemanticsInfoArray[3].compositionType).toBe(Rn.CompositionType.Texture2D);
  expect(array.shaderSemanticsInfoArray[3].initialValue[0]).toBe(7);
  // expect(array.shaderSemanticsInfoArray[3].initialValue[1]).toBe(
  //   Rn.AbstractMaterialContent.dummyWhiteTexture
  // );
});
