/**
 * AI - CPU対戦AI（レベル1-5）v2.5
 * スキル: 合成時5%でランダム発動
 */
class AI {
    constructor(game, level = 3) {
        this.game = game;
        this.level = level;
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
        
        const baseTime = {
            1: { min: 600, max: 1000 },
            2: { min: 450, max: 750 },
            3: { min: 300, max: 600 },
            4: { min: 150, max: 350 },
            5: { min: 80, max: 200 }
        };
        
        const range = baseTime[this.level] || baseTime[3];
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
                this.game.enemyScore = this.game.enemyBoard.score;
                
                // 合成があったらスキル発動チェック
                if (result.mergedTiles && result.mergedTiles.length > 0 && result.mergePositions && result.mergePositions.length > 0) {
                    const pos = result.mergePositions[0];
                    this.game.checkCPUSkillTrigger(pos.row, pos.col);
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
        switch (this.level) {
            case 1: return this.getRandomMove();
            case 2: return this.getBasicMove();
            case 3: return this.getCornerMove();
            case 4: return this.getSmartMove();
            case 5: return this.getExpertMove();
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

    getExpertMove() {
        const directions = ['up', 'down', 'left', 'right'];
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (const dir of directions) {
            if (!this.canMove(dir)) continue;
            
            const score = this.evaluateMoveDeep(dir, 2);
            
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
        const samples = Math.min(4, emptyCells.length);
        
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
                    const score = this.evaluateGrid(nextBoard.grid) + nextResult.scoreGain;
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

    evaluateGrid(grid) {
        let score = 0;
        
        let emptyCells = 0;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] === 0) emptyCells++;
            }
        }
        score += emptyCells * 15;
        
        let maxTile = 0;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] > maxTile) {
                    maxTile = grid[r][c];
                }
            }
        }
        score += Math.log2(maxTile || 1) * 10;
        
        const corners = [[0, 0], [0, 3], [3, 0], [3, 3]];
        for (const [r, c] of corners) {
            if (grid[r][c] === maxTile) {
                score += 50;
                break;
            }
        }
        
        score += this.calculateMonotonicity(grid) * 5;
        
        let pairs = 0;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (grid[r][c] === 0) continue;
                if (c < 3 && grid[r][c] === grid[r][c + 1]) pairs++;
                if (r < 3 && grid[r][c] === grid[r + 1][c]) pairs++;
            }
        }
        score += pairs * 10;
        
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

    considerAttack() {
        const attackableTiles = this.game.enemyBoard.getAttackableTiles();
        if (attackableTiles.length === 0) return;
        
        for (const tile of attackableTiles) {
            const shouldAttack = this.shouldAttack(tile.value);
            
            if (shouldAttack) {
                this.game.handleCPUAttack(tile.value, tile.row, tile.col);
                return;
            }
        }
    }

    shouldAttack(value) {
        switch (this.level) {
            case 1:
                return Math.random() < 0.5;
                
            case 2:
                if (value === 1024) return true;
                if (value === 512) return Math.random() < 0.5;
                if (value === 128) return Math.random() < 0.7;
                return false;
                
            case 3:
                if (value === 1024) return true;
                if (value === 512) return Math.random() < 0.3;
                if (value === 128) {
                    const playerEmpty = this.game.playerBoard.getEmptyCells().length;
                    return playerEmpty < 6 && Math.random() < 0.5;
                }
                return false;
                
            case 4:
            case 5:
                if (value === 1024) return true;
                
                const playerEmpty = this.game.playerBoard.getEmptyCells().length;
                const playerHP = this.game.playerHP;
                
                if (value === 512) {
                    if (playerHP <= 2) return true;
                    if (playerEmpty < 4) return true;
                    return Math.random() < 0.2;
                }
                
                if (value === 128) {
                    return playerEmpty < 5;
                }
                
                return false;
                
            default:
                return false;
        }
    }
}
