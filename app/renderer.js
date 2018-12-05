const {ipcRenderer} = require('electron');

var data = {
    image: null,
    connectProgress: 'connect',
    connected: 0,
    errmsg: null,
    secure: true,
    androidAddr: '',
    androidPort: null
};

var app = new Vue({
    el: '#app',
    data: data,
    methods: {
        androidReturn: function(event) {
            ipcRenderer.send('adbReturn');
        },
        androidHome: function() {
            ipcRenderer.send('adbHome');
        },
        androidInstall: function() {
            ipcRenderer.send('adbInstall');
        },
        androidSecure: function() {
            ipcRenderer.send('adbSecure', !this.secure);
        },
        androidSwipeStart: function(event) {
            this.X = event.clientX;
            this.Y = event.clientY;
        },
        androidSwipeStop: function(event) {
            if (event.which != 1) {
                return;
            }
            if (Math.abs(event.clientX-this.X) > 15 || Math.abs(event.clientY-this.Y) > 15) {
                ipcRenderer.send('adbSwipe', this.X, this.Y, event.clientX, event.clientY);
            } else {
                ipcRenderer.send('adbTap', this.X, this.Y);
            }
        },
        androidConnect: function() {
            this.connectProgress = 'connecting...';
            ipcRenderer.send('adbConnect', this.androidAddr, this.androidPort || 5555);
        }
    }
});

const renderScreen = (image) => {
    data.image = image;
}

ipcRenderer.on('capture', (event, curr) => {
    renderScreen(`../images/screen${curr}.png`);
    ipcRenderer.send('clean');
});

ipcRenderer.on('connect', (event, response) => {
    if (response.includes('connected')) {
        data.connected = 1;
    } else {
        data.errmsg = response;
    }
});

ipcRenderer.on('secure', (event, secure) => {
    console.log(secure);
    data.secure = secure;
})