import { PhysicsShapeTypeEnum } from '../definitions/PhysicsShapeType';
import { IVector3 } from '../math';
export declare type PhysicsPropertyInner = {
    type: PhysicsShapeTypeEnum;
    size: IVector3;
    position: IVector3;
    rotation: IVector3;
    move: boolean;
    density: number;
    friction: number;
    restitution: number;
};
export declare type PhysicsProperty = {
    use: boolean;
    move: boolean;
    density: number;
    friction: number;
    restitution: number;
};
