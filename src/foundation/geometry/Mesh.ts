import type { CGAPIResourceHandle, Index, MeshUID } from '../../types/CommonTypes';
import type { VertexHandles } from '../../webgl/WebGLResourceRepository';
import type { MeshComponent } from '../components/Mesh/MeshComponent';
import { MemoryManager } from '../core/MemoryManager';
import { BufferUse } from '../definitions/BufferUse';
import { ComponentType } from '../definitions/ComponentType';
import { CompositionType } from '../definitions/CompositionType';
import { PrimitiveMode } from '../definitions/PrimitiveMode';
import { ProcessApproach } from '../definitions/ProcessApproach';
import { ProcessStage } from '../definitions/ProcessStage';
import { VertexAttribute } from '../definitions/VertexAttribute';
import type { IMeshEntity } from '../helpers/EntityHelper';
import { AABB } from '../math/AABB';
import type { IVector3 } from '../math/IVector';
import { MutableVector3 } from '../math/MutableVector3';
import type { Vector2 } from '../math/Vector2';
import { Vector3 } from '../math/Vector3';
import type { Accessor } from '../memory/Accessor';
import { Is } from '../misc/Is';
import { Logger } from '../misc/Logger';
import { CGAPIResourceRepository } from '../renderer/CGAPIResourceRepository';
import type { Engine } from '../system/Engine';
import { EngineState } from '../system/EngineState';
import type { Primitive } from './Primitive';
import {
  type IMesh,
  type RaycastResultEx1,
  isBlendWithZWrite,
  isBlendWithoutZWrite,
  isOpaque,
  isTranslucent,
} from './types/GeometryTypes';

/**
 * The Mesh class.
 * This mesh object has primitives (geometries) or a reference of 'original mesh'.
 * If the latter, this mesh object is an 'instanced mesh', which has no primitives.
 * Instanced meshes refer original mesh's primitives when drawing.
 */
export class Mesh implements IMesh {
  private readonly __engine: Engine;
  private readonly __meshUID: MeshUID;
  public static readonly invalidateMeshUID = -1;
  public static __mesh_uid_count = Mesh.invalidateMeshUID;
  private __primitives: Primitive[] = [];
  private __opaquePrimitives: Array<Primitive> = [];
  private __translucentPrimitives: Array<Primitive> = [];
  private __blendWithZWritePrimitives: Array<Primitive> = [];
  private __blendWithoutZWritePrimitives: Array<Primitive> = [];
  private __morphPrimitives: Array<Primitive> = [];
  private __localAABB = new AABB();
  private __vaoUids: CGAPIResourceHandle[] = [];
  private __variationVBOUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __latestPrimitivePositionAccessorVersionForAABB = 0;
  private __latestPrimitivePositionAccessorVersionForSetUpDone = 0;
  private __belongToEntities: IMeshEntity[] = [];

  /**
   * Specification of when calculate the tangent of a vertex to apply Normal texture (for pbr/MToon shader)
   * 0: Not calculate tangent (not apply normal texture)
   * 1: (default) Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, calculate a tangent in a shader.
   * 2: Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, precalculate a tangent in the javascript.
   * 3: Calculate all tangent in a shader.
   * 4: Precalculate all tangent in the javascript
   */
  public tangentCalculationMode: Index = 1;

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

  private __primitivePositionUpdateCount = 0;

  /**
   * Constructor
   */
  constructor(engine: Engine) {
    this.__engine = engine;
    this.__meshUID = ++Mesh.__mesh_uid_count;
  }

  ///
  ///
  /// Public Members
  ///
  ///

  /**
   * Gets the VAO (Vertex Array Object) UID for the specified index.
   * @param index - The index of the primitive
   * @returns The VAO resource handle
   */
  public getVaoUids(index: Index): CGAPIResourceHandle {
    return this.__vaoUids[index];
  }

  /**
   * Gets the VAO (Vertex Array Object) UID for the specified primitive UID.
   * @param primitiveUid - The UID of the primitive
   * @returns The VAO resource handle
   */
  public getVaoUidsByPrimitiveUid(primitiveUid: Index): CGAPIResourceHandle {
    const index = this.__primitives.findIndex(primitive => primitive.primitiveUid === primitiveUid);

    return this.__vaoUids[index];
  }

  /**
   * Gets the inner mesh entities that belong to this mesh.
   * @returns Array of mesh entities
   */
  get meshEntitiesInner() {
    return this.__belongToEntities;
  }

