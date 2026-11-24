import { createAxis, createCapsule, createCone, createCube, createCubes, createCylinder, createGrid, createJoint, createLine, createPlane, createRing, createShape, createSphere, createSpheres } from './MeshHelper';
/**
 * Every mesh helper in one object, kept for compatibility.
 *
 * @deprecated For smaller bundles, import the function you need directly (for example `createPlane`). This object
 * references every shape helper, so importing it keeps every shape and its physics binding code.
 */
export declare const MeshHelper: Readonly<{
    createPlane: typeof createPlane;
    createLine: typeof createLine;
    createGrid: typeof createGrid;
    createCone: typeof createCone;
    createCylinder: typeof createCylinder;
    createCube: typeof createCube;
    createCubes: typeof createCubes;
    createSphere: typeof createSphere;
    createSpheres: typeof createSpheres;
    createCapsule: typeof createCapsule;
    createJoint: typeof createJoint;
    createAxis: typeof createAxis;
    createRing: typeof createRing;
    createShape: typeof createShape;
}>;
