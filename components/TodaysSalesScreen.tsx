import React, { useMemo } from 'react';
import { Sale, Product, User, Role } from '../types';

type ProductWithStock = Product & { stock: number };

type TodaysSalesScreenProps = {
    user: User;
    sales: Sale[];
    productStockMap: ProductWithStock[];
};

const TodaysSalesScreen: React.FC<TodaysSalesScreenProps> = ({ user, sales, productStockMap }) => {
    const filteredSales = useMemo(() => {
        if (user.role === Role.Owner) {
            return sales;
        }
        return sales.filter(sale => sale.user_id === user.id);
    }, [sales, user]);

    const revenueToday = useMemo(() => filteredSales.reduce((sum, sale) => sum + Number(sale.total_price), 0), [filteredSales]);
    const itemsSoldToday = useMemo(() => filteredSales.reduce((sum, sale) => sum + Number(sale.quantity), 0), [filteredSales]);
    
    const StatCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
        <div className="bg-hiphop-950 p-6 rounded-sm shadow-lg border-l-4" style={{ borderColor: color }}>
            <h4 className="text-hiphop-gray text-sm font-bold uppercase tracking-wider">{title}</h4>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
    );

    return (
        <div>
            <h2 className="text-4xl font-marker text-hiphop-light mb-6">Today's Sales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Revenue Today" value={`₱${revenueToday.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="#00f2ea" />
                <StatCard title="Total Items Sold" value={itemsSoldToday.toString()} color="#ff00ff" />
                <StatCard title="Total Transactions" value={filteredSales.length.toString()} color="#ffd700" />
            </div>

            <div className="bg-hiphop-950 rounded-sm shadow-xl overflow-hidden border-2 border-hiphop-800">
                 <h3 className="text-2xl font-marker text-hiphop-light p-4 bg-hiphop-800">Transaction Log</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-hiphop-800 uppercase text-xs text-hiphop-gray tracking-widest">
                            <tr>
                                <th className="p-4">Time</th>
                                <th className="p-4">Product</th>
                                <th className="p-4 text-center">Qty</th>
                                <th className="p-4 text-right">Total Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hiphop-800">
                            {filteredSales.length > 0 ? (
                                filteredSales.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => {
                                    const product = productStockMap.find(p => p.id === sale.product_id);
                                    return (
                                        <tr key={sale.id} className="hover:bg-hiphop-800 transition-colors">
                                            <td className="p-4 text-hiphop-gray whitespace-nowrap">
                                                {new Date(sale.date).toLocaleTimeString()}
                                            </td>
                                            <td className="p-4">
                                                <p className="font-semibold">{product?.name || 'Unknown Product'}</p>
                                                <p className="text-xs text-hiphop-gray">{product?.brand}</p>
                                            </td>
                                            <td className="p-4 text-center font-bold text-xl">{sale.quantity}</td>
                                            <td className="p-4 text-right font-mono text-hiphop-cyan">₱{Number(sale.total_price).toFixed(2)}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-hiphop-gray">
                                        No sales recorded today.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default TodaysSalesScreen;