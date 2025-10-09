import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, DollarSign, Check, AlertCircle, Search } from 'lucide-react';
import {
  getDestinations,
  createFareQuote,
  confirmFare,
  getCurrentBusLocation,
  updateBusLocation,
  type Destination,
  type FareQuote,
  type Location,
} from '../services/fareService';
import { broadcastService } from '../services/broadcastService';

export default function DriverInterface() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [quote, setQuote] = useState<FareQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [ticketConfirmed, setTicketConfirmed] = useState(false);
  const [busId] = useState('BUS_001');

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      loadDestinations();
    }
  }, [currentLocation]);

  const loadCurrentLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCurrentLocation(location);
            await updateBusLocation(busId, location, position.coords.speed || 0);
          },
          async (error) => {
            console.error('Error getting location:', error);
            const fallbackLocation = await getCurrentBusLocation(busId);
            if (fallbackLocation) {
              setCurrentLocation(fallbackLocation);
            } else {
              setCurrentLocation({ lat: -25.2808, lng: -57.6312 });
            }
          }
        );
      } else {
        const fallbackLocation = await getCurrentBusLocation(busId);
        if (fallbackLocation) {
          setCurrentLocation(fallbackLocation);
        } else {
          setCurrentLocation({ lat: -25.2808, lng: -57.6312 });
        }
      }
    } catch (err) {
      console.error('Error loading location:', err);
      setCurrentLocation({ lat: -25.2808, lng: -57.6312 });
    }
  };

  const loadDestinations = async () => {
    try {
      setLoading(true);
      const dests = await getDestinations(currentLocation || undefined);
      setDestinations(dests);
    } catch (err) {
      setError('Error al cargar destinos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationSelect = async (destination: Destination) => {
    if (!currentLocation) {
      setError('No se pudo obtener la ubicación actual');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSelectedDestination(destination);
      setTicketConfirmed(false);

      const fareQuote = await createFareQuote(currentLocation, destination.id, busId);
      setQuote(fareQuote);

      broadcastService.sendFareQuote(
        fareQuote.fare,
        fareQuote.currency,
        destination.name
      );
    } catch (err) {
      setError('Error al calcular tarifa');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmFare = async () => {
    if (!quote || !selectedDestination) return;

    try {
      setConfirming(true);
      setError(null);

      const ticket = await confirmFare(quote.id, busId);

      broadcastService.sendFareConfirmed(
        ticket.fare,
        ticket.currency,
        ticket.ticketId,
        selectedDestination.name
      );

      setTicketConfirmed(true);

      setTimeout(() => {
        handleReset();
      }, 5000);
    } catch (err) {
      setError('Error al confirmar tarifa');
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setSelectedDestination(null);
    setQuote(null);
    setTicketConfirmed(false);
    setSearchTerm('');
    broadcastService.sendFareReset();
  };

  const filteredDestinations = destinations.filter(dest =>
    dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dest.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dest.zone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const frequentDestinations = destinations.slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Navigation className="w-7 h-7" />
              Sistema de Tarifas - Chofer
            </h1>
            <p className="text-blue-100 mt-1">Bus: {busId}</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h2 className="font-semibold text-slate-800">Ubicación Actual</h2>
                  </div>
                  {currentLocation ? (
                    <div className="text-sm text-slate-600">
                      <p>Lat: {currentLocation.lat.toFixed(6)}</p>
                      <p>Lng: {currentLocation.lng.toFixed(6)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Obteniendo ubicación...</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Buscar Destino
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre, dirección o zona..."
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-700 mb-2">Destinos Frecuentes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {frequentDestinations.map((dest) => (
                      <button
                        key={dest.id}
                        onClick={() => handleDestinationSelect(dest)}
                        disabled={loading}
                        className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors disabled:opacity-50"
                      >
                        <p className="font-medium text-blue-900 text-sm">{dest.name}</p>
                        {dest.zone && (
                          <p className="text-xs text-blue-600 mt-1">{dest.zone}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2">
                  <h3 className="font-medium text-slate-700 mb-2">Todos los Destinos</h3>
                  {filteredDestinations.map((dest) => (
                    <button
                      key={dest.id}
                      onClick={() => handleDestinationSelect(dest)}
                      disabled={loading}
                      className={`w-full p-4 rounded-lg text-left transition-all ${
                        selectedDestination?.id === dest.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-white border border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{dest.name}</p>
                          {dest.address && (
                            <p className="text-sm text-slate-500 mt-1">{dest.address}</p>
                          )}
                          {dest.zone && (
                            <span className="inline-block mt-2 px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                              {dest.zone}
                            </span>
                          )}
                        </div>
                        <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {quote && selectedDestination ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-green-900">Tarifa Calculada</h2>
                      {ticketConfirmed && (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                          <Check className="w-5 h-5" />
                          Confirmado
                        </span>
                      )}
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">Destino:</span>
                      </div>
                      <p className="text-lg text-green-800 ml-7">{selectedDestination.name}</p>
                    </div>

                    <div className="bg-white rounded-lg p-6 mb-6">
                      <div className="flex items-baseline justify-center gap-2 mb-4">
                        <DollarSign className="w-8 h-8 text-green-600" />
                        <span className="text-5xl font-bold text-green-900">
                          {quote.fare.toLocaleString()}
                        </span>
                        <span className="text-2xl text-green-700">{quote.currency}</span>
                      </div>

                      <div className="border-t border-slate-200 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Tarifa base:</span>
                          <span className="font-medium text-slate-800">
                            {quote.breakdown.base.toLocaleString()} {quote.currency}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Distancia:</span>
                          <span className="font-medium text-slate-800">
                            {quote.breakdown.distance_km} km
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Por km:</span>
                          <span className="font-medium text-slate-800">
                            {quote.breakdown.per_km.toLocaleString()} {quote.currency}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Subtotal distancia:</span>
                          <span className="font-medium text-slate-800">
                            {(quote.breakdown.per_km * quote.breakdown.distance_km).toLocaleString()} {quote.currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    {quote.eta_minutes && (
                      <div className="flex items-center gap-2 mb-6 text-green-800">
                        <Clock className="w-5 h-5" />
                        <span>Tiempo estimado: <strong>{quote.eta_minutes} min</strong></span>
                      </div>
                    )}

                    {!ticketConfirmed ? (
                      <div className="flex gap-3">
                        <button
                          onClick={handleConfirmFare}
                          disabled={confirming}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Check className="w-6 h-6" />
                          {confirming ? 'Confirmando...' : 'Confirmar y Cobrar'}
                        </button>
                        <button
                          onClick={handleReset}
                          disabled={confirming}
                          className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 rounded-lg">
                          <Check className="w-6 h-6 text-green-600" />
                          <span className="text-green-800 font-medium">
                            Ticket confirmado. Redirigiendo...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                      Selecciona un destino
                    </h3>
                    <p className="text-slate-500">
                      Elige un destino de la lista para calcular la tarifa
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
