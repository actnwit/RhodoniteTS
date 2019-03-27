import { ComponentType } from "../../foundation/definitions/ComponentType";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import GetVarsMaterialNode from "./GetVarsMaterialNode";
import Material from "./Material";
import EndMaterialNode from "./EndMaterialNode";

test('Material works correctly', () => {

  const material = new Material([]);

  const getVarsMaterialNode = new GetVarsMaterialNode();
  getVarsMaterialNode.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'a_position',
      isImmediateValue: false
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'position_inLocal',
      isImmediateValue: false
    }
  );
  getVarsMaterialNode.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'redColor',
      isImmediateValue: true,
      immediateValue: 'vec4(1.0, 0.0, 0.0, 0.0)'
    },
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'outColor',
      isImmediateValue: false
    }
  );

  const endMaterialNode = new EndMaterialNode();
  endMaterialNode.addVertexInputConnection(getVarsMaterialNode, 'position_inLocal');
  endMaterialNode.addPixelInputConnection(getVarsMaterialNode, 'position_inLocal');

  console.log(getVarsMaterialNode.shader.vertexShaderDefinitions);

// expect(getVarsMaterialNode.shader.vertexShaderDefinitions).toEqual(`function getVars(
//   in vec4 a_position,
//   out vec4 position_inLocal,
//   in mat4 u_viewMatrix,
//   out mat4 viewMatrix
// )
// {
//   position_inLocal = a_position;
//   viewMatrix = u_viewMatrix;
// }`)
});
