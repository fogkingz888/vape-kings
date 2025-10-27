import React, { useMemo, useState } from 'react';
import { Sale, Product, StockForecast, ReorderSuggestion } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CsvIcon } from './icons';

type ProductWithStock = Product & { stock: number };

type ReportsScreenProps = {
    sales: Sale[];
    productStockMap: ProductWithStock[];
    stockForecasts: StockForecast[];
    reorderSuggestions: ReorderSuggestion[];
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ sales, productStockMap, stockForecasts, reorderSuggestions }) => {
    const [selectedForecastProduct, setSelectedForecastProduct] = useState<string>(stockForecasts[0]?.product_id || '');

    // FIX: Ensure total_price is treated as a number for correct aggregation.
    const totalRevenue = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.total_price), 0), [sales]);
    
    const salesToday = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return sales.filter(sale => sale.date.startsWith(today));
    }, [sales]);

    // FIX: Ensure total_price is treated as a number for correct aggregation.
    const revenueToday = useMemo(() => salesToday.reduce((sum, sale) => sum + Number(sale.total_price), 0), [salesToday]);

    const topSellingProducts = useMemo(() => {
        // FIX: Explicitly type the initial value for reduce to ensure correct type inference for productSales.
        const productSales = sales.reduce((acc, sale) => {
            // FIX: Ensure sale.quantity is treated as a number, not a string, to prevent concatenation which causes type errors in subsequent operations.
            // FIX: Cast sale.quantity to a number to prevent type errors during arithmetic operation.
            acc[sale.product_id] = (acc[sale.product_id] || 0) + Number(sale.quantity);
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(productSales)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([productId, quantitySold]) => ({
                name: productStockMap.find(p => p.id === productId)?.name || 'Unknown',
                quantitySold,
            }));
    }, [sales, productStockMap]);
    
    const lowStockProducts = useMemo(() => productStockMap.filter(p => p.stock < 10), [productStockMap]);

    const salesOverTime = useMemo(() => {
        // FIX: Ensure total_price is treated as a number for correct aggregation.
        const salesByDate = sales.reduce((acc, sale) => {
            const date = new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            acc[date] = (acc[date] || 0) + Number(sale.total_price);
            return acc;
        // FIX: Provide a typed initial value to ensure correct type inference for the reduce operation's result.
        }, {} as Record<string, number>);
        
        return Object.entries(salesByDate).map(([date, revenue]) => ({ date, revenue })).reverse().slice(0, 15).reverse();
    }, [sales]);

    const selectedForecastData = useMemo(() => stockForecasts.find(f => f.product_id === selectedForecastProduct), [stockForecasts, selectedForecastProduct]);

    const downloadCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const handleExportSales = () => {
        const dataToExport = sales.map(sale => {
            const product = productStockMap.find(p => p.id === sale.product_id);
            return {
                SaleID: sale.id,
                Date: new Date(sale.date).toLocaleString(),
                ProductName: product?.name || 'N/A',
                Brand: product?.brand || 'N/A',
                Quantity: sale.quantity,
                TotalPrice: Number(sale.total_price).toFixed(2),
                SoldByUserID: sale.user_id
            };
        });
        downloadCSV(dataToExport, 'sales_report.csv');
    };

    const StatCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
        <div className="bg-hiphop-950 p-6 rounded-sm shadow-lg border-l-4" style={{ borderColor: color }}>
            <h4 className="text-hiphop-gray text-sm font-bold uppercase tracking-wider">{title}</h4>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
    );
    
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-hiphop-950 p-4 border-2 border-hiphop-700 rounded-sm">
            <p className="label font-bold text-hiphop-cyan">{`${label}`}</p>
            <p className="intro text-hiphop-light">{`${payload[0].name} : ${payload[0].value}`}</p>
          </div>
        );
      }
      return null;
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-4xl font-marker text-hiphop-light">Reports & Analytics</h2>
                <button 
                    onClick={handleExportSales}
                    className="flex items-center space-x-2 bg-hiphop-800 hover:bg-hiphop-700 text-hiphop-light font-bold py-2 px-4 rounded-sm uppercase text-sm tracking-wider transition-colors"
                >
                    <CsvIcon className="w-5 h-5"/>
                    <span>Export CSV</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Revenue" value={`₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="#00f2ea" />
                <StatCard title="Revenue Today" value={`₱${revenueToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="#ff00ff" />
                <StatCard title="Sales Today" value={salesToday.length.toString()} color="#ffd700" />
                <StatCard title="Low Stock Items" value={lowStockProducts.length.toString()} color="#f44336" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mb-8">
                 <div className="xl:col-span-3 bg-hiphop-950 p-6 rounded-sm shadow-lg border-2 border-hiphop-800">
                    <h3 className="text-2xl font-marker mb-4">Sales Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesOverTime}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis dataKey="date" stroke="#a0a0a0" />
                            <YAxis stroke="#a0a0a0" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line name="Revenue" type="monotone" dataKey="revenue" stroke="#00f2ea" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="xl:col-span-2 bg-hiphop-950 p-6 rounded-sm shadow-lg border-2 border-hiphop-800">
                    <h3 className="text-2xl font-marker mb-4">Top Selling</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topSellingProducts} layout="vertical" margin={{ left: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                            <XAxis type="number" stroke="#a0a0a0" />
                            <YAxis type="category" dataKey="name" width={100} stroke="#a0a0a0" tick={{ fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar name="Units Sold" dataKey="quantitySold" fill="#ff00ff" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Features Section */}
            <div className="bg-hiphop-950 p-6 rounded-sm shadow-lg border-2 border-hiphop-800">
                 <h3 className="text-3xl font-marker mb-4 text-hiphop-gold">AI-Powered Insights</h3>
                 {stockForecasts.length === 0 && reorderSuggestions.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-2xl font-bold text-hiphop-gray">Advanced AI Features Coming Soon!</p>
                        <p className="text-hiphop-gray mt-2">Sales forecasting and smart reorder suggestions are currently in development.</p>
                    </div>
                ) : (
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-bold uppercase tracking-wider">Sales Forecast</h4>
                             <select 
                                value={selectedForecastProduct} 
                                onChange={(e) => setSelectedForecastProduct(e.target.value)}
                                className="bg-hiphop-800 border-2 border-hiphop-700 rounded-sm p-2 focus:outline-none focus:ring-2 focus:ring-hiphop-gold"
                            >
                                {stockForecasts.map(f => {
                                    const product = productStockMap.find(p => p.id === f.product_id);
                                    return <option key={f.product_id} value={f.product_id}>{product?.name || 'Unknown'}</option>;
                                })}
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={selectedForecastData?.forecasts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                <XAxis dataKey="date" stroke="#a0a0a0" />
                                <YAxis stroke="#a0a0a0" domain={['dataMin - 5', 'dataMax + 5']} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line name="Forecasted Stock" type="monotone" dataKey="quantity" stroke="#ffd700" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold uppercase tracking-wider mb-4">Smart Reorder Suggestions</h4>
                        <div className="space-y-3">
                            {reorderSuggestions.map(s => {
                                const product = productStockMap.find(p => p.id === s.product_id);
                                if (!product) return null;
                                return (
                                    <div key={s.product_id} className="bg-hiphop-800 p-4 rounded-sm">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-lg">{product.name}</p>
                                                <p className="text-sm text-hiphop-gray">{s.reason}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-hiphop-cyan">Reorder: {s.suggestedQty}</p>
                                                <p className="text-sm text-red-500">Current Stock: {product.stock}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 </div>
                )}
            </div>
        </div>
    );
};

export default ReportsScreen;