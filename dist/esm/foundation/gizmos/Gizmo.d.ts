import { RnObject } from '../core/RnObject';
import { ISceneGraphEntity, IMeshEntity } from '../helpers/EntityHelper';
/**
 * Abstract Gizmo class
 */
export declare abstract class Gizmo extends RnObject {
    /**
     * The top entity of this gizmo group.
     * A programmer who implements a gizmo class has to make this entity
     * a child of the target entity's scene graph component
     * that the gizmo will belong to manually.
     */
    protected __topEntity?: IMeshEntity | ISceneGraphEntity;
    /** the target entity which this gizmo belong to */
    protected __target: ISceneGraphEntity;
    protected __isVisible: boolean;
    /**
     * Constructor
     * @param entity the object which this gizmo belong to
     */
    constructor(target: ISceneGraphEntity);
    set isVisible(flg: boolean);
    get isVisible(): boolean;
    protected __setVisible(flg: boolean): void;
    abstract isSetup: boolean;
    /**
     * @internal
     * setup entities of Gizmo if not done yet
     */
    abstract _setup(): void;
    /**
     * @internal
     * update the transform and etc of the gizmo
     */
    abstract _update(): void;
    abstract _destroy(): void;
    protected __toSkipSetup(): boolean;
    protected setGizmoTag(): void;
}
