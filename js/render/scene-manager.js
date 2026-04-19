import * as THREE from 'three';
import { RENDER_CONFIG, CAMERA_CONFIG } from '../config.js';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, RENDER_CONFIG.fogNear, RENDER_CONFIG.fogFar);

    // 相机
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov, aspect, CAMERA_CONFIG.near, CAMERA_CONFIG.far
    );

    // 灯光
    this._setupLights();

    // 天空
    this._setupSky();

    // resize
    window.addEventListener('resize', () => this._onResize());
  }

  _setupLights() {
    // 环境光
    this.ambientLight = new THREE.AmbientLight(0xB0C4DE, RENDER_CONFIG.ambientIntensity);
    this.scene.add(this.ambientLight);

    // 平行光 (太阳)
    const [sx, sy, sz] = RENDER_CONFIG.sunPosition;
    this.sunLight = new THREE.DirectionalLight(0xFFF5E0, RENDER_CONFIG.sunIntensity);
    this.sunLight.position.set(sx, sy, sz);
    this.sunLight.castShadow = true;

    const s = RENDER_CONFIG.shadowMapSize;
    this.sunLight.shadow.mapSize.set(s, s);
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);

    // 半球光（天空/地面色差）
    this.hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4a6741, 0.3);
    this.scene.add(this.hemiLight);
  }

  _setupSky() {
    // 渐变天空球
    const skyGeo = new THREE.SphereGeometry(400, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0x87CEEB) },
        offset: { value: 20 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
