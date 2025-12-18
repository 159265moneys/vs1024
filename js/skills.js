/**
 * Skills - 全30スキル定義 v5.0
 * ヤバさレベルに基づくコスト/比重調整版
 * カテゴリ別枠: attack(赤/円), defense(緑/角丸四角), effect(青/角丸八角形)
 */

const SKILLS = {
    // ========================================
    // ★5 レジェンド（5種）
    // ========================================
    laststand: {
        id: 'laststand',
        name: 'ラストスタンド',
        nameEn: 'LastStand',
        icon: 'sprite/laststand.png',
        cost: 10,     // ヤバさ5
        rarity: 5,
        weight: 3,    // ヤバさ5 - 装備内約3%
        category: 'defense',
        description: '次に攻撃or詰みで2ダメージ以上くらって負ける時、無効化する'
    },
    resurrection: {
        id: 'resurrection',
        name: 'リザレクション',
        nameEn: 'Resurrection',
        icon: 'sprite/grace.png',
        cost: 10,     // ヤバさ5
        rarity: 5,
        weight: 3,    // ヤバさ5 - 装備内約3%
        category: 'defense',
        description: '死んだとき一度だけ蘇る。ただしタイル盤がリセットされる'
    },
    curse: {
        id: 'curse',
        name: 'カース',
        nameEn: 'Curse',
        icon: 'sprite/curse.png',
        cost: 5,      // ヤバさ4
        rarity: 5,
        weight: 10,   // ヤバさ4 - 装備内約10%
        category: 'attack',
        description: '次にダメージを受けた時、同じダメージを相手にも与える'
    },
    mirror: {
        id: 'mirror',
        name: 'ミラー',
        nameEn: 'Mirror',
        icon: 'sprite/mirror.png',
        cost: 5,      // ヤバさ4
        rarity: 5,
        weight: 10,   // ヤバさ4 - 装備内約10%
        category: 'effect',
        description: 'スキル使用時の相手の盤面と全く同じにする'
    },
    apocalypse: {
        id: 'apocalypse',
        name: 'アポカリプス',
        nameEn: 'Apocalypse',
        icon: 'sprite/apocalypse.png',
        cost: 9,      // ヤバさ5
        rarity: 5,
        weight: 3,    // ヤバさ5 - 装備内約3%
        category: 'effect',
        description: 'お互いの盤面をリセットする'
    },

    // ========================================
    // ★4 エピック（6種）
    // ========================================
    double: {
        id: 'double',
        name: 'ダブル',
        nameEn: 'Double',
        icon: 'sprite/double.png',
        cost: 9,      // ヤバさ5
        rarity: 4,
        weight: 3,    // ヤバさ5 - 装備内約3%
        category: 'attack',
        description: '次の攻撃ダメージを2倍にする'
    },
    guardian: {
        id: 'guardian',
        name: 'ガーディアン',
        nameEn: 'Guardian',
        icon: 'sprite/guardian.png',
        cost: 9,      // ヤバさ5
        rarity: 4,
        weight: 3,    // ヤバさ5 - 装備内約3%
        category: 'defense',
        description: '次の攻撃を無効化する'
    },
    heal: {
        id: 'heal',
        name: 'ヒール',
        nameEn: 'Heal',
        icon: 'sprite/heal.png',
        cost: 6,      // ヤバさ4
        rarity: 4,
        weight: 10,   // ヤバさ4 - 装備内約10%
        category: 'defense',
        description: 'HP1回復（最大HP上限まで）'
    },
    cataclysm: {
        id: 'cataclysm',
        name: 'カタクリズム',
        nameEn: 'Cataclysm',
        icon: 'sprite/cataclysm.png',
        cost: 9,      // ヤバさ5
        rarity: 4,
        weight: 3,    // ヤバさ5 - 装備内約3%
        category: 'effect',
        description: 'お互いの盤面を入れ替える'
    },
    boost: {
        id: 'boost',
        name: 'ブースト',
        nameEn: 'Boost',
        icon: 'sprite/boost.png',
        cost: 5,      // ヤバさ4
        rarity: 4,
        weight: 10,   // ヤバさ4 - 装備内約10%
        category: 'effect',
        description: '自分のランダムな数字のタイルを全て1段階上げる'
    },
    weaken: {
        id: 'weaken',
        name: 'ウィークン',
        nameEn: 'Weaken',
        icon: 'sprite/weaken.png',
        cost: 5,      // ヤバさ4
        rarity: 4,
        weight: 10,   // ヤバさ4 - 装備内約10%
        category: 'attack',
        description: '相手のランダムな1種類のタイルを全て1レベル下げる'
    },

    // ========================================
    // ★3 レア（6種）
    // ========================================
    reflect: {
        id: 'reflect',
        name: 'リフレクト',
        nameEn: 'Reflect',
        icon: 'sprite/reflect.png',
        cost: 4,      // ヤバさ3
        rarity: 3,
        weight: 20,   // ヤバさ3
        category: 'defense',
        description: '次の相手のスキルor妨害タイルを跳ね返す'
    },
    purify: {
        id: 'purify',
        name: 'ピュリファイ',
        nameEn: 'Purify',
        icon: 'sprite/purify.png',
        cost: 4,      // ヤバさ3
        rarity: 3,
        weight: 20,   // ヤバさ3
        category: 'defense',
        description: '自分の不利効果/相手の有利効果を全て削除する'
    },
    amplify: {
        id: 'amplify',
        name: 'アンプリファイ',
        nameEn: 'Amplify',
        icon: 'sprite/amplify.png',
        cost: 4,      // ヤバさ3
        rarity: 3,
        weight: 20,   // ヤバさ3
        category: 'attack',
        description: '次の妨害タイルの効果が2倍になる'
    },
    swap: {
        id: 'swap',
        name: 'スワップ',
        nameEn: 'Swap',
        icon: 'sprite/swap.png',
        cost: 4,      // ヤバさ3
        rarity: 3,
        weight: 20,   // ヤバさ3
        category: 'effect',
        description: 'お互いのランダムな数字のタイルをまるごと交換する'
    },
    doubleedge: {
        id: 'doubleedge',
        name: 'ダブルエッジ',
        nameEn: 'DoubleEdge',
        icon: 'sprite/doubleedge.png',
        cost: 4,      // ヤバさ3
        rarity: 3,
        weight: 20,   // ヤバさ3
        category: 'attack',
        description: 'お互いに1ダメージを与える'
    },
    armor: {
        id: 'armor',
        name: 'アーマー',
        nameEn: 'Armor',
        icon: 'sprite/armor.png',
        cost: 5,      // ヤバさ4
        rarity: 3,
        weight: 10,   // ヤバさ4 - 装備内約10%
        category: 'defense',
        description: '次の攻撃ダメージを-1する'
    },

    // ========================================
    // ★2 アンコモン（7種）
    // ========================================
    overflow: {
        id: 'overflow',
        name: 'オーバーフロー',
        nameEn: 'Overflow',
        icon: 'sprite/overflow.png',
        cost: 3,      // ヤバさ2
        rarity: 2,
        weight: 30,   // ヤバさ2
        category: 'attack',
        description: '敵は10秒間、タイル合成時に生成される2が2個になる'
    },
    timebomb: {
        id: 'timebomb',
        name: 'タイムボム',
        nameEn: 'TimeBomb',
        icon: 'sprite/timebomb.png',
        cost: 3,      // ヤバさ2
        rarity: 2,
        weight: 30,   // ヤバさ2
        category: 'attack',
        description: '敵盤面にボム(2~8)設置。5秒以内に消さないと3×3範囲削除'
    },
    vanish: {
        id: 'vanish',
        name: 'ヴァニッシュ',
        nameEn: 'Vanish',
        icon: 'sprite/vanish.png',
        cost: 3,      // ヤバさ2
        rarity: 2,
        weight: 30,   // ヤバさ2
        category: 'effect',
        description: '2~128のランダムな数字のタイルを両者から全消しする'
    },
    anchor: {
        id: 'anchor',
        name: 'アンカー',
        nameEn: 'Anchor',
        icon: 'sprite/anchor.png',
        cost: 3,      // ヤバさ2
        rarity: 2,
        weight: 30,   // ヤバさ2
        category: 'defense',
        description: '10秒間、自分の盤面の四隅が固定される'
    },
    scramble: {
        id: 'scramble',
        name: 'スクランブル',
        nameEn: 'Scramble',
        icon: 'sprite/scramble.png',
        cost: 3,      // ヤバさ2
        rarity: 2,
        weight: 30,   // ヤバさ2
        category: 'attack',
        description: 'お互いに2を3つランダム生成する'
    },
    sweep: {
        id: 'sweep',
        name: 'スウィープ',
        nameEn: 'Sweep',
        icon: 'sprite/sweep.png',
        cost: 3,      // ヤバさ2
        rarity: 2,
        weight: 30,   // ヤバさ2
        category: 'effect',
        description: 'お互いの2を3つ消す'
    },
    decay: {
        id: 'decay',
        name: 'ディケイ',
        nameEn: 'Decay',
        icon: 'sprite/decay.png',
        cost: 5,      // ヤバさ4
        rarity: 2,
        weight: 10,   // ヤバさ4 - 装備内約10%
        category: 'effect',
        description: 'お互いのタイル全てを1レベル下げる（2は消滅）'
    },

    // ========================================
    // ★1 コモン（6種）
    // ========================================
    freeze: {
        id: 'freeze',
        name: 'フリーズ',
        nameEn: 'Freeze',
        icon: 'sprite/freeze.png',
        cost: 2,      // ヤバさ1
        rarity: 1,
        weight: 35,   // ヤバさ1
        category: 'effect',
        description: '相手の盤面を3秒間停止させる'
    },
    smash: {
        id: 'smash',
        name: 'スマッシュ',
        nameEn: 'Smash',
        icon: 'sprite/smash.png',
        cost: 2,      // ヤバさ1
        rarity: 1,
        weight: 35,   // ヤバさ1
        category: 'attack',
        description: '好きなタイルを1タップして破壊する'
    },
    steal: {
        id: 'steal',
        name: 'スティール',
        nameEn: 'Steal',
        icon: 'sprite/steal.png',
        cost: 2,      // ヤバさ1
        rarity: 1,
        weight: 35,   // ヤバさ1
        category: 'attack',
        description: '相手のタイルから1つランダムに自分の盤面に追加する'
    },
    upgrade: {
        id: 'upgrade',
        name: 'アップグレード',
        nameEn: 'Upgrade',
        icon: 'sprite/upgrade.png',
        cost: 2,      // ヤバさ1
        rarity: 1,
        weight: 35,   // ヤバさ1
        category: 'effect',
        description: '自分の2を全て4に変換する'
    },
    disrupt: {
        id: 'disrupt',
        name: 'ディスラプト',
        nameEn: 'Disrupt',
        icon: 'sprite/disrupt.png',
        cost: 2,      // ヤバさ1
        rarity: 1,
        weight: 35,   // ヤバさ1
        category: 'attack',
        description: '相手に妨害タイルを1個生成する'
    },
    fusion: {
        id: 'fusion',
        name: 'フュージョン',
        nameEn: 'Fusion',
        icon: 'sprite/fusion.png',
        cost: 5,      // ヤバさ4
        rarity: 1,
        weight: 10,   // ヤバさ4 - 装備内約10%
        category: 'effect',
        description: '自分の盤面で1回で合成可能なタイルを全て合成する'
    }
};

