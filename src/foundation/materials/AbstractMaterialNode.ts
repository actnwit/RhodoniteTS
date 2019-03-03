import RnObject from "../core/Object";
import { ShaderSemanticsInfo } from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";

export default abstract class AbstractMaterialNode extends RnObject {
  private __semantics: ShaderSemanticsInfo[] = [];
  private __shaderNode: ShaderNodeEnum[] = [];

  constructor(semantics: ShaderSemanticsInfo[]) {
    super(false);
    this.__semantics = semantics;
  }
}
