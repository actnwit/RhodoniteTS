import { RnM2, RnM2Material, RnM2Texture } from './RnM2';
import { Vrm1_Material } from './VRMC_materials_mtoon';
import { VRMC_node_constraint } from './VRMC_node_constraint';
import { VRMC_springBone } from './VRMC_springBone';

export type Vrm1HumanBone = {
  node: number;
};

export type Vrm1LookAt = {
  curve: number[];
  xRange: number;
  yRange: number;
};

export type Vrm1_MeshAnnotation = {
  node: number;
  type: 'thirdPersonOnly' | 'firstPersonOnly' | 'both' | 'auto';
};

export type Vrm1BlendShapeBind = {
  mesh: number;
  index: number;
  weight: number;
};

export type Vrm1BlendShapeGroup = {
  name: string;
  presetName: string;
  binds: Vrm1BlendShapeBind[];
  materialValues: [];
};

export type Vrm1MorphTargetBind = {
  index: number;
  node: number;
  weight: number;
};

export type Vrm1MaterialColorBind = {
  material: number;
  type: string;
  targetValue: [number, number, number, number];
};

export type Vrm1TextureTransformBind = {
  material: number;
  scale: [number, number];
  offset: [number, number];
};

export type Vrm1OverrideType = 'none' | 'block' | 'blend';



export type Vrm1_NodeConstraint_Constraint = {
  specVersion: string;
  constraint: {
    rotation?: {
      source: number;
      weight?: number;
    };
    aim?: {
      source: number;
      aimAxis: string;
      weight?: number;
    };
    roll?: {
      source: number;
      rollAxis: string;
      weight?: number;
    };
  };
};

export interface Vrm1_Extension {
  materials: Vrm1_Material[];
  extensions: {
    VRMC_vrm: {
      specVersion: string;
      humanoid: {
        humanBones: Vrm1HumanBone[];
        armStretch: number;
        legStretch: number;
        upperArmTwist: number;
        lowerArmTwist: number;
        upperLegTwist: number;
        lowerLegTwist: number;
        feetSpacing: number;
        hasTranslationDoF: false;
      };
      meta: {
        version: string;
        author: string;
        contactInformation: string;
        reference: string;
        title: string;
        texture: 30;
        allowedUserName: string;
        violentUsageName: string;
        sexualUsageName: string;
        commercialUsageName: string;
        otherPermissionUrl: string;
        licenseName: string;
        otherLicenseUrl: string;
      };
      firstPerson: {
        meshAnnotations: Vrm1_MeshAnnotation[];
      };
      expressions: {
        preset: {
          [key: string]: {
            isBinary: boolean;
            morphTargetBinds: Vrm1MorphTargetBind[];
            materialColorBinds: Vrm1MaterialColorBind[];
            textureTransformBinds: Vrm1TextureTransformBind[];
            overrideBlink: Vrm1OverrideType;
            overrideLookAt: Vrm1OverrideType;
            overrideMouth: Vrm1OverrideType;
          };
        };
      };
      lookAt: {
        type: 'bone' | 'expression';
        offsetFromHeadBone: [number, number, number];
        rangeMapHorizontalInner: {
          inputMaxValue: number;
          outputScale: number;
        };
        rangeMapHorizontalOuter: {
          inputMaxValue: number;
          outputScale: number;
        };
        rangeMapVerticalDown: {
          inputMaxValue: number;
          outputScale: number;
        };
        rangeMapVerticalUp: {
          inputMaxValue: number;
          outputScale: number;
        };
      };
    };
    VRMC_springBone?: VRMC_springBone;
    VRMC_node_constraint?: VRMC_node_constraint;
  };
}

export type Vrm1 = Vrm1_Extension & RnM2;
