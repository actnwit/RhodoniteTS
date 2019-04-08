import Matrix33 from "./Matrix33";
import Vector3 from "./Vector3";
import MutableMatrix33 from "./MutableMatrix33";

//import GLBoost from '../../globals';


function radianToDegree(rad: number) {
  return rad * 180 / Math.PI;
}

function degreeToRadian(deg: number) {
  return deg * Math.PI / 180;
}

// https://gamedev.stackexchange.com/questions/17326/conversion-of-a-number-from-single-precision-floating-point-representation-to-a/17410#17410
const toHalfFloat = (function() {

  var floatView = new Float32Array(1);
  var int32View = new Int32Array(floatView.buffer);

  /* This method is faster than the OpenEXR implementation (very often
    * used, eg. in Ogre), with the additional benefit of rounding, inspired
    * by James Tursa?s half-precision code. */
  return function toHalf(val: number) {

    floatView[0] = val;
    var x = int32View[0];

    var bits = (x >> 16) & 0x8000; /* Get the sign */
    var m = (x >> 12) & 0x07ff; /* Keep one extra bit for rounding */
    var e = (x >> 23) & 0xff; /* Using int is faster here */

    /* If zero, or denormal, or exponent underflows too much for a denormal
      * half, return signed zero. */
    if (e < 103) {
      return bits;
    }

    /* If NaN, return NaN. If Inf or exponent overflow, return Inf. */
    if (e > 142) {
      bits |= 0x7c00;
      /* If exponent was 0xff and one mantissa bit was set, it means NaN,
            * not Inf, so make sure we set one mantissa bit too. */
      bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
      return bits;
    }

    /* If exponent underflows but not too much, return a denormal */
    if (e < 113) {
      m |= 0x0800;
      /* Extra rounding may overflow and set mantissa to 0 and exponent
        * to 1, which is OK. */
      bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
      return bits;
    }

    bits |= ((e - 112) << 10) | (m >> 1);
    /* Extra rounding. An overflow will set mantissa to 0 and increment
      * the exponent, which is OK. */
    bits += m & 1;
    return bits;
  };

}());

/**
 * check whether or not this texture size is power of two.
 *
 * @param x texture size.
 * @returns check whether or not the size x is power of two.
 */
function isPowerOfTwo(x: number): boolean {
  return (x & (x - 1)) == 0;
}

function isPowerOfTwoTexture(width: Size, height: Size) {
  return isPowerOfTwo(width) && isPowerOfTwo(height);
}

  // values range must be [-1, 1]
function packNormalizedVec4ToVec2(x: number, y: number, z: number, w: number, criteria: number) {
  let v0 = 0.0;
  let v1 = 0.0;

  x = (x + 1)/2.0;
  y = (y + 1)/2.0;
  z = (z + 1)/2.0;
  w = (w + 1)/2.0;

  let ir = Math.floor(x*(criteria-1.0));
  let ig = Math.floor(y*(criteria-1.0));
  let irg = ir*criteria + ig;
  v0 = irg / criteria;

  let ib =  Math.floor(z*(criteria-1.0));
  let ia =  Math.floor(w*(criteria-1.0));
  let iba = ib*criteria + ia;
  v1 =iba / criteria;

  return [v0, v1];
}

function erf(x: number)
{
	// Save the sign of x
	let sign = 1;
	if (x < 0)
		sign = -1;
	x = Math.abs(x);

	// A&S formula 7.1.26
	const t: number = 1 / (1 + 0.3275911 * x);
	const y: number = 1 - (((((1.061405429 * t + -1.453152027) * t) + 1.421413741)
		* t + -0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);

	return sign * y;
}

function invErf(x: number)
{
	let w: number, p: number;
	w = -Math.log((1.0 - x) * (1.0 + x));
	if (w < 5.000000)
	{
		w = w - 2.500000;
		p = 2.81022636e-08;
		p = 3.43273939e-07 + p * w;
		p = -3.5233877e-06 + p * w;
		p = -4.39150654e-06 + p * w;
		p = 0.00021858087 + p * w;
		p = -0.00125372503 + p * w;
		p = -0.00417768164 + p * w;
		p = 0.246640727 + p * w;
		p = 1.50140941 + p * w;
	}
	else
	{
		w = Math.sqrt(w) - 3;
		p = -0.000200214257;
		p = 0.000100950558 + p * w;
		p = 0.00134934322 + p * w;
		p = -0.00367342844 + p * w;
		p = 0.00573950773 + p * w;
		p = -0.0076224613 + p * w;
		p = 0.00943887047 + p * w;
		p = 1.00167406 + p * w;
		p = 2.83297682 + p * w;
	}
	return p * x;
}

function gaussianCdf(x: number, mu: number, sigma: number)
{
	const U: number = 0.5 * (1 + erf((x-mu)/(sigma * Math.sqrt(2.0))));
	return U;
}

function invGaussianCdf(U: number, mu: number, sigma: number)
{
	const x: number = sigma * Math.sqrt(2.0) * invErf(2.0 * U - 1) + mu;
	return x;
}

export const MathUtil = Object.freeze({radianToDegree, degreeToRadian, toHalfFloat, isPowerOfTwo, isPowerOfTwoTexture, packNormalizedVec4ToVec2, erf, invErf, gaussianCdf, invGaussianCdf});
