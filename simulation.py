#!/usr/bin/env python3
"""
VS1024 スキル出現率シミュレーション
"""

import random
from collections import Counter

# スキルデータ（ヤバさレベル、コスト、比重）
SKILLS = {
    # ヤバさ5 (コスト9-10, 比重3)
    'ラストスタンド': {'yabasa': 5, 'cost': 10, 'weight': 3},
    'リザレクション': {'yabasa': 5, 'cost': 10, 'weight': 3},
    'アポカリプス': {'yabasa': 5, 'cost': 9, 'weight': 3},
    'ダブル': {'yabasa': 5, 'cost': 9, 'weight': 3},
    'ガーディアン': {'yabasa': 5, 'cost': 9, 'weight': 3},
    'カタクリズム': {'yabasa': 5, 'cost': 9, 'weight': 3},
    
    # ヤバさ4 (コスト5-6, 比重10)
    'カース': {'yabasa': 4, 'cost': 5, 'weight': 10},
    'ミラー': {'yabasa': 4, 'cost': 5, 'weight': 10},
    'ヒール': {'yabasa': 4, 'cost': 6, 'weight': 10},
    'ブースト': {'yabasa': 4, 'cost': 5, 'weight': 10},
    'ウィークン': {'yabasa': 4, 'cost': 5, 'weight': 10},
    'アーマー': {'yabasa': 4, 'cost': 5, 'weight': 10},
    'ディケイ': {'yabasa': 4, 'cost': 5, 'weight': 10},
    'フュージョン': {'yabasa': 4, 'cost': 5, 'weight': 10},
    
    # ヤバさ3 (コスト4, 比重20)
    'リフレクト': {'yabasa': 3, 'cost': 4, 'weight': 20},
    'ピュリファイ': {'yabasa': 3, 'cost': 4, 'weight': 20},
    'アンプリファイ': {'yabasa': 3, 'cost': 4, 'weight': 20},
    'スワップ': {'yabasa': 3, 'cost': 4, 'weight': 20},
    'ダブルエッジ': {'yabasa': 3, 'cost': 4, 'weight': 20},
    
    # ヤバさ2 (コスト3, 比重30)
    'オーバーフロー': {'yabasa': 2, 'cost': 3, 'weight': 30},
    'タイムボム': {'yabasa': 2, 'cost': 3, 'weight': 30},
    'ヴァニッシュ': {'yabasa': 2, 'cost': 3, 'weight': 30},
    'アンカー': {'yabasa': 2, 'cost': 3, 'weight': 30},
    'スクランブル': {'yabasa': 2, 'cost': 3, 'weight': 30},
    'スウィープ': {'yabasa': 2, 'cost': 3, 'weight': 30},
    
    # ヤバさ1 (コスト2, 比重35)
    'フリーズ': {'yabasa': 1, 'cost': 2, 'weight': 35},
    'スマッシュ': {'yabasa': 1, 'cost': 2, 'weight': 35},
    'スティール': {'yabasa': 1, 'cost': 2, 'weight': 35},
    'アップグレード': {'yabasa': 1, 'cost': 2, 'weight': 35},
    'ディスラプト': {'yabasa': 1, 'cost': 2, 'weight': 35},
}

# 7パターンのスキル構成
LOADOUTS = {
    '① バランス型': ['ダブル', 'ブースト', 'スウィープ', 'スクランブル'],  # 9+5+3+3=20
    '② ロマン型': ['ダブル', 'ガーディアン', 'フリーズ'],  # 9+9+2=20
    '③ 安定型': ['リフレクト', 'ピュリファイ', 'アンプリファイ', 'スワップ', 'ダブルエッジ'],  # 4×5=20
    '④ 低コスト連発': ['フリーズ', 'スマッシュ', 'スティール', 'アップグレード', 'ディスラプト', 'オーバーフロー', 'タイムボム'],  # 2×5+3×2=16... 足りない
    '⑤ 攻撃特化': ['ダブル', 'ウィークン', 'アンプリファイ', 'フリーズ'],  # 9+5+4+2=20
    '⑥ 防御特化': ['ガーディアン', 'アーマー', 'リフレクト', 'フリーズ'],  # 9+5+4+2=20
    '⑦ 効果重視': ['ミラー', 'ブースト', 'スワップ', 'ヴァニッシュ', 'フリーズ'],  # 5+5+4+3+2=19 ←19でもOK
}

