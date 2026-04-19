/**
 * 灾害卡弹窗 / 固定灾害事件提示 / 安全点提示
 * 每次显示都返回一个 Promise，点击"确定"后 resolve
 */
export class CardPopup {
  constructor() {
    this.container = document.getElementById('card-popup');
    this.content = document.getElementById('card-content');
    this._resolve = null;
  }

  /**
   * 显示抽到的灾害卡，返回 Promise（用户点确定后 resolve）
   */
  show(card, logs) {
    const effectText = logs.map(l => `${l.player}: ${l.text}`).join('<br>');
    const isHeal = card.type === 'heal' || card.type === 'shield';

    this.content.innerHTML = `
      <h3>${card.name}</h3>
      <div class="card-type">${this._typeLabel(card.type)}</div>
      <div class="card-desc">${card.description}</div>
      <div class="card-effect ${isHeal ? 'heal' : ''}">${effectText}</div>
      <button class="card-dismiss-btn">确定</button>
    `;

    this.container.classList.remove('hidden');
    return this._waitForDismiss();
  }

  /**
   * 显示固定灾害事件
   */
  showDisaster(disaster, logs) {
    const effectText = logs.map(l => `${l.player}: ${l.text}`).join('<br>');

    this.content.innerHTML = `
      <h3>${disaster.name}</h3>
      <div class="card-type">固定灾害</div>
      <div class="card-desc">${disaster.description}</div>
      <div class="card-effect">${effectText}</div>
      <button class="card-dismiss-btn">确定</button>
    `;

    this.container.classList.remove('hidden');
    return this._waitForDismiss();
  }

  /**
   * 显示安全点回血
   */
  showSafe(logs) {
    const effectText = logs.map(l => `${l.player}: ${l.text}`).join('<br>');

    this.content.innerHTML = `
      <h3>安全区域</h3>
      <div class="card-type">补给站</div>
      <div class="card-desc">你找到了一处安全的补给站。</div>
      <div class="card-effect heal">${effectText}</div>
      <button class="card-dismiss-btn">确定</button>
    `;

    this.container.classList.remove('hidden');
    return this._waitForDismiss();
  }

  _waitForDismiss() {
    return new Promise((resolve) => {
      this._resolve = resolve;
      // 按钮点击
      const btn = this.content.querySelector('.card-dismiss-btn');
      if (btn) {
        btn.addEventListener('click', () => this._dismiss(), { once: true });
      }
      // 点击背景也可关闭
      const bgHandler = (e) => {
        if (e.target === this.container) {
          this.container.removeEventListener('click', bgHandler);
          this._dismiss();
        }
      };
      this.container.addEventListener('click', bgHandler);
    });
  }

  _dismiss() {
    this.container.classList.add('hidden');
    if (this._resolve) {
      this._resolve();
      this._resolve = null;
    }
  }

  _typeLabel(type) {
    const labels = {
      earthquake: '地震', volcano: '火山', tsunami: '海啸',
      blizzard: '暴风雪', landslide: '滑坡', sinkhole: '天坑',
      wildfire: '野火', flood: '洪水', heal: '补给', shield: '防护',
    };
    return labels[type] || type;
  }
}
