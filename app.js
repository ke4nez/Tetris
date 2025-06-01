let gameInterval = null;
const gameBoardWith = 10
const gameBoardHeigth = 20
const colors = {
    red: "#FF4C4C",
    blue: "#4C6EFF",
    green: "#4CFF4C",
    yellow: "#FFE44C",
    purple: "#B14CFF",
    cyan: "#4CFFF7",
    orange: "#FFA64C"
}; 
const colorScores = {
    "#FF4C4C": 10,  // red
    "#4C6EFF": 15,  // blue
    "#4CFF4C": 12,  // green
    "#FFE44C": 8,   // yellow
    "#B14CFF": 20,  // purple
    "#4CFFF7": 18,  // cyan
    "#FFA64C": 14   // orange
};
let isMusicOn = true
let volume = 0.25

let currentNickName  = "default"
let score = 0;

class GameBoard{
    constructor(){
        this.width = gameBoardWith
        this.heigth = gameBoardHeigth
        this.Blocks = [];
        this.activeBlock = null
    }

    createNewBlock() {
    const colorValues = Object.values(colors);
    const randomColor = colorValues[Math.floor(Math.random() * colorValues.length)];

    const chance = Math.random();

    if (chance < 0.1) {
        // Спавн бомбы (10% шанс)
        const x = Math.floor(this.width / 2);
        const y = 0;                   
        const radius = 2;                   

        const bomb = new Bomb(x, y, radius);
        this.Blocks.push(bomb);
        this.activeBlock = bomb;
    } else {
        // Обычный блок (80% шанс)
        const width = Math.floor(Math.random() * 6) + 1;
        const heigth = Math.floor(Math.random() * 3) + 1;
        const minElements = width;
        const maxElements = width * heigth;
        const elementCount = Math.floor(Math.random() * (maxElements - minElements + 1)) + minElements;

        const block = new Block(width, heigth, randomColor, elementCount);
        this.Blocks.push(block);
        this.activeBlock = block;
    }
}

    deleteBlocks() {
      this.Blocks = [];
      this.activeBlock = null;
    }

    isValidPlayerMove(action) {
        if (!this.activeBlock || !this.activeBlock.Cells.length) return false;
        
        const block = this.activeBlock;
        
        switch (action) {
            case 'left':
                for (let i = 0; i < block.Cells.length; i++) {
                    const cell = block.Cells[i];
                    const newX = cell.x - 1;
                    const newY = cell.y;
                    
                    if (newX < 0) return false;
                    
                    for (let j = 0; j < this.Blocks.length; j++) {
                        const staticBlock = this.Blocks[j];

                        if(block === staticBlock){continue}
                        
                        for (let k = 0; k < staticBlock.Cells.length; k++) {
                            const staticCell = staticBlock.Cells[k];
                            
                            if (staticCell.x === newX && staticCell.y === newY) {
                                return false;
                            }
                        }
                    }
                }
                return true;
                
            case 'right':
                for (let i = 0; i < block.Cells.length; i++) {
                    const cell = block.Cells[i];
                    const newX = cell.x + 1;
                    const newY = cell.y;

                    console.log(newX + " " + this.width)
                    if (newX >= this.width){return false;}
                    
                    for (const staticBlock of this.Blocks) {

                        if(block === staticBlock){continue}

                        for (const staticCell of staticBlock.Cells) {
                            if (staticCell.x === newX && staticCell.y === newY) {
                                return false;
                            }
                        }
                    }
                }
                return true;
                
            case 'down':
                for (const cell of block.Cells) {
                    const newY = cell.y + 1;
                    
                    if (newY >= this.heigth) return false;
                    
                    for (const staticBlock of this.Blocks) {

                        if(block === staticBlock){continue}

                        for (const staticCell of staticBlock.Cells) {
                            if (staticCell.x === cell.x && staticCell.y === newY) {
                                return false;
                            }
                        }
                    }
                }
                return true; 
            case 'up':
                return true;
        
            case 'rotateLeft':
            case 'rotateRight': {
                        const blockCopy = Object.assign(
                            Object.create(Object.getPrototypeOf(this.activeBlock)),
                            this.activeBlock
                        );
                        
                        blockCopy.Cells = this.activeBlock.Cells.map(cell => ({...cell}));
                        
                        if (action === 'rotateLeft') {
                            blockCopy.rotateLeft();
                        } else {
                            blockCopy.rotateRight();
                        }
                        
                        for (const cell of blockCopy.Cells) {
                            if (cell.x < 0 || cell.x >= this.width || cell.y < 0 || cell.y >= this.height) {
                                return false;
                            }
                            
                            for (const staticBlock of this.Blocks) {
                                if (this.activeBlock === staticBlock) continue;
                                
                                for (const staticCell of staticBlock.Cells) {
                                    if (staticCell.x === cell.x && staticCell.y === cell.y) {
                                        return false;
                                    }
                                }
                            }
                        }
                        return true;
                    }
                }
    }

