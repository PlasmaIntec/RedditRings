console.log("ADDING RINGS");

const windowSize = 100;

var allRings = [];

var union = (setA, setB) => {
    let _union = new Set(setA)
    for (let elem of setB) {
        _union.add(elem)
    }
    return _union
}

var getAllAuthorsByListing = (listing) => {
    var authors = new Set();
    listing.data.children.forEach(child => {
		var kind = child.kind;
		if (kind != "t1") return authors;
		var author = child.data.author;
		if (author == "[deleted]") return authors;
        authors.add(author);
        var listings = child.data.replies;
        if (!listings) return authors;
		var moreAuthors = getAllAuthorsByListing(listings);
		authors = union(authors, moreAuthors);
    })
    return authors;
}

var getFavoriteSubredditsByUser = (user) => {
	return new Promise((resolve) => {
		var userUrl = `https://www.reddit.com/user/${user}/.json?limit=${windowSize}`;
		fetch(userUrl)
			.then(res => res.json())
			.then(json => {
				var topSubreddits = getSubredditByCount(json);
				resolve(topSubreddits)
			})
	})
}

var getSubredditByCount = (json) => {
    var count = {}
    json.data.children.forEach(child => {
		var subreddit = child.data.subreddit;
		var subreddit_type = child.data.subreddit_type;
		if (subreddit_type != "public") return;
        if (!count[subreddit]) {
            count[subreddit] = 1;
        } else {
            count[subreddit] += 1;
        }
    })
    return sortDictionary(count);
}

var sortDictionary = (dict) => {
	var arr = [];
	for (var key of Object.keys(dict)) {
		arr.push([key, dict[key]])
	}
	return arr.sort((a, b) => a[1] > b[1] ? -1 : 1).map(e => e[0]);
}

var createRing = (src, subreddit) => {
	if (!src) {
		var xmlString = `<svg class="_2WM2ef3imxyCFqHx0Nx5M4 _3fvJBCH6c6P0NvMwoqK9MJ" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" style="background:#0079D3" role="presentation"><path d="M15.8286,15.8998 C15.3466,16.3788 12.6326,15.5598 8.5516,11.4798 C4.4706,7.3968 3.6486,4.6858 4.1316,4.2038 C4.3566,3.9788 4.9286,3.9208 5.9126,4.3518 C5.6166,4.5678 5.3306,4.8008 5.0666,5.0658 C5.0536,5.0798 5.0416,5.0948 5.0266,5.1098 C5.5756,6.4268 6.8946,8.4088 9.2596,10.7728 C11.6206,13.1338 13.6046,14.4538 14.9246,15.0028 C14.9376,14.9898 14.9526,14.9778 14.9666,14.9638 C15.2316,14.6988 15.4646,14.4128 15.6786,14.1178 C16.1096,15.1028 16.0526,15.6748 15.8286,15.8998 M16.7526,11.8998 C17.4066,9.5458 16.8136,6.9138 14.9666,5.0658 C13.6436,3.7438 11.8866,3.0148 10.0166,3.0148 C9.3686,3.0148 8.7356,3.1078 8.1286,3.2768 C5.7306,1.7598 3.9176,1.5898 2.7176,2.7898 C1.4036,4.1028 2.0736,6.1918 3.2866,8.1688 C2.6446,10.5128 3.2276,13.1258 5.0666,14.9638 C6.3886,16.2868 8.1456,17.0148 10.0166,17.0148 C10.6536,17.0148 11.2746,16.9178 11.8736,16.7518 C13.0856,17.4938 14.3406,18.0318 15.4316,18.0318 C16.1156,18.0318 16.7366,17.8198 17.2426,17.3138 C18.4416,16.1138 18.2706,14.2988 16.7526,11.8998"></path></svg>`;
		var doc = new DOMParser().parseFromString(xmlString, "text/xml");
		var ring = doc.firstChild;
	} else {
		var ring = document.createElement("img");
		ring.src = src;
	}
	ring.style.cssText = "width:22px;height:22px;border-radius:100%;";
	var div = document.createElement("div");
	div.classList.add("tooltip");	
	var tooltipLink = document.createElement("a");
	tooltipLink.text = subreddit;
	tooltipLink.href = `/r/${subreddit}`;
	tooltipLink.target = "_blank";
	tooltipLink.rel = "noopener noreferrer";
	tooltipLink.classList.add("tooltiptext");
	div.appendChild(ring);
	div.appendChild(tooltipLink);
	return div;
}

var xpath = (xpathToExecute) => {
	var result = [];
	var nodesSnapshot = document.evaluate(xpathToExecute, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null );
	for ( var i=0 ; i < nodesSnapshot.snapshotLength; i++ ){
	  	result.push( nodesSnapshot.snapshotItem(i) );
	}
	return result;
}

var insertRing = (user, ring) => {
	var xPathString = `//div[./*[text()="${user}"]]`;
	try {
		var nodes = xpath(xPathString);
		nodes.forEach(node => {
			var cloneRing = ring.cloneNode(true);
			node.after(cloneRing);
			allRings.push(cloneRing);
		})
	} catch (error) {
		console.log(xPathString)
		console.log(error)
	}
}

var getSubredditIcon = (subreddit) => {
	return new Promise((resolve) => {
		var subredditUrl = `https://www.reddit.com/r/${subreddit}/about.json`;
		fetch(subredditUrl)
			.then(res => res.json())
			.then(json => {
				if (json.data.icon_img) {
					resolve(json.data.icon_img);
				} else if (json.data.community_icon) {
					resolve(json.data.community_icon);
				} else {
					resolve("") // Subreddit has no viable icon
				}
			})
	})
}

var addRings = () => {
	allRings.forEach(ring => {
		ring.parentElement.removeChild(ring);
	});
	allRings = [];
	var url = `${document.URL}.json`;
	fetch(url)
		.then(res => res.json())
		.then(json => {
			var authors = getAllAuthorsByListing(json[1]);
			authors.forEach(author => {
				getFavoriteSubredditsByUser(author)
				.then(subreddits => {
					var subreddit = subreddits[0];
					getSubredditIcon(subreddit)
						.then(iconUrl => insertRing(author, createRing(iconUrl, subreddit)))
				})
			})
		})
		.catch(console.log)
}

// add rings after reddit loads
window.addEventListener("load", addRings, false);

// add rings after clicking "More Comments" from the Classic View
var commentAnchors = [...document.getElementsByTagName("a")].filter(e => e.getAttribute("data-click-id") === "comments");
commentAnchors.forEach(e => e.addEventListener("click", () => setTimeout(addRings, 1000)));

// add rings if the extension icon is clicked
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  	if (request.message === "refresh") {
		addRings();
	}
})