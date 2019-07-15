import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import CameraComponent from './CameraComponent';
import Mesh from '../geometry/Mesh';
export default class MeshComponent extends Component {
    private __viewDepth;
    private __mesh?;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static readonly componentTID: ComponentTID;
    setMesh(mesh: Mesh): void;
    unsetMesh(): boolean;
    readonly mesh: Mesh | undefined;
    $load(): void;
    calcViewDepth(cameraComponent: CameraComponent): number;
    readonly viewDepth: number;
    static alertNoMeshSet(meshComponent: MeshComponent): void;
}
