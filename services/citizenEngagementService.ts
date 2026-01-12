// citizenEngagementService.ts
// Public reporting, status updates, two-way communication

export interface CitizenReport {
  id: string;
  reporterName: string;
  contact: string;
  location: { lat: number; lng: number };
  incidentType: string;
  description: string;
  timestamp: number;
  status: 'received' | 'in_progress' | 'resolved';
  updates: string[];
}

class CitizenEngagementService {
  private reports: CitizenReport[] = [];

  submitReport(report: Omit<CitizenReport, 'id' | 'timestamp' | 'status' | 'updates'>): CitizenReport {
    const newReport: CitizenReport = {
      ...report,
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      status: 'received',
      updates: []
    };
    this.reports.push(newReport);
    return newReport;
  }

  getReports(): CitizenReport[] {
    return this.reports;
  }

  addUpdate(reportId: string, update: string) {
    const report = this.reports.find(r => r.id === reportId);
    if (report) report.updates.push(update);
  }

  setStatus(reportId: string, status: CitizenReport['status']) {
    const report = this.reports.find(r => r.id === reportId);
    if (report) report.status = status;
  }
}

export const citizenEngagementService = new CitizenEngagementService();
