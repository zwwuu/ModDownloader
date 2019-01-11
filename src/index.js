'use strict';

const {dialog, getCurrentWindow, shell} = require('electron').remote;
const fs = require('fs');
const request = require('request');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Store = require('electron-store');

document.getElementById('browseButton').addEventListener('click', selectPath);
document.getElementById('close').addEventListener('click', close);
document.getElementById('minimize').addEventListener('click', minimize);
document.getElementById('downloadButton').
	addEventListener('click', downloadMod);
document.getElementById('openButton').addEventListener('click', openModFolder);
document.getElementById('downloadCMDButton').
	addEventListener('click', downloadCMD);
document.getElementById('aboutButton').addEventListener('click', about);

const store = new Store();

let steamcmdPath = '';

if (store.has('path')) {
	document.getElementById('steamcmdPath').value = store.get('path');
	steamcmdPath = document.getElementById('steamcmdPath').value;
}

function selectPath() {
	steamcmdPath = dialog.showOpenDialog({
		properties: ['openDirectory']
	});

	if (steamcmdPath === undefined) {
		return;
	}
	document.getElementById('steamcmdPath').value = steamcmdPath;
	store.set('path', steamcmdPath);
}

function close() {
	getCurrentWindow().close();
}

function minimize() {
	getCurrentWindow().minimize();
}

function openModFolder() {
	shell.showItemInFolder(`${steamcmdPath}\\steamapps\\workshop\\content\\*`);
}

function downloadMod() {
	let text = document.getElementById('downloadList').value;
	let path = document.getElementById('steamcmdPath').value;
	if (text.length === 0 && path === '') {
		return;
	}
	document.getElementById('downloadButton').classList.add('is-loading');
	let modList = formatText(text);
	const promises = modList.map(mod => getValidModList(mod));
	Promise.all(promises).then((validModList) => {
		if (validModList.length === 0) {
			return;
		}
		generateScript(validModList);

		exec(`${steamcmdPath}/steamcmd +runscript script.txt`).then(() => {
			document.getElementById('downloadList').value = '';
			document.getElementById('downloadButton').classList.remove('is-loading');
		});
	});
}

function downloadCMD() {
	shell.openExternal('https://developer.valvesoftware.com/wiki/SteamCMD');
}

function about() {
	shell.openExternal('https://github.com/wuuzw/ModDownloader');
}

function generateScript(validModList) {
	let workshop = '';
	for (let i = 0; i < validModList.length; i++) {
		workshop += `workshop_download_item ${validModList[i].gameID} ${validModList[i].modID}\n`;
	}

	let script = `@ShutdownOnFailedCommand 1
@NoPromptForPassword 1
login anonymous 
${workshop}
quit`;

	fs.writeFile(`${steamcmdPath}/script.txt`, script, err => {
		if (err) {
			throw err;
		}
	});
}

function getValidModList(modID) {
	const option = {
		uri: 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
		form: {
			itemcount: 1,
			publishedfileids: {0: modID}
		},
		json: true
	};

	return new Promise(function(resolve) {
		request.post(option, function(err, httpResponse, body) {
			if (err) {
				return;
			}

			if (body['response']['publishedfiledetails'][0].hasOwnProperty(
				'consumer_app_id')) {
				let validData = {};
				validData.gameID = body['response']['publishedfiledetails'][0]['consumer_app_id'];
				validData.modID = modID;
				resolve(validData);
			}
		});
	});
}

function formatText(text) {
	let modList = text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
	let downloadList = [];
	for (let i = 0; i < modList.length; i++) {
		let modID = modList[i].replace(/[^0-9]+/gm, '');
		downloadList.push(modID);
	}
	return downloadList.filter(mod => mod !== '').filter(function(mod, i, arr) {
		return arr.indexOf(mod) === i;
	});
}
