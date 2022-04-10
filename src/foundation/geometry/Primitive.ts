import {PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import {
  VertexAttribute,
  VertexAttributeSemanticsJoinedString,
} from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/RnObject';
import {ComponentTypeEnum, ComponentType} from '../definitions/ComponentType';
import { MemoryManager } from '../core/MemoryManager';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../definitions/CompositionType';
import AABB from '../math/AABB';
import { Material } from '../materials/core/Material';
import {Material}Helper from '../helpers/MaterialHelper';
import {VertexHandles} from '../../webgl/WebGLResourceRepository';
import CGAPIResourceRepository from '../renderer/CGAPIResourceRepository';
import {PrimitiveUID, TypedArray, Count, Index} from '../../types/CommonTypes';
import { Vector3 } from '../math/Vector3';
import { MutableVector3 } from '../math/MutableVector3';
import {Is} from '../misc/Is';
import {IVector3} from '../math/IVector';
import {
  IMesh,
  PrimitiveSortKey,
  PrimitiveSortKeyOffset,
  PrimitiveSortKey_BitOffset_Material,
  PrimitiveSortKey_BitOffset_TranslucencyType,
  RaycastResult,
  RaycastResultEx1,
} from './types/GeometryTypes';

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
  private __material: Material = MaterialHelper.createEmptyMaterial();
  public _prevMaterial: Material = MaterialHelper.createEmptyMaterial();
  private __attributes: Attributes = new Map();
  private __indices?: Accessor;
  private static __primitiveCount: Count = 0;
  private __primitiveUid: PrimitiveUID = -1; // start ID from zero
  private static __headerAccessor?: Accessor;
  private __aabb = new AABB();
  private __targets: Array<Attributes> = [];
  private __vertexHandles?: VertexHandles;
  private __latestPositionAccessorVersion = 0;
  private __weakRefMesh: WeakMap<Primitive, IMesh> = new WeakMap();
  private static __primitives: Primitive[] = [];
  public _sortkey: PrimitiveSortKey = 0;
  public _viewDepth = 0;

  private static __tmpVec3_0: MutableVector3 = MutableVector3.zero();

  constructor() {
    super();
  }

  set material(mat: Material) {
    this.__material = mat;
    this.setSortKey(PrimitiveSortKey_BitOffset_Material, mat.materialTID);
    this.setSortKey(
      PrimitiveSortKey_BitOffset_TranslucencyType,
      mat.alphaMode.index
    );
    mat._addBelongPrimitive(this);
  }

  get material() {
    return this.__material;
  }

  setSortKey(offset: PrimitiveSortKeyOffset, value: number) {
    const offsetValue = value << offset;
    this._sortkey |= offsetValue;
  }

  /**
   * belong to mesh (weak reference)
   * @param mesh
   */
  _belongToMesh(mesh: IMesh) {
    // this.setSortKey(PrimitiveSortKey_BitOffset_Mesh, mesh.meshUID);
    this.__weakRefMesh.set(this, mesh);
  }

  get mesh(): IMesh | undefined {
    return this.__weakRefMesh.get(this);
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

  setData(
    attributes: Attributes,
    mode: PrimitiveModeEnum,
    material?: Material,
    indicesAccessor?: Accessor
  ) {
    this.__indices = indicesAccessor;
    this.__attributes = attributes;

    if (material != null) {
      this.material = material;
    } else {
      this.material = MaterialHelper.createClassicUberMaterial({
        isSkinning: true,
        isLighting: true,
      });
    }
    this.__mode = mode;

    this.__primitiveUid = Primitive.__primitiveCount++;
    Primitive.__primitives[this.__primitiveUid] = this;

    // if (Primitive.__headerAccessor == null) {
    //   // primitive 0
    //   // prim0.indices.byteOffset, prim0.indices.componentSizeInByte, prim0.indices.indicesLength, null
    //   //   prim0.attrb0.byteOffset, prim0.attrib0.byteStride, prim0.attrib0.compositionN, prim0.attrib0.componentSizeInByte
    //   //   prim0.attrb1.byteOffset, prim0.attrib1.byteStride, prim0.attrib1.compositionN, prim0.attrib1.componentSizeInByte
    //   //   ...
    //   //   prim0.attrb7.byteOffset, prim0.attrib7.byteStride, prim0.attrib7.compositionN, prim0.attrib7.componentSizeInByte
    //   // primitive 1
    //   // prim1.indices.byteOffset, prim1.indices.componentSizeInByte, prim0.indices.indicesLength, null
    //   //   prim1.attrb0.byteOffset, prim1.attrib0.byteStride, prim1.attrib0.compositionN, prim1.attrib0.componentSizeInByte
    //   //   prim1.attrb1.byteOffset, prim1.attrib1.byteStride, prim1.attrib1.compositionN, prim1.attrib1.componentSizeInByte
    //   //   ...
    //   //   prim1.attrb7.byteOffset, prim1.attrib7.byteStride, prim1.attrib7.compositionN, prim1.attrib7.componentSizeInByte

    //   const buffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.UBOGeneric);
    //   const bufferView = buffer.takeBufferView({byteLengthToNeed: ((1*4) + (8*4)) * 4/*byte*/ * Primitive.maxPrimitiveCount, byteStride: 64, isAoS:false });
    //   Primitive.__headerAccessor = bufferView.takeAccessor(
    //     {compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: 9 * Primitive.maxPrimitiveCount})
    // }

    // const attributeNumOfPrimitive = 1/*indices*/ + 8/*vertexAttributes*/;

    // if (this.indicesAccessor != null) {
    //   Primitive.__headerAccessor.setVec4(attributeNumOfPrimitive * this.__primitiveUid + 0 /* 0 means indices */,
    //     this.indicesAccessor.byteOffsetInBuffer, this.indicesAccessor.componentSizeInBytes, this.indicesAccessor.byteLength / this.indicesAccessor.componentSizeInBytes, -1 );
    // } else {
    //   Primitive.__headerAccessor.setVec4(attributeNumOfPrimitive * this.__primitiveUid + 0 /* 0 means indices */, -1, -1, -1, -1 );
    // }

    // this.attributeAccessors.forEach((attributeAccessor, i)=>{
    //   Primitive.__headerAccessor!.setVec4(attributeNumOfPrimitive * this.__primitiveUid + i,
    //     attributeAccessor.byteOffsetInBuffer, attributeAccessor.byteStride, attributeAccessor.numberOfComponents, attributeAccessor.componentSizeInBytes);

    // });
  }

  static get maxPrimitiveCount() {
    return 500;
  }

  static get headerAccessor() {
    return this.__headerAccessor;
  }

  copyVertexData({
    attributes,
    attributeSemantics,
    primitiveMode,
    indices,
    material,
  }: PrimitiveDescriptor) {
    let sumOfAttributesByteSize = 0;
    attributes.forEach(attribute => {
      sumOfAttributesByteSize += attribute.byteLength;
    });

    let bufferSize = sumOfAttributesByteSize;
    if (indices != null) {
      bufferSize += indices.byteLength;
    }

    const buffer = MemoryManager.getInstance().createBufferOnDemand(
      bufferSize,
      this,
      4
    );

    let indicesComponentType;
    let indicesBufferView;
    let indicesAccessor;
    if (indices != null) {
      indicesComponentType = ComponentType.fromTypedArray(indices);
      indicesBufferView = buffer.takeBufferView({
        byteLengthToNeed: indices.byteLength,
        byteStride: 0,
      });
      indicesAccessor = indicesBufferView.takeAccessor({
        compositionType: CompositionType.Scalar,
        componentType: indicesComponentType,
        count: indices.byteLength / indicesComponentType.getSizeInBytes(),
      });
      // copy indices
      for (
        let i = 0;
        i < indices!.byteLength / indicesAccessor!.componentSizeInBytes;
        i++
      ) {
        indicesAccessor!.setScalar(i, indices![i], {});
      }
    }

    const attributesBufferView = buffer.takeBufferView({
      byteLengthToNeed: sumOfAttributesByteSize,
      byteStride: 0,
    });

    const attributeAccessors: Array<Accessor> = [];
    const attributeComponentTypes: Array<ComponentTypeEnum> = [];

    attributes.forEach((typedArray, i) => {
      const compositionType = CompositionType.vectorFrom(
        VertexAttribute.toVectorComponentN(attributeSemantics[i])
      );
      attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
      const accessor: Accessor = attributesBufferView.takeAccessor({
        compositionType,
        componentType: ComponentType.fromTypedArray(attributes[i]),
        count:
          typedArray.byteLength /
          compositionType.getNumberOfComponents() /
          attributeComponentTypes[i].getSizeInBytes(),
      });
      accessor.copyFromTypedArray(typedArray);
      attributeAccessors.push(accessor);
    });

    const attributeMap: Map<VertexAttributeSemanticsJoinedString, Accessor> =
      new Map();
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
    return this.__indices;
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
    return this.__indices != null;
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

  get positionAccessorVersion(): number | undefined {
    const positionAccessor = this.__attributes.get(
      VertexAttribute.Position.XYZ
    );
    if (Is.exist(positionAccessor)) {
      return positionAccessor.version;
    } else {
      return undefined;
    }
  }

  get AABB() {
    if (
      this.__aabb.isVanilla() ||
      this.positionAccessorVersion !== this.__latestPositionAccessorVersion
    ) {
      const positionAccessor = this.__attributes.get(
        VertexAttribute.Position.XYZ
      )!;

      positionAccessor.calcMinMax();

      const min = positionAccessor.min as number[];
      this.__aabb.minPoint = Primitive.__tmpVec3_0.setComponents(
        min[0],
        min[1],
        min[2]
      );
      const max = positionAccessor.max as number[];
      this.__aabb.maxPoint = Primitive.__tmpVec3_0.setComponents(
        max[0],
        max[1],
        max[2]
      );
      this.__latestPositionAccessorVersion = positionAccessor.version;
    }

    return this.__aabb;
  }

  setVertexAttribute(
    accessor: Accessor,
    vertexSemantic: VertexAttributeSemanticsJoinedString
  ) {
    this.__attributes.set(vertexSemantic, accessor);
  }

  removeIndices() {
    this.__indices = undefined;
  }

  setIndices(accessor: Accessor) {
    this.__indices = accessor;
  }

  setTargets(targets: Array<Attributes>) {
    this.__targets = targets;
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
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    this.__vertexHandles =
      webglResourceRepository.createVertexBufferAndIndexBuffer(this);

    return true;
  }

  update3DAPIVertexData() {
    const vertexHandles = this.__vertexHandles as VertexHandles;
    if (!Is.exist(this.__vertexHandles)) {
      return false;
    }

    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.updateVertexBufferAndIndexBuffer(
      this,
      vertexHandles
    );

    return true;
  }

  delete3DAPIVertexData() {
    if (this.__vertexHandles == null) {
      return false;
    }
    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
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
      for (let i = 0; i < this.__indices!.elementCount - 2; i++) {
        const j = i * incrementNum;
        if (j + 2 > this.__indices!.elementCount - 1) {
          // gl.TRIANGLES
          break;
        }
        const pos0IndexBase = this.__indices!.getScalar(j, {});
        const pos1IndexBase = this.__indices!.getScalar(j + 1, {});
        const pos2IndexBase = this.__indices!.getScalar(j + 2, {});
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

    const positionAccessor = this.__attributes.get(
      VertexAttribute.Position.XYZ
    )!;
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

    const positionAccessor = this.__attributes.get(
      VertexAttribute.Position.XYZ
    )!;
    const pos0Vec3 = positionAccessor.getVec3(pos0IndexBase, {});
    const pos1Vec3 = positionAccessor.getVec3(pos1IndexBase, {});
    const pos2Vec3 = positionAccessor.getVec3(pos2IndexBase, {});

    const pos0 = Vector3.multiply(pos0Vec3, fDat);
    const pos1 = Vector3.multiply(pos1Vec3, u);
    const pos2 = Vector3.multiply(pos2Vec3, v);
    const intersectedPosVec3 = MutableVector3.zero()
      .add(pos0)
      .add(pos1)
      .add(pos2);
    return intersectedPosVec3;
  }
}
