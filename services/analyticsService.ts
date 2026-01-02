
export const analyticsService = {
  async get30DayTrends() {
    // Mock data for time-series analysis
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      incidents: Math.floor(Math.random() * 10) + (i > 20 ? 15 : 0), // Simulate a recent spike
      resolved: Math.floor(Math.random() * 8)
    }));
  },

  async getRiskHeatmap() {
    return [
      { location: 'New York, USA', riskLevel: 'Critical', activeIncidents: 12, trend: 'Increasing' },
      { location: 'London, UK', riskLevel: 'High', activeIncidents: 8, trend: 'Stable' },
      { location: 'Moscow, Russia', riskLevel: 'Medium', activeIncidents: 4, trend: 'Decreasing' },
      { location: 'Beijing, China', riskLevel: 'Low', activeIncidents: 2, trend: 'Stable' }
    ];
  },

  async getVolunteerPerformance() {
    return [
      { name: 'Unit Alpha', responseTime: '4.2m', completionRate: '98%' },
      { name: 'Unit Beta', responseTime: '5.8m', completionRate: '94%' },
      { name: 'Unit Gamma', responseTime: '6.1m', completionRate: '91%' }
    ];
  }
};
