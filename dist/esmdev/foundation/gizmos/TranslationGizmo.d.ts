import { IMeshEntity } from '../helpers/EntityHelper';
import { Gizmo } from './Gizmo';
/**
 * Translation Gizmo class
 */
export declare class TranslationGizmo extends Gizmo {
    private static __groupEntity;
    private static __xCubeEntity;
    private static __yCubeEntity;
    private static __zCubeEntity;
    private static __xCubeMesh;
    private static __yCubeMesh;
    private static __zCubeMesh;
    private static __xCubePrimitive;
    private static __yCubePrimitive;
    private static __zCubePrimitive;
    private static __xCubeMaterial;
    private static __yCubeMaterial;
    private static __zCubeMaterial;
    private static __xyPlaneEntity;
    private static __yzPlaneEntity;
    private static __zxPlaneEntity;
    private static __xyPlaneMesh;
    private static __yzPlaneMesh;
    private static __zxPlaneMesh;
    private static __xyPlanePrimitive;
    private static __yzPlanePrimitive;
    private static __zxPlanePrimitive;
    private static __xyPlaneMaterial;
    private static __yzPlaneMaterial;
    private static __zxPlaneMaterial;
    private static __originalX;
    private static __originalY;
    private __pickStatedPoint;
    private __deltaPoint;
    private __targetPointBackup;
    private __isPointerDown;
    private static __activeAxis;
    private static __space;
    private __latestTargetEntity?;
    private __onPointerDownFunc;
    private __onPointerMoveFunc;
    private __onPointerUpFunc;
    private static __length;
    /**
     * Constructor
     * @param target the object which this gizmo belong to
     */
    constructor(target: IMeshEntity);
    get isSetup(): boolean;
    set length(val: number);
    get length(): number;
    set isVisible(flg: boolean);
    setSpace(space: 'local' | 'world'): void;
    get isVisible(): boolean;
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
    private __onPointerDown;
    private __onPointerMove;
    private __onPointerUp;
    private static castRay2;
    private static castRay;
    _destroy(): void;
}
