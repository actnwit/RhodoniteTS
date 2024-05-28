import { SceneGraphComponent } from '../../components/SceneGraph/SceneGraphComponent';
import { Vector3 } from '../../math/Vector3';
export declare class SphereCollider {
    position: Vector3;
    radius: number;
    baseSceneGraph?: SceneGraphComponent;
    private static __tmp_vec3_0;
    private static __tmp_vec3_1;
    private static __tmp_vec3_2;
    collision(bonePosition: Vector3, boneRadius: number): {
        direction: import("../..").IMutableVector3;
        distance: number;
    };
}
