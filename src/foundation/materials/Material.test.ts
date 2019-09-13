import { ComponentType } from "../../foundation/definitions/ComponentType";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import GetVarsMaterialNode from "./GetVarsMaterialNode";
import Material from "./Material";
import EndMaterialNode from "./EndMaterialNode";
import { VertexAttribute } from "../definitions/VertexAttribute";
import AddMaterialNode from "./AddMaterialNode";
import { ShaderSemantics } from "../definitions/ShaderSemantics";
import MemoryManager from "../core/MemoryManager";
import ModuleManager from "../system/ModuleManager";
/*
test('Material works correctly', async () => {
  await ModuleManager.getInstance().loadModule('webgl');
  MemoryManager.createInstanceIfNotCreated(1, 1, 1, 1);

  Material.registerMaterial('MyMaterial', []);
  const material = Material.createMaterial('MyMaterial')!;

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
 expect((returnValues.vertexShader+returnValues.pixelShader).replace(/\s+/g, "")).toEqual(`precisionhighpfloat;precisionhighpint;uniformboolu_vertexAttributesExistenceArray[11];voidgetVars(outvec4position_inLocal,outvec4normal_inLocal,outvec4baseColor,outvec4specularColor){position_inLocal=vec4(1.0,0.0,0.0,1.0);normal_inLocal=vec4(0.0,0.0,1.0,1.0);baseColor=vec4(0.0,0.2,0.0,1.0);specularColor=vec4(0.0,0.5,0.0,1.0);}voidadd(invec4lfs,invec4rhs,outvec4outValue){outValue=lfs+rhs;}voidend(invec4inPosition){gl_Position=inPosition;}voidmain(){vec4position_inLocal_0_to_lhs_1;vec4normal_inLocal_0_to_rhs_1;vec4baseColor_0_to_lhs_2;vec4specularColor_0_to_rhs_2;vec4outValue_1_to_lhs_3;vec4outValue_2_to_rhs_3;vec4outValue_3_to_inPosition_4;getVars(position_inLocal_0_to_lhs_1,normal_inLocal_0_to_rhs_1,baseColor_0_to_lhs_2,specularColor_0_to_rhs_2);add(position_inLocal_0_to_lhs_1,normal_inLocal_0_to_rhs_1,outValue_1_to_lhs_3);add(baseColor_0_to_lhs_2,specularColor_0_to_rhs_2,outValue_2_to_rhs_3);add(outValue_1_to_lhs_3,outValue_2_to_rhs_3,outValue_3_to_inPosition_4);end(outValue_3_to_inPosition_4);}precisionhighpfloat;precisionhighpint;voidgetVars(outvec4outColor){outColor=vec4(1.0,0.0,0.0,1.0);}voidadd(invec4lfs,invec4rhs,outvec4outValue){outValue=lfs+rhs;}voidend(invec4inColor){vec4rt0=inColor;gl_FragColor=rt0;}voidmain(){vec4outColor_0_to_inColor_4;getVars(outColor_0_to_inColor_4);end(outColor_0_to_inColor_4);}`.replace(/\s+/g, ""))
});
*/

test('MaterialTID are processed correctly', () => {

  // 0st: at earlier test

  // 1st
  Material.registerMaterial('MyMaterial0', []);
  const material0 = Material.createMaterial('MyMaterial0')!;

  // 2nd
  Material.registerMaterial('MyMaterial1', []);
  const material1a = Material.createMaterial('MyMaterial1')!;
  const material1b = Material.createMaterial('MyMaterial1')!;

  expect(material1b.materialTID).toEqual(2);

});
