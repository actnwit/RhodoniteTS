export type Vrm1SpringBone_Collider = {
  node: number;
  shape: {
    sphere?: {
      offset: [number, number, number];
      radius: number;
    };
    capsule?: {
      offset: [number, number, number];
      radius: number;
      tail: [number, number, number];
    };
  };
};

export type Vrm1SpringBone_ColliderGroup = {
  name: string;
  colliders: number[];
};

export type Vrm1SpringBone_Spring = {
  colliderGroups: number[];
  joints: Vrm1SpringBone_Joint[];
  name: string;
  center: number;
};

export type Vrm1SpringBone_Joint = {
  node: number;
  hitRadius: number;
  stiffness: number;
  gravityPower: number;
  gravityDir: [number, number, number];
  dragForce: number;
};

export interface VRMC_springBone {
  specVersions: string;
  colliderGroups: Vrm1SpringBone_ColliderGroup[];
  colliders: Vrm1SpringBone_Collider[];
  springs: Vrm1SpringBone_Spring[];
}
