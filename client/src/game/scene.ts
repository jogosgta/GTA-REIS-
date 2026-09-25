import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";

export type GameHandle = { scene: Scene; dispose: () => void };
type VehicleKind = "CARRO" | "MOTO";
type DriveState = "onFoot" | "driving";

type InputKey = "forward" | "back" | "left" | "right" | "shift";
type SaveState = { cash: number; respect: number; missionIndex: number; paintIndex: number };

const logoUrl = "/manus-storage/gta-reis-logo_5d5f62ca.png";
const billboardUrl = "/manus-storage/gta-reis-billboard_7a578bad.png";
const facadeUrl = "/manus-storage/sp-facade-texture_49c52796.png";
const roadUrl = "/manus-storage/sp-road-texture_208eee0b.png";
const missionTitles = ["Corre do Centro", "Pista da Paulista", "Entrega Zona Leste"];

const palette = {
  night: Color3.FromHexString("#081421"),
  road: Color3.FromHexString("#263744"),
  roadLine: Color3.FromHexString("#d2b875"),
  concrete: Color3.FromHexString("#93a7a6"),
  teal: Color3.FromHexString("#2dafa0"),
  mint: Color3.FromHexString("#78e4c0"),
  amber: Color3.FromHexString("#ffc76a"),
  coral: Color3.FromHexString("#f26e61"),
  coralDark: Color3.FromHexString("#9f3f4b"),
  blue: Color3.FromHexString("#24617d"),
  cream: Color3.FromHexString("#f0d2a0"),
  dark: Color3.FromHexString("#10212d"),
};

function material(scene: Scene, name: string, color: Color3, emissive = false) {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.specularColor = Color3.White().scale(0.12);
  m.specularPower = 48;
  if (emissive) m.emissiveColor = color.scale(0.45);
  return m;
}

function texturedMaterial(scene: Scene, name: string, url: string, tint: Color3, uScale: number, vScale: number, textureLevel = 0.42) {
  const m = material(scene, name, tint);
  const texture = new Texture(url, scene);
  texture.uScale = uScale;
  texture.vScale = vScale;
  texture.level = textureLevel;
  m.diffuseTexture = texture;
  return m;
}

function box(scene: Scene, name: string, size: { width: number; height: number; depth: number }, position: Vector3, mat: StandardMaterial, parent?: TransformNode | Mesh) {
  const mesh = MeshBuilder.CreateBox(name, size, scene);
  mesh.position.copyFrom(position);
  mesh.material = mat;
  if (parent) mesh.parent = parent;
  return mesh;
}

function cylinder(scene: Scene, name: string, diameter: number, height: number, position: Vector3, mat: StandardMaterial, parent?: TransformNode | Mesh) {
  const mesh = MeshBuilder.CreateCylinder(name, { diameter, height, tessellation: 12 }, scene);
  mesh.position.copyFrom(position);
  mesh.material = mat;
  if (parent) mesh.parent = parent;
  return mesh;
}

