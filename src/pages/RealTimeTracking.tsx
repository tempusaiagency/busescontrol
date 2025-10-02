import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Bus {
  id: string;
  license_plate: string;
  driver_name: string;
  route: string;
  status: 'active' | 'maintenance' | 'inactive';
}

interface BusLocation {
  id: string;
  bus_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
}

const RealTimeTracking: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [locations, setLocations] = useState<BusLocation[]>([]);
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    loadBuses();
    loadLocations();

    const interval = setInterval(loadLocations, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => {
      setMapLoaded(true);
      initMap();
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (mapLoaded && locations.length > 0) {
      updateMapMarkers();
    }
  }, [locations, mapLoaded]);

  const loadBuses = async () => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .order('license_plate');

      if (error) throw error;
      setBuses(data || []);
    } catch (error) {
      console.error('Error loading buses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('bus_locations')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const latestLocations = data?.reduce((acc: BusLocation[], loc) => {
        if (!acc.find(l => l.bus_id === loc.bus_id)) {
          acc.push(loc);
        }
        return acc;
      }, []) || [];

      setLocations(latestLocations);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const initMap = () => {
    const mapElement = document.getElementById('map');
    if (!mapElement || !(window as any).google) return;

    const map = new (window as any).google.maps.Map(mapElement, {
      center: { lat: -25.2637, lng: -57.5759 },
      zoom: 12,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    (window as any).busMap = map;
    (window as any).busMarkers = {};
  };

  const updateMapMarkers = () => {
    if (!(window as any).busMap || !(window as any).google) return;

    const map = (window as any).busMap;
    const markers = (window as any).busMarkers;

    locations.forEach(location => {
      const bus = buses.find(b => b.id === location.bus_id);
      if (!bus) return;

      const position = { lat: location.latitude, lng: location.longitude };

      if (markers[location.bus_id]) {
        markers[location.bus_id].setPosition(position);
      } else {
        const marker = new (window as any).google.maps.Marker({
          position,
          map,
          title: bus.license_plate,
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: bus.status === 'active' ? '#10B981' : '#6B7280',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2
          }
        });

        const infoWindow = new (window as any).google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${bus.license_plate}</h3>
              <p style="margin: 2px 0;">Conductor: ${bus.driver_name}</p>
              <p style="margin: 2px 0;">Ruta: ${bus.route}</p>
              <p style="margin: 2px 0;">Velocidad: ${location.speed} km/h</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
          setSelectedBus(location.bus_id);
        });

        markers[location.bus_id] = marker;
      }
    });
  };

  const getBusLocation = (busId: string) => {
    return locations.find(loc => loc.bus_id === busId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'maintenance':
        return 'Mantenimiento';
      case 'inactive':
        return 'Inactivo';
      default:
        return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Cargando rastreo en tiempo real...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Rastreo en Tiempo Real</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Activity className="h-5 w-5 text-green-500 animate-pulse" />
          Actualizando cada 5 segundos
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div
              id="map"
              className="w-full h-[600px] bg-gray-100"
              style={{ minHeight: '600px' }}
            >
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Cargando mapa...</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Buses Activos</h2>
            <div className="space-y-3">
              {buses.filter(b => b.status === 'active').map(bus => {
                const location = getBusLocation(bus.id);
                const isSelected = selectedBus === bus.id;

                return (
                  <div
                    key={bus.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      setSelectedBus(bus.id);
                      if (location && (window as any).busMap) {
                        const map = (window as any).busMap;
                        map.setCenter({ lat: location.latitude, lng: location.longitude });
                        map.setZoom(15);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                          <p className="font-semibold text-gray-900">{bus.license_plate}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{bus.driver_name}</p>
                        <p className="text-xs text-gray-500">{bus.route}</p>
                        {location && (
                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Navigation className="h-3 w-3" />
                              {location.speed} km/h
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(location.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Otros Buses</h2>
            <div className="space-y-2">
              {buses.filter(b => b.status !== 'active').map(bus => (
                <div key={bus.id} className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{bus.license_plate}</p>
                      <p className="text-xs text-gray-500">{bus.driver_name}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bus.status)}`}>
                      {getStatusText(bus.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeTracking;
