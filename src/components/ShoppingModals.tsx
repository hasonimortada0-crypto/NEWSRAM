import React from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Smartphone, 
  ShoppingCart, 
  CreditCard, 
  MapPin, 
  User, 
  Phone,
  Clock,
  ClipboardList,
  Check
} from 'lucide-react';
import { CartItem, Product } from '../types';
import { USD_TO_IQD } from '../data';

interface ShoppingModalsProps {
  exchangeRate?: number;
  // Cart state
  isCartOpen: boolean;
  setIsCartOpen: (val: boolean) => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, amount: number) => void;
  onRemoveFromCart: (id: string) => void;
  onOpenCheckout: () => void;
  
  // Checkout state
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (val: boolean) => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  customerAddress: string;
  setCustomerAddress: (val: string) => void;
  paymentMethod: 'cod' | 'zain' | 'asia' | 'card';
  setPaymentMethod: (val: 'cod' | 'zain' | 'asia' | 'card') => void;
  onCheckoutSubmit: (e: React.FormEvent) => void;

  // Tracking state
  isTrackingOpen: boolean;
  setIsTrackingOpen: (val: boolean) => void;
  trackingPhone: string;
  setTrackingPhone: (val: string) => void;
  trackedOrders: any[];
  hasSearchedTracking: boolean;
  onTrackOrder: (e?: React.FormEvent) => void;

  // Direct link helpers
  copiedLink: boolean;
  onCopyLink: () => void;
  getAppUrl: () => string;
}

