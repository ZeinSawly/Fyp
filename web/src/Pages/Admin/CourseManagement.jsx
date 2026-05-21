import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Select, Alert, Typography,
  Row, Col, Divider, Table, Tag, Tabs, InputNumber, Space
} from 'antd';
import {
  BookOutlined, ArrowLeftOutlined, CheckCircleOutlined,
  PlusOutlined, ApartmentOutlined, ClockCircleOutlined,
  EnvironmentOutlined, TeamOutlined, IdcardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Components/AdminLayout';
import api from '../../config/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COURSE_TYPES = ['major', 'elective'];

export default function CourseManagement() {
  const navigate = useNavigate();

  // Courses state
  const [courseForm] = Form.useForm();
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [addingCourse, setAddingCourse] = useState(false);
  const [majors, setMajors] = useState([]); 
  const [majorsLoading, setMajorsLoading] = useState(false);
  // Prerequisites state (for the Add Course form)
  const [availablePrereqs, setAvailablePrereqs] = useState([]);
  const [prereqsLoading, setPrereqsLoading] = useState(false);
  const [selectedMajorForCourse, setSelectedMajorForCourse] = useState(null);
  const [selectedMajorFilter, setSelectedMajorFilter] = useState(null);
  const [filteredCourses, setFilteredCourses] = useState([]);

  // Sections state
  const [sectionForm] = Form.useForm();
  const [sections, setSections] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [selectedCourseForSection, setSelectedCourseForSection] = useState(null);
  const [addingSection, setAddingSection] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [semestersLoading, setSemestersLoading] = useState(false);

  // Schedule state
  const [scheduleForm] = Form.useForm();
  const [selectedCourseForSchedule, setSelectedCourseForSchedule] = useState(null);
  const [sectionsForSchedule, setSectionsForSchedule] = useState([]);
  const [selectedSectionForSchedule, setSelectedSectionForSchedule] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  

  // Alerts
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
    fetchMajors();
    fetchSemesters(); 
  }, []);

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const res = await api.get('/api/admin/courses');
      if (res.data.success) {
        setCourses(res.data.data);
        // If no major filter is selected, show all courses
        if (!selectedMajorFilter) {
          setFilteredCourses(res.data.data);
        } else {
          const filtered = res.data.data.filter(course => course.major_id === selectedMajorFilter);
          setFilteredCourses(filtered);
        }
      }
    } catch (err) {
      setError('Failed to load courses.');
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const res = await api.get('/api/admin/instructors/all');
      if (res.data.success) setInstructors(res.data.data);
    } catch (err) {
      console.error('Failed to load instructors');
    }
  };

  const fetchSections = async (courseId) => {
    setSectionsLoading(true);
    try {
      const res = await api.get(`/api/admin/courses/${courseId}/sections`);
      if (res.data.success) setSections(res.data.data);
    } catch (err) {
      setError('Failed to load sections.');
    } finally {
      setSectionsLoading(false);
    }
  };

  // Add this function to fetch majors
  const fetchMajors = async () => {
    setMajorsLoading(true);
    try {
      const res = await api.get('/api/admin/majors-list');
      if (res.data.success) setMajors(res.data.data);
    } catch (err) {
      console.error('Failed to load majors:', err);
      setError('Failed to load majors.');
    } finally {
      setMajorsLoading(false);
    }
  };

  const fetchSectionsForSchedule = async (courseId) => {
    try {
      const res = await api.get(`/api/admin/courses/${courseId}/sections`);
      if (res.data.success) setSectionsForSchedule(res.data.data);
    } catch (err) {
      setError('Failed to load sections.');
    }
  };

  const fetchSchedule = async (sectionId) => {
    setScheduleLoading(true);
    try {
      const res = await api.get(`/api/admin/sections/${sectionId}/schedule`);
      if (res.data.success) setSchedule(res.data.data);
    } catch (err) {
      setError('Failed to load schedule.');
    } finally {
      setScheduleLoading(false);
    }
  };

  const fetchSemesters = async () => {
      setSemestersLoading(true);
      try {
          const res = await api.get('/api/admin/semesters');
          if (res.data.success) {
              setSemesters(res.data.data);
          }
      } catch (err) {
          console.error('Failed to load semesters');
      } finally {
          setSemestersLoading(false);
      }
  };

  const fetchAvailablePrereqs = async (majorId) => {
    if (!majorId) {
      setAvailablePrereqs([]);
      return;
    }
    setPrereqsLoading(true);
    try {
      const res = await api.get(`/api/admin/courses/prerequisites/available?major_id=${majorId}`);
      if (res.data.success) {
        setAvailablePrereqs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load prerequisites:', err);
    } finally {
      setPrereqsLoading(false);
    }
  };

  // ─── HANDLERS ───
  const handleAddCourse = async (values) => {
    setAddingCourse(true);
    setError(''); 
    setSuccess('');
    try {
      const res = await api.post('/api/admin/courses/add', {
        id: values.id.toUpperCase(),
        name: values.name,
        description: values.description,
        credits: values.credits,
        type: values.type,
        major_id: values.major_id,
        prerequisite_ids: values.prerequisite_ids || [],  // ← new
      });
      const prereqCount = res.data.prerequisites_added || 0;
      setSuccess(
        `Course "${values.name}" added successfully${prereqCount > 0 ? ` with ${prereqCount} prerequisite${prereqCount === 1 ? '' : 's'}` : ''}.`
      );
      courseForm.resetFields();
      setSelectedMajorForCourse(null);
      setAvailablePrereqs([]);
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add course.');
    } finally {
      setAddingCourse(false);
    }
  };

  const handleAddSection = async (values) => {
    setAddingSection(true);
    setError(''); 
    setSuccess('');
    try {
      await api.post('/api/admin/courses/sections/add', {
        course_id: selectedCourseForSection,
        instructor_id: values.instructor_id || null,
        section_code: values.section_code,
        max_seats: values.max_seats, // ← changed from capacity
        semester_id: values.semester_id,
      });
      setSuccess(`Section "${values.section_code}" added successfully.`);
      sectionForm.resetFields();
      fetchSections(selectedCourseForSection);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add section.');
    } finally {
      setAddingSection(false);
    }
  };

  const handleAddSchedule = async (values) => {
    setAddingSchedule(true);
    setError(''); setSuccess('');
    try {
      const res = await api.post('/api/admin/courses/schedule/add', {
        section_id: selectedSectionForSchedule,
        day_of_week: values.day_of_week,
        start_time: values.start_time,
        end_time: values.end_time,
        room: values.room,
        building: values.building,
      });
      const { sessions } = res.data;
      setSuccess(
        `2 sessions created — Session 1: ${sessions[0].start}–${sessions[0].end}, Session 2: ${sessions[1].start}–${sessions[1].end}`
      );
      scheduleForm.resetFields();
      fetchSchedule(selectedSectionForSchedule);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add schedule.');
    } finally {
      setAddingSchedule(false);
    }
  };

  const handleMajorFilterChange = (majorId) => {
    setSelectedMajorFilter(majorId);
    if (!majorId) {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course => course.major_id === majorId);
      setFilteredCourses(filtered);
    }
  };

  // ─── TABLE COLUMNS ───
  const courseColumns = [
    { title: 'Course ID', dataIndex: 'id', key: 'id', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Name', dataIndex: 'name', key: 'name', render: v => <Text strong>{v}</Text> },
    { title: 'Credits', dataIndex: 'credits', key: 'credits', align: 'center' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: v => <Tag color={v === 'major' ? 'geekblue' : 'purple'}>{v}</Tag> },
    { title: 'Major', dataIndex: 'major_name', key: 'major_name', render: v => <Tag color="green">{v || 'N/A'}</Tag> },
  ];

  const sectionColumns = [
    { title: 'Section Code', dataIndex: 'section_code', key: 'section_code', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Semester', dataIndex: 'semester_name', key: 'semester_name',render: (_, record) => record.semester_name || '—'},
    { title: 'Instructor', dataIndex: 'instructor_name', key: 'instructor_name', render: v => v || 'TBA' },
    { title: 'Department', dataIndex: 'department', key: 'department', render: v => v || '—' },
    {
      title: 'Seats', key: 'seats',
      render: (_, record) => (
        <Tag color={record.seats === 0 ? 'red' : record.seats <= 5 ? 'orange' : 'green'}>
          {record.seats} / {record.max_seats} available
        </Tag>
      )
    },
  ];

  const scheduleColumns = [
    { title: 'Day', dataIndex: 'day_of_week', key: 'day_of_week', render: v => <Tag color="geekblue">{v}</Tag> },
    { title: 'Start Time', dataIndex: 'start_time', key: 'start_time', render: v => v?.slice(0, 5) },
    { title: 'End Time', dataIndex: 'end_time', key: 'end_time', render: v => v?.slice(0, 5) },
    { title: 'Room', dataIndex: 'room', key: 'room', render: v => v || '—' },
    { title: 'Building', dataIndex: 'building', key: 'building', render: v => v || '—' },
  ];

  const tabItems = [
    {
      key: 'courses',
      label: <span><BookOutlined /> Courses</span>,
      children: (
        <Row gutter={[24, 24]}>
          {/* Add Course Form */}
          <Col xs={24} lg={10}>
            <Card
              title={<span style={{ color: '#1a365d', fontWeight: 700 }}>Add New Course</span>}
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <Form form={courseForm} layout="vertical" onFinish={handleAddCourse} requiredMark={false}>
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Course ID</Text>}
                  name="id"
                  rules={[{ required: true, message: 'Please enter course ID' }]}
                >
                  <Input
                    prefix={<IdcardOutlined style={{ color: '#9CA3AF' }} />}
                    placeholder="e.g. CSI401"
                    size="large" 
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
    
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Course Name</Text>}
                  name="name"
                  rules={[{ required: true, message: 'Please enter course name' }]}
                >
                  <Input
                    prefix={<BookOutlined style={{ color: '#9CA3AF' }} />}
                    placeholder="e.g. Mobile App Development"
                    size="large" 
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
    
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      label={<Text style={{ fontWeight: 600, color: '#374151' }}>Credits</Text>}
                      name="credits"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <InputNumber
                        min={1} 
                        max={6} 
                        size="large"
                        style={{ borderRadius: 10, width: '100%' }}
                        placeholder="3"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={<Text style={{ fontWeight: 600, color: '#374151' }}>Type</Text>}
                      name="type"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Select size="large" style={{ borderRadius: 10 }} placeholder="Select type">
                        {COURSE_TYPES.map(t => (
                          <Option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
    
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Major</Text>}
                  name="major_id"
                  rules={[{ required: true, message: 'Please select a major' }]}
                >
                  <Select 
                    size="large" 
                    style={{ borderRadius: 10 }} 
                    placeholder="Select major"
                    loading={majorsLoading}
                    showSearch
                    filterOption={(input, option) =>
                      option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                    onChange={(value) => {
                      setSelectedMajorForCourse(value);
                      fetchAvailablePrereqs(value);
                      // Clear any previously selected prereqs when major changes
                      courseForm.setFieldValue('prerequisite_ids', []);
                    }}
                  >
                    {majors.map(m => (
                      <Option key={m.id} value={m.id}>{m.name}</Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Prerequisites — appears after major is chosen */}
                <Form.Item
                  label={
                    <span style={{ fontWeight: 600, color: '#374151' }}>
                      Prerequisites <Text type="secondary" style={{ fontWeight: 400, fontSize: 12 }}>(optional)</Text>
                    </span>
                  }
                  name="prerequisite_ids"
                  extra={
                    !selectedMajorForCourse
                      ? 'Select a major first to see available prerequisite courses'
                      : availablePrereqs.length === 0
                        ? 'No existing courses in this major to use as prerequisites'
                        : null
                  }
                >
                  <Select
                    mode="multiple"
                    size="large"
                    style={{ borderRadius: 10 }}
                    placeholder="Select prerequisite courses (if any)"
                    disabled={!selectedMajorForCourse || availablePrereqs.length === 0}
                    loading={prereqsLoading}
                    showSearch
                    optionFilterProp="label"
                    maxTagCount="responsive"
                    options={availablePrereqs.map(c => ({
                      label: `${c.id} — ${c.name}`,
                      value: c.id,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Description</Text>}
                  name="description"
                >
                  <TextArea rows={3} placeholder="Course description (optional)" style={{ borderRadius: 10 }} />
                </Form.Item>
    
                <Button
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  loading={addingCourse} 
                  icon={<PlusOutlined />}
                  block
                  style={{
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                    border: 'none',
                  }}
                >
                  {addingCourse ? 'Adding...' : 'Add Course'}
                </Button>
              </Form>
            </Card>
          </Col>
    
          {/* Courses Table with Filter */}
          <Col xs={24} lg={14}>
            <Card
              title={<span style={{ color: '#1a365d', fontWeight: 700 }}>Courses</span>}
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              extra={
                <Select
                  placeholder="Filter by Major"
                  style={{ width: 200 }}
                  allowClear
                  size="middle"
                  value={selectedMajorFilter}
                  onChange={handleMajorFilterChange}
                  loading={majorsLoading}
                  showSearch
                  filterOption={(input, option) =>
                    option?.children?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {majors.map(m => (
                    <Option key={m.id} value={m.id}>{m.name}</Option>
                  ))}
                </Select>
              }
            >
              <Table
                dataSource={filteredCourses}
                columns={courseColumns}
                rowKey="id"
                loading={coursesLoading}
                size="small"
                pagination={{ pageSize: 8, showTotal: (total) => `Total ${total} courses` }}
                locale={{ emptyText: selectedMajorFilter ? 'No courses found for this major' : 'No courses available' }}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'sections',
      label: <span><TeamOutlined /> Sections</span>,
      children: (
        <Row gutter={[24, 24]}>
          {/* Add Section Form */}
          <Col xs={24} lg={10}>
            <Card
              title={<span style={{ color: '#1a365d', fontWeight: 700 }}>Add Course Section</span>}
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <Form form={sectionForm} layout="vertical" onFinish={handleAddSection} requiredMark={false}>

                {/* Select Course */}
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Course</Text>}
                  required
                >
                  <Select
                    size="large"
                    placeholder="Select a course"
                    style={{ borderRadius: 10 }}
                    loading={coursesLoading}
                    onChange={(val) => {
                      setSelectedCourseForSection(val);
                      fetchSections(val);
                    }}
                    showSearch
                    filterOption={(input, option) =>
                      option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {courses.map(c => (
                      <Option key={c.id} value={c.id}>{c.name} ({c.id})</Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Semester Selection - Add this field */}
                <Form.Item
                    label={<Text style={{ fontWeight: 600, color: '#374151' }}>Semester</Text>}
                    name="semester_id"
                    rules={[{ required: true, message: 'Please select a semester' }]}
                >
                    <Select
                        size="large"
                        placeholder="Select semester"
                        style={{ borderRadius: 10 }}
                        loading={semestersLoading}
                        showSearch
                        optionFilterProp="children"
                    >
                        {semesters.map(s => (
                            <Option key={s.id} value={s.id}>
                                {s.name} {s.is_current && <Tag color="green" size="small">Current</Tag>}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      label={<Text style={{ fontWeight: 600, color: '#374151' }}>Section Code</Text>}
                      name="section_code"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input placeholder="e.g. SEC101" size="large" style={{ borderRadius: 10 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={<Text style={{ fontWeight: 600, color: '#374151' }}>Max Seats</Text>}
                      name="max_seats"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <InputNumber
                        min={1} max={200} size="large"
                        style={{ borderRadius: 10, width: '100%' }}
                        placeholder="30"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Instructor (optional) */}
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Instructor (optional)</Text>}
                  name="instructor_id"
                >
                  <Select
                    size="large" placeholder="Assign instructor"
                    style={{ borderRadius: 10 }} allowClear
                    showSearch
                    filterOption={(input, option) =>
                      option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {instructors.map(i => (
                      <Option key={i.id} value={i.id}>{i.name} — {i.department}</Option>
                    ))}
                  </Select>
                </Form.Item>

                <Button
                  type="primary" htmlType="submit" size="large"
                  loading={addingSection} icon={<PlusOutlined />}
                  disabled={!selectedCourseForSection}
                  block
                  style={{
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                    border: 'none',
                  }}
                >
                  {addingSection ? 'Adding...' : 'Add Section'}
                </Button>
              </Form>
            </Card>
          </Col>

          {/* Sections Table */}
          <Col xs={24} lg={14}>
            <Card
              title={
                <span style={{ color: '#1a365d', fontWeight: 700 }}>
                  {selectedCourseForSection
                    ? `Sections for ${selectedCourseForSection}`
                    : 'Select a course to view sections'}
                </span>
              }
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <Table
                dataSource={sections}
                columns={sectionColumns}
                rowKey="id"
                loading={sectionsLoading}
                size="small"
                pagination={{ pageSize: 8 }}
                locale={{ emptyText: 'Select a course to view its sections' }}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'schedule',
      label: <span><ClockCircleOutlined /> Schedule</span>,
      children: (
        <Row gutter={[24, 24]}>
          {/* Add Schedule Form */}
          <Col xs={24} lg={10}>
            <Card
              title={<span style={{ color: '#1a365d', fontWeight: 700 }}>Add Schedule Slot</span>}
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <Form form={scheduleForm} layout="vertical" onFinish={handleAddSchedule} requiredMark={false}>

                {/* Select Course */}
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Course</Text>}
                  required
                >
                  <Select
                    size="large" placeholder="Select a course"
                    style={{ borderRadius: 10 }} loading={coursesLoading}
                    onChange={(val) => {
                      setSelectedCourseForSchedule(val);
                      setSelectedSectionForSchedule(null);
                      setSectionsForSchedule([]);
                      setSchedule([]);
                      fetchSectionsForSchedule(val);
                    }}
                    showSearch
                    filterOption={(input, option) =>
                      option?.children?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {courses.map(c => (
                      <Option key={c.id} value={c.id}>{c.name} ({c.id})</Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Select Section */}
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Section</Text>}
                  required
                >
                  <Select
                    size="large" placeholder="Select a section"
                    style={{ borderRadius: 10 }}
                    disabled={!selectedCourseForSchedule}
                    onChange={(val) => {
                      setSelectedSectionForSchedule(val);
                      fetchSchedule(val);
                    }}
                  >
                    {sectionsForSchedule.map(s => (
                      <Option key={s.id} value={s.id}>{s.section_code}</Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Day */}
                <Form.Item
                  label={<Text style={{ fontWeight: 600, color: '#374151' }}>Day of Week</Text>}
                  name="day_of_week"
                  rules={[{ required: true, message: 'Please select a day' }]}
                >
                  <Select size="large" placeholder="Select day" style={{ borderRadius: 10 }}>
                    {DAYS.map(d => <Option key={d} value={d}>{d}</Option>)}
                  </Select>
                </Form.Item>

                {/* Start + End Time */}
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      label={<Text style={{ fontWeight: 600, color: '#374151' }}>Start Time</Text>}
                      name="start_time"
                      rules={[
                        { required: true, message: 'Required' },
                        { pattern: /^\d{2}:\d{2}$/, message: 'Format: HH:MM' },
                      ]}
                    >
                      <Input
                        prefix={<ClockCircleOutlined style={{ color: '#9CA3AF' }} />}
                        placeholder="08:00" size="large" style={{ borderRadius: 10 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={<Text style={{ fontWeight: 600, color: '#374151' }}>End Time</Text>}
                      name="end_time"
                      rules={[
                        { required: true, message: 'Required' },
                        { pattern: /^\d{2}:\d{2}$/, message: 'Format: HH:MM' },
                      ]}
                    >
                      <Input
                        prefix={<ClockCircleOutlined style={{ color: '#9CA3AF' }} />}
                        placeholder="09:30" size="large" style={{ borderRadius: 10 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Room + Building */}
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      label={<Text style={{ fontWeight: 600, color: '#374151' }}>Room</Text>}
                      name="room"
                    >
                      <Input
                        prefix={<EnvironmentOutlined style={{ color: '#9CA3AF' }} />}
                        placeholder="e.g. A101" size="large" style={{ borderRadius: 10 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={<Text style={{ fontWeight: 600, color: '#374151' }}>Building</Text>}
                      name="building"
                    >
                      <Input
                        prefix={<ApartmentOutlined style={{ color: '#9CA3AF' }} />}
                        placeholder="e.g. Main Building" size="large" style={{ borderRadius: 10 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Button
                  type="primary" htmlType="submit" size="large"
                  loading={addingSchedule} icon={<PlusOutlined />}
                  disabled={!selectedSectionForSchedule}
                  block
                  style={{
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #1a365d, #2b6cb0)',
                    border: 'none',
                  }}
                >
                  {addingSchedule ? 'Adding...' : 'Add Schedule Slot'}
                </Button>
              </Form>
            </Card>
          </Col>

          {/* Schedule Table */}
          <Col xs={24} lg={14}>
            <Card
              title={
                <span style={{ color: '#1a365d', fontWeight: 700 }}>
                  {selectedSectionForSchedule
                    ? `Schedule for Section`
                    : 'Select a course and section to view schedule'}
                </span>
              }
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <Table
                dataSource={schedule}
                columns={scheduleColumns}
                rowKey="id"
                loading={scheduleLoading}
                size="small"
                pagination={false}
                locale={{ emptyText: 'No schedule slots yet' }}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <AdminLayout title="Course Management">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Back button */}
        <div style={{ marginBottom: 24 }}>
          <Button type="text" icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin')} style={{ color: '#64748B' }}>
            Back to Dashboard
          </Button>
        </div>

        {/* Title card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <BookOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              Course Management
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              Add courses, sections, and schedules
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert message={success} type="success" showIcon
            icon={<CheckCircleOutlined />} closable
            onClose={() => setSuccess('')}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}
        {error && (
          <Alert message={error} type="error" showIcon closable
            onClose={() => setError('')}
            style={{ marginBottom: 16, borderRadius: 10 }}
          />
        )}

        {/* Tabs */}
        <Tabs
          defaultActiveKey="courses"
          items={tabItems}
          size="large"
          style={{ background: '#fff', borderRadius: 16, padding: '8px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        />

      </div>
    </AdminLayout>
  );
}