import Component from '../core/Component';
import Matrix44 from '../math/Matrix44';
import EntityRepository from '../core/EntityRepository';
import MutableRowMajarMatrix44 from '../math/MutableRowMajarMatrix44';
export default class SceneGraphComponent extends Component {
    private __parent?;
    private __isAbleToBeParent;
    private __children?;
    private _worldMatrix;
    private __isWorldMatrixUpToDate;
    private __tmpMatrix;
    private static __bufferView;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static readonly componentTID: ComponentTID;
    beAbleToBeParent(flag: boolean): void;
    setWorldMatrixDirty(): void;
    addChild(sg: SceneGraphComponent): void;
    readonly worldMatrixInner: MutableRowMajarMatrix44;
    readonly worldMatrix: import("../math/RowMajarMatrix44").default;
    $logic(): void;
    calcWorldMatrixRecursively(): Matrix44 | MutableRowMajarMatrix44;
}
