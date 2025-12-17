/**
 * Game - 対戦型2048ゲームコントローラー v2.6
 * スキル: 合成時3%でランダム発動 + 弾演出
 */
class Game {
    constructor() {
        this.playerBoard = new Board();
        this.enemyBoard = new Board();
        this.playerHP = 5;
        this.enemyHP = 5;
        this.maxHP = 5;
        this.playerScore = 0;
        this.enemyScore = 0;
        this.damageDealt = 0;
        this.cpuLevel = 3;
        this.isGameOver = false;
        this.isPaused = false;
        
        // 妨害キュー
        this.interferenceQueue = [];
        
        // バフ状態
        this.playerShield = false;
        this.playerReflect = false;
        this.playerDouble = false;
        this.enemyShield = false;
        this.enemyReflect = false;
        this.enemyDouble = false;
        
        // フリーズ状態
        this.enemyFrozen = false;
        this.enemyFreezeTimer = 0;
        this.playerFrozen = false;
        this.playerFreezeTimer = 0;
        
        // スキル発動確率
        this.skillChance = 0.05; // 5%
        
        // 最後の合成位置（弾演出用）
        this.lastMergePosition = null;
        
        // コールバック
        this.onHPChange = null;
        this.onScoreChange = null;
        this.onGameOver = null;
        this.onInterferenceWarning = null;
        this.onDamage = null;
        this.onBoardReset = null;
        this.onEnemyBoardUpdate = null;
        this.onBattleLog = null;
        this.onMatchPoint = null;
        this.onBombExplode = null;
        this.onFreezeChange = null;
        this.onSkillBullet = null; // 弾演出コールバック
        
        this.lastTime = 0;
        this.animationId = null;
    }

