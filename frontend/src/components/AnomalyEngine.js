import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const AnomalyEngine = ({ anomalyData }) => {
  const topDemoStates = useMemo(() => {
    return [...anomalyData]
      .sort((a, b) => b.demo_per_enrol - a.demo_per_enrol)
      .slice(0, 5);
  }, [anomalyData]);

  const topBioStates = useMemo(() => {
    return [...anomalyData]
      .sort((a, b) => b.bio_per_enrol - a.bio_per_enrol)
      .slice(0, 5);
  }, [anomalyData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold text-gray-900">{data.state}</p>
          <p className="text-sm text-gray-600">Demo/Enrol: {data.demo_per_enrol.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Bio/Enrol: {data.bio_per_enrol.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card data-testid="anomaly-engine-card">
      <CardHeader>
        <CardTitle>Anomaly Engine</CardTitle>
        <CardDescription>Unusual update patterns detection</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Update Pattern Analysis</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                dataKey="demo_per_enrol" 
                name="Demo per Enrol"
                tick={{ fontSize: 12 }}
                label={{ value: 'Demo Updates / Enrolment', position: 'insideBottom', offset: -5, fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="bio_per_enrol" 
                name="Bio per Enrol"
                tick={{ fontSize: 12 }}
                label={{ value: 'Bio Updates / Enrolment', angle: -90, position: 'insideLeft', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={anomalyData}>
                {anomalyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.is_anomaly ? '#dc2626' : '#3b82f6'}
                    opacity={entry.is_anomaly ? 0.8 : 0.6}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 opacity-60"></div>
              <span className="text-xs text-gray-600">Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600 opacity-80"></div>
              <span className="text-xs text-gray-600">Anomaly (Demo &gt; 20 or Bio &gt; 30)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Top 5 - Demo Updates Ratio</h4>
            <div className="space-y-2">
              {topDemoStates.map((state) => (
                <div key={state.state} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded" data-testid={`demo-state-${state.state}`}>
                  <span className="font-medium text-gray-800 truncate">{state.state}</span>
                  <span className="text-gray-600 font-mono">{state.demo_per_enrol.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Top 5 - Bio Updates Ratio</h4>
            <div className="space-y-2">
              {topBioStates.map((state) => (
                <div key={state.state} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded" data-testid={`bio-state-${state.state}`}>
                  <span className="font-medium text-gray-800 truncate">{state.state}</span>
                  <span className="text-gray-600 font-mono">{state.bio_per_enrol.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnomalyEngine;