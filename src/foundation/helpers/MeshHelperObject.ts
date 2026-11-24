import {
  createAxis,
  createCapsule,
  createCone,
  createCube,
  createCubes,
  createCylinder,
  createGrid,
  createJoint,
  createLine,
  createPlane,
  createRing,
  createShape,
  createSphere,
  createSpheres,
} from './MeshHelper';

/**
 * Every mesh helper in one object, kept for compatibility.
 *
 * @deprecated For smaller bundles, import the function you need directly (for example `createPlane`). This object
 * references every shape helper, so importing it keeps every shape and its physics binding code.
 */
export const MeshHelper = Object.freeze({
  createPlane,
  createLine,
  createGrid,
  createCone,
  createCylinder,
  createCube,
  createCubes,
  createSphere,
  createSpheres,
  createCapsule,
  createJoint,
  createAxis,
  createRing,
  createShape,
});
