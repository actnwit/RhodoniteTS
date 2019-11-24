import Entity from "../core/Entity";
import EntityRepository from "../core/EntityRepository";
import { GltfLoadOption } from "../../types/glTF";
import SceneGraphComponent from "../components/SceneGraphComponent";
import { VRM } from "../../types/VRM";
/**
 * The VRM Importer class.
 * This class will be integrated into GltfImporter.
 */
export default class VRMImporter {
    private static __instance;
    private constructor();
    static getInstance(): VRMImporter;
    importJsonOnly(uri: string, options?: GltfLoadOption): Promise<VRM>;
    /**
     * Import VRM file.
     */
    import(uri: string, options?: GltfLoadOption): Promise<Entity[]>;
    private getOptions;
    readVRMHumanoidInfo(rootEntity: Entity, gltfModel: VRM): void;
    readSpringBone(rootEntity: Entity, gltfModel: VRM): void;
    addPhysicsComponentRecursively(entityRepository: EntityRepository, sg: SceneGraphComponent): void;
    private __createTextures;
    private __existOutlineMaterial;
    private __attachRnExtensionToGLTFModel;
    private __initializeMToonMaterialProperties;
    private __initializeForUndefinedProperty;
}
