import { Array3, Array4 } from './CommonTypes';
import { RnM2 } from './RnM2';

export type Vrm0xHumanBone = {
  bone: string;
  node: number;
  name?: string;
  useDefaultValues: boolean;
};

export type Vrm0xLookAt = {
  curve: number[];
  xRange: number;
  yRange: number;
};

export type Vrm0xBlendShapeBind = {
  mesh: number;
  index: number;
  weight: number;
};

export type Vrm0xBlendShapeGroup = {
  name: string;
  presetName: string;
  isBinary: boolean;
  binds: Vrm0xBlendShapeBind[];
  materialValues: [];
};

export type Vrm0xBoneGroup = {
  comment: string;
  stiffiness: number; // don't fix typo https://github.com/vrm-c/UniVRM/issues/18
  gravityPower: number;
  gravityDir: {
    x: number;
    y: number;
    z: number;
  };
  dragForce: number;
  center: number;
  hitRadius: number;
  bones: number[];
  colliderGroups: number[];
};

export type Vrm0xCollider = {
  offset: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
};

export type Vrm0xColliderGroup = {
  node: number;
  colliders: Vrm0xCollider[];
};

export type Vrm0xMaterialProperty = {
  name: string;
  renderQueue: number;
  shader: string;
  floatProperties: {
    _Cutoff: number;
    _BumpScale: number;
    _ReceiveShadowRate: number;
    _ShadingGradeRate: number;
    _ShadeShift: number;
    _ShadeToony: number;
    _LightColorAttenuation: number;
    _IndirectLightIntensity: number;
    _RimLightingMix: number;
    _RimFresnelPower: number;
    _RimLift: number;
    _OutlineWidth: number;
    _OutlineScaledMaxDistance: number;
    _OutlineLightingMix: number;
    _DebugMode: number;
    _BlendMode: number;
    _OutlineWidthMode: number;
    _OutlineColorMode: number;
    _CullMode: number;
    _OutlineCullMode: number;
    _SrcBlend: number;
    _DstBlend: number;
    _ZWrite: number;
  };
  vectorProperties: {
    _Color: Array4<number>;
    _ShadeColor: Array3<number>;
    _MainTex: Array4<number>;
    _ShadeTexture: Array4<number>;
    _BumpMap: Array4<number>;
    _ReceiveShadowTexture: Array4<number>;
    _ShadingGradeTexture: Array4<number>;
    _SphereAdd: Array4<number>;
    _EmissionColor: Array3<number>;
    _EmissionMap: Array4<number>;
    _OutlineWidthTexture: Array4<number>;
    _OutlineColor: Array3<number>;
    _RimColor: Array3<number>;
  };
  textureProperties: {
    _MainTex: number;
    _ShadeTexture: number;
    _BumpMap: number;
    _SphereAdd: number;
    _EmissionMap: number;
    _OutlineWidthTexture: number;
    _ReceiveShadowTexture: number;
    _RimTexture: number;
    _ShadingGradeTexture: number;
  };
  // keywordMap: {
  //   _NORMALMAP: boolean;
  // };
  // tagMap: {
  //   RenderType: string;
  // };
};

export type Vrm0x_Extension = {
  extensions: {
    VRM: {
      exporterVersion: string;
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
      humanoid: {
        humanBones: Vrm0xHumanBone[];
        armStretch: number;
        legStretch: number;
        upperArmTwist: number;
        lowerArmTwist: number;
        upperLegTwist: number;
        lowerLegTwist: number;
        feetSpacing: number;
        hasTranslationDoF: false;
      };
      firstPerson: {
        firstPersonBone: number;
        firstPersonBoneOffset: {
          x: number;
          y: number;
          z: number;
        };
        meshAnnotations: [];
        lookAtTypeName: string;
        lookAtHorizontalInner: Vrm0xLookAt;
        lookAtHorizontalOuter: Vrm0xLookAt;
        lookAtVerticalDown: Vrm0xLookAt;
        lookAtVerticalUP: Vrm0xLookAt;
      };
      blendShapeMaster: {
        blendShapeGroups: Vrm0xBlendShapeGroup[];
      };
      secondaryAnimation: {
        boneGroups: Vrm0xBoneGroup[];
        colliderGroups: Vrm0xColliderGroup[];
      };
      materialProperties: Vrm0xMaterialProperty[];
    };
  };
};

export type Vrm0x = Vrm0x_Extension & RnM2;
