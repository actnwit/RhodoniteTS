import GetVarsShader from "./GetVarsShader";
import { ComponentType } from "../../foundation/definitions/ComponentType";
import { CompositionType } from "../../foundation/definitions/CompositionType";

test('GetVersShader vertex shader works correctly', () => {

  const getVarsShader = new GetVarsShader();
  getVarsShader.addVertexInputAndOutput(
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
  getVarsShader.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'u_viewMatrix',
      isImmediateValue: false
    },
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'viewMatrix',
      isImmediateValue: false
    }
  );

  console.log(getVarsShader.vertexShaderDefinitions);

expect(getVarsShader.vertexShaderDefinitions.replace(/\s+/g, "")).toEqual(`void getVars(
  in vec4 a_position,
  out vec4 position_inLocal,
  in mat4 u_viewMatrix,
  out mat4 viewMatrix
)
{
  position_inLocal = a_position;
  viewMatrix = u_viewMatrix;
}`.replace(/\s+/g, ""))
});

test('GetVersShader pixel shader works correctly', () => {

  const getVarsShader = new GetVarsShader();
  getVarsShader.addPixelInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'v_position',
      isImmediateValue: false
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'position_inWorld',
      isImmediateValue: false
    }
  );
  getVarsShader.addPixelInputAndOutput(
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'u_viewMatrix',
      isImmediateValue: false
    },
    {
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'viewMatrix',
      isImmediateValue: false
    }
  );

  console.log(getVarsShader.pixelShaderDefinitions);

expect(getVarsShader.pixelShaderDefinitions.replace(/\s+/g, "")).toEqual(`void getVars(
  in vec4 v_position,
  out vec4 position_inWorld,
  in mat4 u_viewMatrix,
  out mat4 viewMatrix
)
{
  position_inWorld = v_position;
  viewMatrix = u_viewMatrix;
}`.replace(/\s+/g, ""))
});
