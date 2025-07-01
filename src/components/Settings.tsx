import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Database, MessageCircle, Mail, Phone, Globe, Clock, DollarSign, Printer, Save, TestTube as Test, Download, Upload, RefreshCw, AlertTriangle, CheckCircle, Eye, EyeOff, Key, Lock, Users, Monitor, HardDrive, Wifi, Volume2, VolumeX, Send, Bot, Zap, Calendar, FileText, Image, Smartphone, Cloud, Server, Timer, Activity, BarChart3, UserCheck, MessageSquare, PhoneCall, Target, TrendingUp, Filter, Tag, Star, Heart, Gift, Megaphone, Headphones, PlayCircle, PauseCircle, Link, Code, Layers, Settings2, Cpu, Receipt, FileImage, Scissors, Maximize, RotateCcw, CreditCard } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'printer' | 'api' | 'notifications' | 'security' | 'backup' | 'whatsapp-crm' | 'system'>('general');
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  // General Settings State
  const [generalSettings, setGeneralSettings] = useState({
    businessName: 'Gaming & Billiard Center',
    businessAddress: 'Jl. Sudirman No. 123, Jakarta',
    businessPhone: '+62 21-1234-5678',
    businessEmail: 'info@gamingcenter.com',
    timezone: 'Asia/Jakarta',
    language: 'id',
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    taxRate: 10,
    receiptFooter: 'Terima kasih atas kunjungan Anda!'
  });

  // Printer Settings State
  const [printerSettings, setPrinterSettings] = useState({
    // Receipt Printer
    receiptPrinterEnabled: true,
    receiptPrinterName: 'Thermal Printer',
    receiptPrinterType: 'thermal',
    receiptPrinterConnection: 'usb',
    receiptPrinterPort: 'USB001',
    receiptPrinterIp: '192.168.1.200',
    
    // Paper Settings
    paperSize: '80mm',
    paperType: 'thermal',
    printDensity: 'medium',
    printSpeed: 'normal',
    
    // Receipt Layout
    receiptWidth: 48, // characters
    receiptMargin: 2,
    logoEnabled: true,
    logoSize: 'small',
    headerEnabled: true,
    footerEnabled: true,
    qrCodeEnabled: true,
    barcodeEnabled: false,
    
    // Print Options
    autoCut: true,
    cashDrawerKick: true,
    printCopies: 1,
    printPreview: false,
    
    // A4 Printer (for reports)
    a4PrinterEnabled: true,
    a4PrinterName: 'HP LaserJet',
    a4PrinterType: 'laser',
    a4PaperSize: 'A4',
    a4Orientation: 'portrait',
    a4Margins: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20
    },
    
    // Label Printer
    labelPrinterEnabled: false,
    labelPrinterName: 'Brother QL-800',
    labelSize: '62x29mm',
    labelType: 'continuous',
    
    // Print Quality
    printQuality: 'high',
    colorMode: 'monochrome',
    duplexMode: 'none'
  });

  // API Settings State
  const [apiSettings, setApiSettings] = useState({
    // General API Settings
    apiBaseUrl: 'https://api.gamingcenter.com',
    apiVersion: 'v1',
    apiTimeout: 30,
    apiRetries: 3,
    apiRateLimit: 1000, // requests per hour
    
    // Authentication
    apiKeyEnabled: true,
    apiKey: '',
    jwtEnabled: false,
    jwtSecret: '',
    jwtExpiry: 24, // hours
    
    // External APIs
    // Payment Gateway
    paymentGatewayEnabled: true,
    paymentProvider: 'midtrans',
    paymentApiKey: '',
    paymentSecretKey: '',
    paymentEnvironment: 'sandbox',
    
    // SMS Gateway
    smsGatewayEnabled: true,
    smsProvider: 'twilio',
    smsApiKey: '',
    smsApiSecret: '',
    smsFromNumber: '',
    
    // Email Service
    emailServiceEnabled: true,
    emailProvider: 'sendgrid',
    emailApiKey: '',
    emailFromAddress: '',
    emailFromName: '',
    
    // Cloud Storage
    cloudStorageEnabled: false,
    cloudProvider: 'aws-s3',
    cloudApiKey: '',
    cloudSecretKey: '',
    cloudBucket: '',
    cloudRegion: 'ap-southeast-1',
    
    // Analytics
    analyticsEnabled: false,
    analyticsProvider: 'google-analytics',
    analyticsTrackingId: '',
    analyticsApiKey: '',
    
    // Maps & Location
    mapsEnabled: false,
    mapsProvider: 'google-maps',
    mapsApiKey: '',
    
    // Push Notifications
    pushNotificationEnabled: false,
    pushProvider: 'firebase',
    pushServerKey: '',
    pushSenderId: '',
    
    // Webhook Settings
    webhookEnabled: false,
    webhookUrl: '',
    webhookSecret: '',
    webhookEvents: ['payment.success', 'booking.created', 'rental.completed'],
    
    // API Security
    corsEnabled: true,
    corsOrigins: '*',
    rateLimitingEnabled: true,
    ipWhitelistEnabled: false,
    ipWhitelist: '',
    
    // Logging
    apiLoggingEnabled: true,
    logLevel: 'info',
    logRequests: true,
    logResponses: false,
    logErrors: true
  });

  // WhatsApp CRM Settings State
  const [whatsappCrmSettings, setWhatsappCrmSettings] = useState({
    // API Configuration
    apiProvider: 'whatsapp-business',
    phoneNumberId: '',
    accessToken: '',
    webhookUrl: '',
    verifyToken: '',
    
    // Auto-Reply Settings
    autoReplyEnabled: true,
    welcomeMessage: 'Halo! Selamat datang di Gaming & Billiard Center 🎮\n\nSilakan pilih layanan:\n1️⃣ Booking PlayStation\n2️⃣ Booking Billiard\n3️⃣ Info Harga\n4️⃣ Hubungi Staff',
    businessHours: {
      enabled: true,
      start: '09:00',
      end: '23:00',
      closedMessage: 'Maaf, kami sedang tutup. Jam operasional: 09:00 - 23:00 WIB'
    },
    
    // Campaign Settings
    campaignEnabled: true,
    birthdayMessages: true,
    promotionalMessages: true,
    reminderMessages: true,
    
    // Customer Segmentation
    segmentationEnabled: true,
    vipCustomerThreshold: 1000000, // Rp 1 juta total spending
    frequentCustomerVisits: 10, // 10+ visits
    
    // Message Templates
    templates: {
      bookingConfirmation: 'Booking Anda telah dikonfirmasi!\n\n📅 Tanggal: {date}\n⏰ Waktu: {time}\n🎮 Console: {console}\n💰 Total: Rp {amount}\n\nTerima kasih!',
      paymentReminder: 'Halo {name}, Anda memiliki tagihan sebesar Rp {amount} yang belum dibayar. Silakan lakukan pembayaran sebelum {dueDate}.',
      birthdayGreeting: 'Selamat ulang tahun {name}! 🎉\n\nDapatkan diskon 20% untuk semua layanan hari ini. Gunakan kode: BIRTHDAY20',
      loyaltyReward: 'Selamat {name}! Anda telah menjadi member VIP kami 🌟\n\nNikmati benefit eksklusif dan diskon khusus member VIP.',
      newPromotion: '🔥 PROMO SPESIAL! 🔥\n\n{promoTitle}\n{promoDescription}\n\nBerlaku sampai: {validUntil}\nKode: {promoCode}'
    },
    
    // Analytics & Reporting
    analyticsEnabled: true,
    reportFrequency: 'weekly', // daily, weekly, monthly
    trackDeliveryStatus: true,
    trackReadStatus: true,
    
    // Integration Settings
    syncWithCustomerDb: true,
    syncWithBookingSystem: true,
    syncWithPosSystem: true,
    
    // Chatbot Settings
    chatbotEnabled: true,
    aiResponseEnabled: false,
    fallbackToHuman: true,
    maxAutoResponses: 3
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    // Email Settings
    emailEnabled: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpEncryption: 'TLS',
    
    // WhatsApp Business Settings
    whatsappEnabled: true,
    whatsappBusinessNumber: '',
    whatsappApiKey: '',
    
    // SMS Settings
    smsEnabled: false,
    smsProvider: 'twilio',
    smsApiKey: '',
    smsFromNumber: '',
    
    // Notification Types
    bookingReminders: true,
    paymentAlerts: true,
    stockAlerts: true,
    dailyReports: true,
    weeklyReports: true,
    systemAlerts: true,
    
    // Sound Notifications
    soundEnabled: true,
    soundVolume: 70,
    newBookingSound: true,
    paymentSound: true,
    alertSound: true,
    
    // Timing
    reminderHours: 24,
    stockThreshold: 10,
    reportTime: '08:00'
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    // Password Policy
    minPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    passwordExpiry: 90,
    
    // Session Management
    sessionTimeout: 30,
    maxConcurrentSessions: 3,
    autoLogout: true,
    
    // Two-Factor Authentication
    twoFactorEnabled: false,
    twoFactorMethod: 'app',
    
    // Access Control
    ipWhitelistEnabled: false,
    allowedIPs: '',
    requireVPN: false,
    
    // Audit & Logging
    auditLogging: true,
    logRetentionDays: 90,
    logFailedLogins: true,
    
    // Data Protection
    dataEncryption: true,
    screenLockTimeout: 15,
    hideBalances: false
  });

  // Backup Settings State
  const [backupSettings, setBackupSettings] = useState({
    // Automatic Backup
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    retentionDays: 30,
    
    // Storage Location
    storageType: 'local',
    cloudProvider: 'google',
    cloudPath: '/backups',
    
    // Backup Content
    includeDatabase: true,
    includeFiles: true,
    includeImages: true,
    includeLogs: false,
    includeSettings: true,
    
    // Security
    encryptBackups: true,
    compressionLevel: 'medium',
    encryptionKey: '',
    
    // Last Backup Info
    lastBackupDate: '2024-12-28T02:00:00',
    lastBackupSize: '245 MB',
    lastBackupStatus: 'success'
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    // Performance
    maxUsers: 50,
    cacheEnabled: true,
    compressionEnabled: true,
    
    // Database
    connectionPoolSize: 10,
    queryTimeout: 30,
    maintenanceWindow: '02:00-04:00',
    
    // Logging
    logLevel: 'info',
    logRotation: true,
    maxLogSize: 100,
    
    // Hardware
    defaultPrinter: 'Thermal Printer',
    cashDrawerEnabled: true,
    barcodeScanner: 'USB Scanner',
    
    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: 'Sistem sedang dalam maintenance. Silakan coba lagi nanti.',
    
    // Updates
    autoUpdates: false,
    updateChannel: 'stable',
    healthCheckInterval: 5
  });

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    // Simulate email test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTestingEmail(false);
    alert('Test email berhasil dikirim!');
  };

  const handleTestWhatsApp = async () => {
    setIsTestingWhatsApp(true);
    // Simulate WhatsApp test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTestingWhatsApp(false);
    alert('Test WhatsApp berhasil dikirim!');
  };

  const handleTestPrinter = async () => {
    setIsTestingPrinter(true);
    // Simulate printer test
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsTestingPrinter(false);
    alert('Test print berhasil! Silakan cek printer Anda.');
  };

  const handleTestApi = async (apiType: string) => {
    setIsTestingApi(true);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTestingApi(false);
    alert(`Test ${apiType} API berhasil!`);
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    // Simulate backup progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setBackupProgress(i);
    }
    
    setIsBackingUp(false);
    alert('Backup berhasil dibuat!');
  };

  const handleSaveSettings = () => {
    // Here you would save settings to your backend
    alert('Pengaturan berhasil disimpan!');
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Bisnis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bisnis</label>
            <input
              type="text"
              value={generalSettings.businessName}
              onChange={(e) => setGeneralSettings({...generalSettings, businessName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
            <input
              type="text"
              value={generalSettings.businessPhone}
              onChange={(e) => setGeneralSettings({...generalSettings, businessPhone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              value={generalSettings.businessAddress}
              onChange={(e) => setGeneralSettings({...generalSettings, businessAddress: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={generalSettings.businessEmail}
              onChange={(e) => setGeneralSettings({...generalSettings, businessEmail: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengaturan Regional</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zona Waktu</label>
            <select
              value={generalSettings.timezone}
              onChange={(e) => setGeneralSettings({...generalSettings, timezone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bahasa</label>
            <select
              value={generalSettings.language}
              onChange={(e) => setGeneralSettings({...generalSettings, language: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format Tanggal</label>
            <select
              value={generalSettings.dateFormat}
              onChange={(e) => setGeneralSettings({...generalSettings, dateFormat: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format Waktu</label>
            <select
              value={generalSettings.timeFormat}
              onChange={(e) => setGeneralSettings({...generalSettings, timeFormat: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="24h">24 Jam</option>
              <option value="12h">12 Jam (AM/PM)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengaturan Keuangan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarif Pajak (%)</label>
            <input
              type="number"
              value={generalSettings.taxRate}
              onChange={(e) => setGeneralSettings({...generalSettings, taxRate: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Uang</label>
            <select
              value={generalSettings.currency}
              onChange={(e) => setGeneralSettings({...generalSettings, currency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="IDR">Rupiah (IDR)</option>
              <option value="USD">US Dollar (USD)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Struk</label>
            <textarea
              value={generalSettings.receiptFooter}
              onChange={(e) => setGeneralSettings({...generalSettings, receiptFooter: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Pesan yang akan muncul di bagian bawah struk"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrinterSettings = () => (
    <div className="space-y-6">
      {/* Receipt Printer */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-blue-600" />
          Printer Struk (Thermal)
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Enable Receipt Printer</h4>
              <p className="text-sm text-gray-600">Aktifkan printer thermal untuk struk</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={printerSettings.receiptPrinterEnabled}
                onChange={(e) => setPrinterSettings({...printerSettings, receiptPrinterEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Printer</label>
              <input
                type="text"
                value={printerSettings.receiptPrinterName}
                onChange={(e) => setPrinterSettings({...printerSettings, receiptPrinterName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Thermal Printer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Printer</label>
              <select
                value={printerSettings.receiptPrinterType}
                onChange={(e) => setPrinterSettings({...printerSettings, receiptPrinterType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="thermal">Thermal</option>
                <option value="dot-matrix">Dot Matrix</option>
                <option value="inkjet">Inkjet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Koneksi</label>
              <select
                value={printerSettings.receiptPrinterConnection}
                onChange={(e) => setPrinterSettings({...printerSettings, receiptPrinterConnection: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="usb">USB</option>
                <option value="network">Network (IP)</option>
                <option value="bluetooth">Bluetooth</option>
                <option value="serial">Serial Port</option>
              </select>
            </div>
            {printerSettings.receiptPrinterConnection === 'network' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input
                  type="text"
                  value={printerSettings.receiptPrinterIp}
                  onChange={(e) => setPrinterSettings({...printerSettings, receiptPrinterIp: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="192.168.1.200"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <input
                  type="text"
                  value={printerSettings.receiptPrinterPort}
                  onChange={(e) => setPrinterSettings({...printerSettings, receiptPrinterPort: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="USB001"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Paper Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileImage className="h-5 w-5 text-green-600" />
          Pengaturan Kertas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran Kertas</label>
            <select
              value={printerSettings.paperSize}
              onChange={(e) => setPrinterSettings({...printerSettings, paperSize: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="58mm">58mm</option>
              <option value="80mm">80mm</option>
              <option value="110mm">110mm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Kertas</label>
            <select
              value={printerSettings.paperType}
              onChange={(e) => setPrinterSettings({...printerSettings, paperType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="thermal">Thermal</option>
              <option value="plain">Plain Paper</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kualitas Print</label>
            <select
              value={printerSettings.printDensity}
              onChange={(e) => setPrinterSettings({...printerSettings, printDensity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kecepatan Print</label>
            <select
              value={printerSettings.printSpeed}
              onChange={(e) => setPrinterSettings({...printerSettings, printSpeed: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="slow">Slow (High Quality)</option>
              <option value="normal">Normal</option>
              <option value="fast">Fast</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipt Layout */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Maximize className="h-5 w-5 text-purple-600" />
          Layout Struk
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lebar Struk (karakter)</label>
            <input
              type="number"
              value={printerSettings.receiptWidth}
              onChange={(e) => setPrinterSettings({...printerSettings, receiptWidth: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="32"
              max="80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Margin (karakter)</label>
            <input
              type="number"
              value={printerSettings.receiptMargin}
              onChange={(e) => setPrinterSettings({...printerSettings, receiptMargin: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran Logo</label>
            <select
              value={printerSettings.logoSize}
              onChange={(e) => setPrinterSettings({...printerSettings, logoSize: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {[
            { key: 'logoEnabled', label: 'Tampilkan Logo', desc: 'Cetak logo bisnis di header struk' },
            { key: 'headerEnabled', label: 'Tampilkan Header', desc: 'Cetak informasi bisnis di header' },
            { key: 'footerEnabled', label: 'Tampilkan Footer', desc: 'Cetak pesan footer di bawah struk' },
            { key: 'qrCodeEnabled', label: 'QR Code', desc: 'Cetak QR code untuk verifikasi' },
            { key: 'barcodeEnabled', label: 'Barcode', desc: 'Cetak barcode transaksi' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={printerSettings[item.key as keyof typeof printerSettings] as boolean}
                  onChange={(e) => setPrinterSettings({
                    ...printerSettings,
                    [item.key]: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Print Options */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-orange-600" />
          Opsi Pencetakan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'autoCut', label: 'Auto Cut', desc: 'Potong kertas otomatis setelah print' },
            { key: 'cashDrawerKick', label: 'Buka Cash Drawer', desc: 'Buka laci kasir otomatis setelah print' },
            { key: 'printPreview', label: 'Print Preview', desc: 'Tampilkan preview sebelum print' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={printerSettings[item.key as keyof typeof printerSettings] as boolean}
                  onChange={(e) => setPrinterSettings({
                    ...printerSettings,
                    [item.key]: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Copy</label>
            <input
              type="number"
              value={printerSettings.printCopies}
              onChange={(e) => setPrinterSettings({...printerSettings, printCopies: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="5"
            />
          </div>
        </div>
      </div>

      {/* A4 Printer */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Printer A4 (Laporan)
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Enable A4 Printer</h4>
              <p className="text-sm text-gray-600">Aktifkan printer A4 untuk laporan</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={printerSettings.a4PrinterEnabled}
                onChange={(e) => setPrinterSettings({...printerSettings, a4PrinterEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Printer A4</label>
              <input
                type="text"
                value={printerSettings.a4PrinterName}
                onChange={(e) => setPrinterSettings({...printerSettings, a4PrinterName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="HP LaserJet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Printer</label>
              <select
                value={printerSettings.a4PrinterType}
                onChange={(e) => setPrinterSettings({...printerSettings, a4PrinterType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="laser">Laser</option>
                <option value="inkjet">Inkjet</option>
                <option value="dot-matrix">Dot Matrix</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orientasi</label>
              <select
                value={printerSettings.a4Orientation}
                onChange={(e) => setPrinterSettings({...printerSettings, a4Orientation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Margin (mm)</label>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Top</label>
                <input
                  type="number"
                  value={printerSettings.a4Margins.top}
                  onChange={(e) => setPrinterSettings({
                    ...printerSettings, 
                    a4Margins: {...printerSettings.a4Margins, top: Number(e.target.value)}
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Bottom</label>
                <input
                  type="number"
                  value={printerSettings.a4Margins.bottom}
                  onChange={(e) => setPrinterSettings({
                    ...printerSettings, 
                    a4Margins: {...printerSettings.a4Margins, bottom: Number(e.target.value)}
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Left</label>
                <input
                  type="number"
                  value={printerSettings.a4Margins.left}
                  onChange={(e) => setPrinterSettings({
                    ...printerSettings, 
                    a4Margins: {...printerSettings.a4Margins, left: Number(e.target.value)}
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Right</label>
                <input
                  type="number"
                  value={printerSettings.a4Margins.right}
                  onChange={(e) => setPrinterSettings({
                    ...printerSettings, 
                    a4Margins: {...printerSettings.a4Margins, right: Number(e.target.value)}
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Print */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Test className="h-5 w-5 text-red-600" />
          Test Printer
        </h3>
        <div className="flex gap-4">
          <button
            onClick={handleTestPrinter}
            disabled={isTestingPrinter}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isTestingPrinter ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            {isTestingPrinter ? 'Testing...' : 'Test Print Struk'}
          </button>
          
          <button
            onClick={() => handleTestApi('A4 Printer')}
            disabled={isTestingApi}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isTestingApi ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isTestingApi ? 'Testing...' : 'Test Print A4'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      {/* General API Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          Pengaturan API Umum
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <input
              type="url"
              value={apiSettings.apiBaseUrl}
              onChange={(e) => setApiSettings({...apiSettings, apiBaseUrl: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://api.gamingcenter.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Version</label>
            <input
              type="text"
              value={apiSettings.apiVersion}
              onChange={(e) => setApiSettings({...apiSettings, apiVersion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="v1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (detik)</label>
            <input
              type="number"
              value={apiSettings.apiTimeout}
              onChange={(e) => setApiSettings({...apiSettings, apiTimeout: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="5"
              max="300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit (req/hour)</label>
            <input
              type="number"
              value={apiSettings.apiRateLimit}
              onChange={(e) => setApiSettings({...apiSettings, apiRateLimit: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="100"
              max="10000"
            />
          </div>
        </div>
      </div>

      {/* Authentication */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-green-600" />
          Authentication
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">API Key Authentication</h4>
              <p className="text-sm text-gray-600">Gunakan API key untuk autentikasi</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={apiSettings.apiKeyEnabled}
                onChange={(e) => setApiSettings({...apiSettings, apiKeyEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {apiSettings.apiKeyEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={apiSettings.apiKey}
                  onChange={(e) => setApiSettings({...apiSettings, apiKey: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your API key"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">JWT Authentication</h4>
              <p className="text-sm text-gray-600">Gunakan JWT token untuk autentikasi</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={apiSettings.jwtEnabled}
                onChange={(e) => setApiSettings({...apiSettings, jwtEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {apiSettings.jwtEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">JWT Secret</label>
                <input
                  type="password"
                  value={apiSettings.jwtSecret}
                  onChange={(e) => setApiSettings({...apiSettings, jwtSecret: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="JWT secret key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Token Expiry (hours)</label>
                <input
                  type="number"
                  value={apiSettings.jwtExpiry}
                  onChange={(e) => setApiSettings({...apiSettings, jwtExpiry: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="168"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Gateway */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-purple-600" />
          Payment Gateway
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Enable Payment Gateway</h4>
              <p className="text-sm text-gray-600">Integrasi dengan payment gateway</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={apiSettings.paymentGatewayEnabled}
                onChange={(e) => setApiSettings({...apiSettings, paymentGatewayEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {apiSettings.paymentGatewayEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={apiSettings.paymentProvider}
                  onChange={(e) => setApiSettings({...apiSettings, paymentProvider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="midtrans">Midtrans</option>
                  <option value="xendit">Xendit</option>
                  <option value="doku">DOKU</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                <select
                  value={apiSettings.paymentEnvironment}
                  onChange={(e) => setApiSettings({...apiSettings, paymentEnvironment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={apiSettings.paymentApiKey}
                  onChange={(e) => setApiSettings({...apiSettings, paymentApiKey: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Payment API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input
                  type="password"
                  value={apiSettings.paymentSecretKey}
                  onChange={(e) => setApiSettings({...apiSettings, paymentSecretKey: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Payment secret key"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SMS Gateway */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5 text-orange-600" />
          SMS Gateway
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Enable SMS Gateway</h4>
              <p className="text-sm text-gray-600">Kirim SMS otomatis ke customer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={apiSettings.smsGatewayEnabled}
                onChange={(e) => setApiSettings({...apiSettings, smsGatewayEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {apiSettings.smsGatewayEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={apiSettings.smsProvider}
                  onChange={(e) => setApiSettings({...apiSettings, smsProvider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="twilio">Twilio</option>
                  <option value="nexmo">Vonage (Nexmo)</option>
                  <option value="aws-sns">AWS SNS</option>
                  <option value="zenziva">Zenziva</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={apiSettings.smsApiKey}
                  onChange={(e) => setApiSettings({...apiSettings, smsApiKey: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SMS API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Number</label>
                <input
                  type="text"
                  value={apiSettings.smsFromNumber}
                  onChange={(e) => setApiSettings({...apiSettings, smsFromNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Service */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-red-600" />
          Email Service
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Enable Email Service</h4>
              <p className="text-sm text-gray-600">Kirim email otomatis ke customer</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={apiSettings.emailServiceEnabled}
                onChange={(e) => setApiSettings({...apiSettings, emailServiceEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {apiSettings.emailServiceEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={apiSettings.emailProvider}
                  onChange={(e) => setApiSettings({...apiSettings, emailProvider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="aws-ses">AWS SES</option>
                  <option value="smtp">Custom SMTP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={apiSettings.emailApiKey}
                  onChange={(e) => setApiSettings({...apiSettings, emailApiKey: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email API key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Address</label>
                <input
                  type="email"
                  value={apiSettings.emailFromAddress}
                  onChange={(e) => setApiSettings({...apiSettings, emailFromAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="noreply@gamingcenter.com"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cloud Storage */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Cloud className="h-5 w-5 text-indigo-600" />
          Cloud Storage
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Enable Cloud Storage</h4>
              <p className="text-sm text-gray-600">Simpan file di cloud storage</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={apiSettings.cloudStorageEnabled}
                onChange={(e) => setApiSettings({...apiSettings, cloudStorageEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {apiSettings.cloudStorageEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select
                  value={apiSettings.cloudProvider}
                  onChange={(e) => setApiSettings({...apiSettings, cloudProvider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="aws-s3">Amazon S3</option>
                  <option value="google-cloud">Google Cloud Storage</option>
                  <option value="azure">Azure Blob Storage</option>
                  <option value="digitalocean">DigitalOcean Spaces</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                  value={apiSettings.cloudRegion}
                  onChange={(e) => setApiSettings({...apiSettings, cloudRegion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  <option value="ap-southeast-3">Asia Pacific (Jakarta)</option>
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Key</label>
                <input
                  type="password"
                  value={apiSettings.cloudApiKey}
                  onChange={(e) => setApiSettings({...apiSettings, cloudApiKey: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Cloud access key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
                <input
                  type="text"
                  value={apiSettings.cloudBucket}
                  onChange={(e) => setApiSettings({...apiSettings, cloudBucket: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="my-bucket-name"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Webhook Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Link className="h-5 w-5 text-yellow-600" />
          Webhook Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Enable Webhooks</h4>
              <p className="text-sm text-gray-600">Kirim notifikasi real-time ke sistem eksternal</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={apiSettings.webhookEnabled}
                onChange={(e) => setApiSettings({...apiSettings, webhookEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {apiSettings.webhookEnabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                  <input
                    type="url"
                    value={apiSettings.webhookUrl}
                    onChange={(e) => setApiSettings({...apiSettings, webhookUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://your-app.com/webhook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                  <input
                    type="password"
                    value={apiSettings.webhookSecret}
                    onChange={(e) => setApiSettings({...apiSettings, webhookSecret: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Webhook secret for verification"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Events</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    'payment.success',
                    'payment.failed',
                    'booking.created',
                    'booking.cancelled',
                    'rental.started',
                    'rental.completed',
                    'customer.created',
                    'voucher.sold',
                    'voucher.used'
                  ].map((event) => (
                    <label key={event} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                      <input
                        type="checkbox"
                        checked={apiSettings.webhookEvents.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setApiSettings({
                              ...apiSettings,
                              webhookEvents: [...apiSettings.webhookEvents, event]
                            });
                          } else {
                            setApiSettings({
                              ...apiSettings,
                              webhookEvents: apiSettings.webhookEvents.filter(e => e !== event)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test APIs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Test className="h-5 w-5 text-red-600" />
          Test API Connections
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleTestApi('Payment Gateway')}
            disabled={isTestingApi}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isTestingApi ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Test Payment
          </button>
          
          <button
            onClick={() => handleTestApi('SMS Gateway')}
            disabled={isTestingApi}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isTestingApi ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            Test SMS
          </button>
          
          <button
            onClick={() => handleTestApi('Email Service')}
            disabled={isTestingApi}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isTestingApi ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Test Email
          </button>
        </div>
      </div>
    </div>
  );

  const renderWhatsAppCrmSettings = () => (
    <div className="space-y-6">
      {/* API Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          Konfigurasi WhatsApp Business API
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider API</label>
            <select
              value={whatsappCrmSettings.apiProvider}
              onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, apiProvider: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="whatsapp-business">WhatsApp Business API</option>
              <option value="twilio">Twilio WhatsApp</option>
              <option value="360dialog">360Dialog</option>
              <option value="chatapi">ChatAPI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
            <input
              type="text"
              value={whatsappCrmSettings.phoneNumberId}
              onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, phoneNumberId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234567890123456"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={whatsappCrmSettings.accessToken}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, accessToken: e.target.value})}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="EAAxxxxxxxxxxxxxxx"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
            <input
              type="url"
              value={whatsappCrmSettings.webhookUrl}
              onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, webhookUrl: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://yourdomain.com/webhook"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verify Token</label>
            <input
              type="text"
              value={whatsappCrmSettings.verifyToken}
              onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, verifyToken: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your_verify_token"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleTestWhatsApp}
            disabled={isTestingWhatsApp}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isTestingWhatsApp ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isTestingWhatsApp ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Auto-Reply Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          Auto-Reply & Chatbot
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Enable Auto-Reply</h4>
              <p className="text-sm text-gray-600">Automatically respond to incoming messages</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.autoReplyEnabled}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, autoReplyEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
            <textarea
              value={whatsappCrmSettings.welcomeMessage}
              onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, welcomeMessage: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Pesan selamat datang untuk customer baru"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Business Hours</h4>
                <p className="text-sm text-gray-600">Auto-reply during business hours only</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappCrmSettings.businessHours.enabled}
                  onChange={(e) => setWhatsappCrmSettings({
                    ...whatsappCrmSettings, 
                    businessHours: {...whatsappCrmSettings.businessHours, enabled: e.target.checked}
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={whatsappCrmSettings.businessHours.start}
                onChange={(e) => setWhatsappCrmSettings({
                  ...whatsappCrmSettings, 
                  businessHours: {...whatsappCrmSettings.businessHours, start: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={whatsappCrmSettings.businessHours.end}
                onChange={(e) => setWhatsappCrmSettings({
                  ...whatsappCrmSettings, 
                  businessHours: {...whatsappCrmSettings.businessHours, end: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closed Message</label>
            <textarea
              value={whatsappCrmSettings.businessHours.closedMessage}
              onChange={(e) => setWhatsappCrmSettings({
                ...whatsappCrmSettings, 
                businessHours: {...whatsappCrmSettings.businessHours, closedMessage: e.target.value}
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Pesan ketika di luar jam operasional"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">AI Responses</h4>
                <p className="text-sm text-gray-600">Use AI for intelligent responses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappCrmSettings.aiResponseEnabled}
                  onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, aiResponseEnabled: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Fallback to Human</h4>
                <p className="text-sm text-gray-600">Transfer to staff when needed</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappCrmSettings.fallbackToHuman}
                  onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, fallbackToHuman: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign & Marketing */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-purple-600" />
          Campaign & Marketing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Birthday Messages</h4>
              <p className="text-sm text-gray-600">Send birthday greetings with special offers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.birthdayMessages}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, birthdayMessages: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Promotional Messages</h4>
              <p className="text-sm text-gray-600">Send promotional campaigns</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.promotionalMessages}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, promotionalMessages: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Reminder Messages</h4>
              <p className="text-sm text-gray-600">Send booking and payment reminders</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.reminderMessages}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, reminderMessages: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Customer Segmentation</h4>
              <p className="text-sm text-gray-600">Segment customers for targeted campaigns</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.segmentationEnabled}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, segmentationEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">VIP Customer Threshold (Rp)</label>
            <input
              type="number"
              value={whatsappCrmSettings.vipCustomerThreshold}
              onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, vipCustomerThreshold: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1000000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequent Customer Visits</label>
            <input
              type="number"
              value={whatsappCrmSettings.frequentCustomerVisits}
              onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, frequentCustomerVisits: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10"
            />
          </div>
        </div>
      </div>

      {/* Message Templates */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Message Templates
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Booking Confirmation</label>
            <textarea
              value={whatsappCrmSettings.templates.bookingConfirmation}
              onChange={(e) => setWhatsappCrmSettings({
                ...whatsappCrmSettings, 
                templates: {...whatsappCrmSettings.templates, bookingConfirmation: e.target.value}
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Template untuk konfirmasi booking"
            />
            <p className="text-xs text-gray-500 mt-1">
              Variables: {'{date}'}, {'{time}'}, {'{console}'}, {'{amount}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reminder</label>
            <textarea
              value={whatsappCrmSettings.templates.paymentReminder}
              onChange={(e) => setWhatsappCrmSettings({
                ...whatsappCrmSettings, 
                templates: {...whatsappCrmSettings.templates, paymentReminder: e.target.value}
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Template untuk reminder pembayaran"
            />
            <p className="text-xs text-gray-500 mt-1">
              Variables: {'{name}'}, {'{amount}'}, {'{dueDate}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Birthday Greeting</label>
            <textarea
              value={whatsappCrmSettings.templates.birthdayGreeting}
              onChange={(e) => setWhatsappCrmSettings({
                ...whatsappCrmSettings, 
                templates: {...whatsappCrmSettings.templates, birthdayGreeting: e.target.value}
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Template untuk ucapan ulang tahun"
            />
            <p className="text-xs text-gray-500 mt-1">
              Variables: {'{name}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loyalty Reward</label>
            <textarea
              value={whatsappCrmSettings.templates.loyaltyReward}
              onChange={(e) => setWhatsappCrmSettings({
                ...whatsappCrmSettings, 
                templates: {...whatsappCrmSettings.templates, loyaltyReward: e.target.value}
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Template untuk reward loyalty"
            />
            <p className="text-xs text-gray-500 mt-1">
              Variables: {'{name}'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Promotion</label>
            <textarea
              value={whatsappCrmSettings.templates.newPromotion}
              onChange={(e) => setWhatsappCrmSettings({
                ...whatsappCrmSettings, 
                templates: {...whatsappCrmSettings.templates, newPromotion: e.target.value}
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Template untuk promosi baru"
            />
            <p className="text-xs text-gray-500 mt-1">
              Variables: {'{promoTitle}'}, {'{promoDescription}'}, {'{validUntil}'}, {'{promoCode}'}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics & Integration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-600" />
          Analytics & Integration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Analytics Enabled</h4>
              <p className="text-sm text-gray-600">Track message delivery and engagement</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.analyticsEnabled}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, analyticsEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Sync with Customer DB</h4>
              <p className="text-sm text-gray-600">Sync WhatsApp contacts with customer database</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.syncWithCustomerDb}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, syncWithCustomerDb: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Sync with Booking System</h4>
              <p className="text-sm text-gray-600">Auto-send booking confirmations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.syncWithBookingSystem}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, syncWithBookingSystem: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Sync with POS System</h4>
              <p className="text-sm text-gray-600">Send receipts via WhatsApp</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.syncWithPosSystem}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, syncWithPosSystem: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Frequency</label>
            <select
              value={whatsappCrmSettings.reportFrequency}
              onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, reportFrequency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Track Delivery Status</h4>
              <p className="text-sm text-gray-600">Monitor message delivery</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.trackDeliveryStatus}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, trackDeliveryStatus: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Track Read Status</h4>
              <p className="text-sm text-gray-600">Monitor message read receipts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappCrmSettings.trackReadStatus}
                onChange={(e) => setWhatsappCrmSettings({...whatsappCrmSettings, trackReadStatus: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {/* Email Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Email Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
            <input
              type="text"
              value={notificationSettings.smtpHost}
              onChange={(e) => setNotificationSettings({...notificationSettings, smtpHost: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
            <input
              type="number"
              value={notificationSettings.smtpPort}
              onChange={(e) => setNotificationSettings({...notificationSettings, smtpPort: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="587"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="email"
              value={notificationSettings.smtpUsername}
              onChange={(e) => setNotificationSettings({...notificationSettings, smtpUsername: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your-email@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={notificationSettings.smtpPassword}
                onChange={(e) => setNotificationSettings({...notificationSettings, smtpPassword: e.target.value})}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="App password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
            <select
              value={notificationSettings.smtpEncryption}
              onChange={(e) => setNotificationSettings({...notificationSettings, smtpEncryption: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TLS">TLS</option>
              <option value="SSL">SSL</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleTestEmail}
            disabled={isTestingEmail}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isTestingEmail ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isTestingEmail ? 'Sending...' : 'Test Email'}
          </button>
        </div>
      </div>

      {/* WhatsApp Business Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          WhatsApp Business
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Number</label>
            <input
              type="text"
              value={notificationSettings.whatsappBusinessNumber}
              onChange={(e) => setNotificationSettings({...notificationSettings, whatsappBusinessNumber: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+62 8xx-xxxx-xxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={notificationSettings.whatsappApiKey}
              onChange={(e) => setNotificationSettings({...notificationSettings, whatsappApiKey: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your WhatsApp API key"
            />
          </div>
        </div>
      </div>

      {/* SMS Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5 text-purple-600" />
          SMS Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMS Provider</label>
            <select
              value={notificationSettings.smsProvider}
              onChange={(e) => setNotificationSettings({...notificationSettings, smsProvider: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="twilio">Twilio</option>
              <option value="nexmo">Vonage (Nexmo)</option>
              <option value="aws">AWS SNS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={notificationSettings.smsApiKey}
              onChange={(e) => setNotificationSettings({...notificationSettings, smsApiKey: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your SMS API key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Number</label>
            <input
              type="text"
              value={notificationSettings.smsFromNumber}
              onChange={(e) => setNotificationSettings({...notificationSettings, smsFromNumber: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+1234567890"
            />
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-600" />
          Notification Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'bookingReminders', label: 'Booking Reminders', desc: 'Send reminders for upcoming bookings' },
            { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'Notify about pending payments' },
            { key: 'stockAlerts', label: 'Stock Alerts', desc: 'Alert when inventory is low' },
            { key: 'dailyReports', label: 'Daily Reports', desc: 'Send daily business reports' },
            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Send weekly summary reports' },
            { key: 'systemAlerts', label: 'System Alerts', desc: 'Critical system notifications' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    [item.key]: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Sound Notifications */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-red-600" />
          Sound Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Enable Sound Notifications</h4>
              <p className="text-sm text-gray-600">Play sounds for important events</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.soundEnabled}
                onChange={(e) => setNotificationSettings({...notificationSettings, soundEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Volume Level</label>
            <div className="flex items-center gap-4">
              <VolumeX className="h-4 w-4 text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={notificationSettings.soundVolume}
                onChange={(e) => setNotificationSettings({...notificationSettings, soundVolume: Number(e.target.value)})}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 w-12">{notificationSettings.soundVolume}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'newBookingSound', label: 'New Booking', icon: Calendar },
              { key: 'paymentSound', label: 'Payment Received', icon: DollarSign },
              { key: 'alertSound', label: 'System Alerts', icon: AlertTriangle }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">{item.label}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings[item.key as keyof typeof notificationSettings] as boolean}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        [item.key]: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timing Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-600" />
          Timing Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Hours Before</label>
            <input
              type="number"
              value={notificationSettings.reminderHours}
              onChange={(e) => setNotificationSettings({...notificationSettings, reminderHours: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="168"
            />
            <p className="text-xs text-gray-500 mt-1">Hours before booking to send reminder</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Alert Threshold</label>
            <input
              type="number"
              value={notificationSettings.stockThreshold}
              onChange={(e) => setNotificationSettings({...notificationSettings, stockThreshold: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum stock level for alerts</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Report Time</label>
            <input
              type="time"
              value={notificationSettings.reportTime}
              onChange={(e) => setNotificationSettings({...notificationSettings, reportTime: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Time to send daily reports</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      {/* Password Policy */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          Password Policy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Password Length</label>
            <input
              type="number"
              value={securitySettings.minPasswordLength}
              onChange={(e) => setSecuritySettings({...securitySettings, minPasswordLength: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="6"
              max="32"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password Expiry (days)</label>
            <input
              type="number"
              value={securitySettings.passwordExpiry}
              onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="30"
              max="365"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {[
            { key: 'requireUppercase', label: 'Require Uppercase Letters', desc: 'At least one uppercase letter (A-Z)' },
            { key: 'requireLowercase', label: 'Require Lowercase Letters', desc: 'At least one lowercase letter (a-z)' },
            { key: 'requireNumbers', label: 'Require Numbers', desc: 'At least one number (0-9)' },
            { key: 'requireSpecialChars', label: 'Require Special Characters', desc: 'At least one special character (!@#$...)' }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={securitySettings[item.key as keyof typeof securitySettings] as boolean}
                  onChange={(e) => setSecuritySettings({
                    ...securitySettings,
                    [item.key]: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Session Management */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-600" />
          Session Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
            <input
              type="number"
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="5"
              max="480"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Concurrent Sessions</label>
            <input
              type="number"
              value={securitySettings.maxConcurrentSessions}
              onChange={(e) => setSecuritySettings({...securitySettings, maxConcurrentSessions: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="10"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto Logout</h4>
              <p className="text-sm text-gray-600">Automatically logout inactive users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.autoLogout}
                onChange={(e) => setSecuritySettings({...securitySettings, autoLogout: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-600" />
          Two-Factor Authentication
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Enable 2FA</h4>
              <p className="text-sm text-gray-600">Add an extra layer of security to user accounts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.twoFactorEnabled}
                onChange={(e) => setSecuritySettings({...securitySettings, twoFactorEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {securitySettings.twoFactorEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2FA Method</label>
              <select
                value={securitySettings.twoFactorMethod}
                onChange={(e) => setSecuritySettings({...securitySettings, twoFactorMethod: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="app">Authenticator App (Google Authenticator, Authy)</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Access Control */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-red-600" />
          Access Control
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">IP Whitelist</h4>
              <p className="text-sm text-gray-600">Only allow access from specific IP addresses</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.ipWhitelistEnabled}
                onChange={(e) => setSecuritySettings({...securitySettings, ipWhitelistEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {securitySettings.ipWhitelistEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allowed IP Addresses</label>
              <textarea
                value={securitySettings.allowedIPs}
                onChange={(e) => setSecuritySettings({...securitySettings, allowedIPs: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="192.168.1.100&#10;10.0.0.0/24&#10;203.0.113.0/24"
              />
              <p className="text-xs text-gray-500 mt-1">One IP address or CIDR block per line</p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Require VPN</h4>
              <p className="text-sm text-gray-600">Force users to connect through VPN</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.requireVPN}
                onChange={(e) => setSecuritySettings({...securitySettings, requireVPN: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Audit & Logging */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-600" />
          Audit & Logging
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Audit Logging</h4>
              <p className="text-sm text-gray-600">Log all user activities</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.auditLogging}
                onChange={(e) => setSecuritySettings({...securitySettings, auditLogging: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Log Failed Logins</h4>
              <p className="text-sm text-gray-600">Track failed login attempts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.logFailedLogins}
                onChange={(e) => setSecuritySettings({...securitySettings, logFailedLogins: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Log Retention (days)</label>
          <input
            type="number"
            value={securitySettings.logRetentionDays}
            onChange={(e) => setSecuritySettings({...securitySettings, logRetentionDays: Number(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="30"
            max="365"
          />
          <p className="text-xs text-gray-500 mt-1">How long to keep audit logs</p>
        </div>
      </div>

      {/* Data Protection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600" />
          Data Protection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Data Encryption</h4>
              <p className="text-sm text-gray-600">Encrypt sensitive data at rest</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.dataEncryption}
                onChange={(e) => setSecuritySettings({...securitySettings, dataEncryption: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Hide Balances</h4>
              <p className="text-sm text-gray-600">Hide financial amounts from unauthorized users</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.hideBalances}
                onChange={(e) => setSecuritySettings({...securitySettings, hideBalances: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Screen Lock Timeout (minutes)</label>
          <input
            type="number"
            value={securitySettings.screenLockTimeout}
            onChange={(e) => setSecuritySettings({...securitySettings, screenLockTimeout: Number(e.target.value)})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="60"
          />
          <p className="text-xs text-gray-500 mt-1">Lock screen after inactivity</p>
        </div>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      {/* Backup Status */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Backup Status
        </h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Last Backup Successful</span>
            </div>
            <span className="text-sm text-green-600">{backupSettings.lastBackupDate}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-700">Backup Size:</span>
              <span className="font-medium text-green-900 ml-2">{backupSettings.lastBackupSize}</span>
            </div>
            <div>
              <span className="text-green-700">Status:</span>
              <span className="font-medium text-green-900 ml-2 capitalize">{backupSettings.lastBackupStatus}</span>
            </div>
            <div>
              <span className="text-green-700">Next Backup:</span>
              <span className="font-medium text-green-900 ml-2">Tonight at {backupSettings.backupTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Automatic Backup */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Timer className="h-5 w-5 text-green-600" />
          Automatic Backup
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Enable Automatic Backup</h4>
              <p className="text-sm text-gray-600">Automatically backup data on schedule</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={backupSettings.autoBackupEnabled}
                onChange={(e) => setBackupSettings({...backupSettings, autoBackupEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
              <select
                value={backupSettings.backupFrequency}
                onChange={(e) => setBackupSettings({...backupSettings, backupFrequency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backup Time</label>
              <input
                type="time"
                value={backupSettings.backupTime}
                onChange={(e) => setBackupSettings({...backupSettings, backupTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Retention (days)</label>
              <input
                type="number"
                value={backupSettings.retentionDays}
                onChange={(e) => setBackupSettings({...backupSettings, retentionDays: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="7"
                max="365"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Storage Location */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Cloud className="h-5 w-5 text-purple-600" />
          Storage Location
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Storage Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="storageType"
                  value="local"
                  checked={backupSettings.storageType === 'local'}
                  onChange={(e) => setBackupSettings({...backupSettings, storageType: e.target.value})}
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Local Storage</h4>
                    <p className="text-sm text-gray-600">Store backups on local server</p>
                  </div>
                </div>
              </label>
              <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="storageType"
                  value="cloud"
                  checked={backupSettings.storageType === 'cloud'}
                  onChange={(e) => setBackupSettings({...backupSettings, storageType: e.target.value})}
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Cloud Storage</h4>
                    <p className="text-sm text-gray-600">Store backups in the cloud</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {backupSettings.storageType === 'cloud' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cloud Provider</label>
                <select
                  value={backupSettings.cloudProvider}
                  onChange={(e) => setBackupSettings({...backupSettings, cloudProvider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="google">Google Drive</option>
                  <option value="aws">Amazon S3</option>
                  <option value="azure">Microsoft Azure</option>
                  <option value="dropbox">Dropbox</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cloud Path</label>
                <input
                  type="text"
                  value={backupSettings.cloudPath}
                  onChange={(e) => setBackupSettings({...backupSettings, cloudPath: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/backups"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backup Content */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-600" />
          Backup Content
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'includeDatabase', label: 'Database', desc: 'All business data and transactions', icon: Database },
            { key: 'includeFiles', label: 'Application Files', desc: 'System files and configurations', icon: FileText },
            { key: 'includeImages', label: 'Images & Media', desc: 'Product images and media files', icon: Image },
            { key: 'includeLogs', label: 'System Logs', desc: 'Application and error logs', icon: Activity },
            { key: 'includeSettings', label: 'Settings', desc: 'System and user settings', icon: SettingsIcon }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{item.label}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backupSettings[item.key as keyof typeof backupSettings] as boolean}
                    onChange={(e) => setBackupSettings({
                      ...backupSettings,
                      [item.key]: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Compression */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-red-600" />
          Security & Compression
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Encrypt Backups</h4>
              <p className="text-sm text-gray-600">Encrypt backup files for security</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={backupSettings.encryptBackups}
                onChange={(e) => setBackupSettings({...backupSettings, encryptBackups: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compression Level</label>
              <select
                value={backupSettings.compressionLevel}
                onChange={(e) => setBackupSettings({...backupSettings, compressionLevel: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">No Compression</option>
                <option value="low">Low (Fast)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Small Size)</option>
              </select>
            </div>
            {backupSettings.encryptBackups && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Encryption Key</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={backupSettings.encryptionKey}
                    onChange={(e) => setBackupSettings({...backupSettings, encryptionKey: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter encryption key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Backup */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-indigo-600" />
          Manual Operations
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Create Backup Now</h4>
              <p className="text-sm text-gray-600">Manually create a backup with current settings</p>
            </div>
            <button
              onClick={handleBackupNow}
              disabled={isBackingUp}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isBackingUp ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isBackingUp ? 'Creating...' : 'Backup Now'}
            </button>
          </div>

          {isBackingUp && (
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Creating Backup...</span>
                <span className="text-sm text-blue-600">{backupProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${backupProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Restore from Backup</h4>
              <p className="text-sm text-gray-600">Restore system from a previous backup</p>
            </div>
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Restore
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      {/* Performance Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-blue-600" />
          Performance Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Concurrent Users</label>
            <input
              type="number"
              value={systemSettings.maxUsers}
              onChange={(e) => setSystemSettings({...systemSettings, maxUsers: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="1000"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Enable Caching</h4>
              <p className="text-sm text-gray-600">Improve performance with caching</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemSettings.cacheEnabled}
                onChange={(e) => setSystemSettings({...systemSettings, cacheEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Enable Compression</h4>
              <p className="text-sm text-gray-600">Compress responses to save bandwidth</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemSettings.compressionEnabled}
                onChange={(e) => setSystemSettings({...systemSettings, compressionEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Database Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-green-600" />
          Database Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Connection Pool Size</label>
            <input
              type="number"
              value={systemSettings.connectionPoolSize}
              onChange={(e) => setSystemSettings({...systemSettings, connectionPoolSize: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="5"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Query Timeout (seconds)</label>
            <input
              type="number"
              value={systemSettings.queryTimeout}
              onChange={(e) => setSystemSettings({...systemSettings, queryTimeout: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="10"
              max="300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Window</label>
            <input
              type="text"
              value={systemSettings.maintenanceWindow}
              onChange={(e) => setSystemSettings({...systemSettings, maintenanceWindow: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="02:00-04:00"
            />
          </div>
        </div>
      </div>

      {/* Logging Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-600" />
          Logging Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Log Level</label>
            <select
              value={systemSettings.logLevel}
              onChange={(e) => setSystemSettings({...systemSettings, logLevel: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="error">Error Only</option>
              <option value="warn">Warning & Error</option>
              <option value="info">Info, Warning & Error</option>
              <option value="debug">All (Debug Mode)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Log File Size (MB)</label>
            <input
              type="number"
              value={systemSettings.maxLogSize}
              onChange={(e) => setSystemSettings({...systemSettings, maxLogSize: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="10"
              max="1000"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Log Rotation</h4>
              <p className="text-sm text-gray-600">Automatically rotate log files</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemSettings.logRotation}
                onChange={(e) => setSystemSettings({...systemSettings, logRotation: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Hardware Integration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Printer className="h-5 w-5 text-orange-600" />
          Hardware Integration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Printer</label>
            <select
              value={systemSettings.defaultPrinter}
              onChange={(e) => setSystemSettings({...systemSettings, defaultPrinter: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Thermal Printer">Thermal Printer (Receipt)</option>
              <option value="Laser Printer">Laser Printer (A4)</option>
              <option value="Inkjet Printer">Inkjet Printer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode Scanner</label>
            <select
              value={systemSettings.barcodeScanner}
              onChange={(e) => setSystemSettings({...systemSettings, barcodeScanner: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="USB Scanner">USB Barcode Scanner</option>
              <option value="Bluetooth Scanner">Bluetooth Scanner</option>
              <option value="Camera Scanner">Camera Scanner</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Cash Drawer</h4>
              <p className="text-sm text-gray-600">Enable cash drawer integration</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemSettings.cashDrawerEnabled}
                onChange={(e) => setSystemSettings({...systemSettings, cashDrawerEnabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Maintenance Mode
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Enable Maintenance Mode</h4>
              <p className="text-sm text-gray-600">Temporarily disable system access for maintenance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemSettings.maintenanceMode}
                onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Message</label>
            <textarea
              value={systemSettings.maintenanceMessage}
              onChange={(e) => setSystemSettings({...systemSettings, maintenanceMessage: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Message to display during maintenance"
            />
          </div>
        </div>
      </div>

      {/* Updates & Monitoring */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-indigo-600" />
          Updates & Monitoring
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto Updates</h4>
              <p className="text-sm text-gray-600">Automatically install system updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemSettings.autoUpdates}
                onChange={(e) => setSystemSettings({...systemSettings, autoUpdates: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Update Channel</label>
            <select
              value={systemSettings.updateChannel}
              onChange={(e) => setSystemSettings({...systemSettings, updateChannel: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="stable">Stable</option>
              <option value="beta">Beta</option>
              <option value="alpha">Alpha (Development)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Health Check Interval (minutes)</label>
            <input
              type="number"
              value={systemSettings.healthCheckInterval}
              onChange={(e) => setSystemSettings({...systemSettings, healthCheckInterval: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="60"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'printer', label: 'Printer & Kertas', icon: Printer },
    { id: 'api', label: 'API Settings', icon: Code },
    { id: 'whatsapp-crm', label: 'WhatsApp CRM', icon: MessageCircle },
    { id: 'notifications', label: 'Notifications',  icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'system', label: 'System', icon: Monitor }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your system configuration and preferences</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'printer' && renderPrinterSettings()}
        {activeTab === 'api' && renderApiSettings()}
        {activeTab === 'whatsapp-crm' && renderWhatsAppCrmSettings()}
        {activeTab === 'notifications' && renderNotificationSettings()}
        {activeTab === 'security' && renderSecuritySettings()}
        {activeTab === 'backup' && renderBackupSettings()}
        {activeTab === 'system' && renderSystemSettings()}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Save className="h-5 w-5" />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;