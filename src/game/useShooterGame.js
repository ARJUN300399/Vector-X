import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createShotSoundController } from '../audio/shotSound';
import { AIM_PLANE, PLAYER_POSITION, WORLD_BOUNDS } from './constants';
import { buildArena } from './arena';
import { createDrone, makeBurst, makeShot } from './entities';
import { clamp, randomBetween } from './math';
import { createMaterials } from './materials';
import { makePlayer } from './player';
import { initialStats } from './stats';

function disposeMeshObject(object) {
  if (object.geometry) object.geometry.dispose();
  if (object.material) {
    if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
    else object.material.dispose();
  }
}

export function useShooterGame(canvasRef, setStats, soundEnabledRef) {
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
    const shotSound = createShotSoundController();

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
    void shotSound.load();

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
      if (soundEnabledRef.current) shotSound.play();
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
        if (object.userData?.disposeMaterial && object.material) object.material.dispose();
      });
    };

    const removeShot = (shot) => {
      scene.remove(shot);
      shot.geometry.dispose();
    };

    const removeSpark = (spark) => {
      scene.remove(spark);
      disposeMeshObject(spark);
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
      game.sparks.forEach(removeSpark);
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
          removeSpark(spark);
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
      game.sparks.forEach(removeSpark);
      scene.traverse(disposeMeshObject);
      renderer.dispose();
      shotSound.dispose();
      gameRef.current = null;
    };
  }, [canvasRef, setStats, soundEnabledRef]);

  const start = useCallback(() => {
    gameRef.current?.start?.();
  }, []);

  return { start };
}
