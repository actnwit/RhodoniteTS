import { ShaderityObject } from "shaderity";
import processGeometry_wgsl from "./processGeometry.wgsl";

const processGeometryWgsl = processGeometry_wgsl as ShaderityObject;
export { processGeometryWgsl };
