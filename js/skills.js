/**
 * Skills - 全30スキル定義 v3.0
 * 合成時5%ランダム発動、重み付き抽選
 */

const SKILLS = {
    // ========================================
    // ★5 レジェンド（4種）
    // ========================================
    laststand: {
        id: 'laststand',
        name: 'ラストスタンド',
        nameEn: 'LastStand',
        icon: '🏴',
        cost: 8,
        rarity: 5,
        weight: 1,
        description: '次に攻撃or詰みで2ダメージ以上くらって負ける時、無効化する'
    },
    overflow: {
        id: 'overflow',
        name: 'オーバーフロー',
        nameEn: 'Overflow',
        icon: '🌊',
        cost: 7,
        rarity: 5,
        weight: 2,
        description: '敵は10秒間、タイル合成時に生成される2が2個になる'
    },
    grace: {
        id: 'grace',
        name: 'グレイス',
        nameEn: 'Grace',
        icon: '🕊️',
        cost: 7,
        rarity: 5,
        weight: 2,
        description: 'これから20秒間、詰んでもダメージを受けない'
    },
    mirror: {
        id: 'mirror',
        name: 'ミラー',
        nameEn: 'Mirror',
        icon: '🔮',
        cost: 7,
        rarity: 5,
        weight: 2,
        description: 'スキル使用時の相手の盤面と全く同じにする'
    },

    // ========================================
    // ★4 エピック（5種）
    // ========================================
    double: {
        id: 'double',
        name: 'ダブル',
        nameEn: 'Double',
        icon: '⚔️',
        cost: 5,
        rarity: 4,
        weight: 4,
        description: '次の攻撃ダメージを2倍にする'
    },
    guardian: {
        id: 'guardian',
        name: 'ガーディアン',
        nameEn: 'Guardian',
        icon: '🛡️',
        cost: 5,
        rarity: 4,
        weight: 4,
        description: '次の攻撃を無効化する'
    },
    heal: {
        id: 'heal',
        name: 'ヒール',
        nameEn: 'Heal',
        icon: '💚',
        cost: 6,
        rarity: 4,
        weight: 3,
        description: 'HP1回復（最大HP上限まで）'
    },
    freeze: {
        id: 'freeze',
        name: 'フリーズ',
        nameEn: 'Freeze',
        icon: '❄️',
        cost: 5,
        rarity: 4,
        weight: 4,
        description: '相手の盤面を3秒間停止させる'
    },
    reflect: {
        id: 'reflect',
        name: 'リフレクト',
        nameEn: 'Reflect',
        icon: '🪞',
        cost: 5,
        rarity: 4,
        weight: 4,
        description: '次の相手のスキルor妨害タイルを跳ね返す'
    },

    // ========================================
    // ★3 レア（6種）
    // ========================================
    apocalypse: {
        id: 'apocalypse',
        name: 'アポカリプス',
        nameEn: 'Apocalypse',
        icon: '💀',
        cost: 4,
        rarity: 3,
        weight: 5,
        description: 'お互いの盤面をリセットする'
    },
    smash: {
        id: 'smash',
        name: 'スマッシュ',
        nameEn: 'Smash',
        icon: '🔨',
        cost: 4,
        rarity: 3,
        weight: 5,
        description: '好きなタイルを1タップして破壊する'
    },
    timebomb: {
        id: 'timebomb',
        name: 'タイムボム',
        nameEn: 'TimeBomb',
        icon: '💣',
        cost: 4,
        rarity: 3,
        weight: 5,
        description: '敵盤面にボム(2~8)設置。5秒以内に消さないと3×3範囲削除'
    },
    purify: {
        id: 'purify',
        name: 'ピュリファイ',
        nameEn: 'Purify',
        icon: '✨',
        cost: 4,
        rarity: 3,
        weight: 5,
        description: '自分の不利効果/相手の有利効果を全て削除する'
    },
    boost: {
        id: 'boost',
        name: 'ブースト',
        nameEn: 'Boost',
        icon: '🚀',
        cost: 4,
        rarity: 3,
        weight: 5,
        description: '自分のランダムな数字のタイルを全て1段階上げる'
    },
    steal: {
        id: 'steal',
        name: 'スティール',
        nameEn: 'Steal',
        icon: '🤏',
        cost: 4,
        rarity: 3,
        weight: 5,
        description: '相手のタイルから1つランダムに自分の盤面に追加する'
    },

    // ========================================
    // ★2 アンコモン（7種）
    // ========================================
    armor: {
        id: 'armor',
        name: 'アーマー',
        nameEn: 'Armor',
        icon: '🪖',
        cost: 3,
        rarity: 2,
        weight: 6,
        description: '次の攻撃ダメージを-1する'
    },
    amplify: {
        id: 'amplify',
        name: 'アンプリファイ',
        nameEn: 'Amplify',
        icon: '📢',
        cost: 3,
        rarity: 2,
        weight: 6,
        description: '次の妨害タイルの効果が2倍になる'
    },
    swap: {
        id: 'swap',
        name: 'スワップ',
        nameEn: 'Swap',
        icon: '🔄',
        cost: 3,
        rarity: 2,
        weight: 6,
        description: 'お互いのランダムな数字のタイルをまるごと交換する'
    },
    vanish: {
        id: 'vanish',
        name: 'ヴァニッシュ',
        nameEn: 'Vanish',
        icon: '👁️',
        cost: 3,
        rarity: 2,
        weight: 6,
        description: '2~128のランダムな数字のタイルを両者から全消しする'
    },
    anchor: {
        id: 'anchor',
        name: 'アンカー',
        nameEn: 'Anchor',
        icon: '⚓',
        cost: 3,
        rarity: 2,
        weight: 6,
        description: '10秒間、自分の盤面の四隅が固定される'
    },
    decay: {
        id: 'decay',
        name: 'ディケイ',
        nameEn: 'Decay',
        icon: '🦠',
        cost: 3,
        rarity: 2,
        weight: 6,
        description: 'お互いのタイル全てを1レベル下げる（2は消滅）'
    },
    upgrade: {
        id: 'upgrade',
        name: 'アップグレード',
        nameEn: 'Upgrade',
        icon: '⬆️',
        cost: 3,
        rarity: 2,
        weight: 6,
        description: '自分の2を全て4に変換する'
    },

    // ========================================
    // ★1 コモン（8種）
    // ========================================
    doubleedge: {
        id: 'doubleedge',
        name: 'ダブルエッジ',
        nameEn: 'DoubleEdge',
        icon: '🗡️',
        cost: 2,
        rarity: 1,
        weight: 7,
        description: 'お互いに1ダメージを与える'
    },
    scramble: {
        id: 'scramble',
        name: 'スクランブル',
        nameEn: 'Scramble',
        icon: '🔀',
        cost: 2,
        rarity: 1,
        weight: 7,
        description: 'お互いに2を3つランダム生成する'
    },
    sweep: {
        id: 'sweep',
        name: 'スウィープ',
        nameEn: 'Sweep',
        icon: '🧹',
        cost: 2,
        rarity: 1,
        weight: 7,
        description: 'お互いの2を3つ消す'
    },
    disrupt: {
        id: 'disrupt',
        name: 'ディスラプト',
        nameEn: 'Disrupt',
        icon: '⚡',
        cost: 2,
        rarity: 1,
        weight: 7,
        description: '相手に妨害タイルを1個生成する'
    },
    weaken: {
        id: 'weaken',
        name: 'ウィークン',
        nameEn: 'Weaken',
        icon: '💧',
        cost: 2,
        rarity: 1,
        weight: 7,
        description: '相手のランダムな1種類のタイルを全て1レベル下げる'
    },
    cataclysm: {
        id: 'cataclysm',
        name: 'カタクリズム',
        nameEn: 'Cataclysm',
        icon: '🌋',
        cost: 2,
        rarity: 1,
        weight: 7,
        description: 'お互いの盤面を入れ替える'
    },
    curse: {
        id: 'curse',
        name: 'カース',
        nameEn: 'Curse',
        icon: '👻',
        cost: 2,
        rarity: 1,
        weight: 7,
        description: '次にダメージを受けた時、同じダメージを相手にも与える'
    },
    fusion: {
        id: 'fusion',
        name: 'フュージョン',
        nameEn: 'Fusion',
        icon: '💥',
        cost: 2,
        rarity: 1,
        weight: 7,
        description: '自分の盤面で1回で合成可能なタイルを全て合成する'
    }
};

