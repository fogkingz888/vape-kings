import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, Role, Product, StockLevel, Sale, AuditLog, StockForecast, ReorderSuggestion } from '../types';
import { supabase } from '../App';
import { InventoryIcon, PosIcon, ReportsIcon, AuditIcon, LogoutIcon, UserIcon, TodaysSalesIcon } from './icons';
import InventoryList from './InventoryList';
import PosScreen from './PosScreen';
import ReportsScreen from './ReportsScreen';
import AuditLogScreen from './AuditLogScreen';
import SettingsScreen from './SettingsScreen';
import TodaysSalesScreen from './TodaysSalesScreen';

type DashboardProps = {
  user: User;
  onLogout: () => void;
  businessName: string;
  onBusinessNameChange: (newName: string) => void;
};

type Tab = 'inventory' | 'pos' | 'todays-sales' | 'reports' | 'audit' | 'settings';
type ProductWithStock = Product & { stock: number };

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, businessName, onBusinessNameChange }) => {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [isPrinterEnabled, setIsPrinterEnabled] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflineSales, setHasOfflineSales] = useState(false);
  
  // Mocked AI data until backend is implemented
  const [stockForecasts] = useState<StockForecast[]>([]);
  const [reorderSuggestions] = useState<ReorderSuggestion[]>([]);

  const checkOfflineSales = useCallback(() => {
    const offlineSalesRaw = localStorage.getItem('offlineSales');
    if (offlineSalesRaw) {
        try {
            const offlineCarts = JSON.parse(offlineSalesRaw);
            setHasOfflineSales(Array.isArray(offlineCarts) && offlineCarts.length > 0);
        } catch {
            setHasOfflineSales(false);
        }
    } else {
        setHasOfflineSales(false);
    }
  }, []);

  const addAuditLog = useCallback(async (action: string, details: string) => {
    const newLog: Omit<AuditLog, 'id' | 'created_at'> = {
      user_id: user.id,
      user_name: user.name,
      action,
      details,
    };
    const { data, error } = await supabase.from('audit_logs').insert(newLog).select().single();
    if (error) console.error("Error adding audit log:", error);
    else if (data) setAuditLogs(prev => [data, ...prev]);
  }, [user.id, user.name]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [productsRes, stockLevelsRes, salesRes, auditLogsRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('stock_levels').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false })
    ]);

    if(productsRes.data) setProducts(productsRes.data);
    if(stockLevelsRes.data) setStockLevels(stockLevelsRes.data);
    if(salesRes.data) setSales(salesRes.data);
    if(auditLogsRes.data) setAuditLogs(auditLogsRes.data);
    
    setLoading(false);
  }, []);
  
  const handleUpdateStock = useCallback(async (productId: string, newQuantity: number, reason: string) => {
    if (reason === 'Manual Update' && user.role !== Role.Owner) {
        alert("You are not authorized to manually update stock.");
        return;
    }
    const { error } = await supabase.from('stock_levels').update({ quantity: newQuantity }).eq('product_id', productId);
    if(error) console.error(error);
    else {
      const productName = products.find(p => p.id === productId)?.name || 'Unknown Product';
      addAuditLog(reason, `${reason === 'Sale' ? 'Sold' : 'Updated'} stock for ${productName}. New quantity: ${newQuantity}.`);
    }
  }, [user.role, products, addAuditLog]);

  const handleNewSale = useCallback(async (cart: { product: Product; quantity: number }[]) => {
    const salesToInsert = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        total_price: item.product.price * item.quantity,
        date: new Date().toISOString(),
        branch_id: user.branch_id,
        user_id: user.id,
    }));

    const { error } = await supabase.from('sales').insert(salesToInsert);
    if (error) { console.error(error); return; }

    for (const item of cart) {
        const currentStock = stockLevels.find(s => s.product_id === item.product.id);
        if (currentStock) {
            await handleUpdateStock(item.product.id, currentStock.quantity - item.quantity, 'Sale');
        }
    }
  }, [user.id, user.branch_id, stockLevels, handleUpdateStock]);

  const syncOfflineSales = useCallback(async () => {
    const offlineSalesRaw = localStorage.getItem('offlineSales');
    if (!offlineSalesRaw) return;

    try {
        const offlineCarts = JSON.parse(offlineSalesRaw) as { product: Product; quantity: number }[][];
        if (Array.isArray(offlineCarts) && offlineCarts.length > 0) {
            console.log(`Syncing ${offlineCarts.length} offline sales.`);
            await addAuditLog('Sync Offline Sales', `Syncing ${offlineCarts.length} sales recorded while offline.`);
            
            for (const cart of offlineCarts) {
                await handleNewSale(cart);
            }
            
            localStorage.removeItem('offlineSales');
            checkOfflineSales();
            console.log('Offline sales synced and cleared from local storage.');
            alert('Offline sales have been successfully synced!');
            fetchData(); // Refresh data after sync
        }
    } catch (error) {
        console.error("Failed to parse or sync offline sales:", error);
        alert("There was an error syncing offline sales. They have been kept for the next attempt.");
    }
  }, [addAuditLog, handleNewSale, fetchData, checkOfflineSales]);
  
  useEffect(() => {
    fetchData();

    const changes = supabase.channel('table-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Change received!', payload);
        fetchData(); // Refetch all data on any change for simplicity
      })
      .subscribe();
      
    return () => {
        supabase.removeChannel(changes);
    };
  }, [fetchData]);

  useEffect(() => {
    checkOfflineSales();
    const handleOnline = () => {
        setIsOnline(true);
        setTimeout(() => syncOfflineSales(), 2000); // Delay to ensure stable connection
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    if (navigator.onLine) {
        syncOfflineSales();
    }
    
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineSales, checkOfflineSales]);
  
  const handleTogglePrinter = useCallback(() => {
    setIsPrinterEnabled(prev => !prev);
  }, []);

  const uploadProductImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    try {
        const { error: uploadError } = await supabase.storage
            .from('product_images') // NOTE: Bucket 'product_images' must exist and have public read access.
            .upload(filePath, file);
        
        if (uploadError) {
            throw uploadError;
        }
    
        const { data } = supabase.storage
            .from('product_images')
            .getPublicUrl(filePath);
    
        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Image upload failed. Please try again.');
        return null;
    }
  };

  const handleAddProduct = async (newProductData: Omit<Product, 'id' | 'created_at'>, initialStock: number, imageFile?: File | null) => {
    let finalProductData = { ...newProductData };

    if (imageFile) {
        const publicUrl = await uploadProductImage(imageFile);
        if (publicUrl) {
            finalProductData.image_url = publicUrl;
        } else {
            finalProductData.image_url = `https://picsum.photos/seed/${Date.now()}/200/200`;
        }
    } else {
        finalProductData.image_url = `https://picsum.photos/seed/${Date.now()}/200/200`;
    }

    const { data: newProduct, error: productError } = await supabase.from('products').insert(finalProductData).select().single();
    if (productError) { console.error(productError); return; }
    if (newProduct) {
        const newStock: Omit<StockLevel, 'id'> = {
          product_id: newProduct.id,
          branch_id: user.branch_id,
          quantity: initialStock,
        };
        const { error: stockError } = await supabase.from('stock_levels').insert(newStock);
        if (stockError) console.error(stockError);
        else addAuditLog('Add Product', `Added new product: ${newProduct.name} with stock ${initialStock}.`);
    }
  };

  const handleUpdateProduct = async (updatedProductData: Product, imageFile?: File | null) => {
    if (user.role !== Role.Owner) {
        alert("You are not authorized to perform this action.");
        return;
    }

    let finalProductData = { ...updatedProductData };

    if (imageFile) {
        const publicUrl = await uploadProductImage(imageFile);
        if (publicUrl) {
            finalProductData.image_url = publicUrl;
        }
    }

    const { error } = await supabase.from('products').update(finalProductData).eq('id', finalProductData.id);
    if (error) console.error(error);
    else addAuditLog('Update Product', `Updated details for product: ${finalProductData.name}.`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (user.role !== Role.Owner) {
        alert("You are not authorized to perform this action.");
        return;
    }
    const productName = products.find(p => p.id === productId)?.name || 'Unknown Product';
    // Cascading delete should be set up in Supabase DB policies for stock_levels
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if(error) console.error(error);
    else addAuditLog('Delete Product', `Deleted product: ${productName}.`);
  };
  
  const handleUsernameChangeWithAudit = async (newUsername: string) => {
    const oldUsername = user.name;
    const { error } = await supabase.from('profiles').update({ username: newUsername, has_changed_username: true }).eq('id', user.id);
    if (error) {
        return { success: false, message: error.message };
    }
    await addAuditLog('Change Username', `Changed username from '${oldUsername}' to '${newUsername}'.`);
    
    // Manually update audit logs with new username for consistency
    const { error: logUpdateError } = await supabase.from('audit_logs').update({ user_name: newUsername }).eq('user_id', user.id);
    if(logUpdateError) console.error("Error updating past audit logs", logUpdateError);

    return { success: true, message: 'Username updated successfully.' };
  };

  const productStockMap = useMemo(() => {
    return products.map(product => {
      const stock = stockLevels.find(s => s.product_id === product.id);
      return { ...product, stock: stock ? stock.quantity : 0 };
    });
  }, [products, stockLevels]);
  
  const salesToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter(sale => sale.date.startsWith(today));
  }, [sales]);

  const NavItem: React.FC<{ tabName: Tab; icon: React.ReactElement; label: string }> = ({ tabName, icon, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center space-x-4 px-4 py-3 rounded w-full text-left transition-all duration-200 group ${
        activeTab === tabName ? 'bg-hiphop-cyan text-hiphop-950 shadow-lg' : 'hover:bg-hiphop-800 text-hiphop-gray'
      }`}
    >
      <span className={activeTab === tabName ? 'text-hiphop-950' : 'text-hiphop-cyan group-hover:text-hiphop-gold'}>{icon}</span>
      <span className="font-bold uppercase tracking-wider text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-hiphop-900">
      <aside className="w-64 bg-hiphop-950 p-4 flex flex-col justify-between border-r-2 border-hiphop-800">
        <div>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-marker text-hiphop-light">{businessName}</h1>
            <p className="text-sm text-hiphop-gray mt-2">Welcome, {user.name}</p>
            <div className="flex items-center justify-center mt-2 space-x-2 text-hiphop-gray">
                <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                <span className="text-xs font-bold uppercase">{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>
             {hasOfflineSales && (
                <button 
                    onClick={syncOfflineSales} 
                    disabled={!isOnline}
                    className="mt-3 text-xs bg-hiphop-gold text-hiphop-950 font-bold py-1 px-3 rounded-sm uppercase disabled:bg-hiphop-700 disabled:cursor-not-allowed transition-colors"
                >
                    Sync Offline Sales
                </button>
            )}
          </div>
          <nav className="space-y-3">
            <NavItem tabName="inventory" icon={<InventoryIcon />} label="Inventory" />
            <NavItem tabName="pos" icon={<PosIcon />} label="Point of Sale" />
            <NavItem tabName="todays-sales" icon={<TodaysSalesIcon />} label="Today's Sales" />

            {user.role === Role.Owner && (
              <>
                <NavItem tabName="reports" icon={<ReportsIcon />} label="Reports & AI" />
                <NavItem tabName="audit" icon={<AuditIcon />} label="Audit Trail" />
              </>
            )}
             <NavItem tabName="settings" icon={<UserIcon />} label="Settings" />
          </nav>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-4 px-4 py-3 rounded w-full text-left text-hiphop-gray hover:bg-hiphop-800 transition-colors duration-200 group"
        >
          <span className="text-hiphop-magenta group-hover:text-hiphop-gold"><LogoutIcon /></span>
          <span className="font-bold uppercase tracking-wider text-sm">Logout</span>
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-hiphop-900">
        {loading ? <div className="text-center text-lg">Loading data...</div> :
        <>
            {activeTab === 'inventory' && <InventoryList user={user} productStockMap={productStockMap} onAddProduct={handleAddProduct} onUpdateStock={handleUpdateStock} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />}
            {activeTab === 'pos' && <PosScreen productStockMap={productStockMap} onNewSale={handleNewSale} isPrinterEnabled={isPrinterEnabled} businessName={businessName} isOnline={isOnline} />}
            {activeTab === 'todays-sales' && <TodaysSalesScreen user={user} sales={salesToday} productStockMap={productStockMap} />}
            {activeTab === 'reports' && user.role === Role.Owner && <ReportsScreen sales={sales} productStockMap={productStockMap} stockForecasts={stockForecasts} reorderSuggestions={reorderSuggestions}/>}
            {activeTab === 'audit' && user.role === Role.Owner && <AuditLogScreen logs={auditLogs} />}
            {activeTab === 'settings' && <SettingsScreen user={user} onUsernameChange={handleUsernameChangeWithAudit} businessName={businessName} onBusinessNameChange={onBusinessNameChange} addAuditLog={addAuditLog} isPrinterEnabled={isPrinterEnabled} onTogglePrinter={handleTogglePrinter} onLogout={onLogout} />}
        </>
        }
      </main>
    </div>
  );
};

export default Dashboard;
