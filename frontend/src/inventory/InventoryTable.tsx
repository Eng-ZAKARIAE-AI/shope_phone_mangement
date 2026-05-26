import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, StockStatus } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  Search, 
  Plus, 
  Minus, 
  Edit3, 
  Trash2, 
  Smartphone, 
  AlertCircle, 
  ShoppingBag, 
  Watch, 
  Filter, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Grid
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce.ts';

interface InventoryTableProps {
  products: Product[];
  onEditProduct: (p: Product) => void;
  onAdjustStock: (product: Product, delta: number) => Promise<void>;
  onDeleteProduct: (product: Product) => Promise<void>;
  onOpenAddModal: () => void;
  onSeedSample: () => void;
}

export default function InventoryTable({
  products,
  onEditProduct,
  onAdjustStock,
  onDeleteProduct,
  onOpenAddModal,
  onSeedSample
}: InventoryTableProps) {
  const { isAdmin } = useAuth();
  
  // Search state & filters
  const [rawSearch, setRawSearch] = useState('');
  const debouncedSearch = useDebounce<string>(rawSearch, 300);
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'All'>('All');

  // Interactive Adjust state to track button spinner for optimistic response
  const [adjustingId, setAdjustingId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Sync back to first page upon filter shift
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, categoryFilter, statusFilter, pageSize]);

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
      p.sku.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || p.stockStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination math
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  const handleAdjustClick = async (prod: Product, delta: number) => {
    if (prod.quantity + delta < 0) return;
    
    const customKey = prod.id + (delta > 0 ? '-inc' : '-dec');
    setAdjustingId(customKey);
    try {
      await onAdjustStock(prod, delta);
    } catch (e) {
      console.error(e);
    } finally {
      setAdjustingId(null);
    }
  };

  const getStatusBadge = (status: StockStatus) => {
    switch (status) {
      case 'In Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            In Stock
          </span>
        );
      case 'Low Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Low Stock
          </span>
        );
      case 'Out of Stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  const getCategoryIcon = (cat: ProductCategory) => {
    switch (cat) {
      case 'Phones':
        return <Smartphone size={14} className="text-teal-500 dark:text-teal-400" />;
      case 'Watches':
        return <Watch size={14} className="text-indigo-500 dark:text-indigo-400" />;
      default:
        return <ShoppingBag size={14} className="text-slate-500 dark:text-slate-400" />;
    }
  };

  const resetFilters = () => {
    setRawSearch('');
    setCategoryFilter('All');
    setStatusFilter('All');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden" id="inventory-table-card">
      
      {/* Search and Filters Strip */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        
        {/* Real-time Debounced Search */}
        <div className="flex-1 max-w-md relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-400 dark:focus:border-teal-400 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400/50 transition-colors placeholder-slate-400"
            placeholder="Type device name, brand or SKU..."
            id="product-search-bar"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-xs">
            <Filter size={13} className="text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'All')}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 font-semibold focus:outline-none text-xs cursor-pointer"
              id="category-dropdown"
            >
              <option value="All">All Categories</option>
              <option value="Phones">Phones</option>
              <option value="Watches">Watches</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          {/* Stock Level Dropdown */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-xs">
            <Filter size={13} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StockStatus | 'All')}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 font-semibold focus:outline-none text-xs cursor-pointer"
              id="status-dropdown"
            >
              <option value="All">All Stock Levels</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {(rawSearch || categoryFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-teal-500 hover:underline font-semibold cursor-pointer"
              id="clear-filters-btn"
            >
              Clear Filters
            </button>
          )}

          {/* Add product button layout */}
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4.5 py-2 hover:opacity-90 outline-none text-xs font-bold rounded-xl text-slate-950 bg-teal-400 hover:bg-teal-300 dark:bg-teal-400 dark:hover:bg-teal-300 shadow-sm cursor-pointer transition-colors"
            id="add-device-btn"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Responsive table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="products-master-grid">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest select-none">
              <th className="px-6 py-4">Brand</th>
              <th className="px-6 py-4">Product Model</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Registered SKU</th>
              <th className="px-6 py-4 text-center">In-Hand Stock</th>
              <th className="px-6 py-4 text-right">Unit Price</th>
              <th className="px-6 py-4 text-center">Status Badge</th>
              <th className="px-6 py-4 text-right">Staff Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] text-slate-700 dark:text-slate-300">
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertCircle size={32} className="text-slate-300 dark:text-slate-700" />
                    <p className="font-semibold text-slate-500 dark:text-slate-400">Empty directory matching queries</p>
                    <p className="text-xs text-slate-400 dark:text-slate-505">Try clear filters or load default stocks list</p>
                    {products.length === 0 && (
                      <button
                        onClick={onSeedSample}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 cursor-pointer font-bold"
                      >
                        <Database size={13} />
                        <span>Seed Tecno Catalog</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((p) => {
                const isInc = adjustingId === p.id + '-inc';
                const isDec = adjustingId === p.id + '-dec';

                // Implement optimistic value styling
                const qtyStyle = p.quantity <= 0 ? 'text-rose-500 font-extrabold' : p.quantity < 5 ? 'text-amber-500 font-extrabold' : 'text-slate-900 dark:text-slate-100 font-bold';

                return (
                  <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors" id={`row-${p.id}`}>
                    <td className="px-6 py-4 select-none">
                      <span className="text-slate-400 dark:text-slate-505 font-bold uppercase tracking-wide text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {p.brand}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {p.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-405">
                        {getCategoryIcon(p.category)}
                        <span>{p.category}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 select-all uppercase">
                      {p.sku}
                    </td>
                    
                    {/* Stock level +/- adjustment buttons */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                        <button
                          onClick={() => handleAdjustClick(p, -1)}
                          disabled={p.quantity <= 0 || adjustingId !== null}
                          className="p-1 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 cursor-pointer transition-colors"
                          title="Reduce stock level (-1)"
                          id={`dec-button-${p.id}`}
                        >
                          {isDec ? (
                            <Loader2 size={12} className="animate-spin text-teal-550" />
                          ) : (
                            <Minus size={12} />
                          )}
                        </button>
                        <span className={`w-8 text-center text-sm ${qtyStyle}`} id={`qty-${p.id}`}>
                          {p.quantity}
                        </span>
                        <button
                          onClick={() => handleAdjustClick(p, 1)}
                          disabled={adjustingId !== null}
                          className="p-1 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-30 cursor-pointer transition-colors"
                          title="Increase stock level (+1)"
                          id={`inc-button-${p.id}`}
                        >
                          {isInc ? (
                            <Loader2 size={12} className="animate-spin text-teal-550" />
                          ) : (
                            <Plus size={12} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-slate-950 dark:text-white whitespace-nowrap">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(p.stockStatus)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 px-1">
                        <button
                          onClick={() => onEditProduct(p)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                          title="Modify product properties"
                          id={`edit-${p.id}`}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (!isAdmin) {
                              alert("Database Security Policy: Only Admin personnel may purge listings.");
                              return;
                            }
                            onDeleteProduct(p);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/25 rounded-lg cursor-pointer transition-all duration-200"
                          title={isAdmin ? "Purge listing" : "Requires Admin privileges"}
                          id={`delete-${p.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination control footer bar */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <span className="text-slate-550 dark:text-slate-400">
            Showing <strong className="font-bold text-slate-800 dark:text-slate-200">{startIndex + 1}</strong> to{' '}
            <strong className="font-bold text-slate-800 dark:text-slate-200">
              {Math.min(startIndex + pageSize, totalItems)}
            </strong>{' '}
            of <strong className="font-bold text-slate-800 dark:text-slate-200">{totalItems}</strong> entries
          </span>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer"
              id="prev-page"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-1 select-none">
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    currentPage === idx + 1
                      ? 'bg-teal-500 text-slate-950 dark:bg-teal-400 dark:text-slate-950 shadow-sm'
                      : 'border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-400 cursor-pointer'
                  }`}
                  id={`page-${idx+1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 cursor-pointer"
              id="next-page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