    init(playerBoardEl, enemyBoardEl, cpuLevel = 3) {
        this.cpuLevel = cpuLevel;
        this.playerHP = this.maxHP;
        this.enemyHP = this.maxHP;
        this.playerScore = 0;
        this.enemyScore = 0;
        this.damageDealt = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.interferenceQueue = [];
        
        this.playerShield = false;
        this.playerReflect = false;
        this.playerDouble = false;
        this.enemyShield = false;
        this.enemyReflect = false;
        this.enemyDouble = false;
        this.enemyFrozen = false;
        this.enemyFreezeTimer = 0;
        this.playerFrozen = false;
        this.playerFreezeTimer = 0;
        this.lastMergePosition = null;
        
        this.playerBoard.init(playerBoardEl, true);
        this.enemyBoard.init(enemyBoardEl, false);
        
        this.playerBoard.onAttackableTap = (value, row, col) => {
            this.handlePlayerAttack(value, row, col);
        };
        
        // 初期化後にレイアウト確定を待ってタイル位置を再計算
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.playerBoard.refreshTilePositions();
                this.enemyBoard.refreshTilePositions();
            });
        });
        
        this.startGameLoop();
    }

    startGameLoop() {
        this.lastTime = performance.now();
        const loop = (currentTime) => {
            if (this.isGameOver) return;
            
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            
            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }

    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    update(deltaTime) {
        if (this.isPaused) return;
        
        this.updateInterferenceQueue(deltaTime);
        this.updateFreezeTimers(deltaTime);
        this.updateBombs(deltaTime);
    }

    updateFreezeTimers(deltaTime) {
        if (this.enemyFrozen) {
            this.enemyFreezeTimer -= deltaTime;
            if (this.enemyFreezeTimer <= 0) {
                this.enemyFrozen = false;
                if (this.onFreezeChange) {
                    this.onFreezeChange('enemy', false);
                }
            }
        }
        
        if (this.playerFrozen) {
            this.playerFreezeTimer -= deltaTime;
            if (this.playerFreezeTimer <= 0) {
                this.playerFrozen = false;
                if (this.onFreezeChange) {
                    this.onFreezeChange('player', false);
                }
            }
        }
    }

    updateBombs(deltaTime) {
        const playerExploded = this.playerBoard.updateBombs(deltaTime);
        for (const bomb of playerExploded) {
            const cleared = this.playerBoard.explodeBomb(bomb.row, bomb.col);
            if (this.onBattleLog) {
                this.onBattleLog(`💥 BOMB! ${cleared}タイル消滅!`, 'damage');
            }
            this.checkAndHandleStuck('player');
        }
        
        const enemyExploded = this.enemyBoard.updateBombs(deltaTime);
        for (const bomb of enemyExploded) {
            const cleared = this.enemyBoard.explodeBomb(bomb.row, bomb.col);
            if (this.onBattleLog) {
                this.onBattleLog(`💥 CPU BOMB! ${cleared}タイル消滅!`, 'damage');
            }
            if (this.onEnemyBoardUpdate) {
                this.onEnemyBoardUpdate();
            }
            this.checkAndHandleStuck('enemy');
        }
    }

    updateInterferenceQueue(deltaTime) {
        for (let i = this.interferenceQueue.length - 1; i >= 0; i--) {
            this.interferenceQueue[i].timer -= deltaTime;
            
            if (this.interferenceQueue[i].timer <= 0) {
                const count = this.interferenceQueue[i].count;
                
                if (this.playerReflect) {
                    this.playerReflect = false;
                    this.addInterferenceToEnemy(count);
                    if (this.onBattleLog) {
                        this.onBattleLog(`🪞 リフレクト! 妨害を跳ね返した!`, 'interference');
                    }
                } else {
                    for (let j = 0; j < count; j++) {
                        this.playerBoard.addRandomTile(2, false);
                    }
                    this.checkAndHandleStuck('player');
                }
                
                this.interferenceQueue.splice(i, 1);
            }
        }
        
        if (this.onInterferenceWarning) {
            const totalCount = this.interferenceQueue.reduce((sum, q) => sum + q.count, 0);
            const minTimer = this.interferenceQueue.length > 0 ? Math.min(...this.interferenceQueue.map(q => q.timer)) : 0;
            this.onInterferenceWarning(totalCount, minTimer);
        }
    }

    addInterferenceToPlayer(count) {
        this.interferenceQueue.push({
            count: count,
            timer: 3.0
        });
    }

    addInterferenceToEnemy(count) {
        if (this.enemyReflect) {
            this.enemyReflect = false;
            this.addInterferenceToPlayer(count);
            if (this.onBattleLog) {
                this.onBattleLog(`🪞 CPU リフレクト!`, 'interference');
            }
            return;
        }
        
        for (let i = 0; i < count; i++) {
            this.enemyBoard.addRandomTile(2, true);
        }
        
        if (this.onEnemyBoardUpdate) {
            this.onEnemyBoardUpdate();
        }
        
        this.checkAndHandleStuck('enemy');
    }

    checkAndHandleStuck(target) {
        const board = target === 'player' ? this.playerBoard : this.enemyBoard;
        
        if (!board.canMove()) {
            if (target === 'player') {
                this.playerHP = Math.max(0, this.playerHP - 2);
                if (this.onHPChange) {
                    this.onHPChange('player', this.playerHP);
                }
                if (this.onDamage) {
                    this.onDamage('player', 2);
                }
                if (this.onBattleLog) {
                    this.onBattleLog('💀 YOU STUCK! HP-2', 'stuck');
                }
            } else {
                this.enemyHP = Math.max(0, this.enemyHP - 2);
                this.damageDealt += 2;
                if (this.onHPChange) {
                    this.onHPChange('enemy', this.enemyHP);
                }
                if (this.onDamage) {
                    this.onDamage('enemy', 2);
                }
                if (this.onBattleLog) {
                    this.onBattleLog('💀 CPU STUCK! HP-2', 'stuck');
                }
            }
            
            this.checkMatchPoint();
            
            if (this.playerHP <= 0) {
                this.endGame('enemy');
                return;
            }
            if (this.enemyHP <= 0) {
                this.endGame('player');
                return;
            }
            
            const cleared = board.clearAllTwos();
            
            if (this.onBoardReset) {
                this.onBoardReset(target, cleared);
            }
        }
    }

    checkMatchPoint() {
        if (this.onMatchPoint) {
            this.onMatchPoint(this.playerHP, this.enemyHP);
        }
    }

    /**
     * 合成時にスキル発動チェック（重み付きランダム）
     */
    checkSkillTrigger(caster, mergeRow, mergeCol) {
        if (Math.random() < this.skillChance) {
            // 重み付きランダムでスキル選択
            const skill = getWeightedRandomSkill();
            
            // 弾演出用に合成位置を保存
            this.lastMergePosition = { row: mergeRow, col: mergeCol };
            
            this.executeSkill(skill.id, caster);
        }
    }

    playerMove(direction) {
        if (this.isGameOver || this.isPaused || this.playerFrozen) return false;
        
        const result = this.playerBoard.move(direction);
        
        if (result.moved) {
            this.playerBoard.addRandomTile();
            
            this.playerScore = this.playerBoard.score;
            if (this.onScoreChange) {
                this.onScoreChange('player', this.playerScore);
            }
            
            // 合成があったらスキル発動チェック（最初の合成位置を使用）
            if (result.mergedTiles.length > 0 && result.mergePositions && result.mergePositions.length > 0) {
                const pos = result.mergePositions[0];
                this.checkSkillTrigger('player', pos.row, pos.col);
            }
            
            if (result.newTiles.includes(256)) {
                this.addInterferenceToEnemy(1);
                if (this.onBattleLog) {
                    this.onBattleLog('⚡ 256! → 妨害 ×1', 'interference');
                }
            }
            
            this.checkAndHandleStuck('player');
        }
        
        return result.moved;
    }

    handlePlayerAttack(value, row, col) {
        if (this.isGameOver || this.isPaused || this.playerFrozen) return;
        
        let damage = 0;
        let interference = 0;
        let logMsg = '';
        let logType = '';
        
        switch (value) {
            case 128:
                interference = 1;
                logMsg = '⚔️ 128 TAP! → 妨害 ×1';
                logType = 'interference';
                break;
            case 512:
                damage = 1;
                interference = 3;
                logMsg = '💥 512 TAP! → 1DMG + 妨害 ×3';
                logType = 'attack';
                break;
            case 1024:
                damage = 4;
                logMsg = '🔥 1024 TAP! → 4 DAMAGE!';
                logType = 'damage';
                break;
        }
        
        this.playerBoard.removeTile(row, col);
        
        if (this.onBattleLog && logMsg) {
            this.onBattleLog(logMsg, logType);
        }
        
        if (damage > 0) {
            if (this.enemyShield) {
                this.enemyShield = false;
                if (this.onBattleLog) {
                    this.onBattleLog('🛡️ CPU シールド! 攻撃無効!', 'attack');
                }
            } else {
                if (this.playerDouble) {
                    damage *= 2;
                    this.playerDouble = false;
                    if (this.onBattleLog) {
                        this.onBattleLog(`⚡ ダブル発動! ${damage} DAMAGE!`, 'damage');
                    }
                }
                
                this.enemyHP = Math.max(0, this.enemyHP - damage);
                this.damageDealt += damage;
                
                if (this.onDamage) {
                    this.onDamage('enemy', damage);
                }
                
                if (this.onHPChange) {
                    this.onHPChange('enemy', this.enemyHP);
                }
                
                this.checkMatchPoint();
            }
        }
        
        if (interference > 0) {
            this.addInterferenceToEnemy(interference);
        }
        
        if (this.enemyHP <= 0) {
            this.endGame('player');
        }
    }

    handleCPUAttack(value, row, col) {
        if (this.isGameOver) return;
        
        let damage = 0;
        let interference = 0;
        let logMsg = '';
        let logType = '';
        
        switch (value) {
            case 128:
                interference = 1;
                logMsg = '👊 CPU 128! → 妨害 ×1';
                logType = 'interference';
                break;
            case 512:
                damage = 1;
                interference = 3;
                logMsg = '💢 CPU 512! → 1DMG + 妨害 ×3';
                logType = 'attack';
                break;
            case 1024:
                damage = 4;
                logMsg = '☠️ CPU 1024! → 4 DAMAGE!';
                logType = 'damage';
                break;
        }
        
        this.enemyBoard.removeTile(row, col);
        
        if (this.onBattleLog && logMsg) {
            this.onBattleLog(logMsg, logType);
        }
        
        if (damage > 0) {
            if (this.playerShield) {
                this.playerShield = false;
                if (this.onBattleLog) {
                    this.onBattleLog('🛡️ シールド発動! 攻撃無効!', 'attack');
                }
            } else {
                if (this.enemyDouble) {
                    damage *= 2;
                    this.enemyDouble = false;
                }
                
                this.playerHP = Math.max(0, this.playerHP - damage);
                
                if (this.onDamage) {
                    this.onDamage('player', damage);
                }
                
                if (this.onHPChange) {
                    this.onHPChange('player', this.playerHP);
                }
                
                this.checkMatchPoint();
            }
        }
        
        if (interference > 0) {
            this.addInterferenceToPlayer(interference);
        }
        
        if (this.onEnemyBoardUpdate) {
            this.onEnemyBoardUpdate();
        }
        
        if (this.playerHP <= 0) {
            this.endGame('enemy');
        }
    }

    handleCPU256Created() {
        this.addInterferenceToPlayer(1);
        if (this.onBattleLog) {
            this.onBattleLog('⚡ CPU 256! → 妨害 ×1', 'interference');
        }
    }

    /**
     * CPUの合成時スキルチェック
     */
    checkCPUSkillTrigger(mergeRow, mergeCol) {
        this.checkSkillTrigger('enemy', mergeRow, mergeCol);
    }

    /**
     * スキル実行
     */
    executeSkill(skillId, caster) {
        const skill = getSkillInfo(skillId);
        if (!skill) return false;
        
        const isPlayer = caster === 'player';
        const myBoard = isPlayer ? this.playerBoard : this.enemyBoard;
        const enemyBoard = isPlayer ? this.enemyBoard : this.playerBoard;
        const casterName = isPlayer ? '' : 'CPU ';
        
        // 弾演出を発火
        if (this.onSkillBullet && this.lastMergePosition) {
            this.onSkillBullet(caster, this.lastMergePosition.row, this.lastMergePosition.col, skill.icon);
        }
        
        switch (skillId) {
            case 'shield':
                if (isPlayer) {
                    this.playerShield = true;
                } else {
                    this.enemyShield = true;
                }
                if (this.onBattleLog) {
                    this.onBattleLog(`🛡️ ${casterName}シールド発動!`, 'attack');
                }
                break;
                
            case 'reflect':
                if (isPlayer) {
                    this.playerReflect = true;
                } else {
                    this.enemyReflect = true;
                }
                if (this.onBattleLog) {
                    this.onBattleLog(`🪞 ${casterName}リフレクト発動!`, 'interference');
                }
                break;
                
            case 'clean':
                const myCleared = myBoard.clearAllTwos();
                const enemyCleared = enemyBoard.clearAllTwos();
                if (this.onBattleLog) {
                    this.onBattleLog(`🧹 ${casterName}クリーン! 2を${myCleared + enemyCleared}個消去!`, 'interference');
                }
                if (this.onEnemyBoardUpdate) {
                    this.onEnemyBoardUpdate();
                }
                break;
                
            case 'double':
                if (isPlayer) {
                    this.playerDouble = true;
                } else {
                    this.enemyDouble = true;
                }
                if (this.onBattleLog) {
                    this.onBattleLog(`⚡ ${casterName}ダブル発動! 次攻撃2倍!`, 'damage');
                }
                break;
                
            case 'bomb':
                const bombPos = enemyBoard.addBombTile();
                if (bombPos) {
                    if (this.onBattleLog) {
                        this.onBattleLog(`💣 ${casterName}ボム[${bombPos.value}]設置! 3秒後に爆発!`, 'damage');
                    }
                    if (!isPlayer && this.onEnemyBoardUpdate) {
                        this.onEnemyBoardUpdate();
                    }
                }
                break;
                
            case 'freeze':
                if (isPlayer) {
                    this.enemyFrozen = true;
                    this.enemyFreezeTimer = 3.0;
                    if (this.onFreezeChange) {
                        this.onFreezeChange('enemy', true);
                    }
                } else {
                    this.playerFrozen = true;
                    this.playerFreezeTimer = 3.0;
                    if (this.onFreezeChange) {
                        this.onFreezeChange('player', true);
                    }
                }
                if (this.onBattleLog) {
                    this.onBattleLog(`❄️ ${casterName}フリーズ! 3秒間停止!`, 'attack');
                }
                break;
                
            case 'convert':
                const converted = myBoard.convertRandomTwoToFour();
                if (converted) {
                    if (this.onBattleLog) {
                        this.onBattleLog(`🔄 ${casterName}コンバート! 2→4!`, 'interference');
                    }
                }
                break;
                
            case 'dice':
                const values = [2, 4, 8, 16, 32, 64, 128];
                const targetValue = values[Math.floor(Math.random() * values.length)];
                const diceCleared = myBoard.clearAllWithValue(targetValue);
                if (this.onBattleLog) {
                    this.onBattleLog(`🎲 ${casterName}ダイス! ${targetValue}を${diceCleared}個消去!`, 'interference');
                }
                break;
                
            default:
                return false;
        }
        
        return true;
    }

    endGame(winner) {
        this.isGameOver = true;
        this.stopGameLoop();
        
        if (this.onGameOver) {
            this.onGameOver(winner, {
                playerScore: this.playerScore,
                maxTile: this.playerBoard.getMaxTile(),
                damageDealt: this.damageDealt
            });
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }
}
