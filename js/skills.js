/**
 * Skills - 全30スキル定義 v4.0
 * カテゴリ別枠: attack(赤/円), defense(緑/ダイヤ), effect(青/六角形)
 * レアリティ別背景演出
 */

const SKILLS = {
    // ========================================
    // ★5 レジェンド（4種）
    // ========================================
    laststand: {
        id: 'laststand',
        name: 'ラストスタンド',
        nameEn: 'LastStand',
        icon: 'sprite/laststand.png',
        cost: 8,
        rarity: 5,
        weight: 1,
        category: 'defense',
        description: '次に攻撃or詰みで2ダメージ以上くらって負ける時、無効化する'
    },
    overflow: {
        id: 'overflow',
        name: 'オーバーフロー',
        nameEn: 'Overflow',
        icon: 'sprite/overflow.png',
        cost: 7,
        rarity: 5,
        weight: 2,
        category: 'attack',
        description: '敵は10秒間、タイル合成時に生成される2が2個になる'
    },
    resurrection: {
        id: 'resurrection',
        name: 'リザレクション',
        nameEn: 'Resurrection',
        icon: 'sprite/grace.png',
        cost: 7,
        rarity: 5,
        weight: 2,
        category: 'defense',
        description: '死んだとき一度だけ蘇る。ただしタイル盤がリセットされる'
    },
    mirror: {
        id: 'mirror',
        name: 'ミラー',
        nameEn: 'Mirror',
        icon: 'sprite/mirror.png',
        cost: 7,
        rarity: 5,
        weight: 2,
        category: 'effect',
        description: 'スキル使用時の相手の盤面と全く同じにする'
    },

    // ========================================
    // ★4 エピック（5種）
    // ========================================
    double: {
        id: 'double',
        name: 'ダブル',
        nameEn: 'Double',
        icon: 'sprite/double.png',
        cost: 5,
        rarity: 4,
        weight: 4,
        category: 'attack',
        description: '次の攻撃ダメージを2倍にする'
    },
    guardian: {
        id: 'guardian',
        name: 'ガーディアン',
        nameEn: 'Guardian',
        icon: 'sprite/guardian.png',
        cost: 5,
        rarity: 4,
        weight: 4,
        category: 'defense',
        description: '次の攻撃を無効化する'
    },
    heal: {
        id: 'heal',
        name: 'ヒール',
        nameEn: 'Heal',
        icon: 'sprite/heal.png',
        cost: 6,
        rarity: 4,
        weight: 3,
        category: 'defense',
        description: 'HP1回復（最大HP上限まで）'
    },
    freeze: {
        id: 'freeze',
        name: 'フリーズ',
        nameEn: 'Freeze',
        icon: 'sprite/freeze.png',
        cost: 5,
        rarity: 4,
        weight: 4,
        category: 'effect',
        description: '相手の盤面を3秒間停止させる'
    },
    reflect: {
        id: 'reflect',
        name: 'リフレクト',
        nameEn: 'Reflect',
        icon: 'sprite/reflect.png',
        cost: 5,
        rarity: 4,
        weight: 4,
        category: 'defense',
        description: '次の相手のスキルor妨害タイルを跳ね返す'
    },

    // ========================================
    // ★3 レア（6種）
    // ========================================
    apocalypse: {
        id: 'apocalypse',
        name: 'アポカリプス',
        nameEn: 'Apocalypse',
        icon: 'sprite/apocalypse.png',
        cost: 4,
        rarity: 3,
        weight: 5,
        category: 'effect',
        description: 'お互いの盤面をリセットする'
    },
    smash: {
        id: 'smash',
        name: 'スマッシュ',
        nameEn: 'Smash',
        icon: 'sprite/smash.png',
        cost: 4,
        rarity: 3,
        weight: 5,
        category: 'attack',
        description: '好きなタイルを1タップして破壊する'
    },
    timebomb: {
        id: 'timebomb',
        name: 'タイムボム',
        nameEn: 'TimeBomb',
        icon: 'sprite/timebomb.png',
        cost: 4,
        rarity: 3,
        weight: 5,
        category: 'attack',
        description: '敵盤面にボム(2~8)設置。5秒以内に消さないと3×3範囲削除'
    },
    purify: {
        id: 'purify',
        name: 'ピュリファイ',
        nameEn: 'Purify',
        icon: 'sprite/purify.png',
        cost: 4,
        rarity: 3,
        weight: 5,
        category: 'defense',
        description: '自分の不利効果/相手の有利効果を全て削除する'
    },
    boost: {
        id: 'boost',
        name: 'ブースト',
        nameEn: 'Boost',
        icon: 'sprite/boost.png',
        cost: 4,
        rarity: 3,
        weight: 5,
        category: 'effect',
        description: '自分のランダムな数字のタイルを全て1段階上げる'
    },
    steal: {
        id: 'steal',
        name: 'スティール',
        nameEn: 'Steal',
        icon: 'sprite/steal.png',
        cost: 4,
        rarity: 3,
        weight: 5,
        category: 'attack',
        description: '相手のタイルから1つランダムに自分の盤面に追加する'
    },

    // ========================================
    // ★2 アンコモン（7種）
    // ========================================
    armor: {
        id: 'armor',
        name: 'アーマー',
        nameEn: 'Armor',
        icon: 'sprite/armor.png',
        cost: 3,
        rarity: 2,
        weight: 6,
        category: 'defense',
        description: '次の攻撃ダメージを-1する'
    },
    amplify: {
        id: 'amplify',
        name: 'アンプリファイ',
        nameEn: 'Amplify',
        icon: 'sprite/amplify.png',
        cost: 3,
        rarity: 2,
        weight: 6,
        category: 'attack',
        description: '次の妨害タイルの効果が2倍になる'
    },
    swap: {
        id: 'swap',
        name: 'スワップ',
        nameEn: 'Swap',
        icon: 'sprite/swap.png',
        cost: 3,
        rarity: 2,
        weight: 6,
        category: 'effect',
        description: 'お互いのランダムな数字のタイルをまるごと交換する'
    },
    vanish: {
        id: 'vanish',
        name: 'ヴァニッシュ',
        nameEn: 'Vanish',
        icon: 'sprite/vanish.png',
        cost: 3,
        rarity: 2,
        weight: 6,
        category: 'effect',
        description: '2~128のランダムな数字のタイルを両者から全消しする'
    },
    anchor: {
        id: 'anchor',
        name: 'アンカー',
        nameEn: 'Anchor',
        icon: 'sprite/anchor.png',
        cost: 3,
        rarity: 2,
        weight: 6,
        category: 'defense',
        description: '10秒間、自分の盤面の四隅が固定される'
    },
    decay: {
        id: 'decay',
        name: 'ディケイ',
        nameEn: 'Decay',
        icon: 'sprite/decay.png',
        cost: 3,
        rarity: 2,
        weight: 6,
        category: 'effect',
        description: 'お互いのタイル全てを1レベル下げる（2は消滅）'
    },
    upgrade: {
        id: 'upgrade',
        name: 'アップグレード',
        nameEn: 'Upgrade',
        icon: 'sprite/upgrade.png',
        cost: 3,
        rarity: 2,
        weight: 6,
        category: 'effect',
        description: '自分の2を全て4に変換する'
    },

    // ========================================
    // ★1 コモン（8種）
    // ========================================
    doubleedge: {
        id: 'doubleedge',
        name: 'ダブルエッジ',
        nameEn: 'DoubleEdge',
        icon: 'sprite/doubleedge.png',
        cost: 2,
        rarity: 1,
        weight: 7,
        category: 'attack',
        description: 'お互いに1ダメージを与える'
    },
    scramble: {
        id: 'scramble',
        name: 'スクランブル',
        nameEn: 'Scramble',
        icon: 'sprite/scramble.png',
        cost: 2,
        rarity: 1,
        weight: 7,
        category: 'attack',
        description: 'お互いに2を3つランダム生成する'
    },
    sweep: {
        id: 'sweep',
        name: 'スウィープ',
        nameEn: 'Sweep',
        icon: 'sprite/sweep.png',
        cost: 2,
        rarity: 1,
        weight: 7,
        category: 'effect',
        description: 'お互いの2を3つ消す'
    },
    disrupt: {
        id: 'disrupt',
        name: 'ディスラプト',
        nameEn: 'Disrupt',
        icon: 'sprite/disrupt.png',
        cost: 2,
        rarity: 1,
        weight: 7,
        category: 'attack',
        description: '相手に妨害タイルを1個生成する'
    },
    weaken: {
        id: 'weaken',
        name: 'ウィークン',
        nameEn: 'Weaken',
        icon: 'sprite/weaken.png',
        cost: 2,
        rarity: 1,
        weight: 7,
        category: 'attack',
        description: '相手のランダムな1種類のタイルを全て1レベル下げる'
    },
    cataclysm: {
        id: 'cataclysm',
        name: 'カタクリズム',
        nameEn: 'Cataclysm',
        icon: 'sprite/cataclysm.png',
        cost: 2,
        rarity: 1,
        weight: 7,
        category: 'effect',
        description: 'お互いの盤面を入れ替える'
    },
    curse: {
        id: 'curse',
        name: 'カース',
        nameEn: 'Curse',
        icon: 'sprite/curse.png',
        cost: 7,
        rarity: 5,
        weight: 2,
        category: 'attack',
        description: '次にダメージを受けた時、同じダメージを相手にも与える'
    },
    fusion: {
        id: 'fusion',
        name: 'フュージョン',
        nameEn: 'Fusion',
        icon: 'sprite/fusion.png',
        cost: 2,
        rarity: 1,
        weight: 7,
        category: 'effect',
        description: '自分の盤面で1回で合成可能なタイルを全て合成する'
    }
};

