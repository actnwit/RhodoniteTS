import type { ISceneGraphEntityMethods } from '../foundation/components/SceneGraph/ISceneGraphEntity';
import type { ITransformEntityMethods } from '../foundation/components/Transform/ITransformEntity';
import type { IEntity } from '../foundation/core/Entity';
import type { Engine } from '../foundation/system/Engine';
import { EffekseerComponent, type IEffekseerEntityMethods } from './EffekseerComponent';
export declare const Effekseer: Readonly<{
    EffekseerComponent: typeof EffekseerComponent;
    createEffekseerEntity: (engine: Engine) => IEntity & ITransformEntityMethods & ISceneGraphEntityMethods & IEffekseerEntityMethods;
}>;
