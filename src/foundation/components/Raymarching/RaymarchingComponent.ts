import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import type { NodeJSON } from '../../../types/NodeJSON';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import { SdfShapeType, type SdfShapeTypeEnum } from '../../definitions/SdfShapeType';
import { AABB } from '../../math/AABB';
import type { IVector3 } from '../../math/IVector';
import { MathClassUtil } from '../../math/MathClassUtil';
import { Matrix44 } from '../../math/Matrix44';
import { MutableVector3 } from '../../math/MutableVector3';
import { Vector3 } from '../../math/Vector3';
import type { Vector4 } from '../../math/Vector4';
import type { Engine } from '../../system/Engine';
import type { CameraComponent } from '../Camera/CameraComponent';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import type { ShapeComponent } from '../Shape/ShapeComponent';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';
import {
  type RaymarchingRaycastHit,
  type RaymarchingRaycastOptions,
  RaymarchingSdfEvaluator,
  type RaymarchingUniformValueProvider,
} from './RaymarchingSdfEvaluator';

/**
 * Options for creating a box shape from the SDF bounds.
 */
export type RaymarchingAabbShapeOptions = {
  /** Local-space AABB to use instead of the one computed from the SDF graph. */
  aabb?: AABB;
  /** ShapeComponent that receives the box. Defaults to the entity's ShapeComponent. */
  shapeComponent?: ShapeComponent;
  /** Origin expressed in the same local space as the AABB. */
  origin?: IVector3;
};

/**
 * A sphere collider extracted from a single-sphere SDF graph.
 */
export type RaymarchingSphereCollider = {
  /** Sphere center in the component entity's local space. */
  center: Vector3;
  /** Sphere radius in the component entity's local space. */
  radius: number;
};

/**
 * Options for creating a collider shape from the SDF.
 */
export type RaymarchingColliderShapeOptions = {
  /** Local-space AABB to use for the box fallback. */
  aabb?: AABB;
  /** ShapeComponent that receives the shape. Defaults to the entity's ShapeComponent. */
  shapeComponent?: ShapeComponent;
  /** Origin expressed in the same local space as the AABB (box fallback only). */
  origin?: IVector3;
};

/**
 * The collider shape created from an SDF graph.
 */
export type RaymarchingColliderShapeResult =
  | { shapeIndex: number; shapeType: 'sphere'; center: Vector3; radius: number }
  | { shapeIndex: number; shapeType: 'box'; aabb: AABB };

/**
 * RaymarchingComponent is a component that manages raymarching for an entity.
 * This component handles the raymarching of the entity.
 */
export class RaymarchingComponent extends Component {
  private __rrnJson: NodeJSON = {
    nodes: [],
    connections: [],
  };
  private __sdSphereNodeJson = {
    id: '395df09a261a97eb',
    name: 'SdSphere',
    outputs: {
      outDistance: {
        id: 'ad50a972a9417d0a',
        label: 'Out Distance',
        socket: {
          name: 'Scalar<float>',
        },
      },
    },
    inputs: {
      position: {
        id: '37692daa15c2d683',
        label: 'Position',
        socket: {
          name: 'Vector3<float>',
        },
      },
      radius: {
        id: '7a2e51b1667d273d',
        label: 'Radius',
        socket: {
          name: 'Scalar<float>',
        },
      },
    },
    controls: {},
    position: {
      x: -0.352127266212392,
      y: -235.13699920478643,
    },
  };

  private __sdBoxNodeJson = {
    id: '395df09a261a97eb',
    name: 'SdBox',
    outputs: {
      outDistance: {
        id: 'ad50a972a9417d0a',
        label: 'Out Distance',
        socket: {
          name: 'Scalar<float>',
        },
      },
    },
    inputs: {
      position: {
        id: '37692daa15c2d683',
        label: 'Position',
        socket: {
          name: 'Vector3<float>',
        },
      },
      size: {
        id: '7a2e51b1667d273d',
        label: 'Size',
        socket: {
          name: 'Vector3<float>',
        },
      },
    },
    controls: {},
    position: {
      x: -0.352127266212392,
      y: -235.13699920478643,
    },
  };

