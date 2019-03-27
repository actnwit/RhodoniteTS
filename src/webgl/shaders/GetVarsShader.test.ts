import GetVarsShader from "./GetVarsShader";
import { ComponentType } from "../../foundation/definitions/ComponentType";
import { CompositionType } from "../../foundation/definitions/CompositionType";

test('GetVersShader vertex shader works correctly', () => {

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

expect(getVarsShader.vertexShaderDefinitions).toEqual(`function getVars(
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

test('GetVersShader pixel shader works correctly', () => {

  const getVarsShader = new GetVarsShader();
  getVarsShader.addPixelInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'v_position'
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'position_inWorld'
    }
  );
  getVarsShader.addPixelInputAndOutput(
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

  console.log(getVarsShader.pixelShaderDefinitions);

expect(getVarsShader.pixelShaderDefinitions).toEqual(`function getVars(
  in vec4 v_position,
  out vec4 position_inWorld,
  in mat4 u_viewMatrix,
  out mat4 viewMatrix
)
{
  position_inWorld = v_position;
  viewMatrix = u_viewMatrix;
}`)
});
