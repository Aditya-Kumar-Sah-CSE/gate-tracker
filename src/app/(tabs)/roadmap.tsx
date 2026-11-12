import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Switch
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../stores/appStore';
import {
  getSubjectProgressSummaries,
  getTopicsForSubject,
  getLecturesForTopic,
  updateLecture,
  updateSubjectCounts,
  addCustomTopic
} from '../../db/database';
import { Badge } from '../../components/Badge';
import { SubjectProgressSummary, Topic, Lecture, DifficultyLevel } from '../../types';

export default function RoadmapScreen() {
  const { dataVersion, triggerRefresh } = useAppStore();
  const [summaries, setSummaries] = useState<SubjectProgressSummary[]>([]);
  const [expandedSubjId, setExpandedSubjId] = useState<string | null>('ga');
  const [subjTopics, setSubjTopics] = useState<Record<string, Topic[]>>({});
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [topicLectures, setTopicLectures] = useState<Record<string, Lecture[]>>({});

  // Edit Subject Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSubj, setEditingSubj] = useState<SubjectProgressSummary | null>(null);
  const [editTotalLec, setEditTotalLec] = useState('');
  const [editIsEstimated, setEditIsEstimated] = useState(false);
  const [editTotalDpps, setEditTotalDpps] = useState('');

  // Add Custom Topic Modal
  const [addTopicModalVisible, setAddTopicModalVisible] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicLecCount, setNewTopicLecCount] = useState('4');
  const [newTopicDiff, setNewTopicDiff] = useState<DifficultyLevel>('Medium');

  const loadData = async () => {
    try {
      const data = await getSubjectProgressSummaries();
      setSummaries(data);

      if (expandedSubjId) {
        const topics = await getTopicsForSubject(expandedSubjId);
        setSubjTopics((prev) => ({ ...prev, [expandedSubjId]: topics }));
      }
    } catch (e) {
      console.error('Error loading roadmap:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [dataVersion, expandedSubjId])
  );

  const toggleExpandSubject = async (subjId: string) => {
    if (expandedSubjId === subjId) {
      setExpandedSubjId(null);
    } else {
      setExpandedSubjId(subjId);
      const topics = await getTopicsForSubject(subjId);
      setSubjTopics((prev) => ({ ...prev, [subjId]: topics }));
    }
  };

  const toggleExpandTopic = async (topicId: string) => {
    if (expandedTopicId === topicId) {
      setExpandedTopicId(null);
    } else {
      setExpandedTopicId(topicId);
      const lecs = await getLecturesForTopic(topicId);
      setTopicLectures((prev) => ({ ...prev, [topicId]: lecs }));
    }
  };

  const handleToggleLecture = async (lecture: Lecture) => {
    const nextVal = lecture.is_completed === 1 ? 0 : 1;
    await updateLecture(lecture.id, { is_completed: nextVal });
    if (lecture.topic_id) {
      const lecs = await getLecturesForTopic(lecture.topic_id);
      setTopicLectures((prev) => ({ ...prev, [lecture.topic_id!]: lecs }));
    }
    triggerRefresh();
    await loadData();
  };

  const openEditModal = (summary: SubjectProgressSummary) => {
    setEditingSubj(summary);
    setEditTotalLec(summary.total_lectures.toString());
    setEditIsEstimated(summary.is_lecture_count_estimated);
    setEditTotalDpps(summary.total_dpps !== null ? summary.total_dpps.toString() : '');
    setEditModalVisible(true);
  };

  const saveSubjectCounts = async () => {
    if (!editingSubj) return;
    const lecs = parseInt(editTotalLec, 10) || editingSubj.total_lectures;
    const dpps = editTotalDpps.trim() === '' ? null : parseInt(editTotalDpps, 10);

    await updateSubjectCounts(
      editingSubj.subject.id,
      lecs,
      editIsEstimated,
      isNaN(dpps as number) ? null : dpps
    );

    setEditModalVisible(false);
    triggerRefresh();
    await loadData();
    Alert.alert('Updated', 'Subject lecture & DPP counts updated.');
  };

  const handleCreateTopic = async () => {
    if (!expandedSubjId || !newTopicName.trim()) {
      Alert.alert('Error', 'Please enter a valid topic title.');
      return;
    }

    const count = parseInt(newTopicLecCount, 10) || 3;
    await addCustomTopic(expandedSubjId, newTopicName.trim(), ['Subtopic 1'], count, newTopicDiff);
    setAddTopicModalVisible(false);
    setNewTopicName('');
    const updated = await getTopicsForSubject(expandedSubjId);
    setSubjTopics((prev) => ({ ...prev, [expandedSubjId]: updated }));
    triggerRefresh();
    await loadData();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <Badge label="PARAKRAM GATE 2027 BATCH B" variant="primary" />
          </View>
          <Text style={styles.screenTitle}>12-Week Syllabus Roadmap</Text>
          <Text style={styles.screenSubtitle}>
            Full curriculum breakdown with confirmed vs estimated PW counts
          </Text>
        </View>

        {summaries.map((item, idx) => {
          const isExpanded = expandedSubjId === item.subject.id;
          const topics = subjTopics[item.subject.id] || [];

          return (
            <View key={item.subject.id} style={styles.subjectCard}>
              <TouchableOpacity
                style={styles.subjectCardHeader}
                activeOpacity={0.8}
                onPress={() => toggleExpandSubject(item.subject.id)}
              >
                <View style={styles.subjectTopRow}>
                  <View style={styles.subjCodeBadge}>
                    <Text style={styles.subjCodeText}>{item.subject.code}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.subjName}>{item.subject.name}</Text>
                    <Text style={styles.weekTag}>Week {item.subject.target_week || idx + 1}</Text>
                  </View>

                  <View style={styles.badgesCol}>
                    {item.is_lecture_count_estimated ? (
                      <Badge label="ESTIMATED" variant="estimated" size="sm" />
                    ) : (
                      <Badge label="CONFIRMED" variant="success" size="sm" />
                    )}
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progBarBg}>
                  <View
                    style={[
                      styles.progBarFill,
                      {
                        width: `${item.completion_percentage}%`,
                        backgroundColor: item.subject.color || '#38BDF8'
                      }
                    ]}
                  />
                </View>

                {/* Metrics Summary Row */}
                <View style={styles.metricsRow}>
                  <Text style={styles.metricItem}>
                    <Text style={styles.metricBold}>{item.completed_lectures}</Text>/
                    {item.total_lectures} Lec
                  </Text>
                  <Text style={styles.metricItem}>
                    DPP:{' '}
                    <Text style={styles.metricBold}>
                      {item.completed_dpps}/{item.total_dpps !== null ? item.total_dpps : 'Unset'}
                    </Text>
                  </Text>
                  <Text style={styles.metricItem}>
                    PYQ:{' '}
                    <Text style={styles.metricBold}>
                      {item.pyq_accuracy !== null ? `${item.pyq_accuracy}%` : 'Not Started'}
                    </Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditModal(item)}
                  >
                    <Ionicons name="create-outline" size={14} color="#38BDF8" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Expanded Topics List */}
              {isExpanded && (
                <View style={styles.topicsContainer}>
                  <View style={styles.topicHeaderRow}>
                    <Text style={styles.topicListHeader}>Topics & PW Lectures</Text>
                    <TouchableOpacity
                      style={styles.addTopicBtn}
                      onPress={() => setAddTopicModalVisible(true)}
                    >
                      <Ionicons name="add" size={14} color="#38BDF8" />
                      <Text style={styles.addTopicText}>Add Topic</Text>
                    </TouchableOpacity>
                  </View>

                  {topics.map((t) => {
                    const isTopicExpanded = expandedTopicId === t.id;
                    const lecs = topicLectures[t.id] || [];

                    return (
                      <View key={t.id} style={styles.topicCard}>
                        <TouchableOpacity
                          style={styles.topicHeader}
                          activeOpacity={0.7}
                          onPress={() => toggleExpandTopic(t.id)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.topicTitle}>{t.name}</Text>
                            <Text style={styles.topicSub}>{t.subtopics.join(' • ')}</Text>
                          </View>

                          <View style={styles.topicRight}>
                            <Badge label={t.difficulty_level} variant="neutral" size="sm" />
                            <Ionicons
                              name={isTopicExpanded ? 'chevron-up' : 'chevron-down'}
                              size={16}
                              color="#64748B"
                            />
                          </View>
                        </TouchableOpacity>

                        {/* Lecture list inside topic */}
                        {isTopicExpanded && (
                          <View style={styles.lecturesList}>
                            {lecs.length === 0 ? (
                              <Text style={styles.noLecText}>
                                No lectures generated yet for this topic.
                              </Text>
                            ) : (
                              lecs.map((l) => (
                                <TouchableOpacity
                                  key={l.id}
                                  style={[
                                    styles.lectureItem,
                                    l.is_completed === 1 && styles.lectureItemDone
                                  ]}
                                  onPress={() => handleToggleLecture(l)}
                                >
                                  <Ionicons
                                    name={l.is_completed === 1 ? 'checkbox' : 'square-outline'}
                                    size={18}
                                    color={l.is_completed === 1 ? '#10B981' : '#64748B'}
                                  />
                                  <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text
                                      style={[
                                        styles.lectureTitle,
                                        l.is_completed === 1 && styles.lectureTitleDone
                                      ]}
                                    >
                                      L{l.lecture_num}: {l.title}
                                    </Text>
                                    <Text style={styles.lectureDuration}>
                                      {l.duration_minutes} mins
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              ))
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Subject Counts Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit Counts: {editingSubj?.subject.name}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total Lectures</Text>
              <TextInput
                style={styles.input}
                value={editTotalLec}
                onChangeText={setEditTotalLec}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Mark Count as Estimated?</Text>
              <Switch
                value={editIsEstimated}
                onValueChange={setEditIsEstimated}
                trackColor={{ false: '#232A3B', true: '#38BDF8' }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Total DPP Count (Leave blank if unset)</Text>
              <TextInput
                style={styles.input}
                value={editTotalDpps}
                onChangeText={setEditTotalDpps}
                placeholder="Leave empty if unknown"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveSubjectCounts}>
              <Text style={styles.saveBtnText}>Save Subject Counts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Custom Topic Modal */}
      <Modal
        visible={addTopicModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddTopicModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Topic</Text>
              <TouchableOpacity onPress={() => setAddTopicModalVisible(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Topic Title</Text>
              <TextInput
                style={styles.input}
                value={newTopicName}
                onChangeText={setNewTopicName}
                placeholder="e.g. Advanced Graph Traversals"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Estimated Lecture Count</Text>
              <TextInput
                style={styles.input}
                value={newTopicLecCount}
                onChangeText={setNewTopicLecCount}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreateTopic}>
              <Text style={styles.saveBtnText}>Create Topic & Lectures</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0C10',
  },
  container: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  badgeRow: {
    marginBottom: 6,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  subjectCard: {
    backgroundColor: '#131720',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232A3B',
    marginBottom: 12,
    overflow: 'hidden',
  },
  subjectCardHeader: {
    padding: 14,
  },
  subjectTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subjCodeBadge: {
    backgroundColor: '#1E2536',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  subjName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  weekTag: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  badgesCol: {
    alignItems: 'flex-end',
  },
  progBarBg: {
    height: 4,
    backgroundColor: '#1E2536',
    borderRadius: 2,
    marginTop: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metricBold: {
    fontWeight: '700',
    color: '#F8FAFC',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38BDF8',
  },
  topicsContainer: {
    backgroundColor: '#0E1118',
    borderTopWidth: 1,
    borderColor: '#1E2536',
    padding: 12,
  },
  topicHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topicListHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addTopicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addTopicText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },
  topicCard: {
    backgroundColor: '#131720',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#232A3B',
    marginBottom: 8,
    overflow: 'hidden',
  },
  topicHeader: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  topicSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  topicRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lecturesList: {
    borderTopWidth: 1,
    borderColor: '#1E2536',
    padding: 10,
    backgroundColor: '#0D1017',
  },
  noLecText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  lectureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#1A212E',
  },
  lectureItemDone: {
    opacity: 0.5,
  },
  lectureTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  lectureTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  lectureDuration: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#131720',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#232A3B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#171C28',
    borderWidth: 1,
    borderColor: '#232A3B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F8FAFC',
  },
  saveBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A0C10',
  },
});

