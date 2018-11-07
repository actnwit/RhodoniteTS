//import GLBoost from '../../globals';

export default class MathUtil {

  constructor() {

  }

  static radianToDegree(rad: number) {
    return rad * 180 / Math.PI;
  }

  static degreeToRadian(deg: number) {
    return deg * Math.PI / 180;
  }

}

//GLBoost["MathUtil"] = MathUtil;