  /**
   * Registers this mesh as belonging to a mesh component.
   * @param meshComponent - The mesh component that owns this mesh
   * @internal
   */
  _belongToMeshComponent(meshComponent: MeshComponent) {
    this.__belongToEntities.push(meshComponent.entity);
  }

  /**
   * Removes the association with a mesh component.
   * @param meshComponent - The mesh component to remove
   * @internal
   */
  _removeMeshComponent(meshComponent: MeshComponent) {
    const entity = meshComponent.entity;
    this.__belongToEntities = this.__belongToEntities.filter(belongToEntity => belongToEntity !== entity);
  }

  /**
   * Adds primitive.
   * @param primitive The primitive object.
   */
  public addPrimitive(primitive: Primitive): void {
    primitive._belongToMesh(this);

    if (isOpaque(primitive)) {
      this.__opaquePrimitives.push(primitive);
    } else if (isTranslucent(primitive)) {
      this.__translucentPrimitives.push(primitive);
    } else if (isBlendWithZWrite(primitive)) {
      this.__blendWithZWritePrimitives.push(primitive);
    } else if (isBlendWithoutZWrite(primitive)) {
      this.__blendWithoutZWritePrimitives.push(primitive);
    }
    this.__setPrimitives(
      this.__opaquePrimitives
        .concat(this.__translucentPrimitives)
        .concat(this.__blendWithZWritePrimitives)
        .concat(this.__blendWithoutZWritePrimitives)
    );
  }

  /**
   * Sets the array of primitives for this mesh.
   * @param primitives - Array of primitives to set
   * @private
   */
  private __setPrimitives(primitives: Primitive[]) {
    this.__primitives = primitives;
  }

  /**
   * Checks if this mesh has opaque primitives.
   * @returns True if opaque primitives exist, false otherwise
   */
  public isExistOpaque(): boolean {
    return this.__opaquePrimitives.length > 0;
  }

  /**
   * Checks if this mesh has translucent primitives.
   * @returns True if translucent primitives exist, false otherwise
   */
  public isExistTranslucent(): boolean {
    return this.__translucentPrimitives.length > 0;
  }

  /**
   * Checks if this mesh has blend-with-z-write primitives.
   * @returns True if blend-with-z-write primitives exist, false otherwise
   */
  public isExistBlendWithZWrite(): boolean {
    return this.__blendWithZWritePrimitives.length > 0;
  }

  /**
   * Checks if this mesh has blend-without-z-write primitives.
   * @returns True if blend-without-z-write primitives exist, false otherwise
   */
  public isExistBlendWithoutZWrite(): boolean {
    return this.__blendWithoutZWritePrimitives.length > 0;
  }

  /**
   * Gets the primitive at the specified index.
   * @param i - The index of the primitive to retrieve
   * @returns The primitive at the specified index
   */
  public getPrimitiveAt(i: number): Primitive {
    // if (this.weights.length > 0) {
    // return this.__morphPrimitives[i];
    // } else {
    return this.__primitives[i];
    // }
  }

  /**
   * Gets the total number of primitives in this mesh.
   * @returns The number of primitives
   */
  public getPrimitiveNumber(): number {
    return this.__primitives.length;
  }

  /**
   * Updates the variation VBO (Vertex Buffer Object) for instancing.
   * @returns True if updated, false if not changed (not dirty)
   * @internal
   */
  updateVariationVBO(): boolean {
    const cgApiResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();

    if (this.__variationVBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      cgApiResourceRepository.deleteVertexBuffer(this.__variationVBOUid);
    }

    const instanceNum = this.__belongToEntities.length;
    // const entityInfo = new Float32Array(instanceNum);
    const entityInfo = new Float32Array(instanceNum * 4);
    for (let i = 0; i < instanceNum; i++) {
      entityInfo[4 * i + 0] = this.__belongToEntities[i].getSceneGraph().componentSID;
      const skeletal = this.__belongToEntities[i].tryToGetSkeletal();
      if (skeletal != null) {
        entityInfo[4 * i + 1] = skeletal.componentSID;
      } else {
        entityInfo[4 * i + 1] = -1;
      }
      const blendShape = this.__belongToEntities[i].tryToGetBlendShape();
      if (blendShape != null) {
        entityInfo[4 * i + 2] = blendShape.componentSID;
      } else {
        entityInfo[4 * i + 2] = -1;
      }
    }
    this.__variationVBOUid = cgApiResourceRepository.createVertexBufferFromTypedArray(entityInfo);

    return true;
  }

