import { Component } from '../../core/Component';
import { ProcessApproachEnum } from '../../definitions/ProcessApproach';
import { ProcessStageEnum } from '../../definitions/ProcessStage';
import { EntityRepository } from '../../core/EntityRepository';
import { CubeTexture } from '../../textures/CubeTexture';
import { RenderPass } from '../../renderer/RenderPass';
import { ComponentSID, CGAPIResourceHandle, Count, Index, ObjectUID, ComponentTID, EntityUID, PrimitiveUID } from '../../../types/CommonTypes';
import { IEntity } from '../../core/Entity';
import { ComponentToComponentMethods } from '../ComponentTypes';
export declare class MeshRendererComponent extends Component {
    private __diffuseCubeMap?;
    private __specularCubeMap?;
    diffuseCubeMapContribution: number;
    specularCubeMapContribution: number;
    rotationOfCubeMap: number;
    private static __cgApiRenderingStrategy?;
    static isDepthMaskTrueForTransparencies: boolean;
    static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle>;
    _updateCount: number;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    get diffuseCubeMap(): CubeTexture | undefined;
    get specularCubeMap(): CubeTexture | undefined;
    setIBLCubeMap(diffuseCubeTexture: CubeTexture, specularCubeTexture: CubeTexture): Promise<void> | undefined;
    static common_$load({ processApproach }: {
        processApproach: ProcessApproachEnum;
    }): void;
    $load(): void;
    static sort_$render(renderPass: RenderPass): ComponentSID[];
    private static __cullingWithViewFrustum;
    static common_$prerender(): void;
    static common_$render({ renderPass, processStage, renderPassTickCount, primitiveUids, }: {
        renderPass: RenderPass;
        processStage: ProcessStageEnum;
        renderPassTickCount: Count;
        primitiveUids: PrimitiveUID[];
    }): boolean;
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
