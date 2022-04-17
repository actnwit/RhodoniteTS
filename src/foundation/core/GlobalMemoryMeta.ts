import { BufferUse } from "../definitions";
import { Material } from "../materials";
import { Buffer } from "../memory";
import { Config } from "./Config";
import { MemoryManager } from "./MemoryManager";

export class GlobalMemoryMeta {
  private static __offset_DataTextureWidth = 0; // 4bytes unit
  private static __offset_DataTextureHeight = 1;
  private static __offset_propertyWorldMatrixInSceneGraphComponent = 2;
  private static __offset_propertyNormalMatrixInSceneGraphComponent = 3;
  private static __buffer: Buffer;

  static setupMetaBuffer() {
    this.__buffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.Meta);
  }

  static getOffsetOfDataTextureWidth() {
    return this.__offset_DataTextureWidth;
  }

  static getOffsetOfDataTextureHeight() {
    return this.__offset_DataTextureHeight;
  }

  static getOffsetOfPropertyWorldMatrixInSceneGraphComponent() {
    return this.__offset_propertyWorldMatrixInSceneGraphComponent;
  }

  static getOffsetOfPropertyNormalMatrixInSceneGraphComponent() {
    return this.__offset_propertyNormalMatrixInSceneGraphComponent;
  }

  static getOffsetOfGlobalMemoryArea() {
    return GlobalMemoryMeta.getOffsetOfPropertyNormalMatrixInSceneGraphComponent();
  }

  static getOffsetOfPropertyInGlobalMemory(arg: {
    materialPropertyIndex: number,
    material?: Material,
    isGlobalData?: boolean,
  }) {
    let offset = GlobalMemoryMeta.getOffsetOfGlobalMemoryArea();
    if (arg.isGlobalData) {
      offset += 0;
    } else {
      offset += Config.maxMaterialTypeNumber;
      const propertyN = Material.getTheNumberOfPropertiesOfTheMaterialType(arg.material!.materialTypeName, arg.materialPropertyIndex)
      const index = arg.material!.materialTID * propertyN + arg.materialPropertyIndex;
      offset += index;
    }

    return offset;
  }

}
