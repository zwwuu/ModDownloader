'use strict';

import {ipcRenderer} from 'electron';
import jquery from "jquery";

window.$ = window.jQuery = jquery;

function downloadMod(modIDList) {
	document.getElementById('message').innerHTML = "Downloading....";
	let validDataArray = getPublishedDetail(modIDList);

	if (validDataArray.length === 0) {
		return;
	}

	let steamcmdPath = document.getElementById('steamcmd-path').files[0].path;
	ipcRenderer.sendSync('downloadMod', steamcmdPath, validDataArray);
	$('#message').text("Done").show().fadeOut(8000);
}

function getPublishedDetail(modIDList) {
	let targetURL = "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/";
	let validDataArray = [];

	for (let i = 0; i < modIDList.length; i++) {
		let postData = {
			itemcount: 1,
			publishedfileids: {0: modIDList[i]}
		};

		$.ajax({
			type: 'POST',
			url: targetURL,
			data: postData,
			async: false
		})
			.done(function (data) {
				if (data['response']['publishedfiledetails'][0].hasOwnProperty('consumer_app_id')) {
					let validData = {};
					validData.gameID = data['response']['publishedfiledetails'][0]['consumer_app_id'];
					validData.modID = modIDList[i];

					validDataArray.push(validData);
				} else {
					i++;
				}
			})
			.fail(function () {
				$('#message').text("Check your Internet connection").show().fadeOut(8000);
			});
	}

	return validDataArray;
}

function removeDuplicates(arr) {
	let s = new Set(arr);
	let unique = s.values();
	return Array.from(unique);
}

$("form").submit(function (event) {
	event.preventDefault();
	let trimmed = document.getElementById('ids').value.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
	let arrayofLines = trimmed.split(" ");
	let modIDList = [];

	for (let i = 0; i < arrayofLines.length; i++) {
		let modID = arrayofLines[i].replace(/[^0-9]+/gm, "");
		modIDList.push(modID);
	}

	modIDList = removeDuplicates(modIDList);
	downloadMod(modIDList);
});
