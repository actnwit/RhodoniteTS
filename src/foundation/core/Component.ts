import { ComponentType, type ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { Byte, ComponentSID, Count, EntityUID, IndexOf16Bytes, TypedArray } from '../../types/CommonTypes';
import type { ComponentToComponentMethods } from '../components/ComponentTypes';
import type { MemoryManager } from '../core/MemoryManager';
import type { BufferUseEnum } from '../definitions/BufferUse';
import { ProcessStage, type ProcessStageEnum } from '../definitions/ProcessStage';
import type { ShaderTypeEnum } from '../definitions/ShaderType';
import type { MutableMatrix33 } from '../math/MutableMatrix33';
import type { MutableMatrix44 } from '../math/MutableMatrix44';
import type { MutableQuaternion } from '../math/MutableQuaternion';
import type { MutableScalar } from '../math/MutableScalar';
import type { MutableVector3 } from '../math/MutableVector3';
import type { MutableVector4 } from '../math/MutableVector4';
import { VectorN } from '../math/VectorN';
import type { Accessor } from '../memory/Accessor';
import type { BufferView } from '../memory/BufferView';
import { RnException } from '../misc';
import { Err, Ok, type Result } from '../misc/Result';
import type { RenderPass } from '../renderer/RenderPass';
import type { Engine } from '../system/Engine';
import type { ComponentMemoryRegistry, VariableLengthChunk } from './ComponentMemoryRegistry';
import type { IEntity } from './Entity';
import type { EntityRepository } from './EntityRepository';
import { RnObject } from './RnObject';

type DataClassType =
  | typeof VectorN
  | typeof MutableMatrix44
  | typeof MutableMatrix33
  | typeof MutableVector3
  | typeof MutableVector4
  | typeof MutableQuaternion
  | typeof MutableScalar;

export type MemberInfo = {
  memberName: string;
  bufferUse: BufferUseEnum;
  dataClassType: DataClassType;
  shaderType: ShaderTypeEnum;
  compositionType: CompositionTypeEnum;
  componentType: ComponentTypeEnum;
  initValues: number[] | VectorN;
  convertToBool?: boolean;
  /**
   * Multiplier applied to the uniform array length in uniform mode
   * (the array length becomes Config.maxSkeletalBoneNumberForUniformMode * this value).
   */
  uniformArrayLengthMultiplier?: number;
  /**
   * Whether this array member has a per-instance length (see `Component.registerMember`).
   */
  isVariableLength?: boolean;
};

type MemberName = string;
type IndexOfTheBufferView = number;

/**
 * Component is a functional unit that can be added to an Entity instance.
 * This is the base class for all components in the ECS (Entity-Component-System) architecture.
 * Components provide specific functionality and data to entities.
 */
export class Component extends RnObject {
  private _component_sid: number;
  _isAlive = true;
  protected __isReUse = false;
  protected __engine: Engine;
  protected __currentProcessStage: ProcessStageEnum = ProcessStage.Load;

  /**
   * Stores member metadata for each component class.
   * This is class-level static data that doesn't depend on Engine instances.
   */
  private static __memberInfo: Map<typeof Component, Map<MemberName, MemberInfo>> = new Map();

  /**
   * Stores array length information for each component class member.
   * This is class-level static data that doesn't depend on Engine instances.
   */
  private static __arrayLengthMap: Map<typeof Component, Map<MemberName, Count>> = new Map();

  /** the entity unique Id which this component belongs to  */
  protected __entityUid: EntityUID;

  /** the instance of MemoryManager */
  protected __memoryManager: MemoryManager;

  /** the instance of EntityRepository */
  protected __entityRepository: EntityRepository;

  public static readonly _processStages: Array<ProcessStageEnum> = [
    // ProcessStage.Create,
    ProcessStage.Load,
    // ProcessStage.Mount,
    ProcessStage.Logic,
    ProcessStage.Render,
    // ProcessStage.Unmount,
    // ProcessStage.Discard
  ];

  /**
   * The constructor of the Component class.
   * When creating a Component, use the createComponent method of the ComponentRepository class
   * instead of directly calling this constructor.
   *
   * @param engine - The engine instance
   * @param entityUid - Unique ID of the corresponding entity
   * @param componentSid - Scoped ID of the Component
   * @param entityRepository - The instance of the EntityRepository class (Dependency Injection)
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super();

    this.__engine = engine;
    this.__entityUid = entityUid;
    this._component_sid = componentSid;

    this.__memoryManager = engine.memoryManager;
    this.__entityRepository = entityRepository;

    if (isReUse) {
      this.__isReUse = true;
    }
  }

  /**
   * Transitions the component to a different process stage.
   * This affects which update methods will be called during the frame processing.
   *
   * @param processStage - The target stage to move to
   */
  moveStageTo(processStage: ProcessStageEnum) {
    // Component.__dirtyOfArrayOfProcessStages.set(this.__currentProcessStage, false);
    // Component.__dirtyOfArrayOfProcessStages.set(processStage, true);
    this.__currentProcessStage = processStage;
  }

  /**
   * Gets the Type ID of the Component class.
   * This is overridden by concrete component classes to provide unique type identification.
   *
   * @returns The component type ID (default: 0)
   */
  static get componentTID() {
    return 0;
  }

  /**
   * Gets the Type ID of this Component instance.
   * This is overridden by concrete component classes to provide unique type identification.
   *
   * @returns The component type ID (default: 0)
   */
  get componentTID() {
    return 0;
  }

  /**
   * Gets the Scoped ID of this Component instance.
   * The SID is unique within the component type and represents the instance index.
   *
   * @returns The component scoped ID
   */
  get componentSID() {
    return this._component_sid;
  }

  /**
   * Gets the unique ID of the entity that owns this component.
   *
   * @returns The entity unique ID
   */
  get entityUID() {
    return this.__entityUid;
  }

  /**
   * Gets the current process stage of the component.
   * This determines which update methods are currently being called.
   *
   * @returns The current process stage
   */
  get currentProcessStage() {
    return this.__currentProcessStage;
  }

  /**
   * Checks whether the specified ProcessStage method exists in the given Component class.
   * This is used to determine if a component can handle a particular process stage.
   *
   * @param componentType - The component class to check
   * @param processStage - The process stage to check for
   * @returns True if the method exists, false otherwise
   */
  static doesTheProcessStageMethodExist(componentType: typeof Component, processStage: ProcessStageEnum) {
    if ((componentType.prototype as any)[processStage.methodName] == null) {
      return false;
    }

    return true;
  }

  /**
   * Checks whether the specified ProcessStage method exists in this Component instance.
   * This is used to determine if this component can handle a particular process stage.
   *
   * @param processStage - The process stage to check for
   * @returns True if the method exists, false otherwise
   */
  isExistProcessStageMethod(processStage: ProcessStageEnum) {
    if ((this as any)[processStage.methodName] == null) {
      return false;
    }

    return true;
  }

  /**
   * Processes all components of a given type for a specific process stage.
   * This method iterates through all components of the specified type and calls
   * their corresponding process stage method if they are in that stage.
   *
   * @param componentType - The component class to process
   * @param processStage - The process stage to execute
   */
  static process(engine: Engine, componentType: typeof Component, processStage: ProcessStageEnum) {
    if (!Component.doesTheProcessStageMethodExist(componentType, processStage)) {
      return;
    }

    const methodName = processStage.methodName;
    // Iterate the raw component array instead of building a filtered copy on
    // every call. Component arrays can contain holes for deleted components.
    const components = engine.componentRepository._getComponents(componentType);
    if (components == null) {
      return;
    }
    for (const component of components) {
      if (component == null) {
        continue;
      }
      if (processStage === component.__currentProcessStage) {
        (component as any)[methodName]();
      }
    }
  }

  /**
   * Updates components specifically for the render stage with render pass context.
   * This method calls the sort_$render method of the component class to handle
   * render-specific processing and sorting.
   *
   * @param componentClass - The component class to update
   * @param processStage - The render process stage
   * @param renderPass - The current render pass context
   * @returns The result of the sort_$render method
   */
  static updateComponentsForRenderStage(
    componentClass: typeof Component,
    _processStage: ProcessStageEnum,
    renderPass: RenderPass
  ) {
    const method = (componentClass as any).sort_$render;
    return method(renderPass);
  }

  /**
   * Registers a dependency relationship with another component.
   * This method is intended for future use in managing component dependencies.
   *
   * @param component - The component to depend on
   * @param isMust - Whether this dependency is required
   * @todo This method is not used yet and needs implementation
   */
  registerDependency(_component: Component, _isMust: boolean) {}

  /**
   * Allocates memory for a specific member field of this component instance.
   * This method takes one memory slot from the shared memory pool for the specified member.
   *
   * @param memberName - The name of the member field
   * @param dataClassType - The data class type for the member
   * @param initValues - Initial values to set for the member
   * @param _isReUse - Whether this component is being reused (the existing slot is detected from the accessor)
   * @param componentSid - The component scoped ID
   * @param componentCountPerBufferView - The number of components per buffer view
   * @returns null on success
   */
  private __takeOne(
    memberName: string,
    dataClassType: any,
    initValues: number[] | VectorN,
    _isReUse: boolean,
    componentSid: ComponentSID,
    componentCountPerBufferView: Count
  ): any {
    const current = (this as any)[`_${memberName}`];
    if (current != null && !current.isDummy()) {
      return;
    }

    const indexOfTheBufferView = Math.floor(componentSid / componentCountPerBufferView);
    const indexOfBufferViews = componentSid % componentCountPerBufferView;
    const registry = this._componentMemoryRegistry;
    const componentClass = this.constructor as typeof Component;
    const accessor = registry.getAccessor(componentClass, memberName, indexOfTheBufferView)!;
    // Shaders address the data of a component by `componentSid % componentCountPerBufferView`,
    // so always view that slot. This keeps the layout correct even if components allocate
    // out of SID order (e.g. SkeletalComponent allocates in setJoints) or are reused.
    const taken: TypedArray = accessor._takeExistedOne(indexOfBufferViews);
    (this as any)[`_${memberName}`] = new dataClassType(taken, false, true);

    if (!(initValues instanceof VectorN)) {
      for (let i = 0; i < (this as any)[`_${memberName}`]._v.length; ++i) {
        (this as any)[`_${memberName}`]._v[i] = initValues[i];
      }
    }

    return null;
  }

  /**
   * Allocates memory for a variable-length array member of this component instance.
   *
   * Unlike fixed members, the data is not placed in the slot layout shared by the components of a buffer view.
   * Each instance gets its own chunk sized by `_getArrayLengthForAllocation`, and the location of the chunk
   * (index of 16 bytes in the GPU data) is written to the `${memberName}Location` member so that shaders can find it.
   * The chunk is kept per component SID and reused when it is large enough.
   *
   * @param info - The member info of the variable-length array member
   * @param componentSid - The component scoped ID
   */
  private __takeVariableLengthOne(info: MemberInfo, componentSid: ComponentSID) {
    const memberName = info.memberName;
    const current = (this as any)[`_${memberName}`];
    if (current != null && !current.isDummy()) {
      return;
    }

    const componentClass = this.constructor as typeof Component;
    const registry = this._componentMemoryRegistry;
    const arrayLength = Math.max(
      this._getArrayLengthForAllocation(memberName) ??
        Component.__arrayLengthMap.get(componentClass)?.get(memberName) ??
        1,
      1
    );
    const elementCount = info.compositionType.getNumberOfComponents() * arrayLength;
    const byteLength = elementCount * info.componentType.getSizeInBytes();

    let chunk = registry.getVariableLengthChunk(componentClass, memberName, componentSid);
    if (chunk == null || chunk.byteCapacity < byteLength) {
      if (chunk != null) {
        // The chunk is too small. Let other components reuse it.
        registry.releaseVariableLengthChunk(componentClass, memberName, chunk);
      }
      chunk =
        registry.takeFreeVariableLengthChunk(componentClass, memberName, byteLength) ??
        Component.__createVariableLengthChunk(this.__engine, info.bufferUse, byteLength);
      registry.setVariableLengthChunk(componentClass, memberName, componentSid, chunk);
    }

    const bufferView = chunk.bufferView;
    const taken = new Float32Array(
      bufferView.buffer.getArrayBuffer(),
      bufferView.byteOffsetInRawArrayBufferOfBuffer,
      elementCount
    );
    // The chunk may contain the data of a previous owner
    taken.fill(0);
    const dataClassType = info.dataClassType as any;
    (this as any)[`_${memberName}`] = new dataClassType(taken, false, true);

    // Tell shaders where the data is. The location is split into two floats so that it is represented exactly.
    const locationMember = (this as any)[`_${Component._getVariableLengthLocationMemberName(memberName)}`];
    const radix = Component._variableLengthLocationRadix;
    locationMember._v[0] = Math.floor(chunk.location / radix);
    locationMember._v[1] = chunk.location % radix;
    locationMember._v[2] = arrayLength;
    locationMember._v[3] = 0;
  }

  /**
   * Creates a new chunk of memory for a variable-length array member.
   *
   * @param engine - The engine instance
   * @param bufferUse - The intended use of the buffer
   * @param byteLength - The byte length of the chunk
   * @returns The created chunk
   */
  private static __createVariableLengthChunk(
    engine: Engine,
    bufferUse: BufferUseEnum,
    byteLength: Byte
  ): VariableLengthChunk {
    let bufferViewResult: Result<BufferView, { 'Buffer.byteLength': Byte; 'Buffer.takenSizeInByte': Byte }>;
    let requireBufferLayerIndex = 0;
    do {
      const buffer = engine.memoryManager.createOrGetBuffer(bufferUse, requireBufferLayerIndex);
      bufferViewResult = buffer.takeBufferView({
        byteLengthToNeed: byteLength,
        byteStride: 0,
      });
      if (bufferViewResult.isErr()) {
        requireBufferLayerIndex++;
      }
    } while (bufferViewResult.isErr());

    const bufferView = bufferViewResult.get();
    const byteOffset =
      engine.memoryManager.getByteOffsetOfExistingBuffers(bufferUse, bufferView.buffer.indexOfTheBufferUsage) +
      bufferView.byteOffsetInBuffer;
    return {
      bufferView,
      byteCapacity: byteLength,
      location: byteOffset / 4 / 4,
    };
  }

  /**
   * The radix used to split the location of a variable-length array member into two floats
   * (`location = x * radix + y`), so that both are exactly representable as 32-bit floats.
   */
  static readonly _variableLengthLocationRadix = 65536;

  /**
   * Gets the name of the member which holds the location of a variable-length array member.
   *
   * @param memberName - The name of the variable-length array member
   * @returns The name of the location member
   */
  static _getVariableLengthLocationMemberName(memberName: string) {
    return `${memberName}Location`;
  }

  /**
   * Gets the ComponentMemoryRegistry for this component's engine.
   */
  get _componentMemoryRegistry(): ComponentMemoryRegistry {
    return this.__engine.componentMemoryRegistry;
  }

  /**
   * Creates and configures a memory accessor for a specific member field.
   * This method allocates buffer memory and creates an accessor for efficient data access.
   *
   * @param engine - The engine instance
   * @param bufferUse - The intended use of the buffer
   * @param memberName - The name of the member field
   * @param componentClass - The component class
   * @param compositionType - The composition type (e.g., Vec3, Mat4)
   * @param componentType - The component data type (e.g., Float32, Int32)
   * @param indexOfTheBufferView - The buffer view index
   * @param componentCountPerBufferView - The number of components per buffer view
   * @param arrayLength - The array length
   * @returns Result containing the accessor or an error
   */
  private static __takeAccessor(
    engine: Engine,
    bufferUse: BufferUseEnum,
    memberName: string,
    componentClass: typeof Component,
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum,
    indexOfTheBufferView: IndexOfTheBufferView,
    componentCountPerBufferView: Count,
    arrayLength: Count
  ): Result<Accessor, undefined> {
    const registry = engine.componentMemoryRegistry;

    const bytes = calcAlignedByteLength();
    const existingAccessor = registry.getAccessor(componentClass, memberName, indexOfTheBufferView);
    const accessorIsCompatible =
      existingAccessor != null &&
      existingAccessor.elementCount === componentCountPerBufferView &&
      existingAccessor.byteStride === bytes &&
      existingAccessor.compositionType === compositionType &&
      existingAccessor.componentType === componentType;
    if (accessorIsCompatible) {
      return new Ok(existingAccessor);
    }

    let bufferViewResult: Result<BufferView, { 'Buffer.byteLength': Byte; 'Buffer.takenSizeInByte': Byte }>;
    let requireBufferLayerIndex = 0;
    do {
      const buffer = engine.memoryManager.createOrGetBuffer(bufferUse, requireBufferLayerIndex);
      bufferViewResult = buffer.takeBufferView({
        byteLengthToNeed: bytes * componentCountPerBufferView,
        byteStride: 0,
      });
      if (bufferViewResult.isErr()) {
        requireBufferLayerIndex++;
      }
    } while (bufferViewResult.isErr());

    const accessorResult = bufferViewResult.get().takeAccessor({
      compositionType,
      componentType,
      count: componentCountPerBufferView,
      byteStride: bytes,
      arrayLength: arrayLength,
    });
    if (accessorResult.isErr()) {
      return new Err({
        message: `Failed to take accessor: ${accessorResult.getRnError().message}`,
        error: undefined,
      });
    }

    registry.setAccessor(componentClass, memberName, indexOfTheBufferView, accessorResult.get());

    return accessorResult;

    function calcAlignedByteLength() {
      const compositionNumber = compositionType.getNumberOfComponents();
      const componentSizeInByte = componentType.getSizeInBytes();
      const semanticInfoByte = compositionNumber * componentSizeInByte;
      let alignedByteLength = semanticInfoByte;
      // if (alignedByteLength % 16 !== 0) {
      //   alignedByteLength = semanticInfoByte + 16 - (semanticInfoByte % 16);
      // }
      if (CompositionType.isArray(compositionType)) {
        alignedByteLength *= arrayLength;
      }
      return alignedByteLength;
    }
  }

  /**
   * Registers a member field of the component class for memory allocation.
   * This method defines the memory layout and characteristics of component data members.
   *
   * Variable-length array members (`isVariableLength: true`) are allocated per instance with the length
   * returned by `_getArrayLengthForAllocation`, instead of the fixed slot layout shared by the components
   * of a buffer view. Shaders find the data through a Vec4 member named `${memberName}Location`,
   * which must be registered before the variable-length member.
   *
   * @param bufferUse - The intended purpose/type of buffer use
   * @param memberName - The name of the member field
   * @param dataClassType - The class type of the data
   * @param shaderType - The shader type (e.g., VertexShader, PixelShader)
   * @param componentType - The primitive data type (e.g., Float32, Int32)
   * @param initValues - Initial values for the member field
   * @param convertToBool - Whether to convert the member value to a boolean
   * @param uniformArrayLengthMultiplier - Multiplier of the uniform array length in uniform mode
   * @param isVariableLength - Whether the array member has a per-instance length
   */
  static registerMember(
    this: typeof Component,
    {
      bufferUse,
      memberName,
      dataClassType,
      shaderType,
      compositionType,
      componentType,
      initValues,
      arrayLength,
      componentSID,
      convertToBool,
      uniformArrayLengthMultiplier,
      isVariableLength,
    }: {
      bufferUse: BufferUseEnum;
      memberName: string;
      dataClassType: DataClassType;
      shaderType: ShaderTypeEnum;
      compositionType: CompositionTypeEnum;
      componentType: ComponentTypeEnum;
      initValues: number[] | VectorN;
      arrayLength?: Count | undefined;
      componentSID?: ComponentSID;
      convertToBool?: boolean;
      uniformArrayLengthMultiplier?: number;
      isVariableLength?: boolean;
    }
  ) {
    if (!Component.__memberInfo.has(this)) {
      Component.__memberInfo.set(this, new Map());
    }
    const memberInfoArray = Component.__memberInfo.get(this);

    if (isVariableLength === true) {
      if (
        compositionType !== CompositionType.Vec4Array &&
        compositionType !== CompositionType.Mat4Array &&
        compositionType !== CompositionType.Mat4x3Array
      ) {
        throw new Error(`Variable-length member ${memberName} must be Vec4Array, Mat4Array or Mat4x3Array.`);
      }
      if (componentType !== ComponentType.Float) {
        throw new Error(`Variable-length member ${memberName} must have the Float component type.`);
      }
      const locationInfo = memberInfoArray!.get(Component._getVariableLengthLocationMemberName(memberName));
      if (locationInfo == null || locationInfo.compositionType !== CompositionType.Vec4) {
        throw new Error(
          `Register a Vec4 member named ${Component._getVariableLengthLocationMemberName(memberName)} before the variable-length member ${memberName}.`
        );
      }
    }

    memberInfoArray!.set(memberName, {
      bufferUse: bufferUse,
      memberName: memberName,
      dataClassType: dataClassType,
      shaderType: shaderType,
      compositionType: compositionType,
      componentType: componentType,
      initValues: initValues,
      convertToBool: convertToBool,
      uniformArrayLengthMultiplier: uniformArrayLengthMultiplier,
      isVariableLength: isVariableLength,
    });

    if (arrayLength != null && componentSID != null) {
      if (!Component.__arrayLengthMap.has(this)) {
        Component.__arrayLengthMap.set(this, new Map());
      }
      const arrayLengthMap = Component.__arrayLengthMap.get(this)!;
      const currentLength = arrayLengthMap.get(memberName);
      if (currentLength == null || arrayLength > currentLength) {
        // Keep the maximum requested length so dynamically sized components (e.g. SkeletalComponent) allocate enough space
        arrayLengthMap.set(memberName, arrayLength);
      }
    }
  }

  /**
   * Allocates memory for all member fields of this component instance.
   * This method is called during component initialization to set up memory layout
   * and allocate space for the specified number of entities.
   *
   * @param componentCountPerBufferView - The number of components per buffer view
   * @param isReUse - Whether to reuse existing memory allocations
   */
  submitToAllocation(componentCountPerBufferView: Count, isReUse: boolean): void {
    const componentClass = this.constructor as typeof Component;
    const registry = this._componentMemoryRegistry;
    registry.setComponentCountPerBufferView(componentClass, componentCountPerBufferView);
    const memberInfoArray = Component.__memberInfo.get(componentClass)!;
    const engine = this.__engine;

    // Usually the first component of a buffer view creates the buffer views and accessors.
    // Components which allocate lazily (e.g. SkeletalComponent allocates in setJoints) may come in any order,
    // so also create them if they do not exist yet.
    const indexOfTheBufferView = Math.floor(this._component_sid / componentCountPerBufferView);
    if (this._component_sid % componentCountPerBufferView === 0 || hasMissingAccessor(indexOfTheBufferView)) {
      getBufferViewsAndAccessors(indexOfTheBufferView);
    }

    // take a field value allocation for each entity for each member field
    memberInfoArray.forEach(info => {
      if (info.isVariableLength === true) {
        return;
      }
      this.__takeOne(
        info.memberName,
        info.dataClassType,
        info.initValues,
        isReUse,
        this._component_sid,
        componentCountPerBufferView
      );
    });

    // Variable-length members are allocated after the fixed members,
    // because their locations are written to fixed members.
    memberInfoArray.forEach(info => {
      if (info.isVariableLength === true) {
        this.__takeVariableLengthOne(info, this._component_sid);
      }
    });

    // inner functions
    function hasMissingAccessor(indexOfTheBufferView: IndexOfTheBufferView) {
      for (const info of memberInfoArray.values()) {
        if (
          info.isVariableLength !== true &&
          registry.getAccessor(componentClass, info.memberName, indexOfTheBufferView) == null
        ) {
          return true;
        }
      }
      return false;
    }

    function getBufferViewsAndAccessors(indexOfTheBufferView: IndexOfTheBufferView) {
      // for each member field, take a BufferView for all entities' the member field.
      // take a Accessor for all entities for each member fields (same as BufferView)
      memberInfoArray.forEach(info => {
        if (info.isVariableLength === true) {
          return;
        }
        const arrayLength = Component.__arrayLengthMap.get(componentClass)?.get(info.memberName);
        const accessorResult = Component.__takeAccessor(
          engine,
          info.bufferUse,
          info.memberName,
          componentClass,
          info.compositionType,
          info.componentType,
          indexOfTheBufferView,
          componentCountPerBufferView,
          arrayLength ?? 1
        );
        if (accessorResult.isErr()) {
          throw new RnException(accessorResult.getRnError());
        }
        const accessor = accessorResult.get();
        const byteOffsetOfExistingBuffers = engine.memoryManager.getByteOffsetOfExistingBuffers(
          info.bufferUse,
          accessor.bufferView.buffer.indexOfTheBufferUsage
        );
        const byteOffset = byteOffsetOfExistingBuffers + accessor.byteOffsetInBuffer;
        registry.setByteOffset(componentClass, info.memberName, indexOfTheBufferView, byteOffset);
      });
    }
  }

  /**
   * Returns the array length to allocate for a variable-length array member of this component instance
   * (see `registerMember`). Override this to allocate a per-instance size. When undefined is returned,
   * the maximum array length registered for the component class is used.
   *
   * @param _memberName - The name of the variable-length array member
   * @returns The array length, or undefined to use the class-wide value
   */
  protected _getArrayLengthForAllocation(_memberName: string): Count | undefined {
    return undefined;
  }

  /**
   * Gets the entity that owns this component.
   * This provides access to the entity and its other components.
   *
   * @returns The entity instance that owns this component
   */
  get entity(): IEntity {
    return this.__entityRepository.getEntity(this.__entityUid);
  }

  /**
   * Gets the pixel location offset in the buffer for a specific member of a component type.
   * This is useful for GPU texture-based data access where locations are measured in pixels.
   *
   * @param engine - The engine instance
   * @param componentType - The component class type
   * @param memberName - The name of the member field
   * @returns The pixel location offset in the buffer
   */
  static getLocationOffsetOfMemberOfComponent(
    engine: Engine,
    componentType: typeof Component,
    memberName: string
  ): IndexOf16Bytes[] {
    const locationOffsets: IndexOf16Bytes[] = [];
    const registry = engine.componentMemoryRegistry;
    const byteOffsetMap = registry.getByteOffsetsForMember(componentType, memberName);
    if (byteOffsetMap == null) {
      return [0]; // indicate that this is invalid value
    }
    // Shaders index this array by the buffer view index, which may differ from the creation order
    for (const [indexOfTheBufferView, byteOffset] of byteOffsetMap) {
      locationOffsets[indexOfTheBufferView] = byteOffset / 4 / 4;
    }
    for (let i = 0; i < locationOffsets.length; i++) {
      if (locationOffsets[i] === undefined) {
        locationOffsets[i] = 0;
      }
    }
    return locationOffsets;
  }

  /**
   * Adds this component to an entity, extending the entity with component-specific methods.
   * This is a virtual method that should be overridden by concrete component classes.
   *
   * @virtual
   * @param base - The target entity to add this component to
   * @param _componentClass - The component class being added
   * @returns The entity extended with component methods
   * @throws Error indicating invalid calling of virtual method
   */
  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    _base: EntityBase,
    _componentClass: SomeComponentClass
  ): EntityBase & ComponentToComponentMethods<SomeComponentClass> {
    // can not be called. this is a virtual method.
    throw 'Invalid Calling';
  }

  // /**
  //  * Component creation stage method.
  //  * Override this method to define process dependencies with other components.
  //  * If circular dependencies are detected, an error will be reported.
  //  */
  // $create() {
  //   // Define process dependencies with other components.
  //   // If circular dependencies are detected, the error will be reported.

  //   // this.registerDependency(TransformComponent);
  // }

  // /**
  //  * Component loading stage method.
  //  * Override this method to handle component loading logic.
  //  */
  // $load() {}

  // /**
  //  * Component mounting stage method.
  //  * Override this method to handle component mounting logic.
  //  */
  // $mount() {}

  // /**
  //  * Component logic stage method.
  //  * Override this method to handle component update logic.
  //  */
  // $logic() {}

  // /**
  //  * Component pre-render stage method.
  //  * Override this method to handle component pre-render logic.
  //  *
  //  * @param instanceIDBufferUid - The instance ID buffer UID
  //  */
  // $prerender(instanceIDBufferUid: CGAPIResourceHandle) {}

  // /**
  //  * Component render stage method.
  //  * Override this method to handle component rendering logic.
  //  */
  // $render() {}

  // /**
  //  * Component unmounting stage method.
  //  * Override this method to handle component unmounting logic.
  //  */
  // $unmount() {}

  // /**
  //  * Component discard stage method.
  //  * Override this method to handle component cleanup logic.
  //  */
  // $discard() {}

  ///
  /// convenient methods but not used yet
  ///

  /**
   * Gets the CompositionType of a specific member field in a component class.
   * This is useful for understanding the data structure of component members.
   *
   * @param engine - The engine instance
   * @param memberName - The name of the member field
   * @param componentClass - The component class to query
   * @returns The CompositionType of the member or undefined if not found
   */
  static getCompositionTypeOfMember(
    _engine: Engine,
    memberName: string,
    componentClass: typeof Component
  ): CompositionTypeEnum | undefined {
    const memberInfoArray = Component.__memberInfo.get(componentClass)!;
    const info = memberInfoArray.get(memberName);
    if (info != null) {
      return info.compositionType;
    }
    return undefined;
  }

  /**
   * Gets the ComponentType of a specific member field in a component class.
   * This is useful for understanding the primitive data type of component members.
   *
   * @param memberName - The name of the member field
   * @param componentClass - The component class to query
   * @returns The ComponentType of the member or undefined if not found
   */
  static getComponentTypeOfMember(
    _engine: Engine,
    memberName: string,
    componentClass: typeof Component
  ): ComponentTypeEnum | undefined {
    const memberInfoArray = Component.__memberInfo.get(componentClass)!;
    const info = memberInfoArray.get(memberName);
    if (info != null) {
      return info.componentType;
    }
    return undefined;
  }

  /**
   * Gets the member info of the component.
   * This is useful for getting the member info of the component.
   *
   * @returns The member info of the component
   */
  static getMemberInfo(_engine: Engine): Map<typeof Component, Map<MemberName, MemberInfo>> {
    return new Map(Component.__memberInfo);
  }

  /**
   * Gets the number of components per buffer view for the component.
   * @returns The number of components per buffer view for the component
   */
  static getComponentCountPerBufferView(engine: Engine): Map<typeof Component, Count> {
    return engine.componentMemoryRegistry.getAllComponentCountPerBufferView();
  }

  /**
   * Gets the array length of a specific member field in a component class.
   * @returns The array length map of the component
   */
  static getArrayLengthOfMember(_engine: Engine): Map<typeof Component, Map<MemberName, Count>> {
    return new Map(Component.__arrayLengthMap);
  }

  /**
   * Marks this component as destroyed and no longer alive.
   * This is used internally to manage component lifecycle.
   *
   * @internal
   */
  _destroy(): void {
    this._isAlive = false;
    // const componentCountPerBufferView = Component.__componentCountPerBufferView.get(
    //   this.constructor as typeof Component
    // )!;
    // const accessorsOfTheComponent = Component.__accessors.get(this.constructor as typeof Component);
    // if (accessorsOfTheComponent != null) {
    //   accessorsOfTheComponent.forEach(accessorsOfMember => {
    //     accessorsOfMember.delete(Math.floor(this._component_sid / componentCountPerBufferView));
    //   });
    // }
    // const byteOffsetOfAccessorInBufferOfMembers = Component.__byteOffsetOfAccessorInBufferOfMembers.get(
    //   this.constructor as typeof Component
    // );
    // if (byteOffsetOfAccessorInBufferOfMembers != null) {
    //   byteOffsetOfAccessorInBufferOfMembers.forEach(byteOffsetOfAccessorInBufferOfMember => {
    //     byteOffsetOfAccessorInBufferOfMember.delete(Math.floor(this._component_sid / componentCountPerBufferView));
    //   });
    // }
  }

  /**
   * Performs a shallow copy of data from another component of the same type.
   * This method should be implemented by concrete component classes as needed.
   *
   * @param component - The source component to copy from
   */
  _shallowCopyFrom(_component: Component): void {
    // new Error('Not Implemented');
  }

  /**
   * Gets the state version of the component memory layout.
   * This is incremented whenever the component's memory layout changes.
   *
   * @param engine - The engine instance
   * @returns The state version number
   */
  static getStateVersion(engine: Engine): number {
    return engine.componentMemoryRegistry.getStateVersion();
  }
}
