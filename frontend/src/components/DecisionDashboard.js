import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const DecisionDashboard = ({ stateSummary, anomalyData }) => {
  const insights = useMemo(() => {
    if (!stateSummary || stateSummary.length === 0) {
      return {
        topEnrolState: 'N/A',
        topDemoState: 'N/A',
        topBioState: 'N/A'
      };
    }

    const topEnrol = [...stateSummary].sort((a, b) => b.total_enrol - a.total_enrol)[0];
    const topDemo = [...stateSummary].sort((a, b) => b.demo_per_enrol - a.demo_per_enrol)[0];
    const topBio = [...stateSummary].sort((a, b) => b.bio_per_enrol - a.bio_per_enrol)[0];

    return {
      topEnrolState: topEnrol?.state || 'N/A',
      topDemoState: topDemo?.state || 'N/A',
      topBioState: topBio?.state || 'N/A'
    };
  }, [stateSummary]);

  const recommendations = [
    {
      icon: '📊',
      title: 'Biometric Drive Initiative',
      description: 'Focus biometric update campaigns in high-enrollment states with low bio-to-enrollment ratios to improve data accuracy.',
      priority: 'High'
    },
    {
      icon: '📋',
      title: 'Documentation Best Practices',
      description: 'Leverage states with high demo-per-enrol ratios as reference models for documentation-update campaigns nationwide.',
      priority: 'Medium'
    },
    {
      icon: '🎯',
      title: 'Resource Allocation',
      description: 'Deploy additional enrollment centers in underserved regions to balance state-wise coverage and reduce regional disparity.',
      priority: 'High'
    },
    {
      icon: '⚠️',
      title: 'Anomaly Investigation',
      description: 'Investigate states flagged with unusual update patterns to identify potential data quality issues or process inefficiencies.',
      priority: 'Critical'
    }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold text-xs text-gray-900">{data.state}</p>
          <p className="text-xs text-gray-600">Demo: {data.demo_per_enrol.toFixed(2)}</p>
          <p className="text-xs text-gray-600">Bio: {data.bio_per_enrol.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card data-testid="decision-dashboard-card">
      <CardHeader>
        <CardTitle>Decision Dashboard</CardTitle>
        <CardDescription>Executive summary and action recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100" data-testid="top-enrol-card">
            <div className="text-xs font-medium text-blue-700 mb-1">Top Enrolment</div>
            <div className="text-sm font-bold text-blue-900 truncate">{insights.topEnrolState}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100" data-testid="top-demo-card">
            <div className="text-xs font-medium text-green-700 mb-1">Highest Demo Ratio</div>
            <div className="text-sm font-bold text-green-900 truncate">{insights.topDemoState}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-100" data-testid="top-bio-card">
            <div className="text-xs font-medium text-purple-700 mb-1">Highest Bio Ratio</div>
            <div className="text-sm font-bold text-purple-900 truncate">{insights.topBioState}</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Update Pattern Overview</h3>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                dataKey="demo_per_enrol" 
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                type="number" 
                dataKey="bio_per_enrol" 
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={anomalyData}>
                {anomalyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.is_anomaly ? '#dc2626' : '#3b82f6'}
                    opacity={entry.is_anomaly ? 0.8 : 0.5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Action Recommendations</h3>
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                data-testid={`recommendation-${idx}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{rec.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-semibold text-gray-900">{rec.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        rec.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DecisionDashboard;