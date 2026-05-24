import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Tag, Spin, Empty, Select, Button,
  Statistic, Divider, Space,
} from 'antd';
import {
  CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined,
  BookOutlined, ApartmentOutlined, ReloadOutlined,
} from '@ant-design/icons';
import InstructorLayout from '../../Components/InstructorLayout';
import api from '../../config/api';

const { Title, Text } = Typography;

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const COURSE_COLORS = [
  { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' }, // blue
  { bg: '#F0FFF4', border: '#22C55E', text: '#15803D' }, // green
  { bg: '#FFFBEB', border: '#F59E0B', text: '#B45309' }, // amber
  { bg: '#FCE7F3', border: '#EC4899', text: '#BE185D' }, // pink
  { bg: '#EDE9FE', border: '#8B5CF6', text: '#6D28D9' }, // purple
  { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C' }, // red
  { bg: '#CFFAFE', border: '#06B6D4', text: '#0E7490' }, // cyan
];

export default function Schedule() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [courses, setCourses] = useState([]);
  const [allSemesters, setAllSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSemesters();
  }, []);

  // Once we have semesters, fetch the current one's courses
  useEffect(() => {
    if (allSemesters.length > 0 && !selectedSemester) {
      const current = allSemesters.find((s) => s.is_current === 1);
      if (current) {
        setSelectedSemester(current.id);
      } else {
        // Fallback to the first semester if no current set
        setSelectedSemester(allSemesters[0].id);
      }
    }
  }, [allSemesters]);

  // When semester changes, refetch courses
  useEffect(() => {
    if (selectedSemester) {
      fetchCourses(selectedSemester);
    }
  }, [selectedSemester]);

  const fetchSemesters = async () => {
    try {
      const res = await api.get('/api/common/semesters');
      if (res.data.success) {
        setAllSemesters(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load semesters', err);
    }
  };

  const fetchCourses = async (semesterId) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/instructor/${user.id}/courses?semester_id=${semesterId}`
      );
      if (res.data.success) {
        setCourses(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Build a flat list of all schedule entries ──
  // Each entry: { day, start, end, room, building, course_name, section_code, color }
  const allScheduleEntries = [];
  courses.forEach((course, idx) => {
    const color = COURSE_COLORS[idx % COURSE_COLORS.length];
    (course.schedules || []).forEach((s) => {
      allScheduleEntries.push({
        course_name: course.course_name,
        section_code: course.section_code,
        course_id: course.course_id,
        section_id: course.section_id,
        credits: course.credits,
        day: s.day,
        start: s.start,
        end: s.end,
        room: s.room,
        building: s.building,
        color,
      });
    });
  });

  // ── Group entries by day ──
  const entriesByDay = {};
  DAYS_ORDER.forEach((d) => {
    entriesByDay[d] = allScheduleEntries
      .filter((e) => e.day === d)
      .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  });

  // ── Stats ──
  const totalSessions = allScheduleEntries.length;
  const uniqueCourses = new Set(courses.map((c) => c.course_id)).size;

  // Total hours per week — convert HH:MM:SS to minutes, sum diffs
  const totalMinutes = allScheduleEntries.reduce((acc, e) => {
    if (!e.start || !e.end) return acc;
    const [sh, sm] = e.start.split(':').map(Number);
    const [eh, em] = e.end.split(':').map(Number);
    return acc + ((eh * 60 + em) - (sh * 60 + sm));
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isCurrentSemester = allSemesters.find(
    (s) => s.id === selectedSemester
  )?.is_current === 1;

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5); // HH:MM
  };

  // ── Render ──

  return (
    <InstructorLayout title="My Schedule">
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <CalendarOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>
              My Teaching Schedule
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
              Weekly schedule for the selected semester
            </div>
          </div>
        </div>

        {/* Semester selector */}
        <Card style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col xs={24} md={18}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Semester</Text>
              <Select
                size="large"
                style={{ width: '100%' }}
                value={selectedSemester}
                onChange={setSelectedSemester}
                loading={allSemesters.length === 0}
                options={allSemesters.map((s) => ({
                  value: s.id,
                  label: (
                    <span>
                      {s.name} ({s.academic_year})
                      {s.is_current === 1 && <Tag color="green" style={{ marginLeft: 8 }}>Current</Tag>}
                    </span>
                  ),
                }))}
              />
            </Col>
            <Col xs={24} md={6} style={{ marginTop: 24 }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => selectedSemester && fetchCourses(selectedSemester)}
                disabled={!selectedSemester}
                style={{ width: '100%' }}
                size="large"
              >
                Refresh
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Stats */}
        {!loading && courses.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Courses"
                  value={uniqueCourses}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#1a365d' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Sections"
                  value={courses.length}
                  prefix={<ApartmentOutlined />}
                  valueStyle={{ color: '#2b6cb0' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Weekly Sessions"
                  value={totalSessions}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: '#276749' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <Statistic
                  title="Hours / Week"
                  value={totalHours}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#d97706' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Loading */}
        {loading && (
          <Card style={{ borderRadius: 14, border: 'none', textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#64748B' }}>Loading schedule...</div>
          </Card>
        )}

        {/* Empty state */}
        {!loading && courses.length === 0 && (
          <Card style={{ borderRadius: 14, border: 'none', textAlign: 'center', padding: 40 }}>
            <CalendarOutlined style={{ fontSize: 48, color: '#CBD5E0', marginBottom: 12 }} />
            <div style={{ color: '#94A3B8', fontSize: 14 }}>
              No courses assigned for this semester
            </div>
          </Card>
        )}

        {/* Weekly grid */}
        {!loading && courses.length > 0 && (
          <Card
            title={<span style={{ color: '#1a365d', fontWeight: 700 }}>Weekly Schedule</span>}
            style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}
          >
            <Row gutter={[12, 12]}>
              {DAYS_ORDER.map((day) => {
                const entries = entriesByDay[day];
                const isToday = isCurrentSemester && day === todayName;

                return (
                  <Col key={day} xs={24} sm={12} md={8} lg={4}>
                    <div style={{
                      background: isToday ? '#F0F9FF' : '#F8FAFC',
                      border: isToday ? '2px solid #2b6cb0' : '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: 12,
                      minHeight: 220,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}>
                        <Text strong style={{ color: '#1a365d', fontSize: 13 }}>{day}</Text>
                        {isToday && <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>Today</Tag>}
                      </div>

                      {entries.length === 0 ? (
                        <div style={{ color: '#94A3B8', fontSize: 11, fontStyle: 'italic', textAlign: 'center', paddingTop: 20 }}>
                          No classes
                        </div>
                      ) : (
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          {entries.map((entry, idx) => (
                            <div
                              key={`${entry.section_id}-${idx}`}
                              style={{
                                background: entry.color.bg,
                                borderLeft: `4px solid ${entry.color.border}`,
                                borderRadius: 8,
                                padding: '8px 10px',
                              }}
                            >
                              <div style={{
                                fontWeight: 700,
                                fontSize: 11,
                                color: entry.color.text,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                marginBottom: 4,
                              }}>
                                <ClockCircleOutlined style={{ fontSize: 10 }} />
                                {formatTime(entry.start)} – {formatTime(entry.end)}
                              </div>
                              <div style={{
                                fontWeight: 700,
                                fontSize: 12,
                                color: '#1a365d',
                                lineHeight: 1.3,
                                marginBottom: 4,
                              }}>
                                {entry.course_name}
                              </div>
                              <div style={{ fontSize: 10, color: '#64748B' }}>
                                <Tag color="default" style={{ margin: 0, fontSize: 10 }}>
                                  {entry.section_code}
                                </Tag>
                              </div>
                              {(entry.room || entry.building) && (
                                <div style={{
                                  fontSize: 10,
                                  color: '#64748B',
                                  marginTop: 4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}>
                                  <EnvironmentOutlined style={{ fontSize: 10 }} />
                                  {[entry.room, entry.building].filter(Boolean).join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </Space>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        )}

        {/* Course summary */}
        {!loading && courses.length > 0 && (
          <Card
            title={<span style={{ color: '#1a365d', fontWeight: 700 }}>Courses This Semester</span>}
            style={{ borderRadius: 14, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <Row gutter={[16, 16]}>
              {courses.map((course, idx) => {
                const color = COURSE_COLORS[idx % COURSE_COLORS.length];
                return (
                  <Col key={`${course.course_id}-${course.section_id}`} xs={24} sm={12} md={8}>
                    <div style={{
                      background: color.bg,
                      borderLeft: `4px solid ${color.border}`,
                      borderRadius: 10,
                      padding: 14,
                    }}>
                      <div style={{ fontWeight: 700, color: '#1a365d', fontSize: 14, marginBottom: 4 }}>
                        {course.course_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>
                        <Tag color="default" style={{ margin: 0, fontSize: 10 }}>{course.course_id}</Tag>
                        {' '}<Tag color="blue" style={{ fontSize: 10 }}>Section {course.section_code}</Tag>
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#64748B' }}>
                        <span><BookOutlined /> {course.credits} credits</span>
                        <span><ClockCircleOutlined /> {(course.schedules || []).length} sessions/week</span>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        )}

      </div>
    </InstructorLayout>
  );
}