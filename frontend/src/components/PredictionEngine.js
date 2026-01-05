import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const PredictionEngine = ({ monthlyData }) => {
  const { chartData, forecast } = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return { chartData: [], forecast: [] };
    }

    // Prepare historical data
    const historical = monthlyData.map((item, index) => ({
      month: item.month,
      actual: item.total_enrol,
      index: index
    }));

    // Linear regression forecast
    const n = historical.length;
    if (n < 3) {
      return { chartData: historical, forecast: [] };
    }

    const sumX = historical.reduce((sum, item) => sum + item.index, 0);
    const sumY = historical.reduce((sum, item) => sum + item.actual, 0);
    const sumXY = historical.reduce((sum, item) => sum + item.index * item.actual, 0);
    const sumX2 = historical.reduce((sum, item) => sum + item.index * item.index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Moving average forecast
    const last3 = historical.slice(-3);
    const movingAvg = last3.reduce((sum, item) => sum + item.actual, 0) / 3;

    // Generate forecasts for next 3 months
    const forecastData = [];
    for (let i = 1; i <= 3; i++) {
      const nextIndex = n + i - 1;
      const linearPred = slope * nextIndex + intercept;
      
      forecastData.push({
        month: `Forecast +${i}`,
        linearRegression: Math.max(0, linearPred),
        movingAverage: movingAvg,
        index: nextIndex
      });
    }

    const combined = [
      ...historical,
      ...forecastData.map(f => ({
        month: f.month,
        actual: null,
        linearRegression: f.linearRegression,
        movingAverage: f.movingAverage,
        index: f.index
      }))
    ];

    return { chartData: combined, forecast: forecastData };
  }, [monthlyData]);

  const formatNumber = (num) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(0);
  };

  return (
    <Card data-testid="prediction-engine-card">
      <CardHeader>
        <CardTitle>Prediction Engine</CardTitle>
        <CardDescription>Enrolment forecasting with multiple methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Monthly Enrolment Trend & Forecast</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => value ? formatNumber(value) : 'N/A'}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#2563eb" 
                strokeWidth={2}
                name="Actual"
                dot={{ r: 3 }}
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="linearRegression" 
                stroke="#16a34a" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Linear Forecast"
                dot={{ r: 3 }}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="movingAverage" 
                stroke="#ea580c" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Moving Avg Forecast"
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {forecast.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Next 3 Months Forecast</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Period</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">Linear Regression</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">Moving Average</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((f, idx) => (
                    <tr key={idx} className="border-b border-gray-100" data-testid={`forecast-row-${idx}`}>
                      <td className="px-4 py-2 text-gray-800 font-medium">{f.month}</td>
                      <td className="px-4 py-2 text-right text-gray-700 font-mono">{formatNumber(f.linearRegression)}</td>
                      <td className="px-4 py-2 text-right text-gray-700 font-mono">{formatNumber(f.movingAverage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictionEngine;