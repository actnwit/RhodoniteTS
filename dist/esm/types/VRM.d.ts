import { RnM2 } from './RnM2';
export declare type HumanBone = {
    bone: string;
    node: number;
    name?: string;
    useDefaultValues: boolean;
};
export declare type LookAt = {
    curve: number[];
    xRange: number;
    yRange: number;
};
export declare type BlendShapeBind = {
    mesh: number;
    index: number;
    weight: number;
};
export declare type BlendShapeGroup = {
    name: string;
    presetName: string;
    binds: BlendShapeBind[];
    materialValues: [];
};
export declare type BoneGroup = {
    comment: string;
    stiffiness: number;
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
export declare type Collider = {
    offset: {
        x: number;
        y: number;
        z: number;
    };
    radius: number;
};
export declare type ColliderGroup = {
    node: number;
    colliders: Collider[];
};
export declare type MaterialProperty = {
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
        _Color: number[];
        _ShadeColor: number[];
        _MainTex: number[];
        _ShadeTexture: number[];
        _BumpMap: number[];
        _ReceiveShadowTexture: number[];
        _ShadingGradeTexture: number[];
        _SphereAdd: number[];
        _EmissionColor: number[];
        _EmissionMap: number[];
        _OutlineWidthTexture: number[];
        _OutlineColor: number[];
    };
    textureProperties: {
        _MainTex: number;
        _ShadeTexture: number;
        _BumpMap: number;
        _SphereAdd: number;
        _EmissionMap: number;
    };
    keywordMap: {
        _NORMALMAP: boolean;
    };
    tagMap: {
        RenderType: string;
    };
};
export declare type VRM_Extension = {
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
                humanBones: HumanBone[];
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
                lookAtHorizontalInner: LookAt;
                lookAtHorizontalOuter: LookAt;
                lookAtVerticalDown: LookAt;
                lookAtVerticalUP: LookAt;
            };
            blendShapeMaster: {
                blendShapeGroups: BlendShapeGroup[];
            };
            secondaryAnimation: {
                boneGroups: BoneGroup[];
                colliderGroups: ColliderGroup[];
            };
            materialProperties: MaterialProperty[];
        };
    };
};
export declare type VRM = VRM_Extension & RnM2;
