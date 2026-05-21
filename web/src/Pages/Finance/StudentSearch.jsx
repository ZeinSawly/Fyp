import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Input, Typography, Tag, Empty, Spin, Avatar, Row, Col 
} from 'antd';
import {
  SearchOutlined, UserOutlined, WarningOutlined, 
  CheckCircleOutlined, BookOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import FinanceLayout from '../../Components/FinanceLayout';
import api from '../../config/api';

const { Text, Title } = Typography;

export default function StudentSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search — fires 300ms after user stops typing
  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/api/finance/students/search?q=${encodeURIComponent(searchTerm.trim())}`);
      if (res.data.success) {
        setResults(res.data.data || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce typing
  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, performSearch]);

  const handleStudentClick = (student) => {
    // Will navigate to account detail page (built in next step)
    navigate(`/finance/student/${student.id}`);
  };

  const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString()}`;

  return (
    <FinanceLayout title="Student Search">
      
      {/* Header card */}
      <Card style={{ 
        borderRadius: 16, 
        border: 'none', 
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        marginBottom: 20,
      }}>
        <Title level={4} style={{ margin: 0, color: '#1a365d' }}>
          Find a Student
        </Title>
        <Text style={{ color: '#64748B', fontSize: 13 }}>
          Search by student ID, name, or email to view their financial account
        </Text>

        <Input
          size="large"
          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
          placeholder="Try '202311094' or 'Zein' or 'sawly@hotmail.com'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          allowClear
          style={{ 
            marginTop: 16, 
            borderRadius: 12, 
            padding: '12px 16px',
          }}
          autoFocus
        />
      </Card>

      {/* Results */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <Card style={{ borderRadius: 16, border: 'none' }}>
          <Empty 
            description={
              <Text style={{ color: '#94A3B8' }}>
                No students found for "{query}"
              </Text>
            } 
          />
        </Card>
      )}

      {!loading && !hasSearched && (
        <Card style={{ borderRadius: 16, border: 'none', textAlign: 'center', padding: 40 }}>
          <SearchOutlined style={{ fontSize: 40, color: '#CBD5E0', marginBottom: 12 }} />
          <div style={{ color: '#94A3B8', fontSize: 14 }}>
            Start typing to search for students
          </div>
        </Card>
      )}

      {!loading && results.length > 0 && (
        <>
          <Text style={{ color: '#64748B', fontSize: 13, marginBottom: 12, display: 'block' }}>
            {results.length} student{results.length === 1 ? '' : 's'} found
          </Text>

          <Row gutter={[12, 12]}>
            {results.map((student) => {
              const hasOverdue = student.overdue_count > 0;
              const hasBalance = Number(student.outstanding_balance) > 0;

              return (
                <Col xs={24} key={student.id}>
                  <Card
                    hoverable
                    onClick={() => handleStudentClick(student)}
                    style={{
                      borderRadius: 14,
                      border: hasOverdue ? '2px solid #FED7D7' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    bodyStyle={{ padding: 16 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      
                      {/* Left: student info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                        <Avatar 
                          size={48} 
                          style={{ 
                            backgroundColor: hasOverdue ? '#FED7D7' : '#EFF6FF',
                            color: hasOverdue ? '#C53030' : '#2b6cb0',
                            fontWeight: 700,
                            fontSize: 18,
                          }}
                        >
                          {student.name?.charAt(0).toUpperCase()}
                        </Avatar>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong style={{ fontSize: 15, color: '#1a365d' }}>
                              {student.name}
                            </Text>
                            <Tag color="blue" style={{ margin: 0 }}>
                              {student.id}
                            </Tag>
                          </div>

                          <div style={{ marginTop: 4, color: '#64748B', fontSize: 12 }}>
                            <BookOutlined style={{ marginRight: 4 }} />
                            {student.major_name || 'No major assigned'}
                            {student.gpa && ` · GPA ${Number(student.gpa).toFixed(2)}`}
                          </div>

                          <Text style={{ color: '#94A3B8', fontSize: 11 }}>
                            {student.email}
                          </Text>
                        </div>
                      </div>

                      {/* Right: financial preview */}
                      <div style={{ textAlign: 'right', minWidth: 140 }}>
                        {hasBalance ? (
                          <>
                            <Text style={{ color: '#64748B', fontSize: 11 }}>
                              Outstanding
                            </Text>
                            <div style={{ 
                              fontSize: 18, 
                              fontWeight: 800, 
                              color: hasOverdue ? '#C53030' : '#1a365d',
                              lineHeight: 1.2,
                            }}>
                              {formatCurrency(student.outstanding_balance)}
                            </div>
                            {hasOverdue && (
                              <Tag 
                                icon={<WarningOutlined />} 
                                color="red" 
                                style={{ marginTop: 4 }}
                              >
                                {student.overdue_count} overdue
                              </Tag>
                            )}
                          </>
                        ) : (
                          <Tag 
                            icon={<CheckCircleOutlined />} 
                            color="green"
                          >
                            All paid
                          </Tag>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}
    </FinanceLayout>
  );
}