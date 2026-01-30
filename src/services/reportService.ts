export const reportService = {
  async createReport(_engineerId: string, clientId: string, workDone: string, issues?: string, siteId?: string) {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, siteId, workDone, issues })
    });
    if (!response.ok) throw new Error('Failed to create report');
    return response.json();
  },

  async getReports(engineerId?: string) {
    const response = await fetch('/api/reports');
    if (!response.ok) throw new Error('Failed to fetch reports');
    const reports = await response.json();
    if (engineerId) {
      return reports.filter((r: any) => r.engineerId === engineerId);
    }
    return reports;
  }
};
