import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ManageClasses({ navigation, route }) {
  const { student } = route.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Classes</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('ShoppingCart', { student })}
          activeOpacity={0.8}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="cart-outline" size={26} color="#2b6cb0" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Shopping Cart</Text>
            <Text style={styles.optionSubtitle}>View and remove selected course sections</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { marginTop: 15 }]}
          onPress={() => navigation.navigate('SwapCourse', { student })}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="swap-horizontal" size={26} color="#0284C7" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Swap Course</Text>
            <Text style={styles.optionSubtitle}>Exchange an enrolled course with one from your cart</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { marginTop: 15 }]}
          onPress={() => navigation.navigate('DropCourse', { student })}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="remove-circle-outline" size={26} color="#EF4444" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Drop Course</Text>
            <Text style={styles.optionSubtitle}>Drop currently enrolled courses</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  container: {
    padding: 20,
  },
  optionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
});
