import type { ShapeComponent } from '../components/Shape/ShapeComponent';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
import type { Engine } from '../system/Engine';
import { Gizmo } from './Gizmo';
/** Displays every analytic shape stored in a ShapeComponent. */
export declare class ShapeGizmo extends Gizmo {
    protected __topEntity?: ISceneGraphEntity;
    private readonly __shapeComponent;
    private __material?;
    private __shapeEntities;
    constructor(engine: Engine, shapeComponent: ShapeComponent);
    get isSetup(): boolean;
    /** Root entity to register in a dedicated or existing gizmo render pass. */
    get topEntity(): ISceneGraphEntity | undefined;
    _setup(): void;
    _update(): void;
    rebuild(): void;
    _destroy(): void;
    private __populateShapes;
    private __addShape;
    private __addMesh;
}
