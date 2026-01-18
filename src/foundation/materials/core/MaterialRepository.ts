import type {
  Byte,
  Count,
  Index,
  IndexOf16Bytes,
  MaterialSID,
  MaterialTID,
  MaterialUID,
} from '../../../types/CommonTypes';
import { BufferUse } from '../../definitions/BufferUse';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import type { ShaderSemanticsName } from '../../definitions/ShaderSemantics';
import { calcAlignedByteLength, type ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { MathClassUtil } from '../../math/MathClassUtil';
import type { Accessor } from '../../memory/Accessor';
import type { BufferView } from '../../memory/BufferView';
import { Is } from '../../misc/Is';
import { Logger } from '../../misc/Logger';
import type { Result } from '../../misc/Result';
import type { Engine } from '../../system/Engine';
import type { AbstractMaterialContent } from './AbstractMaterialContent';
import { Material } from './Material';
import type { IndexOfBufferViews, MaterialTypeName, ShaderVariable } from './MaterialTypes';

/**
 * Repository class for managing material types and instances.
 * Handles registration, creation, and lifecycle management of materials.
 */
export class MaterialRepository {
  private __materialMap: Map<MaterialUID, WeakRef<Material>> = new Map();
  private __instances: Map<MaterialTypeName, Map<MaterialSID, WeakRef<Material>>> = new Map();
  private __materialTids: Map<MaterialTypeName, MaterialTID> = new Map();
  private __materialInstanceCountOfType: Map<MaterialTypeName, Count> = new Map();
  private __materialNodes: Map<MaterialTypeName, AbstractMaterialContent | undefined> = new Map();
  private __materialCountPerBufferViewMap: Map<MaterialTypeName, Count> = new Map();
  private __bufferViews: Map<MaterialTypeName, Map<IndexOfBufferViews, BufferView>> = new Map();
  private __accessors: Map<MaterialTypeName, Map<IndexOfBufferViews, Map<ShaderSemanticsName, Accessor>>> = new Map();
  /** Tracks version incremented when a new buffer view is allocated for a material type. */
  private __bufferViewVersions: Map<MaterialTypeName, number> = new Map();
  /** Solo datum fields for each material type (engine-specific, not shared across engines) */
  _soloDatumFields: Map<MaterialTypeName, Map<ShaderSemanticsName, ShaderVariable>> = new Map();
  /** State version counter for tracking material changes (engine-specific) */
  private __stateVersion = 0;
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
  public registerMaterial(
    engine: Engine,
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    materialCountPerBufferView: number = engine.config.materialCountPerBufferView
  ): boolean {
    if (!this.__materialNodes.has(materialTypeName)) {
      this.__registerInner(materialTypeName, materialNode, materialCountPerBufferView);

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
  public forceRegisterMaterial(
    engine: Engine,
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    materialCountPerBufferView: number = engine.config.materialCountPerBufferView
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
  public isRegisteredMaterialType(materialTypeName: string) {
    return this.__materialNodes.has(materialTypeName);
  }

  /**
   * Retrieves a material instance by its unique identifier.
   * Returns undefined if the material doesn't exist or has been garbage collected.
   *
   * @param materialUid - The unique identifier of the material to retrieve
   * @returns The material instance if found and still alive, undefined otherwise
   */
  public getMaterialByMaterialUid(materialUid: MaterialSID): Material | undefined {
    return this.__materialMap.get(materialUid)?.deref();
  }

  /**
   * Gets all currently active material instances from the repository.
   * Returns an array of WeakRef objects that may contain undefined values
   * if materials have been garbage collected.
   *
   * @returns Array of WeakRef objects pointing to all registered materials
   */
  public getAllMaterials() {
    return Array.from(this.__materialMap.values());
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
  public createMaterial(engine: Engine, materialTypeName: string, materialNode: AbstractMaterialContent): Material {
    // get the count of instance for the material type
    let countOfThisType = this.__materialInstanceCountOfType.get(materialTypeName) as number;

    const materialCountPerBufferView = this.__materialCountPerBufferViewMap.get(materialTypeName) as number;
    const indexInTheBufferView = countOfThisType % materialCountPerBufferView;
    const indexOfBufferViews = Math.floor(countOfThisType / materialCountPerBufferView);
    let newlyAllocatedBufferView = false;
    if (indexInTheBufferView === 0) {
      newlyAllocatedBufferView = this.__allocateBufferView(engine, materialTypeName, materialNode, indexOfBufferViews);
    }

    const material = new Material(
      engine,
      this.__materialTids.get(materialTypeName)!,
      ++MaterialRepository.__materialUidCount,
      countOfThisType++,
      materialTypeName,
      materialNode
    );

    this.__initializeMaterial(material, countOfThisType, indexOfBufferViews, indexInTheBufferView);
    if (newlyAllocatedBufferView && indexOfBufferViews > 0) {
      this.__makeShaderInvalidateForMaterialType(materialTypeName);
    }

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
  isMaterialCompatible(currentMaterial: Material, newMaterialNode: AbstractMaterialContent): boolean {
    const existingMaterial = this.__materialMap.get(currentMaterial.materialUID)?.deref();
    if (Is.not.exist(existingMaterial)) {
      return false;
    }

    const existingShaderSemanticsInfoList = Array.from(existingMaterial._allFieldsInfo.values());
    // Include stage information in the comparison to ensure shader properties are generated correctly
    const existingShaderSemanticsInfoListString = existingShaderSemanticsInfoList
      .map(info => info.semantic + info.compositionType.str + info.componentType.str + info.stage.index)
      .join('');
    const newShaderSemanticsInfoList = newMaterialNode._semanticsInfoArray;
    const newShaderSemanticsInfoListString = newShaderSemanticsInfoList
      .map(info => info.semantic + info.compositionType.str + info.componentType.str + info.stage.index)
      .join('');
    if (existingShaderSemanticsInfoListString !== newShaderSemanticsInfoListString) {
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
  private __initializeMaterial(
    material: Material,
    countOfThisType: Count,
    indexOfBufferViews: Index,
    _indexInTheBufferView: Index
  ) {
    // Set name
    // material.tryToSetUniqueName(material.__materialTypeName, true);

    // Set meta data to MaterialRepository
    {
      this.__materialMap.set(material.materialUID, new WeakRef(material));

      // set this material instance for the material type
      let map = this.__instances.get(material.__materialTypeName);
      if (Is.not.exist(map)) {
        map = new Map();
        this.__instances.set(material.materialTypeName, map);
      }
      map.set(material.materialSID, new WeakRef(material));

      // set the count of instance for the material type
      this.__materialInstanceCountOfType.set(material.materialTypeName, countOfThisType);
    }

    // Set semanticsInfo and shaderVariables to the material instance
    if (Is.exist(material._materialContent)) {
      const semanticsInfoArray = material._materialContent._semanticsInfoArray;
      const accessorMap = this.__accessors.get(material.materialTypeName)!.get(indexOfBufferViews)!;
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
   * @param engine - The engine instance
   * @param materialTypeName - The name of the material type
   * @param propertyName - The shader semantic name of the property
   * @returns The byte offset divided by 16 (IndexOf16Bytes) for the property location
   */
  getLocationOffsetOfMemberOfMaterial(
    engine: Engine,
    materialTypeName: string,
    propertyName: ShaderSemanticsName
  ): IndexOf16Bytes[] {
    const map = this.__instances.get(materialTypeName)!;
    const materialRef = Array.from(map.values()).find(m => m.deref() !== undefined); // find an actual exist material
    if (Is.not.exist(materialRef?.deref())) {
      Logger.default.warn(
        `Material is not found. getLocationOffsetOfMemberOfMaterial returns invalid 0 value. materialTypeName: ${materialTypeName}`
      );
      return [0];
    }
    const material = materialRef.deref()!;
    const info = material._allFieldsInfo.get(propertyName)!;
    if (info.soloDatum) {
      const value = this._soloDatumFields.get(material.materialTypeName)!.get(propertyName);
      return [(value!.value._v as Float32Array).byteOffset / 4 / 4];
    }
    const propertiesOfBufferViews = this.__accessors.get(materialTypeName);
    const locationOffsets: IndexOf16Bytes[] = [];
    propertiesOfBufferViews?.forEach(properties => {
      const accessor = properties.get(propertyName)!;
      const byteOffsetOfExistingBuffers = engine.memoryManager.getByteOffsetOfExistingBuffers(
        BufferUse.GPUInstanceData,
        accessor.bufferView.buffer.indexOfTheBufferUsage
      );
      const byteOffset = byteOffsetOfExistingBuffers + accessor.byteOffsetInBuffer;
      locationOffsets.push(byteOffset / 4 / 4);
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
  private __registerInner(
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    materialCountPerBufferView: number
  ) {
    const materialTid = ++MaterialRepository.__materialTidCount;
    this.__materialNodes.set(materialTypeName, materialNode);
    this.__materialTids.set(materialTypeName, materialTid);
    this.__materialCountPerBufferViewMap.set(materialTypeName, materialCountPerBufferView);
    this.__materialInstanceCountOfType.set(materialTypeName, 0);
    this.__bufferViewVersions.set(materialTypeName, 0);
  }

  /**
   * Allocates GPU buffer memory for a material type based on its shader semantics.
   * This method calculates the total memory requirements, creates buffer views,
   * and sets up accessors for efficient GPU data access.
   *
   * @param materialTypeName - The name of the material type to allocate memory for
   * @param materialNode - The material node containing semantic information
   * @returns Whether a new BufferView was allocated (true) or an existing one was reused (false)
   * @private
   */
  private __allocateBufferView(
    engine: Engine,
    materialTypeName: string,
    materialNode: AbstractMaterialContent,
    indexOfBufferViews: IndexOfBufferViews
  ): boolean {
    let newlyAllocated = false;
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
        dataCount = this.__materialCountPerBufferViewMap.get(materialTypeName)!;
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
    let bufferView: BufferView | undefined;
    if (this.__bufferViews.has(materialTypeName)) {
      const map = this.__bufferViews.get(materialTypeName)!;
      bufferView = map.get(indexOfBufferViews);
    } else {
      this.__bufferViews.set(materialTypeName, new Map());
    }
    if (bufferView == null) {
      let bufferViewResult: Result<BufferView, { 'Buffer.byteLength': Byte; 'Buffer.takenSizeInByte': Byte }>;
      let requireBufferLayerIndex = 0;
      do {
        const buffer = engine.memoryManager.createOrGetBuffer(BufferUse.GPUInstanceData, requireBufferLayerIndex);
        bufferViewResult = buffer.takeBufferView({
          byteLengthToNeed: totalByteLength,
          byteStride: 0,
        });
        if (bufferViewResult.isErr()) {
          requireBufferLayerIndex++;
        }
      } while (bufferViewResult.isErr());
      bufferView = bufferViewResult.get();
      this.__bufferViews.get(materialTypeName)!.set(indexOfBufferViews, bufferView);
      newlyAllocated = true;
      // bump buffer view version so shaders pick up new offsets
      const currentVersion = this.__bufferViewVersions.get(materialTypeName) ?? 0;
      this.__bufferViewVersions.set(materialTypeName, currentVersion + 1);
    }

    // Take Accessors and register it
    for (let i = 0; i < alignedByteLengthAndSemanticInfoArray.length; i++) {
      const alignedByte = alignedByteLengthAndSemanticInfoArray[i].alignedByte;
      const semanticInfo = alignedByteLengthAndSemanticInfoArray[i].semanticInfo;

      let count = 1;
      if (!semanticInfo.soloDatum) {
        count = this.__materialCountPerBufferViewMap.get(materialTypeName)!;
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
        let map = this._soloDatumFields.get(materialTypeName);
        if (map == null) {
          map = new Map();
          this._soloDatumFields.set(materialTypeName, map);
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

    return newlyAllocated;
  }

  _getMaterialCountPerBufferView(materialTypeName: string): Count | undefined {
    return this.__materialCountPerBufferViewMap.get(materialTypeName);
  }

  _getBufferViewVersion(materialTypeName: string): number {
    return this.__bufferViewVersions.get(materialTypeName) ?? 0;
  }

  /**
   * Invalidates all shader programs for all registered materials.
   * This method is typically called when global shader settings change
   * and all materials need to recompile their shaders.
   *
   * @internal
   */
  _makeShaderInvalidateToAllMaterials() {
    for (const material of this.__materialMap.values()) {
      material.deref()?.makeShadersInvalidate();
    }
  }

  /**
   * Invalidates shader programs only for materials that are affected by morph changes.
   * Affected materials are those that support morphing and are currently used by primitives
   * with morph targets.
   *
   * @internal
   */
  _makeShaderInvalidateToMorphMaterials() {
    for (const materialRef of this.__materialMap.values()) {
      const material = materialRef.deref();
      if (material == null || material.isMorphing === false) {
        continue;
      }

      const primitives = material.getBelongPrimitives();
      for (const primitive of primitives.values()) {
        if (primitive.targets.length > 0) {
          material.makeShadersInvalidate();
          break;
        }
      }
    }
  }

  private __makeShaderInvalidateForMaterialType(materialTypeName: string) {
    const materials = this.__instances.get(materialTypeName);
    if (materials == null) {
      return;
    }

    for (const materialRef of materials.values()) {
      materialRef.deref()?.makeShadersInvalidate();
    }
  }

  /**
   * Gets the current state version for materials in this repository.
   * This version is incremented whenever any material's state changes.
   * @returns The current state version number
   */
  get stateVersion(): number {
    return this.__stateVersion;
  }

  /**
   * Increments the state version counter.
   * Called when a material's state changes.
   * @internal
   */
  _incrementStateVersion(): void {
    this.__stateVersion++;
  }
}
