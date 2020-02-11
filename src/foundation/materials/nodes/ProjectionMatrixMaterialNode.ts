import { ShaderSemanticsInfo, ShaderSemantics, ShaderSemanticsEnum } from "../../definitions/ShaderSemantics";
import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import ProjectionMatrixShaderityObject from "../../../webgl/shaderity_shaders/nodes/ProjectionMatrix.vert"

export default class ProjectionMatrixMaterialNode extends AbstractMaterialNode {

  constructor() {
    super(null, 'projectionMatrix', {}, ProjectionMatrixShaderityObject, ProjectionMatrixShaderityObject);

    this.__vertexOutputs.push(
      {
        compositionType: CompositionType.Mat4,
        componentType: ComponentType.Float,
        name: 'outValue',
      });
  }

}


