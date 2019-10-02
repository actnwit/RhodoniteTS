import SphereCollider from "./SphereCollider";
import SceneGraphComponent from "../components/SceneGraphComponent";
export default class VRMColliderGroup {
    colliders: SphereCollider[];
    baseSceneGraph?: SceneGraphComponent;
}
