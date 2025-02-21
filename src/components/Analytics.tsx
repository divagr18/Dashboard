// Analytics.tsx (Updated to Pass productSku as Query Parameter)
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Text
} from 'recharts';
import axios from 'axios';

type AnalyticsProps = {
  isOpen: boolean;
  onClose: () => void;
  productSku: string | null; // Add product SKU prop
};

type ForecastData = {
  ds: string;
  yhat: number;
};

type MetricsData = {
  total_sales: number;
  total_profit: number;
  total_transactions: number;
  total_products: number;
};

const salesData = [
  { month: 'Jan', sales: 4000, profit: 2400 },
  { month: 'Feb', sales: 3000, profit: 1398 },
  { name: 'Mar', sales: 2000, profit: 9800 },
  { name: 'Apr', sales: 2780, profit: 3908 },
  { name: 'May', sales: 1890, profit: 4800 },
  { name: 'Jun', sales: 2390, profit: 3800 },
];

const categoryData = [
  { name: 'Electronics', value: 400 },
  { name: 'Tools', value: 300 },
  { name: 'Parts', value: 300 },
  { name: 'Accessories', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const API_BASE_URL = 'http://localhost:8000/api';

export default function Analytics({ isOpen, onClose, productSku }: AnalyticsProps) {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [backtestMetrics, setBacktestMetrics] = useState<{ mae: number | null; rmse: number | null }>({ mae: null, rmse: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null); // Add metrics state

  useEffect(() => {
    const fetchForecastData = async () => {
      if (!productSku) return; // Don't fetch if no product is selected

      setLoading(true);
      setError(null);

      try {
        // Fetch Prophet Forecast
        const forecastResponse = await axios.get<any>(`${API_BASE_URL}/products/${productSku}/forecast/prophet/30/`);
        setForecastData(forecastResponse.data.forecast);

        // Fetch Prophet Backtesting Results
        const backtestResponse = await axios.get<any>(`${API_BASE_URL}/products/${productSku}/backtest/prophet/30/`);
        setBacktestMetrics({
          mae: backtestResponse.data.metrics.mae,
          rmse: backtestResponse.data.metrics.rmse,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch forecast data.');
        setForecastData([]);
        setBacktestMetrics({ mae: null, rmse: null });
      } finally {
        setLoading(false);
      }
    };

    const fetchMetrics = async () => {
      try {
        let metricsUrl = `${API_BASE_URL}/metrics/`;
        if (productSku) {
          metricsUrl += `?product_sku=${productSku}`; // Add product_sku as a query parameter
        }
        const response = await axios.get<MetricsData>(metricsUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        setError((error as any).message || 'Failed to fetch metrics.');
        setMetrics(null);
      }
    };

    fetchForecastData();
    fetchMetrics();
  }, [isOpen, productSku]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-[90vw] max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {metrics && ( // Check if metrics is not null
              <>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-medium opacity-90">Total Sales</h3>
                  <p className="text-3xl font-bold mt-2 text-gray-900">${metrics.total_sales.toLocaleString()}</p>
                  <p className="text-emerald-600 text-sm mt-1 font-medium">+12% from last month</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-medium opacity-90">Total Profit</h3>
                  <p className="text-3xl font-bold mt-2">$ {metrics.total_profit.toLocaleString()}</p>
                  <p className="text-emerald-600 text-sm mt-1 font-medium">+8% from last month</p>
                </div>
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-medium opacity-90">Transactions</h3>
                  <p className="text-3xl font-bold mt-2">{metrics.total_transactions.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">+15% from last month</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
                  <h3 className="text-lg font-medium opacity-90">Total Products</h3>
                  <p className="text-3xl font-bold mt-2">{metrics.total_products.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">+5% from last month</p>
                </div>
              </>
            )}
          </div>

          {/* Forecast Section */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Forecast (Prophet)</h3>
            {loading && <p>Loading forecast data...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            {forecastData.length > 0 && (
              <>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ds" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="yhat" stroke="#82ca9d" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  MAE: {backtestMetrics.mae !== null ? backtestMetrics.mae.toFixed(2) : 'N/A'} | RMSE: {backtestMetrics.rmse !== null ? backtestMetrics.rmse.toFixed(2) : 'N/A'}
                </p>
              </>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales & Profit Trend */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales & Profit Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#4F46E5" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="profit" stroke="#10B981" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}