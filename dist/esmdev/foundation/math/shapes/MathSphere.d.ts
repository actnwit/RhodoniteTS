import { FloatTypedArrayConstructor } from '../../../types/CommonTypes';
import { IMutableVector3, IVector3 } from '../IVector';
import { MutableVector3_ } from '../MutableVector3';
export declare class MathSphere_<T extends FloatTypedArrayConstructor> {
    private __position;
    private __radius;
    private __type;
    constructor(position: IMutableVector3, radius: number);
    get position(): MutableVector3_<T>;
    get radius(): number;
    calcCollision(rayPos: IVector3, rayDir: IVector3): boolean;
}
export declare class MathSphere extends MathSphere_<Float32ArrayConstructor> {
}
export declare class MathSphereD extends MathSphere_<Float64ArrayConstructor> {
}
export type MathSphereF = MathSphere;
