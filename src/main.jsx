import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import './styles.css';

const PLAYER_POSITION = new THREE.Vector3(0, 0, 3.55);
const AIM_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.28);
const WORLD_BOUNDS = {
  minX: -6.25,
  maxX: 6.25,
  minZ: -18,
  maxZ: 6.25,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createMaterials() {
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

function makeHexTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#10151c';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(72, 211, 190, 0.16)';
  ctx.lineWidth = 2;

  const radius = 19;
  const height = Math.sqrt(3) * radius;
  for (let row = -1; row < 9; row += 1) {
    for (let col = -1; col < 9; col += 1) {
      const x = col * radius * 1.5 + (row % 2 ? radius * 0.75 : 0);
      const y = row * height * 0.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const angle = Math.PI / 6 + (Math.PI / 3) * i;
        const px = x + radius * Math.cos(angle);
        const py = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 18);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildArena(scene) {
  const hexTexture = makeHexTexture();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 31, 1, 1),
    new THREE.MeshStandardMaterial({
      color: '#151a21',
      map: hexTexture,
      roughness: 0.78,
      metalness: 0.12,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -5.7;
  scene.add(floor);

  const railMaterial = new THREE.MeshStandardMaterial({
    color: '#1e2b33',
    emissive: '#123c37',
    roughness: 0.48,
    metalness: 0.35,
  });
  const lineMaterial = new THREE.MeshBasicMaterial({
    color: '#34d399',
    transparent: true,
    opacity: 0.45,
  });

  [-6.6, 6.6].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 30), railMaterial);
    rail.position.set(x, 0.2, -5.7);
    scene.add(rail);
  });

  [-3.5, 0, 3.5].forEach((x) => {
    const lane = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 28), lineMaterial);
    lane.position.set(x, 0.035, -6.7);
    scene.add(lane);
  });

  const backGate = new THREE.Mesh(
    new THREE.TorusGeometry(4.2, 0.035, 8, 96),
    new THREE.MeshBasicMaterial({ color: '#fbbf24', transparent: true, opacity: 0.55 }),
  );
  backGate.rotation.x = Math.PI / 2;
  backGate.position.set(0, 0.05, -17.2);
  scene.add(backGate);
}

