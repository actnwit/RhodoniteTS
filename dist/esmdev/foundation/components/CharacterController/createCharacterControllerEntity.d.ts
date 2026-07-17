import type { Engine } from '../../system/Engine';
import type { IShapeEntityMethods } from '../Shape/IShapeEntity';
import type { ICharacterControllerEntityMethods } from './ICharacterControllerEntity';
export declare function createCharacterControllerEntity(engine: Engine): (import("../..").IEntity & import("..").ITransformEntityMethods & import("..").ISceneGraphEntityMethods & IShapeEntityMethods) & ICharacterControllerEntityMethods;
