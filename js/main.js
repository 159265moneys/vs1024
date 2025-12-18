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
        const ownedSkills = GameData.getOwnedSkills();
        const equippedSkills = GameData.getEquippedSkills();
        
        // 現在の総コストと残りコストを計算
        let currentTotalCost = 0;
        equippedSkills.forEach(sid => {
            if (sid && SKILLS[sid]) {
                currentTotalCost += SKILLS[sid].cost;
            }
        });
        const remainingCost = 20 - currentTotalCost;
        
        // 全スキルをIDリストで取得（番号順 = 定義順）
        let allSkillIds = Object.keys(SKILLS);
        
        // ソート適用
        if (currentSort !== 'default') {
            allSkillIds.sort((aId, bId) => {
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
            });
        }
        
        container.innerHTML = '';
        
        allSkillIds.forEach(skillId => {
            const skill = SKILLS[skillId];
            if (!skill) return;
            
            const ownedData = ownedSkills[skillId];
            const isOwned = ownedData && ownedData.count > 0;
            const isEquipped = equippedSkills.includes(skillId);
            const canEquip = isOwned && skill.cost <= remainingCost && !isEquipped && equippedSkills.filter(Boolean).length < 5;
            
            const card = document.createElement('div');
            
            if (isOwned) {
                // 所持している場合：通常表示
                card.className = `skill-frame-card cat-${skill.category} rarity-${skill.rarity}`;
                
                if (isEquipped) {
                    card.classList.add('equipped-indicator');
                }
                if (!canEquip && !isEquipped) {
                    card.classList.add('disabled');
                }
                
                const level = ownedData.level || 0;
                const levelStars = '★'.repeat(level);  // 取得した星だけ表示
                
                card.innerHTML = `
                    ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                    <div class="frame-inner">
                        <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                        <span class="skill-name">${skill.name}</span>
                    </div>
                    ${ownedData.count > 1 ? `<span class="skill-count">×${ownedData.count}</span>` : ''}
                    ${level > 0 ? `<span class="skill-level-badge">${levelStars}</span>` : ''}
                    ${isEquipped ? '<span class="equipped-badge">装備中</span>' : ''}
                `;
                
                card.addEventListener('click', () => openSkillDetail(skillId));
            } else {
                // 未所持の場合：色だけグレー（構造はそのまま）
                card.className = `skill-frame-card cat-${skill.category} rarity-${skill.rarity} not-owned`;
                
                card.innerHTML = `
                    ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
                    <div class="frame-inner">
                        <img class="skill-icon-img" src="${skill.icon}" alt="${skill.name}">
                        <span class="skill-name">${skill.name}</span>
                    </div>
                `;
                
                // 未所持でも詳細は見れる（ボタンは無効）
                card.addEventListener('click', () => openSkillDetail(skillId, false));  // false = 未所持
            }
            
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
    
    function updateEquippedSkills() {
        const slots = document.querySelectorAll('.asset-slot');
        const equipped = GameData.getEquippedSkills();
        let totalCost = 0;
        
        slots.forEach((slot, index) => {
            const skillId = equipped[index];
            if (skillId && SKILLS[skillId]) {
                const skill = SKILLS[skillId];
                // スロット内にミニフレーム付きアイコンを表示
                slot.innerHTML = `
                    <div class="asset-skill-icon cat-${skill.category} rarity-${skill.rarity}">
                        <img src="${skill.icon}" alt="${skill.name}">
                    </div>
                `;
                slot.classList.add('filled');
                slot.classList.remove('empty');
                slot.dataset.skillId = skillId;
                totalCost += skill.cost;
            } else {
                slot.innerHTML = '+';
                slot.classList.remove('filled');
                slot.classList.add('empty');
                slot.dataset.skillId = '';
            }
        });
        
        document.getElementById('current-cost').textContent = totalCost;
        
        // 残りコスト表示
        const remainingCost = 20 - totalCost;
        const remainingEl = document.getElementById('remaining-cost');
        if (remainingEl) {
            remainingEl.textContent = `(残り${remainingCost})`;
            remainingEl.style.color = remainingCost === 0 ? 'var(--accent-green)' : '';
        }
        
        // コスト警告（20ぴったりでないと警告）
        const costDisplay = document.querySelector('.cost-display');
        const costWarning = document.getElementById('cost-warning');
        const hasEquipped = equipped.filter(Boolean).length > 0;
        
        if ((totalCost < 19 || totalCost > 20) && hasEquipped) {
            costDisplay.style.color = 'var(--accent-red)';
            costWarning?.classList.add('visible');
        } else if (totalCost >= 19 && totalCost <= 20) {
            costDisplay.style.color = 'var(--accent-green)';
            costWarning?.classList.remove('visible');
        } else {
            costDisplay.style.color = '';
            costWarning?.classList.remove('visible');
        }
        
        // スキルインベントリも更新（暗転表示のため）
        updateSkillInventory();
    }
    
    // スロットからスキルを外す
    function unequipSkill(slotIndex) {
        const preset = GameData.getCurrentPreset();
        const equipped = [...GameData.getSkillPreset(preset)];
        
        if (equipped[slotIndex]) {
            equipped[slotIndex] = null;
            // 空きを詰める
            const filtered = equipped.filter(Boolean);
            while (filtered.length < 5) filtered.push(null);
            GameData.setSkillPreset(preset, filtered);
            updateEquippedSkills();
        }
    }
    
    // 全スキル解除
    function clearAllEquippedSkills() {
        const preset = GameData.getCurrentPreset();
        GameData.setSkillPreset(preset, []);
        updateEquippedSkills();
    }
    
    // オートセット - コスト20ぴったりになるスキルを自動選択
    function autoSetSkills() {
        const ownedSkills = GameData.getOwnedSkills();
        
        // 所持スキルをリスト化（レアリティ高い順、コスト高い順）
        const availableSkills = Object.entries(ownedSkills)
            .filter(([, data]) => data.count > 0)
            .map(([skillId]) => ({ id: skillId, ...SKILLS[skillId] }))
            .filter(s => s.cost)
            .sort((a, b) => {
                // レアリティ優先、同レアならコスト高い順
                if (b.rarity !== a.rarity) return b.rarity - a.rarity;
                return b.cost - a.cost;
            });
        
        if (availableSkills.length === 0) {
            alert('装備可能なスキルがありません');
            return;
        }
        
        // コスト20ぴったりの組み合わせを探す（最大5個）
        const targetCost = 20;
        const maxSlots = 5;
        
        // 動的計画法で解を探索
        const result = findSkillCombination(availableSkills, targetCost, maxSlots);
        
        if (result.length === 0) {
            alert('コスト20ぴったりの組み合わせが見つかりません');
            return;
        }
        
        // プリセットに設定
        const preset = GameData.getCurrentPreset();
        GameData.setSkillPreset(preset, result.map(s => s.id));
        updateEquippedSkills();
    }
    
    // コストぴったりの組み合わせを探す（バックトラッキング）
    function findSkillCombination(skills, targetCost, maxCount) {
        let bestResult = [];
        let bestRaritySum = -1;
        
        function backtrack(index, currentCost, selected) {
            // コストぴったりで見つかった
            if (currentCost === targetCost) {
                const raritySum = selected.reduce((sum, s) => sum + s.rarity, 0);
                if (raritySum > bestRaritySum) {
                    bestRaritySum = raritySum;
                    bestResult = [...selected];
                }
                return;
            }
            
            // 枝刈り
            if (index >= skills.length || selected.length >= maxCount || currentCost > targetCost) {
                return;
            }
            
            // このスキルを選ぶ場合
            const skill = skills[index];
            if (currentCost + skill.cost <= targetCost) {
                selected.push(skill);
                backtrack(index + 1, currentCost + skill.cost, selected);
                selected.pop();
            }
            
            // このスキルを選ばない場合
            backtrack(index + 1, currentCost, selected);
        }
        
        backtrack(0, 0, []);
        return bestResult;
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
            // スキル画面と同じ詳細モーダルを表示
            openSkillDetail(result.item.id);
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
    
    function openSkillDetail(skillId, isOwned = true) {
        currentDetailSkillId = skillId;
        const skill = SKILLS[skillId];
        if (!skill) return;
        
        const modal = document.getElementById('skill-detail-modal');
        
        // 未所持の場合はグレー表示クラスを追加
        if (!isOwned) {
            modal.classList.add('not-owned-detail');
        } else {
            modal.classList.remove('not-owned-detail');
        }
        
        // フル版フレーム付きアイコン
        document.getElementById('detail-skill-icon').innerHTML = `
            <div class="skill-frame-full cat-${skill.category} rarity-${skill.rarity}">
                <img src="${skill.icon}" alt="${skill.name}">
                ${skill.rarity === 5 ? '<div class="particles"></div>' : ''}
            </div>
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
        
        // 強化レベル表示
        const level = GameData.getSkillLevel(skillId);
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
        
        // 強化に必要なもの計算
        const upgradeReq = getUpgradeRequirement(level, skill.rarity);
        const ownedCount = GameData.getSkillCount(skillId);
        const upgradeSection = document.getElementById('upgrade-section');
        const upgradeCost = document.getElementById('upgrade-cost');
        const upgradeMaterial = document.getElementById('upgrade-material-status');
        const upgradeBtn = document.getElementById('btn-upgrade-skill');
        
        if (level >= 5) {
            // 最大レベル
            upgradeSection.style.display = 'none';
            upgradeBtn.disabled = true;
            upgradeBtn.textContent = '最大強化';
        } else {
            upgradeSection.style.display = 'block';
            upgradeCost.textContent = upgradeReq.text;
            
            // 素材チェック
            const canUpgrade = ownedCount >= upgradeReq.sameSkill + 1; // +1は本体
            upgradeMaterial.textContent = `所持: ${ownedCount}枚`;
            upgradeMaterial.className = 'upgrade-materials ' + (canUpgrade ? 'sufficient' : 'insufficient');
            upgradeBtn.disabled = !canUpgrade;
            upgradeBtn.textContent = canUpgrade ? '強化する' : '素材不足';
        }
        
        // 売却価格
        const sellPrice = GachaSystem.sellPrices.skill[skill.rarity];
        document.getElementById('btn-sell-skill').textContent = `売却 (${sellPrice} SP)`;
        
        // 未所持の場合は全ボタン無効化
        const equipBtn = document.getElementById('btn-equip-skill');
        const sellBtn = document.getElementById('btn-sell-skill');
        // upgradeBtn は既に上で定義済み
        
        if (!isOwned) {
            equipBtn.disabled = true;
            equipBtn.textContent = '未所持';
            sellBtn.disabled = true;
            sellBtn.textContent = '未所持';
            upgradeBtn.disabled = true;
            upgradeBtn.textContent = '未所持';
            upgradeSection.style.display = 'none';
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
    function upgradeSkill(skillId) {
        const skill = SKILLS[skillId];
        if (!skill) return;
        
        const currentLevel = GameData.getSkillLevel(skillId);
        if (currentLevel >= 5) {
            alert('最大強化済みです');
            return;
        }
        
        const req = getUpgradeRequirement(currentLevel, skill.rarity);
        const ownedCount = GameData.getSkillCount(skillId);
        
        // 同スキルのチェック（本体1枚 + 素材分）
        if (ownedCount < req.sameSkill + 1) {
            alert('素材が足りません');
            return;
        }
        
        // 素材消費（本体は残す）
        GameData.removeSkill(skillId, req.sameSkill);
        
        // 強化
        GameData.upgradeSkill(skillId);
        
        // UI更新
        updateSkillInventory();
        openSkillDetail(skillId); // 詳細画面を更新
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
            
            const icon = document.createElement('div');
            icon.className = `equipped-skill-icon cat-${skill.category} rarity-${skill.rarity}`;
            icon.title = `${skill.name}: ${skill.description}`;
            
            const img = document.createElement('img');
            img.src = skill.icon;
            img.alt = skill.name;
            
            icon.appendChild(img);
            bar.appendChild(icon);
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
        document.getElementById('btn-equip-skill').addEventListener('click', () => equipSkill(currentDetailSkillId));
        document.getElementById('btn-sell-skill').addEventListener('click', () => sellSkill(currentDetailSkillId));
        document.getElementById('btn-upgrade-skill').addEventListener('click', () => upgradeSkill(currentDetailSkillId));
        document.getElementById('btn-close-skill-detail').addEventListener('click', () => hideModal('skillDetail'));
        
        // 装備スロットクリック（スキルを外す）
        document.querySelectorAll('.asset-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => {
                if (slot.classList.contains('filled')) {
                    unequipSkill(index);
                }
            });
        });
        
        // オートセットボタン
        document.getElementById('btn-auto-set').addEventListener('click', autoSetSkills);
        
        // 全解除ボタン
        document.getElementById('btn-clear-all').addEventListener('click', clearAllEquippedSkills);
        
        // ソートボタン
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSort = btn.dataset.sort;
                updateSkillInventory();
            });
        });
        
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