export default function ShoppingModals({
  exchangeRate,
  isCartOpen,
  setIsCartOpen,
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onOpenCheckout,
  
  isCheckoutOpen,
  setIsCheckoutOpen,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerAddress,
  setCustomerAddress,
  paymentMethod,
  setPaymentMethod,
  onCheckoutSubmit,

  isTrackingOpen,
  setIsTrackingOpen,
  trackingPhone,
  setTrackingPhone,
  trackedOrders,
  hasSearchedTracking,
  onTrackOrder,

  copiedLink,
  onCopyLink,
  getAppUrl
}: ShoppingModalsProps) {

  const currentRate = exchangeRate || USD_TO_IQD;
  const cartTotalUSD = cart.reduce((acc, item) => acc + (item.product.priceUSD * item.quantity), 0);
  const cartTotalIQD = cartTotalUSD * currentRate;

  return (
    <>
      {/* 1. SHOPPING CART DRAWER (LIST DESIGN) */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-50 flex justify-end animate-fade-in" dir="rtl">
          <div className="bg-white w-full max-w-md h-full flex flex-col border-r border-amber-500/15 shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-amber-500/15 bg-[#FCFAF7] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-stone-900">سلة التسوق والمشتريات</h3>
                <span className="bg-amber-100 text-amber-900 font-mono text-[10px] px-2 py-0.5 rounded-full border border-amber-500/10 font-bold">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)} قطع
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3.5">
                  <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-500/10 shadow-inner">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <p className="text-xs text-stone-500 max-w-[240px] leading-relaxed font-medium">
                    سلتك فارغة حالياً عيوني! تصفح معروضات المعرض الكهربائية والإنارة وأضف ما ينقص تأسيس بيتك.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-stone-500 tracking-wider">المنتجات المختارة في السلة:</h4>
                  {cart.map((item) => (
                    <div 
                      key={item.product.id} 
                      className="bg-[#FCFAF7] rounded-xl p-3.5 border border-amber-500/10 flex gap-3.5 items-center hover:border-amber-500/25 transition-colors"
                    >
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-14 h-14 rounded-lg object-cover bg-white border border-stone-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 space-y-1 text-right">
                        <h5 className="font-bold text-[11px] text-stone-900 leading-snug truncate">{item.product.name}</h5>
                        <p className="text-[10px] text-amber-700 font-bold">
                          السعر: {(item.product.priceUSD * currentRate).toLocaleString()} د.ع
                        </p>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="w-5.5 h-5.5 rounded-md bg-stone-100 hover:bg-stone-200 flex items-center justify-center cursor-pointer text-stone-700"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black font-mono px-1.5 text-stone-800">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="w-5.5 h-5.5 rounded-md bg-stone-100 hover:bg-stone-200 flex items-center justify-center cursor-pointer text-stone-700"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          
                          <button
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="mr-auto text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                            title="حذف من السلة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            {cart.length > 0 && (
              <div className="p-5 bg-[#FCFAF7] border-t border-amber-500/15 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-sm font-black text-amber-700">
                    <span>المجموع الإجمالي:</span>
                    <span>{cartTotalIQD.toLocaleString()} د.ع</span>
                  </div>
                </div>

                <button
                  onClick={onOpenCheckout}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد الطلب وإرساله عبر واتساب 🚀</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CHECKOUT DIALOG MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white border border-amber-500/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-[#FCFAF7] text-stone-900 p-5 flex justify-between items-center border-b border-amber-500/15">
              <h4 className="font-bold text-sm text-amber-800 flex items-center gap-1.5">
                <ClipboardList className="w-5 h-5 text-amber-700" />
                تأكيد بيانات الشحن والتجهيز
              </h4>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={onCheckoutSubmit} className="p-6 space-y-4">
              <p className="text-xs text-stone-500 leading-relaxed font-medium">
                يرجى تزويدنا بالمعلومات التالية لبدء تجهيز طلبك وشحنه فوراً لباب منزلك وتنسيق الشحن وتجهيز الفاتورة.
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 font-bold block uppercase">👤 الاسم الكامل للزبون</label>
                <input 
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="اكتب اسمك الكامل هنا"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 font-bold block uppercase">📞 رقم الهاتف العراقي للاتصال</label>
                <input 
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="اكتب رقم هاتفك هنا"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none font-mono text-center"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-500 font-bold block uppercase">📍 موقع السكن / العنوان بالتفصيل</label>
                <input 
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="اكتب عنوانك بالتفصيل هنا"
                  className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none"
                  required
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-[10px] text-stone-500 font-bold block uppercase">💳 طريقة الدفع المفضلة لديك</label>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  
                  <label className={`p-2.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'bg-amber-500/10 border-amber-500 text-stone-900 font-bold' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="cod" 
                      checked={paymentMethod === 'cod'} 
                      onChange={() => setPaymentMethod('cod')} 
                      className="hidden" 
                    />
                    <span>الدفع عند الاستلام</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${paymentMethod === 'zain' ? 'bg-amber-500/10 border-amber-500 text-stone-900 font-bold' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="zain" 
                      checked={paymentMethod === 'zain'} 
                      onChange={() => setPaymentMethod('zain')} 
                      className="hidden" 
                    />
                    <span>زين كاش ⚡</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${paymentMethod === 'asia' ? 'bg-amber-500/10 border-amber-500 text-stone-900 font-bold' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="asia" 
                      checked={paymentMethod === 'asia'} 
                      onChange={() => setPaymentMethod('asia')} 
                      className="hidden" 
                    />
                    <span>آسيا حوالة 📱</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${paymentMethod === 'card' ? 'bg-amber-500/10 border-amber-500 text-stone-900 font-bold' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'}`}>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="card" 
                      checked={paymentMethod === 'card'} 
                      onChange={() => setPaymentMethod('card')} 
                      className="hidden" 
                    />
                    <span>ماستر كارد 💳</span>
                  </label>

                </div>

                {/* Display Payment instruction depending on selection */}
                <div className="bg-[#FCFAF7] border border-amber-500/10 rounded-xl p-3 mt-2 text-[11px] text-stone-600 leading-relaxed font-medium">
                  {paymentMethod === 'cod' && (
                    <p>💡 <strong className="text-amber-800">طريقة الدفع المحلي عند الاستلام:</strong> يرجى تجهيز المبلغ الكلي نقداً بالدينار العراقي (أو الدولار) لتسليمه لمندوب شركة التوصيل فور التأكد من سلامة كافة الأجهزة.</p>
                  )}
                  {paymentMethod === 'zain' && (
                    <p>💡 <strong className="text-amber-800">التحويل الفوري عبر زين كاش:</strong> الرجاء تحويل قيمة الطلبية بالدينار العراقي إلى الرقم: <span className="font-mono text-stone-900 font-bold bg-white border border-stone-200 px-1 py-0.5 rounded">07866080020</span> ثم أرفق لقطة شاشة لإثبات التحويل مع رسالة الواتساب.</p>
                  )}
                  {paymentMethod === 'asia' && (
                    <p>💡 <strong className="text-amber-800">حوالة آسيا سيل / رصيد:</strong> يرجى تحويل الحوالة/الرصيد الكلي إلى الرقم: <span className="font-mono text-stone-900 font-bold bg-white border border-stone-200 px-1 py-0.5 rounded">07866080020</span> ومشاركتنا رمز التأكيد على الواتساب عند الطلب.</p>
                  )}
                  {paymentMethod === 'card' && (
                    <p>💡 <strong className="text-amber-800">الدفع الإلكتروني (ماستركارد):</strong> سيقوم فريق الدعم فور استلام الطلبية بتزويدكم برابط بوابة الدفع الإلكترونية السريعة والآمنة لإجراء عملية الخصم مباشرة.</p>
                  )}
                </div>
              </div>

              {/* Summary of receipt */}
              <div className="border-t border-stone-200 pt-3 space-y-1">
                <div className="flex justify-between text-xs text-stone-900 font-black">
                  <span>المجموع الكلي</span>
                  <span className="text-amber-700 font-black">{cartTotalIQD.toLocaleString()} د.ع</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10 text-xs"
              >
                <Phone className="w-4 h-4 text-emerald-100" />
                <span>إرسال الطلب النهائي عبر واتساب 🚀</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. CUSTOMER ORDER TRACKING MODAL (LIST/MENU STYLE) */}
      {isTrackingOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white border border-amber-500/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-[#FCFAF7] text-stone-900 p-5 flex justify-between items-center border-b border-amber-500/15">
              <h4 className="font-bold text-sm text-amber-800 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-700" />
                تتبع حالة طلبيتك بالهاتف 📦
              </h4>
              <button 
                onClick={() => setIsTrackingOpen(false)}
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              <p className="text-xs text-stone-500 leading-relaxed font-medium">
                يرجى إدخال رقم الهاتف الذي استخدمته عند إرسال طلب الشراء لعرض حالة الطلب فورا ومعرفة مراحل تجهيزه وشحنه.
              </p>

              <form onSubmit={onTrackOrder} className="flex gap-2">
                <input
                  type="text"
                  placeholder="رقم الهاتف المستخدم"
                  value={trackingPhone}
                  onChange={(e) => setTrackingPhone(e.target.value)}
                  className="flex-1 bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-lg p-3 text-xs text-stone-900 focus:outline-none font-mono text-center"
                  required
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-black px-5 py-3 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  بحث 🔍
                </button>
              </form>

              {hasSearchedTracking && (
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-stone-700 border-b border-stone-200 pb-2">قائمة الطلبات المسجلة بحسابك:</h5>
                  {trackedOrders.length === 0 ? (
                    <div className="bg-amber-50/50 rounded-xl p-6 text-center border border-amber-500/10">
                      <p className="text-xs text-rose-600 font-bold">لم نجد أي طلبيات مسجلة بهذا الرقم عيوني. تأكد من صحة رقم الهاتف.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {trackedOrders.map((order) => (
                        <div key={order.id} className="bg-[#FCFAF7] border border-amber-500/10 rounded-xl p-4.5 space-y-3">
                          <div className="flex justify-between items-center pb-2.5 border-b border-stone-200 text-[11px]">
                            <span className="font-mono text-stone-500 font-bold">طلب رقم: #{order.id}</span>
                            <span className={`px-2.5 py-1 rounded-full font-black text-[10px] ${
                              order.status === 'وصل' ? 'bg-emerald-100 text-emerald-800' :
                              order.status === 'قيد التجهيز' ? 'bg-amber-100 text-amber-800' :
                              order.status === 'غير متوفر' ? 'bg-rose-100 text-rose-800' :
                              'bg-[#FCFAF7] text-stone-700 border border-stone-200'
                            }`}>
                              {
                                order.status === 'وصل' ? '✅ وصل / تم التسليم' :
                                order.status === 'قيد التجهيز' ? '🛠️ قيد التجهيز والشحن' :
                                order.status === 'غير متوفر' ? '❌ غير متوفر حالياً' :
                                '⏳ قيد المعالجة المباشرة'
                              }
                            </span>
                          </div>

                          <div className="text-xs space-y-2 text-stone-700">
                            <p>👤 الاسم المستلم: <span className="text-stone-900 font-bold">{order.customerName}</span></p>
                            <p className="font-bold">📦 قائمة المنتجات المطلوبة:</p>
                            <div className="space-y-1 pl-3 border-r border-amber-500/30 text-stone-600 mr-2">
                              {order.items && order.items.map((item: any, idx: number) => (
                                <p key={idx} className="text-[11px] text-stone-700">
                                  - <strong className="text-stone-900">{item.name}</strong> × {item.quantity}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-[#FCFAF7] p-4 border-t border-amber-500/15 text-center text-[10px] text-stone-500 font-medium">
              <span>متجر NEWSRAM - تجربة تسوق فخمة وبسيطة 💡</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