# 構成を修正（コスト19-20に収める、最大5個）
LOADOUTS = {
    '① バランス型': ['ダブル', 'ブースト', 'スウィープ', 'スクランブル'],  # 9+5+3+3=20
    '② ロマン型': ['ダブル', 'ガーディアン', 'フリーズ'],  # 9+9+2=20
    '③ 安定型': ['リフレクト', 'ピュリファイ', 'アンプリファイ', 'スワップ', 'ダブルエッジ'],  # 4×5=20
    '④ 低コスト連発': ['オーバーフロー', 'タイムボム', 'ヴァニッシュ', 'アンカー', 'スクランブル', 'スウィープ', 'フリーズ'],  # コスト多いので調整
    '⑤ 攻撃特化': ['ダブル', 'ウィークン', 'アンプリファイ', 'フリーズ'],  # 9+5+4+2=20
    '⑥ 防御特化': ['ガーディアン', 'アーマー', 'リフレクト', 'フリーズ'],  # 9+5+4+2=20
    '⑦ 効果重視': ['ミラー', 'ブースト', 'スワップ', 'ヴァニッシュ', 'フリーズ'],  # 5+5+4+3+2=19
}

# 再度構成を修正（最大5個厳守）
LOADOUTS = {
    '① バランス型': ['ダブル', 'ブースト', 'スウィープ', 'スクランブル'],  # 9+5+3+3=20, 4個
    '② ロマン型': ['ダブル', 'ガーディアン', 'フリーズ'],  # 9+9+2=20, 3個
    '③ 安定型': ['リフレクト', 'ピュリファイ', 'アンプリファイ', 'スワップ', 'ダブルエッジ'],  # 4×5=20, 5個
    '④ 低コスト連発': ['スウィープ', 'スクランブル', 'アンカー', 'ヴァニッシュ', 'タイムボム', 'オーバーフロー'],  # 3×6=18... 5個制限
    '⑤ 攻撃特化': ['ダブル', 'ウィークン', 'アンプリファイ', 'フリーズ'],  # 9+5+4+2=20, 4個
    '⑥ 防御特化': ['ガーディアン', 'アーマー', 'リフレクト', 'フリーズ'],  # 9+5+4+2=20, 4個
    '⑦ 効果重視': ['ミラー', 'ブースト', 'スワップ', 'ヴァニッシュ', 'フリーズ'],  # 5+5+4+3+2=19, 5個
}

# 最終修正（5個以内、コスト19-20）
LOADOUTS = {
    '① バランス型': ['ダブル', 'ブースト', 'スウィープ', 'スクランブル'],  # 9+5+3+3=20
    '② ロマン型': ['ダブル', 'ガーディアン', 'フリーズ'],  # 9+9+2=20
    '③ 安定型': ['リフレクト', 'ピュリファイ', 'アンプリファイ', 'スワップ', 'ダブルエッジ'],  # 4×5=20
    '④ 低コスト大量': ['スウィープ', 'スクランブル', 'アンカー', 'ヴァニッシュ', 'フリーズ'],  # 3+3+3+3+2=14... 足りない→調整
    '⑤ 攻撃特化': ['ダブル', 'ウィークン', 'アンプリファイ', 'フリーズ'],  # 9+5+4+2=20
    '⑥ 防御特化': ['ガーディアン', 'アーマー', 'リフレクト', 'フリーズ'],  # 9+5+4+2=20
    '⑦ 効果重視': ['ミラー', 'ブースト', 'スワップ', 'ヴァニッシュ', 'フリーズ'],  # 5+5+4+3+2=19
}

# 最終版
LOADOUTS = {
    '① バランス型 (Lv5+Lv4+Lv2×2)': ['ダブル', 'ブースト', 'スウィープ', 'スクランブル'],  # 9+5+3+3=20
    '② ロマン型 (Lv5×2+Lv1)': ['ダブル', 'ガーディアン', 'フリーズ'],  # 9+9+2=20
    '③ 安定型 (Lv3×5)': ['リフレクト', 'ピュリファイ', 'アンプリファイ', 'スワップ', 'ダブルエッジ'],  # 4×5=20
    '④ 量産型 (Lv2×5+Lv1)': ['スウィープ', 'スクランブル', 'アンカー', 'ヴァニッシュ', 'タイムボム'],  # 3×5=15 +フリーズ(2)=17... +オバフロ(3)=18
    '⑤ 攻撃特化 (Lv5+Lv4+Lv3+Lv1)': ['ダブル', 'ウィークン', 'アンプリファイ', 'フリーズ'],  # 9+5+4+2=20
    '⑥ 防御特化 (Lv5+Lv4+Lv3+Lv1)': ['ガーディアン', 'アーマー', 'リフレクト', 'フリーズ'],  # 9+5+4+2=20
    '⑦ 効果重視 (Lv4×2+Lv3+Lv2+Lv1)': ['ミラー', 'ブースト', 'スワップ', 'ヴァニッシュ', 'フリーズ'],  # 5+5+4+3+2=19
}

