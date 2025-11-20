import type { Count, Index, IndexOf16Bytes, MaterialSID, MaterialTID, MaterialUID } from '../../../types/CommonTypes';
import { Config } from '../../core/Config';
import { MemoryManager } from '../../core/MemoryManager';
import { BufferUse } from '../../definitions/BufferUse';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ShaderSemanticsIndex, type ShaderSemanticsName } from '../../definitions/ShaderSemantics';
import { type ShaderSemanticsInfo, calcAlignedByteLength } from '../../definitions/ShaderSemanticsInfo';
import { MathClassUtil } from '../../math/MathClassUtil';
import type { Accessor } from '../../memory/Accessor';
import type { BufferView } from '../../memory/BufferView';
import { Is } from '../../misc/Is';
import { Logger } from '../../misc/Logger';
import type { AbstractMaterialContent } from './AbstractMaterialContent';
import { Material } from './Material';
import type { IndexInTheDataView, IndexOfBufferViews, MaterialTypeName } from './MaterialTypes';

/**
 * Repository class for managing material types and instances.
 * Handles registration, creation, and lifecycle management of materials.
 */
export class MaterialRepository {
  ///
  /// static members
  ///
  private static __materialMap: Map<MaterialUID, WeakRef<Material>> = new Map();
  private static __instances: Map<MaterialTypeName, Map<MaterialSID, WeakRef<Material>>> = new Map();
  private static __materialTids: Map<MaterialTypeName, MaterialTID> = new Map();
  private static __materialInstanceCountOfType: Map<MaterialTypeName, Count> = new Map();
  private static __materialNodes: Map<MaterialTypeName, AbstractMaterialContent | undefined> = new Map();
  private static __materialCountPerBufferViewMap: Map<MaterialTypeName, Count> = new Map();
  private static __bufferViews: Map<MaterialTypeName, Map<IndexOfBufferViews, BufferView>> = new Map();
  private static __accessors: Map<MaterialTypeName, Map<IndexOfBufferViews, Map<ShaderSemanticsName, Accessor>>> =
    new Map();
  private static __materialTidCount = -1;
  private static __materialUidCount = -1;

  /**
   * Registers a new material type with the repository.
   * This method creates the necessary data structures and allocates memory for the material type.
   * If the material type is already registered, the registration will be skipped.
   *
   * @param materialTypeName - The unique name identifier for the material type
   * @param materialNode - The material content definition containing shader semantics and properties
   * @param materialCountPerBufferView - The number of materials per buffer view
   * @returns True if the material type was successfully registered, false if it was already registered
   */
  public static registerMaterial(
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    materialCountPerBufferView: number = Config.materialCountPerBufferView
  ): boolean {
    if (!MaterialRepository.__materialNodes.has(materialTypeName)) {
      MaterialRepository.__registerInner(materialTypeName, materialNode, materialCountPerBufferView);

      return true;
    }
    // console.info(`${materialTypeName} is already registered.`);
    return false;
  }

  /**
   * Forcibly registers a material type, overwriting any existing registration.
   * This method bypasses the duplicate check and always performs the registration.
   * Use with caution as it can replace existing material type definitions.
   *
   * @param materialTypeName - The unique name identifier for the material type
   * @param materialNode - The material content definition containing shader semantics and properties
   * @param materialCountPerBufferView - The number of materials per buffer view
   * @returns Always returns true as the registration is forced
   */
  public static forceRegisterMaterial(
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    materialCountPerBufferView: number = Config.materialCountPerBufferView
  ): boolean {
    this.__registerInner(materialTypeName, materialNode, materialCountPerBufferView);
    return true;
  }

  /**
   * Checks if a material type is already registered in the repository.
   *
   * @param materialTypeName - The name of the material type to check
   * @returns True if the material type is registered, false otherwise
   */
  public static isRegisteredMaterialType(materialTypeName: string) {
    return MaterialRepository.__materialNodes.has(materialTypeName);
  }

  /**
   * Retrieves a material instance by its unique identifier.
   * Returns undefined if the material doesn't exist or has been garbage collected.
   *
   * @param materialUid - The unique identifier of the material to retrieve
   * @returns The material instance if found and still alive, undefined otherwise
   */
  public static getMaterialByMaterialUid(materialUid: MaterialSID): Material | undefined {
    return this.__materialMap.get(materialUid)?.deref();
  }

  /**
   * Gets all currently active material instances from the repository.
   * Returns an array of WeakRef objects that may contain undefined values
   * if materials have been garbage collected.
   *
   * @returns Array of WeakRef objects pointing to all registered materials
   */
  public static getAllMaterials() {
    return Array.from(MaterialRepository.__materialMap.values());
  }

