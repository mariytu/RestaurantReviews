let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {

	// Init service worker
	if (!navigator.serviceWorker) {
		return;
    }
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
    	console.log('SW registered! Scope: ' + reg.scope);
    }).catch(function(err) {
    	console.log('Error: ' + err);
    });
	
	initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.newMap = L.map('map', {
				center: [restaurant.latlng.lat, restaurant.latlng.lng],
				zoom: 16,
				scrollWheelZoom: false
			});
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
				mapboxToken: 'pk.eyJ1IjoibWFyaXl0dSIsImEiOiJjanM5c3E0d2YxMHlyNDNsaWR2cjBoa3A4In0.UwICO4H_4Bp96UEcf9bHCw',
				maxZoom: 18,
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
					'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
					'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				id: 'mapbox.streets'
			}).addTo(newMap);
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
		}
	});
}  

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant);
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL';
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant);
		});
	}
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;
	
	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;
	
	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.alt = restaurant.name;
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	
	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;
	
	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');
		
		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);
		
		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);
		
		hours.appendChild(row);
	}
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');
	const title = document.createElement('h2');
	title.innerHTML = 'Reviews';
	container.appendChild(title);
	
	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');
	const ibox = document.createElement('div');
	ibox.className = 'ibox';
	li.appendChild(ibox);

	const iboxTitle = document.createElement('div');
	iboxTitle.className = 'ibox-title';
	ibox.appendChild(iboxTitle);

	const name = document.createElement('p');
	name.innerHTML = review.name;
	iboxTitle.appendChild(name);

	const iboxTools = document.createElement('div');
	iboxTools.className = 'ibox-tools';
	iboxTitle.appendChild(iboxTools);
	
	const date = document.createElement('p');
	date.innerHTML = review.date;
	iboxTools.appendChild(date);

	const iboxContent = document.createElement('div');
	iboxContent.className = 'ibox-content';
	ibox.appendChild(iboxContent);

	const labelRating = document.createElement('label');
	labelRating.className = 'label label-primary';
	labelRating.innerHTML = `Rating: ${review.rating}`;
	iboxContent.appendChild(labelRating);
	
	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	iboxContent.appendChild(comments);
	
	return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	const a = document.createElement('a');
	const attr = document.createAttribute('aria-current');

	a.innerHTML = restaurant.name;
	a.href = '#';
	a.className = 'current';
	attr.value = 'page';

	a.setAttributeNode(attr);
	li.appendChild(a);
	breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
