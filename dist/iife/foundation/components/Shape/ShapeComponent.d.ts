import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import { type ShapeDescriptor, type ShapeInstance, type ShapeLocalTransform } from '../../geometry/Shape';
import { ShapeGizmo } from '../../gizmos/ShapeGizmo';
import type { AABB } from '../../math/AABB';
import type { IVector3 } from '../../math/IVector';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/** Stores lightweight analytic shapes independently from their consumers. */
export declare class ShapeComponent extends Component {
    private __shapes;
    private __nextShapeIndex;
    private __shapeGizmo?;
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): 18;
    get componentTID(): ComponentTID;
    addShape(descriptor: ShapeDescriptor, localTransform?: ShapeLocalTransform): number;
    /** Fits a foot-to-head capsule to an AABB and returns its new shape index. */
    addCapsuleFromAabb(aabb: AABB, options?: CapsuleFromAabbOptions): number;
    getShape(index?: number): ShapeInstance | undefined;
    removeShape(index: number): boolean;
    clearShapes(): void;
    get shapeCount(): number;
    /** @internal Iterates stable shape indices and their instances. */
    _getShapeEntries(): IterableIterator<[number, ShapeInstance]>;
    $logic(): void;
    set isShapeGizmoVisible(visible: boolean);
    get isShapeGizmoVisible(): boolean;
    get shapeGizmo(): ShapeGizmo | undefined;
    /** @internal Copies immutable ShapeInstances while preserving their stable indices. */
    _shallowCopyFrom(component_: Component): void;
    _destroy(): void;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
export interface CapsuleFromAabbOptions {
    /** Origin expressed in the same coordinates as the AABB. */
    origin?: IVector3;
    radiusScale?: number;
    /** Maximum radius as a fraction of AABB height. Must be below 0.5. */
    maxRadiusToHeightRatio?: number;
}
