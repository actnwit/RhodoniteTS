import { RnM2 } from './RnM2';
export declare type HumanBoneNames = 'hips' | 'spine' | 'chest' | 'neck' | 'head' | 'leftUpperLeg' | 'leftLowerLeg' | 'leftFoot' | 'leftToes' | 'rightUpperLeg' | 'rightLowerLeg' | 'rightFoot' | 'rightToes' | 'leftShoulder' | 'leftUpperArm' | 'leftLowerArm' | 'leftHand' | 'rightShoulder' | 'rightUpperArm' | 'rightLowerArm' | 'rightHand';
export declare type NodeId = number;
export interface RnM2Vrma extends RnM2 {
    extensions: {
        VRMC_vrm_animation: {
            specVersion: string;
            humanoid?: {
                humanBones: Record<HumanBoneNames, {
                    node: number;
                }>;
            };
            humanoidBoneNameMap?: Map<NodeId, HumanBoneNames>;
        };
    };
}
