import { ISceneGraphEntity } from '../../helpers';
import { IVector3 } from '../../math';
import { PhysicsPropertyInner } from '../PhysicsProperty';
import { PhysicsStrategy } from '../PhysicsStrategy';
import { PhysicsWorldProperty } from '../PhysicsWorldProperty';
export declare class OimoPhysicsStrategy implements PhysicsStrategy {
    static __worldProperty: PhysicsWorldProperty;
    static __world: any;
    private __body;
    private __entity?;
    private __property;
    private __localScale;
    constructor();
    setShape(prop: PhysicsPropertyInner, entity: ISceneGraphEntity): void;
    update(): void;
    setPosition(worldPosition: IVector3): void;
    setEulerAngle(eulerAngles: IVector3): void;
    setScale(scale: IVector3): void;
    static update(): void;
}
