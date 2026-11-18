"use client";

import { CameraControls, CameraControlsImpl, ContactShadows, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import type { MaterialCode } from "@wear3d/design-schema";
import {
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import type { GarmentDefinition } from "../catalog/types";
import { meshNameToZoneCode } from "../conventions";
import { MATERIAL_PRESETS } from "../materials";
import { VIEW_POSES, type LightingPreset, type ViewPreset } from "../presets";
import { LightingEnvironment } from "./environments";
import { createGlowTexture, weaveNormalMap } from "./textures";

/** Point touché sur le vêtement : zone et coordonnée UV d'atlas. */
export interface SurfaceHit {
  zone: string;
  u: number;
  v: number;
}

/**
 * Outil actif de la barre flottante :
 * select = sélection + glisser des calques + rotation sur le vide ;
 * move = glisser des calques uniquement ; pan = panoramique ; orbit = rotation seule.
 */
export type ViewerTool = "select" | "move" | "pan" | "orbit";

export interface GarmentViewerHandle {
  setView(view: ViewPreset, animate?: boolean): void;
  /** Azimut en degrés (0 = face), animé. */
  setAzimuth(degrees: number, animate?: boolean): void;
  /** Zoom avant (> 0) ou arrière (< 0). */
  zoom(step: number): void;
  /** Capture PNG du rendu courant (fond transparent). */
  capture(width?: number): Promise<Blob>;
  /** Miniatures (data URL) de plusieurs vues, sans déplacer la caméra principale. */
  snapshot(views: readonly ViewPreset[]): Record<string, string>;
}

export interface GarmentViewerProps {
  definition: GarmentDefinition;
  atlas: THREE.Texture;
  /** À incrémenter après chaque recomposition de l'atlas. */
  atlasVersion: number;
  materials: Record<string, MaterialCode>;
  lighting?: LightingPreset;
  hoveredZone?: string | null;
  selectedZone?: string | null;
  tool?: ViewerTool;
  showPodium?: boolean;
  autoRotate?: boolean;
  /** Désactive la caméra pendant un glisser de calque. */
  interacting?: boolean;
  /** Renvoie true pour capturer le geste (glisser un calque) : la caméra est coupée aussitôt. */
  onSurfaceDown?: (hit: SurfaceHit) => boolean | void;
  onSurfaceMove?: (hits: SurfaceHit[]) => void;
  onHoverZone?: (zone: string | null) => void;
  onAzimuthChange?: (degrees: number) => void;
  onMissed?: () => void;
  onReady?: () => void;
  className?: string;
}

function hitsFrom(e: ThreeEvent<PointerEvent>): SurfaceHit[] {
  const hits: SurfaceHit[] = [];
  for (const i of e.intersections) {
    const zone = i.object.userData.zone as string | undefined;
    if (zone && i.uv) hits.push({ zone, u: i.uv.x, v: i.uv.y });
  }
  return hits;
}

function GarmentModel({
  definition,
  atlas,
  atlasVersion,
  materials,
  hoveredZone,
  selectedZone,
  tool = "select",
  onSurfaceDown,
  onSurfaceMove,
  onHoverZone,
  onReady,
}: GarmentViewerProps) {
  const { scene } = useGLTF(definition.glbUrl);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useThree((s) => s.controls) as CameraControls | null;
  const editable = tool === "select" || tool === "move";

  // Copie de la scène et un matériau physique par zone.
  const { root, zoneMaterials } = useMemo(() => {
    const root = scene.clone(true);
    const zoneMaterials = new Map<string, THREE.MeshPhysicalMaterial>();
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const zone = meshNameToZoneCode(obj.name);
      if (!zone) return;
      const material = new THREE.MeshPhysicalMaterial({
        map: atlas,
        side: THREE.DoubleSide,
        // Sheen gris neutre : un sheen blanc plein éclaircit les tissus foncés (marine délavé).
        sheenColor: new THREE.Color("#6b6b6b"),
        emissive: new THREE.Color("#1f5eff"),
        emissiveIntensity: 0,
      });
      obj.material = material;
      obj.userData.zone = zone;
      obj.castShadow = true;
      zoneMaterials.set(zone, material);
    });
    return { root, zoneMaterials };
  }, [scene, atlas]);

  useEffect(() => () => zoneMaterials.forEach((m) => m.dispose()), [zoneMaterials]);

  // Propriétés de tissu par zone (CDC F-14, F-50).
  useEffect(() => {
    for (const [zone, material] of zoneMaterials) {
      const preset = MATERIAL_PRESETS[materials[zone] ?? "cotton"];
      material.roughness = preset.roughness;
      material.sheen = preset.sheen;
      material.sheenRoughness = preset.sheenRoughness;
      const normal = weaveNormalMap(preset.weave).clone();
      normal.repeat.set(preset.weaveRepeat, preset.weaveRepeat);
      normal.needsUpdate = true;
      material.normalMap?.dispose();
      material.normalMap = normal;
      material.normalScale.set(preset.normalScale, preset.normalScale);
      material.needsUpdate = true;
    }
    invalidate();
  }, [zoneMaterials, materials, invalidate]);

  // Survol et sélection (CDC F-12).
  useEffect(() => {
    for (const [zone, material] of zoneMaterials) {
      material.emissiveIntensity = zone === selectedZone ? 0.12 : zone === hoveredZone ? 0.07 : 0;
    }
    invalidate();
  }, [zoneMaterials, hoveredZone, selectedZone, invalidate]);

  useEffect(() => {
    atlas.needsUpdate = true;
    invalidate();
  }, [atlas, atlasVersion, invalidate]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <primitive
      object={root}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        if (!editable) return;
        const [hit] = hitsFrom(e);
        if (!hit) return;
        e.stopPropagation();
        // Le gestionnaire R3F s'exécute avant celui de CameraControls (même élément,
        // enregistré plus tôt) : désactiver ici empêche la rotation de démarrer.
        if (onSurfaceDown?.(hit) === true && controls) controls.enabled = false;
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (!editable) return;
        const hits = hitsFrom(e);
        if (hits.length) onSurfaceMove?.(hits);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (!editable) return;
        e.stopPropagation();
        onHoverZone?.((e.object.userData.zone as string | undefined) ?? null);
      }}
      onPointerOut={() => editable && onHoverZone?.(null)}
    />
  );
}

