
interface HealthcareProvider {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  type: string;
  distance?: string;
}

class HealthcareProviderService {
  private readonly API_URL = "https://nominatim.openstreetmap.org/search";
  
  async findNearbyProviders(address: string): Promise<HealthcareProvider[]> {
    try {
      console.log("Searching for providers near:", address);
      
      // First geocode the address to get coordinates
      const geocodedLocation = await this.geocodeAddress(address);
      if (!geocodedLocation) {
        console.error("Could not geocode address:", address);
        throw new Error("Unable to find location. Please check the address provided.");
      }
      
      // Then search for healthcare facilities near these coordinates
      return await this.searchHealthcareFacilities(geocodedLocation.lat, geocodedLocation.lon);
    } catch (error) {
      console.error("Error finding nearby providers:", error);
      throw error;
    }
  }
  
  private async geocodeAddress(address: string): Promise<{ lat: string; lon: string } | null> {
    try {
      const params = new URLSearchParams({
        format: 'json',
        q: address,
        limit: '1'
      });
      
      const response = await fetch(`${this.API_URL}?${params.toString()}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: data[0].lat,
          lon: data[0].lon
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }
  
  private async searchHealthcareFacilities(lat: string, lon: string): Promise<HealthcareProvider[]> {
    try {
      // In a real app, we would use a specialized API for healthcare facilities
      // For demo purposes, we'll return mock data based on the provided coordinates
      
      // This would typically be a call to a service like Google Places API:
      // const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=5000&type=hospital&key=${API_KEY}`;
      
      // Simulate API response delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock data
      return [
        {
          name: "Memorial Hermann Hospital",
          address: "6411 Fannin St, Houston, TX 77030",
          phone: "(713) 704-4000",
          website: "https://www.memorialhermann.org",
          type: "Hospital",
          distance: "1.8 miles"
        },
        {
          name: "Houston Methodist Hospital",
          address: "6565 Fannin St, Houston, TX 77030",
          phone: "(713) 790-3311",
          website: "https://www.houstonmethodist.org",
          type: "Hospital",
          distance: "2.2 miles"
        },
        {
          name: "Kelsey-Seybold Clinic",
          address: "2727 W Holcombe Blvd, Houston, TX 77025",
          phone: "(713) 442-0000",
          website: "https://www.kelsey-seybold.com",
          type: "Medical Clinic",
          distance: "0.9 miles"
        },
        {
          name: "NextLevel Urgent Care",
          address: "7667 S Braeswood Blvd, Houston, TX 77071",
          phone: "(281) 783-8162",
          website: "https://www.nextlevelurgentcare.com",
          type: "Urgent Care",
          distance: "1.5 miles"
        },
        {
          name: "CVS MinuteClinic",
          address: "3401 Hillcroft St, Houston, TX 77057",
          phone: "(713) 789-6362",
          website: "https://www.cvs.com/minuteclinic",
          type: "Pharmacy Clinic",
          distance: "3.1 miles"
        }
      ];
    } catch (error) {
      console.error("Error searching healthcare facilities:", error);
      return [];
    }
  }
}

export const healthcareProviderService = new HealthcareProviderService();
