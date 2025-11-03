# Demographics Feature Implementation Plan

## 📋 Overview
Transform the static demographics cards (Male/Female) in the Admin Dashboard Stats tab into interactive, clickable cards that open a detailed demographics analysis modal with charts and insights.

---

## 🎯 Current State

### Location
- **File**: `Dashboard/screens/AdminDashboardScreen.tsx`
- **Section**: Stats Tab → Demographics section (lines ~500-570)
- **Current Implementation**: 
  - Two static cards showing Male and Female counts
  - No interaction - just display numbers
  - Average age shown separately below

### Available Data
From `user_profiles` table:
- `gender` (male, female, other, null)
- `age` (integer or null)
- `created_at` (timestamp)
- `name`, `email`, `phone` (for listing users)

---

## 🚀 Proposed Solution

### Phase 1: Make Demographics Cards Interactive

#### 1.1 Update Demographics Cards UI
**Changes to**: `Dashboard/screens/AdminDashboardScreen.tsx`

```typescript
// Current: View (non-clickable)
<View style={styles.demographicCard}>
  <Ionicons name="man" size={24} color="#3B82F6" />
  <Text>{stats.genderBreakdown.male}</Text>
  <Text>Male</Text>
</View>

// New: TouchableOpacity (clickable)
<TouchableOpacity 
  style={styles.demographicCard}
  onPress={() => handleDemographicsPress('male')}
  activeOpacity={0.7}
>
  <Ionicons name="man" size={24} color="#3B82F6" />
  <Text>{stats.genderBreakdown.male}</Text>
  <Text>Male</Text>
  <Ionicons name="chevron-forward" size={16} color="#999" />
</TouchableOpacity>
```

#### 1.2 Add State Management
```typescript
const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
const [showDemographicsModal, setShowDemographicsModal] = useState(false);
const [demographicsData, setDemographicsData] = useState(null);
```

#### 1.3 Create Handler Function
```typescript
const handleDemographicsPress = async (gender: 'male' | 'female') => {
  setSelectedGender(gender);
  setShowDemographicsModal(true);
  await loadDemographicsData(gender);
};
```

---

### Phase 2: Create Demographics Modal Component

#### 2.1 New Component Structure
**File**: `Dashboard/components/DemographicsModal.tsx`

```typescript
interface DemographicsModalProps {
  visible: boolean;
  onClose: () => void;
  gender: 'male' | 'female';
  data: DemographicsData;
  isDarkMode: boolean;
}

export const DemographicsModal: React.FC<DemographicsModalProps> = ({
  visible,
  onClose,
  gender,
  data,
  isDarkMode,
}) => {
  return (
    <Modal visible={visible} animationType="slide">
      {/* Header with gender icon and title */}
      {/* Age distribution chart */}
      {/* Statistics summary */}
      {/* User list by age group */}
      {/* Close button */}
    </Modal>
  );
};
```

---

### Phase 3: Create Demographics Data Service

#### 3.1 New Service Function
**File**: `Dashboard/services/demographicsService.ts`

```typescript
export interface DemographicsData {
  gender: 'male' | 'female';
  totalCount: number;
  averageAge: number | null;
  medianAge: number | null;
  ageDistribution: {
    ageGroup: string;
    count: number;
    percentage: number;
    users: DashboardUser[];
  }[];
  recentSignups: DashboardUser[];
  oldestUsers: DashboardUser[];
}

export const getDemographicsData = async (
  gender: 'male' | 'female'
): Promise<DemographicsData> => {
  // Query user_profiles table filtered by gender
  // Calculate age distributions
  // Group users by age ranges
  // Return structured data
};
```

#### 3.2 Age Group Ranges
```typescript
const AGE_GROUPS = [
  { label: 'Under 18', min: 0, max: 17 },
  { label: '18-24', min: 18, max: 24 },
  { label: '25-34', min: 25, max: 34 },
  { label: '35-44', min: 35, max: 44 },
  { label: '45-54', min: 45, max: 54 },
  { label: '55+', min: 55, max: 999 },
  { label: 'Not Specified', min: null, max: null },
];
```

