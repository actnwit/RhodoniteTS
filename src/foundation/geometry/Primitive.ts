import { PrimitiveMode, PrimitiveModeEnum } from '../definitions/PrimitiveMode';
import {
  VertexAttribute,
  VertexAttributeSemanticsJoinedString,
} from '../definitions/VertexAttribute';
import { Accessor } from '../memory/Accessor';
import { RnObject } from '../core/RnObject';
import { ComponentTypeEnum, ComponentType } from '../definitions/ComponentType';
import { MemoryManager } from '../core/MemoryManager';
import { CompositionType, CompositionTypeEnum } from '../definitions/CompositionType';
import { AABB } from '../math/AABB';
import { Material } from '../materials/core/Material';
import { MaterialHelper } from '../helpers/MaterialHelper';
import { VertexHandles } from '../../webgl/WebGLResourceRepository';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import { PrimitiveUID, TypedArray, Count, Index } from '../../types/CommonTypes';
import { Vector3 } from '../math/Vector3';
import { MutableVector3 } from '../math/MutableVector3';
import { Is } from '../misc/Is';
import { IVector3 } from '../math/IVector';
import {
  IMesh,
  PrimitiveSortKey,
  PrimitiveSortKeyLength,
  PrimitiveSortKeyOffset,
  PrimitiveSortKey_BitLength_Material,
  PrimitiveSortKey_BitLength_PrimitiveType,
  PrimitiveSortKey_BitLength_TranslucencyType,
  PrimitiveSortKey_BitOffset_Material,
  PrimitiveSortKey_BitOffset_PrimitiveType,
  PrimitiveSortKey_BitOffset_TranslucencyType,
  RaycastResult,
  RaycastResultEx1,
} from './types/GeometryTypes';
import { IOption, None, Some, Option } from '../misc/Option';
import { DataUtil } from '../misc/DataUtil';
import { Config } from '../core/Config';
import { isErr } from '../misc/Result';
import { RnException } from '../misc/RnException';
import { Mesh } from './Mesh';

export type Attributes = Map<VertexAttributeSemanticsJoinedString, Accessor>;

export interface IAnyPrimitiveDescriptor {
  /** attach a rhodonite material to this plane(the default material is the classicUberMaterial */
  material?: Material;
}

export interface PrimitiveDescriptor extends IAnyPrimitiveDescriptor {
  attributes: TypedArray[];
  attributeSemantics: VertexAttributeSemanticsJoinedString[];
  primitiveMode: PrimitiveModeEnum;
  indices?: TypedArray;
}

export class Primitive extends RnObject {
  private __mode: PrimitiveModeEnum = PrimitiveMode.Unknown;
  private static __defaultMaterial?: Material;
  private __material: Material;
  private __materialVariants: Map<string, Material> = new Map();
  private __currentVariantName = '';
  public _prevMaterial: Material;
  private __attributes: Attributes = new Map();
  private __oIndices: IOption<Accessor> = new None();
  private static __primitiveCount: Count = 0;
  private __primitiveUid: PrimitiveUID = -1; // start ID from zero
  private __aabb = new AABB();
  private __targets: Array<Attributes> = [];
  private __vertexHandles?: VertexHandles;
  private __mesh?: Mesh;
  private static __primitives: Primitive[] = [];
  public _sortkey: PrimitiveSortKey = 0;
  public _viewDepth = 0;

  private static __primitiveUidIdxHasMorph: Map<PrimitiveUID, Index> = new Map();
  private static __idxPrimitiveUidHasMorph: Map<Index, Primitive> = new Map();
  private static __primitiveCountHasMorph = 0;

  private static __tmpVec3_0: MutableVector3 = MutableVector3.zero();

  private __latestPositionAccessorVersion = 0;
  private __positionAccessorVersion = 0;
  private static __variantUpdateCount = 0;

  constructor() {
    super();

    if (Primitive.__defaultMaterial == null) {
      Primitive.__defaultMaterial = MaterialHelper.createClassicUberMaterial({
        isSkinning: true,
        isLighting: true,
      });
    }

    this.__material = Primitive.__defaultMaterial;
    this._prevMaterial = Primitive.__defaultMaterial;
  }

