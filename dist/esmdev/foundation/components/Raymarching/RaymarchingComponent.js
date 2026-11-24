// src/foundation/components/Raymarching/RaymarchingComponent.ts
import { Component } from "../../core/Component.js";
import { applyMixins } from "../../core/EntityRepository.js";
import { ProcessStage } from "../../definitions/ProcessStage.js";
import { SdfShapeType } from "../../definitions/SdfShapeType.js";
import { AABB } from "../../math/AABB.js";
import { MathClassUtil } from "../../math/MathClassUtil.js";
import { Matrix44 } from "../../math/Matrix44.js";
import { MutableVector3 } from "../../math/MutableVector3.js";
import { Vector3 } from "../../math/Vector3.js";
import { ShapeComponent } from "../Shape/ShapeComponent.js";
import { WellKnownComponentTIDs } from "../WellKnownComponentTIDs.js";
import {
  RaymarchingSdfEvaluator
} from "./RaymarchingSdfEvaluator.js";
var _RaymarchingComponent = class _RaymarchingComponent extends Component {
  constructor(engine, entityUid, componentSid, entityComponent, isReUse) {
    super(engine, entityUid, componentSid, entityComponent, isReUse);
    this.Ce = {
      nodes: [],
      connections: []
    };
    this.Ge = {
      id: "395df09a261a97eb",
      name: "SdSphere",
      outputs: {
        outDistance: {
          id: "ad50a972a9417d0a",
          label: "Out Distance",
          socket: {
            name: "Scalar<float>"
          }
        }
      },
      inputs: {
        position: {
          id: "37692daa15c2d683",
          label: "Position",
          socket: {
            name: "Vector3<float>"
          }
        },
        radius: {
          id: "7a2e51b1667d273d",
          label: "Radius",
          socket: {
            name: "Scalar<float>"
          }
        }
      },
      controls: {},
      position: {
        x: -0.352127266212392,
        y: -235.13699920478643
      }
    };
    this.Le = {
      id: "395df09a261a97eb",
      name: "SdBox",
      outputs: {
        outDistance: {
          id: "ad50a972a9417d0a",
          label: "Out Distance",
          socket: {
            name: "Scalar<float>"
          }
        }
      },
      inputs: {
        position: {
          id: "37692daa15c2d683",
          label: "Position",
          socket: {
            name: "Vector3<float>"
          }
        },
        size: {
          id: "7a2e51b1667d273d",
          label: "Size",
          socket: {
            name: "Vector3<float>"
          }
        }
      },
      controls: {},
      position: {
        x: -0.352127266212392,
        y: -235.13699920478643
      }
    };
    this.Me = {
      id: "395df09a261a97eb",
      name: "SdTorus",
      outputs: {
        outDistance: {
          id: "ad50a972a9417d0a",
          label: "Out Distance",
          socket: {
            name: "Scalar<float>"
          }
        }
      },
      inputs: {
        position: {
          id: "37692daa15c2d683",
          label: "Position",
          socket: {
            name: "Vector3<float>"
          }
        },
        radius: {
          id: "7a2e51b1667d273d",
          label: "Radius",
          socket: {
            name: "Scalar<float>"
          }
        },
        tubeRadius: {
          id: "8f3c2a6d4b1e9075",
          label: "Tube Radius",
          socket: {
            name: "Scalar<float>"
          }
        }
      },
      controls: {},
      position: {
        x: -0.352127266212392,
        y: -235.13699920478643
      }
    };
    this.Ne = {
      id: "395df09a261a97eb",
      name: "SdCapsule",
      outputs: {
        outDistance: {
          id: "ad50a972a9417d0a",
          label: "Out Distance",
          socket: {
            name: "Scalar<float>"
          }
        }
      },
      inputs: {
        position: {
          id: "37692daa15c2d683",
          label: "Position",
          socket: {
            name: "Vector3<float>"
          }
        },
        pointA: {
          id: "4c7e1d9a3b6f2508",
          label: "Point A",
          socket: {
            name: "Vector3<float>"
          }
        },
        pointB: {
          id: "a1b5c9e3d7f20486",
          label: "Point B",
          socket: {
            name: "Vector3<float>"
          }
        },
        radius: {
          id: "7a2e51b1667d273d",
          label: "Radius",
          socket: {
            name: "Scalar<float>"
          }
        }
      },
      controls: {},
      position: {
        x: -0.352127266212392,
        y: -235.13699920478643
      }
    };
    this.Oe = {
      id: "395df09a261a97eb",
      name: "SdRoundBox",
      outputs: {
        outDistance: {
          id: "ad50a972a9417d0a",
          label: "Out Distance",
          socket: {
            name: "Scalar<float>"
          }
        }
      },
      inputs: {
        position: {
          id: "37692daa15c2d683",
          label: "Position",
          socket: {
            name: "Vector3<float>"
          }
        },
        size: {
          id: "e2f7a9c4b1d63508",
          label: "Size",
          socket: {
            name: "Vector3<float>"
          }
        },
        radius: {
          id: "6d2b8f4a1c9e7530",
          label: "Radius",
          socket: {
            name: "Scalar<float>"
          }
        }
      },
      controls: {},
      position: {
        x: -0.352127266212392,
        y: -235.13699920478643
      }
    };
    this.Pe = {
      nodes: [
        {
          id: "9bb9fc374f4d0600",
          name: "InitialPosition",
          outputs: {
            outPosition: {
              id: "681369724380a644",
              label: "Out Position",
              socket: {
                name: "Vector3<float>"
              }
            }
          },
          inputs: {},
          controls: {},
          position: {
            x: -580.4537626212735,
            y: -186.78308294802224
          }
        },
        this.Ge,
        {
          id: "823515b29e38a2b2",
          name: "OutUnion",
          outputs: {},
          inputs: {
            in1: {
              id: "64f4769de2c33eb0",
              label: "In Scalar<float>",
              socket: {
                name: "Scalar<float>"
              }
            }
          },
          controls: {
            shaderStage: null
          },
          position: {
            x: 303.79296875,
            y: -241.73046875
          }
        },
        {
          id: "77399eb88bd6c79f",
          name: "SdApplyWorldMatrix",
          outputs: {
            outTransformedPosition: {
              id: "785e52535b88c3cf",
              label: "Out Transformed Position",
              socket: {
                name: "Vector3<float>"
              }
            }
          },
          inputs: {
            position: {
              id: "149533a627739067",
              label: "Position",
              socket: {
                name: "Vector3<float>"
              }
            }
          },
          controls: {
            name: {
              value: `worldMatrix_${this.componentSID}`
            }
          },
          position: {
            x: -296.95703125,
            y: -220.53125
          }
        }
      ],
      connections: [
        {
          id: "21a87bc76a795af2",
          from: {
            id: "9bb9fc374f4d0600",
            portName: "outPosition"
          },
          to: {
            id: "77399eb88bd6c79f",
            portName: "position"
          }
        },
        {
          id: "8a29fc501b6b230a",
          from: {
            id: "77399eb88bd6c79f",
            portName: "outTransformedPosition"
          },
          to: {
            id: "395df09a261a97eb",
            portName: "position"
          }
        },
        {
          id: "569e8716db0e5d2f",
          from: {
            id: "395df09a261a97eb",
            portName: "outDistance"
          },
          to: {
            id: "823515b29e38a2b2",
            portName: "in1"
          }
        }
      ]
    };
    this.Fe = SdfShapeType.Custom;
    this.De = [];
    /**
     * Whether this raymarching component participates in ray casting.
     */
    this.isPickable = true;
    /**
     * Whether the SDF of this raymarching component is rendered into the shadow maps.
     * Casting components are merged into the shadow caster material; non-casting ones are
     * left out so they do not occlude casting SDFs behind them.
     */
    this.castShadow = true;
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
  get componentTID() {
    return WellKnownComponentTIDs.RaymarchingComponentTID;
  }
  static common_$render() {
    return true;
  }
  /**
   * Sets the RRN JSON data for the RaymarchingComponent.
   * @param rrnJson - The RRN JSON data
   */
  set rrnJson(rrnJson) {
    this.Ce = rrnJson;
    this.Fe = SdfShapeType.Custom;
    this.invalidateAABB();
  }
  /**
   * Gets the RRN JSON data for the RaymarchingComponent.
   * @returns The RRN JSON data
   */
  get rrnJson() {
    return this.Ce;
  }
  /**
   * Gets the SDF shape type for the RaymarchingComponent.
   * @returns The SDF shape type
   */
  get sdfShapeType() {
    return this.Fe;
  }
  /**
   * Sets the SDF shape type for the RaymarchingComponent.
   * @param sdfShapeType - The SDF shape type
   */
  set sdfShapeType(sdfShapeType) {
    this.Fe = sdfShapeType;
    this.invalidateAABB();
    const rrnJson = JSON.parse(JSON.stringify(this.Pe));
    const presetNodeJson = this.Qe(sdfShapeType);
    if (presetNodeJson != null) {
      rrnJson.nodes[1] = JSON.parse(JSON.stringify(presetNodeJson));
    }
    this.Ce = rrnJson;
  }
  /**
   * Returns the preset SDF node JSON that replaces the template's placeholder node.
   * Custom (a graph authored in the node editor) has no preset node.
   */
  Qe(sdfShapeType) {
    switch (sdfShapeType) {
      case SdfShapeType.Sphere:
        return this.Ge;
      case SdfShapeType.Box:
        return this.Le;
      case SdfShapeType.Torus:
        return this.Me;
      case SdfShapeType.Capsule:
        return this.Ne;
      case SdfShapeType.RoundBox:
        return this.Oe;
      default:
        return void 0;
    }
  }
  /**
   * Resolves a material parameter used by a Uniform shader node.
   * Set this when the raymarching material changes uniform values at runtime.
   */
  get uniformValueProvider() {
    return this.Ee;
  }
  set uniformValueProvider(provider) {
    this.Ee = provider;
    this.invalidateAABB();
  }
  /**
   * Invalidates the cached scene graph AABB so the merged AABB is recomputed.
   */
  invalidateAABB() {
    var _a;
    (_a = this.entity.tryToGetSceneGraph()) == null ? void 0 : _a.setWorldAABBDirtyParentRecursively();
    _RaymarchingComponent.He.set(this.c, _RaymarchingComponent.getAABBVersion(this.c) + 1);
  }
  /**
   * A version that changes whenever any raymarching component's AABB may have changed.
   * The shadow volume auto-fit uses it as part of its cache key.
   */
  static getAABBVersion(engine) {
    var _a;
    return (_a = _RaymarchingComponent.He.get(engine)) != null ? _a : 0;
  }
  /**
   * Calculates a conservative world-space AABB of the SDF graph.
   * @returns The world-space bounds, or null when the graph is unbounded
   */
  calcWorldAABB() {
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph == null) {
      return null;
    }
    const evaluator = new RaymarchingSdfEvaluator(this.Ce, sceneGraph.matrixInner, this.Ee);
    return evaluator.calcBounds();
  }
  /**
   * Calculates a conservative AABB in the component entity's local space.
   * This is the space ShapeComponent and PhysicsComponent use.
   * @returns The local-space bounds, or null when the graph is unbounded
   */
  calcLocalAABB() {
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
  castRay(originInWorld, directionInWorld, options = {}) {
    if (!this.isPickable) {
      return void 0;
    }
    const sceneGraph = this.entity.tryToGetSceneGraph();
    if (sceneGraph == null) {
      return void 0;
    }
    const evaluator = new RaymarchingSdfEvaluator(this.Ce, sceneGraph.matrixInner, this.Ee);
    const hit = evaluator.marchRay(originInWorld, directionInWorld, options);
    if (hit != null) {
      return hit;
    }
    if (hit === null) {
      return void 0;
    }
    const bounds = evaluator.calcBounds();
    if (bounds == null) {
      return void 0;
    }
    const direction = Vector3.normalize(directionInWorld);
    const interval = RaymarchingSdfEvaluator.intersectRayAabb(originInWorld, direction, bounds);
    if (interval == null) {
      return void 0;
    }
    const t = Math.max(0, interval[0]);
    return {
      t,
      position: Vector3.fromCopy3(
        originInWorld.x + direction.x * t,
        originInWorld.y + direction.y * t,
        originInWorld.z + direction.z * t
      )
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
  castRayFromScreen(x, y, camera, viewport, options = {}) {
    var _a;
    const inversePVMatrix = Matrix44.invert(Matrix44.multiply(camera.projectionMatrix, camera.viewMatrix));
    const near = MathClassUtil.unProjectTo(x, y, 0, inversePVMatrix, viewport, MutableVector3.zero());
    const far = MathClassUtil.unProjectTo(x, y, 1, inversePVMatrix, viewport, MutableVector3.zero());
    const direction = Vector3.normalize(Vector3.subtract(far, near));
    const maxDistance = (_a = options.maxDistance) != null ? _a : Vector3.lengthBtw(near, far);
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
  calcLocalSphereCollider() {
    const evaluator = new RaymarchingSdfEvaluator(this.Ce, Matrix44.identity(), this.Ee);
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
  addColliderShape(options = {}) {
    const descriptor = this.Ie(options.aabb);
    if (descriptor == null) {
      return void 0;
    }
    const shapeComponent = this.Je(options.shapeComponent);
    if (shapeComponent == null) {
      return void 0;
    }
    if (descriptor.shapeType === "sphere") {
      const shapeIndex2 = shapeComponent.addShape(
        { type: "sphere", radius: descriptor.radius },
        { position: descriptor.center }
      );
      this.Ke(shapeIndex2, shapeComponent);
      return { shapeIndex: shapeIndex2, shapeType: "sphere", center: descriptor.center, radius: descriptor.radius };
    }
    const shapeIndex = shapeComponent.addBoxFromAabb(descriptor.aabb, { origin: options.origin });
    this.Ke(shapeIndex, shapeComponent);
    return { shapeIndex, shapeType: "box", aabb: descriptor.aabb };
  }
  /**
   * Recomputes every collider shape previously created by addColliderShape().
   *
   * Shapes are replaced in place so physics bindings keep their shape indices,
   * and the entity's PhysicsComponent is rebuilt when anything changed. When the
   * SDF no longer has a finite collider shape, the generated shapes and their
   * bindings are removed.
   *
   * @returns The number of collider shapes that were updated or removed
   */
  updateColliderShapes() {
    if (this.De.length === 0) {
      return 0;
    }
    const shapeComponent = this.entity.tryToGetShape();
    if (shapeComponent == null) {
      this.De = [];
      return 0;
    }
    const descriptor = this.Ie();
    const physicsComponent = this.entity.tryToGetPhysics();
    const keptIndices = [];
    let updated = 0;
    let removed = 0;
    for (const shapeIndex of this.De) {
      const existing = shapeComponent.getShape(shapeIndex);
      if (existing == null) {
        continue;
      }
      if (descriptor == null) {
        physicsComponent == null ? void 0 : physicsComponent.removeShapeBindingsForShape(shapeComponent, shapeIndex);
        shapeComponent.removeShape(shapeIndex);
        removed++;
        continue;
      }
      if (_RaymarchingComponent.Re(existing, descriptor)) {
        keptIndices.push(shapeIndex);
        continue;
      }
      if (descriptor.shapeType === "sphere") {
        shapeComponent.updateShape(
          shapeIndex,
          { type: "sphere", radius: descriptor.radius },
          { position: descriptor.center }
        );
      } else {
        shapeComponent.updateShape(
          shapeIndex,
          {
            type: "box",
            size: Vector3.fromCopy3(descriptor.aabb.sizeX, descriptor.aabb.sizeY, descriptor.aabb.sizeZ)
          },
          { position: descriptor.aabb.centerPoint }
        );
      }
      keptIndices.push(shapeIndex);
      updated++;
    }
    this.De = keptIndices;
    if (updated > 0 && physicsComponent != null && physicsComponent.shapeBindingCount > 0 && physicsComponent.strategy != null) {
      physicsComponent.rebuildShapeBindings();
    }
    return updated + removed;
  }
  Ie(aabb) {
    const sphere = this.calcLocalSphereCollider();
    if (sphere != null) {
      return { shapeType: "sphere", center: sphere.center, radius: sphere.radius };
    }
    const localAABB = aabb != null ? aabb : this.calcLocalAABB();
    if (localAABB == null || localAABB.isVanilla()) {
      return void 0;
    }
    if (localAABB.sizeX <= 0 || localAABB.sizeY <= 0 || localAABB.sizeZ <= 0) {
      return void 0;
    }
    return { shapeType: "box", aabb: localAABB };
  }
  Ke(shapeIndex, shapeComponent) {
    if (shapeComponent !== this.entity.tryToGetShape()) {
      return;
    }
    if (!this.De.includes(shapeIndex)) {
      this.De.push(shapeIndex);
    }
  }
  static Re(instance, descriptor) {
    const isNear = (a, b) => Math.abs(a - b) <= 1e-5 * Math.max(1, Math.abs(a), Math.abs(b));
    const isSamePosition = (position) => isNear(instance.localPosition.x, position.x) && isNear(instance.localPosition.y, position.y) && isNear(instance.localPosition.z, position.z);
    if (descriptor.shapeType === "sphere") {
      return instance.shape.type === "sphere" && isNear(instance.shape.radius, descriptor.radius) && isSamePosition(descriptor.center);
    }
    return instance.shape.type === "box" && isNear(instance.shape.size.x, descriptor.aabb.sizeX) && isNear(instance.shape.size.y, descriptor.aabb.sizeY) && isNear(instance.shape.size.z, descriptor.aabb.sizeZ) && isSamePosition(descriptor.aabb.centerPoint);
  }
  /**
   * Adds a box shape fitted to the SDF bounds to a ShapeComponent.
   * The shape can then be bound to a PhysicsComponent as a collider.
   * @param options - Shape creation options
   * @returns The new shape index, or undefined when no finite bounds exist
   */
  addAabbBoxShape(options = {}) {
    var _a;
    const localAABB = (_a = options.aabb) != null ? _a : this.calcLocalAABB();
    if (localAABB == null || localAABB.isVanilla()) {
      return void 0;
    }
    if (localAABB.sizeX <= 0 || localAABB.sizeY <= 0 || localAABB.sizeZ <= 0) {
      return void 0;
    }
    const shapeComponent = this.Je(options.shapeComponent);
    if (shapeComponent == null) {
      return void 0;
    }
    return shapeComponent.addBoxFromAabb(localAABB, { origin: options.origin });
  }
  Je(shapeComponent) {
    let component = shapeComponent != null ? shapeComponent : this.entity.tryToGetShape();
    if (component == null) {
      this.Se.addComponentToEntity(ShapeComponent, this.entity);
      component = this.entity.tryToGetShape();
    }
    return component;
  }
  /**
   * Creates a shallow copy of this RaymarchingComponent from another RaymarchingComponent.
   * @param component - The source component to copy from
   * @protected
   */
  _shallowCopyFrom(component) {
    super._shallowCopyFrom(component);
    const raymarchingComponent = component;
    this.Ce = JSON.parse(JSON.stringify(raymarchingComponent.Ce));
    this.Fe = raymarchingComponent.Fe;
    this.Ee = raymarchingComponent.Ee;
    this.De = [...raymarchingComponent.De];
    this.isPickable = raymarchingComponent.isPickable;
    this.castShadow = raymarchingComponent.castShadow;
    this.invalidateAABB();
  }
  /**
   * Destroys this RaymarchingComponent and cleans up resources.
   * @protected
   */
  _destroy() {
    this.invalidateAABB();
    super._destroy();
  }
  addThisComponentToEntity(base, _componentClass) {
    var _a;
    class RaymarchingEntity extends base.constructor {
      /**
       * Gets the RaymarchingComponent associated with this entity.
       * @returns The RaymarchingComponent instance
       */
      getRaymarching() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.RaymarchingComponentTID);
      }
    }
    applyMixins(base, RaymarchingEntity);
    (_a = base.tryToGetSceneGraph()) == null ? void 0 : _a.setWorldAABBDirtyParentRecursively();
    return base;
  }
};
_RaymarchingComponent.He = /* @__PURE__ */ new WeakMap();
var RaymarchingComponent = _RaymarchingComponent;
export {
  RaymarchingComponent
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29tcG9uZW50cy9SYXltYXJjaGluZy9SYXltYXJjaGluZ0NvbXBvbmVudC50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb21wb25lbnRTSUQsIENvbXBvbmVudFRJRCwgRW50aXR5VUlEIH0gZnJvbSAnLi4vLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBOb2RlSlNPTiB9IGZyb20gJy4uLy4uLy4uL3R5cGVzL05vZGVKU09OJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4uLy4uL2NvcmUvQ29tcG9uZW50JztcbmltcG9ydCB0eXBlIHsgSUVudGl0eSB9IGZyb20gJy4uLy4uL2NvcmUvRW50aXR5JztcbmltcG9ydCB7IGFwcGx5TWl4aW5zLCB0eXBlIEVudGl0eVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9jb3JlL0VudGl0eVJlcG9zaXRvcnknO1xuaW1wb3J0IHsgUHJvY2Vzc1N0YWdlIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc1N0YWdlJztcbmltcG9ydCB7IFNkZlNoYXBlVHlwZSwgdHlwZSBTZGZTaGFwZVR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvU2RmU2hhcGVUeXBlJztcbmltcG9ydCB0eXBlIHsgU2hhcGVJbnN0YW5jZSB9IGZyb20gJy4uLy4uL2dlb21ldHJ5L1NoYXBlJztcbmltcG9ydCB7IEFBQkIgfSBmcm9tICcuLi8uLi9tYXRoL0FBQkInO1xuaW1wb3J0IHR5cGUgeyBJVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgeyBNYXRoQ2xhc3NVdGlsIH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRoQ2xhc3NVdGlsJztcbmltcG9ydCB7IE1hdHJpeDQ0IH0gZnJvbSAnLi4vLi4vbWF0aC9NYXRyaXg0NCc7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uLy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgdHlwZSB7IFZlY3RvcjQgfSBmcm9tICcuLi8uLi9tYXRoL1ZlY3RvcjQnO1xuaW1wb3J0IHR5cGUgeyBFbmdpbmUgfSBmcm9tICcuLi8uLi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgQ2FtZXJhQ29tcG9uZW50IH0gZnJvbSAnLi4vQ2FtZXJhL0NhbWVyYUNvbXBvbmVudCc7XG5pbXBvcnQgdHlwZSB7IENvbXBvbmVudFRvQ29tcG9uZW50TWV0aG9kcyB9IGZyb20gJy4uL0NvbXBvbmVudFR5cGVzJztcbmltcG9ydCB7IFNoYXBlQ29tcG9uZW50IH0gZnJvbSAnLi4vU2hhcGUvU2hhcGVDb21wb25lbnQnO1xuaW1wb3J0IHsgV2VsbEtub3duQ29tcG9uZW50VElEcyB9IGZyb20gJy4uL1dlbGxLbm93bkNvbXBvbmVudFRJRHMnO1xuaW1wb3J0IHtcbiAgdHlwZSBSYXltYXJjaGluZ1JheWNhc3RIaXQsXG4gIHR5cGUgUmF5bWFyY2hpbmdSYXljYXN0T3B0aW9ucyxcbiAgUmF5bWFyY2hpbmdTZGZFdmFsdWF0b3IsXG4gIHR5cGUgUmF5bWFyY2hpbmdVbmlmb3JtVmFsdWVQcm92aWRlcixcbn0gZnJvbSAnLi9SYXltYXJjaGluZ1NkZkV2YWx1YXRvcic7XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgY3JlYXRpbmcgYSBib3ggc2hhcGUgZnJvbSB0aGUgU0RGIGJvdW5kcy5cbiAqL1xuZXhwb3J0IHR5cGUgUmF5bWFyY2hpbmdBYWJiU2hhcGVPcHRpb25zID0ge1xuICAvKiogTG9jYWwtc3BhY2UgQUFCQiB0byB1c2UgaW5zdGVhZCBvZiB0aGUgb25lIGNvbXB1dGVkIGZyb20gdGhlIFNERiBncmFwaC4gKi9cbiAgYWFiYj86IEFBQkI7XG4gIC8qKiBTaGFwZUNvbXBvbmVudCB0aGF0IHJlY2VpdmVzIHRoZSBib3guIERlZmF1bHRzIHRvIHRoZSBlbnRpdHkncyBTaGFwZUNvbXBvbmVudC4gKi9cbiAgc2hhcGVDb21wb25lbnQ/OiBTaGFwZUNvbXBvbmVudDtcbiAgLyoqIE9yaWdpbiBleHByZXNzZWQgaW4gdGhlIHNhbWUgbG9jYWwgc3BhY2UgYXMgdGhlIEFBQkIuICovXG4gIG9yaWdpbj86IElWZWN0b3IzO1xufTtcblxuLyoqXG4gKiBBIHNwaGVyZSBjb2xsaWRlciBleHRyYWN0ZWQgZnJvbSBhIHNpbmdsZS1zcGhlcmUgU0RGIGdyYXBoLlxuICovXG5leHBvcnQgdHlwZSBSYXltYXJjaGluZ1NwaGVyZUNvbGxpZGVyID0ge1xuICAvKiogU3BoZXJlIGNlbnRlciBpbiB0aGUgY29tcG9uZW50IGVudGl0eSdzIGxvY2FsIHNwYWNlLiAqL1xuICBjZW50ZXI6IFZlY3RvcjM7XG4gIC8qKiBTcGhlcmUgcmFkaXVzIGluIHRoZSBjb21wb25lbnQgZW50aXR5J3MgbG9jYWwgc3BhY2UuICovXG4gIHJhZGl1czogbnVtYmVyO1xufTtcblxuLyoqXG4gKiBPcHRpb25zIGZvciBjcmVhdGluZyBhIGNvbGxpZGVyIHNoYXBlIGZyb20gdGhlIFNERi5cbiAqL1xuZXhwb3J0IHR5cGUgUmF5bWFyY2hpbmdDb2xsaWRlclNoYXBlT3B0aW9ucyA9IHtcbiAgLyoqIExvY2FsLXNwYWNlIEFBQkIgdG8gdXNlIGZvciB0aGUgYm94IGZhbGxiYWNrLiAqL1xuICBhYWJiPzogQUFCQjtcbiAgLyoqIFNoYXBlQ29tcG9uZW50IHRoYXQgcmVjZWl2ZXMgdGhlIHNoYXBlLiBEZWZhdWx0cyB0byB0aGUgZW50aXR5J3MgU2hhcGVDb21wb25lbnQuICovXG4gIHNoYXBlQ29tcG9uZW50PzogU2hhcGVDb21wb25lbnQ7XG4gIC8qKiBPcmlnaW4gZXhwcmVzc2VkIGluIHRoZSBzYW1lIGxvY2FsIHNwYWNlIGFzIHRoZSBBQUJCIChib3ggZmFsbGJhY2sgb25seSkuICovXG4gIG9yaWdpbj86IElWZWN0b3IzO1xufTtcblxuLyoqXG4gKiBBIGNvbGxpZGVyIHNoYXBlIGRlc2NyaXB0b3IgY29tcHV0ZWQgZnJvbSBhbiBTREYgZ3JhcGguXG4gKi9cbmV4cG9ydCB0eXBlIFJheW1hcmNoaW5nQ29sbGlkZXJTaGFwZURlc2NyaXB0b3IgPVxuICB8IHsgc2hhcGVUeXBlOiAnc3BoZXJlJzsgY2VudGVyOiBWZWN0b3IzOyByYWRpdXM6IG51bWJlciB9XG4gIHwgeyBzaGFwZVR5cGU6ICdib3gnOyBhYWJiOiBBQUJCIH07XG5cbi8qKlxuICogVGhlIGNvbGxpZGVyIHNoYXBlIGNyZWF0ZWQgZnJvbSBhbiBTREYgZ3JhcGguXG4gKi9cbmV4cG9ydCB0eXBlIFJheW1hcmNoaW5nQ29sbGlkZXJTaGFwZVJlc3VsdCA9XG4gIHwgeyBzaGFwZUluZGV4OiBudW1iZXI7IHNoYXBlVHlwZTogJ3NwaGVyZSc7IGNlbnRlcjogVmVjdG9yMzsgcmFkaXVzOiBudW1iZXIgfVxuICB8IHsgc2hhcGVJbmRleDogbnVtYmVyOyBzaGFwZVR5cGU6ICdib3gnOyBhYWJiOiBBQUJCIH07XG5cbi8qKlxuICogUmF5bWFyY2hpbmdDb21wb25lbnQgaXMgYSBjb21wb25lbnQgdGhhdCBtYW5hZ2VzIHJheW1hcmNoaW5nIGZvciBhbiBlbnRpdHkuXG4gKiBUaGlzIGNvbXBvbmVudCBoYW5kbGVzIHRoZSByYXltYXJjaGluZyBvZiB0aGUgZW50aXR5LlxuICovXG5leHBvcnQgY2xhc3MgUmF5bWFyY2hpbmdDb21wb25lbnQgZXh0ZW5kcyBDb21wb25lbnQge1xuICBwcml2YXRlIF9fcnJuSnNvbjogTm9kZUpTT04gPSB7XG4gICAgbm9kZXM6IFtdLFxuICAgIGNvbm5lY3Rpb25zOiBbXSxcbiAgfTtcbiAgcHJpdmF0ZSBfX3NkU3BoZXJlTm9kZUpzb24gPSB7XG4gICAgaWQ6ICczOTVkZjA5YTI2MWE5N2ViJyxcbiAgICBuYW1lOiAnU2RTcGhlcmUnLFxuICAgIG91dHB1dHM6IHtcbiAgICAgIG91dERpc3RhbmNlOiB7XG4gICAgICAgIGlkOiAnYWQ1MGE5NzJhOTQxN2QwYScsXG4gICAgICAgIGxhYmVsOiAnT3V0IERpc3RhbmNlJyxcbiAgICAgICAgc29ja2V0OiB7XG4gICAgICAgICAgbmFtZTogJ1NjYWxhcjxmbG9hdD4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIGlucHV0czoge1xuICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgaWQ6ICczNzY5MmRhYTE1YzJkNjgzJyxcbiAgICAgICAgbGFiZWw6ICdQb3NpdGlvbicsXG4gICAgICAgIHNvY2tldDoge1xuICAgICAgICAgIG5hbWU6ICdWZWN0b3IzPGZsb2F0PicsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgcmFkaXVzOiB7XG4gICAgICAgIGlkOiAnN2EyZTUxYjE2NjdkMjczZCcsXG4gICAgICAgIGxhYmVsOiAnUmFkaXVzJyxcbiAgICAgICAgc29ja2V0OiB7XG4gICAgICAgICAgbmFtZTogJ1NjYWxhcjxmbG9hdD4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIGNvbnRyb2xzOiB7fSxcbiAgICBwb3NpdGlvbjoge1xuICAgICAgeDogLTAuMzUyMTI3MjY2MjEyMzkyLFxuICAgICAgeTogLTIzNS4xMzY5OTkyMDQ3ODY0MyxcbiAgICB9LFxuICB9O1xuXG4gIHByaXZhdGUgX19zZEJveE5vZGVKc29uID0ge1xuICAgIGlkOiAnMzk1ZGYwOWEyNjFhOTdlYicsXG4gICAgbmFtZTogJ1NkQm94JyxcbiAgICBvdXRwdXRzOiB7XG4gICAgICBvdXREaXN0YW5jZToge1xuICAgICAgICBpZDogJ2FkNTBhOTcyYTk0MTdkMGEnLFxuICAgICAgICBsYWJlbDogJ091dCBEaXN0YW5jZScsXG4gICAgICAgIHNvY2tldDoge1xuICAgICAgICAgIG5hbWU6ICdTY2FsYXI8ZmxvYXQ+JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBpbnB1dHM6IHtcbiAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgIGlkOiAnMzc2OTJkYWExNWMyZDY4MycsXG4gICAgICAgIGxhYmVsOiAnUG9zaXRpb24nLFxuICAgICAgICBzb2NrZXQ6IHtcbiAgICAgICAgICBuYW1lOiAnVmVjdG9yMzxmbG9hdD4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHNpemU6IHtcbiAgICAgICAgaWQ6ICc3YTJlNTFiMTY2N2QyNzNkJyxcbiAgICAgICAgbGFiZWw6ICdTaXplJyxcbiAgICAgICAgc29ja2V0OiB7XG4gICAgICAgICAgbmFtZTogJ1ZlY3RvcjM8ZmxvYXQ+JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjb250cm9sczoge30sXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IC0wLjM1MjEyNzI2NjIxMjM5MixcbiAgICAgIHk6IC0yMzUuMTM2OTk5MjA0Nzg2NDMsXG4gICAgfSxcbiAgfTtcblxuICBwcml2YXRlIF9fc2RUb3J1c05vZGVKc29uID0ge1xuICAgIGlkOiAnMzk1ZGYwOWEyNjFhOTdlYicsXG4gICAgbmFtZTogJ1NkVG9ydXMnLFxuICAgIG91dHB1dHM6IHtcbiAgICAgIG91dERpc3RhbmNlOiB7XG4gICAgICAgIGlkOiAnYWQ1MGE5NzJhOTQxN2QwYScsXG4gICAgICAgIGxhYmVsOiAnT3V0IERpc3RhbmNlJyxcbiAgICAgICAgc29ja2V0OiB7XG4gICAgICAgICAgbmFtZTogJ1NjYWxhcjxmbG9hdD4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIGlucHV0czoge1xuICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgaWQ6ICczNzY5MmRhYTE1YzJkNjgzJyxcbiAgICAgICAgbGFiZWw6ICdQb3NpdGlvbicsXG4gICAgICAgIHNvY2tldDoge1xuICAgICAgICAgIG5hbWU6ICdWZWN0b3IzPGZsb2F0PicsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgcmFkaXVzOiB7XG4gICAgICAgIGlkOiAnN2EyZTUxYjE2NjdkMjczZCcsXG4gICAgICAgIGxhYmVsOiAnUmFkaXVzJyxcbiAgICAgICAgc29ja2V0OiB7XG4gICAgICAgICAgbmFtZTogJ1NjYWxhcjxmbG9hdD4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHR1YmVSYWRpdXM6IHtcbiAgICAgICAgaWQ6ICc4ZjNjMmE2ZDRiMWU5MDc1JyxcbiAgICAgICAgbGFiZWw6ICdUdWJlIFJhZGl1cycsXG4gICAgICAgIHNvY2tldDoge1xuICAgICAgICAgIG5hbWU6ICdTY2FsYXI8ZmxvYXQ+JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjb250cm9sczoge30sXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IC0wLjM1MjEyNzI2NjIxMjM5MixcbiAgICAgIHk6IC0yMzUuMTM2OTk5MjA0Nzg2NDMsXG4gICAgfSxcbiAgfTtcblxuICBwcml2YXRlIF9fc2RDYXBzdWxlTm9kZUpzb24gPSB7XG4gICAgaWQ6ICczOTVkZjA5YTI2MWE5N2ViJyxcbiAgICBuYW1lOiAnU2RDYXBzdWxlJyxcbiAgICBvdXRwdXRzOiB7XG4gICAgICBvdXREaXN0YW5jZToge1xuICAgICAgICBpZDogJ2FkNTBhOTcyYTk0MTdkMGEnLFxuICAgICAgICBsYWJlbDogJ091dCBEaXN0YW5jZScsXG4gICAgICAgIHNvY2tldDoge1xuICAgICAgICAgIG5hbWU6ICdTY2FsYXI8ZmxvYXQ+JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBpbnB1dHM6IHtcbiAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgIGlkOiAnMzc2OTJkYWExNWMyZDY4MycsXG4gICAgICAgIGxhYmVsOiAnUG9zaXRpb24nLFxuICAgICAgICBzb2NrZXQ6IHtcbiAgICAgICAgICBuYW1lOiAnVmVjdG9yMzxmbG9hdD4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHBvaW50QToge1xuICAgICAgICBpZDogJzRjN2UxZDlhM2I2ZjI1MDgnLFxuICAgICAgICBsYWJlbDogJ1BvaW50IEEnLFxuICAgICAgICBzb2NrZXQ6IHtcbiAgICAgICAgICBuYW1lOiAnVmVjdG9yMzxmbG9hdD4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHBvaW50Qjoge1xuICAgICAgICBpZDogJ2ExYjVjOWUzZDdmMjA0ODYnLFxuICAgICAgICBsYWJlbDogJ1BvaW50IEInLFxuICAgICAgICBzb2NrZXQ6IHtcbiAgICAgICAgICBuYW1lOiAnVmVjdG9yMzxmbG9hdD4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHJhZGl1czoge1xuICAgICAgICBpZDogJzdhMmU1MWIxNjY3ZDI3M2QnLFxuICAgICAgICBsYWJlbDogJ1JhZGl1cycsXG4gICAgICAgIHNvY2tldDoge1xuICAgICAgICAgIG5hbWU6ICdTY2FsYXI8ZmxvYXQ+JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjb250cm9sczoge30sXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IC0wLjM1MjEyNzI2NjIxMjM5MixcbiAgICAgIHk6IC0yMzUuMTM2OTk5MjA0Nzg2NDMsXG4gICAgfSxcbiAgfTtcblxuICBwcml2YXRlIF9fc2RSb3VuZEJveE5vZGVKc29uID0ge1xuICAgIGlkOiAnMzk1ZGYwOWEyNjFhOTdlYicsXG4gICAgbmFtZTogJ1NkUm91bmRCb3gnLFxuICAgIG91dHB1dHM6IHtcbiAgICAgIG91dERpc3RhbmNlOiB7XG4gICAgICAgIGlkOiAnYWQ1MGE5NzJhOTQxN2QwYScsXG4gICAgICAgIGxhYmVsOiAnT3V0IERpc3RhbmNlJyxcbiAgICAgICAgc29ja2V0OiB7XG4gICAgICAgICAgbmFtZTogJ1NjYWxhcjxmbG9hdD4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIGlucHV0czoge1xuICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgaWQ6ICczNzY5MmRhYTE1YzJkNjgzJyxcbiAgICAgICAgbGFiZWw6ICdQb3NpdGlvbicsXG4gICAgICAgIHNvY2tldDoge1xuICAgICAgICAgIG5hbWU6ICdWZWN0b3IzPGZsb2F0PicsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgc2l6ZToge1xuICAgICAgICBpZDogJ2UyZjdhOWM0YjFkNjM1MDgnLFxuICAgICAgICBsYWJlbDogJ1NpemUnLFxuICAgICAgICBzb2NrZXQ6IHtcbiAgICAgICAgICBuYW1lOiAnVmVjdG9yMzxmbG9hdD4nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHJhZGl1czoge1xuICAgICAgICBpZDogJzZkMmI4ZjRhMWM5ZTc1MzAnLFxuICAgICAgICBsYWJlbDogJ1JhZGl1cycsXG4gICAgICAgIHNvY2tldDoge1xuICAgICAgICAgIG5hbWU6ICdTY2FsYXI8ZmxvYXQ+JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjb250cm9sczoge30sXG4gICAgcG9zaXRpb246IHtcbiAgICAgIHg6IC0wLjM1MjEyNzI2NjIxMjM5MixcbiAgICAgIHk6IC0yMzUuMTM2OTk5MjA0Nzg2NDMsXG4gICAgfSxcbiAgfTtcblxuICBwcml2YXRlIF9fcnJuSnNvblRlbXBsYXRlOiBOb2RlSlNPTiA9IHtcbiAgICBub2RlczogW1xuICAgICAge1xuICAgICAgICBpZDogJzliYjlmYzM3NGY0ZDA2MDAnLFxuICAgICAgICBuYW1lOiAnSW5pdGlhbFBvc2l0aW9uJyxcbiAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgIG91dFBvc2l0aW9uOiB7XG4gICAgICAgICAgICBpZDogJzY4MTM2OTcyNDM4MGE2NDQnLFxuICAgICAgICAgICAgbGFiZWw6ICdPdXQgUG9zaXRpb24nLFxuICAgICAgICAgICAgc29ja2V0OiB7XG4gICAgICAgICAgICAgIG5hbWU6ICdWZWN0b3IzPGZsb2F0PicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGlucHV0czoge30sXG4gICAgICAgIGNvbnRyb2xzOiB7fSxcbiAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICB4OiAtNTgwLjQ1Mzc2MjYyMTI3MzUsXG4gICAgICAgICAgeTogLTE4Ni43ODMwODI5NDgwMjIyNCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB0aGlzLl9fc2RTcGhlcmVOb2RlSnNvbixcbiAgICAgIHtcbiAgICAgICAgaWQ6ICc4MjM1MTViMjllMzhhMmIyJyxcbiAgICAgICAgbmFtZTogJ091dFVuaW9uJyxcbiAgICAgICAgb3V0cHV0czoge30sXG4gICAgICAgIGlucHV0czoge1xuICAgICAgICAgIGluMToge1xuICAgICAgICAgICAgaWQ6ICc2NGY0NzY5ZGUyYzMzZWIwJyxcbiAgICAgICAgICAgIGxhYmVsOiAnSW4gU2NhbGFyPGZsb2F0PicsXG4gICAgICAgICAgICBzb2NrZXQ6IHtcbiAgICAgICAgICAgICAgbmFtZTogJ1NjYWxhcjxmbG9hdD4nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBjb250cm9sczoge1xuICAgICAgICAgIHNoYWRlclN0YWdlOiBudWxsLFxuICAgICAgICB9LFxuICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgIHg6IDMwMy43OTI5Njg3NSxcbiAgICAgICAgICB5OiAtMjQxLjczMDQ2ODc1LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICc3NzM5OWViODhiZDZjNzlmJyxcbiAgICAgICAgbmFtZTogJ1NkQXBwbHlXb3JsZE1hdHJpeCcsXG4gICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICBvdXRUcmFuc2Zvcm1lZFBvc2l0aW9uOiB7XG4gICAgICAgICAgICBpZDogJzc4NWU1MjUzNWI4OGMzY2YnLFxuICAgICAgICAgICAgbGFiZWw6ICdPdXQgVHJhbnNmb3JtZWQgUG9zaXRpb24nLFxuICAgICAgICAgICAgc29ja2V0OiB7XG4gICAgICAgICAgICAgIG5hbWU6ICdWZWN0b3IzPGZsb2F0PicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGlucHV0czoge1xuICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICBpZDogJzE0OTUzM2E2Mjc3MzkwNjcnLFxuICAgICAgICAgICAgbGFiZWw6ICdQb3NpdGlvbicsXG4gICAgICAgICAgICBzb2NrZXQ6IHtcbiAgICAgICAgICAgICAgbmFtZTogJ1ZlY3RvcjM8ZmxvYXQ+JyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgY29udHJvbHM6IHtcbiAgICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICB2YWx1ZTogYHdvcmxkTWF0cml4XyR7dGhpcy5jb21wb25lbnRTSUR9YCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgIHg6IC0yOTYuOTU3MDMxMjUsXG4gICAgICAgICAgeTogLTIyMC41MzEyNSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgICBjb25uZWN0aW9uczogW1xuICAgICAge1xuICAgICAgICBpZDogJzIxYTg3YmM3NmE3OTVhZjInLFxuICAgICAgICBmcm9tOiB7XG4gICAgICAgICAgaWQ6ICc5YmI5ZmMzNzRmNGQwNjAwJyxcbiAgICAgICAgICBwb3J0TmFtZTogJ291dFBvc2l0aW9uJyxcbiAgICAgICAgfSxcbiAgICAgICAgdG86IHtcbiAgICAgICAgICBpZDogJzc3Mzk5ZWI4OGJkNmM3OWYnLFxuICAgICAgICAgIHBvcnROYW1lOiAncG9zaXRpb24nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICc4YTI5ZmM1MDFiNmIyMzBhJyxcbiAgICAgICAgZnJvbToge1xuICAgICAgICAgIGlkOiAnNzczOTllYjg4YmQ2Yzc5ZicsXG4gICAgICAgICAgcG9ydE5hbWU6ICdvdXRUcmFuc2Zvcm1lZFBvc2l0aW9uJyxcbiAgICAgICAgfSxcbiAgICAgICAgdG86IHtcbiAgICAgICAgICBpZDogJzM5NWRmMDlhMjYxYTk3ZWInLFxuICAgICAgICAgIHBvcnROYW1lOiAncG9zaXRpb24nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6ICc1NjllODcxNmRiMGU1ZDJmJyxcbiAgICAgICAgZnJvbToge1xuICAgICAgICAgIGlkOiAnMzk1ZGYwOWEyNjFhOTdlYicsXG4gICAgICAgICAgcG9ydE5hbWU6ICdvdXREaXN0YW5jZScsXG4gICAgICAgIH0sXG4gICAgICAgIHRvOiB7XG4gICAgICAgICAgaWQ6ICc4MjM1MTViMjllMzhhMmIyJyxcbiAgICAgICAgICBwb3J0TmFtZTogJ2luMScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gIH07XG5cbiAgcHJpdmF0ZSBfX3NkZlNoYXBlVHlwZTogU2RmU2hhcGVUeXBlRW51bSA9IFNkZlNoYXBlVHlwZS5DdXN0b207XG4gIHByaXZhdGUgX191bmlmb3JtVmFsdWVQcm92aWRlcj86IFJheW1hcmNoaW5nVW5pZm9ybVZhbHVlUHJvdmlkZXI7XG4gIHByaXZhdGUgX19nZW5lcmF0ZWRDb2xsaWRlclNoYXBlSW5kaWNlczogbnVtYmVyW10gPSBbXTtcblxuICAvKipcbiAgICogV2hldGhlciB0aGlzIHJheW1hcmNoaW5nIGNvbXBvbmVudCBwYXJ0aWNpcGF0ZXMgaW4gcmF5IGNhc3RpbmcuXG4gICAqL1xuICBwdWJsaWMgaXNQaWNrYWJsZSA9IHRydWU7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIFNERiBvZiB0aGlzIHJheW1hcmNoaW5nIGNvbXBvbmVudCBpcyByZW5kZXJlZCBpbnRvIHRoZSBzaGFkb3cgbWFwcy5cbiAgICogQ2FzdGluZyBjb21wb25lbnRzIGFyZSBtZXJnZWQgaW50byB0aGUgc2hhZG93IGNhc3RlciBtYXRlcmlhbDsgbm9uLWNhc3Rpbmcgb25lcyBhcmVcbiAgICogbGVmdCBvdXQgc28gdGhleSBkbyBub3Qgb2NjbHVkZSBjYXN0aW5nIFNERnMgYmVoaW5kIHRoZW0uXG4gICAqL1xuICBwdWJsaWMgY2FzdFNoYWRvdyA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgZW5naW5lOiBFbmdpbmUsXG4gICAgZW50aXR5VWlkOiBFbnRpdHlVSUQsXG4gICAgY29tcG9uZW50U2lkOiBDb21wb25lbnRTSUQsXG4gICAgZW50aXR5Q29tcG9uZW50OiBFbnRpdHlSZXBvc2l0b3J5LFxuICAgIGlzUmVVc2U6IGJvb2xlYW5cbiAgKSB7XG4gICAgc3VwZXIoZW5naW5lLCBlbnRpdHlVaWQsIGNvbXBvbmVudFNpZCwgZW50aXR5Q29tcG9uZW50LCBpc1JlVXNlKTtcbiAgICB0aGlzLm1vdmVTdGFnZVRvKFByb2Nlc3NTdGFnZS5Mb2dpYyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY29tcG9uZW50IHR5cGUgaWRlbnRpZmllciBmb3IgUmF5bWFyY2hpbmdDb21wb25lbnQuXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdHlwZSBJRCBmb3IgUmF5bWFyY2hpbmdDb21wb25lbnRcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9uZW50VElEKCkge1xuICAgIHJldHVybiBXZWxsS25vd25Db21wb25lbnRUSURzLlJheW1hcmNoaW5nQ29tcG9uZW50VElEO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB0eXBlIGlkZW50aWZpZXIgZm9yIHRoaXMgUmF5bWFyY2hpbmdDb21wb25lbnQgaW5zdGFuY2UuXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdHlwZSBJRCBmb3IgUmF5bWFyY2hpbmdDb21wb25lbnRcbiAgICovXG4gIGdldCBjb21wb25lbnRUSUQoKTogQ29tcG9uZW50VElEIHtcbiAgICByZXR1cm4gV2VsbEtub3duQ29tcG9uZW50VElEcy5SYXltYXJjaGluZ0NvbXBvbmVudFRJRDtcbiAgfVxuXG4gIHN0YXRpYyBjb21tb25fJHJlbmRlcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBSUk4gSlNPTiBkYXRhIGZvciB0aGUgUmF5bWFyY2hpbmdDb21wb25lbnQuXG4gICAqIEBwYXJhbSBycm5Kc29uIC0gVGhlIFJSTiBKU09OIGRhdGFcbiAgICovXG4gIHNldCBycm5Kc29uKHJybkpzb246IE5vZGVKU09OKSB7XG4gICAgdGhpcy5fX3Jybkpzb24gPSBycm5Kc29uO1xuICAgIHRoaXMuX19zZGZTaGFwZVR5cGUgPSBTZGZTaGFwZVR5cGUuQ3VzdG9tO1xuICAgIHRoaXMuaW52YWxpZGF0ZUFBQkIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBSUk4gSlNPTiBkYXRhIGZvciB0aGUgUmF5bWFyY2hpbmdDb21wb25lbnQuXG4gICAqIEByZXR1cm5zIFRoZSBSUk4gSlNPTiBkYXRhXG4gICAqL1xuICBnZXQgcnJuSnNvbigpOiBOb2RlSlNPTiB7XG4gICAgcmV0dXJuIHRoaXMuX19ycm5Kc29uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFNERiBzaGFwZSB0eXBlIGZvciB0aGUgUmF5bWFyY2hpbmdDb21wb25lbnQuXG4gICAqIEByZXR1cm5zIFRoZSBTREYgc2hhcGUgdHlwZVxuICAgKi9cbiAgZ2V0IHNkZlNoYXBlVHlwZSgpOiBTZGZTaGFwZVR5cGVFbnVtIHtcbiAgICByZXR1cm4gdGhpcy5fX3NkZlNoYXBlVHlwZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBTREYgc2hhcGUgdHlwZSBmb3IgdGhlIFJheW1hcmNoaW5nQ29tcG9uZW50LlxuICAgKiBAcGFyYW0gc2RmU2hhcGVUeXBlIC0gVGhlIFNERiBzaGFwZSB0eXBlXG4gICAqL1xuICBzZXQgc2RmU2hhcGVUeXBlKHNkZlNoYXBlVHlwZTogU2RmU2hhcGVUeXBlRW51bSkge1xuICAgIHRoaXMuX19zZGZTaGFwZVR5cGUgPSBzZGZTaGFwZVR5cGU7XG4gICAgdGhpcy5pbnZhbGlkYXRlQUFCQigpO1xuXG4gICAgY29uc3QgcnJuSnNvbiA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodGhpcy5fX3Jybkpzb25UZW1wbGF0ZSkpO1xuICAgIGNvbnN0IHByZXNldE5vZGVKc29uID0gdGhpcy5fX2dldFByZXNldFNkZk5vZGVKc29uKHNkZlNoYXBlVHlwZSk7XG4gICAgaWYgKHByZXNldE5vZGVKc29uICE9IG51bGwpIHtcbiAgICAgIHJybkpzb24ubm9kZXNbMV0gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHByZXNldE5vZGVKc29uKSk7XG4gICAgfVxuICAgIHRoaXMuX19ycm5Kc29uID0gcnJuSnNvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwcmVzZXQgU0RGIG5vZGUgSlNPTiB0aGF0IHJlcGxhY2VzIHRoZSB0ZW1wbGF0ZSdzIHBsYWNlaG9sZGVyIG5vZGUuXG4gICAqIEN1c3RvbSAoYSBncmFwaCBhdXRob3JlZCBpbiB0aGUgbm9kZSBlZGl0b3IpIGhhcyBubyBwcmVzZXQgbm9kZS5cbiAgICovXG4gIHByaXZhdGUgX19nZXRQcmVzZXRTZGZOb2RlSnNvbihzZGZTaGFwZVR5cGU6IFNkZlNoYXBlVHlwZUVudW0pIHtcbiAgICBzd2l0Y2ggKHNkZlNoYXBlVHlwZSkge1xuICAgICAgY2FzZSBTZGZTaGFwZVR5cGUuU3BoZXJlOlxuICAgICAgICByZXR1cm4gdGhpcy5fX3NkU3BoZXJlTm9kZUpzb247XG4gICAgICBjYXNlIFNkZlNoYXBlVHlwZS5Cb3g6XG4gICAgICAgIHJldHVybiB0aGlzLl9fc2RCb3hOb2RlSnNvbjtcbiAgICAgIGNhc2UgU2RmU2hhcGVUeXBlLlRvcnVzOlxuICAgICAgICByZXR1cm4gdGhpcy5fX3NkVG9ydXNOb2RlSnNvbjtcbiAgICAgIGNhc2UgU2RmU2hhcGVUeXBlLkNhcHN1bGU6XG4gICAgICAgIHJldHVybiB0aGlzLl9fc2RDYXBzdWxlTm9kZUpzb247XG4gICAgICBjYXNlIFNkZlNoYXBlVHlwZS5Sb3VuZEJveDpcbiAgICAgICAgcmV0dXJuIHRoaXMuX19zZFJvdW5kQm94Tm9kZUpzb247XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNvbHZlcyBhIG1hdGVyaWFsIHBhcmFtZXRlciB1c2VkIGJ5IGEgVW5pZm9ybSBzaGFkZXIgbm9kZS5cbiAgICogU2V0IHRoaXMgd2hlbiB0aGUgcmF5bWFyY2hpbmcgbWF0ZXJpYWwgY2hhbmdlcyB1bmlmb3JtIHZhbHVlcyBhdCBydW50aW1lLlxuICAgKi9cbiAgZ2V0IHVuaWZvcm1WYWx1ZVByb3ZpZGVyKCk6IFJheW1hcmNoaW5nVW5pZm9ybVZhbHVlUHJvdmlkZXIgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLl9fdW5pZm9ybVZhbHVlUHJvdmlkZXI7XG4gIH1cblxuICBzZXQgdW5pZm9ybVZhbHVlUHJvdmlkZXIocHJvdmlkZXI6IFJheW1hcmNoaW5nVW5pZm9ybVZhbHVlUHJvdmlkZXIgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLl9fdW5pZm9ybVZhbHVlUHJvdmlkZXIgPSBwcm92aWRlcjtcbiAgICB0aGlzLmludmFsaWRhdGVBQUJCKCk7XG4gIH1cblxuICAvKipcbiAgICogSW52YWxpZGF0ZXMgdGhlIGNhY2hlZCBzY2VuZSBncmFwaCBBQUJCIHNvIHRoZSBtZXJnZWQgQUFCQiBpcyByZWNvbXB1dGVkLlxuICAgKi9cbiAgaW52YWxpZGF0ZUFBQkIoKTogdm9pZCB7XG4gICAgdGhpcy5lbnRpdHkudHJ5VG9HZXRTY2VuZUdyYXBoKCk/LnNldFdvcmxkQUFCQkRpcnR5UGFyZW50UmVjdXJzaXZlbHkoKTtcbiAgICBSYXltYXJjaGluZ0NvbXBvbmVudC5fX2FhYmJWZXJzaW9ucy5zZXQodGhpcy5fX2VuZ2luZSwgUmF5bWFyY2hpbmdDb21wb25lbnQuZ2V0QUFCQlZlcnNpb24odGhpcy5fX2VuZ2luZSkgKyAxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIHZlcnNpb24gdGhhdCBjaGFuZ2VzIHdoZW5ldmVyIGFueSByYXltYXJjaGluZyBjb21wb25lbnQncyBBQUJCIG1heSBoYXZlIGNoYW5nZWQuXG4gICAqIFRoZSBzaGFkb3cgdm9sdW1lIGF1dG8tZml0IHVzZXMgaXQgYXMgcGFydCBvZiBpdHMgY2FjaGUga2V5LlxuICAgKi9cbiAgc3RhdGljIGdldEFBQkJWZXJzaW9uKGVuZ2luZTogRW5naW5lKTogbnVtYmVyIHtcbiAgICByZXR1cm4gUmF5bWFyY2hpbmdDb21wb25lbnQuX19hYWJiVmVyc2lvbnMuZ2V0KGVuZ2luZSkgPz8gMDtcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fYWFiYlZlcnNpb25zID0gbmV3IFdlYWtNYXA8RW5naW5lLCBudW1iZXI+KCk7XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgYSBjb25zZXJ2YXRpdmUgd29ybGQtc3BhY2UgQUFCQiBvZiB0aGUgU0RGIGdyYXBoLlxuICAgKiBAcmV0dXJucyBUaGUgd29ybGQtc3BhY2UgYm91bmRzLCBvciBudWxsIHdoZW4gdGhlIGdyYXBoIGlzIHVuYm91bmRlZFxuICAgKi9cbiAgY2FsY1dvcmxkQUFCQigpOiBBQUJCIHwgbnVsbCB7XG4gICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpO1xuICAgIGlmIChzY2VuZUdyYXBoID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGV2YWx1YXRvciA9IG5ldyBSYXltYXJjaGluZ1NkZkV2YWx1YXRvcih0aGlzLl9fcnJuSnNvbiwgc2NlbmVHcmFwaC5tYXRyaXhJbm5lciwgdGhpcy5fX3VuaWZvcm1WYWx1ZVByb3ZpZGVyKTtcbiAgICByZXR1cm4gZXZhbHVhdG9yLmNhbGNCb3VuZHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGEgY29uc2VydmF0aXZlIEFBQkIgaW4gdGhlIGNvbXBvbmVudCBlbnRpdHkncyBsb2NhbCBzcGFjZS5cbiAgICogVGhpcyBpcyB0aGUgc3BhY2UgU2hhcGVDb21wb25lbnQgYW5kIFBoeXNpY3NDb21wb25lbnQgdXNlLlxuICAgKiBAcmV0dXJucyBUaGUgbG9jYWwtc3BhY2UgYm91bmRzLCBvciBudWxsIHdoZW4gdGhlIGdyYXBoIGlzIHVuYm91bmRlZFxuICAgKi9cbiAgY2FsY0xvY2FsQUFCQigpOiBBQUJCIHwgbnVsbCB7XG4gICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpO1xuICAgIGNvbnN0IHdvcmxkQUFCQiA9IHRoaXMuY2FsY1dvcmxkQUFCQigpO1xuICAgIGlmIChzY2VuZUdyYXBoID09IG51bGwgfHwgd29ybGRBQUJCID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGludmVyc2VXb3JsZE1hdHJpeCA9IE1hdHJpeDQ0LmludmVydChzY2VuZUdyYXBoLm1hdHJpeElubmVyKTtcbiAgICBjb25zdCBsb2NhbEFBQkIgPSBuZXcgQUFCQigpO1xuICAgIEFBQkIubXVsdGlwbHlNYXRyaXhUbyhpbnZlcnNlV29ybGRNYXRyaXgsIHdvcmxkQUFCQiwgbG9jYWxBQUJCKTtcbiAgICByZXR1cm4gbG9jYWxBQUJCLmlzVmFuaWxsYSgpID8gbnVsbCA6IGxvY2FsQUFCQjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYXN0cyBhIHdvcmxkLXNwYWNlIHJheSBhZ2FpbnN0IHRoZSBTREYgZ3JhcGguXG4gICAqIEBwYXJhbSBvcmlnaW5JbldvcmxkIC0gUmF5IG9yaWdpbiBpbiB3b3JsZCBzcGFjZVxuICAgKiBAcGFyYW0gZGlyZWN0aW9uSW5Xb3JsZCAtIFJheSBkaXJlY3Rpb24gaW4gd29ybGQgc3BhY2VcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBNYXJjaGluZyBvcHRpb25zXG4gICAqIEByZXR1cm5zIFRoZSBoaXQsIG9yIHVuZGVmaW5lZCB3aGVuIHRoZSBjb21wb25lbnQgaXMgbm90IHBpY2thYmxlIG9yIG1pc3NlZFxuICAgKi9cbiAgY2FzdFJheShcbiAgICBvcmlnaW5JbldvcmxkOiBWZWN0b3IzLFxuICAgIGRpcmVjdGlvbkluV29ybGQ6IFZlY3RvcjMsXG4gICAgb3B0aW9uczogUmF5bWFyY2hpbmdSYXljYXN0T3B0aW9ucyA9IHt9XG4gICk6IFJheW1hcmNoaW5nUmF5Y2FzdEhpdCB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLmlzUGlja2FibGUpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qgc2NlbmVHcmFwaCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0U2NlbmVHcmFwaCgpO1xuICAgIGlmIChzY2VuZUdyYXBoID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgZXZhbHVhdG9yID0gbmV3IFJheW1hcmNoaW5nU2RmRXZhbHVhdG9yKHRoaXMuX19ycm5Kc29uLCBzY2VuZUdyYXBoLm1hdHJpeElubmVyLCB0aGlzLl9fdW5pZm9ybVZhbHVlUHJvdmlkZXIpO1xuICAgIGNvbnN0IGhpdCA9IGV2YWx1YXRvci5tYXJjaFJheShvcmlnaW5JbldvcmxkLCBkaXJlY3Rpb25JbldvcmxkLCBvcHRpb25zKTtcbiAgICBpZiAoaGl0ICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBoaXQ7XG4gICAgfVxuICAgIGlmIChoaXQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLy8gVGhlIGdyYXBoIGNvbnRhaW5zIGEgbm9kZSB0aGUgQ1BVIGV2YWx1YXRvciBkb2VzIG5vdCB1bmRlcnN0YW5kLlxuICAgIC8vIEZhbGwgYmFjayB0byB0aGUgY29uc2VydmF0aXZlIEFBQkIgc28gdGhlIGVudGl0eSBjYW4gc3RpbGwgYmUgcGlja2VkLlxuICAgIGNvbnN0IGJvdW5kcyA9IGV2YWx1YXRvci5jYWxjQm91bmRzKCk7XG4gICAgaWYgKGJvdW5kcyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCBkaXJlY3Rpb24gPSBWZWN0b3IzLm5vcm1hbGl6ZShkaXJlY3Rpb25JbldvcmxkKTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IFJheW1hcmNoaW5nU2RmRXZhbHVhdG9yLmludGVyc2VjdFJheUFhYmIob3JpZ2luSW5Xb3JsZCwgZGlyZWN0aW9uLCBib3VuZHMpO1xuICAgIGlmIChpbnRlcnZhbCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBjb25zdCB0ID0gTWF0aC5tYXgoMCwgaW50ZXJ2YWxbMF0pO1xuICAgIHJldHVybiB7XG4gICAgICB0LFxuICAgICAgcG9zaXRpb246IFZlY3RvcjMuZnJvbUNvcHkzKFxuICAgICAgICBvcmlnaW5JbldvcmxkLnggKyBkaXJlY3Rpb24ueCAqIHQsXG4gICAgICAgIG9yaWdpbkluV29ybGQueSArIGRpcmVjdGlvbi55ICogdCxcbiAgICAgICAgb3JpZ2luSW5Xb3JsZC56ICsgZGlyZWN0aW9uLnogKiB0XG4gICAgICApLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ2FzdHMgYSByYXkgZnJvbSBzY3JlZW4gY29vcmRpbmF0ZXMgYWdhaW5zdCB0aGUgU0RGIGdyYXBoLlxuICAgKiBAcGFyYW0geCAtIFNjcmVlbiB4IGNvb3JkaW5hdGVcbiAgICogQHBhcmFtIHkgLSBTY3JlZW4geSBjb29yZGluYXRlXG4gICAqIEBwYXJhbSBjYW1lcmEgLSBDYW1lcmEgdXNlZCB0byBidWlsZCB0aGUgd29ybGQtc3BhY2UgcmF5XG4gICAqIEBwYXJhbSB2aWV3cG9ydCAtIFZpZXdwb3J0IHJlY3RhbmdsZSBhcyBWZWN0b3I0ICh4LCB5LCB3aWR0aCwgaGVpZ2h0KVxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIE1hcmNoaW5nIG9wdGlvbnNcbiAgICogQHJldHVybnMgVGhlIHJheWNhc3QgcmVzdWx0IGluIHdvcmxkIHNwYWNlXG4gICAqL1xuICBjYXN0UmF5RnJvbVNjcmVlbihcbiAgICB4OiBudW1iZXIsXG4gICAgeTogbnVtYmVyLFxuICAgIGNhbWVyYTogQ2FtZXJhQ29tcG9uZW50LFxuICAgIHZpZXdwb3J0OiBWZWN0b3I0LFxuICAgIG9wdGlvbnM6IFJheW1hcmNoaW5nUmF5Y2FzdE9wdGlvbnMgPSB7fVxuICApOiB7IHJlc3VsdDogYm9vbGVhbjsgZGF0YT86IFJheW1hcmNoaW5nUmF5Y2FzdEhpdCB9IHtcbiAgICBjb25zdCBpbnZlcnNlUFZNYXRyaXggPSBNYXRyaXg0NC5pbnZlcnQoTWF0cml4NDQubXVsdGlwbHkoY2FtZXJhLnByb2plY3Rpb25NYXRyaXgsIGNhbWVyYS52aWV3TWF0cml4KSk7XG4gICAgY29uc3QgbmVhciA9IE1hdGhDbGFzc1V0aWwudW5Qcm9qZWN0VG8oeCwgeSwgMCwgaW52ZXJzZVBWTWF0cml4LCB2aWV3cG9ydCwgTXV0YWJsZVZlY3RvcjMuemVybygpKTtcbiAgICBjb25zdCBmYXIgPSBNYXRoQ2xhc3NVdGlsLnVuUHJvamVjdFRvKHgsIHksIDEsIGludmVyc2VQVk1hdHJpeCwgdmlld3BvcnQsIE11dGFibGVWZWN0b3IzLnplcm8oKSk7XG4gICAgY29uc3QgZGlyZWN0aW9uID0gVmVjdG9yMy5ub3JtYWxpemUoVmVjdG9yMy5zdWJ0cmFjdChmYXIsIG5lYXIpKTtcbiAgICBjb25zdCBtYXhEaXN0YW5jZSA9IG9wdGlvbnMubWF4RGlzdGFuY2UgPz8gVmVjdG9yMy5sZW5ndGhCdHcobmVhciwgZmFyKTtcblxuICAgIGNvbnN0IGhpdCA9IHRoaXMuY2FzdFJheShuZWFyLCBkaXJlY3Rpb24sIHsgLi4ub3B0aW9ucywgbWF4RGlzdGFuY2UgfSk7XG4gICAgaWYgKGhpdCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4geyByZXN1bHQ6IGZhbHNlIH07XG4gICAgfVxuICAgIHJldHVybiB7IHJlc3VsdDogdHJ1ZSwgZGF0YTogaGl0IH07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBleGFjdCBzcGhlcmUgY29sbGlkZXIgd2hlbiB0aGUgZ3JhcGggaXMgYSBzaW5nbGUgU2RTcGhlcmUuXG4gICAqXG4gICAqIFRoZSByZXN1bHQgaXMgZXhwcmVzc2VkIGluIHRoZSBjb21wb25lbnQgZW50aXR5J3MgbG9jYWwgc3BhY2UgYW5kIGlzIG9ubHlcbiAgICogcmV0dXJuZWQgd2hlbiB0aGUgc3BoZXJlJ3MgcG9zaXRpb24gY2hhaW4gY29udGFpbnMgU2RBcHBseVdvcmxkTWF0cml4LFxuICAgKiB3aGljaCBtYWtlcyB0aGUgU0RGIGZvbGxvdyB0aGUgZW50aXR5IHRyYW5zZm9ybS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxvY2FsLXNwYWNlIHNwaGVyZSwgb3IgbnVsbCB3aGVuIHRoZSBncmFwaCBpcyBub3QgYSBzaW5nbGVcbiAgICogdHJhbnNmb3JtZWQgc3BoZXJlXG4gICAqL1xuICBjYWxjTG9jYWxTcGhlcmVDb2xsaWRlcigpOiBSYXltYXJjaGluZ1NwaGVyZUNvbGxpZGVyIHwgbnVsbCB7XG4gICAgY29uc3QgZXZhbHVhdG9yID0gbmV3IFJheW1hcmNoaW5nU2RmRXZhbHVhdG9yKHRoaXMuX19ycm5Kc29uLCBNYXRyaXg0NC5pZGVudGl0eSgpLCB0aGlzLl9fdW5pZm9ybVZhbHVlUHJvdmlkZXIpO1xuICAgIGNvbnN0IHNwaGVyZSA9IGV2YWx1YXRvci5jYWxjU3BoZXJlKCk7XG4gICAgaWYgKHNwaGVyZSA9PSBudWxsIHx8ICFzcGhlcmUudXNlc1dvcmxkTWF0cml4KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHsgY2VudGVyOiBzcGhlcmUuY2VudGVyLCByYWRpdXM6IHNwaGVyZS5yYWRpdXMgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgY29sbGlkZXIgc2hhcGUgZm9yIHRoZSBTREYuXG4gICAqXG4gICAqIFVzZXMgYW4gZXhhY3Qgc3BoZXJlIHdoZW4gdGhlIGdyYXBoIGlzIGEgc2luZ2xlIHRyYW5zZm9ybWVkIHNwaGVyZTtcbiAgICogb3RoZXJ3aXNlIGZhbGxzIGJhY2sgdG8gYSBjb25zZXJ2YXRpdmUgQUFCQiBib3guXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gU2hhcGUgY3JlYXRpb24gb3B0aW9uc1xuICAgKiBAcmV0dXJucyBUaGUgY3JlYXRlZCBzaGFwZSBpbmZvcm1hdGlvbiwgb3IgdW5kZWZpbmVkIHdoZW4gbm8gZmluaXRlIHNoYXBlIGV4aXN0c1xuICAgKi9cbiAgYWRkQ29sbGlkZXJTaGFwZShvcHRpb25zOiBSYXltYXJjaGluZ0NvbGxpZGVyU2hhcGVPcHRpb25zID0ge30pOiBSYXltYXJjaGluZ0NvbGxpZGVyU2hhcGVSZXN1bHQgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGRlc2NyaXB0b3IgPSB0aGlzLl9fY2FsY0NvbGxpZGVyU2hhcGUob3B0aW9ucy5hYWJiKTtcbiAgICBpZiAoZGVzY3JpcHRvciA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IHNoYXBlQ29tcG9uZW50ID0gdGhpcy5fX2dldE9yQ3JlYXRlU2hhcGVDb21wb25lbnQob3B0aW9ucy5zaGFwZUNvbXBvbmVudCk7XG4gICAgaWYgKHNoYXBlQ29tcG9uZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKGRlc2NyaXB0b3Iuc2hhcGVUeXBlID09PSAnc3BoZXJlJykge1xuICAgICAgY29uc3Qgc2hhcGVJbmRleCA9IHNoYXBlQ29tcG9uZW50LmFkZFNoYXBlKFxuICAgICAgICB7IHR5cGU6ICdzcGhlcmUnLCByYWRpdXM6IGRlc2NyaXB0b3IucmFkaXVzIH0sXG4gICAgICAgIHsgcG9zaXRpb246IGRlc2NyaXB0b3IuY2VudGVyIH1cbiAgICAgICk7XG4gICAgICB0aGlzLl9fdHJhY2tHZW5lcmF0ZWRDb2xsaWRlclNoYXBlKHNoYXBlSW5kZXgsIHNoYXBlQ29tcG9uZW50KTtcbiAgICAgIHJldHVybiB7IHNoYXBlSW5kZXgsIHNoYXBlVHlwZTogJ3NwaGVyZScsIGNlbnRlcjogZGVzY3JpcHRvci5jZW50ZXIsIHJhZGl1czogZGVzY3JpcHRvci5yYWRpdXMgfTtcbiAgICB9XG5cbiAgICBjb25zdCBzaGFwZUluZGV4ID0gc2hhcGVDb21wb25lbnQuYWRkQm94RnJvbUFhYmIoZGVzY3JpcHRvci5hYWJiLCB7IG9yaWdpbjogb3B0aW9ucy5vcmlnaW4gfSk7XG4gICAgdGhpcy5fX3RyYWNrR2VuZXJhdGVkQ29sbGlkZXJTaGFwZShzaGFwZUluZGV4LCBzaGFwZUNvbXBvbmVudCk7XG4gICAgcmV0dXJuIHsgc2hhcGVJbmRleCwgc2hhcGVUeXBlOiAnYm94JywgYWFiYjogZGVzY3JpcHRvci5hYWJiIH07XG4gIH1cblxuICAvKipcbiAgICogUmVjb21wdXRlcyBldmVyeSBjb2xsaWRlciBzaGFwZSBwcmV2aW91c2x5IGNyZWF0ZWQgYnkgYWRkQ29sbGlkZXJTaGFwZSgpLlxuICAgKlxuICAgKiBTaGFwZXMgYXJlIHJlcGxhY2VkIGluIHBsYWNlIHNvIHBoeXNpY3MgYmluZGluZ3Mga2VlcCB0aGVpciBzaGFwZSBpbmRpY2VzLFxuICAgKiBhbmQgdGhlIGVudGl0eSdzIFBoeXNpY3NDb21wb25lbnQgaXMgcmVidWlsdCB3aGVuIGFueXRoaW5nIGNoYW5nZWQuIFdoZW4gdGhlXG4gICAqIFNERiBubyBsb25nZXIgaGFzIGEgZmluaXRlIGNvbGxpZGVyIHNoYXBlLCB0aGUgZ2VuZXJhdGVkIHNoYXBlcyBhbmQgdGhlaXJcbiAgICogYmluZGluZ3MgYXJlIHJlbW92ZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBudW1iZXIgb2YgY29sbGlkZXIgc2hhcGVzIHRoYXQgd2VyZSB1cGRhdGVkIG9yIHJlbW92ZWRcbiAgICovXG4gIHVwZGF0ZUNvbGxpZGVyU2hhcGVzKCk6IG51bWJlciB7XG4gICAgaWYgKHRoaXMuX19nZW5lcmF0ZWRDb2xsaWRlclNoYXBlSW5kaWNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGNvbnN0IHNoYXBlQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRTaGFwZSgpO1xuICAgIGlmIChzaGFwZUNvbXBvbmVudCA9PSBudWxsKSB7XG4gICAgICB0aGlzLl9fZ2VuZXJhdGVkQ29sbGlkZXJTaGFwZUluZGljZXMgPSBbXTtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIGNvbnN0IGRlc2NyaXB0b3IgPSB0aGlzLl9fY2FsY0NvbGxpZGVyU2hhcGUoKTtcbiAgICBjb25zdCBwaHlzaWNzQ29tcG9uZW50ID0gdGhpcy5lbnRpdHkudHJ5VG9HZXRQaHlzaWNzKCk7XG4gICAgY29uc3Qga2VwdEluZGljZXM6IG51bWJlcltdID0gW107XG4gICAgbGV0IHVwZGF0ZWQgPSAwO1xuICAgIGxldCByZW1vdmVkID0gMDtcblxuICAgIGZvciAoY29uc3Qgc2hhcGVJbmRleCBvZiB0aGlzLl9fZ2VuZXJhdGVkQ29sbGlkZXJTaGFwZUluZGljZXMpIHtcbiAgICAgIGNvbnN0IGV4aXN0aW5nID0gc2hhcGVDb21wb25lbnQuZ2V0U2hhcGUoc2hhcGVJbmRleCk7XG4gICAgICBpZiAoZXhpc3RpbmcgPT0gbnVsbCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRlc2NyaXB0b3IgPT0gbnVsbCkge1xuICAgICAgICBwaHlzaWNzQ29tcG9uZW50Py5yZW1vdmVTaGFwZUJpbmRpbmdzRm9yU2hhcGUoc2hhcGVDb21wb25lbnQsIHNoYXBlSW5kZXgpO1xuICAgICAgICBzaGFwZUNvbXBvbmVudC5yZW1vdmVTaGFwZShzaGFwZUluZGV4KTtcbiAgICAgICAgcmVtb3ZlZCsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKFJheW1hcmNoaW5nQ29tcG9uZW50Ll9fc2hhcGVNYXRjaGVzRGVzY3JpcHRvcihleGlzdGluZywgZGVzY3JpcHRvcikpIHtcbiAgICAgICAga2VwdEluZGljZXMucHVzaChzaGFwZUluZGV4KTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChkZXNjcmlwdG9yLnNoYXBlVHlwZSA9PT0gJ3NwaGVyZScpIHtcbiAgICAgICAgc2hhcGVDb21wb25lbnQudXBkYXRlU2hhcGUoXG4gICAgICAgICAgc2hhcGVJbmRleCxcbiAgICAgICAgICB7IHR5cGU6ICdzcGhlcmUnLCByYWRpdXM6IGRlc2NyaXB0b3IucmFkaXVzIH0sXG4gICAgICAgICAgeyBwb3NpdGlvbjogZGVzY3JpcHRvci5jZW50ZXIgfVxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2hhcGVDb21wb25lbnQudXBkYXRlU2hhcGUoXG4gICAgICAgICAgc2hhcGVJbmRleCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnYm94JyxcbiAgICAgICAgICAgIHNpemU6IFZlY3RvcjMuZnJvbUNvcHkzKGRlc2NyaXB0b3IuYWFiYi5zaXplWCwgZGVzY3JpcHRvci5hYWJiLnNpemVZLCBkZXNjcmlwdG9yLmFhYmIuc2l6ZVopLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwb3NpdGlvbjogZGVzY3JpcHRvci5hYWJiLmNlbnRlclBvaW50IH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGtlcHRJbmRpY2VzLnB1c2goc2hhcGVJbmRleCk7XG4gICAgICB1cGRhdGVkKys7XG4gICAgfVxuXG4gICAgdGhpcy5fX2dlbmVyYXRlZENvbGxpZGVyU2hhcGVJbmRpY2VzID0ga2VwdEluZGljZXM7XG5cbiAgICBpZiAoXG4gICAgICB1cGRhdGVkID4gMCAmJlxuICAgICAgcGh5c2ljc0NvbXBvbmVudCAhPSBudWxsICYmXG4gICAgICBwaHlzaWNzQ29tcG9uZW50LnNoYXBlQmluZGluZ0NvdW50ID4gMCAmJlxuICAgICAgcGh5c2ljc0NvbXBvbmVudC5zdHJhdGVneSAhPSBudWxsXG4gICAgKSB7XG4gICAgICBwaHlzaWNzQ29tcG9uZW50LnJlYnVpbGRTaGFwZUJpbmRpbmdzKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVwZGF0ZWQgKyByZW1vdmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2NhbGNDb2xsaWRlclNoYXBlKGFhYmI/OiBBQUJCKTogUmF5bWFyY2hpbmdDb2xsaWRlclNoYXBlRGVzY3JpcHRvciB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc3BoZXJlID0gdGhpcy5jYWxjTG9jYWxTcGhlcmVDb2xsaWRlcigpO1xuICAgIGlmIChzcGhlcmUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHsgc2hhcGVUeXBlOiAnc3BoZXJlJywgY2VudGVyOiBzcGhlcmUuY2VudGVyLCByYWRpdXM6IHNwaGVyZS5yYWRpdXMgfTtcbiAgICB9XG5cbiAgICBjb25zdCBsb2NhbEFBQkIgPSBhYWJiID8/IHRoaXMuY2FsY0xvY2FsQUFCQigpO1xuICAgIGlmIChsb2NhbEFBQkIgPT0gbnVsbCB8fCBsb2NhbEFBQkIuaXNWYW5pbGxhKCkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChsb2NhbEFBQkIuc2l6ZVggPD0gMCB8fCBsb2NhbEFBQkIuc2l6ZVkgPD0gMCB8fCBsb2NhbEFBQkIuc2l6ZVogPD0gMCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHsgc2hhcGVUeXBlOiAnYm94JywgYWFiYjogbG9jYWxBQUJCIH07XG4gIH1cblxuICBwcml2YXRlIF9fdHJhY2tHZW5lcmF0ZWRDb2xsaWRlclNoYXBlKHNoYXBlSW5kZXg6IG51bWJlciwgc2hhcGVDb21wb25lbnQ6IFNoYXBlQ29tcG9uZW50KTogdm9pZCB7XG4gICAgaWYgKHNoYXBlQ29tcG9uZW50ICE9PSB0aGlzLmVudGl0eS50cnlUb0dldFNoYXBlKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9fZ2VuZXJhdGVkQ29sbGlkZXJTaGFwZUluZGljZXMuaW5jbHVkZXMoc2hhcGVJbmRleCkpIHtcbiAgICAgIHRoaXMuX19nZW5lcmF0ZWRDb2xsaWRlclNoYXBlSW5kaWNlcy5wdXNoKHNoYXBlSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIF9fc2hhcGVNYXRjaGVzRGVzY3JpcHRvcihcbiAgICBpbnN0YW5jZTogU2hhcGVJbnN0YW5jZSxcbiAgICBkZXNjcmlwdG9yOiBSYXltYXJjaGluZ0NvbGxpZGVyU2hhcGVEZXNjcmlwdG9yXG4gICk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGlzTmVhciA9IChhOiBudW1iZXIsIGI6IG51bWJlcikgPT4gTWF0aC5hYnMoYSAtIGIpIDw9IDFlLTUgKiBNYXRoLm1heCgxLCBNYXRoLmFicyhhKSwgTWF0aC5hYnMoYikpO1xuICAgIGNvbnN0IGlzU2FtZVBvc2l0aW9uID0gKHBvc2l0aW9uOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyOyB6OiBudW1iZXIgfSkgPT5cbiAgICAgIGlzTmVhcihpbnN0YW5jZS5sb2NhbFBvc2l0aW9uLngsIHBvc2l0aW9uLngpICYmXG4gICAgICBpc05lYXIoaW5zdGFuY2UubG9jYWxQb3NpdGlvbi55LCBwb3NpdGlvbi55KSAmJlxuICAgICAgaXNOZWFyKGluc3RhbmNlLmxvY2FsUG9zaXRpb24ueiwgcG9zaXRpb24ueik7XG5cbiAgICBpZiAoZGVzY3JpcHRvci5zaGFwZVR5cGUgPT09ICdzcGhlcmUnKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBpbnN0YW5jZS5zaGFwZS50eXBlID09PSAnc3BoZXJlJyAmJlxuICAgICAgICBpc05lYXIoaW5zdGFuY2Uuc2hhcGUucmFkaXVzLCBkZXNjcmlwdG9yLnJhZGl1cykgJiZcbiAgICAgICAgaXNTYW1lUG9zaXRpb24oZGVzY3JpcHRvci5jZW50ZXIpXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiAoXG4gICAgICBpbnN0YW5jZS5zaGFwZS50eXBlID09PSAnYm94JyAmJlxuICAgICAgaXNOZWFyKGluc3RhbmNlLnNoYXBlLnNpemUueCwgZGVzY3JpcHRvci5hYWJiLnNpemVYKSAmJlxuICAgICAgaXNOZWFyKGluc3RhbmNlLnNoYXBlLnNpemUueSwgZGVzY3JpcHRvci5hYWJiLnNpemVZKSAmJlxuICAgICAgaXNOZWFyKGluc3RhbmNlLnNoYXBlLnNpemUueiwgZGVzY3JpcHRvci5hYWJiLnNpemVaKSAmJlxuICAgICAgaXNTYW1lUG9zaXRpb24oZGVzY3JpcHRvci5hYWJiLmNlbnRlclBvaW50KVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIGJveCBzaGFwZSBmaXR0ZWQgdG8gdGhlIFNERiBib3VuZHMgdG8gYSBTaGFwZUNvbXBvbmVudC5cbiAgICogVGhlIHNoYXBlIGNhbiB0aGVuIGJlIGJvdW5kIHRvIGEgUGh5c2ljc0NvbXBvbmVudCBhcyBhIGNvbGxpZGVyLlxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIFNoYXBlIGNyZWF0aW9uIG9wdGlvbnNcbiAgICogQHJldHVybnMgVGhlIG5ldyBzaGFwZSBpbmRleCwgb3IgdW5kZWZpbmVkIHdoZW4gbm8gZmluaXRlIGJvdW5kcyBleGlzdFxuICAgKi9cbiAgYWRkQWFiYkJveFNoYXBlKG9wdGlvbnM6IFJheW1hcmNoaW5nQWFiYlNoYXBlT3B0aW9ucyA9IHt9KTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBsb2NhbEFBQkIgPSBvcHRpb25zLmFhYmIgPz8gdGhpcy5jYWxjTG9jYWxBQUJCKCk7XG4gICAgaWYgKGxvY2FsQUFCQiA9PSBudWxsIHx8IGxvY2FsQUFCQi5pc1ZhbmlsbGEoKSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGxvY2FsQUFCQi5zaXplWCA8PSAwIHx8IGxvY2FsQUFCQi5zaXplWSA8PSAwIHx8IGxvY2FsQUFCQi5zaXplWiA8PSAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGNvbnN0IHNoYXBlQ29tcG9uZW50ID0gdGhpcy5fX2dldE9yQ3JlYXRlU2hhcGVDb21wb25lbnQob3B0aW9ucy5zaGFwZUNvbXBvbmVudCk7XG4gICAgaWYgKHNoYXBlQ29tcG9uZW50ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNoYXBlQ29tcG9uZW50LmFkZEJveEZyb21BYWJiKGxvY2FsQUFCQiwgeyBvcmlnaW46IG9wdGlvbnMub3JpZ2luIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBfX2dldE9yQ3JlYXRlU2hhcGVDb21wb25lbnQoc2hhcGVDb21wb25lbnQ/OiBTaGFwZUNvbXBvbmVudCk6IFNoYXBlQ29tcG9uZW50IHwgdW5kZWZpbmVkIHtcbiAgICBsZXQgY29tcG9uZW50ID0gc2hhcGVDb21wb25lbnQgPz8gdGhpcy5lbnRpdHkudHJ5VG9HZXRTaGFwZSgpO1xuICAgIGlmIChjb21wb25lbnQgPT0gbnVsbCkge1xuICAgICAgdGhpcy5fX2VudGl0eVJlcG9zaXRvcnkuYWRkQ29tcG9uZW50VG9FbnRpdHkoU2hhcGVDb21wb25lbnQsIHRoaXMuZW50aXR5KTtcbiAgICAgIGNvbXBvbmVudCA9IHRoaXMuZW50aXR5LnRyeVRvR2V0U2hhcGUoKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc2hhbGxvdyBjb3B5IG9mIHRoaXMgUmF5bWFyY2hpbmdDb21wb25lbnQgZnJvbSBhbm90aGVyIFJheW1hcmNoaW5nQ29tcG9uZW50LlxuICAgKiBAcGFyYW0gY29tcG9uZW50IC0gVGhlIHNvdXJjZSBjb21wb25lbnQgdG8gY29weSBmcm9tXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIF9zaGFsbG93Q29weUZyb20oY29tcG9uZW50OiBDb21wb25lbnQpOiB2b2lkIHtcbiAgICBzdXBlci5fc2hhbGxvd0NvcHlGcm9tKGNvbXBvbmVudCk7XG4gICAgY29uc3QgcmF5bWFyY2hpbmdDb21wb25lbnQgPSBjb21wb25lbnQgYXMgUmF5bWFyY2hpbmdDb21wb25lbnQ7XG4gICAgdGhpcy5fX3Jybkpzb24gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHJheW1hcmNoaW5nQ29tcG9uZW50Ll9fcnJuSnNvbikpO1xuICAgIHRoaXMuX19zZGZTaGFwZVR5cGUgPSByYXltYXJjaGluZ0NvbXBvbmVudC5fX3NkZlNoYXBlVHlwZTtcbiAgICB0aGlzLl9fdW5pZm9ybVZhbHVlUHJvdmlkZXIgPSByYXltYXJjaGluZ0NvbXBvbmVudC5fX3VuaWZvcm1WYWx1ZVByb3ZpZGVyO1xuICAgIHRoaXMuX19nZW5lcmF0ZWRDb2xsaWRlclNoYXBlSW5kaWNlcyA9IFsuLi5yYXltYXJjaGluZ0NvbXBvbmVudC5fX2dlbmVyYXRlZENvbGxpZGVyU2hhcGVJbmRpY2VzXTtcbiAgICB0aGlzLmlzUGlja2FibGUgPSByYXltYXJjaGluZ0NvbXBvbmVudC5pc1BpY2thYmxlO1xuICAgIHRoaXMuY2FzdFNoYWRvdyA9IHJheW1hcmNoaW5nQ29tcG9uZW50LmNhc3RTaGFkb3c7XG4gICAgdGhpcy5pbnZhbGlkYXRlQUFCQigpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoaXMgUmF5bWFyY2hpbmdDb21wb25lbnQgYW5kIGNsZWFucyB1cCByZXNvdXJjZXMuXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIF9kZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuaW52YWxpZGF0ZUFBQkIoKTtcbiAgICBzdXBlci5fZGVzdHJveSgpO1xuICB9XG5cbiAgYWRkVGhpc0NvbXBvbmVudFRvRW50aXR5PEVudGl0eUJhc2UgZXh0ZW5kcyBJRW50aXR5LCBTb21lQ29tcG9uZW50Q2xhc3MgZXh0ZW5kcyB0eXBlb2YgQ29tcG9uZW50PihcbiAgICBiYXNlOiBFbnRpdHlCYXNlLFxuICAgIF9jb21wb25lbnRDbGFzczogU29tZUNvbXBvbmVudENsYXNzXG4gICkge1xuICAgIC8qKlxuICAgICAqIFJheW1hcmNoaW5nRW50aXR5IGlzIGEgbWl4aW4gdGhhdCBhZGRzIHJheW1hcmNoaW5nLXNwZWNpZmljIG1ldGhvZHMgdG8gdGhlIGJhc2UgZW50aXR5LlxuICAgICAqIEBleHRlbmRzIEVudGl0eUJhc2VcbiAgICAgKi9cbiAgICBjbGFzcyBSYXltYXJjaGluZ0VudGl0eSBleHRlbmRzIChiYXNlLmNvbnN0cnVjdG9yIGFzIGFueSkge1xuICAgICAgLyoqXG4gICAgICAgKiBHZXRzIHRoZSBSYXltYXJjaGluZ0NvbXBvbmVudCBhc3NvY2lhdGVkIHdpdGggdGhpcyBlbnRpdHkuXG4gICAgICAgKiBAcmV0dXJucyBUaGUgUmF5bWFyY2hpbmdDb21wb25lbnQgaW5zdGFuY2VcbiAgICAgICAqL1xuICAgICAgZ2V0UmF5bWFyY2hpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENvbXBvbmVudEJ5Q29tcG9uZW50VElEKFdlbGxLbm93bkNvbXBvbmVudFRJRHMuUmF5bWFyY2hpbmdDb21wb25lbnRUSUQpIGFzIFJheW1hcmNoaW5nQ29tcG9uZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBhcHBseU1peGlucyhiYXNlLCBSYXltYXJjaGluZ0VudGl0eSk7XG4gICAgYmFzZS50cnlUb0dldFNjZW5lR3JhcGgoKT8uc2V0V29ybGRBQUJCRGlydHlQYXJlbnRSZWN1cnNpdmVseSgpO1xuICAgIHJldHVybiBiYXNlIGFzIHVua25vd24gYXMgQ29tcG9uZW50VG9Db21wb25lbnRNZXRob2RzPFNvbWVDb21wb25lbnRDbGFzcz4gJiBFbnRpdHlCYXNlO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBRUEsU0FBUyxpQkFBaUI7QUFFMUIsU0FBUyxtQkFBMEM7QUFDbkQsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxvQkFBMkM7QUFFcEQsU0FBUyxZQUFZO0FBRXJCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsZUFBZTtBQUt4QixTQUFTLHNCQUFzQjtBQUMvQixTQUFTLDhCQUE4QjtBQUN2QztBQUFBLEVBR0U7QUFBQSxPQUVLO0FBc0RBLElBQU0sd0JBQU4sTUFBTSw4QkFBNkIsVUFBVTtBQUFBLEVBZ1ZsRCxZQUNFLFFBQ0EsV0FDQSxjQUNBLGlCQUNBLFNBQ0E7QUFDQSxVQUFNLFFBQVEsV0FBVyxjQUFjLGlCQUFpQixPQUFPO0FBdFZqRSxTQUFRQSxLQUFzQjtBQUFBLE1BQzVCLE9BQU8sQ0FBQztBQUFBLE1BQ1IsYUFBYSxDQUFDO0FBQUEsSUFDaEI7QUFD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SyxlQUFlO0FBQ3BCLFVBQU0sU0FBUztBQUFBLEVBQ2pCO0FBQUEsRUFFQSx5QkFDRSxNQUNBLGlCQUNBO0FBbDRCSjtBQUFBLElBdTRCSSxNQUFNLDBCQUEyQixLQUFLLFlBQW9CO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUt4RCxpQkFBaUI7QUFDZixlQUFPLEtBQUssMkJBQTJCLHVCQUF1Qix1QkFBdUI7QUFBQSxNQUN2RjtBQUFBLElBQ0Y7QUFDQSxnQkFBWSxNQUFNLGlCQUFpQjtBQUNuQyxlQUFLLG1CQUFtQixNQUF4QixtQkFBMkI7QUFDM0IsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQXIwQmEsc0JBMmNJRyxLQUFpQixvQkFBSSxRQUF3QjtBQTNjdkQsSUFBTSx1QkFBTjsiLAogICJuYW1lcyI6IFsiX19ycm5Kc29uIiwgIl9fc2RTcGhlcmVOb2RlSnNvbiIsICJfX3NkQm94Tm9kZUpzb24iLCAiX19zZFRvcnVzTm9kZUpzb24iLCAiX19zZENhcHN1bGVOb2RlSnNvbiIsICJfX3NkUm91bmRCb3hOb2RlSnNvbiIsICJfX3Jybkpzb25UZW1wbGF0ZSIsICJfX3NkZlNoYXBlVHlwZSIsICJfX2dlbmVyYXRlZENvbGxpZGVyU2hhcGVJbmRpY2VzIiwgIl9fZ2V0UHJlc2V0U2RmTm9kZUpzb24iLCAiX191bmlmb3JtVmFsdWVQcm92aWRlciIsICJfX2FhYmJWZXJzaW9ucyIsICJfX2VuZ2luZSIsICJfX2NhbGNDb2xsaWRlclNoYXBlIiwgIl9fZ2V0T3JDcmVhdGVTaGFwZUNvbXBvbmVudCIsICJzaGFwZUluZGV4IiwgIl9fdHJhY2tHZW5lcmF0ZWRDb2xsaWRlclNoYXBlIiwgIl9fc2hhcGVNYXRjaGVzRGVzY3JpcHRvciIsICJfX2VudGl0eVJlcG9zaXRvcnkiXQp9Cg==
