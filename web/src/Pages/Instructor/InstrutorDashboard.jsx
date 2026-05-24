// src/pages/instructor/InstructorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Select, List, Tag } from 'antd';
import {
  BookOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import InstructorLayout from '../../Components/InstructorLayout';
import api from '../../config/api';

const { Title, Text } = Typography;
const { Option } = Select;

export default function InstructorDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchCurrentSemester();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/instructor/${user.id}/courses`);
      if (response.data.success) {
        setCourses(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedCourse(response.data.data[0]);
        }
      }
    } catch (err) {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSemester = async () => {
    try {
      const response = await api.get('/api/common/semesters/current');
      if (response.data.success) {
        setCurrentSemester(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load current semester');
    }
  };

  // Upcoming sessions for today
  const getTodaySessions = () => {
    if (!selectedCourse) return [];
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return selectedCourse.schedules?.filter(s => s.day === today) || [];
  };

  return (
    <InstructorLayout title="Dashboard">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 8px 32px rgba(26,54,93,0.25)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
            Welcome back
          </Text>
          <div style={{
            color: '#fff', fontSize: 26, fontWeight: 800,
            margin: '4px 0 6px', letterSpacing: '-0.5px',
          }}>
            Prof. {user.name}
          </div>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Instructor Portal · {currentSemester?.name || 'Loading...'}
          </Text>
        </div>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <BookOutlined style={{ color: '#fff', fontSize: 28 }} />
        </div>
      </div>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      {/* Course Selector */}
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Text strong style={{ fontSize: 14 }}>Current Course:</Text>
          <Select
            style={{ minWidth: 250 }}
            placeholder="Select a course"
            value={selectedCourse?.course_id}
            onChange={(val) => setSelectedCourse(courses.find(c => c.course_id === val))}
            loading={loading}
          >
            {courses.map(course => (
              <Option key={course.course_id} value={course.course_id}>
                {course.course_name} - {course.section_code}
              </Option>
            ))}
          </Select>
        </div>
      </Card>

      {selectedCourse && (
        <Row gutter={[16, 16]}>
          {/* Stats Cards */}
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 16, textAlign: 'center' }}>
              <BookOutlined style={{ fontSize: 32, color: '#2b6cb0' }} />
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{selectedCourse.course_name}</div>
              <Text type="secondary">Section {selectedCourse.section_code}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 16, textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: 32, color: '#2f855a' }} />
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{selectedCourse.schedules?.length || 0}</div>
              <Text type="secondary">Weekly Sessions</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 16, textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 32, color: '#d97706' }} />
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{selectedCourse.credits}</div>
              <Text type="secondary">Credits</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 16, textAlign: 'center' }}>
              <BarChartOutlined style={{ fontSize: 32, color: '#e53e3e' }} />
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>
                {selectedCourse.seats} / {selectedCourse.max_seats}
              </div>
              <Text type="secondary">Seats Available</Text>
            </Card>
          </Col>

          {/* Today's Schedule */}
          <Col xs={24} lg={12}>
            <Card title="Today's Schedule" style={{ borderRadius: 16 }}>
              {getTodaySessions().length > 0 ? (
                <List
                  dataSource={getTodaySessions()}
                  renderItem={(session, idx) => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>{session.start} - {session.end}</Text>
                          <Tag color="green">Today</Tag>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <EnvironmentOutlined style={{ marginRight: 8, color: '#94A3B8' }} />
                          <Text type="secondary">{session.room}, {session.building}</Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <CalendarOutlined style={{ fontSize: 48, color: '#CBD5E0' }} />
                  <div style={{ marginTop: 12 }}>No sessions scheduled for today</div>
                </div>
              )}
            </Card>
          </Col>

          {/* Weekly Schedule Summary */}
          <Col xs={24} lg={12}>
            <Card title="Weekly Schedule" style={{ borderRadius: 16 }}>
              {selectedCourse.schedules?.map((session, idx) => (
                <div key={idx} style={{
                  padding: '12px 0',
                  borderBottom: idx < selectedCourse.schedules.length - 1 ? '1px solid #F1F5F9' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <Text strong>{session.day}</Text>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{session.start} - {session.end}</div>
                  </div>
                  <Tag>{session.room}</Tag>
                </div>
              ))}
              {(!selectedCourse.schedules || selectedCourse.schedules.length === 0) && (
                <div style={{ textAlign: 'center', padding: 20 }}>No schedule available</div>
              )}
            </Card>
          </Col>

          {/* Quick Actions */}
          <Col xs={24}>
            <Card title="Quick Actions" style={{ borderRadius: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <div style={{
                    padding: 20,
                    background: '#EFF6FF',
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                  onClick={() => window.location.href = '/instructor/attendance/mark'}
                  >
                    <CheckCircleOutlined style={{ fontSize: 28, color: '#2b6cb0' }} />
                    <div style={{ marginTop: 8, fontWeight: 600 }}>Mark Attendance</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Record today's attendance</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{
                    padding: 20,
                    background: '#F0FFF4',
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                  onClick={() => window.location.href = '/instructor/attendance/summary'}
                  >
                    <BarChartOutlined style={{ fontSize: 28, color: '#2f855a' }} />
                    <div style={{ marginTop: 8, fontWeight: 600 }}>Absence Summary</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>View student absences</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{
                    padding: 20,
                    background: '#FFFBEB',
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                  onClick={() => window.location.href = '/instructor/grades/manage'}
                  >
                    <BookOutlined style={{ fontSize: 28, color: '#d97706' }} />
                    <div style={{ marginTop: 8, fontWeight: 600 }}>Manage Grades</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Enter/update student grades</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {!loading && courses.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary">No courses assigned to you yet.</Text>
        </Card>
      )}
    </InstructorLayout>
  );
}