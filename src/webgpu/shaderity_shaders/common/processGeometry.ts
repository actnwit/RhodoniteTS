import { ShaderityObject } from "shaderity";
import processGeometry_wgsl from "./processGeometry.wgsl";

const processGeometry = processGeometry_wgsl as ShaderityObject;
export { processGeometry };