    isDownRowClear(block) {
        for (let i = 0; i < block.Cells.length; i++) {
            const cell = block.Cells[i];
            const rowToCheck = cell.y + 1;
    
            if (rowToCheck >= this.heigth) {
                return false;
            }
    
            for (let j = 0; j < this.Blocks.length; j++) {
                const staticBlock = this.Blocks[j];
    
                //skip same block
                if (staticBlock === block) continue;
    
                for (let k = 0; k < staticBlock.Cells.length; k++) {
                    const staticCell = staticBlock.Cells[k];
    
                    if (staticCell.x === cell.x && staticCell.y === rowToCheck) {
                        return false;
                    }
                }
            }
        }
    
        return true;
    }

    lockAtiveBlock(block){
        block.lock()
        this.activeBlock = null;
    }

    deleteFullRows() {
    for (let row = 0; row < gameBoardHeigth; row++) {
        let counter = 0;
        let scoreToAdd = 0;

        for (let block of this.Blocks) {
            for (let cell of block.Cells) {
                if (cell.y === row) {
                    counter++;
                    scoreToAdd += cell.score;
                }
            }
        }

        if (counter === 10) {
            for (let block of this.Blocks) {
                block.Cells = block.Cells.filter(cell => cell.y !== row);
            }

            for (let block of this.Blocks) {
                for (let cell of block.Cells) {
                    if (cell.y < row) {
                        cell.y += 1;
                    }
                }
            }
            score += scoreToAdd;
        }
    }
    this.Blocks = this.Blocks.filter(block => block.Cells.length > 0);
}
}

class Block{
    constructor(width, heigth, color, elementCount) {
        this.width = width;
        this.heigth = heigth;
        this.color = color;
        this.isLocked = false;
        this.Cells = [];
    
        let blockIndex = 0;
    
        for (let row = 0; row < this.heigth; row++) {
            for (let col = 0; col < this.width; col++) {
                if (blockIndex >= elementCount) break;
    
                this.Cells.push(new Cell(col, row, this.color));
                blockIndex++;
            }
            if (blockIndex >= elementCount) break;
        }
    }

    moveLeft(){
        for(let i = 0; i < this.Cells.length; i++){
            this.Cells[i].x -= 1;
        }
    }

    moveRight(){
        for(let i = 0; i < this.Cells.length; i++){
            this.Cells[i].x += 1;
        }
    }

    moveDown(){
        for(let i = 0; i < this.Cells.length; i++){
            this.Cells[i].y += 1;
        }
    }

    moveUp(){
        for(let i = 0; i < this.Cells.length; i++){
            this.Cells[i].y -= 1;
        }
    }

    rotateLeft() {
        const keys = Object.keys(this.Cells);
        if (keys.length === 0) return;
    
        let center = this.Cells[Math.floor(keys.length / 2)];
        let pivotX = center.x;
        let pivotY = center.y;
    
        for (let key of keys) {
            let block = this.Cells[key];
            let x = block.x;
            let y = block.y;
    
            let newX = pivotX + (y - pivotY);
            let newY = pivotY - (x - pivotX);
    
            block.x = newX;
            block.y = newY;
        }
    }

    rotateRight() {
        const keys = Object.keys(this.Cells);
        if (keys.length === 0) return;
    
        let center = this.Cells[Math.floor(keys.length / 2)];
        let pivotX = center.x;
        let pivotY = center.y;
    
        for (let key of keys) {
            let block = this.Cells[key];
            let x = block.x;
            let y = block.y;
    
            let newX = pivotX - (y - pivotY);
            let newY = pivotY + (x - pivotX);
    
            block.x = newX;
            block.y = newY;
        }
    }

    isLocked(){
       return this.isLocked;
    }

    lock() {
        this.isLocked = true;
    }
}

class Bomb extends Block {
    constructor(x, y, radius) {
        super(1, 1, "#000000", 1);
        
        this.Cells[0].x = x;
        this.Cells[0].y = y;

        this.radius = radius;
    }


    explode() {
        console.log("EXPLOAD!!!!!")
        const centerX = this.Cells[0].x;
        const centerY = this.Cells[0].y;
        const radius = this.radius;

        for (let block of gameBoard.Blocks) {
            block.Cells = block.Cells.filter(cell => {
                const distX = Math.abs(cell.x - centerX);
                const distY = Math.abs(cell.y - centerY);
                return !(distX <= radius && distY <= radius);
            });
        }

        gameBoard.Blocks = gameBoard.Blocks.filter(block => block.Cells.length > 0);
        gameBoard.activeBlock
    }