  static getPrimitiveIdxHasMorph(primitiveUid: PrimitiveUID): Index | undefined {
    return this.__primitiveUidIdxHasMorph.get(primitiveUid);
  }

  static getPrimitiveHasMorph(primitiveIdx: Index): Primitive | undefined {
    return this.__idxPrimitiveUidHasMorph.get(primitiveIdx);
  }

  getIndexBitSize(): 'uint16' | 'uint32' {
    const indexAccessor = this.__oIndices.unwrapOrUndefined();
    if (indexAccessor == null) {
      throw new Error('indexAccessor is null');
    } else {
      if (indexAccessor.componentType === ComponentType.UnsignedShort) {
        return 'uint16';
      } else if (indexAccessor.componentType === ComponentType.UnsignedInt) {
        return 'uint32';
      } else if (indexAccessor.componentType === ComponentType.UnsignedByte) {
        return 'uint16';
      } else {
        throw new Error('unknown indexAccessor.componentType');
      }
    }
  }

  get _vertexHandles() {
    return this.__vertexHandles;
  }

  static get variantUpdateCount() {
    return this.__variantUpdateCount;
  }

  setMaterialVariant(variantName: string, material: Material) {
    this.__materialVariants.set(variantName, material);
    Primitive.__variantUpdateCount++;
  }

  applyMaterialVariant(variantName: string) {
    const variant = this.__materialVariants.get(variantName);
    if (variant) {
      this.material = variant;
      this.__currentVariantName = variantName;
      Primitive.__variantUpdateCount++;
    }
  }

  getCurrentVariantName() {
    for (const [name, material] of this.__materialVariants) {
      if (material === this.__material) {
        return name;
      }
    }
    return '';
  }

  getVariantNames() {
    return Array.from(this.__materialVariants.keys());
  }

  getVariantMaterial(variantName: string) {
    return this.__materialVariants.get(variantName);
  }

  set material(mat: Material) {
    this.__material = mat;
    this.setSortKey(
      PrimitiveSortKey_BitOffset_Material,
      PrimitiveSortKey_BitLength_Material,
      mat.materialUID
    );

    let translucencyType = 0; // opaque
    if (mat.isTranslucentOpaque()) {
      translucencyType = 1; // translucent
    } else if (mat.isBlend()) {
      translucencyType = 2; // blend
    }
    this.setSortKey(
      PrimitiveSortKey_BitOffset_TranslucencyType,
      PrimitiveSortKey_BitLength_TranslucencyType,
      translucencyType
    );
    mat._addBelongPrimitive(this);
  }

  get material() {
    return this.__material;
  }

  setSortKey(offset: PrimitiveSortKeyOffset, length: PrimitiveSortKeyLength, value: number) {
    const offsetValue = value << offset;
    this._sortkey |= offsetValue;

    // Creates a mask with the specified bit length
    let mask = (1 << length) - 1;
    // Clear designated offset bits
    this._sortkey &= ~(mask << offset);
    // Writes a value to the specified offset
    this._sortkey |= (value & mask) << offset;
  }

  /**
   * belong to mesh (weak reference)
   * @param mesh
   */
  _belongToMesh(mesh: Mesh) {
    // this.setSortKey(PrimitiveSortKey_BitOffset_Mesh, mesh.meshUID);
    this.__mesh = mesh;
  }

  get mesh(): IMesh | undefined {
    return this.__mesh;
  }

  _backupMaterial() {
    this._prevMaterial = this.__material;
  }

  _restoreMaterial() {
    this.__material = this._prevMaterial;
  }

  static getPrimitive(primitiveUid: PrimitiveUID) {
    return this.__primitives[primitiveUid];
  }

  static getPrimitiveCount() {
    return this.__primitiveCount;
  }

  onAccessorUpdated(accessorVersion: number) {
    this.__positionAccessorVersion = accessorVersion;
    if (this.__mesh != null) {
      this.__mesh._onPrimitivePositionUpdated();
    }
  }

