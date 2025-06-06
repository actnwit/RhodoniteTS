import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { Byte, ComponentSID, Count, EntityUID, TypedArray } from '../../types/CommonTypes';
import type { ComponentToComponentMethods } from '../components/ComponentTypes';
import { MemoryManager } from '../core/MemoryManager';
import type { BufferUseEnum } from '../definitions/BufferUse';
import { ProcessStage, type ProcessStageEnum } from '../definitions/ProcessStage';
import type { Accessor } from '../memory/Accessor';
import type { BufferView } from '../memory/BufferView';
import { RnException } from '../misc';
import { Err, type Result } from '../misc/Result';
import type { RenderPass } from '../renderer/RenderPass';
import { ComponentRepository } from './ComponentRepository';
import { Config } from './Config';
import type { IEntity } from './Entity';
import type { EntityRepository } from './EntityRepository';
import { RnObject } from './RnObject';

type MemberInfo = {
  memberName: string;
  bufferUse: BufferUseEnum;
  dataClassType: unknown;
  compositionType: CompositionTypeEnum;
  componentType: ComponentTypeEnum;
  initValues: number[];
};

/**
 * Component is a functional unit that can be added to an Entity instance.
 * This is the base class for all components in the ECS (Entity-Component-System) architecture.
 * Components provide specific functionality and data to entities.
 */
export class Component extends RnObject {
  private _component_sid: number;
  _isAlive = true;
  protected __currentProcessStage: ProcessStageEnum = ProcessStage.Load;
  private static __bufferViews: Map<Function, Map<BufferUseEnum, BufferView>> = new Map();
  private static __accessors: Map<Function, Map<string, Accessor>> = new Map();
  private static __byteLengthSumOfMembers: Map<Function, Map<BufferUseEnum, Byte>> = new Map();

  private static __memberInfo: Map<Function, MemberInfo[]> = new Map();
  private static __members: Map<Function, Map<BufferUseEnum, Array<MemberInfo>>> = new Map();
  private __byteOffsetOfThisComponent: Byte = -1;

  /** the entity unique Id which this component belongs to  */
  protected __entityUid: EntityUID;

  /** the instance of MemoryManager */
  protected __memoryManager: MemoryManager;

  /** the instance of EntityRepository */
  protected __entityRepository: EntityRepository;

