/**
 * Data - ゲームデータ管理 v1.0
 * セーブ/ロード、通貨、インベントリ管理
 */

const GameData = {
    // デフォルトデータ
    defaults: {
        crystal: 50000,  // 初期クリスタル（デバッグ用）
        sp: 50000,       // 初期SP（デバッグ用）
        highestStage: 0,
        totalDamage: 0,
        clearedStages: [],
        ownedSkills: {},    // { skillId: { count: n, level: 0 } }
        // タイルセット新仕様: 各スキンの各数字ごとに所持
        // { skinId: { 2: count, 4: count, 8: count, ... } }
        ownedTiles: { normal: { 2: 99, 4: 99, 8: 99, 16: 99, 32: 99, 64: 99, 128: 99, 256: 99, 512: 99, 1024: 99 } },
        // 各数字ごとに装備スキンを設定
        // { 2: skinId, 4: skinId, 8: skinId, ... }
        equippedTiles: { 2: 'normal', 4: 'normal', 8: 'normal', 16: 'normal', 32: 'normal', 64: 'normal', 128: 'normal', 256: 'normal', 512: 'normal', 1024: 'normal' },
        skillPresets: [[], [], [], [], []],  // 5つのプリセット
        currentPreset: 0,
        settings: {
            soundEnabled: true,
            vibrationEnabled: true
        }
    },

    // 現在のデータ
    data: null,

    /**
     * 初期化
     */
    init() {
        this.load();
    },

    /**
     * ロード
     */
    load() {
        try {
            const saved = localStorage.getItem('vs1024_data');
            if (saved) {
                this.data = { ...this.defaults, ...JSON.parse(saved) };
            } else {
                this.data = { ...this.defaults };
            }
        } catch (e) {
            console.error('Failed to load game data:', e);
            this.data = { ...this.defaults };
        }
    },

    /**
     * セーブ
     */
    save() {
        try {
            localStorage.setItem('vs1024_data', JSON.stringify(this.data));
        } catch (e) {
            console.error('Failed to save game data:', e);
        }
    },

    /**
     * リセット
     */
    reset() {
        this.data = { ...this.defaults };
        this.save();
    },

    // ========================================
    // 通貨
    // ========================================
    
    getCrystal() {
        return this.data.crystal;
    },

    addCrystal(amount) {
        this.data.crystal += amount;
        this.save();
        return this.data.crystal;
    },

    spendCrystal(amount) {
        if (this.data.crystal >= amount) {
            this.data.crystal -= amount;
            this.save();
            return true;
        }
        return false;
    },

    getSP() {
        return this.data.sp;
    },

    addSP(amount) {
        this.data.sp += amount;
        this.save();
        return this.data.sp;
    },

    spendSP(amount) {
        if (this.data.sp >= amount) {
            this.data.sp -= amount;
            this.save();
            return true;
        }
        return false;
    },

    // ========================================
    // ステージ
    // ========================================

    getHighestStage() {
        return this.data.highestStage;
    },

    setHighestStage(stage) {
        if (stage > this.data.highestStage) {
            this.data.highestStage = stage;
            this.save();
        }
    },

    isStageCleared(stage) {
        return this.data.clearedStages.includes(stage);
    },

    clearStage(stage) {
        if (!this.data.clearedStages.includes(stage)) {
            this.data.clearedStages.push(stage);
            this.save();
            return true;  // 初回クリア
        }
        return false;  // 既にクリア済み
    },

    // ========================================
    // スキル
    // ========================================

    getOwnedSkills() {
        return this.data.ownedSkills;
    },

    hasSkill(skillId) {
        return this.data.ownedSkills[skillId] && this.data.ownedSkills[skillId].count > 0;
    },

    getSkillCount(skillId) {
        return this.data.ownedSkills[skillId]?.count || 0;
    },

    getSkillLevel(skillId) {
        return this.data.ownedSkills[skillId]?.level || 0;
    },

    addSkill(skillId) {
        if (!this.data.ownedSkills[skillId]) {
            this.data.ownedSkills[skillId] = { count: 0, level: 0 };
        }
        this.data.ownedSkills[skillId].count++;
        this.save();
    },

    removeSkill(skillId, count = 1) {
        if (this.data.ownedSkills[skillId]) {
            this.data.ownedSkills[skillId].count = Math.max(0, this.data.ownedSkills[skillId].count - count);
            this.save();
        }
    },

    upgradeSkill(skillId) {
        if (this.data.ownedSkills[skillId]) {
            this.data.ownedSkills[skillId].level++;
            this.save();
        }
    },

    // ========================================
    // スキルプリセット
    // ========================================

    getCurrentPreset() {
        return this.data.currentPreset;
    },

    setCurrentPreset(index) {
        this.data.currentPreset = index;
        this.save();
    },

    getSkillPreset(index) {
        return this.data.skillPresets[index] || [];
    },

    setSkillPreset(index, skills) {
        this.data.skillPresets[index] = skills;
        this.save();
    },

    getEquippedSkills() {
        return this.getSkillPreset(this.data.currentPreset);
    },

    // ========================================
    // タイル（新仕様: 各数字ごとに管理）
    // ========================================

    getOwnedTiles() {
        return this.data.ownedTiles;
    },

    // 特定スキンの特定数字の所持数
    getTileCount(skinId, value) {
        if (!this.data.ownedTiles[skinId]) return 0;
        return this.data.ownedTiles[skinId][value] || 0;
    },

    // 特定スキンのタイルを所持しているか（任意の数字）
    hasTileSkin(skinId) {
        if (!this.data.ownedTiles[skinId]) return false;
        return Object.values(this.data.ownedTiles[skinId]).some(count => count > 0);
    },

    // タイル追加（ガチャで獲得）
    addTile(skinId, value = 2) {
        if (!this.data.ownedTiles[skinId]) {
            this.data.ownedTiles[skinId] = {};
        }
        this.data.ownedTiles[skinId][value] = (this.data.ownedTiles[skinId][value] || 0) + 1;
        this.save();
    },

    // タイル消費（合成で使用）
    removeTile(skinId, value, count = 1) {
        if (!this.data.ownedTiles[skinId]) return false;
        if ((this.data.ownedTiles[skinId][value] || 0) < count) return false;
        this.data.ownedTiles[skinId][value] -= count;
        this.save();
        return true;
    },

    // タイル合成（2個消費して上位1個獲得）
    mergeTiles(skinId, value) {
        const nextValue = value * 2;
        if (nextValue > 1024) return false;  // 1024が最大
        if ((this.data.ownedTiles[skinId]?.[value] || 0) < 2) return false;
        
        this.data.ownedTiles[skinId][value] -= 2;
        this.data.ownedTiles[skinId][nextValue] = (this.data.ownedTiles[skinId][nextValue] || 0) + 1;
        this.save();
        return true;
    },

    // 装備タイル取得
    getEquippedTiles() {
        return this.data.equippedTiles;
    },

    // 特定数字の装備スキン取得
    getEquippedTileSkin(value) {
        return this.data.equippedTiles[value] || 'normal';
    },

    // タイル装備（数字ごと）
    equipTile(value, skinId) {
        // その数字のタイルを持っているか確認
        if (skinId !== 'normal' && (this.data.ownedTiles[skinId]?.[value] || 0) <= 0) {
            return false;
        }
        this.data.equippedTiles[value] = skinId;
        this.save();
        return true;
    },

    // 特定スキンが持っている数字一覧
    getOwnedValuesForSkin(skinId) {
        if (!this.data.ownedTiles[skinId]) return [];
        return Object.entries(this.data.ownedTiles[skinId])
            .filter(([v, count]) => count > 0)
            .map(([v]) => parseInt(v))
            .sort((a, b) => a - b);
    },

    // ========================================
    // 統計
    // ========================================

    getTotalDamage() {
        return this.data.totalDamage;
    },

    addTotalDamage(amount) {
        this.data.totalDamage += amount;
        this.save();
    }
};

