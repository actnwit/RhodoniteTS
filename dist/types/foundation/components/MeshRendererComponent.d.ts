import Component from '../core/Component';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import EntityRepository from '../core/EntityRepository';
import { VertexHandles } from '../../webgl/WebGLResourceRepository';
import CubeTexture from '../textures/CubeTexture';
import RenderPass from '../renderer/RenderPass';
export default class MeshRendererComponent extends Component {
    private __meshComponent?;
    __vertexHandles: Array<VertexHandles>;
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
    private static __tmp_indentityMatrix;
    private static __cameraComponent?;
    private static __firstTransparentIndex;
    private static __manualTransparentSids?;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static readonly componentTID: ComponentTID;
    static readonly firstTranparentIndex: number;
    $create({ processApproach }: {
        processApproach: ProcessApproachEnum;
    }): void;
    $load(): void;
    $prerender(): void;
    $render({ i, renderPass }: {
        i: Index;
        renderPass: RenderPass;
    }): void;
    static common_$load({ processApproach }: {
        processApproach: ProcessApproachEnum;
    }): void;
    static common_$prerender(): CGAPIResourceHandle;
    private static __isReady;
    private static __setupInstanceIDBuffer;
    static common_$render(): void;
    static sort_$render(renderPass?: RenderPass): ComponentSID[];
    private static sort_$render_inner;
    static manualTransparentSids: ComponentSID[];
}
