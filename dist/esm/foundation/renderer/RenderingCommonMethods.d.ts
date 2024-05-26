import { Primitive } from '../geometry';
import { Mesh } from '../geometry/Mesh';
import { Material } from '../materials/core/Material';
export declare function isSkipDrawing(material: Material, primitive: Primitive): boolean;
export declare function updateVBOAndVAO(mesh: Mesh): void;
