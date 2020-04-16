// refresh icons upon clicking extension icon
chrome.browserAction.onClicked.addListener((tab) => {	
	var msg = {
		message: "refresh"
	}
	chrome.tabs.sendMessage(tab.id, msg);
});