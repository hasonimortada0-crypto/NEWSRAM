import React, { useState } from 'react';
import { Star, ShoppingCart, ShieldCheck, Info, X, Check, Heart } from 'lucide-react';
import { Product } from '../types';
import { USD_TO_IQD } from '../data';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onAddToCart: (product: Product) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isAdmin?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string, productName: string) => void;
  exchangeRate?: number;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  isFavorite, 
  onToggleFavorite, 
  isAdmin, 
  onEdit, 
  onDelete,
  exchangeRate
}: ProductCardProps) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const priceIQD = product.priceUSD * (exchangeRate || USD_TO_IQD);

  const handleAddToCart = () => {
    onAddToCart(product);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  return (
    <>
      <div 
        className="bg-white rounded-[24px] overflow-hidden border border-stone-300 flex flex-col hover:shadow-lg transition-all duration-300 group relative shadow-md"
        id={`product-card-${product.id}`}
        dir="rtl"
      >
        {/* Favorite button (top right as in screenshot) */}
        <button
          onClick={onToggleFavorite}
          className={`absolute top-3.5 right-3.5 p-2 rounded-full backdrop-blur-md z-10 border transition-all cursor-pointer shadow-xs ${
            isFavorite 
              ? 'bg-rose-50 border-rose-100 text-rose-600' 
              : 'bg-white/90 hover:bg-white border-stone-200 text-stone-400 hover:text-stone-600 shadow-xs'
          }`}
        >
          <Heart className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} />
        </button>

        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-white shrink-0 border-b border-stone-200">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          {product.tags && product.tags.length > 0 && (
            <div className="absolute bottom-3 right-3 flex flex-wrap gap-1">
              {product.tags.slice(0, 1).map((tag, i) => (
                <span 
                  key={i} 
                  className="bg-amber-500 text-black font-extrabold text-[8px] px-2 py-0.5 rounded-sm shadow-xs border border-amber-600 uppercase tracking-widest"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between text-center bg-white">
          <div className="space-y-2 sm:space-y-3">
            {/* Title - Centered */}
            <h3 className="font-black text-xs sm:text-sm text-stone-950 line-clamp-2 leading-snug">
              {product.name}
            </h3>
            
            {/* Description brief */}
            <p className="text-[10px] sm:text-[11px] text-stone-500 line-clamp-2 leading-relaxed font-bold">
              {product.description}
            </p>
          </div>

          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 space-y-2 sm:space-y-3.5">
            {/* Price - Centered, Green as in screenshot */}
            <div className="text-center">
              <span className="text-sm sm:text-base font-black text-emerald-600">
                {priceIQD.toLocaleString()} د.ع
              </span>
            </div>

            {/* Card Buttons */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`w-full py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  addedAnimation 
                    ? 'bg-emerald-600 text-white font-black' 
                    : 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-black shadow-xs active:scale-95'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>تمت الإضافة!</span>
                  </>
                ) : (
                  <span>إضافة للسلة</span>
                )}
              </button>
              
              {/* More details link as in screenshot */}
              <button
                onClick={() => setShowDetailsModal(true)}
                className="text-stone-500 hover:text-stone-950 text-[10px] sm:text-xs font-black transition-colors cursor-pointer pt-0.5"
              >
                المزيد من التفاصيل
              </button>
            </div>

            {isAdmin && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-300">
                <button
                  onClick={() => onEdit && onEdit(product)}
                  className="bg-yellow-50 hover:bg-amber-500/10 hover:text-amber-800 hover:border-amber-500 text-stone-800 font-black py-2 rounded-xl text-[11px] transition-all cursor-pointer border border-yellow-400"
                >
                  تعديل ⚙️
                </button>
                <button
                  onClick={() => onDelete && onDelete(product.id, product.name)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-black py-2 rounded-xl text-[11px] transition-all cursor-pointer"
                >
                  حذف 🗑️
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Specifications Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-[#FFFDF0] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border-2 border-amber-500">
            {/* Header */}
            <div className="bg-[#FEF08A] text-stone-900 p-5 flex justify-between items-center border-b-2 border-amber-500/30">
              <h4 className="font-black text-sm text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                المواصفات الفنية والضمان المعتمد
              </h4>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 font-black" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto text-right bg-gradient-to-b from-yellow-500/5 to-transparent">
              <div className="flex gap-4">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-24 h-24 rounded-xl object-cover border-2 border-yellow-400 bg-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1">
                  <h3 className="font-black text-sm text-stone-950 leading-snug">{product.name}</h3>
                  {product.englishName && <p className="text-xs text-amber-900 font-mono font-bold">{product.englishName}</p>}
                  <p className="text-sm font-black text-amber-800 mt-1">
                    السعر الرسمي: {priceIQD.toLocaleString()} د.ع
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-black text-xs text-stone-900 border-b border-amber-500/10 pb-1.5 uppercase tracking-wider">تفاصيل ووصف المنتج:</h5>
                <p className="text-xs text-stone-800 leading-relaxed font-bold">{product.description}</p>
              </div>

              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-black text-xs text-stone-900 border-b border-amber-500/10 pb-1.5 uppercase tracking-wider">جدول البيانات والمميزات الفنية:</h5>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-3 text-xs p-2.5 bg-yellow-100/50 rounded-lg border border-yellow-300">
                        <span className="font-black text-stone-700 col-span-1">{key}</span>
                        <span className="text-stone-900 col-span-2 font-black">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#FEF08A]/60 border-t border-amber-500/20 flex justify-end">
              <button
                onClick={() => {
                  handleAddToCart();
                  setShowDetailsModal(false);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/10 border border-amber-600/30"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>إضافة السلعة للسلة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
