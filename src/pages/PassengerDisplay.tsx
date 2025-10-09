import React, { useState, useEffect } from 'react';
import { DollarSign, Check, MapPin } from 'lucide-react';
import { broadcastService } from '../services/broadcastService';

type DisplayState = {
  fare: number | null;
  currency: string;
  destination: string;
  status: 'idle' | 'quote' | 'confirmed';
  ticketId?: string;
};

export default function PassengerDisplay() {
  const [state, setState] = useState<DisplayState>({
    fare: null,
    currency: 'PYG',
    destination: '',
    status: 'idle',
  });

  useEffect(() => {
    const unsubscribe = broadcastService.onMessage((data) => {
      switch (data.type) {
        case 'FARE_QUOTE':
          setState({
            fare: data.fare || null,
            currency: data.currency || 'PYG',
            destination: data.destination || '',
            status: 'quote',
          });
          break;
        case 'FARE_CONFIRMED':
          setState({
            fare: data.fare || null,
            currency: data.currency || 'PYG',
            destination: data.destination || '',
            status: 'confirmed',
            ticketId: data.ticketId,
          });
          break;
        case 'FARE_RESET':
          setState({
            fare: null,
            currency: 'PYG',
            destination: '',
            status: 'idle',
          });
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (state.status === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-32 h-32 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <DollarSign className="w-16 h-16 text-slate-500" />
          </div>
          <h1 className="text-4xl font-bold text-slate-300 mb-4">
            Esperando Cálculo de Tarifa
          </h1>
          <p className="text-2xl text-slate-400">
            El chofer está procesando su solicitud...
          </p>
        </div>
      </div>
    );
  }

  if (state.status === 'confirmed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-12">
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <Check className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            Pago Confirmado
          </h1>
          {state.ticketId && (
            <p className="text-3xl text-green-200 mb-8">
              Ticket: {state.ticketId}
            </p>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border-4 border-white/30 max-w-3xl w-full">
          {state.destination && (
            <div className="mb-8 flex items-center justify-center gap-4">
              <MapPin className="w-10 h-10 text-white" />
              <p className="text-3xl text-white font-medium">
                {state.destination}
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-4xl text-green-200 mb-4">Monto Pagado</p>
            <div className="flex items-baseline justify-center gap-4">
              <DollarSign className="w-16 h-16 text-white" />
              <span className="text-9xl font-bold text-white tracking-tight">
                {state.fare?.toLocaleString()}
              </span>
              <span className="text-5xl text-green-200 font-semibold">
                {state.currency}
              </span>
            </div>
          </div>
        </div>

        <p className="text-3xl text-green-200 mt-12 animate-pulse">
          Gracias por su viaje
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">
          Monto a Abonar
        </h1>
        {state.destination && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <MapPin className="w-8 h-8 text-blue-200" />
            <p className="text-3xl text-blue-200">
              {state.destination}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-16 border-4 border-white/30 max-w-4xl w-full">
        <div className="flex items-baseline justify-center gap-6">
          <DollarSign className="w-20 h-20 text-white" />
          <span className="text-[12rem] font-bold text-white tracking-tight leading-none">
            {state.fare?.toLocaleString()}
          </span>
          <span className="text-6xl text-blue-200 font-semibold">
            {state.currency}
          </span>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-3xl text-blue-200 animate-pulse">
          Esperando confirmación del chofer...
        </p>
      </div>
    </div>
  );
}
