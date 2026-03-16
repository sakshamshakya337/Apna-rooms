const { razorpay, supabase } = require('../config/db');
const crypto = require('crypto');

const createOrder = async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;
  console.log('Creating Razorpay order for amount:', amount, 'currency:', currency, 'receipt:', receipt);

  try {
    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created successfully:', order.id);
    res.status(200).json(order);
  } catch (error) {
    console.error('Razorpay Order Creation Error Detailed:', error);
    res.status(500).json({ 
      error: 'Failed to create Razorpay order', 
      details: error.description || error.message || 'Unknown Razorpay error'
    });
  }
};

const verifyPayment = async (req, res) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    booking_details
  } = req.body;

  console.log('Verifying payment:', razorpay_payment_id, 'for order:', razorpay_order_id);

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    console.log('Payment signature verified!');
    try {
      if (booking_details) {
        // If it's a rent payment, insert into payments table
        // If it's a new booking, update/insert booking and insert into payments
        
        const { booking_id, amount, type } = booking_details;

        // Insert into payments table
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([{
            booking_id: booking_id,
            amount: amount,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            signature: razorpay_signature,
            status: 'success',
            type: type
          }]);
        
        if (paymentError) {
          console.error('Supabase Payment Insert Error:', paymentError);
          throw paymentError;
        }

        // 1. Handle Electricity Bill Payments
        if (type === 'electricity' && booking_details.bill_id) {
          const { error: billError } = await supabase
            .from('electricity_bills')
            .update({ is_paid: true })
            .eq('id', booking_details.bill_id);
          
          if (billError) {
            console.error('Supabase Electricity Bill Update Error:', billError);
            throw billError;
          }
          console.log('Electricity bill status updated to paid!');
        }

        // 2. Handle Initial Booking Payments
        if (type === 'initial_booking') {
          const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*, rooms(*)')
            .eq('id', booking_id)
            .single();
          
          if (fetchError) throw fetchError;

          const { error: bookingError } = await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', booking_id);
          
          if (bookingError) {
            console.error('Supabase Booking Update Error:', bookingError);
            throw bookingError;
          }

          // Update available seats in the room
          const isCompleteRoom = booking.type === 'complete';
          const seatsToReduce = isCompleteRoom ? booking.rooms.available_seats : 1;
          const newAvailableSeats = booking.rooms.available_seats - seatsToReduce;

          const { error: roomError } = await supabase
            .from('rooms')
            .update({ available_seats: newAvailableSeats })
            .eq('id', booking.room_id);
          
          if (roomError) {
            console.error('Supabase Room Seat Update Error:', roomError);
            throw roomError;
          }
        }
      }

      res.status(200).json({ status: 'success', message: 'Payment verified successfully' });
    } catch (error) {
      console.error('Error updating database after payment:', error);
      res.status(500).json({ error: 'Payment verified but database update failed', details: error.message });
    }
  } else {
    console.error('Invalid payment signature!');
    res.status(400).json({ status: 'failure', message: 'Invalid signature' });
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