  private __rrnJsonTemplate: NodeJSON = {
    nodes: [
      {
        id: '9bb9fc374f4d0600',
        name: 'InitialPosition',
        outputs: {
          outPosition: {
            id: '681369724380a644',
            label: 'Out Position',
            socket: {
              name: 'Vector3<float>',
            },
          },
        },
        inputs: {},
        controls: {},
        position: {
          x: -580.4537626212735,
          y: -186.78308294802224,
        },
      },
      this.__sdSphereNodeJson,
      {
        id: '823515b29e38a2b2',
        name: 'OutUnion',
        outputs: {},
        inputs: {
          in1: {
            id: '64f4769de2c33eb0',
            label: 'In Scalar<float>',
            socket: {
              name: 'Scalar<float>',
            },
          },
        },
        controls: {
          shaderStage: null,
        },
        position: {
          x: 303.79296875,
          y: -241.73046875,
        },
      },
      {
        id: '77399eb88bd6c79f',
        name: 'SdApplyWorldMatrix',
        outputs: {
          outTransformedPosition: {
            id: '785e52535b88c3cf',
            label: 'Out Transformed Position',
            socket: {
              name: 'Vector3<float>',
            },
          },
        },
        inputs: {
          position: {
            id: '149533a627739067',
            label: 'Position',
            socket: {
              name: 'Vector3<float>',
            },
          },
        },
        controls: {
          name: {
            value: `worldMatrix_${this.componentSID}`,
          },
        },
        position: {
          x: -296.95703125,
          y: -220.53125,
        },
      },
    ],
    connections: [
      {
        id: '21a87bc76a795af2',
        from: {
          id: '9bb9fc374f4d0600',
          portName: 'outPosition',
        },
        to: {
          id: '77399eb88bd6c79f',
          portName: 'position',
        },
      },
      {
        id: '8a29fc501b6b230a',
        from: {
          id: '77399eb88bd6c79f',
          portName: 'outTransformedPosition',
        },
        to: {
          id: '395df09a261a97eb',
          portName: 'position',
        },
      },
      {
        id: '569e8716db0e5d2f',
        from: {
          id: '395df09a261a97eb',
          portName: 'outDistance',
        },
        to: {
          id: '823515b29e38a2b2',
          portName: 'in1',
        },
      },
    ],
  };

  private __sdfShapeType: SdfShapeTypeEnum = SdfShapeType.Custom;
  private __uniformValueProvider?: RaymarchingUniformValueProvider;