  setData(
    attributes: Attributes,
    mode: PrimitiveModeEnum,
    material?: Material,
    indicesAccessor?: Accessor
  ) {
    this.__oIndices = new Option(indicesAccessor);
    this.__attributes = attributes;

    const positionAccessor = this.__attributes.get(VertexAttribute.Position.XYZ)!;
    positionAccessor._primitive = this;

    if (material != null) {
      this.material = material;
    } else {
      this.material = MaterialHelper.createClassicUberMaterial({
        isSkinning: true,
        isLighting: true,
      });
    }
    this.__mode = mode;
    this.setSortKey(
      PrimitiveSortKey_BitOffset_PrimitiveType,
      PrimitiveSortKey_BitLength_PrimitiveType,
      mode.index
    );

    this.__primitiveUid = Primitive.__primitiveCount++;
    Primitive.__primitives[this.__primitiveUid] = this;
  }

  static get maxPrimitiveCount() {
    return 500;
  }

  copyVertexData({
    attributes,
    attributeSemantics,
    primitiveMode,
    indices,
    material,
  }: PrimitiveDescriptor) {
    let sumOfAttributesByteSize = 0;
    const byteAlign = 4;
    attributes.forEach((attribute) => {
      sumOfAttributesByteSize += attribute.byteLength;
    });

    let bufferSize = sumOfAttributesByteSize;
    if (indices != null) {
      bufferSize += DataUtil.addPaddingBytes(indices.byteLength, byteAlign);
    }

    const buffer = MemoryManager.getInstance().createBufferOnDemand(bufferSize, this, byteAlign);

    let indicesComponentType;
    let indicesAccessor;
    if (indices != null) {
      indicesComponentType = ComponentType.fromTypedArray(indices);
      const indicesBufferViewResult = buffer.takeBufferView({
        byteLengthToNeed: indices.byteLength,
        byteStride: 0,
      });
      if (isErr(indicesBufferViewResult)) {
        throw new RnException(indicesBufferViewResult.getRnError());
      }
      const indicesAccessorResult = indicesBufferViewResult.get().takeAccessor({
        compositionType: CompositionType.Scalar,
        componentType: indicesComponentType,
        count: indices.byteLength / indicesComponentType.getSizeInBytes(),
      });
      if (isErr(indicesAccessorResult)) {
        throw new RnException(indicesAccessorResult.getRnError());
      }
      indicesAccessor = indicesAccessorResult.get();
      // copy indices
      for (let i = 0; i < indices!.byteLength / indicesAccessor!.componentSizeInBytes; i++) {
        indicesAccessor!.setScalar(i, indices![i], {});
      }
    }

    const attributesBufferView = buffer
      .takeBufferView({
        byteLengthToNeed: sumOfAttributesByteSize,
        byteStride: 0,
      })
      .unwrapForce();

    const attributeAccessors: Array<Accessor> = [];
    const attributeComponentTypes: Array<ComponentTypeEnum> = [];

    attributes.forEach((typedArray, i) => {
      const compositionType = CompositionType.vectorFrom(
        VertexAttribute.toVectorComponentN(attributeSemantics[i])
      );
      attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
      const accessor: Accessor = attributesBufferView
        .takeAccessor({
          compositionType,
          componentType: ComponentType.fromTypedArray(attributes[i]),
          count:
            typedArray.byteLength /
            compositionType.getNumberOfComponents() /
            attributeComponentTypes[i].getSizeInBytes(),
        })
        .unwrapForce();
      accessor.copyFromTypedArray(typedArray);
      attributeAccessors.push(accessor);
    });

    const attributeMap: Map<VertexAttributeSemanticsJoinedString, Accessor> = new Map();
    for (let i = 0; i < attributeSemantics.length; i++) {
      const attributeSemantic = attributeSemantics[i];
      attributeMap.set(attributeSemantic, attributeAccessors[i]);
    }

    this.setData(attributeMap, primitiveMode, material, indicesAccessor);
  }

