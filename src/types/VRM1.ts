import {RnM2} from './RnM2';

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

export type Vrm1SpringBone_Spring = {
  colliderGroups: number[];
  joints: Vrm1SpringBone_Joint[];
  name: string;
};

export type Vrm1SpringBone_Joint = {
  node: number;
  hitRadius: number;
  stiffness: number;
  gravityPower: number;
  gravityDir: [number, number, number];
  dragForce: number;
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

export type Vrm1SpringBone_Collider = {
  node: number;
  shape: {
    sphere?: {
      offset: [number, number, number];
      radius: number;
    };
    capsule?: {
      offset: [number, number, number];
      radius: number;
      tail: [number, number, number];
    };
  };
};

export type Vrm1SpringBone_ColliderGroup = {
  name: string;
  colliders: number[];
};

export type Vrm1_Materials_MToon = {
  // Meta
  specVersion: string;

  // Rendering
  transparentWithZWrite: boolean; // Whether write to depth buffer or not when alphaMode is BLEND
  renderQueueOffsetNumber: number; // Offset value to the rendering order

  // Lighting
  shadeColorFactor: [number, number, number];
  shadeMultiplyTexture: {
    index: number;
    texCoord?: number;
    scale?: number;
  };
  shadingShiftFactor: number;
  shadingShiftTexture: {
    index: number;
    texCoord?: number;
    scale?: number;
  };
  shadingToonyFactor: number;

  // Global Illumination
  giEqualizationFactor: number;

  // Rim Lighting
  matcapFactor: [number, number, number];
  matcapTexture: {
    index: number;
    texCoord?: number;
    scale?: number;
  };
  parametricRimColorFactor: [number, number, number];
  parametricRimFresnelPowerFactor: number;
  parametricRimLiftFactor: number;
  rimMultiplyTexture: {
    index: number;
    texCoord?: number;
    scale?: number;
  };
  rimLightingMixFactor: number;

  // Outline
  outlineColorFactor: [number, number, number];
  outlineLightingMixFactor: number;
  outlineWidthFactor: number;
  outlineWidthMode: 'none' | 'worldCoordinates' | 'screenCoordinates';

  // UV Animation
  uvAnimationRotationSpeedFactor: number;
  uvAnimationScrollXSpeedFactor: number;
  uvAnimationScrollYSpeedFactor: number;
};

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

export type Vrm1_Extension = {
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
    VRMC_springBone: {
      colliderGroups: Vrm1SpringBone_ColliderGroup[];
      colliders: Vrm1SpringBone_Collider[];
      specVersions: string;
      springs: Vrm1SpringBone_Spring[];
    };
  };
};

export type Vrm1 = Vrm1_Extension & RnM2;
