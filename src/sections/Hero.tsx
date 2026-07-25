import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { useSiteData } from '../admin/store/SiteDataContext';

const godrayVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const godrayFragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float time;
uniform vec3 lightPosition;
uniform float rayIntensity;
uniform vec3 color1;
uniform vec3 color2;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  vec3 viewDir = normalize(cameraPosition - vPosition);
  vec3 lightDir = normalize(lightPosition - vPosition);
  float lightDist = length(lightPosition - vPosition);
  float attenuation = 1.0 / (1.0 + 0.1 * lightDist + 0.01 * lightDist * lightDist);
  float coneAngle = dot(lightDir, viewDir);
  float coneMask = smoothstep(0.9, 1.0, coneAngle);
  vec3 rayColor = mix(color1, color2, 0.5 + 0.5 * sin(time * 0.5 + vPosition.x * 0.1));
  float intensity = coneMask * attenuation * rayIntensity;
  vec3 rayPos = vPosition;
  float marchStep = 0.5;
  for (int i = 0; i < 20; i++) {
    rayPos += lightDir * marchStep;
    float noise = random(rayPos.xy + time * 0.1);
    intensity -= noise * 0.02;
  }
  intensity = max(intensity, 0.0);
  intensity *= (0.8 + 0.2 * sin(time * 2.0));
  gl_FragColor = vec4(rayColor, intensity * 0.5);
}
`;

export default function Hero() {
  const { frontpage } = useSiteData();
  const heroText = frontpage?.hero?.text || 'BECOME A PART OF THE WORLD';
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || cleanupRef.current) return;
    let time = 0;
    let animationId: number;
    let disposed = false;

    const width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight;
    if (!height) {
      if (window.innerWidth >= 1024) {
        height = 700;
      } else if (window.innerWidth >= 768) {
        height = window.innerHeight * 0.8;
      } else {
        height = window.innerHeight * 0.6;
      }
    }

    // Scene setup
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Reveal animation — fade canvas in after setup
    gsap.fromTo(
      container,
      { opacity: 0 },
      { opacity: 1, duration: 1.5, ease: 'power2.out', delay: 0.3 }
    );

    // Mouse tracking
    let mousePos = new THREE.Vector3(5, 5, 5);
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const vector = new THREE.Vector3(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(relativeY / rect.height) * 2 + 1,
        0.5
      );
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(distance));
      mousePos.set(pos.x, pos.y, 5);
    };
    document.addEventListener('mousemove', handleMouseMove);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Shared godray material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        lightPosition: { value: new THREE.Vector3(5, 5, 5) },
        rayIntensity: { value: 1.5 },
        color1: { value: new THREE.Color(0xE30614) },
        color2: { value: new THREE.Color(0x050505) },
      },
      vertexShader: godrayVertexShader,
      fragmentShader: godrayFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const letterMeshes: THREE.Mesh[] = [];
    let lightMesh: THREE.Mesh;

    // Font loading
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
      (font) => {
        if (disposed) return;

        const fullText = heroText;
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
          // Dynamically split text into two lines on mobile
          const words = fullText.split(' ');
          let line1 = fullText;
          let line2 = '';
          if (words.length > 1) {
            const mid = Math.floor(words.length / 2);
            line1 = words.slice(0, mid).join(' ');
            line2 = words.slice(mid).join(' ');
          }
          const charWidth = 1.8;
          const lineHeight = 2.2;

          [line1, line2].forEach((line, lineIdx) => {
            if (!line) return;
            const totalWidth = line.length * charWidth;
            let currentX = -totalWidth / 2;
            const yOffset = (lineIdx === 0 ? 1 : -1) * lineHeight;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === ' ') {
                currentX += 1.0;
                continue;
              }
              const textGeo = new TextGeometry(char, {
                font: font,
                size: 1.2,
                depth: 0.3,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5,
              });
              textGeo.computeBoundingBox();
              textGeo.center();
              const charMesh = new THREE.Mesh(textGeo, material.clone());
              charMesh.material = material;
              charMesh.position.set(currentX, yOffset, 0);
              scene.add(charMesh);
              letterMeshes.push(charMesh);
              currentX += 2.0;
            }
          });

          // Reduce intensity for mobile
          material.uniforms.rayIntensity.value = 1.1;
          camera.position.z = 20;
        } else {
          // Single line desktop
          const totalWidth = fullText.length * 1.8;
          let currentX = -totalWidth / 2;

          for (let i = 0; i < fullText.length; i++) {
            const char = fullText[i];
            if (char === ' ') {
              currentX += 1.0;
              continue;
            }
            const textGeo = new TextGeometry(char, {
              font: font,
              size: 1.5,
              depth: 0.4,
              curveSegments: 12,
              bevelEnabled: true,
              bevelThickness: 0.03,
              bevelSize: 0.02,
              bevelOffset: 0,
              bevelSegments: 5,
            });
            textGeo.computeBoundingBox();
            textGeo.center();
            const charMesh = new THREE.Mesh(textGeo, material);
            charMesh.position.set(currentX, 0, 0);
            scene.add(charMesh);
            letterMeshes.push(charMesh);
            currentX += 2.2;
          }
        }

        // Light mesh
        lightMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.1, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        lightMesh.position.set(5, 5, 5);
        scene.add(lightMesh);

        animate();
      }
    );

    function animate() {
      if (disposed) return;
      animationId = requestAnimationFrame(animate);

      letterMeshes.forEach((mesh, index) => {
        mesh.position.y += Math.sin(time * 0.5 + index * 0.3) * 0.002;
        mesh.rotation.y = Math.sin(time * 0.3 + index * 0.2) * 0.1;
      });

      time += 0.01;
      material.uniforms.time.value = time;
      material.uniforms.lightPosition.value.lerp(mousePos, 0.05);

      if (lightMesh) {
        lightMesh.position.copy(material.uniforms.lightPosition.value);
      }

      renderer.render(scene, camera);
    }

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      let h = container.clientHeight;
      if (!h) {
        if (window.innerWidth >= 1024) {
          h = 700;
        } else if (window.innerWidth >= 768) {
          h = window.innerHeight * 0.8;
        } else {
          h = window.innerHeight * 0.6;
        }
      }
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    cleanupRef.current = () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      material.dispose();
      letterMeshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [heroText]);

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative w-full overflow-hidden min-h-[100svh]"
      style={{ backgroundColor: '#050505' }}
    >
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* Three.js Canvas Container */}
      <div
        ref={canvasContainerRef}
        id="hero-canvas-container"
        className="absolute inset-0"
        style={{ zIndex: 1 }}
      />

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background: 'radial-gradient(circle, transparent 40%, rgba(5,5,5,0.6) 100%)',
        }}
      />

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        style={{ zIndex: 3 }}
      >
        <div className="relative w-[1px] h-10 bg-[rgba(246,246,246,0.3)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-[#F6F6F6] animate-scroll-dot" />
        </div>
        <span className="font-inter text-[11px] font-normal tracking-[0.05em] text-[rgba(246,246,246,0.6)]">
          SCROLL
        </span>
      </div>
    </section>
  );
}