---

### Phase 4: Add Charts/Visualizations

#### 4.1 Install Chart Library
```bash
npm install react-native-chart-kit
npm install react-native-svg
```

#### 4.2 Chart Components to Implement

**Bar Chart - Age Distribution**
```typescript
<BarChart
  data={{
    labels: ageGroups.map(g => g.label),
    datasets: [{
      data: ageGroups.map(g => g.count)
    }]
  }}
  width={screenWidth - 40}
  height={220}
  chartConfig={{
    backgroundColor: gender === 'male' ? '#3B82F6' : '#EC4899',
    backgroundGradientFrom: gender === 'male' ? '#60A5FA' : '#F472B6',
    backgroundGradientTo: gender === 'male' ? '#3B82F6' : '#EC4899',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  }}
/>
```

**Pie Chart - Age Group Percentage**
```typescript
<PieChart
  data={pieData}
  width={screenWidth - 40}
  height={220}
  chartConfig={chartConfig}
  accessor="count"
  backgroundColor="transparent"
  paddingLeft="15"
/>
```

---

### Phase 5: Modal Content Sections

#### 5.1 Header Section
```typescript
<LinearGradient
  colors={gender === 'male' 
    ? ['#3B82F6', '#60A5FA'] 
    : ['#EC4899', '#F472B6']
  }
  style={styles.header}
>
  <Ionicons 
    name={gender === 'male' ? 'man' : 'woman'} 
    size={40} 
    color="#fff" 
  />
  <Text style={styles.headerTitle}>
    {gender === 'male' ? 'Male' : 'Female'} Demographics
  </Text>
  <Text style={styles.headerSubtitle}>
    {data.totalCount} users
  </Text>
</LinearGradient>
```

#### 5.2 Stats Summary Cards
```typescript
<View style={styles.statsGrid}>
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>Average Age</Text>
    <Text style={styles.statValue}>
      {data.averageAge ? `${data.averageAge} years` : 'N/A'}
    </Text>
  </View>
  
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>Median Age</Text>
    <Text style={styles.statValue}>
      {data.medianAge ? `${data.medianAge} years` : 'N/A'}
    </Text>
  </View>
  
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>Most Common</Text>
    <Text style={styles.statValue}>
      {data.mostCommonAgeGroup}
    </Text>
  </View>
</View>
```

#### 5.3 Age Distribution Chart
```typescript
<View style={styles.chartSection}>
  <Text style={styles.sectionTitle}>Age Distribution</Text>
  <BarChart {...chartProps} />
</View>
```

#### 5.4 Age Group Breakdown List
```typescript
<ScrollView style={styles.ageGroupsList}>
  {data.ageDistribution.map((group) => (
    <TouchableOpacity 
      key={group.ageGroup}
      style={styles.ageGroupCard}
      onPress={() => expandAgeGroup(group)}
    >
      <View style={styles.ageGroupHeader}>
        <Text style={styles.ageGroupLabel}>{group.ageGroup}</Text>
        <Text style={styles.ageGroupCount}>
          {group.count} users ({group.percentage}%)
        </Text>
      </View>
      
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${group.percentage}%` }
          ]} 
        />
      </View>
      
      {/* Expandable user list */}
      {expandedGroup === group.ageGroup && (
        <View style={styles.usersList}>
          {group.users.map(user => (
            <UserMiniCard key={user.id} user={user} />
          ))}
        </View>
      )}
    </TouchableOpacity>
  ))}
</ScrollView>
```

#### 5.5 Insights Section
```typescript
<View style={styles.insightsSection}>
  <Text style={styles.sectionTitle}>Key Insights</Text>
  
  <View style={styles.insightCard}>
    <Ionicons name="trending-up" size={20} color="#10B981" />
    <Text style={styles.insightText}>
      {insights.growthTrend}
    </Text>
  </View>
  
  <View style={styles.insightCard}>
    <Ionicons name="people" size={20} color="#3B82F6" />
    <Text style={styles.insightText}>
      Largest age group: {insights.largestGroup}
    </Text>
  </View>
