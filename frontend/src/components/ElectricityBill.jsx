import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { Zap, TrendingUp, Calendar, Download, CreditCard, Loader2, CheckCircle2, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateElectricityBillPDF } from '../utils/pdfUtils';
import { loadRazorpay, createRazorpayOrder, verifyPaymentOnBackend } from '../utils/razorpay';
import { toast } from 'react-hot-toast';

const ElectricityBill = ({ booking, userData }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [pg, setPg] = useState(null);

  useEffect(() => {
    if (!booking) {
      setLoading(false);
      return;
    }
    if (booking?.room_id) {
      fetchBills();
      fetchPGInfo();
    } else {
      setLoading(false);
    }
  }, [booking]);

  const fetchPGInfo = async () => {
    if (!booking?.pg_id) return;
    const { data } = await supabase.from('pgs').select('*').eq('id', booking.pg_id).single();
    if (data) setPg(data);
  };

  const handlePayment = async (bill) => {
    if (bill.is_paid) return toast.success('Bill is already paid!');
    setPaying(true);
    
    try {
      const res = await loadRazorpay();
      if (!res) throw new Error('Razorpay SDK failed to load');

      const orderData = await createRazorpayOrder(bill.amount);
      if (!orderData) throw new Error('Failed to create order');

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "Apna Rooms",
        description: `Electricity Bill - ${bill.billing_month}`,
        order_id: orderData.id,
        handler: async (response) => {
          const verifyRes = await verifyPaymentOnBackend({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            booking_details: {
              booking_id: booking.id,
              bill_id: bill.id,
              amount: bill.amount,
              type: 'electricity'
            }
          });

          if (verifyRes.status === 'success') {
            toast.success('Payment successful!');
            fetchBills(); 
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: userData?.fullName || userData?.full_name || '',
          email: userData?.email
        },
        theme: { color: "#3525cd" }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('electricity_bills')
        .select(`*, rooms (room_number)`)
        .eq('room_id', booking.room_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseBillingMonth = (billingMonth) => {
    const parsedDate = new Date(`1 ${billingMonth}`);
    return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
  };

  const sortedBills = [...bills].sort((a, b) => parseBillingMonth(a.billing_month) - parseBillingMonth(b.billing_month));
  const currentBill = sortedBills[sortedBills.length - 1];
  const lastSixMonths = sortedBills.slice(-6);
  const maxUnits = Math.max(...lastSixMonths.map(bill => Number(bill.units) || 0), 100);
  const avgUnits = lastSixMonths.length > 0 ? Math.round(lastSixMonths.reduce((sum, bill) => sum + Number(bill.units), 0) / lastSixMonths.length) : 0;
  const totalCost = lastSixMonths.reduce((sum, bill) => sum + Number(bill.amount), 0);

  if (loading) return <div className="p-8 text-center text-xs font-mono text-text-secondary">Loading bill records...</div>;

  if (!currentBill && bills.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Electricity Bill</h2>
          <p className="text-text-secondary text-sm">No electricity bills generated for this room yet.</p>
        </div>
        <div className="bg-surface-container-low border border-dashed border-border-low p-8 rounded-xl text-center space-y-3">
          <Zap className="w-10 h-10 text-primary mx-auto opacity-30" />
          <p className="text-text-secondary text-sm font-medium">Your monthly electricity bills will be dynamically generated here.</p>
        </div>
      </div>
    );
  }

  const displayBill = currentBill || { units: 0, rate: 0, amount: 0, billing_month: 'N/A' };

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Electricity Bill</h2>
        <p className="text-text-secondary text-sm">Track your monthly consumption and payments for Room {booking?.rooms?.room_number}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Units Consumed */}
        <div className="bg-surface-container-low border border-border-low p-5 rounded-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Zap className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase font-mono">{displayBill.billing_month}</span>
          </div>
          <div>
            <h3 className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Units Consumed</h3>
            <p className="text-2xl font-bold text-text-primary mt-1">{displayBill.units} <span className="text-sm font-medium text-text-secondary">kWh</span></p>
          </div>
        </div>

        {/* Rate Per Unit */}
        <div className="bg-surface-container-low border border-border-low p-5 rounded-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <TrendingUp className="w-5 h-5 shrink-0" />
            </div>
            <span className="text-[10px] font-bold text-text-secondary bg-surface-container px-2 py-0.5 rounded uppercase font-mono">RATE</span>
          </div>
          <div>
            <h3 className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Rate per Unit</h3>
            <p className="text-2xl font-bold text-text-primary mt-1">₹{displayBill.rate} <span className="text-sm font-medium text-text-secondary">/ kWh</span></p>
          </div>
        </div>

        {/* Payable Amount */}
        <div className="bg-surface-container-low border border-border-low p-5 rounded-xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Calendar className="w-5 h-5 shrink-0" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              displayBill.is_paid ? 'bg-success/15 text-success' : 'bg-primary/20 text-primary'
            }`}>{displayBill.is_paid ? 'Paid' : 'Unpaid'}</span>
          </div>
          <div>
            <h3 className="text-text-secondary text-[10px] font-bold uppercase tracking-wider">Total Amount Due</h3>
            <p className="text-2xl font-bold text-text-primary mt-1">₹{displayBill.amount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Action Banners */}
      {!displayBill.is_paid ? (
        <div className="bg-surface-main border border-border-low p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-text-primary text-base">Pending Bill Payment</h4>
              <p className="text-text-secondary text-xs">Payment is required for the month of {displayBill.billing_month}.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
            <button 
              onClick={() => generateElectricityBillPDF(displayBill, userData, pg)}
              className="px-4 py-2.5 bg-surface-container border border-border-low rounded-lg text-text-primary hover:bg-surface-container-high transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Get Statement</span>
            </button>
            <button 
              onClick={async () => {
                toast.success('Please settle details offline. Admin will mark it paid.');
              }}
              className="px-4 py-2.5 bg-surface-container border border-border-low rounded-lg text-text-primary hover:bg-surface-container-high transition-colors text-xs font-bold cursor-pointer"
            >
              <span>Pay Offline</span>
            </button>
            <button 
              onClick={() => handlePayment(displayBill)}
              disabled={paying}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold flex items-center gap-1.5 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 shrink-0" />}
              <span>Pay Now</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-success/5 border border-success/30 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-lg text-success shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-text-primary text-base">Bill Settle Complete</h4>
              <p className="text-text-secondary text-xs">Verification matches and invoice paid for {displayBill.billing_month}.</p>
            </div>
          </div>
          <button 
            onClick={() => generateElectricityBillPDF(displayBill, userData, pg)}
            className="px-4 py-2.5 bg-surface-main border border-border-low rounded-lg text-text-primary hover:bg-surface-container transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Download Receipt</span>
          </button>
        </div>
      )}

      {/* Consumption Charts */}
      <div className="bg-surface-main border border-border-low p-6 rounded-xl space-y-6 shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-low">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary shrink-0" />
              <span>Consumption History</span>
            </h3>
            <p className="text-text-secondary text-xs mt-0.5">{lastSixMonths.length} months active records - {avgUnits} kWh average</p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <div className="text-[10px] uppercase font-bold text-text-secondary tracking-wider font-mono">Total Net Cost</div>
            <div className="text-2xl font-bold text-primary">₹{totalCost.toLocaleString()}</div>
          </div>
        </div>

        {lastSixMonths.length > 0 ? (
          <div className="space-y-8">
            {/* Bar Chart Mockup */}
            <div className="h-64 flex justify-between items-end gap-2 sm:gap-4 p-4 bg-surface-container-low rounded-lg border border-border-low">
              {lastSixMonths.map((item, idx) => {
                const heightPercent = (Number(item.units) / maxUnits) * 100;
                return (
                  <div key={idx} className="flex-1 h-full flex flex-col items-center justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-14 bg-surface-main border border-border-low p-2 rounded shadow-md text-[10px] font-bold text-text-primary pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-30 font-mono text-center">
                      <div>{item.units} kWh</div>
                      <div className="text-primary mt-0.5">₹{item.amount}</div>
                    </div>

                    <div className="w-full bg-primary/20 hover:bg-primary rounded-t transition-colors relative" style={{ height: `${heightPercent}%` }}></div>
                    
                    <div className="text-[9px] font-bold text-text-secondary mt-2 text-center uppercase tracking-wider font-mono">
                      {item.billing_month.split(' ')[0].substring(0, 3)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-surface-container-low border border-border-low rounded-lg">
                <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Peak Usage</span>
                <span className="block text-lg font-bold text-text-primary mt-1">{Math.max(...lastSixMonths.map(b => Number(b.units)), 0)} kWh</span>
              </div>
              <div className="p-4 bg-surface-container-low border border-border-low rounded-lg">
                <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Average</span>
                <span className="block text-lg font-bold text-text-primary mt-1">{avgUnits} kWh</span>
              </div>
              <div className="p-4 bg-surface-container-low border border-border-low rounded-lg">
                <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Total kWh</span>
                <span className="block text-lg font-bold text-text-primary mt-1">{lastSixMonths.reduce((sum, b) => sum + Number(b.units), 0)} kWh</span>
              </div>
              <div className="p-4 bg-surface-container-low border border-border-low rounded-lg">
                <span className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Cost/kWh</span>
                <span className="block text-lg font-bold text-text-primary mt-1">₹{lastSixMonths.length > 0 ? Math.round(totalCost / lastSixMonths.reduce((sum, b) => sum + Number(b.units), 1)) : 0}</span>
              </div>
            </div>

            {/* Historical Listings Table */}
            <div className="border border-border-low rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-surface-container border-b border-border-low text-text-primary uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Month</th>
                    <th className="px-4 py-3 text-right font-bold">Units (kWh)</th>
                    <th className="px-4 py-3 text-right font-bold">Rate/Unit</th>
                    <th className="px-4 py-3 text-right font-bold">Total Bill</th>
                    <th className="px-4 py-3 text-center font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-low bg-surface-main">
                  {lastSixMonths.map((bill, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 font-semibold text-text-primary">{bill.billing_month}</td>
                      <td className="px-4 py-3 text-right font-bold font-mono text-primary">{bill.units}</td>
                      <td className="px-4 py-3 text-right text-text-secondary font-mono">₹{bill.rate}</td>
                      <td className="px-4 py-3 text-right font-bold text-text-primary font-mono">₹{bill.amount}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${
                          bill.is_paid ? 'bg-success/15 text-success' : 'bg-primary/20 text-primary'
                        }`}>
                          {bill.is_paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary opacity-50 bg-surface-container-low border border-dashed border-border-low rounded-lg">
            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs font-semibold uppercase tracking-wider">No history recorded yet</p>
          </div>
        )}

      </div>

    </div>
  );
};

export default ElectricityBill;
