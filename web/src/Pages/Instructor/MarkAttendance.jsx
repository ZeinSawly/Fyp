// src/pages/instructor/MarkAttendance.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Select, DatePicker, Button, Table, Tag, Space, message, Spin,
  Alert, Row, Col, Typography, Popconfirm
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import InstructorLayout from '../../Components/InstructorLayout';
import api from '../../config/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function MarkAttendance() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceExists, setAttendanceExists] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/instructor/${user.id}/courses`);
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      message.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async (sectionId, date) => {
    if (!sectionId || !date) return;
    try {
      const formattedDate = date.format('YYYY-MM-DD');
      const response = await api.get('/api/instructor/attendance/sessions', {
        params: { section_id: sectionId, date: formattedDate }
      });
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      message.error('Failed to load sessions');
    }
  };

  const fetchStudents = async () => {
    if (!selectedSection || !selectedSession || !selectedDate) return;
    try {
      setLoading(true);
      const formattedDate = selectedDate.format('YYYY-MM-DD');
      const response = await api.get('/api/instructor/attendance/students', {
        params: {
          section_id: selectedSection,
          schedule_id: selectedSession,
          date: formattedDate
        }
      });
      if (response.data.success) {
        setStudents(response.data.data.map(s => ({
          ...s,
          attendance_status: s.attendance_status === 'present' ? 'present' : 
                            s.attendance_status === 'absent' ? 'absent' : 'not_marked'
        })));
        
        // Check if attendance already exists
        const exists = response.data.data.some(s => s.attendance_status !== 'not_marked');
        setAttendanceExists(exists);
      }
    } catch (error) {
      message.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId) => {
    const course = courses.find(c => c.course_id === courseId);
    setSelectedCourse(course);
    setSelectedSection(course?.section_id);
    setSelectedSession(null);
    setSessions([]);
    setStudents([]);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (selectedSection) {
      fetchSessions(selectedSection, date);
    }
    setSelectedSession(null);
    setStudents([]);
  };

  const handleSessionChange = (sessionId) => {
    setSelectedSession(sessionId);
  };

  const handleAttendanceChange = (studentId, status) => {
    setStudents(prev => prev.map(s =>
      s.student_id === studentId ? { ...s, attendance_status: status } : s
    ));
  };

  const handleSubmit = async () => {
    if (!selectedSection || !selectedSession || !selectedDate) {
      message.warning('Please select course, date, and session');
      return;
    }

    const attendanceData = students.map(s => ({
      student_id: s.student_id,
      status: s.attendance_status === 'present' ? 'present' : 'absent'
    }));

    setSubmitting(true);
    try {
      const response = await api.post('/api/instructor/attendance/submit', {
        section_id: selectedSection,
        schedule_id: selectedSession,
        date: selectedDate.format('YYYY-MM-DD'),
        attendance: attendanceData,
      });
      if (response.data.success) {
        message.success('Attendance submitted successfully');
        setAttendanceExists(true);
      }
    } catch (error) {
      message.error('Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Student Name',
      dataIndex: 'student_name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'attendance_status',
      key: 'status',
      render: (status, record) => (
        <Space>
          <Button
            type={status === 'present' ? 'primary' : 'default'}
            icon={<CheckCircleOutlined />}
            onClick={() => handleAttendanceChange(record.student_id, 'present')}
            style={{ background: status === 'present' ? '#2f855a' : undefined }}
          >
            Present
          </Button>
          <Button
            type={status === 'absent' ? 'primary' : 'default'}
            icon={<CloseCircleOutlined />}
            onClick={() => handleAttendanceChange(record.student_id, 'absent')}
            style={{ background: status === 'absent' ? '#e53e3e' : undefined }}
            danger={status === 'absent'}
          >
            Absent
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <InstructorLayout title="Mark Attendance">
      <Card style={{ borderRadius: 16 }}>
        <Title level={4}>Mark Student Attendance</Title>
        
        {/* Selection Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Text strong>Select Course</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Choose a course"
              onChange={handleCourseChange}
              value={selectedCourse?.course_id}
              loading={loading}
            >
              {courses.map(course => (
                <Option key={course.course_id} value={course.course_id}>
                  {course.course_name} - {course.section_code}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text strong>Select Date</Text>
            <DatePicker
              style={{ width: '100%', marginTop: 8 }}
              value={selectedDate}
              onChange={handleDateChange}
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Text strong>Select Session</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Choose session time"
              onChange={handleSessionChange}
              value={selectedSession}
              disabled={!selectedSection || !selectedDate}
            >
              {sessions.map(session => (
                <Option key={session.schedule_id} value={session.schedule_id}>
                  {session.start_time} - {session.end_time} | Room {session.room}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchStudents}
              disabled={!selectedSession}
              style={{ marginTop: 28, width: '100%' }}
            >
              Load Students
            </Button>
          </Col>
        </Row>

        {/* Warning if attendance already exists */}
        {attendanceExists && (
          <Alert
            message="Attendance already marked for this session"
            description="You can update the attendance below. Changes will overwrite existing records."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Students Table */}
        {students.length > 0 && (
          <>
            <Table
              columns={columns}
              dataSource={students}
              rowKey="student_id"
              loading={loading}
              pagination={false}
              style={{ marginTop: 16 }}
            />
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Popconfirm
                title="Submit Attendance"
                description={`Are you sure you want to submit attendance for ${students.length} students?`}
                onConfirm={handleSubmit}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  style={{ background: '#1a365d' }}
                >
                  Submit Attendance
                </Button>
              </Popconfirm>
            </div>
          </>
        )}
      </Card>
    </InstructorLayout>
  );
}