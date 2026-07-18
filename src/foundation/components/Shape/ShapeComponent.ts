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
  private __shapes = new Map<number, ShapeInstance>();
  private __nextShapeIndex = 0;
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
    const positionX = localTransform.position?.x ?? 0;
    const positionY = localTransform.position?.y ?? 0;
    const positionZ = localTransform.position?.z ?? 0;
    if (![positionX, positionY, positionZ].every(Number.isFinite)) {
      throw new Error('Shape local position components must be finite.');
    }
    const localPosition = Vector3.fromCopy3(positionX, positionY, positionZ);
    if (![localPosition.x, localPosition.y, localPosition.z].every(Number.isFinite)) {
      throw new Error('Shape local position components must be representable as finite numbers.');
    }

    const rotationX = localTransform.rotation?.x ?? 0;
    const rotationY = localTransform.rotation?.y ?? 0;
    const rotationZ = localTransform.rotation?.z ?? 0;
    const rotationW = localTransform.rotation?.w ?? 1;
    if (![rotationX, rotationY, rotationZ, rotationW].every(Number.isFinite)) {
      throw new Error('Shape local rotation components must be finite.');
    }
    const rotationLength = Math.hypot(rotationX, rotationY, rotationZ, rotationW);
    if (!Number.isFinite(rotationLength) || rotationLength === 0) {
      throw new Error('Shape local rotation must be a non-zero quaternion.');
    }
    const inverseRotationLength = 1 / rotationLength;
    const instance: ShapeInstance = Object.freeze({
      shape,
      localPosition,
      localRotation: Quaternion.fromCopy4(
        rotationX * inverseRotationLength,
        rotationY * inverseRotationLength,
        rotationZ * inverseRotationLength,
        rotationW * inverseRotationLength
      ),
    });
    const index = this.__nextShapeIndex++;
    this.__shapes.set(index, instance);
    this.__shapeGizmo?.rebuild();
    return index;
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
    return this.__shapes.get(index);
  }

  removeShape(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || !this.__shapes.delete(index)) {
      return false;
    }
    this.__shapeGizmo?.rebuild();
    return true;
  }

  clearShapes(): void {
    this.__shapes.clear();
    this.__shapeGizmo?.rebuild();
  }

  get shapeCount(): number {
    return this.__shapes.size;
  }

  /** @internal Iterates stable shape indices and their instances. */
  _getShapeEntries(): IterableIterator<[number, ShapeInstance]> {
    return this.__shapes.entries();
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
    this.__nextShapeIndex = 0;
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
