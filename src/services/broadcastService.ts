type FareUpdate = {
  type: 'FARE_QUOTE' | 'FARE_CONFIRMED' | 'FARE_RESET';
  fare?: number;
  currency?: string;
  destination?: string;
  ticketId?: string;
  timestamp: string;
};

class BroadcastService {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(data: FareUpdate) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('fare-updates');
      this.channel.onmessage = (event) => {
        this.listeners.forEach(listener => listener(event.data));
      };
    }
  }

  sendFareQuote(fare: number, currency: string, destination: string) {
    const data: FareUpdate = {
      type: 'FARE_QUOTE',
      fare,
      currency,
      destination,
      timestamp: new Date().toISOString(),
    };
    this.channel?.postMessage(data);
  }

  sendFareConfirmed(fare: number, currency: string, ticketId: string, destination: string) {
    const data: FareUpdate = {
      type: 'FARE_CONFIRMED',
      fare,
      currency,
      ticketId,
      destination,
      timestamp: new Date().toISOString(),
    };
    this.channel?.postMessage(data);
  }

  sendFareReset() {
    const data: FareUpdate = {
      type: 'FARE_RESET',
      timestamp: new Date().toISOString(),
    };
    this.channel?.postMessage(data);
  }

  onMessage(callback: (data: FareUpdate) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  close() {
    this.channel?.close();
    this.listeners = [];
  }
}

export const broadcastService = new BroadcastService();