  ///
  /// Public WebGL-related Methods
  ///

  /**
   * Deletes the variation VBO (Vertex Buffer Object).
   * @returns True if updated, false if not changed (not dirty)
   * @internal
   */
  deleteVariationVBO(): boolean {
    const webglResourceRepository = CGAPIResourceRepository.getCgApiResourceRepository();
    if (this.__variationVBOUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      webglResourceRepository.deleteVertexBuffer(this.__variationVBOUid);
      this.__variationVBOUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;

      return true;
    }
    return false;
  }

  /**
   * Updates the VAO (Vertex Array Object) for all primitives in this mesh.
   */
  public updateVAO(): void {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();

    // create and update VAO
    for (let i = 0; i < this.__primitives.length; i++) {
      const primitive = this.__primitives[i];
      const vertexHandles = primitive.vertexHandles as VertexHandles;
      if (Is.undefined(vertexHandles)) {
        Logger.warn('Need to create 3DAPIVertexData before update VAO');
        continue;
      }

      if (
        Number.isNaN(this.__vaoUids[i]) ||
        this.__vaoUids[i] === CGAPIResourceRepository.InvalidCGAPIResourceUid ||
        vertexHandles.vaoHandle === CGAPIResourceRepository.InvalidCGAPIResourceUid
      ) {
        this.__vaoUids[i] = webglResourceRepository.createVertexArray()!;
        vertexHandles.vaoHandle = this.__vaoUids[i];
      }

      webglResourceRepository.setVertexDataToPipeline(vertexHandles, primitive, this.__variationVBOUid);
    }

    // remove useless VAO
    for (let i = this.__primitives.length; i < this.__vaoUids.length; i++) {
      if (this.__vaoUids[i]) {
        webglResourceRepository.deleteVertexArray(this.__vaoUids[i]);
        this.__vaoUids[i] = CGAPIResourceRepository.InvalidCGAPIResourceUid;
      }
    }
  }

