import { GltfLoadOption } from "../../types/glTF";
import Entity from "../core/Entity";
import EntityRepository from "../core/EntityRepository";
import SceneGraphComponent from "../components/SceneGraphComponent";
declare type HumanBone = {
    bone: string;
    node: number;
    useDefaultValues: boolean;
};
declare type LookAt = {
    curve: number[];
    xRange: number;
    yRange: number;
};
declare type BlendShapeBind = {
    mesh: number;
    index: number;
    weight: number;
};
declare type BlendShapeGroup = {
    name: string;
    presetName: string;
    binds: BlendShapeBind[];
    materialValues: [];
};
declare type BoneGroup = {
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
declare type Collider = {
    offset: {
        x: number;
        y: number;
        z: number;
    };
    radius: number;
};
declare type ColliderGroup = {
    node: number;
    colliders: Collider[];
};
declare type MaterialProperty = {
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
export declare type VRM = {
    asset: {
        extras?: {
            rnLoaderOptions?: GltfLoadOption;
            rnEntities?: Entity[];
            basePath?: string;
            version?: string;
            fileType?: string;
        };
    };
    buffers: any[];
    scenes: any[];
    meshes: any[];
    nodes: any[];
    skins: any[];
    materials: any[];
    cameras: any[];
    shaders?: any[];
    images: any[];
    animations: Array<{
        channels: any[];
        samplers: any[];
    }>;
    textures: any[];
    samplers: any[];
    accessors: any[];
    bufferViews: any[];
    buffer: any[];
    extensionsUsed?: any;
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
                violentUssageName: string;
                sexualUssageName: string;
                commercialUssageName: string;
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
export default class VRMImporter {
    private static __instance;
    private constructor();
    /**
     * Import VRM file.
     */
    import(uri: string, options?: GltfLoadOption): Promise<Entity>;
    readSpringBone(rootEntity: Entity, gltfModel: VRM): void;
    addPhysicsComponentRecursively(entityRepository: EntityRepository, sg: SceneGraphComponent): void;
    static getInstance(): VRMImporter;
}
export {};
