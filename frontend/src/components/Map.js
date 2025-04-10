import React, { useState, useRef, useCallback } from "react";
import {
  FaLocationArrow,
  FaTimes,
  FaCar,
  FaTree,
  FaMoneyBillWave,
  FaInfoCircle,
  FaPlane,
  FaWalking,
  FaTrain,
} from "react-icons/fa";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  InfoWindow,
  Polyline,
} from "@react-google-maps/api";

import { routesService } from "../services/api";

// Map container style
const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 160px)",
};

// Default center position (San Francisco)
const defaultCenter = { lat: 37.7749, lng: -122.4194 };

// Map options
const mapOptions = {
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

// Algorithm path colors
const algorithmColors = {
  "a-star": "#4285F4", // Blue for A*
  "dijkstra": "#FF0000", // Red for Dijkstra
  "bfs": "#00FF00", // Green for BFS
  "dfs": "#FFA500", // Orange for DFS
};

// Transport mode speeds in km/h
const transportSpeeds = {
  "driving": 50,
  "flying": 800,
  "walking": 5,
  "transit": 35,
};

const Map = ({ onRouteCalculated }) => {
  // References
  const sourceRef = useRef(null);
  const destinationRef = useRef(null);
  const mapRef = useRef(null);

  // State
  const [map, setMap] = useState(null);
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);
  const [airports, setAirports] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [flightPath, setFlightPath] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [routePreferences, setRoutePreferences] = useState({
    avoidTolls: false,
    avoidHighways: false,
    mode: "driving",
  });
  const [algorithm, setAlgorithm] = useState("a-star");
  const [transportMode, setTransportMode] = useState("driving");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [showAlgorithmInfo, setShowAlgorithmInfo] = useState(false);

  // Callback when map loads
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMap(map);
  }, []);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Find nearby airports
  const findNearbyAirports = async (location) => {
    try {
      // In a real app, we'd use a Places API call
      // For demonstration, we'll simulate finding airports
      
      // Generate a fake airport nearby (within ~10-20km)
      const airportOffset = () => (Math.random() * 0.2) - 0.1; // Random offset of ~10km
      
      const airportLat = location.lat + airportOffset();
      const airportLng = location.lng + airportOffset();
      
      // Generate an IATA code
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = () => alphabet[Math.floor(Math.random() * alphabet.length)];
      const iataCode = randomLetter() + randomLetter() + randomLetter();
      
      return {
        position: { lat: airportLat, lng: airportLng },
        name: `${iataCode} International Airport`,
        iata: iataCode
      };
    } catch (error) {
      console.error("Error finding airports:", error);
      return null;
    }
  };

  // Calculate route using Google Directions Service
  const calculateRoute = async () => {
    if (!sourceRef.current.value || !destinationRef.current.value) {
      showToast("Please enter both source and destination", "error");
      return;
    }

    setIsLoading(true);
    setAirports(null);
    setFlightPath(null);

    try {
      // Get the places from autocomplete
      const sourcePlace = sourceRef.current.value;
      const destPlace = destinationRef.current.value;

      // First, use Google's Geocoding to get coordinates
      // eslint-disable-next-line no-undef
      const geocoder = new google.maps.Geocoder();
      
      // Get source coordinates
      const sourceGeocode = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: sourcePlace }, (results, status) => {
          // eslint-disable-next-line no-undef
          if (status === google.maps.GeocoderStatus.OK) {
            resolve(results[0]);
          } else {
            reject(new Error(`Geocoding failed for ${sourcePlace}`));
          }
        });
      });
      
      // Get destination coordinates
      const destGeocode = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: destPlace }, (results, status) => {
          // eslint-disable-next-line no-undef
          if (status === google.maps.GeocoderStatus.OK) {
            resolve(results[0]);
          } else {
            reject(new Error(`Geocoding failed for ${destPlace}`));
          }
        });
      });

      const sourceCoords = {
        lat: sourceGeocode.geometry.location.lat(),
        lng: sourceGeocode.geometry.location.lng(),
      };

      const destCoords = {
        lat: destGeocode.geometry.location.lat(),
        lng: destGeocode.geometry.location.lng(),
      };

      // Set markers for source and destination (except for flights)
      setStartMarker(sourceCoords);
      setEndMarker(destCoords);

      // Center the map to show both points
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(sourceCoords);
      bounds.extend(destCoords);
      map.fitBounds(bounds);

      // Now, use our backend API for route calculation using selected algorithm
      const source = {
        name: sourcePlace,
        lat: sourceCoords.lat,
        lng: sourceCoords.lng,
      };

      const destination = {
        name: destPlace,
        lat: destCoords.lat,
        lng: destCoords.lng,
      };

      // Call our API to calculate path using the selected algorithm
      await routesService.calculateRoute(
        source,
        destination,
        algorithm
      );

      // Calculate appropriate distance and time based on transport mode
      let distanceValue, durationValue, directionsResult;
      
      if (transportMode === "flying") {
        // For flights, calculate direct distance and find airports
        const directDistance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(sourceCoords),
          new google.maps.LatLng(destCoords)
        );
        distanceValue = directDistance;
        durationValue = (directDistance / 1000) / transportSpeeds.flying * 3600;
        
        // Find nearby airports
        const sourceAirport = await findNearbyAirports(sourceCoords);
        const destAirport = await findNearbyAirports(destCoords);
        
        // Set airport markers
        if (sourceAirport && destAirport) {
          setAirports({
            source: sourceAirport,
            destination: destAirport
          });
          
          // Create flight path
          setFlightPath([
            sourceCoords,
            sourceAirport.position, // From source to airport
            destAirport.position,   // From airport to airport (flight)
            destCoords              // From airport to destination
          ]);
          
          // Get directions to and from airports
          const directionsService = new google.maps.DirectionsService();
          
          // Source to source airport
          const toAirportDirections = await directionsService.route({
            origin: sourceCoords,
            destination: sourceAirport.position,
            // eslint-disable-next-line no-undef
            travelMode: google.maps.TravelMode.DRIVING,
          });
          
          // Destination airport to destination
          const fromAirportDirections = await directionsService.route({
            origin: destAirport.position,
            destination: destCoords,
            // eslint-disable-next-line no-undef
            travelMode: google.maps.TravelMode.DRIVING,
          });
          
          // Add these distances to total
          const toAirportDistance = toAirportDirections.routes[0].legs[0].distance.value;
          const fromAirportDistance = fromAirportDirections.routes[0].legs[0].distance.value;
          
          // Update total distance to include travel to/from airports
          distanceValue += toAirportDistance + fromAirportDistance;
          
          // Update duration to include travel to/from airports
          const toAirportDuration = toAirportDirections.routes[0].legs[0].duration.value;
          const fromAirportDuration = fromAirportDirections.routes[0].legs[0].duration.value;
          durationValue += toAirportDuration + fromAirportDuration;
          
          // Plus 2 hours for airport procedures
          durationValue += 2 * 60 * 60; // 2 hours in seconds
        }
        
        // Clear any existing directions
        setDirectionsResponse(null);
      } else {
        // For other modes, get directions from Google
        const directionsService = new google.maps.DirectionsService();
        directionsResult = await directionsService.route({
          origin: sourceCoords,
          destination: destCoords,
          // eslint-disable-next-line no-undef
          travelMode: google.maps.TravelMode[transportMode.toUpperCase()],
          avoidTolls: routePreferences.avoidTolls,
          avoidHighways: routePreferences.avoidHighways,
        });
        
        distanceValue = directionsResult.routes[0].legs[0].distance.value;
        durationValue = directionsResult.routes[0].legs[0].duration.value;
        
        // Set directions with custom styling for algorithms
        const rendererOptions = {
          directions: directionsResult,
          options: {
            polylineOptions: {
              strokeColor: algorithmColors[algorithm],
              strokeWeight: 6,
              strokeOpacity: 0.8
            },
            suppressMarkers: true // Suppress default markers since we're using custom ones
          }
        };
        
        setDirectionsResponse(rendererOptions);
        setFlightPath(null);
        setAirports(null);
      }

      // Format distance
      let distanceText;
      if (distanceValue < 1000) {
        distanceText = `${Math.round(distanceValue)} m`;
      } else {
        distanceText = `${(distanceValue / 1000).toFixed(2)} km`;
      }

      // Format duration
      let durationText;
      if (durationValue < 60) {
        durationText = `${Math.round(durationValue)} sec`;
      } else if (durationValue < 3600) {
        durationText = `${Math.floor(durationValue / 60)} min`;
      } else {
        const hours = Math.floor(durationValue / 3600);
        const minutes = Math.floor((durationValue % 3600) / 60);
        durationText = `${hours} hr ${minutes} min`;
      }

      setDistance(distanceText);
      setDuration(durationText);

      // Notify parent component about the calculated route
      if (onRouteCalculated) {
        onRouteCalculated(source, destination, {
          source,
          destination,
          distance: distanceValue,
          duration: durationValue,
        });
      }

      // Show success message
      let algorithmName;
      switch (algorithm) {
        case "dijkstra":
          algorithmName = "Dijkstra's";
          break;
        case "bfs":
          algorithmName = "BFS";
          break;
        case "dfs":
          algorithmName = "DFS";
          break;
        default:
          algorithmName = "A*";
      }

      showToast(`Route calculated using ${algorithmName} algorithm`);
    } catch (error) {
      console.error("Error calculating route:", error);
      showToast(error.message || "Error calculating route", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear route
  const clearRoute = () => {
    setStartMarker(null);
    setEndMarker(null);
    setDirectionsResponse(null);
    setFlightPath(null);
    setAirports(null);
    setDistance("");
    setDuration("");
    sourceRef.current.value = "";
    destinationRef.current.value = "";
  };

  // Center map on current position
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.panTo(pos);
          map.setZoom(14);
        },
        () => {
          showToast("Error: Geolocation permission denied", "error");
        }
      );
    } else {
      showToast("Error: Your browser doesn't support geolocation", "error");
    }
  };

  // Handle route preference changes
  const handlePreferenceChange = (e) => {
    const { name, value, checked, type } = e.target;

    setRoutePreferences((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle algorithm change
  const handleAlgorithmChange = (e) => {
    setAlgorithm(e.target.value);
    
    // Update route color if directions exist
    if (directionsResponse) {
      setDirectionsResponse({
        ...directionsResponse,
        options: {
          ...directionsResponse.options,
          polylineOptions: {
            ...directionsResponse.options.polylineOptions,
            strokeColor: algorithmColors[e.target.value]
          }
        }
      });
    }
  };

  // Handle transport mode change
  const handleTransportModeChange = (mode) => {
    setTransportMode(mode);
    if (mode !== "flying") {
      setAirports(null);
      setFlightPath(null);
    }
  };

  // Toggle algorithm info
  const toggleAlgorithmInfo = () => {
    setShowAlgorithmInfo(!showAlgorithmInfo);
  };

  // Get icon for transport mode button
  const getTransportIcon = (mode) => {
    switch (mode) {
      case "flying":
        return <FaPlane />;
      case "walking":
        return <FaWalking />;
      case "transit":
        return <FaTrain />;
      default:
        return <FaCar />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Main map container */}
      <div className="relative w-full h-full">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={10}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {directionsResponse && (
            <DirectionsRenderer 
              directions={directionsResponse.directions}
              options={directionsResponse.options}
            />
          )}

          {/* Flight path visualization with arcs */}
          {flightPath && (
            <>
              {/* Source to departure airport path */}
              <Polyline
                path={[flightPath[0], flightPath[1]]}
                options={{
                  strokeColor: "#808080", // Gray for ground transport
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                }}
              />
              
              {/* Air route with arc */}
              <Polyline
                path={[flightPath[1], flightPath[2]]}
                options={{
                  strokeColor: algorithmColors[algorithm],
                  strokeOpacity: 0.8,
                  strokeWeight: 5,
                  geodesic: true, // Creates an arc for flight path
                  icons: [{
                    icon: {
                      path: 'M 0,-1 0,1',
                      strokeOpacity: 1,
                      scale: 4
                    },
                    offset: '0',
                    repeat: '20px'
                  }]
                }}
              />
              
              {/* Arrival airport to destination path */}
              <Polyline
                path={[flightPath[2], flightPath[3]]}
                options={{
                  strokeColor: "#808080", // Gray for ground transport
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                }}
              />
            </>
          )}

          {startMarker && (
            <Marker
              position={startMarker}
              label="A"
            />
          )}

          {endMarker && (
            <Marker
              position={endMarker}
              label="B"
            />
          )}

          {/* Airport markers */}
          {airports && (
            <>
              <Marker
                position={airports.source.position}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  scaledSize: new google.maps.Size(32, 32)
                }}
                onClick={() => setSelectedMarker({
                  position: airports.source.position,
                  title: airports.source.name,
                  description: `Airport code: ${airports.source.iata}`
                })}
              />
              <Marker
                position={airports.destination.position}
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                  scaledSize: new google.maps.Size(32, 32)
                }}
                onClick={() => setSelectedMarker({
                  position: airports.destination.position,
                  title: airports.destination.name,
                  description: `Airport code: ${airports.destination.iata}`
                })}
              />
            </>
          )}

          {selectedMarker && (
            <InfoWindow
              position={selectedMarker.position}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div>
                <h3 className="font-bold text-gray-900">
                  {selectedMarker.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedMarker.description}
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Controls container */}
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md w-72">
          <div className="space-y-3">
            <div>
              <Autocomplete>
                <input
                  ref={sourceRef}
                  type="text"
                  placeholder="Origin"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                />
              </Autocomplete>
            </div>
            <div>
              <Autocomplete>
                <input
                  ref={destinationRef}
                  type="text"
                  placeholder="Destination"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                />
              </Autocomplete>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <div className="mr-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    name="avoidTolls"
                    checked={routePreferences.avoidTolls}
                    onChange={handlePreferenceChange}
                    className="rounded text-teal-500 focus:ring-teal-500"
                  />
                  <span className="flex items-center">
                    <FaMoneyBillWave className="text-teal-500 mr-1" /> No Tolls
                  </span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    name="avoidHighways"
                    checked={routePreferences.avoidHighways}
                    onChange={handlePreferenceChange}
                    className="rounded text-teal-500 focus:ring-teal-500"
                  />
                  <span className="flex items-center">
                    <FaTree className="text-teal-500 mr-1" /> Scenic
                  </span>
                </label>
              </div>
            </div>

            {/* Transport Mode Selection */}
            <div className="flex justify-between">
              <button
                onClick={() => handleTransportModeChange("driving")}
                className={`p-2 rounded-full ${
                  transportMode === "driving"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                title="Car"
              >
                <FaCar />
              </button>
              <button
                onClick={() => handleTransportModeChange("flying")}
                className={`p-2 rounded-full ${
                  transportMode === "flying"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                title="Flight"
              >
                <FaPlane />
              </button>
              <button
                onClick={() => handleTransportModeChange("walking")}
                className={`p-2 rounded-full ${
                  transportMode === "walking"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                title="Walking"
              >
                <FaWalking />
              </button>
              <button
                onClick={() => handleTransportModeChange("transit")}
                className={`p-2 rounded-full ${
                  transportMode === "transit"
                    ? "bg-teal-500 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
                title="Train/Transit"
              >
                <FaTrain />
              </button>
            </div>

            <div className="flex items-center">
              <select
                value={algorithm}
                onChange={handleAlgorithmChange}
                className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-teal-500"
              >
                <option value="dijkstra">Dijkstra's Algorithm</option>
                <option value="a-star">A* Algorithm</option>
                <option value="bfs">BFS Algorithm</option>
                <option value="dfs">DFS Algorithm</option>
              </select>
              <button
                onClick={toggleAlgorithmInfo}
                className="ml-2 text-gray-500 hover:text-teal-500"
                title="Algorithm Information"
              >
                <FaInfoCircle />
              </button>
            </div>

            {showAlgorithmInfo && (
              <div className="text-xs p-2 bg-blue-50 rounded text-blue-800">
                <p>
                  <b>Dijkstra</b>: Explores all directions equally.
                </p>
                <p>
                  <b>A*</b>: Uses heuristics to prioritize promising paths.
                </p>
                <p>
                  <b>BFS</b>: Explores nearest neighbors first.
                </p>
                <p>
                  <b>DFS</b>: Explores as far as possible before backtracking.
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={calculateRoute}
                className="flex-1 p-2 bg-teal-500 text-white font-medium rounded hover:bg-teal-600 transition-colors flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-block animate-spin mr-2">⟳</span>
                ) : (
                  getTransportIcon(transportMode)
                )}
                <span className="ml-1">Calculate</span>
              </button>
              <button
                onClick={clearRoute}
                className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                <FaTimes />
              </button>
              <button
                onClick={getCurrentLocation}
                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                <FaLocationArrow />
              </button>
            </div>

            {distance && duration && (
              <div className="text-sm p-2 bg-gray-50 rounded">
                <div className="flex items-center mb-1">
                  <span className="font-medium">Distance:</span>
                  <span className="ml-1">{distance}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Duration:</span>
                  <span className="ml-1">{duration}</span>
                </div>
                {transportMode === "flying" && (
                  <div className="flex items-center mt-1 text-xs text-gray-600">
                    <span>Includes airport transfer and 2hr check-in time</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toast notification */}
        {toast.show && (
          <div
            className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg 
              ${
                toast.type === "error"
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white"
              }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
