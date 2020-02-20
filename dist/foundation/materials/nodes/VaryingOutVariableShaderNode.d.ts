import { CompositionTypeEnum } from "../../definitions/CompositionType";
import { ComponentTypeEnum } from "../../definitions/ComponentType";
import AbstractShaderNode from "../core/AbstractShaderNode";
export default class VaryingOutVariableShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    setVaryingVariableName(value: any): void;
}
