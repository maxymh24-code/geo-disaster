import { CAMERA_CONFIG } from '../config.js';

/**
 * 轨道相机控制器
 * 支持鼠标拖拽旋转、滚轮缩放、右键平移
 */
export class CameraController {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.cfg = CAMERA_CONFIG;

    // 球坐标参数
    this.distance = this.cfg.initialDistance;
    this.polarAngle = this.cfg.initialPolarAngle;  // 垂直角（0=顶部, PI/2=水平）
    this.azimuthAngle = Math.PI / 4;                // 水平角

    // 目标点
    this.target = { x: 0, y: 0, z: 0 };

    // 交互状态
    this._isDragging = false;
    this._isPanning = false;
    this._lastMouse = { x: 0, y: 0 };

    this._bindEvents();
    this._updateCamera();
  }

  _bindEvents() {
    const el = this.domElement;

    el.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this._isDragging = true;
      } else if (e.button === 2) {
        this._isPanning = true;
      }
      this._lastMouse.x = e.clientX;
      this._lastMouse.y = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX - this._lastMouse.x;
      const dy = e.clientY - this._lastMouse.y;
      this._lastMouse.x = e.clientX;
      this._lastMouse.y = e.clientY;

      if (this._isDragging) {
        this.azimuthAngle -= dx * this.cfg.rotateSpeed;
        this.polarAngle = Math.max(
          this.cfg.minPolarAngle,
          Math.min(this.cfg.maxPolarAngle,
            this.polarAngle - dy * this.cfg.rotateSpeed)
        );
        this._updateCamera();
      }

      if (this._isPanning) {
        const panScale = this.distance * this.cfg.panSpeed * 0.003;
        // 计算相机的右向量和上向量用于平移
        const cosA = Math.cos(this.azimuthAngle);
        const sinA = Math.sin(this.azimuthAngle);
        this.target.x += (-dx * cosA - dy * sinA * Math.cos(this.polarAngle)) * panScale;
        this.target.z += (dx * sinA - dy * cosA * Math.cos(this.polarAngle)) * panScale;
        this.target.y += dy * Math.sin(this.polarAngle) * panScale;
        this._updateCamera();
      }
    });

    window.addEventListener('mouseup', () => {
      this._isDragging = false;
      this._isPanning = false;
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * this.cfg.zoomSpeed;
      this.distance = Math.max(
        this.cfg.minDistance,
        Math.min(this.cfg.maxDistance,
          this.distance + zoomDelta)
      );
      this._updateCamera();
    }, { passive: false });

    el.addEventListener('contextmenu', (e) => e.preventDefault());

    // 触摸支持
    let lastTouchDist = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;

    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    });

    el.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastTouchX;
        const dy = e.touches[0].clientY - lastTouchY;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;

        this.azimuthAngle -= dx * this.cfg.rotateSpeed;
        this.polarAngle = Math.max(
          this.cfg.minPolarAngle,
          Math.min(this.cfg.maxPolarAngle,
            this.polarAngle - dy * this.cfg.rotateSpeed)
        );
        this._updateCamera();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delta = (lastTouchDist - dist) * this.cfg.zoomSpeed * 0.5;
        lastTouchDist = dist;

        this.distance = Math.max(
          this.cfg.minDistance,
          Math.min(this.cfg.maxDistance, this.distance + delta)
        );
        this._updateCamera();
      }
    }, { passive: false });
  }

  _updateCamera() {
    const sinP = Math.sin(this.polarAngle);
    const cosP = Math.cos(this.polarAngle);
    const sinA = Math.sin(this.azimuthAngle);
    const cosA = Math.cos(this.azimuthAngle);

    this.camera.position.set(
      this.target.x + this.distance * sinP * sinA,
      this.target.y + this.distance * cosP,
      this.target.z + this.distance * sinP * cosA
    );

    this.camera.lookAt(this.target.x, this.target.y, this.target.z);
  }

  /**
   * 平滑飞到目标位置
   */
  flyTo(x, y, z, duration = 1) {
    // 后续用 GSAP 实现平滑动画
    this.target.x = x;
    this.target.y = y;
    this.target.z = z;
    this._updateCamera();
  }
}
