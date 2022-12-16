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
import { ShaderSemanticsIndex } from '../../definitions/ShaderSemantics';
import { calcAlignedByteLength, ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { MathClassUtil } from '../../math/MathClassUtil';
import { Accessor } from '../../memory/Accessor';
import { BufferView } from '../../memory/BufferView';
import { Is } from '../../misc/Is';
import { AbstractMaterialContent } from './AbstractMaterialContent';
import { Material } from './Material';
import { MaterialTypeName } from './MaterialTypes';

export class MaterialRepository {
  ///
  /// static members
  ///
  private static __materialMap: Map<MaterialUID, Material> = new Map();
  private static __instances: Map<MaterialTypeName, Map<MaterialSID, Material>> = new Map();
  private static __instancesByTypes: Map<MaterialTypeName, Material> = new Map();
  private static __materialTids: Map<MaterialTypeName, MaterialTID> = new Map();
  private static __materialInstanceCountOfType: Map<MaterialTypeName, Count> = new Map();
  private static __materialTypes: Map<MaterialTypeName, AbstractMaterialContent | undefined> =
    new Map();
  private static __maxInstances: Map<MaterialTypeName, MaterialSID> = new Map();
  private static __bufferViews: Map<MaterialTypeName, BufferView> = new Map();
  private static __accessors: Map<MaterialTypeName, Map<ShaderSemanticsIndex, Accessor>> =
    new Map();
  private static __materialTidCount = -1;
  private static __materialUidCount = -1;

  /**
   * Registers the material type.
   * @param materialTypeName The type name of the material.
   * @param materialNodes The material nodes to register.
   * @param maxInstancesNumber The maximum number to create the material instances.
   */
  static registerMaterial(
    materialTypeName: string,
    materialNode?: AbstractMaterialContent,
    maxInstanceNumber: number = Config.maxMaterialInstanceForEachType
  ) {
    if (!MaterialRepository.__materialTypes.has(materialTypeName)) {
      MaterialRepository.__materialTypes.set(materialTypeName, materialNode);

      const materialTid = ++MaterialRepository.__materialTidCount;
      MaterialRepository.__materialTids.set(materialTypeName, materialTid);
      MaterialRepository.__maxInstances.set(materialTypeName, maxInstanceNumber);

      if (Is.exist(materialNode)) {
        MaterialRepository.__allocateBufferView(materialTypeName, materialNode);
      }
      MaterialRepository.__materialInstanceCountOfType.set(materialTypeName, 0);

      return true;
    } else {
      console.info(`${materialTypeName} is already registered.`);
      return false;
    }
  }

  static forceRegisterMaterial(
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    maxInstanceNumber: number = Config.maxMaterialInstanceForEachType
  ) {
    MaterialRepository.__materialTypes.set(materialTypeName, materialNode);

    const materialTid = ++MaterialRepository.__materialTidCount;
    MaterialRepository.__materialTids.set(materialTypeName, materialTid);
    MaterialRepository.__maxInstances.set(materialTypeName, maxInstanceNumber);

    MaterialRepository.__allocateBufferView(materialTypeName, materialNode);
    MaterialRepository.__materialInstanceCountOfType.set(materialTypeName, 0);

    return true;
  }

  private static __allocateBufferView(
    materialTypeName: string,
    materialNode: AbstractMaterialContent
  ) {
    let totalByteLength = 0;
    const alignedByteLengthAndSemanticInfoArray = [];
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
      const accessor = bufferView!
        .takeAccessor({
          compositionType: semanticInfo.compositionType,
          componentType: ComponentType.Float,
          count: count,
          byteStride: alignedByte,
          arrayLength: maxArrayLength,
        })
        .unwrapForce();

      const propertyIndex = MaterialRepository._getPropertyIndex(semanticInfo);
      if (semanticInfo.soloDatum) {
        const typedArray = accessor.takeOne() as Float32Array;
        let map = Material._soloDatumFields.get(materialTypeName);
        if (map == null) {
          map = new Map();
          Material._soloDatumFields.set(materialTypeName, map);
        }

        map.set(MaterialRepository._getPropertyIndex(semanticInfo), {
          info: semanticInfo,
          value: MathClassUtil.initWithFloat32Array(
            semanticInfo.initialValue,
            semanticInfo.initialValue,
            typedArray,
            semanticInfo.compositionType
          ),
        });
      } else {
        const properties = this.__accessors.get(materialTypeName)!;
        properties.set(propertyIndex, accessor);
      }
    }

    return bufferView;
  }

  static isRegisteredMaterialType(materialTypeName: string) {
    return MaterialRepository.__materialTypes.has(materialTypeName);
  }

  public static getMaterialByMaterialUid(materialUid: MaterialSID) {
    return this.__materialMap.get(materialUid);
  }

  static getAllMaterials() {
    return Array.from(MaterialRepository.__materialMap.values());
  }

  /**
   * Creates an instance of this Material class.
   * @param materialTypeName The material type to create.
   * @param materialNodes_ The material nodes to add to the created material.
   */
  static createMaterial(materialTypeName: string, materialNode_?: AbstractMaterialContent) {
    let materialNode = materialNode_;
    if (!materialNode) {
      materialNode = MaterialRepository.__materialTypes.get(materialTypeName)!;
    }

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

    this.__initialize(material, countOfThisType);

    return material;
  }

  /**
   * Initialize Method
   */
  private static __initialize(material: Material, countOfThisType: Count) {
    MaterialRepository.__materialMap.set(material.materialUID, material);
    MaterialRepository.__instancesByTypes.set(material.materialTypeName, material);

    material.tryToSetUniqueName(material.__materialTypeName, true);

    // set this material instance for the material type
    let map = MaterialRepository.__instances.get(material.__materialTypeName);
    if (Is.not.exist(map)) {
      map = new Map();
      MaterialRepository.__instances.set(material.materialTypeName, map);
    }
    map.set(material.materialSID, material);

    // set the count of instance for the material type
    MaterialRepository.__materialInstanceCountOfType.set(
      material.materialTypeName,
      countOfThisType
    );

    if (Is.exist(material._materialContent)) {
      const semanticsInfoArray = material._materialContent._semanticsInfoArray;
      const accessorMap = MaterialRepository.__accessors.get(material.materialTypeName);
      semanticsInfoArray.forEach((semanticsInfo) => {
        const propertyIndex = MaterialRepository._getPropertyIndex(semanticsInfo);
        material._allFieldsInfo.set(propertyIndex, semanticsInfo);
        if (!semanticsInfo.soloDatum) {
          const accessor = accessorMap!.get(propertyIndex) as Accessor;
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
          material._allFieldVariables.set(propertyIndex, shaderVariable);
          if (!semanticsInfo.isCustomSetting) {
            material._autoFieldVariablesOnly.set(propertyIndex, shaderVariable);
          }
        }
      });
    }
  }

  static getLocationOffsetOfMemberOfMaterial(
    materialTypeName: string,
    propertyIndex: Index
  ): IndexOf16Bytes {
    const material = MaterialRepository.__instancesByTypes.get(materialTypeName)!;
    const info = material._allFieldsInfo.get(propertyIndex)!;
    if (info.soloDatum) {
      const value = Material._soloDatumFields.get(material.materialTypeName)!.get(propertyIndex);
      return (value!.value._v as Float32Array).byteOffset / 4 / 4;
    } else {
      const properties = this.__accessors.get(materialTypeName);
      const accessor = properties!.get(propertyIndex);
      return accessor!.byteOffsetInBuffer / 4 / 4;
    }
  }

  /**
   * @internal
   */
  static _getPropertyIndex(semanticInfo: ShaderSemanticsInfo) {
    const propertyIndex = semanticInfo.semantic.index;
    return propertyIndex;
  }
}
