import AbstractMaterialNode from "../core/AbstractMaterialNode";
import { CompositionTypeEnum, ComponentTypeEnum } from "../../../rhodonite";
export default class NormalizeMaterialNode extends AbstractMaterialNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
}
