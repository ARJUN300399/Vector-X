import * as THREE from 'three';
import { PLAYER_POSITION } from './constants';

export function makePlayer(scene) {
  const group = new THREE.Group();
  group.position.copy(PLAYER_POSITION);

  const skin = new THREE.MeshStandardMaterial({ color: '#b97855', roughness: 0.62 });
  const orange = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    emissive: '#442400',
    roughness: 0.5,
    metalness: 0.05,
  });
  const cream = new THREE.MeshStandardMaterial({ color: '#fff3dc', roughness: 0.7 });
  const white = new THREE.MeshStandardMaterial({ color: '#f7f2e8', roughness: 0.64 });
  const hair = new THREE.MeshStandardMaterial({ color: '#f2efe7', roughness: 0.55 });
  const brown = new THREE.MeshStandardMaterial({ color: '#4a2d25', roughness: 0.48 });
  const dark = new THREE.MeshStandardMaterial({
    color: '#141a20',
    emissive: '#031217',
    roughness: 0.35,
    metalness: 0.35,
  });
  const glow = new THREE.MeshStandardMaterial({
    color: '#eaffff',
    emissive: '#5eead4',
    emissiveIntensity: 1.8,
    roughness: 0.25,
  });

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.86, 0.06, 36),
    new THREE.MeshStandardMaterial({
      color: '#17212a',
      emissive: '#0b302c',
      roughness: 0.5,
      metalness: 0.35,
    }),
  );
  stand.scale.z = 0.62;
  stand.position.y = 0.03;
  group.add(stand);

  const pivot = new THREE.Group();
  pivot.position.y = 0.05;
  group.add(pivot);

  const leftLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.45, 5, 12), white);
  leftLeg.position.set(-0.13, 0.34, 0.03);
  pivot.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.45, 5, 12), white);
  rightLeg.position.set(0.13, 0.34, 0.03);
  pivot.add(rightLeg);

  [-0.13, 0.13].forEach((x) => {
    const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.2, 5, 12), brown);
    shoe.rotation.x = Math.PI / 2;
    shoe.position.set(x, 0.1, -0.08);
    pivot.add(shoe);
  });

  const kurta = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 0.65, 14), white);
  kurta.scale.z = 0.56;
  kurta.position.set(0, 0.73, 0.01);
  pivot.add(kurta);

  [-0.17, 0.17].forEach((x) => {
    const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 0.035), white);
    frontPanel.rotation.z = x < 0 ? 0.12 : -0.12;
    frontPanel.position.set(x, 0.72, -0.25);
    pivot.add(frontPanel);
  });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.45, 0.76, 16), orange);
  torso.scale.z = 0.54;
  torso.position.set(0, 1.22, -0.01);
  pivot.add(torso);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.12, 14), orange);
  collar.scale.z = 0.55;
  collar.position.set(0, 1.64, -0.01);
  pivot.add(collar);

  const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.58, 6, 12), cream);
  leftArm.rotation.z = -0.18;
  leftArm.position.set(-0.46, 1.16, -0.02);
  pivot.add(leftArm);

  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), skin);
  leftHand.position.set(-0.52, 0.82, -0.07);
  pivot.add(leftHand);

  const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.5, 6, 12), cream);
  rightArm.rotation.x = Math.PI / 2;
  rightArm.rotation.z = -0.12;
  rightArm.position.set(0.32, 1.25, -0.36);
  pivot.add(rightArm);

  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), skin);
  rightHand.position.set(0.31, 1.25, -0.66);
  pivot.add(rightHand);

  const blaster = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.42, 6, 14), dark);
  blaster.rotation.x = Math.PI / 2;
  blaster.position.set(0.31, 1.25, -0.86);
  pivot.add(blaster);

  const blasterCore = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), glow);
  blasterCore.position.set(0.31, 1.25, -1.09);
  pivot.add(blasterCore);

  const muzzleLight = new THREE.PointLight('#8efcff', 2.2, 4);
  muzzleLight.position.set(0, 0, 0);
  blasterCore.add(muzzleLight);

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0.31, 1.25, -1.18);
  pivot.add(muzzle);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.16, 12), skin);
  neck.position.set(0, 1.62, -0.01);
  pivot.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), skin);
  head.scale.set(0.92, 1.08, 0.86);
  head.position.set(0, 1.88, -0.02);
  pivot.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.265, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), hair);
  hairCap.scale.set(0.95, 0.58, 0.86);
  hairCap.position.set(0, 1.98, -0.01);
  pivot.add(hairCap);

  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10), hair);
  beard.scale.set(0.86, 0.72, 0.48);
  beard.position.set(0, 1.72, -0.21);
  pivot.add(beard);

  [-0.08, 0.08].forEach((x) => {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.007, 6, 18), dark);
    lens.position.set(x, 1.9, -0.235);
    pivot.add(lens);
  });

  const glassesBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.075, 8), dark);
  glassesBridge.rotation.z = Math.PI / 2;
  glassesBridge.position.set(0, 1.9, -0.235);
  pivot.add(glassesBridge);

  [-0.055, 0, 0.055].forEach((x, index) => {
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), dark);
    button.position.set(x * 0.2, 1.43 - index * 0.17, -0.25);
    pivot.add(button);
  });

  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.018), glow);
  pocket.rotation.z = -0.12;
  pocket.position.set(0.2, 1.36, -0.255);
  pivot.add(pocket);

  group.userData.pivot = pivot;
  group.userData.muzzle = muzzle;
  scene.add(group);
  return group;
}
