import SparkGearComponent from "./SparkGearComponent";
declare const SparkGear: Readonly<{
    SparkGearComponent: typeof SparkGearComponent;
    createSparkGearEntity: () => import("../foundation/core/Entity").default;
}>;
export default SparkGear;
