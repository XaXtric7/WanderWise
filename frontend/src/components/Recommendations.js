import React, { useState, useEffect } from "react";
import {
  FaHotel,
  FaUtensils,
  FaGasPump,
  FaShoppingBag,
  FaStore,
  FaInfoCircle,
} from "react-icons/fa";

const Recommendations = ({ userLocation }) => {
  const [selectedCategory, setSelectedCategory] = useState("hotels");
  const [searchRadius, setSearchRadius] = useState(5); // km
  const [isLoading, setIsLoading] = useState(false);
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyPlaces();
    }
  }, [userLocation, searchRadius, selectedCategory]);

  // Fetch nearby places from Google Maps
  const fetchNearbyPlaces = async () => {
    if (!userLocation) return;

    setIsLoading(true);

    try {
      // This would normally call the backend API
      // Since we're simplifying, we'll create mock data
      setTimeout(() => {
        const mockPlaces = generateMockPlaces(selectedCategory, 8);
        setPlaces(mockPlaces);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching places:", error);
      setPlaces([]);
      setIsLoading(false);
    }
  };

  // Generate mock places
  const generateMockPlaces = (category, count) => {
    const categoryData = {
      hotels: {
        names: [
          "Grand Hotel",
          "Comfort Inn",
          "Seaside Resort",
          "Mountain View Hotel",
          "City Center Lodge",
          "Sunset Hotel",
          "Riverside Inn",
          "Park Plaza",
        ],
        ratings: [4.7, 4.2, 4.8, 3.9, 4.5, 4.1, 3.8, 4.6],
        priceLevels: [3, 2, 4, 2, 3, 2, 1, 3],
        addresses: [
          "123 Main St",
          "456 Oak Ave",
          "789 Beach Rd",
          "321 Pine St",
          "555 Center Blvd",
          "888 Sunset Dr",
          "777 River Rd",
          "444 Park Ave",
        ],
      },
      restaurants: {
        names: [
          "Tasty Bites",
          "Ocean View Restaurant",
          "Mountain Grill",
          "City Bistro",
          "Sunset Cafe",
          "River House",
          "Park Diner",
          "Flavor Fusion",
        ],
        ratings: [4.5, 4.3, 4.6, 4.0, 4.2, 3.9, 4.1, 4.7],
        priceLevels: [2, 3, 2, 2, 1, 3, 1, 3],
        addresses: [
          "100 Food St",
          "200 Ocean Ave",
          "300 Mountain Rd",
          "400 City Blvd",
          "500 Sunset Dr",
          "600 River Rd",
          "700 Park Ave",
          "800 Fusion St",
        ],
      },
      gasStations: {
        names: [
          "Quick Gas",
          "Ocean Fuel",
          "Mountain Petrol",
          "City Gas",
          "Sunset Fuel",
          "River Gas",
          "Park Petrol",
          "Express Gas",
        ],
        ratings: [3.8, 4.0, 3.9, 3.7, 4.1, 3.6, 3.8, 4.2],
        priceLevels: [1, 2, 2, 1, 2, 1, 1, 2],
        addresses: [
          "150 Gas St",
          "250 Ocean Ave",
          "350 Mountain Rd",
          "450 City Blvd",
          "550 Sunset Dr",
          "650 River Rd",
          "750 Park Ave",
          "850 Express St",
        ],
      },
      shops: {
        names: [
          "City Market",
          "Ocean Shop",
          "Mountain Store",
          "Downtown Mall",
          "Sunset Shop",
          "River Market",
          "Park Store",
          "Express Shop",
        ],
        ratings: [4.2, 4.1, 4.3, 3.9, 4.0, 3.8, 4.1, 4.4],
        priceLevels: [2, 2, 3, 2, 1, 2, 2, 2],
        addresses: [
          "175 Market St",
          "275 Ocean Ave",
          "375 Mountain Rd",
          "475 City Blvd",
          "575 Sunset Dr",
          "675 River Rd",
          "775 Park Ave",
          "875 Express St",
        ],
      },
    };

    const data = categoryData[category];
    return Array.from({ length: count }, (_, i) => ({
      id: `place-${category}-${i}`,
      name: data.names[i % data.names.length],
      rating: data.ratings[i % data.ratings.length],
      user_ratings_total: Math.floor(Math.random() * 500) + 50,
      price_level: data.priceLevels[i % data.priceLevels.length],
      vicinity: data.addresses[i % data.addresses.length],
      geometry: {
        location: {
          lat: userLocation.lat + (Math.random() * 0.02 - 0.01),
          lng: userLocation.lng + (Math.random() * 0.02 - 0.01),
        },
      },
      opening_hours: {
        open_now: Math.random() > 0.3,
      },
      distance: Math.random() * (searchRadius * 0.8) + 0.2,
    }));
  };

  // Get icon based on category
  const getCategoryIcon = (category) => {
    switch (category) {
      case "hotels":
        return <FaHotel className="w-5 h-5" />;
      case "restaurants":
        return <FaUtensils className="w-5 h-5" />;
      case "gasStations":
        return <FaGasPump className="w-5 h-5" />;
      case "shops":
        return <FaShoppingBag className="w-5 h-5" />;
      default:
        return <FaStore className="w-5 h-5" />;
    }
  };

  // Format rating stars
  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`star-${i}`} className="text-yellow-500">
          ★
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half-star" className="text-yellow-500">
          ✮
        </span>
      );
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-star-${i}`} className="text-gray-300">
          ☆
        </span>
      );
    }

    return stars;
  };

  return (
    <div className="py-6">
      {!userLocation ? (
        <div className="flex flex-col items-center justify-center p-8 bg-yellow-50 rounded-lg border border-yellow-200">
          <FaInfoCircle className="text-yellow-500 text-3xl mb-4" />
          <h3 className="text-lg font-medium text-yellow-800">
            No Location Selected
          </h3>
          <p className="text-yellow-700 mt-2 text-center">
            Please use the Map tab to select a source location first.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Places near {userLocation.name || "your location"}
            </h2>

            <div className="flex flex-wrap gap-3 mb-4">
              <button
                className={`px-4 py-2 rounded-full flex items-center ${
                  selectedCategory === "hotels"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => setSelectedCategory("hotels")}
              >
                <FaHotel className="mr-2" /> Hotels
              </button>
              <button
                className={`px-4 py-2 rounded-full flex items-center ${
                  selectedCategory === "restaurants"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => setSelectedCategory("restaurants")}
              >
                <FaUtensils className="mr-2" /> Restaurants
              </button>
              <button
                className={`px-4 py-2 rounded-full flex items-center ${
                  selectedCategory === "gasStations"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => setSelectedCategory("gasStations")}
              >
                <FaGasPump className="mr-2" /> Gas Stations
              </button>
              <button
                className={`px-4 py-2 rounded-full flex items-center ${
                  selectedCategory === "shops"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
                onClick={() => setSelectedCategory("shops")}
              >
                <FaShoppingBag className="mr-2" /> Shops
              </button>
            </div>

            <div className="flex items-center mb-5">
              <label htmlFor="radius" className="mr-3 text-gray-700">
                Search radius:
              </label>
              <select
                id="radius"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
              >
                <option value={1}>1 km</option>
                <option value={3}>3 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>

            <div className="p-3 bg-blue-50 rounded-md mb-4 text-blue-800 text-sm">
              <p className="flex items-center">
                <FaInfoCircle className="mr-2" />
                Note: This is using simulated data for demonstration purposes.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <svg
                className="animate-spin h-8 w-8 text-teal-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : places.length === 0 ? (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-gray-700">
              No {selectedCategory} found within {searchRadius} km. Try
              increasing the search radius.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg mb-1">{place.name}</h3>
                      <span className="text-sm bg-teal-100 text-teal-800 px-2 py-1 rounded">
                        {place.distance.toFixed(1)} km
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      <div>{renderRatingStars(place.rating || 0)}</div>
                      <span className="ml-1 text-sm text-gray-600">
                        ({place.user_ratings_total || 0})
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {place.vicinity || place.formatted_address}
                    </p>

                    {place.opening_hours && (
                      <div className="text-sm text-gray-700 mb-3">
                        {place.opening_hours.open_now ? (
                          <span className="text-green-600 font-medium">
                            Open Now
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            Closed
                          </span>
                        )}
                      </div>
                    )}

                    {place.price_level && (
                      <div className="mb-3">
                        <span className="text-yellow-600 font-medium">
                          {"$".repeat(place.price_level)}
                          <span className="text-gray-300">
                            {"$".repeat(4 - place.price_level)}
                          </span>
                        </span>
                      </div>
                    )}

                    <button className="w-full mt-2 bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded transition-colors duration-200">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
