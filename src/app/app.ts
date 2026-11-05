import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import * as THREE from 'three';

export interface Planet {
  name: string;
  type: string;
  color: string;
  radius: number;
  distance: number;
  orbitalSpeed: number;
  order: string;
  diameter: string;
  day: string;
  year: string;
  moons: string;
  description: string;
}

export const SOLAR_SYSTEM_PLANETS: Planet[] = [
  {
    name: 'Mercurio',
    type: 'Planeta terrestre',
    color: '#b8a99a',
    radius: 1.5,
    distance: 18,
    orbitalSpeed: 0.82,
    order: '01',
    diameter: '4.879',
    day: '58,6',
    year: '88',
    moons: '0',
    description:
      'El planeta más pequeño y veloz. Su superficie rocosa soporta temperaturas extremas entre el día y la noche.',
  },
  {
    name: 'Venus',
    type: 'Planeta terrestre',
    color: '#e5b879',
    radius: 2.3,
    distance: 28,
    orbitalSpeed: 0.56,
    order: '02',
    diameter: '12.104',
    day: '243',
    year: '225',
    moons: '0',
    description:
      'Un mundo envuelto en densas nubes. Su atmósfera atrapa el calor y lo convierte en el planeta más caliente.',
  },
  {
    name: 'Tierra',
    type: 'Planeta terrestre',
    color: '#4d9dce',
    radius: 2.6,
    distance: 39,
    orbitalSpeed: 0.42,
    order: '03',
    diameter: '12.742',
    day: '1',
    year: '365',
    moons: '1',
    description:
      'Nuestro hogar: un planeta oceánico con una atmósfera protectora y las condiciones conocidas para la vida.',
  },
  {
    name: 'Marte',
    type: 'Planeta terrestre',
    color: '#d87558',
    radius: 2,
    distance: 51,
    orbitalSpeed: 0.34,
    order: '04',
    diameter: '6.779',
    day: '1,03',
    year: '687',
    moons: '2',
    description:
      'El planeta rojo conserva huellas de antiguos ríos y alberga Olympus Mons, el mayor volcán del sistema solar.',
  },
  {
    name: 'Júpiter',
    type: 'Gigante gaseoso',
    color: '#d9ae87',
    radius: 6.4,
    distance: 70,
    orbitalSpeed: 0.19,
    order: '05',
    diameter: '139.820',
    day: '0,41',
    year: '4.333',
    moons: '95',
    description:
      'El gigante gaseoso domina el sistema con tormentas colosales y una familia de lunas fascinantes.',
  },
  {
    name: 'Saturno',
    type: 'Gigante gaseoso',
    color: '#e4ce9c',
    radius: 5.3,
    distance: 91,
    orbitalSpeed: 0.14,
    order: '06',
    diameter: '116.460',
    day: '0,45',
    year: '10.759',
    moons: '146',
    description:
      'Sus anillos brillantes, formados por hielo y roca, hacen de Saturno uno de los mundos más reconocibles.',
  },
  {
    name: 'Urano',
    type: 'Gigante helado',
    color: '#8acbd0',
    radius: 3.8,
    distance: 111,
    orbitalSpeed: 0.1,
    order: '07',
    diameter: '50.724',
    day: '0,72',
    year: '30.687',
    moons: '28',
    description:
      'Este gigante helado gira casi de lado y muestra una atmósfera azulada rica en metano.',
  },
  {
    name: 'Neptuno',
    type: 'Gigante helado',
    color: '#547bd7',
    radius: 3.7,
    distance: 128,
    orbitalSpeed: 0.08,
    order: '08',
    diameter: '49.244',
    day: '0,67',
    year: '60.190',
    moons: '16',
    description:
      'Un mundo azul oscuro en el confín del sistema, azotado por algunos de los vientos más rápidos conocidos.',
  },
];

