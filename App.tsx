import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type RegistrationFields = {
  birthDate: string;
  email: string;
  emailConfirmation: string;
  fullName: string;
  fullNameKana: string;
  height: string;
  password: string;
  passwordConfirmation: string;
  weight: string;
};

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [screen, setScreen] = useState<'login' | 'signUp'>('login');
  const [registration, setRegistration] = useState<RegistrationFields>({
    birthDate: '', email: '', emailConfirmation: '', fullName: '', fullNameKana: '', height: '', password: '', passwordConfirmation: '', weight: '',
  });
  const [gender, setGender] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password) {
      setMessage('メールアドレスとパスワードを入力してください。');
      return;
    }

    setMessage('ログイン機能は準備中です。');
  };

  const updateRegistration = (field: keyof RegistrationFields, value: string) => {
    setRegistration((current) => ({ ...current, [field]: value }));
  };

  const handleRegistration = () => {
    const hasEmptyField = Object.values(registration).some((value) => !value.trim());
    if (hasEmptyField || !gender) {
      setMessage('すべての項目を入力してください。');
      return;
    }

    if (registration.email !== registration.emailConfirmation) {
      setMessage('メールアドレスが一致しません。');
      return;
    }

    if (registration.password !== registration.passwordConfirmation) {
      setMessage('パスワードが一致しません。');
      return;
    }

    setMessage('新規登録機能は準備中です。');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoidingView}>
        {screen === 'login' ? <View style={[styles.content, styles.loginContent]}>
          <View style={styles.brandBlock}>
            <View accessible accessibilityLabel="歩く女性のイラスト" style={styles.illustration}>
              <View style={styles.illustrationSun} />
              <View style={styles.illustrationGround} />
              <View style={styles.personHead} />
              <View style={styles.personHair} />
              <View style={styles.personBody} />
              <View style={styles.personArmLeft} />
              <View style={styles.personArmRight} />
              <View style={styles.personLegLeft} />
              <View style={styles.personLegRight} />
              <View style={styles.personShoeLeft} />
              <View style={styles.personShoeRight} />
            </View>
            <Text style={styles.brand}>MyReha</Text>
            <Text style={styles.tagline}>あなたらしい毎日に、リハビリを。</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.heading}>ログイン</Text>
            <Text style={styles.description}>登録したメールアドレスでログインしてください。</Text>
            <Text style={styles.label}>メールアドレス</Text>
            <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="example@email.com" placeholderTextColor="#9AA29A" style={styles.input} value={email} />
            <Text style={styles.label}>パスワード</Text>
            <TextInput autoComplete="password" onChangeText={setPassword} placeholder="パスワードを入力" placeholderTextColor="#9AA29A" secureTextEntry style={styles.input} value={password} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            <Pressable accessibilityRole="button" onPress={handleLogin} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}><Text style={styles.loginButtonText}>ログイン</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setMessage(''); setScreen('signUp'); }} style={({ pressed }) => [styles.signUpButton, pressed && styles.pressed]}><Text style={styles.signUpButtonText}>新規登録</Text></Pressable>
          </View>
        </View> : <ScrollView contentContainerStyle={styles.signUpContent} keyboardShouldPersistTaps="handled">
          <View style={styles.signUpHeader}>
            <Pressable accessibilityRole="button" onPress={() => { setMessage(''); setScreen('login'); }}><Text style={styles.backLink}>ログインへ戻る</Text></Pressable>
            <Text style={styles.signUpBrand}>MyReha</Text>
          </View>
          <Text style={styles.heading}>新規登録</Text>
          <Text style={styles.description}>プロフィールを入力してください。</Text>
          <Text style={styles.label}>氏名</Text>
          <TextInput autoComplete="name" onChangeText={(value) => updateRegistration('fullName', value)} placeholder="山田 花子" placeholderTextColor="#9AA29A" style={styles.input} value={registration.fullName} />
          <Text style={styles.label}>氏名カタカナ</Text>
          <TextInput onChangeText={(value) => updateRegistration('fullNameKana', value)} placeholder="ヤマダ ハナコ" placeholderTextColor="#9AA29A" style={styles.input} value={registration.fullNameKana} />
          <Text style={styles.label}>メールアドレス</Text>
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={(value) => updateRegistration('email', value)} placeholder="example@email.com" placeholderTextColor="#9AA29A" style={styles.input} value={registration.email} />
          <Text style={styles.label}>メールアドレス（再度）</Text>
          <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={(value) => updateRegistration('emailConfirmation', value)} placeholder="example@email.com" placeholderTextColor="#9AA29A" style={styles.input} value={registration.emailConfirmation} />
          <Text style={styles.label}>パスワード</Text>
          <TextInput autoComplete="new-password" onChangeText={(value) => updateRegistration('password', value)} placeholder="パスワードを入力" placeholderTextColor="#9AA29A" secureTextEntry style={styles.input} value={registration.password} />
          <Text style={styles.label}>パスワード（再度）</Text>
          <TextInput onChangeText={(value) => updateRegistration('passwordConfirmation', value)} placeholder="パスワードを再入力" placeholderTextColor="#9AA29A" secureTextEntry style={styles.input} value={registration.passwordConfirmation} />
          <Text style={styles.label}>性別</Text>
          <View style={styles.genderRow}>{['女性', '男性', '回答しない'].map((option) => <Pressable key={option} accessibilityRole="button" onPress={() => setGender(option)} style={[styles.genderButton, gender === option && styles.genderButtonSelected]}><Text style={[styles.genderButtonText, gender === option && styles.genderButtonTextSelected]}>{option}</Text></Pressable>)}</View>
          <Text style={styles.label}>体重</Text>
          <View style={styles.measurementRow}><TextInput keyboardType="decimal-pad" onChangeText={(value) => updateRegistration('weight', value)} placeholder="例: 55" placeholderTextColor="#9AA29A" style={[styles.input, styles.measurementInput]} value={registration.weight} /><Text style={styles.unit}>kg</Text></View>
          <Text style={styles.label}>身長</Text>
          <View style={styles.measurementRow}><TextInput keyboardType="decimal-pad" onChangeText={(value) => updateRegistration('height', value)} placeholder="例: 160" placeholderTextColor="#9AA29A" style={[styles.input, styles.measurementInput]} value={registration.height} /><Text style={styles.unit}>cm</Text></View>
          <Text style={styles.label}>生年月日</Text>
          <TextInput keyboardType="numbers-and-punctuation" onChangeText={(value) => updateRegistration('birthDate', value)} placeholder="例: 1990/01/01" placeholderTextColor="#9AA29A" style={styles.input} value={registration.birthDate} />
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Pressable accessibilityRole="button" onPress={handleRegistration} style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}><Text style={styles.loginButtonText}>登録する</Text></Pressable>
        </ScrollView>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5F0' }, content: { padding: 24, paddingBottom: 48 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }, eyebrow: { color: '#7A8378', fontSize: 11, fontWeight: '700', letterSpacing: 1.6 }, title: { color: '#21332C', fontSize: 32, fontWeight: '700', marginTop: 5 }, dateBadge: { backgroundColor: '#D8E4D6', width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' }, dateNumber: { color: '#21332C', fontSize: 20, fontWeight: '700' }, dateLabel: { color: '#607060', fontSize: 9, fontWeight: '700', letterSpacing: 1 }, progressPanel: { backgroundColor: '#21332C', borderRadius: 18, padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }, progressCopy: { flex: 1 }, progressLabel: { color: '#B8C8B9', fontSize: 10, fontWeight: '700', letterSpacing: 1.3 }, progressTitle: { color: '#FFFDF8', fontSize: 23, fontWeight: '700', marginTop: 10 }, progressDescription: { color: '#D0D8CE', fontSize: 13, marginTop: 8 }, progressCircle: { width: 76, height: 76, borderRadius: 38, borderWidth: 5, borderColor: '#D6A76C', alignItems: 'center', justifyContent: 'center', marginLeft: 12 }, progressValue: { color: '#FFFDF8', fontSize: 19, fontWeight: '700' }, progressUnit: { color: '#D0D8CE', fontSize: 10, marginTop: 2 }, sectionTitle: { color: '#21332C', fontSize: 20, fontWeight: '700', marginBottom: 14 }, exerciseCard: { backgroundColor: '#FFFDF8', borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#E7E2D8' }, exerciseCardSelected: { borderColor: '#A3B89E' }, exerciseTopline: { flexDirection: 'row', alignItems: 'center' }, exerciseIndex: { color: '#D6A76C', fontSize: 14, fontWeight: '800', marginRight: 10 }, category: { color: '#7A8378', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }, completed: { color: '#56825D', fontSize: 11, fontWeight: '700', marginLeft: 'auto' }, exerciseTitle: { color: '#21332C', fontSize: 19, fontWeight: '700', marginTop: 12 }, exerciseDetail: { color: '#66716A', fontSize: 13, lineHeight: 20, marginTop: 7 }, exerciseFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }, duration: { color: '#21332C', fontSize: 13, fontWeight: '700' }, actionButton: { backgroundColor: '#D8E4D6', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10 }, pressed: { opacity: 0.7 }, actionText: { color: '#35513B', fontSize: 12, fontWeight: '700' }, detailLink: { color: '#8A6B43', fontSize: 12, fontWeight: '700', marginTop: 16 }, checkinPanel: { backgroundColor: '#E9DED0', borderRadius: 16, padding: 20, marginTop: 16 }, sectionEyebrow: { color: '#8A6B43', fontSize: 10, fontWeight: '700', letterSpacing: 1.3 }, checkinTitle: { color: '#3A332A', fontSize: 19, fontWeight: '700', marginTop: 9 }, checkinDescription: { color: '#71675A', fontSize: 12, lineHeight: 18, marginTop: 7 }, painRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }, painButton: { width: 37, height: 37, borderRadius: 19, backgroundColor: '#F7F1EA', alignItems: 'center', justifyContent: 'center' }, painButtonSelected: { backgroundColor: '#3A332A' }, painText: { color: '#71675A', fontSize: 12, fontWeight: '700' }, painTextSelected: { color: '#FFFDF8' }, scaleLabel: { color: '#8B8174', fontSize: 9, marginTop: 8 },
  keyboardAvoidingView: { flex: 1 },
  loginContent: { flex: 1 },
  signUpContent: { padding: 24, paddingBottom: 48 },
  signUpHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 34 },
  backLink: { color: '#2E5A39', fontSize: 14, fontWeight: '700' },
  signUpBrand: { color: '#213C2A', fontSize: 22, fontWeight: '700' },
  brandBlock: { alignItems: 'center', marginTop: 26 },
  illustration: { height: 132, position: 'relative', width: 190 },
  illustrationSun: { backgroundColor: '#EFD9A9', borderRadius: 24, height: 48, position: 'absolute', right: 24, top: 7, width: 48 },
  illustrationGround: { backgroundColor: '#BED6BE', borderRadius: 18, bottom: 8, height: 13, position: 'absolute', width: 174 },
  personHead: { backgroundColor: '#E4A37F', borderRadius: 17, height: 34, left: 82, position: 'absolute', top: 13, width: 34, zIndex: 3 },
  personHair: { backgroundColor: '#4E3935', borderRadius: 18, height: 39, left: 78, position: 'absolute', top: 8, width: 39, zIndex: 2 },
  personBody: { backgroundColor: '#557C68', borderRadius: 14, height: 49, left: 78, position: 'absolute', top: 44, transform: [{ rotate: '4deg' }], width: 42, zIndex: 2 },
  personArmLeft: { backgroundColor: '#E4A37F', borderRadius: 8, height: 48, left: 70, position: 'absolute', top: 49, transform: [{ rotate: '36deg' }], width: 13, zIndex: 1 },
  personArmRight: { backgroundColor: '#E4A37F', borderRadius: 8, height: 49, left: 119, position: 'absolute', top: 45, transform: [{ rotate: '-38deg' }], width: 13, zIndex: 1 },
  personLegLeft: { backgroundColor: '#D98571', borderRadius: 10, height: 69, left: 79, position: 'absolute', top: 84, transform: [{ rotate: '27deg' }], width: 20, zIndex: 1 },
  personLegRight: { backgroundColor: '#D98571', borderRadius: 10, height: 68, left: 101, position: 'absolute', top: 82, transform: [{ rotate: '-27deg' }], width: 20, zIndex: 1 },
  personShoeLeft: { backgroundColor: '#355B3A', borderRadius: 7, height: 13, left: 111, position: 'absolute', top: 121, transform: [{ rotate: '8deg' }], width: 27, zIndex: 2 },
  personShoeRight: { backgroundColor: '#355B3A', borderRadius: 7, height: 13, left: 69, position: 'absolute', top: 118, transform: [{ rotate: '-8deg' }], width: 27, zIndex: 2 },
  brand: { color: '#213C2A', fontSize: 34, fontWeight: '700', letterSpacing: 0, marginTop: 16 },
  tagline: { color: '#6E786F', fontSize: 14, marginTop: 8 },
  form: { marginBottom: 22, marginTop: 'auto' },
  heading: { color: '#213C2A', fontSize: 24, fontWeight: '700', letterSpacing: 0 },
  description: { color: '#6E786F', fontSize: 13, lineHeight: 20, marginBottom: 27, marginTop: 8 },
  label: { color: '#405044', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#D8DDD5', borderRadius: 8, borderWidth: 1, color: '#213C2A', fontSize: 16, height: 52, marginBottom: 20, paddingHorizontal: 15 },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  genderButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#D8DDD5', borderRadius: 8, borderWidth: 1, flex: 1, height: 48, justifyContent: 'center' },
  genderButtonSelected: { backgroundColor: '#DDE9DB', borderColor: '#2E5A39' },
  genderButtonText: { color: '#536157', fontSize: 13, fontWeight: '700' },
  genderButtonTextSelected: { color: '#213C2A' },
  measurementRow: { alignItems: 'center', flexDirection: 'row' },
  measurementInput: { flex: 1 },
  unit: { color: '#405044', fontSize: 14, fontWeight: '700', marginBottom: 20, marginLeft: 12, width: 25 },
  message: { color: '#9A5D3F', fontSize: 13, lineHeight: 19, marginBottom: 14, marginTop: -6 },
  loginButton: { alignItems: 'center', backgroundColor: '#2E5A39', borderRadius: 8, height: 52, justifyContent: 'center', marginTop: 4 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  signUpButton: { alignItems: 'center', borderColor: '#2E5A39', borderRadius: 8, borderWidth: 1, height: 52, justifyContent: 'center', marginTop: 12 },
  signUpButtonText: { color: '#2E5A39', fontSize: 16, fontWeight: '700' },
});
