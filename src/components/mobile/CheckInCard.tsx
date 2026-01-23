import { useState } from 'react';
import { MapPin, CheckCircle, Loader, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { checkInService } from '../../services/checkInService';
import type { CheckIn } from '../../types';

interface CheckInCardProps {
  checkIn: CheckIn | null;
  onCheckInComplete: (checkIn: CheckIn) => void;
}

export default function CheckInCard({ checkIn, onCheckInComplete }: CheckInCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckIn() {
    if (!user || !user.engineerId) return;

    setLoading(true);
    setError(null);

    try {
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        const result = await checkInService.createCheckIn(
          user.engineerId,
          latitude,
          longitude,
          locationName
        );
        onCheckInComplete(result);
      } else {
        const result = await checkInService.createCheckIn(user.engineerId);
        onCheckInComplete(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check in');
    } finally {
      setLoading(false);
    }
  }

  if (checkIn) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-green-500 rounded-full p-2">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-1">Checked In</h3>
            <p className="text-sm text-green-700 mb-2">
              {new Date(checkIn.checkInTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {checkIn.locationName && (
              <div className="flex items-start gap-2 mt-2">
                <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-green-700">{checkIn.locationName}</p>
                  {checkIn.latitude && checkIn.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${checkIn.latitude},${checkIn.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 mt-1"
                    >
                      View on map
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-slate-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-blue-100 rounded-full p-2">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Check In</h3>
          <p className="text-sm text-slate-600">Mark your attendance</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Getting location...
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            Check In Now
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 mt-2 text-center">
        Location permission required for GPS tracking
      </p>
    </div>
  );
}
