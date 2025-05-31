import { useState } from 'react';
import { initialData } from '../data/initialData';
import { useAuditLogs } from './useAuditLogs';

export const useMenuData = () => {
  const { menuData } = initialData;
  const { logAction } = useAuditLogs();
  
  const [menu, setMenu] = useState(menuData);
  const [menuForm, setMenuForm] = useState({ 
    name: '', 
    price: '', 
    ingredients: [], 
    category: '', 
    available: true 
  });
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleMenuSubmit = (e) => {
    e.preventDefault();
    
    const processedForm = {
      ...menuForm,
      price: parseFloat(menuForm.price) || 0,
      ingredients: menuForm.ingredients || []
    };
    
    if (editingItem) {
      const updatedMenu = menu.map(item => 
        item.id === editingItem.id ? { ...processedForm, id: editingItem.id } : item
      );
      setMenu(updatedMenu);
      logAction('update', `Updated menu item: ${processedForm.name}`);
    } else {
      const newMenu = { ...processedForm, id: Date.now() };
      setMenu([...menu, newMenu]);
      logAction('create', `Created new menu item: ${processedForm.name}`);
    }
    
    setShowMenuModal(false);
    setMenuForm({ name: '', price: '', ingredients: [], category: '', available: true });
    setEditingItem(null);
  };

  const editMenu = (item) => {
    setEditingItem(item);
    setMenuForm(item);
    setShowMenuModal(true);
  };

  const deleteMenu = (id) => {
    try {
      const itemToDelete = menu.find(item => item.id === id);
      if (!itemToDelete) {
        console.error('Menu item not found');
        return;
      }
      setMenu(menu.filter(item => item.id !== id));
      logAction('delete', `Deleted menu item: ${itemToDelete.name}`);
    } catch (error) {
      console.error('Error deleting menu:', error);
    }
  };

  return {
    menu,
    menuForm,
    showMenuModal,
    editingItem,
    setMenu,
    setMenuForm,
    setShowMenuModal,
    setEditingItem,
    handleMenuSubmit,
    editMenu,
    deleteMenu
  };
};