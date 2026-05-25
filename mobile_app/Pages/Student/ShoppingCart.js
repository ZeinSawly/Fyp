import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert,} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../config/api';

export default function ShoppingCart({ route, navigation }) {
  const { student } = route.params || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingKey, setRemovingKey] = useState(null);
  const [enrollingKey, setEnrollingKey] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [loadingSemester, setLoadingSemester] = useState(true);

  useEffect(() => {
    if (!student?.id) {
      setLoading(false);
      return;
    }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/students/${student.id}/cart`);
      const data = res.data;

      if (data.success) {
        setItems(data.data || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to load cart');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  // ✅ TIME FORMAT (NO SECONDS + AM/PM)
  const formatTime = (time) => {
    if (!time) return '';

    const [h, m] = time.split(':');
    let hour = parseInt(h, 10);

    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${hour}:${m} ${ampm}`;
  };

  // ✅ SCHEDULE FORMAT
  const formatSectionTime = (item) => {
    if (!item?.schedules || item.schedules.length === 0)
      return ['Time TBA'];

    const grouped = {};

    item.schedules.forEach(s => {
      if (!grouped[s.day]) grouped[s.day] = [];
      grouped[s.day].push(
        `${formatTime(s.start)} - ${formatTime(s.end)}`
      );
    });

    const result = [];

    Object.entries(grouped).forEach(([day, times]) => {
      result.push(`${day}:`);
      times.forEach(t => result.push(t));
    });

    return result;
  };

  const toggleSelection = (key) => {
    setSelectedItems(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleRemoveItem = async (item) => {
    const key = `${item.course_id}-${item.section_id}`;
    setRemovingKey(key);

    try {
      const res = await api.delete('/api/students/cart/remove', {
        data: {
          student_id: student.id,
          course_id: item.course_id,
          section_id: item.section_id,
        }
      });
    
      const data = res.data;
    
      if (data.success) {
        setItems(prev =>
          prev.filter(c =>
            !(c.course_id === item.course_id && c.section_id === item.section_id)
          )
        );
        setSelectedItems(prev => prev.filter(k => k !== key));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove item');
    } finally {
      setRemovingKey(null);
    }
  };

  const handleEnrollSelected = async () => {
    setEnrollingKey('bulk');
  
    const selectedData = items.filter(item =>
      selectedItems.includes(`${item.course_id}-${item.section_id}`)
    );
  
    if (selectedData.length === 0) {
      setEnrollingKey(null);
      return;
    }
  
    // Use Promise.allSettled — never rejects, returns per-item results
    const results = await Promise.allSettled(
      selectedData.map(item =>
        api.post('/api/students/cart/enroll', {
          student_id: student.id,
          course_id: item.course_id,
          section_id: item.section_id,
        })
      )
    );
  
    // Categorize results
    const succeeded = [];
    const failed = [];
  
    results.forEach((result, idx) => {
      const item = selectedData[idx];
      const itemLabel = `${item.course_name} (${item.section_code})`;
  
      if (result.status === 'fulfilled' && result.value.data.success) {
        succeeded.push(itemLabel);
      } else {
        // Extract the error message from the backend's response
        const errMsg = result.status === 'rejected'
          ? (result.reason.response?.data?.message || result.reason.message || 'Unknown error')
          : (result.value.data.message || 'Unknown error');
        failed.push({ label: itemLabel, reason: errMsg });
      }
    });
  
    // Build a clear summary message
    let summary = '';
    if (succeeded.length > 0) {
      summary += `Enrolled: ${succeeded.length}\n${succeeded.map(s => '  ✓ ' + s).join('\n')}`;
    }
    if (failed.length > 0) {
      if (summary) summary += '\n\n';
      summary += `Failed: ${failed.length}\n${failed.map(f => '  ✗ ' + f.label + '\n    ' + f.reason).join('\n')}`;
    }
  
    Alert.alert(
      succeeded.length > 0 && failed.length === 0
        ? 'All enrolled!'
        : failed.length > 0 && succeeded.length === 0
          ? 'Enrollment Failed'
          : 'Partial Success',
      summary
    );
  
    // Refresh the cart from server — succeeded items will be gone from DB,
    // failed items will still be in the cart (because backend rolled back)
    await fetchCart();
    setSelectedItems([]);
    setEnrollingKey(null);
  };

  const renderItem = ({ item }) => {
    const key = `${item.course_id}-${item.section_id}`;
    const isSelected = selectedItems.includes(key);
    const scheduleLines = formatSectionTime(item);

    return (
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => toggleSelection(key)}
        >
          <Ionicons
            name={isSelected ? "checkbox" : "square-outline"}
            size={24}
            color={isSelected ? "#2b6cb0" : "#CBD5E1"}
          />
        </TouchableOpacity>

        <View style={styles.cardLeft}>
          <Text style={styles.courseName}>{item.course_name}</Text>

          <Text style={styles.metaText}>
            {item.course_id} • Section {item.section_code}
          </Text>

          <Text style={styles.metaText}>
            Instructor: {item.instructor_name || 'TBA'}
          </Text>

          <Text style={styles.metaText}>
            Capacity: {item.capacity || 'N/A'}
          </Text>

          {/* SPACE */}
          <View style={styles.divider} />

          {/* SCHEDULE */}
          <View style={styles.scheduleContainer}>
            {scheduleLines.map((line, index) => (
              <Text key={index} style={styles.detailText}>
                {line}
              </Text>
            ))}
          </View>

          <Text style={styles.creditsText}>
            {item.credits} credits
          </Text>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item)}
        >
          <Ionicons name="trash" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2b6cb0" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.course_id}-${item.section_id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* ENROLL BUTTON */}
      {selectedItems.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.bulkEnrollButton}
            onPress={handleEnrollSelected}
            disabled={enrollingKey === 'bulk'}
          >
            <Text style={styles.actionText}>
              {enrollingKey === 'bulk'
                ? 'Enrolling...'
                : `Enroll ${selectedItems.length} Course(s)`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },

  listContent: {
    padding: 16,
    gap: 12,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  cardSelected: {
    borderColor: '#2b6cb0',
    backgroundColor: '#EFF6FF',
  },

  selector: {
    marginRight: 12,
  },

  cardLeft: {
    flex: 1,
  },

  courseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },

  metaText: {
    fontSize: 12,
    color: '#64748B',
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },

  scheduleContainer: {
    marginBottom: 6,
  },

  detailText: {
    fontSize: 12,
    color: '#475569',
  },

  creditsText: {
    fontSize: 12,
    color: '#2b6cb0',
    fontWeight: '600',
    marginTop: 6,
  },

  removeButton: {
    backgroundColor: '#F87171',
    borderRadius: 20,
    padding: 10,
    alignSelf: 'flex-start',
  },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },

  bulkEnrollButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },

  actionText: {
    color: '#FFF',
    fontWeight: '700',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});