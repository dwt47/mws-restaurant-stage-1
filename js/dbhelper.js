/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  static get RESTAURANTS_URL() {
    return `${DBHelper.DATABASE_URL}/restaurants`;
  }

  static get REVIEWS_URL() {
    return `${DBHelper.DATABASE_URL}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    if (!this.__RESTAURANT_FETCH__) {
      this.__RESTAURANT_FETCH__ = fetch(DBHelper.RESTAURANTS_URL)
        .then(res => {
          this.__RESTAURANT_FETCH__ = false;
          return res.json()
        });
    }

    this.__RESTAURANT_FETCH__
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null));
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant({photograph, id}) {
    // fall back to using 'id' if no photograph provided
    // Kind of a sloppy solution but the API should really have all of the photographs
    return (`/img/${photograph || id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  static setFavorite(restaurantID, favorite) {
    const url = `${DBHelper.RESTAURANTS_URL}/${restaurantID}/?is_favorite=${favorite ? 'true' : 'false'}`;
    const method = 'PUT';

    return fetch(url, { method });
  }

  static saveReview(data) {
    const method = 'POST';
    const body = JSON.stringify(data);

    return fetch(DBHelper.REVIEWS_URL, { method, body });
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews(callback) {
    if (!this.__REVIEWS_FETCH__) {
      this.__REVIEWS_FETCH__ = fetch(`${DBHelper.REVIEWS_URL}?limit=10000`)
        .then(res => {
          this.__REVIEWS_FETCH__ = false;
          return res.json()
        });
    }

    this.__REVIEWS_FETCH__
      .then(reviews => callback(null, reviews))
      .catch(error => callback(error, null));
  }

  /**
   * Fetch reviews for a restaurant by its ID.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurantReviews = reviews.filter(r => r.restaurant_id == id);
        callback(null, restaurantReviews);
      }
    });
  }
}

