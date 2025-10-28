import React, { useState, useMemo, ChangeEvent } from 'react';
import { Product } from '../types';
import { BarcodeIcon } from './icons';
import PrintReceiptModal from './PrintReceiptModal';
import BarcodeScannerModal from './BarcodeScannerModal';

type ProductWithStock = Product & { stock: number };

type PosScreenProps = {
    productStockMap: ProductWithStock[];
    onNewSale: (cart: { product: Product; quantity: number }[]) => void;
    isPrinterEnabled: boolean;
    businessName: string;
    isOnline: boolean;
};

type CartItem = {
    product: ProductWithStock;
    quantity: number;
};

type CompletedSale = {
    items: CartItem[];
    total: number;
};


const PosScreen: React.FC<PosScreenProps> = ({ productStockMap, onNewSale, isPrinterEnabled, businessName, isOnline }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [saleToPrint, setSaleToPrint] = useState<CompletedSale | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        return productStockMap.filter(p =>
            (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.toLowerCase().includes(searchTerm.toLowerCase())) &&
            p.stock > 0
        ).slice(0, 5); // Limit results for performance
    }, [productStockMap, searchTerm]);

    const addToCart = (product: ProductWithStock) => {
        const existingItem = cart.find(item => item.product.id === product.id);
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
            }
        } else {
            setCart([...cart, { product, quantity: 1 }]);
        }
        setSearchTerm('');
    };

    const updateQuantity = (productId: string, quantity: number) => {
        const item = cart.find(item => item.product.id === productId);
        if (item && quantity > 0 && quantity <= item.product.stock) {
            setCart(cart.map(item => item.product.id === productId ? { ...item, quantity } : item));
        }
    };
    
    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    }, [cart]);

    const completeSale = () => {
        if (isOnline) {
            const saleData = { items: cart, total };
            onNewSale(cart);
        
            if (isPrinterEnabled) {
                setSaleToPrint(saleData);
                setIsPrintModalOpen(true);
            } else {
                setCart([]);
            }
        } else {
            const offlineSales = JSON.parse(localStorage.getItem('offlineSales') || '[]');
            offlineSales.push(cart);
            localStorage.setItem('offlineSales', JSON.stringify(offlineSales));
            alert('You are offline. Sale has been saved locally and will be synced automatically when you reconnect.');
            setCart([]);
        }
    };
    
    const handleClosePrintModal = () => {
        setIsPrintModalOpen(false);
        setSaleToPrint(null);
        setCart([]); // Clear cart after modal is closed
    };

    const handleScan = (barcode: string) => {
        const trimmedBarcode = barcode.trim();
        const product = productStockMap.find(p => p.barcode === trimmedBarcode && p.stock > 0);

        if (product) {
            addToCart(product);
        } else {
            const outOfStockProduct = productStockMap.find(p => p.barcode === trimmedBarcode);
            if (outOfStockProduct) {
                alert(`Product "${outOfStockProduct.name}" is out of stock.`);
            } else {
                alert("Product not found for this barcode.");
            }
        }
        setIsScannerOpen(false);
    };


    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
                {/* Left side - Product Search and Cart */}
                <div className="lg:col-span-3 bg-hiphop-950 p-6 rounded-sm shadow-xl flex flex-col border-2 border-hiphop-800">
                    <h2 className="text-4xl font-marker text-hiphop-light mb-4">Point of Sale</h2>
                    <div className="relative mb-4">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Search product name or barcode..."
                                value={searchTerm}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                className="w-full bg-hiphop-800 border-2 border-hiphop-700 rounded-sm py-3 px-4 text-lg focus:outline-none focus:ring-2 focus:ring-hiphop-cyan"
                            />
                            <button onClick={() => setIsScannerOpen(true)} className="p-3 bg-hiphop-700 hover:bg-hiphop-800 rounded-sm text-hiphop-cyan transition-colors" aria-label="Scan barcode" title="Scan barcode">
                                <BarcodeIcon className="w-7 h-7" />
                            </button>
                        </div>
                        {searchTerm && filteredProducts.length > 0 && (
                            <div className="absolute z-10 w-full bg-hiphop-800 border-2 border-hiphop-700 rounded-sm mt-1 shadow-lg">
                                {filteredProducts.map(p => (
                                    <div key={p.id} onClick={() => addToCart(p)} className="p-3 hover:bg-hiphop-700 cursor-pointer flex justify-between">
                                        <span>{p.name} - {p.brand}</span>
                                        <span className="text-hiphop-gray">Stock: {p.stock}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-grow overflow-y-auto -mr-6 pr-6">
                        {cart.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-hiphop-gray">
                                <p className="font-bold text-xl">CART IS EMPTY</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map(item => (
                                    <div key={item.product.id} className="flex items-center bg-hiphop-900 p-3 rounded-sm">
                                        <img src={item.product.image_url} alt={item.product.name} className="w-12 h-12 rounded-sm object-cover mr-4 border-2 border-hiphop-700" />
                                        <div className="flex-grow">
                                            <p className="font-semibold">{item.product.name}</p>
                                            <p className="text-sm text-hiphop-gray">₱{item.product.price.toFixed(2)}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                                                min="1"
                                                max={item.product.stock}
                                                className="w-16 text-center bg-hiphop-800 rounded-sm p-1 focus:outline-none focus:ring-1 focus:ring-hiphop-magenta"
                                            />
                                            <p className="w-24 text-right font-semibold text-hiphop-cyan">₱{(item.product.price * item.quantity).toFixed(2)}</p>
                                            <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:text-red-400 p-1 text-2xl font-bold">
                                                &times;
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side - Total and Checkout */}
                <div className="lg:col-span-2 bg-hiphop-950 p-6 rounded-sm shadow-xl flex flex-col justify-between border-2 border-hiphop-800">
                    <div>
                        <h3 className="text-3xl font-marker mb-6">Order Summary</h3>
                        <div className="space-y-4 text-lg">
                            <div className="flex justify-between">
                                <span className="text-hiphop-gray">Subtotal</span>
                                <span>₱{total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-hiphop-gray">Tax</span>
                                <span>₱0.00</span>
                            </div>
                            <hr className="border-hiphop-700 my-4" />
                            <div className="flex justify-between font-bold text-3xl text-hiphop-cyan">
                                <span>Total</span>
                                <span>₱{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={completeSale}
                        disabled={cart.length === 0}
                        className="w-full bg-hiphop-cyan hover:bg-opacity-80 text-hiphop-950 font-bold py-4 px-4 rounded-sm shadow-lg text-xl transition-transform transform hover:scale-105 disabled:bg-hiphop-700 disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                        Complete Sale
                    </button>
                </div>
            </div>
            <PrintReceiptModal
                isOpen={isPrintModalOpen}
                onClose={handleClosePrintModal}
                saleData={saleToPrint}
                businessName={businessName}
            />
            {isScannerOpen && (
                <BarcodeScannerModal
                    onScan={handleScan}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}
        </>
    );
};

export default PosScreen;