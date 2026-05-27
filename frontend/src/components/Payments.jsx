import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { CreditCard, IndianRupee, CheckCircle2, Clock, Download, ShieldCheck, X, AlertCircle, Banknote, Smartphone } from 'lucide-react';
import { loadRazorpay, createRazorpayOrder, verifyPaymentOnBackend } from '../utils/razorpay';
import { generatePaymentReceiptPDF } from '../utils/pdfUtils';
import { toast } from 'react-hot-toast';

const Payments = ({ booking }) => {
  const { userData } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineForm, setOfflineForm] = useState({ notes: '', payment_ref: '' });
  const [submittingOffline, setSubmittingOffline] = useState(false);

  // New states for Online Payment UI
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState('monthly'); // 'monthly' | 'full'
  
  const successPayments = payments.filter((p) => p.status === 'success');
  const isFirstPayment = successPayments.length === 0;
  
  const monthlyRent = Number(booking?.rooms?.price_per_seat) || 0;
  const deposit = isFirstPayment ? monthlyRent : 0;
  const contractMonths = booking?.contract_months || 6;
  
  const rentMultiplier = paymentPlan === 'monthly' ? 1 : contractMonths;
  const finalAmount = (monthlyRent * rentMultiplier) + deposit;

  useEffect(() => {
    if (booking?.id) {
      fetchPayments();
    } else {
      setLoading(false);
    }
  }, [booking]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          bookings (
            *,
            pgs (name, address, city),
            rooms (room_number)
          )
        `)
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayRent = async () => {
    if (!booking) {
      toast.error('No active booking found to pay rent for.');
      return;
    }

    const res = await loadRazorpay();
    if (!res) {
      toast.error('Razorpay SDK failed to load. Are you online?');
      return;
    }
    
    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('Invalid rent amount. Please check booking details.');
      return;
    }
    
    try {
      const order = await createRazorpayOrder(finalAmount, 'INR', booking.id.slice(0, 30));

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Apna Rooms',
        description: `${paymentPlan === 'monthly' ? 'Month-wise' : 'Full Duration'} Rent Payment - Room ${booking.rooms?.room_number}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await verifyPaymentOnBackend({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_details: {
                booking_id: booking.id,
                amount: finalAmount,
                type: isFirstPayment ? 'initial_rent_and_deposit' : 'room_rent',
                status: 'success'
              }
            });
            
            toast.success('Rent payment successful!');
            setShowPaymentModal(false);
            fetchPayments();
          } catch (error) {
            console.error('Verification Error:', error);
            toast.error('Payment successful but verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userData?.full_name || '',
          email: userData?.email || '',
        },
        theme: { color: '#3525cd' },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Order Creation Error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to initiate payment. Contact admin.';
      toast.error(errorMsg);
    }
  };

  const handleOfflinePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!booking) {
      toast.error('No active booking found.');
      return;
    }

    const hasPendingOffline = payments.some(
      (p) => p.status === 'pending' && p.payment_method === 'offline'
    );
    if (hasPendingOffline) {
      toast.error('You already have a pending offline payment awaiting admin approval.');
      setShowOfflineModal(false);
      return;
    }

    if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
      return toast.error('Invalid rent amount. Please check your booking details.');
    }

    setSubmittingOffline(true);
    try {
      const paymentPayload = {
        booking_id: booking.id,
        amount: finalAmount,
        status: 'pending',
        payment_id: `OFFLINE-${Date.now()}`,
        type: isFirstPayment ? 'initial_rent_and_deposit' : 'room_rent',
        payment_method: 'offline',
        payment_notes: offlineForm.notes
          ? `${offlineForm.notes}${offlineForm.payment_ref ? ` | Ref: ${offlineForm.payment_ref}` : ''}`
          : offlineForm.payment_ref
            ? `Ref: ${offlineForm.payment_ref}`
            : 'Cash / bank transfer — awaiting admin confirmation'
      };

      for (let attempt = 0; attempt < 2; attempt++) {
        const { error } = await supabase.from('payments').insert([paymentPayload]);
        if (!error) break;

        const msg = error.message || '';
        const missingCol = msg.match(/column "([^"]+)"/)?.[1] || msg.match(/'([^']+)' column/)?.[1];
        if (missingCol && missingCol in paymentPayload) {
          delete paymentPayload[missingCol];
          continue;
        }
        throw error;
      }

      toast.success('✅ Offline payment request submitted! Admin will verify and confirm shortly.');
      setShowOfflineModal(false);
      setOfflineForm({ notes: '', payment_ref: '' });
      fetchPayments();
    } catch (error) {
      console.error('Offline payment error:', error);
      toast.error('Failed to submit offline payment. Please try again.');
    } finally {
      setSubmittingOffline(false);
    }
  };

  const handleDownload = (payment) => {
    try {
      const loadingToast = toast.loading('Generating your receipt...');
      const bookingData = Array.isArray(payment.bookings) ? payment.bookings[0] : payment.bookings;
      const pgData = bookingData?.pgs || booking?.pgs;
      
      generatePaymentReceiptPDF(payment, userData, pgData, bookingData || booking);
      
      toast.dismiss(loadingToast);
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      toast.dismiss(); 
      toast.error(`Error: ${error.message}`);
      console.error('Download Error:', error);
    }
  };

  if (!booking) {
    return (
      <div className="text-center py-16 bg-surface-container-low border border-dashed border-border-low rounded-xl space-y-3">
        <CreditCard className="w-10 h-10 text-outline mx-auto" />
        <h3 className="text-sm font-bold text-text-primary">No Active Booking</h3>
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Book a room first to view your payment history.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-xs font-mono text-text-secondary">Loading payment records...</div>;

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const totalPaid = successPayments.reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-low pb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Rent Payments</h2>
          <p className="text-text-secondary text-sm">Manage your monthly rent statements and view payment history.</p>
        </div>
        
        <div className="flex flex-col gap-2 w-full sm:w-auto items-end shrink-0">
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Make a Payment</span>
          </button>
          
          <button 
            onClick={() => setShowOfflineModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-surface-container border border-border-low rounded-lg text-text-primary hover:bg-surface-container-high transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Banknote className="w-3.5 h-3.5 shrink-0" />
            <span>Settle Via Offline Payment</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-container-low border border-border-low p-4 rounded-xl">
          <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Total Paid</span>
          <span className="block text-xl font-bold text-success mt-1">₹{totalPaid.toLocaleString()}</span>
        </div>
        <div className="bg-surface-container-low border border-border-low p-4 rounded-xl">
          <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Pending</span>
          <span className="block text-xl font-bold text-amber-500 mt-1">{pendingPayments.length}</span>
        </div>
        <div className="bg-surface-container-low border border-border-low p-4 rounded-xl">
          <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Transactions</span>
          <span className="block text-xl font-bold text-primary mt-1">{payments.length}</span>
        </div>
      </div>

      {/* Pending offline payments notice */}
      {pendingPayments.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-text-primary">
              {pendingPayments.length} Offline Payment{pendingPayments.length > 1 ? 's' : ''} Awaiting Admin Approval
            </p>
            <p className="text-xs text-text-secondary">
              The admin has been notified and will verify your payment. Your receipt will be generated upon confirmation.
            </p>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {payments.map((payment) => {
          const isSuccess = payment.status === 'success';
          const isPending = payment.status === 'pending';
          const isOffline = payment.payment_method === 'offline';
          return (
            <div key={payment.id} className="bg-surface-main p-5 rounded-xl border border-border-low flex justify-between items-start gap-4">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                  isSuccess ? 'bg-success/10 text-success' : 
                  isPending ? 'bg-amber-500/10 text-amber-500' : 
                  'bg-error/10 text-error'
                }`}>
                  {isOffline ? <Banknote className="w-5 h-5 shrink-0" /> : <IndianRupee className="w-5 h-5 shrink-0" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-base text-text-primary">₹{Number(payment.amount).toLocaleString()}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${
                      isSuccess ? 'bg-success/15 text-success border-success/30' : 
                      isPending ? 'bg-amber-500/15 text-amber-500 border-amber-500/30' : 
                      'bg-error/15 text-error border-error/30'
                    }`}>
                      {isPending ? 'Awaiting Approval' : payment.status}
                    </span>
                    {isOffline && (
                      <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border bg-primary/10 text-primary border-primary/20">
                        Offline
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{new Date(payment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[10px] text-text-secondary/60 font-mono mt-0.5">{payment.type || 'Monthly Rent'}</p>
                  {payment.payment_notes && (
                    <p className="text-[10px] text-text-secondary/70 mt-1 italic">{payment.payment_notes}</p>
                  )}
                  {isPending && isOffline && (
                    <div className="flex items-center gap-1.5 mt-2 text-amber-500">
                      <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Pending Admin Verification</span>
                    </div>
                  )}
                </div>
              </div>
              
              {isSuccess && (
                <button 
                  onClick={() => handleDownload(payment)}
                  className="p-2 bg-surface-container border border-border-low rounded-lg text-text-secondary hover:text-primary transition-colors shrink-0 cursor-pointer"
                  title="Download Receipt"
                >
                  <Download className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {payments.length === 0 && (
        <div className="text-center py-16 bg-surface-container-low border border-dashed border-border-low rounded-xl space-y-2">
          <CreditCard className="w-10 h-10 text-outline mx-auto" />
          <h3 className="text-sm font-bold text-text-primary">No Payment Statements</h3>
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Your transaction receipts will dynamically list here.</p>
        </div>
      )}

      {/* Offline Payment Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-main border border-border-low rounded-2xl shadow-2xl w-full max-w-md">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-low">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Banknote className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg">Offline Payment Request</h3>
                  <p className="text-xs text-text-secondary">Cash or bank transfer verification</p>
                </div>
              </div>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="p-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleOfflinePaymentSubmit} className="p-6 space-y-5">
              
              {/* Amount summary */}
              <div className="bg-surface-container-low border border-border-low rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">Amount to Pay</p>
                  <p className="text-2xl font-extrabold text-text-primary mt-0.5">
                    ₹{finalAmount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    Room #{booking.rooms?.room_number} • {booking.pgs?.name}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <IndianRupee className="w-7 h-7 text-primary" />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" /> How offline payment works
                </p>
                <ol className="text-xs text-text-secondary space-y-1 list-decimal ml-4">
                  <li>Submit this request — admin gets notified immediately.</li>
                  <li>Pay the amount in <strong className="text-text-primary">cash</strong> or via <strong className="text-text-primary">bank/UPI transfer</strong> to the admin.</li>
                  <li>Admin verifies & marks your payment as confirmed.</li>
                  <li>Your receipt is automatically generated once approved.</li>
                </ol>
              </div>

              {/* Optional reference */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="UPI transaction ID, cheque no., cash receipt no."
                  value={offlineForm.payment_ref}
                  onChange={(e) => setOfflineForm((f) => ({ ...f, payment_ref: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-lg text-text-primary text-sm placeholder:text-text-secondary/40 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Optional notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Notes for Admin (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Paid cash to manager on 15 June..."
                  value={offlineForm.notes}
                  onChange={(e) => setOfflineForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 bg-surface-container-low border border-border-low rounded-lg text-text-primary text-sm placeholder:text-text-secondary/40 focus:border-primary focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfflineModal(false)}
                  className="flex-1 py-3 bg-surface-container border border-border-low rounded-lg text-text-primary text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffline}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {submittingOffline ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Online Payment UI Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-main border border-border-low rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-border-low flex justify-between items-center bg-surface-container/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg">Secure Payment</h3>
                  <p className="text-xs text-text-secondary">Select your payment plan</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Payment Plan Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Payment Duration</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    onClick={() => setPaymentPlan('monthly')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${paymentPlan === 'monthly' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border-low hover:border-primary/40'}`}
                  >
                    <p className={`font-bold ${paymentPlan === 'monthly' ? 'text-primary' : 'text-text-primary'}`}>Month-wise</p>
                    <p className="text-[10px] text-text-secondary mt-1">Pay 1 month rent</p>
                  </div>
                  <div 
                    onClick={() => setPaymentPlan('full')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${paymentPlan === 'full' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border-low hover:border-primary/40'}`}
                  >
                    <p className={`font-bold ${paymentPlan === 'full' ? 'text-primary' : 'text-text-primary'}`}>Full Term</p>
                    <p className="text-[10px] text-text-secondary mt-1">Pay for {contractMonths} months</p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-surface-container-low border border-border-low rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-sm font-semibold text-text-secondary">
                  <span>Room Rent ({paymentPlan === 'monthly' ? '1 Month' : `${contractMonths} Months`})</span>
                  <span className="text-text-primary">₹{(monthlyRent * rentMultiplier).toLocaleString()}</span>
                </div>
                
                {isFirstPayment && (
                  <div className="flex justify-between items-center text-sm font-semibold text-text-secondary pb-3 border-b border-border-low/50">
                    <span className="flex items-center gap-1.5">
                      Security Deposit <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">1 Month</span>
                    </span>
                    <span className="text-text-primary">₹{deposit.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center font-bold pt-1">
                  <span className="text-text-primary">Total Amount</span>
                  <span className="text-primary text-xl">₹{finalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-text-secondary font-semibold leading-relaxed">
                  Payments are securely processed via Razorpay. A confirmed receipt will be available immediately after success.
                </p>
              </div>

            </div>

            <div className="p-6 pt-0">
              <button
                onClick={handlePayRent}
                className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold text-sm uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Pay ₹{finalAmount.toLocaleString()} Securely</span>
                <CreditCard className="w-4 h-4" />
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default Payments;
