import React, { useState, useEffect } from 'react';
import axios from '../utils/authUtils'; // Using our intercepted axios
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';

// Debug the API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
console.log('Budget component - API_URL:', API_URL);

const Budget = () => {
  const { currentUser } = useAuth(); // We don't need token anymore
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    total_amount: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    categories: []
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    limit: 0,
    color: '#6366F1'
  });

  useEffect(() => {
    if (currentUser) {
      fetchBudgets();
    }
  }, [currentUser]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/budgets/${currentUser.uid}`);
      setBudgets(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (e) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addCategory = () => {
    if (!newCategory.name) {
      toast.error('Category name is required');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
    
    setNewCategory({
      name: '',
      limit: 0,
      color: '#6366F1'
    });
  };

  const removeCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const openModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        name: budget.name,
        total_amount: budget.total_amount,
        start_date: new Date(budget.start_date).toISOString().split('T')[0],
        end_date: new Date(budget.end_date).toISOString().split('T')[0],
        categories: budget.categories || []
      });
    } else {
      setEditingBudget(null);
      setFormData({
        name: '',
        total_amount: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        categories: []
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBudget(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const budgetData = {
        ...formData,
        total_amount: parseFloat(formData.total_amount)
      };
      
      budgetData.categories = budgetData.categories.map(cat => ({
        ...cat,
        limit: parseFloat(cat.limit)
      }));

      if (editingBudget) {
        budgetData._id = editingBudget._id;
        await axios.put(`${API_URL}/budgets/${currentUser.uid}`, budgetData);
        toast.success('Budget updated successfully');
      } else {
        await axios.post(`${API_URL}/budgets/${currentUser.uid}`, budgetData);
        toast.success('Budget created successfully');
      }
      
      fetchBudgets();
      closeModal();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
    }
  };

  const deleteBudget = async (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await axios.delete(`${API_URL}/budgets/${currentUser.uid}/${budgetId}`);
        toast.success('Budget deleted successfully');
        fetchBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
        toast.error('Failed to delete budget');
      }
    }
  };

  const calculateProgress = (budget) => {
    const totalSpent = budget.categories.reduce((total, cat) => total + (cat.spent || 0), 0);
    return Math.min(100, (totalSpent / budget.total_amount) * 100);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="loader">Loading...</div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Budget Management</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" /> Create Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600 mb-4">You haven't created any budgets yet.</p>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map(budget => (
            <div key={budget._id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{budget.name}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => openModal(budget)} className="text-blue-600 hover:text-blue-800">
                    <FaEdit />
                  </button>
                  <button onClick={() => deleteBudget(budget._id)} className="text-red-600 hover:text-red-800">
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Total: ${budget.total_amount.toFixed(2)}</span>
                  <span className="text-sm font-medium text-gray-700">
                    Spent: ${budget.categories.reduce((sum, cat) => sum + (cat.spent || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${calculateProgress(budget)}%` }}
                  ></div>
                </div>
              </div>
              
              <h3 className="font-medium text-gray-800 mb-2">Categories</h3>
              <ul className="space-y-2">
                {budget.categories.map((category, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: category.color }}
                      ></span>
                      <span>{category.name}</span>
                    </div>
                    <span>${category.limit.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating/editing budgets */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-90vh overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingBudget ? 'Edit Budget' : 'Create Budget'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Budget Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Total Amount ($)</label>
                <input
                  type="number"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Categories</label>
                
                {formData.categories.map((category, index) => (
                  <div key={index} className="flex items-center mb-2 p-2 bg-gray-50 rounded-md">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                    <span className="flex-1">{category.name}: ${category.limit}</span>
                    <button
                      type="button"
                      onClick={() => removeCategory(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                
                <div className="bg-gray-100 p-3 rounded-md mt-2">
                  <div className="mb-2">
                    <input
                      type="text"
                      name="name"
                      value={newCategory.name}
                      onChange={handleCategoryChange}
                      placeholder="Category name"
                      className="w-full p-2 mb-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="number"
                      name="limit"
                      value={newCategory.limit}
                      onChange={handleCategoryChange}
                      placeholder="Limit ($)"
                      className="p-2 border border-gray-300 rounded-md"
                      min="0"
                      step="0.01"
                    />
                    <input
                      type="color"
                      name="color"
                      value={newCategory.color}
                      onChange={handleCategoryChange}
                      className="p-2 border border-gray-300 rounded-md w-full"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={addCategory}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md w-full flex items-center justify-center"
                  >
                    <FaPlus className="mr-1" /> Add Category
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget; 