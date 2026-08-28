import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useExerciseStore } from './store/useExerciseStore';

type Exercise = { id: string; category: string; title: string; detail: string; duration: string };

const exercises: Exercise[] = [
  { id: 'hip-mobility', category: '股関節 / モビリティ', title: '座位で股関節をひらく', detail: '呼吸を止めず、痛みのない範囲でゆっくり行います。', duration: '左右 10回' },
  { id: 'calf-raise', category: '下腿 / 筋力', title: '立位カーフレイズ', detail: '壁に手を添え、かかとの上げ下げを一定のリズムで。', duration: '2セット' },
];

export default function App() {
  const completedIds = useExerciseStore((state) => state.completedIds);
  const completeExercise = useExerciseStore((state) => state.completeExercise);
  const painLevel = useExerciseStore((state) => state.painLevel);
  const setPainLevel = useExerciseStore((state) => state.setPainLevel);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>HOME EXERCISE</Text><Text style={styles.title}>今日の処方</Text></View>
          <View style={styles.dateBadge}><Text style={styles.dateNumber}>12</Text><Text style={styles.dateLabel}>JUN</Text></View>
        </View>
        <View style={styles.progressPanel}>
          <View style={styles.progressCopy}><Text style={styles.progressLabel}>TODAY'S FOCUS</Text><Text style={styles.progressTitle}>無理なく、丁寧に。</Text><Text style={styles.progressDescription}>全3メニュー / 目安 12分</Text></View>
          <View style={styles.progressCircle}><Text style={styles.progressValue}>{completedIds.length}/3</Text><Text style={styles.progressUnit}>完了</Text></View>
        </View>
        <Text style={styles.sectionTitle}>あなたのメニュー</Text>
        {exercises.map((exercise, index) => {
          const isCompleted = completedIds.includes(exercise.id);
          const isSelected = selectedExercise === exercise.id;
          return (
            <View key={exercise.id} style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}>
              <View style={styles.exerciseTopline}><Text style={styles.exerciseIndex}>0{index + 1}</Text><Text style={styles.category}>{exercise.category}</Text>{isCompleted && <Text style={styles.completed}>完了</Text>}</View>
              <Text style={styles.exerciseTitle}>{exercise.title}</Text><Text style={styles.exerciseDetail}>{exercise.detail}</Text>
              <View style={styles.exerciseFooter}><Text style={styles.duration}>{exercise.duration}</Text><Pressable accessibilityRole="button" onPress={() => completeExercise(exercise.id)} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}><Text style={styles.actionText}>{isCompleted ? '記録済み' : '実施を記録'}</Text></Pressable></View>
              <Pressable onPress={() => setSelectedExercise(isSelected ? null : exercise.id)}><Text style={styles.detailLink}>{isSelected ? '説明を閉じる' : '詳しい動きを見る'}</Text></Pressable>
            </View>
          );
        })}
        <View style={styles.checkinPanel}><Text style={styles.sectionEyebrow}>AFTER EXERCISE</Text><Text style={styles.checkinTitle}>今の痛みはどのくらい？</Text><Text style={styles.checkinDescription}>今日の状態を記録して、次回の提案に反映します。</Text>
          <View style={styles.painRow}>{[0, 2, 4, 6, 8, 10].map((level) => <Pressable key={level} onPress={() => setPainLevel(level)} style={[styles.painButton, painLevel === level && styles.painButtonSelected]}><Text style={[styles.painText, painLevel === level && styles.painTextSelected]}>{level}</Text></Pressable>)}</View>
          <Text style={styles.scaleLabel}>痛みなし                                                     強い痛み</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5F0' }, content: { padding: 24, paddingBottom: 48 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }, eyebrow: { color: '#7A8378', fontSize: 11, fontWeight: '700', letterSpacing: 1.6 }, title: { color: '#21332C', fontSize: 32, fontWeight: '700', marginTop: 5 }, dateBadge: { backgroundColor: '#D8E4D6', width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' }, dateNumber: { color: '#21332C', fontSize: 20, fontWeight: '700' }, dateLabel: { color: '#607060', fontSize: 9, fontWeight: '700', letterSpacing: 1 }, progressPanel: { backgroundColor: '#21332C', borderRadius: 18, padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }, progressCopy: { flex: 1 }, progressLabel: { color: '#B8C8B9', fontSize: 10, fontWeight: '700', letterSpacing: 1.3 }, progressTitle: { color: '#FFFDF8', fontSize: 23, fontWeight: '700', marginTop: 10 }, progressDescription: { color: '#D0D8CE', fontSize: 13, marginTop: 8 }, progressCircle: { width: 76, height: 76, borderRadius: 38, borderWidth: 5, borderColor: '#D6A76C', alignItems: 'center', justifyContent: 'center', marginLeft: 12 }, progressValue: { color: '#FFFDF8', fontSize: 19, fontWeight: '700' }, progressUnit: { color: '#D0D8CE', fontSize: 10, marginTop: 2 }, sectionTitle: { color: '#21332C', fontSize: 20, fontWeight: '700', marginBottom: 14 }, exerciseCard: { backgroundColor: '#FFFDF8', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E7E2D8' }, exerciseCardSelected: { borderColor: '#A3B89E' }, exerciseTopline: { flexDirection: 'row', alignItems: 'center' }, exerciseIndex: { color: '#D6A76C', fontSize: 14, fontWeight: '800', marginRight: 10 }, category: { color: '#7A8378', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }, completed: { color: '#56825D', fontSize: 11, fontWeight: '700', marginLeft: 'auto' }, exerciseTitle: { color: '#21332C', fontSize: 19, fontWeight: '700', marginTop: 12 }, exerciseDetail: { color: '#66716A', fontSize: 13, lineHeight: 20, marginTop: 7 }, exerciseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }, duration: { color: '#21332C', fontSize: 13, fontWeight: '700' }, actionButton: { backgroundColor: '#D8E4D6', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10 }, pressed: { opacity: 0.7 }, actionText: { color: '#35513B', fontSize: 12, fontWeight: '700' }, detailLink: { color: '#8A6B43', fontSize: 12, fontWeight: '700', marginTop: 16 }, checkinPanel: { backgroundColor: '#E9DED0', borderRadius: 16, padding: 20, marginTop: 16 }, sectionEyebrow: { color: '#8A6B43', fontSize: 10, fontWeight: '700', letterSpacing: 1.3 }, checkinTitle: { color: '#3A332A', fontSize: 19, fontWeight: '700', marginTop: 9 }, checkinDescription: { color: '#71675A', fontSize: 12, lineHeight: 18, marginTop: 7 }, painRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }, painButton: { width: 37, height: 37, borderRadius: 19, backgroundColor: '#F7F1EA', alignItems: 'center', justifyContent: 'center' }, painButtonSelected: { backgroundColor: '#3A332A' }, painText: { color: '#71675A', fontSize: 12, fontWeight: '700' }, painTextSelected: { color: '#FFFDF8' }, scaleLabel: { color: '#8B8174', fontSize: 9, marginTop: 8 },
});
