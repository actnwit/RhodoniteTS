// src/foundation/geometry/Primitive.ts
import { RnObject } from "../core/RnObject.js";
import { BufferUse } from "../definitions/BufferUse.js";
import { ComponentType } from "../definitions/ComponentType.js";
import { CompositionType } from "../definitions/CompositionType.js";
import { PrimitiveMode } from "../definitions/PrimitiveMode.js";
import { VertexAttribute } from "../definitions/VertexAttribute.js";
import { createClassicUberMaterial } from "../helpers/materials/createClassicUberMaterial.js";
import { AABB } from "../math/AABB.js";
import { MutableVector3 } from "../math/MutableVector3.js";
import { Vector3 } from "../math/Vector3.js";
import { DataUtil } from "../misc/DataUtil.js";
import { Is } from "../misc/Is.js";
import { None, Some } from "../misc/Option.js";
import { RnException } from "../misc/RnException.js";
import {
  PrimitiveSortKey_BitLength_Material,
  PrimitiveSortKey_BitLength_PrimitiveType,
  PrimitiveSortKey_BitLength_RenderQueue,
  PrimitiveSortKey_BitLength_TranslucencyType,
  PrimitiveSortKey_BitOffset_Material,
  PrimitiveSortKey_BitOffset_PrimitiveType,
  PrimitiveSortKey_BitOffset_RenderQueue,
  PrimitiveSortKey_BitOffset_TranslucencyType
} from "./types/GeometryTypes.js";
var _Primitive = class _Primitive extends RnObject {
  /**
   * Creates a new Primitive instance.
   * Initializes the primitive with a default material if none exists.
   */
  constructor(engine) {
    super();
    this.Gl = PrimitiveMode.Unknown;
    this.Jl = /* @__PURE__ */ new Map();
    this.Xl = "";
    this.Cl = /* @__PURE__ */ new Map();
    this.El = new None();
    this.Kl = -1;
    // start ID from zero
    this.Ml = new AABB();
    this.Ol = [];
    this.Nl = -1;
    this._sortkey = 0;
    this._viewDepth = 0;
    this.Ul = 0;
    this.Vl = 0;
    this.Xd = "";
    this.c = engine;
    if (_Primitive.Ll == null) {
      _Primitive.Ll = createClassicUberMaterial(this.c, {
        isSkinning: true,
        isLighting: true
      });
    }
    this.Hl = _Primitive.Ll;
    this._prevMaterial = new WeakRef(_Primitive.Ll);
  }
  /**
   * Calculates a unique fingerprint string for the primitive based on its properties.
   * The fingerprint includes mode, indices, targets, and attributes configuration.
   * This is used for efficient primitive comparison and caching.
   */
  calcFingerPrint() {
    let str = "";
    str += this.Gl.index;
    if (this.El.has()) {
      str += this.getRenderIndexBitSize();
    }
    str += this.targets.length;
    str += _Primitive.getPrimitiveIdxHasMorph(this.Kl);
    for (const [semantic, accessor] of this.Cl) {
      str += semantic;
      str += accessor.componentType.webgpu + accessor.compositionType.webgpu;
      str += accessor.actualByteStride;
    }
    this.Xd = str;
  }
  /**
   * Gets the cached fingerprint string of the primitive.
   * @returns The fingerprint string used for primitive identification
   */
  _getFingerPrint() {
    return this.Xd;
  }
  /**
   * Gets the index bit size used for rendering. Primitives merged into a multi-draw
   * group use the shared uint32 index buffer regardless of their source accessor type.
   */
  getRenderIndexBitSize() {
    if (!this.El.has()) {
      return "uint16";
    }
    if (this.Fl != null) {
      return "uint32";
    }
    return this.getIndexBitSize();
  }
  /** The engine that owns this primitive (used to scope engine-wide scans). */
  get _engine() {
    return this.c;
  }
  /** The multi-draw group this primitive belongs to, if any. */
  get _multiDrawGroup() {
    return this.Fl;
  }
  /** The entry of this primitive inside its multi-draw group. */
  get _multiDrawEntry() {
    if (this.Fl == null || this.Nl < 0) {
      return void 0;
    }
    return this.Fl.entries[this.Nl];
  }
  /**
   * Associates this primitive with a multi-draw group entry and shares the group's
   * GPU handles. The caller is responsible for the group's GPU resources.
   * @internal
   */
  _setMultiDrawGroup(group, entryIndex) {
    this.Fl = group;
    this.Nl = entryIndex;
    this.Dl = group.vertexHandles;
    this.calcFingerPrint();
  }
  /**
   * Detaches this primitive from its multi-draw group.
   * @internal
   */
  _clearMultiDrawGroup() {
    this.Fl = void 0;
    this.Nl = -1;
    this.Dl = void 0;
    this.calcFingerPrint();
  }
  /**
   * Gets the index of a primitive with morph targets by its UID.
   * @param primitiveUid - The unique identifier of the primitive
   * @returns The index if the primitive has morph targets, otherwise undefined
   */
  static getPrimitiveIdxHasMorph(primitiveUid) {
    return this.Sl.get(primitiveUid);
  }
  /**
   * Gets a primitive with morph targets by its index.
   * @param primitiveIdx - The index of the primitive in the morph targets collection
   * @returns The primitive if found and still exists, otherwise undefined
   */
  static getPrimitiveHasMorph(primitiveIdx) {
    return this.Tl.get(primitiveIdx);
  }
  /**
   * Determines the bit size required for indices based on the index accessor type.
   * @returns 'uint16' for unsigned short/byte indices, 'uint32' for unsigned int indices
   * @throws Error if no index accessor exists or the component type is unsupported
   */
  getIndexBitSize() {
    const indexAccessor = this.El.unwrapOrUndefined();
    if (indexAccessor == null) {
      throw new Error("indexAccessor is null");
    }
    if (indexAccessor.componentType === ComponentType.UnsignedShort) {
      return "uint16";
    }
    if (indexAccessor.componentType === ComponentType.UnsignedInt) {
      return "uint32";
    }
    if (indexAccessor.componentType === ComponentType.UnsignedByte) {
      return "uint16";
    }
    throw new Error("unknown indexAccessor.componentType");
  }
  /**
   * Gets the vertex handles associated with this primitive for GPU resources.
   * @returns The vertex handles if they exist, otherwise undefined
   */
  get _vertexHandles() {
    return this.Dl;
  }
  /**
   * Gets the current count of material variant updates across all primitives.
   * This counter is incremented whenever material variants are modified.
   * @returns The number of material variant updates since application start
   */
  static get variantUpdateCount() {
    return this.Ql;
  }
  /**
   * Registers a material variant for this primitive with a specific name.
   * Material variants allow switching between different materials at runtime.
   * @param variantName - The unique name for this material variant
   * @param material - The material to associate with the variant name
   */
  setMaterialVariant(variantName, material) {
    this.Jl.set(variantName, material);
    _Primitive.Ql++;
  }
  /**
   * Applies a previously registered material variant by its name.
   * Changes the current material to the variant if it exists.
   * @param variantName - The name of the variant to apply
   */
  applyMaterialVariant(variantName) {
    const variant = this.Jl.get(variantName);
    if (variant) {
      this.material = variant;
      this.Xl = variantName;
      _Primitive.Ql++;
    }
  }
  /**
   * Gets the name of the currently applied material variant.
   * @returns The name of the active variant, or an empty string if no variant is active
   */
  getCurrentVariantName() {
    for (const [name, material] of this.Jl) {
      if (material === this.Hl) {
        return name;
      }
    }
    return "";
  }
  /**
   * Gets all registered variant names for this primitive.
   * @returns An array containing all variant names
   */
  getVariantNames() {
    return Array.from(this.Jl.keys());
  }
  /**
   * Gets the material associated with a specific variant name.
   * @param variantName - The name of the variant to look up
   * @returns The material for the variant, or undefined if the variant doesn't exist
   */
  getVariantMaterial(variantName) {
    return this.Jl.get(variantName);
  }
  /**
   * Sets the material for this primitive and updates rendering sort keys.
   * The sort key is updated based on material properties for efficient rendering order.
   * @param mat - The material to assign to this primitive
   */
  set material(mat) {
    this.Hl = mat;
    this.setSortKey(PrimitiveSortKey_BitOffset_Material, PrimitiveSortKey_BitLength_Material, mat.materialUID);
    let translucencyType = 0;
    if (mat.isTranslucentOpaque()) {
      translucencyType = 1;
    } else if (mat.isBlend()) {
      if (mat.zWriteWhenBlend) {
        translucencyType = 2;
      } else {
        translucencyType = 3;
      }
    }
    this.setSortKey(
      PrimitiveSortKey_BitOffset_TranslucencyType,
      PrimitiveSortKey_BitLength_TranslucencyType,
      translucencyType
    );
    mat._addBelongPrimitive(this);
    this.Il();
  }
  /**
   * Gets the current material assigned to this primitive.
   * @returns The material currently in use
   */
  get material() {
    return this.Hl;
  }
  /**
   * Updates the sort key by setting a specific bit range with a value.
   * Sort keys are used to optimize rendering order for transparency and material batching.
   * @param offset - The bit offset position where to start writing
   * @param length - The number of bits to write
   * @param value - The value to encode in the specified bit range
   */
  setSortKey(offset, length, value) {
    const offsetValue = value << offset;
    this._sortkey |= offsetValue;
    let mask = (1 << length) - 1;
    this._sortkey &= ~(mask << offset);
    this._sortkey |= (value & mask) << offset;
  }
  /**
   * Sets the render queue value of this primitive.
   * Higher values draw later within the same translucency bucket.
   * The queue is encoded into the viewport-layer bits of the sort key.
   * @param queue - Value between 0 and 2^3-1 representing relative draw order
   */
  setRenderQueue(queue) {
    const maxQueue = (1 << PrimitiveSortKey_BitLength_RenderQueue) - 1;
    const clamped = Math.max(0, Math.min(maxQueue, queue | 0));
    this.setSortKey(PrimitiveSortKey_BitOffset_RenderQueue, PrimitiveSortKey_BitLength_RenderQueue, clamped);
  }
  /**
   * Associates this primitive with a parent mesh.
   * This establishes the hierarchical relationship between mesh and primitive.
   * @param mesh - The mesh that this primitive belongs to
   * @internal
   */
  _belongToMesh(mesh) {
    this.Nd = mesh;
  }
  /**
   * Gets the mesh that this primitive belongs to.
   * @returns The parent mesh if it exists, otherwise undefined
   */
  get mesh() {
    return this.Nd;
  }
  /**
   * Creates a backup of the current material for later restoration.
   * Used internally for material switching operations.
   * @internal
   */
  _backupMaterial() {
    this._prevMaterial = new WeakRef(this.Hl);
  }
  /**
   * Restores the previously backed-up material if it still exists.
   * Used internally for reverting material changes.
   * @internal
   */
  _restoreMaterial() {
    const material = this._prevMaterial.deref();
    if (material != null) {
      this.Hl = material;
    }
  }
  /**
   * Retrieves a primitive instance by its unique identifier.
   * @param primitiveUid - The unique identifier of the primitive to find
   * @returns The primitive if found and still exists, otherwise undefined
   */
  static getPrimitive(primitiveUid) {
    var _a;
    return (_a = this.Bk[primitiveUid]) == null ? void 0 : _a.deref();
  }
  /**
   * Iterates over all live primitives created in this application.
   * @param callback - Called for each live primitive
   */
  static forEachPrimitive(callback) {
    var _a;
    for (let i = 0; i < this.Bk.length; i++) {
      const primitive = (_a = this.Bk[i]) == null ? void 0 : _a.deref();
      if (primitive != null) {
        callback(primitive);
      }
    }
  }
  /**
   * Gets the total number of primitives created in the application.
   * @returns The total count of primitives
   */
  static getPrimitiveCount() {
    return this.Rl;
  }
  /**
   * Notifies the primitive that its position accessor has been updated.
   * This triggers recalculation of bounding boxes and mesh updates.
   * @param accessorVersion - The new version number of the updated accessor
   */
  onAccessorUpdated(accessorVersion) {
    this.Vl = accessorVersion;
    if (this.Nd != null) {
      this.Nd._onPrimitivePositionUpdated();
    }
  }
  /**
   * Sets the vertex and index data for this primitive.
   * This is the main method for configuring primitive geometry and rendering properties.
   * @param attributes - Map of vertex attributes with their semantic meanings
   * @param mode - The primitive rendering mode (triangles, triangle strip, etc.)
   * @param material - Optional material to assign (uses default if not provided)
   * @param indicesAccessor - Optional index accessor for indexed rendering
   */
  setData(attributes, mode, material, indicesAccessor) {
    if (indicesAccessor != null) {
      this.El = new Some(indicesAccessor);
    } else {
      this.El = new None();
    }
    this.Cl = attributes;
    const positionAccessor = this.Cl.get(VertexAttribute.Position.XYZ);
    positionAccessor._primitive = new WeakRef(this);
    if (material != null) {
      this.material = material;
    } else {
      this.material = createClassicUberMaterial(this.c, {
        isSkinning: true,
        isLighting: true
      });
    }
    this.Gl = mode;
    this.setSortKey(PrimitiveSortKey_BitOffset_PrimitiveType, PrimitiveSortKey_BitLength_PrimitiveType, mode.index);
    this.Kl = _Primitive.Rl++;
    _Primitive.Bk[this.Kl] = new WeakRef(this);
    this.calcFingerPrint();
    this.Il();
  }
  /**
   * Copies vertex data from a descriptor into this primitive.
   * Creates appropriate buffers and accessors for the provided data.
   * @param desc - Descriptor containing arrays of vertex data and configuration
   */
  copyVertexData({ attributes, attributeSemantics, primitiveMode, indices, material }) {
    let sumOfAttributesByteSize = 0;
    const byteAlign = 4;
    attributes.forEach((attribute) => {
      sumOfAttributesByteSize += attribute.byteLength;
    });
    let bufferSize = sumOfAttributesByteSize;
    if (indices != null) {
      bufferSize += DataUtil.addPaddingBytes(indices.byteLength, byteAlign);
    }
    const buffer = this.c.memoryManager.createBufferOnDemand(BufferUse.CPUGeneric, bufferSize, byteAlign);
    let indicesComponentType;
    let indicesAccessor;
    if (indices != null) {
      indicesComponentType = ComponentType.fromTypedArray(indices);
      const indicesBufferViewResult = buffer.takeBufferView({
        byteLengthToNeed: indices.byteLength,
        byteStride: 0
      });
      if (indicesBufferViewResult.isErr()) {
        throw new RnException(indicesBufferViewResult.getRnError());
      }
      const indicesAccessorResult = indicesBufferViewResult.get().takeAccessor({
        compositionType: CompositionType.Scalar,
        componentType: indicesComponentType,
        count: indices.byteLength / indicesComponentType.getSizeInBytes()
      });
      if (indicesAccessorResult.isErr()) {
        throw new RnException(indicesAccessorResult.getRnError());
      }
      indicesAccessor = indicesAccessorResult.get();
      for (let i = 0; i < indices.byteLength / indicesAccessor.componentSizeInBytes; i++) {
        indicesAccessor.setScalar(i, indices[i], {});
      }
    }
    const attributesBufferView = buffer.takeBufferView({
      byteLengthToNeed: sumOfAttributesByteSize,
      byteStride: 0
    }).unwrapForce();
    const attributeAccessors = [];
    const attributeComponentTypes = [];
    attributes.forEach((typedArray, i) => {
      const compositionType = CompositionType.vectorFrom(VertexAttribute.toVectorComponentN(attributeSemantics[i]));
      attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
      const accessor = attributesBufferView.takeAccessor({
        compositionType,
        componentType: ComponentType.fromTypedArray(attributes[i]),
        count: typedArray.byteLength / compositionType.getNumberOfComponents() / attributeComponentTypes[i].getSizeInBytes()
      }).unwrapForce();
      accessor.copyFromTypedArray(typedArray);
      attributeAccessors.push(accessor);
    });
    const attributeMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < attributeSemantics.length; i++) {
      const attributeSemantic = attributeSemantics[i];
      attributeMap.set(attributeSemantic, attributeAccessors[i]);
    }
    this.setData(attributeMap, primitiveMode, material, indicesAccessor);
  }
  /**
   * Creates a new primitive from a descriptor containing vertex data.
   * This is a factory method that creates and initializes a primitive in one step.
   * @param desc - The primitive descriptor with vertex data and configuration
   * @returns A new primitive instance with the specified data
   */
  static createPrimitive(engine, desc) {
    const primitive = new _Primitive(engine);
    primitive.copyVertexData(desc);
    return primitive;
  }
  /**
   * Gets the index accessor for this primitive.
   * @returns The index accessor if indices are used, otherwise undefined
   */
  get indicesAccessor() {
    return this.El.unwrapOrUndefined();
  }
  /**
   * Gets the vertex count for indexed primitives.
   * For indexed rendering, this returns the number of indices.
   * @returns The number of indices if indexed, otherwise the vertex count
   */
  getVertexCountAsIndicesBased() {
    if (this.indicesAccessor) {
      return this.indicesAccessor.elementCount;
    }
    return this.getVertexCountAsVerticesBased();
  }
  /**
   * Gets the vertex count based on vertex buffer data.
   * @returns The number of vertices in the vertex buffers
   */
  getVertexCountAsVerticesBased() {
    for (const accessor of this.Cl.values()) {
      return accessor.elementCount;
    }
    return 0;
  }
  /**
   * Calculates the triangle count for indexed primitives.
   * The count depends on the primitive mode (triangles, triangle strip, etc.).
   * @returns The number of triangles that will be rendered with indices
   */
  getTriangleCountAsIndicesBased() {
    if (this.indicesAccessor) {
      switch (this.Gl) {
        case PrimitiveMode.Triangles:
          return this.indicesAccessor.elementCount / 3;
        case PrimitiveMode.TriangleStrip:
          return this.indicesAccessor.elementCount - 2;
        case PrimitiveMode.TriangleFan:
          return this.indicesAccessor.elementCount - 2;
        default:
          return 0;
      }
    }
    return this.getTriangleCountAsVerticesBased();
  }
  /**
   * Calculates the triangle count for non-indexed primitives.
   * The count depends on the primitive mode and vertex count.
   * @returns The number of triangles that will be rendered from vertices
   */
  getTriangleCountAsVerticesBased() {
    for (const accessor of this.Cl.values()) {
      switch (this.Gl) {
        case PrimitiveMode.Triangles:
          return accessor.elementCount / 3;
        case PrimitiveMode.TriangleStrip:
          return accessor.elementCount - 2;
        case PrimitiveMode.TriangleFan:
          return accessor.elementCount - 2;
        default:
          return 0;
      }
    }
    return 0;
  }
  /**
   * Checks if this primitive uses index-based rendering.
   * @returns True if the primitive has an index buffer, false otherwise
   */
  hasIndices() {
    return this.El.has();
  }
  /**
   * Gets all vertex attribute accessors for this primitive.
   * @returns An array of all attribute accessors
   */
  get attributeAccessors() {
    const accessors = [];
    this.Cl.forEach((accessor) => {
      accessors.push(accessor);
    });
    return accessors;
  }
  /**
   * Gets a specific vertex attribute by its semantic meaning.
   * @param semantic - The semantic identifier for the attribute
   * @returns The accessor for the attribute, or undefined if not found
   */
  getAttribute(semantic) {
    return this.Cl.get(semantic);
  }
  /**
   * Gets all vertex attribute semantic identifiers.
   * @returns An array of all attribute semantic strings
   */
  get attributeSemantics() {
    const semantics = [];
    this.Cl.forEach((_accessor, semantic) => {
      semantics.push(semantic);
    });
    return semantics;
  }
  /**
   * Gets an iterator for all attribute entries (semantic, accessor pairs).
   * @returns An iterator over attribute map entries
   */
  get attributeEntries() {
    return this.Cl.entries();
  }
  /**
   * Gets the composition types of all vertex attributes.
   * @returns An array of composition types (Vec2, Vec3, Vec4, Scalar, etc.)
   */
  get attributeCompositionTypes() {
    const types = [];
    this.Cl.forEach((accessor) => {
      types.push(accessor.compositionType);
    });
    return types;
  }
  /**
   * Gets the component types of all vertex attributes.
   * @returns An array of component types (Float, UnsignedByte, etc.)
   */
  get attributeComponentTypes() {
    const types = [];
    this.Cl.forEach((accessor) => {
      types.push(accessor.componentType);
    });
    return types;
  }
  /**
   * Gets the primitive rendering mode.
   * @returns The primitive mode enum (Triangles, TriangleStrip, etc.)
   */
  get primitiveMode() {
    return this.Gl;
  }
  /**
   * Gets the unique identifier for this primitive.
   * @returns The primitive's UID
   */
  get primitiveUid() {
    return this.Kl;
  }
  /**
   * Gets the version number of the position accessor.
   * Used to track when position data has been updated.
   * @returns The current position accessor version
   */
  get positionAccessorVersion() {
    return this.Vl;
  }
  /**
   * Gets the axis-aligned bounding box for this primitive.
   * The AABB is calculated from position data and cached until positions change.
   * @returns The bounding box containing all vertices
   */
  get AABB() {
    if (this.Ml.isVanilla() || this.positionAccessorVersion !== this.Ul) {
      const positionAccessor = this.Cl.get(VertexAttribute.Position.XYZ);
      const min = positionAccessor.min;
      this.Ml.minPoint = _Primitive.ta.setComponents(min[0], min[1], min[2]);
      const max = positionAccessor.max;
      this.Ml.maxPoint = _Primitive.ta.setComponents(max[0], max[1], max[2]);
      this.Ul = positionAccessor.version;
    }
    return this.Ml;
  }
  /**
   * Sets or updates a vertex attribute for this primitive.
   * @param accessor - The accessor containing the attribute data
   * @param vertexSemantic - The semantic meaning of the attribute
   */
  Il() {
    const mesh = this.Nd;
    if (mesh != null) {
      mesh._invalidateMultiDrawStructure();
    }
  }
  setVertexAttribute(accessor, vertexSemantic) {
    this.Cl.set(vertexSemantic, accessor);
    this.calcFingerPrint();
    this.Il();
  }
  /**
   * Removes the index buffer from this primitive, converting it to non-indexed rendering.
   */
  removeIndices() {
    this.El = new None();
    this.calcFingerPrint();
    this.Il();
  }
  /**
   * Sets the index buffer for this primitive, enabling indexed rendering.
   * @param accessor - The accessor containing index data
   */
  setIndices(accessor) {
    this.El = new Some(accessor);
    this.calcFingerPrint();
    this.Il();
  }
  /**
   * Sets blend shape (morph) targets for this primitive.
   * Blend shapes allow vertex animation by interpolating between target positions.
   * @param targets - Array of attribute maps representing morph targets
   */
  setBlendShapeTargets(targets) {
    _Primitive.Tl.set(_Primitive.Pl, this);
    _Primitive.Sl.set(this.Kl, _Primitive.Pl++);
    this.Ol = targets;
    this.calcFingerPrint();
    this.Il();
  }
  static getMorphUniformDataTargetNumbers() {
    const targetNumbers = [];
    for (let i = 0; i < _Primitive.getPrimitiveCountHasMorph(); i++) {
      const primitive = _Primitive.getPrimitiveHasMorph(i);
      targetNumbers.push(primitive.targets.length);
    }
    if (targetNumbers.length === 0) {
      return [0];
    }
    return targetNumbers;
  }
  static getMorphUniformDataOffsets() {
    const offsets = [0];
    for (let i = 0; i < _Primitive.getPrimitiveCountHasMorph(); i++) {
      const primitive = _Primitive.getPrimitiveHasMorph(i);
      offsets.push(offsets[offsets.length - 1] + primitive.targets.length);
    }
    return offsets;
  }
  static getPrimitiveCountHasMorph() {
    return this.Pl;
  }
  /**
   * Gets a copy of the blend shape targets for this primitive.
   * @returns A copy of the morph target array
   */
  getBlendShapeTargets() {
    return this.Ol.concat();
  }
  /**
   * Gets the blend shape targets array.
   * @returns The array of morph target attributes
   */
  get targets() {
    return this.Ol;
  }
  /**
   * Checks if this primitive uses blending (transparency) for rendering.
   * @returns True if the material has blending enabled, false otherwise
   */
  isBlend() {
    if (this.material == null || !this.material.isBlend()) {
      return false;
    }
    return true;
  }
  /**
   * Checks if this primitive is opaque (not transparent).
   * @returns True if the primitive is opaque, false if it uses blending
   */
  isOpaque() {
    return !this.isBlend();
  }
  /**
   * Creates GPU vertex and index buffers for this primitive.
   * This prepares the primitive for rendering by uploading data to the GPU.
   * @returns True if buffers were created, false if they already exist
   */
  create3DAPIVertexData() {
    if (this.Fl != null) {
      return false;
    }
    if (this.Dl != null) {
      return false;
    }
    const cgApiResourceRepository = this.c.cgApiResourceRepository;
    this.Dl = cgApiResourceRepository.createVertexBufferAndIndexBuffer(this);
    return true;
  }
  /**
   * Updates the GPU vertex and index buffers with current data.
   * Used when vertex data has been modified and needs to be re-uploaded.
   * @returns True if buffers were updated, false if no buffers exist
   */
  update3DAPIVertexData() {
    if (this.Fl != null) {
      return true;
    }
    const vertexHandles = this.Dl;
    if (Is.not.exist(this.Dl)) {
      return false;
    }
    const cgApiResourceRepository = this.c.cgApiResourceRepository;
    cgApiResourceRepository.updateVertexBufferAndIndexBuffer(this, vertexHandles);
    return true;
  }
  /**
   * Deletes the GPU vertex and index buffers for this primitive.
   * Frees GPU memory when the primitive is no longer needed.
   * @returns True if buffers were deleted, false if no buffers exist
   */
  delete3DAPIVertexData() {
    if (this.Fl != null) {
      return false;
    }
    if (this.Dl == null) {
      return false;
    }
    const cgApiResourceRepository = this.c.cgApiResourceRepository;
    cgApiResourceRepository.deleteVertexDataResources(this.Dl);
    this.Dl = void 0;
    return true;
  }
  /**
   * Gets the GPU resource handles for this primitive.
   * @returns The vertex handles for GPU resources, or undefined if not created
   */
  get vertexHandles() {
    return this.Dl;
  }
  /**
   * Converts this indexed primitive to non-indexed geometry.
   * Expands vertex data by duplicating vertices according to indices.
   * This can increase memory usage but simplifies some rendering operations.
   */
  convertToUnindexedGeometry() {
    const indexAccessor = this.indicesAccessor;
    if (indexAccessor == null) {
      return;
    }
    const indices = indexAccessor.getTypedArray();
    let bufferSize = 0;
    for (let i = 0; i < this.attributeAccessors.length; i++) {
      const accessor = this.attributeAccessors[i];
      const compositionType = accessor.compositionType;
      let compositionN = 0;
      if (compositionType.index === CompositionType.Vec4.index) {
        compositionN = 4;
      } else if (compositionType.index === CompositionType.Vec3.index) {
        compositionN = 3;
      } else if (compositionType.index === CompositionType.Vec2.index) {
        compositionN = 2;
      } else if (compositionType.index === CompositionType.Scalar.index) {
        compositionN = 1;
      }
      bufferSize += indices.length * compositionN * 4;
    }
    const buffer = this.c.memoryManager.createBufferOnDemand(
      BufferUse.CPUGeneric,
      bufferSize,
      4
      /* bytes */
    );
    const bufferView = buffer.takeBufferView({
      byteLengthToNeed: bufferSize,
      byteStride: 0
    }).unwrapForce();
    for (const [semantic, accessorOld] of this.Cl) {
      const compositionType = accessorOld.compositionType;
      const accessorNew = bufferView.takeAccessor({
        compositionType,
        componentType: accessorOld.componentType,
        count: indices.length
      }).unwrapForce();
      for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        if (compositionType.index === CompositionType.Vec4.index) {
          const vec4 = accessorOld.getVec4(idx, {});
          accessorNew.setVec4(i, vec4.x, vec4.y, vec4.z, vec4.w, {});
        } else if (compositionType.index === CompositionType.Vec3.index) {
          const vec3 = accessorOld.getVec3(idx, {});
          accessorNew.setVec3(i, vec3.x, vec3.y, vec3.z, {});
        } else if (compositionType.index === CompositionType.Vec2.index) {
          const vec2 = accessorOld.getVec2(idx, {});
          accessorNew.setVec2(i, vec2.x, vec2.y, {});
        } else if (compositionType.index === CompositionType.Scalar.index) {
          const scalar = accessorOld.getScalar(idx, {});
          accessorNew.setScalar(i, scalar, {});
        }
      }
      this.setVertexAttribute(accessorNew, semantic);
    }
    this.removeIndices();
  }
  /**
   * Performs ray casting against this primitive's geometry.
   * Tests intersection between a ray and the triangles of this primitive.
   * @param origVec3 - The origin point of the ray
   * @param dirVec3 - The direction vector of the ray (should be normalized)
   * @param isFrontFacePickable - Whether front-facing triangles can be hit
   * @param isBackFacePickable - Whether back-facing triangles can be hit
   * @param dotThreshold - Threshold for determining front/back face orientation
   * @param hasFaceNormal - Whether to use face normals for culling
   * @returns Ray casting result with intersection data or failure indication
   */
  castRay(origVec3, dirVec3, isFrontFacePickable, isBackFacePickable, dotThreshold, hasFaceNormal) {
    let currentShortestT = Number.MAX_VALUE;
    let incrementNum = 3;
    if (this.Gl === PrimitiveMode.TriangleStrip) {
      incrementNum = 1;
    } else if (this.Gl === PrimitiveMode.Points) {
      return {
        result: false
      };
    }
    let _hitPos0IndexBase = 0;
    let _hitPos1IndexBase = 0;
    let _hitPos2IndexBase = 0;
    let u = 0;
    let v = 0;
    if (this.hasIndices()) {
      const indices = this.El.unwrapForce();
      for (let i = 0; i < indices.elementCount - 2; i++) {
        const j = i * incrementNum;
        if (j + 2 > indices.elementCount - 1) {
          break;
        }
        const pos0IndexBase = indices.getScalar(j, {});
        const pos1IndexBase = indices.getScalar(j + 1, {});
        const pos2IndexBase = indices.getScalar(j + 2, {});
        const result = this.Wl(
          origVec3,
          dirVec3,
          i,
          pos0IndexBase,
          pos1IndexBase,
          pos2IndexBase,
          isFrontFacePickable,
          isBackFacePickable,
          dotThreshold,
          hasFaceNormal
        );
        if (Is.false(result) || Is.not.exist(result.data)) {
        } else {
          if (result.data.t < currentShortestT) {
            currentShortestT = result.data.t;
            u = result.data.u;
            v = result.data.v;
            _hitPos0IndexBase = pos0IndexBase;
            _hitPos1IndexBase = pos1IndexBase;
            _hitPos2IndexBase = pos2IndexBase;
          }
        }
      }
    } else {
      let elementCount = 0;
      for (const accessor of this.Cl.values()) {
        elementCount = accessor.elementCount;
        break;
      }
      for (let i = 0; i + 2 < elementCount; i += incrementNum) {
        const pos0IndexBase = i;
        const pos1IndexBase = i + 1;
        const pos2IndexBase = i + 2;
        const result = this.Wl(
          origVec3,
          dirVec3,
          i,
          pos0IndexBase,
          pos1IndexBase,
          pos2IndexBase,
          isFrontFacePickable,
          isBackFacePickable,
          dotThreshold,
          hasFaceNormal
        );
        if (result.result && Is.defined(result.data)) {
          const t = result.data.t;
          if (t < currentShortestT) {
            currentShortestT = t;
            u = result.data.u;
            v = result.data.v;
            _hitPos0IndexBase = pos0IndexBase;
            _hitPos1IndexBase = pos1IndexBase;
            _hitPos2IndexBase = pos2IndexBase;
          }
        }
      }
    }
    if (currentShortestT === Number.MAX_VALUE) {
      return {
        result: false
      };
    }
    const currentShortestIntersectedPosVec3 = Vector3.fromCopy3(
      dirVec3.x * currentShortestT + origVec3.x,
      dirVec3.y * currentShortestT + origVec3.y,
      dirVec3.z * currentShortestT + origVec3.z
    );
    return {
      result: true,
      data: {
        t: currentShortestT,
        u,
        v,
        position: currentShortestIntersectedPosVec3
      }
    };
  }
  /**
   * Internal ray-triangle intersection test using Tomas Möller algorithm.
   * @param origVec3 - Ray origin
   * @param dirVec3 - Ray direction
   * @param i - Triangle index
   * @param pos0IndexBase - First vertex index
   * @param pos1IndexBase - Second vertex index
   * @param pos2IndexBase - Third vertex index
   * @param isFrontFacePickable - Whether front faces are pickable
   * @param isBackFacePickable - Whether back faces are pickable
   * @param dotThreshold - Normal dot product threshold
   * @param hasFaceNormal - Whether to use face normals
   * @returns Intersection result with barycentric coordinates
   * @private
   */
  Wl(origVec3, dirVec3, i, pos0IndexBase, pos1IndexBase, pos2IndexBase, isFrontFacePickable, isBackFacePickable, dotThreshold, hasFaceNormal) {
    if (hasFaceNormal) {
      const normalAccessor = this.Cl.get(VertexAttribute.Normal.XYZ);
      if (normalAccessor) {
        const normal = normalAccessor.getVec3(i, {});
        if (normal.dot(dirVec3) < dotThreshold && !isFrontFacePickable) {
          return {
            result: false
          };
        }
        if (normal.dot(dirVec3) > -dotThreshold && !isBackFacePickable) {
          return {
            result: false
          };
        }
      }
    }
    const positionAccessor = this.Cl.get(VertexAttribute.Position.XYZ);
    const pos0Vec3 = positionAccessor.getVec3(pos0IndexBase, {});
    const pos1Vec3 = positionAccessor.getVec3(pos1IndexBase, {});
    const pos2Vec3 = positionAccessor.getVec3(pos2IndexBase, {});
    const e1 = MutableVector3.zero();
    const e2 = MutableVector3.zero();
    const pvec = MutableVector3.zero();
    const tvec = MutableVector3.zero();
    const qvec = MutableVector3.zero();
    let u = 0;
    let v = 0;
    MutableVector3.subtractTo(pos1Vec3, pos0Vec3, e1);
    MutableVector3.subtractTo(pos2Vec3, pos0Vec3, e2);
    MutableVector3.crossTo(dirVec3, e2, pvec);
    const det = Vector3.dot(e1, pvec);
    if (det > 1e-4) {
      MutableVector3.subtractTo(origVec3, pos0Vec3, tvec);
      u = Vector3.dot(tvec, pvec);
      if (u < 0 || u > det) {
        return {
          result: false
        };
      }
      MutableVector3.crossTo(tvec, e1, qvec);
      v = Vector3.dot(dirVec3, qvec);
      if (v < 0 || u + v > det) {
        return {
          result: false
        };
      }
    } else if (det < -1e-4) {
      MutableVector3.subtractTo(origVec3, pos0Vec3, tvec);
      u = Vector3.dot(tvec, pvec);
      if (u > 0 || u < det) {
        return {
          result: false
        };
      }
      MutableVector3.crossTo(tvec, e1, qvec);
      v = Vector3.dot(dirVec3, qvec);
      if (v > 0 || u + v < det) {
        return {
          result: false
        };
      }
    } else {
      return {
        result: false
      };
    }
    const inv_det = 1 / det;
    let t = Vector3.dot(e2, qvec);
    t *= inv_det;
    u *= inv_det;
    v *= inv_det;
    return {
      result: true,
      data: {
        t,
        u,
        v
      }
    };
  }
  /**
   * Calculates the normal vector from UV coordinates
   * @param pos0IndexBase Index of first position
   * @param pos1IndexBase Index of second position
   * @param pos2IndexBase Index of third position
   * @param u U coordinate
   * @param v V coordinate
   * @returns The calculated normal vector
   */
  Yl(pos0IndexBase, pos1IndexBase, pos2IndexBase, u, v) {
    const fDat = 1 - u - v;
    const positionAccessor = this.Cl.get(VertexAttribute.Position.XYZ);
    const pos0Vec3 = positionAccessor.getVec3(pos0IndexBase, {});
    const pos1Vec3 = positionAccessor.getVec3(pos1IndexBase, {});
    const pos2Vec3 = positionAccessor.getVec3(pos2IndexBase, {});
    const pos0 = Vector3.multiply(pos0Vec3, fDat);
    const pos1 = Vector3.multiply(pos1Vec3, u);
    const pos2 = Vector3.multiply(pos2Vec3, v);
    const intersectedPosVec3 = MutableVector3.zero().add(pos0).add(pos1).add(pos2);
    return intersectedPosVec3;
  }
};
_Primitive.Rl = 0;
_Primitive.Bk = [];
_Primitive.Sl = /* @__PURE__ */ new Map();
_Primitive.Tl = /* @__PURE__ */ new Map();
_Primitive.Pl = 0;
_Primitive.ta = MutableVector3.zero();
_Primitive.Ql = 0;
var Primitive = _Primitive;
export {
  Primitive
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZ2VvbWV0cnkvUHJpbWl0aXZlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvdW50LCBJbmRleCwgT2Zmc2V0LCBQcmltaXRpdmVVSUQsIFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgdHlwZSB7IE11bHRpRHJhd0VudHJ5LCBNdWx0aURyYXdHcm91cCB9IGZyb20gJy4uLy4uL3dlYmdsL011bHRpRHJhdyc7XG5pbXBvcnQgdHlwZSB7IFZlcnRleEhhbmRsZXMgfSBmcm9tICcuLi8uLi93ZWJnbC9XZWJHTFJlc291cmNlUmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBSbk9iamVjdCB9IGZyb20gJy4uL2NvcmUvUm5PYmplY3QnO1xuaW1wb3J0IHsgQnVmZmVyVXNlIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQnVmZmVyVXNlJztcbmltcG9ydCB7IENvbXBvbmVudFR5cGUsIHR5cGUgQ29tcG9uZW50VHlwZUVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb25lbnRUeXBlJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSwgdHlwZSBDb21wb3NpdGlvblR5cGVFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlJztcbmltcG9ydCB7IFByaW1pdGl2ZU1vZGUsIHR5cGUgUHJpbWl0aXZlTW9kZUVudW0gfSBmcm9tICcuLi9kZWZpbml0aW9ucy9QcmltaXRpdmVNb2RlJztcbmltcG9ydCB7IFZlcnRleEF0dHJpYnV0ZSwgdHlwZSBWZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY3NKb2luZWRTdHJpbmcgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHsgY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCB9IGZyb20gJy4uL2hlbHBlcnMvbWF0ZXJpYWxzL2NyZWF0ZUNsYXNzaWNVYmVyTWF0ZXJpYWwnO1xuaW1wb3J0IHR5cGUgeyBNYXRlcmlhbCB9IGZyb20gJy4uL21hdGVyaWFscy9jb3JlL01hdGVyaWFsJztcbmltcG9ydCB7IEFBQkIgfSBmcm9tICcuLi9tYXRoL0FBQkInO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc29yIH0gZnJvbSAnLi4vbWVtb3J5L0FjY2Vzc29yJztcbmltcG9ydCB7IERhdGFVdGlsIH0gZnJvbSAnLi4vbWlzYy9EYXRhVXRpbCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4uL21pc2MvSXMnO1xuaW1wb3J0IHsgTm9uZSwgdHlwZSBPcHRpb24sIFNvbWUgfSBmcm9tICcuLi9taXNjL09wdGlvbic7XG5pbXBvcnQgeyBSbkV4Y2VwdGlvbiB9IGZyb20gJy4uL21pc2MvUm5FeGNlcHRpb24nO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgTWVzaCB9IGZyb20gJy4vTWVzaCc7XG5pbXBvcnQge1xuICB0eXBlIElNZXNoLFxuICB0eXBlIFByaW1pdGl2ZVNvcnRLZXksXG4gIFByaW1pdGl2ZVNvcnRLZXlfQml0TGVuZ3RoX01hdGVyaWFsLFxuICBQcmltaXRpdmVTb3J0S2V5X0JpdExlbmd0aF9QcmltaXRpdmVUeXBlLFxuICBQcmltaXRpdmVTb3J0S2V5X0JpdExlbmd0aF9SZW5kZXJRdWV1ZSxcbiAgUHJpbWl0aXZlU29ydEtleV9CaXRMZW5ndGhfVHJhbnNsdWNlbmN5VHlwZSxcbiAgUHJpbWl0aXZlU29ydEtleV9CaXRPZmZzZXRfTWF0ZXJpYWwsXG4gIFByaW1pdGl2ZVNvcnRLZXlfQml0T2Zmc2V0X1ByaW1pdGl2ZVR5cGUsXG4gIFByaW1pdGl2ZVNvcnRLZXlfQml0T2Zmc2V0X1JlbmRlclF1ZXVlLFxuICBQcmltaXRpdmVTb3J0S2V5X0JpdE9mZnNldF9UcmFuc2x1Y2VuY3lUeXBlLFxuICB0eXBlIFByaW1pdGl2ZVNvcnRLZXlMZW5ndGgsXG4gIHR5cGUgUHJpbWl0aXZlU29ydEtleU9mZnNldCxcbiAgdHlwZSBSYXljYXN0UmVzdWx0LFxuICB0eXBlIFJheWNhc3RSZXN1bHRFeDEsXG59IGZyb20gJy4vdHlwZXMvR2VvbWV0cnlUeXBlcyc7XG5cbmV4cG9ydCB0eXBlIEF0dHJpYnV0ZXMgPSBNYXA8VmVydGV4QXR0cmlidXRlU2VtYW50aWNzSm9pbmVkU3RyaW5nLCBBY2Nlc3Nvcj47XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUFueVByaW1pdGl2ZURlc2NyaXB0b3Ige1xuICAvKiogYXR0YWNoIGEgcmhvZG9uaXRlIG1hdGVyaWFsIHRvIHRoaXMgcGxhbmUodGhlIGRlZmF1bHQgbWF0ZXJpYWwgaXMgdGhlIGNsYXNzaWNVYmVyTWF0ZXJpYWwgKi9cbiAgbWF0ZXJpYWw/OiBNYXRlcmlhbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcmltaXRpdmVEZXNjcmlwdG9yIGV4dGVuZHMgSUFueVByaW1pdGl2ZURlc2NyaXB0b3Ige1xuICBhdHRyaWJ1dGVzOiBUeXBlZEFycmF5W107XG4gIGF0dHJpYnV0ZVNlbWFudGljczogVmVydGV4QXR0cmlidXRlU2VtYW50aWNzSm9pbmVkU3RyaW5nW107XG4gIHByaW1pdGl2ZU1vZGU6IFByaW1pdGl2ZU1vZGVFbnVtO1xuICBpbmRpY2VzPzogVHlwZWRBcnJheTtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgZ2VvbWV0cmljIHByaW1pdGl2ZSB3aXRoIHZlcnRleCBhdHRyaWJ1dGVzLCBtYXRlcmlhbHMsIGFuZCByZW5kZXJpbmcgZGF0YS5cbiAqIEEgcHJpbWl0aXZlIGlzIHRoZSBiYXNpYyBidWlsZGluZyBibG9jayBmb3IgcmVuZGVyaW5nIDNEIGdlb21ldHJ5LlxuICovXG5leHBvcnQgY2xhc3MgUHJpbWl0aXZlIGV4dGVuZHMgUm5PYmplY3Qge1xuICBwcml2YXRlIF9fZW5naW5lOiBFbmdpbmU7XG4gIHByaXZhdGUgX19tb2RlOiBQcmltaXRpdmVNb2RlRW51bSA9IFByaW1pdGl2ZU1vZGUuVW5rbm93bjtcbiAgcHJpdmF0ZSBzdGF0aWMgX19kZWZhdWx0TWF0ZXJpYWw/OiBNYXRlcmlhbDtcbiAgcHJpdmF0ZSBfX21hdGVyaWFsOiBNYXRlcmlhbDtcbiAgcHJpdmF0ZSBfX21hdGVyaWFsVmFyaWFudHM6IE1hcDxzdHJpbmcsIE1hdGVyaWFsPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBfX2N1cnJlbnRWYXJpYW50TmFtZSA9ICcnO1xuICBwdWJsaWMgX3ByZXZNYXRlcmlhbDogV2Vha1JlZjxNYXRlcmlhbD47XG4gIHByaXZhdGUgX19hdHRyaWJ1dGVzOiBBdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuICBwcml2YXRlIF9fb0luZGljZXM6IE9wdGlvbjxBY2Nlc3Nvcj4gPSBuZXcgTm9uZSgpO1xuICBwcml2YXRlIHN0YXRpYyBfX3ByaW1pdGl2ZUNvdW50OiBDb3VudCA9IDA7XG4gIHByaXZhdGUgX19wcmltaXRpdmVVaWQ6IFByaW1pdGl2ZVVJRCA9IC0xOyAvLyBzdGFydCBJRCBmcm9tIHplcm9cbiAgcHJpdmF0ZSBfX2FhYmIgPSBuZXcgQUFCQigpO1xuICBwcml2YXRlIF9fdGFyZ2V0czogQXJyYXk8QXR0cmlidXRlcz4gPSBbXTtcbiAgcHJpdmF0ZSBfX3ZlcnRleEhhbmRsZXM/OiBWZXJ0ZXhIYW5kbGVzO1xuICBwcml2YXRlIF9fbWVzaD86IE1lc2g7XG4gIHByaXZhdGUgX19tdWx0aURyYXdHcm91cD86IE11bHRpRHJhd0dyb3VwO1xuICBwcml2YXRlIF9fbXVsdGlEcmF3RW50cnlJbmRleCA9IC0xO1xuICBwcml2YXRlIHN0YXRpYyBfX3ByaW1pdGl2ZXM6IFdlYWtSZWY8UHJpbWl0aXZlPltdID0gW107XG4gIHB1YmxpYyBfc29ydGtleTogUHJpbWl0aXZlU29ydEtleSA9IDA7XG4gIHB1YmxpYyBfdmlld0RlcHRoID0gMDtcblxuICBwcml2YXRlIHN0YXRpYyBfX3ByaW1pdGl2ZVVpZElkeEhhc01vcnBoOiBNYXA8UHJpbWl0aXZlVUlELCBJbmRleD4gPSBuZXcgTWFwKCk7XG4gIHByaXZhdGUgc3RhdGljIF9faWR4UHJpbWl0aXZlVWlkSGFzTW9ycGg6IE1hcDxJbmRleCwgUHJpbWl0aXZlPiA9IG5ldyBNYXAoKTtcbiAgcHJpdmF0ZSBzdGF0aWMgX19wcmltaXRpdmVDb3VudEhhc01vcnBoID0gMDtcblxuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlYzNfMDogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG5cbiAgcHJpdmF0ZSBfX2xhdGVzdFBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uID0gMDtcbiAgcHJpdmF0ZSBfX3Bvc2l0aW9uQWNjZXNzb3JWZXJzaW9uID0gMDtcbiAgcHJpdmF0ZSBzdGF0aWMgX192YXJpYW50VXBkYXRlQ291bnQgPSAwO1xuXG4gIHByaXZhdGUgX19maW5nZXJQcmludCA9ICcnO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFByaW1pdGl2ZSBpbnN0YW5jZS5cbiAgICogSW5pdGlhbGl6ZXMgdGhlIHByaW1pdGl2ZSB3aXRoIGEgZGVmYXVsdCBtYXRlcmlhbCBpZiBub25lIGV4aXN0cy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVuZ2luZTogRW5naW5lKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9fZW5naW5lID0gZW5naW5lO1xuICAgIGlmIChQcmltaXRpdmUuX19kZWZhdWx0TWF0ZXJpYWwgPT0gbnVsbCkge1xuICAgICAgUHJpbWl0aXZlLl9fZGVmYXVsdE1hdGVyaWFsID0gY3JlYXRlQ2xhc3NpY1ViZXJNYXRlcmlhbCh0aGlzLl9fZW5naW5lLCB7XG4gICAgICAgIGlzU2tpbm5pbmc6IHRydWUsXG4gICAgICAgIGlzTGlnaHRpbmc6IHRydWUsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLl9fbWF0ZXJpYWwgPSBQcmltaXRpdmUuX19kZWZhdWx0TWF0ZXJpYWw7XG4gICAgdGhpcy5fcHJldk1hdGVyaWFsID0gbmV3IFdlYWtSZWYoUHJpbWl0aXZlLl9fZGVmYXVsdE1hdGVyaWFsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGEgdW5pcXVlIGZpbmdlcnByaW50IHN0cmluZyBmb3IgdGhlIHByaW1pdGl2ZSBiYXNlZCBvbiBpdHMgcHJvcGVydGllcy5cbiAgICogVGhlIGZpbmdlcnByaW50IGluY2x1ZGVzIG1vZGUsIGluZGljZXMsIHRhcmdldHMsIGFuZCBhdHRyaWJ1dGVzIGNvbmZpZ3VyYXRpb24uXG4gICAqIFRoaXMgaXMgdXNlZCBmb3IgZWZmaWNpZW50IHByaW1pdGl2ZSBjb21wYXJpc29uIGFuZCBjYWNoaW5nLlxuICAgKi9cbiAgY2FsY0ZpbmdlclByaW50KCkge1xuICAgIGxldCBzdHIgPSAnJztcbiAgICBzdHIgKz0gdGhpcy5fX21vZGUuaW5kZXg7XG4gICAgaWYgKHRoaXMuX19vSW5kaWNlcy5oYXMoKSkge1xuICAgICAgc3RyICs9IHRoaXMuZ2V0UmVuZGVySW5kZXhCaXRTaXplKCk7XG4gICAgfVxuICAgIHN0ciArPSB0aGlzLnRhcmdldHMubGVuZ3RoO1xuICAgIHN0ciArPSBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlSWR4SGFzTW9ycGgodGhpcy5fX3ByaW1pdGl2ZVVpZCk7XG4gICAgZm9yIChjb25zdCBbc2VtYW50aWMsIGFjY2Vzc29yXSBvZiB0aGlzLl9fYXR0cmlidXRlcykge1xuICAgICAgc3RyICs9IHNlbWFudGljO1xuICAgICAgc3RyICs9IGFjY2Vzc29yLmNvbXBvbmVudFR5cGUud2ViZ3B1ICsgYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlLndlYmdwdTtcbiAgICAgIHN0ciArPSBhY2Nlc3Nvci5hY3R1YWxCeXRlU3RyaWRlO1xuICAgIH1cblxuICAgIHRoaXMuX19maW5nZXJQcmludCA9IHN0cjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjYWNoZWQgZmluZ2VycHJpbnQgc3RyaW5nIG9mIHRoZSBwcmltaXRpdmUuXG4gICAqIEByZXR1cm5zIFRoZSBmaW5nZXJwcmludCBzdHJpbmcgdXNlZCBmb3IgcHJpbWl0aXZlIGlkZW50aWZpY2F0aW9uXG4gICAqL1xuICBfZ2V0RmluZ2VyUHJpbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19maW5nZXJQcmludDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBpbmRleCBiaXQgc2l6ZSB1c2VkIGZvciByZW5kZXJpbmcuIFByaW1pdGl2ZXMgbWVyZ2VkIGludG8gYSBtdWx0aS1kcmF3XG4gICAqIGdyb3VwIHVzZSB0aGUgc2hhcmVkIHVpbnQzMiBpbmRleCBidWZmZXIgcmVnYXJkbGVzcyBvZiB0aGVpciBzb3VyY2UgYWNjZXNzb3IgdHlwZS5cbiAgICovXG4gIGdldFJlbmRlckluZGV4Qml0U2l6ZSgpOiAndWludDE2JyB8ICd1aW50MzInIHtcbiAgICBpZiAoIXRoaXMuX19vSW5kaWNlcy5oYXMoKSkge1xuICAgICAgcmV0dXJuICd1aW50MTYnO1xuICAgIH1cbiAgICBpZiAodGhpcy5fX211bHRpRHJhd0dyb3VwICE9IG51bGwpIHtcbiAgICAgIHJldHVybiAndWludDMyJztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ2V0SW5kZXhCaXRTaXplKCk7XG4gIH1cblxuICAvKiogVGhlIGVuZ2luZSB0aGF0IG93bnMgdGhpcyBwcmltaXRpdmUgKHVzZWQgdG8gc2NvcGUgZW5naW5lLXdpZGUgc2NhbnMpLiAqL1xuICBnZXQgX2VuZ2luZSgpOiBFbmdpbmUge1xuICAgIHJldHVybiB0aGlzLl9fZW5naW5lO1xuICB9XG5cbiAgLyoqIFRoZSBtdWx0aS1kcmF3IGdyb3VwIHRoaXMgcHJpbWl0aXZlIGJlbG9uZ3MgdG8sIGlmIGFueS4gKi9cbiAgZ2V0IF9tdWx0aURyYXdHcm91cCgpOiBNdWx0aURyYXdHcm91cCB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19tdWx0aURyYXdHcm91cDtcbiAgfVxuXG4gIC8qKiBUaGUgZW50cnkgb2YgdGhpcyBwcmltaXRpdmUgaW5zaWRlIGl0cyBtdWx0aS1kcmF3IGdyb3VwLiAqL1xuICBnZXQgX211bHRpRHJhd0VudHJ5KCk6IE11bHRpRHJhd0VudHJ5IHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5fX211bHRpRHJhd0dyb3VwID09IG51bGwgfHwgdGhpcy5fX211bHRpRHJhd0VudHJ5SW5kZXggPCAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX211bHRpRHJhd0dyb3VwLmVudHJpZXNbdGhpcy5fX211bHRpRHJhd0VudHJ5SW5kZXhdO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc29jaWF0ZXMgdGhpcyBwcmltaXRpdmUgd2l0aCBhIG11bHRpLWRyYXcgZ3JvdXAgZW50cnkgYW5kIHNoYXJlcyB0aGUgZ3JvdXAnc1xuICAgKiBHUFUgaGFuZGxlcy4gVGhlIGNhbGxlciBpcyByZXNwb25zaWJsZSBmb3IgdGhlIGdyb3VwJ3MgR1BVIHJlc291cmNlcy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfc2V0TXVsdGlEcmF3R3JvdXAoZ3JvdXA6IE11bHRpRHJhd0dyb3VwLCBlbnRyeUluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLl9fbXVsdGlEcmF3R3JvdXAgPSBncm91cDtcbiAgICB0aGlzLl9fbXVsdGlEcmF3RW50cnlJbmRleCA9IGVudHJ5SW5kZXg7XG4gICAgdGhpcy5fX3ZlcnRleEhhbmRsZXMgPSBncm91cC52ZXJ0ZXhIYW5kbGVzO1xuICAgIHRoaXMuY2FsY0ZpbmdlclByaW50KCk7XG4gIH1cblxuICAvKipcbiAgICogRGV0YWNoZXMgdGhpcyBwcmltaXRpdmUgZnJvbSBpdHMgbXVsdGktZHJhdyBncm91cC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfY2xlYXJNdWx0aURyYXdHcm91cCgpOiB2b2lkIHtcbiAgICB0aGlzLl9fbXVsdGlEcmF3R3JvdXAgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fX211bHRpRHJhd0VudHJ5SW5kZXggPSAtMTtcbiAgICB0aGlzLl9fdmVydGV4SGFuZGxlcyA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmNhbGNGaW5nZXJQcmludCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGluZGV4IG9mIGEgcHJpbWl0aXZlIHdpdGggbW9ycGggdGFyZ2V0cyBieSBpdHMgVUlELlxuICAgKiBAcGFyYW0gcHJpbWl0aXZlVWlkIC0gVGhlIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBwcmltaXRpdmVcbiAgICogQHJldHVybnMgVGhlIGluZGV4IGlmIHRoZSBwcmltaXRpdmUgaGFzIG1vcnBoIHRhcmdldHMsIG90aGVyd2lzZSB1bmRlZmluZWRcbiAgICovXG4gIHN0YXRpYyBnZXRQcmltaXRpdmVJZHhIYXNNb3JwaChwcmltaXRpdmVVaWQ6IFByaW1pdGl2ZVVJRCk6IEluZGV4IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5fX3ByaW1pdGl2ZVVpZElkeEhhc01vcnBoLmdldChwcmltaXRpdmVVaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBwcmltaXRpdmUgd2l0aCBtb3JwaCB0YXJnZXRzIGJ5IGl0cyBpbmRleC5cbiAgICogQHBhcmFtIHByaW1pdGl2ZUlkeCAtIFRoZSBpbmRleCBvZiB0aGUgcHJpbWl0aXZlIGluIHRoZSBtb3JwaCB0YXJnZXRzIGNvbGxlY3Rpb25cbiAgICogQHJldHVybnMgVGhlIHByaW1pdGl2ZSBpZiBmb3VuZCBhbmQgc3RpbGwgZXhpc3RzLCBvdGhlcndpc2UgdW5kZWZpbmVkXG4gICAqL1xuICBzdGF0aWMgZ2V0UHJpbWl0aXZlSGFzTW9ycGgocHJpbWl0aXZlSWR4OiBJbmRleCk6IFByaW1pdGl2ZSB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuX19pZHhQcmltaXRpdmVVaWRIYXNNb3JwaC5nZXQocHJpbWl0aXZlSWR4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBiaXQgc2l6ZSByZXF1aXJlZCBmb3IgaW5kaWNlcyBiYXNlZCBvbiB0aGUgaW5kZXggYWNjZXNzb3IgdHlwZS5cbiAgICogQHJldHVybnMgJ3VpbnQxNicgZm9yIHVuc2lnbmVkIHNob3J0L2J5dGUgaW5kaWNlcywgJ3VpbnQzMicgZm9yIHVuc2lnbmVkIGludCBpbmRpY2VzXG4gICAqIEB0aHJvd3MgRXJyb3IgaWYgbm8gaW5kZXggYWNjZXNzb3IgZXhpc3RzIG9yIHRoZSBjb21wb25lbnQgdHlwZSBpcyB1bnN1cHBvcnRlZFxuICAgKi9cbiAgZ2V0SW5kZXhCaXRTaXplKCk6ICd1aW50MTYnIHwgJ3VpbnQzMicge1xuICAgIGNvbnN0IGluZGV4QWNjZXNzb3IgPSB0aGlzLl9fb0luZGljZXMudW53cmFwT3JVbmRlZmluZWQoKTtcbiAgICBpZiAoaW5kZXhBY2Nlc3NvciA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luZGV4QWNjZXNzb3IgaXMgbnVsbCcpO1xuICAgIH1cbiAgICBpZiAoaW5kZXhBY2Nlc3Nvci5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkU2hvcnQpIHtcbiAgICAgIHJldHVybiAndWludDE2JztcbiAgICB9XG4gICAgaWYgKGluZGV4QWNjZXNzb3IuY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZEludCkge1xuICAgICAgcmV0dXJuICd1aW50MzInO1xuICAgIH1cbiAgICBpZiAoaW5kZXhBY2Nlc3Nvci5jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkQnl0ZSkge1xuICAgICAgcmV0dXJuICd1aW50MTYnO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gaW5kZXhBY2Nlc3Nvci5jb21wb25lbnRUeXBlJyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmVydGV4IGhhbmRsZXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgcHJpbWl0aXZlIGZvciBHUFUgcmVzb3VyY2VzLlxuICAgKiBAcmV0dXJucyBUaGUgdmVydGV4IGhhbmRsZXMgaWYgdGhleSBleGlzdCwgb3RoZXJ3aXNlIHVuZGVmaW5lZFxuICAgKi9cbiAgZ2V0IF92ZXJ0ZXhIYW5kbGVzKCkge1xuICAgIHJldHVybiB0aGlzLl9fdmVydGV4SGFuZGxlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGNvdW50IG9mIG1hdGVyaWFsIHZhcmlhbnQgdXBkYXRlcyBhY3Jvc3MgYWxsIHByaW1pdGl2ZXMuXG4gICAqIFRoaXMgY291bnRlciBpcyBpbmNyZW1lbnRlZCB3aGVuZXZlciBtYXRlcmlhbCB2YXJpYW50cyBhcmUgbW9kaWZpZWQuXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgbWF0ZXJpYWwgdmFyaWFudCB1cGRhdGVzIHNpbmNlIGFwcGxpY2F0aW9uIHN0YXJ0XG4gICAqL1xuICBzdGF0aWMgZ2V0IHZhcmlhbnRVcGRhdGVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fX3ZhcmlhbnRVcGRhdGVDb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBtYXRlcmlhbCB2YXJpYW50IGZvciB0aGlzIHByaW1pdGl2ZSB3aXRoIGEgc3BlY2lmaWMgbmFtZS5cbiAgICogTWF0ZXJpYWwgdmFyaWFudHMgYWxsb3cgc3dpdGNoaW5nIGJldHdlZW4gZGlmZmVyZW50IG1hdGVyaWFscyBhdCBydW50aW1lLlxuICAgKiBAcGFyYW0gdmFyaWFudE5hbWUgLSBUaGUgdW5pcXVlIG5hbWUgZm9yIHRoaXMgbWF0ZXJpYWwgdmFyaWFudFxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBUaGUgbWF0ZXJpYWwgdG8gYXNzb2NpYXRlIHdpdGggdGhlIHZhcmlhbnQgbmFtZVxuICAgKi9cbiAgc2V0TWF0ZXJpYWxWYXJpYW50KHZhcmlhbnROYW1lOiBzdHJpbmcsIG1hdGVyaWFsOiBNYXRlcmlhbCkge1xuICAgIHRoaXMuX19tYXRlcmlhbFZhcmlhbnRzLnNldCh2YXJpYW50TmFtZSwgbWF0ZXJpYWwpO1xuICAgIFByaW1pdGl2ZS5fX3ZhcmlhbnRVcGRhdGVDb3VudCsrO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSBwcmV2aW91c2x5IHJlZ2lzdGVyZWQgbWF0ZXJpYWwgdmFyaWFudCBieSBpdHMgbmFtZS5cbiAgICogQ2hhbmdlcyB0aGUgY3VycmVudCBtYXRlcmlhbCB0byB0aGUgdmFyaWFudCBpZiBpdCBleGlzdHMuXG4gICAqIEBwYXJhbSB2YXJpYW50TmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB2YXJpYW50IHRvIGFwcGx5XG4gICAqL1xuICBhcHBseU1hdGVyaWFsVmFyaWFudCh2YXJpYW50TmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgdmFyaWFudCA9IHRoaXMuX19tYXRlcmlhbFZhcmlhbnRzLmdldCh2YXJpYW50TmFtZSk7XG4gICAgaWYgKHZhcmlhbnQpIHtcbiAgICAgIHRoaXMubWF0ZXJpYWwgPSB2YXJpYW50O1xuICAgICAgdGhpcy5fX2N1cnJlbnRWYXJpYW50TmFtZSA9IHZhcmlhbnROYW1lO1xuICAgICAgUHJpbWl0aXZlLl9fdmFyaWFudFVwZGF0ZUNvdW50Kys7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG5hbWUgb2YgdGhlIGN1cnJlbnRseSBhcHBsaWVkIG1hdGVyaWFsIHZhcmlhbnQuXG4gICAqIEByZXR1cm5zIFRoZSBuYW1lIG9mIHRoZSBhY3RpdmUgdmFyaWFudCwgb3IgYW4gZW1wdHkgc3RyaW5nIGlmIG5vIHZhcmlhbnQgaXMgYWN0aXZlXG4gICAqL1xuICBnZXRDdXJyZW50VmFyaWFudE5hbWUoKSB7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgbWF0ZXJpYWxdIG9mIHRoaXMuX19tYXRlcmlhbFZhcmlhbnRzKSB7XG4gICAgICBpZiAobWF0ZXJpYWwgPT09IHRoaXMuX19tYXRlcmlhbCkge1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHJlZ2lzdGVyZWQgdmFyaWFudCBuYW1lcyBmb3IgdGhpcyBwcmltaXRpdmUuXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IGNvbnRhaW5pbmcgYWxsIHZhcmlhbnQgbmFtZXNcbiAgICovXG4gIGdldFZhcmlhbnROYW1lcygpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLl9fbWF0ZXJpYWxWYXJpYW50cy5rZXlzKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1hdGVyaWFsIGFzc29jaWF0ZWQgd2l0aCBhIHNwZWNpZmljIHZhcmlhbnQgbmFtZS5cbiAgICogQHBhcmFtIHZhcmlhbnROYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHZhcmlhbnQgdG8gbG9vayB1cFxuICAgKiBAcmV0dXJucyBUaGUgbWF0ZXJpYWwgZm9yIHRoZSB2YXJpYW50LCBvciB1bmRlZmluZWQgaWYgdGhlIHZhcmlhbnQgZG9lc24ndCBleGlzdFxuICAgKi9cbiAgZ2V0VmFyaWFudE1hdGVyaWFsKHZhcmlhbnROYW1lOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5fX21hdGVyaWFsVmFyaWFudHMuZ2V0KHZhcmlhbnROYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtYXRlcmlhbCBmb3IgdGhpcyBwcmltaXRpdmUgYW5kIHVwZGF0ZXMgcmVuZGVyaW5nIHNvcnQga2V5cy5cbiAgICogVGhlIHNvcnQga2V5IGlzIHVwZGF0ZWQgYmFzZWQgb24gbWF0ZXJpYWwgcHJvcGVydGllcyBmb3IgZWZmaWNpZW50IHJlbmRlcmluZyBvcmRlci5cbiAgICogQHBhcmFtIG1hdCAtIFRoZSBtYXRlcmlhbCB0byBhc3NpZ24gdG8gdGhpcyBwcmltaXRpdmVcbiAgICovXG4gIHNldCBtYXRlcmlhbChtYXQ6IE1hdGVyaWFsKSB7XG4gICAgdGhpcy5fX21hdGVyaWFsID0gbWF0O1xuICAgIHRoaXMuc2V0U29ydEtleShQcmltaXRpdmVTb3J0S2V5X0JpdE9mZnNldF9NYXRlcmlhbCwgUHJpbWl0aXZlU29ydEtleV9CaXRMZW5ndGhfTWF0ZXJpYWwsIG1hdC5tYXRlcmlhbFVJRCk7XG5cbiAgICBsZXQgdHJhbnNsdWNlbmN5VHlwZSA9IDA7IC8vIG9wYXF1ZVxuICAgIGlmIChtYXQuaXNUcmFuc2x1Y2VudE9wYXF1ZSgpKSB7XG4gICAgICB0cmFuc2x1Y2VuY3lUeXBlID0gMTsgLy8gdHJhbnNsdWNlbnRcbiAgICB9IGVsc2UgaWYgKG1hdC5pc0JsZW5kKCkpIHtcbiAgICAgIGlmIChtYXQueldyaXRlV2hlbkJsZW5kKSB7XG4gICAgICAgIHRyYW5zbHVjZW5jeVR5cGUgPSAyOyAvLyBibGVuZCB3aXRoIFpXcml0ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJhbnNsdWNlbmN5VHlwZSA9IDM7IC8vIGJsZW5kIHdpdGhvdXQgWldyaXRlXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2V0U29ydEtleShcbiAgICAgIFByaW1pdGl2ZVNvcnRLZXlfQml0T2Zmc2V0X1RyYW5zbHVjZW5jeVR5cGUsXG4gICAgICBQcmltaXRpdmVTb3J0S2V5X0JpdExlbmd0aF9UcmFuc2x1Y2VuY3lUeXBlLFxuICAgICAgdHJhbnNsdWNlbmN5VHlwZVxuICAgICk7XG4gICAgbWF0Ll9hZGRCZWxvbmdQcmltaXRpdmUodGhpcyk7XG4gICAgdGhpcy5fX2ludmFsaWRhdGVNdWx0aURyYXdHcm91cCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGN1cnJlbnQgbWF0ZXJpYWwgYXNzaWduZWQgdG8gdGhpcyBwcmltaXRpdmUuXG4gICAqIEByZXR1cm5zIFRoZSBtYXRlcmlhbCBjdXJyZW50bHkgaW4gdXNlXG4gICAqL1xuICBnZXQgbWF0ZXJpYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXRlcmlhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBzb3J0IGtleSBieSBzZXR0aW5nIGEgc3BlY2lmaWMgYml0IHJhbmdlIHdpdGggYSB2YWx1ZS5cbiAgICogU29ydCBrZXlzIGFyZSB1c2VkIHRvIG9wdGltaXplIHJlbmRlcmluZyBvcmRlciBmb3IgdHJhbnNwYXJlbmN5IGFuZCBtYXRlcmlhbCBiYXRjaGluZy5cbiAgICogQHBhcmFtIG9mZnNldCAtIFRoZSBiaXQgb2Zmc2V0IHBvc2l0aW9uIHdoZXJlIHRvIHN0YXJ0IHdyaXRpbmdcbiAgICogQHBhcmFtIGxlbmd0aCAtIFRoZSBudW1iZXIgb2YgYml0cyB0byB3cml0ZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgdmFsdWUgdG8gZW5jb2RlIGluIHRoZSBzcGVjaWZpZWQgYml0IHJhbmdlXG4gICAqL1xuICBzZXRTb3J0S2V5KG9mZnNldDogUHJpbWl0aXZlU29ydEtleU9mZnNldCwgbGVuZ3RoOiBQcmltaXRpdmVTb3J0S2V5TGVuZ3RoLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgY29uc3Qgb2Zmc2V0VmFsdWUgPSB2YWx1ZSA8PCBvZmZzZXQ7XG4gICAgdGhpcy5fc29ydGtleSB8PSBvZmZzZXRWYWx1ZTtcblxuICAgIC8vIENyZWF0ZXMgYSBtYXNrIHdpdGggdGhlIHNwZWNpZmllZCBiaXQgbGVuZ3RoXG4gICAgbGV0IG1hc2sgPSAoMSA8PCBsZW5ndGgpIC0gMTtcbiAgICAvLyBDbGVhciBkZXNpZ25hdGVkIG9mZnNldCBiaXRzXG4gICAgdGhpcy5fc29ydGtleSAmPSB+KG1hc2sgPDwgb2Zmc2V0KTtcbiAgICAvLyBXcml0ZXMgYSB2YWx1ZSB0byB0aGUgc3BlY2lmaWVkIG9mZnNldFxuICAgIHRoaXMuX3NvcnRrZXkgfD0gKHZhbHVlICYgbWFzaykgPDwgb2Zmc2V0O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHJlbmRlciBxdWV1ZSB2YWx1ZSBvZiB0aGlzIHByaW1pdGl2ZS5cbiAgICogSGlnaGVyIHZhbHVlcyBkcmF3IGxhdGVyIHdpdGhpbiB0aGUgc2FtZSB0cmFuc2x1Y2VuY3kgYnVja2V0LlxuICAgKiBUaGUgcXVldWUgaXMgZW5jb2RlZCBpbnRvIHRoZSB2aWV3cG9ydC1sYXllciBiaXRzIG9mIHRoZSBzb3J0IGtleS5cbiAgICogQHBhcmFtIHF1ZXVlIC0gVmFsdWUgYmV0d2VlbiAwIGFuZCAyXjMtMSByZXByZXNlbnRpbmcgcmVsYXRpdmUgZHJhdyBvcmRlclxuICAgKi9cbiAgc2V0UmVuZGVyUXVldWUocXVldWU6IG51bWJlcikge1xuICAgIGNvbnN0IG1heFF1ZXVlID0gKDEgPDwgUHJpbWl0aXZlU29ydEtleV9CaXRMZW5ndGhfUmVuZGVyUXVldWUpIC0gMTtcbiAgICBjb25zdCBjbGFtcGVkID0gTWF0aC5tYXgoMCwgTWF0aC5taW4obWF4UXVldWUsIHF1ZXVlIHwgMCkpO1xuICAgIHRoaXMuc2V0U29ydEtleShQcmltaXRpdmVTb3J0S2V5X0JpdE9mZnNldF9SZW5kZXJRdWV1ZSwgUHJpbWl0aXZlU29ydEtleV9CaXRMZW5ndGhfUmVuZGVyUXVldWUsIGNsYW1wZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc29jaWF0ZXMgdGhpcyBwcmltaXRpdmUgd2l0aCBhIHBhcmVudCBtZXNoLlxuICAgKiBUaGlzIGVzdGFibGlzaGVzIHRoZSBoaWVyYXJjaGljYWwgcmVsYXRpb25zaGlwIGJldHdlZW4gbWVzaCBhbmQgcHJpbWl0aXZlLlxuICAgKiBAcGFyYW0gbWVzaCAtIFRoZSBtZXNoIHRoYXQgdGhpcyBwcmltaXRpdmUgYmVsb25ncyB0b1xuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9iZWxvbmdUb01lc2gobWVzaDogTWVzaCkge1xuICAgIHRoaXMuX19tZXNoID0gbWVzaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBtZXNoIHRoYXQgdGhpcyBwcmltaXRpdmUgYmVsb25ncyB0by5cbiAgICogQHJldHVybnMgVGhlIHBhcmVudCBtZXNoIGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHVuZGVmaW5lZFxuICAgKi9cbiAgZ2V0IG1lc2goKTogSU1lc2ggfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fbWVzaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgYmFja3VwIG9mIHRoZSBjdXJyZW50IG1hdGVyaWFsIGZvciBsYXRlciByZXN0b3JhdGlvbi5cbiAgICogVXNlZCBpbnRlcm5hbGx5IGZvciBtYXRlcmlhbCBzd2l0Y2hpbmcgb3BlcmF0aW9ucy5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBfYmFja3VwTWF0ZXJpYWwoKSB7XG4gICAgdGhpcy5fcHJldk1hdGVyaWFsID0gbmV3IFdlYWtSZWYodGhpcy5fX21hdGVyaWFsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN0b3JlcyB0aGUgcHJldmlvdXNseSBiYWNrZWQtdXAgbWF0ZXJpYWwgaWYgaXQgc3RpbGwgZXhpc3RzLlxuICAgKiBVc2VkIGludGVybmFsbHkgZm9yIHJldmVydGluZyBtYXRlcmlhbCBjaGFuZ2VzLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIF9yZXN0b3JlTWF0ZXJpYWwoKSB7XG4gICAgY29uc3QgbWF0ZXJpYWwgPSB0aGlzLl9wcmV2TWF0ZXJpYWwuZGVyZWYoKTtcbiAgICBpZiAobWF0ZXJpYWwgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fX21hdGVyaWFsID0gbWF0ZXJpYWw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIHByaW1pdGl2ZSBpbnN0YW5jZSBieSBpdHMgdW5pcXVlIGlkZW50aWZpZXIuXG4gICAqIEBwYXJhbSBwcmltaXRpdmVVaWQgLSBUaGUgdW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHByaW1pdGl2ZSB0byBmaW5kXG4gICAqIEByZXR1cm5zIFRoZSBwcmltaXRpdmUgaWYgZm91bmQgYW5kIHN0aWxsIGV4aXN0cywgb3RoZXJ3aXNlIHVuZGVmaW5lZFxuICAgKi9cbiAgc3RhdGljIGdldFByaW1pdGl2ZShwcmltaXRpdmVVaWQ6IFByaW1pdGl2ZVVJRCkge1xuICAgIHJldHVybiB0aGlzLl9fcHJpbWl0aXZlc1twcmltaXRpdmVVaWRdPy5kZXJlZigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGVzIG92ZXIgYWxsIGxpdmUgcHJpbWl0aXZlcyBjcmVhdGVkIGluIHRoaXMgYXBwbGljYXRpb24uXG4gICAqIEBwYXJhbSBjYWxsYmFjayAtIENhbGxlZCBmb3IgZWFjaCBsaXZlIHByaW1pdGl2ZVxuICAgKi9cbiAgc3RhdGljIGZvckVhY2hQcmltaXRpdmUoY2FsbGJhY2s6IChwcmltaXRpdmU6IFByaW1pdGl2ZSkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fX3ByaW1pdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IHRoaXMuX19wcmltaXRpdmVzW2ldPy5kZXJlZigpO1xuICAgICAgaWYgKHByaW1pdGl2ZSAhPSBudWxsKSB7XG4gICAgICAgIGNhbGxiYWNrKHByaW1pdGl2ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHRvdGFsIG51bWJlciBvZiBwcmltaXRpdmVzIGNyZWF0ZWQgaW4gdGhlIGFwcGxpY2F0aW9uLlxuICAgKiBAcmV0dXJucyBUaGUgdG90YWwgY291bnQgb2YgcHJpbWl0aXZlc1xuICAgKi9cbiAgc3RhdGljIGdldFByaW1pdGl2ZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl9fcHJpbWl0aXZlQ291bnQ7XG4gIH1cblxuICAvKipcbiAgICogTm90aWZpZXMgdGhlIHByaW1pdGl2ZSB0aGF0IGl0cyBwb3NpdGlvbiBhY2Nlc3NvciBoYXMgYmVlbiB1cGRhdGVkLlxuICAgKiBUaGlzIHRyaWdnZXJzIHJlY2FsY3VsYXRpb24gb2YgYm91bmRpbmcgYm94ZXMgYW5kIG1lc2ggdXBkYXRlcy5cbiAgICogQHBhcmFtIGFjY2Vzc29yVmVyc2lvbiAtIFRoZSBuZXcgdmVyc2lvbiBudW1iZXIgb2YgdGhlIHVwZGF0ZWQgYWNjZXNzb3JcbiAgICovXG4gIG9uQWNjZXNzb3JVcGRhdGVkKGFjY2Vzc29yVmVyc2lvbjogbnVtYmVyKSB7XG4gICAgdGhpcy5fX3Bvc2l0aW9uQWNjZXNzb3JWZXJzaW9uID0gYWNjZXNzb3JWZXJzaW9uO1xuICAgIGlmICh0aGlzLl9fbWVzaCAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fbWVzaC5fb25QcmltaXRpdmVQb3NpdGlvblVwZGF0ZWQoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmVydGV4IGFuZCBpbmRleCBkYXRhIGZvciB0aGlzIHByaW1pdGl2ZS5cbiAgICogVGhpcyBpcyB0aGUgbWFpbiBtZXRob2QgZm9yIGNvbmZpZ3VyaW5nIHByaW1pdGl2ZSBnZW9tZXRyeSBhbmQgcmVuZGVyaW5nIHByb3BlcnRpZXMuXG4gICAqIEBwYXJhbSBhdHRyaWJ1dGVzIC0gTWFwIG9mIHZlcnRleCBhdHRyaWJ1dGVzIHdpdGggdGhlaXIgc2VtYW50aWMgbWVhbmluZ3NcbiAgICogQHBhcmFtIG1vZGUgLSBUaGUgcHJpbWl0aXZlIHJlbmRlcmluZyBtb2RlICh0cmlhbmdsZXMsIHRyaWFuZ2xlIHN0cmlwLCBldGMuKVxuICAgKiBAcGFyYW0gbWF0ZXJpYWwgLSBPcHRpb25hbCBtYXRlcmlhbCB0byBhc3NpZ24gKHVzZXMgZGVmYXVsdCBpZiBub3QgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSBpbmRpY2VzQWNjZXNzb3IgLSBPcHRpb25hbCBpbmRleCBhY2Nlc3NvciBmb3IgaW5kZXhlZCByZW5kZXJpbmdcbiAgICovXG4gIHNldERhdGEoYXR0cmlidXRlczogQXR0cmlidXRlcywgbW9kZTogUHJpbWl0aXZlTW9kZUVudW0sIG1hdGVyaWFsPzogTWF0ZXJpYWwsIGluZGljZXNBY2Nlc3Nvcj86IEFjY2Vzc29yKSB7XG4gICAgaWYgKGluZGljZXNBY2Nlc3NvciAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9fb0luZGljZXMgPSBuZXcgU29tZShpbmRpY2VzQWNjZXNzb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9fb0luZGljZXMgPSBuZXcgTm9uZSgpO1xuICAgIH1cbiAgICB0aGlzLl9fYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG5cbiAgICBjb25zdCBwb3NpdGlvbkFjY2Vzc29yID0gdGhpcy5fX2F0dHJpYnV0ZXMuZ2V0KFZlcnRleEF0dHJpYnV0ZS5Qb3NpdGlvbi5YWVopITtcbiAgICBwb3NpdGlvbkFjY2Vzc29yLl9wcmltaXRpdmUgPSBuZXcgV2Vha1JlZih0aGlzKTtcblxuICAgIGlmIChtYXRlcmlhbCAhPSBudWxsKSB7XG4gICAgICB0aGlzLm1hdGVyaWFsID0gbWF0ZXJpYWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubWF0ZXJpYWwgPSBjcmVhdGVDbGFzc2ljVWJlck1hdGVyaWFsKHRoaXMuX19lbmdpbmUsIHtcbiAgICAgICAgaXNTa2lubmluZzogdHJ1ZSxcbiAgICAgICAgaXNMaWdodGluZzogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICB0aGlzLl9fbW9kZSA9IG1vZGU7XG4gICAgdGhpcy5zZXRTb3J0S2V5KFByaW1pdGl2ZVNvcnRLZXlfQml0T2Zmc2V0X1ByaW1pdGl2ZVR5cGUsIFByaW1pdGl2ZVNvcnRLZXlfQml0TGVuZ3RoX1ByaW1pdGl2ZVR5cGUsIG1vZGUuaW5kZXgpO1xuXG4gICAgdGhpcy5fX3ByaW1pdGl2ZVVpZCA9IFByaW1pdGl2ZS5fX3ByaW1pdGl2ZUNvdW50Kys7XG4gICAgUHJpbWl0aXZlLl9fcHJpbWl0aXZlc1t0aGlzLl9fcHJpbWl0aXZlVWlkXSA9IG5ldyBXZWFrUmVmKHRoaXMpO1xuICAgIHRoaXMuY2FsY0ZpbmdlclByaW50KCk7XG4gICAgdGhpcy5fX2ludmFsaWRhdGVNdWx0aURyYXdHcm91cCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyB2ZXJ0ZXggZGF0YSBmcm9tIGEgZGVzY3JpcHRvciBpbnRvIHRoaXMgcHJpbWl0aXZlLlxuICAgKiBDcmVhdGVzIGFwcHJvcHJpYXRlIGJ1ZmZlcnMgYW5kIGFjY2Vzc29ycyBmb3IgdGhlIHByb3ZpZGVkIGRhdGEuXG4gICAqIEBwYXJhbSBkZXNjIC0gRGVzY3JpcHRvciBjb250YWluaW5nIGFycmF5cyBvZiB2ZXJ0ZXggZGF0YSBhbmQgY29uZmlndXJhdGlvblxuICAgKi9cbiAgY29weVZlcnRleERhdGEoeyBhdHRyaWJ1dGVzLCBhdHRyaWJ1dGVTZW1hbnRpY3MsIHByaW1pdGl2ZU1vZGUsIGluZGljZXMsIG1hdGVyaWFsIH06IFByaW1pdGl2ZURlc2NyaXB0b3IpIHtcbiAgICBsZXQgc3VtT2ZBdHRyaWJ1dGVzQnl0ZVNpemUgPSAwO1xuICAgIGNvbnN0IGJ5dGVBbGlnbiA9IDQ7XG4gICAgYXR0cmlidXRlcy5mb3JFYWNoKGF0dHJpYnV0ZSA9PiB7XG4gICAgICBzdW1PZkF0dHJpYnV0ZXNCeXRlU2l6ZSArPSBhdHRyaWJ1dGUuYnl0ZUxlbmd0aDtcbiAgICB9KTtcblxuICAgIGxldCBidWZmZXJTaXplID0gc3VtT2ZBdHRyaWJ1dGVzQnl0ZVNpemU7XG4gICAgaWYgKGluZGljZXMgIT0gbnVsbCkge1xuICAgICAgYnVmZmVyU2l6ZSArPSBEYXRhVXRpbC5hZGRQYWRkaW5nQnl0ZXMoaW5kaWNlcy5ieXRlTGVuZ3RoLCBieXRlQWxpZ24pO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuX19lbmdpbmUubWVtb3J5TWFuYWdlci5jcmVhdGVCdWZmZXJPbkRlbWFuZChCdWZmZXJVc2UuQ1BVR2VuZXJpYywgYnVmZmVyU2l6ZSwgYnl0ZUFsaWduKTtcblxuICAgIGxldCBpbmRpY2VzQ29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW07XG4gICAgbGV0IGluZGljZXNBY2Nlc3NvcjogQWNjZXNzb3I7XG4gICAgaWYgKGluZGljZXMgIT0gbnVsbCkge1xuICAgICAgaW5kaWNlc0NvbXBvbmVudFR5cGUgPSBDb21wb25lbnRUeXBlLmZyb21UeXBlZEFycmF5KGluZGljZXMpO1xuICAgICAgY29uc3QgaW5kaWNlc0J1ZmZlclZpZXdSZXN1bHQgPSBidWZmZXIudGFrZUJ1ZmZlclZpZXcoe1xuICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiBpbmRpY2VzLmJ5dGVMZW5ndGgsXG4gICAgICAgIGJ5dGVTdHJpZGU6IDAsXG4gICAgICB9KTtcbiAgICAgIGlmIChpbmRpY2VzQnVmZmVyVmlld1Jlc3VsdC5pc0VycigpKSB7XG4gICAgICAgIHRocm93IG5ldyBSbkV4Y2VwdGlvbihpbmRpY2VzQnVmZmVyVmlld1Jlc3VsdC5nZXRSbkVycm9yKCkpO1xuICAgICAgfVxuICAgICAgY29uc3QgaW5kaWNlc0FjY2Vzc29yUmVzdWx0ID0gaW5kaWNlc0J1ZmZlclZpZXdSZXN1bHQuZ2V0KCkudGFrZUFjY2Vzc29yKHtcbiAgICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgICBjb21wb25lbnRUeXBlOiBpbmRpY2VzQ29tcG9uZW50VHlwZSxcbiAgICAgICAgY291bnQ6IGluZGljZXMuYnl0ZUxlbmd0aCAvIGluZGljZXNDb21wb25lbnRUeXBlLmdldFNpemVJbkJ5dGVzKCksXG4gICAgICB9KTtcbiAgICAgIGlmIChpbmRpY2VzQWNjZXNzb3JSZXN1bHQuaXNFcnIoKSkge1xuICAgICAgICB0aHJvdyBuZXcgUm5FeGNlcHRpb24oaW5kaWNlc0FjY2Vzc29yUmVzdWx0LmdldFJuRXJyb3IoKSk7XG4gICAgICB9XG4gICAgICBpbmRpY2VzQWNjZXNzb3IgPSBpbmRpY2VzQWNjZXNzb3JSZXN1bHQuZ2V0KCk7XG4gICAgICAvLyBjb3B5IGluZGljZXNcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5kaWNlcyEuYnl0ZUxlbmd0aCAvIGluZGljZXNBY2Nlc3NvciEuY29tcG9uZW50U2l6ZUluQnl0ZXM7IGkrKykge1xuICAgICAgICBpbmRpY2VzQWNjZXNzb3IhLnNldFNjYWxhcihpLCBpbmRpY2VzIVtpXSwge30pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGF0dHJpYnV0ZXNCdWZmZXJWaWV3ID0gYnVmZmVyXG4gICAgICAudGFrZUJ1ZmZlclZpZXcoe1xuICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiBzdW1PZkF0dHJpYnV0ZXNCeXRlU2l6ZSxcbiAgICAgICAgYnl0ZVN0cmlkZTogMCxcbiAgICAgIH0pXG4gICAgICAudW53cmFwRm9yY2UoKTtcblxuICAgIGNvbnN0IGF0dHJpYnV0ZUFjY2Vzc29yczogQXJyYXk8QWNjZXNzb3I+ID0gW107XG4gICAgY29uc3QgYXR0cmlidXRlQ29tcG9uZW50VHlwZXM6IEFycmF5PENvbXBvbmVudFR5cGVFbnVtPiA9IFtdO1xuXG4gICAgYXR0cmlidXRlcy5mb3JFYWNoKCh0eXBlZEFycmF5LCBpKSA9PiB7XG4gICAgICBjb25zdCBjb21wb3NpdGlvblR5cGUgPSBDb21wb3NpdGlvblR5cGUudmVjdG9yRnJvbShWZXJ0ZXhBdHRyaWJ1dGUudG9WZWN0b3JDb21wb25lbnROKGF0dHJpYnV0ZVNlbWFudGljc1tpXSkpO1xuICAgICAgYXR0cmlidXRlQ29tcG9uZW50VHlwZXNbaV0gPSBDb21wb25lbnRUeXBlLmZyb21UeXBlZEFycmF5KGF0dHJpYnV0ZXNbaV0pO1xuICAgICAgY29uc3QgYWNjZXNzb3I6IEFjY2Vzc29yID0gYXR0cmlidXRlc0J1ZmZlclZpZXdcbiAgICAgICAgLnRha2VBY2Nlc3Nvcih7XG4gICAgICAgICAgY29tcG9zaXRpb25UeXBlLFxuICAgICAgICAgIGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGUuZnJvbVR5cGVkQXJyYXkoYXR0cmlidXRlc1tpXSksXG4gICAgICAgICAgY291bnQ6XG4gICAgICAgICAgICB0eXBlZEFycmF5LmJ5dGVMZW5ndGggL1xuICAgICAgICAgICAgY29tcG9zaXRpb25UeXBlLmdldE51bWJlck9mQ29tcG9uZW50cygpIC9cbiAgICAgICAgICAgIGF0dHJpYnV0ZUNvbXBvbmVudFR5cGVzW2ldLmdldFNpemVJbkJ5dGVzKCksXG4gICAgICAgIH0pXG4gICAgICAgIC51bndyYXBGb3JjZSgpO1xuICAgICAgYWNjZXNzb3IuY29weUZyb21UeXBlZEFycmF5KHR5cGVkQXJyYXkpO1xuICAgICAgYXR0cmlidXRlQWNjZXNzb3JzLnB1c2goYWNjZXNzb3IpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgYXR0cmlidXRlTWFwOiBNYXA8VmVydGV4QXR0cmlidXRlU2VtYW50aWNzSm9pbmVkU3RyaW5nLCBBY2Nlc3Nvcj4gPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRyaWJ1dGVTZW1hbnRpY3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZVNlbWFudGljID0gYXR0cmlidXRlU2VtYW50aWNzW2ldO1xuICAgICAgYXR0cmlidXRlTWFwLnNldChhdHRyaWJ1dGVTZW1hbnRpYywgYXR0cmlidXRlQWNjZXNzb3JzW2ldKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldERhdGEoYXR0cmlidXRlTWFwLCBwcmltaXRpdmVNb2RlLCBtYXRlcmlhbCwgaW5kaWNlc0FjY2Vzc29yISk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBwcmltaXRpdmUgZnJvbSBhIGRlc2NyaXB0b3IgY29udGFpbmluZyB2ZXJ0ZXggZGF0YS5cbiAgICogVGhpcyBpcyBhIGZhY3RvcnkgbWV0aG9kIHRoYXQgY3JlYXRlcyBhbmQgaW5pdGlhbGl6ZXMgYSBwcmltaXRpdmUgaW4gb25lIHN0ZXAuXG4gICAqIEBwYXJhbSBkZXNjIC0gVGhlIHByaW1pdGl2ZSBkZXNjcmlwdG9yIHdpdGggdmVydGV4IGRhdGEgYW5kIGNvbmZpZ3VyYXRpb25cbiAgICogQHJldHVybnMgQSBuZXcgcHJpbWl0aXZlIGluc3RhbmNlIHdpdGggdGhlIHNwZWNpZmllZCBkYXRhXG4gICAqL1xuICBzdGF0aWMgY3JlYXRlUHJpbWl0aXZlKGVuZ2luZTogRW5naW5lLCBkZXNjOiBQcmltaXRpdmVEZXNjcmlwdG9yKSB7XG4gICAgY29uc3QgcHJpbWl0aXZlID0gbmV3IFByaW1pdGl2ZShlbmdpbmUpO1xuICAgIHByaW1pdGl2ZS5jb3B5VmVydGV4RGF0YShkZXNjKTtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGluZGV4IGFjY2Vzc29yIGZvciB0aGlzIHByaW1pdGl2ZS5cbiAgICogQHJldHVybnMgVGhlIGluZGV4IGFjY2Vzc29yIGlmIGluZGljZXMgYXJlIHVzZWQsIG90aGVyd2lzZSB1bmRlZmluZWRcbiAgICovXG4gIGdldCBpbmRpY2VzQWNjZXNzb3IoKTogQWNjZXNzb3IgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fb0luZGljZXMudW53cmFwT3JVbmRlZmluZWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2ZXJ0ZXggY291bnQgZm9yIGluZGV4ZWQgcHJpbWl0aXZlcy5cbiAgICogRm9yIGluZGV4ZWQgcmVuZGVyaW5nLCB0aGlzIHJldHVybnMgdGhlIG51bWJlciBvZiBpbmRpY2VzLlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIGluZGljZXMgaWYgaW5kZXhlZCwgb3RoZXJ3aXNlIHRoZSB2ZXJ0ZXggY291bnRcbiAgICovXG4gIGdldFZlcnRleENvdW50QXNJbmRpY2VzQmFzZWQoKSB7XG4gICAgaWYgKHRoaXMuaW5kaWNlc0FjY2Vzc29yKSB7XG4gICAgICByZXR1cm4gdGhpcy5pbmRpY2VzQWNjZXNzb3IuZWxlbWVudENvdW50O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXRWZXJ0ZXhDb3VudEFzVmVydGljZXNCYXNlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnRleCBjb3VudCBiYXNlZCBvbiB2ZXJ0ZXggYnVmZmVyIGRhdGEuXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgdmVydGljZXMgaW4gdGhlIHZlcnRleCBidWZmZXJzXG4gICAqL1xuICBnZXRWZXJ0ZXhDb3VudEFzVmVydGljZXNCYXNlZCgpOiBDb3VudCB7XG4gICAgZm9yIChjb25zdCBhY2Nlc3NvciBvZiB0aGlzLl9fYXR0cmlidXRlcy52YWx1ZXMoKSkge1xuICAgICAgcmV0dXJuIGFjY2Vzc29yLmVsZW1lbnRDb3VudDtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgdHJpYW5nbGUgY291bnQgZm9yIGluZGV4ZWQgcHJpbWl0aXZlcy5cbiAgICogVGhlIGNvdW50IGRlcGVuZHMgb24gdGhlIHByaW1pdGl2ZSBtb2RlICh0cmlhbmdsZXMsIHRyaWFuZ2xlIHN0cmlwLCBldGMuKS5cbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiB0cmlhbmdsZXMgdGhhdCB3aWxsIGJlIHJlbmRlcmVkIHdpdGggaW5kaWNlc1xuICAgKi9cbiAgZ2V0VHJpYW5nbGVDb3VudEFzSW5kaWNlc0Jhc2VkKCk6IENvdW50IHtcbiAgICBpZiAodGhpcy5pbmRpY2VzQWNjZXNzb3IpIHtcbiAgICAgIHN3aXRjaCAodGhpcy5fX21vZGUpIHtcbiAgICAgICAgY2FzZSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlczpcbiAgICAgICAgICByZXR1cm4gdGhpcy5pbmRpY2VzQWNjZXNzb3IuZWxlbWVudENvdW50IC8gMztcbiAgICAgICAgY2FzZSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlU3RyaXA6XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaW5kaWNlc0FjY2Vzc29yLmVsZW1lbnRDb3VudCAtIDI7XG4gICAgICAgIGNhc2UgUHJpbWl0aXZlTW9kZS5UcmlhbmdsZUZhbjpcbiAgICAgICAgICByZXR1cm4gdGhpcy5pbmRpY2VzQWNjZXNzb3IuZWxlbWVudENvdW50IC0gMjtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJpYW5nbGVDb3VudEFzVmVydGljZXNCYXNlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIHRyaWFuZ2xlIGNvdW50IGZvciBub24taW5kZXhlZCBwcmltaXRpdmVzLlxuICAgKiBUaGUgY291bnQgZGVwZW5kcyBvbiB0aGUgcHJpbWl0aXZlIG1vZGUgYW5kIHZlcnRleCBjb3VudC5cbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiB0cmlhbmdsZXMgdGhhdCB3aWxsIGJlIHJlbmRlcmVkIGZyb20gdmVydGljZXNcbiAgICovXG4gIGdldFRyaWFuZ2xlQ291bnRBc1ZlcnRpY2VzQmFzZWQoKTogQ291bnQge1xuICAgIGZvciAoY29uc3QgYWNjZXNzb3Igb2YgdGhpcy5fX2F0dHJpYnV0ZXMudmFsdWVzKCkpIHtcbiAgICAgIHN3aXRjaCAodGhpcy5fX21vZGUpIHtcbiAgICAgICAgY2FzZSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlczpcbiAgICAgICAgICByZXR1cm4gYWNjZXNzb3IuZWxlbWVudENvdW50IC8gMztcbiAgICAgICAgY2FzZSBQcmltaXRpdmVNb2RlLlRyaWFuZ2xlU3RyaXA6XG4gICAgICAgICAgcmV0dXJuIGFjY2Vzc29yLmVsZW1lbnRDb3VudCAtIDI7XG4gICAgICAgIGNhc2UgUHJpbWl0aXZlTW9kZS5UcmlhbmdsZUZhbjpcbiAgICAgICAgICByZXR1cm4gYWNjZXNzb3IuZWxlbWVudENvdW50IC0gMjtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgcHJpbWl0aXZlIHVzZXMgaW5kZXgtYmFzZWQgcmVuZGVyaW5nLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBwcmltaXRpdmUgaGFzIGFuIGluZGV4IGJ1ZmZlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBoYXNJbmRpY2VzKCkge1xuICAgIHJldHVybiB0aGlzLl9fb0luZGljZXMuaGFzKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbGwgdmVydGV4IGF0dHJpYnV0ZSBhY2Nlc3NvcnMgZm9yIHRoaXMgcHJpbWl0aXZlLlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBhbGwgYXR0cmlidXRlIGFjY2Vzc29yc1xuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZUFjY2Vzc29ycygpOiBBcnJheTxBY2Nlc3Nvcj4ge1xuICAgIGNvbnN0IGFjY2Vzc29yczogQXJyYXk8QWNjZXNzb3I+ID0gW107XG4gICAgdGhpcy5fX2F0dHJpYnV0ZXMuZm9yRWFjaChhY2Nlc3NvciA9PiB7XG4gICAgICBhY2Nlc3NvcnMucHVzaChhY2Nlc3Nvcik7XG4gICAgfSk7XG4gICAgcmV0dXJuIGFjY2Vzc29ycztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgc3BlY2lmaWMgdmVydGV4IGF0dHJpYnV0ZSBieSBpdHMgc2VtYW50aWMgbWVhbmluZy5cbiAgICogQHBhcmFtIHNlbWFudGljIC0gVGhlIHNlbWFudGljIGlkZW50aWZpZXIgZm9yIHRoZSBhdHRyaWJ1dGVcbiAgICogQHJldHVybnMgVGhlIGFjY2Vzc29yIGZvciB0aGUgYXR0cmlidXRlLCBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqL1xuICBnZXRBdHRyaWJ1dGUoc2VtYW50aWM6IFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZykge1xuICAgIHJldHVybiB0aGlzLl9fYXR0cmlidXRlcy5nZXQoc2VtYW50aWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYWxsIHZlcnRleCBhdHRyaWJ1dGUgc2VtYW50aWMgaWRlbnRpZmllcnMuXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIGFsbCBhdHRyaWJ1dGUgc2VtYW50aWMgc3RyaW5nc1xuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZVNlbWFudGljcygpOiBBcnJheTxWZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY3NKb2luZWRTdHJpbmc+IHtcbiAgICBjb25zdCBzZW1hbnRpY3M6IEFycmF5PFZlcnRleEF0dHJpYnV0ZVNlbWFudGljc0pvaW5lZFN0cmluZz4gPSBbXTtcbiAgICB0aGlzLl9fYXR0cmlidXRlcy5mb3JFYWNoKChfYWNjZXNzb3IsIHNlbWFudGljKSA9PiB7XG4gICAgICBzZW1hbnRpY3MucHVzaChzZW1hbnRpYyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNlbWFudGljcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFuIGl0ZXJhdG9yIGZvciBhbGwgYXR0cmlidXRlIGVudHJpZXMgKHNlbWFudGljLCBhY2Nlc3NvciBwYWlycykuXG4gICAqIEByZXR1cm5zIEFuIGl0ZXJhdG9yIG92ZXIgYXR0cmlidXRlIG1hcCBlbnRyaWVzXG4gICAqL1xuICBnZXQgYXR0cmlidXRlRW50cmllcygpIHtcbiAgICByZXR1cm4gdGhpcy5fX2F0dHJpYnV0ZXMuZW50cmllcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvc2l0aW9uIHR5cGVzIG9mIGFsbCB2ZXJ0ZXggYXR0cmlidXRlcy5cbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgY29tcG9zaXRpb24gdHlwZXMgKFZlYzIsIFZlYzMsIFZlYzQsIFNjYWxhciwgZXRjLilcbiAgICovXG4gIGdldCBhdHRyaWJ1dGVDb21wb3NpdGlvblR5cGVzKCk6IEFycmF5PENvbXBvc2l0aW9uVHlwZUVudW0+IHtcbiAgICBjb25zdCB0eXBlczogQXJyYXk8Q29tcG9zaXRpb25UeXBlRW51bT4gPSBbXTtcbiAgICB0aGlzLl9fYXR0cmlidXRlcy5mb3JFYWNoKGFjY2Vzc29yID0+IHtcbiAgICAgIHR5cGVzLnB1c2goYWNjZXNzb3IuY29tcG9zaXRpb25UeXBlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0eXBlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgdHlwZXMgb2YgYWxsIHZlcnRleCBhdHRyaWJ1dGVzLlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiBjb21wb25lbnQgdHlwZXMgKEZsb2F0LCBVbnNpZ25lZEJ5dGUsIGV0Yy4pXG4gICAqL1xuICBnZXQgYXR0cmlidXRlQ29tcG9uZW50VHlwZXMoKTogQXJyYXk8Q29tcG9uZW50VHlwZUVudW0+IHtcbiAgICBjb25zdCB0eXBlczogQXJyYXk8Q29tcG9uZW50VHlwZUVudW0+ID0gW107XG4gICAgdGhpcy5fX2F0dHJpYnV0ZXMuZm9yRWFjaChhY2Nlc3NvciA9PiB7XG4gICAgICB0eXBlcy5wdXNoKGFjY2Vzc29yLmNvbXBvbmVudFR5cGUpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHR5cGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHByaW1pdGl2ZSByZW5kZXJpbmcgbW9kZS5cbiAgICogQHJldHVybnMgVGhlIHByaW1pdGl2ZSBtb2RlIGVudW0gKFRyaWFuZ2xlcywgVHJpYW5nbGVTdHJpcCwgZXRjLilcbiAgICovXG4gIGdldCBwcmltaXRpdmVNb2RlKCk6IFByaW1pdGl2ZU1vZGVFbnVtIHtcbiAgICByZXR1cm4gdGhpcy5fX21vZGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgcHJpbWl0aXZlLlxuICAgKiBAcmV0dXJucyBUaGUgcHJpbWl0aXZlJ3MgVUlEXG4gICAqL1xuICBnZXQgcHJpbWl0aXZlVWlkKCk6IFByaW1pdGl2ZVVJRCB7XG4gICAgcmV0dXJuIHRoaXMuX19wcmltaXRpdmVVaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmVyc2lvbiBudW1iZXIgb2YgdGhlIHBvc2l0aW9uIGFjY2Vzc29yLlxuICAgKiBVc2VkIHRvIHRyYWNrIHdoZW4gcG9zaXRpb24gZGF0YSBoYXMgYmVlbiB1cGRhdGVkLlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBwb3NpdGlvbiBhY2Nlc3NvciB2ZXJzaW9uXG4gICAqL1xuICBnZXQgcG9zaXRpb25BY2Nlc3NvclZlcnNpb24oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX3Bvc2l0aW9uQWNjZXNzb3JWZXJzaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGF4aXMtYWxpZ25lZCBib3VuZGluZyBib3ggZm9yIHRoaXMgcHJpbWl0aXZlLlxuICAgKiBUaGUgQUFCQiBpcyBjYWxjdWxhdGVkIGZyb20gcG9zaXRpb24gZGF0YSBhbmQgY2FjaGVkIHVudGlsIHBvc2l0aW9ucyBjaGFuZ2UuXG4gICAqIEByZXR1cm5zIFRoZSBib3VuZGluZyBib3ggY29udGFpbmluZyBhbGwgdmVydGljZXNcbiAgICovXG4gIGdldCBBQUJCKCkge1xuICAgIGlmICh0aGlzLl9fYWFiYi5pc1ZhbmlsbGEoKSB8fCB0aGlzLnBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uICE9PSB0aGlzLl9fbGF0ZXN0UG9zaXRpb25BY2Nlc3NvclZlcnNpb24pIHtcbiAgICAgIGNvbnN0IHBvc2l0aW9uQWNjZXNzb3IgPSB0aGlzLl9fYXR0cmlidXRlcy5nZXQoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWikhO1xuXG4gICAgICBjb25zdCBtaW4gPSBwb3NpdGlvbkFjY2Vzc29yLm1pbiBhcyBudW1iZXJbXTtcbiAgICAgIHRoaXMuX19hYWJiLm1pblBvaW50ID0gUHJpbWl0aXZlLl9fdG1wVmVjM18wLnNldENvbXBvbmVudHMobWluWzBdLCBtaW5bMV0sIG1pblsyXSk7XG4gICAgICBjb25zdCBtYXggPSBwb3NpdGlvbkFjY2Vzc29yLm1heCBhcyBudW1iZXJbXTtcbiAgICAgIHRoaXMuX19hYWJiLm1heFBvaW50ID0gUHJpbWl0aXZlLl9fdG1wVmVjM18wLnNldENvbXBvbmVudHMobWF4WzBdLCBtYXhbMV0sIG1heFsyXSk7XG4gICAgICB0aGlzLl9fbGF0ZXN0UG9zaXRpb25BY2Nlc3NvclZlcnNpb24gPSBwb3NpdGlvbkFjY2Vzc29yLnZlcnNpb247XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX19hYWJiO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgb3IgdXBkYXRlcyBhIHZlcnRleCBhdHRyaWJ1dGUgZm9yIHRoaXMgcHJpbWl0aXZlLlxuICAgKiBAcGFyYW0gYWNjZXNzb3IgLSBUaGUgYWNjZXNzb3IgY29udGFpbmluZyB0aGUgYXR0cmlidXRlIGRhdGFcbiAgICogQHBhcmFtIHZlcnRleFNlbWFudGljIC0gVGhlIHNlbWFudGljIG1lYW5pbmcgb2YgdGhlIGF0dHJpYnV0ZVxuICAgKi9cbiAgcHJpdmF0ZSBfX2ludmFsaWRhdGVNdWx0aURyYXdHcm91cCgpOiB2b2lkIHtcbiAgICBjb25zdCBtZXNoID0gdGhpcy5fX21lc2g7XG4gICAgaWYgKG1lc2ggIT0gbnVsbCkge1xuICAgICAgbWVzaC5faW52YWxpZGF0ZU11bHRpRHJhd1N0cnVjdHVyZSgpO1xuICAgIH1cbiAgfVxuXG4gIHNldFZlcnRleEF0dHJpYnV0ZShhY2Nlc3NvcjogQWNjZXNzb3IsIHZlcnRleFNlbWFudGljOiBWZXJ0ZXhBdHRyaWJ1dGVTZW1hbnRpY3NKb2luZWRTdHJpbmcpIHtcbiAgICB0aGlzLl9fYXR0cmlidXRlcy5zZXQodmVydGV4U2VtYW50aWMsIGFjY2Vzc29yKTtcbiAgICB0aGlzLmNhbGNGaW5nZXJQcmludCgpO1xuICAgIHRoaXMuX19pbnZhbGlkYXRlTXVsdGlEcmF3R3JvdXAoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIHRoZSBpbmRleCBidWZmZXIgZnJvbSB0aGlzIHByaW1pdGl2ZSwgY29udmVydGluZyBpdCB0byBub24taW5kZXhlZCByZW5kZXJpbmcuXG4gICAqL1xuICByZW1vdmVJbmRpY2VzKCkge1xuICAgIHRoaXMuX19vSW5kaWNlcyA9IG5ldyBOb25lKCk7XG4gICAgdGhpcy5jYWxjRmluZ2VyUHJpbnQoKTtcbiAgICB0aGlzLl9faW52YWxpZGF0ZU11bHRpRHJhd0dyb3VwKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5kZXggYnVmZmVyIGZvciB0aGlzIHByaW1pdGl2ZSwgZW5hYmxpbmcgaW5kZXhlZCByZW5kZXJpbmcuXG4gICAqIEBwYXJhbSBhY2Nlc3NvciAtIFRoZSBhY2Nlc3NvciBjb250YWluaW5nIGluZGV4IGRhdGFcbiAgICovXG4gIHNldEluZGljZXMoYWNjZXNzb3I6IEFjY2Vzc29yKSB7XG4gICAgdGhpcy5fX29JbmRpY2VzID0gbmV3IFNvbWUoYWNjZXNzb3IpO1xuICAgIHRoaXMuY2FsY0ZpbmdlclByaW50KCk7XG4gICAgdGhpcy5fX2ludmFsaWRhdGVNdWx0aURyYXdHcm91cCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYmxlbmQgc2hhcGUgKG1vcnBoKSB0YXJnZXRzIGZvciB0aGlzIHByaW1pdGl2ZS5cbiAgICogQmxlbmQgc2hhcGVzIGFsbG93IHZlcnRleCBhbmltYXRpb24gYnkgaW50ZXJwb2xhdGluZyBiZXR3ZWVuIHRhcmdldCBwb3NpdGlvbnMuXG4gICAqIEBwYXJhbSB0YXJnZXRzIC0gQXJyYXkgb2YgYXR0cmlidXRlIG1hcHMgcmVwcmVzZW50aW5nIG1vcnBoIHRhcmdldHNcbiAgICovXG4gIHNldEJsZW5kU2hhcGVUYXJnZXRzKHRhcmdldHM6IEFycmF5PEF0dHJpYnV0ZXM+KSB7XG4gICAgUHJpbWl0aXZlLl9faWR4UHJpbWl0aXZlVWlkSGFzTW9ycGguc2V0KFByaW1pdGl2ZS5fX3ByaW1pdGl2ZUNvdW50SGFzTW9ycGgsIHRoaXMpO1xuICAgIFByaW1pdGl2ZS5fX3ByaW1pdGl2ZVVpZElkeEhhc01vcnBoLnNldCh0aGlzLl9fcHJpbWl0aXZlVWlkLCBQcmltaXRpdmUuX19wcmltaXRpdmVDb3VudEhhc01vcnBoKyspO1xuXG4gICAgdGhpcy5fX3RhcmdldHMgPSB0YXJnZXRzO1xuICAgIHRoaXMuY2FsY0ZpbmdlclByaW50KCk7XG4gICAgdGhpcy5fX2ludmFsaWRhdGVNdWx0aURyYXdHcm91cCgpO1xuICB9XG5cbiAgc3RhdGljIGdldE1vcnBoVW5pZm9ybURhdGFUYXJnZXROdW1iZXJzKCk6IENvdW50W10ge1xuICAgIGNvbnN0IHRhcmdldE51bWJlcnM6IENvdW50W10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVDb3VudEhhc01vcnBoKCk7IGkrKykge1xuICAgICAgY29uc3QgcHJpbWl0aXZlID0gUHJpbWl0aXZlLmdldFByaW1pdGl2ZUhhc01vcnBoKGkpITtcbiAgICAgIHRhcmdldE51bWJlcnMucHVzaChwcmltaXRpdmUudGFyZ2V0cy5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmICh0YXJnZXROdW1iZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFswXTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFyZ2V0TnVtYmVycztcbiAgfVxuXG4gIHN0YXRpYyBnZXRNb3JwaFVuaWZvcm1EYXRhT2Zmc2V0cygpOiBPZmZzZXRbXSB7XG4gICAgY29uc3Qgb2Zmc2V0czogT2Zmc2V0W10gPSBbMF07XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBQcmltaXRpdmUuZ2V0UHJpbWl0aXZlQ291bnRIYXNNb3JwaCgpOyBpKyspIHtcbiAgICAgIGNvbnN0IHByaW1pdGl2ZSA9IFByaW1pdGl2ZS5nZXRQcmltaXRpdmVIYXNNb3JwaChpKSE7XG4gICAgICBvZmZzZXRzLnB1c2gob2Zmc2V0c1tvZmZzZXRzLmxlbmd0aCAtIDFdICsgcHJpbWl0aXZlLnRhcmdldHMubGVuZ3RoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2Zmc2V0cztcbiAgfVxuXG4gIHN0YXRpYyBnZXRQcmltaXRpdmVDb3VudEhhc01vcnBoKCkge1xuICAgIHJldHVybiB0aGlzLl9fcHJpbWl0aXZlQ291bnRIYXNNb3JwaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgY29weSBvZiB0aGUgYmxlbmQgc2hhcGUgdGFyZ2V0cyBmb3IgdGhpcyBwcmltaXRpdmUuXG4gICAqIEByZXR1cm5zIEEgY29weSBvZiB0aGUgbW9ycGggdGFyZ2V0IGFycmF5XG4gICAqL1xuICBnZXRCbGVuZFNoYXBlVGFyZ2V0cygpIHtcbiAgICByZXR1cm4gdGhpcy5fX3RhcmdldHMuY29uY2F0KCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYmxlbmQgc2hhcGUgdGFyZ2V0cyBhcnJheS5cbiAgICogQHJldHVybnMgVGhlIGFycmF5IG9mIG1vcnBoIHRhcmdldCBhdHRyaWJ1dGVzXG4gICAqL1xuICBnZXQgdGFyZ2V0cygpOiBBcnJheTxBdHRyaWJ1dGVzPiB7XG4gICAgcmV0dXJuIHRoaXMuX190YXJnZXRzO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIHByaW1pdGl2ZSB1c2VzIGJsZW5kaW5nICh0cmFuc3BhcmVuY3kpIGZvciByZW5kZXJpbmcuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIG1hdGVyaWFsIGhhcyBibGVuZGluZyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzQmxlbmQoKSB7XG4gICAgaWYgKHRoaXMubWF0ZXJpYWwgPT0gbnVsbCB8fCAhdGhpcy5tYXRlcmlhbC5pc0JsZW5kKCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgcHJpbWl0aXZlIGlzIG9wYXF1ZSAobm90IHRyYW5zcGFyZW50KS5cbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgcHJpbWl0aXZlIGlzIG9wYXF1ZSwgZmFsc2UgaWYgaXQgdXNlcyBibGVuZGluZ1xuICAgKi9cbiAgaXNPcGFxdWUoKSB7XG4gICAgcmV0dXJuICF0aGlzLmlzQmxlbmQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIEdQVSB2ZXJ0ZXggYW5kIGluZGV4IGJ1ZmZlcnMgZm9yIHRoaXMgcHJpbWl0aXZlLlxuICAgKiBUaGlzIHByZXBhcmVzIHRoZSBwcmltaXRpdmUgZm9yIHJlbmRlcmluZyBieSB1cGxvYWRpbmcgZGF0YSB0byB0aGUgR1BVLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGJ1ZmZlcnMgd2VyZSBjcmVhdGVkLCBmYWxzZSBpZiB0aGV5IGFscmVhZHkgZXhpc3RcbiAgICovXG4gIGNyZWF0ZTNEQVBJVmVydGV4RGF0YSgpIHtcbiAgICBpZiAodGhpcy5fX211bHRpRHJhd0dyb3VwICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX192ZXJ0ZXhIYW5kbGVzICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIHRoaXMuX192ZXJ0ZXhIYW5kbGVzID0gY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkuY3JlYXRlVmVydGV4QnVmZmVyQW5kSW5kZXhCdWZmZXIodGhpcyk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBHUFUgdmVydGV4IGFuZCBpbmRleCBidWZmZXJzIHdpdGggY3VycmVudCBkYXRhLlxuICAgKiBVc2VkIHdoZW4gdmVydGV4IGRhdGEgaGFzIGJlZW4gbW9kaWZpZWQgYW5kIG5lZWRzIHRvIGJlIHJlLXVwbG9hZGVkLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIGJ1ZmZlcnMgd2VyZSB1cGRhdGVkLCBmYWxzZSBpZiBubyBidWZmZXJzIGV4aXN0XG4gICAqL1xuICB1cGRhdGUzREFQSVZlcnRleERhdGEoKSB7XG4gICAgaWYgKHRoaXMuX19tdWx0aURyYXdHcm91cCAhPSBudWxsKSB7XG4gICAgICAvLyBUaGUgbXVsdGktZHJhdyBncm91cCBvd25zIHRoZSBtZXJnZWQgYnVmZmVycyBhbmQgaXMgcmVidWlsdCBieSBNdWx0aURyYXdSZXBvc2l0b3J5LlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHZlcnRleEhhbmRsZXMgPSB0aGlzLl9fdmVydGV4SGFuZGxlcyBhcyBWZXJ0ZXhIYW5kbGVzO1xuICAgIGlmIChJcy5ub3QuZXhpc3QodGhpcy5fX3ZlcnRleEhhbmRsZXMpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LnVwZGF0ZVZlcnRleEJ1ZmZlckFuZEluZGV4QnVmZmVyKHRoaXMsIHZlcnRleEhhbmRsZXMpO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyB0aGUgR1BVIHZlcnRleCBhbmQgaW5kZXggYnVmZmVycyBmb3IgdGhpcyBwcmltaXRpdmUuXG4gICAqIEZyZWVzIEdQVSBtZW1vcnkgd2hlbiB0aGUgcHJpbWl0aXZlIGlzIG5vIGxvbmdlciBuZWVkZWQuXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYnVmZmVycyB3ZXJlIGRlbGV0ZWQsIGZhbHNlIGlmIG5vIGJ1ZmZlcnMgZXhpc3RcbiAgICovXG4gIGRlbGV0ZTNEQVBJVmVydGV4RGF0YSgpIHtcbiAgICBpZiAodGhpcy5fX211bHRpRHJhd0dyb3VwICE9IG51bGwpIHtcbiAgICAgIC8vIFRoZSBncm91cCBvd25zIHRoZSBzaGFyZWQgR1BVIHJlc291cmNlcy5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX192ZXJ0ZXhIYW5kbGVzID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgY2dBcGlSZXNvdXJjZVJlcG9zaXRvcnkgPSB0aGlzLl9fZW5naW5lLmNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5O1xuICAgIGNnQXBpUmVzb3VyY2VSZXBvc2l0b3J5LmRlbGV0ZVZlcnRleERhdGFSZXNvdXJjZXModGhpcy5fX3ZlcnRleEhhbmRsZXMpO1xuICAgIHRoaXMuX192ZXJ0ZXhIYW5kbGVzID0gdW5kZWZpbmVkO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgR1BVIHJlc291cmNlIGhhbmRsZXMgZm9yIHRoaXMgcHJpbWl0aXZlLlxuICAgKiBAcmV0dXJucyBUaGUgdmVydGV4IGhhbmRsZXMgZm9yIEdQVSByZXNvdXJjZXMsIG9yIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZFxuICAgKi9cbiAgZ2V0IHZlcnRleEhhbmRsZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX192ZXJ0ZXhIYW5kbGVzO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoaXMgaW5kZXhlZCBwcmltaXRpdmUgdG8gbm9uLWluZGV4ZWQgZ2VvbWV0cnkuXG4gICAqIEV4cGFuZHMgdmVydGV4IGRhdGEgYnkgZHVwbGljYXRpbmcgdmVydGljZXMgYWNjb3JkaW5nIHRvIGluZGljZXMuXG4gICAqIFRoaXMgY2FuIGluY3JlYXNlIG1lbW9yeSB1c2FnZSBidXQgc2ltcGxpZmllcyBzb21lIHJlbmRlcmluZyBvcGVyYXRpb25zLlxuICAgKi9cbiAgY29udmVydFRvVW5pbmRleGVkR2VvbWV0cnkoKSB7XG4gICAgY29uc3QgaW5kZXhBY2Nlc3NvciA9IHRoaXMuaW5kaWNlc0FjY2Vzc29yO1xuICAgIGlmIChpbmRleEFjY2Vzc29yID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBpbmRpY2VzID0gaW5kZXhBY2Nlc3Nvci5nZXRUeXBlZEFycmF5KCk7XG5cbiAgICBsZXQgYnVmZmVyU2l6ZSA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmF0dHJpYnV0ZUFjY2Vzc29ycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYWNjZXNzb3IgPSB0aGlzLmF0dHJpYnV0ZUFjY2Vzc29yc1tpXTtcbiAgICAgIGNvbnN0IGNvbXBvc2l0aW9uVHlwZSA9IGFjY2Vzc29yLmNvbXBvc2l0aW9uVHlwZTtcbiAgICAgIGxldCBjb21wb3NpdGlvbk4gPSAwO1xuICAgICAgaWYgKGNvbXBvc2l0aW9uVHlwZS5pbmRleCA9PT0gQ29tcG9zaXRpb25UeXBlLlZlYzQuaW5kZXgpIHtcbiAgICAgICAgY29tcG9zaXRpb25OID0gNDtcbiAgICAgIH0gZWxzZSBpZiAoY29tcG9zaXRpb25UeXBlLmluZGV4ID09PSBDb21wb3NpdGlvblR5cGUuVmVjMy5pbmRleCkge1xuICAgICAgICBjb21wb3NpdGlvbk4gPSAzO1xuICAgICAgfSBlbHNlIGlmIChjb21wb3NpdGlvblR5cGUuaW5kZXggPT09IENvbXBvc2l0aW9uVHlwZS5WZWMyLmluZGV4KSB7XG4gICAgICAgIGNvbXBvc2l0aW9uTiA9IDI7XG4gICAgICB9IGVsc2UgaWYgKGNvbXBvc2l0aW9uVHlwZS5pbmRleCA9PT0gQ29tcG9zaXRpb25UeXBlLlNjYWxhci5pbmRleCkge1xuICAgICAgICBjb21wb3NpdGlvbk4gPSAxO1xuICAgICAgfVxuICAgICAgYnVmZmVyU2l6ZSArPSBpbmRpY2VzLmxlbmd0aCAqIGNvbXBvc2l0aW9uTiAqIDQgLyogYnl0ZXMgKi87XG4gICAgfVxuXG4gICAgY29uc3QgYnVmZmVyID0gdGhpcy5fX2VuZ2luZS5tZW1vcnlNYW5hZ2VyLmNyZWF0ZUJ1ZmZlck9uRGVtYW5kKEJ1ZmZlclVzZS5DUFVHZW5lcmljLCBidWZmZXJTaXplLCA0IC8qIGJ5dGVzICovKTtcbiAgICBjb25zdCBidWZmZXJWaWV3ID0gYnVmZmVyXG4gICAgICAudGFrZUJ1ZmZlclZpZXcoe1xuICAgICAgICBieXRlTGVuZ3RoVG9OZWVkOiBidWZmZXJTaXplLFxuICAgICAgICBieXRlU3RyaWRlOiAwLFxuICAgICAgfSlcbiAgICAgIC51bndyYXBGb3JjZSgpO1xuXG4gICAgZm9yIChjb25zdCBbc2VtYW50aWMsIGFjY2Vzc29yT2xkXSBvZiB0aGlzLl9fYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgY29tcG9zaXRpb25UeXBlID0gYWNjZXNzb3JPbGQuY29tcG9zaXRpb25UeXBlO1xuXG4gICAgICBjb25zdCBhY2Nlc3Nvck5ldzogQWNjZXNzb3IgPSBidWZmZXJWaWV3XG4gICAgICAgIC50YWtlQWNjZXNzb3Ioe1xuICAgICAgICAgIGNvbXBvc2l0aW9uVHlwZSxcbiAgICAgICAgICBjb21wb25lbnRUeXBlOiBhY2Nlc3Nvck9sZC5jb21wb25lbnRUeXBlLFxuICAgICAgICAgIGNvdW50OiBpbmRpY2VzLmxlbmd0aCxcbiAgICAgICAgfSlcbiAgICAgICAgLnVud3JhcEZvcmNlKCk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5kaWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpZHggPSBpbmRpY2VzW2ldO1xuICAgICAgICBpZiAoY29tcG9zaXRpb25UeXBlLmluZGV4ID09PSBDb21wb3NpdGlvblR5cGUuVmVjNC5pbmRleCkge1xuICAgICAgICAgIGNvbnN0IHZlYzQgPSBhY2Nlc3Nvck9sZC5nZXRWZWM0KGlkeCwge30pO1xuICAgICAgICAgIGFjY2Vzc29yTmV3LnNldFZlYzQoaSwgdmVjNC54LCB2ZWM0LnksIHZlYzQueiwgdmVjNC53LCB7fSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29tcG9zaXRpb25UeXBlLmluZGV4ID09PSBDb21wb3NpdGlvblR5cGUuVmVjMy5pbmRleCkge1xuICAgICAgICAgIGNvbnN0IHZlYzMgPSBhY2Nlc3Nvck9sZC5nZXRWZWMzKGlkeCwge30pO1xuICAgICAgICAgIGFjY2Vzc29yTmV3LnNldFZlYzMoaSwgdmVjMy54LCB2ZWMzLnksIHZlYzMueiwge30pO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbXBvc2l0aW9uVHlwZS5pbmRleCA9PT0gQ29tcG9zaXRpb25UeXBlLlZlYzIuaW5kZXgpIHtcbiAgICAgICAgICBjb25zdCB2ZWMyID0gYWNjZXNzb3JPbGQuZ2V0VmVjMihpZHgsIHt9KTtcbiAgICAgICAgICBhY2Nlc3Nvck5ldy5zZXRWZWMyKGksIHZlYzIueCwgdmVjMi55LCB7fSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29tcG9zaXRpb25UeXBlLmluZGV4ID09PSBDb21wb3NpdGlvblR5cGUuU2NhbGFyLmluZGV4KSB7XG4gICAgICAgICAgY29uc3Qgc2NhbGFyID0gYWNjZXNzb3JPbGQuZ2V0U2NhbGFyKGlkeCwge30pO1xuICAgICAgICAgIGFjY2Vzc29yTmV3LnNldFNjYWxhcihpLCBzY2FsYXIsIHt9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLnNldFZlcnRleEF0dHJpYnV0ZShhY2Nlc3Nvck5ldywgc2VtYW50aWMpO1xuICAgIH1cblxuICAgIHRoaXMucmVtb3ZlSW5kaWNlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIHJheSBjYXN0aW5nIGFnYWluc3QgdGhpcyBwcmltaXRpdmUncyBnZW9tZXRyeS5cbiAgICogVGVzdHMgaW50ZXJzZWN0aW9uIGJldHdlZW4gYSByYXkgYW5kIHRoZSB0cmlhbmdsZXMgb2YgdGhpcyBwcmltaXRpdmUuXG4gICAqIEBwYXJhbSBvcmlnVmVjMyAtIFRoZSBvcmlnaW4gcG9pbnQgb2YgdGhlIHJheVxuICAgKiBAcGFyYW0gZGlyVmVjMyAtIFRoZSBkaXJlY3Rpb24gdmVjdG9yIG9mIHRoZSByYXkgKHNob3VsZCBiZSBub3JtYWxpemVkKVxuICAgKiBAcGFyYW0gaXNGcm9udEZhY2VQaWNrYWJsZSAtIFdoZXRoZXIgZnJvbnQtZmFjaW5nIHRyaWFuZ2xlcyBjYW4gYmUgaGl0XG4gICAqIEBwYXJhbSBpc0JhY2tGYWNlUGlja2FibGUgLSBXaGV0aGVyIGJhY2stZmFjaW5nIHRyaWFuZ2xlcyBjYW4gYmUgaGl0XG4gICAqIEBwYXJhbSBkb3RUaHJlc2hvbGQgLSBUaHJlc2hvbGQgZm9yIGRldGVybWluaW5nIGZyb250L2JhY2sgZmFjZSBvcmllbnRhdGlvblxuICAgKiBAcGFyYW0gaGFzRmFjZU5vcm1hbCAtIFdoZXRoZXIgdG8gdXNlIGZhY2Ugbm9ybWFscyBmb3IgY3VsbGluZ1xuICAgKiBAcmV0dXJucyBSYXkgY2FzdGluZyByZXN1bHQgd2l0aCBpbnRlcnNlY3Rpb24gZGF0YSBvciBmYWlsdXJlIGluZGljYXRpb25cbiAgICovXG4gIGNhc3RSYXkoXG4gICAgb3JpZ1ZlYzM6IElWZWN0b3IzLFxuICAgIGRpclZlYzM6IElWZWN0b3IzLFxuICAgIGlzRnJvbnRGYWNlUGlja2FibGU6IGJvb2xlYW4sXG4gICAgaXNCYWNrRmFjZVBpY2thYmxlOiBib29sZWFuLFxuICAgIGRvdFRocmVzaG9sZDogbnVtYmVyLFxuICAgIGhhc0ZhY2VOb3JtYWw6IGJvb2xlYW5cbiAgKTogUmF5Y2FzdFJlc3VsdEV4MSB7XG4gICAgbGV0IGN1cnJlbnRTaG9ydGVzdFQgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgIGxldCBpbmNyZW1lbnROdW0gPSAzOyAvLyBnbC5UUklBTkdMRVNcbiAgICBpZiAodGhpcy5fX21vZGUgPT09IFByaW1pdGl2ZU1vZGUuVHJpYW5nbGVTdHJpcCkge1xuICAgICAgLy8gZ2wuVFJJQU5HTEVfU1RSSVBcbiAgICAgIGluY3JlbWVudE51bSA9IDE7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9fbW9kZSA9PT0gUHJpbWl0aXZlTW9kZS5Qb2ludHMpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3VsdDogZmFsc2UsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGxldCBfaGl0UG9zMEluZGV4QmFzZSA9IDA7XG4gICAgbGV0IF9oaXRQb3MxSW5kZXhCYXNlID0gMDtcbiAgICBsZXQgX2hpdFBvczJJbmRleEJhc2UgPSAwO1xuICAgIGxldCB1ID0gMDtcbiAgICBsZXQgdiA9IDA7XG4gICAgaWYgKHRoaXMuaGFzSW5kaWNlcygpKSB7XG4gICAgICBjb25zdCBpbmRpY2VzID0gdGhpcy5fX29JbmRpY2VzLnVud3JhcEZvcmNlKCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluZGljZXMuZWxlbWVudENvdW50IC0gMjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGogPSBpICogaW5jcmVtZW50TnVtO1xuICAgICAgICBpZiAoaiArIDIgPiBpbmRpY2VzLmVsZW1lbnRDb3VudCAtIDEpIHtcbiAgICAgICAgICAvLyBnbC5UUklBTkdMRVNcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwb3MwSW5kZXhCYXNlID0gaW5kaWNlcy5nZXRTY2FsYXIoaiwge30pO1xuICAgICAgICBjb25zdCBwb3MxSW5kZXhCYXNlID0gaW5kaWNlcy5nZXRTY2FsYXIoaiArIDEsIHt9KTtcbiAgICAgICAgY29uc3QgcG9zMkluZGV4QmFzZSA9IGluZGljZXMuZ2V0U2NhbGFyKGogKyAyLCB7fSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX19jYXN0UmF5SW5uZXJUb21hc01vbGxlcihcbiAgICAgICAgICBvcmlnVmVjMyxcbiAgICAgICAgICBkaXJWZWMzLFxuICAgICAgICAgIGksXG4gICAgICAgICAgcG9zMEluZGV4QmFzZSxcbiAgICAgICAgICBwb3MxSW5kZXhCYXNlLFxuICAgICAgICAgIHBvczJJbmRleEJhc2UsXG4gICAgICAgICAgaXNGcm9udEZhY2VQaWNrYWJsZSxcbiAgICAgICAgICBpc0JhY2tGYWNlUGlja2FibGUsXG4gICAgICAgICAgZG90VGhyZXNob2xkLFxuICAgICAgICAgIGhhc0ZhY2VOb3JtYWxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKElzLmZhbHNlKHJlc3VsdCkgfHwgSXMubm90LmV4aXN0KHJlc3VsdC5kYXRhKSkge1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChyZXN1bHQuZGF0YS50IDwgY3VycmVudFNob3J0ZXN0VCkge1xuICAgICAgICAgICAgY3VycmVudFNob3J0ZXN0VCA9IHJlc3VsdC5kYXRhLnQ7XG4gICAgICAgICAgICB1ID0gcmVzdWx0LmRhdGEudTtcbiAgICAgICAgICAgIHYgPSByZXN1bHQuZGF0YS52O1xuICAgICAgICAgICAgX2hpdFBvczBJbmRleEJhc2UgPSBwb3MwSW5kZXhCYXNlO1xuICAgICAgICAgICAgX2hpdFBvczFJbmRleEJhc2UgPSBwb3MxSW5kZXhCYXNlO1xuICAgICAgICAgICAgX2hpdFBvczJJbmRleEJhc2UgPSBwb3MySW5kZXhCYXNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgZWxlbWVudENvdW50ID0gMDtcbiAgICAgIGZvciAoY29uc3QgYWNjZXNzb3Igb2YgdGhpcy5fX2F0dHJpYnV0ZXMudmFsdWVzKCkpIHtcbiAgICAgICAgZWxlbWVudENvdW50ID0gYWNjZXNzb3IuZWxlbWVudENvdW50O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgKyAyIDwgZWxlbWVudENvdW50OyBpICs9IGluY3JlbWVudE51bSkge1xuICAgICAgICBjb25zdCBwb3MwSW5kZXhCYXNlID0gaTtcbiAgICAgICAgY29uc3QgcG9zMUluZGV4QmFzZSA9IGkgKyAxO1xuICAgICAgICBjb25zdCBwb3MySW5kZXhCYXNlID0gaSArIDI7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMuX19jYXN0UmF5SW5uZXJUb21hc01vbGxlcihcbiAgICAgICAgICBvcmlnVmVjMyxcbiAgICAgICAgICBkaXJWZWMzLFxuICAgICAgICAgIGksXG4gICAgICAgICAgcG9zMEluZGV4QmFzZSxcbiAgICAgICAgICBwb3MxSW5kZXhCYXNlLFxuICAgICAgICAgIHBvczJJbmRleEJhc2UsXG4gICAgICAgICAgaXNGcm9udEZhY2VQaWNrYWJsZSxcbiAgICAgICAgICBpc0JhY2tGYWNlUGlja2FibGUsXG4gICAgICAgICAgZG90VGhyZXNob2xkLFxuICAgICAgICAgIGhhc0ZhY2VOb3JtYWxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHJlc3VsdC5yZXN1bHQgJiYgSXMuZGVmaW5lZChyZXN1bHQuZGF0YSkpIHtcbiAgICAgICAgICBjb25zdCB0ID0gcmVzdWx0LmRhdGEudDtcbiAgICAgICAgICBpZiAodCA8IGN1cnJlbnRTaG9ydGVzdFQpIHtcbiAgICAgICAgICAgIGN1cnJlbnRTaG9ydGVzdFQgPSB0O1xuICAgICAgICAgICAgdSA9IHJlc3VsdC5kYXRhLnU7XG4gICAgICAgICAgICB2ID0gcmVzdWx0LmRhdGEudjtcbiAgICAgICAgICAgIF9oaXRQb3MwSW5kZXhCYXNlID0gcG9zMEluZGV4QmFzZTtcbiAgICAgICAgICAgIF9oaXRQb3MxSW5kZXhCYXNlID0gcG9zMUluZGV4QmFzZTtcbiAgICAgICAgICAgIF9oaXRQb3MySW5kZXhCYXNlID0gcG9zMkluZGV4QmFzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY3VycmVudFNob3J0ZXN0VCA9PT0gTnVtYmVyLk1BWF9WQUxVRSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdWx0OiBmYWxzZSxcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnRTaG9ydGVzdEludGVyc2VjdGVkUG9zVmVjMyA9IFZlY3RvcjMuZnJvbUNvcHkzKFxuICAgICAgZGlyVmVjMy54ICogY3VycmVudFNob3J0ZXN0VCArIG9yaWdWZWMzLngsXG4gICAgICBkaXJWZWMzLnkgKiBjdXJyZW50U2hvcnRlc3RUICsgb3JpZ1ZlYzMueSxcbiAgICAgIGRpclZlYzMueiAqIGN1cnJlbnRTaG9ydGVzdFQgKyBvcmlnVmVjMy56XG4gICAgKTtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdWx0OiB0cnVlLFxuICAgICAgZGF0YToge1xuICAgICAgICB0OiBjdXJyZW50U2hvcnRlc3RULFxuICAgICAgICB1LFxuICAgICAgICB2LFxuICAgICAgICBwb3NpdGlvbjogY3VycmVudFNob3J0ZXN0SW50ZXJzZWN0ZWRQb3NWZWMzLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEludGVybmFsIHJheS10cmlhbmdsZSBpbnRlcnNlY3Rpb24gdGVzdCB1c2luZyBUb21hcyBNXHUwMEY2bGxlciBhbGdvcml0aG0uXG4gICAqIEBwYXJhbSBvcmlnVmVjMyAtIFJheSBvcmlnaW5cbiAgICogQHBhcmFtIGRpclZlYzMgLSBSYXkgZGlyZWN0aW9uXG4gICAqIEBwYXJhbSBpIC0gVHJpYW5nbGUgaW5kZXhcbiAgICogQHBhcmFtIHBvczBJbmRleEJhc2UgLSBGaXJzdCB2ZXJ0ZXggaW5kZXhcbiAgICogQHBhcmFtIHBvczFJbmRleEJhc2UgLSBTZWNvbmQgdmVydGV4IGluZGV4XG4gICAqIEBwYXJhbSBwb3MySW5kZXhCYXNlIC0gVGhpcmQgdmVydGV4IGluZGV4XG4gICAqIEBwYXJhbSBpc0Zyb250RmFjZVBpY2thYmxlIC0gV2hldGhlciBmcm9udCBmYWNlcyBhcmUgcGlja2FibGVcbiAgICogQHBhcmFtIGlzQmFja0ZhY2VQaWNrYWJsZSAtIFdoZXRoZXIgYmFjayBmYWNlcyBhcmUgcGlja2FibGVcbiAgICogQHBhcmFtIGRvdFRocmVzaG9sZCAtIE5vcm1hbCBkb3QgcHJvZHVjdCB0aHJlc2hvbGRcbiAgICogQHBhcmFtIGhhc0ZhY2VOb3JtYWwgLSBXaGV0aGVyIHRvIHVzZSBmYWNlIG5vcm1hbHNcbiAgICogQHJldHVybnMgSW50ZXJzZWN0aW9uIHJlc3VsdCB3aXRoIGJhcnljZW50cmljIGNvb3JkaW5hdGVzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIF9fY2FzdFJheUlubmVyVG9tYXNNb2xsZXIoXG4gICAgb3JpZ1ZlYzM6IElWZWN0b3IzLFxuICAgIGRpclZlYzM6IElWZWN0b3IzLFxuICAgIGk6IEluZGV4LFxuICAgIHBvczBJbmRleEJhc2U6IEluZGV4LFxuICAgIHBvczFJbmRleEJhc2U6IEluZGV4LFxuICAgIHBvczJJbmRleEJhc2U6IEluZGV4LFxuICAgIGlzRnJvbnRGYWNlUGlja2FibGU6IGJvb2xlYW4sXG4gICAgaXNCYWNrRmFjZVBpY2thYmxlOiBib29sZWFuLFxuICAgIGRvdFRocmVzaG9sZDogbnVtYmVyLFxuICAgIGhhc0ZhY2VOb3JtYWw6IGJvb2xlYW5cbiAgKTogUmF5Y2FzdFJlc3VsdCB7XG4gICAgaWYgKGhhc0ZhY2VOb3JtYWwpIHtcbiAgICAgIGNvbnN0IG5vcm1hbEFjY2Vzc29yID0gdGhpcy5fX2F0dHJpYnV0ZXMuZ2V0KFZlcnRleEF0dHJpYnV0ZS5Ob3JtYWwuWFlaKTtcbiAgICAgIGlmIChub3JtYWxBY2Nlc3Nvcikge1xuICAgICAgICBjb25zdCBub3JtYWwgPSBub3JtYWxBY2Nlc3Nvci5nZXRWZWMzKGksIHt9KTtcbiAgICAgICAgaWYgKG5vcm1hbC5kb3QoZGlyVmVjMykgPCBkb3RUaHJlc2hvbGQgJiYgIWlzRnJvbnRGYWNlUGlja2FibGUpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdWx0OiBmYWxzZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChub3JtYWwuZG90KGRpclZlYzMpID4gLWRvdFRocmVzaG9sZCAmJiAhaXNCYWNrRmFjZVBpY2thYmxlKSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3VsdDogZmFsc2UsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHBvc2l0aW9uQWNjZXNzb3IgPSB0aGlzLl9fYXR0cmlidXRlcy5nZXQoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWikhO1xuICAgIGNvbnN0IHBvczBWZWMzID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKHBvczBJbmRleEJhc2UsIHt9KTtcbiAgICBjb25zdCBwb3MxVmVjMyA9IHBvc2l0aW9uQWNjZXNzb3IuZ2V0VmVjMyhwb3MxSW5kZXhCYXNlLCB7fSk7XG4gICAgY29uc3QgcG9zMlZlYzMgPSBwb3NpdGlvbkFjY2Vzc29yLmdldFZlYzMocG9zMkluZGV4QmFzZSwge30pO1xuXG4gICAgY29uc3QgZTEgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gICAgY29uc3QgZTIgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gICAgY29uc3QgcHZlYyA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgICBjb25zdCB0dmVjID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICAgIGNvbnN0IHF2ZWMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG5cbiAgICBsZXQgdSA9IDA7XG4gICAgbGV0IHYgPSAwO1xuXG4gICAgTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyhwb3MxVmVjMywgcG9zMFZlYzMsIGUxKTtcbiAgICBNdXRhYmxlVmVjdG9yMy5zdWJ0cmFjdFRvKHBvczJWZWMzLCBwb3MwVmVjMywgZTIpO1xuXG4gICAgTXV0YWJsZVZlY3RvcjMuY3Jvc3NUbyhkaXJWZWMzLCBlMiwgcHZlYyk7XG4gICAgY29uc3QgZGV0ID0gVmVjdG9yMy5kb3QoZTEsIHB2ZWMpO1xuXG4gICAgaWYgKGRldCA+IDAuMDAwMSkge1xuICAgICAgTXV0YWJsZVZlY3RvcjMuc3VidHJhY3RUbyhvcmlnVmVjMywgcG9zMFZlYzMsIHR2ZWMpO1xuICAgICAgdSA9IFZlY3RvcjMuZG90KHR2ZWMsIHB2ZWMpO1xuICAgICAgaWYgKHUgPCAwLjAgfHwgdSA+IGRldCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlc3VsdDogZmFsc2UsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBNdXRhYmxlVmVjdG9yMy5jcm9zc1RvKHR2ZWMsIGUxLCBxdmVjKTtcbiAgICAgIHYgPSBWZWN0b3IzLmRvdChkaXJWZWMzLCBxdmVjKTtcbiAgICAgIGlmICh2IDwgMC4wIHx8IHUgKyB2ID4gZGV0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVzdWx0OiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGRldCA8IC0wLjAwMDEpIHtcbiAgICAgIE11dGFibGVWZWN0b3IzLnN1YnRyYWN0VG8ob3JpZ1ZlYzMsIHBvczBWZWMzLCB0dmVjKTtcbiAgICAgIHUgPSBWZWN0b3IzLmRvdCh0dmVjLCBwdmVjKTtcbiAgICAgIGlmICh1ID4gMC4wIHx8IHUgPCBkZXQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZXN1bHQ6IGZhbHNlLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgTXV0YWJsZVZlY3RvcjMuY3Jvc3NUbyh0dmVjLCBlMSwgcXZlYyk7XG4gICAgICB2ID0gVmVjdG9yMy5kb3QoZGlyVmVjMywgcXZlYyk7XG4gICAgICBpZiAodiA+IDAuMCB8fCB1ICsgdiA8IGRldCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlc3VsdDogZmFsc2UsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlc3VsdDogZmFsc2UsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IGludl9kZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBsZXQgdCA9IFZlY3RvcjMuZG90KGUyLCBxdmVjKTtcbiAgICB0ICo9IGludl9kZXQ7XG4gICAgdSAqPSBpbnZfZGV0O1xuICAgIHYgKj0gaW52X2RldDtcblxuICAgIHJldHVybiB7XG4gICAgICByZXN1bHQ6IHRydWUsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIHQsXG4gICAgICAgIHUsXG4gICAgICAgIHYsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgbm9ybWFsIHZlY3RvciBmcm9tIFVWIGNvb3JkaW5hdGVzXG4gICAqIEBwYXJhbSBwb3MwSW5kZXhCYXNlIEluZGV4IG9mIGZpcnN0IHBvc2l0aW9uXG4gICAqIEBwYXJhbSBwb3MxSW5kZXhCYXNlIEluZGV4IG9mIHNlY29uZCBwb3NpdGlvblxuICAgKiBAcGFyYW0gcG9zMkluZGV4QmFzZSBJbmRleCBvZiB0aGlyZCBwb3NpdGlvblxuICAgKiBAcGFyYW0gdSBVIGNvb3JkaW5hdGVcbiAgICogQHBhcmFtIHYgViBjb29yZGluYXRlXG4gICAqIEByZXR1cm5zIFRoZSBjYWxjdWxhdGVkIG5vcm1hbCB2ZWN0b3JcbiAgICovXG4gIHByaXZhdGUgX19jYWxjTm9ybWFsRnJvbVVWKFxuICAgIHBvczBJbmRleEJhc2U6IEluZGV4LFxuICAgIHBvczFJbmRleEJhc2U6IEluZGV4LFxuICAgIHBvczJJbmRleEJhc2U6IEluZGV4LFxuICAgIHU6IG51bWJlcixcbiAgICB2OiBudW1iZXJcbiAgKTogSVZlY3RvcjMge1xuICAgIGNvbnN0IGZEYXQgPSAxLjAgLSB1IC0gdjtcblxuICAgIGNvbnN0IHBvc2l0aW9uQWNjZXNzb3IgPSB0aGlzLl9fYXR0cmlidXRlcy5nZXQoVmVydGV4QXR0cmlidXRlLlBvc2l0aW9uLlhZWikhO1xuICAgIGNvbnN0IHBvczBWZWMzID0gcG9zaXRpb25BY2Nlc3Nvci5nZXRWZWMzKHBvczBJbmRleEJhc2UsIHt9KTtcbiAgICBjb25zdCBwb3MxVmVjMyA9IHBvc2l0aW9uQWNjZXNzb3IuZ2V0VmVjMyhwb3MxSW5kZXhCYXNlLCB7fSk7XG4gICAgY29uc3QgcG9zMlZlYzMgPSBwb3NpdGlvbkFjY2Vzc29yLmdldFZlYzMocG9zMkluZGV4QmFzZSwge30pO1xuXG4gICAgY29uc3QgcG9zMCA9IFZlY3RvcjMubXVsdGlwbHkocG9zMFZlYzMsIGZEYXQpO1xuICAgIGNvbnN0IHBvczEgPSBWZWN0b3IzLm11bHRpcGx5KHBvczFWZWMzLCB1KTtcbiAgICBjb25zdCBwb3MyID0gVmVjdG9yMy5tdWx0aXBseShwb3MyVmVjMywgdik7XG4gICAgY29uc3QgaW50ZXJzZWN0ZWRQb3NWZWMzID0gTXV0YWJsZVZlY3RvcjMuemVybygpLmFkZChwb3MwKS5hZGQocG9zMSkuYWRkKHBvczIpO1xuICAgIHJldHVybiBpbnRlcnNlY3RlZFBvc1ZlYzM7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFHQSxTQUFTLGdCQUFnQjtBQUN6QixTQUFTLGlCQUFpQjtBQUMxQixTQUFTLHFCQUE2QztBQUN0RCxTQUFTLHVCQUFpRDtBQUMxRCxTQUFTLHFCQUE2QztBQUN0RCxTQUFTLHVCQUFrRTtBQUMzRSxTQUFTLGlDQUFpQztBQUUxQyxTQUFTLFlBQVk7QUFFckIsU0FBUyxzQkFBc0I7QUFDL0IsU0FBUyxlQUFlO0FBRXhCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsVUFBVTtBQUNuQixTQUFTLE1BQW1CLFlBQVk7QUFDeEMsU0FBUyxtQkFBbUI7QUFHNUI7QUFBQSxFQUdFO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLE9BS0s7QUFvQkEsSUFBTSxhQUFOLE1BQU0sbUJBQWtCLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBc0N0QyxZQUFZLFFBQWdCO0FBQzFCLFVBQU07QUFyQ1IsU0FBUUEsS0FBNEIsY0FBYztBQUdsRCxTQUFRQyxLQUE0QyxvQkFBSSxJQUFJO0FBQzVELFNBQVFDLEtBQXVCO0FBRS9CLFNBQVFDLEtBQTJCLG9CQUFJLElBQUk7QUFDM0MsU0FBUUMsS0FBK0IsSUFBSSxLQUFLO0FBRWhELFNBQVFDLEtBQStCO0FBQ3ZDO0FBQUEsU0FBUUMsS0FBUyxJQUFJLEtBQUs7QUFDMUIsU0FBUUMsS0FBK0IsQ0FBQztBQUl4QyxTQUFRQyxLQUF3QjtBQUVoQyxTQUFPLFdBQTZCO0FBQ3BDLFNBQU8sYUFBYTtBQVFwQixTQUFRQyxLQUFrQztBQUMxQyxTQUFRQyxLQUE0QjtBQUdwQyxTQUFRQyxLQUFnQjtBQVF0QixTQUFLQyxJQUFXO0FBQ2hCLFFBQUksV0FBVUMsTUFBcUIsTUFBTTtBQUN2QyxpQkFBVUEsS0FBb0IsMEJBQTBCLEtBQUtELEdBQVU7QUFBQSxRQUNyRSxZQUFZO0FBQUEsUUFDWixZQUFZO0FBQUEsTUFDZCxDQUFDO0FBQUEsSUFDSDtBQUVBLFNBQUtFLEtBQWEsV0FBVUQ7QUFDNUIsU0FBSyxnQkFBZ0IsSUFBSSxRQUFRLFdBQVVBLEVBQWlCO0FBQUEsRUFDOUQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxrQkFBa0I7QUFDaEIsUUFBSSxNQUFNO0FBQ1YsV0FBTyxLQUFLYixHQUFPO0FBQ25CLFFBQUksS0FBS0ksR0FBVyxJQUFJLEdBQUc7QUFDekIsYUFBTyxLQUFLLHNCQUFzQjtBQUFBLElBQ3BDO0FBQ0EsV0FBTyxLQUFLLFFBQVE7QUFDcEIsV0FBTyxXQUFVLHdCQUF3QixLQUFLQyxFQUFjO0FBQzVELGVBQVcsQ0FBQyxVQUFVLFFBQVEsS0FBSyxLQUFLRixJQUFjO0FBQ3BELGFBQU87QUFDUCxhQUFPLFNBQVMsY0FBYyxTQUFTLFNBQVMsZ0JBQWdCO0FBQ2hFLGFBQU8sU0FBUztBQUFBLElBQ2xCO0FBRUEsU0FBS1EsS0FBZ0I7QUFBQSxFQUN2QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxrQkFBa0I7QUFDaEIsV0FBTyxLQUFLQTtBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsd0JBQTZDO0FBQzNDLFFBQUksQ0FBQyxLQUFLUCxHQUFXLElBQUksR0FBRztBQUMxQixhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksS0FBS1csTUFBb0IsTUFBTTtBQUNqQyxhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU8sS0FBSyxnQkFBZ0I7QUFBQSxFQUM5QjtBQUFBO0FBQUEsRUFHQSxJQUFJLFVBQWtCO0FBQ3BCLFdBQU8sS0FBS0g7QUFBQSxFQUNkO0FBQUE7QUFBQSxFQUdBLElBQUksa0JBQThDO0FBQ2hELFdBQU8sS0FBS0c7QUFBQSxFQUNkO0FBQUE7QUFBQSxFQUdBLElBQUksa0JBQThDO0FBQ2hELFFBQUksS0FBS0EsTUFBb0IsUUFBUSxLQUFLUCxLQUF3QixHQUFHO0FBQ25FLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTyxLQUFLTyxHQUFpQixRQUFRLEtBQUtQLEVBQXFCO0FBQUEsRUFDakU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxtQkFBbUIsT0FBdUIsWUFBMEI7QUFDbEUsU0FBS08sS0FBbUI7QUFDeEIsU0FBS1AsS0FBd0I7QUFDN0IsU0FBS1EsS0FBa0IsTUFBTTtBQUM3QixTQUFLLGdCQUFnQjtBQUFBLEVBQ3ZCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLHVCQUE2QjtBQUMzQixTQUFLRCxLQUFtQjtBQUN4QixTQUFLUCxLQUF3QjtBQUM3QixTQUFLUSxLQUFrQjtBQUN2QixTQUFLLGdCQUFnQjtBQUFBLEVBQ3ZCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyx3QkFBd0IsY0FBK0M7QUFDNUUsV0FBTyxLQUFLQyxHQUEwQixJQUFJLFlBQVk7QUFBQSxFQUN4RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLE9BQU8scUJBQXFCLGNBQTRDO0FBQ3RFLFdBQU8sS0FBS0MsR0FBMEIsSUFBSSxZQUFZO0FBQUEsRUFDeEQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxrQkFBdUM7QUFDckMsVUFBTSxnQkFBZ0IsS0FBS2QsR0FBVyxrQkFBa0I7QUFDeEQsUUFBSSxpQkFBaUIsTUFBTTtBQUN6QixZQUFNLElBQUksTUFBTSx1QkFBdUI7QUFBQSxJQUN6QztBQUNBLFFBQUksY0FBYyxrQkFBa0IsY0FBYyxlQUFlO0FBQy9ELGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxjQUFjLGtCQUFrQixjQUFjLGFBQWE7QUFDN0QsYUFBTztBQUFBLElBQ1Q7QUFDQSxRQUFJLGNBQWMsa0JBQWtCLGNBQWMsY0FBYztBQUM5RCxhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sSUFBSSxNQUFNLHFDQUFxQztBQUFBLEVBQ3ZEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksaUJBQWlCO0FBQ25CLFdBQU8sS0FBS1k7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsV0FBVyxxQkFBcUI7QUFDOUIsV0FBTyxLQUFLRztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLG1CQUFtQixhQUFxQixVQUFvQjtBQUMxRCxTQUFLbEIsR0FBbUIsSUFBSSxhQUFhLFFBQVE7QUFDakQsZUFBVWtCO0FBQUEsRUFDWjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLHFCQUFxQixhQUFxQjtBQUN4QyxVQUFNLFVBQVUsS0FBS2xCLEdBQW1CLElBQUksV0FBVztBQUN2RCxRQUFJLFNBQVM7QUFDWCxXQUFLLFdBQVc7QUFDaEIsV0FBS0MsS0FBdUI7QUFDNUIsaUJBQVVpQjtBQUFBLElBQ1o7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLHdCQUF3QjtBQUN0QixlQUFXLENBQUMsTUFBTSxRQUFRLEtBQUssS0FBS2xCLElBQW9CO0FBQ3RELFVBQUksYUFBYSxLQUFLYSxJQUFZO0FBQ2hDLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLGtCQUFrQjtBQUNoQixXQUFPLE1BQU0sS0FBSyxLQUFLYixHQUFtQixLQUFLLENBQUM7QUFBQSxFQUNsRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLG1CQUFtQixhQUFxQjtBQUN0QyxXQUFPLEtBQUtBLEdBQW1CLElBQUksV0FBVztBQUFBLEVBQ2hEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxTQUFTLEtBQWU7QUFDMUIsU0FBS2EsS0FBYTtBQUNsQixTQUFLLFdBQVcscUNBQXFDLHFDQUFxQyxJQUFJLFdBQVc7QUFFekcsUUFBSSxtQkFBbUI7QUFDdkIsUUFBSSxJQUFJLG9CQUFvQixHQUFHO0FBQzdCLHlCQUFtQjtBQUFBLElBQ3JCLFdBQVcsSUFBSSxRQUFRLEdBQUc7QUFDeEIsVUFBSSxJQUFJLGlCQUFpQjtBQUN2QiwyQkFBbUI7QUFBQSxNQUNyQixPQUFPO0FBQ0wsMkJBQW1CO0FBQUEsTUFDckI7QUFBQSxJQUNGO0FBQ0EsU0FBSztBQUFBLE1BQ0g7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFDQSxRQUFJLG9CQUFvQixJQUFJO0FBQzVCLFNBQUtNLEdBQTJCO0FBQUEsRUFDbEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxXQUFXO0FBQ2IsV0FBTyxLQUFLTjtBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsV0FBVyxRQUFnQyxRQUFnQyxPQUFlO0FBQ3hGLFVBQU0sY0FBYyxTQUFTO0FBQzdCLFNBQUssWUFBWTtBQUdqQixRQUFJLFFBQVEsS0FBSyxVQUFVO0FBRTNCLFNBQUssWUFBWSxFQUFFLFFBQVE7QUFFM0IsU0FBSyxhQUFhLFFBQVEsU0FBUztBQUFBLEVBQ3JDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxlQUFlLE9BQWU7QUFDNUIsVUFBTSxZQUFZLEtBQUssMENBQTBDO0FBQ2pFLFVBQU0sVUFBVSxLQUFLLElBQUksR0FBRyxLQUFLLElBQUksVUFBVSxRQUFRLENBQUMsQ0FBQztBQUN6RCxTQUFLLFdBQVcsd0NBQXdDLHdDQUF3QyxPQUFPO0FBQUEsRUFDekc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLGNBQWMsTUFBWTtBQUN4QixTQUFLTyxLQUFTO0FBQUEsRUFDaEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxPQUEwQjtBQUM1QixXQUFPLEtBQUtBO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLGtCQUFrQjtBQUNoQixTQUFLLGdCQUFnQixJQUFJLFFBQVEsS0FBS1AsRUFBVTtBQUFBLEVBQ2xEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsbUJBQW1CO0FBQ2pCLFVBQU0sV0FBVyxLQUFLLGNBQWMsTUFBTTtBQUMxQyxRQUFJLFlBQVksTUFBTTtBQUNwQixXQUFLQSxLQUFhO0FBQUEsSUFDcEI7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsT0FBTyxhQUFhLGNBQTRCO0FBamFsRDtBQWthSSxZQUFPLFVBQUtRLEdBQWEsWUFBWSxNQUE5QixtQkFBaUM7QUFBQSxFQUMxQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxPQUFPLGlCQUFpQixVQUFnRDtBQXphMUU7QUEwYUksYUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLQSxHQUFhLFFBQVEsS0FBSztBQUNqRCxZQUFNLGFBQVksVUFBS0EsR0FBYSxDQUFDLE1BQW5CLG1CQUFzQjtBQUN4QyxVQUFJLGFBQWEsTUFBTTtBQUNyQixpQkFBUyxTQUFTO0FBQUEsTUFDcEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxPQUFPLG9CQUFvQjtBQUN6QixXQUFPLEtBQUtDO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9BLGtCQUFrQixpQkFBeUI7QUFDekMsU0FBS2IsS0FBNEI7QUFDakMsUUFBSSxLQUFLVyxNQUFVLE1BQU07QUFDdkIsV0FBS0EsR0FBTyw0QkFBNEI7QUFBQSxJQUMxQztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxRQUFRLFlBQXdCLE1BQXlCLFVBQXFCLGlCQUE0QjtBQUN4RyxRQUFJLG1CQUFtQixNQUFNO0FBQzNCLFdBQUtqQixLQUFhLElBQUksS0FBSyxlQUFlO0FBQUEsSUFDNUMsT0FBTztBQUNMLFdBQUtBLEtBQWEsSUFBSSxLQUFLO0FBQUEsSUFDN0I7QUFDQSxTQUFLRCxLQUFlO0FBRXBCLFVBQU0sbUJBQW1CLEtBQUtBLEdBQWEsSUFBSSxnQkFBZ0IsU0FBUyxHQUFHO0FBQzNFLHFCQUFpQixhQUFhLElBQUksUUFBUSxJQUFJO0FBRTlDLFFBQUksWUFBWSxNQUFNO0FBQ3BCLFdBQUssV0FBVztBQUFBLElBQ2xCLE9BQU87QUFDTCxXQUFLLFdBQVcsMEJBQTBCLEtBQUtTLEdBQVU7QUFBQSxRQUN2RCxZQUFZO0FBQUEsUUFDWixZQUFZO0FBQUEsTUFDZCxDQUFDO0FBQUEsSUFDSDtBQUNBLFNBQUtaLEtBQVM7QUFDZCxTQUFLLFdBQVcsMENBQTBDLDBDQUEwQyxLQUFLLEtBQUs7QUFFOUcsU0FBS0ssS0FBaUIsV0FBVWtCO0FBQ2hDLGVBQVVELEdBQWEsS0FBS2pCLEVBQWMsSUFBSSxJQUFJLFFBQVEsSUFBSTtBQUM5RCxTQUFLLGdCQUFnQjtBQUNyQixTQUFLZSxHQUEyQjtBQUFBLEVBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsZUFBZSxFQUFFLFlBQVksb0JBQW9CLGVBQWUsU0FBUyxTQUFTLEdBQXdCO0FBQ3hHLFFBQUksMEJBQTBCO0FBQzlCLFVBQU0sWUFBWTtBQUNsQixlQUFXLFFBQVEsZUFBYTtBQUM5QixpQ0FBMkIsVUFBVTtBQUFBLElBQ3ZDLENBQUM7QUFFRCxRQUFJLGFBQWE7QUFDakIsUUFBSSxXQUFXLE1BQU07QUFDbkIsb0JBQWMsU0FBUyxnQkFBZ0IsUUFBUSxZQUFZLFNBQVM7QUFBQSxJQUN0RTtBQUVBLFVBQU0sU0FBUyxLQUFLUixFQUFTLGNBQWMscUJBQXFCLFVBQVUsWUFBWSxZQUFZLFNBQVM7QUFFM0csUUFBSTtBQUNKLFFBQUk7QUFDSixRQUFJLFdBQVcsTUFBTTtBQUNuQiw2QkFBdUIsY0FBYyxlQUFlLE9BQU87QUFDM0QsWUFBTSwwQkFBMEIsT0FBTyxlQUFlO0FBQUEsUUFDcEQsa0JBQWtCLFFBQVE7QUFBQSxRQUMxQixZQUFZO0FBQUEsTUFDZCxDQUFDO0FBQ0QsVUFBSSx3QkFBd0IsTUFBTSxHQUFHO0FBQ25DLGNBQU0sSUFBSSxZQUFZLHdCQUF3QixXQUFXLENBQUM7QUFBQSxNQUM1RDtBQUNBLFlBQU0sd0JBQXdCLHdCQUF3QixJQUFJLEVBQUUsYUFBYTtBQUFBLFFBQ3ZFLGlCQUFpQixnQkFBZ0I7QUFBQSxRQUNqQyxlQUFlO0FBQUEsUUFDZixPQUFPLFFBQVEsYUFBYSxxQkFBcUIsZUFBZTtBQUFBLE1BQ2xFLENBQUM7QUFDRCxVQUFJLHNCQUFzQixNQUFNLEdBQUc7QUFDakMsY0FBTSxJQUFJLFlBQVksc0JBQXNCLFdBQVcsQ0FBQztBQUFBLE1BQzFEO0FBQ0Esd0JBQWtCLHNCQUFzQixJQUFJO0FBRTVDLGVBQVMsSUFBSSxHQUFHLElBQUksUUFBUyxhQUFhLGdCQUFpQixzQkFBc0IsS0FBSztBQUNwRix3QkFBaUIsVUFBVSxHQUFHLFFBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUFBLE1BQy9DO0FBQUEsSUFDRjtBQUVBLFVBQU0sdUJBQXVCLE9BQzFCLGVBQWU7QUFBQSxNQUNkLGtCQUFrQjtBQUFBLE1BQ2xCLFlBQVk7QUFBQSxJQUNkLENBQUMsRUFDQSxZQUFZO0FBRWYsVUFBTSxxQkFBc0MsQ0FBQztBQUM3QyxVQUFNLDBCQUFvRCxDQUFDO0FBRTNELGVBQVcsUUFBUSxDQUFDLFlBQVksTUFBTTtBQUNwQyxZQUFNLGtCQUFrQixnQkFBZ0IsV0FBVyxnQkFBZ0IsbUJBQW1CLG1CQUFtQixDQUFDLENBQUMsQ0FBQztBQUM1Ryw4QkFBd0IsQ0FBQyxJQUFJLGNBQWMsZUFBZSxXQUFXLENBQUMsQ0FBQztBQUN2RSxZQUFNLFdBQXFCLHFCQUN4QixhQUFhO0FBQUEsUUFDWjtBQUFBLFFBQ0EsZUFBZSxjQUFjLGVBQWUsV0FBVyxDQUFDLENBQUM7QUFBQSxRQUN6RCxPQUNFLFdBQVcsYUFDWCxnQkFBZ0Isc0JBQXNCLElBQ3RDLHdCQUF3QixDQUFDLEVBQUUsZUFBZTtBQUFBLE1BQzlDLENBQUMsRUFDQSxZQUFZO0FBQ2YsZUFBUyxtQkFBbUIsVUFBVTtBQUN0Qyx5QkFBbUIsS0FBSyxRQUFRO0FBQUEsSUFDbEMsQ0FBQztBQUVELFVBQU0sZUFBb0Usb0JBQUksSUFBSTtBQUNsRixhQUFTLElBQUksR0FBRyxJQUFJLG1CQUFtQixRQUFRLEtBQUs7QUFDbEQsWUFBTSxvQkFBb0IsbUJBQW1CLENBQUM7QUFDOUMsbUJBQWEsSUFBSSxtQkFBbUIsbUJBQW1CLENBQUMsQ0FBQztBQUFBLElBQzNEO0FBRUEsU0FBSyxRQUFRLGNBQWMsZUFBZSxVQUFVLGVBQWdCO0FBQUEsRUFDdEU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLE9BQU8sZ0JBQWdCLFFBQWdCLE1BQTJCO0FBQ2hFLFVBQU0sWUFBWSxJQUFJLFdBQVUsTUFBTTtBQUN0QyxjQUFVLGVBQWUsSUFBSTtBQUM3QixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLGtCQUF3QztBQUMxQyxXQUFPLEtBQUtSLEdBQVcsa0JBQWtCO0FBQUEsRUFDM0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSwrQkFBK0I7QUFDN0IsUUFBSSxLQUFLLGlCQUFpQjtBQUN4QixhQUFPLEtBQUssZ0JBQWdCO0FBQUEsSUFDOUI7QUFDQSxXQUFPLEtBQUssOEJBQThCO0FBQUEsRUFDNUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsZ0NBQXVDO0FBQ3JDLGVBQVcsWUFBWSxLQUFLRCxHQUFhLE9BQU8sR0FBRztBQUNqRCxhQUFPLFNBQVM7QUFBQSxJQUNsQjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsaUNBQXdDO0FBQ3RDLFFBQUksS0FBSyxpQkFBaUI7QUFDeEIsY0FBUSxLQUFLSCxJQUFRO0FBQUEsUUFDbkIsS0FBSyxjQUFjO0FBQ2pCLGlCQUFPLEtBQUssZ0JBQWdCLGVBQWU7QUFBQSxRQUM3QyxLQUFLLGNBQWM7QUFDakIsaUJBQU8sS0FBSyxnQkFBZ0IsZUFBZTtBQUFBLFFBQzdDLEtBQUssY0FBYztBQUNqQixpQkFBTyxLQUFLLGdCQUFnQixlQUFlO0FBQUEsUUFDN0M7QUFDRSxpQkFBTztBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQ0EsV0FBTyxLQUFLLGdDQUFnQztBQUFBLEVBQzlDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0Esa0NBQXlDO0FBQ3ZDLGVBQVcsWUFBWSxLQUFLRyxHQUFhLE9BQU8sR0FBRztBQUNqRCxjQUFRLEtBQUtILElBQVE7QUFBQSxRQUNuQixLQUFLLGNBQWM7QUFDakIsaUJBQU8sU0FBUyxlQUFlO0FBQUEsUUFDakMsS0FBSyxjQUFjO0FBQ2pCLGlCQUFPLFNBQVMsZUFBZTtBQUFBLFFBQ2pDLEtBQUssY0FBYztBQUNqQixpQkFBTyxTQUFTLGVBQWU7QUFBQSxRQUNqQztBQUNFLGlCQUFPO0FBQUEsTUFDWDtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxhQUFhO0FBQ1gsV0FBTyxLQUFLSSxHQUFXLElBQUk7QUFBQSxFQUM3QjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLHFCQUFzQztBQUN4QyxVQUFNLFlBQTZCLENBQUM7QUFDcEMsU0FBS0QsR0FBYSxRQUFRLGNBQVk7QUFDcEMsZ0JBQVUsS0FBSyxRQUFRO0FBQUEsSUFDekIsQ0FBQztBQUNELFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsYUFBYSxVQUFnRDtBQUMzRCxXQUFPLEtBQUtBLEdBQWEsSUFBSSxRQUFRO0FBQUEsRUFDdkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxxQkFBa0U7QUFDcEUsVUFBTSxZQUF5RCxDQUFDO0FBQ2hFLFNBQUtBLEdBQWEsUUFBUSxDQUFDLFdBQVcsYUFBYTtBQUNqRCxnQkFBVSxLQUFLLFFBQVE7QUFBQSxJQUN6QixDQUFDO0FBQ0QsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxtQkFBbUI7QUFDckIsV0FBTyxLQUFLQSxHQUFhLFFBQVE7QUFBQSxFQUNuQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLDRCQUF3RDtBQUMxRCxVQUFNLFFBQW9DLENBQUM7QUFDM0MsU0FBS0EsR0FBYSxRQUFRLGNBQVk7QUFDcEMsWUFBTSxLQUFLLFNBQVMsZUFBZTtBQUFBLElBQ3JDLENBQUM7QUFFRCxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLDBCQUFvRDtBQUN0RCxVQUFNLFFBQWtDLENBQUM7QUFDekMsU0FBS0EsR0FBYSxRQUFRLGNBQVk7QUFDcEMsWUFBTSxLQUFLLFNBQVMsYUFBYTtBQUFBLElBQ25DLENBQUM7QUFFRCxXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLGdCQUFtQztBQUNyQyxXQUFPLEtBQUtIO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLGVBQTZCO0FBQy9CLFdBQU8sS0FBS0s7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSwwQkFBa0M7QUFDcEMsV0FBTyxLQUFLSztBQUFBLEVBQ2Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxJQUFJLE9BQU87QUFDVCxRQUFJLEtBQUtKLEdBQU8sVUFBVSxLQUFLLEtBQUssNEJBQTRCLEtBQUtHLElBQWlDO0FBQ3BHLFlBQU0sbUJBQW1CLEtBQUtOLEdBQWEsSUFBSSxnQkFBZ0IsU0FBUyxHQUFHO0FBRTNFLFlBQU0sTUFBTSxpQkFBaUI7QUFDN0IsV0FBS0csR0FBTyxXQUFXLFdBQVVrQixHQUFZLGNBQWMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDakYsWUFBTSxNQUFNLGlCQUFpQjtBQUM3QixXQUFLbEIsR0FBTyxXQUFXLFdBQVVrQixHQUFZLGNBQWMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDakYsV0FBS2YsS0FBa0MsaUJBQWlCO0FBQUEsSUFDMUQ7QUFFQSxXQUFPLEtBQUtIO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9RYyxLQUFtQztBQUN6QyxVQUFNLE9BQU8sS0FBS0M7QUFDbEIsUUFBSSxRQUFRLE1BQU07QUFDaEIsV0FBSyw4QkFBOEI7QUFBQSxJQUNyQztBQUFBLEVBQ0Y7QUFBQSxFQUVBLG1CQUFtQixVQUFvQixnQkFBc0Q7QUFDM0YsU0FBS2xCLEdBQWEsSUFBSSxnQkFBZ0IsUUFBUTtBQUM5QyxTQUFLLGdCQUFnQjtBQUNyQixTQUFLaUIsR0FBMkI7QUFBQSxFQUNsQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsZ0JBQWdCO0FBQ2QsU0FBS2hCLEtBQWEsSUFBSSxLQUFLO0FBQzNCLFNBQUssZ0JBQWdCO0FBQ3JCLFNBQUtnQixHQUEyQjtBQUFBLEVBQ2xDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLFdBQVcsVUFBb0I7QUFDN0IsU0FBS2hCLEtBQWEsSUFBSSxLQUFLLFFBQVE7QUFDbkMsU0FBSyxnQkFBZ0I7QUFDckIsU0FBS2dCLEdBQTJCO0FBQUEsRUFDbEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSxxQkFBcUIsU0FBNEI7QUFDL0MsZUFBVUYsR0FBMEIsSUFBSSxXQUFVTyxJQUEwQixJQUFJO0FBQ2hGLGVBQVVSLEdBQTBCLElBQUksS0FBS1osSUFBZ0IsV0FBVW9CLElBQTBCO0FBRWpHLFNBQUtsQixLQUFZO0FBQ2pCLFNBQUssZ0JBQWdCO0FBQ3JCLFNBQUthLEdBQTJCO0FBQUEsRUFDbEM7QUFBQSxFQUVBLE9BQU8sbUNBQTRDO0FBQ2pELFVBQU0sZ0JBQXlCLENBQUM7QUFDaEMsYUFBUyxJQUFJLEdBQUcsSUFBSSxXQUFVLDBCQUEwQixHQUFHLEtBQUs7QUFDOUQsWUFBTSxZQUFZLFdBQVUscUJBQXFCLENBQUM7QUFDbEQsb0JBQWMsS0FBSyxVQUFVLFFBQVEsTUFBTTtBQUFBLElBQzdDO0FBRUEsUUFBSSxjQUFjLFdBQVcsR0FBRztBQUM5QixhQUFPLENBQUMsQ0FBQztBQUFBLElBQ1g7QUFFQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsT0FBTyw2QkFBdUM7QUFDNUMsVUFBTSxVQUFvQixDQUFDLENBQUM7QUFDNUIsYUFBUyxJQUFJLEdBQUcsSUFBSSxXQUFVLDBCQUEwQixHQUFHLEtBQUs7QUFDOUQsWUFBTSxZQUFZLFdBQVUscUJBQXFCLENBQUM7QUFDbEQsY0FBUSxLQUFLLFFBQVEsUUFBUSxTQUFTLENBQUMsSUFBSSxVQUFVLFFBQVEsTUFBTTtBQUFBLElBQ3JFO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE9BQU8sNEJBQTRCO0FBQ2pDLFdBQU8sS0FBS0s7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLHVCQUF1QjtBQUNyQixXQUFPLEtBQUtsQixHQUFVLE9BQU87QUFBQSxFQUMvQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLFVBQTZCO0FBQy9CLFdBQU8sS0FBS0E7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLFVBQVU7QUFDUixRQUFJLEtBQUssWUFBWSxRQUFRLENBQUMsS0FBSyxTQUFTLFFBQVEsR0FBRztBQUNyRCxhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLFdBQVc7QUFDVCxXQUFPLENBQUMsS0FBSyxRQUFRO0FBQUEsRUFDdkI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSx3QkFBd0I7QUFDdEIsUUFBSSxLQUFLUSxNQUFvQixNQUFNO0FBQ2pDLGFBQU87QUFBQSxJQUNUO0FBQ0EsUUFBSSxLQUFLQyxNQUFtQixNQUFNO0FBQ2hDLGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTSwwQkFBMEIsS0FBS0osRUFBUztBQUM5QyxTQUFLSSxLQUFrQix3QkFBd0IsaUNBQWlDLElBQUk7QUFFcEYsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPQSx3QkFBd0I7QUFDdEIsUUFBSSxLQUFLRCxNQUFvQixNQUFNO0FBRWpDLGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTSxnQkFBZ0IsS0FBS0M7QUFDM0IsUUFBSSxHQUFHLElBQUksTUFBTSxLQUFLQSxFQUFlLEdBQUc7QUFDdEMsYUFBTztBQUFBLElBQ1Q7QUFFQSxVQUFNLDBCQUEwQixLQUFLSixFQUFTO0FBQzlDLDRCQUF3QixpQ0FBaUMsTUFBTSxhQUFhO0FBRTVFLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0Esd0JBQXdCO0FBQ3RCLFFBQUksS0FBS0csTUFBb0IsTUFBTTtBQUVqQyxhQUFPO0FBQUEsSUFDVDtBQUNBLFFBQUksS0FBS0MsTUFBbUIsTUFBTTtBQUNoQyxhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU0sMEJBQTBCLEtBQUtKLEVBQVM7QUFDOUMsNEJBQXdCLDBCQUEwQixLQUFLSSxFQUFlO0FBQ3RFLFNBQUtBLEtBQWtCO0FBRXZCLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksZ0JBQWdCO0FBQ2xCLFdBQU8sS0FBS0E7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsNkJBQTZCO0FBQzNCLFVBQU0sZ0JBQWdCLEtBQUs7QUFDM0IsUUFBSSxpQkFBaUIsTUFBTTtBQUN6QjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFVBQVUsY0FBYyxjQUFjO0FBRTVDLFFBQUksYUFBYTtBQUNqQixhQUFTLElBQUksR0FBRyxJQUFJLEtBQUssbUJBQW1CLFFBQVEsS0FBSztBQUN2RCxZQUFNLFdBQVcsS0FBSyxtQkFBbUIsQ0FBQztBQUMxQyxZQUFNLGtCQUFrQixTQUFTO0FBQ2pDLFVBQUksZUFBZTtBQUNuQixVQUFJLGdCQUFnQixVQUFVLGdCQUFnQixLQUFLLE9BQU87QUFDeEQsdUJBQWU7QUFBQSxNQUNqQixXQUFXLGdCQUFnQixVQUFVLGdCQUFnQixLQUFLLE9BQU87QUFDL0QsdUJBQWU7QUFBQSxNQUNqQixXQUFXLGdCQUFnQixVQUFVLGdCQUFnQixLQUFLLE9BQU87QUFDL0QsdUJBQWU7QUFBQSxNQUNqQixXQUFXLGdCQUFnQixVQUFVLGdCQUFnQixPQUFPLE9BQU87QUFDakUsdUJBQWU7QUFBQSxNQUNqQjtBQUNBLG9CQUFjLFFBQVEsU0FBUyxlQUFlO0FBQUEsSUFDaEQ7QUFFQSxVQUFNLFNBQVMsS0FBS0osRUFBUyxjQUFjO0FBQUEsTUFBcUIsVUFBVTtBQUFBLE1BQVk7QUFBQSxNQUFZO0FBQUE7QUFBQSxJQUFhO0FBQy9HLFVBQU0sYUFBYSxPQUNoQixlQUFlO0FBQUEsTUFDZCxrQkFBa0I7QUFBQSxNQUNsQixZQUFZO0FBQUEsSUFDZCxDQUFDLEVBQ0EsWUFBWTtBQUVmLGVBQVcsQ0FBQyxVQUFVLFdBQVcsS0FBSyxLQUFLVCxJQUFjO0FBQ3ZELFlBQU0sa0JBQWtCLFlBQVk7QUFFcEMsWUFBTSxjQUF3QixXQUMzQixhQUFhO0FBQUEsUUFDWjtBQUFBLFFBQ0EsZUFBZSxZQUFZO0FBQUEsUUFDM0IsT0FBTyxRQUFRO0FBQUEsTUFDakIsQ0FBQyxFQUNBLFlBQVk7QUFFZixlQUFTLElBQUksR0FBRyxJQUFJLFFBQVEsUUFBUSxLQUFLO0FBQ3ZDLGNBQU0sTUFBTSxRQUFRLENBQUM7QUFDckIsWUFBSSxnQkFBZ0IsVUFBVSxnQkFBZ0IsS0FBSyxPQUFPO0FBQ3hELGdCQUFNLE9BQU8sWUFBWSxRQUFRLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLHNCQUFZLFFBQVEsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQUEsUUFDM0QsV0FBVyxnQkFBZ0IsVUFBVSxnQkFBZ0IsS0FBSyxPQUFPO0FBQy9ELGdCQUFNLE9BQU8sWUFBWSxRQUFRLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLHNCQUFZLFFBQVEsR0FBRyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7QUFBQSxRQUNuRCxXQUFXLGdCQUFnQixVQUFVLGdCQUFnQixLQUFLLE9BQU87QUFDL0QsZ0JBQU0sT0FBTyxZQUFZLFFBQVEsS0FBSyxDQUFDLENBQUM7QUFDeEMsc0JBQVksUUFBUSxHQUFHLEtBQUssR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQUEsUUFDM0MsV0FBVyxnQkFBZ0IsVUFBVSxnQkFBZ0IsT0FBTyxPQUFPO0FBQ2pFLGdCQUFNLFNBQVMsWUFBWSxVQUFVLEtBQUssQ0FBQyxDQUFDO0FBQzVDLHNCQUFZLFVBQVUsR0FBRyxRQUFRLENBQUMsQ0FBQztBQUFBLFFBQ3JDO0FBQUEsTUFDRjtBQUVBLFdBQUssbUJBQW1CLGFBQWEsUUFBUTtBQUFBLElBQy9DO0FBRUEsU0FBSyxjQUFjO0FBQUEsRUFDckI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhQSxRQUNFLFVBQ0EsU0FDQSxxQkFDQSxvQkFDQSxjQUNBLGVBQ2tCO0FBQ2xCLFFBQUksbUJBQW1CLE9BQU87QUFDOUIsUUFBSSxlQUFlO0FBQ25CLFFBQUksS0FBS0gsT0FBVyxjQUFjLGVBQWU7QUFFL0MscUJBQWU7QUFBQSxJQUNqQixXQUFXLEtBQUtBLE9BQVcsY0FBYyxRQUFRO0FBQy9DLGFBQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUVBLFFBQUksb0JBQW9CO0FBQ3hCLFFBQUksb0JBQW9CO0FBQ3hCLFFBQUksb0JBQW9CO0FBQ3hCLFFBQUksSUFBSTtBQUNSLFFBQUksSUFBSTtBQUNSLFFBQUksS0FBSyxXQUFXLEdBQUc7QUFDckIsWUFBTSxVQUFVLEtBQUtJLEdBQVcsWUFBWTtBQUM1QyxlQUFTLElBQUksR0FBRyxJQUFJLFFBQVEsZUFBZSxHQUFHLEtBQUs7QUFDakQsY0FBTSxJQUFJLElBQUk7QUFDZCxZQUFJLElBQUksSUFBSSxRQUFRLGVBQWUsR0FBRztBQUVwQztBQUFBLFFBQ0Y7QUFDQSxjQUFNLGdCQUFnQixRQUFRLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFDN0MsY0FBTSxnQkFBZ0IsUUFBUSxVQUFVLElBQUksR0FBRyxDQUFDLENBQUM7QUFDakQsY0FBTSxnQkFBZ0IsUUFBUSxVQUFVLElBQUksR0FBRyxDQUFDLENBQUM7QUFDakQsY0FBTSxTQUFTLEtBQUtzQjtBQUFBLFVBQ2xCO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUNBLFlBQUksR0FBRyxNQUFNLE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxPQUFPLElBQUksR0FBRztBQUFBLFFBQ25ELE9BQU87QUFDTCxjQUFJLE9BQU8sS0FBSyxJQUFJLGtCQUFrQjtBQUNwQywrQkFBbUIsT0FBTyxLQUFLO0FBQy9CLGdCQUFJLE9BQU8sS0FBSztBQUNoQixnQkFBSSxPQUFPLEtBQUs7QUFDaEIsZ0NBQW9CO0FBQ3BCLGdDQUFvQjtBQUNwQixnQ0FBb0I7QUFBQSxVQUN0QjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixPQUFPO0FBQ0wsVUFBSSxlQUFlO0FBQ25CLGlCQUFXLFlBQVksS0FBS3ZCLEdBQWEsT0FBTyxHQUFHO0FBQ2pELHVCQUFlLFNBQVM7QUFDeEI7QUFBQSxNQUNGO0FBRUEsZUFBUyxJQUFJLEdBQUcsSUFBSSxJQUFJLGNBQWMsS0FBSyxjQUFjO0FBQ3ZELGNBQU0sZ0JBQWdCO0FBQ3RCLGNBQU0sZ0JBQWdCLElBQUk7QUFDMUIsY0FBTSxnQkFBZ0IsSUFBSTtBQUMxQixjQUFNLFNBQVMsS0FBS3VCO0FBQUEsVUFDbEI7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNGO0FBQ0EsWUFBSSxPQUFPLFVBQVUsR0FBRyxRQUFRLE9BQU8sSUFBSSxHQUFHO0FBQzVDLGdCQUFNLElBQUksT0FBTyxLQUFLO0FBQ3RCLGNBQUksSUFBSSxrQkFBa0I7QUFDeEIsK0JBQW1CO0FBQ25CLGdCQUFJLE9BQU8sS0FBSztBQUNoQixnQkFBSSxPQUFPLEtBQUs7QUFDaEIsZ0NBQW9CO0FBQ3BCLGdDQUFvQjtBQUNwQixnQ0FBb0I7QUFBQSxVQUN0QjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFFBQUkscUJBQXFCLE9BQU8sV0FBVztBQUN6QyxhQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFDQSxVQUFNLG9DQUFvQyxRQUFRO0FBQUEsTUFDaEQsUUFBUSxJQUFJLG1CQUFtQixTQUFTO0FBQUEsTUFDeEMsUUFBUSxJQUFJLG1CQUFtQixTQUFTO0FBQUEsTUFDeEMsUUFBUSxJQUFJLG1CQUFtQixTQUFTO0FBQUEsSUFDMUM7QUFDQSxXQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixNQUFNO0FBQUEsUUFDSixHQUFHO0FBQUEsUUFDSDtBQUFBLFFBQ0E7QUFBQSxRQUNBLFVBQVU7QUFBQSxNQUNaO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWlCUUEsR0FDTixVQUNBLFNBQ0EsR0FDQSxlQUNBLGVBQ0EsZUFDQSxxQkFDQSxvQkFDQSxjQUNBLGVBQ2U7QUFDZixRQUFJLGVBQWU7QUFDakIsWUFBTSxpQkFBaUIsS0FBS3ZCLEdBQWEsSUFBSSxnQkFBZ0IsT0FBTyxHQUFHO0FBQ3ZFLFVBQUksZ0JBQWdCO0FBQ2xCLGNBQU0sU0FBUyxlQUFlLFFBQVEsR0FBRyxDQUFDLENBQUM7QUFDM0MsWUFBSSxPQUFPLElBQUksT0FBTyxJQUFJLGdCQUFnQixDQUFDLHFCQUFxQjtBQUM5RCxpQkFBTztBQUFBLFlBQ0wsUUFBUTtBQUFBLFVBQ1Y7QUFBQSxRQUNGO0FBQ0EsWUFBSSxPQUFPLElBQUksT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CO0FBQzlELGlCQUFPO0FBQUEsWUFDTCxRQUFRO0FBQUEsVUFDVjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFVBQU0sbUJBQW1CLEtBQUtBLEdBQWEsSUFBSSxnQkFBZ0IsU0FBUyxHQUFHO0FBQzNFLFVBQU0sV0FBVyxpQkFBaUIsUUFBUSxlQUFlLENBQUMsQ0FBQztBQUMzRCxVQUFNLFdBQVcsaUJBQWlCLFFBQVEsZUFBZSxDQUFDLENBQUM7QUFDM0QsVUFBTSxXQUFXLGlCQUFpQixRQUFRLGVBQWUsQ0FBQyxDQUFDO0FBRTNELFVBQU0sS0FBSyxlQUFlLEtBQUs7QUFDL0IsVUFBTSxLQUFLLGVBQWUsS0FBSztBQUMvQixVQUFNLE9BQU8sZUFBZSxLQUFLO0FBQ2pDLFVBQU0sT0FBTyxlQUFlLEtBQUs7QUFDakMsVUFBTSxPQUFPLGVBQWUsS0FBSztBQUVqQyxRQUFJLElBQUk7QUFDUixRQUFJLElBQUk7QUFFUixtQkFBZSxXQUFXLFVBQVUsVUFBVSxFQUFFO0FBQ2hELG1CQUFlLFdBQVcsVUFBVSxVQUFVLEVBQUU7QUFFaEQsbUJBQWUsUUFBUSxTQUFTLElBQUksSUFBSTtBQUN4QyxVQUFNLE1BQU0sUUFBUSxJQUFJLElBQUksSUFBSTtBQUVoQyxRQUFJLE1BQU0sTUFBUTtBQUNoQixxQkFBZSxXQUFXLFVBQVUsVUFBVSxJQUFJO0FBQ2xELFVBQUksUUFBUSxJQUFJLE1BQU0sSUFBSTtBQUMxQixVQUFJLElBQUksS0FBTyxJQUFJLEtBQUs7QUFDdEIsZUFBTztBQUFBLFVBQ0wsUUFBUTtBQUFBLFFBQ1Y7QUFBQSxNQUNGO0FBQ0EscUJBQWUsUUFBUSxNQUFNLElBQUksSUFBSTtBQUNyQyxVQUFJLFFBQVEsSUFBSSxTQUFTLElBQUk7QUFDN0IsVUFBSSxJQUFJLEtBQU8sSUFBSSxJQUFJLEtBQUs7QUFDMUIsZUFBTztBQUFBLFVBQ0wsUUFBUTtBQUFBLFFBQ1Y7QUFBQSxNQUNGO0FBQUEsSUFDRixXQUFXLE1BQU0sT0FBUztBQUN4QixxQkFBZSxXQUFXLFVBQVUsVUFBVSxJQUFJO0FBQ2xELFVBQUksUUFBUSxJQUFJLE1BQU0sSUFBSTtBQUMxQixVQUFJLElBQUksS0FBTyxJQUFJLEtBQUs7QUFDdEIsZUFBTztBQUFBLFVBQ0wsUUFBUTtBQUFBLFFBQ1Y7QUFBQSxNQUNGO0FBQ0EscUJBQWUsUUFBUSxNQUFNLElBQUksSUFBSTtBQUNyQyxVQUFJLFFBQVEsSUFBSSxTQUFTLElBQUk7QUFDN0IsVUFBSSxJQUFJLEtBQU8sSUFBSSxJQUFJLEtBQUs7QUFDMUIsZUFBTztBQUFBLFVBQ0wsUUFBUTtBQUFBLFFBQ1Y7QUFBQSxNQUNGO0FBQUEsSUFDRixPQUFPO0FBQ0wsYUFBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBRUEsVUFBTSxVQUFVLElBQU07QUFFdEIsUUFBSSxJQUFJLFFBQVEsSUFBSSxJQUFJLElBQUk7QUFDNUIsU0FBSztBQUNMLFNBQUs7QUFDTCxTQUFLO0FBRUwsV0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsTUFBTTtBQUFBLFFBQ0o7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV1F3QixHQUNOLGVBQ0EsZUFDQSxlQUNBLEdBQ0EsR0FDVTtBQUNWLFVBQU0sT0FBTyxJQUFNLElBQUk7QUFFdkIsVUFBTSxtQkFBbUIsS0FBS3hCLEdBQWEsSUFBSSxnQkFBZ0IsU0FBUyxHQUFHO0FBQzNFLFVBQU0sV0FBVyxpQkFBaUIsUUFBUSxlQUFlLENBQUMsQ0FBQztBQUMzRCxVQUFNLFdBQVcsaUJBQWlCLFFBQVEsZUFBZSxDQUFDLENBQUM7QUFDM0QsVUFBTSxXQUFXLGlCQUFpQixRQUFRLGVBQWUsQ0FBQyxDQUFDO0FBRTNELFVBQU0sT0FBTyxRQUFRLFNBQVMsVUFBVSxJQUFJO0FBQzVDLFVBQU0sT0FBTyxRQUFRLFNBQVMsVUFBVSxDQUFDO0FBQ3pDLFVBQU0sT0FBTyxRQUFRLFNBQVMsVUFBVSxDQUFDO0FBQ3pDLFVBQU0scUJBQXFCLGVBQWUsS0FBSyxFQUFFLElBQUksSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFLElBQUksSUFBSTtBQUM3RSxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBN3RDYSxXQVVJb0IsS0FBMEI7QUFWOUIsV0FrQklELEtBQXFDLENBQUM7QUFsQjFDLFdBc0JJTCxLQUFzRCxvQkFBSSxJQUFJO0FBdEJsRSxXQXVCSUMsS0FBbUQsb0JBQUksSUFBSTtBQXZCL0QsV0F3QklPLEtBQTJCO0FBeEIvQixXQTBCSUQsS0FBOEIsZUFBZSxLQUFLO0FBMUJ0RCxXQThCSUwsS0FBdUI7QUE5QmpDLElBQU0sWUFBTjsiLAogICJuYW1lcyI6IFsiX19tb2RlIiwgIl9fbWF0ZXJpYWxWYXJpYW50cyIsICJfX2N1cnJlbnRWYXJpYW50TmFtZSIsICJfX2F0dHJpYnV0ZXMiLCAiX19vSW5kaWNlcyIsICJfX3ByaW1pdGl2ZVVpZCIsICJfX2FhYmIiLCAiX190YXJnZXRzIiwgIl9fbXVsdGlEcmF3RW50cnlJbmRleCIsICJfX2xhdGVzdFBvc2l0aW9uQWNjZXNzb3JWZXJzaW9uIiwgIl9fcG9zaXRpb25BY2Nlc3NvclZlcnNpb24iLCAiX19maW5nZXJQcmludCIsICJfX2VuZ2luZSIsICJfX2RlZmF1bHRNYXRlcmlhbCIsICJfX21hdGVyaWFsIiwgIl9fbXVsdGlEcmF3R3JvdXAiLCAiX192ZXJ0ZXhIYW5kbGVzIiwgIl9fcHJpbWl0aXZlVWlkSWR4SGFzTW9ycGgiLCAiX19pZHhQcmltaXRpdmVVaWRIYXNNb3JwaCIsICJfX3ZhcmlhbnRVcGRhdGVDb3VudCIsICJfX2ludmFsaWRhdGVNdWx0aURyYXdHcm91cCIsICJfX21lc2giLCAiX19wcmltaXRpdmVzIiwgIl9fcHJpbWl0aXZlQ291bnQiLCAiX190bXBWZWMzXzAiLCAiX19wcmltaXRpdmVDb3VudEhhc01vcnBoIiwgIl9fY2FzdFJheUlubmVyVG9tYXNNb2xsZXIiLCAiX19jYWxjTm9ybWFsRnJvbVVWIl0KfQo=
