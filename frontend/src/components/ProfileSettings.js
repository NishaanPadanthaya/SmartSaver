import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function ProfileSettings() {
  const { userProfile, updateUserProfile, currentUser } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [financialGoals, setFinancialGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ title: '', amount: '', date: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  
  // Budget preferences
  const [budgetPreferences, setBudgetPreferences] = useState({
    monthlyIncome: '',
    savingsTarget: '',
    expenseCategories: []
  });
  
  // Initialize form with user data
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.display_name || '');
      setPhotoURL(userProfile.photo_url || '');
      setFinancialGoals(userProfile.financial_goals || []);
      
      // Set budget preferences
      if (userProfile.budget_preferences) {
        setBudgetPreferences({
          monthlyIncome: userProfile.budget_preferences.monthlyIncome || '',
          savingsTarget: userProfile.budget_preferences.savingsTarget || '',
          expenseCategories: userProfile.budget_preferences.expenseCategories || []
        });
      }
    }
  }, [userProfile]);
  
  // Add new financial goal
  const handleAddGoal = () => {
    if (newGoal.title && newGoal.amount) {
      const updatedGoals = [...financialGoals, { ...newGoal, id: Date.now() }];
      setFinancialGoals(updatedGoals);
      setNewGoal({ title: '', amount: '', date: '' });
    }
  };
  
  // Remove financial goal
  const handleRemoveGoal = (goalId) => {
    const updatedGoals = financialGoals.filter(goal => goal.id !== goalId);
    setFinancialGoals(updatedGoals);
  };
  
  // Handle expense category changes
  const handleCategoryChange = (index, value) => {
    const updatedCategories = [...budgetPreferences.expenseCategories];
    updatedCategories[index] = value;
    setBudgetPreferences({
      ...budgetPreferences,
      expenseCategories: updatedCategories
    });
  };
  
  // Add new expense category
  const handleAddCategory = () => {
    setBudgetPreferences({
      ...budgetPreferences,
      expenseCategories: [...budgetPreferences.expenseCategories, '']
    });
  };
  
  // Remove expense category
  const handleRemoveCategory = (index) => {
    const updatedCategories = [...budgetPreferences.expenseCategories];
    updatedCategories.splice(index, 1);
    setBudgetPreferences({
      ...budgetPreferences,
      expenseCategories: updatedCategories
    });
  };
  
  // Save profile changes
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', isError: false });
    
    try {
      // Prepare update data
      const updateData = {
        display_name: displayName,
        photo_url: photoURL,
        financial_goals: financialGoals,
        budget_preferences: budgetPreferences
      };
      
      // Update profile
      await updateUserProfile(updateData);
      
      setMessage({ text: 'Profile updated successfully!', isError: false });
    } catch (error) {
      setMessage({ text: `Error updating profile: ${error.message}`, isError: true });
    } finally {
      setLoading(false);
    }
  };
  
  if (!userProfile) {
    return <div className="text-center py-10">Loading profile...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
                value={currentUser?.email || ''}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="displayName">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="photoURL">
                Profile Photo URL
              </label>
              <input
                id="photoURL"
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Budget Preferences</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="monthlyIncome">
                Monthly Income
              </label>
              <input
                id="monthlyIncome"
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={budgetPreferences.monthlyIncome}
                onChange={(e) => setBudgetPreferences({
                  ...budgetPreferences,
                  monthlyIncome: e.target.value
                })}
                placeholder="5000"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="savingsTarget">
                Monthly Savings Target (%)
              </label>
              <input
                id="savingsTarget"
                type="number"
                min="0"
                max="100"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={budgetPreferences.savingsTarget}
                onChange={(e) => setBudgetPreferences({
                  ...budgetPreferences,
                  savingsTarget: e.target.value
                })}
                placeholder="20"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Expense Categories
              </label>
              
              {budgetPreferences.expenseCategories.map((category, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={category}
                    onChange={(e) => handleCategoryChange(index, e.target.value)}
                    placeholder="Category name"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddCategory}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                + Add Category
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Financial Goals</h2>
          
          <div className="space-y-4">
            {financialGoals.map((goal) => (
              <div key={goal.id} className="border rounded-md p-4 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{goal.title}</h3>
                  <p className="text-gray-600">Target: ${goal.amount}</p>
                  {goal.date && <p className="text-gray-600">By: {goal.date}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveGoal(goal.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Add New Goal</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Goal title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Amount"
                    value={newGoal.amount}
                    onChange={(e) => setNewGoal({ ...newGoal, amount: e.target.value })}
                  />
                </div>
                <div>
                  <input
                    type="date"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={newGoal.date}
                    onChange={(e) => setNewGoal({ ...newGoal, date: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddGoal}
                className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                + Add Goal
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileSettings; 