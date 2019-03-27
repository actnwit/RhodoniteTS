import { ComponentType } from "../../foundation/definitions/ComponentType";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import GetVarsMaterialNode from "./GetVarsMaterialNode";
import Material from "./Material";
import EndMaterialNode from "./EndMaterialNode";
import { VertexAttribute } from "../definitions/VertexAttribute";

test('Material works correctly', () => {

  const material = new Material([]);

  const getVarsMaterialNode = new GetVarsMaterialNode();
  getVarsMaterialNode.addVertexInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: VertexAttribute.Position,
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
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: VertexAttribute.Normal,
      isImmediateValue: false
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'normal_inLocal',
      isImmediateValue: false
    }
  );
  getVarsMaterialNode.addPixelInputAndOutput(
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'redColor',
      isImmediateValue: true,
      immediateValue: 'vec4(1.0, 0.0, 0.0, 0.0)'
    },
    {
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outColor',
      isImmediateValue: false
    }
  );

  const endMaterialNode = new EndMaterialNode();
  endMaterialNode.addVertexInputConnection(getVarsMaterialNode, 'position_inLocal', 'inPosition');
  endMaterialNode.addPixelInputConnection(getVarsMaterialNode, 'outColor', 'inColor');

  material.setMaterialNodes([getVarsMaterialNode, endMaterialNode], getVarsMaterialNode);

  console.log(material.createProgramString());

 expect(material.createProgramString()).toEqual(``)
});
