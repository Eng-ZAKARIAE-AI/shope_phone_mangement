import React, { useState, useEffect } from 'react';
import { Product, ProductInput, ProductCategory } from '../types.ts';
import { X, Save, Sparkles, AlertCircle } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductInput) => Promise<void>;
  product?: Product | null;
}

export default function ProductFormModal({ isOpen, onClose, onSubmit, product }: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Tecno');
  const [category, setCategory] = useState<ProductCategory>('Phones');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setBrand(product.brand);
      setCategory(product.category);
      setSku(product.sku);
      setQuantity(product.quantity);
      setUnitPrice(product.unitPrice);
    } else {
      setName('');
      setBrand('Tecno');
      setCategory('Phones');
      setSku('');
      setQuantity(0);
      setUnitPrice(0);
    }
    setErrorMessage(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleGenerateSku = () => {
    const catCode = category === 'Phones' ? 'PHN' : category === 'Watches' ? 'WCH' : 'ACC';
    const brandPrefix = brand.trim().slice(0, 3).toUpperCase() || 'TEC';
    const cleanChars = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'DEV';
    const digitPin = Math.floor(1000 + Math.random() * 9000);
    setSku(`${brandPrefix}-${catCode}-${cleanChars}-${digitPin}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const readyName = name.trim();
    const readyBrand = brand.trim();
    const readySku = sku.trim();

    if (!readyName) return setErrorMessage("Product model name is required.");
    if (!readyBrand) return setErrorMessage("Brand is required.");
    if (!readySku) return setErrorMessage("SKU tracking identifier is required.");
    if (quantity < 0) return setErrorMessage("Stock level counts cannot be negative.");
    if (unitPrice <= 0) return setErrorMessage("Unit price must be a positive number.");

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: readyName,
        brand: readyBrand,
        category,
        sku: readySku,
        quantity: Math.floor(quantity),
        unitPrice: parseFloat(unitPrice.toFixed(2))
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An exception occurred saving model records.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all" id="form-modal-wrap">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Frame */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
        
        {/* Header toolbar */}
        <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 px-6 py-4.5">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {product ? 'Modify Technical Catalog Details' : 'Register New Device Model'}
            </h4>
            <p className="text-xs text-slate-400">Fill standard device properties for live synchronization</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            id="form-close-x"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {errorMessage && (
            <div className="flex gap-2 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs rounded-xl" id="form-error">
              <AlertCircle className="shrink-0 mt-0.5" size={14} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Model Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
              Device Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/40 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-400 dark:focus:border-teal-400 text-slate-800 dark:text-slate-100 sm:text-xs font-semibold focus:outline-none transition-all placeholder-slate-400"
              placeholder="e.g., Tecno Pova 6 Neo"
              id="input-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Brand */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
                Brand Name
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/40 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-400 dark:focus:border-teal-400 text-slate-800 dark:text-slate-100 sm:text-xs font-semibold focus:outline-none transition-all placeholder-slate-400"
                placeholder="Tecno"
                id="input-brand"
              />
            </div>

            {/* Classification Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50/40 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-400 dark:focus:border-teal-400 text-slate-850 dark:text-slate-150 sm:text-xs font-semibold focus:outline-none transition-all"
                id="select-category"
              >
                <option value="Phones">Phones</option>
                <option value="Watches">Watches</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
          </div>

          {/* Sku fields */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
              SKU (Stock Keeping Unit)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50/40 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-400 dark:focus:border-teal-400 text-slate-800 dark:text-slate-100 sm:text-xs font-mono uppercase focus:outline-none transition-all"
                placeholder="TEC-PHN-POV-1102"
                id="input-sku"
              />
              <button
                type="button"
                onClick={handleGenerateSku}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-250 dark:border-slate-700 hover:border-teal-400 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 transition-colors"
                id="generate-sku-btn"
              >
                <Sparkles size={14} className="text-teal-400" />
                <span>Auto Sku</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
                In-Hand Count
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50/40 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-400 dark:focus:border-teal-400 text-slate-800 dark:text-slate-100 sm:text-xs font-semibold focus:outline-none transition-all"
                id="input-quantity"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider mb-1.5">
                Unit Price (USD)
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={unitPrice || ''}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50/40 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-teal-400 dark:focus:border-teal-400 text-slate-800 dark:text-slate-100 sm:text-xs font-semibold focus:outline-none transition-all"
                placeholder="99.99"
                id="input-price"
              />
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4.5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer disabled:opacity-40"
              id="form-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 disabled:opacity-45 cursor-pointer transition-colors"
              id="form-submit"
            >
              <Save size={15} />
              {isSubmitting ? 'Saving changes...' : 'Save Product'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
