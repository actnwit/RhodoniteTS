import { CompositionTypeEnum } from "../../definitions/CompositionType";
import { ComponentTypeEnum } from "../../definitions/ComponentType";
import AbstractShaderNode from "../core/AbstractShaderNode";
export default class BlockBeginShaderNode extends AbstractShaderNode {
    private __valueInputs;
    private __valueOutputs;
    constructor();
    addInputAndOutput(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum): void;
}
