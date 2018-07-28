'use strict';

const {app, BrowserWindow} = require('electron');
const electron_squirrel_startup = require("electron-squirrel-startup");

let mainWindow = null;

if (electron_squirrel_startup) {
	app.quit();
}

function createWindow() {
	mainWindow = new BrowserWindow({
		height: 460,
		width: 450,
		show: false,
		resizable: false,
		frame: false
	});

	mainWindow.loadURL(`file://${__dirname}/index.html`);
	mainWindow.once("ready-to-show", () => {
		mainWindow.show();
	});

	mainWindow.on("closed", () => {
		mainWindow = null;
		app.quit();
	});
}

app.on("ready", () => {
	createWindow();
});
