import { ComponentType } from "../../foundation/definitions/ComponentType";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import GetVarsMaterialNode from "./GetVarsMaterialNode";
import Material from "./Material";
import EndMaterialNode from "./EndMaterialNode";
import { VertexAttribute } from "../definitions/VertexAttribute";
import AddMaterialNode from "./AddMaterialNode";
import { ShaderSemantics } from "../definitions/ShaderSemantics";

test('Material works correctly', () => {

  const material = new Material([]);

  const getVarsMaterialNode = new GetVarsMaterialNode();
  getVarsMaterialNode.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'hoge',
      isImmediateValue: true,
      immediateValue: 'vec4(1.0, 0.0, 0.0, 1.0)'
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
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'Muda',
      isImmediateValue: true,
      immediateValue: 'vec4(0.0, 0.0, 1.0, 1.0)'
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'normal_inLocal',
      isImmediateValue: false
    }
  );
  getVarsMaterialNode.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'huga',
      isImmediateValue: true,
      immediateValue: 'vec4(0.0, 0.2, 0.0, 1.0)'
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'baseColor',
      isImmediateValue: false
    }
  );
  getVarsMaterialNode.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'huga2',
      isImmediateValue: true,
      immediateValue: 'vec4(0.0, 0.5, 0.0, 1.0)'
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'specularColor',
      isImmediateValue: false
    }
  );
  getVarsMaterialNode.addPixelInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'redColor',
      isImmediateValue: true,
      immediateValue: 'vec4(1.0, 0.0, 0.0, 1.0)'
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outColor',
      isImmediateValue: false
    }
  );

  const addMaterialNode = new AddMaterialNode();
  addMaterialNode.addVertexInputConnection(getVarsMaterialNode, 'position_inLocal', 'lhs');
  addMaterialNode.addVertexInputConnection(getVarsMaterialNode, 'normal_inLocal', 'rhs');

  const addMaterialNode2 = new AddMaterialNode();
  addMaterialNode2.addVertexInputConnection(getVarsMaterialNode, 'baseColor', 'lhs');
  addMaterialNode2.addVertexInputConnection(getVarsMaterialNode, 'specularColor', 'rhs');

  const addMaterialNode3 = new AddMaterialNode();
  addMaterialNode3.addVertexInputConnection(addMaterialNode, 'outValue', 'lhs');
  addMaterialNode3.addVertexInputConnection(addMaterialNode2, 'outValue', 'rhs');

  const endMaterialNode = new EndMaterialNode();
  endMaterialNode.addVertexInputConnection(addMaterialNode3, 'outValue', 'inPosition');
  endMaterialNode.addPixelInputConnection(getVarsMaterialNode, 'outColor', 'inColor');

  // nodes are intentionally made the order random
  material.setMaterialNodes([endMaterialNode, addMaterialNode2, addMaterialNode3, addMaterialNode, getVarsMaterialNode]);

  const returnValues = material.createProgramString();
 expect((returnValues.vertexShader+returnValues.pixelShader).replace(/\s+/g, "")).toEqual(`
 precision highp float;
 

void getVars(
out vec4 position_inLocal,
out vec4 normal_inLocal,
out vec4 baseColor,
out vec4 specularColor
)
{
position_inLocal = vec4(1.0, 0.0, 0.0, 1.0);
normal_inLocal = vec4(0.0, 0.0, 1.0, 1.0);
baseColor = vec4(0.0, 0.2, 0.0, 1.0);
specularColor = vec4(0.0, 0.5, 0.0, 1.0);
}
 void add(in vec4 lfs, in vec4 rhs, out vec4 outValue) {
   outValue = lfs + rhs;
 }
 
 void end(in vec4 inPosition) {
   gl_Position = inPosition;
 }
 
 void main() {
 vec4 position_inLocal_0_to_lhs_1;
vec4 normal_inLocal_0_to_rhs_1;
vec4 baseColor_0_to_lhs_2;
vec4 specularColor_0_to_rhs_2;
vec4 outValue_1_to_lhs_3;
vec4 outValue_2_to_rhs_3;
vec4 outValue_3_to_inPosition_4;
getVars(position_inLocal_0_to_lhs_1, normal_inLocal_0_to_rhs_1, baseColor_0_to_lhs_2, specularColor_0_to_rhs_2);
add(position_inLocal_0_to_lhs_1, normal_inLocal_0_to_rhs_1, outValue_1_to_lhs_3);
add(baseColor_0_to_lhs_2, specularColor_0_to_rhs_2, outValue_2_to_rhs_3);
add(outValue_1_to_lhs_3, outValue_2_to_rhs_3, outValue_3_to_inPosition_4);
end(outValue_3_to_inPosition_4);

 }
 




 precision highp float;
 
void getVars(
out vec4 outColor
)
{
outColor = vec4(1.0, 0.0, 0.0, 1.0);
}
 void add(in vec4 lfs, in vec4 rhs, out vec4 outValue) {
   outValue = lfs + rhs;
 }
 
 void end(in vec4 inColor) {
   vec4 rt0 = inColor;
   gl_FragColor = rt0;

 }
 
 void main() {
 vec4 outColor_0_to_inColor_4;
getVars(outColor_0_to_inColor_4);
end(outColor_0_to_inColor_4);

 }
 `.replace(/\s+/g, ""))
});
