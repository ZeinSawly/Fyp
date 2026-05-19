import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import api from '../../config/api';

export default function SwapCourseWithCart({ route, navigation }) {
  const { student } = route.params || {};
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);

  // Dropdown states for enrolled courses
  const [openEnrolled, setOpenEnrolled] = useState(false);
  const [selectedEnrolledValue, setSelectedEnrolledValue] = useState(null);
  const [enrolledItems, setEnrolledItems] = useState([]);

  // Dropdown states for cart items
  const [openCart, setOpenCart] = useState(false);
  const [selectedCartValue, setSelectedCartValue] = useState(null);
  const [cartItemsList, setCartItemsList] = useState([]);

  // Store full objects for selected items
  const [selectedEnrolled, setSelectedEnrolled] = useState(null);
  const [selectedCartItem, setSelectedCartItem] = useState(null);

  useEffect(() => {
    if (!student?.id) {
      navigation.goBack();
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load enrolled courses
      const enrolledRes = await api.get(`/api/students/${student.id}/enrolled-courses/swap`);
      if (enrolledRes.data.success && enrolledRes.data.data.length > 0) {
        const formattedEnrolled = enrolledRes.data.data.map(course => ({
          label: `${course.course_name} (${course.course_id}) - Section ${course.section_code}`,
          value: course.section_id,
          ...course
        }));
        setEnrolledItems(formattedEnrolled);
        setEnrolledCourses(enrolledRes.data.data);
        
        setSelectedEnrolledValue(null);
        setSelectedEnrolled(null);
      }

      // Load cart items
      const cartRes = await api.get(`/api/students/${student.id}/cart-items/swap`);
      if (cartRes.data.success && cartRes.data.data.length > 0) {
        const formattedCart = cartRes.data.data.map(item => ({
          label: `${item.course_name} (${item.course_id}) - Section ${item.section_code}`,
          value: item.cart_item_id,
          ...item
        }));
        setCartItemsList(formattedCart);
        setCartItems(cartRes.data.data);
        
        setSelectedCartValue(null);
        setSelectedCartItem(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const clearEnrolledSelection = () => {
    setSelectedEnrolledValue(null);
    setSelectedEnrolled(null);
    setOpenEnrolled(false); // Close dropdown if open
  };

  const clearCartSelection = () => {
    setSelectedCartValue(null);
    setSelectedCartItem(null);
    setOpenCart(false); // Close dropdown if open
  };

  const handleEnrolledChange = (value) => {
    setSelectedEnrolledValue(value);
    if (value) {
      const selected = enrolledItems.find(item => item.value === value);
      setSelectedEnrolled(selected);
    } else {
      setSelectedEnrolled(null);
    }
  };

  const handleCartChange = (value) => {
    setSelectedCartValue(value);
    if (value) {
      const selected = cartItemsList.find(item => item.value === value);
      setSelectedCartItem(selected);
    } else {
      setSelectedCartItem(null);
    }
  };

  const handleSwap = async () => {
    if (!selectedEnrolled || !selectedCartItem) {
      Alert.alert('Error', 'Please select both a course to drop and a course from cart');
      return;
    }

    setSwapping(true);
    try {
      const response = await api.post('/api/students/swap-with-cart', {
        student_id: student.id,
        enrolled_section_id: selectedEnrolled.section_id,
        enrolled_course_id: selectedEnrolled.course_id,
        cart_item_id: selectedCartItem.cart_item_id
      });

      if (response.data.success) {
        Alert.alert('Swap Successful!', response.data.message, [
          { 
            text: 'OK', 
            onPress: () => {
              loadData();
            }
          }
        ]);
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Swap failed');
    } finally {
      setSwapping(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return 'TBD';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const ScheduleDisplay = ({ schedules }) => (
    <View style={styles.scheduleContainer}>
      {schedules.map((sched, idx) => (
        <View key={idx} style={styles.scheduleRow}>
          <Text style={styles.scheduleDay}>{sched.day.slice(0, 3)}</Text>
          <Text style={styles.scheduleTime}>
            {formatTime(sched.start)} - {formatTime(sched.end)}
          </Text>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2b6cb0" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (enrolledCourses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="book-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>No enrolled courses</Text>
          <Text style={styles.emptySubtext}>You need to be enrolled in at least one course to swap</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="cart-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>Cart is empty</Text>
          <Text style={styles.emptySubtext}>Add courses to your cart first before swapping</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('CourseCatalog', { student })}
          >
            <Text style={styles.backButtonText}>Browse Courses</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Swap Course</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Course to Drop Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
               Course to Drop
            </Text>
            {selectedEnrolled && (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={clearEnrolledSelection}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <DropDownPicker
            open={openEnrolled}
            value={selectedEnrolledValue}
            items={enrolledItems}
            setOpen={setOpenEnrolled}
            setValue={setSelectedEnrolledValue}
            setItems={setEnrolledItems}
            onChangeValue={handleEnrolledChange}
            placeholder="Select a course to drop"
            placeholderStyle={styles.placeholderStyle}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            labelStyle={styles.dropdownLabel}
            listMode="SCROLLVIEW"
            zIndex={3000}
            zIndexInverse={1000}
          />
          
          {selectedEnrolled && (
            <View style={styles.detailsCard}>
              <Text style={styles.courseTitle}>{selectedEnrolled.course_name}</Text>
              <Text style={styles.courseMeta}>
                {selectedEnrolled.course_id} • {selectedEnrolled.credits} credits
              </Text>
              <Text style={styles.sectionInfo}>
                Section {selectedEnrolled.section_code}
              </Text>
              <Text style={styles.instructorText}>
                Instructor: {selectedEnrolled.instructor_name}
              </Text>
              {selectedEnrolled.schedules && selectedEnrolled.schedules.length > 0 && (
                <>
                  <Text style={styles.scheduleLabel}>Schedule:</Text>
                  <ScheduleDisplay schedules={selectedEnrolled.schedules} />
                </>
              )}
            </View>
          )}
        </View>

        {/* Swap Arrow Icon */}
        {(selectedEnrolled || selectedCartItem) && (
          <View style={styles.swapIcon}>
            <Ionicons name="swap-horizontal" size={32} color="#2b6cb0" />
          </View>
        )}

        {/* Course from Cart Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Swap With (From Cart)
            </Text>
            {selectedCartItem && (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={clearCartSelection}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <DropDownPicker
            open={openCart}
            value={selectedCartValue}
            items={cartItemsList}
            setOpen={setOpenCart}
            setValue={setSelectedCartValue}
            setItems={setCartItemsList}
            onChangeValue={handleCartChange}
            placeholder="Select a course from cart"
            placeholderStyle={styles.placeholderStyle}
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            labelStyle={styles.dropdownLabel}
            listMode="SCROLLVIEW"
            zIndex={2000}
            zIndexInverse={2000}
          />
          
          {selectedCartItem && (
            <View style={styles.detailsCard}>
              <Text style={styles.courseTitle}>{selectedCartItem.course_name}</Text>
              <Text style={styles.courseMeta}>
                {selectedCartItem.course_id} • {selectedCartItem.credits} credits
              </Text>
              <Text style={styles.sectionInfo}>
                Section {selectedCartItem.section_code}
              </Text>
              <Text style={styles.instructorText}>
                Instructor: {selectedCartItem.instructor_name}
              </Text>
              <View style={styles.capacityContainer}>
                <Ionicons name="people-outline" size={14} color="#10B981" />
                <Text style={styles.capacityText}>
                  Available seats: {selectedCartItem.capacity}
                </Text>
              </View>
              {selectedCartItem.schedules && selectedCartItem.schedules.length > 0 && (
                <>
                  <Text style={styles.scheduleLabel}>Schedule:</Text>
                  <ScheduleDisplay schedules={selectedCartItem.schedules} />
                </>
              )}
            </View>
          )}
        </View>

        {/* Reset All Button */}
        {(selectedEnrolled || selectedCartItem) && (
          <TouchableOpacity 
            style={styles.resetAllButton}
            onPress={() => {
              clearEnrolledSelection();
              clearCartSelection();
            }}
          >
            <Ionicons name="refresh-outline" size={18} color="#64748B" />
            <Text style={styles.resetAllText}>Reset All Selections</Text>
          </TouchableOpacity>
        )}

        {/* Warning Message */}
        <View style={styles.warningCard}>
          <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            The system will check prerequisites, schedule conflicts, and capacity before swapping.
          </Text>
        </View>
      </ScrollView>

      {/* Swap Button */}
      {selectedEnrolled && selectedCartItem && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.swapButton, swapping && styles.disabledButton]}
            onPress={handleSwap}
            disabled={swapping}
          >
            <Text style={styles.swapButtonText}>
              {swapping ? 'Swapping...' : `Swap ${selectedEnrolled.course_name} for ${selectedCartItem.course_name}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: '#FFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 50,
  },
  dropdownContainer: {
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#1E293B',
  },
  placeholderStyle: {
    color: '#94A3B8',
  },
  detailsCard: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    gap: 6,
    marginTop: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  courseMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  sectionInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2b6cb0',
    marginTop: 2,
  },
  instructorText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  capacityText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  scheduleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
  },
  scheduleContainer: {
    gap: 6,
    marginTop: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleDay: {
    width: 40,
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
  scheduleTime: {
    fontSize: 13,
    color: '#475569',
  },
  swapIcon: {
    alignItems: 'center',
    marginVertical: 16,
  },
  resetAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'center',
  },
  resetAllText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  swapButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  swapButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2b6cb0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: '500',
  },
});