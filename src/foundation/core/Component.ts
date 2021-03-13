import MemoryManager from '../core/MemoryManager';
import EntityRepository from './EntityRepository';
import BufferView from '../memory/BufferView';
import Accessor from '../memory/Accessor';
import {BufferUseEnum} from '../definitions/BufferUse';
import {ComponentTypeEnum} from '../../foundation/definitions/ComponentType';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../../foundation/definitions/CompositionType';
import {ProcessStage, ProcessStageEnum} from '../definitions/ProcessStage';
import {ProcessApproachEnum} from '../definitions/ProcessApproach';
import ComponentRepository from './ComponentRepository';
import Config from './Config';
import WebGLStrategy from '../../webgl/WebGLStrategy';
import RenderPass from '../renderer/RenderPass';
import RnObject from './RnObject';
import {
  EntityUID,
  ComponentSID,
  TypedArray,
  Count,
  Byte,
} from '../../commontypes/CommonTypes';
import Entity from './Entity';

export function fromTensorToCompositionType(tensorClass: any) {
  switch (tensorClass.name) {
    case 'Scalar':
    case 'MutableScalar':
      return CompositionType.Scalar;
    case 'Vector2':
    case 'MutableVector2':
      return CompositionType.Vec2;
    case 'Vector3':
    case 'MutableVector3':
      return CompositionType.Vec3;
    case 'Vector4':
    case 'MutableVector4':
    case 'Quaternion':
    case 'MutableQuaternion':
      return CompositionType.Vec4;
    case 'Matrix22':
    case 'MutableMatrix22':
      return CompositionType.Mat2;
    case 'Matrix33':
    case 'MutableMatrix33':
      return CompositionType.Mat3;
    case 'Matrix44':
    case 'MutableMatrix44':
      return CompositionType.Mat4;
    default:
      return CompositionType.Unknown;
  }
}

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
 */
export default class Component extends RnObject {
  private _component_sid: number;
  static readonly invalidComponentSID = -1;
  protected __currentProcessStage: ProcessStageEnum = ProcessStage.Create;
  protected static __componentsOfProcessStages: Map<
    ProcessStageEnum,
    Int32Array
  > = new Map();
  protected static __lengthOfArrayOfProcessStages: Map<
    ProcessStageEnum,
    number
  > = new Map();
  // protected static __dirtyOfArrayOfProcessStages: Map<ProcessStageEnum, boolean> = new Map();
  private static __bufferViews: Map<
    Function,
    Map<BufferUseEnum, BufferView>
  > = new Map();
  private static __accessors: Map<Function, Map<string, Accessor>> = new Map();
  private static __byteLengthSumOfMembers: Map<
    Function,
    Map<BufferUseEnum, Byte>
  > = new Map();

  private static __memberInfo: Map<Function, MemberInfo[]> = new Map();
  private static __members: Map<
    Function,
    Map<BufferUseEnum, Array<MemberInfo>>
  > = new Map();
  private __byteOffsetOfThisComponent: Byte = -1;

  private __isAlive: Boolean;
  protected __entityUid: EntityUID;
  protected __memoryManager: MemoryManager;
  protected __entityRepository: EntityRepository;
  private __maxComponentNumber: Count = Config.maxEntityNumber;

  public static readonly _processStages: Array<ProcessStageEnum> = [
    ProcessStage.Create,
    ProcessStage.Load,
    // ProcessStage.Mount,
    ProcessStage.Logic,
    ProcessStage.PreRender,
    ProcessStage.Render,
    // ProcessStage.Unmount,
    // ProcessStage.Discard
  ];

