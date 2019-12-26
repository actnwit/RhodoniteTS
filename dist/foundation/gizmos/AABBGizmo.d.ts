import Gizmo from "./Gizmo";
import RnObject from "../core/RnObject";
export default class AABBGizmo extends Gizmo {
    private static __aabbMesh?;
    constructor(substance: RnObject);
    get isSetup(): boolean;
    setup(): void;
    private static generatePrimitive;
    update(): void;
}
