import {PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import {
  VertexAttributeEnum,
  VertexAttribute,
} from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/RnObject';
import {ComponentTypeEnum, ComponentType} from '../definitions/ComponentType';
import MemoryManager from '../core/MemoryManager';
import {
  CompositionType,
  CompositionTypeEnum,
} from '../definitions/CompositionType';
import AABB from '../math/AABB';
import Material from '../materials/core/Material';
import MaterialHelper from '../helpers/MaterialHelper';
import {VertexHandles} from '../../webgl/WebGLResourceRepository';
import CGAPIResourceRepository from '../renderer/CGAPIResourceRepository';
import {PrimitiveUID, TypedArray, Count, Index} from '../../types/CommonTypes';
import Vector3 from '../math/Vector3';
import Matrix33 from '../math/Matrix33';
import MutableMatrix33 from '../math/MutableMatrix33';
import MutableVector3 from '../math/MutableVector3';
import {Is as is} from '../misc/Is';

export type Attributes = Map<VertexAttributeEnum, Accessor>;

export default class Primitive extends RnObject {
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
  private __inverseArenbergMatrix: Matrix33[] = [];
  private __arenberg3rdPosition: Vector3[] = [];

  private static __tmpVec3_0: MutableVector3 = MutableVector3.zero();

  constructor() {
    super();
  }

  set material(mat: Material) {
    this.__material = mat;
  }

  get material() {
    return this.__material;
  }

  _backupMaterial() {
    this._prevMaterial = this.__material;
  }

  _restoreMaterial() {
    this.__material = this._prevMaterial;
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

  static createPrimitive({
    indices,
    attributeCompositionTypes,
    attributeSemantics,
    attributes,
    material,
    primitiveMode,
  }: {
    indices?: TypedArray;
    attributeCompositionTypes: Array<CompositionTypeEnum>;
    attributeSemantics: Array<VertexAttributeEnum>;
    attributes: Array<TypedArray>;
    primitiveMode: PrimitiveModeEnum;
    material?: Material;
  }) {
    let sumOfAttributesByteSize = 0;
    attributes.forEach(attribute => {
      sumOfAttributesByteSize += attribute.byteLength;
    });

    let bufferSize = sumOfAttributesByteSize;
    if (indices != null) {
      bufferSize += indices.byteLength;
    }

    const primitive = new Primitive();
    const buffer = MemoryManager.getInstance().createBufferOnDemand(
      bufferSize,
      primitive,
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

    attributes.forEach((attribute, i) => {
      attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
      const accessor: Accessor = attributesBufferView.takeAccessor({
        compositionType: attributeCompositionTypes[i],
        componentType: ComponentType.fromTypedArray(attributes[i]),
        count:
          attribute.byteLength /
          attributeCompositionTypes[i].getNumberOfComponents() /
          attributeComponentTypes[i].getSizeInBytes(),
      });
      accessor.copyFromTypedArray(attribute);
      attributeAccessors.push(accessor);
    });

    const attributeMap: Map<VertexAttributeEnum, Accessor> = new Map();
    for (let i = 0; i < attributeSemantics.length; i++) {
      attributeMap.set(attributeSemantics[i], attributeAccessors[i]);
    }

    primitive.setData(attributeMap, primitiveMode, material, indicesAccessor);
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

  getVertexCountAsVerticesBased() {
    const positionAccessor = this.__attributes.get(VertexAttribute.Position);
    return positionAccessor!.elementCount;
  }

  getTriangleCountAsIndicesBased() {
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

  getTriangleCountAsVerticesBased() {
    const positionAccessor = this.__attributes.get(VertexAttribute.Position)!;
    switch (this.__mode) {
      case PrimitiveMode.Triangles:
        return positionAccessor.elementCount / 3;
      case PrimitiveMode.TriangleStrip:
        return positionAccessor.elementCount - 2;
      case PrimitiveMode.TriangleFan:
        return positionAccessor.elementCount - 2;
      default:
        return 0;
    }
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

  getAttribute(semantic: VertexAttributeEnum) {
    return this.__attributes.get(semantic);
  }

  get attributeSemantics(): Array<VertexAttributeEnum> {
    const semantics: Array<VertexAttributeEnum> = [];
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

  get isPositionAccessorUpdated(): boolean {
    const positionAccessor = this.__attributes.get(VertexAttribute.Position);
    return positionAccessor?.isMinMaxDirty || false;
  }

  get AABB() {
    if (this.__aabb.isVanilla() || this.isPositionAccessorUpdated) {
      const positionAccessor = this.__attributes.get(VertexAttribute.Position)!;

      if (positionAccessor.isMinMaxDirty) {
        positionAccessor.calcMinMax();
      }

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
    }

    return this.__aabb;
  }

  setVertexAttribute(accessor: Accessor, vertexSemantics: VertexAttributeEnum) {
    this.__attributes.set(vertexSemantics, accessor);
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
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    this.__vertexHandles = webglResourceRepository.createVertexBufferAndIndexBuffer(
      this
    );

    return true;
  }

  update3DAPIVertexData() {
    const vertexHandles = this.__vertexHandles as VertexHandles;
    if (!is.exist(this.__vertexHandles)) {
      return false;
    }

    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
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
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    webglResourceRepository.deleteVertexDataResources(this.__vertexHandles);
    this.__vertexHandles = undefined;

    return true;
  }

  get vertexHandles() {
    return this.__vertexHandles;
  }

  castRay(
    origVec3: Vector3,
    dirVec3: Vector3,
    isFrontFacePickable: boolean,
    isBackFacePickable: boolean,
    dotThreshold: number,
    hasFaceNormal: boolean
  ) {
    let currentShortestT = Number.MAX_VALUE;
    let currentShortestIntersectedPosVec3 = null;

    const positionAccessor = this.__attributes.get(VertexAttribute.Position)!;
    // const positionElementNumPerVertex = this._vertices.components.position;
    let incrementNum = 3; // gl.TRIANGLES
    if (this.__mode === PrimitiveMode.TriangleStrip) {
      // gl.TRIANGLE_STRIP
      incrementNum = 1;
    } else if (this.__mode === PrimitiveMode.Points) {
      return {currentShortestIntersectedPosVec3, currentShortestT};
    }

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

        const result = this.__castRayInner(
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
        if (result === null) {
          continue;
        }
        const t = result[0];
        if (result[0] < currentShortestT) {
          currentShortestT = t;
          currentShortestIntersectedPosVec3 = result[1];
        }
      }
    } else {
      for (let i = 0; i < positionAccessor.elementCount; i += incrementNum) {
        const pos0IndexBase = i;
        const pos1IndexBase = i + 1;
        const pos2IndexBase = i + 2;

        const result = this.__castRayInner(
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
        if (result === null) {
          continue;
        }
        const t = result[0];
        if (result[0] < currentShortestT) {
          currentShortestT = t;
          currentShortestIntersectedPosVec3 = result[1];
        }
      }
    }

    return {currentShortestIntersectedPosVec3, currentShortestT};
  }

  private __castRayInner(
    origVec3: Vector3,
    dirVec3: Vector3,
    i: Index,
    pos0IndexBase: Index,
    pos1IndexBase: Index,
    pos2IndexBase: Index,
    isFrontFacePickable: boolean,
    isBackFacePickable: boolean,
    dotThreshold: number,
    hasFaceNormal: boolean
  ): any[] | null {
    if (!this.__arenberg3rdPosition[i]) {
      return null;
    }

    if (hasFaceNormal) {
      const normalAccessor = this.__attributes.get(VertexAttribute.Normal);
      if (normalAccessor) {
        const normal = normalAccessor.getVec3(i, {});
        if (normal.dot(dirVec3) < dotThreshold && !isFrontFacePickable) {
          return null;
        }
        if (normal.dot(dirVec3) > -dotThreshold && !isBackFacePickable) {
          return null;
        }
      }
    }

    const vec3 = Vector3.subtract(origVec3, this.__arenberg3rdPosition[i]);
    const convertedOrigVec3 = this.__inverseArenbergMatrix[i].multiplyVector(
      vec3
    );
    const convertedDirVec3 = this.__inverseArenbergMatrix[i].multiplyVector(
      dirVec3
    );

    if (convertedDirVec3.z >= -1e-6 && convertedDirVec3.z <= 1e-6) {
      return null;
    }

    const t = -convertedOrigVec3.z / convertedDirVec3.z;

    if (t <= 1e-5) {
      return null;
    }

    const u = convertedOrigVec3.x + t * convertedDirVec3.x;
    const v = convertedOrigVec3.y + t * convertedDirVec3.y;
    if (u < 0.0 || v < 0.0 || u + v > 1.0) {
      return null;
    }

    const fDat = 1.0 - u - v;

    const positionAccessor = this.__attributes.get(VertexAttribute.Position)!;
    const pos0Vec3 = positionAccessor.getVec3(pos0IndexBase, {});
    const pos1Vec3 = positionAccessor.getVec3(pos1IndexBase, {});
    const pos2Vec3 = positionAccessor.getVec3(pos2IndexBase, {});

    const pos0 = Vector3.multiply(pos0Vec3, u);
    const pos1 = Vector3.multiply(pos1Vec3, v);
    const pos2 = Vector3.multiply(pos2Vec3, fDat);
    const intersectedPosVec3 = MutableVector3.zero()
      .add(pos0)
      .add(pos1)
      .add(pos2);

    return [t, intersectedPosVec3];
  }

  _calcArenbergInverseMatrices() {
    if (this.__inverseArenbergMatrix.length != 0) {
      return;
    }

    const positionAccessor = this.__attributes.get(VertexAttribute.Position)!;

    let incrementNum = 3; // gl.TRIANGLES
    if (this.__mode === PrimitiveMode.TriangleStrip) {
      // gl.TRIANGLE_STRIP
      incrementNum = 1;
    } else if (this.__mode === PrimitiveMode.Points) {
      return;
    }

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

        this._calcArenbergMatrixFor3Vertices(
          i,
          pos0IndexBase,
          pos1IndexBase,
          pos2IndexBase
        );
      }
    } else {
      for (
        let i = 0;
        i < positionAccessor.elementCount - 2;
        i += incrementNum
      ) {
        const pos0IndexBase = i;
        const pos1IndexBase = i + 1;
        const pos2IndexBase = i + 2;

        this._calcArenbergMatrixFor3Vertices(
          i,
          pos0IndexBase,
          pos1IndexBase,
          pos2IndexBase
        );
      }
    }
  }

  _calcArenbergMatrixFor3Vertices(
    i: Index,
    pos0IndexBase: Index,
    pos1IndexBase: Index,
    pos2IndexBase: Index
  ) {
    const positionAccessor = this.__attributes.get(VertexAttribute.Position)!;
    const pos0Vec3 = positionAccessor.getVec3(pos0IndexBase, {});
    const pos1Vec3 = positionAccessor.getVec3(pos1IndexBase, {});
    const pos2Vec3 = positionAccessor.getVec3(pos2IndexBase, {});

    const ax = pos0Vec3.x - pos2Vec3.x;
    const ay = pos0Vec3.y - pos2Vec3.y;
    const az = pos0Vec3.z - pos2Vec3.z;
    const bx = pos1Vec3.x - pos2Vec3.x;
    const by = pos1Vec3.y - pos2Vec3.y;
    const bz = pos1Vec3.z - pos2Vec3.z;

    let nx = ay * bz - az * by;
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;
    let da = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (da <= 1e-6) {
      da = 0.0001;
    }
    da = 1.0 / da;
    nx *= da;
    ny *= da;
    nz *= da;

    const arenbergMatrix = new MutableMatrix33(
      pos0Vec3.x - pos2Vec3.x,
      pos1Vec3.x - pos2Vec3.x,
      nx - pos2Vec3.x,
      pos0Vec3.y - pos2Vec3.y,
      pos1Vec3.y - pos2Vec3.y,
      ny - pos2Vec3.y,
      pos0Vec3.z - pos2Vec3.z,
      pos1Vec3.z - pos2Vec3.z,
      nz - pos2Vec3.z
    );

    const inverseArenbergMatrix = arenbergMatrix.invert();

    this.__inverseArenbergMatrix[i] = inverseArenbergMatrix;
    this.__arenberg3rdPosition[i] = pos2Vec3;
  }
}
