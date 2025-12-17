/**
 * Main - ゲーム初期化 & イベントハンドリング v2.5
 * スキル: 合成時3%ランダム発動
 */
document.addEventListener('DOMContentLoaded', () => {
    // iOS Safari対策: vh計算
    const setVH = () => {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    
    // 画面要素
    const screens = {
        home: document.getElementById('home-screen'),
        game: document.getElementById('game-screen'),
        result: document.getElementById('result-screen')
    };
    
    // ゲームインスタンス
    let game = null;
    let ai = null;
    const ui = new UI();
    
    // 選択されたCPUレベル
    let selectedLevel = 3;
    
    /**
     * 画面切り替え
     */
    function showScreen(screenName) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[screenName].classList.add('active');
    }
    
    /**
     * ゲーム開始
     */
    function startGame() {
        game = new Game();
        ai = new AI(game, selectedLevel);
        ui.init();
        ui.resetGame();
        
        // ★先に画面を表示してからボード初期化（サイズ計算のため）
        showScreen('game');
        
        game.init(
            document.getElementById('player-board'),
            document.getElementById('enemy-board'),
            selectedLevel
        );
        
        // コールバック設定
        game.onHPChange = (target, hp) => {
            ui.updateHP(target, hp);
        };
        
        game.onScoreChange = (target, score) => {
            ui.updateScore(target, score);
        };
        
        game.onDamage = (target, amount) => {
            ui.showDamage(target, amount);
        };
        
        game.onInterferenceWarning = (count, timer) => {
            ui.showInterferenceWarning(count, timer);
        };
        
        game.onBoardReset = (target, clearedCount) => {
            ui.showBoardReset(target, clearedCount);
        };
        
        game.onBattleLog = (message, type) => {
            ui.showBattleLog(message, type);
        };
        
        game.onMatchPoint = (playerHP, enemyHP) => {
            ui.updateMatchPoint(playerHP, enemyHP);
        };
        
        game.onFreezeChange = (target, frozen) => {
            ui.setFrozen(target, frozen);
        };
        
        game.onSkillBullet = (caster, row, col, icon) => {
            const sourceBoard = caster === 'player' ? game.playerBoard : game.enemyBoard;
            ui.showSkillBullet(caster, row, col, icon, sourceBoard);
        };
        
        game.onGameOver = (winner, stats) => {
            ai.stop();
            showResult(winner, stats);
        };
        
        game.onEnemyBoardUpdate = () => {
            // 敵ボードの更新（自動的にDOMに反映済み）
        };
        
        // UI初期化
        ui.updateHP('player', 5);
        ui.updateHP('enemy', 5);
        ui.updateScore('player', 0);
        ui.updateScore('enemy', 0);
        ui.setCPULevel(selectedLevel);
        
        // AI開始
        ai.start();
        // showScreen('game'); // 上で先に呼び出し済み
    }
    
    /**
     * 結果表示
     */
    function showResult(winner, stats) {
        const isVictory = winner === 'player';
        
        document.getElementById('result-title').textContent = isVictory ? 'VICTORY!' : 'DEFEAT';
        document.getElementById('result-title').className = 'result-title ' + (isVictory ? 'victory' : 'defeat');
        document.getElementById('result-score').textContent = stats.playerScore;
        document.getElementById('result-max-tile').textContent = stats.maxTile;
        document.getElementById('result-damage').textContent = stats.damageDealt;
        
        showScreen('result');
    }
    
    /**
     * ゲーム終了
     */
    function endGame() {
        if (ai) ai.stop();
        if (game) game.stopGameLoop();
    }
    
    // ========================================
    // イベントリスナー
    // ========================================
    
    // CPUレベル選択
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedLevel = parseInt(btn.dataset.level);
        });
    });
    
    // CPU対戦ボタン
    document.getElementById('btn-cpu-battle').addEventListener('click', () => {
        startGame();
    });
    
    // 戻るボタン
    document.getElementById('btn-back').addEventListener('click', () => {
        endGame();
        showScreen('home');
    });
    
    // リトライボタン
    document.getElementById('btn-retry').addEventListener('click', () => {
        startGame();
    });
    
    // ホームへボタン
    document.getElementById('btn-home').addEventListener('click', () => {
        showScreen('home');
    });
    
    // キーボード操作
    document.addEventListener('keydown', (e) => {
        if (!game || game.isGameOver) return;
        if (!screens.game.classList.contains('active')) return;
        
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            's': 'down',
            'a': 'left',
            'd': 'right'
        };
        
        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            game.playerMove(direction);
        }
    });
    
    // タッチ操作
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    
    const playerBoard = document.getElementById('player-board');
    
    playerBoard.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
    }, { passive: true });
    
    playerBoard.addEventListener('touchend', (e) => {
        if (!game || game.isGameOver) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const deltaTime = Date.now() - touchStartTime;
        
        // 短いタップはタイルクリックとして処理（攻撃用）
        if (deltaTime < 200 && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
            return;
        }
        
        const minSwipe = 30;
        
        if (Math.abs(deltaX) < minSwipe && Math.abs(deltaY) < minSwipe) {
            return;
        }
        
        let direction;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
        } else {
            direction = deltaY > 0 ? 'down' : 'up';
        }
        
        game.playerMove(direction);
    }, { passive: true });
    
    // リサイズ対応
    window.addEventListener('resize', () => {
        if (game && game.playerBoard) {
            game.playerBoard.refreshTilePositions();
        }
        if (game && game.enemyBoard) {
            game.enemyBoard.refreshTilePositions();
        }
    });
});
