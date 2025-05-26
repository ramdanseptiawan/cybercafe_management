import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Helper function to format currency in Rupiah
const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const Reports = ({ stock, transactions }) => {
  // Calculate sales by category
  const salesByCategory = transactions
    .filter(t => t.type === 'sale')
    .reduce((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.price;
      return acc;
    }, {});

  const salesByCategoryData = Object.keys(salesByCategory).map(category => ({
    name: category,
    value: salesByCategory[category]
  }));

  // Calculate sales by date
  const salesByDate = transactions
    .filter(t => t.type === 'sale')
    .reduce((acc, transaction) => {
      if (!acc[transaction.date]) {
        acc[transaction.date] = 0;
      }
      acc[transaction.date] += transaction.price;
      return acc;
    }, {});

  const salesByDateData = Object.keys(salesByDate)
    .sort()
    .map(date => ({
      date,
      sales: salesByDate[date]
    }));

  // Calculate low stock items
  const lowStockItems = stock.filter(item => item.quantity <= item.minLevel);

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Custom tooltip for Rupiah formatting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-sm">{`${payload[0].name}: ${formatRupiah(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Reports & Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesByCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {salesByCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatRupiah(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={salesByDateData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatRupiah(value).split(',')[0]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="sales" name="Sales" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Inventory Status</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stock.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.minLevel} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.quantity <= item.minLevel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.quantity <= item.minLevel ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatRupiah(item.quantity * item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;