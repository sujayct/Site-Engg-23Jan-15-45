import { useState } from 'react';
import { FileText, Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { reportService } from '../../services/reportService';
import type { DailyReport, Assignment } from '../../types';

interface ReportCardProps {
  report: DailyReport | null;
  assignment: Assignment | undefined;
  onReportSubmit: (report: DailyReport) => void;
}

export default function ReportCard({ report, assignment, onReportSubmit }: ReportCardProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [workDone, setWorkDone] = useState(report?.workDone || '');
  const [issues, setIssues] = useState(report?.issues || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !user.engineerId || !assignment) return;

    setLoading(true);
    setError(null);

    try {
      const created = await reportService.createReport(
        user.engineerId,
        assignment.clientId,
        workDone,
        issues || undefined,
        assignment.siteId
      );
      onReportSubmit(created);

      setShowSuccess(true);
      setIsEditing(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  }

  if (report && !isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="bg-green-500 rounded-full p-2">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-1">Report Submitted</h3>
            <p className="text-sm text-green-700">
              {new Date(report.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">Work Done</p>
            <p className="text-sm text-slate-900">{report.workDone}</p>
          </div>
          {report.issues && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">Issues</p>
              <div className="flex items-start gap-2 p-2 bg-red-50 rounded">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{report.issues}</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setWorkDone(report.workDone);
            setIssues(report.issues || '');
            setIsEditing(true);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Edit Report
        </button>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-3 text-slate-600">
          <FileText className="w-6 h-6" />
          <div>
            <p className="font-medium">No Active Assignment</p>
            <p className="text-sm">Contact HR to get assigned</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-slate-200 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 rounded-full p-2">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Daily Report</h3>
          <p className="text-sm text-slate-600">{report ? 'Update' : 'Submit'} today's work</p>
        </div>
      </div>

      {showSuccess && (
        <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700 font-medium">Report submitted successfully!</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Work Done Today *
          </label>
          <textarea
            value={workDone}
            onChange={(e) => setWorkDone(e.target.value)}
            placeholder="Describe the work completed today..."
            rows={4}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Issues / Blockers
          </label>
          <textarea
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            placeholder="Any problems or concerns? (optional)"
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !workDone.trim()}
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
                {report ? 'Update Report' : 'Submit Report'}
              </>
            )}
          </button>
          {report && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
