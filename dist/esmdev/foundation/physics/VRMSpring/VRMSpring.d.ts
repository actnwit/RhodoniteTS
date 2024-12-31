import { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { RnObject } from '../../core/RnObject';
import { VRMSpringBone } from './VRMSpringBone';
import { VRMColliderGroup } from './VRMColliderGroup';
export declare class VRMSpring extends RnObject {
    rootBone: SceneGraphComponent;
    bones: VRMSpringBone[];
    colliderGroups: VRMColliderGroup[];
    center: SceneGraphComponent | undefined;
    constructor(rootBone: SceneGraphComponent);
}