</View>
```

---

## 📊 Database Queries Required

### Query 1: Get Users by Gender with Age Distribution
```sql
SELECT 
  id, user_id, name, email, phone, age, created_at,
  CASE 
    WHEN age IS NULL THEN 'Not Specified'
    WHEN age < 18 THEN 'Under 18'
    WHEN age BETWEEN 18 AND 24 THEN '18-24'
    WHEN age BETWEEN 25 AND 34 THEN '25-34'
    WHEN age BETWEEN 35 AND 44 THEN '35-44'
    WHEN age BETWEEN 45 AND 54 THEN '45-54'
    WHEN age >= 55 THEN '55+'
  END as age_group
FROM user_profiles
WHERE LOWER(gender) = $1
ORDER BY age ASC;
```

### Query 2: Get Age Statistics
```sql
SELECT 
  COUNT(*) as total_count,
  ROUND(AVG(age), 1) as avg_age,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY age) as median_age,
  MIN(age) as min_age,
  MAX(age) as max_age
FROM user_profiles
WHERE LOWER(gender) = $1 AND age IS NOT NULL;
```

### Query 3: Age Group Distribution
```sql
SELECT 
  CASE 
    WHEN age IS NULL THEN 'Not Specified'
    WHEN age < 18 THEN 'Under 18'
    WHEN age BETWEEN 18 AND 24 THEN '18-24'
    WHEN age BETWEEN 25 AND 34 THEN '25-34'
    WHEN age BETWEEN 35 AND 44 THEN '35-44'
    WHEN age BETWEEN 45 AND 54 THEN '45-54'
    WHEN age >= 55 THEN '55+'
  END as age_group,
  COUNT(*) as count
FROM user_profiles
WHERE LOWER(gender) = $1
GROUP BY age_group
ORDER BY 
  CASE age_group
    WHEN 'Under 18' THEN 1
    WHEN '18-24' THEN 2
    WHEN '25-34' THEN 3
    WHEN '35-44' THEN 4
    WHEN '45-54' THEN 5
    WHEN '55+' THEN 6
    WHEN 'Not Specified' THEN 7
  END;
```

---

## 🎨 UI/UX Design Considerations

### Color Scheme
- **Male**: Blue gradient (#3B82F6 → #60A5FA)
- **Female**: Pink gradient (#EC4899 → #F472B6)
- Dark mode support for all components

### Animations
- Modal slide-in animation
- Chart fade-in animation
- Expandable age groups with smooth transitions
- Loading skeleton while fetching data

### Accessibility
- Proper touch targets (minimum 44x44)
- Descriptive labels for screen readers
- High contrast colors for readability
- Alternative text for charts

---

## 📁 File Structure

```
Dashboard/
├── components/
│   ├── DemographicsModal.tsx          [NEW]
│   ├── AgeDistributionChart.tsx       [NEW]
│   ├── AgeGroupCard.tsx               [NEW]
│   ├── UserMiniCard.tsx               [NEW]
│   └── DemographicsInsights.tsx       [NEW]
├── services/
│   └── demographicsService.ts         [NEW]
├── types/
│   └── demographics.types.ts          [NEW]
├── screens/
│   └── AdminDashboardScreen.tsx       [MODIFIED]
└── constants/
    └── demographicsConfig.ts          [NEW]
