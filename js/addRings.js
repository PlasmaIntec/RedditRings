console.log("ADDING RINGS");

const windowSize = 100;

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
				// console.log(userUrl)
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
	var div = document.createElement("div");
	div.classList.add("tooltip");
	var ring = document.createElement("img");
	ring.src = src;
	ring.style.cssText = "width:22px;height:22px;border-radius:100%;";
	var tooltipSpan = document.createElement("span");
	tooltipSpan.innerText = subreddit;
	tooltipSpan.classList.add("tooltiptext");
	div.appendChild(ring);
	div.appendChild(tooltipSpan);
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
	// console.log(xpath(xPathString))
	try {
		// xpath(xPathString)[0].after(ring);
		// var xpath = "//a[text()='SearchingText']";
		// var matchingElement = document.evaluate(xPathString, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
		// matchingElement.after(ring);
		// console.log(matchingElement)

		var nodes = xpath(xPathString);
		nodes.forEach(node => node.after(ring.cloneNode(true)));

		// var aTags = document.getElementsByTagName("a");
		// var searchText = user;
		// var found;

		// for (var i = 0; i < aTags.length; i++) {
		// 	if (aTags[i].textContent == searchText) {
		// 		found = aTags[i];
		// 		aTags[i].after(ring);
		// 		console.log(user, aTags[i])
		// 	}
		// }


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
					console.log(`SUBREDDIT ${subreddit} HAS NO VIABLE ICON`)
					resolve("https://b.thumbs.redditmedia.com/YHkaogTL3ZYfztRSnxzb25y5Rhq4L0VXWeArjpHNr4w.png")
				}
			})
	})
}

var myMain = () => {
	var url = `${document.URL}.json`;
	fetch(url)
		.then(res => res.json())
		.then(json => {
			console.log(json)
			var authors = getAllAuthorsByListing(json[1]);
			console.log(authors);
			authors.forEach(author => {
				console.log(author)
				getFavoriteSubredditsByUser(author)
				.then(subreddits => {
					var subreddit = subreddits[0];
					getSubredditIcon(subreddit)
						.then(iconUrl => insertRing(author, createRing(iconUrl, subreddit)))
				})
			})
		})
}

window.addEventListener("load", myMain, false);