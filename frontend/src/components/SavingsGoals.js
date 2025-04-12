import React, { useState, useEffect } from 'react';
import axios from '../utils/authUtils'; // Using our intercepted axios
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit, FaPlus, FaPiggyBank } from 'react-icons/fa';

// Debug the API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
console.log('SavingsGoals component - API_URL:', API_URL);

const SavingsGoals = () => {
  const { currentUser } = useAuth(); // We don't need token or getToken anymore
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: 0,
    current_amount: 0,
    target_date: '',
    category: '',
    priority: 'Medium',
    notes: ''
  });

  const priorityColors = {
    Low: 'bg-blue-100 text-blue-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800'
  };

  const categories = [
    'Emergency Fund',
    'Vacation',
    'Education',
    'Home',
    'Vehicle',
    'Retirement',
    'Wedding',
    'Electronics',
    'Other'
  ];

  useEffect(() => {
    if (currentUser) {
      fetchGoals();
    }
  }, [currentUser]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/savings/${currentUser.uid}`);
      setGoals(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching savings goals:', error);
      toast.error('Failed to load savings goals');
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

  const openModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        target_amount: goal.target_amount,
        current_amount: goal.current_amount,
        target_date: goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : '',
        category: goal.category || '',
        priority: goal.priority || 'Medium',
        notes: goal.notes || ''
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: '',
        target_amount: 0,
        current_amount: 0,
        target_date: '',
        category: '',
        priority: 'Medium',
        notes: ''
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const goalData = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount)
      };
      
      if (editingGoal) {
        await axios.put(`${API_URL}/savings/${currentUser.uid}/${editingGoal._id}`, goalData);
        toast.success('Savings goal updated successfully');
      } else {
        await axios.post(`${API_URL}/savings/${currentUser.uid}`, goalData);
        toast.success('Savings goal created successfully');
      }
      
      fetchGoals();
      closeModal();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Failed to save savings goal');
    }
  };

  const deleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      try {
        await axios.delete(`${API_URL}/savings/${currentUser.uid}/${goalId}`);
        toast.success('Savings goal deleted successfully');
        fetchGoals();
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast.error('Failed to delete savings goal');
      }
    }
  };

  const calculateProgress = (goal) => {
    return Math.min(100, (goal.current_amount / goal.target_amount) * 100);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="loader">Loading...</div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Savings Goals</h1>
        <button
          onClick={() => openModal()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FaPlus className="mr-2" /> Create Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="flex justify-center mb-4">
            <FaPiggyBank className="text-5xl text-green-500" />
          </div>
          <p className="text-gray-600 mb-4">You haven't created any savings goals yet.</p>
          <button
            onClick={() => openModal()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Create Your First Savings Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <div key={goal._id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{goal.name}</h2>
                  {goal.category && (
                    <p className="text-sm text-gray-500">
                      {goal.category}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[goal.priority]}`}>
                    {goal.priority}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Progress: {calculateProgress(goal).toFixed(0)}%</span>
                  <span className="text-sm font-medium text-gray-700">
                    ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${calculateProgress(goal)}%` }}
                  ></div>
                </div>
              </div>
              
              {goal.target_date && (
                <p className="mb-2 text-sm text-gray-600">
                  Target Date: {new Date(goal.target_date).toLocaleDateString()}
                </p>
              )}
              
              {goal.notes && (
                <p className="mb-4 text-sm text-gray-600">
                  {goal.notes}
                </p>
              )}
              
              <div className="flex justify-end space-x-2 mt-4">
                <button 
                  onClick={() => openModal(goal)} 
                  className="text-blue-600 hover:text-blue-800 p-2"
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={() => deleteGoal(goal._id)} 
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for creating/editing goals */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-90vh overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Goal Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  placeholder="e.g., Vacation to Paris"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Target Amount ($)</label>
                  <input
                    type="number"
                    name="target_amount"
                    value={formData.target_amount}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Current Amount ($)</label>
                  <input
                    type="number"
                    name="current_amount"
                    value={formData.current_amount}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Target Date (Optional)</label>
                <input
                  type="date"
                  name="target_date"
                  value={formData.target_date}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Add any additional details about this savings goal"
                ></textarea>
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
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsGoals; 