// ========================================
// スキルユーティリティ関数
// ========================================

/**
 * 装備中のスキルから重み付きでランダムに1つ選択
 * @param {Array} equippedSkillIds - 装備中のスキルID配列
 * @returns {Object|null} 選ばれたスキル、または装備なしならnull
 */
function getWeightedRandomSkill(equippedSkillIds) {
    if (!equippedSkillIds || equippedSkillIds.length === 0) {
        return null;
    }
    
    // 有効なスキルのみ抽出
    const validSkills = equippedSkillIds
        .filter(id => id && SKILLS[id])
        .map(id => SKILLS[id]);
    
    if (validSkills.length === 0) {
        return null;
    }
    
    // 重み合計を計算
    const totalWeight = validSkills.reduce((sum, skill) => sum + skill.weight, 0);
    
    // 重み付き抽選
    let rand = Math.random() * totalWeight;
    for (const skill of validSkills) {
        rand -= skill.weight;
        if (rand <= 0) {
            return skill;
        }
    }
    
    // フォールバック
    return validSkills[validSkills.length - 1];
}

/**
 * 全スキルからレアリティでフィルタ
 * @param {number} rarity - レアリティ（1-5）
 * @returns {Array} スキル配列
 */
function getSkillsByRarity(rarity) {
    return Object.values(SKILLS).filter(s => s.rarity === rarity);
}