/** Podium lumineux de la maquette : disque sombre, anneau émissif et halo au sol. */
function Podium() {
  const glow = useMemo(() => createGlowTexture("#3b82f6"), []);
  useEffect(() => () => glow.dispose(), [glow]);
  return (
    <group position={[0, -0.47, 0]} name="podium">
      <mesh receiveShadow>
        <cylinderGeometry args={[0.52, 0.56, 0.07, 96]} />
        <meshPhysicalMaterial color="#16224a" metalness={0.75} roughness={0.25} clearcoat={1} />
      </mesh>
      {/* Plateau bleu nuit brillant (maquette). */}
      <mesh position={[0, 0.036, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[0.515, 96]} />
        <meshPhysicalMaterial
          color="#33447a"
          metalness={0.55}
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.036, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.516, 0.005, 10, 128]} />
        <meshBasicMaterial color="#8fb8ff" toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.03, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.565, 0.009, 12, 128]} />
        <meshBasicMaterial color="#5b9bff" toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.045, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.68, 0.004, 8, 128]} />
        <meshBasicMaterial color="#4c8dff" transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.05, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.7, 1.7]} />
        <meshBasicMaterial
          map={glow}
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Rotation automatique (aperçu) : maintient la boucle de rendu tant qu'elle est active. */
function AutoRotate({
  enabled,
  controls,
}: {
  enabled: boolean;
  controls: MutableRefObject<CameraControls | null>;
}) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (enabled) invalidate();
  }, [enabled, invalidate]);
  useFrame((_, dt) => {
    if (!enabled || !controls.current) return;
    controls.current.rotate(dt * 0.5, 0, false);
    invalidate();
  });
  return null;
}

/** Enregistre les fonctions impératives qui ont besoin du contexte R3F. */
function Bridge({
  controls,
  apiRef,
}: {
  controls: MutableRefObject<CameraControls | null>;
  apiRef: MutableRefObject<GarmentViewerHandle | null>;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    apiRef.current = {
      setView(view, animate = true) {
        const pose = VIEW_POSES[view];
        void controls.current?.setLookAt(...pose.position, ...pose.target, animate);
        invalidate();
      },
      setAzimuth(degrees, animate = true) {
        const c = controls.current;
        if (!c) return;
        // L'azimut interne est cumulatif (tours multiples) : on applique l'écart le plus
        // court depuis l'angle courant, sinon la caméra peut faire un tour complet.
        const tau = Math.PI * 2;
        const current = c.azimuthAngle;
        const desired = (degrees * Math.PI) / 180;
        const delta = ((((desired - current) % tau) + tau * 1.5) % tau) - Math.PI;
        void c.rotateTo(current + delta, c.polarAngle, animate);
        invalidate();
      },
      zoom(step) {
        void controls.current?.dolly(step * 0.35, true);
        invalidate();
      },
      async capture(width = 2048) {
        const previous = gl.getPixelRatio();
        gl.setPixelRatio(width / size.width);
        gl.setSize(size.width, size.height, false);
        gl.render(scene, camera);
        const blob = await new Promise<Blob | null>((resolve) =>
          gl.domElement.toBlob(resolve, "image/png"),
        );
        gl.setPixelRatio(previous);
        gl.setSize(size.width, size.height, false);
        invalidate();
        if (!blob) throw new Error("Capture impossible");
        return blob;
      },
      snapshot(views) {
        const out: Record<string, string> = {};
        const podium = scene.getObjectByName("podium");
        const wasVisible = podium?.visible ?? false;
        if (podium) podium.visible = false;
        const cam = (camera as THREE.PerspectiveCamera).clone();
        for (const view of views) {
          const pose = VIEW_POSES[view];
          // Cadrage serré sur le vêtement (sans podium).
          const k = 2.05 / Math.hypot(pose.position[0], pose.position[2]);
          cam.position.set(pose.position[0] * k, 0.04, pose.position[2] * k);
          cam.lookAt(0, -0.03, 0);
          cam.updateMatrixWorld();
          gl.render(scene, cam);
          out[view] = gl.domElement.toDataURL("image/webp", 0.7);
        }
        if (podium) podium.visible = wasVisible;
        gl.render(scene, camera);
        invalidate();
        return out;
      },
    };
  }, [apiRef, controls, gl, scene, camera, size, invalidate]);

  return null;
}

