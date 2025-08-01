import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';
import { User, Eye, EyeOff, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function ProfileView() {
  const { user, updateUser } = useAuth();

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Admin',
      validator: 'Validator',
      volunteer: 'Relawan',
      branch: 'Cabang'
    };
    return labels[role as keyof typeof labels] || role;
  };
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    
    // If user wants to change password
    if (formData.password || formData.current_password) {
      if (!formData.current_password) {
        newErrors.current_password = 'Password saat ini wajib diisi untuk mengubah password';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password baru wajib diisi';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password minimal 8 karakter';
      }
      
      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Konfirmasi password tidak cocok';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };
      
      // Only include password fields if user wants to change password
      if (formData.password) {
        updateData.current_password = formData.current_password;
        updateData.password = formData.password;
        updateData.password_confirmation = formData.password_confirmation;
      }
      
      const response = await authAPI.updateProfile(updateData);
      
      setMessage({ type: 'success', text: response.message });
      setIsEditing(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        current_password: '',
        password: '',
        password_confirmation: ''
      }));
      
      // If email was changed, re-login to update token
      if (formData.email !== user?.email) {
        // Update user data in auth context
        window.location.reload();
      }
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setMessage({ type: 'error', text: error.response.data.message });
      } else {
        setMessage({ type: 'error', text: 'Terjadi kesalahan saat memperbarui profile' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      current_password: '',
      password: '',
      password_confirmation: ''
    });
    setErrors({});
    setMessage(null);
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Profile Saya</h1>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success/Error Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan nama lengkap"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {user.name}
                  </div>
                )}
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Masukkan email"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {user.email}
                  </div>
                )}
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan nomor telepon"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {user.phone || '-'}
                  </div>
                )}
              </div>

              {/* Role (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full capitalize ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'validator' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'branch' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Organization Info (Read-only) */}
            {(user.branch || user.team) && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Organisasi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.branch && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cabang
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {user.branch.name}
                      </div>
                    </div>
                  )}
                  
                  {user.team && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tim
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {user.team.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Password Change Section */}
            {isEditing && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Ubah Password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Kosongkan jika tidak ingin mengubah password
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Saat Ini
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="current_password"
                        value={formData.current_password}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.current_password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Password saat ini"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.current_password && (
                      <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Password baru"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.password_confirmation ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Konfirmasi password baru"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password_confirmation && (
                      <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}