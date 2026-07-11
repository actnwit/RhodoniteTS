import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins, type EntityRepository } from '../../core/EntityRepository';
import { ProcessStage } from '../../definitions/ProcessStage';
import {
  normalizeShapeDescriptor,
  type ShapeDescriptor,
  type ShapeInstance,
  type ShapeLocalTransform,
} from '../../geometry/Shape';
import { ShapeGizmo } from '../../gizmos/ShapeGizmo';
import { Quaternion, Vector3 } from '../../math';
import type { AABB } from '../../math/AABB';
import type { IVector3 } from '../../math/IVector';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/** Stores lightweight analytic shapes independently from their consumers. */
export class ShapeComponent extends Component {
  private __shapes: ShapeInstance[] = [];
  private __shapeGizmo?: ShapeGizmo;

  constructor(
    engine: Engine,
    entityUid: EntityUID,
    componentSid: ComponentSID,
    entityRepository: EntityRepository,
    isReUse: boolean
  ) {
    super(engine, entityUid, componentSid, entityRepository, isReUse);
    this.moveStageTo(ProcessStage.Logic);
  }

  static get componentTID() {
    return WellKnownComponentTIDs.ShapeComponentTID;
  }

  get componentTID(): ComponentTID {
    return WellKnownComponentTIDs.ShapeComponentTID;
  }

  addShape(descriptor: ShapeDescriptor, localTransform: ShapeLocalTransform = {}): number {
    const shape = normalizeShapeDescriptor(descriptor);
    const instance: ShapeInstance = Object.freeze({
      shape,
      localPosition: Vector3.fromCopy3(
        localTransform.position?.x ?? 0,
        localTransform.position?.y ?? 0,
        localTransform.position?.z ?? 0
      ),
      localRotation: Quaternion.fromCopy4(
        localTransform.rotation?.x ?? 0,
        localTransform.rotation?.y ?? 0,
        localTransform.rotation?.z ?? 0,
        localTransform.rotation?.w ?? 1
      ),
    });
    this.__shapes.push(instance);
    this.__shapeGizmo?.rebuild();
    return this.__shapes.length - 1;
  }

  /** Fits a foot-to-head capsule to an AABB and returns its new shape index. */
  addCapsuleFromAabb(aabb: AABB, options: CapsuleFromAabbOptions = {}): number {
    if (aabb.isVanilla()) {
      throw new Error('Cannot create a capsule from an uninitialized AABB.');
    }
    const origin = options.origin ?? Vector3.zero();
    const radiusScale = options.radiusScale ?? 1;
    const maxRadiusToHeightRatio = options.maxRadiusToHeightRatio ?? 0.2;
    const values = [
      aabb.sizeX,
      aabb.sizeY,
      aabb.sizeZ,
      origin.x,
      origin.y,
      origin.z,
      radiusScale,
      maxRadiusToHeightRatio,
    ];
    if (values.some(value => !Number.isFinite(value)) || aabb.sizeX <= 0 || aabb.sizeY <= 0 || aabb.sizeZ <= 0) {
      throw new Error('Capsule AABB and origin must contain finite values and positive dimensions.');
    }
    if (radiusScale <= 0 || maxRadiusToHeightRatio <= 0 || maxRadiusToHeightRatio >= 0.5) {
      throw new Error('Capsule radiusScale must be positive and maxRadiusToHeightRatio must be between 0 and 0.5.');
    }
    const radius = Math.min((Math.max(aabb.sizeX, aabb.sizeZ) / 2) * radiusScale, aabb.sizeY * maxRadiusToHeightRatio);
    const height = aabb.sizeY - radius * 2;
    return this.addShape(
      { type: 'capsule', height, radiusBottom: radius, radiusTop: radius },
      { position: Vector3.subtract(aabb.centerPoint, origin) }
    );
  }

  getShape(index = 0): ShapeInstance | undefined {
    return this.__shapes[index];
  }

  removeShape(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.__shapes.length) {
      return false;
    }
    this.__shapes.splice(index, 1);
    this.__shapeGizmo?.rebuild();
    return true;
  }

  clearShapes(): void {
    this.__shapes.length = 0;
    this.__shapeGizmo?.rebuild();
  }

  get shapeCount(): number {
    return this.__shapes.length;
  }

  $logic(): void {
    if (this.__shapeGizmo?.isVisible) {
      this.__shapeGizmo._update();
    }
  }

  set isShapeGizmoVisible(visible: boolean) {
    if (visible && this.__shapeGizmo == null) {
      this.__shapeGizmo = new ShapeGizmo(this.__engine, this);
      this.__shapeGizmo._setup();
    }
    if (this.__shapeGizmo != null) {
      this.__shapeGizmo.isVisible = visible;
    }
  }

  get isShapeGizmoVisible(): boolean {
    return this.__shapeGizmo?.isVisible ?? false;
  }

  get shapeGizmo(): ShapeGizmo | undefined {
    return this.__shapeGizmo;
  }

  _destroy(): void {
    this.__shapeGizmo?._destroy();
    this.__shapeGizmo = undefined;
    this.clearShapes();
    super._destroy();
  }

  addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(
    base: EntityBase,
    _componentClass: SomeComponentClass
  ) {
    class ShapeEntity extends (base.constructor as any) {
      getShape() {
        return this.getComponentByComponentTID(WellKnownComponentTIDs.ShapeComponentTID) as ShapeComponent;
      }
    }
    applyMixins(base, ShapeEntity);
    return base as unknown as ComponentToComponentMethods<SomeComponentClass> & EntityBase;
  }
}

export interface CapsuleFromAabbOptions {
  /** Origin expressed in the same coordinates as the AABB. */
  origin?: IVector3;
  radiusScale?: number;
  /** Maximum radius as a fraction of AABB height. Must be below 0.5. */
  maxRadiusToHeightRatio?: number;
}