  /**
   * Whether this raymarching component participates in ray casting.
   */
  public isPickable = true;

  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityComponent: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityComponent, isReUse);
    this.moveStageTo(ProcessStage.Logic);
  }

  /**
   * Gets the component type identifier for RaymarchingComponent.
   * @returns The component type ID for RaymarchingComponent
   */
  static get componentTID() {
    return WellKnownComponentTIDs.RaymarchingComponentTID;
  }

  /**
   * Gets the component type identifier for this RaymarchingComponent instance.
   * @returns The component type ID for RaymarchingComponent
   */
  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.RaymarchingComponentTID;
  }

  static common_$render(): boolean {
    return true;
  }

  /**
   * Sets the RRN JSON data for the RaymarchingComponent.
   * @param rrnJson - The RRN JSON data
   */
  set rrnJson(rrnJson: NodeJSON) {
    this.__rrnJson = rrnJson;
    this.__sdfShapeType = SdfShapeType.Custom;
    this.invalidateAABB();
  }

  /**
   * Gets the RRN JSON data for the RaymarchingComponent.
   * @returns The RRN JSON data
   */
  get rrnJson(): NodeJSON {
    return this.__rrnJson;
  }

  /**
   * Gets the SDF shape type for the RaymarchingComponent.
   * @returns The SDF shape type
   */
  get sdfShapeType(): SdfShapeTypeEnum {
    return this.__sdfShapeType;
  }

  /**
   * Sets the SDF shape type for the RaymarchingComponent.
   * @param sdfShapeType - The SDF shape type
   */
  set sdfShapeType(sdfShapeType: SdfShapeTypeEnum) {
    this.__sdfShapeType = sdfShapeType;
    this.invalidateAABB();

    if (sdfShapeType === SdfShapeType.Sphere) {
      const rrnJson = JSON.parse(JSON.stringify(this.__rrnJsonTemplate));
      rrnJson.nodes[1] = JSON.parse(JSON.stringify(this.__sdSphereNodeJson));
      this.__rrnJson = rrnJson;
    } else if (sdfShapeType === SdfShapeType.Box) {
      const rrnJson = JSON.parse(JSON.stringify(this.__rrnJsonTemplate));
      rrnJson.nodes[1] = JSON.parse(JSON.stringify(this.__sdBoxNodeJson));
      this.__rrnJson = rrnJson;
    } else {
      this.__rrnJson = JSON.parse(JSON.stringify(this.__rrnJsonTemplate));
    }
  }

  /**
   * Resolves a material parameter used by a Uniform shader node.
   * Set this when the raymarching material changes uniform values at runtime.
   */
  get uniformValueProvider(): RaymarchingUniformValueProvider | undefined {
    return this.__uniformValueProvider;
  }

  set uniformValueProvider(provider: RaymarchingUniformValueProvider | undefined) {
    this.__uniformValueProvider = provider;
    this.invalidateAABB();
  }

  /**
   * Invalidates the cached scene graph AABB so the merged AABB is recomputed.
   */
  invalidateAABB(): void {
    this.entity.tryToGetSceneGraph()?.setWorldAABBDirtyParentRecursively();
  }

  /**
   * Calculates a conservative world-space AABB of the SDF graph.
   * @returns The world-space bounds, or null when the graph is unbounded
   */
  calcWorldAABB(): AABB | null {
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph == null) {
      return null;
    }

    const evaluator = new RaymarchingSdfEvaluator(this.__rrnJson, sceneGraph.matrixInner, this.__uniformValueProvider);
    return evaluator.calcBounds();
  }

  /**
   * Calculates a conservative AABB in the component entity's local space.
   * This is the space ShapeComponent and PhysicsComponent use.
   * @returns The local-space bounds, or null when the graph is unbounded
   */
  calcLocalAABB(): AABB | null {
    const sceneGraph = this.entity.tryToGetSceneGraph();
    const worldAABB = this.calcWorldAABB();
    if (sceneGraph == null || worldAABB == null) {
      return null;
    }

    const inverseWorldMatrix = Matrix44.invert(sceneGraph.matrixInner);
    const localAABB = new AABB();
    AABB.multiplyMatrixTo(inverseWorldMatrix, worldAABB, localAABB);
    return localAABB.isVanilla() ? null : localAABB;
  }

  /**
   * Casts a world-space ray against the SDF graph.
   * @param originInWorld - Ray origin in world space
   * @param directionInWorld - Ray direction in world space
   * @param options - Marching options
   * @returns The hit, or undefined when the component is not pickable or missed
   */
  castRay(
    originInWorld: Vector3,
    directionInWorld: Vector3,
    options: RaymarchingRaycastOptions = {}
  ): RaymarchingRaycastHit | undefined {
    if (!this.isPickable) {
      return undefined;
    }

    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph == null) {
      return undefined;
    }

    const evaluator = new RaymarchingSdfEvaluator(this.__rrnJson, sceneGraph.matrixInner, this.__uniformValueProvider);
    const hit = evaluator.marchRay(originInWorld, directionInWorld, options);
    if (hit != null) {
      return hit;
    }
    if (hit === null) {
      return undefined;
    }

    // The graph contains a node the CPU evaluator does not understand.
    // Fall back to the conservative AABB so the entity can still be picked.
    const bounds = evaluator.calcBounds();
    if (bounds == null) {
      return undefined;
    }
    const direction = Vector3.normalize(directionInWorld);
    const interval = RaymarchingSdfEvaluator.intersectRayAabb(originInWorld, direction, bounds);
    if (interval == null) {
      return undefined;
    }
    const t = Math.max(0, interval[0]);
    return {
      t,
      position: Vector3.fromCopy3(
        originInWorld.x + direction.x * t,
        originInWorld.y + direction.y * t,
        originInWorld.z + direction.z * t
      ),
    };
  }

  /**
   * Casts a ray from screen coordinates against the SDF graph.
   * @param x - Screen x coordinate
   * @param y - Screen y coordinate
   * @param camera - Camera used to build the world-space ray
   * @param viewport - Viewport rectangle as Vector4 (x, y, width, height)
   * @param options - Marching options
   * @returns The raycast result in world space
   */
  castRayFromScreen(
    x: number,
    y: number,
    camera: CameraComponent,
    viewport: Vector4,
    options: RaymarchingRaycastOptions = {}
  ): { result: boolean; data?: RaymarchingRaycastHit } {
    const inversePVMatrix = Matrix44.invert(Matrix44.multiply(camera.projectionMatrix, camera.viewMatrix));
    const near = MathClassUtil.unProjectTo(x, y, 0, inversePVMatrix, viewport, MutableVector3.zero());
    const far = MathClassUtil.unProjectTo(x, y, 1, inversePVMatrix, viewport, MutableVector3.zero());
    const direction = Vector3.normalize(Vector3.subtract(far, near));
    const maxDistance = options.maxDistance ?? Vector3.lengthBtw(near, far);

    const hit = this.castRay(near, direction, { ...options, maxDistance });
    if (hit == null) {
      return { result: false };
    }
    return { result: true, data: hit };
  }

  /**
   * Returns an exact sphere collider when the graph is a single SdSphere.
   *
   * The result is expressed in the component entity's local space and is only
   * returned when the sphere's position chain contains SdApplyWorldMatrix,
   * which makes the SDF follow the entity transform.
   *
   * @returns The local-space sphere, or null when the graph is not a single
   * transformed sphere
   */
  calcLocalSphereCollider(): RaymarchingSphereCollider | null {
    const evaluator = new RaymarchingSdfEvaluator(this.__rrnJson, Matrix44.identity(), this.__uniformValueProvider);
    const sphere = evaluator.calcSphere();
    if (sphere == null || !sphere.usesWorldMatrix) {
      return null;
    }
    return { center: sphere.center, radius: sphere.radius };
  }

  /**
   * Adds a collider shape for the SDF.
   *
   * Uses an exact sphere when the graph is a single transformed sphere;
   * otherwise falls back to a conservative AABB box.
   *
   * @param options - Shape creation options
   * @returns The created shape information, or undefined when no finite shape exists
   */
  addColliderShape(options: RaymarchingColliderShapeOptions = {}): RaymarchingColliderShapeResult | undefined {
    const sphere = this.calcLocalSphereCollider();
    if (sphere != null) {
      const shapeComponent = this.__getOrCreateShapeComponent(options.shapeComponent);
      if (shapeComponent == null) {
        return undefined;
      }
      const shapeIndex = shapeComponent.addShape(
        { type: 'sphere', radius: sphere.radius },
        { position: sphere.center }
      );
      return { shapeIndex, shapeType: 'sphere', center: sphere.center, radius: sphere.radius };
    }

    const localAABB = options.aabb ?? this.calcLocalAABB();
    if (localAABB == null || localAABB.isVanilla()) {
      return undefined;
    }
    if (localAABB.sizeX <= 0 || localAABB.sizeY <= 0 || localAABB.sizeZ <= 0) {
      return undefined;
    }

    const shapeComponent = this.__getOrCreateShapeComponent(options.shapeComponent);
    if (shapeComponent == null) {
      return undefined;
    }
    const shapeIndex = shapeComponent.addBoxFromAabb(localAABB, { origin: options.origin });
    return { shapeIndex, shapeType: 'box', aabb: localAABB };
  }

  /**
   * Adds a box shape fitted to the SDF bounds to a ShapeComponent.
   * The shape can then be bound to a PhysicsComponent as a collider.
   * @param options - Shape creation options
   * @returns The new shape index, or undefined when no finite bounds exist
   */
  addAabbBoxShape(options: RaymarchingAabbShapeOptions = {}): number | undefined {
    const localAABB = options.aabb ?? this.calcLocalAABB();
    if (localAABB == null || localAABB.isVanilla()) {
      return undefined;
    }
    if (localAABB.sizeX <= 0 || localAABB.sizeY <= 0 || localAABB.sizeZ <= 0) {
      return undefined;
    }

    const shapeComponent = this.__getOrCreateShapeComponent(options.shapeComponent);
    if (shapeComponent == null) {
      return undefined;
    }

    return shapeComponent.addBoxFromAabb(localAABB, { origin: options.origin });
  }

  private __getOrCreateShapeComponent(shapeComponent?: ShapeComponent): ShapeComponent | undefined {
    let component = shapeComponent ?? this.entity.tryToGetShape();
    if (component == null) {
      this.__entityRepository.tryToAddComponentToEntityByTID(WellKnownComponentTIDs.ShapeComponentTID, this.entity);
      component = this.entity.tryToGetShape();
    }
    return component;
  }

  /**
   * Creates a shallow copy of this RaymarchingComponent from another RaymarchingComponent.
   * @param component - The source component to copy from
   * @protected
   */
  _shallowCopyFrom(component: Component): void {
    super._shallowCopyFrom(component);
    const raymarchingComponent = component as RaymarchingComponent;
    this.__rrnJson = JSON.parse(JSON.stringify(raymarchingComponent.__rrnJson));
    this.__sdfShapeType = raymarchingComponent.__sdfShapeType;
    this.__uniformValueProvider = raymarchingComponent.__uniformValueProvider;
    this.isPickable = raymarchingComponent.isPickable;
    this.invalidateAABB();
  }

  /**
   * Destroys this RaymarchingComponent and cleans up resources.
   * @protected
   */
  _destroy(): void {
    this.invalidateAABB();
    super._destroy();
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    /**
     * RaymarchingEntity is a mixin that adds raymarching-specific methods to the base entity.
     * @extends EntityBase
     */
    class RaymarchingEntity extends (base.constructor as any) {
      /**
       * Gets the RaymarchingComponent associated with this entity.
       * @returns The RaymarchingComponent instance
       */
      getRaymarching() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.RaymarchingComponentTID) as RaymarchingComponent;
      }
    }
    applyMixins(base, RaymarchingEntity);
    base.tryToGetSceneGraph()?.setWorldAABBDirtyParentRecursively();
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}
