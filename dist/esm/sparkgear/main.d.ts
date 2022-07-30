import { SparkGearComponent } from './SparkGearComponent';
declare const SparkGear: Readonly<{
    SparkGearComponent: typeof SparkGearComponent;
    createSparkGearEntity: () => import("..").IEntity & import("..").ITransformEntityMethods & import("..").ISceneGraphEntityMethods & import("./SparkGearComponent").ISparkGearEntityMethods;
}>;
export default SparkGear;
