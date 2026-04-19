import { getNodeById } from '../engine/map-data.js';

/**
 * 分叉路线选择 UI
 */
export class ForkChoice {
  constructor(onChoose) {
    this.container = document.getElementById('fork-choice');
    this.optionsEl = document.getElementById('fork-options');
    this.onChoose = onChoose;
  }

  show(nodeIds) {
    this.optionsEl.innerHTML = '';

    for (const nodeId of nodeIds) {
      const node = getNodeById(nodeId);
      const btn = document.createElement('button');

      let label = `节点 ${nodeId}`;
      if (node) {
        if (node.label) label = node.label;
        else if (node.terrain) label = `${this._terrainLabel(node.terrain)} (${nodeId})`;
      }

      btn.textContent = label;
      btn.addEventListener('click', () => {
        this.onChoose?.(nodeId);
      });
      this.optionsEl.appendChild(btn);
    }

    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }

  _terrainLabel(terrain) {
    const labels = {
      plains: '平原', forest: '森林', plateau: '高原',
      volcano: '火山', glacier: '冰川', ocean: '海洋', desert: '沙漠',
    };
    return labels[terrain] || terrain;
  }
}
