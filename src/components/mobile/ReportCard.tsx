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
      <div className="bg-white rounded-2xl shadow-md border border-emerald-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 opacity-50" />
        <div className="flex items-start gap-4 mb-5 relative">
          <div className="bg-emerald-500 rounded-xl p-2.5 shadow-lg shadow-emerald-100">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-lg">Work Reported</h3>
            <p className="text-sm font-medium text-slate-500">
              Submitted at {new Date(report.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6 relative">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Work Done</p>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{report.workDone}</p>
          </div>
          {report.issues && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">Issues Identified</p>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{report.issues}</p>
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
          className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
        >
          Update Report Details
        </button>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
        <div className="bg-white rounded-2xl p-4 inline-block shadow-sm mb-4">
          <FileText className="w-10 h-10 text-slate-300" />
        </div>
        <p className="font-bold text-slate-900 text-lg">No Active Assignment</p>
        <p className="text-sm font-medium text-slate-500 mt-1">Please contact your HR manager to receive a site assignment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-blue-100 rounded-2xl p-3">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Daily Work Report</h3>
          <p className="text-sm font-medium text-slate-500">{report ? 'Modify' : 'Submit'} your progress</p>
        </div>
      </div>

      {showSuccess && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-1">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <p className="text-sm font-bold text-emerald-700">Report successfully recorded!</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            Tasks Completed *
          </label>
          <textarea
            value={workDone}
            onChange={(e) => setWorkDone(e.target.value)}
            placeholder="What have you achieved today?"
            rows={4}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            Site Issues / Blockers
          </label>
          <textarea
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            placeholder="Report any problems (optional)"
            rows={2}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !workDone.trim()}
            className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {report ? 'Update Entry' : 'Post Report'}
              </>
            )}
          </button>
          {report && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-4 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
