import React, { useState } from 'react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { Icon } from '@/components/common/LucideIcon';
import PageHeader from '@/components/common/PageHeader';
import { useAuthContext } from '@/context/useAuthContext';
import api from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function ChangePassword() {
  const { user } = useAuthContext();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("New passwords do not match");
    }

    if (!formData.oldPassword) {
      return toast.error("Please enter your old password");
    }

    setLoading(true);
    try {
      await api.put('/auth/changepassword', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });
      
      toast.success('Password changed successfully!');
      
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Change Password" 
        rightContent={
          <Button variant="primary" onClick={handleSubmit} disabled={loading || !formData.newPassword}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <Icon icon="lucide:save" width={16} className="me-2" />}
            Save Password
          </Button>
        }
      />
      
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>Old Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    name="oldPassword" 
                    value={formData.oldPassword} 
                    onChange={handleChange} 
                    required 
                  />
                </Form.Group>
                
                <hr className="my-4 border-secondary opacity-25" />

                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    name="newPassword" 
                    value={formData.newPassword} 
                    onChange={handleChange} 
                    required 
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleChange}
                    required 
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
