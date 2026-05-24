// src/pages/instructor/ManageGrades.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Select, Table, Button, InputNumber, message, Space, Typography,
  Alert, Popconfirm, Tabs, Spin, Tag
} from 'antd';
import { SaveOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import InstructorLayout from '../../Components/InstructorLayout';
import api from '../../config/api';

const { Title, Text } = Typography;
const { Option } = Select;

export default function ManageGrades() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [originalGrades, setOriginalGrades] = useState({});

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

  const fetchComponents = async (courseId) => {
    if (!courseId) return;
    try {
      const response = await api.get(`/api/instructor/grades/components/${courseId}`);
      if (response.data.success) {
        setComponents(response.data.data);
      }
    } catch (error) {
      message.error('Failed to load grade components');
    }
  };

  const fetchStudentsWithGrades = async (sectionId, componentId) => {
    if (!sectionId || !componentId) return;
    try {
      setLoading(true);
      const response = await api.get('/api/instructor/grades/students', {
        params: { section_id: sectionId, component_id: componentId }
      });
      if (response.data.success) {
        setStudents(response.data.data);
        // Store original grades for comparison
        const original = {};
        response.data.data.forEach(s => {
          original[s.student_id] = s.grade;
        });
        setOriginalGrades(original);
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
    fetchComponents(courseId);
    setSelectedComponent(null);
    setStudents([]);
  };

  const handleComponentChange = (componentId) => {
    const component = components.find(c => c.id === componentId);
    setSelectedComponent(component);
    fetchStudentsWithGrades(selectedSection, componentId);
  };

  const handleGradeChange = (studentId, value) => {
    const component = components.find(c => c.id === selectedComponent?.id);
    const maxGrade = component?.max_grade || 100;
    
    let newValue = value;
    if (value > maxGrade) {
      message.warning(`Max grade is ${maxGrade}`);
      newValue = maxGrade;
    }
    if (value < 0) newValue = 0;
    
    setStudents(prev => prev.map(s =>
      s.student_id === studentId ? { ...s, grade: newValue } : s
    ));
  };

  const handleSubmit = async () => {
    if (!selectedSection || !selectedComponent) {
      message.warning('Please select a course and grade component');
      return;
    }

    const gradesData = students.map(s => ({
      student_id: s.student_id,
      grade: s.grade !== null && s.grade !== undefined ? s.grade : null
    }));

    setSubmitting(true);
    try {
      const response = await api.post('/api/instructor/grades/submit', {
        section_id: selectedSection,
        component_id: selectedComponent.id,
        grades: gradesData,
      });
      if (response.data.success) {
        message.success('Grades submitted successfully');
        // Update original grades
        const newOriginal = {};
        students.forEach(s => {
          newOriginal[s.student_id] = s.grade;
        });
        setOriginalGrades(newOriginal);
      }
    } catch (error) {
      message.error('Failed to submit grades');
    } finally {
      setSubmitting(false);
    }
  };

  const hasChanges = () => {
    return students.some(s => s.grade !== originalGrades[s.student_id]);
  };

  const columns = [
    {
      title: 'Student Name',
      dataIndex: 'student_name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: `Grade (Max: ${selectedComponent?.max_grade || 100})`,
      dataIndex: 'grade',
      key: 'grade',
      render: (grade, record) => (
        <InputNumber
          min={0}
          max={selectedComponent?.max_grade || 100}
          step={0.5}
          value={grade}
          onChange={(value) => handleGradeChange(record.student_id, value)}
          placeholder="Enter grade"
          style={{ width: 120 }}
          precision={1}
        />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const original = originalGrades[record.student_id];
        const current = record.grade;
        if (original !== current) {
          return <Tag color="orange">Modified</Tag>;
        }
        if (current !== null && current !== undefined) {
          return <Tag color="green">Saved</Tag>;
        }
        return <Tag>Not set</Tag>;
      },
    },
  ];

  return (
    <InstructorLayout title="Manage Grades">
      <Card style={{ borderRadius: 16 }}>
        <Title level={4}>Student Grade Management</Title>
        
        {/* Selection Row */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <Text strong>Select Course</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Choose a course"
              onChange={handleCourseChange}
              value={selectedCourse?.course_id}
            >
              {courses.map(course => (
                <Option key={course.course_id} value={course.course_id}>
                  {course.course_name} - {course.section_code}
                </Option>
              ))}
            </Select>
          </div>
          
          <div style={{ flex: 1 }}>
            <Text strong>Select Grade Component</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Choose a component"
              onChange={handleComponentChange}
              value={selectedComponent?.id}
              disabled={!selectedCourse}
              loading={loading}
            >
              {components.map(comp => (
                <Option key={comp.id} value={comp.id}>
                  {comp.name} (Weight: {comp.weight}%, Max: {comp.max_grade})
                </Option>
              ))}
            </Select>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchStudentsWithGrades(selectedSection, selectedComponent?.id)}
              disabled={!selectedComponent}
              style={{ width: '100%' }}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Info about grade calculation */}
        {selectedComponent && (
          <Alert
            message="Grade Entry"
            description={`${selectedComponent.name} contributes ${selectedComponent.weight}% to final grade. Maximum grade is ${selectedComponent.max_grade}.`}
            type="info"
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
              pagination={{ pageSize: 10 }}
            />
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Popconfirm
                title="Submit Grades"
                description="Are you sure you want to submit these grades?"
                onConfirm={handleSubmit}
                okText="Yes"
                cancelText="No"
                disabled={!hasChanges()}
              >
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  disabled={!hasChanges()}
                  style={{ background: hasChanges() ? '#1a365d' : undefined }}
                >
                  Submit Grades
                </Button>
              </Popconfirm>
            </div>
          </>
        )}

        {selectedCourse && components.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
            <PlusOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>No grade components configured for this course</div>
            <Text type="secondary">Please contact administrator to set up grade components</Text>
          </div>
        )}
      </Card>
    </InstructorLayout>
  );
}