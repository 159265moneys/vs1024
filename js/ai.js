/**
 * AI - CPU対戦AI（レベル1-10）v3.0
 * ステージ難易度に対応
 * スキル: 合成時5%でランダム発動
 */
class AI {
    constructor(game, level = 3) {
        this.game = game;
        this.level = Math.min(10, Math.max(1, level)); // 1-10にクランプ
        this.moveInterval = null;
        this.isActive = false;
    }

    start() {
        this.isActive = true;
        this.scheduleNextMove();
    }

    stop() {
        this.isActive = false;
        if (this.moveInterval) {
            clearTimeout(this.moveInterval);
            this.moveInterval = null;
        }
    }

    scheduleNextMove() {
        if (!this.isActive || this.game.isGameOver) return;
        
        const delay = this.getThinkingTime();
        
        this.moveInterval = setTimeout(() => {
            this.makeMove();
            this.scheduleNextMove();
        }, delay);
    }

    getThinkingTime() {
        if (this.game.enemyFrozen) {
            return 100;
        }
        
        // レベル1-10の思考時間（レベルが高いほど速い）
        const baseTime = {
            1:  { min: 800, max: 1200 },  // EASY - のんびり
            2:  { min: 600, max: 1000 },  // NORMAL
            3:  { min: 450, max: 750 },   // HARD
            4:  { min: 350, max: 600 },   // EXPERT
            5:  { min: 250, max: 450 },   // MASTER
            6:  { min: 180, max: 350 },   // LEGEND
            7:  { min: 120, max: 250 },   // NIGHTMARE
            8:  { min: 80, max: 180 },    // INFERNO
            9:  { min: 50, max: 120 },    // ABYSS
            10: { min: 30, max: 80 }      // WORLD END - 超高速
        };
        
        const range = baseTime[this.level] || baseTime[5];
        return Math.random() * (range.max - range.min) + range.min;
    }

    makeMove() {
        if (this.game.isGameOver || this.game.isPaused || this.game.enemyFrozen) return;
        
        // 攻撃判定
        this.considerAttack();
        
        // 移動
        const direction = this.getBestMove();
        if (direction) {
            const result = this.game.enemyBoard.move(direction);
            
            if (result.moved) {
                this.game.enemyBoard.addRandomTile();
                // オーバーフロー: 2つ目のタイルも追加
                if (this.game.enemyOverflow) {
                    this.game.enemyBoard.addRandomTile();
                }
                this.game.enemyScore = this.game.enemyBoard.score;
                
                // タイルに付いているスキルを発動
                if (result.triggeredSkills && result.triggeredSkills.length > 0) {
                    for (const triggered of result.triggeredSkills) {
                        this.game.lastMergePosition = { row: triggered.row, col: triggered.col };
                        this.game.executeSkill(triggered.skillId, 'enemy');
                    }
                }
                
                if (result.newTiles && result.newTiles.includes(256)) {
                    this.game.handleCPU256Created();
                }
                
                if (this.game.onEnemyBoardUpdate) {
                    this.game.onEnemyBoardUpdate();
                }
                
                this.game.checkAndHandleStuck('enemy');
            }
        }
    }

    getBestMove() {
        // レベル別アルゴリズム
        switch (this.level) {
            case 1:  return this.getRandomMove();           // 完全ランダム
            case 2:  return this.getBasicMove();            // 基本優先順位
            case 3:  return this.getCornerMove();           // コーナー戦略
            case 4:  return this.getSmartMove();            // 評価関数
            case 5:  return this.getExpertMove(1);          // 1手先読み
            case 6:  return this.getExpertMove(2);          // 2手先読み
            case 7:  return this.getExpertMove(2);          // 2手先読み+攻撃的
            case 8:  return this.getExpertMove(3);          // 3手先読み
            case 9:  return this.getExpertMove(3);          // 3手先読み+高度戦略
            case 10: return this.getExpertMove(4);          // 4手先読み（WORLD END）
            default: return this.getCornerMove();
        }
    }