    lock() {
        this.isLocked = true;
        this.explode();
        gameBoard.activeBlock = null;
    }
}

class Cell{
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
         this.score = colorScores[color] || 0;
        console.log(this.score);
    }
}

class Render {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.CELL_SIZE = 30;
    }

    drawCell(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.CELL_SIZE, y * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
        this.ctx.strokeStyle = "#111";
        this.ctx.strokeRect(x * this.CELL_SIZE, y * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
    }

    renderBoard(gameBoard) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < gameBoard.Blocks.length; i++) {
            const block = gameBoard.Blocks[i];

            for (let j = 0; j < block.Cells.length; j++) {
                const el = block.Cells[j];
                this.drawCell(el.x, el.y, el.color);
            }
        }

    
        if (gameBoard.activeBlock) {
            for (let i = 0; i < gameBoard.activeBlock.Cells.length; i++) {
                const el = gameBoard.activeBlock.Cells[i];
                this.drawCell(el.x, el.y, el.color);
            }
        }
    }
}

class Record {
    constructor(nickName, score){
        this.nickName = nickName;
        this.score = score;
    }
}

//GAME
let gameBoard = new GameBoard()
let render = new Render("gameCanvas")

function playMusic(){
     const audio = document.getElementById("audio");
     audio.volume = volume
        if (audio) {
             audio.play().catch((e) => {
                   console.warn("error while playing music!!!", e);
             });
        }
}

function stopMusic() {
    const audio = document.getElementById("audio");
    if (audio) {
        audio.pause();
    }
}

function startGame() {
    if(isMusicOn){
        playMusic();
    }

    console.log("Game started!");

    gameInterval = setInterval(() => {
        console.log("Game loop tick");
        render.renderBoard(gameBoard);
        gameLoop(gameBoard);
        render.renderBoard(gameBoard);
    }, 1000);
}

function gameLoop(gameBoard) {

    if (gameBoard.activeBlock == null) {
        console.log("Creating new block...");
        gameBoard.createNewBlock();
    }
    
    let block = gameBoard.activeBlock;

    if (gameBoard.isDownRowClear(block)) {
        block.moveDown();
    } else {
        console.log("Locking block...");
        gameBoard.lockAtiveBlock(block);
        gameBoard.deleteFullRows();
        gameBoard.createNewBlock();

        if(!gameBoard.isValidPlayerMove('down')){
            endGame();
        }
    }
}

function stopGame() {
    stopMusic();

    if (gameInterval !== null) {
        clearInterval(gameInterval);
        gameInterval = null;
    }

    console.log("Game stopped and returned to menu.");
}

function endGame(){    
    stopGame();
    document.querySelector('.nickNameInputContainer').classList.remove("hidden")
    setTimeout(() => {
        nickNameInput.focus();
    }, 0);
}

//PLAYER INPUT
document.addEventListener("keydown", (event) => {
    if (!gameBoard || !gameBoard.activeBlock) return;
    const key = event.key.toLowerCase();
    console.log("input")

    switch (key) {
        case 'a':
            if(gameBoard.isValidPlayerMove("left")){
                gameBoard.activeBlock.moveLeft()
            }
            break;
        case 'd':
            if(gameBoard.isValidPlayerMove("right")){
                gameBoard.activeBlock.moveRight();
            }
            break;
        case 's':
            if(gameBoard.isValidPlayerMove("down")){
                gameBoard.activeBlock.moveDown()
            }
            break;
        case 'w':
            if(gameBoard.isValidPlayerMove("up")){
                gameBoard.activeBlock.moveUp()
            }
            break; 
        case 'q':
            if(gameBoard.isValidPlayerMove("rotateLeft")){
                gameBoard.activeBlock.rotateLeft();
            }
            break;
        case 'e':
            if(gameBoard.isValidPlayerMove("rotateRight")){
                gameBoard.activeBlock.rotateRight();
            }
            break;
        case 'g':
            endGame();
        default:
            break;
    }
    render.renderBoard(gameBoard);
});

const gameContainer = document.querySelector('.gameContainer');
const startButton = document.getElementById('startButton');
const recordButton = document.getElementById('recordsButton')
const recordExitButton = document.getElementById('backToMenuButtonRecords')
const menuElements = document.querySelectorAll('.menuElement');
const exitGameButton = document.getElementById('exitButton');
const optionsButton = document.getElementById('optionsButton');
const mainMenu =  document.querySelector('nav');
const optionsMenu = document.getElementById('optionsMenu');
const backToMenuButton = document.getElementById('backToMenuButton')
const recordsMenu = document.getElementById('recordsMenu')
const nickNameInput = document.getElementById('nickNameInput')
const nickNameInputContainetr = document.querySelector('.nickNameInputContainer')
const saveRecordButton = document.getElementById('saveRecordButton')

