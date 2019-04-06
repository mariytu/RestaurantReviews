let restaurants,
	neighborhoods,
	cuisines;
var newMap;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
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

	initMap(); // added
	fetchNeighborhoods();
	fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) { // Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
		}
	});
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	neighborhoods.forEach(neighborhood => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
		}
	});
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');
	
	cuisines.forEach(cuisine => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
	self.newMap = L.map('map', {
		center: [40.722216, -73.987501],
		zoom: 12,
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
	
	updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');
	
	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;
	
	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;
	
	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	})
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';
	
	// Remove all map markers
	if (self.markers) {
		self.markers.forEach(marker => marker.remove());
	}
	self.markers = [];
	self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach(restaurant => {
		ul.append(createRestaurantHTML(restaurant));
	});
	addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
	const li = document.createElement('li');
	
	const ibox = document.createElement('div');
	ibox.className = 'ibox';
	li.append(ibox);

	const iboxContent = document.createElement('div');
	iboxContent.className = 'ibox-content restaurant-box';
	ibox.append(iboxContent);

	// Restaurant Image
	const restaurantImageContainer = document.createElement('div');
	restaurantImageContainer.className = 'restaurant-image';
	iboxContent.append(restaurantImageContainer);

	const image = document.createElement('img');
	image.className = 'restaurant-img';
	image.alt = restaurant.name;
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	restaurantImageContainer.append(image);
	
	// Restaurant Details
	const restaurantDetailsContainer = document.createElement('div');
	restaurantDetailsContainer.className = 'restaurant-desc';
	iboxContent.append(restaurantDetailsContainer);

	const name = document.createElement('h1');
	name.innerHTML = restaurant.name;
	restaurantDetailsContainer.append(name);

	const addressContainer = document.createElement('div');
	addressContainer.className = 'small m-t-xs';
	restaurantDetailsContainer.append(addressContainer);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	addressContainer.append(neighborhood);
	
	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	addressContainer.append(address);

	const buttonContainer = document.createElement('div');
	buttonContainer.className = 'm-t';
	restaurantDetailsContainer.append(buttonContainer);
	
	const more = document.createElement('a');
	more.innerHTML = 'View Details';
	more.href = DBHelper.urlForRestaurant(restaurant);
	buttonContainer.append(more);
	
	return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
		marker.on("click", onClick);
		function onClick() {
			window.location.href = marker.options.url;
		}
		self.markers.push(marker);
	});
}