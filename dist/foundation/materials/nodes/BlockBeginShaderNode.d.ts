import { CompositionTypeEnum } from "../../definitions/CompositionType";
import { ComponentTypeEnum } from "../../definitions/ComponentType";
import AbstractShaderNode from "../core/AbstractShaderNode";
export default class BlockBeginShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
}
