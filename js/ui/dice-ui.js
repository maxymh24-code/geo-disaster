/**
 * 掷骰子按钮和结果显示
 */
export class DiceUI {
  constructor(onRoll) {
    this.container = document.getElementById('dice-area');
    this.btn = document.getElementById('btn-roll-dice');
    this.resultEl = document.getElementById('dice-result');
    this.onRoll = onRoll;
    this._hideTimer = null;
    this._turnId = 0; // 每次 show 递增，防止旧定时器干扰新回合

    this.btn.addEventListener('click', () => {
      if (!this.btn.disabled) {
        this.btn.disabled = true;
        this.onRoll?.();
      }
    });
  }

  show() {
    this._cancelTimer();
    this._turnId++;
    this.container.classList.remove('hidden');
    this.btn.disabled = false;
    this.btn.style.display = '';
    this.resultEl.textContent = '';
  }

  hide() {
    this._cancelTimer();
    this.container.classList.add('hidden');
  }

  showResult(value) {
    const myTurn = this._turnId;
    this.resultEl.textContent = value;
    this.btn.disabled = true;
    this.btn.style.display = 'none';

    this.resultEl.style.transform = 'scale(1.5)';
    setTimeout(() => {
      this.resultEl.style.transform = 'scale(1)';
    }, 200);

    this._cancelTimer();
    this._hideTimer = setTimeout(() => {
      this._hideTimer = null;
      // 只有在同一个回合时才隐藏
      if (this._turnId === myTurn) {
        this.hide();
      }
    }, 1200);
  }

  _cancelTimer() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  }
}
