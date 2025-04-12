import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser, userProfile, updateUserProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    monthlyIncome: 0,
    savingsGoal: 0,
    bio: '',
    preferredCurrency: 'USD'
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Load profile data if not already loaded
      if (!userProfile) {
        await fetchUserProfile();
      }
    };

    loadProfile();
  }, [currentUser, userProfile, fetchUserProfile, navigate]);

  // Update form when profile data changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        monthlyIncome: userProfile.monthlyIncome || 0,
        savingsGoal: userProfile.savingsGoal || 0,
        bio: userProfile.bio || '',
        preferredCurrency: userProfile.preferredCurrency || 'USD'
      });
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;
    
    // Convert numeric inputs to numbers
    if (name === 'monthlyIncome' || name === 'savingsGoal') {
      updatedValue = parseFloat(value) || 0;
    }
    
    setFormData({
      ...formData,
      [name]: updatedValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await updateUserProfile(formData);
      setSuccess(true);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile: ' + (err.message || err));
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    // Reset form data when entering edit mode
    if (!isEditing && userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        monthlyIncome: userProfile.monthlyIncome || 0,
        savingsGoal: userProfile.savingsGoal || 0,
        bio: userProfile.bio || '',
        preferredCurrency: userProfile.preferredCurrency || 'USD'
      });
    }
  };

  if (!currentUser || !userProfile) {
    return (
      <Container className="mt-4">
        <Card>
          <Card.Body className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading profile...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h3" className="d-flex justify-content-between align-items-center">
          User Profile
          <Button 
            variant={isEditing ? "secondary" : "primary"} 
            onClick={toggleEdit}
            disabled={loading}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">Profile updated successfully!</Alert>}

          {isEditing ? (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Display Name</Form.Label>
                <Form.Control
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled  // Email can only be changed in Firebase Auth directly
                />
                <Form.Text className="text-muted">
                  Email cannot be changed from this page.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Monthly Income</Form.Label>
                    <Form.Control
                      type="number"
                      name="monthlyIncome"
                      value={formData.monthlyIncome}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Savings Goal</Form.Label>
                    <Form.Control
                      type="number"
                      name="savingsGoal"
                      value={formData.savingsGoal}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Bio</Form.Label>
                <Form.Control
                  as="textarea"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Preferred Currency</Form.Label>
                <Form.Select
                  name="preferredCurrency"
                  value={formData.preferredCurrency}
                  onChange={handleChange}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                </Form.Select>
              </Form.Group>

              <Button variant="success" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Form>
          ) : (
            <div>
              <Row className="mb-3">
                <Col md={4} className="fw-bold">Display Name:</Col>
                <Col md={8}>{userProfile.displayName}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-bold">Email:</Col>
                <Col md={8}>{userProfile.email}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-bold">Phone Number:</Col>
                <Col md={8}>{userProfile.phoneNumber || 'Not provided'}</Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-bold">Monthly Income:</Col>
                <Col md={8}>
                  {userProfile.preferredCurrency === 'USD' && '$'}
                  {userProfile.preferredCurrency === 'EUR' && '€'}
                  {userProfile.preferredCurrency === 'GBP' && '£'}
                  {userProfile.preferredCurrency === 'INR' && '₹'}
                  {userProfile.preferredCurrency === 'JPY' && '¥'}
                  {userProfile.monthlyIncome || 0}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4} className="fw-bold">Savings Goal:</Col>
                <Col md={8}>
                  {userProfile.preferredCurrency === 'USD' && '$'}
                  {userProfile.preferredCurrency === 'EUR' && '€'}
                  {userProfile.preferredCurrency === 'GBP' && '£'}
                  {userProfile.preferredCurrency === 'INR' && '₹'}
                  {userProfile.preferredCurrency === 'JPY' && '¥'}
                  {userProfile.savingsGoal || 0}
                </Col>
              </Row>
              {userProfile.bio && (
                <Row className="mb-3">
                  <Col md={4} className="fw-bold">Bio:</Col>
                  <Col md={8}>{userProfile.bio}</Col>
                </Row>
              )}
              <Row className="mb-3">
                <Col md={4} className="fw-bold">Preferred Currency:</Col>
                <Col md={8}>{userProfile.preferredCurrency || 'USD'}</Col>
              </Row>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile; 