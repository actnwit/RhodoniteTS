import EntityRepository from './EntityRepository';
import TransformComponent from '../components/TransformComponent';
import SceneGraphComponent from '../components/SceneGraphComponent';
import Component from './Component';
export default class Entity {
    private __entity_uid;
    static readonly invalidEntityUID = -1;
    private __isAlive;
    private static __instance;
    private __uniqueName;
    private static __uniqueNames;
    private __entityRepository;
    private __transformComponent?;
    private __sceneGraphComponent?;
    constructor(entityUID: EntityUID, isAlive: Boolean, entityComponent: EntityRepository);
    readonly entityUID: number;
    getComponent(componentTid: ComponentTID): Component | null;
    getTransform(): TransformComponent;
    getSceneGraph(): SceneGraphComponent;
    tryToSetUniqueName(name: string, toAddNameIfConflict: boolean): boolean;
    readonly uniqueName: string;
}
