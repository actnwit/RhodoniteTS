import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionTypeEnum } from "../../definitions/CompositionType";
import { ComponentTypeEnum } from "../../definitions/ComponentType";
export default class ConstantVariableMaterialNode extends AbstractMaterialNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    setDefaultInputValue(inputName: string, value: any): void;
}
