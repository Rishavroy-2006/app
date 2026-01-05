import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const TrendEngine = ({ stateSummary, topStates, stats }) => {
  const [selectedState, setSelectedState] = useState('ALL');

  const getStateData = () => {
    if (selectedState === 'ALL') {
      return {
        total_enrol: stats?.total_enrolments || 0,
        total_demo_updates: stats?.total_demo_updates || 0,
        total_bio_updates: stats?.total_bio_updates || 0
      };
    }
    
    const state = stateSummary.find(s => s.state === selectedState);
    return state || { total_enrol: 0, total_demo_updates: 0, total_bio_updates: 0 };
  };

  const stateData = getStateData();

  const formatNumber = (num) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(0);
  };

  return (
    <Card data-testid="trend-engine-card">
      <CardHeader>
        <CardTitle>Trend Engine</CardTitle>
        <CardDescription>State-wise enrollment and update patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Select State</label>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger data-testid="state-selector">
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All States</SelectItem>
              {stateSummary.map((state) => (
                <SelectItem key={state.state} value={state.state}>
                  {state.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100" data-testid="enrol-card">
            <div className="text-sm font-medium text-blue-700 mb-1">Total Enrolments</div>
            <div className="text-2xl font-bold text-blue-900">{formatNumber(stateData.total_enrol)}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100" data-testid="demo-card">
            <div className="text-sm font-medium text-green-700 mb-1">Demo Updates</div>
            <div className="text-2xl font-bold text-green-900">{formatNumber(stateData.total_demo_updates)}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100" data-testid="bio-card">
            <div className="text-sm font-medium text-purple-700 mb-1">Bio Updates</div>
            <div className="text-2xl font-bold text-purple-900">{formatNumber(stateData.total_bio_updates)}</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Top 10 States by Enrolment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topStates}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="state" 
                tick={{ fontSize: 11 }} 
                angle={-45} 
                textAnchor="end" 
                height={100}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => formatNumber(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="total_enrol" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendEngine;