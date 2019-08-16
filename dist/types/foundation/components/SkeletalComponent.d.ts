import Component from '../core/Component';
import EntityRepository from '../core/EntityRepository';
import Matrix44 from '../math/Matrix44';
import SceneGraphComponent from './SceneGraphComponent';
import MutableVector4 from '../math/MutableVector4';
import { ComponentTID, ComponentSID, EntityUID, Index } from '../../types/CommonTypes';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
export default class SkeletalComponent extends Component {
    _jointIndices: Index[];
    private __joints;
    _inverseBindMatrices: Matrix44[];
    _bindShapeMatrix?: Matrix44;
    private __jointMatrices?;
    jointsHierarchy?: SceneGraphComponent;
    isSkinning: boolean;
    isOptimizingMode: boolean;
    private __boneCompressedInfo;
    private static __scaleVec3;
    private static __tmp_mat4;
    private static __tmp2_mat4;
    private __qArray;
    private __tArray;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static readonly componentTID: ComponentTID;
    joints: SceneGraphComponent[];
    $create(): void;
    $load(): void;
    $logic({ processApproach }: {
        processApproach: ProcessApproachEnum;
    }): void;
    readonly jointMatrices: number[] | undefined;
    readonly jointQuaternionArray: Float32Array;
    readonly jointTranslateScaleArray: Float32Array;
    readonly jointCompressedInfo: MutableVector4;
}
