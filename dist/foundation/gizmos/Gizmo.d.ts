import RnObject from "../core/RnObject";
import EntityRepository from "../core/EntityRepository";
import Entity from "../core/Entity";
export default abstract class Gizmo extends RnObject {
    protected __entityRepository: EntityRepository;
    protected __topEntity?: Entity;
    protected __substance: RnObject;
    protected __isVisible: boolean;
    constructor(substance: RnObject);
    abstract setup(): void;
    abstract isSetup: boolean;
    abstract update(): void;
    protected setGizmoTag(): void;
    set isVisible(flg: boolean);
    get isVisible(): boolean;
}
