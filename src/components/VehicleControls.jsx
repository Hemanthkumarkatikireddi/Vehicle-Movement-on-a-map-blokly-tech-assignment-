import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import carIcon from "../assests/car.png";

const RoutingApp = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const routeCoordsRef = useRef([]);
  const currentIndexRef = useRef(0);
  const intervalRef = useRef(null);
  const speedRef = useRef(100);
  const [isPaused, setIsPaused] = useState(false);
  // const [selectday, setSelectday] = useState();
  const routeControlRef = useRef(null);

  useEffect(() => {
    // ----------------------------------------------------------------------------------------------Adding Leaflet Predefined code for show map
    const map = L.map("map").setView(
      [18.108352926721096, 83.41449223715402],
      11
    );
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OSM",
    }).addTo(map);
    // -------------------------------------------------------------------------------------------------Markers Icon.
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    const icon = L.icon({
      iconUrl: carIcon,
      iconSize: [70, 90],
    });

    markerRef.current = L.marker([18.108352926721096, 83.41449223715402], {
      icon,
    }).addTo(map);

    map.on("click", (e) => {
      // 17.4524367002564, 78.39085728349782
      const destLat = e.latlng.lat;
      const destLng = e.latlng.lng;
      stopInterval();

      if (routeControlRef.current) {
        try {
          map.removeControl(routeControlRef.current);
        } catch (err) {}
        routeControlRef.current = null;
      }

      map.eachLayer((layer) => {
        if (layer instanceof L.Polyline && !(layer instanceof L.Marker)) {
          map.removeLayer(layer);
        }
      });

      const startLat = markerRef.current.getLatLng().lat;
      const startLng = markerRef.current.getLatLng().lng;

      routeControlRef.current = L.Routing.control({
        waypoints: [L.latLng(startLat, startLng), L.latLng(destLat, destLng)],
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
      })
        .on("routesfound", (ev) => {
          routeCoordsRef.current = ev.routes[0].coordinates || [];
          currentIndexRef.current = 0;

          if (!isPaused && routeCoordsRef.current.length) {
            startInterval();
          } else {
            if (routeCoordsRef.current.length) {
              const first = routeCoordsRef.current[0];
              markerRef.current.setLatLng([first.lat, first.lng]);
              map.panTo([first.lat, first.lng], { animate: true });
            }
          }
        })
        .addTo(map);
    });

    return () => {
      stopInterval();
      map.remove();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //
  //
  //
  // ------------------------------------------------------------------------------------------ Vehical Intervals
  //
  //
  //
  function stopInterval() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startInterval() {
    stopInterval();

    const route = routeCoordsRef.current;
    if (!route || !route.length) return;

    intervalRef.current = setInterval(() => {
      if (isPaused) {
        stopInterval();
        return;
      }

      const i = currentIndexRef.current;
      if (i >= route.length) {
        stopInterval();
        return;
      }

      const p = route[i];

      markerRef.current.setLatLng([p.lat, p.lng]);

      mapRef.current.panTo([p.lat, p.lng], { animate: true });

      currentIndexRef.current = i + 1;
    }, Math.max(5, Number(speedRef.current)));
  }
  //
  //
  //
  //---------------------------------------------------------------------------------------------Play & Pause Handles.
  //
  //
  //
  const handlePlay = (e) => {
    e?.preventDefault?.();
    if (!routeCoordsRef.current || !routeCoordsRef.current.length) {
      setIsPaused(true);
      return;
    }
    if (currentIndexRef.current >= routeCoordsRef.current.length) {
      setIsPaused(true);
      return;
    }

    setIsPaused(false);
    startInterval();
  };

  const handlePause = (e) => {
    e?.preventDefault?.();
    setIsPaused(true);
    stopInterval();
  };
  //
  //
  //
  // ----------------------------------------------------------------------------------------Vehical Speed Change.
  //
  //
  //
  const handleSpeedChange = (e) => {
    const value = Number(e.target.value);
    speedRef.current = value;
    if (!isPaused && routeCoordsRef.current.length) {
      startInterval();
    }
  };
  //
  //
  //
  // --------------------------------------------------------------------------------------------Day Change.
  //
  //
  //
  const handleDayChange = (e) => {
    const day = e.target.value;
    if (day === "today") {
      stopInterval();
      // --------------------------------for removing the old route
      if (routeControlRef.current) {
        try {
          mapRef.current.removeControl(routeControlRef.current);
        } catch (err) {}
        routeControlRef.current = null;
      }
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Polyline && !(layer instanceof L.Marker)) {
          mapRef.current.removeLayer(layer);
        }
      });
      // ------------------------------current position immediately
      const startPosition = [18.108352926721096, 83.41449223715402];
      markerRef.current.setLatLng(startPosition);
      mapRef.current.setView(startPosition, 11);
    }
    // --------------------------------yesterday treavelled route
    if (day === "yesterday") {
      // Vizianagaram to Hyderabad
      const startLat = 18.108352926721096;
      const startLng = 83.41449223715402;
      const destLat = 17.4524367002564;
      const destLng = 78.39085728349782;

      stopInterval();

      //-------------------------------Remove any old routes
      if (routeControlRef.current) {
        try {
          mapRef.current.removeControl(routeControlRef.current);
        } catch (err) {}
        routeControlRef.current = null;
      }

      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Polyline && !(layer instanceof L.Marker)) {
          mapRef.current.removeLayer(layer);
        }
      });

      // -----------------------------Create the yesterday route immediately
      routeControlRef.current = L.Routing.control({
        waypoints: [L.latLng(startLat, startLng), L.latLng(destLat, destLng)],
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,
      })
        .on("routesfound", (ev) => {
          routeCoordsRef.current = ev.routes[0].coordinates || [];
          currentIndexRef.current = 0;
          setIsPaused(false);
          startInterval();
        })
        .addTo(mapRef.current);
    }
  };
  //
  //
  //
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div id="map" style={{ width: "100%", height: "100%" }} />

      <div className="vehicleControls-container ">
        <p className="developer">Hemanth Kumar Travel Map</p>
        <div className="controls">
          <button type="button" onClick={handlePlay}>
            Play
          </button>

          <button type="button" onClick={handlePause}>
            Pause
          </button>
          {/* ------------------------------------------ select Day*/}
          <label>
            Select Day:
            <select onChange={handleDayChange}>
              <option value={"yesterday"}>Yesterday</option>
              <option value={"today"} selected>
                Today
              </option>
            </select>
          </label>
          {/* ----------------------------------------- select speed*/}
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            Speed:
            <select defaultValue={100} onChange={handleSpeedChange}>
              <option value={200}>Slow</option>
              <option value={100} selected>
                Normal
              </option>
              <option value={50}>Fast</option>
              <option value={10}>Very Fast</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};
// vizianagaram = 18.108352926721096, 83.41449223715402
// Hyderabad = 17.4524367002564, 78.39085728349782

export default RoutingApp;
