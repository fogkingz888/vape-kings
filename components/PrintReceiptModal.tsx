import React, { useState, useRef, useEffect } from 'react';
import Receipt from './Receipt';
import { Product } from '../types';

type CartItem = {
    product: Product & { stock: number };
    quantity: number;
};

type PrintReceiptModalProps = {
    isOpen: boolean;
    onClose: () => void;
    saleData: { items: CartItem[], total: number } | null;
    businessName: string;
};

const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({ isOpen, onClose, saleData, businessName }) => {
    const [cashTendered, setCashTendered] = useState('');
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setCashTendered('');
        }
    }, [isOpen]);

    if (!isOpen || !saleData) return null;

    const cash = parseFloat(cashTendered) || 0;
    const change = cash > 0 ? cash - saleData.total : 0;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-hiphop-900 rounded-sm shadow-xl p-8 w-full max-w-md transform transition-all border-2 border-hiphop-700">
                <h3 className="text-3xl font-marker text-hiphop-light mb-6">Complete Sale</h3>
                
                <div className="space-y-4 text-lg mb-6">
                    <div className="flex justify-between font-bold text-3xl text-hiphop-cyan">
                        <span>Total Due</span>
                        <span>₱{saleData.total.toFixed(2)}</span>
                    </div>
                    <div>
                        <label className="block text-sm font-bold uppercase tracking-wider text-hiphop-gray mb-1">Cash Tendered</label>
                        <input
                            type="number"
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                            className="w-full bg-hiphop-800 border-2 border-hiphop-700 rounded-sm py-2 px-3 text-2xl text-right focus:outline-none focus:ring-2 focus:ring-hiphop-cyan"
                        />
                    </div>
                     <div className="flex justify-between text-2xl">
                        <span className="text-hiphop-gray">Change</span>
                        <span className={change >= 0 ? 'text-hiphop-gold' : 'text-red-500'}>
                            ₱{change.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col space-y-3">
                    <button 
                        onClick={handlePrint} 
                        disabled={cash < saleData.total}
                        className="w-full bg-hiphop-cyan hover:bg-opacity-80 text-hiphop-950 font-bold py-3 px-4 rounded-sm uppercase tracking-wider disabled:bg-hiphop-700 disabled:cursor-not-allowed"
                    >
                        Print Receipt
                    </button>
                    <button 
                        onClick={onClose} 
                        className="w-full bg-hiphop-800 hover:bg-hiphop-700 text-hiphop-light font-bold py-2 px-4 rounded-sm uppercase"
                    >
                        Skip
                    </button>
                </div>
            </div>
            {/* Hidden component for printing */}
            <div className="printable-receipt" ref={receiptRef}>
                <Receipt 
                    saleData={saleData} 
                    businessName={businessName} 
                    cashTendered={cash}
                    change={change}
                />
            </div>
        </div>
    );
};
export default PrintReceiptModal;
