import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from './SceneGraphComponent';
import MutableVector4 from '../math/MutableVector4';
export default class SkeletalComponent extends Component {
    _jointIndices: Index[];
    private __joints;
    _inverseBindMatrices: Matrix44[];
    _bindShapeMatrix?: Matrix44;
    private __jointMatrices?;
    jointsHierarchy?: SceneGraphComponent;
    private __sceneGraphComponent?;
    private __qtArray?;
    isSkinning: boolean;
    isOptimizingMode: boolean;
    private __boneCompressedInfo;
    private static __scaleVec3;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static readonly componentTID: ComponentTID;
    joints: SceneGraphComponent[];
    $create(): void;
    $load(): void;
    $logic(): void;
    readonly jointMatrices: number[] | undefined;
    readonly jointCompressedChanks: Float32Array | undefined;
    readonly jointCompressedInfo: MutableVector4;
}
