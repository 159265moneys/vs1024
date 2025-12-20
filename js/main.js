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
        result: document.getElementById('result-screen'),
        'gacha-animation': document.getElementById('gacha-animation-screen'),
        'gacha-result': document.getElementById('gacha-result-screen')
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
        skillDetail: document.getElementById('skill-detail-modal'),
        presetSelect: document.getElementById('preset-select-modal')
    };
    
    // ゲームインスタンス
    let game = null;
    let ai = null;
    const ui = new UI();
    
    // ゲーム設定
    let currentStage = 1;
    let currentGachaType = 'tile';
    let currentSort = 'rarity'; // レア順 / コスト順 / 種類順
    let pendingStageId = null; // バトル開始待ちのステージID
    
    // ========================================
    // 初期化
    // ========================================
    
    function init() {
        updateCurrencyDisplay();
        updateHomeStats();
        updateStageList();
        updateSkillInventory();
        updateTileCollection();
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
        const equippedSkills = GameData.getEquippedSkills();
        
        // 全スキルをIDリストで取得
        const allSkillIds = Object.keys(SKILLS);
        
        // 所持スキル（レベル別に展開）と未所持スキルを分離
        const ownedCards = [];  // { skillId, level, count }
        const notOwnedIds = [];
        
        allSkillIds.forEach(skillId => {
            const levelDetails = GameData.getSkillLevelDetails(skillId);
            const hasAny = Object.values(levelDetails).some(count => count > 0);
            
            if (hasAny) {
                // レベル別にカードを生成（高レベル順）
                const levels = Object.keys(levelDetails).map(Number).sort((a, b) => b - a);
                levels.forEach(level => {
                    const count = levelDetails[level];
                    if (count > 0) {
                        ownedCards.push({ skillId, level, count });
                    }
                });
            } else {
                notOwnedIds.push(skillId);
            }
        });
        
        // ソート関数（所持カード用）
        const sortOwnedFn = (a, b) => {
            const skillA = SKILLS[a.skillId];
            const skillB = SKILLS[b.skillId];
            if (!skillA || !skillB) return 0;
            
            switch (currentSort) {
                case 'rarity':
                    return skillB.rarity - skillA.rarity || b.level - a.level || skillB.cost - skillA.cost;
                case 'cost':
                    return skillB.cost - skillA.cost || b.level - a.level;
                case 'category':
                    const catOrder = { attack: 0, defense: 1, effect: 2 };
                    return (catOrder[skillA.category] - catOrder[skillB.category]) || b.level - a.level;
                default:
                    return 0;
            }
        };
        
        // ソート関数（未所持用）
        const sortNotOwnedFn = (aId, bId) => {
            const a = SKILLS[aId];
            const b = SKILLS[bId];
            if (!a || !b) return 0;
            
            switch (currentSort) {
                case 'rarity':
                    return b.rarity - a.rarity || b.cost - a.cost;
                case 'cost':
                    return b.cost - a.cost || b.rarity - a.rarity;
                case 'category':
                    const catOrder = { attack: 0, defense: 1, effect: 2 };
                    return (catOrder[a.category] - catOrder[b.category]) || (b.rarity - a.rarity);
                default:
                    return 0;
            }
        };
        
        // ソート
        if (currentSort !== 'default') {
            ownedCards.sort(sortOwnedFn);
            notOwnedIds.sort(sortNotOwnedFn);
        }
        
        container.innerHTML = '';
        
        // 所持スキル（レベル別カード）
        ownedCards.forEach(({ skillId, level, count }) => {
            const skill = SKILLS[skillId];
            if (!skill) return;
            
            const isEquipped = equippedSkills.includes(skillId);
            const levelStars = '★'.repeat(level);
            
            const card = document.createElement('div');
            card.className = `skill-frame-card cat-${skill.category} rarity-${skill.rarity}`;
            
            if (isEquipped) {
                card.classList.add('equipped-indicator');
            }
            
            card.innerHTML = `
                ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                <div class="frame-inner">
                    <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                    <span class="skill-name">${skill.name}</span>
                </div>
                ${count > 1 ? `<span class="skill-count">×${count}</span>` : ''}
                ${level > 0 ? `<span class="skill-level-badge">${levelStars}</span>` : ''}
                ${isEquipped ? '<span class="equipped-badge">装備中</span>' : ''}
            `;
            
            card.addEventListener('click', () => openSkillDetail(skillId, true, level));
            container.appendChild(card);
        });
        
        // 未所持スキル
        notOwnedIds.forEach(skillId => {
            const skill = SKILLS[skillId];
            if (!skill) return;
            
            const card = document.createElement('div');
            card.className = `skill-frame-card cat-${skill.category} rarity-${skill.rarity} not-owned`;
            
            card.innerHTML = `
                ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                <div class="frame-inner">
                    <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                    <span class="skill-name">${skill.name}</span>
                </div>
            `;
            
            card.addEventListener('click', () => openSkillDetail(skillId, false));
            
            card.dataset.skillId = skillId;
            container.appendChild(card);
        });
    }
    
    function updateTileCollection() {
        // 装備中タイル表示
        const equippedGrid = document.getElementById('equipped-tiles-grid');
        const equipped = GameData.getEquippedTiles();
        const tileValues = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
        
        equippedGrid.innerHTML = '';
        tileValues.forEach(value => {
            const skinId = equipped[value] || 'normal';
            const skin = TILE_SKINS[skinId];
            const tile = document.createElement('div');
            tile.className = 'equipped-tile-item';
            tile.innerHTML = `
                <div class="eq-tile-value">${value}</div>
                <div class="eq-tile-skin">${skin?.name || 'ノーマル'}</div>
            `;
            equippedGrid.appendChild(tile);
        });
        
        // 所持タイル表示
        const container = document.getElementById('tile-collection');
        const ownedTiles = GameData.getOwnedTiles();
        
        // 所持しているスキンをチェック
        const hasAnyTiles = Object.entries(ownedTiles).some(([skinId, values]) => 
            Object.values(values).some(count => count > 0)
        );
        
        if (!hasAnyTiles) {
            container.innerHTML = '<div class="empty-message">タイルがありません<br>ガチャで入手しよう!</div>';
            return;
        }
        
        container.innerHTML = '';
        
        // スキンごとにグループ表示
        Object.entries(ownedTiles).forEach(([skinId, values]) => {
            const skin = TILE_SKINS[skinId];
            if (!skin) return;
            
            const ownedValues = Object.entries(values).filter(([v, count]) => count > 0);
            if (ownedValues.length === 0) return;
            
            const skinGroup = document.createElement('div');
            skinGroup.className = 'skin-group';
            skinGroup.innerHTML = `<div class="skin-group-header">${skin.name} ${'★'.repeat(skin.rarity)}</div>`;
            
            const tilesGrid = document.createElement('div');
            tilesGrid.className = 'tiles-grid';
            
            ownedValues.forEach(([value, count]) => {
                const tileCard = document.createElement('div');
                tileCard.className = 'tile-card';
                tileCard.dataset.skinId = skinId;
                tileCard.dataset.value = value;
                
                const isEquipped = equipped[value] === skinId;
                if (isEquipped) tileCard.classList.add('equipped');
                
                tileCard.innerHTML = `
                    <div class="tc-value">${value}</div>
                    <div class="tc-count">×${count}</div>
                    ${count >= 2 && parseInt(value) < 1024 ? '<div class="tc-merge">合成可</div>' : ''}
                    ${isEquipped ? '<div class="tc-equipped">装備中</div>' : ''}
                `;
                
                tileCard.addEventListener('click', () => openTileDetail(skinId, parseInt(value), count));
                tilesGrid.appendChild(tileCard);
            });
            
            skinGroup.appendChild(tilesGrid);
            container.appendChild(skinGroup);
        });
    }
    
    // タイル詳細（装備/合成選択）
    function openTileDetail(skinId, value, count) {
        const skin = TILE_SKINS[skinId];
        const isEquipped = GameData.getEquippedTileSkin(value) === skinId;
        const canMerge = count >= 2 && value < 1024;
        
        const actions = [];
        
        if (!isEquipped) {
            actions.push(`<button class="action-btn equip" onclick="equipTileAction('${skinId}', ${value})">装備する</button>`);
        } else {
            actions.push(`<button class="action-btn equip" disabled>装備中</button>`);
        }
        
        if (canMerge) {
            actions.push(`<button class="action-btn merge" onclick="mergeTileAction('${skinId}', ${value})">合成 (${value}×2 → ${value*2})</button>`);
        }
        
        // 売却
        const sellPrice = GachaSystem.sellPrices.tile[skin.rarity];
        actions.push(`<button class="action-btn sell" onclick="sellTileAction('${skinId}', ${value})">売却 (${sellPrice} 💎)</button>`);
        
        // 簡易モーダル
        const modal = document.createElement('div');
        modal.className = 'quick-modal';
        modal.innerHTML = `
            <div class="quick-modal-content">
                <h3>${skin.name} [${value}]</h3>
                <p>所持数: ${count}</p>
                <div class="quick-actions">${actions.join('')}</div>
                <button class="modal-close-btn" onclick="this.closest('.quick-modal').remove()">閉じる</button>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
    }
    
    // グローバル関数（モーダルから呼び出し）
    window.equipTileAction = function(skinId, value) {
        GameData.equipTile(value, skinId);
        document.querySelector('.quick-modal')?.remove();
        updateTileCollection();
    };
    
    window.mergeTileAction = function(skinId, value) {
        if (GameData.mergeTiles(skinId, value)) {
            document.querySelector('.quick-modal')?.remove();
            updateTileCollection();
        } else {
            alert('合成に失敗しました');
        }
    };
    
    window.sellTileAction = function(skinId, value) {
        const skin = TILE_SKINS[skinId];
        if (!skin) return;
        
        if (!confirm(`${skin.name}[${value}]を売却しますか？`)) return;
        
        const sellPrice = GachaSystem.sellPrices.tile[skin.rarity];
        if (GameData.removeTile(skinId, value, 1)) {
            GameData.addCrystal(sellPrice);
            updateCurrencyDisplay();
            document.querySelector('.quick-modal')?.remove();
            updateTileCollection();
        }
    };
    
    // 注: 旧スキルアセット画面用の関数は削除済み
    // スキル装備は新しいプリセット編集画面で行う
    
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
        } else if (tabName === 'collection') {
            updateTileCollection();
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
        
        // 演出画面へ遷移
        showGachaAnimation(results);
        updateCurrencyDisplay();
    }
    
    let currentGachaResults = [];
    let selectedGachaIndex = -1;
    
    function showGachaAnimation(results) {
        currentGachaResults = results;
        
        // 演出用オーブ生成
        const orbsContainer = document.getElementById('gacha-orbs');
        orbsContainer.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const orb = document.createElement('div');
            orb.className = 'gacha-orb';
            orbsContainer.appendChild(orb);
        }
        
        // 演出画面表示
        showScreen('gacha-animation');
        
        // 1.5秒後に結果画面へ
        setTimeout(() => {
            showGachaResults(results);
        }, 1500);
    }
    
    /**
     * バフアイコンを更新
     */
    function updateBuffIcons(containerId, buffs) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        buffs.forEach(buff => {
            const skill = SKILLS[buff.id];
            if (!skill) return;
            
            const icon = document.createElement('div');
            // カテゴリ別枠色 + レアリティ別背景
            icon.className = `buff-icon ${buff.type} cat-${skill.category} rarity-${skill.rarity}`;
            icon.title = skill.name;
            
            const img = document.createElement('img');
            img.src = skill.icon;
            img.alt = skill.name;
            icon.appendChild(img);
            
            // 時間制限付きの場合はタイマー表示
            if (buff.timer !== undefined && buff.timer > 0) {
                const timer = document.createElement('span');
                timer.className = 'buff-timer';
                timer.textContent = Math.ceil(buff.timer / 1000);
                icon.appendChild(timer);
            }
            
            container.appendChild(icon);
        });
    }
    
    function showGachaResults(results) {
        const container = document.getElementById('gacha-results');
        container.innerHTML = '';
        selectedGachaIndex = -1;
        
        results.forEach((result, index) => {
            if (result.type === 'skill') {
                // スキル - スキル画面と同じskill-frame-cardを使用
                const skill = result.item;
                const card = document.createElement('div');
                card.className = `skill-frame-card cat-${skill.category} rarity-${skill.rarity} gacha-item`;
                card.dataset.index = index;
                
                card.innerHTML = `
                    ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                    <div class="frame-inner">
                        <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                        <span class="skill-name">${skill.name}</span>
                    </div>
                    ${result.isNew ? '<span class="new-badge">NEW!</span>' : ''}
                `;
                
                card.addEventListener('click', () => selectGachaItem(index));
                container.appendChild(card);
            } else {
                // タイル
                const card = document.createElement('div');
                card.className = `gacha-result-card rarity-${result.rarity}`;
                card.dataset.index = index;
                
                card.innerHTML = `
                    <div class="card-icon">🎨</div>
                    <div class="card-name">${result.item.name}</div>
                    <div class="card-rarity">${'★'.repeat(result.rarity)}${result.isNew ? ' NEW!' : ''}</div>
                `;
                
                card.addEventListener('click', () => selectGachaItem(index));
                container.appendChild(card);
            }
        });
        
        // 結果画面表示
        showScreen('gacha-result');
        
        // 自動選択はしない - ユーザーがタップするまで待つ
    }
    
    function selectGachaItem(index) {
        const results = currentGachaResults;
        if (index < 0 || index >= results.length) return;
        
        const result = results[index];
        
        if (result.type === 'skill') {
            // スキル画面と同じ詳細モーダルを表示（ガチャ入手は常にレベル0）
            openSkillDetail(result.item.id, true, 0);
        } else {
            // タイルの詳細（簡易表示）
            alert(`${result.item.name}\n${'★'.repeat(result.rarity)} タイルスキン`);
        }
    }
    
    function closeGachaResult() {
        currentGachaResults = [];
        selectedGachaIndex = -1;
        showScreen('main');
        
        // ガチャタブに戻る
        switchTab('gacha');
        
        // スキルガチャだったらスキル一覧更新（スキルタブに切り替え時に更新される）
        updateCurrencyDisplay();
    }
    
    // ========================================
    // スキル詳細
    // ========================================
    
    let currentDetailSkillId = null;
    
    let currentDetailSkillLevel = 0;
    
    function openSkillDetail(skillId, isOwned = true, level = null) {
        currentDetailSkillId = skillId;
        const skill = SKILLS[skillId];
        if (!skill) return;
        
        // レベルが指定されていない場合は最高レベルを取得
        if (level === null) {
            level = isOwned ? GameData.getSkillLevel(skillId) : 0;
        }
        currentDetailSkillLevel = level;
        
        const modal = document.getElementById('skill-detail-modal');
        
        // 未所持の場合はグレー表示クラスを追加
        if (!isOwned) {
            modal.classList.add('not-owned-detail');
        } else {
            modal.classList.remove('not-owned-detail');
        }
        
        // フル版フレーム付きアイコン
        const levelStars = '★'.repeat(level);
        document.getElementById('detail-skill-icon').innerHTML = `
            <div class="skill-frame-full cat-${skill.category} rarity-${skill.rarity}">
                <img src="${skill.icon}" alt="${skill.name}">
                ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
            </div>
            ${level > 0 ? `<span class="detail-level-badge">${levelStars}</span>` : ''}
        `;
        document.getElementById('detail-skill-name').textContent = skill.name;
        document.getElementById('detail-skill-rarity').textContent = '★'.repeat(skill.rarity);
        document.getElementById('detail-skill-cost').textContent = `コスト: ${skill.cost}`;
        document.getElementById('detail-skill-desc').textContent = skill.description;
        
        // カテゴリ表示
        const catInfo = SKILL_CATEGORIES[skill.category];
        const catDisplay = document.getElementById('detail-skill-category');
        if (catDisplay) {
            catDisplay.textContent = catInfo ? catInfo.name : '';
            catDisplay.style.color = catInfo ? catInfo.color : '';
        }
        
        // 強化レベル表示（ピンクの★）
        const levelStarsEl = document.getElementById('detail-skill-level');
        if (levelStarsEl) {
            levelStarsEl.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const star = document.createElement('span');
                star.className = i < level ? 'filled' : 'empty';
                star.textContent = i < level ? '★' : '☆';
                levelStarsEl.appendChild(star);
            }
        }
        
        // 強化効果一覧を表示（★1〜★5の効果、未到達はグレー）
        const upgradeEffectsEl = document.getElementById('upgrade-effects-list');
        if (upgradeEffectsEl) {
            upgradeEffectsEl.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const effectRow = document.createElement('div');
                effectRow.className = `upgrade-effect-row ${i <= level ? 'reached' : 'not-reached'}`;
                effectRow.innerHTML = `<span class="effect-level">★${i}:</span> <span class="effect-desc">コスト-1</span>`;
                upgradeEffectsEl.appendChild(effectRow);
            }
        }
        
        // 売却価格
        const sellPrice = GachaSystem.sellPrices.skill[skill.rarity];
        const sellBtn = document.getElementById('btn-sell-skill');
        if (sellBtn) {
            sellBtn.textContent = `売却 (${sellPrice} SP)`;
        }
        
        // 強化ボタン（押すとスキル強化画面へ遷移、そのスキルを自動セット）
        const upgradeBtn = document.getElementById('btn-upgrade-skill');
        if (upgradeBtn) {
            if (level >= 5) {
                upgradeBtn.disabled = true;
                upgradeBtn.textContent = '最大強化';
            } else if (isOwned) {
                upgradeBtn.disabled = false;
                upgradeBtn.textContent = '強化する';
            } else {
                upgradeBtn.disabled = true;
                upgradeBtn.textContent = '未所持';
            }
        }
        
        // 売却ボタン
        if (sellBtn) {
            if (isOwned) {
                sellBtn.disabled = false;
            } else {
                sellBtn.disabled = true;
                sellBtn.textContent = '未所持';
            }
        }
        
        showModal('skillDetail');
    }
    
    // 強化に必要な素材を計算
    function getUpgradeRequirement(currentLevel, rarity) {
        // ★0 → ★1: 同スキル1枚
        // ★1 → ★2: 同スキル2枚
        // ★2 → ★3: 同スキル2枚 + 同レア2枚
        // ★3 → ★4: 同スキル3枚 + 同レア2枚
        // ★4 → ★5: 同スキル3枚 + 同レア★3以上2枚
        const requirements = [
            { sameSkill: 1, sameRarity: 0, text: '同スキル×1' },
            { sameSkill: 2, sameRarity: 0, text: '同スキル×2' },
            { sameSkill: 2, sameRarity: 2, text: '同スキル×2 + 同レア×2' },
            { sameSkill: 3, sameRarity: 2, text: '同スキル×3 + 同レア×2' },
            { sameSkill: 3, sameRarity: 2, text: '同スキル×3 + 同レア★3+×2' }
        ];
        return requirements[currentLevel] || { sameSkill: 0, sameRarity: 0, text: '最大' };
    }
    
    // スキル強化
    // 注: 旧upgradeSkill関数は削除。スキル強化は専用画面(openUpgradeScreen)で行う
    
    // 注: 旧equipSkill関数は削除済み。スキル装備はプリセット編集画面で行う
    
    function sellSkill(skillId) {
        const skill = SKILLS[skillId];
        if (!skill) return;
        
        const levelStars = currentDetailSkillLevel > 0 ? ` ★${currentDetailSkillLevel}` : '';
        if (!confirm(`${skill.name}${levelStars}を売却しますか？`)) return;
        
        const sellPrice = GachaSystem.sellPrices.skill[skill.rarity];
        GameData.removeSkillByLevel(skillId, currentDetailSkillLevel, 1);
        GameData.addSP(sellPrice);
        
        updateCurrencyDisplay();
        updateSkillInventory();
        hideModal('skillDetail');
    }
    
    // ========================================
    // スキル装備画面（プリセット選択）
    // ========================================
    
    function openPresetSelectScreen() {
        const screen = document.getElementById('screen-preset-select');
        const container = document.getElementById('preset-list');
        container.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
            const skills = GameData.getSkillPreset(i);
            const totalCost = skills.reduce((sum, sid) => sum + (SKILLS[sid]?.cost || 0), 0);
            
            const item = document.createElement('div');
            item.className = 'preset-item';
            item.dataset.preset = i;
            
            const skillIcons = skills.filter(Boolean).map(sid => {
                const skill = SKILLS[sid];
                if (!skill) return '';
                const level = GameData.getSkillLevel(sid);
                const levelStars = '★'.repeat(level);
                return `
                    <div class="skill-frame-card cat-${skill.category} rarity-${skill.rarity}" style="width:40px;height:44px;position:relative;">
                        ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                        <div class="frame-inner">
                            <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}" style="width:24px;height:24px;">
                        </div>
                        ${level > 0 ? `<span class="skill-level-badge" style="font-size:0.5rem;">${levelStars}</span>` : ''}
                    </div>
                `;
            }).join('');
            
            item.innerHTML = `
                <div class="preset-item-header">
                    <span class="preset-item-name">プリセット ${i + 1}</span>
                    <span class="preset-item-cost">${totalCost}/20</span>
                </div>
                <div class="preset-item-skills">
                    ${skillIcons || '<span style="color:var(--text-secondary);font-size:0.8rem;">スキル未設定</span>'}
                </div>
            `;
            
            item.addEventListener('click', () => openPresetEditScreen(i));
            container.appendChild(item);
        }
        
        screen.classList.remove('hidden');
    }
    
    function closePresetSelectScreen() {
        document.getElementById('screen-preset-select').classList.add('hidden');
    }
    
    // ========================================
    // スキル装備画面（プリセット編集）
    // ========================================
    
    let currentEditingPreset = 0;
    let editingSkills = [];
    
    function openPresetEditScreen(presetIndex) {
        currentEditingPreset = presetIndex;
        editingSkills = [...GameData.getSkillPreset(presetIndex)];
        
        // プリセット選択画面を閉じる
        document.getElementById('screen-preset-select').classList.add('hidden');
        
        // 編集画面を開く
        const screen = document.getElementById('screen-preset-edit');
        screen.classList.remove('hidden');
        
        updatePresetEditUI();
    }
    
    function updatePresetEditUI() {
        // スロット表示
        const slotsContainer = document.getElementById('preset-edit-slots');
        slotsContainer.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.className = 'preset-edit-slot';
            const skillId = editingSkills[i];
            
            if (skillId && SKILLS[skillId]) {
                const skill = SKILLS[skillId];
                const level = GameData.getSkillLevel(skillId);
                const levelStars = '★'.repeat(level);
                slot.classList.add('filled');
                slot.innerHTML = `
                    <div class="skill-frame-card cat-${skill.category} rarity-${skill.rarity}">
                        ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                        <div class="frame-inner">
                            <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                        </div>
                        ${level > 0 ? `<span class="skill-level-badge">${levelStars}</span>` : ''}
                    </div>
                `;
                slot.addEventListener('click', () => removeFromPreset(i));
            } else {
                slot.textContent = '+';
            }
            
            slotsContainer.appendChild(slot);
        }
        
        // コスト表示
        const totalCost = editingSkills.reduce((sum, sid) => sum + (SKILLS[sid]?.cost || 0), 0);
        document.getElementById('edit-current-cost').textContent = totalCost;
        
        // スキル一覧
        updatePresetSkillInventory(totalCost);
    }
    
    function updatePresetSkillInventory(currentCost) {
        const container = document.getElementById('preset-skill-inventory');
        const remainingCost = 20 - currentCost;
        
        // 所持スキル（レベル別に展開）
        const allSkillIds = Object.keys(SKILLS);
        const ownedCards = [];
        
        allSkillIds.forEach(skillId => {
            const levelDetails = GameData.getSkillLevelDetails(skillId);
            const levels = Object.keys(levelDetails).map(Number).sort((a, b) => b - a);
            
            levels.forEach(level => {
                const count = levelDetails[level];
                if (count > 0) {
                    ownedCards.push({ skillId, level, count });
                }
            });
        });
        
        // ソート（レア順、レベル順）
        ownedCards.sort((a, b) => {
            const skillA = SKILLS[a.skillId];
            const skillB = SKILLS[b.skillId];
            return skillB.rarity - skillA.rarity || b.level - a.level || skillB.cost - skillA.cost;
        });
        
        container.innerHTML = '';
        
        ownedCards.forEach(({ skillId, level, count }) => {
            const skill = SKILLS[skillId];
            if (!skill) return;
            
            const isEquippedInEdit = editingSkills.includes(skillId);
            const canEquip = skill.cost <= remainingCost && !isEquippedInEdit && editingSkills.filter(Boolean).length < 5;
            
            const levelStars = '★'.repeat(level);
            
            const card = document.createElement('div');
            card.className = `skill-frame-card cat-${skill.category} rarity-${skill.rarity}`;
            
            if (isEquippedInEdit) {
                card.classList.add('equipped-indicator');
            }
            if (!canEquip && !isEquippedInEdit) {
                card.classList.add('disabled');
            }
            
            card.innerHTML = `
                ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                <div class="frame-inner">
                    <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                    <span class="skill-name">${skill.name}</span>
                </div>
                ${count > 1 ? `<span class="skill-count">×${count}</span>` : ''}
                ${level > 0 ? `<span class="skill-level-badge">${levelStars}</span>` : ''}
                ${isEquippedInEdit ? '<span class="equipped-badge">選択中</span>' : ''}
            `;
            
            if (canEquip) {
                card.addEventListener('click', () => addToPreset(skillId));
            }
            
            container.appendChild(card);
        });
    }
    
    function addToPreset(skillId) {
        if (editingSkills.length >= 5) return;  // 5個まで
        if (editingSkills.includes(skillId)) return;  // 重複不可
        
        editingSkills.push(skillId);  // 末尾に追加
        updatePresetEditUI();
    }
    
    function removeFromPreset(slotIndex) {
        editingSkills.splice(slotIndex, 1);  // 削除して左詰め
        updatePresetEditUI();
    }
    
    function saveCurrentPreset() {
        const totalCost = editingSkills.reduce((sum, sid) => sum + (SKILLS[sid]?.cost || 0), 0);
        
        // コストチェック（19-20 or 空）
        const skillCount = editingSkills.filter(Boolean).length;
        if (skillCount > 0 && (totalCost < 19 || totalCost > 20)) {
            alert('コストを19〜20に調整してください');
            return;
        }
        
        GameData.setSkillPreset(currentEditingPreset, editingSkills.filter(Boolean));
        closePresetEditScreen();
        openPresetSelectScreen(); // プリセット選択に戻る
    }
    
    function closePresetEditScreen() {
        document.getElementById('screen-preset-edit').classList.add('hidden');
    }
    
    // ========================================
    // スキル強化画面
    // ========================================
    
    let upgradeTargetSkillId = null;
    let upgradeTargetLevel = 0;
    let upgradeMaterials = [];  // { skillId, level }[]
    
    function openUpgradeScreen(presetSkillId = null, presetLevel = null) {
        if (presetSkillId) {
            upgradeTargetSkillId = presetSkillId;
            upgradeTargetLevel = presetLevel !== null ? presetLevel : GameData.getSkillLevel(presetSkillId);
        } else {
            upgradeTargetSkillId = null;
            upgradeTargetLevel = 0;
        }
        upgradeMaterials = [];
        
        const screen = document.getElementById('screen-skill-upgrade');
        screen.classList.remove('hidden');
        
        updateUpgradeUI();
    }
    
    function updateUpgradeUI() {
        const beforeSlot = document.getElementById('upgrade-skill-before');
        const afterSlot = document.getElementById('upgrade-skill-after');
        const materialsRow = document.getElementById('upgrade-materials-row');
        const confirmBtn = document.getElementById('btn-confirm-upgrade');
        
        if (upgradeTargetSkillId && SKILLS[upgradeTargetSkillId]) {
            const skill = SKILLS[upgradeTargetSkillId];
            const level = upgradeTargetLevel;
            const levelStars = '★'.repeat(level);
            
            // 強化元スキル（タップでキャンセル可能）
            beforeSlot.innerHTML = `
                <div class="skill-frame-card cat-${skill.category} rarity-${skill.rarity}">
                    ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                    <div class="frame-inner">
                        <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                        <span class="skill-name">${skill.name}</span>
                    </div>
                    ${level > 0 ? `<span class="skill-level-badge">${levelStars}</span>` : ''}
                </div>
            `;
            beforeSlot.classList.add('filled');
            beforeSlot.onclick = () => clearUpgradeTarget();
            
            // 強化後プレビュー
            const nextLevel = level + 1;
            const nextLevelStars = '★'.repeat(nextLevel);
            afterSlot.innerHTML = `
                <div class="skill-frame-card cat-${skill.category} rarity-${skill.rarity}">
                    ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                    <div class="frame-inner">
                        <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                        <span class="skill-name">${skill.name}</span>
                    </div>
                    <span class="skill-level-badge">${nextLevelStars}</span>
                </div>
            `;
            afterSlot.classList.add('filled');
            
            // 素材スロット（同スキル + 同レア）
            const req = getUpgradeRequirement(level, skill.rarity);
            materialsRow.innerHTML = '';
            
            // 同スキル素材を抽出
            const sameSkillMats = upgradeMaterials.filter(m => m.type === 'same-skill');
            const sameRarityMats = upgradeMaterials.filter(m => m.type === 'same-rarity');
            
            // 同スキル素材スロット
            for (let i = 0; i < req.sameSkill; i++) {
                const matSlot = document.createElement('div');
                matSlot.className = 'material-slot same-skill';
                
                const mat = sameSkillMats[i];
                if (mat) {
                    const matSkill = SKILLS[mat.skillId];
                    if (matSkill) {
                        matSlot.classList.add('filled');
                        // プリセットと同じようにスキルカードを表示
                        matSlot.innerHTML = `
                            <div class="skill-frame-card cat-${matSkill.category} rarity-${matSkill.rarity}">
                                ${matSkill.rarity === 5 ? '<div class="particles"></div>' : ''}
                                <div class="frame-inner">
                                    <img class="skill-icon-img" src="${matSkill.icon}" alt="${matSkill.name}">
                                </div>
                            </div>
                        `;
                        matSlot.addEventListener('click', () => removeMaterialByData(mat));
                    }
                } else {
                    matSlot.textContent = '同';
                }
                
                materialsRow.appendChild(matSlot);
            }
            
            // 同レア素材スロット（★2→★3以降）
            for (let i = 0; i < req.sameRarity; i++) {
                const matSlot = document.createElement('div');
                matSlot.className = 'material-slot same-rarity';
                
                const mat = sameRarityMats[i];
                if (mat) {
                    const matSkill = SKILLS[mat.skillId];
                    if (matSkill) {
                        matSlot.classList.add('filled');
                        // プリセットと同じようにスキルカードを表示
                        matSlot.innerHTML = `
                            <div class="skill-frame-card cat-${matSkill.category} rarity-${matSkill.rarity}">
                                ${matSkill.rarity === 5 ? '<div class="particles"></div>' : ''}
                                <div class="frame-inner">
                                    <img class="skill-icon-img" src="${matSkill.icon}" alt="${matSkill.name}">
                                </div>
                            </div>
                        `;
                        matSlot.addEventListener('click', () => removeMaterialByData(mat));
                    }
                } else {
                    matSlot.textContent = '★' + skill.rarity;
                }
                
                materialsRow.appendChild(matSlot);
            }
            
            // 強化ボタン有効化チェック
            const requiredTotal = req.sameSkill + req.sameRarity;
            confirmBtn.disabled = upgradeMaterials.length < requiredTotal;
            
        } else {
            beforeSlot.innerHTML = '<span class="slot-label">選択スキル</span>';
            beforeSlot.classList.remove('filled');
            beforeSlot.onclick = null;
            afterSlot.innerHTML = '<span class="slot-label">強化後</span>';
            afterSlot.classList.remove('filled');
            materialsRow.innerHTML = '';
            confirmBtn.disabled = true;
        }
        
        // スキル一覧
        updateUpgradeSkillInventory();
    }
    
    function clearUpgradeTarget() {
        upgradeTargetSkillId = null;
        upgradeTargetLevel = 0;
        upgradeMaterials = [];
        updateUpgradeUI();
    }
    
    function updateUpgradeSkillInventory() {
        const container = document.getElementById('upgrade-skill-inventory');
        
        // 所持スキル（レベル別に展開）
        const allSkillIds = Object.keys(SKILLS);
        const ownedCards = [];
        
        allSkillIds.forEach(skillId => {
            const levelDetails = GameData.getSkillLevelDetails(skillId);
            const levels = Object.keys(levelDetails).map(Number).sort((a, b) => b - a);
            
            levels.forEach(level => {
                const count = levelDetails[level];
                if (count > 0) {
                    ownedCards.push({ skillId, level, count });
                }
            });
        });
        
        // ソート（レア順、レベル順）
        ownedCards.sort((a, b) => {
            const skillA = SKILLS[a.skillId];
            const skillB = SKILLS[b.skillId];
            return skillB.rarity - skillA.rarity || b.level - a.level;
        });
        
        container.innerHTML = '';
        
        ownedCards.forEach(({ skillId, level, count }) => {
            const skill = SKILLS[skillId];
            if (!skill) return;
            
            const levelStars = '★'.repeat(level);
            const isTarget = skillId === upgradeTargetSkillId && level === upgradeTargetLevel;
            
            // このカードが素材として何枚使われているか
            const usedAsMaterial = upgradeMaterials.filter(m => m.skillId === skillId && m.level === level).length;
            // 強化対象として1枚使われているか
            const usedAsTarget = isTarget ? 1 : 0;
            // 残り枚数
            const remainingCount = count - usedAsMaterial - usedAsTarget;
            
            const card = document.createElement('div');
            card.className = `skill-frame-card cat-${skill.category} rarity-${skill.rarity}`;
            
            if (isTarget) {
                card.classList.add('equipped-indicator');
            }
            
            // 使い切った場合は暗転
            if (remainingCount <= 0 && !isTarget) {
                card.classList.add('disabled');
            }
            
            card.innerHTML = `
                ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                <div class="frame-inner">
                    <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                    <span class="skill-name">${skill.name}</span>
                </div>
                ${count > 1 ? `<span class="skill-count">×${count}</span>` : ''}
                ${level > 0 ? `<span class="skill-level-badge">${levelStars}</span>` : ''}
            `;
            
            card.addEventListener('click', () => {
                if (!upgradeTargetSkillId) {
                    // 強化対象として選択（レベル5未満のみ）
                    if (level < 5) {
                        upgradeTargetSkillId = skillId;
                        upgradeTargetLevel = level;
                        upgradeMaterials = [];
                        updateUpgradeUI();
                    }
                } else if (remainingCount > 0) {
                    // 素材として追加
                    const targetSkill = SKILLS[upgradeTargetSkillId];
                    const req = getUpgradeRequirement(upgradeTargetLevel, targetSkill.rarity);
                    
                    // 同スキル素材
                    const sameSkillMats = upgradeMaterials.filter(m => m.type === 'same-skill');
                    // 同レア素材
                    const sameRarityMats = upgradeMaterials.filter(m => m.type === 'same-rarity');
                    
                    if (skillId === upgradeTargetSkillId && sameSkillMats.length < req.sameSkill) {
                        // 同スキル素材として追加
                        upgradeMaterials.push({ skillId, level, type: 'same-skill' });
                        updateUpgradeUI();
                    } else if (skillId !== upgradeTargetSkillId && skill.rarity === targetSkill.rarity && sameRarityMats.length < req.sameRarity) {
                        // 同レア素材として追加
                        upgradeMaterials.push({ skillId, level, type: 'same-rarity' });
                        updateUpgradeUI();
                    }
                }
            });
            
            container.appendChild(card);
        });
    }
    
    function removeMaterialByData(matToRemove) {
        const index = upgradeMaterials.findIndex(m => 
            m.skillId === matToRemove.skillId && 
            m.level === matToRemove.level && 
            m.type === matToRemove.type
        );
        if (index !== -1) {
            upgradeMaterials.splice(index, 1);
            updateUpgradeUI();
        }
    }
    
    function confirmUpgrade() {
        if (!upgradeTargetSkillId) return;
        
        const skill = SKILLS[upgradeTargetSkillId];
        const req = getUpgradeRequirement(upgradeTargetLevel, skill.rarity);
        const requiredTotal = req.sameSkill + req.sameRarity;
        
        if (upgradeMaterials.filter(Boolean).length < requiredTotal) {
            alert('素材が足りません');
            return;
        }
        
        // 素材消費（レベル別）
        upgradeMaterials.forEach(mat => {
            if (mat) {
                GameData.removeSkillByLevel(mat.skillId, mat.level, 1);
            }
        });
        
        // 強化（指定レベルから次レベルへ）
        GameData.upgradeSkill(upgradeTargetSkillId, upgradeTargetLevel);
        
        // リセット
        upgradeTargetSkillId = null;
        upgradeTargetLevel = 0;
        upgradeMaterials = [];
        updateUpgradeUI();
        updateSkillInventory();
        
        alert('強化成功！');
    }
    
    function closeUpgradeScreen() {
        document.getElementById('screen-skill-upgrade').classList.add('hidden');
        upgradeTargetSkillId = null;
        upgradeTargetLevel = 0;
        upgradeMaterials = [];
    }
    
    // ========================================
    // バトル前プリセット選択
    // ========================================
    
    let selectedPresetForBattle = 0;
    
    function showPresetSelectModal(stageId) {
        pendingStageId = stageId;
        selectedPresetForBattle = GameData.getCurrentPreset();
        
        const container = document.getElementById('preset-select-list');
        container.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
            const skills = GameData.getSkillPreset(i);
            const totalCost = skills.reduce((sum, sid) => {
                return sum + (SKILLS[sid]?.cost || 0);
            }, 0);
            const isValid = (totalCost >= 19 && totalCost <= 20) || skills.filter(Boolean).length === 0; // 空かコスト19-20
            
            const item = document.createElement('div');
            item.className = `preset-select-item ${i === selectedPresetForBattle ? 'selected' : ''} ${!isValid ? 'invalid' : ''}`;
            item.dataset.preset = i;
            
            const skillIcons = skills.filter(Boolean).map(sid => {
                const skill = SKILLS[sid];
                return skill ? `<div class="preset-skill-icon cat-${skill.category} rarity-${skill.rarity}"><img src="${skill.icon}" alt="${skill.name}"></div>` : '';
            }).join('');
            
            item.innerHTML = `
                <div class="preset-item-header">
                    <span class="preset-number">プリセット ${i + 1}</span>
                    <span class="preset-cost ${!isValid ? 'invalid' : ''}">${totalCost}/20</span>
                </div>
                <div class="preset-skills">
                    ${skillIcons || '<span class="preset-empty-text">スキル未設定</span>'}
                </div>
            `;
            
            item.addEventListener('click', () => {
                document.querySelectorAll('.preset-select-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                selectedPresetForBattle = i;
                updatePresetStartButton();
            });
            
            container.appendChild(item);
        }
        
        updatePresetStartButton();
        showModal('presetSelect');
    }
    
    function updatePresetStartButton() {
        const btn = document.getElementById('btn-preset-start');
        const skills = GameData.getSkillPreset(selectedPresetForBattle);
        const totalCost = skills.reduce((sum, sid) => sum + (SKILLS[sid]?.cost || 0), 0);
        const isValid = (totalCost >= 19 && totalCost <= 20) || skills.filter(Boolean).length === 0;
        
        btn.disabled = !isValid;
        if (!isValid) {
            btn.textContent = 'コストが20ではありません';
        } else {
            btn.textContent = 'バトル開始';
        }
    }
    
    function confirmPresetAndStartBattle() {
        if (pendingStageId === null) return;
        
        // 選択したプリセットを現在のプリセットに設定
        GameData.setCurrentPreset(selectedPresetForBattle);
        
        hideModal('presetSelect');
        startGame(pendingStageId);
        pendingStageId = null;
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
        game.onBattleLog = (message, type, icon) => ui.showBattleLog(message, type, icon);
        game.onMatchPoint = (playerHP, enemyHP) => ui.updateMatchPoint(playerHP, enemyHP);
        game.onFreezeChange = (target, frozen) => ui.setFrozen(target, frozen);
        game.onSkillBullet = (caster, row, col, icon) => {
            const sourceBoard = caster === 'player' ? game.playerBoard : game.enemyBoard;
            ui.showSkillBullet(caster, row, col, icon, sourceBoard);
        };
        
        game.onBuffChange = (playerBuffs, enemyBuffs) => {
            updateBuffIcons('player-buffs', playerBuffs);
            updateBuffIcons('enemy-buffs', enemyBuffs);
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
        
        // 装備スキルバー更新
        updateEquippedSkillsBar();
        
        ai.start();
    }
    
    /**
     * バトル画面の装備スキルバーを更新
     */
    function updateEquippedSkillsBar() {
        const bar = document.getElementById('equipped-skills-bar');
        if (!bar) return;
        
        bar.innerHTML = '';
        
        const equippedSkills = GameData.getEquippedSkills();
        if (!equippedSkills || equippedSkills.length === 0) {
            bar.style.display = 'none';
            return;
        }
        
        bar.style.display = 'flex';
        
        equippedSkills.forEach(skillId => {
            const skill = SKILLS[skillId];
            if (!skill) return;
            
            const level = GameData.getSkillLevel(skillId);
            const levelStars = '★'.repeat(level);
            
            // skill-frame-cardと同じ構造で生成（バトル用サイズ）
            const card = document.createElement('div');
            card.className = `skill-frame-card battle-size cat-${skill.category} rarity-${skill.rarity}`;
            card.title = `${skill.name}: ${skill.description}`;
            
            card.innerHTML = `
                ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                <div class="frame-inner">
                    <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                </div>
                ${level > 0 ? `<span class="skill-level-badge">${levelStars}</span>` : ''}
            `;
            
            bar.appendChild(card);
        });
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
        
        // ステージ選択（プリセット選択画面を表示）
        document.querySelectorAll('.stage-item').forEach(item => {
            item.addEventListener('click', () => {
                if (item.classList.contains('locked')) return;
                showPresetSelectModal(parseInt(item.dataset.stage));
            });
        });
        
        // プリセット選択モーダル
        document.getElementById('btn-preset-start').addEventListener('click', confirmPresetAndStartBattle);
        document.getElementById('btn-preset-cancel').addEventListener('click', () => {
            hideModal('presetSelect');
            pendingStageId = null;
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
        
        // ガチャ結果OKボタン
        document.getElementById('btn-gacha-ok').addEventListener('click', closeGachaResult);
        
        // スキル詳細
        document.getElementById('btn-sell-skill').addEventListener('click', () => sellSkill(currentDetailSkillId));
        document.getElementById('btn-upgrade-skill').addEventListener('click', () => {
            // スキル強化画面を開き、このスキルを強化元として設定
            hideModal('skillDetail');
            openUpgradeScreen(currentDetailSkillId, currentDetailSkillLevel);
        });
        document.getElementById('btn-close-skill-detail').addEventListener('click', () => hideModal('skillDetail'));
        
        // スキル画面のメインボタン
        document.getElementById('btn-skill-equip').addEventListener('click', openPresetSelectScreen);
        document.getElementById('btn-skill-upgrade').addEventListener('click', () => openUpgradeScreen());
        
        // プリセット選択画面の戻るボタン
        document.getElementById('btn-back-from-preset-select').addEventListener('click', closePresetSelectScreen);
        
        // プリセット編集画面
        document.getElementById('btn-back-from-preset-edit').addEventListener('click', closePresetEditScreen);
        document.getElementById('btn-save-preset').addEventListener('click', saveCurrentPreset);
        
        // スキル強化画面
        document.getElementById('btn-back-from-upgrade').addEventListener('click', closeUpgradeScreen);
        document.getElementById('btn-confirm-upgrade').addEventListener('click', confirmUpgrade);
        
        // ソートボタン
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSort = btn.dataset.sort;
                updateSkillInventory();
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