  /**
   * Creates a new material instance of the specified type.
   * The material type must be registered before calling this method.
   * This method handles instance counting and initialization.
   *
   * @param materialTypeName - The name of the registered material type
   * @param materialNode - The material content definition for this specific instance
   * @returns A new Material instance with proper initialization
   * @throws Error if the material type is not registered or maximum instances exceeded
   */
  public static createMaterial(materialTypeName: string, materialNode: AbstractMaterialContent): Material {
    // get the count of instance for the material type
    let countOfThisType = MaterialRepository.__materialInstanceCountOfType.get(materialTypeName) as number;

    const materialCountPerBufferView = MaterialRepository.__materialCountPerBufferViewMap.get(
      materialTypeName
    ) as number;
    const indexInTheBufferView = countOfThisType % materialCountPerBufferView;
    const indexOfBufferViews = Math.floor(countOfThisType / materialCountPerBufferView);
    if (indexInTheBufferView === 0) {
      MaterialRepository.__allocateBufferView(materialTypeName, materialNode, indexOfBufferViews);
    }

    const material = new Material(
      MaterialRepository.__materialTids.get(materialTypeName)!,
      ++MaterialRepository.__materialUidCount,
      countOfThisType++,
      materialTypeName,
      materialNode
    );

    this.__initializeMaterial(material, countOfThisType, indexOfBufferViews, indexInTheBufferView);

    return material;
  }

  /**
   * Determines if a new material node is compatible with an existing material.
   * Compatibility is checked by comparing shader semantics information arrays.
   * Materials are compatible if they have identical shader semantic structures.
   *
   * @param currentMaterial - The existing material to compare against
   * @param newMaterialNode - The new material node to check for compatibility
   * @returns True if the materials are compatible, false otherwise
   */
  static isMaterialCompatible(currentMaterial: Material, newMaterialNode: AbstractMaterialContent): boolean {
    const existingMaterial = MaterialRepository.__materialMap.get(currentMaterial.materialUID)?.deref();
    if (Is.not.exist(existingMaterial)) {
      return false;
    }

    const existingShaderSemanticsInfoList = Array.from(existingMaterial._allFieldsInfo.values());
    const newShaderSemanticsInfoList = newMaterialNode._semanticsInfoArray;
    if (JSON.stringify(existingShaderSemanticsInfoList) !== JSON.stringify(newShaderSemanticsInfoList)) {
      return false;
    }

    return true;
  }

  /**
   * Initializes a newly created material instance with proper data structures and memory allocation.
   * This method sets up the material's shader variables, semantic information, and registers
   * the material in the repository's tracking maps.
   *
   * @param material - The material instance to initialize
   * @param countOfThisType - The current count of instances for this material type
   * @private
   */
  private static __initializeMaterial(
    material: Material,
    countOfThisType: Count,
    indexOfBufferViews: Index,
    _indexInTheBufferView: Index
  ) {
    // Set name
    // material.tryToSetUniqueName(material.__materialTypeName, true);

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
      MaterialRepository.__materialInstanceCountOfType.set(material.materialTypeName, countOfThisType);
    }

