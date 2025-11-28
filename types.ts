export type Vector3 = [number, number, number];

export enum ShapeType {
  SPHERE = 'Sphere',
  CUBE = 'Cube',
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  BUDDHA = 'Buddha',
  DNA = 'DNA Helix',
  FIREWORK = 'Firework'
}

export interface ParticleConfig {
  color: string;
  shape: ShapeType;
  pointCount: number;
}

export interface HandData {
  distance: number; // 0 to 1 normalized
  isPresent: boolean;
  mode: 'one-hand' | 'two-hands' | 'none';
}

export interface GeneratedShapeData {
  points: number[]; // Flat array [x1, y1, z1, x2, y2, z2...]
  shapeName: string;
}