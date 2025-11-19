import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { Byte, ComponentSID, Count, EntityUID, IndexOf16Bytes, TypedArray } from '../../types/CommonTypes';
import type { ComponentToComponentMethods } from '../components/ComponentTypes';
import { MemoryManager } from '../core/MemoryManager';
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
import { Logger, RnException } from '../misc';
import { Err, Ok, type Result } from '../misc/Result';
import type { RenderPass } from '../renderer/RenderPass';
import { ComponentRepository } from './ComponentRepository';
import { Config } from './Config';
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
  protected __currentProcessStage: ProcessStageEnum = ProcessStage.Load;
  private static __accessors: Map<typeof Component, Map<MemberName, Map<IndexOfTheBufferView, Accessor>>> = new Map();

  private static __memberInfo: Map<typeof Component, Map<MemberName, MemberInfo>> = new Map();
  private static __arrayLengthMap: Map<typeof Component, Map<MemberName, Map<ComponentSID, Count>>> = new Map();
  private static __componentCountPerBufferView: Map<typeof Component, Count> = new Map();

  private static __byteOffsetOfAccessorInBufferOfMembers: Map<
    typeof Component,
    Map<MemberName, Map<IndexOfTheBufferView, Byte>>
  > = new Map();

  /** the state version of the component */
  private static __stateVersion = 0;

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
   * @param entityUid - Unique ID of the corresponding entity
   * @param componentSid - Scoped ID of the Component
   * @param entityRepository - The instance of the EntityRepository class (Dependency Injection)
   * @param isReUse - Whether this component is being reused from a pool
   */
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, _isReUse: boolean) {
    super();

    this.__entityUid = entityUid;
    this._component_sid = componentSid;

    this.__memoryManager = MemoryManager.getInstance();
    this.__entityRepository = entityRepository;
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
  static process(componentType: typeof Component, processStage: ProcessStageEnum) {
    if (!Component.doesTheProcessStageMethodExist(componentType, processStage)) {
      return;
    }

    const methodName = processStage.methodName;
    const components: Component[] | undefined = ComponentRepository.getComponentsWithType(componentType)!;
    for (const component of components) {
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
   * @param isReUse - Whether to reuse an existing memory slot
   * @param componentSid - The component scoped ID
   * @param componentCountPerBufferView - The number of components per buffer view
   * @returns null on success
   */
  private __takeOne(
    memberName: string,
    dataClassType: any,
    initValues: number[] | VectorN,
    isReUse: boolean,
    componentSid: ComponentSID,
    componentCountPerBufferView: Count
  ): any {
    if (!(this as any)[`_${memberName}`].isDummy()) {
      return;
    }

    const indexOfTheBufferView = Math.floor(componentSid / componentCountPerBufferView);
    const indexOfBufferViews = componentSid % componentCountPerBufferView;
    const accessorsOfMember = Component.__accessors.get(this.constructor as typeof Component)!.get(memberName)!;
    let taken: TypedArray | undefined;
    if (isReUse) {
      taken = accessorsOfMember.get(indexOfTheBufferView)!._takeExistedOne(indexOfBufferViews);
    } else {
      taken = accessorsOfMember.get(indexOfTheBufferView)!.takeOne();
    }
    (this as any)[`_${memberName}`] = new dataClassType(taken, false, true);

    if (!(initValues instanceof VectorN)) {
      for (let i = 0; i < (this as any)[`_${memberName}`]._v.length; ++i) {
        (this as any)[`_${memberName}`]._v[i] = initValues[i];
      }
    }

    return null;
  }

  /**
   * Creates and configures a memory accessor for a specific member field.
   * This method allocates buffer memory and creates an accessor for efficient data access.
   *
   * @param bufferUse - The intended use of the buffer
   * @param memberName - The name of the member field
   * @param componentClass - The component class
   * @param compositionType - The composition type (e.g., Vec3, Mat4)
   * @param componentType - The component data type (e.g., Float32, Int32)
   * @param count - The number of components to allocate for
   * @returns Result containing the accessor or an error
   */
  private static __takeAccessor(
    bufferUse: BufferUseEnum,
    memberName: string,
    componentClass: typeof Component,
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum,
    indexOfTheBufferView: IndexOfTheBufferView,
    componentCountPerBufferView: Count,
    arrayLength: Count,
    componentSID: ComponentSID
  ): Result<Accessor, undefined> {
    if (!this.__accessors.has(componentClass)) {
      this.__accessors.set(componentClass, new Map());
    }

    const accessorsOfMember = this.__accessors.get(componentClass)!;

    let accessors = accessorsOfMember.get(memberName);
    if (accessors == null) {
      accessors = new Map();
      accessorsOfMember.set(memberName, accessors);
    }
    if (!accessorsOfMember.has(memberName) || !accessors.has(indexOfTheBufferView)) {
      const bytes = calcAlignedByteLength();
      const buffer = MemoryManager.getInstance().createOrGetBuffer(bufferUse);
      const bufferViewResult = buffer.takeBufferView({
        byteLengthToNeed: bytes * componentCountPerBufferView,
        byteStride: 0,
      });
      if (bufferViewResult.isErr()) {
        return new Err({
          message: `Failed to take buffer view: ${bufferViewResult.getRnError().message}`,
          error: undefined,
        });
      }
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

      accessors.set(indexOfTheBufferView, accessorResult.get());

      Component.__stateVersion++;

      return accessorResult;
    }

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

    return new Ok(accessors.get(indexOfTheBufferView)!);
  }

  /**
   * Registers a member field of the component class for memory allocation.
   * This method defines the memory layout and characteristics of component data members.
   *
   * @param bufferUse - The intended purpose/type of buffer use
   * @param memberName - The name of the member field
   * @param dataClassType - The class type of the data
   * @param shaderType - The shader type (e.g., VertexShader, PixelShader)
   * @param componentType - The primitive data type (e.g., Float32, Int32)
   * @param initValues - Initial values for the member field
   * @param convertToBool - Whether to convert the member value to a boolean
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
    }
  ) {
    if (!Component.__memberInfo.has(this)) {
      Component.__memberInfo.set(this, new Map());
    }
    const memberInfoArray = Component.__memberInfo.get(this);

    memberInfoArray!.set(memberName, {
      bufferUse: bufferUse,
      memberName: memberName,
      dataClassType: dataClassType,
      shaderType: shaderType,
      compositionType: compositionType,
      componentType: componentType,
      initValues: initValues,
      convertToBool: convertToBool,
    });

    if (arrayLength != null && componentSID != null) {
      if (!Component.__arrayLengthMap.has(this)) {
        Component.__arrayLengthMap.set(this, new Map());
      }
      const arrayLengthMap = Component.__arrayLengthMap.get(this);
      if (!arrayLengthMap!.has(memberName)) {
        arrayLengthMap!.set(memberName, new Map());
      }
      arrayLengthMap!.get(memberName)!.set(componentSID, arrayLength);
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
    Component.__componentCountPerBufferView.set(componentClass, componentCountPerBufferView);
    const memberInfoArray = Component.__memberInfo.get(componentClass)!;

    // Do this only for the first entity of the component
    const indexOfTheBufferView = Math.floor(this._component_sid / componentCountPerBufferView);
    if (this._component_sid % componentCountPerBufferView === 0) {
      getBufferViewsAndAccessors(indexOfTheBufferView, this._component_sid);
    }

    // take a field value allocation for each entity for each member field
    memberInfoArray.forEach(info => {
      this.__takeOne(
        info.memberName,
        info.dataClassType,
        info.initValues,
        isReUse,
        this._component_sid,
        componentCountPerBufferView
      );
    });

    // inner function

    function getBufferViewsAndAccessors(indexOfTheBufferView: IndexOfTheBufferView, componentSID: ComponentSID) {
      // for each member field, take a BufferView for all entities' the member field.
      // take a Accessor for all entities for each member fields (same as BufferView)
      memberInfoArray.forEach(info => {
        const arrayLength = Component.__arrayLengthMap.get(componentClass)?.get(info.memberName)?.get(componentSID);
        const accessorResult = Component.__takeAccessor(
          info.bufferUse,
          info.memberName,
          componentClass,
          info.compositionType,
          info.componentType,
          indexOfTheBufferView,
          componentCountPerBufferView,
          arrayLength ?? 1,
          componentSID
        );
        if (accessorResult.isErr()) {
          throw new RnException(accessorResult.getRnError());
        }
        let byteOffsetOfAccessorInBufferOfMembers =
          Component.__byteOffsetOfAccessorInBufferOfMembers.get(componentClass);
        if (byteOffsetOfAccessorInBufferOfMembers == null) {
          byteOffsetOfAccessorInBufferOfMembers = new Map();
          Component.__byteOffsetOfAccessorInBufferOfMembers.set(componentClass, byteOffsetOfAccessorInBufferOfMembers);
        }
        let byteOffsetOfAccessorInBufferOfMember = byteOffsetOfAccessorInBufferOfMembers.get(info.memberName);
        if (byteOffsetOfAccessorInBufferOfMember == null) {
          byteOffsetOfAccessorInBufferOfMember = new Map();
          Component.__byteOffsetOfAccessorInBufferOfMembers
            .get(componentClass)!
            .set(info.memberName, byteOffsetOfAccessorInBufferOfMember);
        }
        byteOffsetOfAccessorInBufferOfMember.set(indexOfTheBufferView, accessorResult.get().byteOffsetInBuffer);
      });
    }
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
   * @param componentType - The component class type
   * @param memberName - The name of the member field
   * @returns The pixel location offset in the buffer
   */
  static getLocationOffsetOfMemberOfComponent(componentType: typeof Component, memberName: string): IndexOf16Bytes[] {
    const locationOffsets = [];
    const byteOffsetOfAccessorInBuffer = Component.__byteOffsetOfAccessorInBufferOfMembers.get(componentType);
    if (byteOffsetOfAccessorInBuffer == null) {
      return [0]; // indicate that this is invalid value
    }
    const byteOffsetOfAccessorInBufferOfMember = byteOffsetOfAccessorInBuffer.get(memberName)!;
    for (let key of byteOffsetOfAccessorInBufferOfMember?.keys() ?? []) {
      locationOffsets.push(byteOffsetOfAccessorInBufferOfMember.get(key)! / 4 / 4);
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
   * @param memberName - The name of the member field
   * @param componentClass - The component class to query
   * @returns The CompositionType of the member or undefined if not found
   */
  static getCompositionTypeOfMember(
    memberName: string,
    componentClass: typeof Component
  ): CompositionTypeEnum | undefined {
    const memberInfoArray = this.__memberInfo.get(componentClass)!;
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
  static getComponentTypeOfMember(memberName: string, componentClass: typeof Component): ComponentTypeEnum | undefined {
    const memberInfoArray = this.__memberInfo.get(componentClass)!;
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
  static getMemberInfo(): Map<typeof Component, Map<MemberName, MemberInfo>> {
    return new Map(this.__memberInfo);
  }

  /**
   * Gets the number of components per buffer view for the component.
   * @returns The number of components per buffer view for the component
   */
  static getComponentCountPerBufferView(): Map<typeof Component, Count> {
    return new Map(Component.__componentCountPerBufferView);
  }

  /**
   * Gets the array length of a specific member field in a component class.
   * @returns The array length map of the component
   */
  static getArrayLengthOfMember(): Map<typeof Component, Map<MemberName, Map<ComponentSID, Count>>> {
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
   * Gets the state version of the component.
   * This is incremented whenever the component's state changes.
   * @returns The state version number
   */
  static getStateVersion() {
    return Component.__stateVersion;
  }
}
