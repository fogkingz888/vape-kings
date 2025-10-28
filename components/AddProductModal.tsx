import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Product } from '../types';
import geminiService from '../services/geminiService';
import { CameraIcon, BarcodeIcon } from './icons';

type ProductWithStock = Product & { stock: number };

type ProductModalProps = {
  onClose: () => void;
  onAddProduct: (newProduct: Omit<Product, 'id' | 'created_at'>, initialStock: number, imageFile?: File | null) => void;
  onUpdateProduct: (updatedProduct: Product, imageFile?: File | null) => void;
  allProducts: ProductWithStock[];
  productToEdit?: ProductWithStock | null;
};

const ProductModal: React.FC<ProductModalProps> = ({ onClose, onAddProduct, onUpdateProduct, allProducts, productToEdit }) => {
  const isEditMode = !!productToEdit;
  const [mode, setMode] = useState<'ai' | 'manual'>(isEditMode ? 'manual' : 'ai');
  const [product, setProduct] = useState<Partial<Omit<Product, 'id' | 'created_at'>>>({ name: '', brand: '', category: '', variant: '', price: 0, size: '', barcode: '' });
  const [initialStock, setInitialStock] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isEditMode && productToEdit) {
      setProduct({ ...productToEdit });
      setImagePreview(productToEdit.image_url);
    }
  }, [productToEdit, isEditMode]);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiScan = async () => {
    if (!imageFile) {
      setError("Please select an image first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = async (event) => {
        const base64Image = (event.target?.result as string).split(',')[1];
        if (base64Image) {
          const info = await geminiService.getProductInfoFromImage(base64Image, imageFile.type);
          if (info) {
            setProduct(prev => ({
              ...prev,
              name: info.name,
              brand: info.brand,
              category: info.category,
              variant: info.flavor,
              size: info.size,
            }));
            setMode('manual'); // Switch to manual entry for review
          } else {
            setError("AI could not extract product information. Please try another image or enter manually.");
          }
        }
      };
    } catch (err) {
      setError("An error occurred during AI scanning.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
        const updatedProduct: Product = {
            ...(productToEdit as Product),
            ...(product as Partial<Product>),
            // Use existing preview or old URL as a fallback for display before parent logic runs
            image_url: imagePreview || productToEdit?.image_url || '',
        };
        onUpdateProduct(updatedProduct, imageFile);
    } else {
        const newProduct: Omit<Product, 'id' | 'created_at'> = {
            // Set a temporary value, parent will overwrite this.
            image_url: imagePreview || '',
            name: product.name || 'N/A',
            brand: product.brand || 'N/A',
            category: product.category || 'N/A',
            variant: product.variant || 'N/A',
            price: product.price || 0,
            size: product.size || 'N/A',
            barcode: product.barcode || 'N/A',
        };
        onAddProduct(newProduct, initialStock, imageFile);
    }
    onClose();
  };

  const FormField: React.FC<{ label: string; name: keyof Omit<Product, 'id'|'created_at'|'image_url'>; type?: string; required?: boolean }> = ({ label, name, type = 'text', required = true }) => (
    <div>
      <label className="block text-sm font-bold uppercase tracking-wider text-hiphop-gray mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={product[name] as string || ''}
        onChange={handleChange}
        required={required}
        className="w-full bg-hiphop-800 border-2 border-hiphop-700 rounded-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-hiphop-cyan"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-hiphop-900 rounded-sm shadow-xl p-8 w-full max-w-3xl transform transition-all border-2 border-hiphop-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-3xl font-marker text-hiphop-light">{isEditMode ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="text-hiphop-gray hover:text-white text-3xl">&times;</button>
        </div>

        <div className="flex border-b-2 border-hiphop-800 mb-6">
          {!isEditMode && (
            <button onClick={() => setMode('ai')} className={`flex items-center space-x-2 pb-2 px-4 text-lg font-bold uppercase transition-colors ${mode === 'ai' ? 'border-b-4 border-hiphop-cyan text-hiphop-cyan' : 'text-hiphop-gray'}`}>
                <CameraIcon /><span>AI Scan</span>
            </button>
          )}
          <button onClick={() => setMode('manual')} className={`flex items-center space-x-2 pb-2 px-4 text-lg font-bold uppercase transition-colors ${mode === 'manual' ? 'border-b-4 border-hiphop-magenta text-hiphop-magenta' : 'text-hiphop-gray'}`}>
            <BarcodeIcon /><span>{isEditMode ? 'Edit Details' : 'Manual Entry'}</span>
          </button>
        </div>

        {mode === 'ai' && !isEditMode && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="flex flex-col items-center justify-center p-4 border-4 border-dashed border-hiphop-800 rounded-sm h-64 bg-hiphop-950">
                {imagePreview ? (
                  <img src={imagePreview} alt={product.name || 'Product image preview'} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-center text-hiphop-gray">
                    <CameraIcon className="w-16 h-16 mx-auto mb-2 text-hiphop-700" />
                    <p>Upload a photo</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-4">
                <button onClick={() => fileInputRef.current?.click()} className="bg-hiphop-700 hover:bg-hiphop-800 text-white font-bold py-3 px-4 rounded-sm uppercase tracking-wider">
                  {imagePreview ? 'Change Image' : 'Select Image'}
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                <button onClick={handleAiScan} disabled={!imageFile || isLoading} className="bg-hiphop-cyan hover:bg-opacity-80 text-hiphop-950 font-bold py-3 px-4 rounded-sm uppercase tracking-wider disabled:bg-hiphop-700 disabled:cursor-not-allowed">
                  {isLoading ? 'Scanning...' : 'Scan with AI'}
                </button>
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>
            </div>
          </div>
        )}

        {(mode === 'manual' || isEditMode) && (
          <form onSubmit={handleSubmit} className="mt-6">
             <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 flex-shrink-0">
                    <div className="flex flex-col items-center justify-center p-2 border-2 border-dashed border-hiphop-800 rounded-sm h-64 bg-hiphop-950">
                    {imagePreview ? (
                        <img src={imagePreview} alt={product.name || 'Product Image'} className="max-h-full max-w-full object-contain" />
                    ) : (
                        <div className="text-center text-hiphop-gray">
                        <CameraIcon className="w-16 h-16 mx-auto mb-2 text-hiphop-700" />
                        <p>Upload a photo</p>
                        </div>
                    )}
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 w-full bg-hiphop-700 hover:bg-hiphop-800 text-white font-bold py-2 px-4 rounded-sm uppercase tracking-wider text-sm transition-colors">
                    {imagePreview ? 'Change Image' : 'Select Image'}
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                </div>

                <div className="flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Product Name" name="name" />
                        <FormField label="Brand" name="brand" />
                        <FormField label="Category" name="category" />
                        <FormField label="Flavor/Variant" name="variant" />
                        <FormField label="Price (₱)" name="price" type="number" />
                        <FormField label="Size (e.g., 30ml)" name="size" />
                        <FormField label="Barcode" name="barcode" />
                        {!isEditMode && (
                            <div>
                                <label className="block text-sm font-bold uppercase tracking-wider text-hiphop-gray mb-1">Initial Stock</label>
                                <input
                                    type="number"
                                    value={initialStock}
                                    onChange={(e) => setInitialStock(Number(e.target.value))}
                                    required
                                    className="w-full bg-hiphop-800 border-2 border-hiphop-700 rounded-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-hiphop-cyan"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8">
              <button type="button" onClick={onClose} className="bg-hiphop-800 hover:bg-hiphop-700 text-hiphop-light font-bold py-2 px-4 rounded-sm uppercase">Cancel</button>
              <button type="submit" className="bg-hiphop-magenta hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-sm uppercase">{isEditMode ? 'Update Product' : 'Add Product'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProductModal;
