import EntityRepository from "../core/EntityRepository";
import TransformComponent from "../components/TransformComponent";
import SceneGraphComponent from "../components/SceneGraphComponent";
import MeshComponent from "../components/MeshComponent";
import MeshRendererComponent from "../components/MeshRendererComponent";
import CameraComponent from "../components/CameraComponent";
import CameraControllerComponent from "../components/CameraControllerComponent";
import Entity from "../core/Entity";

function createGroupEntity() {
  return EntityRepository.getInstance().createEntity([TransformComponent, SceneGraphComponent]);
}

function createMeshEntity() {
  return EntityRepository.getInstance().createEntity([TransformComponent, SceneGraphComponent, MeshComponent, MeshRendererComponent]);
}

function createCameraEntity() {
  return EntityRepository.getInstance().createEntity([TransformComponent, SceneGraphComponent, CameraComponent]);
}

function createCameraWithControllerEntity() {
  return EntityRepository.getInstance().createEntity([TransformComponent, SceneGraphComponent, CameraComponent, CameraControllerComponent]);
}

function setVisibilityRecursively(entity: Entity, flag: boolean) {
  const sg = entity.getSceneGraph();

  const func = (entity: Entity, flag: boolean)=>{
    const mr = entity.getComponent(MeshRendererComponent) as MeshRendererComponent;
    if (mr) {
      mr.isVisible = flag;
    }
  }
  for (let child of sg!.children) {
    child.applyFunctionRecursively((child: SceneGraphComponent, args: any[])=>{
      func(child.entity, args[0]);
    }, [flag]);
  }
}
export default Object.freeze({createGroupEntity, createMeshEntity, createCameraEntity, createCameraWithControllerEntity, setVisibilityRecursively});

