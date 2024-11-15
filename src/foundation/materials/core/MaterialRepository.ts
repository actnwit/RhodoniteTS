import {
  Count,
  Index,
  IndexOf16Bytes,
  MaterialSID,
  MaterialTID,
  MaterialUID,
} from '../../../types/CommonTypes';
import { Config } from '../../core/Config';
import { MemoryManager } from '../../core/MemoryManager';
import { BufferUse } from '../../definitions/BufferUse';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ShaderSemanticsIndex, ShaderSemanticsName } from '../../definitions/ShaderSemantics';
import { calcAlignedByteLength, ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { MathClassUtil } from '../../math/MathClassUtil';
import type { Accessor } from '../../memory/Accessor';
import type { BufferView } from '../../memory/BufferView';
import { Is } from '../../misc/Is';
import { Logger } from '../../misc/Logger';
import type { AbstractMaterialContent } from './AbstractMaterialContent';
import { Material } from './Material';
import type { MaterialTypeName } from './MaterialTypes';

export class MaterialRepository {
  ///
  /// static members
  ///
  private static __materialMap: Map<MaterialUID, WeakRef<Material>> = new Map();
  private static __instances: Map<MaterialTypeName, Map<MaterialSID, WeakRef<Material>>> =
    new Map();
  private static __materialTids: Map<MaterialTypeName, MaterialTID> = new Map();
  private static __materialInstanceCountOfType: Map<MaterialTypeName, Count> = new Map();
  private static __materialNodes: Map<MaterialTypeName, AbstractMaterialContent | undefined> =
    new Map();
  private static __maxInstances: Map<MaterialTypeName, Count> = new Map();
  private static __bufferViews: Map<MaterialTypeName, BufferView> = new Map();
  private static __accessors: Map<MaterialTypeName, Map<ShaderSemanticsName, Accessor>> = new Map();
  private static __materialTidCount = -1;
  private static __materialUidCount = -1;

  /**
   * Registers the material type.
   * @param materialTypeName The type name of the material.
   * @param materialNodes The material nodes to register.
   * @param maxInstancesNumber The maximum number to create the material instances.
   */
  public static registerMaterial(
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    maxInstanceNumber: number = Config.maxMaterialInstanceForEachType
  ): boolean {
    if (!MaterialRepository.__materialNodes.has(materialTypeName)) {
      MaterialRepository.__registerInner(materialTypeName, materialNode, maxInstanceNumber);

      return true;
    } else {
      // console.info(`${materialTypeName} is already registered.`);
      return false;
    }
  }

  public static forceRegisterMaterial(
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    maxInstanceNumber: number = Config.maxMaterialInstanceForEachType
  ): boolean {
    this.__registerInner(materialTypeName, materialNode, maxInstanceNumber);
    return true;
  }

  public static isRegisteredMaterialType(materialTypeName: string) {
    return MaterialRepository.__materialNodes.has(materialTypeName);
  }

  public static getMaterialByMaterialUid(materialUid: MaterialSID): Material | undefined {
    return this.__materialMap.get(materialUid)?.deref();
  }

  public static getAllMaterials() {
    return Array.from(MaterialRepository.__materialMap.values());
  }

  /**
   * Creates an instance of this Material class.
   * @param materialTypeName The material type to create.
   * @param materialNodes_ The material nodes to add to the created material.
   */
  public static createMaterial(
    materialTypeName: string,
    materialNode: AbstractMaterialContent
  ): Material {
    // get the count of instance for the material type
    let countOfThisType = MaterialRepository.__materialInstanceCountOfType.get(
      materialTypeName
    ) as number;
    const material = new Material(
      MaterialRepository.__materialTids.get(materialTypeName)!,
      ++MaterialRepository.__materialUidCount,
      countOfThisType++,
      materialTypeName,
      materialNode
    );

    this.__initializeMaterial(material, countOfThisType);

    return material;
  }

  public static isFullOrOverOfThisMaterialType(materialTypeName: string): boolean {
    const countOfThisType = MaterialRepository.__materialInstanceCountOfType.get(materialTypeName);
    if (Is.not.exist(countOfThisType)) {
      return false;
    }
    const maxCountOfThisType = MaterialRepository.__maxInstances.get(materialTypeName);
    if (Is.not.exist(maxCountOfThisType)) {
      return false;
    }

    return countOfThisType >= maxCountOfThisType;
  }

  static isMaterialCompatible(
    currentMaterial: Material,
    newMaterialNode: AbstractMaterialContent
  ): boolean {
    const existingMaterial = MaterialRepository.__materialMap
      .get(currentMaterial.materialUID)
      ?.deref();
    if (Is.not.exist(existingMaterial)) {
      return false;
    }

    const existingShaderSemanticsInfoList = Array.from(existingMaterial._allFieldsInfo.values());
    const newShaderSemanticsInfoList = newMaterialNode._semanticsInfoArray;
    if (
      JSON.stringify(existingShaderSemanticsInfoList) !== JSON.stringify(newShaderSemanticsInfoList)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Initialize Material Method
   */
  private static __initializeMaterial(material: Material, countOfThisType: Count) {
    // Set name
    material.tryToSetUniqueName(material.__materialTypeName, true);

    // Set meta data to MaterialRepository
    {
      MaterialRepository.__materialMap.set(material.materialUID, new WeakRef(material));

      // set this material instance for the material type
      let map = MaterialRepository.__instances.get(material.__materialTypeName);
      if (Is.not.exist(map)) {
        map = new Map();
        MaterialRepository.__instances.set(material.materialTypeName, map);
      }
      map.set(material.materialSID, new WeakRef(material));

      // set the count of instance for the material type
      MaterialRepository.__materialInstanceCountOfType.set(
        material.materialTypeName,
        countOfThisType
      );
    }

    // Set semanticsInfo and shaderVariables to the material instance
    if (Is.exist(material._materialContent)) {
      const semanticsInfoArray = material._materialContent._semanticsInfoArray;
      const accessorMap = MaterialRepository.__accessors.get(material.materialTypeName);
      semanticsInfoArray.forEach((semanticsInfo) => {
        material._allFieldsInfo.set(semanticsInfo.semantic, semanticsInfo);
        if (!semanticsInfo.soloDatum) {
          const accessor = accessorMap!.get(semanticsInfo.semantic) as Accessor;
          const typedArray = accessor.takeOne() as Float32Array;
          const shaderVariable = {
            info: semanticsInfo,
            value: MathClassUtil.initWithFloat32Array(
              semanticsInfo.initialValue,
              semanticsInfo.initialValue,
              typedArray,
              semanticsInfo.compositionType
            ),
          };
          material._allFieldVariables.set(semanticsInfo.semantic, shaderVariable);
          if (!semanticsInfo.isInternalSetting) {
            material._autoFieldVariablesOnly.set(semanticsInfo.semantic, shaderVariable);
          }
        }
      });
    }
  }

  static getLocationOffsetOfMemberOfMaterial(
    materialTypeName: string,
    propertyName: ShaderSemanticsName
  ): IndexOf16Bytes {
    const map = MaterialRepository.__instances.get(materialTypeName)!;
    const materialRef = Array.from(map.values()).find((m) => m.deref() !== undefined); // find an actual exist material
    if (Is.not.exist(materialRef?.deref())) {
      Logger.warn(
        `Material is not found. getLocationOffsetOfMemberOfMaterial returns invalid 0 value. materialTypeName: ${materialTypeName}`
      );
      return 0;
    }
    const material = materialRef.deref()!;
    const info = material._allFieldsInfo.get(propertyName)!;
    if (info.soloDatum) {
      const value = Material._soloDatumFields.get(material.materialTypeName)!.get(propertyName);
      return (value!.value._v as Float32Array).byteOffset / 4 / 4;
    } else {
      const properties = this.__accessors.get(materialTypeName);
      const accessor = properties!.get(propertyName);
      return accessor!.byteOffsetInBuffer / 4 / 4;
    }
  }

  private static __registerInner(
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    maxInstanceNumber: number
  ) {
    const materialTid = ++MaterialRepository.__materialTidCount;
    MaterialRepository.__materialNodes.set(materialTypeName, materialNode);
    MaterialRepository.__materialTids.set(materialTypeName, materialTid);
    MaterialRepository.__maxInstances.set(materialTypeName, maxInstanceNumber);

    MaterialRepository.__allocateBufferView(materialTypeName, materialNode);
    MaterialRepository.__materialInstanceCountOfType.set(materialTypeName, 0);
  }

  private static __allocateBufferView(
    materialTypeName: string,
    materialNode: AbstractMaterialContent
  ) {
    // Calculate a BufferView size to take
    let totalByteLength = 0;
    const alignedByteLengthAndSemanticInfoArray: {
      alignedByte: number;
      semanticInfo: ShaderSemanticsInfo;
    }[] = [];
    for (const semanticInfo of materialNode._semanticsInfoArray) {
      const alignedByteLength = calcAlignedByteLength(semanticInfo);
      let dataCount = 1;
      if (!semanticInfo.soloDatum) {
        dataCount = MaterialRepository.__maxInstances.get(materialTypeName)!;
      }

      totalByteLength += alignedByteLength * dataCount;
      alignedByteLengthAndSemanticInfoArray.push({
        alignedByte: alignedByteLength,
        semanticInfo: semanticInfo,
      });
    }

    if (!this.__accessors.has(materialTypeName)) {
      this.__accessors.set(materialTypeName, new Map());
    }

    // take A Buffer View from GPUInstanceData buffer, or reuse it if it already exists
    const buffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.GPUInstanceData);
    let bufferView;
    if (this.__bufferViews.has(materialTypeName)) {
      bufferView = this.__bufferViews.get(materialTypeName);
    } else {
      const result = buffer.takeBufferView({
        byteLengthToNeed: totalByteLength,
        byteStride: 0,
      });
      bufferView = result.unwrapForce();
      this.__bufferViews.set(materialTypeName, bufferView);
    }

    // Take Accessors and register it
    for (let i = 0; i < alignedByteLengthAndSemanticInfoArray.length; i++) {
      const alignedByte = alignedByteLengthAndSemanticInfoArray[i].alignedByte;
      const semanticInfo = alignedByteLengthAndSemanticInfoArray[i].semanticInfo;

      let count = 1;
      if (!semanticInfo.soloDatum) {
        count = MaterialRepository.__maxInstances.get(materialTypeName)!;
      }
      let maxArrayLength = semanticInfo.arrayLength;
      if (CompositionType.isArray(semanticInfo.compositionType) && maxArrayLength == null) {
        maxArrayLength = 100;
      }
      // take an Accessor
      const accessor = bufferView!
        .takeAccessor({
          compositionType: semanticInfo.compositionType,
          componentType: ComponentType.Float,
          count: count,
          byteStride: alignedByte,
          arrayLength: maxArrayLength,
        })
        .unwrapForce();

      if (semanticInfo.soloDatum) {
        const typedArray = accessor.takeOne() as Float32Array;
        let map = Material._soloDatumFields.get(materialTypeName);
        if (map == null) {
          map = new Map();
          Material._soloDatumFields.set(materialTypeName, map);
        }

        map.set(semanticInfo.semantic, {
          info: semanticInfo,
          value: MathClassUtil.initWithFloat32Array(
            semanticInfo.initialValue,
            semanticInfo.initialValue,
            typedArray,
            semanticInfo.compositionType
          ),
        });
      } else {
        // Set an accessor to this.__accessors
        const properties = this.__accessors.get(materialTypeName)!;
        properties.set(semanticInfo.semantic, accessor);
      }
    }

    return bufferView;
  }

  static _makeShaderInvalidateToAllMaterials() {
    for (const material of MaterialRepository.__materialMap.values()) {
      material.deref()?.makeShadersInvalidate();
    }
  }
}
