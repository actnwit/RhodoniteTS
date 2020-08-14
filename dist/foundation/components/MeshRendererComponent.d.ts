import Component from '../core/Component';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import { ProcessStageEnum } from '../definitions/ProcessStage';
import EntityRepository from '../core/EntityRepository';
import CubeTexture from '../textures/CubeTexture';
import RenderPass from '../renderer/RenderPass';
import { ComponentSID, CGAPIResourceHandle, Count, Index, ObjectUID, ComponentTID, EntityUID } from '../../commontypes/CommonTypes';
export default class MeshRendererComponent extends Component {
    private __meshComponent?;
    static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle>;
    private __sceneGraphComponent?;
    diffuseCubeMap?: CubeTexture;
    specularCubeMap?: CubeTexture;
    diffuseCubeMapContribution: number;
    specularCubeMapContribution: number;
    rotationOfCubeMap: number;
    private static __webglResourceRepository?;
    private static __componentRepository;
    private static __instanceIDBufferUid;
    private static __webglRenderingStrategy?;
    private static __instanceIdAccessor?;
    private static __tmp_identityMatrix;
    private static __cameraComponent?;
    private static __firstTransparentIndex;
    private static __lastTransparentIndex;
    private static __manualTransparentSids?;
    _readyForRendering: boolean;
    static isViewFrustumCullingEnabled: boolean;
    static isDepthMaskTrueForTransparencies: boolean;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static get componentTID(): ComponentTID;
    static get firstTransparentIndex(): number;
    static get lastTransparentIndex(): number;
    private static __isReady;
    private static __setupInstanceIDBuffer;
    static set manualTransparentSids(sids: ComponentSID[]);
    static set manualTransparentEntityNames(names: string[]);
    $create(): void;
    static common_$load({ processApproach }: {
        processApproach: ProcessApproachEnum;
    }): void;
    $load(): void;
    static common_$prerender(): CGAPIResourceHandle;
    $prerender(): void;
    static sort_$render(renderPass: RenderPass): ComponentSID[];
    private static sort_$render_inner;
    static common_$render({ renderPass, processStage, renderPassTickCount }: {
        renderPass: RenderPass;
        processStage: ProcessStageEnum;
        renderPassTickCount: Count;
    }): void;
    $render({ i, renderPass, renderPassTickCount }: {
        i: Index;
        renderPass: RenderPass;
        renderPassTickCount: Count;
    }): void;
}
