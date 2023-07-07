import { ISceneGraphEntity } from '../helpers/EntityHelper';
import { Gizmo } from './Gizmo';
export declare class LightGizmo extends Gizmo {
    private static __mesh;
    private static __length;
    /**
     * Constructor
     * @param target the object which this gizmo belong to
     */
    constructor(target: ISceneGraphEntity);
    get isSetup(): boolean;
    /**
     * @internal
     * setup entities of Gizmo if not done yet
     */
    _setup(): void;
    /**
     * @internal
     * update the transform and etc of the gizmo
     */
    _update(): void;
    _destroy(): void;
    private static __generatePrimitive;
}