// カテゴリ定義
const SKILL_CATEGORIES = {
    attack:  { name: '攻撃', color: '#ff3366', shape: 'circle' },
    defense: { name: '防御', color: '#00ff88', shape: 'diamond' },
    effect:  { name: '効果', color: '#00aaff', shape: 'hexagon' }
};

// ========================================
// スキルユーティリティ関数
// ========================================

function getWeightedRandomSkill(equippedSkillIds) {
    if (!equippedSkillIds || equippedSkillIds.length === 0) {
        return null;
    }
    
    const validSkills = equippedSkillIds
        .filter(id => id && SKILLS[id])
        .map(id => SKILLS[id]);
    
    if (validSkills.length === 0) {
        return null;
    }
    
    const totalWeight = validSkills.reduce((sum, skill) => sum + skill.weight, 0);
    
    let rand = Math.random() * totalWeight;
    for (const skill of validSkills) {
        rand -= skill.weight;
        if (rand <= 0) {
            return skill;
        }
    }
    
    return validSkills[validSkills.length - 1];
}

function getSkillsByRarity(rarity) {
    return Object.values(SKILLS).filter(s => s.rarity === rarity);
}

function getSkillsByCost(cost) {
    return Object.values(SKILLS).filter(s => s.cost === cost);
}

function getRarityStars(rarity) {
    return '★'.repeat(rarity);
}

function getSkillActivationRate(skill, equippedSkillIds) {
    if (!equippedSkillIds || equippedSkillIds.length === 0) {
        return 0;
    }
    
    const validSkills = equippedSkillIds
        .filter(id => id && SKILLS[id])
        .map(id => SKILLS[id]);
    
    const totalWeight = validSkills.reduce((sum, s) => sum + s.weight, 0);
    
    if (totalWeight === 0) return 0;
    
    return 0.05 * (skill.weight / totalWeight);
}

const SKILL_ACTIVATION_CHANCE = 0.05;

function getSkillInfo(skillId) {
    return SKILLS[skillId] || null;
}

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
