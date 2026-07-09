import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { CapsuleCollider } from '../physics/VRMSpring/CapsuleCollider';
import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';
/**
 * CapsuleColliderGizmo renders a capsule collider visualization for debugging purposes.
 * The visualization is a semi-transparent green wireframe capsule that shows the collider's bounds.
 */
export declare class CapsuleColliderGizmo extends Gizmo {
    protected __topEntity?: ISceneGraphEntity;
    private __capsuleCollider;
    private __capsuleEntity?;
    private static __tmpVec3_0;
    private static __tmpVec3_1;
    private static __tmpQuat;
    /**
     * Creates a new CapsuleColliderGizmo instance
     * @param capsuleCollider - The capsule collider to visualize
     */
    constructor(engine: Engine, capsuleCollider: CapsuleCollider);
    get isSetup(): boolean;
    _setup(): void;
    _update(): void;
    _destroy(): void;
    /**
     * Gets the capsule collider being visualized.
     * @returns The capsule collider instance
     */
    get capsuleCollider(): CapsuleCollider;
}
