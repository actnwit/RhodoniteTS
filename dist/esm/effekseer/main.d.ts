import type { ISceneGraphEntityMethods } from '../foundation/components/SceneGraph/ISceneGraphEntity';
import type { ITransformEntityMethods } from '../foundation/components/Transform/ITransformEntity';
import type { IEntity } from '../foundation/core/Entity';
import type { Engine } from '../foundation/system/Engine';
import { EffekseerComponent, type IEffekseerEntityMethods } from './EffekseerComponent';
declare const createEffekseerEntity: (engine: Engine) => IEntity & ITransformEntityMethods & ISceneGraphEntityMethods & IEffekseerEntityMethods;
export declare const Effekseer: Readonly<{
    EffekseerComponent: typeof EffekseerComponent;
    createEffekseerEntity: typeof createEffekseerEntity;
}>;
export {};
