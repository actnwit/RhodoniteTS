import { Gizmo } from './Gizmo';
import { ISceneGraphEntity } from '../helpers/EntityHelper';
/**
 * AABB Gizmo class
 */
export declare class AABBGizmo extends Gizmo {
    private static __mesh?;
    /**
     * Constructor
     * @param target the object which this gizmo belong to
     */
    constructor(target: ISceneGraphEntity);
    get isSetup(): boolean;
    /**
     * @private
     * setup entities of Gizmo if not done yet
     */
    _setup(): void;
    /**
     * generate the primitive of the gizmo
     * @returns a primitive of the gizmo
     */
    private static generatePrimitive;
    /**
     * @private
     * update the transform and etc of the gizmo
     */
    _update(): void;
}
