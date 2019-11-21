import Primitive from "./Primitive";
import { VertexAttribute } from "../definitions/VertexAttribute";
import { PrimitiveMode } from "../definitions/PrimitiveMode";
import MemoryManager from "../core/MemoryManager";
import { BufferUse } from "../definitions/BufferUse";
import { ComponentType } from "../definitions/ComponentType";
import { CompositionType } from "../definitions/CompositionType";
import Vector3 from "../math/Vector3";
import Accessor from "../memory/Accessor";
import Vector2 from "../math/Vector2";
import AABB from "../math/AABB";
import CGAPIResourceRepository from "../renderer/CGAPIResourceRepository";
import Entity from "../core/Entity";
import { Index, CGAPIResourceHandle, MeshUID } from "../../types/CommonTypes";
import { thisExpression } from "@babel/types";

/**
 * The Mesh class.
 * This mesh object has primitives (geometries) or a reference of 'original mesh'.
 * If the latter, this mesh object is an 'instanced mesh', which has no primitives.
 * Instanced meshes refer original mesh's primitives when drawing.
 */
export default class Mesh {
  private readonly __meshUID: MeshUID;
  public static readonly invalidateMeshUID = -1;
  public static __mesh_uid_count = Mesh.invalidateMeshUID;
  private __instanceIdx = 0;
  private __primitives: Primitive[] = [];
  private __opaquePrimitives: Array<Primitive> = [];
  private __transparentPrimitives: Array<Primitive> = [];
  private __instanceOf?: Mesh;
  public weights: number[] = [];
  private __morphPrimitives: Array<Primitive> = [];
  private __localAABB = new AABB();
  private __vaoUids: CGAPIResourceHandle[] = [];
  private __variationVBOUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __instances: Mesh[] = [];
  public _attatchedEntityUID = Entity.invalidEntityUID;
  private __instancesDirty = true;
  private static __originalMeshes: Mesh[] = [];
  public tangentCalculationMode: Index = 1; // 0: Off, 1: auto, 2: force calculation
  public isPrecomputeForRayCastPickingEnable: boolean = false;

  constructor() {
    this.__meshUID = ++Mesh.__mesh_uid_count;
  }

  /**
   * Gets original (Non instanced) meshes.
   */
  static get originalMeshes(): Mesh[] {
    return this.__originalMeshes;
  }