// ========================================
// タイルセット定義
// ========================================
const TILE_SKINS = {
    normal: {
        id: 'normal',
        name: 'ノーマル',
        rarity: 1,
        description: 'デフォルトスキン',
        cssClass: 'skin-normal'
    },
    neon: {
        id: 'neon',
        name: 'ネオン',
        rarity: 2,
        description: '発光エフェクト',
        cssClass: 'skin-neon'
    },
    pastel: {
        id: 'pastel',
        name: 'パステル',
        rarity: 2,
        description: '淡い色合い',
        cssClass: 'skin-pastel'
    },
    dark: {
        id: 'dark',
        name: 'ダーク',
        rarity: 2,
        description: 'ダークモード',
        cssClass: 'skin-dark'
    },
    gold: {
        id: 'gold',
        name: 'ゴールド',
        rarity: 3,
        description: '金色グラデーション',
        cssClass: 'skin-gold'
    },
    crystal: {
        id: 'crystal',
        name: 'クリスタル',
        rarity: 3,
        description: '透明感のある輝き',
        cssClass: 'skin-crystal'
    },
    fire: {
        id: 'fire',
        name: 'ファイア',
        rarity: 3,
        description: '炎エフェクト',
        cssClass: 'skin-fire'
    },
    ice: {
        id: 'ice',
        name: 'アイス',
        rarity: 3,
        description: '氷エフェクト',
        cssClass: 'skin-ice'
    },
    galaxy: {
        id: 'galaxy',
        name: 'ギャラクシー',
        rarity: 4,
        description: '宇宙柄',
        cssClass: 'skin-galaxy'
    },
    rainbow: {
        id: 'rainbow',
        name: 'レインボー',
        rarity: 4,
        description: '虹色グラデーション',
        cssClass: 'skin-rainbow'
    },
    cyber: {
        id: 'cyber',
        name: 'サイバー',
        rarity: 4,
        description: 'サイバーパンク風',
        cssClass: 'skin-cyber'
    },
    hologram: {
        id: 'hologram',
        name: 'ホログラム',
        rarity: 5,
        description: 'ホログラフィック',
        cssClass: 'skin-hologram'
    },
    plasma: {
        id: 'plasma',
        name: 'プラズマ',
        rarity: 5,
        description: 'プラズマエフェクト',
        cssClass: 'skin-plasma'
    }
};