function distanceXZ(a: Vector3, b: Vector3) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function loadSave(): SaveState {
  const fallback: SaveState = { cash: 2450, respect: 12, missionIndex: 0, paintIndex: 0 };
  try {
    const raw = window.localStorage.getItem("gta-reis-save");
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    return {
      cash: typeof parsed.cash === "number" ? parsed.cash : fallback.cash,
      respect: typeof parsed.respect === "number" ? parsed.respect : fallback.respect,
      missionIndex: typeof parsed.missionIndex === "number" ? parsed.missionIndex : fallback.missionIndex,
      paintIndex: typeof parsed.paintIndex === "number" ? parsed.paintIndex : fallback.paintIndex,
    };
  } catch {
    return fallback;
  }
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private engine: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  unlock() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  beep(frequency: number, duration = 0.12, gainValue = 0.045, type: OscillatorType = "triangle") {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(this.ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  setEngine(speed: number, active: boolean) {
    if (!this.ctx) return;
    if (active && !this.engine) {
      this.engine = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engine.type = "sawtooth";
      this.engineGain.gain.value = 0.018;
      this.engine.connect(this.engineGain).connect(this.ctx.destination);
      this.engine.start();
    }
    if (this.engine && this.engineGain) {
      this.engine.frequency.value = 72 + Math.abs(speed) * 19;
      this.engineGain.gain.value = active ? Math.min(0.04, 0.012 + Math.abs(speed) * 0.004) : 0.001;
    }
  }

  dispose() {
    try { this.engine?.stop(); } catch { /* oscillator may already be stopped */ }
    void this.ctx?.close();
    this.engine = null;
    this.engineGain = null;
    this.ctx = null;
  }
}

class Player {
  readonly root: TransformNode;
  private readonly body: Mesh;
  private readonly legs: Mesh[];
  private walkTime = 0;

  constructor(scene: Scene) {
    this.root = new TransformNode("reis-player", scene);
    const skin = material(scene, "skin", Color3.FromHexString("#9b5f49"));
    const jacket = material(scene, "yellow-jacket", palette.amber);
    const denim = material(scene, "denim", Color3.FromHexString("#244f69"));
    const shoe = material(scene, "shoes", Color3.FromHexString("#1a2029"));
    this.body = CreateCapsule("player-body", { height: 1.2, radius: 0.34, tessellation: 12, subdivisions: 4 }, scene);
    this.body.position = new Vector3(0, 1.36, 0);
    this.body.scaling.y = 0.88;
    this.body.material = jacket;
    this.body.parent = this.root;
    const head = MeshBuilder.CreateSphere("player-head", { diameter: 0.52, segments: 12 }, scene);
    head.position = new Vector3(0, 2.2, 0);
    head.material = skin;
    head.parent = this.root;
    const cap = MeshBuilder.CreateSphere("player-cap", { diameter: 0.64, segments: 12 }, scene);
    cap.position = new Vector3(0, 2.38, 0);
    cap.scaling.y = 0.28;
    cap.material = paletteMat(scene, "cap", palette.coral);
    cap.parent = this.root;
    for (const side of [-1, 1]) {
      const arm = cylinder(scene, "player-arm", 0.2, 0.86, new Vector3(side * 0.48, 1.44, 0), jacket, this.root);
      arm.rotation.z = side * 0.16;
    }
    this.legs = [];
    for (const side of [-1, 1]) {
      const leg = CreateCapsule("player-leg", { height: 0.86, radius: 0.14, tessellation: 10, subdivisions: 3 }, scene);
      leg.position = new Vector3(side * 0.19, 0.47, 0);
      leg.material = denim;
      leg.parent = this.root;
      this.legs.push(leg);
      const foot = CreateCapsule("player-shoe", { height: 0.42, radius: 0.14, tessellation: 10, subdivisions: 3, orientation: new Vector3(0, 0, 1) }, scene);
      foot.position = new Vector3(side * 0.19, 0.08, 0.08);
      foot.scaling.y = 0.45;
      foot.material = shoe;
      foot.parent = this.root;
      this.legs.push(foot);
    }
  }

  animateWalking(active: boolean, dt: number) {
    if (!active) {
      this.legs[0].rotation.x = 0;
      this.legs[1].rotation.x = 0;
      return;
    }
    this.walkTime += dt * 11;
    const swing = Math.sin(this.walkTime) * 0.38;
    this.legs[0].rotation.x = swing;
    this.legs[1].rotation.x = -swing;
    this.body.position.y = 1.36 + Math.abs(Math.sin(this.walkTime * 2)) * 0.025;
  }
}

class Vehicle {
  readonly root: Mesh;
  readonly kind: VehicleKind;
  private readonly wheels: Mesh[] = [];
  private readonly frontWheels: Mesh[] = [];
  private readonly engineColor: Color3;
  speed = 0;
  maxSpeed: number;
  private steer = 0;

  constructor(scene: Scene, kind: VehicleKind, position: Vector3, bodyColor: Color3) {
    this.kind = kind;
    this.engineColor = bodyColor;
    this.maxSpeed = kind === "CARRO" ? 12 : 15;
    this.root = CreateCapsule(`${kind.toLowerCase()}-root`, {
      height: kind === "CARRO" ? 3.5 : 2.25,
      radius: kind === "CARRO" ? 0.92 : 0.42,
      tessellation: 16,
      subdivisions: 4,
      orientation: new Vector3(0, 0, 1),
    }, scene);
    this.root.position.copyFrom(position);
    this.root.scaling.y = kind === "CARRO" ? 0.62 : 0.7;
    this.root.material = material(scene, `${kind}-body`, bodyColor);
    const black = material(scene, `${kind}-rubber`, Color3.FromHexString("#11171d"));
    const glass = material(scene, `${kind}-glass`, Color3.FromHexString("#9adbd0"), true);
    const chrome = material(scene, `${kind}-chrome`, Color3.FromHexString("#d5e2db"), true);
    if (kind === "CARRO") {
      box(scene, "car-hood", { width: 1.72, height: 0.25, depth: 1.1 }, new Vector3(0, 0.4, 1.05), this.root.material as StandardMaterial, this.root);
      const cabin = CreateCapsule("car-cabin", { height: 1.45, radius: 0.62, tessellation: 14, subdivisions: 3, orientation: new Vector3(0, 0, 1) }, scene);
      cabin.position = new Vector3(0, 0.76, -0.18);
      cabin.scaling = new Vector3(1.05, 0.62, 0.92);
      cabin.material = glass;
      cabin.parent = this.root;
      box(scene, "car-roof", { width: 1.52, height: 0.1, depth: 1.25 }, new Vector3(0, 1.12, -0.2), chrome, this.root);
      box(scene, "car-light-a", { width: 0.42, height: 0.13, depth: 0.06 }, new Vector3(-0.55, 0.47, 1.77), material(scene, "car-light", palette.amber, true), this.root);
      box(scene, "car-light-b", { width: 0.42, height: 0.13, depth: 0.06 }, new Vector3(0.55, 0.47, 1.77), material(scene, "car-light-b", palette.amber, true), this.root);
      for (const x of [-0.93, 0.93]) for (const z of [-1.05, 1.05]) {
        const wheel = MeshBuilder.CreateTorus("car-wheel", { diameter: 0.55, thickness: 0.16, tessellation: 18 }, scene);
        wheel.position = new Vector3(x, -0.22, z);
        wheel.rotation.z = Math.PI / 2;
        wheel.material = black;
        wheel.parent = this.root;
        this.wheels.push(wheel);
        if (z < 0) this.frontWheels.push(wheel);
        const hub = cylinder(scene, "car-hubcap", 0.21, 0.24, new Vector3(x, -0.22, z), chrome, this.root);
        hub.rotation.z = Math.PI / 2;
      }
    } else {
      const seat = material(scene, "bike-seat", Color3.FromHexString("#20212a"));
      const tank = CreateCapsule("bike-tank", { height: 0.78, radius: 0.31, tessellation: 12, subdivisions: 3, orientation: new Vector3(0, 0, 1) }, scene);
      tank.position = new Vector3(0, 0.36, 0.18);
      tank.scaling.y = 0.72;
      tank.material = this.root.material;
      tank.parent = this.root;
      box(scene, "bike-seat", { width: 0.48, height: 0.16, depth: 0.76 }, new Vector3(0, 0.6, -0.46), seat, this.root);
      box(scene, "bike-handle", { width: 0.95, height: 0.08, depth: 0.08 }, new Vector3(0, 0.86, 0.74), chrome, this.root);
      box(scene, "bike-light", { width: 0.24, height: 0.2, depth: 0.12 }, new Vector3(0, 0.6, 1.04), material(scene, "bike-light", palette.amber, true), this.root);
      for (const z of [-0.75, 0.83]) {
        const wheel = MeshBuilder.CreateTorus("bike-wheel", { diameter: 0.58, thickness: 0.13, tessellation: 18 }, scene);
        wheel.position = new Vector3(0, 0, z);
        wheel.rotation.x = Math.PI / 2;
        wheel.material = black;
        wheel.parent = this.root;
        this.wheels.push(wheel);
        const hub = cylinder(scene, "bike-hubcap", 0.22, 0.14, new Vector3(0, 0, z), chrome, this.root);
        hub.rotation.x = Math.PI / 2;
      }
    }
  }

  drive(forward: number, turn: number, dt: number) {
    const acceleration = this.kind === "CARRO" ? 10 : 13;
    const friction = forward === 0 ? 5 : 1.1;
    this.speed += forward * acceleration * dt;
    if (forward === 0) this.speed += this.speed > 0 ? -friction * dt : friction * dt;
    this.speed = Math.max(-this.maxSpeed * 0.38, Math.min(this.maxSpeed, this.speed));
    this.steer += (turn - this.steer) * Math.min(1, dt * 9);
    this.root.rotation.y += this.steer * (0.9 + Math.abs(this.speed) * 0.06) * dt * (this.speed >= 0 ? 1 : -1);
    const forwardVector = new Vector3(Math.sin(this.root.rotation.y), 0, Math.cos(this.root.rotation.y));
    this.root.position.addInPlace(forwardVector.scale(this.speed * dt));
    this.root.position.x = Math.max(-47, Math.min(47, this.root.position.x));
    this.root.position.z = Math.max(-47, Math.min(47, this.root.position.z));
    for (const wheel of this.wheels) wheel.rotation.x += this.speed * dt * 1.9;
    for (const wheel of this.frontWheels) wheel.rotation.y = this.steer * 0.35;
  }

  stop() {
    this.speed *= 0.5;
  }
}

function paletteMat(scene: Scene, name: string, color: Color3) {
  return material(scene, name, color);
}

class GameWorld {
  readonly scene: Scene;
  readonly camera: FreeCamera;
  readonly player: Player;
  readonly vehicles: Vehicle[] = [];
  private readonly save: SaveState;
  private readonly garagePoint = new Vector3(-29, 0, 15);
  private readonly marketPoint = new Vector3(29, 0, 15);
  private readonly npcs: { root: TransformNode; phase: number; speed: number; origin: Vector3 }[] = [];
  private readonly input = new Set<InputKey>();
  private readonly audio = new AudioManager();
  private readonly missionMarkers: Mesh[] = [];
  private missionIndex = 0;
  private state: DriveState = "onFoot";
  private activeVehicle: Vehicle | null = null;
  private cash = 2450;
  private respect = 12;
  private paintIndex = 0;
  private walkTime = 0;
  private stepTimer = 0;
  private demo = new URLSearchParams(window.location.search).has("demo");
  private demoTime = 0;
  private readonly onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    this.audio.unlock();
    if (key === "w" || key === "arrowup") this.input.add("forward");
    if (key === "s" || key === "arrowdown") this.input.add("back");
    if (key === "a" || key === "arrowleft") this.input.add("left");
    if (key === "d" || key === "arrowright") this.input.add("right");
    if (key === "shift") this.input.add("shift");
    if (key === "e" || key === "f") this.interact();
    if (key === "h") this.horn();
  };
  private readonly onKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (key === "w" || key === "arrowup") this.input.delete("forward");
    if (key === "s" || key === "arrowdown") this.input.delete("back");
    if (key === "a" || key === "arrowleft") this.input.delete("left");
    if (key === "d" || key === "arrowright") this.input.delete("right");
    if (key === "shift") this.input.delete("shift");
  };
  private readonly onTouchInput = (event: Event) => {
    const detail = (event as CustomEvent<{ key: InputKey; down: boolean }>).detail;
    if (!detail) return;
    if (detail.down) this.input.add(detail.key); else this.input.delete(detail.key);
    this.audio.unlock();
  };
  private readonly onAction = (event: Event) => {
    const detail = (event as CustomEvent<{ name: string }>).detail;
    if (detail?.name === "interact") this.interact();
    if (detail?.name === "horn") this.horn();
    this.audio.unlock();
  };

  constructor(scene: Scene, canvas: HTMLCanvasElement) {
    this.scene = scene;
    this.save = loadSave();
    this.cash = this.save.cash;
    this.respect = this.save.respect;
    this.missionIndex = this.save.missionIndex % 3;
    this.paintIndex = this.save.paintIndex % 4;
    scene.clearColor = new Color4(0.025, 0.06, 0.1, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0065;
    scene.fogColor = Color3.FromHexString("#6f8a8a");
    const hemi = new HemisphericLight("city-fill", new Vector3(0.2, 1, 0.2), scene);
    hemi.intensity = 0.78;
    hemi.diffuse = Color3.FromHexString("#b8d6d0");
    hemi.groundColor = Color3.FromHexString("#122333");
    const sun = new DirectionalLight("warm-moon", new Vector3(-0.4, -1, 0.5), scene);
    sun.position = new Vector3(20, 40, -20);
    sun.intensity = 0.7;
    sun.diffuse = Color3.FromHexString("#ffd59a");
    this.createEnvironment();
    this.player = new Player(scene);
    this.player.root.position = new Vector3(0, 0, 8);
    this.createVehicles();
    this.createNpcs();
    this.createMission();
    this.createCommerce();
    this.createSaoPauloLandmarks();
    const shadows = new ShadowGenerator(512, sun);
    shadows.useBlurExponentialShadowMap = true;
    shadows.blurKernel = 16;
    shadows.bias = 0.002;
    for (const mesh of scene.meshes) {
      if (mesh.position.y > 0.1) shadows.addShadowCaster(mesh, true);
      mesh.receiveShadows = true;
    }
    this.camera = new FreeCamera("follow-camera", new Vector3(0, 10, 22), scene);
    this.camera.minZ = 0.1;
    this.camera.maxZ = 250;
    this.camera.fov = 1.02;
    const initialTarget = this.player.root.position.add(new Vector3(0, 1.2, 0));
    this.camera.position = initialTarget.add(new Vector3(0, 8.8, -13));
    this.camera.setTarget(initialTarget);
    this.camera.attachControl(canvas, false);
    scene.activeCamera = this.camera;
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.exposure = 1.12;
    scene.imageProcessingConfiguration.contrast = 1.18;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("game-input", this.onTouchInput);
    window.addEventListener("game-action", this.onAction);
    this.updateHud();
  }

  private createEnvironment() {
    const ground = box(this.scene, "city-ground", { width: 100, height: 0.3, depth: 100 }, new Vector3(0, -0.25, 0), material(this.scene, "ground", Color3.FromHexString("#b9ae92")));
    ground.receiveShadows = true;
    const road = material(this.scene, "asphalt", Color3.FromHexString("#2f414b"));
    const sidewalk = material(this.scene, "sidewalk", palette.concrete);
    box(this.scene, "main-road", { width: 13, height: 0.12, depth: 100 }, new Vector3(0, 0, 0), road);
    box(this.scene, "cross-road", { width: 100, height: 0.12, depth: 13 }, new Vector3(0, 0.01, -3), road);
    box(this.scene, "sidewalk-west", { width: 4, height: 0.22, depth: 100 }, new Vector3(-8.5, 0.04, 0), sidewalk);
    box(this.scene, "sidewalk-east", { width: 4, height: 0.22, depth: 100 }, new Vector3(8.5, 0.04, 0), sidewalk);
    box(this.scene, "sidewalk-north", { width: 100, height: 0.22, depth: 4 }, new Vector3(0, 0.05, -10), sidewalk);
    box(this.scene, "sidewalk-south", { width: 100, height: 0.22, depth: 4 }, new Vector3(0, 0.05, 4), sidewalk);
    const lineMat = material(this.scene, "road-marking", palette.roadLine, true);
    for (let z = -45; z <= 45; z += 7) box(this.scene, "road-dash", { width: 0.16, height: 0.03, depth: 3.4 }, new Vector3(0, 0.08, z), lineMat);
    for (let x = -45; x <= 45; x += 7) box(this.scene, "cross-dash", { width: 3.4, height: 0.03, depth: 0.16 }, new Vector3(x, 0.09, -3), lineMat);
    const housePalette = [palette.teal, palette.coral, palette.blue, palette.cream];
    const houseSpots = [
      [-20, -20, 1], [-32, -20, 2], [20, -21, 0], [33, -19, 3],
      [-20, 19, 2], [-33, 25, 0], [20, 19, 3], [34, 27, 1],
    ];
    houseSpots.forEach(([x, z, tint], i) => this.createHouse(x, z, housePalette[tint], i));
    for (const [x, z] of [[-15, -16], [15, -16], [-15, 15], [15, 15], [-40, 4], [40, -3]]) this.createPalm(x, z);
    this.createGasStation();
    this.createBillboard();
    this.createStreetLights();
    this.createBackdrop();
  }

  private createHouse(x: number, z: number, color: Color3, index: number) {
    const base = texturedMaterial(this.scene, `house-${index}`, facadeUrl, color, 1.3, 1.1);
    const trim = material(this.scene, `house-trim-${index}`, Color3.FromHexString("#e9dcb9"));
    const dark = material(this.scene, `house-window-${index}`, Color3.FromHexString("#183745"), true);
    box(this.scene, `house-${index}`, { width: 8, height: 4.6, depth: 6.8 }, new Vector3(x, 2.3, z), base);
    box(this.scene, `house-roof-${index}`, { width: 8.5, height: 0.35, depth: 7.3 }, new Vector3(x, 4.72, z), trim);
    box(this.scene, `house-door-${index}`, { width: 1.25, height: 2.2, depth: 0.12 }, new Vector3(x, 1.1, z - 3.46), material(this.scene, `door-${index}`, palette.dark));
    for (const dx of [-2.3, 2.3]) box(this.scene, `house-window-${index}-${dx}`, { width: 1.45, height: 1.05, depth: 0.1 }, new Vector3(x + dx, 2.55, z - 3.5), dark);
    box(this.scene, `house-awning-${index}`, { width: 2.2, height: 0.12, depth: 0.8 }, new Vector3(x, 2.38, z - 3.8), trim);
  }

  private createPalm(x: number, z: number) {
    const trunk = material(this.scene, `palm-trunk-${x}-${z}`, Color3.FromHexString("#77533d"));
    const leaf = material(this.scene, `palm-leaf-${x}-${z}`, Color3.FromHexString("#3f9f75"));
    cylinder(this.scene, "palm-trunk", 0.42, 4.7, new Vector3(x, 2.35, z), trunk);
    const crown = MeshBuilder.CreateSphere("palm-crown", { diameter: 2.5, segments: 8 }, this.scene);
    crown.position = new Vector3(x, 5.2, z);
    crown.scaling.y = 0.4;
    crown.material = leaf;
  }

  private createGasStation() {
    const white = material(this.scene, "station-white", Color3.FromHexString("#dce9dc"));
    const red = material(this.scene, "station-red", palette.coral, true);
    const roof = box(this.scene, "gas-roof", { width: 12, height: 0.35, depth: 8 }, new Vector3(29, 5.6, 4), white);
    box(this.scene, "gas-stripe", { width: 12.2, height: 0.3, depth: 0.4 }, new Vector3(29, 5.25, 0.4), red);
    for (const x of [25, 29, 33]) cylinder(this.scene, "gas-pillar", 0.28, 5.1, new Vector3(x, 2.55, 4), white);
    box(this.scene, "gas-shop", { width: 8, height: 3.8, depth: 4 }, new Vector3(29, 1.9, 9), paletteMat(this.scene, "gas-shop-mat", palette.blue));
    const sign = box(this.scene, "gas-sign", { width: 4.3, height: 1.1, depth: 0.08 }, new Vector3(29, 7.0, 3.8), red);
    sign.rotation.y = 0;
  }

  private createCommerce() {
    const wall = material(this.scene, "commerce-wall", palette.coralDark);
    const trim = material(this.scene, "commerce-trim", palette.amber, true);
    const glass = material(this.scene, "commerce-glass", Color3.FromHexString("#9adbd0"), true);
    box(this.scene, "rei-garage", { width: 9, height: 3.8, depth: 6 }, new Vector3(-29, 1.9, 15), wall);
    box(this.scene, "rei-garage-floor", { width: 8.6, height: 0.05, depth: 5.7 }, new Vector3(-29, 0.1, 15), texturedMaterial(this.scene, "garage-road", roadUrl, Color3.White(), 0.8, 0.8, 0.45));
    box(this.scene, "rei-garage-door", { width: 4.8, height: 2.4, depth: 0.12 }, new Vector3(-29, 1.2, 11.94), glass);
    box(this.scene, "rei-garage-sign", { width: 7.2, height: 0.8, depth: 0.12 }, new Vector3(-29, 4.4, 11.86), trim);
    box(this.scene, "rei-market", { width: 9, height: 3.8, depth: 6 }, new Vector3(29, 1.9, 15), paletteMat(this.scene, "market-wall", palette.blue));
    box(this.scene, "rei-market-window", { width: 6.2, height: 1.4, depth: 0.12 }, new Vector3(29, 2.3, 11.94), glass);
    box(this.scene, "rei-market-sign", { width: 6.2, height: 0.8, depth: 0.12 }, new Vector3(29, 4.4, 11.86), trim);
    for (const point of [this.garagePoint, this.marketPoint]) {
      const marker = MeshBuilder.CreateCylinder("service-marker", { diameter: 1.2, height: 0.05, tessellation: 20 }, this.scene);
      marker.position = point.add(new Vector3(0, 0.15, -3.4));
      marker.material = trim;
    }
  }

  private createSaoPauloLandmarks() {
    const towerColors = [palette.blue, palette.teal, Color3.FromHexString("#b77e62"), Color3.FromHexString("#566c75")];
    const towers = [
      [-39, -25, 12, 6, 5], [-30, -30, 18, 7, 6], [38, -25, 15, 7, 6],
      [-39, 29, 10, 7, 6], [39, 30, 13, 8, 6],
    ];
    towers.forEach(([x, z, height, width, depth], index) => {
      const tower = material(this.scene, `sp-tower-${index}`, towerColors[index % towerColors.length]);
      box(this.scene, `sp-tower-${index}`, { width, height, depth }, new Vector3(x, height / 2, z), tower);
      const windowMat = material(this.scene, `sp-window-${index}`, Color3.FromHexString("#c8e6d4"), true);
      for (let row = 1; row < Math.floor(height / 2); row++) {
        for (let col = -1; col <= 1; col++) {
          box(this.scene, `sp-window-${index}-${row}-${col}`, { width: 0.65, height: 0.42, depth: 0.06 }, new Vector3(x + col * (width / 3), row * 1.55, z - depth / 2 - 0.04), windowMat);
        }
      }
    });
    const viaduct = material(this.scene, "minhocao-road", Color3.FromHexString("#394a55"));
    const support = material(this.scene, "minhocao-support", Color3.FromHexString("#687c7d"));
    box(this.scene, "minhocao-deck", { width: 42, height: 0.7, depth: 4.2 }, new Vector3(0, 6.4, -31), viaduct);
    for (const x of [-17, 0, 17]) box(this.scene, "minhocao-pillar", { width: 1.3, height: 6.2, depth: 1.3 }, new Vector3(x, 3.1, -31), support);
    const busBody = material(this.scene, "city-bus", Color3.FromHexString("#e8c65d"));
    box(this.scene, "city-bus", { width: 2.2, height: 1.8, depth: 6.2 }, new Vector3(16, 1.05, -25), busBody);
    box(this.scene, "city-bus-window", { width: 2.25, height: 0.75, depth: 5.3 }, new Vector3(16, 1.6, -25), material(this.scene, "bus-glass", Color3.FromHexString("#315466"), true));
  }

  private createBillboard() {
    const plane = MeshBuilder.CreatePlane("gta-reis-billboard", { width: 7.4, height: 3.8 }, this.scene);
    plane.position = new Vector3(-28, 6.6, -9.7);
    plane.rotation.y = Math.PI;
    const billboardMat = new StandardMaterial("billboard-texture", this.scene);
    billboardMat.diffuseTexture = new Texture(billboardUrl, this.scene);
    billboardMat.emissiveColor = Color3.FromHexString("#456f6c").scale(0.38);
    plane.material = billboardMat;
    const frame = material(this.scene, "billboard-frame", palette.dark);
    box(this.scene, "billboard-post-a", { width: 0.2, height: 4.4, depth: 0.2 }, new Vector3(-31, 2.2, -9.6), frame);
    box(this.scene, "billboard-post-b", { width: 0.2, height: 4.4, depth: 0.2 }, new Vector3(-25, 2.2, -9.6), frame);
    const logoPlane = MeshBuilder.CreatePlane("logo-sign", { width: 2.2, height: 2.2 }, this.scene);
    logoPlane.position = new Vector3(-28, 6.6, -9.48);
    logoPlane.rotation.y = Math.PI;
    const logoMat = new StandardMaterial("logo-sign-mat", this.scene);
    logoMat.diffuseTexture = new Texture(logoUrl, this.scene);
    logoMat.emissiveColor = Color3.White().scale(0.18);
    logoMat.backFaceCulling = false;
    logoPlane.material = logoMat;
  }

  private createStreetLights() {
    const poleMat = material(this.scene, "street-pole", Color3.FromHexString("#293d45"));
    const lampMat = material(this.scene, "street-lamp", palette.amber, true);
    for (const [x, z] of [[-6.4, -15], [6.4, -15], [-6.4, 15], [6.4, 15], [-16, -5], [16, -5]]) {
      cylinder(this.scene, "street-pole", 0.16, 5.2, new Vector3(x, 2.6, z), poleMat);
      box(this.scene, "street-lamp", { width: 0.6, height: 0.14, depth: 0.25 }, new Vector3(x, 5.16, z), lampMat);
    }
  }

  private createBackdrop() {
    const hills = material(this.scene, "hills", Color3.FromHexString("#193b46"));
    for (const [x, z, scale] of [[-40, -38, 1.1], [-23, -43, 1.6], [8, -44, 1.4], [34, -40, 1.2]]) {
      const hill = MeshBuilder.CreateSphere("distant-hill", { diameter: 25, segments: 10 }, this.scene);
      hill.position = new Vector3(x, 8, z);
      hill.scaling = new Vector3(scale, 0.55, 0.5);
      hill.material = hills;
    }
  }

  private createVehicles() {
    this.vehicles.push(new Vehicle(this.scene, "CARRO", new Vector3(-4.2, 0.65, 7.5), palette.teal));
    this.vehicles.push(new Vehicle(this.scene, "MOTO", new Vector3(4.2, 0.5, 7.8), palette.coral));
  }

  private createNpcs() {
    const outfits = [palette.cream, palette.coral, palette.blue, palette.teal, palette.amber];
    for (let i = 0; i < 8; i++) {
      const root = new TransformNode(`npc-${i}`, this.scene);
      const outfit = material(this.scene, `npc-outfit-${i}`, outfits[i % outfits.length]);
      const skin = material(this.scene, `npc-skin-${i}`, Color3.FromHexString(i % 2 ? "#8b543f" : "#c57e5f"));
      box(this.scene, "npc-body", { width: 0.52, height: 0.9, depth: 0.34 }, new Vector3(0, 1.05, 0), outfit, root);
      const head = MeshBuilder.CreateSphere("npc-head", { diameter: 0.36, segments: 10 }, this.scene);
      head.position = new Vector3(0, 1.7, 0);
      head.material = skin;
      head.parent = root;
      root.position = new Vector3(-31 + (i % 4) * 20, 0, -1 + Math.floor(i / 4) * 11);
      this.npcs.push({ root, phase: i * 0.9, speed: 0.65 + (i % 3) * 0.12, origin: root.position.clone() });
    }
  }

  private createMission() {
    const markerMat = material(this.scene, "mission-marker", palette.coral, true);
    const points = [new Vector3(-22, 0.15, -16), new Vector3(18, 0.15, -16), new Vector3(21, 0.15, 19)];
    for (const point of points) {
      const marker = MeshBuilder.CreateTorus("mission-ring", { diameter: 2.5, thickness: 0.16, tessellation: 24 }, this.scene);
      marker.position = point;
      marker.rotation.x = Math.PI / 2;
      marker.material = markerMat;
      const beam = cylinder(this.scene, "mission-beam", 0.08, 1.8, point.add(new Vector3(0, 0.9, 0)), markerMat);
      this.missionMarkers.push(marker, beam);
    }
    this.setMissionVisibility();
  }

  private setMissionVisibility() {
    this.missionMarkers.forEach((mesh, index) => {
      const checkpoint = Math.floor(index / 2);
      mesh.isVisible = checkpoint === this.missionIndex;
    });
  }

  private nearestVehicle() {
    return this.vehicles.find((vehicle) => distanceXZ(vehicle.root.position, this.player.root.position) < 5.2) ?? null;
  }

  private saveProgress() {
    try {
      window.localStorage.setItem("gta-reis-save", JSON.stringify({
        cash: this.cash,
        respect: this.respect,
        missionIndex: this.missionIndex,
        paintIndex: this.paintIndex,
      } satisfies SaveState));
    } catch {
      // Private browsing or blocked storage should not interrupt gameplay.
    }
  }

  private nearbyService() {
    if (distanceXZ(this.player.root.position, this.garagePoint) < 7) return "garage" as const;
    if (distanceXZ(this.player.root.position, this.marketPoint) < 7) return "market" as const;
    return null;
  }

  private customizeVehicle() {
    const vehicle = this.nearestVehicle();
    if (!vehicle || this.cash < 500) {
      this.audio.beep(180, 0.1, 0.04, "square");
      return;
    }
    const colors = [palette.teal, palette.coral, palette.amber, palette.blue];
    this.paintIndex = (this.paintIndex + 1) % colors.length;
    vehicle.root.material = material(this.scene, `custom-paint-${this.paintIndex}`, colors[this.paintIndex]);
    this.cash -= 500;
    this.respect += 1;
    this.saveProgress();
    this.audio.beep(820, 0.16, 0.045);
    this.updateHud();
  }

  private interact() {
    if (this.state === "driving") {
      this.exitVehicle();
      return;
    }
    const service = this.nearbyService();
    if (service === "garage") {
      this.customizeVehicle();
      return;
    }
    if (service === "market") {
      this.cash += 125;
      this.respect += 1;
      this.saveProgress();
      this.audio.beep(680, 0.13, 0.04);
      this.updateHud();
      return;
    }
    const vehicle = this.nearestVehicle();
    if (vehicle) {
      this.enterVehicle(vehicle);
      return;
    }
    this.audio.beep(380, 0.07);
  }

  private enterVehicle(vehicle: Vehicle) {
    this.audio.unlock();
    this.state = "driving";
    this.activeVehicle = vehicle;
    this.player.root.isVisible = false;
    vehicle.stop();
    this.audio.beep(vehicle.kind === "CARRO" ? 520 : 650, 0.12, 0.04);
    this.updateHud();
  }

  private exitVehicle() {
    if (!this.activeVehicle) return;
    const vehicle = this.activeVehicle;
    const side = new Vector3(Math.cos(vehicle.root.rotation.y), 0, -Math.sin(vehicle.root.rotation.y));
    this.player.root.position = vehicle.root.position.add(side.scale(2.2));
    this.player.root.rotation.y = vehicle.root.rotation.y;
    this.player.root.isVisible = true;
    this.state = "onFoot";
    this.activeVehicle = null;
    this.audio.setEngine(0, false);
    this.audio.beep(300, 0.08);
    this.updateHud();
  }

  private horn() {
    this.audio.unlock();
    this.audio.beep(this.state === "driving" ? 240 : 160, this.state === "driving" ? 0.24 : 0.08, 0.065, "square");
  }

  private updatePlayer(dt: number) {
    const x = (this.input.has("right") ? 1 : 0) - (this.input.has("left") ? 1 : 0);
    const z = (this.input.has("forward") ? 1 : 0) - (this.input.has("back") ? 1 : 0);
    const magnitude = Math.max(1, Math.sqrt(x * x + z * z));
    const sprint = this.input.has("shift") ? 1.45 : 1;
    const speed = 5.2 * sprint;
    if (x !== 0 || z !== 0) {
      this.player.root.position.x += (x / magnitude) * speed * dt;
      this.player.root.position.z -= (z / magnitude) * speed * dt;
      this.player.root.rotation.y = Math.atan2(x, z);
      this.walkTime += dt * 9;
      this.stepTimer += dt;
      if (this.stepTimer > 0.52) {
        this.audio.beep(115, 0.045, 0.012, "sine");
        this.stepTimer = 0;
      }
    } else this.stepTimer = 0;
    this.player.root.position.x = Math.max(-46, Math.min(46, this.player.root.position.x));
    this.player.root.position.z = Math.max(-46, Math.min(46, this.player.root.position.z));
    this.player.animateWalking(x !== 0 || z !== 0, dt);
  }

  private updateVehicle(dt: number) {
    if (!this.activeVehicle) return;
    const forward = this.input.has("forward") ? 1 : this.input.has("back") ? -1 : 0;
    const turn = (this.input.has("right") ? 1 : 0) - (this.input.has("left") ? 1 : 0);
    this.activeVehicle.drive(forward, turn, dt);
    this.audio.setEngine(this.activeVehicle.speed, true);
    if (distanceXZ(this.activeVehicle.root.position, this.missionPosition()) < 3.2) this.completeCheckpoint();
  }

  private missionPosition() {
    return [new Vector3(-22, 0.15, -16), new Vector3(18, 0.15, -16), new Vector3(21, 0.15, 19)][this.missionIndex];
  }

  private completeCheckpoint() {
    if (this.missionIndex >= 3) return;
    this.audio.beep(760, 0.16, 0.045);
    this.cash += 350;
    this.respect += 4;
    this.missionIndex += 1;
    if (this.missionIndex >= 3) {
      this.missionIndex = 0;
      this.cash += 1000;
      this.respect += 5;
    }
    this.saveProgress();
    this.setMissionVisibility();
    this.updateHud();
  }

  private updateNpcs(dt: number) {
    this.npcs.forEach((npc) => {
      npc.phase += dt * npc.speed;
      npc.root.position.x = npc.origin.x + Math.sin(npc.phase) * 3.5;
      npc.root.position.z = npc.origin.z + Math.cos(npc.phase * 0.8) * 1.7;
      npc.root.rotation.y = npc.phase + Math.PI / 2;
    });
  }

  private updateCamera(dt: number) {
    const target = this.state === "driving" && this.activeVehicle ? this.activeVehicle.root.position.add(new Vector3(0, 1, 0)) : this.player.root.position.add(new Vector3(0, 1.2, 0));
    const angle = this.state === "driving" && this.activeVehicle ? this.activeVehicle.root.rotation.y : this.player.root.rotation.y;
    const distance = this.state === "driving" ? 14 : 13;
    const desired = target.add(new Vector3(-Math.sin(angle) * distance, this.state === "driving" ? 9.2 : 8.8, -Math.cos(angle) * distance));
    this.camera.position = Vector3.Lerp(this.camera.position, desired, Math.min(1, dt * 4.5));
    this.camera.setTarget(Vector3.Lerp(this.camera.getTarget(), target, Math.min(1, dt * 5)));
  }

  private updateDemo(dt: number) {
    if (!this.demo) return;
    this.demoTime += dt;
    if (this.demoTime > 1.2 && this.state === "onFoot") {
      const car = this.vehicles[0];
      this.player.root.position = car.root.position.add(new Vector3(0, 0, -2));
      this.enterVehicle(car);
    }
    if (this.demoTime > 1.5 && this.state === "driving" && this.activeVehicle) {
      this.activeVehicle.drive(1, Math.sin(this.demoTime * 0.35) * 0.6, dt);
      this.audio.setEngine(this.activeVehicle.speed, true);
      if (this.demoTime > 10) this.demoTime = 0;
    }
  }

  private updateHud() {
    const set = (id: string, value: string) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    set("cash", `R$ ${this.cash.toLocaleString("pt-BR")}`);
    set("respect", `${this.respect}%`);
    set("mode-pill", this.state === "driving" ? (this.activeVehicle?.kind ?? "VEÍCULO") : "A PÉ");
    set("enter-icon", this.state === "driving" ? "↩" : "E");
    const nearest = this.nearestVehicle();
    if (this.state === "driving") {
      set("context-text", `Dirija até o ponto ${this.missionIndex + 1} · H buzina`);
      set("context-icon", "⌁");
    } else if (this.nearbyService() === "garage") {
      set("context-text", "Oficina do Rei · E troca a pintura por R$ 500");
      set("context-icon", "✦");
    } else if (this.nearbyService() === "market") {
      set("context-text", "Mercado do Centro · E recebe o pagamento do dia");
      set("context-icon", "R$");
    } else if (nearest) {
      set("context-text", `Pressione E para entrar na ${nearest.kind.toLowerCase()}`);
      set("context-icon", "↗");
    } else {
      set("context-text", "Explore a cidade e encontre um veículo");
      set("context-icon", "✦");
    }
    set("mission-title", missionTitles[this.missionIndex] ?? missionTitles[0]);
    set("mission-copy", this.missionIndex >= 2 ? "Último farol: suba a avenida e faça história." : `Chegue ao ponto ${this.missionIndex + 1} antes da noite virar.`);
    const progress = document.getElementById("mission-progress");
    if (progress) (progress as HTMLElement).style.width = `${Math.max(8, (this.missionIndex / 3) * 100)}%`;
  }

  update(dt: number) {
    this.updateDemo(dt);
    if (this.state === "onFoot") this.updatePlayer(dt); else this.updateVehicle(dt);
    this.updateNpcs(dt);
    this.updateCamera(dt);
    this.updateHud();
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("game-input", this.onTouchInput);
    window.removeEventListener("game-action", this.onAction);
    this.audio.dispose();
  }
}

export async function createGameScene(engine: Engine, _canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  const world = new GameWorld(scene, _canvas);
  const observer = scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(0.05, scene.getEngine().getDeltaTime() / 1000);
    world.update(dt);
  });
  return {
    scene,
    dispose: () => {
      if (observer) scene.onBeforeRenderObservable.remove(observer);
      world.dispose();
      scene.dispose();
    },
  };
}
