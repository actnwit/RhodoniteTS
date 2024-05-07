import { Component } from '../../core/Component';
import { ProcessApproachEnum } from '../../definitions/ProcessApproach';
import { ProcessStageEnum } from '../../definitions/ProcessStage';
import { EntityRepository } from '../../core/EntityRepository';
import { CubeTexture } from '../../textures/CubeTexture';
import { RenderPass } from '../../renderer/RenderPass';
import { ComponentSID, CGAPIResourceHandle, Count, Index, ObjectUID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
export declare class MeshRendererComponent extends Component {
    private __diffuseCubeMap?;
    private __specularCubeMap?;
    diffuseCubeMapContribution: number;
    specularCubeMapContribution: number;
    rotationOfCubeMap: number;
    _readyForRendering: boolean;
    private __meshComponent?;
    private static __webglRenderingStrategy?;
    static _lastOpaqueIndex: number;
    static _lastTransparentIndex: number;
    static _firstTransparentSortKey: number;
    static _lastTransparentSortKey: number;
    static isViewFrustumCullingEnabled: boolean;
    static isDepthMaskTrueForTransparencies: boolean;
    static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle>;
    _updateCount: number;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    get diffuseCubeMap(): CubeTexture | undefined;
    get specularCubeMap(): CubeTexture | undefined;
    setIBLCubeMap(diffuseCubeTexture: CubeTexture, specularCubeTexture: CubeTexture): Promise<void>;
    $create(): void;
    static common_$load({ processApproach }: {
        processApproach: ProcessApproachEnum;
    }): void;
    $load(): void;
    static common_$prerender(): void;
    static sort_$render(renderPass: RenderPass): ComponentSID[];
    private static sort_$render_inner;
    private static __cullingWithViewFrustum;
    static common_$render({ renderPass, processStage, renderPassTickCount, }: {
        renderPass: RenderPass;
        processStage: ProcessStageEnum;
        renderPassTickCount: Count;
    }): void;
    $render({ i, renderPass, renderPassTickCount, }: {
        i: Index;
        renderPass: RenderPass;
        renderPassTickCount: Count;
    }): void;
    _shallowCopyFrom(component_: Component): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