  static createPrimitive(desc: PrimitiveDescriptor) {
    const primitive = new Primitive();
    primitive.copyVertexData(desc);
    return primitive;
  }

  get indicesAccessor(): Accessor | undefined {
    return this.__oIndices.unwrapOrUndefined();
  }

  getVertexCountAsIndicesBased() {
    if (this.indicesAccessor) {
      return this.indicesAccessor.elementCount;
    } else {
      return this.getVertexCountAsVerticesBased();
    }
  }

  getVertexCountAsVerticesBased(): Count {
    for (const accessor of this.__attributes.values()) {
      return accessor.elementCount;
    }
    return 0;
  }

  getTriangleCountAsIndicesBased(): Count {
    if (this.indicesAccessor) {
      switch (this.__mode) {
        case PrimitiveMode.Triangles:
          return this.indicesAccessor.elementCount / 3;
        case PrimitiveMode.TriangleStrip:
          return this.indicesAccessor.elementCount - 2;
        case PrimitiveMode.TriangleFan:
          return this.indicesAccessor.elementCount - 2;
        default:
          return 0;
      }
    } else {
      return this.getTriangleCountAsVerticesBased();
    }
  }

  getTriangleCountAsVerticesBased(): Count {
    for (const accessor of this.__attributes.values()) {
      switch (this.__mode) {
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

  hasIndices() {
    return this.__oIndices.has();
  }

  get attributeAccessors(): Array<Accessor> {
    const accessors: Array<Accessor> = [];
    this.__attributes.forEach((accessor, semantic) => {
      accessors.push(accessor);
    });
    return accessors;
  }

  getAttribute(semantic: VertexAttributeSemanticsJoinedString) {
    return this.__attributes.get(semantic);
  }

  get attributeSemantics(): Array<VertexAttributeSemanticsJoinedString> {
    const semantics: Array<VertexAttributeSemanticsJoinedString> = [];
    this.__attributes.forEach((accessor, semantic) => {
      semantics.push(semantic);
    });
    return semantics;
  }

  get attributeEntries() {
    return this.__attributes.entries();
  }

  get attributeCompositionTypes(): Array<CompositionTypeEnum> {
    const types: Array<CompositionTypeEnum> = [];
    this.__attributes.forEach((accessor, semantic) => {
      types.push(accessor.compositionType);
    });

    return types;
  }

  get attributeComponentTypes(): Array<ComponentTypeEnum> {
    const types: Array<ComponentTypeEnum> = [];
    this.__attributes.forEach((accessor, semantic) => {
      types.push(accessor.componentType);
    });

    return types;
  }

  get primitiveMode(): PrimitiveModeEnum {
    return this.__mode;
  }

  get primitiveUid(): PrimitiveUID {
    return this.__primitiveUid;
  }

  get positionAccessorVersion(): number {
    return this.__positionAccessorVersion;
  }

  get AABB() {
    if (
      this.__aabb.isVanilla() ||
      this.positionAccessorVersion !== this.__latestPositionAccessorVersion
    ) {
      const positionAccessor = this.__attributes.get(VertexAttribute.Position.XYZ)!;

      const min = positionAccessor.min as number[];
      this.__aabb.minPoint = Primitive.__tmpVec3_0.setComponents(min[0], min[1], min[2]);
      const max = positionAccessor.max as number[];
      this.__aabb.maxPoint = Primitive.__tmpVec3_0.setComponents(max[0], max[1], max[2]);
      this.__latestPositionAccessorVersion = positionAccessor.version;
    }

    return this.__aabb;
  }

  setVertexAttribute(accessor: Accessor, vertexSemantic: VertexAttributeSemanticsJoinedString) {
    this.__attributes.set(vertexSemantic, accessor);
  }

  removeIndices() {
    this.__oIndices = new None();
  }

  setIndices(accessor: Accessor) {
    this.__oIndices = new Some(accessor);
  }

  setBlendShapeTargets(targets: Array<Attributes>) {
    if (Primitive.__primitiveUidIdxHasMorph.size >= Config.maxVertexPrimitiveNumberInShader) {
      console.error(
        'Primitive.__primitiveUidsHasMorph.size exceeds the Config.maxMorphPrimitiveNumber'
      );
    } else {
      Primitive.__idxPrimitiveUidHasMorph.set(Primitive.__primitiveCountHasMorph, this);
      Primitive.__primitiveUidIdxHasMorph.set(
        this.__primitiveUid,
        Primitive.__primitiveCountHasMorph++
      );
    }

    this.__targets = targets;
  }

  getBlendShapeTargets() {
    return this.__targets.concat();
  }

  get targets(): Array<Attributes> {
    return this.__targets;
  }

  isBlend() {
    if (this.material == null || !this.material.isBlend()) {
      return false;
    } else {
      return true;
    }
  }
  isOpaque() {
    return !this.isBlend();
  }

  create3DAPIVertexData() {
    if (this.__vertexHandles != null) {
      return false;
    }
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    this.__vertexHandles = cgApiResourceRepository.createVertexBufferAndIndexBuffer(this);

    return true;
  }

  update3DAPIVertexData() {
    const vertexHandles = this.__vertexHandles as VertexHandles;
    if (Is.not.exist(this.__vertexHandles)) {
      return false;
    }

    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    cgApiResourceRepository.updateVertexBufferAndIndexBuffer(this, vertexHandles);

    return true;
  }

  delete3DAPIVertexData() {
    if (this.__vertexHandles == null) {
      return false;
    }
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.deleteVertexDataResources(this.__vertexHandles);
    this.__vertexHandles = undefined;

    return true;
  }

  get vertexHandles() {
    return this.__vertexHandles;
  }

  castRay(
    origVec3: IVector3,
    dirVec3: IVector3,
    isFrontFacePickable: boolean,
    isBackFacePickable: boolean,
    dotThreshold: number,
    hasFaceNormal: boolean
  ): RaycastResultEx1 {
    let currentShortestT = Number.MAX_VALUE;
    let incrementNum = 3; // gl.TRIANGLES
    if (this.__mode === PrimitiveMode.TriangleStrip) {
      // gl.TRIANGLE_STRIP
      incrementNum = 1;
    } else if (this.__mode === PrimitiveMode.Points) {
      return {
        result: false,
      };
    }

    let hitPos0IndexBase = 0;
    let hitPos1IndexBase = 0;
    const hitPos2IndexBase = 0;
    let u = 0;
    let v = 0;
    if (this.hasIndices()) {
      const indices = this.__oIndices.unwrapForce();
      for (let i = 0; i < indices.elementCount - 2; i++) {
        const j = i * incrementNum;
        if (j + 2 > indices.elementCount - 1) {
          // gl.TRIANGLES
          break;
        }
        const pos0IndexBase = indices.getScalar(j, {});
        const pos1IndexBase = indices.getScalar(j + 1, {});
        const pos2IndexBase = indices.getScalar(j + 2, {});
        const result = this.__castRayInnerTomasMoller(
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
          continue;
        } else {
          if (result.data.t < currentShortestT) {
            currentShortestT = result.data.t;
            u = result.data.u;
            v = result.data.v;
            hitPos0IndexBase = pos0IndexBase;
            hitPos1IndexBase = pos1IndexBase;
            hitPos0IndexBase = pos2IndexBase;
          }
        }
      }
    } else {
      let elementCount = 0;
      for (const accessor of this.__attributes.values()) {
        elementCount = accessor.elementCount;
        break;
      }

      for (let i = 0; i < elementCount; i += incrementNum) {
        const pos0IndexBase = i;
        const pos1IndexBase = i + 1;
        const pos2IndexBase = i + 2;
        const result = this.__castRayInnerTomasMoller(
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
            hitPos0IndexBase = pos0IndexBase;
            hitPos1IndexBase = pos1IndexBase;
            hitPos0IndexBase = pos2IndexBase;
          }
        }
      }
    }

    if (currentShortestT === Number.MAX_VALUE) {
      return {
        result: false,
      };
    } else {
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
          position: currentShortestIntersectedPosVec3,
        },
      };
    }
  }

