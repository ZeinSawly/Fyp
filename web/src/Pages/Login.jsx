import React, { useState, useEffect } from 'react';
import { Form, Input, Button } from 'antd';
import {
  UserOutlined, LockOutlined, ArrowRightOutlined,
  EyeOutlined, EyeInvisibleOutlined, WarningOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import api from '../config/api';


export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (values) => {
    if (!values.id || !values.password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    // Clear any existing tokens first
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    try {
      const res = await api.post('/api/login', { 
        id: parseInt(values.id), 
        password: values.password,
      });

      const { token, user } = res.data;

      if (user.role !== 'admin' && user.role !== 'instructor' && user.role !== 'finance_officer') {
        setError('Access denied. This portal is for staff only.');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'admin') 
        window.location.href = '/admin';
      else if (user.role === 'instructor') 
        window.location.href = '/instructor';
      else if (user.role === 'finance_officer') 
        window.location.href = '/finance';

    } catch (err) {
      const message = err.response?.data?.message || 'Invalid ID or password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #edf2f7 0%, #f8fafc 100%)',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
        width: '100%',
        padding: '60px 20px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
      }}>
        {/* Logo icon */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          width: 90, height: 90,
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        }}>
          <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 42 }} />
        </div>

        <h1 style={{
          fontSize: 28, fontWeight: 700, color: '#fff',
          margin: 0, letterSpacing: '-0.5px',
        }}>
          Antonine University
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', margin: '8px 0 0' }}>
          Staff Portal
        </p>
      </div>

      {/* Form area */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px',
        marginTop: '-40px',
      }}>
        <div style={{
          width: '100%', maxWidth: 480,
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>

          {/* Welcome text */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{
              fontSize: 30, fontWeight: 800, color: '#1a365d', marginBottom: 6,
            }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: 15, color: '#4a5568' }}>
              Sign in to continue to your portal
            </p>
          </div>

          {/* Card */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 24,
            padding: '32px 28px',
            boxShadow: '0 20px 35px -10px rgba(0,0,0,0.1)',
          }}>
            <Form layout="vertical" onFinish={handleLogin}>

              {/* ID field */}
              <div style={{
                display: 'flex', alignItems: 'center',
                backgroundColor: '#f7fafc', borderRadius: 14,
                padding: '0 16px', height: 56, marginBottom: 14,
                border: '1px solid #e2e8f0',
              }}>
                <UserOutlined style={{ color: '#718096', fontSize: 17, marginRight: 10 }} />
                <Form.Item name="id" style={{ flex: 1, marginBottom: 0 }} rules={[{ required: true, message: '' }]}>
                  <Input
                    placeholder="University ID"
                    bordered={false}
                    style={{ background: 'transparent', fontSize: 15, padding: '12px 0' }}
                    onChange={() => setError('')}
                  />
                </Form.Item>
              </div>

              {/* Password field */}
              <div style={{
                display: 'flex', alignItems: 'center',
                backgroundColor: '#f7fafc', borderRadius: 14,
                padding: '0 16px', height: 56, marginBottom: 14,
                border: '1px solid #e2e8f0',
              }}>
                <LockOutlined style={{ color: '#718096', fontSize: 17, marginRight: 10 }} />
                <Form.Item name="password" style={{ flex: 1, marginBottom: 0 }} rules={[{ required: true, message: '' }]}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    bordered={false}
                    style={{ background: 'transparent', fontSize: 15, padding: '12px 0' }}
                    onChange={() => setError('')}
                  />
                </Form.Item>
                <div onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', color: '#718096' }}>
                  {showPassword
                    ? <EyeInvisibleOutlined style={{ fontSize: 17 }} />
                    : <EyeOutlined style={{ fontSize: 17 }} />
                  }
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  backgroundColor: '#fff5f5', border: '1px solid #fed7d7',
                  padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                }}>
                  <WarningOutlined style={{ color: '#e53e3e', fontSize: 16 }} />
                  <span style={{ color: '#c53030', fontSize: 14 }}>{error}</span>
                </div>
              )}

              {/* Forgot password */}
              <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <a href="#" style={{ color: '#3182ce', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
                  Forgot Password?
                </a>
              </div>

              {/* Submit */}
              <Button
                htmlType="submit"
                loading={loading}
                style={{
                  backgroundColor: '#2b6cb0', height: 54,
                  borderRadius: 14, width: '100%', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, fontSize: 16, fontWeight: 600, color: '#fff',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a365d'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2b6cb0'}
              >
                {!loading && <>
                  <span>Sign In</span>
                  <ArrowRightOutlined />
                </>}
              </Button>

            </Form>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <p style={{ fontSize: 12, color: '#718096', margin: 0 }}>
              © {new Date().getFullYear()} Antonine University — IT Support Ext. 1234
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
