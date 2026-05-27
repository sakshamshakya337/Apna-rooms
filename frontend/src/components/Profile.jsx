import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Lock, Save, Loader2, CheckCircle2, Phone, MapPin, Building, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { userData, updateProfile, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
    parentPhoneNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    studentCategory: 'National'
  });

  useEffect(() => {
    if (userData) {
      setProfileData({
        fullName: userData.fullName || '',
        phoneNumber: userData.phoneNumber || '',
        parentPhoneNumber: userData.parentPhoneNumber || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        pincode: localStorage.getItem('user_pincode_' + userData.id) || '',
        studentCategory: userData.studentCategory || 'National'
      });

      const category = userData.studentCategory || 'National';
      const savedPincode = localStorage.getItem('user_pincode_' + userData.id) || '';
      const incomplete = 
        !userData.fullName?.trim() ||
        !userData.phoneNumber?.trim() ||
        (category !== 'International' && !userData.parentPhoneNumber?.trim()) ||
        (category !== 'International' && !savedPincode.trim()) ||
        !userData.address?.trim() ||
        !userData.city?.trim() ||
        !userData.state?.trim();

      if (incomplete) {
        setEditing(true);
      }
    }
  }, [userData]);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handlePincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 6);
    setProfileData(prev => ({ ...prev, pincode: value }));

    if (value.length === 6) {
      const loadingToast = toast.loading('Fetching Indian postal details...');
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await response.json();
        
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice[0]) {
          const postOffice = data[0].PostOffice[0];
          setProfileData(prev => ({
            ...prev,
            city: postOffice.District || '',
            state: postOffice.State || '',
            address: prev.address ? prev.address : (postOffice.Name || '')
          }));
          
          if (userData?.id) {
            localStorage.setItem('user_pincode_' + userData.id, value);
          }
          
          toast.success(`Location detected: ${postOffice.Name || postOffice.District}, ${postOffice.District}, ${postOffice.State}`, { id: loadingToast });
        } else {
          toast.error('Invalid pincode or postal data not found.', { id: loadingToast });
        }
      } catch (err) {
        console.error('Pincode fetch error:', err);
        toast.error('Failed to fetch postal details. Enter City and State manually.', { id: loadingToast });
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const isInt = profileData.studentCategory === 'International';
    if (!profileData.fullName?.trim()) {
      return toast.error('Full name is required.');
    }
    if (!profileData.phoneNumber?.trim()) {
      return toast.error('Student phone number is required.');
    }
    if (!isInt && !profileData.parentPhoneNumber?.trim()) {
      return toast.error('Parent phone number is required.');
    }
    if (!isInt && !profileData.pincode?.trim()) {
      return toast.error('Pincode is required for Indian national students.');
    }
    if (!profileData.address?.trim()) {
      return toast.error('Home address is required.');
    }
    if (!profileData.city?.trim()) {
      return toast.error('City is required.');
    }
    if (!profileData.state?.trim()) {
      return toast.error('State is required.');
    }

    setLoading(true);
    try {
      await updateProfile(profileData);
      if (userData?.id && profileData.pincode) {
        localStorage.setItem('user_pincode_' + userData.id, profileData.pincode);
      }
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const isInternational = profileData.studentCategory === 'International';
  const profileNeedsBookingInfo = 
    !profileData.fullName?.trim() ||
    !profileData.phoneNumber?.trim() ||
    (!isInternational && !profileData.parentPhoneNumber?.trim()) ||
    (!isInternational && !profileData.pincode?.trim()) ||
    !profileData.address?.trim() ||
    !profileData.city?.trim() ||
    !profileData.state?.trim();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error('Passwords do not match');
    }
    if (passwords.new.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await changePassword(passwords.current, passwords.new);
      toast.success('Password changed successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="border-b border-border-low pb-6">
        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">My Profile</h2>
        <p className="text-text-secondary text-sm">Manage your professional resident credentials and security keys.</p>
      </div>

      {profileNeedsBookingInfo && (
        <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-lg text-xs font-semibold leading-relaxed">
          <p className="font-bold">Information Complete Required</p>
          <p className="opacity-85 mt-0.5">Please populate your student classification and phone numbers to unlock stay verification checklist files.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Personal Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-main p-6 border border-border-low rounded-xl space-y-6 shadow-sm">
            
            <div className="flex justify-between items-center pb-4 border-b border-border-low">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-primary shrink-0" />
                <span>Personal Information</span>
              </h3>
              {!editing && (
                <button 
                  onClick={() => setEditing(true)}
                  className="text-xs font-bold text-primary hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">Full Name <span className="text-error font-extrabold">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 shrink-0" />
                    <input 
                      type="text" 
                      disabled={!editing}
                      required
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                      className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 pl-10 pr-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">Resident Phone Number <span className="text-error font-extrabold">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 shrink-0" />
                    <input 
                      type="text" 
                      disabled={!editing}
                      required
                      placeholder="E.g. +91 9876543210"
                      value={profileData.phoneNumber}
                      onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                      className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 pl-10 pr-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {!isInternational && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">Parent / Guardian Phone Number <span className="text-error font-extrabold">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 shrink-0" />
                    <input
                      type="text"
                      disabled={!editing}
                      required
                      placeholder="E.g. +91 9876543211"
                      value={profileData.parentPhoneNumber}
                      onChange={(e) => setProfileData({...profileData, parentPhoneNumber: e.target.value})}
                      className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 pl-10 pr-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold disabled:opacity-60"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">Home Address <span className="text-error font-extrabold">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 shrink-0" />
                  <input 
                    type="text" 
                    disabled={!editing}
                    required
                    placeholder="House No, Road, Locality"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 pl-10 pr-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold disabled:opacity-60"
                  />
                </div>
              </div>

              {!isInternational && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">Pincode (India) <span className="text-error font-extrabold">*</span></label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 shrink-0" />
                    <input 
                      type="text" 
                      disabled={!editing}
                      required
                      maxLength={6}
                      placeholder="E.g. 110001"
                      value={profileData.pincode || ''}
                      onChange={handlePincodeChange}
                      className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 pl-10 pr-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold disabled:opacity-60"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">City <span className="text-error font-extrabold">*</span></label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 shrink-0" />
                    <input 
                      type="text" 
                      disabled={!editing}
                      required
                      placeholder="City"
                      value={profileData.city}
                      onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                      className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 pl-10 pr-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">State <span className="text-error font-extrabold">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 shrink-0" />
                    <input 
                      type="text" 
                      disabled={!editing}
                      required
                      placeholder="State"
                      value={profileData.state}
                      onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                      className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 pl-10 pr-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">Student Origin Classification <span className="text-error font-extrabold">*</span></label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 shrink-0" />
                    <select 
                      disabled={!editing}
                      required
                      value={profileData.studentCategory}
                      onChange={(e) => setProfileData({...profileData, studentCategory: e.target.value})}
                      className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 pl-10 pr-3 text-text-primary text-sm font-bold focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors disabled:opacity-60 cursor-pointer appearance-none"
                    >
                      <option value="National" className="bg-surface-main">National Student (India)</option>
                      <option value="International" className="bg-surface-main">International Student</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">Account Identity Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 shrink-0" />
                    <input 
                      type="email" 
                      disabled
                      value={userData?.email || ''}
                      className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 pl-10 pr-3 text-text-primary text-sm font-semibold opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">System Permission Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4 shrink-0" />
                    <input 
                      type="text" 
                      disabled
                      value={userData?.role?.toUpperCase() || 'USER'}
                      className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 pl-10 pr-3 text-primary text-sm font-bold opacity-60 cursor-not-allowed uppercase"
                    />
                  </div>
                </div>

                {editing && (
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Changes</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setProfileData({
                          fullName: userData?.fullName || '',
                          phoneNumber: userData?.phoneNumber || '',
                          parentPhoneNumber: userData?.parentPhoneNumber || '',
                          address: userData?.address || '',
                          city: userData?.city || '',
                          state: userData?.state || '',
                          studentCategory: userData?.studentCategory || 'National'
                        });
                      }}
                      className="px-6 py-2.5 bg-surface-container border border-border-low text-text-primary rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>

          </div>
        </div>

        {/* Security / Password updates */}
        <div className="space-y-6">
          <div className="bg-surface-main p-6 border border-border-low rounded-xl space-y-6 shadow-sm">
            <h3 className="font-bold text-base text-text-primary flex items-center gap-2 pb-4 border-b border-border-low">
              <Lock className="w-4 h-4 text-primary shrink-0" />
              <span>Password Security</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">Current Key</label>
                <input 
                  type="password" 
                  required
                  value={passwords.current}
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 px-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">New Key</label>
                <input 
                  type="password" 
                  required
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 px-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-text-secondary tracking-wider ml-1">Confirm New Key</label>
                <input 
                  type="password" 
                  required
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  className="w-full bg-surface-container-low border border-border-low rounded-lg py-2.5 px-3 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:bg-surface-container-high focus:outline-none transition-colors text-sm font-semibold"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Update Password</span>
              </button>
            </form>
          </div>

          <div className="bg-success/5 border border-success/30 p-5 rounded-xl space-y-2">
            <h4 className="font-bold text-text-primary text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-success" />
              <span>Verified Account State</span>
            </h4>
            <p className="text-text-secondary text-xs leading-relaxed font-semibold">
              Your account is fully synchronized and protected using secure database row policies.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
