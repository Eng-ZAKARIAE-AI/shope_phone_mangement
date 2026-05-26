import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc,
  setDoc,
  getDocs,
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, createAuditLog, handleFirestoreError, OperationType } from './services/firebase.ts';
import { useAuth, AuthProvider } from './context/AuthContext.tsx';
import { useTheme, ThemeProvider } from './context/ThemeContext.tsx';
import { Product, ProductInput, StockStatus, InventoryLog } from './types.ts';
import Header from './layout/Header.tsx';
import Sidebar from './layout/Sidebar.tsx';
import AnalyticsDashboard from './dashboard/AnalyticsDashboard.tsx';
import InventoryTable from './inventory/InventoryTable.tsx';
import AuditLogLedger from './pages/AuditLogLedger.tsx';
import StaffAccounts from './pages/StaffAccounts.tsx';
import LoginScreen from './pages/LoginScreen.tsx';
import ProductFormModal from './inventory/ProductFormModal.tsx';
import ConfirmModal from './ui/ConfirmModal.tsx';
import { Loader2, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export function InnerApp() {
  const { user, profile, loading, isAdmin, isSandboxMode } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Products and Audit Logs arrays
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [fetching, setFetching] = useState(true);

  // Modal Dialog Controllers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Toast / Status Alerts
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fire temporary toast notifications
  const triggerNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // Determine stock helper
  const computeStockStatus = (quantity: number): StockStatus => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity < 5) return 'Low Stock';
    return 'In Stock';
  };

  // 1. Real-time synchronizations from Firestore or sandbox LocalStorage
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLogs([]);
      setFetching(false);
      return;
    }

    if (isSandboxMode) {
      setFetching(true);
      const cachedProducts = localStorage.getItem('tecno_sandbox_products');
      const cachedLogs = localStorage.getItem('tecno_sandbox_logs');

      let productsList: Product[] = [];
      let logsList: InventoryLog[] = [];

      if (cachedProducts) {
        try {
          productsList = JSON.parse(cachedProducts);
        } catch (_) {}
      } else {
        productsList = [
          { id: 'mock-1', name: 'Tecno Phantom V Fold', brand: 'Tecno', category: 'Phones', sku: 'TEC-PHN-VFL-8812', quantity: 12, unitPrice: 1099.99, stockStatus: 'In Stock', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: 'admin@tecno.com' },
          { id: 'mock-2', name: 'Tecno Camon 30 Premier', brand: 'Tecno', category: 'Phones', sku: 'TEC-CMN-30P-1011', quantity: 24, unitPrice: 429.99, stockStatus: 'In Stock', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: 'admin@tecno.com' },
          { id: 'mock-3', name: 'Tecno Spark 20 Pro+', brand: 'Tecno', category: 'Phones', sku: 'TEC-SPK-20P-0442', quantity: 3, unitPrice: 199.99, stockStatus: 'Low Stock', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: 'admin@tecno.com' },
          { id: 'mock-4', name: 'Tecno Watch Pro 2', brand: 'Tecno', category: 'Watches', sku: 'TEC-WCH-PR2-9901', quantity: 0, unitPrice: 89.99, stockStatus: 'Out of Stock', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: 'admin@tecno.com' },
          { id: 'mock-5', name: 'Tecno Buds 3 Wireless', brand: 'Tecno', category: 'Accessories', sku: 'TEC-ACC-BD3-5502', quantity: 60, unitPrice: 29.99, stockStatus: 'In Stock', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), updatedBy: 'admin@tecno.com' },
        ];
        localStorage.setItem('tecno_sandbox_products', JSON.stringify(productsList));
      }

      if (cachedLogs) {
        try {
          logsList = JSON.parse(cachedLogs);
        } catch (_) {}
      } else {
        logsList = [
          { id: 'log-seed-1', productId: 'mock-1', productName: 'Tecno Phantom V Fold', operatorId: 'sandbox-admin-uid', operatorEmail: 'admin@tecno.com', action: 'seed', preQuantity: 0, postQuantity: 12, timestamp: new Date().toISOString() },
          { id: 'log-seed-2', productId: 'mock-2', productName: 'Tecno Camon 30 Premier', operatorId: 'sandbox-admin-uid', operatorEmail: 'admin@tecno.com', action: 'seed', preQuantity: 0, postQuantity: 24, timestamp: new Date().toISOString() },
        ];
        localStorage.setItem('tecno_sandbox_logs', JSON.stringify(logsList));
      }

      setProducts(productsList);
      setLogs(logsList);
      setFetching(false);
      return;
    }

    setFetching(true);

    // Sync products live
    const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(items);
      setFetching(false);
    }, (error) => {
      console.error("Products subscription error", error);
      triggerNotification("Permissions error: verify Firebase security rules layout.", "error");
      handleFirestoreError(error, OperationType.GET, 'products');
    });

    // Sync audit logs live
    const logsQuery = query(collection(db, 'inventory_logs'), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsList: InventoryLog[] = [];
      snapshot.forEach((docSnap) => {
        logsList.push({ id: docSnap.id, ...docSnap.data() } as InventoryLog);
      });
      setLogs(logsList.slice(0, 100)); // Limit to most recent 100 items
    }, (error) => {
      console.error("Audit Logs subscription error", error);
      handleFirestoreError(error, OperationType.GET, 'inventory_logs');
    });

    return () => {
      unsubscribeProducts();
      unsubscribeLogs();
    };
  }, [user, isSandboxMode]);

  // Seeding default Tecno smartphone catalog to expedite testing
  const seedSampleCatalog = async () => {
    if (!user) return;
    try {
      const sampleItems: ProductInput[] = [
        { name: 'Tecno Phantom V Fold', brand: 'Tecno', category: 'Phones', sku: 'TEC-PHN-VFL-8812', quantity: 12, unitPrice: 1099.99 },
        { name: 'Tecno Camon 30 Premier', brand: 'Tecno', category: 'Phones', sku: 'TEC-CMN-30P-1011', quantity: 24, unitPrice: 429.99 },
        { name: 'Tecno Spark 20 Pro+', brand: 'Tecno', category: 'Phones', sku: 'TEC-SPK-20P-0442', quantity: 3, unitPrice: 199.99 },
        { name: 'Tecno Watch Pro 2', brand: 'Tecno', category: 'Watches', sku: 'TEC-WCH-PR2-9901', quantity: 0, unitPrice: 89.99 },
        { name: 'Tecno Buds 3 Wireless', brand: 'Tecno', category: 'Accessories', sku: 'TEC-ACC-BD3-5502', quantity: 60, unitPrice: 29.99 },
      ];

      if (isSandboxMode) {
        const seededProducts = [...products];
        const seededLogs = [...logs];
        sampleItems.forEach((item, index) => {
          const qty = item.quantity;
          const status = computeStockStatus(qty);
          const newProduct: Product = {
            id: `mock-${Date.now()}-${index}`,
            name: item.name,
            brand: item.brand,
            category: item.category,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            stockStatus: status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: user.email || 'System Seed'
          };
          seededProducts.unshift(newProduct);

          const newLog: InventoryLog = {
            id: `mock-log-${Date.now()}-${index}`,
            productId: newProduct.id,
            productName: item.name,
            operatorId: user.uid,
            operatorEmail: user.email || 'system_seed@tecno.com',
            action: 'seed',
            preQuantity: 0,
            postQuantity: qty,
            timestamp: new Date().toISOString()
          };
          seededLogs.unshift(newLog);
        });

        setProducts(seededProducts);
        setLogs(seededLogs);
        localStorage.setItem('tecno_sandbox_products', JSON.stringify(seededProducts));
        localStorage.setItem('tecno_sandbox_logs', JSON.stringify(seededLogs));
        triggerNotification("Tecno Product Catalog seeded successfully in local sandbox!", "success");
        return;
      }

      for (const item of sampleItems) {
        const qty = item.quantity;
        const status: StockStatus = qty <= 0 ? 'Out of Stock' : qty < 5 ? 'Low Stock' : 'In Stock';
        
        let docRef;
        try {
          docRef = await addDoc(collection(db, 'products'), {
            ...item,
            stockStatus: status,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: user.email || 'System Seed'
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'products');
        }

        await createAuditLog(
          docRef!.id,
          item.name,
          user.uid,
          user.email || 'system_seed@tecno.com',
          'seed',
          0,
          qty
        );
      }
      triggerNotification("Tecno Product Catalog seeded successfully with metrics!", "success");
    } catch (e: any) {
      triggerNotification(`Seeding error: ${e.message}`, 'error');
    }
  };

  // Add / Edit submission
  const handleFormSubmit = async (input: ProductInput) => {
    if (!user) throw new Error("A user authentication token is required.");

    const computedStatus = computeStockStatus(input.quantity);

    if (isSandboxMode) {
      let currentProducts = [...products];
      let newLogs = [...logs];

      if (selectedProduct) {
        currentProducts = currentProducts.map(p => {
          if (p.id === selectedProduct.id) {
            return {
              ...p,
              name: input.name,
              brand: input.brand,
              category: input.category,
              sku: input.sku,
              quantity: input.quantity,
              unitPrice: input.unitPrice,
              stockStatus: computedStatus,
              updatedAt: new Date().toISOString(),
              updatedBy: user.email || 'anonymous'
            };
          }
          return p;
        });

        const newLog: InventoryLog = {
          id: `mock-log-${Date.now()}`,
          productId: selectedProduct.id,
          productName: input.name,
          operatorId: user.uid,
          operatorEmail: user.email || 'sandbox@tecno.com',
          action: 'update',
          preQuantity: selectedProduct.quantity,
          postQuantity: input.quantity,
          timestamp: new Date().toISOString()
        };
        newLogs.unshift(newLog);
        triggerNotification(`Model "${input.name}" properties refreshed successfully.`);
      } else {
        const newProd: Product = {
          id: `mock-${Date.now()}`,
          name: input.name,
          brand: input.brand,
          category: input.category,
          sku: input.sku,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          stockStatus: computedStatus,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          updatedBy: user.email || 'anonymous'
        };
        currentProducts.unshift(newProd);

        const newLog: InventoryLog = {
          id: `mock-log-${Date.now()}`,
          productId: newProd.id,
          productName: input.name,
          operatorId: user.uid,
          operatorEmail: user.email || 'sandbox@tecno.com',
          action: 'create',
          preQuantity: 0,
          postQuantity: input.quantity,
          timestamp: new Date().toISOString()
        };
        newLogs.unshift(newLog);
        triggerNotification(`Device "${input.name}" has been successfully appended to sandbox catalog.`);
      }

      setProducts(currentProducts);
      setLogs(newLogs);
      localStorage.setItem('tecno_sandbox_products', JSON.stringify(currentProducts));
      localStorage.setItem('tecno_sandbox_logs', JSON.stringify(newLogs));
      return;
    }

    if (selectedProduct) {
      // Modify existing product
      const productRef = doc(db, 'products', selectedProduct.id);
      try {
        await updateDoc(productRef, {
          name: input.name,
          brand: input.brand,
          category: input.category,
          sku: input.sku,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          stockStatus: computedStatus,
          updatedAt: serverTimestamp(),
          updatedBy: user.email || 'anonymous'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${selectedProduct.id}`);
      }

      // Log transformation action
      await createAuditLog(
        selectedProduct.id,
        input.name,
        user.uid,
        user.email || 'staff@tecno.com',
        'update',
        selectedProduct.quantity,
        input.quantity
      );

      triggerNotification(`Model "${input.name}" properties refreshed successfully.`);
    } else {
      // Create new listing
      const productsRef = collection(db, 'products');
      let docRef;
      try {
        docRef = await addDoc(productsRef, {
          ...input,
          stockStatus: computedStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: user.email || 'anonymous'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'products');
      }

      // Log transformation action
      await createAuditLog(
        docRef!.id,
        input.name,
        user.uid,
        user.email || 'staff@tecno.com',
        'create',
        0,
        input.quantity
      );

      triggerNotification(`Device "${input.name}" has been successfully appended to live catalog.`);
    }
  };

  // Real-time stock increments / decrements (Optimistic Action with instant fallbacks)
  const handleAdjustStock = async (product: Product, delta: number) => {
    if (!user) return;
    const oldQty = product.quantity;
    const nextQty = oldQty + delta;
    if (nextQty < 0) return;

    const compStatus = computeStockStatus(nextQty);

    if (isSandboxMode) {
      const updatedProducts = products.map(p => p.id === product.id ? { ...p, quantity: nextQty, stockStatus: compStatus } : p);
      const updatedLogs = [...logs];
      const newLog: InventoryLog = {
        id: `mock-log-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        operatorId: user.uid,
        operatorEmail: user.email || 'sandbox@tecno.com',
        action: delta > 0 ? 'adjust_increment' : 'adjust_decrement',
        preQuantity: oldQty,
        postQuantity: nextQty,
        timestamp: new Date().toISOString()
      };
      updatedLogs.unshift(newLog);

      setProducts(updatedProducts);
      setLogs(updatedLogs);
      localStorage.setItem('tecno_sandbox_products', JSON.stringify(updatedProducts));
      localStorage.setItem('tecno_sandbox_logs', JSON.stringify(updatedLogs));
      triggerNotification(`Stock level updated to ${nextQty} modules.`);
      return;
    }

    // 1. Instantly trigger optimistic update on local copy for responsive feed clicks
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, quantity: nextQty, stockStatus: compStatus } : p));

    try {
      const productRef = doc(db, 'products', product.id);
      try {
        await updateDoc(productRef, {
          quantity: nextQty,
          stockStatus: compStatus,
          updatedAt: serverTimestamp(),
          updatedBy: user.email || 'staff_control'
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
      }

      // Audit Logger
      await createAuditLog(
        product.id,
        product.name,
        user.uid,
        user.email || 'staff@tecno.com',
        delta > 0 ? 'adjust_increment' : 'adjust_decrement',
        oldQty,
        nextQty
      );

    } catch (e: any) {
      // 2. Rollback to original state on server exception
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      let errMsg = e.message;
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed.error) errMsg = parsed.error;
      } catch (_) {}
      triggerNotification(`Adjustment rejected: ${errMsg}`, "error");
    }
  };

  // Delete product action trigger (Confirmation)
  const handleTriggerDelete = async (product: Product) => {
    if (!isAdmin) {
      triggerNotification("Required validation: purging items is strictly prohibited unless authorized as Admin.", "error");
      return;
    }
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const executeDeleteProduct = async () => {
    if (!productToDelete || !user) return;

    if (isSandboxMode) {
      const updatedProducts = products.filter(p => p.id !== productToDelete.id);
      const updatedLogs = [...logs];
      const newLog: InventoryLog = {
        id: `mock-log-${Date.now()}`,
        productId: productToDelete.id,
        productName: productToDelete.name,
        operatorId: user.uid,
        operatorEmail: user.email || 'sandbox@tecno.com',
        action: 'delete',
        preQuantity: productToDelete.quantity,
        postQuantity: 0,
        timestamp: new Date().toISOString()
      };
      updatedLogs.unshift(newLog);

      setProducts(updatedProducts);
      setLogs(updatedLogs);
      localStorage.setItem('tecno_sandbox_products', JSON.stringify(updatedProducts));
      localStorage.setItem('tecno_sandbox_logs', JSON.stringify(updatedLogs));
      triggerNotification(`Purged "${productToDelete.name}" catalog record successfully.`);
      setProductToDelete(null);
      return;
    }

    try {
      try {
        await deleteDoc(doc(db, 'products', productToDelete.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${productToDelete.id}`);
      }

      await createAuditLog(
        productToDelete.id,
        productToDelete.name,
        user.uid,
        user.email || 'admin@tecno.com',
        'delete',
        productToDelete.quantity,
        0
      );

      triggerNotification(`Purged "${productToDelete.name}" catalog record successfully.`);
    } catch (e: any) {
      let errMsg = e.message;
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed.error) errMsg = parsed.error;
      } catch (_) {}
      triggerNotification(`Delete rejected: ${errMsg}`, "error");
    } finally {
      setProductToDelete(null);
    }
  };

  // Navigation page views router
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard products={products} activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'inventory':
        return (
          <InventoryTable
            products={products}
            onOpenAddModal={() => {
              setSelectedProduct(null);
              setIsFormOpen(true);
            }}
            onEditProduct={(p) => {
              setSelectedProduct(p);
              setIsFormOpen(true);
            }}
            onAdjustStock={handleAdjustStock}
            onDeleteProduct={handleTriggerDelete}
            onSeedSample={seedSampleCatalog}
          />
        );
      case 'audit':
        return <AuditLogLedger logs={logs} />;
      case 'team':
        return <StaffAccounts />;
      default:
        return <div className="p-8">Workplace module under construction</div>;
    }
  };

  // Outer gate login screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-white">
        <Loader2 className="animate-spin text-teal-400" size={36} />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Syncing stockroom databases...
        </span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onNotify={triggerNotification} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors" id="applet-viewport-root">
      
      {/* Toast Alert Badge Overlay */}
      {alert && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4.5 bg-slate-900 dark:bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm animate-fade-in" id="global-toast">
          {alert.type === 'success' ? (
            <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
          ) : (
            <ShieldAlert className="text-rose-450 shrink-0" size={20} />
          )}
          <div className="flex-1">
            <span className="text-[10px] uppercase font-black tracking-widest block leading-none pb-1.5 text-slate-450">
              System Notification
            </span>
            <span className="text-xs font-bold text-white leading-tight">
              {alert.message}
            </span>
          </div>
        </div>
      )}

      {/* Frame navbar */}
      <Header onNotify={triggerNotification} />

      {/* Main Grid layout */}
      <div className="max-w-7xl mx-auto flex">
        
        {/* Navigation side panels */}
        <div className="hidden md:block">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} productsCount={products.length} />
        </div>

        {/* Console Container scroll */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-full">
          
          {/* Module Title */}
          <div className="mb-6 select-none flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                {activeTab === 'dashboard' ? 'Overview Stats' : activeTab === 'inventory' ? 'Stockroom Catalog' : activeTab === 'audit' ? 'Auditing Ledger' : 'Team Members'}
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-505 font-medium mt-1">
                {activeTab === 'dashboard' ? 'High-Level Electronics Stock Distribution Metrics' : activeTab === 'inventory' ? 'Modify catalog pricing, specifications, and device counts' : activeTab === 'audit' ? 'Historic system alteration traces' : 'System role privilege settings'}
              </p>
            </div>

            {/* In-view tab indicator (particularly for smaller screens lacking sidebar) */}
            <div className="md:hidden flex items-center gap-1.5">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer"
                id="responsive-view-switcher"
              >
                <option value="dashboard">Dashboard</option>
                <option value="inventory">Inventory Catalog</option>
                <option value="audit">Audit trace</option>
                <option value="team">Staff Accounts</option>
              </select>
            </div>
          </div>

          {/* Core dynamic content */}
          {fetching ? (
            <div className="flex items-center justify-center py-20 gap-2">
              <Loader2 className="animate-spin text-teal-500" size={20} />
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">Acquiring documents...</span>
            </div>
          ) : (
            renderTabContent()
          )}

        </main>
      </div>

      {/* Active edit/creation properties form dialog modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleFormSubmit}
        product={selectedProduct}
      />

      {/* Destructive confirm action dialog modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={executeDeleteProduct}
        title="Confirm Purge Stockroom Item"
        description={`This destructive action will permanently remove the device catalog listing for "${productToDelete?.name}" and audit the record. This action is irreversible.`}
        confirmText="Confirm Purge"
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