// ========================================
// ガチャシステム
// ========================================
const GachaSystem = {
    // 排出率
    rates: {
        5: 0.05,  // 5%
        4: 0.10,  // 10%
        3: 0.20,  // 20%
        2: 0.25,  // 25%
        1: 0.30   // 30%  (残り30%)
    },

    // 売却価格
    sellPrices: {
        tile: { 5: 500, 4: 200, 3: 100, 2: 50, 1: 10 },
        skill: { 5: 1000, 4: 500, 3: 200, 2: 100, 1: 50 }
    },

    /**
     * レアリティを抽選
     */
    rollRarity() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (let rarity = 5; rarity >= 1; rarity--) {
            cumulative += this.rates[rarity];
            if (rand < cumulative) {
                return rarity;
            }
        }
        return 1;
    },

    /**
     * タイルガチャを回す（「2」のみ排出）
     * @param {number} count - 回数（1 or 11）
     * @returns {Array} 結果配列
     */
    rollTileGacha(count = 1) {
        const results = [];
        
        for (let i = 0; i < count; i++) {
            const rarity = this.rollRarity();
            const skinsOfRarity = Object.values(TILE_SKINS).filter(s => s.rarity === rarity);
            
            if (skinsOfRarity.length > 0) {
                const skin = skinsOfRarity[Math.floor(Math.random() * skinsOfRarity.length)];
                const isNew = !GameData.hasTileSkin(skin.id);
                
                // 「2」のみ追加
                GameData.addTile(skin.id, 2);
                
                results.push({
                    type: 'tile',
                    item: skin,
                    value: 2,  // 常に2
                    rarity: rarity,
                    isNew: isNew
                });
            }
        }
        
        return results;
    },

    /**
     * スキルガチャを回す
     * @param {number} count - 回数（1 or 11）
     * @returns {Array} 結果配列
     */
    rollSkillGacha(count = 1) {
        const results = [];
        
        for (let i = 0; i < count; i++) {
            const rarity = this.rollRarity();
            const skillsOfRarity = Object.values(SKILLS).filter(s => s.rarity === rarity);
            
            if (skillsOfRarity.length > 0) {
                const skill = skillsOfRarity[Math.floor(Math.random() * skillsOfRarity.length)];
                results.push({
                    type: 'skill',
                    item: skill,
                    rarity: rarity,
                    isNew: !GameData.hasSkill(skill.id)
                });
                GameData.addSkill(skill.id);
            }
        }
        
        return results;
    }
};

// ========================================
// ステージ定義
// ========================================
const STAGES = [
    { id: 1, name: 'EASY', cpuLevel: 1 },
    { id: 2, name: 'NORMAL', cpuLevel: 1 },
    { id: 3, name: 'HARD', cpuLevel: 2 },
    { id: 4, name: 'EXPERT', cpuLevel: 2 },
    { id: 5, name: 'MASTER', cpuLevel: 3 },
    { id: 6, name: 'NIGHTMARE', cpuLevel: 3 },
    { id: 7, name: 'INFERNO', cpuLevel: 4 },
    { id: 8, name: 'ABYSS', cpuLevel: 4 },
    { id: 9, name: 'CHAOS', cpuLevel: 5 },
    { id: 10, name: 'WORLD END', cpuLevel: 5 }
];