    // Set semanticsInfo and shaderVariables to the material instance
    if (Is.exist(material._materialContent)) {
      const semanticsInfoArray = material._materialContent._semanticsInfoArray;
      const accessorMap = MaterialRepository.__accessors.get(material.materialTypeName)!.get(indexOfBufferViews)!;
      semanticsInfoArray.forEach(semanticsInfo => {
        material._allFieldsInfo.set(semanticsInfo.semantic, semanticsInfo);
        if (!semanticsInfo.soloDatum) {
          const accessor = accessorMap.get(semanticsInfo.semantic) as Accessor;
          const typedArray = accessor.takeOne() as Float32Array;
          const shaderVariable = {
            info: semanticsInfo,
            value: MathClassUtil.initWithFloat32Array(semanticsInfo.initialValue, typedArray),
          };
          material._allFieldVariables.set(semanticsInfo.semantic, shaderVariable);
          if (!semanticsInfo.isInternalSetting) {
            material._autoFieldVariablesOnly.set(semanticsInfo.semantic, shaderVariable);
            if (CompositionType.isTexture(semanticsInfo.compositionType)) {
              material._autoTextureFieldVariablesOnly.set(semanticsInfo.semantic, shaderVariable);
            }
            if (semanticsInfo.needUniformInDataTextureMode) {
              material._autoUniformFieldVariablesOnly.set(semanticsInfo.semantic, shaderVariable);
            }
          }
        }
      });
    }
  }

  /**
   * Gets the memory location offset for a specific property of a material type.
   * The offset is calculated in 16-byte aligned units for GPU buffer access.
   * This is used for efficient GPU memory access in shaders.
   *
   * @param materialTypeName - The name of the material type
   * @param propertyName - The shader semantic name of the property
   * @returns The byte offset divided by 16 (IndexOf16Bytes) for the property location
   */
  static getLocationOffsetOfMemberOfMaterial(
    materialTypeName: string,
    propertyName: ShaderSemanticsName
  ): IndexOf16Bytes[] {
    const map = MaterialRepository.__instances.get(materialTypeName)!;
    const materialRef = Array.from(map.values()).find(m => m.deref() !== undefined); // find an actual exist material
    if (Is.not.exist(materialRef?.deref())) {
      Logger.warn(
        `Material is not found. getLocationOffsetOfMemberOfMaterial returns invalid 0 value. materialTypeName: ${materialTypeName}`
      );
      return [0];
    }
    const material = materialRef.deref()!;
    const info = material._allFieldsInfo.get(propertyName)!;
    if (info.soloDatum) {
      const value = Material._soloDatumFields.get(material.materialTypeName)!.get(propertyName);
      return [(value!.value._v as Float32Array).byteOffset / 4 / 4];
    }
    const propertiesOfBufferViews = this.__accessors.get(materialTypeName);
    const locationOffsets: IndexOf16Bytes[] = [];
    propertiesOfBufferViews?.forEach(properties => {
      const accessor = properties.get(propertyName);
      locationOffsets.push(accessor!.byteOffsetInBuffer / 4 / 4);
    });

    return locationOffsets;
  }

  /**
   * Internal method that performs the actual material type registration.
   * This method sets up the material type ID, allocates buffer views,
   * and initializes all necessary data structures.
   *
   * @param materialTypeName - The unique name identifier for the material type
   * @param materialNode - The material content definition
   * @param materialCountPerBufferView - The number of materials per buffer view
   * @private
   */
  private static __registerInner(
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    materialCountPerBufferView: number
  ) {
    const materialTid = ++MaterialRepository.__materialTidCount;
    MaterialRepository.__materialNodes.set(materialTypeName, materialNode);
    MaterialRepository.__materialTids.set(materialTypeName, materialTid);
    MaterialRepository.__materialCountPerBufferViewMap.set(materialTypeName, materialCountPerBufferView);
    MaterialRepository.__materialInstanceCountOfType.set(materialTypeName, 0);
  }

  /**
   * Allocates GPU buffer memory for a material type based on its shader semantics.
   * This method calculates the total memory requirements, creates buffer views,
   * and sets up accessors for efficient GPU data access.
   *
   * @param materialTypeName - The name of the material type to allocate memory for
   * @param materialNode - The material node containing semantic information
   * @returns The allocated BufferView for the material type
   * @private
   */
  private static __allocateBufferView(
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    indexOfBufferViews: IndexOfBufferViews
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
        dataCount = MaterialRepository.__materialCountPerBufferViewMap.get(materialTypeName)!;
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
    let bufferView: BufferView | undefined;
    if (this.__bufferViews.has(materialTypeName)) {
      const map = this.__bufferViews.get(materialTypeName)!;
      bufferView = map.get(indexOfBufferViews);
    } else {
      this.__bufferViews.set(materialTypeName, new Map());
    }
    if (bufferView == null) {
      const result = buffer.takeBufferView({
        byteLengthToNeed: totalByteLength,
        byteStride: 0,
      });
      bufferView = result.unwrapForce();
      this.__bufferViews.get(materialTypeName)!.set(indexOfBufferViews, bufferView);
    }

    // Take Accessors and register it
    for (let i = 0; i < alignedByteLengthAndSemanticInfoArray.length; i++) {
      const alignedByte = alignedByteLengthAndSemanticInfoArray[i].alignedByte;
      const semanticInfo = alignedByteLengthAndSemanticInfoArray[i].semanticInfo;

      let count = 1;
      if (!semanticInfo.soloDatum) {
        count = MaterialRepository.__materialCountPerBufferViewMap.get(materialTypeName)!;
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
          value: MathClassUtil.initWithFloat32Array(semanticInfo.initialValue, typedArray),
        });
      } else {
        // Set an accessor to this.__accessors
        let properties = this.__accessors.get(materialTypeName)!.get(indexOfBufferViews);
        if (properties == null) {
          const map = new Map();
          this.__accessors.get(materialTypeName)!.set(indexOfBufferViews, map);
          properties = map;
        }
        properties.set(semanticInfo.semantic, accessor);
      }
    }

    return bufferView;
  }

  static _getMaterialCountPerBufferView(materialTypeName: string): Count | undefined {
    return this.__materialCountPerBufferViewMap.get(materialTypeName);
  }

  /**
   * Invalidates all shader programs for all registered materials.
   * This method is typically called when global shader settings change
   * and all materials need to recompile their shaders.
   *
   * @internal
   */
  static _makeShaderInvalidateToAllMaterials() {
    for (const material of MaterialRepository.__materialMap.values()) {
      material.deref()?.makeShadersInvalidate();
    }
  }
}
