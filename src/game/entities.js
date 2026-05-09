import * as THREE from 'three';
import { WORLD_BOUNDS } from './constants';
import { randomBetween } from './math';

export function createDrone(materials, wave) {
  const roll = Math.random();
  const type = wave > 4 && roll > 0.78 ? 'heavy' : wave > 2 && roll > 0.58 ? 'fast' : 'normal';
  const group = new THREE.Group();
  const radius = type === 'heavy' ? 0.58 : type === 'fast' ? 0.34 : 0.42;
  const body = new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 1),
    type === 'heavy' ? materials.droneHeavy : type === 'fast' ? materials.droneFast : materials.drone,
  );
  group.add(body);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.15, 0.025, 8, 36),
    new THREE.MeshBasicMaterial({
      color: type === 'heavy' ? '#8ef6e4' : type === 'fast' ? '#ffd166' : '#ff8a9a',
      transparent: true,
      opacity: 0.7,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.userData.disposeMaterial = true;
  group.add(ring);

  group.position.set(randomBetween(-5.4, 5.4), radius + 0.68, WORLD_BOUNDS.minZ);
  group.userData = {
    body,
    ring,
    radius,
    hp: type === 'heavy' ? 3 : 1,
    points: type === 'heavy' ? 35 : type === 'fast' ? 20 : 10,
    speed: type === 'heavy' ? randomBetween(1.1, 1.45) : type === 'fast' ? randomBetween(2.5, 3.1) : randomBetween(1.55, 2.05),
    wobble: randomBetween(0, Math.PI * 2),
    type,
  };
  return group;
}

export function makeShot(scene, materials, origin, target) {
  const direction = target.clone().sub(origin);
  direction.y = 0;
  if (direction.lengthSq() === 0) direction.set(0, 0, -1);
  else direction.normalize();

  const shot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 14), materials.bullet);
  shot.position.copy(origin);
  shot.userData = {
    direction,
    life: 1.1,
    speed: 19,
  };
  scene.add(shot);
  return shot;
}

export function makeBurst(scene, materials, position, color = '#f8fbff') {
  const sparks = [];
  for (let i = 0; i < 14; i += 1) {
    const material = materials.spark.clone();
    material.color.set(color);
    const geometry = new THREE.SphereGeometry(0.045, 8, 8);
    const spark = new THREE.Mesh(geometry, material);
    spark.position.copy(position);
    spark.userData = {
      velocity: new THREE.Vector3(
        randomBetween(-2.6, 2.6),
        randomBetween(0.3, 2.4),
        randomBetween(-2.4, 2.4),
      ),
      life: randomBetween(0.28, 0.56),
      maxLife: 0.56,
    };
    scene.add(spark);
    sparks.push(spark);
  }
  return sparks;
}
