/**
 * Skills - スキルシステム v2.5
 * 重み付きランダム発動 (5%)
 */

const SKILLS = {
    shield: {
        id: 'shield',
        name: 'シールド',
        icon: '🛡️',
        description: '次の攻撃を無効化',
        weight: 5  // 0.25%
    },
    reflect: {
        id: 'reflect',
        name: 'リフレクト',
        icon: '🪞',
        description: '次の妨害を敵に跳ね返す',
        weight: 20  // 1.0%
    },
    clean: {
        id: 'clean',
        name: 'クリーン',
        icon: '🧹',
        description: '両者の盤面の2を全消し',
        weight: 10  // 0.5%
    },
    double: {
        id: 'double',
        name: 'ダブル',
        icon: '⚡',
        description: '次の攻撃ダメージ2倍',
        weight: 5  // 0.25%
    },
    bomb: {
        id: 'bomb',
        name: 'ボム',
        icon: '💣',
        description: '3秒後に3×3爆破',
        weight: 15  // 0.75%
    },
    freeze: {
        id: 'freeze',
        name: 'フリーズ',
        icon: '❄️',
        description: '敵を3秒間停止',
        weight: 20  // 1.0%
    },
    convert: {
        id: 'convert',
        name: 'コンバート',
        icon: '🔄',
        description: '自分の2を1つ→4に',
        weight: 10  // 0.5%
    },
    dice: {
        id: 'dice',
        name: 'ダイス',
        icon: '🎲',
        description: '2~128ランダム1種全消し',
        weight: 15  // 0.75%
    }
};

// 重みの合計
const TOTAL_WEIGHT = Object.values(SKILLS).reduce((sum, s) => sum + s.weight, 0);

/**
 * スキル情報を取得
 */
function getSkillInfo(skillId) {
    return SKILLS[skillId] || null;
}

/**
 * 全スキルIDを取得
 */
function getAllSkillIds() {
    return Object.keys(SKILLS);
}

/**
 * 重み付きランダムでスキルを選択
 */
function getWeightedRandomSkill() {
    let random = Math.random() * TOTAL_WEIGHT;
    
    for (const skill of Object.values(SKILLS)) {
        random -= skill.weight;
        if (random <= 0) {
            return skill;
        }
    }
    
    // フォールバック
    return SKILLS.clean;
}