const ACTION = CameraControlsImpl.ACTION;

/**
 * Viewport 3D du studio (CDC F-10 à F-12) : rendu à la demande, rotation libre,
 * zoom et panoramique bornés, sélection de zone et glisser sur la surface.
 */
export const GarmentViewer = forwardRef<GarmentViewerHandle, GarmentViewerProps>(
  function GarmentViewer(props, ref) {
    const controls = useRef<CameraControls | null>(null);
    const api = useRef<GarmentViewerHandle | null>(null);
    const { tool = "select", interacting, onAzimuthChange } = props;

    useImperativeHandle(ref, () => ({
      setView: (view, animate) => api.current?.setView(view, animate),
      setAzimuth: (deg, animate) => api.current?.setAzimuth(deg, animate),
      zoom: (step) => api.current?.zoom(step),
      capture: (width) => {
        if (!api.current) return Promise.reject(new Error("Viewer non prêt"));
        return api.current.capture(width);
      },
      snapshot: (views) => api.current?.snapshot(views) ?? {},
    }));

    useEffect(() => {
      if (controls.current) controls.current.enabled = !interacting;
    }, [interacting]);

    // Bouton gauche selon l'outil actif.
    useEffect(() => {
      const c = controls.current;
      if (!c) return;
      c.mouseButtons.left =
        tool === "pan" ? ACTION.TRUCK : tool === "move" ? ACTION.NONE : ACTION.ROTATE;
      c.touches.one =
        tool === "pan" ? ACTION.TOUCH_TRUCK : tool === "move" ? ACTION.NONE : ACTION.TOUCH_ROTATE;
    }, [tool]);

    const front = VIEW_POSES.front;

    return (
      <Canvas
        className={props.className}
        frameloop="demand"
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        camera={{ position: front.position, fov: 30, near: 0.05, far: 20 }}
        onPointerMissed={() => props.onMissed?.()}
        onCreated={({ gl }) => {
          // Khronos PBR Neutral : conçu pour restituer fidèlement les couleurs produit.
          gl.toneMapping = THREE.NeutralToneMapping;
          gl.toneMappingExposure = 1;
        }}
      >
        <LightingEnvironment preset={props.lighting ?? "studio"} />
        <hemisphereLight args={["#ffffff", "#b9c3d6", 0.6]} />
        <directionalLight position={[-1.5, 2, 2.5]} intensity={1.2} castShadow />
        <directionalLight position={[2, 0.5, -2]} intensity={0.6} />
        <Suspense fallback={null}>
          <GarmentModel {...props} />
        </Suspense>
        {props.showPodium !== false && <Podium />}
        <ContactShadows
          position={[0, props.showPodium !== false ? -0.432 : -0.42, 0]}
          opacity={0.45}
          scale={1.2}
          blur={2.2}
          far={0.8}
          frames={1}
        />
        <CameraControls
          ref={controls}
          makeDefault
          minDistance={0.7}
          maxDistance={4}
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 2 + 0.1}
          dollySpeed={0.6}
          smoothTime={0.2}
          onUpdate={() => {
            const c = controls.current;
            if (!c || !onAzimuthChange) return;
            const deg = ((((c.azimuthAngle * 180) / Math.PI) % 360) + 360) % 360;
            onAzimuthChange(deg);
          }}
        />
        <AutoRotate enabled={Boolean(props.autoRotate)} controls={controls} />
        <Bridge controls={controls} apiRef={api} />
      </Canvas>
    );
  },
);

/** Précharge un modèle (ex. au survol d'une carte du catalogue). */
export function preloadGarment(definition: GarmentDefinition): void {
  useGLTF.preload(definition.glbUrl);
}