  /**
   * The constructor of the Component class.
   * When creating an Component, use the createComponent method of the ComponentRepository class
   * instead of directly calling this constructor.
   * @param entityUid Unique ID of the corresponding entity
   * @param componentSid Scoped ID of the Component
   * @param entityRepository The instance of the EntityRepository class (Dependency Injection)
   */
  constructor(
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository
  ) {
    super();

    this.__entityUid = entityUid;
    this._component_sid = componentSid;
    this.__isAlive = true;

    const stages = Component._processStages;

    stages.forEach(stage => {
      if (this.isExistProcessStageMethod(stage)) {
        if (Component.__componentsOfProcessStages.get(stage) == null) {
          Component.__componentsOfProcessStages.set(
            stage,
            new Int32Array(Config.maxEntityNumber)
          );
          // Component.__dirtyOfArrayOfProcessStages.set(stage, false);
          Component.__lengthOfArrayOfProcessStages.set(stage, 0);
        }
      }
    });
    this.__memoryManager = MemoryManager.getInstance();
    this.__entityRepository = entityRepository;
  }

  set maxNumberOfComponent(value: number) {
    this.__maxComponentNumber = value;
  }

  get maxNumberOfComponent() {
    return this.__maxComponentNumber;
  }

  /**
   * Move to the other stages of process
   * @param processStage stage of component's process
   */
  moveStageTo(processStage: ProcessStageEnum) {
    // Component.__dirtyOfArrayOfProcessStages.set(this.__currentProcessStage, false);
    // Component.__dirtyOfArrayOfProcessStages.set(processStage, true);
    this.__currentProcessStage = processStage;
  }

  /**
   * Get the Type ID of the Component
   */
  static get componentTID() {
    return 0;
  }

  /**
   * Get the Scoped ID of the Component
   */
  get componentSID() {
    return this._component_sid;
  }

  /**
   * Get the unique ID of the entity corresponding to the component.
   */
  get entityUID() {
    return this.__entityUid;
  }

  /**
   * Get the current process stage of the component.
   */
  get currentProcessStage() {
    return this.__currentProcessStage;
  }

  /**
   * Get true or false whether the specified ProcessStage exists in Component.
   */
  static isExistProcessStageMethod(
    componentType: typeof Component,
    processStage: ProcessStageEnum,
    componentRepository: ComponentRepository
  ) {
    if ((componentType.prototype as any)[processStage.methodName] == null) {
      return false;
    }

    return true;
  }

  /**
   * Get true or false whether the specified ProcessStage exists in Component.
   */
  isExistProcessStageMethod(processStage: ProcessStageEnum) {
    if ((this as any)[processStage.methodName] == null) {
      return false;
    }

    return true;
  }

  /**
   * Process the components
   * @param param0 params
   */
  static process({
    componentType,
    processStage,
    processApproach,
    componentRepository,
    strategy,
    renderPass,
    renderPassTickCount,
  }: {
    componentType: typeof Component;
    processStage: ProcessStageEnum;
    processApproach: ProcessApproachEnum;
    componentRepository: ComponentRepository;
    strategy: WebGLStrategy;
    renderPass?: RenderPass;
    renderPassTickCount: Count;
  }) {
    if (
      !Component.isExistProcessStageMethod(
        componentType,
        processStage,
        componentRepository
      )
    ) {
      return;
    }

    const methodName = processStage.methodName;
    const array = this.__componentsOfProcessStages.get(processStage)!;
    const components:
      | Component[]
      | undefined = componentRepository._getComponents(componentType);
    for (let i = 0; i < array.length; ++i) {
      const componentSid = array[i];
      if (componentSid === Component.invalidComponentSID) {
        return;
      }
      const component = components![componentSid];
      (component! as any)[methodName]({
        i,
        processStage,
        processApproach,
        strategy,
        renderPass,
        renderPassTickCount,
      });
    }
  }

