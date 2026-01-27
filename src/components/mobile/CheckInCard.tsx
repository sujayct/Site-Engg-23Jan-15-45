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
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-500 rounded-xl p-2.5 shadow-lg shadow-emerald-200">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-emerald-900 text-lg mb-0.5">Checked In</h3>
            <p className="text-sm font-medium text-emerald-700/80">
              {new Date(checkIn.checkInTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {checkIn.locationName && (
              <div className="mt-4 pt-4 border-t border-emerald-200/50">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-tight mb-1">Current Location</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">{checkIn.locationName}</p>
                    {checkIn.latitude && checkIn.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${checkIn.latitude},${checkIn.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 mt-2 bg-emerald-100/50 px-2 py-1 rounded-md transition-colors"
                      >
                        View on Google Maps
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-blue-100 rounded-2xl p-3">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Daily Attendance</h3>
          <p className="text-sm font-medium text-slate-500">Secure location-based check-in</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 mb-6 p-4 bg-red-50 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Verifying Location...
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            Check In Now
          </>
        )}
      </button>

      <p className="text-[10px] font-bold text-slate-400 mt-4 text-center uppercase tracking-widest">
        GPS Authentication Required
      </p>
    </div>
  );
}
