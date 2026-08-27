import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import PageHeader from '@/components/common/PageHeader';
import { useAuthContext } from '@/context/useAuthContext';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { user, token, login } = useAuthContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };

      const res = await api.put(`/users/${user._id || user.id}`, payload);
      
      // Update local storage and context
      login({ ...user, ...res.data }, token);
      
      toast.success('Profile updated successfully!');
      

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="My Profile" 
        rightContent={
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <Icon icon="lucide:save" width={16} className="me-2" />}
            Save Changes
          </Button>
        }
      />
      
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div className="bg-primary text-white d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: '80px', height: '80px', fontSize: '32px' }}>
                  {formData.name.charAt(0).toUpperCase()}
                </div>
                <h4 className="mb-1">{user?.name}</h4>
                <p className="text-muted">{user?.role}</p>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
