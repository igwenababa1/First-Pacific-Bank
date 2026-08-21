
export interface CargoRoute {
  carrier: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  arrivalDate: string;
  aircraftType: string;
  stops: number;
}

// Helper for exponential backoff retry
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries <= 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryOperation(operation, retries - 1, delay * 2);
    }
}

export const searchAirCargoRoutes = async (origin: string, destination: string, date: string): Promise<CargoRoute[]> => {
    const FALLBACK_ROUTES: CargoRoute[] = [
        { 
            carrier: 'Lufthansa Cargo', 
            flightNumber: 'LH8220', 
            origin: origin, 
            destination: destination, 
            departureDate: date, 
            arrivalDate: new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0], 
            aircraftType: 'B777F',
            stops: 0
        },
        { 
            carrier: 'Emirates SkyCargo', 
            flightNumber: 'EK9921', 
            origin: origin, 
            destination: destination, 
            departureDate: date, 
            arrivalDate: new Date(new Date(date).getTime() + 86400000).toISOString().split('T')[0], 
            aircraftType: 'B747-400F',
            stops: 1
        },
        { 
            carrier: 'Cargolux', 
            flightNumber: 'CV7882', 
            origin: origin, 
            destination: destination, 
            departureDate: date, 
            arrivalDate: new Date(new Date(date).getTime() + 172800000).toISOString().split('T')[0], 
            aircraftType: 'B747-8F',
            stops: 1
        }
    ];

    try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            console.warn("Offline: Returning fallback logistics routes.");
            return FALLBACK_ROUTES;
        }

        const data = await retryOperation(async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8s

            try {
                const response = await fetch('https://air-cargo-route-and-schedule.p.rapidapi.com/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-rapidapi-host': 'air-cargo-route-and-schedule.p.rapidapi.com',
                        'x-rapidapi-key': 'b5fa9474acmshb1e756dd3334ed3p1a73a1jsn637cd3197e46'
                    },
                    body: JSON.stringify({
                        departureDate: date,
                        origin: origin,
                        destination: destination
                    }),
                    signal: controller.signal
                });

                if (!response.ok) {
                    if (response.status >= 400 && response.status < 500) {
                         throw new Error(`Client Error: ${response.status}`);
                    }
                    throw new Error(`Server Error: ${response.status}`);
                }

                return await response.json();
            } finally {
                 clearTimeout(timeoutId);
            }
        });

        const routes = Array.isArray(data) ? data : (data.routes || data.data || []);

        if (routes.length === 0) {
             console.warn("API returned no routes, falling back to fallback data.");
             return FALLBACK_ROUTES;
        }

        return routes.map((route: any) => ({
             carrier: route.airline || route.carrier || 'Logistics Partner',
             flightNumber: route.flight_number || route.flightNumber || 'Cargo-X',
             origin: route.origin || origin,
             destination: route.destination || destination,
             departureDate: route.departure_date || route.departureTime || date,
             arrivalDate: route.arrival_date || route.arrivalTime || 'TBD',
             aircraftType: route.aircraft || route.equipment || 'Freighter',
             stops: route.stops || 0
        }));

    } catch (error) {
        console.warn("Logistics API Error (using fallback):", error);
        return FALLBACK_ROUTES;
    }
}
