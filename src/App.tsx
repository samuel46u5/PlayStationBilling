import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import Cashier from './components/Cashier';
import CashierSession from './components/CashierSession';
import ActiveRentals from './components/ActiveRentals';
import ScheduledBookings from './components/ScheduledBookings';
import Customers from './components/Customers';
import Products from './components/Products';
import Sales from './components/Sales';
import Payments from './components/Payments';
import Bookkeeping from './components/Bookkeeping';
import Consoles from './components/Consoles';
import EquipmentManagement from './components/EquipmentManagement';
import RateManagement from './components/RateManagement';
import UserManagement from './components/UserManagement';
import VoucherManagement from './components/VoucherManagement';
import Settings from './components/Settings';
import MaintenanceManagement from './components/MaintenanceManagement';
import RateProfilePage from './components/RateProfilePage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
};

const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'cashier':
        return <Cashier />;
      case 'cashier-session':
        return <CashierSession />;
      case 'rentals':
        return <ActiveRentals />;
      case 'bookings':
        return <ScheduledBookings />;
      case 'customers':
        return <Customers />;
      case 'products':
        return <Products />;
      case 'sales':
        return <Sales />;
      case 'payments':
        return <Payments />;
      case 'bookkeeping':
        return <Bookkeeping />;
      case 'consoles':
        return <Consoles />;
      case 'equipment':
        return <EquipmentManagement />;
      case 'rates':
        return <RateManagement />;
      case 'vouchers':
        return <VoucherManagement />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <Settings />;
      case 'maintenance':
        return <MaintenanceManagement />;
      case 'rate-profile':
      case 'rate-profiles':
        return <RateProfilePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;