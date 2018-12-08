import { ComponentType, ComponentTypeEnum } from "../definitions/ComponentType";
import { CompositionType, CompositionTypeEnum } from "../definitions/CompositionType";

export default class Accessor {
  __bufferView: ObjectUID = 0;
  __byteOffset: number = 0;
  __type: CompositionTypeEnum = CompositionType.Unknown;
  __componentType: ComponentTypeEnum = ComponentType.Unknown;
}
