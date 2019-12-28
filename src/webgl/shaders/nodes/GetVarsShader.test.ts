import RnObj, { RnType } from "../../../../dist/rhodonite";

const Rn: RnType = RnObj as any;

test('GetVersShader vertex shader works correctly', async () => {
  const moduleManager = Rn.ModuleManager.getInstance();
  const webglModule = await moduleManager.loadModule('webgl');
  const getVarsShader = new webglModule.GetVarsShader();
  getVarsShader.addVertexInputAndOutput(
    {
      compositionType: Rn.CompositionType.Vec4,
      componentType: Rn.ComponentType.Float,
      name: 'a_position',
      isImmediateValue: false
    },
    {
      compositionType: Rn.CompositionType.Vec4,
      componentType: Rn.ComponentType.Float,
      name: 'position_inLocal',
      isImmediateValue: false
    }
  );
  getVarsShader.addVertexInputAndOutput(
    {
      compositionType: Rn.CompositionType.Mat4,
      componentType: Rn.ComponentType.Float,
      name: 'u_viewMatrix',
      isImmediateValue: false
    },
    {
      compositionType: Rn.CompositionType.Mat4,
      componentType: Rn.ComponentType.Float,
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

test('GetVersShader pixel shader works correctly', async () => {
  const moduleManager = Rn.ModuleManager.getInstance();
  const webglModule = await moduleManager.loadModule('webgl');
  const getVarsShader = new webglModule.GetVarsShader();
  getVarsShader.addPixelInputAndOutput(
    {
      compositionType: Rn.CompositionType.Vec4,
      componentType: Rn.ComponentType.Float,
      name: 'v_position',
      isImmediateValue: false
    },
    {
      compositionType: Rn.CompositionType.Vec4,
      componentType: Rn.ComponentType.Float,
      name: 'position_inWorld',
      isImmediateValue: false
    }
  );
  getVarsShader.addPixelInputAndOutput(
    {
      compositionType: Rn.CompositionType.Mat4,
      componentType: Rn.ComponentType.Float,
      name: 'u_viewMatrix',
      isImmediateValue: false
    },
    {
      compositionType: Rn.CompositionType.Mat4,
      componentType: Rn.ComponentType.Float,
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
