import ModuleManager from "../foundation/system/ModuleManager";
import getFoundationModule from "./getFoundationModule";

export default function() {
  return ModuleManager.getInstance().getModule('rhodonite-webgl')!.default;
}