  /**
   * Update all components at each process stage.
   */
  static updateComponentsOfEachProcessStage(
    componentClass: typeof Component,
    processStage: ProcessStageEnum,
    componentRepository: ComponentRepository,
    renderPass?: RenderPass
  ) {
    if (
      !Component.isExistProcessStageMethod(
        componentClass,
        processStage,
        componentRepository
      )
    ) {
      return;
    }

    const array = Component.__componentsOfProcessStages.get(processStage)!;
    if (array) {
      const method = (componentClass as any)['sort_' + processStage.methodName];

      if (method != null) {
        let sids = [];
        sids = method(renderPass);
        for (let i = 0; i < sids.length; i++) {
          array[i] = sids[i];
        }
      } else {
        let count = 0;
        const components = componentRepository.getComponentsWithType(
          componentClass
        )!;
        for (let i = 0; i < components.length; ++i) {
          const component = components[i];
          if (processStage === component.__currentProcessStage) {
            array[count++] = i;
          }
        }
        array[count] = Component.invalidComponentSID;
      }
    }
  }

  /**
   * get byte length of sum of member fields in the component class
   */
  static getByteLengthSumOfMembers(
    bufferUse: BufferUseEnum,
    componentClass: Function
  ) {
    const byteLengthSumOfMembers = this.__byteLengthSumOfMembers.get(
      componentClass
    )!;
    return byteLengthSumOfMembers.get(bufferUse)!;
  }

  static setupBufferView() {}

  /**
   * register a dependency for the other components.
   */
  registerDependency(component: Component, isMust: boolean) {}

  /**
   * take a buffer view from the buffer.
   */
  static takeBufferView(
    bufferUse: BufferUseEnum,
    componentClass: Function,
    byteLengthSumOfMembers: Byte,
    count: Count
  ) {
    const buffer = MemoryManager.getInstance().createOrGetBuffer(bufferUse);

    if (!this.__bufferViews.has(componentClass)) {
      this.__bufferViews.set(componentClass, new Map());
    }

    const bufferViews = this.__bufferViews.get(componentClass)!;
    if (!bufferViews.has(bufferUse)) {
      const bufferView = buffer.takeBufferView({
        byteLengthToNeed: byteLengthSumOfMembers * count,
        byteStride: 0,
        isAoS: false,
      });
      bufferViews.set(bufferUse, bufferView);
      return bufferView;
    }

    return void 0;
  }

  /**
   * take one memory area for the specified member for all same type of the component instances.
   */
  takeOne(memberName: string, dataClassType: any, initValues: number[]): any {
    if (!(this as any)['_' + memberName].isDummy()) {
      return;
    }
    const taken = Component.__accessors
      .get(this.constructor)!
      .get(memberName)!
      .takeOne();
    (this as any)['_' + memberName] = new dataClassType(taken, false, true);

    for (let i = 0; i < (this as any)['_' + memberName].v.length; ++i) {
      (this as any)['_' + memberName].v[i] = initValues[i];
    }

    return null;
  }

  /**
   * get the taken accessor for the member field.
   */
  static getAccessor(memberName: string, componentClass: Function): Accessor {
    return this.__accessors.get(componentClass)!.get(memberName)!;
  }

  /**
   * take one accessor for the member field.
   */
  static takeAccessor(
    bufferUse: BufferUseEnum,
    memberName: string,
    componentClass: Function,
    compositionType: CompositionTypeEnum,
    componentType: ComponentTypeEnum,
    count: Count
  ) {
    if (!this.__accessors.has(componentClass)) {
      this.__accessors.set(componentClass, new Map());
    }

    const accessors = this.__accessors.get(componentClass)!;

    if (!accessors.has(memberName)) {
      const bufferViews = this.__bufferViews.get(componentClass)!;

      const bytes =
        compositionType.getNumberOfComponents() *
        componentType.getSizeInBytes();
      let alignedBytes = bytes;
      if (bytes % 16 !== 0) {
        alignedBytes += bytes % 16 === 0 ? 0 : 16 - (bytes % 16);
      }

      const accessor = bufferViews.get(bufferUse)!.takeFlexibleAccessor({
        compositionType: compositionType,
        componentType,
        count: count,
        byteStride: alignedBytes,
        byteAlign: 16,
      });
      accessors.set(memberName, accessor);
      return accessor;
    } else {
      return void 0;
    }
  }

