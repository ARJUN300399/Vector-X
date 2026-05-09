import * as THREE from 'three';

export const GAME_TITLE = 'D-Defence';

export const PLAYER_POSITION = new THREE.Vector3(0, 0, 3.55);
export const AIM_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.28);

export const WORLD_BOUNDS = {
  minX: -6.25,
  maxX: 6.25,
  minZ: -18,
  maxZ: 6.25,
};

export const SHOT_SOUND = {
  url: '/sounds/modi-ji-bhojyam.mp3',
  start: 9,
  duration: 1.4,
};
