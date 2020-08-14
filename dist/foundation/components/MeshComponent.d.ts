import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import Vector3 from '../math/Vector3';
import CameraComponent from './CameraComponent';
import Vector4 from '../math/Vector4';
import Mesh from '../geometry/Mesh';
import { ComponentTID, EntityUID, ComponentSID } from '../../commontypes/CommonTypes';
export default class MeshComponent extends Component {
    private __viewDepth;
    private __mesh?;
    private __blendShapeComponent?;
    private __sceneGraphComponent?;
    isPickable: boolean;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static get componentTID(): ComponentTID;
    setMesh(mesh: Mesh): void;
    unsetMesh(): boolean;
    get mesh(): Mesh | undefined;
    set weights(value: number[]);
    calcViewDepth(cameraComponent: CameraComponent): number;
    get viewDepth(): number;
    static alertNoMeshSet(meshComponent: MeshComponent): void;
    castRay(srcPointInWorld: Vector3, directionInWorld: Vector3, dotThreshold?: number): {
        t: number;
        intersectedPositionInWorld: Vector3 | null;
    } | {
        t: number;
        intersectedPositionInWorld: undefined;
    };
    castRayFromScreen(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number): {
        t: number;
        intersectedPositionInWorld: Vector3 | null;
    } | {
        t: number;
        intersectedPositionInWorld: undefined;
    };
    $create(): void;
    $load(): void;
    $logic(): void;
}
