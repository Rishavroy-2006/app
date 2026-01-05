import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TrendEngine from './TrendEngine';
import AnomalyEngine from './AnomalyEngine';
import PredictionEngine from './PredictionEngine';
import DecisionDashboard from './DecisionDashboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [stateSummary, setStateSummary] = useState([]);
  const [topStates, setTopStates] = useState([]);
  const [anomalyData, setAnomalyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, summaryRes, topRes, anomalyRes, monthlyRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/state-summary`),
        axios.get(`${API}/top-states?metric=total_enrol&n=10`),
        axios.get(`${API}/anomaly-points`),
        axios.get(`${API}/monthly-enrolment`)
      ]);

      setStats(statsRes.data);
      setStateSummary(summaryRes.data);
      setTopStates(topRes.data);
      setAnomalyData(anomalyRes.data);
      setMonthlyData(monthlyRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-blue-600 rounded flex items-center justify-center">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Aadhaar Intelligence Console</h1>
              <p className="text-sm text-gray-600">UIDAI Data Analytics Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TrendEngine 
            stateSummary={stateSummary} 
            topStates={topStates}
            stats={stats}
          />
          <AnomalyEngine anomalyData={anomalyData} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PredictionEngine monthlyData={monthlyData} />
          <DecisionDashboard 
            stateSummary={stateSummary}
            anomalyData={anomalyData}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;