// Kinezi-AI Training Program Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { EXERCISES, Exercise } from '@/constants/exercises';
import {
  getSavedPrograms,
  createNewProgram,
  deleteProgram,
  addExerciseToProgram,
  removeExerciseFromProgram,
  seedPushPullProgram,
  seedPilatesProgram,
  seedFullBodyProgram,
  seedCoreProgram,
  getLastWeight,
  getProgressSuggestion,
  saveWeightEntry,
  UserProgram,
  ProgramExercise,
  WeightEntry,
} from '@/lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProgramScreen() {
  const router = useRouter();
  
  // Programs State
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [activeProgramId, setActiveProgramId] = useState<string | null>('templates');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalCategory, setAddModalCategory] = useState<string>('all');
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');
  
  // Weights State
  const [lastWeights, setLastWeights] = useState<Record<string, WeightEntry | null>>({});
  const [suggestions, setSuggestions] = useState<Record<string, any>>({});
  const [showManualWeightModal, setShowManualWeightModal] = useState(false);
  const [manualWeightExerciseId, setManualWeightExerciseId] = useState('');
  const [manualWeightInput, setManualWeightInput] = useState('');
  const [manualWeightLast, setManualWeightLast] = useState<WeightEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPrograms();
    }, [])
  );

  const loadPrograms = async (selectId?: string) => {
    const progs = await getSavedPrograms();
    setPrograms(progs);
    
    let currentId = selectId;
    if (!currentId && !activeProgramId) {
      currentId = 'templates';
    } else if (!currentId) {
      currentId = activeProgramId;
    }
    setActiveProgramId(currentId || 'templates');
    
    if (currentId && currentId !== 'templates') {
      const activeProg = progs.find(p => p.id === currentId);
      if (activeProg) {
        const weights: Record<string, WeightEntry | null> = {};
        const sugs: Record<string, any> = {};
        for (const pe of activeProg.exercises) {
          weights[pe.exerciseId] = await getLastWeight(pe.exerciseId);
          sugs[pe.exerciseId] = await getProgressSuggestion(pe.exerciseId);
        }
        setLastWeights(weights);
        setSuggestions(sugs);
      }
    }
  };

  const handleCreateNewProgram = async () => {
    if (!newProgramName.trim()) {
      Alert.alert('Hata', 'Lütfen bir program adı girin.');
      return;
    }
    const newProg = await createNewProgram(newProgramName.trim());
    setNewProgramName('');
    setShowNewProgramModal(false);
    await loadPrograms(newProg.id);
  };

  const handleDeleteProgram = (id: string, name: string) => {
    Alert.alert(
      'Programı Sil',
      `"${name}" programını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive', 
          onPress: async () => {
            await deleteProgram(id);
            setActiveProgramId('templates');
            await loadPrograms();
          }
        }
      ]
    );
  };

  const handleAddExercise = async (exercise: Exercise) => {
    if (!activeProgramId) return;
    await addExerciseToProgram(activeProgramId, exercise.id, exercise.defaultSets, exercise.defaultReps);
    setShowAddModal(false);
    await loadPrograms(activeProgramId);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    if (!activeProgramId) return;
    const exercise = EXERCISES.find((e) => e.id === exerciseId);
    Alert.alert(
      'Egzersizi Kaldır',
      `${exercise?.name || exerciseId} programından kaldırılsın mı?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          style: 'destructive',
          onPress: async () => {
            await removeExerciseFromProgram(activeProgramId, exerciseId);
            await loadPrograms(activeProgramId);
          },
        },
      ]
    );
  };

  const handleSeedPushPull = async () => {
    const prog = await seedPushPullProgram();
    await loadPrograms(prog.id);
  };

  const handleSeedPilates = async () => {
    const prog = await seedPilatesProgram();
    await loadPrograms(prog.id);
  };

  const handleSeedFullBody = async () => {
    const prog = await seedFullBodyProgram();
    await loadPrograms(prog.id);
  };

  const handleSeedCore = async () => {
    const prog = await seedCoreProgram();
    await loadPrograms(prog.id);
  };

  const handleStartExercise = (pe: ProgramExercise) => {
    router.push({
      pathname: '/camera',
      params: {
        exerciseId: pe.exerciseId,
        sets: pe.targetSets.toString(),
        reps: pe.targetReps.toString(),
        fromProgram: 'true',
      },
    } as any);
  };

  const handleOpenManualWeight = (pe: ProgramExercise) => {
    setManualWeightExerciseId(pe.exerciseId);
    const last = lastWeights[pe.exerciseId];
    setManualWeightLast(last || null);
    setManualWeightInput(last ? last.weight.toString() : '');
    setShowManualWeightModal(true);
  };

  const handleManualWeightSubmit = async () => {
    if (!activeProgramId) return;
    const activeProg = programs.find(p => p.id === activeProgramId);
    if (!activeProg) return;

    const weight = parseFloat(manualWeightInput);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir ağırlık girin.');
      return;
    }

    const pe = activeProg.exercises.find(e => e.exerciseId === manualWeightExerciseId);
    if (!pe) return;

    await saveWeightEntry({
      exerciseId: manualWeightExerciseId,
      weight,
      sets: pe.targetSets,
      reps: pe.targetReps,
      score: 80,
      date: new Date().toLocaleDateString('tr-TR'),
      timestamp: Date.now(),
    });

    setShowManualWeightModal(false);
    await loadPrograms(activeProgramId);
    Alert.alert('Başarılı', 'Ağırlık başarıyla kaydedildi.');
  };

  const activeProgram = programs.find(p => p.id === activeProgramId);
  
  const availableExercises = EXERCISES.filter(
    (e) => !activeProgram?.exercises.some((pe) => pe.exerciseId === e.id) && (addModalCategory === 'all' || e.category === addModalCategory)
  );

  const renderWeightBadge = (exerciseId: string) => {
    const lastWeight = lastWeights[exerciseId];
    const suggestion = suggestions[exerciseId];

    if (!lastWeight) {
      return (
        <View style={styles.weightBadgeEmpty}>
          <Text style={styles.weightBadgeEmptyText}>Henüz kayıt yok</Text>
        </View>
      );
    }

    return (
      <View style={styles.weightInfo}>
        <View style={[
          styles.weightBadge,
          suggestion?.shouldIncrease && styles.weightBadgeIncrease,
        ]}>
          <Text style={styles.weightValue}>{lastWeight.weight}</Text>
          <Text style={styles.weightUnit}>kg</Text>
        </View>
        {suggestion?.shouldIncrease && (
          <View style={styles.suggestionBadge}>
            <Text style={styles.suggestionText}>↑ {suggestion.suggestedWeight}kg</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER & PROGRAM SELECTOR */}
      <View style={styles.header}>
        <Text style={styles.title}>Programlarım</Text>
      </View>

      <View style={styles.programSelectorContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.programSelectorScroll}
        >
          <TouchableOpacity
            onPress={() => setActiveProgramId('templates')}
            activeOpacity={0.7}
            style={[
              styles.programChip,
              activeProgramId === 'templates' && styles.programChipActive
            ]}
          >
            <Text style={[
              styles.programChipText,
              activeProgramId === 'templates' && styles.programChipTextActive
            ]}>
              🌟 Keşfet
            </Text>
          </TouchableOpacity>

          {programs.map((prog) => (
            <TouchableOpacity
              key={prog.id}
              onPress={() => setActiveProgramId(prog.id)}
              onLongPress={() => handleDeleteProgram(prog.id, prog.name)}
              activeOpacity={0.7}
              style={[
                styles.programChip,
                activeProgramId === prog.id && styles.programChipActive
              ]}
            >
              <Text style={[
                styles.programChipText,
                activeProgramId === prog.id && styles.programChipTextActive
              ]}>
                {prog.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setShowNewProgramModal(true)}
            activeOpacity={0.7}
            style={styles.addProgramChip}
          >
            <Text style={styles.addProgramChipText}>+ Yeni Program</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeProgramId === 'templates' ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚀</Text>
            <Text style={styles.emptyTitle}>Program Önerileri</Text>
            <Text style={styles.emptySubtext}>
              Aşağıdaki hazır şablonlardan birini seçerek antrenmanlarınıza anında başlayın. Seçtiğiniz program yeni bir sekme olarak yukarıya eklenecektir.
            </Text>

            <TouchableOpacity onPress={handleSeedPushPull} activeOpacity={0.7} style={{ width: '100%', marginTop: Spacing.xl }}>
              <LinearGradient colors={Colors.gradientCyan} style={styles.templateButton}>
                <Text style={styles.templateIcon}>💪</Text>
                <View>
                  <Text style={styles.templateTitle}>İtiş & Çekiş Paketi</Text>
                  <Text style={styles.templateSub}>Klasik vücut geliştirme (Push/Pull)</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSeedPilates} activeOpacity={0.7} style={{ width: '100%', marginTop: Spacing.md }}>
              <View style={[styles.templateButton, { backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.bgGlassBorder }]}>
                <Text style={styles.templateIcon}>🧘</Text>
                <View>
                  <Text style={[styles.templateTitle, { color: Colors.textPrimary }]}>Pilates & Ev Paketi</Text>
                  <Text style={styles.templateSub}>Aletsiz vücut ağırlığı ve core</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSeedFullBody} activeOpacity={0.7} style={{ width: '100%', marginTop: Spacing.md }}>
              <View style={[styles.templateButton, { backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.bgGlassBorder }]}>
                <Text style={styles.templateIcon}>🔥</Text>
                <View>
                  <Text style={[styles.templateTitle, { color: Colors.textPrimary }]}>Tüm Vücut (Temel)</Text>
                  <Text style={styles.templateSub}>Tüm kas grupları için temel hareketler</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSeedCore} activeOpacity={0.7} style={{ width: '100%', marginTop: Spacing.md }}>
              <View style={[styles.templateButton, { backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.bgGlassBorder }]}>
                <Text style={styles.templateIcon}>🛡️</Text>
                <View>
                  <Text style={[styles.templateTitle, { color: Colors.textPrimary }]}>Sıkı Karın (Core)</Text>
                  <Text style={styles.templateSub}>Sadece karın ve merkez bölgesi</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : activeProgram ? (
          <>
            <View style={styles.activeProgramHeader}>
              <View>
                <Text style={styles.activeProgramTitle}>{activeProgram.name}</Text>
                <Text style={styles.subtitle}>
                  {activeProgram.exercises.length} egzersiz
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={styles.addButton}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>+ Egzersiz Ekle</Text>
              </TouchableOpacity>
            </View>

            {activeProgram.exercises.length > 0 ? (
              Object.entries(
                activeProgram.exercises.reduce((acc, pe) => {
                  const day = pe.day || 'Diğer';
                  if (!acc[day]) acc[day] = [];
                  acc[day].push(pe);
                  return acc;
                }, {} as Record<string, ProgramExercise[]>)
              ).map(([dayName, exercisesInDay]) => (
                <View key={dayName} style={styles.dayGroup}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{dayName}</Text>
                    <Text style={styles.daySubtitle}>{exercisesInDay.length} Egzersiz</Text>
                  </View>
                  {exercisesInDay.map((pe, index) => {
                    const exercise = EXERCISES.find((e) => e.id === pe.exerciseId);
                    if (!exercise) return null;

                    const suggestion = suggestions[pe.exerciseId];

                    return (
                      <View key={pe.exerciseId} style={styles.programCard}>
                        <View style={styles.orderBadge}>
                          <Text style={styles.orderText}>{index + 1}</Text>
                        </View>
                        <View style={styles.cardContent}>
                          <View style={styles.cardTopRow}>
                            <View style={styles.exerciseInfo}>
                              <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
                              <View style={styles.exerciseTexts}>
                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                <Text style={styles.exerciseMeta}>
                                  {pe.targetSets}×{pe.targetReps} · {exercise.muscleGroups.slice(0, 2).join(' · ')}
                                </Text>
                              </View>
                            </View>
                            {renderWeightBadge(pe.exerciseId)}
                          </View>
                          {suggestion && (
                            <View style={[
                              styles.suggestionRow,
                              suggestion.shouldIncrease
                                ? styles.suggestionRowIncrease
                                : styles.suggestionRowMaintain,
                            ]}>
                              <Text style={styles.suggestionIcon}>
                                {suggestion.shouldIncrease ? '🚀' : '💪'}
                              </Text>
                              <Text style={[
                                styles.suggestionMessage,
                                suggestion.shouldIncrease && styles.suggestionMessageIncrease,
                              ]}>
                                {suggestion.messageTr}
                              </Text>
                            </View>
                          )}
                          <View style={styles.actionRow}>
                            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                              <TouchableOpacity onPress={() => handleStartExercise(pe)} activeOpacity={0.7}>
                                <LinearGradient
                                  colors={Colors.gradientCyan}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.startButton}
                                >
                                  <Text style={styles.startButtonText}>Başla ▶</Text>
                                </LinearGradient>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleOpenManualWeight(pe)}
                                activeOpacity={0.7}
                                style={[styles.startButton, { backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.bgGlassBorder }]}
                              >
                                <Text style={[styles.startButtonText, { color: Colors.textPrimary }]}>Ağırlık Gir</Text>
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => handleRemoveExercise(pe.exerciseId)} style={styles.removeButton} activeOpacity={0.6}>
                              <Text style={styles.removeButtonText}>🗑</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>Bu program boş</Text>
                <Text style={styles.emptySubtext}>
                  "Egzersiz Ekle" butonuna basarak bu programa hareket ekleyebilirsiniz. Veya silebilirsiniz (Uzun Basın).
                </Text>
              </View>
            )}
          </>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* New Program Modal */}
      <Modal visible={showNewProgramModal} transparent animationType="fade">
        <View style={styles.weightModalOverlay}>
          <View style={styles.weightModalContent}>
            <Text style={styles.weightModalTitle}>Yeni Program</Text>
            <Text style={styles.weightModalSubtitle}>Programınıza bir isim verin.</Text>
            <TextInput
              style={styles.weightInput}
              value={newProgramName}
              onChangeText={setNewProgramName}
              placeholder="Örn: Evde Bacak, Pazartesi Göğüs..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.weightModalActions}>
              <TouchableOpacity onPress={() => setShowNewProgramModal(false)} style={styles.weightModalButtonCancel}>
                <Text style={styles.weightModalButtonCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateNewProgram} style={styles.weightModalButtonSubmit}>
                <Text style={styles.weightModalButtonSubmitText}>Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Egzersiz Ekle</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryScrollContent}>
            {['all', 'lower_body', 'upper_body', 'core', 'full_body', 'pilates'].map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, addModalCategory === cat && styles.categoryTabActive]}
                onPress={() => setAddModalCategory(cat)}
              >
                <Text style={[styles.categoryTabText, addModalCategory === cat && styles.categoryTabTextActive]}>
                  {cat === 'all' ? 'Tümü' : cat === 'lower_body' ? 'Alt Vücut' : cat === 'upper_body' ? 'Üst Vücut' : cat === 'core' ? 'Karın' : cat === 'full_body' ? 'Tüm Vücut' : 'Pilates'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {availableExercises.map((exercise) => (
              <TouchableOpacity key={exercise.id} onPress={() => handleAddExercise(exercise)} activeOpacity={0.7} style={styles.modalExerciseCard}>
                <View style={styles.modalExerciseLeft}>
                  <Text style={styles.modalExerciseIcon}>{exercise.icon}</Text>
                </View>
                <View style={styles.modalExerciseInfo}>
                  <Text style={styles.modalExerciseName}>{exercise.name}</Text>
                  <Text style={styles.modalExerciseDesc} numberOfLines={1}>{exercise.descriptionTr}</Text>
                  <View style={styles.modalExerciseTags}>
                    <View style={[styles.modalDiffBadge, { backgroundColor: exercise.difficulty === 'beginner' ? Colors.neonGreenDim : exercise.difficulty === 'intermediate' ? 'rgba(255, 229, 0, 0.15)' : Colors.neonRedDim }]}>
                      <Text style={[styles.modalDiffText, { color: exercise.difficulty === 'beginner' ? Colors.neonGreen : exercise.difficulty === 'intermediate' ? Colors.neonYellow : Colors.neonRed }]}>
                        {exercise.difficulty === 'beginner' ? 'Başlangıç' : exercise.difficulty === 'intermediate' ? 'Orta' : 'İleri'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.modalAddIcon}>+</Text>
              </TouchableOpacity>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Manual Weight Modal */}
      <Modal visible={showManualWeightModal} transparent animationType="fade">
        <View style={styles.weightModalOverlay}>
          <View style={styles.weightModalContent}>
            <Text style={styles.weightModalTitle}>Ağırlık Kaydet</Text>
            {manualWeightLast ? (
              <Text style={styles.weightModalSubtitle}>
                Geçen seferki ağırlık: <Text style={{ color: Colors.neonGreen, fontWeight: 'bold' }}>{manualWeightLast.weight} kg</Text>
              </Text>
            ) : (
              <Text style={styles.weightModalSubtitle}>Bu egzersiz için henüz bir kayıt yok.</Text>
            )}
            <TextInput
              style={styles.weightInput}
              keyboardType="decimal-pad"
              value={manualWeightInput}
              onChangeText={setManualWeightInput}
              placeholder="Yeni Ağırlık (kg)"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.weightModalActions}>
              <TouchableOpacity onPress={() => setShowManualWeightModal(false)} style={styles.weightModalButtonCancel}>
                <Text style={styles.weightModalButtonCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleManualWeightSubmit} style={styles.weightModalButtonSubmit}>
                <Text style={styles.weightModalButtonSubmitText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.title, fontWeight: FontWeight.black, color: Colors.textPrimary, letterSpacing: -1 },
  subtitle: { fontSize: FontSize.md, color: Colors.textTertiary, marginTop: Spacing.xs },
  
  programSelectorContainer: { height: 60, marginBottom: Spacing.md },
  programSelectorScroll: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, alignItems: 'center' },
  programChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.round, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgGlassBorder },
  programChipActive: { backgroundColor: Colors.neonCyanDim, borderColor: Colors.neonCyan },
  programChipText: { fontSize: FontSize.md, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  programChipTextActive: { color: Colors.neonCyan, fontWeight: FontWeight.semibold },
  addProgramChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.round, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.bgGlassBorder, borderStyle: 'dashed' },
  addProgramChipText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  activeProgramHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  activeProgramTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addButton: { backgroundColor: Colors.neonCyanDim, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.round, borderWidth: 1, borderColor: Colors.neonCyan },
  addButtonText: { color: Colors.neonCyan, fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  dayGroup: { marginBottom: Spacing.xl },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.md, paddingHorizontal: Spacing.xs },
  dayTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.neonCyan },
  daySubtitle: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  
  programCard: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.bgGlassBorder, overflow: 'hidden' },
  orderBadge: { width: 36, backgroundColor: Colors.bgTertiary, alignItems: 'center', justifyContent: 'center' },
  orderText: { fontSize: FontSize.lg, fontWeight: FontWeight.black, color: Colors.textMuted },
  cardContent: { flex: 1, padding: Spacing.md },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  exerciseInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  exerciseIcon: { fontSize: 28, marginRight: Spacing.sm },
  exerciseTexts: { flex: 1 },
  exerciseName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  exerciseMeta: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 1 },
  
  weightInfo: { alignItems: 'flex-end', gap: 4 },
  weightBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: Colors.bgTertiary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round, gap: 2 },
  weightBadgeIncrease: { backgroundColor: 'rgba(57, 255, 20, 0.1)', borderWidth: 1, borderColor: 'rgba(57, 255, 20, 0.3)' },
  weightValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black, color: Colors.textPrimary },
  weightUnit: { fontSize: FontSize.sm, color: Colors.textTertiary, fontWeight: FontWeight.medium },
  weightBadgeEmpty: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.round },
  weightBadgeEmptyText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  suggestionBadge: { backgroundColor: 'rgba(57, 255, 20, 0.15)', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  suggestionText: { fontSize: FontSize.xs, color: Colors.neonGreen, fontWeight: FontWeight.bold },
  
  suggestionRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  suggestionRowIncrease: { backgroundColor: 'rgba(57, 255, 20, 0.08)' },
  suggestionRowMaintain: { backgroundColor: 'rgba(0, 245, 255, 0.08)' },
  suggestionIcon: { fontSize: 16 },
  suggestionMessage: { flex: 1, fontSize: FontSize.sm, color: Colors.neonCyan, fontWeight: FontWeight.medium },
  suggestionMessageIncrease: { color: Colors.neonGreen },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startButton: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.round },
  startButtonText: { color: Colors.bgPrimary, fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  removeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 49, 49, 0.1)', alignItems: 'center', justifyContent: 'center' },
  removeButtonText: { fontSize: 16 },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.massive || 60 },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  emptySubtext: { fontSize: FontSize.md, color: Colors.textTertiary, textAlign: 'center', maxWidth: 280, marginBottom: Spacing.xxl, lineHeight: 22 },
  
  templateButton: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.lg, gap: Spacing.md },
  templateIcon: { fontSize: 32 },
  templateTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.bgPrimary },
  templateSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },
  
  modalContainer: { flex: 1, backgroundColor: Colors.bgPrimary },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.bgGlassBorder },
  modalTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalClose: { fontSize: FontSize.xxl, color: Colors.textTertiary, padding: Spacing.sm },
  categoryScroll: { maxHeight: 54, minHeight: 54, borderBottomWidth: 1, borderBottomColor: Colors.bgGlassBorder, marginBottom: Spacing.sm },
  categoryScrollContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, alignItems: 'center', gap: Spacing.sm },
  categoryTab: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.round, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: 'transparent' },
  categoryTabActive: { backgroundColor: Colors.neonCyanDim, borderColor: Colors.neonCyan },
  categoryTabText: { color: Colors.textSecondary, fontWeight: FontWeight.medium, fontSize: FontSize.sm },
  categoryTabTextActive: { color: Colors.neonCyan, fontWeight: FontWeight.bold },
  modalScroll: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs },
  modalExerciseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.bgGlassBorder },
  modalExerciseLeft: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: Colors.bgTertiary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  modalExerciseIcon: { fontSize: 24 },
  modalExerciseInfo: { flex: 1 },
  modalExerciseName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalExerciseDesc: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 1 },
  modalExerciseTags: { flexDirection: 'row', marginTop: Spacing.xs },
  modalDiffBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  modalDiffText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  modalAddIcon: { fontSize: FontSize.xxl, color: Colors.neonCyan },

  weightModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  weightModalContent: { width: '100%', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.bgGlassBorder },
  weightModalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  weightModalSubtitle: { fontSize: FontSize.sm, color: Colors.textTertiary, marginBottom: Spacing.lg },
  weightInput: { backgroundColor: Colors.bgPrimary, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.lg, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.bgGlassBorder, marginBottom: Spacing.xl },
  weightModalActions: { flexDirection: 'row', gap: Spacing.md },
  weightModalButtonCancel: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.bgTertiary, alignItems: 'center' },
  weightModalButtonCancelText: { color: Colors.textPrimary, fontWeight: FontWeight.bold, fontSize: FontSize.md },
  weightModalButtonSubmit: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.neonCyan, alignItems: 'center' },
  weightModalButtonSubmitText: { color: Colors.bgPrimary, fontWeight: FontWeight.bold, fontSize: FontSize.md },
});
