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

export type ExpressionPreset =
  | 'happy'
  | 'angry'
  | 'sad'
  | 'relaxed'
  | 'surprised'
  | 'aa'
  | 'ih'
  | 'ou'
  | 'ee'
  | 'oh'
  | 'blink'
  | 'blinkLeft'
  | 'blinkRight'
  | 'neutral';
export interface VRMC_vrm_animation {
  specVersion: string;
  humanoid?: {
    humanBones: Record<HumanBoneNames, { node: number }>;
  };
  expressions?: {
    preset?: Record<ExpressionPreset, { node: number }>;
    custom?: Record<string, { node: number }>;
  };
  lookAt?: {
    node: number;
    offsetFromHeadBone?: [number, number, number];
  };
}

export interface RnM2_VRMC_vrm_animation extends VRMC_vrm_animation {
  humanoidBoneNameMap?: Map<NodeId, HumanBoneNames>;
}
