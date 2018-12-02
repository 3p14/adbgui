const {ipcRenderer} = require('electron');

var data = {
    image: null,
    connectProgress: 'connect',
    connected: 0,
    errmsg: null,
    androidAddr: '',
    androidPort: 5555
};

var app = new Vue({
    el: '#app',
    data: data,
    methods: {
        androidReturn: function(event) {
            console.log(event);
            ipcRenderer.send('adbReturn');
            return false;
        },
        androidSwipeStart: function(event) {
            this.X = event.clientX;
            this.Y = event.clientY;
        },
        androidSwipeStop: function(event) {
            if (event.ctrlKey || event.which != 1) {
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
            ipcRenderer.send('adbConnect');
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
})