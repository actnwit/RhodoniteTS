// src/foundation/core/Component.ts
import { ComponentType } from "../definitions/ComponentType.js";
import { CompositionType } from "../definitions/CompositionType.js";
import { ProcessStage } from "../definitions/ProcessStage.js";
import { VectorN } from "../math/VectorN.js";
import { RnException } from "../misc/index.js";
import { Err, Ok } from "../misc/Result.js";
import { RnObject } from "./RnObject.js";
var _Component = class _Component extends RnObject {
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
  constructor(engine, entityUid, componentSid, entityRepository, isReUse) {
    super();
    this._isAlive = true;
    this.__isReUse = false;
    this.__currentProcessStage = ProcessStage.Load;
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
  moveStageTo(processStage) {
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
  static doesTheProcessStageMethodExist(componentType, processStage) {
    if (componentType.prototype[processStage.methodName] == null) {
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
  isExistProcessStageMethod(processStage) {
    if (this[processStage.methodName] == null) {
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
  static process(engine, componentType, processStage) {
    if (!_Component.doesTheProcessStageMethodExist(componentType, processStage)) {
      return;
    }
    const methodName = processStage.methodName;
    const components = engine.componentRepository._getComponents(componentType);
    if (components == null) {
      return;
    }
    for (const component of components) {
      if (component == null) {
        continue;
      }
      if (processStage === component.__currentProcessStage) {
        component[methodName]();
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
  static updateComponentsForRenderStage(componentClass, _processStage, renderPass) {
    const method = componentClass.sort_$render;
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
  registerDependency(_component, _isMust) {
  }
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
  __takeOne(memberName, dataClassType, initValues, _isReUse, componentSid, componentCountPerBufferView) {
    const current = this[`_${memberName}`];
    if (current != null && !current.isDummy()) {
      return;
    }
    const indexOfTheBufferView = Math.floor(componentSid / componentCountPerBufferView);
    const indexOfBufferViews = componentSid % componentCountPerBufferView;
    const registry = this._componentMemoryRegistry;
    const componentClass = this.constructor;
    const accessor = registry.getAccessor(componentClass, memberName, indexOfTheBufferView);
    const taken = accessor._takeExistedOne(indexOfBufferViews);
    this[`_${memberName}`] = new dataClassType(taken, false, true);
    if (!(initValues instanceof VectorN)) {
      for (let i = 0; i < this[`_${memberName}`]._v.length; ++i) {
        this[`_${memberName}`]._v[i] = initValues[i];
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
  __takeVariableLengthOne(info, componentSid) {
    var _a, _b, _c, _d;
    const memberName = info.memberName;
    const current = this[`_${memberName}`];
    if (current != null && !current.isDummy()) {
      return;
    }
    const componentClass = this.constructor;
    const registry = this._componentMemoryRegistry;
    const arrayLength = Math.max(
      (_c = (_b = this._getArrayLengthForAllocation(memberName)) != null ? _b : (_a = _Component.__arrayLengthMap.get(componentClass)) == null ? void 0 : _a.get(memberName)) != null ? _c : 1,
      1
    );
    const elementCount = info.compositionType.getNumberOfComponents() * arrayLength;
    const byteLength = elementCount * info.componentType.getSizeInBytes();
    let chunk = registry.getVariableLengthChunk(componentClass, memberName, componentSid);
    if (chunk == null || chunk.byteCapacity < byteLength) {
      if (chunk != null) {
        registry.releaseVariableLengthChunk(componentClass, memberName, chunk);
      }
      chunk = (_d = registry.takeFreeVariableLengthChunk(componentClass, memberName, byteLength)) != null ? _d : _Component.__createVariableLengthChunk(this.__engine, info.bufferUse, byteLength);
      registry.setVariableLengthChunk(componentClass, memberName, componentSid, chunk);
    }
    const bufferView = chunk.bufferView;
    const taken = new Float32Array(
      bufferView.buffer.getArrayBuffer(),
      bufferView.byteOffsetInRawArrayBufferOfBuffer,
      elementCount
    );
    taken.fill(0);
    const dataClassType = info.dataClassType;
    this[`_${memberName}`] = new dataClassType(taken, false, true);
    const locationMember = this[`_${_Component._getVariableLengthLocationMemberName(memberName)}`];
    const radix = _Component._variableLengthLocationRadix;
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
  static __createVariableLengthChunk(engine, bufferUse, byteLength) {
    let bufferViewResult;
    let requireBufferLayerIndex = 0;
    do {
      const buffer = engine.memoryManager.createOrGetBuffer(bufferUse, requireBufferLayerIndex);
      bufferViewResult = buffer.takeBufferView({
        byteLengthToNeed: byteLength,
        byteStride: 0
      });
      if (bufferViewResult.isErr()) {
        requireBufferLayerIndex++;
      }
    } while (bufferViewResult.isErr());
    const bufferView = bufferViewResult.get();
    const byteOffset = engine.memoryManager.getByteOffsetOfExistingBuffers(bufferUse, bufferView.buffer.indexOfTheBufferUsage) + bufferView.byteOffsetInBuffer;
    return {
      bufferView,
      byteCapacity: byteLength,
      location: byteOffset / 4 / 4
    };
  }
  /**
   * Gets the name of the member which holds the location of a variable-length array member.
   *
   * @param memberName - The name of the variable-length array member
   * @returns The name of the location member
   */
  static _getVariableLengthLocationMemberName(memberName) {
    return `${memberName}Location`;
  }
  /**
   * Gets the ComponentMemoryRegistry for this component's engine.
   */
  get _componentMemoryRegistry() {
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
  static __takeAccessor(engine, bufferUse, memberName, componentClass, compositionType, componentType, indexOfTheBufferView, componentCountPerBufferView, arrayLength) {
    const registry = engine.componentMemoryRegistry;
    const bytes = calcAlignedByteLength();
    const existingAccessor = registry.getAccessor(componentClass, memberName, indexOfTheBufferView);
    const accessorIsCompatible = existingAccessor != null && existingAccessor.elementCount === componentCountPerBufferView && existingAccessor.byteStride === bytes && existingAccessor.compositionType === compositionType && existingAccessor.componentType === componentType;
    if (accessorIsCompatible) {
      return new Ok(existingAccessor);
    }
    let bufferViewResult;
    let requireBufferLayerIndex = 0;
    do {
      const buffer = engine.memoryManager.createOrGetBuffer(bufferUse, requireBufferLayerIndex);
      bufferViewResult = buffer.takeBufferView({
        byteLengthToNeed: bytes * componentCountPerBufferView,
        byteStride: 0
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
      arrayLength
    });
    if (accessorResult.isErr()) {
      return new Err({
        message: `Failed to take accessor: ${accessorResult.getRnError().message}`,
        error: void 0
      });
    }
    registry.setAccessor(componentClass, memberName, indexOfTheBufferView, accessorResult.get());
    return accessorResult;
    function calcAlignedByteLength() {
      const compositionNumber = compositionType.getNumberOfComponents();
      const componentSizeInByte = componentType.getSizeInBytes();
      const semanticInfoByte = compositionNumber * componentSizeInByte;
      let alignedByteLength = semanticInfoByte;
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
   * @param isVariableLength - Whether the array member has a per-instance length
   */
  static registerMember({
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
    isVariableLength
  }) {
    if (!_Component.__memberInfo.has(this)) {
      _Component.__memberInfo.set(this, /* @__PURE__ */ new Map());
    }
    const memberInfoArray = _Component.__memberInfo.get(this);
    if (isVariableLength === true) {
      if (compositionType !== CompositionType.Vec4Array && compositionType !== CompositionType.Mat4Array && compositionType !== CompositionType.Mat4x3Array) {
        throw new Error(`Variable-length member ${memberName} must be Vec4Array, Mat4Array or Mat4x3Array.`);
      }
      if (componentType !== ComponentType.Float) {
        throw new Error(`Variable-length member ${memberName} must have the Float component type.`);
      }
      const locationInfo = memberInfoArray.get(_Component._getVariableLengthLocationMemberName(memberName));
      if (locationInfo == null || locationInfo.compositionType !== CompositionType.Vec4) {
        throw new Error(
          `Register a Vec4 member named ${_Component._getVariableLengthLocationMemberName(memberName)} before the variable-length member ${memberName}.`
        );
      }
    }
    memberInfoArray.set(memberName, {
      bufferUse,
      memberName,
      dataClassType,
      shaderType,
      compositionType,
      componentType,
      initValues,
      convertToBool,
      isVariableLength
    });
    if (arrayLength != null && componentSID != null) {
      if (!_Component.__arrayLengthMap.has(this)) {
        _Component.__arrayLengthMap.set(this, /* @__PURE__ */ new Map());
      }
      const arrayLengthMap = _Component.__arrayLengthMap.get(this);
      const currentLength = arrayLengthMap.get(memberName);
      if (currentLength == null || arrayLength > currentLength) {
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
  submitToAllocation(componentCountPerBufferView, isReUse) {
    const componentClass = this.constructor;
    const registry = this._componentMemoryRegistry;
    registry.setComponentCountPerBufferView(componentClass, componentCountPerBufferView);
    const memberInfoArray = _Component.__memberInfo.get(componentClass);
    const engine = this.__engine;
    const indexOfTheBufferView = Math.floor(this._component_sid / componentCountPerBufferView);
    if (this._component_sid % componentCountPerBufferView === 0 || hasMissingAccessor(indexOfTheBufferView)) {
      getBufferViewsAndAccessors(indexOfTheBufferView);
    }
    memberInfoArray.forEach((info) => {
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
    memberInfoArray.forEach((info) => {
      if (info.isVariableLength === true) {
        this.__takeVariableLengthOne(info, this._component_sid);
      }
    });
    function hasMissingAccessor(indexOfTheBufferView2) {
      for (const info of memberInfoArray.values()) {
        if (info.isVariableLength !== true && registry.getAccessor(componentClass, info.memberName, indexOfTheBufferView2) == null) {
          return true;
        }
      }
      return false;
    }
    function getBufferViewsAndAccessors(indexOfTheBufferView2) {
      memberInfoArray.forEach((info) => {
        var _a;
        if (info.isVariableLength === true) {
          return;
        }
        const arrayLength = (_a = _Component.__arrayLengthMap.get(componentClass)) == null ? void 0 : _a.get(info.memberName);
        const accessorResult = _Component.__takeAccessor(
          engine,
          info.bufferUse,
          info.memberName,
          componentClass,
          info.compositionType,
          info.componentType,
          indexOfTheBufferView2,
          componentCountPerBufferView,
          arrayLength != null ? arrayLength : 1
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
        registry.setByteOffset(componentClass, info.memberName, indexOfTheBufferView2, byteOffset);
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
  _getArrayLengthForAllocation(_memberName) {
    return void 0;
  }
  /**
   * Gets the entity that owns this component.
   * This provides access to the entity and its other components.
   *
   * @returns The entity instance that owns this component
   */
  get entity() {
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
  static getLocationOffsetOfMemberOfComponent(engine, componentType, memberName) {
    const locationOffsets = [];
    const registry = engine.componentMemoryRegistry;
    const byteOffsetMap = registry.getByteOffsetsForMember(componentType, memberName);
    if (byteOffsetMap == null) {
      return [0];
    }
    for (const [indexOfTheBufferView, byteOffset] of byteOffsetMap) {
      locationOffsets[indexOfTheBufferView] = byteOffset / 4 / 4;
    }
    for (let i = 0; i < locationOffsets.length; i++) {
      if (locationOffsets[i] === void 0) {
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
  addThisComponentToEntity(_base, _componentClass) {
    throw "Invalid Calling";
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
  static getCompositionTypeOfMember(_engine, memberName, componentClass) {
    const memberInfoArray = _Component.__memberInfo.get(componentClass);
    const info = memberInfoArray.get(memberName);
    if (info != null) {
      return info.compositionType;
    }
    return void 0;
  }
  /**
   * Gets the ComponentType of a specific member field in a component class.
   * This is useful for understanding the primitive data type of component members.
   *
   * @param memberName - The name of the member field
   * @param componentClass - The component class to query
   * @returns The ComponentType of the member or undefined if not found
   */
  static getComponentTypeOfMember(_engine, memberName, componentClass) {
    const memberInfoArray = _Component.__memberInfo.get(componentClass);
    const info = memberInfoArray.get(memberName);
    if (info != null) {
      return info.componentType;
    }
    return void 0;
  }
  /**
   * Gets the member info of the component.
   * This is useful for getting the member info of the component.
   *
   * @returns The member info of the component
   */
  static getMemberInfo(_engine) {
    return new Map(_Component.__memberInfo);
  }
  /**
   * Gets the number of components per buffer view for the component.
   * @returns The number of components per buffer view for the component
   */
  static getComponentCountPerBufferView(engine) {
    return engine.componentMemoryRegistry.getAllComponentCountPerBufferView();
  }
  /**
   * Gets the array length of a specific member field in a component class.
   * @returns The array length map of the component
   */
  static getArrayLengthOfMember(_engine) {
    return new Map(_Component.__arrayLengthMap);
  }
  /**
   * Marks this component as destroyed and no longer alive.
   * This is used internally to manage component lifecycle.
   *
   * @internal
   */
  _destroy() {
    this._isAlive = false;
  }
  /**
   * Performs a shallow copy of data from another component of the same type.
   * This method should be implemented by concrete component classes as needed.
   *
   * @param component - The source component to copy from
   */
  _shallowCopyFrom(_component) {
  }
  /**
   * Gets the state version of the component memory layout.
   * This is incremented whenever the component's memory layout changes.
   *
   * @param engine - The engine instance
   * @returns The state version number
   */
  static getStateVersion(engine) {
    return engine.componentMemoryRegistry.getStateVersion();
  }
};
/**
 * Stores member metadata for each component class.
 * This is class-level static data that doesn't depend on Engine instances.
 */
_Component.__memberInfo = /* @__PURE__ */ new Map();
/**
 * Stores array length information for each component class member.
 * This is class-level static data that doesn't depend on Engine instances.
 */
_Component.__arrayLengthMap = /* @__PURE__ */ new Map();
_Component._processStages = [
  // ProcessStage.Create,
  ProcessStage.Load,
  // ProcessStage.Mount,
  ProcessStage.Logic,
  ProcessStage.Render
  // ProcessStage.Unmount,
  // ProcessStage.Discard
];
/**
 * The radix used to split the location of a variable-length array member into two floats
 * (`location = x * radix + y`), so that both are exactly representable as 32-bit floats.
 */
_Component._variableLengthLocationRadix = 65536;
var Component = _Component;
export {
  Component
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29yZS9Db21wb25lbnQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IENvbXBvbmVudFR5cGUsIHR5cGUgQ29tcG9uZW50VHlwZUVudW0gfSBmcm9tICcuLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0NvbXBvbmVudFR5cGUnO1xuaW1wb3J0IHsgQ29tcG9zaXRpb25UeXBlLCB0eXBlIENvbXBvc2l0aW9uVHlwZUVudW0gfSBmcm9tICcuLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgdHlwZSB7IEJ5dGUsIENvbXBvbmVudFNJRCwgQ291bnQsIEVudGl0eVVJRCwgSW5kZXhPZjE2Qnl0ZXMsIFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFRvQ29tcG9uZW50TWV0aG9kcyB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ29tcG9uZW50VHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBNZW1vcnlNYW5hZ2VyIH0gZnJvbSAnLi4vY29yZS9NZW1vcnlNYW5hZ2VyJztcbmltcG9ydCB0eXBlIHsgQnVmZmVyVXNlRW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0J1ZmZlclVzZSc7XG5pbXBvcnQgeyBQcm9jZXNzU3RhZ2UsIHR5cGUgUHJvY2Vzc1N0YWdlRW51bSB9IGZyb20gJy4uL2RlZmluaXRpb25zL1Byb2Nlc3NTdGFnZSc7XG5pbXBvcnQgdHlwZSB7IFNoYWRlclR5cGVFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvU2hhZGVyVHlwZSc7XG5pbXBvcnQgdHlwZSB7IE11dGFibGVNYXRyaXgzMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZU1hdHJpeDMzJztcbmltcG9ydCB0eXBlIHsgTXV0YWJsZU1hdHJpeDQ0IH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlTWF0cml4NDQnO1xuaW1wb3J0IHR5cGUgeyBNdXRhYmxlUXVhdGVybmlvbiB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVF1YXRlcm5pb24nO1xuaW1wb3J0IHR5cGUgeyBNdXRhYmxlU2NhbGFyIH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlU2NhbGFyJztcbmltcG9ydCB0eXBlIHsgTXV0YWJsZVZlY3RvcjMgfSBmcm9tICcuLi9tYXRoL011dGFibGVWZWN0b3IzJztcbmltcG9ydCB0eXBlIHsgTXV0YWJsZVZlY3RvcjQgfSBmcm9tICcuLi9tYXRoL011dGFibGVWZWN0b3I0JztcbmltcG9ydCB7IFZlY3Rvck4gfSBmcm9tICcuLi9tYXRoL1ZlY3Rvck4nO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NvciB9IGZyb20gJy4uL21lbW9yeS9BY2Nlc3Nvcic7XG5pbXBvcnQgdHlwZSB7IEJ1ZmZlclZpZXcgfSBmcm9tICcuLi9tZW1vcnkvQnVmZmVyVmlldyc7XG5pbXBvcnQgeyBSbkV4Y2VwdGlvbiB9IGZyb20gJy4uL21pc2MnO1xuaW1wb3J0IHsgRXJyLCBPaywgdHlwZSBSZXN1bHQgfSBmcm9tICcuLi9taXNjL1Jlc3VsdCc7XG5pbXBvcnQgdHlwZSB7IFJlbmRlclBhc3MgfSBmcm9tICcuLi9yZW5kZXJlci9SZW5kZXJQYXNzJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5LCBWYXJpYWJsZUxlbmd0aENodW5rIH0gZnJvbSAnLi9Db21wb25lbnRNZW1vcnlSZWdpc3RyeSc7XG5pbXBvcnQgdHlwZSB7IElFbnRpdHkgfSBmcm9tICcuL0VudGl0eSc7XG5pbXBvcnQgdHlwZSB7IEVudGl0eVJlcG9zaXRvcnkgfSBmcm9tICcuL0VudGl0eVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgUm5PYmplY3QgfSBmcm9tICcuL1JuT2JqZWN0JztcblxudHlwZSBEYXRhQ2xhc3NUeXBlID1cbiAgfCB0eXBlb2YgVmVjdG9yTlxuICB8IHR5cGVvZiBNdXRhYmxlTWF0cml4NDRcbiAgfCB0eXBlb2YgTXV0YWJsZU1hdHJpeDMzXG4gIHwgdHlwZW9mIE11dGFibGVWZWN0b3IzXG4gIHwgdHlwZW9mIE11dGFibGVWZWN0b3I0XG4gIHwgdHlwZW9mIE11dGFibGVRdWF0ZXJuaW9uXG4gIHwgdHlwZW9mIE11dGFibGVTY2FsYXI7XG5cbmV4cG9ydCB0eXBlIE1lbWJlckluZm8gPSB7XG4gIG1lbWJlck5hbWU6IHN0cmluZztcbiAgYnVmZmVyVXNlOiBCdWZmZXJVc2VFbnVtO1xuICBkYXRhQ2xhc3NUeXBlOiBEYXRhQ2xhc3NUeXBlO1xuICBzaGFkZXJUeXBlOiBTaGFkZXJUeXBlRW51bTtcbiAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGVFbnVtO1xuICBjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bTtcbiAgaW5pdFZhbHVlczogbnVtYmVyW10gfCBWZWN0b3JOO1xuICBjb252ZXJ0VG9Cb29sPzogYm9vbGVhbjtcbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhpcyBhcnJheSBtZW1iZXIgaGFzIGEgcGVyLWluc3RhbmNlIGxlbmd0aCAoc2VlIGBDb21wb25lbnQucmVnaXN0ZXJNZW1iZXJgKS5cbiAgICovXG4gIGlzVmFyaWFibGVMZW5ndGg/OiBib29sZWFuO1xufTtcblxudHlwZSBNZW1iZXJOYW1lID0gc3RyaW5nO1xudHlwZSBJbmRleE9mVGhlQnVmZmVyVmlldyA9IG51bWJlcjtcblxuLyoqXG4gKiBDb21wb25lbnQgaXMgYSBmdW5jdGlvbmFsIHVuaXQgdGhhdCBjYW4gYmUgYWRkZWQgdG8gYW4gRW50aXR5IGluc3RhbmNlLlxuICogVGhpcyBpcyB0aGUgYmFzZSBjbGFzcyBmb3IgYWxsIGNvbXBvbmVudHMgaW4gdGhlIEVDUyAoRW50aXR5LUNvbXBvbmVudC1TeXN0ZW0pIGFyY2hpdGVjdHVyZS5cbiAqIENvbXBvbmVudHMgcHJvdmlkZSBzcGVjaWZpYyBmdW5jdGlvbmFsaXR5IGFuZCBkYXRhIHRvIGVudGl0aWVzLlxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgUm5PYmplY3Qge1xuICBwcml2YXRlIF9jb21wb25lbnRfc2lkOiBudW1iZXI7XG4gIF9pc0FsaXZlID0gdHJ1ZTtcbiAgcHJvdGVjdGVkIF9faXNSZVVzZSA9IGZhbHNlO1xuICBwcm90ZWN0ZWQgX19lbmdpbmU6IEVuZ2luZTtcbiAgcHJvdGVjdGVkIF9fY3VycmVudFByb2Nlc3NTdGFnZTogUHJvY2Vzc1N0YWdlRW51bSA9IFByb2Nlc3NTdGFnZS5Mb2FkO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgbWVtYmVyIG1ldGFkYXRhIGZvciBlYWNoIGNvbXBvbmVudCBjbGFzcy5cbiAgICogVGhpcyBpcyBjbGFzcy1sZXZlbCBzdGF0aWMgZGF0YSB0aGF0IGRvZXNuJ3QgZGVwZW5kIG9uIEVuZ2luZSBpbnN0YW5jZXMuXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX21lbWJlckluZm86IE1hcDx0eXBlb2YgQ29tcG9uZW50LCBNYXA8TWVtYmVyTmFtZSwgTWVtYmVySW5mbz4+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBTdG9yZXMgYXJyYXkgbGVuZ3RoIGluZm9ybWF0aW9uIGZvciBlYWNoIGNvbXBvbmVudCBjbGFzcyBtZW1iZXIuXG4gICAqIFRoaXMgaXMgY2xhc3MtbGV2ZWwgc3RhdGljIGRhdGEgdGhhdCBkb2Vzbid0IGRlcGVuZCBvbiBFbmdpbmUgaW5zdGFuY2VzLlxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgX19hcnJheUxlbmd0aE1hcDogTWFwPHR5cGVvZiBDb21wb25lbnQsIE1hcDxNZW1iZXJOYW1lLCBDb3VudD4+ID0gbmV3IE1hcCgpO1xuXG4gIC8qKiB0aGUgZW50aXR5IHVuaXF1ZSBJZCB3aGljaCB0aGlzIGNvbXBvbmVudCBiZWxvbmdzIHRvICAqL1xuICBwcm90ZWN0ZWQgX19lbnRpdHlVaWQ6IEVudGl0eVVJRDtcblxuICAvKiogdGhlIGluc3RhbmNlIG9mIE1lbW9yeU1hbmFnZXIgKi9cbiAgcHJvdGVjdGVkIF9fbWVtb3J5TWFuYWdlcjogTWVtb3J5TWFuYWdlcjtcblxuICAvKiogdGhlIGluc3RhbmNlIG9mIEVudGl0eVJlcG9zaXRvcnkgKi9cbiAgcHJvdGVjdGVkIF9fZW50aXR5UmVwb3NpdG9yeTogRW50aXR5UmVwb3NpdG9yeTtcblxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IF9wcm9jZXNzU3RhZ2VzOiBBcnJheTxQcm9jZXNzU3RhZ2VFbnVtPiA9IFtcbiAgICAvLyBQcm9jZXNzU3RhZ2UuQ3JlYXRlLFxuICAgIFByb2Nlc3NTdGFnZS5Mb2FkLFxuICAgIC8vIFByb2Nlc3NTdGFnZS5Nb3VudCxcbiAgICBQcm9jZXNzU3RhZ2UuTG9naWMsXG4gICAgUHJvY2Vzc1N0YWdlLlJlbmRlcixcbiAgICAvLyBQcm9jZXNzU3RhZ2UuVW5tb3VudCxcbiAgICAvLyBQcm9jZXNzU3RhZ2UuRGlzY2FyZFxuICBdO1xuXG4gIC8qKlxuICAgKiBUaGUgY29uc3RydWN0b3Igb2YgdGhlIENvbXBvbmVudCBjbGFzcy5cbiAgICogV2hlbiBjcmVhdGluZyBhIENvbXBvbmVudCwgdXNlIHRoZSBjcmVhdGVDb21wb25lbnQgbWV0aG9kIG9mIHRoZSBDb21wb25lbnRSZXBvc2l0b3J5IGNsYXNzXG4gICAqIGluc3RlYWQgb2YgZGlyZWN0bHkgY2FsbGluZyB0aGlzIGNvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gZW50aXR5VWlkIC0gVW5pcXVlIElEIG9mIHRoZSBjb3JyZXNwb25kaW5nIGVudGl0eVxuICAgKiBAcGFyYW0gY29tcG9uZW50U2lkIC0gU2NvcGVkIElEIG9mIHRoZSBDb21wb25lbnRcbiAgICogQHBhcmFtIGVudGl0eVJlcG9zaXRvcnkgLSBUaGUgaW5zdGFuY2Ugb2YgdGhlIEVudGl0eVJlcG9zaXRvcnkgY2xhc3MgKERlcGVuZGVuY3kgSW5qZWN0aW9uKVxuICAgKiBAcGFyYW0gaXNSZVVzZSAtIFdoZXRoZXIgdGhpcyBjb21wb25lbnQgaXMgYmVpbmcgcmV1c2VkIGZyb20gYSBwb29sXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBlbnRpdHlVaWQ6IEVudGl0eVVJRCxcbiAgICBjb21wb25lbnRTaWQ6IENvbXBvbmVudFNJRCxcbiAgICBlbnRpdHlSZXBvc2l0b3J5OiBFbnRpdHlSZXBvc2l0b3J5LFxuICAgIGlzUmVVc2U6IGJvb2xlYW5cbiAgKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuX19lbmdpbmUgPSBlbmdpbmU7XG4gICAgdGhpcy5fX2VudGl0eVVpZCA9IGVudGl0eVVpZDtcbiAgICB0aGlzLl9jb21wb25lbnRfc2lkID0gY29tcG9uZW50U2lkO1xuXG4gICAgdGhpcy5fX21lbW9yeU1hbmFnZXIgPSBlbmdpbmUubWVtb3J5TWFuYWdlcjtcbiAgICB0aGlzLl9fZW50aXR5UmVwb3NpdG9yeSA9IGVudGl0eVJlcG9zaXRvcnk7XG5cbiAgICBpZiAoaXNSZVVzZSkge1xuICAgICAgdGhpcy5fX2lzUmVVc2UgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2l0aW9ucyB0aGUgY29tcG9uZW50IHRvIGEgZGlmZmVyZW50IHByb2Nlc3Mgc3RhZ2UuXG4gICAqIFRoaXMgYWZmZWN0cyB3aGljaCB1cGRhdGUgbWV0aG9kcyB3aWxsIGJlIGNhbGxlZCBkdXJpbmcgdGhlIGZyYW1lIHByb2Nlc3NpbmcuXG4gICAqXG4gICAqIEBwYXJhbSBwcm9jZXNzU3RhZ2UgLSBUaGUgdGFyZ2V0IHN0YWdlIHRvIG1vdmUgdG9cbiAgICovXG4gIG1vdmVTdGFnZVRvKHByb2Nlc3NTdGFnZTogUHJvY2Vzc1N0YWdlRW51bSkge1xuICAgIC8vIENvbXBvbmVudC5fX2RpcnR5T2ZBcnJheU9mUHJvY2Vzc1N0YWdlcy5zZXQodGhpcy5fX2N1cnJlbnRQcm9jZXNzU3RhZ2UsIGZhbHNlKTtcbiAgICAvLyBDb21wb25lbnQuX19kaXJ0eU9mQXJyYXlPZlByb2Nlc3NTdGFnZXMuc2V0KHByb2Nlc3NTdGFnZSwgdHJ1ZSk7XG4gICAgdGhpcy5fX2N1cnJlbnRQcm9jZXNzU3RhZ2UgPSBwcm9jZXNzU3RhZ2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgVHlwZSBJRCBvZiB0aGUgQ29tcG9uZW50IGNsYXNzLlxuICAgKiBUaGlzIGlzIG92ZXJyaWRkZW4gYnkgY29uY3JldGUgY29tcG9uZW50IGNsYXNzZXMgdG8gcHJvdmlkZSB1bmlxdWUgdHlwZSBpZGVudGlmaWNhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCB0eXBlIElEIChkZWZhdWx0OiAwKVxuICAgKi9cbiAgc3RhdGljIGdldCBjb21wb25lbnRUSUQoKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgVHlwZSBJRCBvZiB0aGlzIENvbXBvbmVudCBpbnN0YW5jZS5cbiAgICogVGhpcyBpcyBvdmVycmlkZGVuIGJ5IGNvbmNyZXRlIGNvbXBvbmVudCBjbGFzc2VzIHRvIHByb3ZpZGUgdW5pcXVlIHR5cGUgaWRlbnRpZmljYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdHlwZSBJRCAoZGVmYXVsdDogMClcbiAgICovXG4gIGdldCBjb21wb25lbnRUSUQoKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgU2NvcGVkIElEIG9mIHRoaXMgQ29tcG9uZW50IGluc3RhbmNlLlxuICAgKiBUaGUgU0lEIGlzIHVuaXF1ZSB3aXRoaW4gdGhlIGNvbXBvbmVudCB0eXBlIGFuZCByZXByZXNlbnRzIHRoZSBpbnN0YW5jZSBpbmRleC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNvbXBvbmVudCBzY29wZWQgSURcbiAgICovXG4gIGdldCBjb21wb25lbnRTSUQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBvbmVudF9zaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdW5pcXVlIElEIG9mIHRoZSBlbnRpdHkgdGhhdCBvd25zIHRoaXMgY29tcG9uZW50LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IHVuaXF1ZSBJRFxuICAgKi9cbiAgZ2V0IGVudGl0eVVJRCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2VudGl0eVVpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IHByb2Nlc3Mgc3RhZ2Ugb2YgdGhlIGNvbXBvbmVudC5cbiAgICogVGhpcyBkZXRlcm1pbmVzIHdoaWNoIHVwZGF0ZSBtZXRob2RzIGFyZSBjdXJyZW50bHkgYmVpbmcgY2FsbGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBwcm9jZXNzIHN0YWdlXG4gICAqL1xuICBnZXQgY3VycmVudFByb2Nlc3NTdGFnZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fX2N1cnJlbnRQcm9jZXNzU3RhZ2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIHNwZWNpZmllZCBQcm9jZXNzU3RhZ2UgbWV0aG9kIGV4aXN0cyBpbiB0aGUgZ2l2ZW4gQ29tcG9uZW50IGNsYXNzLlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIGEgY29tcG9uZW50IGNhbiBoYW5kbGUgYSBwYXJ0aWN1bGFyIHByb2Nlc3Mgc3RhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRUeXBlIC0gVGhlIGNvbXBvbmVudCBjbGFzcyB0byBjaGVja1xuICAgKiBAcGFyYW0gcHJvY2Vzc1N0YWdlIC0gVGhlIHByb2Nlc3Mgc3RhZ2UgdG8gY2hlY2sgZm9yXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIG1ldGhvZCBleGlzdHMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGRvZXNUaGVQcm9jZXNzU3RhZ2VNZXRob2RFeGlzdChjb21wb25lbnRUeXBlOiB0eXBlb2YgQ29tcG9uZW50LCBwcm9jZXNzU3RhZ2U6IFByb2Nlc3NTdGFnZUVudW0pIHtcbiAgICBpZiAoKGNvbXBvbmVudFR5cGUucHJvdG90eXBlIGFzIGFueSlbcHJvY2Vzc1N0YWdlLm1ldGhvZE5hbWVdID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3Mgd2hldGhlciB0aGUgc3BlY2lmaWVkIFByb2Nlc3NTdGFnZSBtZXRob2QgZXhpc3RzIGluIHRoaXMgQ29tcG9uZW50IGluc3RhbmNlLlxuICAgKiBUaGlzIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoaXMgY29tcG9uZW50IGNhbiBoYW5kbGUgYSBwYXJ0aWN1bGFyIHByb2Nlc3Mgc3RhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBwcm9jZXNzU3RhZ2UgLSBUaGUgcHJvY2VzcyBzdGFnZSB0byBjaGVjayBmb3JcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgbWV0aG9kIGV4aXN0cywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0V4aXN0UHJvY2Vzc1N0YWdlTWV0aG9kKHByb2Nlc3NTdGFnZTogUHJvY2Vzc1N0YWdlRW51bSkge1xuICAgIGlmICgodGhpcyBhcyBhbnkpW3Byb2Nlc3NTdGFnZS5tZXRob2ROYW1lXSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2Vzc2VzIGFsbCBjb21wb25lbnRzIG9mIGEgZ2l2ZW4gdHlwZSBmb3IgYSBzcGVjaWZpYyBwcm9jZXNzIHN0YWdlLlxuICAgKiBUaGlzIG1ldGhvZCBpdGVyYXRlcyB0aHJvdWdoIGFsbCBjb21wb25lbnRzIG9mIHRoZSBzcGVjaWZpZWQgdHlwZSBhbmQgY2FsbHNcbiAgICogdGhlaXIgY29ycmVzcG9uZGluZyBwcm9jZXNzIHN0YWdlIG1ldGhvZCBpZiB0aGV5IGFyZSBpbiB0aGF0IHN0YWdlLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50VHlwZSAtIFRoZSBjb21wb25lbnQgY2xhc3MgdG8gcHJvY2Vzc1xuICAgKiBAcGFyYW0gcHJvY2Vzc1N0YWdlIC0gVGhlIHByb2Nlc3Mgc3RhZ2UgdG8gZXhlY3V0ZVxuICAgKi9cbiAgc3RhdGljIHByb2Nlc3MoZW5naW5lOiBFbmdpbmUsIGNvbXBvbmVudFR5cGU6IHR5cGVvZiBDb21wb25lbnQsIHByb2Nlc3NTdGFnZTogUHJvY2Vzc1N0YWdlRW51bSkge1xuICAgIGlmICghQ29tcG9uZW50LmRvZXNUaGVQcm9jZXNzU3RhZ2VNZXRob2RFeGlzdChjb21wb25lbnRUeXBlLCBwcm9jZXNzU3RhZ2UpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbWV0aG9kTmFtZSA9IHByb2Nlc3NTdGFnZS5tZXRob2ROYW1lO1xuICAgIC8vIEl0ZXJhdGUgdGhlIHJhdyBjb21wb25lbnQgYXJyYXkgaW5zdGVhZCBvZiBidWlsZGluZyBhIGZpbHRlcmVkIGNvcHkgb25cbiAgICAvLyBldmVyeSBjYWxsLiBDb21wb25lbnQgYXJyYXlzIGNhbiBjb250YWluIGhvbGVzIGZvciBkZWxldGVkIGNvbXBvbmVudHMuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IGVuZ2luZS5jb21wb25lbnRSZXBvc2l0b3J5Ll9nZXRDb21wb25lbnRzKGNvbXBvbmVudFR5cGUpO1xuICAgIGlmIChjb21wb25lbnRzID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChjb25zdCBjb21wb25lbnQgb2YgY29tcG9uZW50cykge1xuICAgICAgaWYgKGNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHByb2Nlc3NTdGFnZSA9PT0gY29tcG9uZW50Ll9fY3VycmVudFByb2Nlc3NTdGFnZSkge1xuICAgICAgICAoY29tcG9uZW50IGFzIGFueSlbbWV0aG9kTmFtZV0oKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBjb21wb25lbnRzIHNwZWNpZmljYWxseSBmb3IgdGhlIHJlbmRlciBzdGFnZSB3aXRoIHJlbmRlciBwYXNzIGNvbnRleHQuXG4gICAqIFRoaXMgbWV0aG9kIGNhbGxzIHRoZSBzb3J0XyRyZW5kZXIgbWV0aG9kIG9mIHRoZSBjb21wb25lbnQgY2xhc3MgdG8gaGFuZGxlXG4gICAqIHJlbmRlci1zcGVjaWZpYyBwcm9jZXNzaW5nIGFuZCBzb3J0aW5nLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIHRvIHVwZGF0ZVxuICAgKiBAcGFyYW0gcHJvY2Vzc1N0YWdlIC0gVGhlIHJlbmRlciBwcm9jZXNzIHN0YWdlXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzIC0gVGhlIGN1cnJlbnQgcmVuZGVyIHBhc3MgY29udGV4dFxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHRoZSBzb3J0XyRyZW5kZXIgbWV0aG9kXG4gICAqL1xuICBzdGF0aWMgdXBkYXRlQ29tcG9uZW50c0ZvclJlbmRlclN0YWdlKFxuICAgIGNvbXBvbmVudENsYXNzOiB0eXBlb2YgQ29tcG9uZW50LFxuICAgIF9wcm9jZXNzU3RhZ2U6IFByb2Nlc3NTdGFnZUVudW0sXG4gICAgcmVuZGVyUGFzczogUmVuZGVyUGFzc1xuICApIHtcbiAgICBjb25zdCBtZXRob2QgPSAoY29tcG9uZW50Q2xhc3MgYXMgYW55KS5zb3J0XyRyZW5kZXI7XG4gICAgcmV0dXJuIG1ldGhvZChyZW5kZXJQYXNzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBkZXBlbmRlbmN5IHJlbGF0aW9uc2hpcCB3aXRoIGFub3RoZXIgY29tcG9uZW50LlxuICAgKiBUaGlzIG1ldGhvZCBpcyBpbnRlbmRlZCBmb3IgZnV0dXJlIHVzZSBpbiBtYW5hZ2luZyBjb21wb25lbnQgZGVwZW5kZW5jaWVzLlxuICAgKlxuICAgKiBAcGFyYW0gY29tcG9uZW50IC0gVGhlIGNvbXBvbmVudCB0byBkZXBlbmQgb25cbiAgICogQHBhcmFtIGlzTXVzdCAtIFdoZXRoZXIgdGhpcyBkZXBlbmRlbmN5IGlzIHJlcXVpcmVkXG4gICAqIEB0b2RvIFRoaXMgbWV0aG9kIGlzIG5vdCB1c2VkIHlldCBhbmQgbmVlZHMgaW1wbGVtZW50YXRpb25cbiAgICovXG4gIHJlZ2lzdGVyRGVwZW5kZW5jeShfY29tcG9uZW50OiBDb21wb25lbnQsIF9pc011c3Q6IGJvb2xlYW4pIHt9XG5cbiAgLyoqXG4gICAqIEFsbG9jYXRlcyBtZW1vcnkgZm9yIGEgc3BlY2lmaWMgbWVtYmVyIGZpZWxkIG9mIHRoaXMgY29tcG9uZW50IGluc3RhbmNlLlxuICAgKiBUaGlzIG1ldGhvZCB0YWtlcyBvbmUgbWVtb3J5IHNsb3QgZnJvbSB0aGUgc2hhcmVkIG1lbW9yeSBwb29sIGZvciB0aGUgc3BlY2lmaWVkIG1lbWJlci5cbiAgICpcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWVtYmVyIGZpZWxkXG4gICAqIEBwYXJhbSBkYXRhQ2xhc3NUeXBlIC0gVGhlIGRhdGEgY2xhc3MgdHlwZSBmb3IgdGhlIG1lbWJlclxuICAgKiBAcGFyYW0gaW5pdFZhbHVlcyAtIEluaXRpYWwgdmFsdWVzIHRvIHNldCBmb3IgdGhlIG1lbWJlclxuICAgKiBAcGFyYW0gX2lzUmVVc2UgLSBXaGV0aGVyIHRoaXMgY29tcG9uZW50IGlzIGJlaW5nIHJldXNlZCAodGhlIGV4aXN0aW5nIHNsb3QgaXMgZGV0ZWN0ZWQgZnJvbSB0aGUgYWNjZXNzb3IpXG4gICAqIEBwYXJhbSBjb21wb25lbnRTaWQgLSBUaGUgY29tcG9uZW50IHNjb3BlZCBJRFxuICAgKiBAcGFyYW0gY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3IC0gVGhlIG51bWJlciBvZiBjb21wb25lbnRzIHBlciBidWZmZXIgdmlld1xuICAgKiBAcmV0dXJucyBudWxsIG9uIHN1Y2Nlc3NcbiAgICovXG4gIHByaXZhdGUgX190YWtlT25lKFxuICAgIG1lbWJlck5hbWU6IHN0cmluZyxcbiAgICBkYXRhQ2xhc3NUeXBlOiBhbnksXG4gICAgaW5pdFZhbHVlczogbnVtYmVyW10gfCBWZWN0b3JOLFxuICAgIF9pc1JlVXNlOiBib29sZWFuLFxuICAgIGNvbXBvbmVudFNpZDogQ29tcG9uZW50U0lELFxuICAgIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldzogQ291bnRcbiAgKTogYW55IHtcbiAgICBjb25zdCBjdXJyZW50ID0gKHRoaXMgYXMgYW55KVtgXyR7bWVtYmVyTmFtZX1gXTtcbiAgICBpZiAoY3VycmVudCAhPSBudWxsICYmICFjdXJyZW50LmlzRHVtbXkoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGluZGV4T2ZUaGVCdWZmZXJWaWV3ID0gTWF0aC5mbG9vcihjb21wb25lbnRTaWQgLyBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcpO1xuICAgIGNvbnN0IGluZGV4T2ZCdWZmZXJWaWV3cyA9IGNvbXBvbmVudFNpZCAlIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldztcbiAgICBjb25zdCByZWdpc3RyeSA9IHRoaXMuX2NvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5O1xuICAgIGNvbnN0IGNvbXBvbmVudENsYXNzID0gdGhpcy5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgQ29tcG9uZW50O1xuICAgIGNvbnN0IGFjY2Vzc29yID0gcmVnaXN0cnkuZ2V0QWNjZXNzb3IoY29tcG9uZW50Q2xhc3MsIG1lbWJlck5hbWUsIGluZGV4T2ZUaGVCdWZmZXJWaWV3KSE7XG4gICAgLy8gU2hhZGVycyBhZGRyZXNzIHRoZSBkYXRhIG9mIGEgY29tcG9uZW50IGJ5IGBjb21wb25lbnRTaWQgJSBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXdgLFxuICAgIC8vIHNvIGFsd2F5cyB2aWV3IHRoYXQgc2xvdC4gVGhpcyBrZWVwcyB0aGUgbGF5b3V0IGNvcnJlY3QgZXZlbiBpZiBjb21wb25lbnRzIGFsbG9jYXRlXG4gICAgLy8gb3V0IG9mIFNJRCBvcmRlciAoZS5nLiBTa2VsZXRhbENvbXBvbmVudCBhbGxvY2F0ZXMgaW4gc2V0Sm9pbnRzKSBvciBhcmUgcmV1c2VkLlxuICAgIGNvbnN0IHRha2VuOiBUeXBlZEFycmF5ID0gYWNjZXNzb3IuX3Rha2VFeGlzdGVkT25lKGluZGV4T2ZCdWZmZXJWaWV3cyk7XG4gICAgKHRoaXMgYXMgYW55KVtgXyR7bWVtYmVyTmFtZX1gXSA9IG5ldyBkYXRhQ2xhc3NUeXBlKHRha2VuLCBmYWxzZSwgdHJ1ZSk7XG5cbiAgICBpZiAoIShpbml0VmFsdWVzIGluc3RhbmNlb2YgVmVjdG9yTikpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKHRoaXMgYXMgYW55KVtgXyR7bWVtYmVyTmFtZX1gXS5fdi5sZW5ndGg7ICsraSkge1xuICAgICAgICAodGhpcyBhcyBhbnkpW2BfJHttZW1iZXJOYW1lfWBdLl92W2ldID0gaW5pdFZhbHVlc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvY2F0ZXMgbWVtb3J5IGZvciBhIHZhcmlhYmxlLWxlbmd0aCBhcnJheSBtZW1iZXIgb2YgdGhpcyBjb21wb25lbnQgaW5zdGFuY2UuXG4gICAqXG4gICAqIFVubGlrZSBmaXhlZCBtZW1iZXJzLCB0aGUgZGF0YSBpcyBub3QgcGxhY2VkIGluIHRoZSBzbG90IGxheW91dCBzaGFyZWQgYnkgdGhlIGNvbXBvbmVudHMgb2YgYSBidWZmZXIgdmlldy5cbiAgICogRWFjaCBpbnN0YW5jZSBnZXRzIGl0cyBvd24gY2h1bmsgc2l6ZWQgYnkgYF9nZXRBcnJheUxlbmd0aEZvckFsbG9jYXRpb25gLCBhbmQgdGhlIGxvY2F0aW9uIG9mIHRoZSBjaHVua1xuICAgKiAoaW5kZXggb2YgMTYgYnl0ZXMgaW4gdGhlIEdQVSBkYXRhKSBpcyB3cml0dGVuIHRvIHRoZSBgJHttZW1iZXJOYW1lfUxvY2F0aW9uYCBtZW1iZXIgc28gdGhhdCBzaGFkZXJzIGNhbiBmaW5kIGl0LlxuICAgKiBUaGUgY2h1bmsgaXMga2VwdCBwZXIgY29tcG9uZW50IFNJRCBhbmQgcmV1c2VkIHdoZW4gaXQgaXMgbGFyZ2UgZW5vdWdoLlxuICAgKlxuICAgKiBAcGFyYW0gaW5mbyAtIFRoZSBtZW1iZXIgaW5mbyBvZiB0aGUgdmFyaWFibGUtbGVuZ3RoIGFycmF5IG1lbWJlclxuICAgKiBAcGFyYW0gY29tcG9uZW50U2lkIC0gVGhlIGNvbXBvbmVudCBzY29wZWQgSURcbiAgICovXG4gIHByaXZhdGUgX190YWtlVmFyaWFibGVMZW5ndGhPbmUoaW5mbzogTWVtYmVySW5mbywgY29tcG9uZW50U2lkOiBDb21wb25lbnRTSUQpIHtcbiAgICBjb25zdCBtZW1iZXJOYW1lID0gaW5mby5tZW1iZXJOYW1lO1xuICAgIGNvbnN0IGN1cnJlbnQgPSAodGhpcyBhcyBhbnkpW2BfJHttZW1iZXJOYW1lfWBdO1xuICAgIGlmIChjdXJyZW50ICE9IG51bGwgJiYgIWN1cnJlbnQuaXNEdW1teSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29tcG9uZW50Q2xhc3MgPSB0aGlzLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBDb21wb25lbnQ7XG4gICAgY29uc3QgcmVnaXN0cnkgPSB0aGlzLl9jb21wb25lbnRNZW1vcnlSZWdpc3RyeTtcbiAgICBjb25zdCBhcnJheUxlbmd0aCA9IE1hdGgubWF4KFxuICAgICAgdGhpcy5fZ2V0QXJyYXlMZW5ndGhGb3JBbGxvY2F0aW9uKG1lbWJlck5hbWUpID8/XG4gICAgICAgIENvbXBvbmVudC5fX2FycmF5TGVuZ3RoTWFwLmdldChjb21wb25lbnRDbGFzcyk/LmdldChtZW1iZXJOYW1lKSA/P1xuICAgICAgICAxLFxuICAgICAgMVxuICAgICk7XG4gICAgY29uc3QgZWxlbWVudENvdW50ID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCkgKiBhcnJheUxlbmd0aDtcbiAgICBjb25zdCBieXRlTGVuZ3RoID0gZWxlbWVudENvdW50ICogaW5mby5jb21wb25lbnRUeXBlLmdldFNpemVJbkJ5dGVzKCk7XG5cbiAgICBsZXQgY2h1bmsgPSByZWdpc3RyeS5nZXRWYXJpYWJsZUxlbmd0aENodW5rKGNvbXBvbmVudENsYXNzLCBtZW1iZXJOYW1lLCBjb21wb25lbnRTaWQpO1xuICAgIGlmIChjaHVuayA9PSBudWxsIHx8IGNodW5rLmJ5dGVDYXBhY2l0eSA8IGJ5dGVMZW5ndGgpIHtcbiAgICAgIGlmIChjaHVuayAhPSBudWxsKSB7XG4gICAgICAgIC8vIFRoZSBjaHVuayBpcyB0b28gc21hbGwuIExldCBvdGhlciBjb21wb25lbnRzIHJldXNlIGl0LlxuICAgICAgICByZWdpc3RyeS5yZWxlYXNlVmFyaWFibGVMZW5ndGhDaHVuayhjb21wb25lbnRDbGFzcywgbWVtYmVyTmFtZSwgY2h1bmspO1xuICAgICAgfVxuICAgICAgY2h1bmsgPVxuICAgICAgICByZWdpc3RyeS50YWtlRnJlZVZhcmlhYmxlTGVuZ3RoQ2h1bmsoY29tcG9uZW50Q2xhc3MsIG1lbWJlck5hbWUsIGJ5dGVMZW5ndGgpID8/XG4gICAgICAgIENvbXBvbmVudC5fX2NyZWF0ZVZhcmlhYmxlTGVuZ3RoQ2h1bmsodGhpcy5fX2VuZ2luZSwgaW5mby5idWZmZXJVc2UsIGJ5dGVMZW5ndGgpO1xuICAgICAgcmVnaXN0cnkuc2V0VmFyaWFibGVMZW5ndGhDaHVuayhjb21wb25lbnRDbGFzcywgbWVtYmVyTmFtZSwgY29tcG9uZW50U2lkLCBjaHVuayk7XG4gICAgfVxuXG4gICAgY29uc3QgYnVmZmVyVmlldyA9IGNodW5rLmJ1ZmZlclZpZXc7XG4gICAgY29uc3QgdGFrZW4gPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgYnVmZmVyVmlldy5idWZmZXIuZ2V0QXJyYXlCdWZmZXIoKSxcbiAgICAgIGJ1ZmZlclZpZXcuYnl0ZU9mZnNldEluUmF3QXJyYXlCdWZmZXJPZkJ1ZmZlcixcbiAgICAgIGVsZW1lbnRDb3VudFxuICAgICk7XG4gICAgLy8gVGhlIGNodW5rIG1heSBjb250YWluIHRoZSBkYXRhIG9mIGEgcHJldmlvdXMgb3duZXJcbiAgICB0YWtlbi5maWxsKDApO1xuICAgIGNvbnN0IGRhdGFDbGFzc1R5cGUgPSBpbmZvLmRhdGFDbGFzc1R5cGUgYXMgYW55O1xuICAgICh0aGlzIGFzIGFueSlbYF8ke21lbWJlck5hbWV9YF0gPSBuZXcgZGF0YUNsYXNzVHlwZSh0YWtlbiwgZmFsc2UsIHRydWUpO1xuXG4gICAgLy8gVGVsbCBzaGFkZXJzIHdoZXJlIHRoZSBkYXRhIGlzLiBUaGUgbG9jYXRpb24gaXMgc3BsaXQgaW50byB0d28gZmxvYXRzIHNvIHRoYXQgaXQgaXMgcmVwcmVzZW50ZWQgZXhhY3RseS5cbiAgICBjb25zdCBsb2NhdGlvbk1lbWJlciA9ICh0aGlzIGFzIGFueSlbYF8ke0NvbXBvbmVudC5fZ2V0VmFyaWFibGVMZW5ndGhMb2NhdGlvbk1lbWJlck5hbWUobWVtYmVyTmFtZSl9YF07XG4gICAgY29uc3QgcmFkaXggPSBDb21wb25lbnQuX3ZhcmlhYmxlTGVuZ3RoTG9jYXRpb25SYWRpeDtcbiAgICBsb2NhdGlvbk1lbWJlci5fdlswXSA9IE1hdGguZmxvb3IoY2h1bmsubG9jYXRpb24gLyByYWRpeCk7XG4gICAgbG9jYXRpb25NZW1iZXIuX3ZbMV0gPSBjaHVuay5sb2NhdGlvbiAlIHJhZGl4O1xuICAgIGxvY2F0aW9uTWVtYmVyLl92WzJdID0gYXJyYXlMZW5ndGg7XG4gICAgbG9jYXRpb25NZW1iZXIuX3ZbM10gPSAwO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY2h1bmsgb2YgbWVtb3J5IGZvciBhIHZhcmlhYmxlLWxlbmd0aCBhcnJheSBtZW1iZXIuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBidWZmZXJVc2UgLSBUaGUgaW50ZW5kZWQgdXNlIG9mIHRoZSBidWZmZXJcbiAgICogQHBhcmFtIGJ5dGVMZW5ndGggLSBUaGUgYnl0ZSBsZW5ndGggb2YgdGhlIGNodW5rXG4gICAqIEByZXR1cm5zIFRoZSBjcmVhdGVkIGNodW5rXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBfX2NyZWF0ZVZhcmlhYmxlTGVuZ3RoQ2h1bmsoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgYnVmZmVyVXNlOiBCdWZmZXJVc2VFbnVtLFxuICAgIGJ5dGVMZW5ndGg6IEJ5dGVcbiAgKTogVmFyaWFibGVMZW5ndGhDaHVuayB7XG4gICAgbGV0IGJ1ZmZlclZpZXdSZXN1bHQ6IFJlc3VsdDxCdWZmZXJWaWV3LCB7ICdCdWZmZXIuYnl0ZUxlbmd0aCc6IEJ5dGU7ICdCdWZmZXIudGFrZW5TaXplSW5CeXRlJzogQnl0ZSB9PjtcbiAgICBsZXQgcmVxdWlyZUJ1ZmZlckxheWVySW5kZXggPSAwO1xuICAgIGRvIHtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGVuZ2luZS5tZW1vcnlNYW5hZ2VyLmNyZWF0ZU9yR2V0QnVmZmVyKGJ1ZmZlclVzZSwgcmVxdWlyZUJ1ZmZlckxheWVySW5kZXgpO1xuICAgICAgYnVmZmVyVmlld1Jlc3VsdCA9IGJ1ZmZlci50YWtlQnVmZmVyVmlldyh7XG4gICAgICAgIGJ5dGVMZW5ndGhUb05lZWQ6IGJ5dGVMZW5ndGgsXG4gICAgICAgIGJ5dGVTdHJpZGU6IDAsXG4gICAgICB9KTtcbiAgICAgIGlmIChidWZmZXJWaWV3UmVzdWx0LmlzRXJyKCkpIHtcbiAgICAgICAgcmVxdWlyZUJ1ZmZlckxheWVySW5kZXgrKztcbiAgICAgIH1cbiAgICB9IHdoaWxlIChidWZmZXJWaWV3UmVzdWx0LmlzRXJyKCkpO1xuXG4gICAgY29uc3QgYnVmZmVyVmlldyA9IGJ1ZmZlclZpZXdSZXN1bHQuZ2V0KCk7XG4gICAgY29uc3QgYnl0ZU9mZnNldCA9XG4gICAgICBlbmdpbmUubWVtb3J5TWFuYWdlci5nZXRCeXRlT2Zmc2V0T2ZFeGlzdGluZ0J1ZmZlcnMoYnVmZmVyVXNlLCBidWZmZXJWaWV3LmJ1ZmZlci5pbmRleE9mVGhlQnVmZmVyVXNhZ2UpICtcbiAgICAgIGJ1ZmZlclZpZXcuYnl0ZU9mZnNldEluQnVmZmVyO1xuICAgIHJldHVybiB7XG4gICAgICBidWZmZXJWaWV3LFxuICAgICAgYnl0ZUNhcGFjaXR5OiBieXRlTGVuZ3RoLFxuICAgICAgbG9jYXRpb246IGJ5dGVPZmZzZXQgLyA0IC8gNCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSByYWRpeCB1c2VkIHRvIHNwbGl0IHRoZSBsb2NhdGlvbiBvZiBhIHZhcmlhYmxlLWxlbmd0aCBhcnJheSBtZW1iZXIgaW50byB0d28gZmxvYXRzXG4gICAqIChgbG9jYXRpb24gPSB4ICogcmFkaXggKyB5YCksIHNvIHRoYXQgYm90aCBhcmUgZXhhY3RseSByZXByZXNlbnRhYmxlIGFzIDMyLWJpdCBmbG9hdHMuXG4gICAqL1xuICBzdGF0aWMgcmVhZG9ubHkgX3ZhcmlhYmxlTGVuZ3RoTG9jYXRpb25SYWRpeCA9IDY1NTM2O1xuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBuYW1lIG9mIHRoZSBtZW1iZXIgd2hpY2ggaG9sZHMgdGhlIGxvY2F0aW9uIG9mIGEgdmFyaWFibGUtbGVuZ3RoIGFycmF5IG1lbWJlci5cbiAgICpcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFyaWFibGUtbGVuZ3RoIGFycmF5IG1lbWJlclxuICAgKiBAcmV0dXJucyBUaGUgbmFtZSBvZiB0aGUgbG9jYXRpb24gbWVtYmVyXG4gICAqL1xuICBzdGF0aWMgX2dldFZhcmlhYmxlTGVuZ3RoTG9jYXRpb25NZW1iZXJOYW1lKG1lbWJlck5hbWU6IHN0cmluZykge1xuICAgIHJldHVybiBgJHttZW1iZXJOYW1lfUxvY2F0aW9uYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBDb21wb25lbnRNZW1vcnlSZWdpc3RyeSBmb3IgdGhpcyBjb21wb25lbnQncyBlbmdpbmUuXG4gICAqL1xuICBnZXQgX2NvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5KCk6IENvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5IHtcbiAgICByZXR1cm4gdGhpcy5fX2VuZ2luZS5jb21wb25lbnRNZW1vcnlSZWdpc3RyeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIGEgbWVtb3J5IGFjY2Vzc29yIGZvciBhIHNwZWNpZmljIG1lbWJlciBmaWVsZC5cbiAgICogVGhpcyBtZXRob2QgYWxsb2NhdGVzIGJ1ZmZlciBtZW1vcnkgYW5kIGNyZWF0ZXMgYW4gYWNjZXNzb3IgZm9yIGVmZmljaWVudCBkYXRhIGFjY2Vzcy5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGJ1ZmZlclVzZSAtIFRoZSBpbnRlbmRlZCB1c2Ugb2YgdGhlIGJ1ZmZlclxuICAgKiBAcGFyYW0gbWVtYmVyTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBtZW1iZXIgZmllbGRcbiAgICogQHBhcmFtIGNvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzc1xuICAgKiBAcGFyYW0gY29tcG9zaXRpb25UeXBlIC0gVGhlIGNvbXBvc2l0aW9uIHR5cGUgKGUuZy4sIFZlYzMsIE1hdDQpXG4gICAqIEBwYXJhbSBjb21wb25lbnRUeXBlIC0gVGhlIGNvbXBvbmVudCBkYXRhIHR5cGUgKGUuZy4sIEZsb2F0MzIsIEludDMyKVxuICAgKiBAcGFyYW0gaW5kZXhPZlRoZUJ1ZmZlclZpZXcgLSBUaGUgYnVmZmVyIHZpZXcgaW5kZXhcbiAgICogQHBhcmFtIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyAtIFRoZSBudW1iZXIgb2YgY29tcG9uZW50cyBwZXIgYnVmZmVyIHZpZXdcbiAgICogQHBhcmFtIGFycmF5TGVuZ3RoIC0gVGhlIGFycmF5IGxlbmd0aFxuICAgKiBAcmV0dXJucyBSZXN1bHQgY29udGFpbmluZyB0aGUgYWNjZXNzb3Igb3IgYW4gZXJyb3JcbiAgICovXG4gIHByaXZhdGUgc3RhdGljIF9fdGFrZUFjY2Vzc29yKFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGJ1ZmZlclVzZTogQnVmZmVyVXNlRW51bSxcbiAgICBtZW1iZXJOYW1lOiBzdHJpbmcsXG4gICAgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnQsXG4gICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGVFbnVtLFxuICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGVFbnVtLFxuICAgIGluZGV4T2ZUaGVCdWZmZXJWaWV3OiBJbmRleE9mVGhlQnVmZmVyVmlldyxcbiAgICBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXc6IENvdW50LFxuICAgIGFycmF5TGVuZ3RoOiBDb3VudFxuICApOiBSZXN1bHQ8QWNjZXNzb3IsIHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IHJlZ2lzdHJ5ID0gZW5naW5lLmNvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5O1xuXG4gICAgY29uc3QgYnl0ZXMgPSBjYWxjQWxpZ25lZEJ5dGVMZW5ndGgoKTtcbiAgICBjb25zdCBleGlzdGluZ0FjY2Vzc29yID0gcmVnaXN0cnkuZ2V0QWNjZXNzb3IoY29tcG9uZW50Q2xhc3MsIG1lbWJlck5hbWUsIGluZGV4T2ZUaGVCdWZmZXJWaWV3KTtcbiAgICBjb25zdCBhY2Nlc3NvcklzQ29tcGF0aWJsZSA9XG4gICAgICBleGlzdGluZ0FjY2Vzc29yICE9IG51bGwgJiZcbiAgICAgIGV4aXN0aW5nQWNjZXNzb3IuZWxlbWVudENvdW50ID09PSBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgJiZcbiAgICAgIGV4aXN0aW5nQWNjZXNzb3IuYnl0ZVN0cmlkZSA9PT0gYnl0ZXMgJiZcbiAgICAgIGV4aXN0aW5nQWNjZXNzb3IuY29tcG9zaXRpb25UeXBlID09PSBjb21wb3NpdGlvblR5cGUgJiZcbiAgICAgIGV4aXN0aW5nQWNjZXNzb3IuY29tcG9uZW50VHlwZSA9PT0gY29tcG9uZW50VHlwZTtcbiAgICBpZiAoYWNjZXNzb3JJc0NvbXBhdGlibGUpIHtcbiAgICAgIHJldHVybiBuZXcgT2soZXhpc3RpbmdBY2Nlc3Nvcik7XG4gICAgfVxuXG4gICAgbGV0IGJ1ZmZlclZpZXdSZXN1bHQ6IFJlc3VsdDxCdWZmZXJWaWV3LCB7ICdCdWZmZXIuYnl0ZUxlbmd0aCc6IEJ5dGU7ICdCdWZmZXIudGFrZW5TaXplSW5CeXRlJzogQnl0ZSB9PjtcbiAgICBsZXQgcmVxdWlyZUJ1ZmZlckxheWVySW5kZXggPSAwO1xuICAgIGRvIHtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGVuZ2luZS5tZW1vcnlNYW5hZ2VyLmNyZWF0ZU9yR2V0QnVmZmVyKGJ1ZmZlclVzZSwgcmVxdWlyZUJ1ZmZlckxheWVySW5kZXgpO1xuICAgICAgYnVmZmVyVmlld1Jlc3VsdCA9IGJ1ZmZlci50YWtlQnVmZmVyVmlldyh7XG4gICAgICAgIGJ5dGVMZW5ndGhUb05lZWQ6IGJ5dGVzICogY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3LFxuICAgICAgICBieXRlU3RyaWRlOiAwLFxuICAgICAgfSk7XG4gICAgICBpZiAoYnVmZmVyVmlld1Jlc3VsdC5pc0VycigpKSB7XG4gICAgICAgIHJlcXVpcmVCdWZmZXJMYXllckluZGV4Kys7XG4gICAgICB9XG4gICAgfSB3aGlsZSAoYnVmZmVyVmlld1Jlc3VsdC5pc0VycigpKTtcblxuICAgIGNvbnN0IGFjY2Vzc29yUmVzdWx0ID0gYnVmZmVyVmlld1Jlc3VsdC5nZXQoKS50YWtlQWNjZXNzb3Ioe1xuICAgICAgY29tcG9zaXRpb25UeXBlLFxuICAgICAgY29tcG9uZW50VHlwZSxcbiAgICAgIGNvdW50OiBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcsXG4gICAgICBieXRlU3RyaWRlOiBieXRlcyxcbiAgICAgIGFycmF5TGVuZ3RoOiBhcnJheUxlbmd0aCxcbiAgICB9KTtcbiAgICBpZiAoYWNjZXNzb3JSZXN1bHQuaXNFcnIoKSkge1xuICAgICAgcmV0dXJuIG5ldyBFcnIoe1xuICAgICAgICBtZXNzYWdlOiBgRmFpbGVkIHRvIHRha2UgYWNjZXNzb3I6ICR7YWNjZXNzb3JSZXN1bHQuZ2V0Um5FcnJvcigpLm1lc3NhZ2V9YCxcbiAgICAgICAgZXJyb3I6IHVuZGVmaW5lZCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlZ2lzdHJ5LnNldEFjY2Vzc29yKGNvbXBvbmVudENsYXNzLCBtZW1iZXJOYW1lLCBpbmRleE9mVGhlQnVmZmVyVmlldywgYWNjZXNzb3JSZXN1bHQuZ2V0KCkpO1xuXG4gICAgcmV0dXJuIGFjY2Vzc29yUmVzdWx0O1xuXG4gICAgZnVuY3Rpb24gY2FsY0FsaWduZWRCeXRlTGVuZ3RoKCkge1xuICAgICAgY29uc3QgY29tcG9zaXRpb25OdW1iZXIgPSBjb21wb3NpdGlvblR5cGUuZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk7XG4gICAgICBjb25zdCBjb21wb25lbnRTaXplSW5CeXRlID0gY29tcG9uZW50VHlwZS5nZXRTaXplSW5CeXRlcygpO1xuICAgICAgY29uc3Qgc2VtYW50aWNJbmZvQnl0ZSA9IGNvbXBvc2l0aW9uTnVtYmVyICogY29tcG9uZW50U2l6ZUluQnl0ZTtcbiAgICAgIGxldCBhbGlnbmVkQnl0ZUxlbmd0aCA9IHNlbWFudGljSW5mb0J5dGU7XG4gICAgICAvLyBpZiAoYWxpZ25lZEJ5dGVMZW5ndGggJSAxNiAhPT0gMCkge1xuICAgICAgLy8gICBhbGlnbmVkQnl0ZUxlbmd0aCA9IHNlbWFudGljSW5mb0J5dGUgKyAxNiAtIChzZW1hbnRpY0luZm9CeXRlICUgMTYpO1xuICAgICAgLy8gfVxuICAgICAgaWYgKENvbXBvc2l0aW9uVHlwZS5pc0FycmF5KGNvbXBvc2l0aW9uVHlwZSkpIHtcbiAgICAgICAgYWxpZ25lZEJ5dGVMZW5ndGggKj0gYXJyYXlMZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWxpZ25lZEJ5dGVMZW5ndGg7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIG1lbWJlciBmaWVsZCBvZiB0aGUgY29tcG9uZW50IGNsYXNzIGZvciBtZW1vcnkgYWxsb2NhdGlvbi5cbiAgICogVGhpcyBtZXRob2QgZGVmaW5lcyB0aGUgbWVtb3J5IGxheW91dCBhbmQgY2hhcmFjdGVyaXN0aWNzIG9mIGNvbXBvbmVudCBkYXRhIG1lbWJlcnMuXG4gICAqXG4gICAqIFZhcmlhYmxlLWxlbmd0aCBhcnJheSBtZW1iZXJzIChgaXNWYXJpYWJsZUxlbmd0aDogdHJ1ZWApIGFyZSBhbGxvY2F0ZWQgcGVyIGluc3RhbmNlIHdpdGggdGhlIGxlbmd0aFxuICAgKiByZXR1cm5lZCBieSBgX2dldEFycmF5TGVuZ3RoRm9yQWxsb2NhdGlvbmAsIGluc3RlYWQgb2YgdGhlIGZpeGVkIHNsb3QgbGF5b3V0IHNoYXJlZCBieSB0aGUgY29tcG9uZW50c1xuICAgKiBvZiBhIGJ1ZmZlciB2aWV3LiBTaGFkZXJzIGZpbmQgdGhlIGRhdGEgdGhyb3VnaCBhIFZlYzQgbWVtYmVyIG5hbWVkIGAke21lbWJlck5hbWV9TG9jYXRpb25gLFxuICAgKiB3aGljaCBtdXN0IGJlIHJlZ2lzdGVyZWQgYmVmb3JlIHRoZSB2YXJpYWJsZS1sZW5ndGggbWVtYmVyLlxuICAgKlxuICAgKiBAcGFyYW0gYnVmZmVyVXNlIC0gVGhlIGludGVuZGVkIHB1cnBvc2UvdHlwZSBvZiBidWZmZXIgdXNlXG4gICAqIEBwYXJhbSBtZW1iZXJOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1lbWJlciBmaWVsZFxuICAgKiBAcGFyYW0gZGF0YUNsYXNzVHlwZSAtIFRoZSBjbGFzcyB0eXBlIG9mIHRoZSBkYXRhXG4gICAqIEBwYXJhbSBzaGFkZXJUeXBlIC0gVGhlIHNoYWRlciB0eXBlIChlLmcuLCBWZXJ0ZXhTaGFkZXIsIFBpeGVsU2hhZGVyKVxuICAgKiBAcGFyYW0gY29tcG9uZW50VHlwZSAtIFRoZSBwcmltaXRpdmUgZGF0YSB0eXBlIChlLmcuLCBGbG9hdDMyLCBJbnQzMilcbiAgICogQHBhcmFtIGluaXRWYWx1ZXMgLSBJbml0aWFsIHZhbHVlcyBmb3IgdGhlIG1lbWJlciBmaWVsZFxuICAgKiBAcGFyYW0gY29udmVydFRvQm9vbCAtIFdoZXRoZXIgdG8gY29udmVydCB0aGUgbWVtYmVyIHZhbHVlIHRvIGEgYm9vbGVhblxuICAgKiBAcGFyYW0gaXNWYXJpYWJsZUxlbmd0aCAtIFdoZXRoZXIgdGhlIGFycmF5IG1lbWJlciBoYXMgYSBwZXItaW5zdGFuY2UgbGVuZ3RoXG4gICAqL1xuICBzdGF0aWMgcmVnaXN0ZXJNZW1iZXIoXG4gICAgdGhpczogdHlwZW9mIENvbXBvbmVudCxcbiAgICB7XG4gICAgICBidWZmZXJVc2UsXG4gICAgICBtZW1iZXJOYW1lLFxuICAgICAgZGF0YUNsYXNzVHlwZSxcbiAgICAgIHNoYWRlclR5cGUsXG4gICAgICBjb21wb3NpdGlvblR5cGUsXG4gICAgICBjb21wb25lbnRUeXBlLFxuICAgICAgaW5pdFZhbHVlcyxcbiAgICAgIGFycmF5TGVuZ3RoLFxuICAgICAgY29tcG9uZW50U0lELFxuICAgICAgY29udmVydFRvQm9vbCxcbiAgICAgIGlzVmFyaWFibGVMZW5ndGgsXG4gICAgfToge1xuICAgICAgYnVmZmVyVXNlOiBCdWZmZXJVc2VFbnVtO1xuICAgICAgbWVtYmVyTmFtZTogc3RyaW5nO1xuICAgICAgZGF0YUNsYXNzVHlwZTogRGF0YUNsYXNzVHlwZTtcbiAgICAgIHNoYWRlclR5cGU6IFNoYWRlclR5cGVFbnVtO1xuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGVFbnVtO1xuICAgICAgY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW07XG4gICAgICBpbml0VmFsdWVzOiBudW1iZXJbXSB8IFZlY3Rvck47XG4gICAgICBhcnJheUxlbmd0aD86IENvdW50IHwgdW5kZWZpbmVkO1xuICAgICAgY29tcG9uZW50U0lEPzogQ29tcG9uZW50U0lEO1xuICAgICAgY29udmVydFRvQm9vbD86IGJvb2xlYW47XG4gICAgICBpc1ZhcmlhYmxlTGVuZ3RoPzogYm9vbGVhbjtcbiAgICB9XG4gICkge1xuICAgIGlmICghQ29tcG9uZW50Ll9fbWVtYmVySW5mby5oYXModGhpcykpIHtcbiAgICAgIENvbXBvbmVudC5fX21lbWJlckluZm8uc2V0KHRoaXMsIG5ldyBNYXAoKSk7XG4gICAgfVxuICAgIGNvbnN0IG1lbWJlckluZm9BcnJheSA9IENvbXBvbmVudC5fX21lbWJlckluZm8uZ2V0KHRoaXMpO1xuXG4gICAgaWYgKGlzVmFyaWFibGVMZW5ndGggPT09IHRydWUpIHtcbiAgICAgIGlmIChcbiAgICAgICAgY29tcG9zaXRpb25UeXBlICE9PSBDb21wb3NpdGlvblR5cGUuVmVjNEFycmF5ICYmXG4gICAgICAgIGNvbXBvc2l0aW9uVHlwZSAhPT0gQ29tcG9zaXRpb25UeXBlLk1hdDRBcnJheSAmJlxuICAgICAgICBjb21wb3NpdGlvblR5cGUgIT09IENvbXBvc2l0aW9uVHlwZS5NYXQ0eDNBcnJheVxuICAgICAgKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVmFyaWFibGUtbGVuZ3RoIG1lbWJlciAke21lbWJlck5hbWV9IG11c3QgYmUgVmVjNEFycmF5LCBNYXQ0QXJyYXkgb3IgTWF0NHgzQXJyYXkuYCk7XG4gICAgICB9XG4gICAgICBpZiAoY29tcG9uZW50VHlwZSAhPT0gQ29tcG9uZW50VHlwZS5GbG9hdCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFZhcmlhYmxlLWxlbmd0aCBtZW1iZXIgJHttZW1iZXJOYW1lfSBtdXN0IGhhdmUgdGhlIEZsb2F0IGNvbXBvbmVudCB0eXBlLmApO1xuICAgICAgfVxuICAgICAgY29uc3QgbG9jYXRpb25JbmZvID0gbWVtYmVySW5mb0FycmF5IS5nZXQoQ29tcG9uZW50Ll9nZXRWYXJpYWJsZUxlbmd0aExvY2F0aW9uTWVtYmVyTmFtZShtZW1iZXJOYW1lKSk7XG4gICAgICBpZiAobG9jYXRpb25JbmZvID09IG51bGwgfHwgbG9jYXRpb25JbmZvLmNvbXBvc2l0aW9uVHlwZSAhPT0gQ29tcG9zaXRpb25UeXBlLlZlYzQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBSZWdpc3RlciBhIFZlYzQgbWVtYmVyIG5hbWVkICR7Q29tcG9uZW50Ll9nZXRWYXJpYWJsZUxlbmd0aExvY2F0aW9uTWVtYmVyTmFtZShtZW1iZXJOYW1lKX0gYmVmb3JlIHRoZSB2YXJpYWJsZS1sZW5ndGggbWVtYmVyICR7bWVtYmVyTmFtZX0uYFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lbWJlckluZm9BcnJheSEuc2V0KG1lbWJlck5hbWUsIHtcbiAgICAgIGJ1ZmZlclVzZTogYnVmZmVyVXNlLFxuICAgICAgbWVtYmVyTmFtZTogbWVtYmVyTmFtZSxcbiAgICAgIGRhdGFDbGFzc1R5cGU6IGRhdGFDbGFzc1R5cGUsXG4gICAgICBzaGFkZXJUeXBlOiBzaGFkZXJUeXBlLFxuICAgICAgY29tcG9zaXRpb25UeXBlOiBjb21wb3NpdGlvblR5cGUsXG4gICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlLFxuICAgICAgaW5pdFZhbHVlczogaW5pdFZhbHVlcyxcbiAgICAgIGNvbnZlcnRUb0Jvb2w6IGNvbnZlcnRUb0Jvb2wsXG4gICAgICBpc1ZhcmlhYmxlTGVuZ3RoOiBpc1ZhcmlhYmxlTGVuZ3RoLFxuICAgIH0pO1xuXG4gICAgaWYgKGFycmF5TGVuZ3RoICE9IG51bGwgJiYgY29tcG9uZW50U0lEICE9IG51bGwpIHtcbiAgICAgIGlmICghQ29tcG9uZW50Ll9fYXJyYXlMZW5ndGhNYXAuaGFzKHRoaXMpKSB7XG4gICAgICAgIENvbXBvbmVudC5fX2FycmF5TGVuZ3RoTWFwLnNldCh0aGlzLCBuZXcgTWFwKCkpO1xuICAgICAgfVxuICAgICAgY29uc3QgYXJyYXlMZW5ndGhNYXAgPSBDb21wb25lbnQuX19hcnJheUxlbmd0aE1hcC5nZXQodGhpcykhO1xuICAgICAgY29uc3QgY3VycmVudExlbmd0aCA9IGFycmF5TGVuZ3RoTWFwLmdldChtZW1iZXJOYW1lKTtcbiAgICAgIGlmIChjdXJyZW50TGVuZ3RoID09IG51bGwgfHwgYXJyYXlMZW5ndGggPiBjdXJyZW50TGVuZ3RoKSB7XG4gICAgICAgIC8vIEtlZXAgdGhlIG1heGltdW0gcmVxdWVzdGVkIGxlbmd0aCBzbyBkeW5hbWljYWxseSBzaXplZCBjb21wb25lbnRzIChlLmcuIFNrZWxldGFsQ29tcG9uZW50KSBhbGxvY2F0ZSBlbm91Z2ggc3BhY2VcbiAgICAgICAgYXJyYXlMZW5ndGhNYXAuc2V0KG1lbWJlck5hbWUsIGFycmF5TGVuZ3RoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWxsb2NhdGVzIG1lbW9yeSBmb3IgYWxsIG1lbWJlciBmaWVsZHMgb2YgdGhpcyBjb21wb25lbnQgaW5zdGFuY2UuXG4gICAqIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBkdXJpbmcgY29tcG9uZW50IGluaXRpYWxpemF0aW9uIHRvIHNldCB1cCBtZW1vcnkgbGF5b3V0XG4gICAqIGFuZCBhbGxvY2F0ZSBzcGFjZSBmb3IgdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZW50aXRpZXMuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgLSBUaGUgbnVtYmVyIG9mIGNvbXBvbmVudHMgcGVyIGJ1ZmZlciB2aWV3XG4gICAqIEBwYXJhbSBpc1JlVXNlIC0gV2hldGhlciB0byByZXVzZSBleGlzdGluZyBtZW1vcnkgYWxsb2NhdGlvbnNcbiAgICovXG4gIHN1Ym1pdFRvQWxsb2NhdGlvbihjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXc6IENvdW50LCBpc1JlVXNlOiBib29sZWFuKTogdm9pZCB7XG4gICAgY29uc3QgY29tcG9uZW50Q2xhc3MgPSB0aGlzLmNvbnN0cnVjdG9yIGFzIHR5cGVvZiBDb21wb25lbnQ7XG4gICAgY29uc3QgcmVnaXN0cnkgPSB0aGlzLl9jb21wb25lbnRNZW1vcnlSZWdpc3RyeTtcbiAgICByZWdpc3RyeS5zZXRDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcoY29tcG9uZW50Q2xhc3MsIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyk7XG4gICAgY29uc3QgbWVtYmVySW5mb0FycmF5ID0gQ29tcG9uZW50Ll9fbWVtYmVySW5mby5nZXQoY29tcG9uZW50Q2xhc3MpITtcbiAgICBjb25zdCBlbmdpbmUgPSB0aGlzLl9fZW5naW5lO1xuXG4gICAgLy8gVXN1YWxseSB0aGUgZmlyc3QgY29tcG9uZW50IG9mIGEgYnVmZmVyIHZpZXcgY3JlYXRlcyB0aGUgYnVmZmVyIHZpZXdzIGFuZCBhY2Nlc3NvcnMuXG4gICAgLy8gQ29tcG9uZW50cyB3aGljaCBhbGxvY2F0ZSBsYXppbHkgKGUuZy4gU2tlbGV0YWxDb21wb25lbnQgYWxsb2NhdGVzIGluIHNldEpvaW50cykgbWF5IGNvbWUgaW4gYW55IG9yZGVyLFxuICAgIC8vIHNvIGFsc28gY3JlYXRlIHRoZW0gaWYgdGhleSBkbyBub3QgZXhpc3QgeWV0LlxuICAgIGNvbnN0IGluZGV4T2ZUaGVCdWZmZXJWaWV3ID0gTWF0aC5mbG9vcih0aGlzLl9jb21wb25lbnRfc2lkIC8gY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3KTtcbiAgICBpZiAodGhpcy5fY29tcG9uZW50X3NpZCAlIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyA9PT0gMCB8fCBoYXNNaXNzaW5nQWNjZXNzb3IoaW5kZXhPZlRoZUJ1ZmZlclZpZXcpKSB7XG4gICAgICBnZXRCdWZmZXJWaWV3c0FuZEFjY2Vzc29ycyhpbmRleE9mVGhlQnVmZmVyVmlldyk7XG4gICAgfVxuXG4gICAgLy8gdGFrZSBhIGZpZWxkIHZhbHVlIGFsbG9jYXRpb24gZm9yIGVhY2ggZW50aXR5IGZvciBlYWNoIG1lbWJlciBmaWVsZFxuICAgIG1lbWJlckluZm9BcnJheS5mb3JFYWNoKGluZm8gPT4ge1xuICAgICAgaWYgKGluZm8uaXNWYXJpYWJsZUxlbmd0aCA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLl9fdGFrZU9uZShcbiAgICAgICAgaW5mby5tZW1iZXJOYW1lLFxuICAgICAgICBpbmZvLmRhdGFDbGFzc1R5cGUsXG4gICAgICAgIGluZm8uaW5pdFZhbHVlcyxcbiAgICAgICAgaXNSZVVzZSxcbiAgICAgICAgdGhpcy5fY29tcG9uZW50X3NpZCxcbiAgICAgICAgY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3XG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgLy8gVmFyaWFibGUtbGVuZ3RoIG1lbWJlcnMgYXJlIGFsbG9jYXRlZCBhZnRlciB0aGUgZml4ZWQgbWVtYmVycyxcbiAgICAvLyBiZWNhdXNlIHRoZWlyIGxvY2F0aW9ucyBhcmUgd3JpdHRlbiB0byBmaXhlZCBtZW1iZXJzLlxuICAgIG1lbWJlckluZm9BcnJheS5mb3JFYWNoKGluZm8gPT4ge1xuICAgICAgaWYgKGluZm8uaXNWYXJpYWJsZUxlbmd0aCA9PT0gdHJ1ZSkge1xuICAgICAgICB0aGlzLl9fdGFrZVZhcmlhYmxlTGVuZ3RoT25lKGluZm8sIHRoaXMuX2NvbXBvbmVudF9zaWQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gaW5uZXIgZnVuY3Rpb25zXG4gICAgZnVuY3Rpb24gaGFzTWlzc2luZ0FjY2Vzc29yKGluZGV4T2ZUaGVCdWZmZXJWaWV3OiBJbmRleE9mVGhlQnVmZmVyVmlldykge1xuICAgICAgZm9yIChjb25zdCBpbmZvIG9mIG1lbWJlckluZm9BcnJheS52YWx1ZXMoKSkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgaW5mby5pc1ZhcmlhYmxlTGVuZ3RoICE9PSB0cnVlICYmXG4gICAgICAgICAgcmVnaXN0cnkuZ2V0QWNjZXNzb3IoY29tcG9uZW50Q2xhc3MsIGluZm8ubWVtYmVyTmFtZSwgaW5kZXhPZlRoZUJ1ZmZlclZpZXcpID09IG51bGxcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRCdWZmZXJWaWV3c0FuZEFjY2Vzc29ycyhpbmRleE9mVGhlQnVmZmVyVmlldzogSW5kZXhPZlRoZUJ1ZmZlclZpZXcpIHtcbiAgICAgIC8vIGZvciBlYWNoIG1lbWJlciBmaWVsZCwgdGFrZSBhIEJ1ZmZlclZpZXcgZm9yIGFsbCBlbnRpdGllcycgdGhlIG1lbWJlciBmaWVsZC5cbiAgICAgIC8vIHRha2UgYSBBY2Nlc3NvciBmb3IgYWxsIGVudGl0aWVzIGZvciBlYWNoIG1lbWJlciBmaWVsZHMgKHNhbWUgYXMgQnVmZmVyVmlldylcbiAgICAgIG1lbWJlckluZm9BcnJheS5mb3JFYWNoKGluZm8gPT4ge1xuICAgICAgICBpZiAoaW5mby5pc1ZhcmlhYmxlTGVuZ3RoID09PSB0cnVlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFycmF5TGVuZ3RoID0gQ29tcG9uZW50Ll9fYXJyYXlMZW5ndGhNYXAuZ2V0KGNvbXBvbmVudENsYXNzKT8uZ2V0KGluZm8ubWVtYmVyTmFtZSk7XG4gICAgICAgIGNvbnN0IGFjY2Vzc29yUmVzdWx0ID0gQ29tcG9uZW50Ll9fdGFrZUFjY2Vzc29yKFxuICAgICAgICAgIGVuZ2luZSxcbiAgICAgICAgICBpbmZvLmJ1ZmZlclVzZSxcbiAgICAgICAgICBpbmZvLm1lbWJlck5hbWUsXG4gICAgICAgICAgY29tcG9uZW50Q2xhc3MsXG4gICAgICAgICAgaW5mby5jb21wb3NpdGlvblR5cGUsXG4gICAgICAgICAgaW5mby5jb21wb25lbnRUeXBlLFxuICAgICAgICAgIGluZGV4T2ZUaGVCdWZmZXJWaWV3LFxuICAgICAgICAgIGNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyxcbiAgICAgICAgICBhcnJheUxlbmd0aCA/PyAxXG4gICAgICAgICk7XG4gICAgICAgIGlmIChhY2Nlc3NvclJlc3VsdC5pc0VycigpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJuRXhjZXB0aW9uKGFjY2Vzc29yUmVzdWx0LmdldFJuRXJyb3IoKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWNjZXNzb3IgPSBhY2Nlc3NvclJlc3VsdC5nZXQoKTtcbiAgICAgICAgY29uc3QgYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzID0gZW5naW5lLm1lbW9yeU1hbmFnZXIuZ2V0Qnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzKFxuICAgICAgICAgIGluZm8uYnVmZmVyVXNlLFxuICAgICAgICAgIGFjY2Vzc29yLmJ1ZmZlclZpZXcuYnVmZmVyLmluZGV4T2ZUaGVCdWZmZXJVc2FnZVxuICAgICAgICApO1xuICAgICAgICBjb25zdCBieXRlT2Zmc2V0ID0gYnl0ZU9mZnNldE9mRXhpc3RpbmdCdWZmZXJzICsgYWNjZXNzb3IuYnl0ZU9mZnNldEluQnVmZmVyO1xuICAgICAgICByZWdpc3RyeS5zZXRCeXRlT2Zmc2V0KGNvbXBvbmVudENsYXNzLCBpbmZvLm1lbWJlck5hbWUsIGluZGV4T2ZUaGVCdWZmZXJWaWV3LCBieXRlT2Zmc2V0KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhcnJheSBsZW5ndGggdG8gYWxsb2NhdGUgZm9yIGEgdmFyaWFibGUtbGVuZ3RoIGFycmF5IG1lbWJlciBvZiB0aGlzIGNvbXBvbmVudCBpbnN0YW5jZVxuICAgKiAoc2VlIGByZWdpc3Rlck1lbWJlcmApLiBPdmVycmlkZSB0aGlzIHRvIGFsbG9jYXRlIGEgcGVyLWluc3RhbmNlIHNpemUuIFdoZW4gdW5kZWZpbmVkIGlzIHJldHVybmVkLFxuICAgKiB0aGUgbWF4aW11bSBhcnJheSBsZW5ndGggcmVnaXN0ZXJlZCBmb3IgdGhlIGNvbXBvbmVudCBjbGFzcyBpcyB1c2VkLlxuICAgKlxuICAgKiBAcGFyYW0gX21lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdmFyaWFibGUtbGVuZ3RoIGFycmF5IG1lbWJlclxuICAgKiBAcmV0dXJucyBUaGUgYXJyYXkgbGVuZ3RoLCBvciB1bmRlZmluZWQgdG8gdXNlIHRoZSBjbGFzcy13aWRlIHZhbHVlXG4gICAqL1xuICBwcm90ZWN0ZWQgX2dldEFycmF5TGVuZ3RoRm9yQWxsb2NhdGlvbihfbWVtYmVyTmFtZTogc3RyaW5nKTogQ291bnQgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgZW50aXR5IHRoYXQgb3ducyB0aGlzIGNvbXBvbmVudC5cbiAgICogVGhpcyBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlIGVudGl0eSBhbmQgaXRzIG90aGVyIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBlbnRpdHkgaW5zdGFuY2UgdGhhdCBvd25zIHRoaXMgY29tcG9uZW50XG4gICAqL1xuICBnZXQgZW50aXR5KCk6IElFbnRpdHkge1xuICAgIHJldHVybiB0aGlzLl9fZW50aXR5UmVwb3NpdG9yeS5nZXRFbnRpdHkodGhpcy5fX2VudGl0eVVpZCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgcGl4ZWwgbG9jYXRpb24gb2Zmc2V0IGluIHRoZSBidWZmZXIgZm9yIGEgc3BlY2lmaWMgbWVtYmVyIG9mIGEgY29tcG9uZW50IHR5cGUuXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciBHUFUgdGV4dHVyZS1iYXNlZCBkYXRhIGFjY2VzcyB3aGVyZSBsb2NhdGlvbnMgYXJlIG1lYXN1cmVkIGluIHBpeGVscy5cbiAgICpcbiAgICogQHBhcmFtIGVuZ2luZSAtIFRoZSBlbmdpbmUgaW5zdGFuY2VcbiAgICogQHBhcmFtIGNvbXBvbmVudFR5cGUgLSBUaGUgY29tcG9uZW50IGNsYXNzIHR5cGVcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWVtYmVyIGZpZWxkXG4gICAqIEByZXR1cm5zIFRoZSBwaXhlbCBsb2NhdGlvbiBvZmZzZXQgaW4gdGhlIGJ1ZmZlclxuICAgKi9cbiAgc3RhdGljIGdldExvY2F0aW9uT2Zmc2V0T2ZNZW1iZXJPZkNvbXBvbmVudChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBjb21wb25lbnRUeXBlOiB0eXBlb2YgQ29tcG9uZW50LFxuICAgIG1lbWJlck5hbWU6IHN0cmluZ1xuICApOiBJbmRleE9mMTZCeXRlc1tdIHtcbiAgICBjb25zdCBsb2NhdGlvbk9mZnNldHM6IEluZGV4T2YxNkJ5dGVzW10gPSBbXTtcbiAgICBjb25zdCByZWdpc3RyeSA9IGVuZ2luZS5jb21wb25lbnRNZW1vcnlSZWdpc3RyeTtcbiAgICBjb25zdCBieXRlT2Zmc2V0TWFwID0gcmVnaXN0cnkuZ2V0Qnl0ZU9mZnNldHNGb3JNZW1iZXIoY29tcG9uZW50VHlwZSwgbWVtYmVyTmFtZSk7XG4gICAgaWYgKGJ5dGVPZmZzZXRNYXAgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFswXTsgLy8gaW5kaWNhdGUgdGhhdCB0aGlzIGlzIGludmFsaWQgdmFsdWVcbiAgICB9XG4gICAgLy8gU2hhZGVycyBpbmRleCB0aGlzIGFycmF5IGJ5IHRoZSBidWZmZXIgdmlldyBpbmRleCwgd2hpY2ggbWF5IGRpZmZlciBmcm9tIHRoZSBjcmVhdGlvbiBvcmRlclxuICAgIGZvciAoY29uc3QgW2luZGV4T2ZUaGVCdWZmZXJWaWV3LCBieXRlT2Zmc2V0XSBvZiBieXRlT2Zmc2V0TWFwKSB7XG4gICAgICBsb2NhdGlvbk9mZnNldHNbaW5kZXhPZlRoZUJ1ZmZlclZpZXddID0gYnl0ZU9mZnNldCAvIDQgLyA0O1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2F0aW9uT2Zmc2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxvY2F0aW9uT2Zmc2V0c1tpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGxvY2F0aW9uT2Zmc2V0c1tpXSA9IDA7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBsb2NhdGlvbk9mZnNldHM7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGlzIGNvbXBvbmVudCB0byBhbiBlbnRpdHksIGV4dGVuZGluZyB0aGUgZW50aXR5IHdpdGggY29tcG9uZW50LXNwZWNpZmljIG1ldGhvZHMuXG4gICAqIFRoaXMgaXMgYSB2aXJ0dWFsIG1ldGhvZCB0aGF0IHNob3VsZCBiZSBvdmVycmlkZGVuIGJ5IGNvbmNyZXRlIGNvbXBvbmVudCBjbGFzc2VzLlxuICAgKlxuICAgKiBAdmlydHVhbFxuICAgKiBAcGFyYW0gYmFzZSAtIFRoZSB0YXJnZXQgZW50aXR5IHRvIGFkZCB0aGlzIGNvbXBvbmVudCB0b1xuICAgKiBAcGFyYW0gX2NvbXBvbmVudENsYXNzIC0gVGhlIGNvbXBvbmVudCBjbGFzcyBiZWluZyBhZGRlZFxuICAgKiBAcmV0dXJucyBUaGUgZW50aXR5IGV4dGVuZGVkIHdpdGggY29tcG9uZW50IG1ldGhvZHNcbiAgICogQHRocm93cyBFcnJvciBpbmRpY2F0aW5nIGludmFsaWQgY2FsbGluZyBvZiB2aXJ0dWFsIG1ldGhvZFxuICAgKi9cbiAgYWRkVGhpc0NvbXBvbmVudFRvRW50aXR5PEVudGl0eUJhc2UgZXh0ZW5kcyBJRW50aXR5LCBTb21lQ29tcG9uZW50Q2xhc3MgZXh0ZW5kcyB0eXBlb2YgQ29tcG9uZW50PihcbiAgICBfYmFzZTogRW50aXR5QmFzZSxcbiAgICBfY29tcG9uZW50Q2xhc3M6IFNvbWVDb21wb25lbnRDbGFzc1xuICApOiBFbnRpdHlCYXNlICYgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzPFNvbWVDb21wb25lbnRDbGFzcz4ge1xuICAgIC8vIGNhbiBub3QgYmUgY2FsbGVkLiB0aGlzIGlzIGEgdmlydHVhbCBtZXRob2QuXG4gICAgdGhyb3cgJ0ludmFsaWQgQ2FsbGluZyc7XG4gIH1cblxuICAvLyAvKipcbiAgLy8gICogQ29tcG9uZW50IGNyZWF0aW9uIHN0YWdlIG1ldGhvZC5cbiAgLy8gICogT3ZlcnJpZGUgdGhpcyBtZXRob2QgdG8gZGVmaW5lIHByb2Nlc3MgZGVwZW5kZW5jaWVzIHdpdGggb3RoZXIgY29tcG9uZW50cy5cbiAgLy8gICogSWYgY2lyY3VsYXIgZGVwZW5kZW5jaWVzIGFyZSBkZXRlY3RlZCwgYW4gZXJyb3Igd2lsbCBiZSByZXBvcnRlZC5cbiAgLy8gICovXG4gIC8vICRjcmVhdGUoKSB7XG4gIC8vICAgLy8gRGVmaW5lIHByb2Nlc3MgZGVwZW5kZW5jaWVzIHdpdGggb3RoZXIgY29tcG9uZW50cy5cbiAgLy8gICAvLyBJZiBjaXJjdWxhciBkZXBlbmRlbmNpZXMgYXJlIGRldGVjdGVkLCB0aGUgZXJyb3Igd2lsbCBiZSByZXBvcnRlZC5cblxuICAvLyAgIC8vIHRoaXMucmVnaXN0ZXJEZXBlbmRlbmN5KFRyYW5zZm9ybUNvbXBvbmVudCk7XG4gIC8vIH1cblxuICAvLyAvKipcbiAgLy8gICogQ29tcG9uZW50IGxvYWRpbmcgc3RhZ2UgbWV0aG9kLlxuICAvLyAgKiBPdmVycmlkZSB0aGlzIG1ldGhvZCB0byBoYW5kbGUgY29tcG9uZW50IGxvYWRpbmcgbG9naWMuXG4gIC8vICAqL1xuICAvLyAkbG9hZCgpIHt9XG5cbiAgLy8gLyoqXG4gIC8vICAqIENvbXBvbmVudCBtb3VudGluZyBzdGFnZSBtZXRob2QuXG4gIC8vICAqIE92ZXJyaWRlIHRoaXMgbWV0aG9kIHRvIGhhbmRsZSBjb21wb25lbnQgbW91bnRpbmcgbG9naWMuXG4gIC8vICAqL1xuICAvLyAkbW91bnQoKSB7fVxuXG4gIC8vIC8qKlxuICAvLyAgKiBDb21wb25lbnQgbG9naWMgc3RhZ2UgbWV0aG9kLlxuICAvLyAgKiBPdmVycmlkZSB0aGlzIG1ldGhvZCB0byBoYW5kbGUgY29tcG9uZW50IHVwZGF0ZSBsb2dpYy5cbiAgLy8gICovXG4gIC8vICRsb2dpYygpIHt9XG5cbiAgLy8gLyoqXG4gIC8vICAqIENvbXBvbmVudCBwcmUtcmVuZGVyIHN0YWdlIG1ldGhvZC5cbiAgLy8gICogT3ZlcnJpZGUgdGhpcyBtZXRob2QgdG8gaGFuZGxlIGNvbXBvbmVudCBwcmUtcmVuZGVyIGxvZ2ljLlxuICAvLyAgKlxuICAvLyAgKiBAcGFyYW0gaW5zdGFuY2VJREJ1ZmZlclVpZCAtIFRoZSBpbnN0YW5jZSBJRCBidWZmZXIgVUlEXG4gIC8vICAqL1xuICAvLyAkcHJlcmVuZGVyKGluc3RhbmNlSURCdWZmZXJVaWQ6IENHQVBJUmVzb3VyY2VIYW5kbGUpIHt9XG5cbiAgLy8gLyoqXG4gIC8vICAqIENvbXBvbmVudCByZW5kZXIgc3RhZ2UgbWV0aG9kLlxuICAvLyAgKiBPdmVycmlkZSB0aGlzIG1ldGhvZCB0byBoYW5kbGUgY29tcG9uZW50IHJlbmRlcmluZyBsb2dpYy5cbiAgLy8gICovXG4gIC8vICRyZW5kZXIoKSB7fVxuXG4gIC8vIC8qKlxuICAvLyAgKiBDb21wb25lbnQgdW5tb3VudGluZyBzdGFnZSBtZXRob2QuXG4gIC8vICAqIE92ZXJyaWRlIHRoaXMgbWV0aG9kIHRvIGhhbmRsZSBjb21wb25lbnQgdW5tb3VudGluZyBsb2dpYy5cbiAgLy8gICovXG4gIC8vICR1bm1vdW50KCkge31cblxuICAvLyAvKipcbiAgLy8gICogQ29tcG9uZW50IGRpc2NhcmQgc3RhZ2UgbWV0aG9kLlxuICAvLyAgKiBPdmVycmlkZSB0aGlzIG1ldGhvZCB0byBoYW5kbGUgY29tcG9uZW50IGNsZWFudXAgbG9naWMuXG4gIC8vICAqL1xuICAvLyAkZGlzY2FyZCgpIHt9XG5cbiAgLy8vXG4gIC8vLyBjb252ZW5pZW50IG1ldGhvZHMgYnV0IG5vdCB1c2VkIHlldFxuICAvLy9cblxuICAvKipcbiAgICogR2V0cyB0aGUgQ29tcG9zaXRpb25UeXBlIG9mIGEgc3BlY2lmaWMgbWVtYmVyIGZpZWxkIGluIGEgY29tcG9uZW50IGNsYXNzLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgdW5kZXJzdGFuZGluZyB0aGUgZGF0YSBzdHJ1Y3R1cmUgb2YgY29tcG9uZW50IG1lbWJlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEBwYXJhbSBtZW1iZXJOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIG1lbWJlciBmaWVsZFxuICAgKiBAcGFyYW0gY29tcG9uZW50Q2xhc3MgLSBUaGUgY29tcG9uZW50IGNsYXNzIHRvIHF1ZXJ5XG4gICAqIEByZXR1cm5zIFRoZSBDb21wb3NpdGlvblR5cGUgb2YgdGhlIG1lbWJlciBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqL1xuICBzdGF0aWMgZ2V0Q29tcG9zaXRpb25UeXBlT2ZNZW1iZXIoXG4gICAgX2VuZ2luZTogRW5naW5lLFxuICAgIG1lbWJlck5hbWU6IHN0cmluZyxcbiAgICBjb21wb25lbnRDbGFzczogdHlwZW9mIENvbXBvbmVudFxuICApOiBDb21wb3NpdGlvblR5cGVFbnVtIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZW1iZXJJbmZvQXJyYXkgPSBDb21wb25lbnQuX19tZW1iZXJJbmZvLmdldChjb21wb25lbnRDbGFzcykhO1xuICAgIGNvbnN0IGluZm8gPSBtZW1iZXJJbmZvQXJyYXkuZ2V0KG1lbWJlck5hbWUpO1xuICAgIGlmIChpbmZvICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBpbmZvLmNvbXBvc2l0aW9uVHlwZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBDb21wb25lbnRUeXBlIG9mIGEgc3BlY2lmaWMgbWVtYmVyIGZpZWxkIGluIGEgY29tcG9uZW50IGNsYXNzLlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgdW5kZXJzdGFuZGluZyB0aGUgcHJpbWl0aXZlIGRhdGEgdHlwZSBvZiBjb21wb25lbnQgbWVtYmVycy5cbiAgICpcbiAgICogQHBhcmFtIG1lbWJlck5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbWVtYmVyIGZpZWxkXG4gICAqIEBwYXJhbSBjb21wb25lbnRDbGFzcyAtIFRoZSBjb21wb25lbnQgY2xhc3MgdG8gcXVlcnlcbiAgICogQHJldHVybnMgVGhlIENvbXBvbmVudFR5cGUgb2YgdGhlIG1lbWJlciBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqL1xuICBzdGF0aWMgZ2V0Q29tcG9uZW50VHlwZU9mTWVtYmVyKFxuICAgIF9lbmdpbmU6IEVuZ2luZSxcbiAgICBtZW1iZXJOYW1lOiBzdHJpbmcsXG4gICAgY29tcG9uZW50Q2xhc3M6IHR5cGVvZiBDb21wb25lbnRcbiAgKTogQ29tcG9uZW50VHlwZUVudW0gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IG1lbWJlckluZm9BcnJheSA9IENvbXBvbmVudC5fX21lbWJlckluZm8uZ2V0KGNvbXBvbmVudENsYXNzKSE7XG4gICAgY29uc3QgaW5mbyA9IG1lbWJlckluZm9BcnJheS5nZXQobWVtYmVyTmFtZSk7XG4gICAgaWYgKGluZm8gIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGluZm8uY29tcG9uZW50VHlwZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtZW1iZXIgaW5mbyBvZiB0aGUgY29tcG9uZW50LlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgZ2V0dGluZyB0aGUgbWVtYmVyIGluZm8gb2YgdGhlIGNvbXBvbmVudC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG1lbWJlciBpbmZvIG9mIHRoZSBjb21wb25lbnRcbiAgICovXG4gIHN0YXRpYyBnZXRNZW1iZXJJbmZvKF9lbmdpbmU6IEVuZ2luZSk6IE1hcDx0eXBlb2YgQ29tcG9uZW50LCBNYXA8TWVtYmVyTmFtZSwgTWVtYmVySW5mbz4+IHtcbiAgICByZXR1cm4gbmV3IE1hcChDb21wb25lbnQuX19tZW1iZXJJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBudW1iZXIgb2YgY29tcG9uZW50cyBwZXIgYnVmZmVyIHZpZXcgZm9yIHRoZSBjb21wb25lbnQuXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgY29tcG9uZW50cyBwZXIgYnVmZmVyIHZpZXcgZm9yIHRoZSBjb21wb25lbnRcbiAgICovXG4gIHN0YXRpYyBnZXRDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcoZW5naW5lOiBFbmdpbmUpOiBNYXA8dHlwZW9mIENvbXBvbmVudCwgQ291bnQ+IHtcbiAgICByZXR1cm4gZW5naW5lLmNvbXBvbmVudE1lbW9yeVJlZ2lzdHJ5LmdldEFsbENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFycmF5IGxlbmd0aCBvZiBhIHNwZWNpZmljIG1lbWJlciBmaWVsZCBpbiBhIGNvbXBvbmVudCBjbGFzcy5cbiAgICogQHJldHVybnMgVGhlIGFycmF5IGxlbmd0aCBtYXAgb2YgdGhlIGNvbXBvbmVudFxuICAgKi9cbiAgc3RhdGljIGdldEFycmF5TGVuZ3RoT2ZNZW1iZXIoX2VuZ2luZTogRW5naW5lKTogTWFwPHR5cGVvZiBDb21wb25lbnQsIE1hcDxNZW1iZXJOYW1lLCBDb3VudD4+IHtcbiAgICByZXR1cm4gbmV3IE1hcChDb21wb25lbnQuX19hcnJheUxlbmd0aE1hcCk7XG4gIH1cblxuICAvKipcbiAgICogTWFya3MgdGhpcyBjb21wb25lbnQgYXMgZGVzdHJveWVkIGFuZCBubyBsb25nZXIgYWxpdmUuXG4gICAqIFRoaXMgaXMgdXNlZCBpbnRlcm5hbGx5IHRvIG1hbmFnZSBjb21wb25lbnQgbGlmZWN5Y2xlLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9kZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuX2lzQWxpdmUgPSBmYWxzZTtcbiAgICAvLyBjb25zdCBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgPSBDb21wb25lbnQuX19jb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcuZ2V0KFxuICAgIC8vICAgdGhpcy5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgQ29tcG9uZW50XG4gICAgLy8gKSE7XG4gICAgLy8gY29uc3QgYWNjZXNzb3JzT2ZUaGVDb21wb25lbnQgPSBDb21wb25lbnQuX19hY2Nlc3NvcnMuZ2V0KHRoaXMuY29uc3RydWN0b3IgYXMgdHlwZW9mIENvbXBvbmVudCk7XG4gICAgLy8gaWYgKGFjY2Vzc29yc09mVGhlQ29tcG9uZW50ICE9IG51bGwpIHtcbiAgICAvLyAgIGFjY2Vzc29yc09mVGhlQ29tcG9uZW50LmZvckVhY2goYWNjZXNzb3JzT2ZNZW1iZXIgPT4ge1xuICAgIC8vICAgICBhY2Nlc3NvcnNPZk1lbWJlci5kZWxldGUoTWF0aC5mbG9vcih0aGlzLl9jb21wb25lbnRfc2lkIC8gY29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3KSk7XG4gICAgLy8gICB9KTtcbiAgICAvLyB9XG4gICAgLy8gY29uc3QgYnl0ZU9mZnNldE9mQWNjZXNzb3JJbkJ1ZmZlck9mTWVtYmVycyA9IENvbXBvbmVudC5fX2J5dGVPZmZzZXRPZkFjY2Vzc29ySW5CdWZmZXJPZk1lbWJlcnMuZ2V0KFxuICAgIC8vICAgdGhpcy5jb25zdHJ1Y3RvciBhcyB0eXBlb2YgQ29tcG9uZW50XG4gICAgLy8gKTtcbiAgICAvLyBpZiAoYnl0ZU9mZnNldE9mQWNjZXNzb3JJbkJ1ZmZlck9mTWVtYmVycyAhPSBudWxsKSB7XG4gICAgLy8gICBieXRlT2Zmc2V0T2ZBY2Nlc3NvckluQnVmZmVyT2ZNZW1iZXJzLmZvckVhY2goYnl0ZU9mZnNldE9mQWNjZXNzb3JJbkJ1ZmZlck9mTWVtYmVyID0+IHtcbiAgICAvLyAgICAgYnl0ZU9mZnNldE9mQWNjZXNzb3JJbkJ1ZmZlck9mTWVtYmVyLmRlbGV0ZShNYXRoLmZsb29yKHRoaXMuX2NvbXBvbmVudF9zaWQgLyBjb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcpKTtcbiAgICAvLyAgIH0pO1xuICAgIC8vIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBhIHNoYWxsb3cgY29weSBvZiBkYXRhIGZyb20gYW5vdGhlciBjb21wb25lbnQgb2YgdGhlIHNhbWUgdHlwZS5cbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGltcGxlbWVudGVkIGJ5IGNvbmNyZXRlIGNvbXBvbmVudCBjbGFzc2VzIGFzIG5lZWRlZC5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudCAtIFRoZSBzb3VyY2UgY29tcG9uZW50IHRvIGNvcHkgZnJvbVxuICAgKi9cbiAgX3NoYWxsb3dDb3B5RnJvbShfY29tcG9uZW50OiBDb21wb25lbnQpOiB2b2lkIHtcbiAgICAvLyBuZXcgRXJyb3IoJ05vdCBJbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHN0YXRlIHZlcnNpb24gb2YgdGhlIGNvbXBvbmVudCBtZW1vcnkgbGF5b3V0LlxuICAgKiBUaGlzIGlzIGluY3JlbWVudGVkIHdoZW5ldmVyIHRoZSBjb21wb25lbnQncyBtZW1vcnkgbGF5b3V0IGNoYW5nZXMuXG4gICAqXG4gICAqIEBwYXJhbSBlbmdpbmUgLSBUaGUgZW5naW5lIGluc3RhbmNlXG4gICAqIEByZXR1cm5zIFRoZSBzdGF0ZSB2ZXJzaW9uIG51bWJlclxuICAgKi9cbiAgc3RhdGljIGdldFN0YXRlVmVyc2lvbihlbmdpbmU6IEVuZ2luZSk6IG51bWJlciB7XG4gICAgcmV0dXJuIGVuZ2luZS5jb21wb25lbnRNZW1vcnlSZWdpc3RyeS5nZXRTdGF0ZVZlcnNpb24oKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLFNBQVMscUJBQTZDO0FBQ3RELFNBQVMsdUJBQWlEO0FBSzFELFNBQVMsb0JBQTJDO0FBUXBELFNBQVMsZUFBZTtBQUd4QixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLEtBQUssVUFBdUI7QUFNckMsU0FBUyxnQkFBZ0I7QUFrQ2xCLElBQU0sYUFBTixNQUFNLG1CQUFrQixTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBaUR0QyxZQUNFLFFBQ0EsV0FDQSxjQUNBLGtCQUNBLFNBQ0E7QUFDQSxVQUFNO0FBdERSLG9CQUFXO0FBQ1gsU0FBVSxZQUFZO0FBRXRCLFNBQVUsd0JBQTBDLGFBQWE7QUFxRC9ELFNBQUssV0FBVztBQUNoQixTQUFLLGNBQWM7QUFDbkIsU0FBSyxpQkFBaUI7QUFFdEIsU0FBSyxrQkFBa0IsT0FBTztBQUM5QixTQUFLLHFCQUFxQjtBQUUxQixRQUFJLFNBQVM7QUFDWCxXQUFLLFlBQVk7QUFBQSxJQUNuQjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLFlBQVksY0FBZ0M7QUFH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
