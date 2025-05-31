import React, { useState, useEffect } from 'react';
import StockModal from '../modals/StockModal';
import MenuModal from '../modals/MenuModal';
import TransactionModal from '../modals/TransactionModal';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileHeader from './MobileHeader';
import MobileNavigation from './MobileNavigation';
import ContentArea from './ContentArea';
import TabContent from './TabContent';

// Style untuk kelas khusus
const contentContainerStyle = {
  marginLeft: 0,
  paddingLeft: 0
};

const MainLayout = ({ user, logout, isAdmin, state, handlers, modals }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Destructure state dan handlers untuk diteruskan ke komponen anak
  const { 
    activeTab, 
    sidebarCollapsed, 
    settingsTab,
    // Destructure semua state yang diperlukan
    stock,
    menu,
    transactions,
    computers,
    activeSessions,
    timePackages,
    customers,
    orders,
    staff,
    roles,
    auditLogs
  } = state;
  
  const { 
    setActiveTab, 
    setSidebarCollapsed, 
    setSettingsTab,
    // Destructure semua handler yang diperlukan
    addStock,
    editStock,
    deleteStock,
    addMenu,
    editMenu,
    deleteMenu,
    addTransaction,
    editTransaction,
    deleteTransaction,
    addComputer,
    editComputer,
    deleteComputer,
    startSession,
    endSession,
    addCustomer,
    editCustomer,
    deleteCustomer,
    updateOrderStatus,
    addStaff,
    editStaff,
    deleteStaff,
    addOrder
  } = handlers;
  
  // State untuk modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stockForm, setStockForm] = useState({});
  const [menuForm, setMenuForm] = useState({});
  const [transactionForm, setTransactionForm] = useState({});

  // Fungsi untuk update form
  const updateStockForm = (field, value) => {
    setStockForm(prev => ({ ...prev, [field]: value }));
  };

  const updateMenuForm = (field, value) => {
    setMenuForm(prev => ({ ...prev, [field]: value }));
  };

  const updateTransactionForm = (field, value) => {
    setTransactionForm(prev => ({ ...prev, [field]: value }));
  };
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when tab changes
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [activeTab, isMobile]);

  // Siapkan props untuk TabContent
  const tabContentProps = {
    activeTab,
    settingsTab,
    setSettingsTab,
    state: {
      stock,
      menu,
      transactions,
      computers,
      activeSessions,
      timePackages,
      customers,
      orders,
      staff,
      roles,
      auditLogs
    },
    handlers: {
      addStock,
      editStock,
      deleteStock,
      addMenu,
      editMenu,
      deleteMenu,
      addTransaction,
      editTransaction,
      deleteTransaction,
      addComputer,
      editComputer,
      deleteComputer,
      startSession,
      endSession,
      addCustomer,
      editCustomer,
      deleteCustomer,
      updateOrderStatus,
      addStaff,
      editStaff,
      deleteStaff,
      setActiveTab
    },
    isAdmin,
    modals: {
      setShowStockModal,
      setShowMenuModal,
      setShowTransactionModal
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 text-black overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - HANYA untuk Desktop */}
      {!isMobile && (
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300`}>
          <Sidebar
            user={user}
            logout={logout}
            isAdmin={isAdmin}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            isMobile={false}
          />
        </div>
      )}

      {/* Main Content */}
      <div 
        className={`flex-1 flex flex-col ${isMobile ? 'w-full' : sidebarCollapsed ? 'ml-16 pl-0' : 'ml-64 pl-0'} transition-all duration-300`}
        style={contentContainerStyle}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <Header 
            activeTab={activeTab}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            user={user}
          />
        )}

        {/* Mobile Header - Gunakan komponen MobileHeader */}
        {isMobile && (
          <MobileHeader 
            user={user} 
            logout={logout} 
            activeTab={activeTab} 
            isAdmin={isAdmin} 
          />
        )}

        {/* Content Area - Gunakan komponen ContentArea */}
        <ContentArea isMobile={isMobile}>
          {/* Tab Content - Gunakan komponen TabContent */}
          <TabContent {...tabContentProps} />
        </ContentArea>
      </div>

      {/* Mobile Navigation - Gunakan komponen MobileNavigation */}
      {isMobile && (
        <MobileNavigation
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          logout={logout}
          isAdmin={isAdmin}
        />
      )}

      {/* Desktop Sidebar Overlay - hanya untuk desktop */}
      {!isMobile && sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Modals */}
      {showStockModal && (
        <StockModal
          stock={stockForm}
          updateStock={updateStockForm}
          onSave={editingItem ? editStock : addStock}
          onClose={() => {
            setShowStockModal(false);
            setEditingItem(null);
          }}
          isEditing={!!editingItem}
        />
      )}

      {showMenuModal && (
        <MenuModal
          menu={menuForm}
          updateMenu={updateMenuForm}
          onSave={editingItem ? editMenu : addMenu}
          onClose={() => {
            setShowMenuModal(false);
            setEditingItem(null);
          }}
          isEditing={!!editingItem}
        />
      )}

      {showTransactionModal && (
        <TransactionModal
          transaction={transactionForm}
          updateTransaction={updateTransactionForm}
          onSave={editingItem ? editTransaction : addTransaction}
          onClose={() => {
            setShowTransactionModal(false);
            setEditingItem(null);
          }}
          isEditing={!!editingItem}
        />
      )}
    </div>
  );
};

export default MainLayout;