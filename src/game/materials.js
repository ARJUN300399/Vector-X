import * as THREE from 'three';

export function createMaterials() {
  return {
    drone: new THREE.MeshStandardMaterial({
      color: '#ff5a6e',
      emissive: '#651520',
      roughness: 0.42,
      metalness: 0.22,
    }),
    droneFast: new THREE.MeshStandardMaterial({
      color: '#ffd166',
      emissive: '#674500',
      roughness: 0.4,
      metalness: 0.18,
    }),
    droneHeavy: new THREE.MeshStandardMaterial({
      color: '#5eead4',
      emissive: '#0e4742',
      roughness: 0.38,
      metalness: 0.28,
    }),
    bullet: new THREE.MeshStandardMaterial({
      color: '#f8fbff',
      emissive: '#88f7ff',
      emissiveIntensity: 2.4,
      roughness: 0.2,
    }),
    spark: new THREE.MeshBasicMaterial({
      color: '#f8fbff',
      transparent: true,
      opacity: 0.9,
    }),
  };
}
