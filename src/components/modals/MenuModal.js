import React, { useState } from 'react';

// Helper function to format currency in Rupiah (masking)
const formatRupiah = (amount) => {
  if (amount === '' || amount === null || amount === undefined) return '';
  return 'Rp' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Helper to parse formatted rupiah string to number
const parseRupiah = (str) => {
  if (!str) return '';
  return parseInt(str.replace(/[^0-9]/g, ''), 10) || '';
};

const MenuModal = ({ 
  editingItem, 
  menuForm, 
  setMenuForm, 
  handleMenuSubmit, 
  setShowMenuModal, 
  setEditingItem 
}) => {
  const [ingredient, setIngredient] = useState('');

  const addIngredient = () => {
    if (ingredient.trim() !== '') {
      setMenuForm({
        ...menuForm,
        ingredients: [...menuForm.ingredients, ingredient.trim()]
      });
      setIngredient('');
    }
  };

  const removeIngredient = (index) => {
    setMenuForm({
      ...menuForm,
      ingredients: menuForm.ingredients.filter((_, i) => i !== index)
    });
  };

  // Live Rupiah masking for price input
  const handlePriceChange = (e) => {
    const raw = parseRupiah(e.target.value);
    setMenuForm({ ...menuForm, price: raw });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
        </h3>
        <form onSubmit={handleMenuSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Item Name"
            value={menuForm.name || ''}
            onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
            className="w-full p-3 border rounded-lg"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Price (Rp)"
              value={menuForm.price === '' ? '' : formatRupiah(menuForm.price)}
              onChange={handlePriceChange}
              className="p-3 border rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={menuForm.category || ''}
              onChange={(e) => setMenuForm({...menuForm, category: e.target.value})}
              className="p-3 border rounded-lg"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ingredients</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add ingredient"
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
                className="flex-1 p-3 border rounded-lg"
              />
              <button
                type="button"
                onClick={addIngredient}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {menuForm.ingredients.map((ing, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                  <span>{ing}</span>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="available"
              checked={menuForm.available || false}
              onChange={(e) => setMenuForm({...menuForm, available: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="available" className="ml-2 block text-sm text-gray-900">
              Available for sale
            </label>
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
            >
              {editingItem ? 'Update Item' : 'Add Item'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMenuModal(false);
                setEditingItem(null);
              }}
              className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuModal;