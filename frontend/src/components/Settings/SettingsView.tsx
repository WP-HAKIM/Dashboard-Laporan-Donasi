import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Type, 
  Monitor, 
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Upload,
  X
} from 'lucide-react';
import { useAppSettings, AppSettings } from '../../hooks/useAppSettings';

const colorPresets = [
  { name: 'Biru (Default)', primary: '#2563eb', secondary: '#3b82f6' },
  { name: 'Hijau', primary: '#059669', secondary: '#10b981' },
  { name: 'Ungu', primary: '#7c3aed', secondary: '#8b5cf6' },
  { name: 'Merah', primary: '#dc2626', secondary: '#ef4444' },
  { name: 'Orange', primary: '#ea580c', secondary: '#f97316' },
  { name: 'Pink', primary: '#db2777', secondary: '#ec4899' },
  { name: 'Indigo', primary: '#4f46e5', secondary: '#6366f1' },
  { name: 'Teal', primary: '#0d9488', secondary: '#14b8a6' }
];

export default function SettingsView() {
  const { settings, updateSettings, resetSettings, applySettings } = useAppSettings();
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string | null>(null);

  // Cleanup preview URL on component unmount
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      if (faviconPreviewUrl) {
        URL.revokeObjectURL(faviconPreviewUrl);
      }
    };
  }, [logoPreviewUrl, faviconPreviewUrl]);

  const handleSettingChange = (key: keyof AppSettings, value: string) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    
    if (previewMode) {
      applySettings(newSettings);
    }
  };

  const handleColorPresetSelect = (preset: typeof colorPresets[0]) => {
    const newSettings = {
      ...localSettings,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    };
    setLocalSettings(newSettings);
    
    if (previewMode) {
      applySettings(newSettings);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateSettings(localSettings, logoFile || undefined, faviconFile || undefined);
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 3000);
      
      // Clear logo file after successful save
      if (logoFile) {
        setLogoFile(null);
        if (logoPreviewUrl) {
          URL.revokeObjectURL(logoPreviewUrl);
          setLogoPreviewUrl(null);
        }
      }
      
      // Clear favicon file after successful save
      if (faviconFile) {
        setFaviconFile(null);
        if (faviconPreviewUrl) {
          URL.revokeObjectURL(faviconPreviewUrl);
          setFaviconPreviewUrl(null);
        }
      }
    } catch (error) {
      setSaveError('Gagal menyimpan pengaturan. Silakan coba lagi.');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await resetSettings();
      setLocalSettings(settings);
      setLogoFile(null);
      setLogoPreviewUrl(null);
      setFaviconFile(null);
      setFaviconPreviewUrl(null);
    } catch (error) {
      setSaveError('Gagal mereset pengaturan. Silakan coba lagi.');
      console.error('Error resetting settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validasi tipe file
      if (!file.type.startsWith('image/')) {
        setSaveError('File harus berupa gambar (PNG, JPG, GIF, dll.)');
        return;
      }
      
      // Validasi ukuran file (maksimal 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setSaveError('Ukuran file maksimal 2MB');
        return;
      }
      
      setLogoFile(file);
      setSaveError(null);
      
      // Buat preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreviewUrl(previewUrl);
      
      // Update local settings dengan preview URL
      const newSettings = { ...localSettings, logoUrl: previewUrl };
      setLocalSettings(newSettings);
      
      if (previewMode) {
        applySettings(newSettings);
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(null);
    }
    
    const newSettings = { ...localSettings, logoUrl: '' };
    setLocalSettings(newSettings);
    
    if (previewMode) {
      applySettings(newSettings);
    }
  };

  const handleFaviconFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validasi tipe file
      if (!file.type.startsWith('image/')) {
        setSaveError('File harus berupa gambar (PNG, JPG, ICO, dll.)');
        return;
      }
      
      // Validasi ukuran file (maksimal 1MB)
      if (file.size > 1 * 1024 * 1024) {
        setSaveError('Ukuran file favicon maksimal 1MB');
        return;
      }
      
      setFaviconFile(file);
      setSaveError(null);
      
      // Buat preview URL
      const previewUrl = URL.createObjectURL(file);
      setFaviconPreviewUrl(previewUrl);
      
      // Update local settings dengan preview URL
      const newSettings = { ...localSettings, faviconUrl: previewUrl };
      setLocalSettings(newSettings);
      
      if (previewMode) {
        applySettings(newSettings);
      }
    }
  };

  const handleRemoveFavicon = () => {
    setFaviconFile(null);
    if (faviconPreviewUrl) {
      URL.revokeObjectURL(faviconPreviewUrl);
      setFaviconPreviewUrl(null);
    }
    
    const newSettings = { ...localSettings, faviconUrl: '' };
    setLocalSettings(newSettings);
    
    if (previewMode) {
      applySettings(newSettings);
    }
  };

  const togglePreview = () => {
    if (!previewMode) {
      applySettings(localSettings);
    } else {
      // Restore current saved settings
      applySettings(settings);
    }
    setPreviewMode(!previewMode);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pengaturan Tampilan</h2>
        <p className="text-gray-600">Sesuaikan tampilan aplikasi sesuai preferensi Anda</p>
      </div>

      {/* Save Notification */}
      {showSaveNotification && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Save className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Pengaturan berhasil disimpan!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {saveError}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Settings */}
        <div className="space-y-6">
          {/* App Title Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Type className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Judul Aplikasi</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Aplikasi
                </label>
                <input
                  type="text"
                  value={localSettings.appTitle}
                  onChange={(e) => handleSettingChange('appTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dashboard Donasi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Aplikasi (Opsional)
                </label>
                
                {/* File Upload Area */}
                <div className="space-y-3">
                  {/* Current Logo Preview */}
                  {(logoPreviewUrl || localSettings.logoUrl) && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <img 
                        src={logoPreviewUrl || localSettings.logoUrl} 
                        alt="Logo Preview" 
                        className="w-12 h-12 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {logoFile ? logoFile.name : 'Logo saat ini'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : 'Logo dari URL'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Hapus logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="relative">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">
                          {logoFile || localSettings.logoUrl ? 'Ganti Logo' : 'Upload Logo'}
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF hingga 2MB
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Resolusi rekomendasi: 64x64px atau 128x128px
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Upload gambar untuk logo aplikasi. Logo akan ditampilkan dengan ukuran 64x64px. Kosongkan untuk menggunakan ikon default.
                </p>
              </div>
            </div>
          </div>

          {/* Favicon Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Monitor className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Favicon</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favicon Aplikasi
                </label>
                <div className="space-y-3">
                  {/* Current Favicon Preview */}
                  {(faviconFile || localSettings.faviconUrl) && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden">
                        <img
                          src={faviconFile ? URL.createObjectURL(faviconFile) : localSettings.faviconUrl}
                          alt="Favicon preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {faviconFile ? faviconFile.name : 'Favicon saat ini'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {faviconFile ? `${(faviconFile.size / 1024).toFixed(1)} KB` : 'Favicon aktif'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFaviconFile(null);
                          setLocalSettings(prev => ({ ...prev, faviconUrl: '' }));
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  <div className="relative">
                    <input
                      type="file"
                      id="favicon-upload"
                      accept="image/*"
                      onChange={handleFaviconFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="favicon-upload"
                      className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">
                          {faviconFile || localSettings.faviconUrl ? 'Ganti Favicon' : 'Upload Favicon'}
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, ICO hingga 1MB
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Resolusi rekomendasi: 16x16px atau 32x32px
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  Upload gambar untuk favicon aplikasi. Favicon akan ditampilkan di tab browser. Kosongkan untuk menggunakan favicon default.
                </p>
              </div>
            </div>
          </div>

          {/* Color Presets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Palette className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Preset Warna</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {colorPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handleColorPresetSelect(preset)}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex space-x-1 mr-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: preset.primary }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: preset.secondary }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Palette className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Warna Kustom</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warna Primer
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={localSettings.primaryColor}
                      onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localSettings.primaryColor}
                      onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warna Sekunder
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={localSettings.secondaryColor}
                      onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localSettings.secondaryColor}
                      onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warna Latar Belakang
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={localSettings.backgroundColor}
                      onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localSettings.backgroundColor}
                      onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warna Sidebar
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={localSettings.sidebarColor}
                      onChange={(e) => handleSettingChange('sidebarColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localSettings.sidebarColor}
                      onChange={(e) => handleSettingChange('sidebarColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Actions */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Monitor className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              </div>
              <button
                onClick={togglePreview}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  previewMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {previewMode ? 'Matikan Preview' : 'Aktifkan Preview'}
                </span>
              </button>
            </div>
            
            {/* Mini Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div 
                className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
                style={{ 
                  backgroundColor: localSettings.backgroundColor,
                  borderColor: localSettings.primaryColor + '40'
                }}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {localSettings.logoUrl ? (
                      <img 
                        src={localSettings.logoUrl} 
                        alt="Logo Preview" 
                        className="w-8 h-8 rounded object-cover mr-2"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center mr-2"
                        style={{ backgroundColor: localSettings.primaryColor }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                    )}
                    <h4 
                      className="font-bold text-lg"
                      style={{ color: localSettings.primaryColor }}
                    >
                      {localSettings.appTitle}
                    </h4>
                  </div>
                  <p className="text-sm mt-1" style={{ color: localSettings.textColor }}>
                    Preview tampilan aplikasi
                  </p>
                  <div className="flex justify-center space-x-2 mt-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: localSettings.primaryColor }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: localSettings.secondaryColor }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 mt-3">
              {previewMode 
                ? 'Preview aktif - perubahan langsung diterapkan' 
                : 'Aktifkan preview untuk melihat perubahan secara real-time'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi</h3>
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                  isSaving 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSaving ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="font-medium">{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
              </button>
              
              <button
                onClick={handleReset}
                disabled={isSaving}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                  isSaving 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSaving ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                <span className="font-medium">{isSaving ? 'Mereset...' : 'Reset ke Default'}</span>
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Catatan:</strong> Pengaturan akan disimpan di server dan diterapkan untuk semua pengguna yang mengakses aplikasi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}