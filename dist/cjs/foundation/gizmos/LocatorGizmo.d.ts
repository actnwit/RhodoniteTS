import { IMeshEntity } from '../helpers/EntityHelper';
import { Gizmo } from './Gizmo';
/**
 * Locator Gizmo class
 */
export declare class LocatorGizmo extends Gizmo {
    private static __mesh;
    private static __length;
    /**
     * Constructor
     * @param target the object which this gizmo belong to
     */
    constructor(target: IMeshEntity);
    get isSetup(): boolean;
    set length(val: number);
    get length(): number;
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
    private static __generatePrimitive;
}
