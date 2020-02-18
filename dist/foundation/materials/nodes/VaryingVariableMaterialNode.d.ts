import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionTypeEnum } from "../../definitions/CompositionType";
import { ComponentTypeEnum } from "../../definitions/ComponentType";
export default class VaryingVariableMaterialNode extends AbstractMaterialNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    setVaryingVariableName(value: any): void;
}
