import * as THREE from 'three';

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

export function buildArena(scene) {
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
