import Component from "../core/Component";
import EntityRepository from "../core/EntityRepository";
import { AnimationInterpolationEnum } from "../definitions/AnimationInterpolation";
import MutableVector3 from "../math/MutableVector3";
import MutableQuaternion from "../math/MutableQuaternion";
import { ComponentTID, ComponentSID, EntityUID, Index } from "../../commontypes/CommonTypes";
declare type AnimationLine = {
    input: number[];
    output: any[];
    outputAttributeName: string;
    interpolationMethod: AnimationInterpolationEnum;
    targetEntityUid?: EntityUID;
};
export default class AnimationComponent extends Component {
    private __animationLine;
    private __backupDefaultValues;
    static globalTime: number;
    private static __isAnimating;
    private __isAnimating;
    private __transformComponent?;
    private __meshComponent?;
    private static __startInputValueOfAllComponent;
    private static __endInputValueOfAllComponent;
    private static __startInputValueDirty;
    private static __endInputValueDirty;
    private static __componentRepository;
    private static __returnVector3;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __tmpVector3_3;
    private static __returnQuaternion;
    private static __tmpQuaternion_0;
    private static __tmpQuaternion_1;
    private static __tmpQuaternion_2;
    private static __tmpQuaternion_3;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository);
    static get componentTID(): ComponentTID;
    setAnimation(attributeName: string, animationInputArray: number[], animationOutputArray: any[], interpolation: AnimationInterpolationEnum): void;
    static lerp(start: any, end: any, ratio: number, animationAttributeIndex: Index): any[] | import("../math/IQuaternion").IMutableQuaternion | MutableVector3;
    /**
     * Compute cubic spline interpolation.
     * @param p_0 starting point
     * @param p_1 ending point
     * @param m_0 inTangent
     * @param m_1 outTangent
     * @param t ratio
     * @param animationAttributeIndex index of attribution
     */
    static cubicSpline(p_0: any, p_1: any, m_0: any, m_1: any, t: number, animationAttributeIndex: Index): number[] | MutableVector3 | MutableQuaternion;
    private static __isClamped;
    static binarySearch(inputArray: number[], currentTime: number): number;
    static interpolationSearch(inputArray: number[], currentTime: number): number;
    static bruteForceSearch(inputArray: number[], currentTime: number): number;
    static interpolate(line: AnimationLine, currentTime: number, animationAttributeIndex: Index): any;
    private static __prepareVariablesForCubicSpline;
    getStartInputValueOfAnimation(): number;
    getEndInputValueOfAnimation(): number;
    static get startInputValue(): number;
    static get endInputValue(): number;
    static get isAnimating(): boolean;
    static set isAnimating(flg: boolean);
    get isAnimating(): boolean;
    set isAnimating(flg: boolean);
    private restoreDefaultValues;
    private backupDefaultValues;
    $create(): void;
    $logic(): void;
}
export {};
