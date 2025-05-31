import { useState } from 'react';
import { initialData } from '../data/initialData';
import { useAuditLogs } from './useAuditLogs';

export const useStockData = () => {
  const { stockData } = initialData;
  const { logAction } = useAuditLogs();
  
  const [stock, setStock] = useState(stockData);
  const [stockForm, setStockForm] = useState({ 
    name: '', 
    quantity: '', 
    unit: '', 
    minLevel: '', 
    price: '', 
    category: '' 
  });
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const addStock = (newStock) => {
    const processedStock = {
      ...newStock,
      id: Date.now(),
      quantity: parseFloat(newStock.quantity) || 0,
      minLevel: parseFloat(newStock.minLevel) || 0,
      price: parseFloat(newStock.price) || 0
    };
    setStock([...stock, processedStock]);
    logAction('create', `Added new stock item: ${processedStock.name}`);
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    
    const processedForm = {
      ...stockForm,
      quantity: parseFloat(stockForm.quantity) || 0,
      minLevel: parseFloat(stockForm.minLevel) || 0,
      price: parseFloat(stockForm.price) || 0
    };
    
    if (editingItem) {
      const updatedStock = stock.map(item => 
        item.id === editingItem.id ? { ...processedForm, id: editingItem.id } : item
      );
      setStock(updatedStock);
      logAction('update', `Updated stock item: ${processedForm.name}`);
    } else {
      addStock(processedForm);
    }
    
    setShowStockModal(false);
    setStockForm({ name: '', quantity: '', unit: '', minLevel: '', price: '', category: '' });
    setEditingItem(null);
  };

  const editStock = (item) => {
    setEditingItem(item);
    setStockForm(item);
    setShowStockModal(true);
  };

  const deleteStock = (id) => {
    try {
      const itemToDelete = stock.find(item => item.id === id);
      if (!itemToDelete) {
        console.error('Stock item not found');
        return;
      }
      setStock(stock.filter(item => item.id !== id));
      logAction('delete', `Deleted stock item: ${itemToDelete.name}`);
    } catch (error) {
      console.error('Error deleting stock:', error);
    }
  };

  return {
    stock,
    stockForm,
    showStockModal,
    editingItem,
    setStock,
    setStockForm,
    setShowStockModal,
    setEditingItem,
    addStock,
    handleStockSubmit,
    editStock,
    deleteStock
  };
};