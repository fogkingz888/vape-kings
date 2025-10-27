
import { User, Product, StockLevel, Sale, Role, AuditLog, StockForecast, ReorderSuggestion } from '../types';

export const products: Product[] = [];

export const stockLevels: StockLevel[] = [];

export const sales: Sale[] = [];

export const auditLogs: AuditLog[] = [];

const generateForecast = (days: number, base: number, volatility: number) => {
    const data = [];
    let current = base;
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i + 1); // Start forecast from tomorrow
        const trend = (i / days) * 0.1; // slight upward trend
        current += (Math.random() - 0.45 + trend) * volatility;
        current = Math.max(base * 0.8, current); // Ensure it doesn't drop too low
        data.push({ date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), quantity: Math.round(current) });
    }
    return data;
};

export const stockForecasts: StockForecast[] = [];

export const reorderSuggestions: ReorderSuggestion[] = [];