const {app, BrowserWindow, ipcMain} = require('electron');
const {exec, execSync} = require('child_process');
const path = require('path');

let mainWindow = null;

let prev = 0;
let curr = 0;

ipcMain.on('clean', () => {
    execSync(`rm -rf images/screen${prev}.png`);
})

ipcMain.on('adbTap', (event, x, y) => {
    execSync(`adb shell input tap ${x} ${y}`);
});

ipcMain.on('adbReturn', () => {
    execSync("adb shell input keyevent 4");
});

ipcMain.on('adbHome', () => {
    execSync("adb shell input keyevent 3");
})

ipcMain.on('adbSwipe', (event, x1, y1, x2, y2) => {
    execSync(`adb shell input swipe ${x1} ${y1} ${x2} ${y2}`);
});

ipcMain.on('adbConnect', (event, ip, port) => {
    let data = execSync(`adb kill-server && adb connect ${ip}:${port}`);
    mainWindow.webContents.send('connect', data);
    if (data.includes('connected')) {
        captureScreen();
        setInterval(captureScreen, 3000);
    }
})

const captureScreen = () => {
    exec(`adb shell screencap -p /sdcard/screen.png`, (err) => {
        if (!err) {
            prev = curr;
            curr++;
            exec(`adb pull /sdcard/screen.png images/screen${curr}.png`, (err) => {
                if (!err) {
                    mainWindow.webContents.send('capture', curr);
                }
            });
        } else {
            console.log(err);
        }
    });
}

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        show: false,
        width: 720,
        height: 580,
        resizable: false,
        center: true
    });
    mainWindow.setFullScreenable(false);
    mainWindow.loadURL('file://'+__dirname+'/index.html');
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
    mainWindow.on('close', () => {
        mainWindow = null;
    });
});