  get variationVBOUid(): CGAPIResourceHandle {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.variationVBOUid;
    } else {
      return this.__variationVBOUid;
    }
  }

  getVaoUids(index: Index): CGAPIResourceHandle {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.getVaoUids(index);
    } else {
      return this.__vaoUids[index];
    }
  }

  /**
   * @private
   * Adds the other mesh to this mesh as instanced meshes.
   * @param mesh The other mesh.
   */
  _addMeshToInstanceArray(mesh: Mesh) {
    this.__instances.push(mesh);
    this.__instancesDirty = true;
  }

  /**
   * Adds primitive.
   * @param primitive The primitive object.
   */
  addPrimitive(primitive: Primitive) {
    this.__instanceOf = void 0;
    this.__instanceIdx = 0;

    if (primitive.material == null || !primitive.material.isBlend()) {
      this.__opaquePrimitives.push(primitive);
    } else {
      this.__transparentPrimitives.push(primitive);
    }
    this.__primitives = this.__opaquePrimitives.concat(this.__transparentPrimitives);

    Mesh.__originalMeshes.push(this);
  }

  /**
   * Sets mesh.
   * @param mesh The mesh.
   */
  setMesh(mesh: Mesh) {
    if (mesh.isInstanceMesh()) {
      console.error(`Don't set InstanceMesh.`);
      return false;
    }
    this.__primitives.length = 0;
    this.__instanceOf = mesh;
    mesh._addMeshToInstanceArray(this);
    this.__instanceIdx = mesh.instanceIndex + 1;

    // Remove this from original meshe list
    Mesh.__originalMeshes = Mesh.__originalMeshes.filter(mesh => mesh !== this);

    return true;
  }

  /**
   * Gets true if these primitives are all 'Blend' type
   */
  isAllBlend(): boolean {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.isAllBlend();
    } else {
      if (this.__transparentPrimitives.length > 0 && this.__opaquePrimitives.length === 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  /**
   * Gets true if some primitives are 'Blend' type
   */
  isBlendPartially(): boolean {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.isBlendPartially();
    } else {
      if (this.__transparentPrimitives.length > 0 && this.__opaquePrimitives.length > 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  /**
   * Gets true if these primitives are all 'Opaque' type
   */
  isOpaque(): boolean {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.isOpaque();
    } else {
      if (this.__transparentPrimitives.length === 0 && this.__opaquePrimitives.length > 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  isFirstOpaquePrimitiveAt(index: Index): boolean {
    if (this.isFirstOpaquePrimitiveAt(index)) {
      return this.__instanceOf!.isFirstOpaquePrimitiveAt(index);
    } else {
      if (this.__opaquePrimitives.length > 0) {
        if (index === 0) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  isFirstTransparentPrimitiveAt(index: Index): boolean {
    if (this.isFirstOpaquePrimitiveAt(index)) {
      return this.__instanceOf!.isFirstTransparentPrimitiveAt(index);
    } else {
      if (this.__transparentPrimitives.length > 0) {
        if (this.__opaquePrimitives.length === index) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  __calcFaceNormalFor3Vertices(i: Index, pos0: Vector3, pos1: Vector3, pos2: Vector3, normalAccessor: Accessor, indicesAccessor?: Accessor) {
    // Calc normal
    const ax = pos1.x - pos0.x;
    const ay = pos1.y - pos0.y;
    const az = pos1.z - pos0.z;
    const bx = pos2.x - pos0.x;
    const by = pos2.y - pos0.y;
    const bz = pos2.z - pos0.z;

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
    const faceNormal = new Vector3(nx, ny, nz);
    normalAccessor.setVec3(i, faceNormal.x, faceNormal.y, faceNormal.z, { indicesAccessor });
    normalAccessor.setVec3(i + 1, faceNormal.x, faceNormal.y, faceNormal.z, { indicesAccessor });
    normalAccessor.setVec3(i + 2, faceNormal.x, faceNormal.y, faceNormal.z, { indicesAccessor });

  }

  __calcTangents() {
    if (this.tangentCalculationMode === 0) {
      return;
    }
    for (let primitive of this.__primitives) {
      const tangentIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Tangent);
      if (tangentIdx !== -1 && this.tangentCalculationMode === 1) {
        continue;
      }
      const texcoordIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Texcoord0);
      const normalIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Normal);
      if (texcoordIdx !== -1 && normalIdx !== -1) {
        const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position);

        const positionAccessor = primitive.attributeAccessors[positionIdx];
        const texcoordAccessor = primitive.attributeAccessors[texcoordIdx];
        const normalAccessor = primitive.attributeAccessors[normalIdx];
        const indicesAccessor = primitive.indicesAccessor;

        let incrementNum = 3; // PrimitiveMode.Triangles
        if (primitive.primitiveMode === PrimitiveMode.TriangleStrip ||
          primitive.primitiveMode === PrimitiveMode.TriangleFan) {
          incrementNum = 1;
        }

        const vertexNum = primitive.getVertexCountAsIndicesBased();
        const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);

        const tangentAttributeByteSize = positionAccessor.byteLength * 4 / 3;
        const tangentBufferView = buffer.takeBufferView({ byteLengthToNeed: tangentAttributeByteSize, byteStride: 0, isAoS: false });
        const tangentAccessor = tangentBufferView.takeAccessor({ compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: positionAccessor.elementCount });
        for (let i = 0; i < vertexNum - 2; i += incrementNum) {
          const pos0 = positionAccessor.getVec3(i, { indicesAccessor });
          const pos1 = positionAccessor.getVec3(i + 1, { indicesAccessor });
          const pos2 = positionAccessor.getVec3(i + 2, { indicesAccessor });
          const uv0 = texcoordAccessor.getVec2(i, { indicesAccessor });
          const uv1 = texcoordAccessor.getVec2(i + 1, { indicesAccessor });
          const uv2 = texcoordAccessor.getVec2(i + 2, { indicesAccessor });
          const norm0 = normalAccessor.getVec3(i, { indicesAccessor });
          const norm1 = normalAccessor.getVec3(i + 1, { indicesAccessor });
          const norm2 = normalAccessor.getVec3(i + 2, { indicesAccessor });

          this.__calcTangentFor3Vertices(i, pos0, pos1, pos2, uv0, uv1, uv2, norm0, norm1, norm2, tangentAccessor, indicesAccessor);
        }
        primitive.setVertexAttribute(tangentAccessor, VertexAttribute.Tangent);
      }
    }
  }

  __calcTangentFor3Vertices(
    i: Index,
    pos0: Vector3,
    pos1: Vector3,
    pos2: Vector3,
    uv0: Vector2,
    uv1: Vector2,
    uv2: Vector2,
    norm0: Vector3,
    norm1: Vector3,
    norm2: Vector3,
    tangentAccessor: Accessor,
    indicesAccessor?: Accessor,
  ) {
    const tan0Vec3 = this.__calcTangentPerVertex(pos0, pos1, pos2, uv0, uv1, uv2, norm0, norm1, norm2);
    const tan1Vec3 = this.__calcTangentPerVertex(pos1, pos2, pos0, uv1, uv2, uv0, norm0, norm1, norm2);
    const tan2Vec3 = this.__calcTangentPerVertex(pos2, pos0, pos1, uv2, uv0, uv1, norm0, norm1, norm2);

    tangentAccessor.setVec4(i, tan0Vec3.x, tan0Vec3.y, tan0Vec3.z, 1, { indicesAccessor });
    tangentAccessor.setVec4(i + 1, tan1Vec3.x, tan1Vec3.y, tan1Vec3.z, 1, { indicesAccessor });
    tangentAccessor.setVec4(i + 2, tan2Vec3.x, tan2Vec3.y, tan2Vec3.z, 1, { indicesAccessor });
  }

  __calcTangentPerVertex(
    pos0Vec3: Vector3,
    pos1Vec3: Vector3,
    pos2Vec3: Vector3,
    uv0Vec2: Vector2,
    uv1Vec2: Vector2,
    uv2Vec2: Vector2,
    norm0Vec3: Vector3,
    norm1Vec3: Vector3,
    norm2Vec3: Vector3
  ) {
    let cp0 = [
      new Vector3(pos0Vec3.x, uv0Vec2.x, uv0Vec2.y),
      new Vector3(pos0Vec3.y, uv0Vec2.x, uv0Vec2.y),
      new Vector3(pos0Vec3.z, uv0Vec2.x, uv0Vec2.y)
    ];

    let cp1 = [
      new Vector3(pos1Vec3.x, uv1Vec2.x, uv1Vec2.y),
      new Vector3(pos1Vec3.y, uv1Vec2.x, uv1Vec2.y),
      new Vector3(pos1Vec3.z, uv1Vec2.x, uv1Vec2.y)
    ];

    let cp2 = [
      new Vector3(pos2Vec3.x, uv2Vec2.x, uv2Vec2.y),
      new Vector3(pos2Vec3.y, uv2Vec2.x, uv2Vec2.y),
      new Vector3(pos2Vec3.z, uv2Vec2.x, uv2Vec2.y)
    ];

    let u = [];
    let v = [];

    for (let i = 0; i < 3; i++) {
      let v1 = Vector3.subtract(cp1[i], cp0[i]);
      let v2 = Vector3.subtract(cp2[i], cp1[i]);
      let abc = Vector3.cross(v1, v2);

      let validate = Math.abs(abc.x) < Number.EPSILON;
      if (validate) {
        console.assert(validate, "Polygons or polygons on UV are degenerate!");
        return new Vector3(0, 0, 0);
      }

      u[i] = -abc.y / abc.x;
      v[i] = -abc.z / abc.x;

    }
    if (u[0] * u[0] + u[1] * u[1] + u[2] * u[2] < Number.EPSILON) {
      const tangent = Vector3.cross(norm0Vec3, new Vector3(pos1Vec3));
      u[0] = tangent.x;
      u[1] = tangent.y;
      u[2] = tangent.z;
    }

    return Vector3.normalize(new Vector3(u[0], u[1], u[2]));
  }

  private __calcArenbergInverseMatrices() {
    for (let primitive of this.__primitives) {
      primitive._calcArenbergInverseMatrices();
    }
  }

  getPrimitiveAt(i: number): Primitive {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.getPrimitiveAt(i);
    } else {
      // if (this.weights.length > 0) {
      // return this.__morphPrimitives[i];
      // } else {
      return this.__primitives[i];
      // }
    }
  }

  getPrimitiveNumber(): number {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.getPrimitiveNumber();
    } else {
      return this.__primitives.length;
    }
  }

  __calcFaceNormals() {
    for (let primitive of this.__primitives) {
      const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position);
      const positionAccessor = primitive.attributeAccessors[positionIdx];
      const indicesAccessor = primitive.indicesAccessor;

      let incrementNum = 3; // PrimitiveMode.Triangles
      if (primitive.primitiveMode === PrimitiveMode.TriangleStrip ||
        primitive.primitiveMode === PrimitiveMode.TriangleFan) {
        incrementNum = 1;
      }

      const vertexNum = primitive.getVertexCountAsIndicesBased();
      const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);

      const normalAttributeByteSize = positionAccessor.byteLength;
      const normalBufferView = buffer.takeBufferView({ byteLengthToNeed: normalAttributeByteSize, byteStride: 0, isAoS: false });
      const normalAccessor = normalBufferView.takeAccessor({ compositionType: CompositionType.Vec3, componentType: ComponentType.Float, count: positionAccessor.elementCount });
      for (let i = 0; i < vertexNum - 2; i += incrementNum) {
        const pos0 = positionAccessor.getVec3(i, { indicesAccessor });
        const pos1 = positionAccessor.getVec3(i + 1, { indicesAccessor });
        const pos2 = positionAccessor.getVec3(i + 2, { indicesAccessor });

        this.__calcFaceNormalFor3Vertices(i, pos0, pos1, pos2, normalAccessor, indicesAccessor);
      }
      primitive.setVertexAttribute(normalAccessor, VertexAttribute.FaceNormal);
    }
  }

  makeVerticesSepareted() {
    for (let primitive of this.__primitives) {
      if (primitive.hasIndices()) {
        const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
        const vertexCount = primitive.getVertexCountAsIndicesBased();

        const indexAccessor = primitive.indicesAccessor;
        for (let i in primitive.attributeAccessors) {
          const attributeAccessor = primitive.attributeAccessors[i];
          const elementSizeInBytes = attributeAccessor.elementSizeInBytes;
          const bufferView = buffer.takeBufferView({ byteLengthToNeed: elementSizeInBytes * vertexCount, byteStride: 0, isAoS: false });
          const newAccessor = bufferView.takeAccessor({ compositionType: attributeAccessor.compositionType, componentType: attributeAccessor.componentType, count: vertexCount });

          for (let j = 0; j < vertexCount; j++) {
            const idx = indexAccessor!.getScalar(j, {});
            newAccessor.setElementFromSameCompositionAccessor(j, attributeAccessor, idx);
          }

          primitive.setVertexAttribute(newAccessor, primitive.attributeSemantics[i]);
        }


        const indicesAccessor = primitive.indicesAccessor!;
        const elementSizeInBytes = indicesAccessor.elementSizeInBytes;
        const bufferView = buffer.takeBufferView({ byteLengthToNeed: elementSizeInBytes * vertexCount, byteStride: 0, isAoS: false });
        const newAccessor = bufferView.takeAccessor({ compositionType: indicesAccessor.compositionType, componentType: indicesAccessor.componentType, count: vertexCount });

        for (let j = 0; j < vertexCount; j++) {
          //const idx = indexAccessor!.getScalar(j, {});
          newAccessor.setScalar(j, j, {});
        }

        primitive.setIndices(newAccessor);
      }
    }
  }

  __calcBaryCentricCoord() {
    for (let primitive_i in this.__primitives) {
      let primitive = this.__primitives[primitive_i];

      const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
      const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position);
      const positionAccessor = primitive.attributeAccessors[positionIdx];
      const indicesAccessor = primitive.indicesAccessor;
      const vertexNum = positionAccessor.elementCount;
      let num = vertexNum;

      const baryCentricCoordAttributeByteSize = num * 4 /* vec4 */ * 4 /* bytes */;
      const baryCentricCoordBufferView = buffer.takeBufferView({ byteLengthToNeed: baryCentricCoordAttributeByteSize, byteStride: 0, isAoS: false });
      const baryCentricCoordAccessor = baryCentricCoordBufferView.takeAccessor({ compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: num });

      for (let ver_i = 0; ver_i < num; ver_i++) {
        let idx = ver_i;
        // if (indicesAccessor) {
        //   idx = indicesAccessor!.getScalar(ver_i, {});
        // }
        baryCentricCoordAccessor.setVec4(ver_i,
          ver_i % 3 === 0 ? 1 : 0, // 1 0 0  1 0 0  1 0 0,
          ver_i % 3 === 1 ? 1 : 0, // 0 1 0  0 1 0  0 1 0,
          ver_i % 3 === 2 ? 1 : 0, // 0 0 1  0 0 1  0 0 1,
          ver_i,
          {});
      }
      primitive.setVertexAttribute(baryCentricCoordAccessor, VertexAttribute.BaryCentricCoord);
    }
  }

  __initMorphPrimitives() {
    if (this.weights.length === 0) {
      return;
    }

    const buffer = MemoryManager.getInstance().getBuffer(BufferUse.CPUGeneric);
    for (let i = 0; i < this.__primitives.length; i++) {
      const primitive = this.__primitives[i];
      if (this.__morphPrimitives[i] == null) {
        const target = primitive.targets[0];
        const map = new Map();
        target.forEach((accessor, semantic) => {
          const bufferView = buffer.takeBufferView({ byteLengthToNeed: accessor.byteLength, byteStride: 0, isAoS: false });
          const morphAccessor = bufferView.takeAccessor({ compositionType: accessor.compositionType, componentType: accessor.componentType, count: accessor.elementCount });
          map.set(semantic, morphAccessor);
        });
        const morphPrimitive = new Primitive();
        morphPrimitive.setData(map, primitive.primitiveMode, primitive.material, primitive.indicesAccessor);
        morphPrimitive.setTargets(primitive.targets);
        this.__morphPrimitives[i] = morphPrimitive;
      }
    }
  }

  __calcMorphPrimitives() {
    if (this.weights.length === 0) {
      return;
    }

    for (let i = 0; i < this.__primitives.length; i++) {
      const morphPrimitive = this.__morphPrimitives[i];
      const primitive = this.__primitives[i];
      const target0Attributes = primitive.targets[0];
      target0Attributes.forEach((accessor, semantic) => {
        const morphAccessor = morphPrimitive.getAttribute(semantic)!;
        const elementCount = morphAccessor.elementCount;
        for (let j = 0; j < elementCount; j++) {
          morphAccessor.setElementFromSameCompositionAccessor(j, primitive.getAttribute(semantic)!)
        }
      });

      // primitive.targets.forEach((targetAttributes, k)=>{
      //   targetAttributes.forEach((accessor, semantic) => {
      //     const morphAccessor = morphPrimitive.getAttribute(semantic)!;
      //     const elementCount = morphAccessor.elementCount;
      //     for (let j = 0; j < elementCount; j++) {
      //       morphAccessor.addElementFromSameCompositionAccessor(j, accessor, this.weights[k]);
      //     }
      //   });
      // });
    }
  }

  /**
   * Gets AABB in local space.
   */
  get AABB() {
    if (this.__localAABB.isVanilla()) {
      for (let primitive of this.__primitives) {
        this.__localAABB.mergeAABB(primitive.AABB);
      }
    }

    return this.__localAABB;
  }

  get instanceIndex() {
    return this.__instanceIdx;
  }

  isInstanceMesh() {
    if (this.__instanceOf != null) {
      return true;
    } else {
      return false;
    }
  }

  isOriginalMesh() {
    return !this.isInstanceMesh();
  }

  get meshUID() {
    return this.__meshUID;
  }

  updateVariationVBO(): boolean {

    if (this.isInstanceMesh()) {
      return this.__instanceOf!.updateVariationVBO()
    } else {
      if (!this.__instancesDirty) {
        return false;
      }

      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

      this.__primitives.forEach((prim, i) => {
        this.__vaoUids[i] = webglResourceRepository.createVertexArray();
      });

      if (this.__variationVBOUid != CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        webglResourceRepository.deleteVertexBuffer(this.__variationVBOUid);
      }

      const instanceNum = this.__instances.length;
      const entityUIDs = new Float32Array(instanceNum + 1); // instances and original
      entityUIDs[0] = this._attatchedEntityUID;
      for (var i = 0; i < instanceNum; i++) {
        entityUIDs[i + 1] = this.__instances[i]._attatchedEntityUID;
      }

      this.__variationVBOUid = webglResourceRepository.createVertexBufferFromTypedArray(entityUIDs);

      this.__instancesDirty = false;

      return true;
    }

  }

  deleteVariationVBO() {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.updateVariationVBO()
    } else {
      const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
      if (this.__variationVBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        webglResourceRepository.deleteVertexBuffer(this.__variationVBOUid);
        this.__vaoUids.forEach((vaoUid: CGAPIResourceHandle) => {
          webglResourceRepository.deleteVertexArray(vaoUid);
        });
        return true;
      }
    }
    return false;
  }

  get instanceCountIncludeOriginal() {
    return this.__instances.length + 1;
  }

  castRay(srcPointInLocal: Vector3, directionInLocal: Vector3, dotThreshold: number = 0) {
    let finalShortestIntersectedPosVec3: Vector3 | undefined;
    let finalShortestT = Number.MAX_VALUE;
    for (let primitive of this.__primitives) {
      const {currentShortestIntersectedPosVec3, currentShortestT} =
        primitive.castRay(srcPointInLocal, directionInLocal, true, true, dotThreshold);
      if (currentShortestT != null && currentShortestT < finalShortestT) {
        finalShortestT = currentShortestT;
        finalShortestIntersectedPosVec3 = currentShortestIntersectedPosVec3!;
      }
    }

    if (finalShortestT === Number.MAX_VALUE) {
      finalShortestT === -1;
    }

    return {t: finalShortestT, intersectedPosition: finalShortestIntersectedPosVec3}
  }

  _calcArenbergInverseMatrices() {
    if (this.isPrecomputeForRayCastPickingEnable) {
      for (let primitive of this.__primitives) {
        primitive._calcArenbergInverseMatrices();
      }
    }
  }
}
