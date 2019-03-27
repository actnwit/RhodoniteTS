import GetVarsShader from "./GetVarsShader";
import { ComponentType } from "../../foundation/definitions/ComponentType";
import { CompositionType } from "../../foundation/definitions/CompositionType";

test('GetVersShader works correctly', () => {

  const getVarsShader = new GetVarsShader();
  getVarsShader.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'a_position'
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'position_inLocal'
    }
  );
  getVarsShader.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'u_viewMatrix'
    },
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'viewMatrix'
    }
  );

  console.log(getVarsShader.vertexShaderDefinitions);

expect(getVarsShader.vertexShaderDefinitions).toEqual(`function getVers(
  in vec4 a_position,
  out vec4 position_inLocal,
  in mat4 u_viewMatrix,
  out mat4 viewMatrix
)
{
  position_inLocal = a_position;
  viewMatrix = u_viewMatrix;
}`)
});
