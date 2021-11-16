import Primitive from './Primitive';
import {VertexAttribute} from '../definitions/VertexAttribute';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import MemoryManager from '../core/MemoryManager';
import {BufferUse} from '../definitions/BufferUse';
import {ComponentType} from '../definitions/ComponentType';
import {CompositionType} from '../definitions/CompositionType';
import Vector3 from '../math/Vector3';
import Accessor from '../memory/Accessor';
import Vector2 from '../math/Vector2';
import AABB from '../math/AABB';
import CGAPIResourceRepository from '../renderer/CGAPIResourceRepository';
import Entity from '../core/Entity';
import {Index, CGAPIResourceHandle, MeshUID} from '../../types/CommonTypes';
import MutableVector3 from '../math/MutableVector3';
import {VertexHandles} from '../../webgl/WebGLResourceRepository';
import {Is as is} from '../misc/Is';
import {IVector3} from '../math/IVector';

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
  private __morphPrimitives: Array<Primitive> = [];
  private __instanceOf?: Mesh;
  public weights: number[] = [];
  private __localAABB = new AABB();
  private __vaoUids: CGAPIResourceHandle[] = [];
  private __variationVBOUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __instances: Mesh[] = [];
  public _attachedEntityUID = Entity.invalidEntityUID;
  private __instancesDirty = true;
  private static __originalMeshes: Mesh[] = [];

  /**
   * Specification of when calculate the tangent of a vertex to apply Normal texture (for pbr/MToon shader)
   * 0: Not calculate tangent (not apply normal texture)
   * 1: (default) Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, calculate a tangent in a shader.
   * 2: Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, precalculate a tangent in the javascript.
   * 3: Calculate all tangent in a shader.
   * 4: Precalculate all tangent in the javascript
   */
  public tangentCalculationMode: Index = 1;

  public isPreComputeForRayCastPickingEnable = false;
  private __hasFaceNormal = false;

  private static __tmpVec3_0: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_1: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_2: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_3: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_4: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_5: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_6: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_7: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_8: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_9: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_10: MutableVector3 = MutableVector3.zero();
  private static __tmpVec3_11: MutableVector3 = MutableVector3.zero();

  private static __tmpReturnVec3_0: MutableVector3 = MutableVector3.zero();
  private static __tmpReturnVec3_1: MutableVector3 = MutableVector3.zero();
  private static __tmpReturnVec3_2: MutableVector3 = MutableVector3.zero();

  /**
   * Constructor
   */
  constructor() {
    this.__meshUID = ++Mesh.__mesh_uid_count;
  }

  ///
  ///
  /// Public Members
  ///
  ///

  public getVaoUids(index: Index): CGAPIResourceHandle {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.getVaoUids(index);
    } else {
      return this.__vaoUids[index];
    }
  }

  /**
   * Adds primitive.
   * @param primitive The primitive object.
   */
  public addPrimitive(primitive: Primitive) {
    if (this.isInstanceMesh()) {
      // De-instancing
      this.__instanceOf!.__instances = this.__instanceOf!.__instances.filter(
        mesh => mesh !== this
      );
      this.__instanceOf = void 0;
      this.__instanceIdx = 0;

      // this.__primitives will initialize in this.__setPrimitives
      this.__opaquePrimitives = this.__opaquePrimitives.slice();
      this.__transparentPrimitives = this.__transparentPrimitives.slice();
      this.__morphPrimitives = this.__morphPrimitives.slice();
    }

    if (primitive.material == null || !primitive.material.isBlend()) {
      this.__opaquePrimitives.push(primitive);
    } else {
      this.__transparentPrimitives.push(primitive);
    }
    this.__setPrimitives(
      this.__opaquePrimitives.concat(this.__transparentPrimitives)
    );

    Mesh.__originalMeshes.push(this);
  }

  private __setPrimitives(primitives: Primitive[]) {
    this.__primitives = primitives;

    for (const instanceMesh of this.__instances) {
      instanceMesh.__primitives = this.__primitives;
      instanceMesh.__opaquePrimitives = this.__opaquePrimitives;
      instanceMesh.__transparentPrimitives = this.__transparentPrimitives;
      instanceMesh.__morphPrimitives = this.__morphPrimitives;
    }
  }

  /**
   * Sets mesh.
   * @param mesh The mesh.
   */
  public setOriginalMesh(mesh: Mesh) {
    if (mesh.isInstanceMesh()) {
      console.error("Don't set InstanceMesh.");
      return false;
    }
    this.__primitives = mesh.__primitives;
    this.__opaquePrimitives = mesh.__opaquePrimitives;
    this.__transparentPrimitives = mesh.__transparentPrimitives;
    this.__morphPrimitives = mesh.__morphPrimitives;

    this.__instanceOf = mesh;
    mesh._addMeshToInstanceArray(this);
    this.__instanceIdx = mesh.instanceIndex + 1;

    // Remove this from original mesh list
    Mesh.__originalMeshes = Mesh.__originalMeshes.filter(mesh => mesh !== this);

    return true;
  }

  /**
   * Gets true if these primitives are all 'Blend' type
   */
  public isAllBlend(): boolean {
    if (
      this.__transparentPrimitives.length > 0 &&
      this.__opaquePrimitives.length === 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets true if some primitives are 'Blend' type
   */
  public isBlendPartially(): boolean {
    if (
      this.__transparentPrimitives.length > 0 &&
      this.__opaquePrimitives.length > 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets true if these primitives are all 'Opaque' type
   */
  public isOpaque(): boolean {
    if (
      this.__transparentPrimitives.length === 0 &&
      this.__opaquePrimitives.length > 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  public isFirstOpaquePrimitiveAt(index: Index): boolean {
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

  public isFirstTransparentPrimitiveAt(index: Index): boolean {
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

  public getPrimitiveAt(i: number): Primitive {
    // if (this.weights.length > 0) {
    // return this.__morphPrimitives[i];
    // } else {
    return this.__primitives[i];
    // }
  }

  public getPrimitiveNumber(): number {
    return this.__primitives.length;
  }

  public isInstanceMesh() {
    if (this.__instanceOf != null) {
      return true;
    } else {
      return false;
    }
  }

  public isOriginalMesh() {
    return !this.isInstanceMesh();
  }

  public updateVariationVBO(): boolean {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.updateVariationVBO();
    } else {
      if (!this.__instancesDirty) {
        return false;
      }

      const webglResourceRepository =
        CGAPIResourceRepository.getWebGLResourceRepository();

      if (
        this.__variationVBOUid !==
        CGAPIResourceRepository.InvalidCGAPIResourceUid
      ) {
        webglResourceRepository.deleteVertexBuffer(this.__variationVBOUid);
      }

      const instanceNum = this.__instances.length;
      const entityUIDs = new Float32Array(instanceNum + 1); // instances and original
      entityUIDs[0] = this._attachedEntityUID;
      for (let i = 0; i < instanceNum; i++) {
        entityUIDs[i + 1] = this.__instances[i]._attachedEntityUID;
      }

      this.__variationVBOUid =
        webglResourceRepository.createVertexBufferFromTypedArray(entityUIDs);

      this.__instancesDirty = false;

      return true;
    }
  }

  ///
  /// Public WebGL-related Methods
  ///

  public deleteVariationVBO(): boolean {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.deleteVariationVBO();
    } else {
      const webglResourceRepository =
        CGAPIResourceRepository.getWebGLResourceRepository();
      if (
        this.__variationVBOUid !==
        CGAPIResourceRepository.InvalidCGAPIResourceUid
      ) {
        webglResourceRepository.deleteVertexBuffer(this.__variationVBOUid);
        this.__variationVBOUid =
          CGAPIResourceRepository.InvalidCGAPIResourceUid;

        this.__instancesDirty = true;
        return true;
      }
    }
    return false;
  }

  public updateVAO(): void {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.updateVAO();
    }

    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();

    // create and update VAO
    for (let i = 0; i < this.__primitives.length; i++) {
      const primitive = this.__primitives[i];
      const vertexHandles = primitive.vertexHandles as VertexHandles;
      if (is.undefined(vertexHandles)) {
        console.warn('Need to create 3DAPIVertexData before update VAO');
        continue;
      }

      if (
        isNaN(this.__vaoUids[i]) ||
        this.__vaoUids[i] === CGAPIResourceRepository.InvalidCGAPIResourceUid ||
        vertexHandles.vaoHandle ===
          CGAPIResourceRepository.InvalidCGAPIResourceUid
      ) {
        this.__vaoUids[i] = webglResourceRepository.createVertexArray()!;
        vertexHandles.vaoHandle = this.__vaoUids[i];
      }

      webglResourceRepository.setVertexDataToPipeline(
        vertexHandles,
        primitive,
        this.__variationVBOUid
      );
    }

    // remove useless VAO
    for (let i = this.__primitives.length; i < this.__vaoUids.length; i++) {
      if (this.__vaoUids[i]) {
        webglResourceRepository.deleteVertexArray(this.__vaoUids[i]);
        this.__vaoUids[i] = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
    }
  }

  public deleteVAO() {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.updateVAO();
    }

    const webglResourceRepository =
      CGAPIResourceRepository.getWebGLResourceRepository();
    for (let i = 0; i < this.__vaoUids.length; i++) {
      webglResourceRepository.deleteVertexArray(this.__vaoUids[i]);
      this.__vaoUids[i] = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }

  public castRay(
    srcPointInLocal: IVector3,
    directionInLocal: IVector3,
    dotThreshold = 0
  ) {
    let finalShortestIntersectedPosVec3: Vector3 | undefined;
    let finalShortestT = Number.MAX_VALUE;
    for (const primitive of this.__primitives) {
      const {currentShortestIntersectedPosVec3, currentShortestT} =
        primitive.castRay(
          srcPointInLocal,
          directionInLocal,
          true,
          true,
          dotThreshold,
          this.__hasFaceNormal
        );
      if (currentShortestT != null && currentShortestT < finalShortestT) {
        finalShortestT = currentShortestT;
        finalShortestIntersectedPosVec3 = currentShortestIntersectedPosVec3!;
      }
    }

    if (finalShortestT === Number.MAX_VALUE) {
      finalShortestT === -1;
    }

    return {
      t: finalShortestT,
      intersectedPosition: finalShortestIntersectedPosVec3,
    };
  }

  ///
  ///
  /// Accessors
  ///
  ///

  get primitives() {
    return Array.from(this.__primitives);
  }

  get meshUID() {
    return this.__meshUID;
  }

  get instanceCountIncludeOriginal() {
    return this.__instances.length + 1;
  }

  /**
   * Gets AABB in local space.
   */
  get AABB(): AABB {
    if (this.isInstanceMesh()) {
      return this.__instanceOf!.AABB;
    }

    for (const primitive of this.__primitives) {
      if (primitive.isPositionAccessorUpdated) {
        this.__localAABB.initialize();
        break;
      }
    }

    if (this.__localAABB.isVanilla()) {
      for (const primitive of this.__primitives) {
        this.__localAABB.mergeAABB(primitive.AABB);
      }
    }

    return this.__localAABB;
  }

  get instanceIndex() {
    return this.__instanceIdx;
  }

  ///
  ///
  // Friend Members
  ///
  ///

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
   * @private
   */
  _calcArenbergInverseMatrices() {
    if (this.isInstanceMesh()) {
      return;
    }

    if (this.isPreComputeForRayCastPickingEnable) {
      for (const primitive of this.__primitives) {
        primitive._calcArenbergInverseMatrices();
      }
    }
  }

  ///
  ///
  /// Private Members
  ///
  ///

  private __calcMorphPrimitives() {
    if (this.weights.length === 0 || this.isInstanceMesh()) {
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
          morphAccessor.setElementFromSameCompositionAccessor(
            j,
            primitive.getAttribute(semantic)!
          );
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
   * @private
   */
  _calcTangents() {
    if (!this.__usePreCalculatedTangent()) {
      return;
    }
    for (const primitive of this.__primitives) {
      const tangentIdx = primitive.attributeSemantics.indexOf(
        VertexAttribute.Tangent
      );
      if (tangentIdx !== -1 && this.tangentCalculationMode === 2) {
        continue;
      }
      const texcoordIdx = primitive.attributeSemantics.indexOf(
        VertexAttribute.Texcoord0
      );
      const normalIdx = primitive.attributeSemantics.indexOf(
        VertexAttribute.Normal
      );
      if (texcoordIdx !== -1 && normalIdx !== -1) {
        const positionIdx = primitive.attributeSemantics.indexOf(
          VertexAttribute.Position
        );

        const positionAccessor = primitive.attributeAccessors[positionIdx];
        const texcoordAccessor = primitive.attributeAccessors[texcoordIdx];
        const normalAccessor = primitive.attributeAccessors[normalIdx];
        const indicesAccessor = primitive.indicesAccessor;

        let incrementNum = 3; // PrimitiveMode.Triangles
        if (
          primitive.primitiveMode === PrimitiveMode.TriangleStrip ||
          primitive.primitiveMode === PrimitiveMode.TriangleFan
        ) {
          incrementNum = 1;
        }

        const vertexNum = primitive.getVertexCountAsIndicesBased();
        const buffer = MemoryManager.getInstance().createOrGetBuffer(
          BufferUse.CPUGeneric
        );

        const tangentAttributeByteSize = (positionAccessor.byteLength * 4) / 3;
        const tangentBufferView = buffer.takeBufferView({
          byteLengthToNeed: tangentAttributeByteSize,
          byteStride: 0,
        });
        const tangentAccessor = tangentBufferView.takeAccessor({
          compositionType: CompositionType.Vec4,
          componentType: ComponentType.Float,
          count: positionAccessor.elementCount,
        });
        for (let i = 0; i < vertexNum - 2; i += incrementNum) {
          const pos0 = positionAccessor.getVec3(i, {indicesAccessor});
          const pos1 = positionAccessor.getVec3(i + 1, {indicesAccessor});
          const pos2 = positionAccessor.getVec3(i + 2, {indicesAccessor});
          const uv0 = texcoordAccessor.getVec2(i, {indicesAccessor});
          const uv1 = texcoordAccessor.getVec2(i + 1, {indicesAccessor});
          const uv2 = texcoordAccessor.getVec2(i + 2, {indicesAccessor});
          const norm0 = normalAccessor.getVec3(i, {indicesAccessor});

          this.__calcTangentFor3Vertices(
            i,
            pos0,
            pos1,
            pos2,
            uv0,
            uv1,
            uv2,
            norm0,
            tangentAccessor,
            indicesAccessor
          );
        }
        primitive.setVertexAttribute(tangentAccessor, VertexAttribute.Tangent);
      }
    }
  }

  /**
   * @private
   */
  private __calcTangentFor3Vertices(
    i: Index,
    pos0: Vector3,
    pos1: Vector3,
    pos2: Vector3,
    uv0: Vector2,
    uv1: Vector2,
    uv2: Vector2,
    norm0: Vector3,
    tangentAccessor: Accessor,
    indicesAccessor?: Accessor
  ) {
    const tan0Vec3 = this.__calcTangentPerVertex(
      pos0,
      pos1,
      pos2,
      uv0,
      uv1,
      uv2,
      norm0,
      Mesh.__tmpReturnVec3_0
    );
    const tan1Vec3 = this.__calcTangentPerVertex(
      pos1,
      pos2,
      pos0,
      uv1,
      uv2,
      uv0,
      norm0,
      Mesh.__tmpReturnVec3_1
    );
    const tan2Vec3 = this.__calcTangentPerVertex(
      pos2,
      pos0,
      pos1,
      uv2,
      uv0,
      uv1,
      norm0,
      Mesh.__tmpReturnVec3_2
    );

    tangentAccessor.setVec4(i, tan0Vec3.x, tan0Vec3.y, tan0Vec3.z, 1, {
      indicesAccessor,
    });
    tangentAccessor.setVec4(i + 1, tan1Vec3.x, tan1Vec3.y, tan1Vec3.z, 1, {
      indicesAccessor,
    });
    tangentAccessor.setVec4(i + 2, tan2Vec3.x, tan2Vec3.y, tan2Vec3.z, 1, {
      indicesAccessor,
    });
  }

  private __calcTangentPerVertex(
    pos0Vec3: Vector3,
    pos1Vec3: Vector3,
    pos2Vec3: Vector3,
    uv0Vec2: Vector2,
    uv1Vec2: Vector2,
    uv2Vec2: Vector2,
    norm0Vec3: Vector3,
    returnVec3: MutableVector3
  ) {
    const cp0 = [
      Mesh.__tmpVec3_0.setComponents(pos0Vec3.x, uv0Vec2.x, uv0Vec2.y),
      Mesh.__tmpVec3_1.setComponents(pos0Vec3.y, uv0Vec2.x, uv0Vec2.y),
      Mesh.__tmpVec3_2.setComponents(pos0Vec3.z, uv0Vec2.x, uv0Vec2.y),
    ];

    const cp1 = [
      Mesh.__tmpVec3_3.setComponents(pos1Vec3.x, uv1Vec2.x, uv1Vec2.y),
      Mesh.__tmpVec3_4.setComponents(pos1Vec3.y, uv1Vec2.x, uv1Vec2.y),
      Mesh.__tmpVec3_5.setComponents(pos1Vec3.z, uv1Vec2.x, uv1Vec2.y),
    ];

    const cp2 = [
      Mesh.__tmpVec3_6.setComponents(pos2Vec3.x, uv2Vec2.x, uv2Vec2.y),
      Mesh.__tmpVec3_7.setComponents(pos2Vec3.y, uv2Vec2.x, uv2Vec2.y),
      Mesh.__tmpVec3_8.setComponents(pos2Vec3.z, uv2Vec2.x, uv2Vec2.y),
    ];

    const u = [];
    const v = [];

    for (let i = 0; i < 3; i++) {
      const v1 = MutableVector3.subtractTo(cp1[i], cp0[i], Mesh.__tmpVec3_9);
      const v2 = MutableVector3.subtractTo(cp2[i], cp1[i], Mesh.__tmpVec3_10);
      const abc = MutableVector3.crossTo(v1, v2, Mesh.__tmpVec3_11);

      const validate = Math.abs(abc.x) < Number.EPSILON;
      if (validate) {
        console.assert(validate, 'Polygons or polygons on UV are degenerate!');
        return Vector3.fromCopyArray([0, 0, 0]);
      }

      u[i] = -abc.y / abc.x;
      v[i] = -abc.z / abc.x;
    }

    if (u[0] * u[0] + u[1] * u[1] + u[2] * u[2] < Number.EPSILON) {
      MutableVector3.crossTo(norm0Vec3, pos1Vec3, returnVec3);
      return returnVec3.normalize() as Vector3;
    }

    return returnVec3.setComponents(u[0], u[1], u[2]).normalize() as Vector3;
  }

  private __usePreCalculatedTangent() {
    if (
      this.tangentCalculationMode === 0 ||
      this.tangentCalculationMode === 1 ||
      this.tangentCalculationMode === 3 ||
      this.isInstanceMesh()
    ) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * @private
   */
  _calcBaryCentricCoord() {
    if (this.isInstanceMesh()) {
      return;
    }

    for (const primitive of this.__primitives) {
      const BaryCentricCoordId = primitive.attributeSemantics.indexOf(
        VertexAttribute.BaryCentricCoord
      );
      if (BaryCentricCoordId !== -1) {
        return;
      }

      const buffer = MemoryManager.getInstance().createOrGetBuffer(
        BufferUse.CPUGeneric
      );
      const positionIdx = primitive.attributeSemantics.indexOf(
        VertexAttribute.Position
      );
      const positionAccessor = primitive.attributeAccessors[positionIdx];
      const vertexNum = positionAccessor.elementCount;
      const num = vertexNum;

      const baryCentricCoordAttributeByteSize =
        num * 4 /* vec4 */ * 4; /* bytes */
      const baryCentricCoordBufferView = buffer.takeBufferView({
        byteLengthToNeed: baryCentricCoordAttributeByteSize,
        byteStride: 0,
      });
      const baryCentricCoordAccessor = baryCentricCoordBufferView.takeAccessor({
        compositionType: CompositionType.Vec4,
        componentType: ComponentType.Float,
        count: num,
      });

      for (let ver_i = 0; ver_i < num; ver_i++) {
        baryCentricCoordAccessor.setVec4(
          ver_i,
          ver_i % 3 === 0 ? 1 : 0, // 1 0 0  1 0 0  1 0 0,
          ver_i % 3 === 1 ? 1 : 0, // 0 1 0  0 1 0  0 1 0,
          ver_i % 3 === 2 ? 1 : 0, // 0 0 1  0 0 1  0 0 1,
          ver_i,
          {}
        );
      }
      primitive.setVertexAttribute(
        baryCentricCoordAccessor,
        VertexAttribute.BaryCentricCoord
      );
    }
  }

  /**
   * @private
   */
  _calcFaceNormalsIfNonNormal() {
    if (this.isInstanceMesh()) {
      return;
    }

    for (const primitive of this.__primitives) {
      const normalIdx = primitive.attributeSemantics.indexOf(
        VertexAttribute.Normal
      );
      if (normalIdx !== -1) {
        return;
      }

      this.__hasFaceNormal = true;

      const positionIdx = primitive.attributeSemantics.indexOf(
        VertexAttribute.Position
      );
      const positionAccessor = primitive.attributeAccessors[positionIdx];
      const indicesAccessor = primitive.indicesAccessor;

      let incrementNum = 3; // PrimitiveMode.Triangles
      if (
        primitive.primitiveMode === PrimitiveMode.TriangleStrip ||
        primitive.primitiveMode === PrimitiveMode.TriangleFan
      ) {
        incrementNum = 1;
      }

      const vertexNum = primitive.getVertexCountAsIndicesBased();
      const buffer = MemoryManager.getInstance().createOrGetBuffer(
        BufferUse.CPUGeneric
      );

      const normalAttributeByteSize = positionAccessor.byteLength;
      const normalBufferView = buffer.takeBufferView({
        byteLengthToNeed: normalAttributeByteSize,
        byteStride: 0,
      });
      const normalAccessor = normalBufferView.takeAccessor({
        compositionType: CompositionType.Vec3,
        componentType: ComponentType.Float,
        count: positionAccessor.elementCount,
      });
      for (let i = 0; i < vertexNum - 2; i += incrementNum) {
        const pos0 = positionAccessor.getVec3(i, {indicesAccessor});
        const pos1 = positionAccessor.getVec3(i + 1, {indicesAccessor});
        const pos2 = positionAccessor.getVec3(i + 2, {indicesAccessor});

        this.__calcFaceNormalFor3Vertices(
          i,
          pos0,
          pos1,
          pos2,
          normalAccessor,
          indicesAccessor
        );
      }
      primitive.setVertexAttribute(normalAccessor, VertexAttribute.Normal);
    }
  }

  private __calcFaceNormalFor3Vertices(
    i: Index,
    pos0: Vector3,
    pos1: Vector3,
    pos2: Vector3,
    normalAccessor: Accessor,
    indicesAccessor?: Accessor
  ) {
    // Calc normal
    const ax = pos1.x - pos0.x;
    const ay = pos1.y - pos0.y;
    const az = pos1.z - pos0.z;
    const bx = pos2.x - pos0.x;
    const by = pos2.y - pos0.y;
    const bz = pos2.z - pos0.z;

    let nx = ay * bz - az * by; // cross product
    let ny = az * bx - ax * bz;
    let nz = ax * by - ay * bx;

    let da = Math.hypot(nx, ny, nz); // normalize
    if (da <= 1e-6) {
      da = 0.0001;
    }
    da = 1.0 / da;
    nx *= da;
    ny *= da;
    nz *= da;

    normalAccessor.setVec3(i, nx, ny, nz, {indicesAccessor});
    normalAccessor.setVec3(i + 1, nx, ny, nz, {indicesAccessor});
    normalAccessor.setVec3(i + 2, nx, ny, nz, {indicesAccessor});
  }

  // makeVerticesSeparated() {
  //   for (let primitive of this.__primitives) {
  //     if (primitive.hasIndices()) {
  //       const buffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.CPUGeneric);
  //       const vertexCount = primitive.getVertexCountAsIndicesBased();

  //       const indexAccessor = primitive.indicesAccessor;
  //       for (let i in primitive.attributeAccessors) {
  //         const attributeAccessor = primitive.attributeAccessors[i];
  //         const elementSizeInBytes = attributeAccessor.elementSizeInBytes;
  //         const bufferView = buffer.takeBufferView({ byteLengthToNeed: elementSizeInBytes * vertexCount, byteStride: 0, isAoS: false });
  //         const newAccessor = bufferView.takeAccessor({ compositionType: attributeAccessor.compositionType, componentType: attributeAccessor.componentType, count: vertexCount });

  //         for (let j = 0; j < vertexCount; j++) {
  //           const idx = indexAccessor!.getScalar(j, {});
  //           newAccessor.setElementFromSameCompositionAccessor(j, attributeAccessor, idx);
  //         }

  //         primitive.setVertexAttribute(newAccessor, primitive.attributeSemantics[i]);
  //       }

  //       const indicesAccessor = primitive.indicesAccessor!;
  //       const elementSizeInBytes = indicesAccessor.elementSizeInBytes;
  //       const bufferView = buffer.takeBufferView({ byteLengthToNeed: elementSizeInBytes * vertexCount, byteStride: 0, isAoS: false });
  //       const newAccessor = bufferView.takeAccessor({ compositionType: indicesAccessor.compositionType, componentType: indicesAccessor.componentType, count: vertexCount });

  //       for (let j = 0; j < vertexCount; j++) {
  //         //const idx = indexAccessor!.getScalar(j, {});
  //         newAccessor.setScalar(j, j, {});
  //       }

  //       primitive.setIndices(newAccessor);
  //     }
  //   }
  // }

  // __initMorphPrimitives() {
  //   if (this.weights.length === 0) {
  //     return;
  //   }

  //   const buffer = MemoryManager.getInstance().createOrGetBuffer(BufferUse.CPUGeneric);
  //   for (let i = 0; i < this.__primitives.length; i++) {
  //     const primitive = this.__primitives[i];
  //     if (this.__morphPrimitives[i] == null) {
  //       const target = primitive.targets[0];
  //       const map = new Map();
  //       target.forEach((accessor, semantic) => {
  //         const bufferView = buffer.takeBufferView({ byteLengthToNeed: accessor.byteLength, byteStride: 0, isAoS: false });
  //         const morphAccessor = bufferView.takeAccessor({ compositionType: accessor.compositionType, componentType: accessor.componentType, count: accessor.elementCount });
  //         map.set(semantic, morphAccessor);
  //       });
  //       const morphPrimitive = new Primitive();
  //       morphPrimitive.setData(map, primitive.primitiveMode, primitive.material, primitive.indicesAccessor);
  //       morphPrimitive.setTargets(primitive.targets);
  //       this.__morphPrimitives[i] = morphPrimitive;
  //     }
  //   }
  // }
}
