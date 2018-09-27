let restaurant;
var newMap;

const STAR_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="25.6" height="25.6" viewBox="0 0 25.6 25.6">
  <path xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" fill="inherit" d="m 21.392498,8.859725 c .486775,.9154894 -2.880809,5.054688 -2.880809,5.054688 0,0 2.096212,4.907084 1.375952,5.652935 -.720261,.745852 -5.697514,-1.177827 -5.697514,-1.177827 0,0 -4.019148,3.509987 -4.9510673,3.05546 -.9319205,-.454527 -.6404478,-5.782626 -.6404478,-5.782626 0,0 -4.5801825,-2.737793 -4.4358801,-3.764557 .1443025,-1.026765 5.301695,-2.396032 5.301695,-2.396032 0,0 1.1884402,-5.2020358 2.2095432,-5.3820839 1.021104,-.1800487 3.917075,4.3017967 3.917075,4.3017967 0,0 5.314679,-.4772429 5.801453,.4382462 z"/>
</svg>`;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
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
        mapboxToken: 'pk.eyJ1IjoiZHd0NDciLCJhIjoiY2ppc3ptbXE3MHU4djNsbzFtZHRlcjQ4bSJ9.qsM50JAQwCwl4v67TbQLYQ',
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

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favorite = createFavoriteToggle(restaurant);
  name.append(favorite);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = restaurant.altText || restaurant.name;
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
  const details = document.createElement('div');
  details.className = 'review-details';
  li.appendChild(details);

  const name = document.createElement('p');
  name.innerHTML = review.name;
  details.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  details.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  details.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
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
