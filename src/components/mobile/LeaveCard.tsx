import { useState } from 'react';
import { Calendar, Send, Loader, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { leaveService } from '../../services/leaveService';
import { StorageService } from '../../lib/storage';
import type { LeaveRequest } from '../../types';

interface LeaveCardProps {
  leaveRequests: LeaveRequest[];
  onLeaveSubmit: (leave: LeaveRequest) => void;
}

export default function LeaveCard({ leaveRequests, onLeaveSubmit }: LeaveCardProps) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !user.engineerId) return;

    setLoading(true);
    setError(null);

    try {
      const created = await leaveService.createLeaveRequest(
        user.engineerId,
        startDate,
        endDate,
        reason
      );
      onLeaveSubmit(created);

      setStartDate('');
      setEndDate('');
      setReason('');
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          Apply for Leave
        </button>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border-2 border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 rounded-full p-2">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Leave Application</h3>
              <p className="text-sm text-slate-600">Request time off</p>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for your leave..."
                rows={3}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Request
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {leaveRequests.map((leave) => {
          const backupEngineer = leave.backupEngineerId
            ? StorageService.getEngineerById(leave.backupEngineerId)
            : null;
          const approver = leave.approvedBy
            ? StorageService.getUserById(leave.approvedBy)
            : null;

          return (
            <div
              key={leave.id}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 ${
                leave.status === 'approved'
                  ? 'border-green-200'
                  : leave.status === 'rejected'
                  ? 'border-red-200'
                  : 'border-yellow-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{leave.reason}</p>
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    leave.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : leave.status === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {leave.status === 'approved' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : leave.status === 'rejected' ? (
                    <XCircle className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  {leave.status}
                </div>
              </div>

              {backupEngineer && (
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <p className="text-xs text-blue-700">
                    Backup: {backupEngineer.name}
                  </p>
                </div>
              )}

              {approver && (
                <p className="text-xs text-slate-500 mt-2">
                  {leave.status === 'approved' ? 'Approved' : 'Rejected'} by {approver.name}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {leaveRequests.length === 0 && !showForm && (
        <div className="text-center py-8 text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p>No leave requests yet</p>
        </div>
      )}
    </div>
  );
}
