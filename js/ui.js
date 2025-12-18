/**
 * UI - ユーザーインターフェース管理 v2.6
 * スキル弾演出対応
 */
class UI {
    constructor() {
        this.elements = {};
    }

    init() {
        this.elements = {
            playerHPFill: document.getElementById('player-hp-fill'),
            playerHPText: document.getElementById('player-hp-text'),
            enemyHPFill: document.getElementById('enemy-hp-fill'),
            enemyHPText: document.getElementById('enemy-hp-text'),
            playerScore: document.getElementById('player-score'),
            enemyScore: document.getElementById('enemy-score'),
            playerBoard: document.getElementById('player-board'),
            enemyBoard: document.getElementById('enemy-board'),
            warningBar: document.getElementById('warning-bar'),
            warningTimer: document.getElementById('warning-timer'),
            warningQueue: document.getElementById('warning-queue'),
            cpuLevelDisplay: document.getElementById('cpu-level-display'),
            battleLog: document.getElementById('battle-log'),
            playerArea: document.querySelector('.player-area'),
            enemyArea: document.querySelector('.enemy-area'),
            gameContainer: document.querySelector('.game-container')
        };
    }

    updateHP(target, hp, maxHP = 5) {
        const fill = target === 'player' ? this.elements.playerHPFill : this.elements.enemyHPFill;
        const text = target === 'player' ? this.elements.playerHPText : this.elements.enemyHPText;
        
        if (fill && text) {
            const percent = (hp / maxHP) * 100;
            fill.style.width = `${percent}%`;
            text.textContent = hp;
        }
    }

    updateScore(target, score) {
        const el = target === 'player' ? this.elements.playerScore : this.elements.enemyScore;
        if (el) {
            el.textContent = score;
        }
    }

    showDamage(target, amount) {
        const effect = document.createElement('div');
        effect.className = 'damage-effect';
        effect.textContent = `-${amount}`;
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 800);
    }

    showInterferenceWarning(count, timer) {
        const bar = this.elements.warningBar;
        const timerEl = this.elements.warningTimer;
        const queue = this.elements.warningQueue;
        
        if (!bar) return;
        
        if (count > 0) {
            bar.classList.add('active');
            if (timerEl) timerEl.textContent = timer.toFixed(1);
            
            if (queue) {
                queue.innerHTML = '';
                for (let i = 0; i < count; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'warning-dot';
                    queue.appendChild(dot);
                }
            }
        } else {
            bar.classList.remove('active');
        }
    }

    showBoardReset(target, clearedCount) {
        const board = target === 'player' ? this.elements.playerBoard : this.elements.enemyBoard;
        if (!board) return;
        
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 136, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Orbitron', sans-serif;
            font-size: 1.2rem;
            font-weight: 900;
            color: white;
            text-shadow: 0 0 10px #ff8800;
            border-radius: 10px;
            z-index: 100;
            flex-direction: column;
            gap: 5px;
        `;
        flash.innerHTML = `<span>CLEAR 2s!</span><span style="font-size:0.8rem">×${clearedCount}</span>`;
        board.appendChild(flash);
        
        setTimeout(() => {
            flash.remove();
        }, 1000);
    }

    showBattleLog(message, type = '', iconPath = null) {
        const log = this.elements.battleLog;
        if (!log) return;
        
        log.style.animation = 'none';
        log.offsetHeight;
        log.style.animation = '';
        
        log.className = 'battle-log';
        if (type) {
            log.classList.add(type);
        }
        
        // アイコンパスがあれば画像表示
        if (iconPath) {
            log.innerHTML = `<img src="${iconPath}" alt="" class="log-skill-icon">${message}`;
        } else {
            log.textContent = message;
        }
    }

    updateMatchPoint(playerHP, enemyHP) {
        const playerBoard = this.elements.playerBoard;
        const enemyBoard = this.elements.enemyBoard;
        
        if (!playerBoard || !enemyBoard) return;
        
        if (enemyHP === 1) {
            enemyBoard.classList.add('match-point');
        } else {
            enemyBoard.classList.remove('match-point');
        }
        
        if (playerHP === 1) {
            playerBoard.classList.add('match-point');
        } else {
            playerBoard.classList.remove('match-point');
        }
    }

    setFrozen(target, frozen) {
        const area = target === 'player' ? this.elements.playerArea : this.elements.enemyArea;
        if (!area) return;
        
        if (frozen) {
            area.classList.add('frozen');
        } else {
            area.classList.remove('frozen');
        }
    }

    /**
     * スキル弾演出
     * @param {string} caster - 'player' or 'enemy'
     * @param {number} row - 合成位置の行
     * @param {number} col - 合成位置の列
     * @param {string} icon - スキルアイコン
     * @param {Board} sourceBoard - 発動元のボード
     */
    showSkillBullet(caster, row, col, icon, sourceBoard) {
        const isPlayer = caster === 'player';
        const fromBoard = isPlayer ? this.elements.playerBoard : this.elements.enemyBoard;
        const toBoard = isPlayer ? this.elements.enemyBoard : this.elements.playerBoard;
        
        if (!fromBoard || !toBoard || !sourceBoard) return;
        
        // 発動元タイルの位置を取得
        const tilePos = sourceBoard.getTilePosition(row, col);
        const fromRect = fromBoard.getBoundingClientRect();
        const toRect = toBoard.getBoundingClientRect();
        const containerRect = this.elements.gameContainer.getBoundingClientRect();
        
        // 開始位置（タイルの中心）
        const startX = fromRect.left - containerRect.left + tilePos.left + tilePos.size / 2;
        const startY = fromRect.top - containerRect.top + tilePos.top + tilePos.size / 2;
        
        // 終了位置（相手盤面の中心）
        const endX = toRect.left - containerRect.left + toRect.width / 2;
        const endY = toRect.top - containerRect.top + toRect.height / 2;
        
        // 弾を作成
        const bullet = document.createElement('div');
        bullet.className = 'skill-bullet ' + (isPlayer ? 'player-bullet' : 'enemy-bullet');
        // iconがパス(sprite/xxx.png)なら画像表示
        if (icon && icon.includes('/')) {
            bullet.innerHTML = `<img src="${icon}" alt="">`;
        } else {
            bullet.textContent = icon || '⚡';
        }
        bullet.style.left = `${startX}px`;
        bullet.style.top = `${startY}px`;
        bullet.style.setProperty('--end-x', `${endX - startX}px`);
        bullet.style.setProperty('--end-y', `${endY - startY}px`);
        
        this.elements.gameContainer.appendChild(bullet);
        
        // アニメーション終了後に削除
        setTimeout(() => {
            bullet.remove();
        }, 500);
    }

    setCPULevel(level) {
        if (this.elements.cpuLevelDisplay) {
            this.elements.cpuLevelDisplay.textContent = `CPU Lv.${level}`;
        }
    }

    resetGame() {
        if (this.elements.playerBoard) {
            this.elements.playerBoard.classList.remove('match-point');
        }
        if (this.elements.enemyBoard) {
            this.elements.enemyBoard.classList.remove('match-point');
        }
        if (this.elements.playerArea) {
            this.elements.playerArea.classList.remove('frozen');
        }
        if (this.elements.enemyArea) {
            this.elements.enemyArea.classList.remove('frozen');
        }
        
        this.showBattleLog('GAME START!', '');
        
        if (this.elements.warningBar) {
            this.elements.warningBar.classList.remove('active');
        }
    }
}
