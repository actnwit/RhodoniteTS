import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';
/**
 * RotationGizmo provides interactive rotation rings for manipulating entity orientation.
 * It offers three color-coded rings (X: red, Y: green, Z: blue) that respond to pointer
 * drag operations both in world space and in local space aligned to the target hierarchy.
 */
export declare class RotationGizmo extends Gizmo {
    /** Resources managed per-Engine instance */
    private static __resourcesMap;
    private static __activeAxis;
    private static __space;
    private static __length;
    private static readonly __unitX;
    private static readonly __unitY;
    private static readonly __unitZ;
    private static readonly __tmpMatrix44_0;
    private static readonly __tmpMatrix44_1;
    private static readonly __tmpMatrix44_2;
    private static readonly __tmpVector4_0;
    private static readonly __tmpVector4_1;
    private static readonly __tmpVector4_2;
    private static readonly __tmpVector4_3;
    private static readonly __tmpVector3_0;
    private static readonly __tmpVector3_1;
    private static readonly __tmpVector3_2;
    private static readonly __tmpVector3_3;
    private static readonly __tmpVector3_4;
    private static readonly __tmpVector3_5;
    private static readonly __tmpVector3_6;
    private static readonly __tmpVector3_7;
    private static readonly __tmpVector3_8;
    private static readonly __tmpVector3_9;
    private __isPointerDown;
    private __startVector;
    private __deltaQuaternion;
    private __targetRotationBackup;
    private __latestTargetEntity?;
    private __onPointerDownFunc;
    private __onPointerMoveFunc;
    private __onPointerUpFunc;
    private __isCameraControllerDisabled;
    private __pointerPrev;
    private __dragScreenDirection;
    private __rotationAxisForQuaternion;
    private __dragScale;
    private __accumulatedAngle;
    private __activePointerElement?;
    /**
     * Gets the resources for a specific engine, or undefined if not initialized.
     */
    private static __getResources;
    get isSetup(): boolean;
    set length(val: number);
    get length(): number;
    get isVisible(): boolean;
    set isVisible(flg: boolean);
    setSpace(space: 'local' | 'world'): void;
    _setup(): void;
    /**
     * Creates all resources needed for the gizmo.
     */
    private __createResources;
    _update(): void;
    _destroy(): void;
    private __attachSharedGroup;
    private __applySpaceToGroup;
    private __onPointerDown;
    private __onPointerMove;
    private __onPointerUp;
    private __prepareLinearDragMapping;
    private __setDefaultDragDirection;
    private __setFallbackLocalTangent;
    private __setFallbackWorldDirection;
    private __chooseAnyPerpendicular;
    private __handleLinearDrag;
    private __transformDirectionFromGroupLocal;
    private __resolvePointerElement;
    private __disableCameraController;
    private __enableCameraControllerIfNeeded;
    private static __projectToPlane;
    private __getAxisForQuaternion;
    private static __getAxisVector;
    private static __castRay;
    private static __castFromEntities;
    private static __castFromEntitiesLocal;
    private static __createRingPrimitive;
    private static __selectClosestAxis;
    private static __createRingMaterial;
    /**
     * Cleans up all static resources for a specific Engine.
     * This removes the resources associated with the engine from the map.
     * @internal Called from Engine.destroy()
     */
    static _cleanupForEngine(engine: Engine): void;
}
