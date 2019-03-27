import RnObject from "../core/RnObject";
import { ShaderSemanticsInfo } from "../definitions/ShaderSemantics";
import { ShaderNodeEnum } from "../definitions/ShaderNode";
import { CompositionTypeEnum, ComponentTypeEnum } from "../main";
import { CompositionType } from "../definitions/CompositionType";
import { ComponentType } from "../definitions/ComponentType";

type ShaderSocket = {
  compositionType: CompositionTypeEnum,
  componentType: ComponentTypeEnum,
  name: string
}

export default abstract class AbstractMaterialNode extends RnObject {
  private __semantics: ShaderSemanticsInfo[] = [];
  private __shaderNode: ShaderNodeEnum[] = [];
  protected __inputs: ShaderSocket[] = [];
  protected __outputs: ShaderSocket[] = [];

  constructor(semantics: ShaderSemanticsInfo[]) {
    super();
    this.__semantics = semantics;
  }

  get _semanticsInfoArray() {
    return this.__semantics;
  }
}
