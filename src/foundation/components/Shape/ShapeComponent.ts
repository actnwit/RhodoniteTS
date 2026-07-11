import type { ComponentTID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { applyMixins } from '../../core/EntityRepository';
import {
  normalizeShapeDescriptor,
  type ShapeDescriptor,
  type ShapeInstance,
  type ShapeLocalTransform,
} from '../../geometry/Shape';
import { Quaternion, Vector3 } from '../../math';
import type { ComponentToComponentMethods } from '../ComponentTypes';
import { WellKnownComponentTIDs } from '../WellKnownComponentTIDs';

/** Stores lightweight analytic shapes independently from their consumers. */
export class ShapeComponent extends Component {
  private __shapes: ShapeInstance[] = [];

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
    return this.__shapes.length - 1;
  }

  getShape(index = 0): ShapeInstance | undefined {
    return this.__shapes[index];
  }

  removeShape(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.__shapes.length) {
      return false;
    }
    this.__shapes.splice(index, 1);
    return true;
  }

  clearShapes(): void {
    this.__shapes.length = 0;
  }

  get shapeCount(): number {
    return this.__shapes.length;
  }

  _destroy(): void {
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