  /** the MaxComponent Number of entities */
  private __maxComponentNumber: Count = Config.maxEntityNumber;

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
  constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean) {
    super();

    this.__entityUid = entityUid;
    this._component_sid = componentSid;

    const stages = Component._processStages;

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
   * Sets the maximum number of components of this type that can exist.
   * This method is intended to be called by component classes only.
   *
   * @internal
   * @param value - The maximum number of components
   */
  _setMaxNumberOfComponent(value: number) {
    this.__maxComponentNumber = value;
  }

  /**
   * Gets the maximum number of components of this type that can exist.
   *
   * @returns The maximum number of components
   */
  get maxNumberOfComponent() {
    return this.__maxComponentNumber;
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
    processStage: ProcessStageEnum,
    renderPass: RenderPass
  ) {
    const method = (componentClass as any).sort_$render;
    return method(renderPass);
  }

  /**
   * Gets the total byte length of all member fields for a specific buffer use type
   * in the given component class.
   *
   * @param bufferUse - The buffer use type
   * @param componentClass - The component class
   * @returns The total byte length of members
   */
  static getByteLengthSumOfMembers(bufferUse: BufferUseEnum, componentClass: Function) {
    const byteLengthSumOfMembers = this.__byteLengthSumOfMembers.get(componentClass)!;
    return byteLengthSumOfMembers.get(bufferUse)!;
  }

  /**
   * Registers a dependency relationship with another component.
   * This method is intended for future use in managing component dependencies.
   *
   * @param component - The component to depend on
   * @param isMust - Whether this dependency is required
   * @todo This method is not used yet and needs implementation
   */
  registerDependency(component: Component, isMust: boolean) {}

  /**
   * Allocates memory for a specific member field of this component instance.
   * This method takes one memory slot from the shared memory pool for the specified member.
   *
   * @param memberName - The name of the member field
   * @param dataClassType - The data class type for the member
   * @param initValues - Initial values to set for the member
   * @param isReUse - Whether to reuse an existing memory slot
   * @param componentSid - The component scoped ID
   * @returns null on success
   */
  takeOne(
    memberName: string,
    dataClassType: any,
    initValues: number[],
    isReUse: boolean,
    componentSid: ComponentSID
  ): any {
    if (!(this as any)[`_${memberName}`].isDummy()) {
      return;
    }

    let taken: TypedArray | undefined;
    if (isReUse) {
      taken = Component.__accessors.get(this.constructor)!.get(memberName)!._takeExistedOne(componentSid);
    } else {
      taken = Component.__accessors.get(this.constructor)!.get(memberName)!.takeOne();
    }
    (this as any)[`_${memberName}`] = new dataClassType(taken, false, true);

    for (let i = 0; i < (this as any)[`_${memberName}`]._v.length; ++i) {
      (this as any)[`_${memberName}`]._v[i] = initValues[i];
    }

    return null;
  }

  /**
   * Gets the memory accessor for a specific member field of a component class.
   * The accessor provides access to the underlying typed array data.
   *
   * @param memberName - The name of the member field
   * @param componentClass - The component class
   * @returns The accessor for the member field
   */
  static getAccessor(memberName: string, componentClass: Function): Accessor {
    return this.__accessors.get(componentClass)!.get(memberName)!;
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
  static takeAccessor(
    bufferUse: BufferUseEnum,
    memberName: string,
    componentClass: Function,
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum,
    count: Count
  ): Result<Accessor, undefined> {
    if (!this.__accessors.has(componentClass)) {
      this.__accessors.set(componentClass, new Map());
    }

    const accessors = this.__accessors.get(componentClass)!;

    if (!accessors.has(memberName)) {
      const bytes = compositionType.getNumberOfComponents() * componentType.getSizeInBytes();
      const buffer = MemoryManager.getInstance().createOrGetBuffer(bufferUse);
      const bufferViewResult = buffer.takeBufferView({
        byteLengthToNeed: bytes * count,
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
        count: count,
        byteStride: bytes,
      });
      if (accessorResult.isErr()) {
        return new Err({
          message: `Failed to take accessor: ${accessorResult.getRnError().message}`,
          error: undefined,
        });
      }
      accessors.set(memberName, accessorResult.get());
      return accessorResult;
    }
    return new Err({
      message: 'Already taken',
      error: undefined,
    });
  }

  /**
   * Gets the byte offset of the component type's data within the buffer.
   *
   * @param bufferUse - The buffer use type
   * @param componentClass - The component class
   * @returns The byte offset in the buffer
   */
  static getByteOffsetOfThisComponentTypeInBuffer(bufferUse: BufferUseEnum, componentClass: Function): Byte {
    return this.__bufferViews.get(componentClass)!.get(bufferUse)!.byteOffsetInBuffer;
  }

  /**
   * Gets the byte offset of the first element of a specific member field within the buffer.
   *
   * @param memberName - The name of the member field
   * @param componentClass - The component class
   * @returns The byte offset in the buffer
   */
  static getByteOffsetOfFirstOfThisMemberInBuffer(memberName: string, componentClass: Function): Byte {
    return this.__accessors.get(componentClass)!.get(memberName)!.byteOffsetInBuffer;
  }

  /**
   * Gets the byte offset of the first element of a specific member field within the buffer view.
   *
   * @param memberName - The name of the member field
   * @param componentClass - The component class
   * @returns The byte offset in the buffer view
   */
  static getByteOffsetOfFirstOfThisMemberInBufferView(memberName: string, componentClass: Function): Byte {
    return this.__accessors.get(componentClass)!.get(memberName)!.byteOffsetInBufferView;
  }

  /**
   * Registers a member field of the component class for memory allocation.
   * This method defines the memory layout and characteristics of component data members.
   *
   * @param bufferUse - The intended purpose/type of buffer use
   * @param memberName - The name of the member field
   * @param dataClassType - The class type of the data
   * @param componentType - The primitive data type (e.g., Float32, Int32)
   * @param initValues - Initial values for the member field
   */
  registerMember(
    bufferUse: BufferUseEnum,
    memberName: string,
    dataClassType: unknown,
    componentType: ComponentTypeEnum,
    initValues: number[]
  ) {
    if (!Component.__memberInfo.has(this.constructor)) {
      Component.__memberInfo.set(this.constructor, []);
    }
    const memberInfoArray = Component.__memberInfo.get(this.constructor);

    memberInfoArray!.push({
      bufferUse: bufferUse,
      memberName: memberName,
      dataClassType: dataClassType as never,
      compositionType: (dataClassType as any).compositionType,
      componentType: componentType,
      initValues: initValues,
    });
  }

  /**
   * Allocates memory for all member fields of this component instance.
   * This method is called during component initialization to set up memory layout
   * and allocate space for the specified number of entities.
   *
   * @param count - The number of entities to allocate memory for
   * @param isReUse - Whether to reuse existing memory allocations
   */
  submitToAllocation(count: Count, isReUse: boolean): void {
    if (this._component_sid >= count) {
      const componentClass = this.constructor;
      console.error(
        `%c${componentClass.name}: The number of components is over the limit. This may lead to incorrect processing results. Please consider to increase the limit. You can set the limit on Rn.Config.xxxxxx.`,
        'color: red; background: yellow; font-size: 2em;'
      );
    }

    const componentClass = this.constructor;
    const memberInfoArray = Component.__memberInfo.get(componentClass)!;

    // Do this only for the first entity of the component
    if (this._component_sid === 0) {
      getBufferViewsAndAccessors(this);
    }

    const member = Component.__members.get(componentClass)!;

    // take a field value allocation for each entity for each member field
    for (const bufferUse of member.keys()) {
      const infoArray = member.get(bufferUse)!;
      infoArray.forEach(info => {
        this.takeOne(info.memberName, info.dataClassType, info.initValues, isReUse, this._component_sid);
      });
    }

    return;

    // inner function
    function getBufferViewsAndAccessors(that: Component) {
      if (!Component.__members.has(componentClass)) {
        Component.__members.set(componentClass, new Map());
      }
      const member = Component.__members.get(componentClass)!;
      memberInfoArray.forEach(info => {
        member.set(info.bufferUse, []);
      });
      memberInfoArray.forEach(info => {
        member.get(info.bufferUse)!.push(info);
      });

      // for each member field, take a BufferView for all entities' the member field.
      for (const bufferUse of member.keys()) {
        const infoArray = member.get(bufferUse)!;
        if (!Component.__byteLengthSumOfMembers.has(componentClass)) {
          Component.__byteLengthSumOfMembers.set(componentClass, new Map());
        }
        const byteLengthSumOfMembers = Component.__byteLengthSumOfMembers.get(componentClass)!;
        if (!byteLengthSumOfMembers.has(bufferUse)) {
          byteLengthSumOfMembers.set(bufferUse, 0);
        }
        infoArray.forEach(info => {
          byteLengthSumOfMembers.set(
            bufferUse,
            byteLengthSumOfMembers.get(bufferUse)! +
              info.compositionType.getNumberOfComponents() * info.componentType.getSizeInBytes()
          );
        });
        if (infoArray.length > 0) {
          // const bufferView = Component.takeBufferView(
          //   bufferUse,
          //   componentClass,
          //   byteLengthSumOfMembers.get(bufferUse)!,
          //   count
          // );
          // that.__byteOffsetOfThisComponent = bufferView!.byteOffsetInBuffer;
        }
      }

      // take a Accessor for all entities for each member fields (same as BufferView)
      for (const bufferUse of member.keys()) {
        const infoArray = member.get(bufferUse)!;
        infoArray.forEach(info => {
          const accessorResult = Component.takeAccessor(
            info.bufferUse,
            info.memberName,
            componentClass,
            info.compositionType,
            info.componentType,
            count
          );
          if (accessorResult.isErr()) {
            throw new RnException(accessorResult.getRnError());
          }
          (that as any)[`_byteOffsetOfAccessorInBuffer_${info.memberName}`] = accessorResult.get().byteOffsetInBuffer;
          (that as any)[`_byteOffsetOfAccessorInComponent_${info.memberName}`] =
            accessorResult.get().byteOffsetInBufferView;
        });
      }
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
   * Gets detailed byte information about a specific member field of a component.
   * This includes offsets, lengths, and location information for GPU access.
   *
   * @param component - The component instance to analyze
   * @param memberName - The name of the member field
   * @returns Detailed byte information object
   */
  static getDataByteInfoInner(component: Component, memberName: string) {
    const data = (component as any)[`_${memberName}`];
    const typedArray = data._v as TypedArray;
    const byteOffsetInBuffer = typedArray.byteOffset;
    const byteLength = typedArray.byteLength;
    const componentNumber = typedArray.length;
    const locationOffsetInBuffer = byteOffsetInBuffer / 4 / 4; // 4byte is the size of Float32Array, and texel fetch is 4 components unit.
    const byteOffsetInThisComponent =
      (this as any)[`_byteOffsetOfAccessorInComponent_${memberName}`] + component.componentSID * componentNumber * 4;
    const locationOffsetInThisComponent =
      (this as any)[`_byteOffsetOfAccessorInComponent_${memberName}`] + component.componentSID * componentNumber;
    const thisComponentByteOffsetInBuffer = component.__byteOffsetOfThisComponent;
    const thisComponentLocationOffsetInBuffer = component.__byteOffsetOfThisComponent / 4 / 4;

    return {
      byteLength,
      byteOffsetInBuffer,
      byteOffsetInThisComponent,
      locationOffsetInBuffer,
      locationOffsetInThisComponent,
      thisComponentByteOffsetInBuffer,
      thisComponentLocationOffsetInBuffer,
      componentNumber,
    };
  }

  /**
   * Gets detailed byte information about a specific member field of this component.
   * This includes offsets, lengths, and location information for GPU access.
   *
   * @param memberName - The name of the member field
   * @returns Detailed byte information object
   */
  getDataByteInfo(memberName: string) {
    return Component.getDataByteInfoInner(this, memberName);
  }

  /**
   * Gets detailed byte information about a member field by Component SID.
   * This is a static version that looks up the component by its scoped ID.
   *
   * @param componentType - The component class type
   * @param componentSID - The scoped ID of the component
   * @param memberName - The name of the member field
   * @returns Detailed byte information object or undefined if component not found
   */
  static getDataByteInfoByComponentSID(
    componentType: typeof Component,
    componentSID: ComponentSID,
    memberName: string
  ) {
    const component = ComponentRepository.getComponent(componentType, componentSID);
    if (component) {
      return Component.getDataByteInfoInner(component, memberName);
    }

    return void 0;
  }

  /**
   * Gets the pixel location offset in the buffer for a specific member of a component type.
   * This is useful for GPU texture-based data access where locations are measured in pixels.
   *
   * @param componentType - The component class type
   * @param memberName - The name of the member field
   * @returns The pixel location offset in the buffer
   */
  static getLocationOffsetOfMemberOfComponent(componentType: typeof Component, memberName: string) {
    const component = ComponentRepository.getComponent(componentType, 0);
    return (component as any)[`_byteOffsetOfAccessorInBuffer_${memberName}`] / 4 / 4;
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
    base: EntityBase,
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
  static getCompositionTypeOfMember(memberName: string, componentClass: Function): CompositionTypeEnum | undefined {
    const memberInfoArray = this.__memberInfo.get(componentClass)!;
    const info = memberInfoArray.find(info => {
      return info.memberName === memberName;
    });
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
  static getComponentTypeOfMember(memberName: string, componentClass: Function): ComponentTypeEnum | undefined {
    const memberInfoArray = this.__memberInfo.get(componentClass)!;
    const info = memberInfoArray.find(info => {
      return info.memberName === memberName;
    });
    if (info != null) {
      return info.componentType;
    }
    return undefined;
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
  _shallowCopyFrom(component: Component): void {
    // new Error('Not Implemented');
  }
}