  private __castRayInnerTomasMoller(
    origVec3: IVector3,
    dirVec3: IVector3,
    i: Index,
    pos0IndexBase: Index,
    pos1IndexBase: Index,
    pos2IndexBase: Index,
    isFrontFacePickable: boolean,
    isBackFacePickable: boolean,
    dotThreshold: number,
    hasFaceNormal: boolean
  ): RaycastResult {
    if (hasFaceNormal) {
      const normalAccessor = this.__attributes.get(VertexAttribute.Normal.XYZ);
      if (normalAccessor) {
        const normal = normalAccessor.getVec3(i, {});
        if (normal.dot(dirVec3) < dotThreshold && !isFrontFacePickable) {
          return {
            result: false,
          };
        }
        if (normal.dot(dirVec3) > -dotThreshold && !isBackFacePickable) {
          return {
            result: false,
          };
        }
      }
    }

    const positionAccessor = this.__attributes.get(VertexAttribute.Position.XYZ)!;
    const pos0Vec3 = positionAccessor.getVec3(pos0IndexBase, {});
    const pos1Vec3 = positionAccessor.getVec3(pos1IndexBase, {});
    const pos2Vec3 = positionAccessor.getVec3(pos2IndexBase, {});

    const e1 = MutableVector3.zero();
    const e2 = MutableVector3.zero();
    const pvec = MutableVector3.zero();
    const tvec = MutableVector3.zero();
    const qvec = MutableVector3.zero();

    let u = 0,
      v = 0;

    MutableVector3.subtractTo(pos1Vec3, pos0Vec3, e1);
    MutableVector3.subtractTo(pos2Vec3, pos0Vec3, e2);

    MutableVector3.crossTo(dirVec3, e2, pvec);
    const det = Vector3.dot(e1, pvec);

    if (det > 0.0001) {
      MutableVector3.subtractTo(origVec3, pos0Vec3, tvec);
      u = Vector3.dot(tvec, pvec);
      if (u < 0.0 || u > det) {
        return {
          result: false,
        };
      }
      MutableVector3.crossTo(tvec, e1, qvec);
      v = Vector3.dot(dirVec3, qvec);
      if (v < 0.0 || u + v > det) {
        return {
          result: false,
        };
      }
    } else if (det < -0.0001) {
      MutableVector3.subtractTo(origVec3, pos0Vec3, tvec);
      u = Vector3.dot(tvec, pvec);
      if (u > 0.0 || u < det) {
        return {
          result: false,
        };
      }
      MutableVector3.crossTo(tvec, e1, qvec);
      v = Vector3.dot(dirVec3, qvec);
      if (v > 0.0 || u + v < det) {
        return {
          result: false,
        };
      }
    } else {
      return {
        result: false,
      };
    }

    const inv_det = 1.0 / det;

    let t = Vector3.dot(e2, qvec);
    t *= inv_det;
    u *= inv_det;
    v *= inv_det;

    return {
      result: true,
      data: {
        t,
        u,
        v,
      },
    };
  }

  private __calcNormalFromUV(
    pos0IndexBase: Index,
    pos1IndexBase: Index,
    pos2IndexBase: Index,
    u: number,
    v: number
  ): IVector3 {
    const fDat = 1.0 - u - v;

    const positionAccessor = this.__attributes.get(VertexAttribute.Position.XYZ)!;
    const pos0Vec3 = positionAccessor.getVec3(pos0IndexBase, {});
    const pos1Vec3 = positionAccessor.getVec3(pos1IndexBase, {});
    const pos2Vec3 = positionAccessor.getVec3(pos2IndexBase, {});

    const pos0 = Vector3.multiply(pos0Vec3, fDat);
    const pos1 = Vector3.multiply(pos1Vec3, u);
    const pos2 = Vector3.multiply(pos2Vec3, v);
    const intersectedPosVec3 = MutableVector3.zero().add(pos0).add(pos1).add(pos2);
    return intersectedPosVec3;
  }
}
