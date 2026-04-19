/**
 * 游戏结算界面
 */
export class ResultScreen {
  constructor(onBackMenu) {
    this.container = document.getElementById('result-screen');
    this.content = document.getElementById('result-content');
    this.btnBack = document.getElementById('btn-back-menu');

    this.btnBack.addEventListener('click', () => {
      this.hide();
      onBackMenu?.();
    });
  }

  show(rankings) {
    let html = '';

    rankings.forEach((player, index) => {
      const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      const status = player.isAlive ? `HP: ${player.hp}` : '已淘汰';
      html += `<div>${medal} 第${index + 1}名: ${player.name} — ${status}</div>`;
    });

    this.content.innerHTML = html;
    this.container.classList.remove('hidden');
  }

  hide() {
    this.container.classList.add('hidden');
  }
}
