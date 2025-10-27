import React, { useState, useMemo, ChangeEvent } from 'react';
import { Product, User, Role } from '../types';
import ProductModal from './AddProductModal';

type ProductWithStock = Product & { stock: number };

type InventoryListProps = {
    user: User;
    productStockMap: ProductWithStock[];
    onAddProduct: (newProduct: Omit<Product, 'id' | 'created_at'>, initialStock: number) => void;
    onUpdateStock: (productId: string, newQuantity: number, reason: string) => void;
    onUpdateProduct: (updatedProduct: Product) => void;
    onDeleteProduct: (productId: string) => void;
};

const InventoryList: React.FC<InventoryListProps> = ({ user, productStockMap, onAddProduct, onUpdateStock, onUpdateProduct, onDeleteProduct }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductWithStock | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingStock, setEditingStock] = useState<{ [key: string]: string | number }>({});

    const isOwner = user.role === Role.Owner;

    const filteredProducts = useMemo(() => {
        return productStockMap.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [productStockMap, searchTerm]);
    
    const handleEditClick = (product: ProductWithStock) => {
      setEditingProduct(product);
      setIsModalOpen(true);
    };

    const handleDeleteClick = (productId: string, productName: string) => {
      if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
        onDeleteProduct(productId);
      }
    };
    
    const closeModal = () => {
      setIsModalOpen(false);
      setEditingProduct(null);
    };

    const handleStockChange = (productId: string, value: string) => {
        if (!isOwner) return;
        setEditingStock(prev => ({ ...prev, [productId]: value }));
    };

    const handleStockUpdate = (product: ProductWithStock) => {
        if (!isOwner) return;
        const newValue = editingStock[product.id];
        if (newValue !== undefined && newValue !== '' && Number(newValue) !== product.stock) {
            onUpdateStock(product.id, Number(newValue), 'Manual Update');
            setEditingStock(prev => {
                const newState = { ...prev };
                delete newState[product.id];
                return newState;
            });
        }
    };
    
    const getStockColor = (stock: number) => {
        if (stock < 10) return 'text-red-500';
        if (stock < 25) return 'text-yellow-400';
        return 'text-green-400';
    };

    return (
        <div className="text-hiphop-light">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-4xl font-marker text-hiphop-light">Inventory</h2>
                {isOwner && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-hiphop-cyan hover:bg-opacity-80 text-hiphop-950 font-bold py-2 px-5 rounded-sm uppercase tracking-wider shadow-md transition-transform transform hover:scale-105"
                    >
                        Add Product
                    </button>
                )}
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by name, brand, or barcode..."
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="w-full bg-hiphop-950 border-2 border-hiphop-700 rounded-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-hiphop-cyan"
                />
            </div>

            <div className="bg-hiphop-950 rounded-sm shadow-xl overflow-hidden border-2 border-hiphop-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-hiphop-800 uppercase text-xs text-hiphop-gray tracking-widest">
                            <tr>
                                <th className="p-4">Product</th>
                                <th className="p-4">Brand</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right">Price</th>
                                <th className="p-4 text-center">Stock</th>
                                {isOwner && <th className="p-4 text-center">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-hiphop-800">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-hiphop-800 transition-colors">
                                    <td className="p-4 flex items-center space-x-4">
                                        <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-sm object-cover border-2 border-hiphop-700" />
                                        <div>
                                            <p className="font-semibold">{product.name}</p>
                                            <p className="text-xs text-hiphop-gray">{product.variant}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-hiphop-gray">{product.brand}</td>
                                    <td className="p-4 text-hiphop-gray">{product.category}</td>
                                    <td className="p-4 text-right font-mono text-hiphop-cyan">₱{product.price.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                         {isOwner ? (
                                             <input
                                                type="number"
                                                value={editingStock[product.id] ?? product.stock}
                                                onChange={(e) => handleStockChange(product.id, e.target.value)}
                                                onBlur={() => handleStockUpdate(product)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleStockUpdate(product)}
                                                className={`w-20 text-center bg-hiphop-800 rounded-sm p-1 font-bold focus:outline-none focus:ring-2 focus:ring-hiphop-magenta ${getStockColor(product.stock)}`}
                                            />
                                         ) : (
                                            <span className={`font-bold p-1 text-lg ${getStockColor(product.stock)}`}>
                                                {product.stock}
                                            </span>
                                         )}
                                    </td>
                                    {isOwner && (
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button 
                                                    onClick={() => handleEditClick(product)}
                                                    className="bg-hiphop-gold text-hiphop-950 px-3 py-1 rounded-sm text-sm font-bold uppercase hover:bg-opacity-80"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(product.id, product.name)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded-sm text-sm font-bold uppercase hover:bg-red-500"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <ProductModal
                    onClose={closeModal}
                    onAddProduct={onAddProduct}
                    onUpdateProduct={onUpdateProduct}
                    allProducts={productStockMap}
                    productToEdit={editingProduct}
                />
            )}
        </div>
    );
};

export default InventoryList;