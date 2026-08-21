
import { CarRentalOffer } from '../types';

export const searchCarRentals = async (
    pickupLat: number,
    pickupLng: number,
    dropoffLat: number,
    dropoffLng: number,
    pickupDate: string,
    dropoffDate: string,
    pickupTime: string = '10:00',
    dropoffTime: string = '10:00',
    currency: string = 'USD'
): Promise<CarRentalOffer[]> => {
    const FALLBACK_CARS: CarRentalOffer[] = [
        {
            id: 'fallback_car_1',
            vehicleName: 'Mercedes-Benz S-Class',
            supplierName: 'Sixt',
            price: 450,
            currency: 'USD',
            imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1200',
            seats: 5,
            transmission: 'Automatic',
            baggage: 3
        },
        {
            id: 'fallback_car_2',
            vehicleName: 'Range Rover Sport',
            supplierName: 'Hertz',
            price: 380,
            currency: 'USD',
            imageUrl: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?q=80&w=1200',
            seats: 5,
            transmission: 'Automatic',
            baggage: 4
        }
    ];

    try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return FALLBACK_CARS;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const url = new URL('https://booking-com15.p.rapidapi.com/api/v1/cars/searchCarRentals');
        const params = new URLSearchParams({
            pick_up_latitude: pickupLat.toString(),
            pick_up_longitude: pickupLng.toString(),
            drop_off_latitude: dropoffLat.toString(),
            drop_off_longitude: dropoffLng.toString(),
            pick_up_date: pickupDate,
            drop_off_date: dropoffDate,
            pick_up_time: pickupTime,
            drop_off_time: dropoffTime,
            currency_code: currency,
            driver_age: '30',
        });

        url.search = params.toString();

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'booking-com15.p.rapidapi.com',
                'x-rapidapi-key': 'b5fa9474acmshb1e756dd3334ed3p1a73a1jsn637cd3197e46'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('API Failed');

        const data = await response.json();
        
        if (data.data && data.data.vehicles) {
             return data.data.vehicles.map((vehicle: any) => ({
                 id: vehicle.vehicle_id || `car_${Math.random().toString(36).substr(2, 9)}`,
                 vehicleName: vehicle.vehicle_info?.v_name || 'Unknown Vehicle',
                 supplierName: vehicle.supplier_info?.name || 'Local Supplier',
                 supplierLogo: vehicle.supplier_info?.logo_url,
                 price: vehicle.pricing_info?.price || 150,
                 currency: vehicle.pricing_info?.currency || currency,
                 imageUrl: vehicle.vehicle_info?.image_url,
                 seats: vehicle.vehicle_info?.seats || 4,
                 transmission: vehicle.vehicle_info?.transmission || 'Automatic',
                 baggage: vehicle.vehicle_info?.baggage || 2
             }));
        }
        return FALLBACK_CARS;
    } catch (error) {
        return FALLBACK_CARS;
    }
};