@Component({
  imports: [UpperCasePipe],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('sceneCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly planets = SOLAR_SYSTEM_PLANETS;
  readonly speedOptions = [0.5, 1, 2];
  readonly selectedPlanet = signal(SOLAR_SYSTEM_PLANETS[2]);
  readonly paused = signal(false);
  readonly speed = signal(1);
  readonly showOrbits = signal(true);
  readonly sceneUnavailable = signal(false);

  private renderer?: THREE.WebGLRenderer;
  private camera?: THREE.PerspectiveCamera;
  private scene?: THREE.Scene;
  private world?: THREE.Group;
  private animationFrame = 0;
  private previousFrame = 0;
  private simulationTime = 0;
  private dragStart?: { x: number; y: number };
  private dragged = false;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly planetMeshes = new Map<string, THREE.Mesh>();
  private readonly orbitLines: THREE.Line[] = [];

  ngAfterViewInit(): void {
    this.createScene();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resizeScene);
    this.scene?.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Line ||
        object instanceof THREE.Points
      ) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.renderer?.dispose();
  }

  selectPlanet(planet: Planet): void {
    this.selectedPlanet.set(planet);
  }

  togglePlayback(): void {
    this.paused.update((paused) => !paused);
  }

  setSpeed(rate: number): void {
    if (this.speedOptions.includes(rate)) {
      this.speed.set(rate);
    }
  }

  toggleOrbits(): void {
    const visible = !this.showOrbits();
    this.showOrbits.set(visible);
    this.orbitLines.forEach((line) => (line.visible = visible));
  }

  zoomIn(): void {
    this.adjustZoom(0.82);
  }

  zoomOut(): void {
    this.adjustZoom(1.22);
  }

  resetCamera(): void {
    if (this.camera) {
      this.camera.position.set(0, 120, 270);
      this.camera.lookAt(0, 0, 0);
    }
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.adjustZoom(event.deltaY > 0 ? 1.08 : 0.92);
  }

  onPointerDown(event: PointerEvent): void {
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.dragged = false;
    (event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragStart || !this.world) {
      return;
    }

    const deltaX = event.clientX - this.dragStart.x;
    const deltaY = event.clientY - this.dragStart.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
      this.dragged = true;
      this.world.rotation.y += deltaX * 0.004;
      this.world.rotation.x = THREE.MathUtils.clamp(
        this.world.rotation.x + deltaY * 0.003,
        -0.75,
        0.75,
      );
      this.dragStart = { x: event.clientX, y: event.clientY };
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.dragStart && !this.dragged) {
      this.pickPlanet(event);
    }
    this.dragStart = undefined;
  }

  private createScene(): void {
    try {
      const canvas = this.canvasRef.nativeElement;
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setClearColor(0x080d18, 1);
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x080d18, 0.0007);
      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
      this.camera.position.set(0, 120, 270);
      this.camera.lookAt(0, 0, 0);
      this.world = new THREE.Group();
      this.scene.add(this.world);
      this.scene.add(new THREE.AmbientLight(0xb9c9ee, 1.1));

      this.addStarfield();
      this.addSun();
      this.addPlanets();
      window.addEventListener('resize', this.resizeScene);
      this.resizeScene();
      this.animate();
    } catch {
      this.sceneUnavailable.set(true);
    }
  }

  private addStarfield(): void {
    const positions = new Float32Array(1800 * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * 650;
      positions[i + 1] = (Math.random() - 0.5) * 420;
      positions[i + 2] = (Math.random() - 0.5) * 380;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xb8c9ec, size: 0.55, transparent: true, opacity: 0.78 }),
    );
    this.scene?.add(stars);
  }

  private addSun(): void {
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(9, 48, 48),
      new THREE.MeshBasicMaterial({ color: '#ffd27a' }),
    );
    this.world?.add(sun);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(11, 32, 32),
      new THREE.MeshBasicMaterial({ color: '#fcbf65', transparent: true, opacity: 0.12 }),
    );
    this.world?.add(glow);

    const light = new THREE.PointLight(0xffe2ad, 22000, 420, 1.6);
    this.world?.add(light);
  }

  private addPlanets(): void {
    for (const [index, planet] of this.planets.entries()) {
      const points = new THREE.EllipseCurve(0, 0, planet.distance, planet.distance, 0, Math.PI * 2)
        .getPoints(128)
        .map((point) => new THREE.Vector3(point.x, 0, point.y));
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const orbit = new THREE.Line(
        orbitGeometry,
        new THREE.LineBasicMaterial({ color: 0x52617c, transparent: true, opacity: 0.34 }),
      );
      this.world?.add(orbit);
      this.orbitLines.push(orbit);

      const material = new THREE.MeshStandardMaterial({
        color: planet.color,
        roughness: index < 4 ? 0.78 : 0.52,
        metalness: 0.04,
      });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(planet.radius, 36, 36), material);
      mesh.userData['planet'] = planet;
      this.world?.add(mesh);
      this.planetMeshes.set(planet.name, mesh);

      if (planet.name === 'Saturno') {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(planet.radius * 1.35, planet.radius * 2.1, 64),
          new THREE.MeshBasicMaterial({
            color: 0xd4c19b,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
          }),
        );
        ring.rotation.x = -Math.PI / 2.25;
        mesh.add(ring);
      }
    }
  }

  private animate = (time = 0): void => {
    const delta = Math.min((time - this.previousFrame) / 1000, 0.05);
    this.previousFrame = time;
    if (!this.paused()) {
      this.simulationTime += delta * this.speed();
      this.planets.forEach((planet, index) => {
        const mesh = this.planetMeshes.get(planet.name);
        if (!mesh) {
          return;
        }
        const angle = this.simulationTime * 0.08 * planet.orbitalSpeed + index * 0.74;
        mesh.position.set(Math.cos(angle) * planet.distance, 0, Math.sin(angle) * planet.distance);
        mesh.rotation.y += delta * (index < 4 ? 0.24 : 0.12);
      });
    }
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private resizeScene = (): void => {
    if (!this.renderer || !this.camera) {
      return;
    }
    const canvas = this.canvasRef.nativeElement;
    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private adjustZoom(multiplier: number): void {
    if (this.camera) {
      this.camera.position.multiplyScalar(multiplier);
      const distance = this.camera.position.length();
      if (distance < 70) {
        this.camera.position.setLength(70);
      } else if (distance > 360) {
        this.camera.position.setLength(360);
      }
    }
  }

  private pickPlanet(event: PointerEvent): void {
    if (!this.camera || !this.renderer) {
      return;
    }
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.planetMeshes.values()]);
    const planet = hits[0]?.object.userData['planet'] as Planet | undefined;
    if (planet) {
      this.selectPlanet(planet);
    }
  }
}
