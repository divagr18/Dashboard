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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import { DollarSign, Package as PackageIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'; // Import icons from lucide-react

type AnalyticsProps = {
  productSku: string | null;
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

type SalesProfitData = {
    month: string;
    total_sales: number;
    total_profit: number;
  };

const salesData = [
  { month: 'Jan', sales: 4000, profit: 2400 },
  { month: 'Feb', sales: 3000, profit: 1398 },
  { month: 'Mar', sales: 2000, profit: 9800 },
  { month: 'Apr', sales: 2780, profit: 3908 },
  { month: 'May', sales: 1890, profit: 4800 },
  { month: 'Jun', sales: 2390, profit: 3800 },
];

const categoryData = [
  { name: 'Electronics', value: 400 },
  { name: 'Tools', value: 300 },
  { name: 'Parts', value: 300 },
  { name: 'Accessories', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const API_BASE_URL = 'http://localhost:8000/api';

export default function Analytics({ productSku }: AnalyticsProps) {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [backtestMetrics, setBacktestMetrics] = useState<{ mae: number | null; rmse: number | null }>({ mae: null, rmse: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [salesProfitData, setSalesProfitData] = useState<SalesProfitData[]>([]); // Add state for sales/profit data

    // Mock percentage change data (replace with your actual data)
    const totalRevenueChange = 12;
    const totalProductsChange = 8;
    const totalTransactionsChange = 15;
    const profitMarginChange = -3; // Example of a negative change

    const getChangeDirection = (change: number) => {
        if (change > 0) {
            return <ArrowUpRight className="h-4 w-4 mr-1" />;
        } else if (change < 0) {
            return <ArrowDownRight className="h-4 w-4 mr-1" />;
        } else {
            return null; // Or a different icon if you want to indicate no change
        }
    };

    const getChangeColor = (change: number) => {
        if (change > 0) {
            return "text-emerald-600";
        } else if (change < 0) {
            return "text-rose-600";
        } else {
            return "text-gray-600"; // Or another neutral color
        }
    };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [forecastResponse, backtestResponse, metricsResponse, salesProfitResponse] = await Promise.all([
          productSku ? axios.get<any>(`${API_BASE_URL}/products/${productSku}/forecast/prophet/30/`) : Promise.resolve({data: {forecast: []}}),
          productSku ? axios.get<any>(`${API_BASE_URL}/products/${productSku}/backtest/prophet/30/`) : Promise.resolve({data: {metrics: {mae: null, rmse: null}}}),
          axios.get<MetricsData>(`${API_BASE_URL}/metrics/${productSku ? `?product_sku=${productSku}` : ''}`),
          axios.get<SalesProfitData[]>(`${API_BASE_URL}/sales_profit_trend/${productSku ? `?product_sku=${productSku}` : ''}`) //Fetch sales/profit data
        ]);

        setForecastData(forecastResponse.data.forecast || []);
        setBacktestMetrics({
          mae: backtestResponse.data.metrics.mae || null,
          rmse: backtestResponse.data.metrics.rmse || null,
        });
        setMetrics(metricsResponse.data);
        setSalesProfitData(salesProfitResponse.data); // Store sales/profit data
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data.');
        setForecastData([]);
        setBacktestMetrics({ mae: null, rmse: null });
        setMetrics(null);
        setSalesProfitData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productSku]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {metrics && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="flex items-center justify-between">
                    <span className="p-2 bg-blue-200 rounded-xl">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                    </span>
                    <span className={`flex items-center ${getChangeColor(totalRevenueChange)} text-sm`}>
                        {getChangeDirection(totalRevenueChange)}
                        {totalRevenueChange}%
                    </span>
                </div>
              <h3 className="text-lg font-medium mt-4 text-gray-900">Total Sales</h3>
              <p className="text-3xl font-bold mt-2">${metrics.total_sales.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">vs. last month</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 bg-gradient-to-br from-emerald-50 to-emerald-100">
                <div className="flex items-center justify-between">
                    <span className="p-2 bg-emerald-200 rounded-xl">
                        <PackageIcon className="h-6 w-6 text-emerald-600" />
                    </span>
                    <span className={`flex items-center ${getChangeColor(totalProductsChange)} text-sm`}>
                        {getChangeDirection(totalProductsChange)}
                        {totalProductsChange}%
                    </span>
                </div>
              <h3 className="text-lg font-medium mt-4 text-gray-900">Total Products</h3>
              <p className="text-3xl font-bold mt-2">{metrics.total_products.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Active inventory items</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 bg-gradient-to-br from-violet-50 to-violet-100">
                {/* You might need to import BarChart3 if you want to use it here */}
                <div className="flex items-center justify-between">
                    <span className="p-2 bg-violet-200 rounded-xl">
                        {/* Replace with your BarChart3 component or any other icon */}
                        <DollarSign className="h-6 w-6 text-violet-600" />
                    </span>
                    <span className={`flex items-center ${getChangeColor(totalTransactionsChange)} text-sm`}>
                        {getChangeDirection(totalTransactionsChange)}
                        {totalTransactionsChange}%
                    </span>
                </div>
              <h3 className="text-lg font-medium mt-4 text-gray-900">Transactions</h3>
              <p className="text-3xl font-bold mt-2">{metrics.total_transactions.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Total processed</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 bg-gradient-to-br from-amber-50 to-amber-100">
                <div className="flex items-center justify-between">
                    <span className="p-2 bg-amber-200 rounded-xl">
                        <DollarSign className="h-6 w-6 text-amber-600" />
                    </span>
                    <span className={`flex items-center ${getChangeColor(profitMarginChange)} text-sm`}>
                        {getChangeDirection(profitMarginChange)}
                        {Math.abs(profitMarginChange)}%
                    </span>
                </div>
              <h3 className="text-lg font-medium mt-4 text-gray-900">Profit Margin</h3>
              <p className="text-3xl font-bold mt-2">{((metrics?.total_profit || 0) / (metrics?.total_sales || 1) * 100).toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-1">Average margin</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Demand Forecast</h3>
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
                    <Line type="monotone" dataKey="yhat" stroke="#82ca9d" name="Forecast" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Forecast Accuracy Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Mean Absolute Error (MAE)</p>
                    <p className="text-lg font-semibold">{backtestMetrics.mae?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Root Mean Square Error (RMSE)</p>
                    <p className="text-lg font-semibold">{backtestMetrics.rmse?.toFixed(2) || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Category Distribution</h3>
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

      {/* Sales & Profit Trend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Sales & Profit Trend</h3>
          {loading && <p>Loading sales and profit data...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          {salesProfitData.length > 0 && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesProfitData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total_sales" stroke="#4F46E5" name="Sales" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="total_profit" stroke="#10B981" name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
    </div>
  );
}