```

---

## 🔧 Implementation Steps

### Step 1: Setup Types & Constants (30 min)
- [ ] Create `demographics.types.ts`
- [ ] Create `demographicsConfig.ts` with age groups
- [ ] Update existing types if needed

### Step 2: Create Demographics Service (1 hour)
- [ ] Create `demographicsService.ts`
- [ ] Implement `getDemographicsData()` function
- [ ] Add error handling and loading states
- [ ] Test queries with real data

### Step 3: Build Modal Components (2 hours)
- [ ] Create `DemographicsModal.tsx` main component
- [ ] Build header section with gradient
- [ ] Add stats summary cards
- [ ] Implement close functionality

### Step 4: Add Charts (1.5 hours)
- [ ] Install chart libraries
- [ ] Create `AgeDistributionChart.tsx`
- [ ] Configure chart colors and styles
- [ ] Add dark mode support
- [ ] Test with sample data

### Step 5: Build Age Group List (1 hour)
- [ ] Create `AgeGroupCard.tsx`
- [ ] Implement expand/collapse functionality
- [ ] Add progress bars
- [ ] Create `UserMiniCard.tsx` for user list

### Step 6: Add Insights Section (30 min)
- [ ] Create `DemographicsInsights.tsx`
- [ ] Calculate key insights from data
- [ ] Display trends and patterns

### Step 7: Update Main Dashboard (1 hour)
- [ ] Make demographics cards clickable
- [ ] Add state management
- [ ] Integrate modal
- [ ] Add loading/error states
- [ ] Test interactions

### Step 8: Polish & Testing (1 hour)
- [ ] Test with male data
- [ ] Test with female data
- [ ] Test edge cases (no data, all null ages)
- [ ] Test dark mode
- [ ] Add animations
- [ ] Optimize performance

### Step 9: Documentation (30 min)
- [ ] Update README
- [ ] Add code comments
- [ ] Create usage guide

**Total Estimated Time**: 8-9 hours

---

## 🧪 Testing Checklist

- [ ] Click Male card → Opens modal with male data
- [ ] Click Female card → Opens modal with female data
- [ ] Charts render correctly with data
- [ ] Age groups expand/collapse properly
- [ ] User list displays correctly
- [ ] Close modal works
- [ ] Loading states show properly
- [ ] Error handling works
- [ ] Dark mode looks good
- [ ] Works with empty data
- [ ] Works with partial data (some null ages)
- [ ] Performance is smooth (no lag)

---

## 🎁 Additional Features (Optional)

### Export Functionality
- Export demographics data as CSV
- Export charts as PNG
- Share insights via email

### Filters
- Filter by age range
- Filter by signup date
- Sort users by different criteria

### Comparison View
- Side-by-side male vs female comparison
- Historical trends over time
- Year-over-year comparison

### Advanced Analytics
- Cohort analysis
- User retention by age group
- Feature usage by demographics

---

## 🚨 Potential Challenges

### Challenge 1: Performance with Large Dataset
**Solution**: Implement pagination for user lists, lazy loading for charts

### Challenge 2: Inconsistent Gender Data
**Solution**: Normalize gender values (lowercase), handle null/empty

### Challenge 3: Chart Library Compatibility
**Solution**: Test react-native-chart-kit, fallback to victory-native if issues

### Challenge 4: Modal State Management
**Solution**: Use proper state cleanup on close, prevent memory leaks

---

## 📈 Success Metrics

- Admin can view detailed demographics in < 3 clicks
- Modal loads in < 1 second
- Charts render smoothly without lag
- All data is accurate and up-to-date
- Dark mode is fully supported
- No console errors or warnings

---

## 🎯 Priority Levels

**Must Have (MVP)**:
1. ✅ Clickable male/female cards
2. ✅ Modal with basic stats
3. ✅ Age distribution chart
4. ✅ User count by age group

**Should Have**:
5. ⭐ Expandable age groups with user lists
6. ⭐ Insights section
7. ⭐ Dark mode support

**Nice to Have**:
8. 💎 Export functionality
9. 💎 Advanced filters
10. 💎 Comparison views

---

## 📞 Next Steps

1. Review and approve this plan
2. Set up development branch (✅ Already on `demographics-v1`)
3. Start with Step 1 (Types & Constants)
4. Implement features incrementally
5. Test after each major component
6. Merge to master when complete

**Estimated Timeline**: 2-3 days of focused development

---

**Status**: ✅ Planning Complete - Ready for Implementation
**Branch**: `demographics-v1`
**Last Updated**: November 3, 2025
