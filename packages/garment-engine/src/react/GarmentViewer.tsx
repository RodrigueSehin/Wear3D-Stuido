"use client";

import { CameraControls, ContactShadows, useGLTF } from "@react-three/drei";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
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
import { weaveNormalMap } from "./textures";

/** Point touché sur le vêtement : zone et coordonnée UV d'atlas. */
export interface SurfaceHit {
  zone: string;
  u: number;
  v: number;
}

export interface GarmentViewerHandle {
  setView(view: ViewPreset, animate?: boolean): void;
  /** Capture PNG du rendu courant (fond transparent). */
  capture(width?: number): Promise<Blob>;
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
  /** Désactive la caméra pendant un glisser de calque. */
  interacting?: boolean;
  /** Renvoie true pour capturer le geste (glisser un calque) : la caméra est coupée aussitôt. */
  onSurfaceDown?: (hit: SurfaceHit) => boolean | void;
  onSurfaceMove?: (hits: SurfaceHit[]) => void;
  onHoverZone?: (zone: string | null) => void;
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
  onSurfaceDown,
  onSurfaceMove,
  onHoverZone,
  onReady,
}: GarmentViewerProps) {
  const { scene } = useGLTF(definition.glbUrl);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useThree((s) => s.controls) as CameraControls | null;

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
        const [hit] = hitsFrom(e);
        if (!hit) return;
        e.stopPropagation();
        // Le gestionnaire R3F s'exécute avant celui de CameraControls (même élément,
        // enregistré plus tôt) : désactiver ici empêche la rotation de démarrer.
        if (onSurfaceDown?.(hit) === true && controls) controls.enabled = false;
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        const hits = hitsFrom(e);
        if (hits.length) onSurfaceMove?.(hits);
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHoverZone?.((e.object.userData.zone as string | undefined) ?? null);
      }}
      onPointerOut={() => onHoverZone?.(null)}
    />
  );
}

/** Enregistre les fonctions impératives (vues, capture) qui ont besoin du contexte R3F. */
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
    };
  }, [apiRef, controls, gl, scene, camera, size, invalidate]);

  return null;
}

/**
 * Viewport 3D du studio (CDC F-10 à F-12) : rendu à la demande, rotation libre,
 * zoom et panoramique bornés, sélection de zone et glisser sur la surface.
 */
export const GarmentViewer = forwardRef<GarmentViewerHandle, GarmentViewerProps>(
  function GarmentViewer(props, ref) {
    const controls = useRef<CameraControls | null>(null);
    const api = useRef<GarmentViewerHandle | null>(null);

    useImperativeHandle(ref, () => ({
      setView: (view, animate) => api.current?.setView(view, animate),
      capture: (width) => {
        if (!api.current) return Promise.reject(new Error("Viewer non prêt"));
        return api.current.capture(width);
      },
    }));

    useEffect(() => {
      if (controls.current) controls.current.enabled = !props.interacting;
    }, [props.interacting]);

    const front = VIEW_POSES.front;

    return (
      <Canvas
        className={props.className}
        frameloop="demand"
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        camera={{ position: front.position, fov: 32, near: 0.05, far: 20 }}
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
        <ContactShadows
          position={[0, -0.42, 0]}
          opacity={0.35}
          scale={1.6}
          blur={2.4}
          far={0.8}
          frames={1}
        />
        <CameraControls
          ref={controls}
          makeDefault
          minDistance={0.6}
          maxDistance={3.5}
          dollySpeed={0.6}
          smoothTime={0.2}
        />
        <Bridge controls={controls} apiRef={api} />
      </Canvas>
    );
  },
);

/** Précharge un modèle (ex. au survol d'une carte du catalogue). */
export function preloadGarment(definition: GarmentDefinition): void {
  useGLTF.preload(definition.glbUrl);
}