    getRandomMove() {
        const directions = ['up', 'down', 'left', 'right'];
        const validMoves = directions.filter(dir => this.canMove(dir));
        
        if (validMoves.length === 0) return null;
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    getBasicMove() {
        const priorities = ['down', 'left', 'right', 'up'];
        
        for (const dir of priorities) {
            if (this.canMove(dir)) return dir;
        }
        return null;
    }

    getCornerMove() {
        const priorities = ['left', 'down', 'right', 'up'];
        
        for (const dir of priorities) {
            if (this.canMove(dir)) return dir;
        }
        return null;
    }

    getSmartMove() {
        const directions = ['up', 'down', 'left', 'right'];
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const dir of directions) {
            if (!this.canMove(dir)) continue;
            
            const score = this.evaluateMove(dir);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = dir;
            }
        }
        
        return bestMove;
    }

    getExpertMove(depth = 2) {
        const directions = ['up', 'down', 'left', 'right'];
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const dir of directions) {
            if (!this.canMove(dir)) continue;
            
            const score = this.evaluateMoveDeep(dir, depth);
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = dir;
            }
        }
        
        return bestMove;
    }

    canMove(direction) {
        const gridCopy = this.game.enemyBoard.getGridCopy();
        const tempBoard = new Board();
        tempBoard.grid = gridCopy;
        tempBoard.size = 4;
        
        const result = this.simulateMove(tempBoard, direction);
        return result.moved;
    }

    simulateMove(board, direction) {
        const vectors = {
            up: { row: -1, col: 0 },
            down: { row: 1, col: 0 },
            left: { row: 0, col: -1 },
            right: { row: 0, col: 1 }
        };
        
        const vector = vectors[direction];
        const traversals = this.buildTraversals(vector);
        const merged = Array(4).fill(null).map(() => Array(4).fill(false));
        let moved = false;
        let scoreGain = 0;
        
        traversals.row.forEach(row => {
            traversals.col.forEach(col => {
                const value = board.grid[row][col];
                if (value === 0) return;
                
                let newRow = row;
                let newCol = col;
                
                while (true) {
                    const nextRow = newRow + vector.row;
                    const nextCol = newCol + vector.col;
                    
                    if (nextRow < 0 || nextRow >= 4 || nextCol < 0 || nextCol >= 4) break;
                    
                    const nextValue = board.grid[nextRow][nextCol];
                    
                    if (nextValue === 0) {
                        newRow = nextRow;
                        newCol = nextCol;
                    } else if (nextValue === value && !merged[nextRow][nextCol]) {
                        newRow = nextRow;
                        newCol = nextCol;
                        break;
                    } else {
                        break;
                    }
                }
                
                if (newRow !== row || newCol !== col) {
                    moved = true;
                    
                    if (board.grid[newRow][newCol] === value) {
                        const newValue = value * 2;
                        board.grid[newRow][newCol] = newValue;
                        board.grid[row][col] = 0;
                        merged[newRow][newCol] = true;
                        scoreGain += newValue;
                    } else {
                        board.grid[newRow][newCol] = value;
                        board.grid[row][col] = 0;
                    }
                }
            });
        });
        
        return { moved, scoreGain };
    }

    buildTraversals(vector) {
        const traversals = { row: [], col: [] };
        
        for (let i = 0; i < 4; i++) {
            traversals.row.push(i);
            traversals.col.push(i);
        }
        
        if (vector.row === 1) traversals.row.reverse();
        if (vector.col === 1) traversals.col.reverse();
        
        return traversals;
    }

    evaluateMove(direction) {
        const gridCopy = this.game.enemyBoard.getGridCopy();
        const tempBoard = new Board();
        tempBoard.grid = gridCopy;
        tempBoard.size = 4;
        
        const result = this.simulateMove(tempBoard, direction);
        if (!result.moved) return -Infinity;
        
        return this.evaluateGrid(tempBoard.grid) + result.scoreGain;
    }

    evaluateMoveDeep(direction, depth) {
        const gridCopy = this.game.enemyBoard.getGridCopy();
        const tempBoard = new Board();
        tempBoard.grid = gridCopy;
        tempBoard.size = 4;
        
        const result = this.simulateMove(tempBoard, direction);
        if (!result.moved) return -Infinity;
        
        if (depth <= 0) {
            return this.evaluateGrid(tempBoard.grid) + result.scoreGain;
        }
        
        const emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (tempBoard.grid[r][c] === 0) {
                    emptyCells.push({ row: r, col: c });
                }
            }
        }
        
        if (emptyCells.length === 0) {
            return this.evaluateGrid(tempBoard.grid) + result.scoreGain;
        }
        
        let totalScore = 0;
        // レベルが高いほど多くのサンプルを評価
        const samples = Math.min(this.level >= 8 ? 6 : 4, emptyCells.length);
        
        for (let i = 0; i < samples; i++) {
            const cell = emptyCells[i % emptyCells.length];
            const testGrid = tempBoard.grid.map(row => [...row]);
            testGrid[cell.row][cell.col] = 2;
            
            let bestNextScore = -Infinity;
            const directions = ['up', 'down', 'left', 'right'];
            
            for (const nextDir of directions) {
                const nextBoard = new Board();
                nextBoard.grid = testGrid.map(row => [...row]);
                nextBoard.size = 4;
                
                const nextResult = this.simulateMove(nextBoard, nextDir);
                if (nextResult.moved) {
                    let score;
                    if (depth > 1) {
                        // 再帰的に先読み
                        score = this.evaluateGridDeep(nextBoard.grid, depth - 1) + nextResult.scoreGain;
                    } else {
                        score = this.evaluateGrid(nextBoard.grid) + nextResult.scoreGain;
                    }
                    if (score > bestNextScore) {
                        bestNextScore = score;
                    }
                }
            }
            
            if (bestNextScore > -Infinity) {
                totalScore += bestNextScore;
            }
        }
        
        return result.scoreGain + totalScore / samples;
    }

    evaluateGridDeep(grid, depth) {
        if (depth <= 0) {
            return this.evaluateGrid(grid);
        }
        
        const directions = ['up', 'down', 'left', 'right'];
        let bestScore = -Infinity;
        
        for (const dir of directions) {
            const tempBoard = new Board();
            tempBoard.grid = grid.map(row => [...row]);
            tempBoard.size = 4;
            
            const result = this.simulateMove(tempBoard, dir);
            if (result.moved) {
                const score = this.evaluateGrid(tempBoard.grid) + result.scoreGain;
                if (score > bestScore) {
                    bestScore = score;
                }
            }
        }
        
        return bestScore > -Infinity ? bestScore : this.evaluateGrid(grid);
    }

    evaluateGrid(grid) {
        let score = 0;
        
        // 空きマス（重要度：高レベルほど重視）
        let emptyCells = 0;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] === 0) emptyCells++;
            }
        }
        const emptyWeight = this.level >= 7 ? 20 : 15;
        score += emptyCells * emptyWeight;
        
        // 最大タイル
        let maxTile = 0;
        let maxPos = { r: 0, c: 0 };
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] > maxTile) {
                    maxTile = grid[r][c];
                    maxPos = { r, c };
                }
            }
        }
        score += Math.log2(maxTile || 1) * 10;
        
        // コーナー配置（高レベルほど重視）
        const corners = [[0, 0], [0, 3], [3, 0], [3, 3]];
        for (const [r, c] of corners) {
            if (grid[r][c] === maxTile) {
                score += this.level >= 6 ? 80 : 50;
                break;
            }
        }
        
        // 単調性
        const monoWeight = this.level >= 8 ? 8 : 5;
        score += this.calculateMonotonicity(grid) * monoWeight;
        
        // 合成可能ペア
        let pairs = 0;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] === 0) continue;
                if (c < 3 && grid[r][c] === grid[r][c + 1]) pairs++;
                if (r < 3 && grid[r][c] === grid[r + 1][c]) pairs++;
            }
        }
        score += pairs * 10;
        
        // 高レベル：スネーク配置ボーナス
        if (this.level >= 9) {
            score += this.evaluateSnakePattern(grid) * 15;
        }
        
        return score;
    }

    calculateMonotonicity(grid) {
        let mono = 0;
        
        for (let r = 0; r < 4; r++) {
            let inc = 0, dec = 0;
            for (let c = 0; c < 3; c++) {
                if (grid[r][c] <= grid[r][c + 1]) inc++;
                if (grid[r][c] >= grid[r][c + 1]) dec++;
            }
            mono += Math.max(inc, dec);
        }
        
        for (let c = 0; c < 4; c++) {
            let inc = 0, dec = 0;
            for (let r = 0; r < 3; r++) {
                if (grid[r][c] <= grid[r + 1][c]) inc++;
                if (grid[r][c] >= grid[r + 1][c]) dec++;
            }
            mono += Math.max(inc, dec);
        }
        
        return mono;
    }

    // スネークパターン評価（高レベルAI用）
    evaluateSnakePattern(grid) {
        // 左上から始まるスネーク
        const snake = [
            [0, 0], [0, 1], [0, 2], [0, 3],
            [1, 3], [1, 2], [1, 1], [1, 0],
            [2, 0], [2, 1], [2, 2], [2, 3],
            [3, 3], [3, 2], [3, 1], [3, 0]
        ];
        
        let snakeScore = 0;
        let prevValue = Infinity;
        
        for (const [r, c] of snake) {
            const value = grid[r][c];
            if (value > 0 && value <= prevValue) {
                snakeScore++;
            }
            prevValue = value || prevValue;
        }
        
        return snakeScore;
    }

    considerAttack() {
        const attackableTiles = this.game.enemyBoard.getAttackableTiles();
        if (attackableTiles.length === 0) return;
        
        // 高価値タイルから順に検討
        const sorted = attackableTiles.sort((a, b) => b.value - a.value);
        
        for (const tile of sorted) {
            const shouldAttack = this.shouldAttack(tile.value);
            
            if (shouldAttack) {
                this.game.handleCPUAttack(tile.value, tile.row, tile.col);
                return;
            }
        }
    }

    shouldAttack(value) {
        const playerEmpty = this.game.playerBoard.getEmptyCells().length;
        const playerHP = this.game.playerHP;
        const enemyHP = this.game.enemyHP;
        
        // レベル別攻撃判断
        switch (this.level) {
            case 1: // EASY - ほぼ攻撃しない
                return value === 1024 && Math.random() < 0.3;
                
            case 2: // NORMAL
                if (value === 1024) return Math.random() < 0.7;
                if (value === 512) return Math.random() < 0.3;
                return false;
                
            case 3: // HARD
                if (value === 1024) return true;
                if (value === 512) return Math.random() < 0.4;
                if (value === 128) return playerEmpty < 6 && Math.random() < 0.3;
                return false;
                
            case 4: // EXPERT
                if (value === 1024) return true;
                if (value === 512) return playerHP <= 3 || Math.random() < 0.5;
                if (value === 128) return playerEmpty < 5 && Math.random() < 0.4;
                return false;
                
            case 5: // MASTER
                if (value === 1024) return true;
                if (value === 512) return playerHP <= 2 || playerEmpty < 4 || Math.random() < 0.3;
                if (value === 128) return playerEmpty < 5;
                return false;
                
            case 6: // LEGEND
                if (value === 1024) return true;
                if (value === 512) return playerHP <= 3 || playerEmpty < 5;
                if (value === 128) return playerEmpty < 6;
                return false;
                
            case 7: // NIGHTMARE
                if (value === 1024) return true;
                if (value === 512) return true; // 常に攻撃
                if (value === 128) return playerEmpty < 7;
                return false;
                
            case 8: // INFERNO
                if (value === 1024) return true;
                if (value === 512) return true;
                if (value === 128) return playerEmpty < 8;
                return false;
                
            case 9: // ABYSS
                if (value === 1024) return true;
                if (value === 512) return true;
                if (value === 128) return true; // 常に妨害
                return false;
                
            case 10: // WORLD END - 容赦なし
                return true; // すべて即攻撃
                
            default:
                return false;
        }
    }
}