  /**
   * Deletes all VAO (Vertex Array Object) resources for this mesh.
   */
  public deleteVAO() {
    const webglResourceRepository = CGAPIResourceRepository.getWebGLResourceRepository();
    for (let i = 0; i < this.__vaoUids.length; i++) {
      webglResourceRepository.deleteVertexArray(this.__vaoUids[i]);
      this.__vaoUids[i] = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }

  /**
   * Performs ray casting against this mesh to find intersection points.
   * @param srcPointInLocal - The ray origin point in local space
   * @param directionInLocal - The ray direction in local space
   * @param dotThreshold - The dot product threshold for back-face culling (default: 0)
   * @returns Ray casting result with intersection information
   */
  public castRay(srcPointInLocal: IVector3, directionInLocal: IVector3, dotThreshold = 0): RaycastResultEx1 {
    let finalShortestIntersectedPosVec3: IVector3 | undefined;
    let finalShortestT = Number.MAX_VALUE;
    let u = 0;
    let v = 0;
    for (const primitive of this.__primitives) {
      const result = primitive.castRay(
        srcPointInLocal,
        directionInLocal,
        true,
        true,
        dotThreshold,
        this.__hasFaceNormal
      );
      if (Is.defined(result.data) && result.data?.t < finalShortestT) {
        finalShortestT = result.data.t;
        finalShortestIntersectedPosVec3 = result.data.position!;
        u = result.data.u;
        v = result.data.v;
      }
    }

    if (Is.defined(finalShortestIntersectedPosVec3)) {
      return {
        result: true,
        data: {
          t: finalShortestT,
          u,
          v,
          position: finalShortestIntersectedPosVec3,
        },
      };
    }
    return {
      result: false,
    };
  }

  ///
  ///
  /// Accessors
  ///
  ///

  /**
   * Gets the array of primitives in this mesh.
   * @returns Array of primitives
   */
  get primitives() {
    return this.__primitives;
  }

  /**
   * Gets the unique identifier for this mesh.
   * @returns The mesh UID
   */
  get meshUID() {
    return this.__meshUID;
  }

  /**
   * Gets the variation VBO UID for internal use.
   * @returns The variation VBO resource handle
   * @internal
   */
  get _variationVBOUid(): CGAPIResourceHandle {
    return this.__variationVBOUid;
  }

  /**
   * Called when primitive position data is updated.
   * Updates the position update counter and moves related entities to Load stage.
   * @internal
   */
  _onPrimitivePositionUpdated() {
    this.__primitivePositionUpdateCount++;
    for (const entity of this.__belongToEntities) {
      entity.getMeshRenderer().moveStageTo(ProcessStage.Load);
    }
  }

  /**
   * Gets the primitive position update count.
   * @returns The number of times primitive positions have been updated
   */
  get primitivePositionUpdateCount() {
    return this.__primitivePositionUpdateCount;
  }

  /**
   * Gets AABB in local space.
   */
  get AABB(): AABB {
    if (this.__primitivePositionUpdateCount !== this.__latestPrimitivePositionAccessorVersionForAABB) {
      this.__localAABB.initialize();
      this.__latestPrimitivePositionAccessorVersionForAABB = this.__primitivePositionUpdateCount;
    }

    if (this.__localAABB.isVanilla()) {
      for (const primitive of this.__primitives) {
        this.__localAABB.mergeAABB(primitive.AABB);
      }
    }

    return this.__localAABB;
  }

  ///
  ///
  // Friend Members
  ///
  ///

  ///
  ///
  /// Private Members
  ///
  ///

  /**
   * Calculates morph target primitives by blending vertex attributes.
   * @private
   */
  private __calcMorphPrimitives() {
    for (let i = 0; i < this.__primitives.length; i++) {
      const morphPrimitive = this.__morphPrimitives[i];
      const primitive = this.__primitives[i];
      const target0Attributes = primitive.targets[0];
      target0Attributes.forEach((_accessor, semantic) => {
        const morphAccessor = morphPrimitive.getAttribute(semantic)!;
        const elementCount = morphAccessor.elementCount;
        for (let j = 0; j < elementCount; j++) {
          morphAccessor.setElementFromSameCompositionAccessor(j, primitive.getAttribute(semantic)!);
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
   * @internal
   */
  _calcTangents() {
    if (!this.__usePreCalculatedTangent()) {
      return;
    }
    for (const primitive of this.__primitives) {
      const tangentIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Tangent.XYZ);
      if (tangentIdx !== -1 && this.tangentCalculationMode === 2) {
        continue;
      }
      const texcoordIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Texcoord0.XY);
      const normalIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Normal.XYZ);
      if (texcoordIdx !== -1 && normalIdx !== -1) {
        const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position.XYZ);

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
        const tangentAttributeByteSize = (positionAccessor.byteLength * 4) / 3;
        const buffer = this.__engine.memoryManager.createBufferOnDemand(
          BufferUse.CPUGeneric,
          tangentAttributeByteSize,
          4
        );
        const tangentBufferView = buffer
          .takeBufferView({
            byteLengthToNeed: tangentAttributeByteSize,
            byteStride: 0,
          })
          .unwrapForce();
        const tangentAccessor = tangentBufferView
          .takeAccessor({
            compositionType: CompositionType.Vec4,
            componentType: ComponentType.Float,
            count: positionAccessor.elementCount,
          })
          .unwrapForce();
        for (let i = 0; i < vertexNum - 2; i += incrementNum) {
          const pos0 = positionAccessor.getVec3(i, { indicesAccessor });
          const pos1 = positionAccessor.getVec3(i + 1, { indicesAccessor });
          const pos2 = positionAccessor.getVec3(i + 2, { indicesAccessor });
          const uv0 = texcoordAccessor.getVec2(i, { indicesAccessor });
          const uv1 = texcoordAccessor.getVec2(i + 1, { indicesAccessor });
          const uv2 = texcoordAccessor.getVec2(i + 2, { indicesAccessor });
          const norm0 = normalAccessor.getVec3(i, { indicesAccessor });

          this.__calcTangentFor3Vertices(i, pos0, pos1, pos2, uv0, uv1, uv2, norm0, tangentAccessor, indicesAccessor);
        }
        primitive.setVertexAttribute(tangentAccessor, VertexAttribute.Tangent.XYZ);
      }
    }
  }

  /**
   * Calculates tangent vectors for a triangle consisting of 3 vertices.
   * @param i - The starting vertex index
   * @param pos0 - Position of the first vertex
   * @param pos1 - Position of the second vertex
   * @param pos2 - Position of the third vertex
   * @param uv0 - UV coordinates of the first vertex
   * @param uv1 - UV coordinates of the second vertex
   * @param uv2 - UV coordinates of the third vertex
   * @param norm0 - Normal vector of the first vertex
   * @param tangentAccessor - Accessor for writing tangent data
   * @param indicesAccessor - Optional indices accessor
   * @private
   * @internal
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
    const tan0Vec3 = this.__calcTangentPerVertex(pos0, pos1, pos2, uv0, uv1, uv2, norm0, Mesh.__tmpReturnVec3_0);
    const tan1Vec3 = this.__calcTangentPerVertex(pos1, pos2, pos0, uv1, uv2, uv0, norm0, Mesh.__tmpReturnVec3_1);
    const tan2Vec3 = this.__calcTangentPerVertex(pos2, pos0, pos1, uv2, uv0, uv1, norm0, Mesh.__tmpReturnVec3_2);

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

  /**
   * Calculates the tangent vector for a single vertex.
   * @param pos0Vec3 - Position of the target vertex
   * @param pos1Vec3 - Position of the second vertex
   * @param pos2Vec3 - Position of the third vertex
   * @param uv0Vec2 - UV coordinates of the target vertex
   * @param uv1Vec2 - UV coordinates of the second vertex
   * @param uv2Vec2 - UV coordinates of the third vertex
   * @param norm0Vec3 - Normal vector of the target vertex
   * @param returnVec3 - Mutable vector to store the result
   * @returns The calculated tangent vector
   * @private
   */
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
        Logger.assert(validate, 'Polygons or polygons on UV are degenerate!');
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

  /**
   * Determines whether to use pre-calculated tangent vectors based on the tangent calculation mode.
   * @returns True if tangent vectors should be pre-calculated, false otherwise
   * @private
   */
  private __usePreCalculatedTangent() {
    if (this.tangentCalculationMode === 0 || this.tangentCalculationMode === 1 || this.tangentCalculationMode === 3) {
      return false;
    }
    return true;
  }

  /**
   * Calculates barycentric coordinates for all primitives in this mesh.
   * @internal
   */
  _calcBaryCentricCoord() {
    for (const primitive of this.__primitives) {
      const baryCentricCoordAccessor = primitive.getAttribute(VertexAttribute.BaryCentricCoord.XYZ);
      if (baryCentricCoordAccessor != null) {
        const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position.XYZ);
        const positionAccessor = primitive.attributeAccessors[positionIdx];
        const vertexNum = positionAccessor.elementCount;
        const num = vertexNum;
        for (let ver_i = 0; ver_i < num; ver_i++) {
          const vec4 = baryCentricCoordAccessor.getVec4(ver_i, {});
          baryCentricCoordAccessor.setVec4(
            ver_i,
            ver_i % 3 === 0 ? 1 : 0, // 1 0 0  1 0 0  1 0 0,
            ver_i % 3 === 1 ? 1 : 0, // 0 1 0  0 1 0  0 1 0,
            ver_i % 3 === 2 ? 1 : 0, // 0 0 1  0 0 1  0 0 1,
            vec4.w,
            {}
          );
        }
      } else {
        const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position.XYZ);
        const positionAccessor = primitive.attributeAccessors[positionIdx];
        const vertexNum = positionAccessor.elementCount;
        const num = vertexNum;

        const baryCentricCoordAttributeByteSize = num * 4 /* vec4 */ * 4; /* bytes */
        const buffer = this.__engine.memoryManager.createBufferOnDemand(
          BufferUse.CPUGeneric,
          baryCentricCoordAttributeByteSize,
          4
        );
        const baryCentricCoordBufferView = buffer
          .takeBufferView({
            byteLengthToNeed: baryCentricCoordAttributeByteSize,
            byteStride: 0,
          })
          .unwrapForce();
        const baryCentricCoordAccessor = baryCentricCoordBufferView
          .takeAccessor({
            compositionType: CompositionType.Vec4,
            componentType: ComponentType.Float,
            count: num,
          })
          .unwrapForce();

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
        primitive.setVertexAttribute(baryCentricCoordAccessor, VertexAttribute.BaryCentricCoord.XYZ);
      }
    }
  }