  static getByteOffsetOfThisComponentTypeInBuffer(
    bufferUse: BufferUseEnum,
    componentClass: Function
  ): Byte {
    return this.__bufferViews.get(componentClass)!.get(bufferUse)!
      .byteOffsetInBuffer;
  }

  static getByteOffsetOfFirstOfThisMemberInBuffer(
    memberName: string,
    componentClass: Function
  ): Byte {
    return this.__accessors.get(componentClass)!.get(memberName)!
      .byteOffsetInBuffer;
  }

  static getByteOffsetOfFirstOfThisMemberInBufferView(
    memberName: string,
    componentClass: Function
  ): Byte {
    return this.__accessors.get(componentClass)!.get(memberName)!
      .byteOffsetInBufferView;
  }

  static getCompositionTypeOfMember(
    memberName: string,
    componentClass: Function
  ): CompositionTypeEnum | null {
    const memberInfoArray = this.__memberInfo.get(componentClass)!;
    const info = memberInfoArray.find(info => {
      return info.memberName === memberName;
    });
    if (info != null) {
      return info.compositionType;
    } else {
      return null;
    }
  }

  static getComponentTypeOfMember(
    memberName: string,
    componentClass: Function
  ): ComponentTypeEnum | null {
    const memberInfoArray = this.__memberInfo.get(componentClass)!;
    const info = memberInfoArray.find(info => {
      return info.memberName === memberName;
    });
    if (info != null) {
      return info.componentType;
    } else {
      return null;
    }
  }

  /**
   * Register a member field of component class for memory allocation.
   * @param bufferUse purpose type of buffer use
   * @param memberName the name of member field
   * @param dataClassType a class of data
   * @param componentType a type of number
   * @param initValues a initial value
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
   * Allocate memory of self member fields
   * @param count a number of entities to need allocate
   */
  submitToAllocation(count: Count) {
    const componentClass = this.constructor;
    const memberInfoArray = Component.__memberInfo.get(componentClass)!;

    if (this._component_sid === 0) {
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

      // take a BufferView for all entities for each member fields.
      for (const bufferUse of member.keys()) {
        const infoArray = member.get(bufferUse)!;
        if (!Component.__byteLengthSumOfMembers.has(componentClass)) {
          Component.__byteLengthSumOfMembers.set(componentClass, new Map());
        }
        const byteLengthSumOfMembers = Component.__byteLengthSumOfMembers.get(
          componentClass
        )!;
        if (!byteLengthSumOfMembers.has(bufferUse)) {
          byteLengthSumOfMembers.set(bufferUse, 0);
        }
        infoArray.forEach(info => {
          byteLengthSumOfMembers.set(
            bufferUse,
            byteLengthSumOfMembers.get(bufferUse)! +
              info.compositionType.getNumberOfComponents() *
                info.componentType.getSizeInBytes()
          );
        });
        if (infoArray.length > 0) {
          const bufferView = Component.takeBufferView(
            bufferUse,
            componentClass,
            byteLengthSumOfMembers.get(bufferUse)!,
            count
          );
          this.__byteOffsetOfThisComponent = bufferView!.byteOffsetInBuffer;
        }
      }

      // take a Accessor for all entities for each member fields (same as BufferView)
      for (const bufferUse of member.keys()) {
        const infoArray = member.get(bufferUse)!;
        infoArray.forEach(info => {
          const accessor = Component.takeAccessor(
            info.bufferUse,
            info.memberName,
            componentClass,
            info.compositionType,
            info.componentType,
            count
          );
          (this as any)[
            '_byteOffsetOfAccessorInBuffer_' + info.memberName
          ] = accessor!.byteOffsetInBuffer;
          (this as any)[
            '_byteOffsetOfAccessorInComponent_' + info.memberName
          ] = accessor!.byteOffsetInBufferView;
        });
      }
    }

    const member = Component.__members.get(componentClass)!;

    // take a field value allocation for each entity for each member field
    for (const bufferUse of member.keys()) {
      const infoArray = member.get(bufferUse)!;
      infoArray.forEach(info => {
        this.takeOne(info.memberName, info.dataClassType, info.initValues);
      });
    }
  }

