'use strict';

import {app, BrowserWindow, ipcMain, Menu} from 'electron';
import fs from 'fs';
import child from 'child_process';
import path from 'path';

import electron_squirrel_startup from "electron-squirrel-startup";

let mainWindow = null;

if (electron_squirrel_startup) {
	app.quit();
}

function createWindow() {
	mainWindow = new BrowserWindow({
		height: 550,
		width: 450,
		show: false
	});

	Menu.setApplicationMenu(menu);
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

let menu = Menu.buildFromTemplate([
	{
		label: "Edit",
		submenu: [
			{role: 'undo'},
			{role: 'redo'},
			{type: 'separator'},
			{role: 'cut'},
			{role: 'copy'},
			{role: 'paste'},
			{role: 'delete'}
		]
	},
	{
		label: "View",
		submenu: [
			{role: 'reload'},
			{role: 'forcereload'}
		]
	}
]);

ipcMain.on('downloadMod', (event, steamcmdPath, validDataArray) => {
	let workshop = "";
	for (let i = 0; i < validDataArray.length; i++) {
		workshop += `\nworkshop_download_item ${validDataArray[i].gameID} ${validDataArray[i].modID}`
	}

	let script = `@ShutdownOnFailedCommand 1
@NoPromptForPassword 1
login anonymous 
${workshop} 
quit`;

	mainWindow.setProgressBar(0.25);

	let dir = path.dirname(steamcmdPath);
	fs.writeFile(`${dir}/script.txt`, script);
	mainWindow.setProgressBar(0.5);
	child.exec(`${steamcmdPath} +runscript script.txt`, (error, stdout, stderr) => {
		mainWindow.setProgressBar(0.75);
		if (error) {
			event.returnValue = stderr;
		} else {
			event.returnValue = stdout;
		}
		mainWindow.setProgressBar(-1);
	});
});
