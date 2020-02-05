import Component from '../core/Component';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import { ProcessStageEnum } from '../definitions/ProcessStage';
import EntityRepository from '../core/EntityRepository';
import CubeTexture from '../textures/CubeTexture';
import RenderPass from '../renderer/RenderPass';
import { ComponentSID, CGAPIResourceHandle, Count, Index, ObjectUID, ComponentTID, EntityUID } from '../../types/CommonTypes';
export default class MeshRendererComponent extends Component {
    private __meshComponent?;
    static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle>;
    private __webglRenderingStrategy?;
    private __sceneGraphComponent?;
    private __webglModule?;
    private static __staticWebglModule?;
    diffuseCubeMap?: CubeTexture;
    specularCubeMap?: CubeTexture;
    diffuseCubeMapContribution: number;
    specularCubeMapContribution: number;
    rotationOfCubeMap: number;
    private static __webglResourceRepository?;
    private static __componentRepository;
    private static __instanceIDBufferUid;
    private static __webGLStrategy?;
    private static __instanceIdAccessor?;
    private static __tmp_identityMatrix;
    private static __cameraComponent?;
    private static __firstTransparentIndex;
    private static __lastTransparentIndex;
    private static __manualTransparentSids?;
    _readyForRendering: boolean;
    static isViewFrustumCullingEnabled: boolean;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static get componentTID(): ComponentTID;
    static get firstTransparentIndex(): number;
    static get lastTransparentIndex(): number;
    $create({ processApproach }: {
        processApproach: ProcessApproachEnum;
    }): void;
    $load(): void;
    $prerender(): void;
    $render({ i, renderPass, renderPassTickCount }: {
        i: Index;
        renderPass: RenderPass;
        renderPassTickCount: Count;
    }): void;
    static common_$load({ processApproach }: {
        processApproach: ProcessApproachEnum;
    }): void;
    static common_$prerender(): CGAPIResourceHandle;
    private static __isReady;
    private static __setupInstanceIDBuffer;
    static common_$render({ renderPass, processStage, renderPassTickCount }: {
        renderPass: RenderPass;
        processStage: ProcessStageEnum;
        renderPassTickCount: Count;
    }): void;
    static sort_$render(renderPass: RenderPass): ComponentSID[];
    private static sort_$render_inner;
    static set manualTransparentSids(sids: ComponentSID[]);
    static set manualTransparentEntityNames(names: string[]);
}
