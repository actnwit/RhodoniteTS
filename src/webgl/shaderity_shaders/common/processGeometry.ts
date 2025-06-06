import type { ShaderityObject } from 'shaderity';
import processGeometry_glsl from './processGeometry.glsl';

const processGeometryGlsl = processGeometry_glsl as ShaderityObject;
export { processGeometryGlsl };
