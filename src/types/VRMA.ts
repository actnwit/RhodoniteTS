export type HumanBoneNames =
  | 'hips'
  | 'spine'
  | 'chest'
  | 'neck'
  | 'head'
  | 'leftUpperLeg'
  | 'leftLowerLeg'
  | 'leftFoot'
  | 'leftToes'
  | 'rightUpperLeg'
  | 'rightLowerLeg'
  | 'rightFoot'
  | 'rightToes'
  | 'leftShoulder'
  | 'leftUpperArm'
  | 'leftLowerArm'
  | 'leftHand'
  | 'rightShoulder'
  | 'rightUpperArm'
  | 'rightLowerArm'
  | 'rightHand';

export type NodeId = number;

export interface VRMC_vrm_animation {
  specVersion: string;
  humanoid?: {
    humanBones: Record<HumanBoneNames, { node: number }>;
  };
  humanoidBoneNameMap?: Map<NodeId, HumanBoneNames>;
};
