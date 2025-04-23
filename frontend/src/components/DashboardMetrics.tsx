import React from 'react';

interface DashboardMetricsProps {
  applications: Array<{
    status: string;
    status_color: string;
  }>;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ applications }) => {
  // Calculate metrics
  const totalApplications = applications.length;
  const interviewCount = applications.filter(app => app.status.toLowerCase() === 'interview').length;
  const offerCount = applications.filter(app => app.status.toLowerCase() === 'offer').length;
  const rejectedCount = applications.filter(app => app.status.toLowerCase() === 'rejected').length;
  
  // Calculate success rate (interviews + offers) / total
  const successRate = totalApplications > 0
    ? ((interviewCount + offerCount) / totalApplications) * 100
    : 0;
  
  // Calculate gauge rotation (from -90 to 90 degrees)
  const gaugeRotation = -90 + (successRate * 1.8); // 1.8 = 180/100

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h3 className="card-title mb-0">Application Metrics</h3>
      </div>
      <div className="card-body">
        {/* Speedometer Gauge */}
        <div className="gauge-container mb-4">
          <div className="gauge">
            <div className="gauge-body">
              <div 
                className="gauge-fill"
                style={{
                  transform: `rotate(${gaugeRotation}deg)`
                }}
              ></div>
              <div className="gauge-cover">
                <div className="gauge-value">{successRate.toFixed(1)}%</div>
                <div className="gauge-label">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="row text-center">
          <div className="col-6 col-md-3 mb-3">
            <div className="metric-card">
              <h3 className="metric-value">{totalApplications}</h3>
              <div className="metric-label">Total Applications</div>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-3">
            <div className="metric-card text-success">
              <h3 className="metric-value">{interviewCount}</h3>
              <div className="metric-label">Interviews</div>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-3">
            <div className="metric-card text-warning">
              <h3 className="metric-value">{offerCount}</h3>
              <div className="metric-label">Offers</div>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-3">
            <div className="metric-card text-danger">
              <h3 className="metric-value">{rejectedCount}</h3>
              <div className="metric-label">Rejected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics; 