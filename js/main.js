/**
 * Main - ゲーム初期化 & イベントハンドリング v3.0
 * タブUI対応 + 新システム
 */
document.addEventListener('DOMContentLoaded', () => {
    // iOS Safari対策: vh計算
    const setVH = () => {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    
    // データ初期化
    GameData.init();
    
    // 画面要素
    const screens = {
        game: document.getElementById('game-screen'),
        result: document.getElementById('result-screen')
    };
    
    const mainApp = document.getElementById('main-app');
    const tabs = {
        gacha: document.getElementById('tab-gacha'),
        stage: document.getElementById('tab-stage'),
        home: document.getElementById('tab-home'),
        skill: document.getElementById('tab-skill'),
        collection: document.getElementById('tab-collection')
    };
    
    // モーダル
    const modals = {
        gachaResult: document.getElementById('gacha-result-modal'),
        skillDetail: document.getElementById('skill-detail-modal')
    };
    
    // ゲームインスタンス
    let game = null;
    let ai = null;
    const ui = new UI();
    
    // ゲーム設定
    let currentStage = 1;
    let currentGachaType = 'tile';
    
    // ========================================
    // 初期化
    // ========================================
    
    function init() {
        updateCurrencyDisplay();
        updateHomeStats();
        updateStageList();
        updateSkillInventory();
        updateSkinCollection();
        setupEventListeners();
    }
    
    // ========================================
    // UI更新関数
    // ========================================
    
    function updateCurrencyDisplay() {
        document.getElementById('crystal-count').textContent = GameData.getCrystal().toLocaleString();
        document.getElementById('sp-count').textContent = GameData.getSP().toLocaleString();
    }
    
    function updateHomeStats() {
        const highest = GameData.getHighestStage();
        document.getElementById('highest-stage').textContent = highest > 0 ? STAGES[highest - 1].name : '-';
        document.getElementById('total-damage').textContent = GameData.getTotalDamage().toLocaleString();
    }
    
    function updateStageList() {
        const stageItems = document.querySelectorAll('.stage-item');
        const highest = GameData.getHighestStage();
        
        stageItems.forEach((item, index) => {
            const stageId = index + 1;
            const isCleared = GameData.isStageCleared(stageId);
            const isUnlocked = stageId <= highest + 1;
            
            item.classList.toggle('cleared', isCleared);
            item.classList.toggle('locked', !isUnlocked);
            
            // 初回クリア報酬表示
            const rewardEl = item.querySelector('.stage-reward');
            if (isCleared) {
                rewardEl.textContent = '✓';
                rewardEl.style.color = 'var(--accent-green)';
            } else {
                rewardEl.textContent = '💎300';
                rewardEl.style.color = '';
            }
        });
    }
    
    function updateSkillInventory() {
        const container = document.getElementById('skill-inventory');
        const ownedSkills = GameData.getOwnedSkills();
        
        if (Object.keys(ownedSkills).length === 0) {
            container.innerHTML = '<div class="empty-message">スキルがありません<br>ガチャで入手しよう!</div>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(ownedSkills).forEach(([skillId, data]) => {
            if (data.count <= 0) return;
            
            const skill = SKILLS[skillId];
            if (!skill) return;
            
            const card = document.createElement('div');
            card.className = `skill-card rarity-${skill.rarity}`;
            card.dataset.skillId = skillId;
            card.innerHTML = `
                <span class="skill-icon">${skill.icon}</span>
                <span class="skill-stars">${'★'.repeat(skill.rarity)}</span>
                ${data.count > 1 ? `<span class="skill-count">×${data.count}</span>` : ''}
            `;
            
            card.addEventListener('click', () => openSkillDetail(skillId));
            container.appendChild(card);
        });
    }
    
    function updateSkinCollection() {
        const container = document.getElementById('skin-collection');
        const ownedSkins = GameData.getOwnedSkins();
        const equippedSkin = GameData.getEquippedSkin();
        
        if (ownedSkins.length === 0) {
            container.innerHTML = '<div class="empty-message">タイルセットがありません<br>ガチャで入手しよう!</div>';
            return;
        }
        
        container.innerHTML = '';
        
        ownedSkins.forEach(skinId => {
            const skin = TILE_SKINS[skinId];
            if (!skin) return;
            
            const card = document.createElement('div');
            card.className = 'skin-card' + (skinId === equippedSkin ? ' equipped' : '');
            card.dataset.skinId = skinId;
            card.innerHTML = `
                <div class="skin-name">${skin.name}</div>
                <div class="skin-preview-small">
                    <div class="mini-tile" style="background: var(--tile-2)">2</div>
                    <div class="mini-tile" style="background: var(--tile-8)">8</div>
                    <div class="mini-tile" style="background: var(--tile-128)">128</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                GameData.equipSkin(skinId);
                updateSkinCollection();
            });
            
            container.appendChild(card);
        });
    }
    
    function updateEquippedSkills() {
        const slots = document.querySelectorAll('.asset-slot');
        const equipped = GameData.getEquippedSkills();
        let totalCost = 0;
        
        slots.forEach((slot, index) => {
            const skillId = equipped[index];
            if (skillId && SKILLS[skillId]) {
                const skill = SKILLS[skillId];
                slot.textContent = skill.icon;
                slot.classList.add('filled');
                slot.classList.remove('empty');
                totalCost += skill.cost;
            } else {
                slot.textContent = '+';
                slot.classList.remove('filled');
                slot.classList.add('empty');
            }
        });
        
        document.getElementById('current-cost').textContent = totalCost;
        
        // コスト警告（20ぴったりでないと警告）
        const costDisplay = document.querySelector('.cost-display');
        if (totalCost !== 20 && equipped.length > 0) {
            costDisplay.style.color = 'var(--accent-red)';
        } else {
            costDisplay.style.color = '';
        }
    }
    
    // ========================================
    // タブ切り替え
    // ========================================
    
    function switchTab(tabName) {
        // タブコンテンツ切り替え
        Object.values(tabs).forEach(t => t.classList.remove('active'));
        tabs[tabName].classList.add('active');
        
        // タブボタン切り替え
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // タブ固有の更新
        if (tabName === 'skill') {
            updateSkillInventory();
            updateEquippedSkills();
        } else if (tabName === 'collection') {
            updateSkinCollection();
        } else if (tabName === 'stage') {
            updateStageList();
        }
    }
    
    // ========================================
    // 画面切り替え
    // ========================================
    
    function showScreen(screenName) {
        mainApp.style.display = 'none';
        Object.values(screens).forEach(s => s.classList.remove('active'));
        
        if (screenName === 'main') {
            mainApp.style.display = 'flex';
        } else {
            screens[screenName].classList.add('active');
        }
    }
    
    function showModal(modalName) {
        modals[modalName].classList.add('active');
    }
    
    function hideModal(modalName) {
        modals[modalName].classList.remove('active');
    }
    
    // ========================================
    // ガチャ
    // ========================================
    
    function rollGacha(count) {
        const cost = count === 1 ? 300 : 3000;
        const currency = currentGachaType === 'tile' ? 'crystal' : 'sp';
        
        // 通貨チェック
        const currentAmount = currency === 'crystal' ? GameData.getCrystal() : GameData.getSP();
        if (currentAmount < cost) {
            alert(currency === 'crystal' ? 'クリスタルが足りません！' : 'SPが足りません！');
            return;
        }
        
        // 消費
        if (currency === 'crystal') {
            GameData.spendCrystal(cost);
        } else {
            GameData.spendSP(cost);
        }
        
        // ガチャ実行
        const results = currentGachaType === 'tile' 
            ? GachaSystem.rollTileGacha(count)
            : GachaSystem.rollSkillGacha(count);
        
        // 結果表示
        showGachaResults(results);
        updateCurrencyDisplay();
    }
    
    function showGachaResults(results) {
        const container = document.getElementById('gacha-results');
        container.innerHTML = '';
        
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = `gacha-result-item rarity-${result.rarity}`;
            item.innerHTML = `
                <div class="item-icon">${result.type === 'skill' ? result.item.icon : '🎨'}</div>
                <div class="item-name">${result.item.name}</div>
                <div class="item-rarity">${'★'.repeat(result.rarity)}${result.isNew ? ' NEW!' : ''}</div>
            `;
            container.appendChild(item);
        });
        
        showModal('gachaResult');
    }
    
    // ========================================
    // スキル詳細
    // ========================================
    
    let currentDetailSkillId = null;
    
    function openSkillDetail(skillId) {
        currentDetailSkillId = skillId;
        const skill = SKILLS[skillId];
        if (!skill) return;
        
        document.getElementById('detail-skill-icon').textContent = skill.icon;
        document.getElementById('detail-skill-name').textContent = skill.name;
        document.getElementById('detail-skill-rarity').textContent = '★'.repeat(skill.rarity);
        document.getElementById('detail-skill-cost').textContent = `コスト: ${skill.cost}`;
        document.getElementById('detail-skill-desc').textContent = skill.description;
        
        // 売却価格
        const sellPrice = GachaSystem.sellPrices.skill[skill.rarity];
        document.getElementById('btn-sell-skill').textContent = `売却 (${sellPrice} SP)`;
        
        showModal('skillDetail');
    }
    
    function equipSkill(skillId) {
        const skill = SKILLS[skillId];
        if (!skill) return;
        
        const preset = GameData.getCurrentPreset();
        const equipped = [...GameData.getSkillPreset(preset)];
        
        // 既に装備済みチェック
        if (equipped.includes(skillId)) {
            alert('このスキルは既に装備しています');
            return;
        }
        
        // 空きスロットに追加
        const emptyIndex = equipped.findIndex(s => !s);
        if (emptyIndex === -1 && equipped.length >= 5) {
            alert('スロットがいっぱいです');
            return;
        }
        
        // コストチェック
        let totalCost = skill.cost;
        equipped.forEach(sid => {
            if (sid && SKILLS[sid]) {
                totalCost += SKILLS[sid].cost;
            }
        });
        
        if (totalCost > 20) {
            alert('コストオーバー！(最大20)');
            return;
        }
        
        // 装備
        if (emptyIndex !== -1) {
            equipped[emptyIndex] = skillId;
        } else {
            equipped.push(skillId);
        }
        
        GameData.setSkillPreset(preset, equipped);
        updateEquippedSkills();
        hideModal('skillDetail');
    }
    
    function sellSkill(skillId) {
        const skill = SKILLS[skillId];
        if (!skill) return;
        
        if (!confirm(`${skill.name}を売却しますか？`)) return;
        
        const sellPrice = GachaSystem.sellPrices.skill[skill.rarity];
        GameData.removeSkill(skillId, 1);
        GameData.addSP(sellPrice);
        
        updateCurrencyDisplay();
        updateSkillInventory();
        hideModal('skillDetail');
    }
    
    // ========================================
    // ゲーム
    // ========================================
    
    function startGame(stageId) {
        const stage = STAGES[stageId - 1];
        if (!stage) return;
        
        currentStage = stageId;
        
        game = new Game();
        ai = new AI(game, stage.cpuLevel);
        ui.init();
        ui.resetGame();
        
        // ★先に画面を表示してからボード初期化
        showScreen('game');
        
        game.init(
            document.getElementById('player-board'),
            document.getElementById('enemy-board'),
            stage.cpuLevel
        );
        
        // コールバック設定
        game.onHPChange = (target, hp) => ui.updateHP(target, hp);
        game.onScoreChange = (target, score) => ui.updateScore(target, score);
        game.onDamage = (target, amount) => ui.showDamage(target, amount);
        game.onInterferenceWarning = (count, timer) => ui.showInterferenceWarning(count, timer);
        game.onBoardReset = (target, clearedCount) => ui.showBoardReset(target, clearedCount);
        game.onBattleLog = (message, type) => ui.showBattleLog(message, type);
        game.onMatchPoint = (playerHP, enemyHP) => ui.updateMatchPoint(playerHP, enemyHP);
        game.onFreezeChange = (target, frozen) => ui.setFrozen(target, frozen);
        game.onSkillBullet = (caster, row, col, icon) => {
            const sourceBoard = caster === 'player' ? game.playerBoard : game.enemyBoard;
            ui.showSkillBullet(caster, row, col, icon, sourceBoard);
        };
        
        game.onGameOver = (winner, stats) => {
            ai.stop();
            showResult(winner, stats);
        };
        
        // UI初期化
        ui.updateHP('player', 5);
        ui.updateHP('enemy', 5);
        ui.updateScore('player', 0);
        ui.updateScore('enemy', 0);
        ui.setCPULevel(stage.cpuLevel);
        ui.showBattleLog(`STAGE ${stageId}: ${stage.name}`, '');
        
        ai.start();
    }
    
    function showResult(winner, stats) {
        const isVictory = winner === 'player';
        
        // SP計算（スコア / 300）
        const earnedSP = Math.floor(stats.playerScore / 300);
        
        document.getElementById('result-title').textContent = isVictory ? 'VICTORY!' : 'DEFEAT';
        document.getElementById('result-title').className = 'result-title ' + (isVictory ? 'victory' : 'defeat');
        document.getElementById('result-score').textContent = stats.playerScore.toLocaleString();
        document.getElementById('result-max-tile').textContent = stats.maxTile;
        document.getElementById('result-damage').textContent = stats.damageDealt;
        document.getElementById('result-sp').textContent = `+${earnedSP}`;
        
        // 報酬付与
        GameData.addSP(earnedSP);
        GameData.addTotalDamage(stats.damageDealt);
        
        // ステージクリア処理
        if (isVictory) {
            const isFirstClear = GameData.clearStage(currentStage);
            GameData.setHighestStage(currentStage);
            
            if (isFirstClear) {
                GameData.addCrystal(300);
            }
        }
        
        updateCurrencyDisplay();
        showScreen('result');
    }
    
    function endGame() {
        if (ai) ai.stop();
        if (game) game.stopGameLoop();
    }
    
    // ========================================
    // イベントリスナー設定
    // ========================================
    
    function setupEventListeners() {
        // タブ切り替え
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        
        // ホーム - VSボタン
        document.getElementById('btn-vs-battle').addEventListener('click', () => {
            switchTab('stage');
        });
        
        // ステージ選択
        document.querySelectorAll('.stage-item').forEach(item => {
            item.addEventListener('click', () => {
                if (item.classList.contains('locked')) return;
                startGame(parseInt(item.dataset.stage));
            });
        });
        
        // ガチャタイプ切り替え
        document.querySelectorAll('.gacha-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentGachaType = btn.dataset.type;
                document.querySelectorAll('.gacha-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 通貨表示切替
                const costDisplay = document.querySelectorAll('.gacha-btn-cost');
                const icon = currentGachaType === 'tile' ? '💎' : '⚡';
                costDisplay[0].textContent = `${icon} 300`;
                costDisplay[1].textContent = `${icon} 3000`;
            });
        });
        
        // ガチャボタン
        document.getElementById('btn-gacha-single').addEventListener('click', () => rollGacha(1));
        document.getElementById('btn-gacha-multi').addEventListener('click', () => rollGacha(11));
        
        // ガチャ結果閉じる
        document.getElementById('btn-close-gacha').addEventListener('click', () => {
            hideModal('gachaResult');
            if (currentGachaType === 'skill') {
                updateSkillInventory();
            } else {
                updateSkinCollection();
            }
        });
        
        // スキル詳細
        document.getElementById('btn-equip-skill').addEventListener('click', () => equipSkill(currentDetailSkillId));
        document.getElementById('btn-sell-skill').addEventListener('click', () => sellSkill(currentDetailSkillId));
        document.getElementById('btn-close-skill-detail').addEventListener('click', () => hideModal('skillDetail'));
        
        // プリセット切り替え
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                GameData.setCurrentPreset(parseInt(btn.dataset.preset) - 1);
                updateEquippedSkills();
            });
        });
        
        // 戻るボタン
        document.getElementById('btn-back').addEventListener('click', () => {
            endGame();
            showScreen('main');
            switchTab('home');
            updateHomeStats();
        });
        
        // リトライボタン
        document.getElementById('btn-retry').addEventListener('click', () => {
            startGame(currentStage);
        });
        
        // ホームへボタン
        document.getElementById('btn-home').addEventListener('click', () => {
            showScreen('main');
            switchTab('home');
            updateHomeStats();
            updateStageList();
        });
        
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            if (!game || game.isGameOver) return;
            if (!screens.game.classList.contains('active')) return;
            
            const keyMap = {
                'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
                'w': 'up', 's': 'down', 'a': 'left', 'd': 'right'
            };
            
            const direction = keyMap[e.key];
            if (direction) {
                e.preventDefault();
                game.playerMove(direction);
            }
        });
        
        // タッチ操作
        let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
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
            
            if (deltaTime < 200 && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) return;
            
            const minSwipe = 30;
            if (Math.abs(deltaX) < minSwipe && Math.abs(deltaY) < minSwipe) return;
            
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
            if (game && game.playerBoard) game.playerBoard.refreshTilePositions();
            if (game && game.enemyBoard) game.enemyBoard.refreshTilePositions();
        });
    }
    
    // 初期化実行
    init();
});
