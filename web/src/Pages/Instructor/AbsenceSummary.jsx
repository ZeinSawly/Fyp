// src/pages/instructor/AbsenceSummary.jsx
import React, { useState, useEffect } from 'react';
import { Card, Select, Table, Tag, Typography, message, Spin, Progress } from 'antd';
import { UserOutlined, WarningOutlined } from '@ant-design/icons';
import InstructorLayout from '../../Components/InstructorLayout';
import api from '../../config/api';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AbsenceSummary() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [courses, setCourses] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get(`/api/instructor/${user.id}/courses`);
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      message.error('Failed to load courses');
    }
  };

  const fetchSummary = async (sectionId) => {
    if (!sectionId) return;
    try {
      setLoading(true);
      const response = await api.get(`/api/instructor/attendance/summary/${sectionId}`);
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      message.error('Failed to load absence summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseChange = (courseId) => {
    const course = courses.find(c => c.course_id === courseId);
    setSelectedSection(course?.section_id);
    fetchSummary(course?.section_id);
  };

  const columns = [
    {
      title: 'Student Name',
      dataIndex: 'student_name',
      key: 'name',
      render: (text) => (
        <div>
          <UserOutlined style={{ marginRight: 8, color: '#94A3B8' }} />
          <Text strong>{text}</Text>
        </div>
      ),
    },
    {
      title: 'Total Absences',
      dataIndex: 'total_absences',
      key: 'absences',
      render: (absences) => (
        <Tag color={absences > 5 ? 'red' : absences > 2 ? 'orange' : 'green'} style={{ fontSize: 14 }}>
          {absences} absence{absences !== 1 ? 's' : ''}
        </Tag>
      ),
    },
    {
      title: 'Sessions Recorded',
      dataIndex: 'total_sessions_recorded',
      key: 'sessions',
      render: (sessions) => <Text>{sessions} session{sessions !== 1 ? 's' : ''}</Text>,
    },
    {
      title: 'Attendance Rate',
      key: 'rate',
      render: (_, record) => {
        const rate = record.total_sessions_recorded > 0
          ? ((record.total_sessions_recorded - record.total_absences) / record.total_sessions_recorded * 100).toFixed(1)
          : 0;
        return (
          <div>
            <Progress percent={rate} size="small" status={rate < 70 ? 'exception' : 'success'} />
          </div>
        );
      },
    },
  ];

  return (
    <InstructorLayout title="Absence Summary">
      <Card style={{ borderRadius: 16 }}>
        <Title level={4}>Student Absence Summary</Title>
        
        <div style={{ marginBottom: 24 }}>
          <Text strong>Select Course</Text>
          <Select
            style={{ width: '100%', marginTop: 8, maxWidth: 400 }}
            placeholder="Choose a course"
            onChange={handleCourseChange}
            loading={loading}
          >
            {courses.map(course => (
              <Option key={course.course_id} value={course.course_id}>
                {course.course_name} - {course.section_code}
              </Option>
            ))}
          </Select>
        </div>

        {selectedSection && (
          <Table
            columns={columns}
            dataSource={summary}
            rowKey="student_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No attendance records found' }}
          />
        )}

        {!selectedSection && courses.length > 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
            <WarningOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>Select a course to view absence summary</div>
          </div>
        )}
      </Card>
    </InstructorLayout>
  );
}