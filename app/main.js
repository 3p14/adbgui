const {app, BrowserWindow, ipcMain, dialog} = require('electron');
const {exec, execSync} = require('child_process');
const path = require('path');
const tmp = require('tmp');

let mainWindow = null;

let seq = 0;

let prev = "";
let curr = null;

let tmpDir = null;

let captureTimeout = null;
let refresh = 2000;

ipcMain.on('clean', () => {
    exec(`rm -rf ${prev}`);
    captureTimeout = setTimeout(captureScreen, refresh);
})

ipcMain.on('adbTap', (event, x, y) => {
    execSync(`adb shell input tap ${x} ${y}`);
});

ipcMain.on('adbReturn', () => {
    execSync("adb shell input keyevent 4");
    execSync("adb shell input keyevent 4");
});

ipcMain.on('adbBack', () => {
    execSync("adb shell input keyevent 4");
});

ipcMain.on('adbHome', () => {
    execSync("adb shell input keyevent 3");
})

ipcMain.on('adbInstall', () => {
    const files = dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            {
                name: 'Android Application',
                extensions: ['apk']
            }
        ]
    });

    if (files) {
        execSync(`adb push ${files[0]} /data/local/tmp/app.apk`);
        let ret = execSync("adb shell /system/bin/pm install -t /data/local/tmp/app.apk");
        console.log(ret.toString());
        ret = execSync("adb shell /system/bin/rm /data/local/tmp/app.apk");
        console.log(ret.toString());
    }
});

ipcMain.on('adbSecure', (event, secure) => {
    execSync(`adb shell settings put secure install_non_market_apps ${secure?0:1}`);
    secure = execSync("adb shell settings get secure install_non_market_apps");
    mainWindow.webContents.send('secure', secure[0]==0x31?false:true);
});

ipcMain.on('adbSwipe', (event, x1, y1, x2, y2) => {
    execSync(`adb shell input swipe ${x1} ${y1} ${x2} ${y2}`);
});

ipcMain.on('adbConnect', (event, ip, port, re) => {
    refresh = re * 1000;
    exec(`adb kill-server && adb connect ${ip}:${port}`, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            mainWindow.webContents.send('connect', data);
            if (data.includes('connected')) {
                let secure = execSync("adb shell settings get secure install_non_market_apps");
                mainWindow.webContents.send('secure', secure[0]==0x31?false:true);
                tmpDir = tmp.dirSync().name;
                captureScreen();
            }
        }
    });
})

const captureScreen = () => {
    exec(`adb shell screencap -p /sdcard/screen.png`, (err) => {
        if (!err) {
            prev = curr;
            seq++;
            curr = path.join(tmpDir, `screen${seq}.png`);
            exec(`adb pull /sdcard/screen.png ${curr}`, (err) => {
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
        clearTimeout(captureTimeout);
        mainWindow = null;
    });
});

app.on('quit', () => {
    if (tmpDir != null) {
        tmpDir.removeCallback();
    }
});