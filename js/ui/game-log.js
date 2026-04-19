/**
 * 游戏日志面板
 */
export class GameLog {
  constructor() {
    this.container = document.getElementById('game-log');
    this.maxEntries = 50;
  }

  addEntry(text) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = text;
    this.container.appendChild(entry);

    // 限制条目数
    while (this.container.children.length > this.maxEntries) {
      this.container.removeChild(this.container.firstChild);
    }

    // 自动滚动到底部
    this.container.scrollTop = this.container.scrollHeight;
  }

  clear() {
    this.container.innerHTML = '';
  }
}