/**
 * 全スキルからコストでフィルタ
 * @param {number} cost - コスト
 * @returns {Array} スキル配列
 */
function getSkillsByCost(cost) {
    return Object.values(SKILLS).filter(s => s.cost === cost);
}

/**
 * スキルのレアリティ文字列を取得
 * @param {number} rarity - レアリティ（1-5）
 * @returns {string} 星文字列
 */
function getRarityStars(rarity) {
    return '★'.repeat(rarity);
}

/**
 * スキルの発動確率を計算（装備スキルベース）
 * @param {Object} skill - スキルオブジェクト
 * @param {Array} equippedSkillIds - 装備中のスキルID配列
 * @returns {number} 発動確率（0-1）
 */
function getSkillActivationRate(skill, equippedSkillIds) {
    if (!equippedSkillIds || equippedSkillIds.length === 0) {
        return 0;
    }
    
    const validSkills = equippedSkillIds
        .filter(id => id && SKILLS[id])
        .map(id => SKILLS[id]);
    
    const totalWeight = validSkills.reduce((sum, s) => sum + s.weight, 0);
    
    if (totalWeight === 0) return 0;
    
    // 基礎発動率5% × スキルの重み比率
    return 0.05 * (skill.weight / totalWeight);
}

// 旧互換性のためのエイリアス（game.jsなどで使用）
const SKILL_ACTIVATION_CHANCE = 0.05;  // 5%

/**
 * スキル情報を取得
 * @param {string} skillId - スキルID
 * @returns {Object|null} スキル情報
 */
function getSkillInfo(skillId) {
    return SKILLS[skillId] || null;
}

/**
 * 全スキルから重み付きランダムで1つ選択（装備なし版）
 * @returns {Object} 選ばれたスキル
 */
function getRandomSkillFromAll() {
    const allSkills = Object.values(SKILLS);
    const totalWeight = allSkills.reduce((sum, skill) => sum + skill.weight, 0);
    
    let rand = Math.random() * totalWeight;
    for (const skill of allSkills) {
        rand -= skill.weight;
        if (rand <= 0) {
            return skill;
        }
    }
    
    return allSkills[allSkills.length - 1];
}