const volumeControl = document.getElementById("volumeControl");
const musicToggle = document.getElementById("musicToggle");
const audio = document.getElementById("audio");
const customAudioInput = document.getElementById("customAudioInput");
const savedCustomAudio = sessionStorage.getItem("customAudio");

const logo = document.querySelector("header svg");

function getPlayerFromLocalStorage() {
    volume = parseFloat(localStorage.getItem('playerVolume')) || 0.2;
    isMusicOn = localStorage.getItem('isMusicOn') || true
}

function saveRecord() {
    let newRecord = new Record(currentNickName, score);
    let records = JSON.parse(localStorage.getItem('records')) || [];

    records.push(newRecord);
    localStorage.setItem('records', JSON.stringify(records));

    score = 0;
}

function loadRecords() {
    let records = JSON.parse(localStorage.getItem('records')) || [];
    records.sort((a, b) => b.score - a.score);

    let tbody = document.querySelector('#recordsTable tbody');
    tbody.innerHTML = '';

    records.forEach((record, index) => {
        let row = document.createElement('tr');

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${record.nickName}</td>
            <td>${record.score}</td>
            <td>${record.date || new Date().toLocaleDateString()}</td>
        `;

        tbody.appendChild(row);
    });

    document.getElementById('recordsMenu').classList.remove('hidden');
}

//START GAME
startButton.addEventListener('click', () => {
    gameContainer.classList.remove('hidden');
    menuElements.forEach(el => {
    el.classList.add('hidden');
    });
    
    getPlayerFromLocalStorage();
    startGame();
});

//EXIT TO MENU
exitGameButton.addEventListener('click', () => {
    gameBoard.deleteBlocks();
    menuElements.forEach(el => {
    el.classList.remove('hidden');
    });
    optionsMenu.classList.add("hidden")
    recordsMenu.classList.add("hidden")
    gameContainer.classList.add("hidden");
    nickNameInputContainetr.classList.add("hidden")
});

//OPTIONS
optionsButton.addEventListener("click", () => {
    mainMenu.classList.add("hidden");
    optionsMenu.classList.remove("hidden");
});

backToMenuButton.addEventListener("click", () => {
    optionsMenu.classList.add("hidden");
    mainMenu.classList.remove("hidden");
});

//RECORDS MENU 
recordButton.addEventListener('click', () => {
    loadRecords();
    mainMenu.classList.add("hidden")
    recordsMenu.classList.remove("hidden")
})

recordExitButton.addEventListener('click', () => {
    recordsMenu.classList.add("hidden");
    mainMenu.classList.remove("hidden");
})

//RECORD TABLE
function isValidNick(nick) {
    const regex = /^[a-zA-Z0-9_]{1,20}$/;
    return regex.test(nick);
}

//SAVE SCORE
saveRecordButton.addEventListener('click', () => {
    currentNickName = nickNameInput.value
    if(isValidNick(currentNickName)){
        saveRecord();
        menuElements.forEach(el => {
        el.classList.remove('hidden');
        });
        optionsMenu.classList.add("hidden")
        recordsMenu.classList.add("hidden")
        gameContainer.classList.add("hidden");
        nickNameInputContainetr.classList.add("hidden");
        gameBoard.deleteBlocks();
    }else{
        alert("incorrect username")
    }
})

//AUDIO
volumeControl.addEventListener("input", () => {
    volume = parseFloat(volumeControl.value);
    if (audio) {
        audio.volume = volume;
    }
    console.log("Volume changed to:", volume);
});

customAudioInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3'))) {
        const objectUrl = URL.createObjectURL(file);
        audio.src = objectUrl;
        audio.play();

        sessionStorage.setItem('customAudio', objectUrl);

        console.log('Проигрывается пользовательская музыка:', file.name);
    } else {
        alert('Пожалуйста, выберите MP3-файл.');
    }
});

musicToggle.addEventListener("change", () => {
    isMusicOn = musicToggle.checked;

    if (audio) {
        if (!isMusicOn) {
            audio.pause();
        }
    }
    console.log("Music is " + (isMusicOn ? "on" : "off"));
});

//SVG LOGO
let isScaledDown = false;
logo.addEventListener("click", function () {
    if (isScaledDown) {
        logo.style.transform = "scale(1)";
    } else {
        logo.style.transform = "scale(0.5)";
    }
    isScaledDown = !isScaledDown;
});
logo.style.transition = "transform 0.3s ease";