function makePlayer(scene) {
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

function createDrone(materials, wave) {
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

function makeShot(scene, materials, origin, target) {
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

function makeBurst(scene, materials, position, color = '#f8fbff') {
  const sparks = [];
  const geometry = new THREE.SphereGeometry(0.045, 8, 8);
  for (let i = 0; i < 14; i += 1) {
    const material = materials.spark.clone();
    material.color.set(color);
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

function initialStats() {
  return {
    score: 0,
    wave: 1,
    shields: 5,
    charge: 100,
    state: 'ready',
    streak: 0,
  };
}

function useShooterGame(canvasRef, setStats) {
  const gameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor('#0d1117');
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#0d1117', 0.042);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    camera.position.set(0, 8.4, 10.4);
    camera.lookAt(0, 0.2, -5.6);

    const ambient = new THREE.HemisphereLight('#bff4ff', '#192027', 1.3);
    scene.add(ambient);

    const mainLight = new THREE.DirectionalLight('#ffffff', 2.2);
    mainLight.position.set(-3, 7, 6);
    scene.add(mainLight);

    const backLight = new THREE.PointLight('#ff5a6e', 16, 28);
    backLight.position.set(0, 2, -15);
    scene.add(backLight);

    buildArena(scene);
    const player = makePlayer(scene);
    const materials = createMaterials();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(0, 0);
    const aimPoint = new THREE.Vector3(0, 0.28, -6);
    const tmpPoint = new THREE.Vector3();
    const shotOrigin = new THREE.Vector3();
    const clock = new THREE.Clock();

    const game = {
      renderer,
      scene,
      camera,
      player,
      materials,
      raycaster,
      pointer,
      aimPoint,
      drones: [],
      shots: [],
      sparks: [],
      spawnTimer: 0.9,
      shootCooldown: 0,
      stats: initialStats(),
      lastUiSync: 0,
      disposed: false,
      animationId: 0,
    };

    gameRef.current = game;

    const setSize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const updateAim = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      pointer.x = (localX / rect.width) * 2 - 1;
      pointer.y = -(localY / rect.height) * 2 + 1;
      canvas.parentElement?.style.setProperty('--aim-x', `${localX}px`);
      canvas.parentElement?.style.setProperty('--aim-y', `${localY}px`);
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(AIM_PLANE, tmpPoint);
      aimPoint.set(
        clamp(tmpPoint.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
        0.28,
        clamp(tmpPoint.z, WORLD_BOUNDS.minZ + 1, PLAYER_POSITION.z - 1.35),
      );
    };

    const fire = () => {
      if (game.stats.state !== 'playing' || game.shootCooldown > 0 || game.stats.charge < 10) return;
      player.userData.muzzle.getWorldPosition(shotOrigin);
      game.shots.push(makeShot(scene, materials, shotOrigin, aimPoint));
      game.shootCooldown = 0.12;
      game.stats.charge = Math.max(0, game.stats.charge - 10);
    };

    const handleMove = (event) => updateAim(event.clientX, event.clientY);
    const handleDown = (event) => {
      updateAim(event.clientX, event.clientY);
      fire();
    };

    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerdown', handleDown);
    window.addEventListener('resize', setSize);
    setSize();

    const syncStats = (force = false) => {
      if (!force && performance.now() - game.lastUiSync < 80) return;
      game.lastUiSync = performance.now();
      setStats({ ...game.stats });
    };

    const removeDrone = (drone) => {
      scene.remove(drone);
      drone.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
      });
    };

    const removeShot = (shot) => {
      scene.remove(shot);
      shot.geometry.dispose();
    };

    const updateTurret = () => {
      const pivot = player.userData.pivot;
      const dx = aimPoint.x - PLAYER_POSITION.x;
      const dz = aimPoint.z - PLAYER_POSITION.z;
      pivot.rotation.y = Math.atan2(-dx, -dz);
    };

    const spawnDrone = () => {
      const drone = createDrone(materials, game.stats.wave);
      scene.add(drone);
      game.drones.push(drone);
    };

    const reset = () => {
      game.drones.forEach(removeDrone);
      game.shots.forEach(removeShot);
      game.sparks.forEach((spark) => scene.remove(spark));
      game.drones = [];
      game.shots = [];
      game.sparks = [];
      game.spawnTimer = 0.35;
      game.shootCooldown = 0;
      game.stats = { ...initialStats(), state: 'playing' };
      syncStats(true);
    };

    const update = () => {
      const dt = Math.min(clock.getDelta(), 0.033);

      if (game.stats.state === 'playing') {
        game.shootCooldown = Math.max(0, game.shootCooldown - dt);
        game.stats.charge = Math.min(100, game.stats.charge + dt * 30);
        game.stats.wave = Math.max(1, Math.floor(game.stats.score / 180) + 1);

        game.spawnTimer -= dt;
        if (game.spawnTimer <= 0) {
          spawnDrone();
          const wavePressure = Math.min(0.7, game.stats.wave * 0.055);
          game.spawnTimer = randomBetween(0.72, 1.12) - wavePressure;
        }

        for (let i = game.drones.length - 1; i >= 0; i -= 1) {
          const drone = game.drones[i];
          const data = drone.userData;
          drone.position.z += data.speed * dt;
          drone.position.x += Math.sin(performance.now() * 0.0018 + data.wobble) * dt * (data.type === 'heavy' ? 0.45 : 0.95);
          drone.rotation.x += dt * 1.4;
          drone.rotation.y += dt * 2.2;
          data.ring.rotation.z -= dt * 2.8;

          if (drone.position.z > PLAYER_POSITION.z - 0.35) {
            game.drones.splice(i, 1);
            makeBurst(scene, materials, drone.position, '#ff5a6e').forEach((spark) => game.sparks.push(spark));
            removeDrone(drone);
            game.stats.shields -= 1;
            game.stats.streak = 0;
            if (game.stats.shields <= 0) {
              game.stats.state = 'gameover';
            }
          }
        }

        for (let i = game.shots.length - 1; i >= 0; i -= 1) {
          const shot = game.shots[i];
          shot.position.addScaledVector(shot.userData.direction, shot.userData.speed * dt);
          shot.userData.life -= dt;

          let consumed = shot.userData.life <= 0;
          for (let j = game.drones.length - 1; j >= 0 && !consumed; j -= 1) {
            const drone = game.drones[j];
            const hitDistance = drone.userData.radius + 0.18;
            if (shot.position.distanceTo(drone.position) < hitDistance) {
              drone.userData.hp -= 1;
              consumed = true;
              game.sparks.push(...makeBurst(scene, materials, shot.position, '#bafcff'));
              if (drone.userData.hp <= 0) {
                game.drones.splice(j, 1);
                game.stats.streak += 1;
                game.stats.score += drone.userData.points + Math.min(50, game.stats.streak * 2);
                game.sparks.push(...makeBurst(scene, materials, drone.position, '#ffd166'));
                removeDrone(drone);
              } else {
                drone.scale.multiplyScalar(0.9);
              }
            }
          }

          if (consumed || shot.position.z < WORLD_BOUNDS.minZ || Math.abs(shot.position.x) > WORLD_BOUNDS.maxX + 1) {
            game.shots.splice(i, 1);
            removeShot(shot);
          }
        }
      }

      for (let i = game.sparks.length - 1; i >= 0; i -= 1) {
        const spark = game.sparks[i];
        spark.position.addScaledVector(spark.userData.velocity, dt);
        spark.userData.velocity.y -= dt * 3.8;
        spark.userData.life -= dt;
        spark.material.opacity = Math.max(0, spark.userData.life / spark.userData.maxLife);
        if (spark.userData.life <= 0) {
          game.sparks.splice(i, 1);
          scene.remove(spark);
          spark.geometry.dispose();
          spark.material.dispose();
        }
      }

      updateTurret();
      syncStats();
      renderer.render(scene, camera);
      if (!game.disposed) {
        game.animationId = requestAnimationFrame(update);
      }
    };

    game.start = reset;
    game.animationId = requestAnimationFrame(update);
    syncStats(true);

    return () => {
      game.disposed = true;
      cancelAnimationFrame(game.animationId);
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('resize', setSize);
      game.drones.forEach(removeDrone);
      game.shots.forEach(removeShot);
      game.sparks.forEach((spark) => {
        scene.remove(spark);
        if (spark.geometry) spark.geometry.dispose();
        if (spark.material) spark.material.dispose();
      });
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
      gameRef.current = null;
    };
  }, [canvasRef, setStats]);

  const start = useCallback(() => {
    gameRef.current?.start?.();
  }, []);

  return { start };
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ShooterGame() {
  const canvasRef = useRef(null);
  const [stats, setStats] = useState(initialStats);
  const { start } = useShooterGame(canvasRef, setStats);
  const isPlaying = stats.state === 'playing';
  const isGameOver = stats.state === 'gameover';

  return (
    <main className="game-shell">
      <canvas ref={canvasRef} className="game-canvas" aria-label="Arc Vector playfield" />

      <div className="hud top-hud" aria-live="polite">
        <div className="brand-lockup">
          <span className="signal-dot" />
          <span>Arc Vector</span>
        </div>
        <div className="stat-row">
          <Stat label="Score" value={stats.score.toLocaleString()} />
          <Stat label="Wave" value={stats.wave} />
          <Stat label="Shields" value={stats.shields} />
        </div>
      </div>

      <div className="charge-panel" aria-label="charge">
        <span style={{ transform: `scaleX(${stats.charge / 100})` }} />
      </div>

      <div className="reticle" aria-hidden="true">
        <span />
      </div>

      {!isPlaying && (
        <section className="start-panel" aria-label={isGameOver ? 'run ended' : 'start'}>
          <div>
            <p className="kicker">{isGameOver ? 'Run Ended' : 'Ready'}</p>
            <h1>{isGameOver ? stats.score.toLocaleString() : 'Arc Vector'}</h1>
            <p className="subline">{isGameOver ? `Wave ${stats.wave}` : 'Sector 7'}</p>
          </div>
          <button type="button" onClick={start}>
            {isGameOver ? 'Restart' : 'Start'}
          </button>
        </section>
      )}
    </main>
  );
}

function App() {
  return <ShooterGame />;
}

const rootElement = document.getElementById('root');
const root = rootElement.__arcVectorRoot ?? createRoot(rootElement);
rootElement.__arcVectorRoot = root;
root.render(<App />);
