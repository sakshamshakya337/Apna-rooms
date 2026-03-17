const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/db');
const { Resend } = require('resend');

// Initialize Resend professionally with API Key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

const signup = async (req, res) => {
  const { email, password, fullName, role = 'user' } = req.body;

  try {
    // 1. Check if user already exists in Supabase
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      console.error('[Signup] Supabase Check Existing User Error:', existingError);
      return res.status(500).json({ error: 'Database error checking existing user' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // 2. Hash the password professionally using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user in Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          password: hashedPassword, // Storing hashed password securely
          full_name: fullName, 
          role 
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // 4. Generate professional JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '5d' } // 5 days as requested for persistence
    );

    res.status(201).json({ 
      message: 'User created successfully',
      token,
      user: { id: newUser.id, email: newUser.email, fullName: newUser.full_name, role: newUser.role }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('[Login] Supabase Fetch User Error:', userError);
      return res.status(500).json({ error: 'Database error fetching user' });
    }

    if (!user) {
      console.warn(`[Login] User not found for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 2. Compare passwords using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[Login] Incorrect password for email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    res.status(200).json({ 
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

const googleLogin = async (req, res) => {
  const { email, fullName, firebase_uid } = req.body;

  try {
    // 1. Check if user already exists
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      // 2. Create user if doesn't exist (Google users don't need a local password)
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          { 
            email, 
            full_name: fullName, 
            role: 'user',
            password: 'google_authenticated' // Placeholder
          }
        ])
        .select()
        .single();
      
      if (insertError) throw insertError;
      user = newUser;
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    res.status(200).json({ 
      message: 'Google login successful',
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role }
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ error: 'Internal server error during Google login' });
  }
};

const updateProfile = async (req, res) => {
  const { fullName, phoneNumber, address, city, state } = req.body;
  const userId = req.user.id;

  try {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ 
        full_name: fullName, 
        phone_number: phoneNumber,
        address: address,
        city: city,
        state: state,
        updated_at: new Date() 
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase Update Error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: { 
        id: updatedUser.id, 
        email: updatedUser.email, 
        fullName: updatedUser.full_name, 
        phoneNumber: updatedUser.phone_number,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        role: updatedUser.role 
      }
    });
  } catch (error) {
    console.error('Update profile internal error:', error);
    res.status(500).json({ error: 'Internal server error during profile update' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    // 1. Get current user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. For Google users, currentPassword check might be different or skipped
    if (user.password !== 'google_authenticated') {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, updated_at: new Date() })
      .eq('id', userId);

    if (updateError) throw updateError;

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    console.log(`[Forgot Password] Initiating for email: ${email}`);

    // 1. Verify if API key is present
    if (!process.env.RESEND_API_KEY) {
      console.error('[Forgot Password] Error: RESEND_API_KEY is not defined in .env');
      return res.status(500).json({ error: 'Mail service configuration error' });
    }

    // 2. Check if user exists in database
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle(); // Better for checking existance without throwing error

    if (dbError) {
      console.error('[Forgot Password] Supabase DB Error:', dbError);
      return res.status(500).json({ error: 'Database connection error' });
    }

    if (!user) {
      console.warn(`[Forgot Password] Warning: User not found for email ${email}`);
      return res.status(404).json({ error: 'User with this email does not exist' });
    }

    // 3. Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log(`[Forgot Password] Reset URL generated for ${user.full_name}`);

    // 4. Send email via Resend SDK professionally
    try {
      console.log(`[Forgot Password] Attempting to send email via Resend to: ${email}`);
      
      const { data, error: mailError } = await resend.emails.send({
        from: 'onboarding@resend.dev', // Must use this for unverified trial accounts
        to: email,
        subject: 'Password Reset Request - Apna Rooms',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">Apna Rooms</h1>
              <p style="color: #64748b; font-size: 16px;">Secure PG Management System</p>
            </div>
            
            <h2 style="color: #1e293b; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              Hello <strong>${user.full_name}</strong>,<br><br>
              We received a request to reset your password for your Apna Rooms account. If you didn't make this request, you can safely ignore this email.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Reset Password Now
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              This link will expire in 1 hour for your security. If the button above doesn't work, copy and paste this URL into your browser:<br>
              <span style="color: #2563eb; word-break: break-all;">${resetUrl}</span>
            </p>
            
            <div style="text-align: center; margin-top: 40px;">
              <p style="color: #64748b; font-size: 12px;">&copy; ${new Date().getFullYear()} Apna Rooms. All rights reserved.</p>
            </div>
          </div>
        `
      });

      if (mailError) {
        console.error('[Forgot Password] Resend API Error:', mailError);
        
        // Professional handling of Resend Trial restrictions
        if (mailError.message?.includes('testing emails to your own email address') || mailError.status === 403) {
          return res.status(403).json({ 
            error: 'Email delivery restricted. For trial accounts, you can only send emails to your own registered email address (sakshamshakya319@gmail.com). Please verify your domain in Resend to send to others.',
            restriction: 'trial_limit'
          });
        }
        
        return res.status(500).json({ error: 'Failed to send reset email via mail service' });
      }

      console.log(`[Forgot Password] Success: Email sent to ${email}. Message ID: ${data?.id}`);
      res.status(200).json({ message: 'Password reset link sent to your email' });
    } catch (mailError) {
      console.error('[Forgot Password] Unexpected Mail Service Error:', mailError);
      return res.status(500).json({ error: 'An error occurred while sending reset email' });
    }
  } catch (error) {
    console.error('[Forgot Password] Global Internal Error:', error);
    res.status(500).json({ error: 'Internal server error during forgot password' });
  }
};

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // 1. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // 2. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Update password in database
    const { error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword, 
        updated_at: new Date() 
      })
      .eq('id', decoded.id);

    if (error) throw error;

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Reset link has expired' });
    }
    res.status(400).json({ error: 'Invalid or expired reset link' });
  }
};

module.exports = {
  signup,
  login,
  googleLogin,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};
