import type { Gltf2Ex } from '../../types/glTF2ForOutput';
import type { ISceneGraphEntity } from '../helpers/EntityHelper';
/**
 * Creates and adds Effekseer extension data to the glTF 2.0 export JSON.
 * This function processes all entities with Effekseer components and exports their
 * effect data, including buffer views for effect files and animation timelines.
 *
 * @param json - The glTF 2.0 export JSON object to modify
 * @param entities - Array of scene graph entities to process for Effekseer components
 */
export declare function createEffekseer(json: Gltf2Ex, entities: ISceneGraphEntity[]): void;
