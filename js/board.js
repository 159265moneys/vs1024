/**
 * Board - 2048ボード管理クラス v2.4
 * スキル対応版
 */
class Board {
    constructor(size = 4) {
        this.size = size;
        this.grid = [];
        this.score = 0;
        this.tiles = [];
        this.element = null;
        this.isPlayer = true;
        this.interferenceTiles = new Set();
        this.bombTiles = new Map(); // ボムタイル: key="row,col", value={timer, row, col}
        this.skillTiles = new Map(); // スキル付きタイル: key="row,col", value=skillId
        
        this.onAttackableTap = null;
        
        // スキル付与確率（生成時）
        this.skillAttachChance = 0.15; // 15%でスキル付き
    }

    init(element, isPlayer = true) {
        this.element = element;
        this.isPlayer = isPlayer;
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.score = 0;
        this.tiles = [];
        this.interferenceTiles = new Set();
        this.bombTiles = new Map();
        this.skillTiles = new Map();
        
        this.element.innerHTML = '';
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'tile-cell';
            this.element.appendChild(cell);
        }
        
        this.addRandomTile();
        this.addRandomTile();
    }

    /**
     * 盤面の2を全消し
     */
    clearAllTwos() {
        let cleared = 0;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 2) {
                    this.grid[row][col] = 0;
                    cleared++;
                }
            }
        }
        this.interferenceTiles.clear();
        // ボムタイルも2なら消える
        for (const [key, bomb] of this.bombTiles) {
            if (this.grid[bomb.row][bomb.col] === 0) {
                this.bombTiles.delete(key);
            }
        }
        this.updateDOM();
        return cleared;
    }

    /**
     * ボムタイルを追加（2/4/8ランダム）
     */
    addBombTile() {
        const emptyCells = this.getEmptyCells();
        if (emptyCells.length === 0) return null;
        
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        // ボムの値は2, 4, 8からランダム
        const bombValues = [2, 4, 8];
        const bombValue = bombValues[Math.floor(Math.random() * bombValues.length)];
        
        this.grid[cell.row][cell.col] = bombValue;
        
        const key = `${cell.row},${cell.col}`;
        this.bombTiles.set(key, {
            row: cell.row,
            col: cell.col,
            timer: 3.0,
            value: bombValue  // ボムの値を記録
        });
        
        this.updateDOM();
        return { row: cell.row, col: cell.col, value: bombValue };
    }

    /**
     * ボムタイルの更新（毎フレーム呼ぶ）
     * @returns 爆発したボムの配列
     */
    updateBombs(deltaTime) {
        const exploded = [];
        
        for (const [key, bomb] of this.bombTiles) {
            bomb.timer -= deltaTime;
            
            // タイルがボムの元の値かチェック（合成されていないか）
            const currentValue = this.grid[bomb.row][bomb.col];
            const bombValue = bomb.value || 2;  // 後方互換性
            
            if (currentValue !== bombValue) {
                // 合成された！ボム解除
                this.bombTiles.delete(key);
                continue;
            }
            
            if (bomb.timer <= 0) {
                // 爆発！
                exploded.push({ row: bomb.row, col: bomb.col });
                this.bombTiles.delete(key);
            }
        }
        
        // DOM更新（タイマー表示用）
        this.updateBombTimerDisplay();
        
        return exploded;
    }

    /**
     * 3×3範囲を削除
     */
    explodeBomb(centerRow, centerCol) {
        let cleared = 0;
        for (let r = centerRow - 1; r <= centerRow + 1; r++) {
            for (let c = centerCol - 1; c <= centerCol + 1; c++) {
                if (this.isWithinBounds(r, c) && this.grid[r][c] > 0) {
                    this.grid[r][c] = 0;
                    this.interferenceTiles.delete(`${r},${c}`);
                    this.bombTiles.delete(`${r},${c}`);
                    cleared++;
                }
            }
        }
        this.updateDOM();
        return cleared;
    }

    /**
     * ボムタイマー表示更新
     */
    updateBombTimerDisplay() {
        this.tiles.forEach(t => {
            const key = `${t.row},${t.col}`;
            const bomb = this.bombTiles.get(key);
            if (bomb) {
                t.element.classList.add('bomb-tile');
                t.element.dataset.bombTimer = bomb.timer.toFixed(1);
            } else {
                t.element.classList.remove('bomb-tile');
                delete t.element.dataset.bombTimer;
            }
        });
    }

    /**
     * 指定値のタイルを全削除
     */
    clearAllWithValue(value) {
        let cleared = 0;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === value) {
                    this.grid[row][col] = 0;
                    this.interferenceTiles.delete(`${row},${col}`);
                    this.bombTiles.delete(`${row},${col}`);
                    cleared++;
                }
            }
        }
        if (cleared > 0) {
            this.updateDOM();
        }
        return cleared;
    }

    /**
     * ランダムな2を4に変換
     */
    convertRandomTwoToFour() {
        const twos = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 2) {
                    twos.push({ row, col });
                }
            }
        }
        
        if (twos.length === 0) return false;
        
        const target = twos[Math.floor(Math.random() * twos.length)];
        this.grid[target.row][target.col] = 4;
        this.interferenceTiles.delete(`${target.row},${target.col}`);
        this.bombTiles.delete(`${target.row},${target.col}`);
        this.updateDOM();
        return true;
    }

    addRandomTile(value = null, isInterference = false) {
        const emptyCells = this.getEmptyCells();
        if (emptyCells.length === 0) return false;
        
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const tileValue = value || (Math.random() < 0.9 ? 2 : 4);
        
        this.grid[cell.row][cell.col] = tileValue;
        
        if (isInterference && tileValue === 2) {
            this.interferenceTiles.add(`${cell.row},${cell.col}`);
        }
        
        // スキル付与（妨害タイル以外、一定確率）
        if (!isInterference && Math.random() < this.skillAttachChance) {
            const skill = getRandomSkillFromAll();
            if (skill) {
                this.skillTiles.set(`${cell.row},${cell.col}`, skill.id);
            }
        }
        
        this.createTileElement(cell.row, cell.col, tileValue, true);
        
        return true;
    }

    getEmptyCells() {
        const empty = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === 0) {
                    empty.push({ row, col });
                }
            }
        }
        return empty;
    }

    getTilePosition(row, col) {
        const style = getComputedStyle(this.element);
        const boardWidth = this.element.clientWidth;
        const padding = parseFloat(style.padding) || 8;
        const gap = parseFloat(style.gap) || 6;
        const tileSize = (boardWidth - padding * 2 - gap * 3) / 4;
        
        return {
            left: padding + col * (tileSize + gap),
            top: padding + row * (tileSize + gap),
            size: tileSize
        };
    }

    createTileElement(row, col, value, isNew = false) {
        const tile = document.createElement('div');
        tile.className = 'tile' + (isNew ? ' new' : '');
        tile.dataset.value = value;
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.textContent = value;
        
        const key = `${row},${col}`;
        
        // 妨害タイルクラス
        if (!this.isPlayer && value === 2 && this.interferenceTiles.has(key)) {
            tile.classList.add('interference-tile');
        }
        
        // ボムタイルクラス
        if (this.bombTiles.has(key)) {
            tile.classList.add('bomb-tile');
            tile.dataset.bombTimer = this.bombTiles.get(key).timer.toFixed(1);
        }
        
        // スキル付きタイル
        if (this.skillTiles.has(key)) {
            const skillId = this.skillTiles.get(key);
            const skill = SKILLS[skillId];
            if (skill) {
                tile.classList.add('has-skill');
                
                // スキルアイコンコンテナ
                const skillFrame = document.createElement('div');
                skillFrame.className = `tile-skill-frame cat-${skill.category} rarity-${skill.rarity}`;
                
                const skillIcon = document.createElement('img');
                skillIcon.className = 'tile-skill-icon';
                skillIcon.src = skill.icon;
                skillIcon.alt = skill.name;
                
                skillFrame.appendChild(skillIcon);
                tile.appendChild(skillFrame);
            }
        }
        
        const pos = this.getTilePosition(row, col);
        tile.style.left = `${pos.left}px`;
        tile.style.top = `${pos.top}px`;
        tile.style.width = `${pos.size}px`;
        tile.style.height = `${pos.size}px`;
        
        if (this.isPlayer && [128, 512, 1024].includes(value)) {
            tile.classList.add('attack-target');
            tile.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onAttackableTap) {
                    this.onAttackableTap(value, row, col);
                }
            });
        }
        
        this.element.appendChild(tile);
        this.tiles.push({ element: tile, row, col, value });
        
        if (isNew) {
            setTimeout(() => tile.classList.remove('new'), 200);
        }
    }

    refreshTilePositions() {
        this.tiles.forEach(t => {
            const pos = this.getTilePosition(t.row, t.col);
            t.element.style.left = `${pos.left}px`;
            t.element.style.top = `${pos.top}px`;
            t.element.style.width = `${pos.size}px`;
            t.element.style.height = `${pos.size}px`;
        });
    }

    move(direction) {
        let moved = false;
        const mergedTiles = [];
        const newTiles = [];
        const mergePositions = []; // 合成位置を記録
        const triggeredSkills = []; // 発動したスキル
        
        const vectors = {
            up: { row: -1, col: 0 },
            down: { row: 1, col: 0 },
            left: { row: 0, col: -1 },
            right: { row: 0, col: 1 }
        };
        
        const vector = vectors[direction];
        const traversals = this.buildTraversals(vector);
        const merged = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        
        const newInterferenceTiles = new Set();
        const newBombTiles = new Map();
        const newSkillTiles = new Map();
        
        traversals.row.forEach(row => {
            traversals.col.forEach(col => {
                const value = this.grid[row][col];
                if (value === 0) return;
                
                const oldKey = `${row},${col}`;
                const wasInterference = this.interferenceTiles.has(oldKey);
                const wasBomb = this.bombTiles.get(oldKey);
                const wasSkill = this.skillTiles.get(oldKey);
                
                let newRow = row;
                let newCol = col;
                
                while (true) {
                    const nextRow = newRow + vector.row;
                    const nextCol = newCol + vector.col;
                    
                    if (!this.isWithinBounds(nextRow, nextCol)) break;
                    
                    const nextValue = this.grid[nextRow][nextCol];
                    
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
                    
                    if (this.grid[newRow][newCol] === value) {
                        // 合成！
                        const newValue = value * 2;
                        this.grid[newRow][newCol] = newValue;
                        this.grid[row][col] = 0;
                        merged[newRow][newCol] = true;
                        this.score += newValue;
                        mergedTiles.push(newValue);
                        mergePositions.push({ row: newRow, col: newCol });
                        
                        // 合成先のタイルにスキルがあったか確認
                        const targetKey = `${newRow},${newCol}`;
                        const targetSkill = this.skillTiles.get(targetKey);
                        
                        // どちらかのタイルにスキルがあれば発動
                        if (wasSkill) {
                            triggeredSkills.push({ skillId: wasSkill, row: newRow, col: newCol });
                        }
                        if (targetSkill && targetSkill !== wasSkill) {
                            triggeredSkills.push({ skillId: targetSkill, row: newRow, col: newCol });
                        }
                        
                        if (newValue === 256) {
                            newTiles.push(256);
                        }
                        // 合体したらボムも妨害フラグもスキルも消える
                    } else {
                        // 移動のみ
                        this.grid[newRow][newCol] = value;
                        this.grid[row][col] = 0;
                        
                        const newKey = `${newRow},${newCol}`;
                        if (wasInterference && value === 2) {
                            newInterferenceTiles.add(newKey);
                        }
                        // ボムは元の値と一致する場合のみ維持
                        const bombValue = wasBomb ? (wasBomb.value || 2) : null;
                        if (wasBomb && value === bombValue) {
                            newBombTiles.set(newKey, { ...wasBomb, row: newRow, col: newCol });
                        }
                        // スキルも移動
                        if (wasSkill) {
                            newSkillTiles.set(newKey, wasSkill);
                        }
                    }
                } else {
                    // 移動なし
                    const newKey = `${row},${col}`;
                    if (wasInterference && value === 2) {
                        newInterferenceTiles.add(newKey);
                    }
                    const bombValue = wasBomb ? (wasBomb.value || 2) : null;
                    if (wasBomb && value === bombValue) {
                        newBombTiles.set(newKey, wasBomb);
                    }
                    if (wasSkill) {
                        newSkillTiles.set(newKey, wasSkill);
                    }
                }
            });
        });
        
        this.interferenceTiles = newInterferenceTiles;
        this.bombTiles = newBombTiles;
        this.skillTiles = newSkillTiles;
        
        if (moved) {
            this.updateDOM(merged);
        }
        
        return { moved, mergedTiles, newTiles, mergePositions, triggeredSkills };
    }

    buildTraversals(vector) {
        const traversals = { row: [], col: [] };
        
        for (let i = 0; i < this.size; i++) {
            traversals.row.push(i);
            traversals.col.push(i);
        }
        
        if (vector.row === 1) traversals.row.reverse();
        if (vector.col === 1) traversals.col.reverse();
        
        return traversals;
    }

    isWithinBounds(row, col) {
        return row >= 0 && row < this.size && col >= 0 && col < this.size;
    }

    updateDOM(merged = null) {
        this.tiles.forEach(t => t.element.remove());
        this.tiles = [];
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.grid[row][col];
                if (value > 0) {
                    const isMerged = merged && merged[row][col];
                    this.createTileElement(row, col, value, false);
                    if (isMerged) {
                        const tile = this.tiles[this.tiles.length - 1].element;
                        tile.classList.add('merged');
                        setTimeout(() => tile.classList.remove('merged'), 200);
                    }
                }
            }
        }
    }

    removeTile(row, col) {
        if (this.grid[row][col] === 0) return;
        
        this.grid[row][col] = 0;
        this.interferenceTiles.delete(`${row},${col}`);
        this.bombTiles.delete(`${row},${col}`);
        this.updateDOM();
    }

    canMove() {
        if (this.getEmptyCells().length > 0) return true;
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.grid[row][col];
                if (col < this.size - 1 && this.grid[row][col + 1] === value) return true;
                if (row < this.size - 1 && this.grid[row + 1][col] === value) return true;
            }
        }
        
        return false;
    }

    getMaxTile() {
        let max = 0;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] > max) {
                    max = this.grid[row][col];
                }
            }
        }
        return max;
    }

    getGridCopy() {
        return this.grid.map(row => [...row]);
    }

    countTilesWithValue(value) {
        let count = 0;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === value) {
                    count++;
                }
            }
        }
        return count;
    }

    getAttackableTiles() {
        const tiles = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.grid[row][col];
                if ([128, 512, 1024].includes(value)) {
                    tiles.push({ row, col, value });
                }
            }
        }
        return tiles;
    }
}
