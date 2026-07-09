import type { ComponentSID, ComponentTID, EntityUID } from '../../../types/CommonTypes';
import type { NodeJSON } from '../../../types/NodeJSON';
import { Component } from '../../core/Component';
import type { IEntity } from '../../core/Entity';
import { type EntityRepository } from '../../core/EntityRepository';
import { type SdfShapeTypeEnum } from '../../definitions/SdfShapeType';
import type { Engine } from '../../system/Engine';
import type { ComponentToComponentMethods } from '../ComponentTypes';
/**
 * RaymarchingComponent is a component that manages raymarching for an entity.
 * This component handles the raymarching of the entity.
 */
export declare class RaymarchingComponent extends Component {
    private __rrnJson;
    private __sdSphereNodeJson;
    private __sdBoxNodeJson;
    private __rrnJsonTemplate;
    private __sdfShapeType;
    constructor(engine: Engine, entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    /**
     * Gets the component type identifier for RaymarchingComponent.
     * @returns The component type ID for RaymarchingComponent
     */
    static get componentTID(): 16;
    /**
     * Gets the component type identifier for this RaymarchingComponent instance.
     * @returns The component type ID for RaymarchingComponent
     */
    get componentTID(): ComponentTID;
    static common_$render(): boolean;
    /**
     * Sets the RRN JSON data for the RaymarchingComponent.
     * @param rrnJson - The RRN JSON data
     */
    set rrnJson(rrnJson: NodeJSON);
    /**
     * Gets the RRN JSON data for the RaymarchingComponent.
     * @returns The RRN JSON data
     */
    get rrnJson(): NodeJSON;
    /**
     * Gets the SDF shape type for the RaymarchingComponent.
     * @returns The SDF shape type
     */
    get sdfShapeType(): SdfShapeTypeEnum;
    /**
     * Sets the SDF shape type for the RaymarchingComponent.
     * @param sdfShapeType - The SDF shape type
     */
    set sdfShapeType(sdfShapeType: SdfShapeTypeEnum);
    /**
     * Creates a shallow copy of this RaymarchingComponent from another RaymarchingComponent.
     * @param component - The source component to copy from
     * @protected
     */
    _shallowCopyFrom(component: Component): void;
    /**
     * Destroys this RaymarchingComponent and cleans up resources.
     * @protected
     */
    _destroy(): void;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