  /**
   * Calculates face normals for primitives that don't have normal attributes.
   * @internal
   */
  _calcFaceNormalsIfNonNormal() {
    for (const primitive of this.__primitives) {
      const normalIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Normal.XYZ);
      if (normalIdx !== -1) {
        return;
      }

      this.__hasFaceNormal = true;

      const positionIdx = primitive.attributeSemantics.indexOf(VertexAttribute.Position.XYZ);
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

      const normalAttributeByteSize = positionAccessor.byteLength;
      const buffer = this.__engine.memoryManager.createBufferOnDemand(BufferUse.CPUGeneric, normalAttributeByteSize, 4);
      const normalBufferView = buffer
        .takeBufferView({
          byteLengthToNeed: normalAttributeByteSize,
          byteStride: 0,
        })
        .unwrapForce();
      const normalAccessor = normalBufferView
        .takeAccessor({
          compositionType: CompositionType.Vec3,
          componentType: ComponentType.Float,
          count: positionAccessor.elementCount,
        })
        .unwrapForce();
      for (let i = 0; i < vertexNum - 2; i += incrementNum) {
        const pos0 = positionAccessor.getVec3(i, { indicesAccessor });
        const pos1 = positionAccessor.getVec3(i + 1, { indicesAccessor });
        const pos2 = positionAccessor.getVec3(i + 2, { indicesAccessor });

        this.__calcFaceNormalFor3Vertices(i, pos0, pos1, pos2, normalAccessor, indicesAccessor);
      }
      primitive.setVertexAttribute(normalAccessor, VertexAttribute.Normal.XYZ);
    }
  }

  /**
   * Calculates face normals for a triangle consisting of 3 vertices.
   * @param i - The starting vertex index
   * @param pos0 - Position of the first vertex
   * @param pos1 - Position of the second vertex
   * @param pos2 - Position of the third vertex
   * @param normalAccessor - Accessor for writing normal data
   * @param indicesAccessor - Optional indices accessor
   * @private
   */
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

    normalAccessor.setVec3(i, nx, ny, nz, { indicesAccessor });
    normalAccessor.setVec3(i + 1, nx, ny, nz, { indicesAccessor });
    normalAccessor.setVec3(i + 2, nx, ny, nz, { indicesAccessor });
  }

  /**
   * Gets the index of a primitive within this mesh.
   * @param primitive - The primitive to find the index of
   * @returns The index of the primitive in the mesh
   */
  getPrimitiveIndexInMesh(primitive: Primitive) {
    return this.primitives.indexOf(primitive);
  }

  /**
   * Apply a material variant to the mesh
   * @param variantName a variant name
   */
  applyMaterialVariant(variantName: string) {
    for (const primitive of this.primitives) {
      primitive.applyMaterialVariant(variantName);
    }
  }

  /**
   * Gets the current material variant name applied to this mesh.
   * Returns empty string if no variant is applied or if primitives have different variants.
   * @returns The current variant name or empty string
   */
  getCurrentVariantName() {
    function allEqual(arr: string[]) {
      return arr.every(val => val === arr[0]);
    }
    const variantNames = this.primitives.map(primitive => primitive.getCurrentVariantName());
    if (variantNames.length === 0) {
      return '';
    }
    if (allEqual(variantNames)) {
      return variantNames[0];
    }

    return '';
  }

  /**
   * Gets all available material variant names for this mesh.
   * @returns Array of variant names from all primitives
   */
  getVariantNames() {
    const variants: string[] = [];
    for (const primitive of this.primitives) {
      Array.prototype.push.apply(variants, primitive.getVariantNames());
    }
    return variants;
  }

  /**
   * Checks if this mesh setup is completed and ready for rendering.
   * @returns True if setup is done, false otherwise
   */
  isSetUpDone() {
    let vertexHandlesReady = true;
    for (const primitive of this.primitives) {
      if (primitive.vertexHandles == null) {
        vertexHandlesReady = false;
        break;
      }
    }
    if (!vertexHandlesReady) {
      return false;
    }

    if (this.__latestPrimitivePositionAccessorVersionForSetUpDone !== this.__primitivePositionUpdateCount) {
      this.__latestPrimitivePositionAccessorVersionForSetUpDone = this.__primitivePositionUpdateCount;
      return false;
    }

    return true;
  }

  /**
   * Updates VBO (Vertex Buffer Object) and VAO (Vertex Array Object) for all primitives.
   * @internal
   */
  _updateVBOAndVAO() {
    const primitiveNum = this.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = this.getPrimitiveAt(i);
      if (Is.exist(primitive.vertexHandles)) {
        primitive.update3DAPIVertexData();
      } else {
        primitive.create3DAPIVertexData();
      }
    }
    this.updateVariationVBO();

    if (EngineState.currentProcessApproach !== ProcessApproach.WebGPU) {
      this.updateVAO();
    }
  }

  /**
   * Deletes all 3D API vertex data for this mesh.
   */
  delete3DAPIVertexData() {
    for (const primitive of this.__primitives) {
      primitive.delete3DAPIVertexData();
    }
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