  /**
   * get the entity which has this component.
   * @returns the entity which has this component
   */
  get entity(): Entity {
    return this.__entityRepository.getEntity(this.__entityUid);
  }

  /**
   * get the bytes Information of the member
   * @param component a instance of the component
   * @param memberName the member of component in string
   * @returns bytes information
   */
  static getDataByteInfoInner(component: Component, memberName: string) {
    const data = (component as any)['_' + memberName];
    const typedArray = data.v as TypedArray;
    const byteOffsetInBuffer = typedArray.byteOffset;
    const byteLength = typedArray.byteLength;
    const componentNumber = typedArray.length;
    const locationOffsetInBuffer = byteOffsetInBuffer / 4 / 4; // 4byte is the size of Float32Array, and texel fetch is 4 components unit.
    const byteOffsetInThisComponent =
      (this as any)['_byteOffsetOfAccessorInComponent_' + memberName] +
      component.componentSID * componentNumber * 4;
    const locationOffsetInThisComponent =
      (this as any)['_byteOffsetOfAccessorInComponent_' + memberName] +
      component.componentSID * componentNumber;
    const thisComponentByteOffsetInBuffer =
      component.__byteOffsetOfThisComponent;
    const thisComponentLocationOffsetInBuffer =
      component.__byteOffsetOfThisComponent / 4 / 4;

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
   * get the bytes Information of the member
   * @param memberName the member of component in string
   * @returns bytes information
   */
  getDataByteInfo(memberName: string) {
    return Component.getDataByteInfoInner(this, memberName);
  }

  /**
   * get the bytes Information of the member (static version) by ComponentSID
   * @param componentType the Component type
   * @param componentSID the ComponentSID of the component
   * @param memberName the member of component in string
   * @returns bytes information
   */
  static getDataByteInfoByComponentSID(
    componentType: typeof Component,
    componentSID: ComponentSID,
    memberName: string
  ) {
    const component = ComponentRepository.getInstance().getComponent(
      componentType,
      componentSID
    );
    if (component) {
      return Component.getDataByteInfoInner(component, memberName);
    }

    return void 0;
  }

  /**
   * get the bytes Information of the member (static version) by EntityUID
   * @param componentType the component type
   * @param entityUID the EntityUID
   * @param memberName the member of component in string
   * @returns bytes information
   */
  static getDataByteInfoByEntityUID(
    componentType: typeof Component,
    entityUID: EntityUID,
    memberName: string
  ) {
    const component = EntityRepository.getInstance().getComponentOfEntity(
      entityUID,
      componentType
    );
    if (component) {
      return Component.getDataByteInfoInner(component, memberName);
    }

    return void 0;
  }

  /**
   * get the Pixel Location Offset in the Buffer of the Member
   * @param componentType the component type (e.g. TransformComponent )
   * @param memberName the member name in string
   * @returns the pixel offsets
   */
  static getLocationOffsetOfMemberOfComponent(
    componentType: typeof Component,
    memberName: string
  ) {
    const component = ComponentRepository.getInstance().getComponent(
      componentType,
      0
    );
    return (
      (component as any)['_byteOffsetOfAccessorInBuffer_' + memberName] / 4 / 4
    );
  }

  // $create() {
  //   // Define process dependencies with other components.
  //   // If circular dependencies are detected, the error will be reported.

  //   // this.registerDependency(TransformComponent);
  // }

  // $load() {}

  // $mount() {}

  // $logic() {}

  // $prerender(instanceIDBufferUid: CGAPIResourceHandle) {}

  // $render() {}

  // $unmount() {}

  // $discard() {}
}