// カテゴリ定義
const SKILL_CATEGORIES = {
    attack:  { name: '攻撃', color: '#ff3366', shape: 'circle' },         // 赤
    defense: { name: '防御', color: '#22c55e', shape: 'rounded-square' }, // 緑
    effect:  { name: '効果', color: '#3b82f6', shape: 'rounded-octagon' } // 青
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

function getAllSkillIds() {
    return Object.keys(SKILLS);
}

function getSkillById(id) {
    return SKILLS[id] || null;
}

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

/**
 * 装備スキルからランダムに1つ選ぶ（重み付き）
 * @returns {Object|null} スキルオブジェクト、装備なしならnull
 */
function getRandomSkillFromEquipped() {
    const equippedIds = GameData.getEquippedSkills();
    if (!equippedIds || equippedIds.length === 0) return null;
    
    // 装備スキルのみ抽出
    const equippedSkills = equippedIds
        .map(id => SKILLS[id])
        .filter(skill => skill != null);
    
    if (equippedSkills.length === 0) return null;
    
    // 重み付き抽選
    const totalWeight = equippedSkills.reduce((sum, skill) => sum + skill.weight, 0);
    let rand = Math.random() * totalWeight;
    
    for (const skill of equippedSkills) {
        rand -= skill.weight;
        if (rand <= 0) {
            return skill;
        }
    }
    
    return equippedSkills[equippedSkills.length - 1];
}