# コスト19-20に収まるように再調整
LOADOUTS = {
    '① バランス型': ['ダブル', 'ブースト', 'スウィープ', 'スクランブル'],
    '② ロマン型': ['ダブル', 'ガーディアン', 'フリーズ'],
    '③ 安定型': ['リフレクト', 'ピュリファイ', 'アンプリファイ', 'スワップ', 'ダブルエッジ'],
    '④ 量産型': ['ブースト', 'スウィープ', 'スクランブル', 'アンカー', 'フリーズ'],  # 5+3+3+3+2=16... +タイムボム(3)=19
    '⑤ 攻撃特化': ['ダブル', 'ウィークン', 'アンプリファイ', 'フリーズ'],
    '⑥ 防御特化': ['ガーディアン', 'アーマー', 'リフレクト', 'フリーズ'],
    '⑦ 効果重視': ['ミラー', 'ブースト', 'スワップ', 'ヴァニッシュ', 'フリーズ'],
}

def validate_loadout(name, skills):
    """構成のコストと個数を検証"""
    total_cost = sum(SKILLS[s]['cost'] for s in skills)
    return {
        'name': name,
        'skills': skills,
        'count': len(skills),
        'cost': total_cost,
        'valid': 19 <= total_cost <= 20 and len(skills) <= 5
    }

def weighted_random_choice(skills):
    """重み付きランダム選択"""
    total_weight = sum(SKILLS[s]['weight'] for s in skills)
    r = random.random() * total_weight
    for s in skills:
        r -= SKILLS[s]['weight']
        if r <= 0:
            return s
    return skills[-1]

def simulate_game(equipped_skills, num_tiles=400, skill_spawn_rate=0.05):
    """1ゲームをシミュレート"""
    skill_triggers = []
    
    for _ in range(num_tiles):
        if random.random() < skill_spawn_rate:
            # スキル付与 → 装備スキルから重み付き抽選
            triggered = weighted_random_choice(equipped_skills)
            skill_triggers.append(triggered)
    
    return skill_triggers

def run_simulation(loadout_name, equipped_skills, num_games=10000, tiles_per_game=400):
    """シミュレーション実行"""
    yabasa_counts = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    skill_counts = Counter()
    total_triggers = 0
    games_with_lv5 = 0
    
    for _ in range(num_games):
        triggers = simulate_game(equipped_skills, tiles_per_game)
        total_triggers += len(triggers)
        skill_counts.update(triggers)
        
        # ヤバさ5が1回以上出たゲーム数
        has_lv5 = any(SKILLS[s]['yabasa'] == 5 for s in triggers)
        if has_lv5:
            games_with_lv5 += 1
        
        for s in triggers:
            yabasa_counts[SKILLS[s]['yabasa']] += 1
    
    avg_triggers = total_triggers / num_games
    
    return {
        'loadout': loadout_name,
        'avg_triggers': avg_triggers,
        'yabasa_rates': {k: v / total_triggers * 100 if total_triggers > 0 else 0 for k, v in yabasa_counts.items()},
        'lv5_game_rate': games_with_lv5 / num_games * 100,
        'skill_counts': skill_counts,
        'total_triggers': total_triggers,
    }

def main():
    print("=" * 70)
    print("VS1024 スキル出現率シミュレーション")
    print("=" * 70)
    print(f"条件: 1ゲーム400タイル生成、スキル付与率5%、10000ゲーム試行")
    print("=" * 70)
    
    # 構成検証
    print("\n【構成検証】")
    for name, skills in LOADOUTS.items():
        info = validate_loadout(name, skills)
        status = "✅" if info['valid'] else "❌"
        weights = [SKILLS[s]['weight'] for s in skills]
        total_weight = sum(weights)
        print(f"{status} {name}")
        print(f"   スキル: {', '.join(skills)}")
        print(f"   コスト: {info['cost']}/20, 個数: {info['count']}/5")
        print(f"   比重: {weights} = {total_weight}")
        print()
    
    # シミュレーション実行
    print("\n" + "=" * 70)
    print("【シミュレーション結果】")
    print("=" * 70)
    
    for name, skills in LOADOUTS.items():
        info = validate_loadout(name, skills)
        if not info['valid']:
            print(f"\n⚠️ {name}: 無効な構成のためスキップ")
            continue
        
        result = run_simulation(name, skills)
        
        print(f"\n📊 {name}")
        print(f"   平均スキル発動回数/ゲーム: {result['avg_triggers']:.1f}回")
        print(f"   ヤバさ5が1回以上出るゲーム: {result['lv5_game_rate']:.1f}%")
        print(f"   ヤバさ別出現率:")
        for lv in [5, 4, 3, 2, 1]:
            rate = result['yabasa_rates'][lv]
            bar = "█" * int(rate / 2)
            print(f"      Lv{lv}: {rate:5.1f}% {bar}")
        
        print(f"   スキル別出現回数 (上位5):")
        for skill, count in result['skill_counts'].most_common(5):
            rate = count / result['total_triggers'] * 100
            print(f"      {skill}: {count}回 ({rate:.1f}%)")
    
    print("\n" + "=" * 70)
    print("シミュレーション完了")
    print("=" * 70)

if __name__ == "__main__":
    main()

