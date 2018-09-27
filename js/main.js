let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

const STAR_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="25.6" height="25.6" viewBox="0 0 25.6 25.6">
  <path xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" fill="inherit" d="m 21.392498,8.859725 c .486775,.9154894 -2.880809,5.054688 -2.880809,5.054688 0,0 2.096212,4.907084 1.375952,5.652935 -.720261,.745852 -5.697514,-1.177827 -5.697514,-1.177827 0,0 -4.019148,3.509987 -4.9510673,3.05546 -.9319205,-.454527 -.6404478,-5.782626 -.6404478,-5.782626 0,0 -4.5801825,-2.737793 -4.4358801,-3.764557 .1443025,-1.026765 5.301695,-2.396032 5.301695,-2.396032 0,0 1.1884402,-5.2020358 2.2095432,-5.3820839 1.021104,-.1800487 3.917075,4.3017967 3.917075,4.3017967 0,0 5.314679,-.4772429 5.801453,.4382462 z"/>
</svg>`;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
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
    mapboxToken: 'pk.eyJ1IjoiZHd0NDciLCJhIjoiY2ppc3ptbXE3MHU4djNsbzFtZHRlcjQ4bSJ9.qsM50JAQwCwl4v67TbQLYQ',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

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

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.altText || restaurant.name;
  li.append(image);

  const details = document.createElement('div');
  details.className = 'restaurant-details';
  li.append(details);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  details.append(name);

  const favorite = createFavoriteToggle(restaurant);
  details.append(favorite);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  details.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  details.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.title = restaurant.name;
  more.setAttribute('aria-label', restaurant.name);
  more.href = DBHelper.urlForRestaurant(restaurant);
  details.append(more)

  return li
}

createFavoriteToggle = (restaurant) => {
  const checkboxID = `mark-favorite-${restaurant.name}`;
  const favorite = document.createElement('label');
  favorite.className = 'restaurant-favorite';
  favorite.htmlFor = checkboxID;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = checkboxID;
  checkbox.name = checkboxID;
  checkbox.checked = restaurant.is_favorite === 'true';
  checkbox.onchange = e => DBHelper.setFavorite(restaurant.id, checkbox.checked);
  favorite.append(checkbox);

  const text = document.createElement('span');
  text.className = 'sr-only';
  text.innerHTML = restaurant.name + ' is a favorite restaurant';
  favorite.append(text);

  const star = document.createElement('span');
  star.className = 'star';
  star.innerHTML = STAR_ICON;
  star.setAttribute('title', 'Mark as Favorite');
  star.setAttribute('role', 'img');
  favorite.append(star);

  return favorite;
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
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

_registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

_registerServiceWorker();
