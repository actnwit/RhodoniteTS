import EffekseerComponent from "./EffekseerComponent";
declare const Effekseer: Readonly<{
    EffekseerComponent: typeof EffekseerComponent;
    createEffekseerEntity: () => import("../foundation/core/Entity").default;
}>;
export default Effekseer;
