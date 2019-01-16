import Component from '../core/Component';
import WebGLStrategy from '../../webgl/WebGLStrategy';
import { ProcessApproachEnum } from '../definitions/ProcessApproach';
import EntityRepository from '../core/EntityRepository';
import { VertexHandles } from '../../../dist/webgl/WebGLResourceRepository';
export default class MeshRendererComponent extends Component {
    private __meshComponent?;
    __vertexHandles: Array<VertexHandles>;
    static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle>;
    private __webglRenderingStrategy?;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository);
    static readonly componentTID: ComponentTID;
    private __isLoaded;
    $create({ strategy }: {
        strategy: WebGLStrategy;
    }): void;
    $load(): void;
    $prerender({ processApproech, instanceIDBufferUid }: {
        processApproech: ProcessApproachEnum;
        instanceIDBufferUid: WebGLResourceHandle;
    }): void;
    $render(): void;
}
