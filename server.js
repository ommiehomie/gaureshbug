const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8 // 100MB payload limit for fonts/textures
});

app.use(express.static('public'));

let clockSeconds = 153; // 2:33 default
let isClockRunning = false;

let gameState = {
    fontFamily: 'Teko',
    customFonts: [],
    visibility: {
        bug: true,
        clock: true,
        quarter: true,
        downDist: true,
        awayLogo: true,
        awayName: true,
        awayMascot: true,
        awayScore: true,
        awayTimeouts: true,
        homeLogo: true,
        homeName: true,
        homeMascot: true,
        homeScore: true,
        homeTimeouts: true
    },
    awayTeam: { 
        name: 'NEBRASKA', score: 10, 
        color1: '#D00000', color2: '#800000', gradientAngle: 180, fontColor: '#ffffff',
        bgImage: '', bgOpacity: 50, bgBlendMode: 'overlay',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Nebraska_Cornhuskers_logo.svg',
        logoSize: 75, logoTilt: 0, logoFlip: 1, logoX: -35, logoY: -12,
        mascotText: 'CORNHUSKERS', mascotFont: 'Teko', mascotColor: '#ffffff', mascotSize: 18, mascotX: -35, mascotY: 55, mascotTilt: 0,
        timeouts: 3 
    },
    homeTeam: { 
        name: 'MINNESOTA', score: 3, 
        color1: '#7A0019', color2: '#FFCC33', gradientAngle: 180, fontColor: '#ffffff',
        bgImage: '', bgOpacity: 50, bgBlendMode: 'overlay',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Minnesota_Golden_Gophers_logo.svg',
        logoSize: 75, logoTilt: 0, logoFlip: 1, logoX: -35, logoY: -12,
        mascotText: 'GOLDEN GOPHERS', mascotFont: 'Teko', mascotColor: '#FFCC33', mascotSize: 18, mascotX: -35, mascotY: 55, mascotTilt: 0,
        timeouts: 3 
    },
    clock: '2:33',
    quarter: '4TH',
    down: '4TH',
    distance: '10'
};

// Clock countdown engine
setInterval(() => {
    if (isClockRunning && clockSeconds > 0) {
        clockSeconds--;
        const mins = Math.floor(clockSeconds / 60);
        const secs = clockSeconds % 60;
        gameState.clock = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        io.emit('clockTick', { clock: gameState.clock, seconds: clockSeconds, isRunning: isClockRunning });
    } else if (clockSeconds === 0 && isClockRunning) {
        isClockRunning = false;
        io.emit('clockTick', { clock: gameState.clock, seconds: clockSeconds, isRunning: false });
    }
}, 1000);

io.on('connection', (socket) => {
    socket.emit('stateUpdate', gameState);
    socket.emit('clockTick', { clock: gameState.clock, seconds: clockSeconds, isRunning: isClockRunning });

    socket.on('updateState', (newState) => {
        gameState = { ...gameState, ...newState };
        io.emit('stateUpdate', gameState); 
    });

    socket.on('startClock', () => { 
        isClockRunning = true; 
        io.emit('clockTick', { clock: gameState.clock, seconds: clockSeconds, isRunning: true });
    });

    socket.on('stopClock', () => { 
        isClockRunning = false; 
        io.emit('clockTick', { clock: gameState.clock, seconds: clockSeconds, isRunning: false });
    });

    socket.on('setClockSeconds', (seconds) => {
        clockSeconds = Math.max(0, seconds);
        const mins = Math.floor(clockSeconds / 60);
        const secs = clockSeconds % 60;
        gameState.clock = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        io.emit('stateUpdate', gameState);
        io.emit('clockTick', { clock: gameState.clock, seconds: clockSeconds, isRunning: isClockRunning });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});