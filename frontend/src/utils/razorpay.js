import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async (amount, currency = 'INR', receipt = 'receipt_123') => {
  try {
    console.log('Requesting order from backend:', { amount, currency, receipt });
    const response = await axios.post(`${BACKEND_URL}/api/payments/create-order`, {
      amount,
      currency,
      receipt
    });
    return response.data;
  } catch (error) {
    console.error('Error creating order in backend:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyPaymentOnBackend = async (paymentData) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/payments/verify-payment`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment on backend:', error);
    throw error;
  }
};
