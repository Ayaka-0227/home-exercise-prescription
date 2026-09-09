import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { authRedirectUrl, supabase } from './lib/supabase';

type RegistrationFields = {
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  email: string;
  emailConfirmation: string;
  firstName: string;
  firstNameKana: string;
  lastName: string;
  lastNameKana: string;
  password: string;
  passwordConfirmation: string;
};

type DateField = 'birthYear' | 'birthMonth' | 'birthDay';

type QuestionnaireAnswers = Record<string, string>;

type QuestionnaireFieldConfig = {
  id: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  label: string;
  optional?: boolean;
  options?: readonly string[];
  placeholder?: string;
  unit?: string;
};

type QuestionnaireItem =
  | { id: string; kind: 'single'; options: readonly string[]; title: string }
  | { fields: readonly QuestionnaireFieldConfig[]; id: string; kind: 'fields'; title: string }
  | { id: string; kind: 'multiSelect'; options: readonly string[]; title: string }
  | { id: string; intensityLevels: readonly string[]; kind: 'painDetail'; parts: readonly string[]; timings: readonly string[]; title: string }
  | { id: string; kind: 'checklist'; questions: readonly string[]; title: string };

const colors = {
  main: '#78B7C5',
  mainText: '#2B3A42',
  sub: '#E6F2F5',
  subText: '#8CA1AF',
} as const;

const questionnaireItems: readonly QuestionnaireItem[] = [
  {
    id: 'basic', title: '基本情報', kind: 'fields', fields: [
      { id: 'age', label: '年齢', unit: '歳', keyboardType: 'number-pad' },
      { id: 'height', label: '身長', unit: 'cm', keyboardType: 'decimal-pad' },
      { id: 'weight', label: '体重', unit: 'kg', keyboardType: 'decimal-pad' },
      { id: 'occupation', label: '職種', placeholder: '例: 事務職' },
      { id: 'workPosture', label: '仕事中の姿勢', options: ['座り仕事が多い', '立ち仕事が多い', '身体を動かす仕事', 'その他'] },
      { id: 'sittingHours', label: '1日に座っている時間', unit: '時間', keyboardType: 'decimal-pad' },
      { id: 'dailySteps', label: '1日の歩数', optional: true, unit: '歩', keyboardType: 'number-pad' },
    ],
  },
  { id: 'medicalHistory', title: '既往歴・医療情報', kind: 'multiSelect', options: ['高血圧', '糖尿病', '心疾患', '手術歴', '特になし'] },
  { id: 'body', title: '身体の悩み', kind: 'single', options: ['肩や首の痛み', '腰や膝の痛み', '体力の低下', '特にない'] },
  {
    id: 'pain', title: '痛みについて', kind: 'painDetail',
    parts: ['首・肩', '腰', '膝', '股関節', 'その他'],
    intensityLevels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    timings: ['安静時', '動作時', '朝方', '夕方以降', '常に'],
  },
  { id: 'daily', title: '日常生活', kind: 'single', options: ['座っている時間が長い', '階段や歩行が不安', '家事や仕事で疲れやすい', '特に困っていない'] },
  { id: 'exercise', title: '運動習慣', kind: 'single', options: ['ほとんどしていない', '週に1〜2回', '週に3回以上', '毎日している'] },
  { id: 'environment', title: '運動環境', kind: 'single', options: ['自宅で運動したい', '屋外で運動できる', '施設を利用できる', '環境について相談したい'] },
  {
    id: 'safety', title: '安全確認', kind: 'checklist', questions: [
      '運動中に胸の痛みやめまいを感じたことがある',
      '医師から運動を制限されている',
      '安静時にも息切れがある',
      '骨折や関節の手術を最近受けた',
    ],
  },
  {
    id: 'physicalCheck', title: '身体機能チェック', kind: 'checklist', questions: [
      '5分以上続けて歩くことができる',
      '手すりなしで階段の昇り降りができる',
      '片足立ちで10秒以上バランスを保てる',
      'しゃがんだ姿勢から自力で立ち上がれる',
    ],
  },
  { id: 'goal', title: '目標', kind: 'single', options: ['痛みをやわらげたい', '体力をつけたい', '動きを軽くしたい', '健康を維持したい'] },
] as const;

const birthYears = Array.from({ length: 101 }, (_, index) => String(new Date().getFullYear() - index));
const birthMonths = Array.from({ length: 12 }, (_, index) => String(index + 1));
const birthDays = Array.from({ length: 31 }, (_, index) => String(index + 1));

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [screen, setScreen] = useState<'login' | 'signUp' | 'questionnaire'>('login');
  const [registration, setRegistration] = useState<RegistrationFields>({
    birthDay: '', birthMonth: '', birthYear: '', email: '', emailConfirmation: '', firstName: '', firstNameKana: '', lastName: '', lastNameKana: '', password: '', passwordConfirmation: '',
  });
  const [gender, setGender] = useState('');
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<QuestionnaireAnswers>({});
  const [selectedQuestionnaireItemId, setSelectedQuestionnaireItemId] = useState<string | null>(null);
  const [isLoginPasswordVisible, setIsLoginPasswordVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] = useState(false);
  const [activeDateField, setActiveDateField] = useState<DateField | null>(null);
  const selectedQuestionnaireItem = questionnaireItems.find((item) => item.id === selectedQuestionnaireItemId);

  const datePickerOptions: Record<DateField, readonly string[]> = {
    birthYear: birthYears,
    birthMonth: birthMonths,
    birthDay: birthDays,
  };
  const datePickerLabels: Record<DateField, string> = {
    birthYear: '年',
    birthMonth: '月',
    birthDay: '日',
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setMessage('メールアドレスとパスワードを入力してください。');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setMessage('メールアドレスの形式で入力してください。');
      return;
    }

    if (!supabase) {
      setMessage('ログインサービスの設定が完了していません。');
      return;
    }

    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });

    if (error) {
      console.error('signInWithPassword error:', error.message, error.status);
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setMessage('確認メールのリンクを開いてメールアドレスを認証してから、もう一度ログインしてください。');
        return;
      }
      setMessage('メールアドレスまたはパスワードが正しくありません。');
      return;
    }

    setScreen('questionnaire');
  };

  const setQuestionnaireAnswer = (key: string, value: string) => {
    setQuestionnaireAnswers((current) => ({ ...current, [key]: value }));
  };

  const toggleMultiSelectOption = (itemId: string, option: string) => {
    setQuestionnaireAnswers((current) => {
      const key = `${itemId}.options`;
      const currentList = current[key] ? current[key].split('|') : [];
      const nextList = currentList.includes(option) ? currentList.filter((value) => value !== option) : [...currentList, option];
      return { ...current, [key]: nextList.join('|') };
    });
  };

  const isQuestionnaireItemAnswered = (item: QuestionnaireItem): boolean => {
    switch (item.kind) {
      case 'single':
        return Boolean(questionnaireAnswers[item.id]);
      case 'fields':
        return item.fields.every((field) => field.optional || Boolean(questionnaireAnswers[`${item.id}.${field.id}`]?.trim()));
      case 'multiSelect': {
        const selected = questionnaireAnswers[`${item.id}.options`];
        const other = questionnaireAnswers[`${item.id}.other`];
        return Boolean(selected || other?.trim());
      }
      case 'painDetail':
        return Boolean(questionnaireAnswers[`${item.id}.part`] && questionnaireAnswers[`${item.id}.intensity`] && questionnaireAnswers[`${item.id}.timing`]);
      case 'checklist':
        return item.questions.every((_, index) => Boolean(questionnaireAnswers[`${item.id}.${index}`]));
      default:
        return false;
    }
  };

  const updateRegistration = (field: keyof RegistrationFields, value: string) => {
    setRegistration((current) => ({ ...current, [field]: value }));
  };

  const handleRegistration = async () => {
    const hasEmptyField = Object.values(registration).some((value) => !value.trim());
    if (hasEmptyField || !gender) {
      setMessage('すべての項目を入力してください。');
      return;
    }

    if (registration.email !== registration.emailConfirmation) {
      setMessage('メールアドレスが一致しません。');
      return;
    }

    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(registration.password)) {
      setMessage('パスワードは英大文字・英小文字・数字をそれぞれ含む8文字以上で入力してください。');
      return;
    }

    if (registration.password !== registration.passwordConfirmation) {
      setMessage('パスワードが一致しません。');
      return;
    }

    if (!supabase) {
      setMessage('登録サービスの設定が完了していません。');
      return;
    }

    setMessage('');
    const { data, error } = await supabase.auth.signUp({
      email: registration.email.trim(),
      password: registration.password,
      options: {
        emailRedirectTo: authRedirectUrl,
        data: {
          birth_date: `${registration.birthYear}-${registration.birthMonth.padStart(2, '0')}-${registration.birthDay.padStart(2, '0')}`,
          full_name: `${registration.lastName.trim()} ${registration.firstName.trim()}`,
          full_name_kana: `${registration.lastNameKana.trim()} ${registration.firstNameKana.trim()}`,
          gender,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.session) {
      setMessage('確認メールを送信しました。メールを確認してからログインしてください。');
      setScreen('login');
      return;
    }

    setScreen('questionnaire');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoidingView}>
        {screen === 'questionnaire' ? <ScrollView contentContainerStyle={styles.questionnaireContent} keyboardShouldPersistTaps="handled">
          <View style={styles.questionnaireHeader}>
            <View>
              <Text style={styles.questionnaireEyebrow}>MYREHA / PROFILE</Text>
              <Text style={styles.questionnaireTitle}>{selectedQuestionnaireItem ? selectedQuestionnaireItem.title : 'あなたのことを教えてください'}</Text>
            </View>
            <Text style={styles.questionnaireCount}>{questionnaireItems.filter(isQuestionnaireItemAnswered).length}/{questionnaireItems.length}</Text>
          </View>
          <Text style={styles.questionnaireDescription}>{selectedQuestionnaireItem ? '当てはまるものを選んでください。' : '回答したい項目を選んでください。'}</Text>
          {selectedQuestionnaireItem ? <>
            <Pressable accessibilityRole="button" onPress={() => setSelectedQuestionnaireItemId(null)} style={styles.questionnaireBackButton}>
              <Ionicons color={colors.mainText} name="chevron-back" size={18} />
              <Text style={styles.questionnaireBackButtonText}>項目一覧に戻る</Text>
            </Pressable>
            <View style={[styles.questionnaireCard, isQuestionnaireItemAnswered(selectedQuestionnaireItem) && styles.questionnaireCardAnswered]}>
              <View style={styles.questionnaireCardHeader}>
                <Text style={styles.questionnaireNumber}>QUESTION</Text>
                {isQuestionnaireItemAnswered(selectedQuestionnaireItem) ? <Text style={styles.answeredLabel}>回答済み</Text> : null}
              </View>

              {selectedQuestionnaireItem.kind === 'single' ? <View style={styles.answerList}>
                {selectedQuestionnaireItem.options.map((option) => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: questionnaireAnswers[selectedQuestionnaireItem.id] === option }} onPress={() => setQuestionnaireAnswer(selectedQuestionnaireItem.id, option)} style={[styles.answerButton, questionnaireAnswers[selectedQuestionnaireItem.id] === option && styles.answerButtonSelected]}>
                  <Text style={[styles.answerButtonText, questionnaireAnswers[selectedQuestionnaireItem.id] === option && styles.answerButtonTextSelected]}>{option}</Text>
                </Pressable>)}
              </View> : null}

              {selectedQuestionnaireItem.kind === 'fields' ? <View style={styles.fieldList}>
                {selectedQuestionnaireItem.fields.map((field) => {
                  const fieldKey = `${selectedQuestionnaireItem.id}.${field.id}`;
                  if (field.options) {
                    return <View key={field.id} style={styles.fieldBlock}>
                      <Text style={styles.questionnaireMeasurementLabel}>{field.label}</Text>
                      <View style={styles.answerList}>
                        {field.options.map((option) => <Pressable key={option} accessibilityRole="button" onPress={() => setQuestionnaireAnswer(fieldKey, option)} style={[styles.answerButton, questionnaireAnswers[fieldKey] === option && styles.answerButtonSelected]}>
                          <Text style={[styles.answerButtonText, questionnaireAnswers[fieldKey] === option && styles.answerButtonTextSelected]}>{option}</Text>
                        </Pressable>)}
                      </View>
                    </View>;
                  }
                  return <View key={field.id} style={styles.questionnaireMeasurement}>
                    <Text style={styles.questionnaireMeasurementLabel}>{field.label}{field.optional ? '（任意）' : ''}</Text>
                    <View style={styles.questionnaireMeasurementInputRow}>
                      <TextInput keyboardType={field.keyboardType ?? 'default'} onChangeText={(value) => setQuestionnaireAnswer(fieldKey, value)} placeholder={field.placeholder ?? ''} placeholderTextColor={colors.subText} style={styles.questionnaireMeasurementInput} value={questionnaireAnswers[fieldKey] ?? ''} />
                      {field.unit ? <Text style={styles.questionnaireUnit}>{field.unit}</Text> : null}
                    </View>
                  </View>;
                })}
              </View> : null}

              {selectedQuestionnaireItem.kind === 'multiSelect' ? <>
                <View style={styles.answerList}>
                  {selectedQuestionnaireItem.options.map((option) => {
                    const optionsKey = `${selectedQuestionnaireItem.id}.options`;
                    const selectedList = questionnaireAnswers[optionsKey] ? questionnaireAnswers[optionsKey].split('|') : [];
                    const isSelected = selectedList.includes(option);
                    return <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: isSelected }} onPress={() => toggleMultiSelectOption(selectedQuestionnaireItem.id, option)} style={[styles.answerButton, isSelected && styles.answerButtonSelected]}>
                      <Text style={[styles.answerButtonText, isSelected && styles.answerButtonTextSelected]}>{option}</Text>
                    </Pressable>;
                  })}
                </View>
                <View style={styles.questionnaireMeasurement}>
                  <Text style={styles.questionnaireMeasurementLabel}>その他（自由記入）</Text>
                  <TextInput onChangeText={(value) => setQuestionnaireAnswer(`${selectedQuestionnaireItem.id}.other`, value)} placeholder="該当する内容があれば入力してください" placeholderTextColor={colors.subText} style={styles.questionnaireFreeTextInput} value={questionnaireAnswers[`${selectedQuestionnaireItem.id}.other`] ?? ''} />
                </View>
              </> : null}

              {selectedQuestionnaireItem.kind === 'painDetail' ? <>
                <Text style={styles.questionnaireMeasurementLabel}>痛みの部位</Text>
                <View style={styles.answerList}>
                  {selectedQuestionnaireItem.parts.map((part) => <Pressable key={part} accessibilityRole="button" onPress={() => setQuestionnaireAnswer(`${selectedQuestionnaireItem.id}.part`, part)} style={[styles.answerButton, questionnaireAnswers[`${selectedQuestionnaireItem.id}.part`] === part && styles.answerButtonSelected]}>
                    <Text style={[styles.answerButtonText, questionnaireAnswers[`${selectedQuestionnaireItem.id}.part`] === part && styles.answerButtonTextSelected]}>{part}</Text>
                  </Pressable>)}
                </View>
                <Text style={[styles.questionnaireMeasurementLabel, styles.painSectionSpacing]}>痛みの強さ（0〜10）</Text>
                <View style={styles.painScaleRow}>
                  {selectedQuestionnaireItem.intensityLevels.map((level) => <Pressable key={level} accessibilityRole="button" onPress={() => setQuestionnaireAnswer(`${selectedQuestionnaireItem.id}.intensity`, level)} style={[styles.painScaleButton, questionnaireAnswers[`${selectedQuestionnaireItem.id}.intensity`] === level && styles.answerButtonSelected]}>
                    <Text style={[styles.answerButtonText, questionnaireAnswers[`${selectedQuestionnaireItem.id}.intensity`] === level && styles.answerButtonTextSelected]}>{level}</Text>
                  </Pressable>)}
                </View>
                <Text style={[styles.questionnaireMeasurementLabel, styles.painSectionSpacing]}>発症・悪化のタイミング</Text>
                <View style={styles.answerList}>
                  {selectedQuestionnaireItem.timings.map((timing) => <Pressable key={timing} accessibilityRole="button" onPress={() => setQuestionnaireAnswer(`${selectedQuestionnaireItem.id}.timing`, timing)} style={[styles.answerButton, questionnaireAnswers[`${selectedQuestionnaireItem.id}.timing`] === timing && styles.answerButtonSelected]}>
                    <Text style={[styles.answerButtonText, questionnaireAnswers[`${selectedQuestionnaireItem.id}.timing`] === timing && styles.answerButtonTextSelected]}>{timing}</Text>
                  </Pressable>)}
                </View>
              </> : null}

              {selectedQuestionnaireItem.kind === 'checklist' ? <View style={styles.checklist}>
                {selectedQuestionnaireItem.questions.map((question, index) => {
                  const questionKey = `${selectedQuestionnaireItem.id}.${index}`;
                  return <View key={questionKey} style={styles.checklistRow}>
                    <Text style={styles.checklistQuestion}>{question}</Text>
                    <View style={styles.checklistAnswerRow}>
                      {['はい', 'いいえ'].map((option) => <Pressable key={option} accessibilityRole="button" onPress={() => setQuestionnaireAnswer(questionKey, option)} style={[styles.checklistOptionButton, questionnaireAnswers[questionKey] === option && styles.answerButtonSelected]}>
                        <Text style={[styles.answerButtonText, questionnaireAnswers[questionKey] === option && styles.answerButtonTextSelected]}>{option}</Text>
                      </Pressable>)}
                    </View>
                  </View>;
                })}
              </View> : null}
            </View>
          </> : <View style={styles.questionnaireCategoryList}>{questionnaireItems.map((item, index) => {
            const isAnswered = isQuestionnaireItemAnswered(item);
            return <Pressable key={item.id} accessibilityRole="button" onPress={() => setSelectedQuestionnaireItemId(item.id)} style={[styles.questionnaireCategoryButton, isAnswered && styles.questionnaireCategoryButtonAnswered]}>
              <Text style={[styles.questionnaireNumber, isAnswered && styles.questionnaireNumberAnswered]}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={styles.questionnaireItemTitle}>{item.title}</Text>
              {isAnswered ? <Text style={styles.answeredLabel}>回答済み</Text> : <Ionicons color={colors.subText} name="chevron-forward" size={20} />}
            </Pressable>;
          })}</View>}
        </ScrollView> : screen === 'login' ? <View style={[styles.content, styles.loginContent]}>
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
            <View style={styles.passwordInputWrapper}>
              <TextInput autoComplete="password" onChangeText={setPassword} placeholder="パスワードを入力" placeholderTextColor="#9AA29A" secureTextEntry={!isLoginPasswordVisible} style={[styles.input, styles.passwordInput]} value={password} />
              <Pressable accessibilityLabel={isLoginPasswordVisible ? 'パスワードを隠す' : 'パスワードを表示'} accessibilityRole="button" hitSlop={10} onPress={() => setIsLoginPasswordVisible((current) => !current)} style={styles.passwordVisibilityButton}>
                <Ionicons color="#9AA29A" name={isLoginPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} />
              </Pressable>
            </View>
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
          <View style={styles.nameRow}>
            <TextInput autoComplete="family-name" onChangeText={(value) => updateRegistration('lastName', value)} placeholder="姓" placeholderTextColor="#9AA29A" style={[styles.input, styles.nameInput]} value={registration.lastName} />
            <TextInput autoComplete="given-name" onChangeText={(value) => updateRegistration('firstName', value)} placeholder="名" placeholderTextColor="#9AA29A" style={[styles.input, styles.nameInput]} value={registration.firstName} />
          </View>
          <Text style={styles.label}>氏名（カタカナ）</Text>
          <View style={styles.nameRow}>
            <TextInput onChangeText={(value) => updateRegistration('lastNameKana', value)} placeholder="セイ" placeholderTextColor="#9AA29A" style={[styles.input, styles.nameInput]} value={registration.lastNameKana} />
            <TextInput onChangeText={(value) => updateRegistration('firstNameKana', value)} placeholder="メイ" placeholderTextColor="#9AA29A" style={[styles.input, styles.nameInput]} value={registration.firstNameKana} />
          </View>
          <Text style={styles.label}>メールアドレス</Text>
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={(value) => updateRegistration('email', value)} placeholder="example@email.com" placeholderTextColor={colors.subText} style={styles.input} value={registration.email} />
          <Text style={styles.label}>メールアドレス（再度）</Text>
          <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={(value) => updateRegistration('emailConfirmation', value)} placeholder="example@email.com" placeholderTextColor={colors.subText} style={styles.input} value={registration.emailConfirmation} />
          <Text style={styles.label}>パスワード</Text>
          <Text style={styles.passwordHint}>パスワードは英大文字・英小文字・数字をそれぞれ含む8文字以上で入力してください。</Text>
          <View style={styles.passwordInputWrapper}>
            <TextInput autoComplete="new-password" onChangeText={(value) => updateRegistration('password', value)} placeholder="パスワードを入力" placeholderTextColor={colors.subText} secureTextEntry={!isPasswordVisible} style={[styles.input, styles.passwordInput]} value={registration.password} />
            <Pressable accessibilityLabel={isPasswordVisible ? 'パスワードを隠す' : 'パスワードを表示'} accessibilityRole="button" hitSlop={10} onPress={() => setIsPasswordVisible((current) => !current)} style={styles.passwordVisibilityButton}>
              <Ionicons color={colors.subText} name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} />
            </Pressable>
          </View>
          <Text style={styles.label}>パスワード（再度）</Text>
          <View style={styles.passwordInputWrapper}>
            <TextInput onChangeText={(value) => updateRegistration('passwordConfirmation', value)} placeholder="パスワードを再入力" placeholderTextColor={colors.subText} secureTextEntry={!isPasswordConfirmationVisible} style={[styles.input, styles.passwordInput]} value={registration.passwordConfirmation} />
            <Pressable accessibilityLabel={isPasswordConfirmationVisible ? '確認用パスワードを隠す' : '確認用パスワードを表示'} accessibilityRole="button" hitSlop={10} onPress={() => setIsPasswordConfirmationVisible((current) => !current)} style={styles.passwordVisibilityButton}>
              <Ionicons color={colors.subText} name={isPasswordConfirmationVisible ? 'eye-off-outline' : 'eye-outline'} size={22} />
            </Pressable>
          </View>
          <Text style={styles.label}>性別</Text>
          <View style={styles.genderRow}>{['女性', '男性', '回答しない'].map((option) => <Pressable key={option} accessibilityRole="button" onPress={() => setGender(option)} style={[styles.genderButton, gender === option && styles.genderButtonSelected]}><Text style={[styles.genderButtonText, gender === option && styles.genderButtonTextSelected]}>{option}</Text></Pressable>)}</View>
          <Text style={styles.label}>生年月日</Text>
          <View style={styles.birthDateRow}>
            {(['birthYear', 'birthMonth', 'birthDay'] as const).map((field) => <Pressable accessibilityLabel={`${datePickerLabels[field]}を選択`} accessibilityRole="button" key={field} onPress={() => setActiveDateField(field)} style={styles.datePickerContainer}>
              <Text style={[styles.datePickerText, !registration[field] && styles.datePickerPlaceholder]}>{registration[field] ? `${registration[field]}${datePickerLabels[field]}` : datePickerLabels[field]}</Text>
            </Pressable>)}
          </View>
          <Modal animationType="slide" onRequestClose={() => setActiveDateField(null)} transparent visible={activeDateField !== null}>
            <View style={styles.datePickerModalBackdrop}>
              <Pressable accessibilityRole="button" accessibilityLabel="閉じる" onPress={() => setActiveDateField(null)} style={styles.datePickerModalDismiss} />
              <View style={styles.datePickerModalContent}>
                <Text style={styles.datePickerModalTitle}>{activeDateField ? `${datePickerLabels[activeDateField]}を選択` : '生年月日を選択'}</Text>
                <ScrollView style={styles.datePickerOptionList}>
                  {activeDateField ? datePickerOptions[activeDateField].map((value) => <Pressable accessibilityRole="button" key={value} onPress={() => { updateRegistration(activeDateField, value); setActiveDateField(null); }} style={styles.datePickerOption}>
                    <Text style={[styles.datePickerOptionText, registration[activeDateField] === value && styles.datePickerOptionTextSelected]}>{value}{datePickerLabels[activeDateField]}</Text>
                  </Pressable>) : null}
                </ScrollView>
              </View>
            </View>
          </Modal>
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
  backLink: { color: colors.mainText, fontSize: 14, fontWeight: '700' },
  signUpBrand: { color: colors.mainText, fontSize: 22, fontWeight: '700' },
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
  brand: { color: colors.mainText, fontSize: 34, fontWeight: '700', letterSpacing: 0, marginTop: 16 },
  tagline: { color: colors.subText, fontSize: 14, marginTop: 8 },
  form: { marginBottom: 22, marginTop: 'auto' },
  heading: { color: colors.mainText, fontSize: 24, fontWeight: '700', letterSpacing: 0 },
  description: { color: colors.subText, fontSize: 13, lineHeight: 20, marginBottom: 27, marginTop: 8 },
  label: { color: colors.mainText, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderColor: colors.sub, borderRadius: 8, borderWidth: 1, color: colors.mainText, fontSize: 16, height: 52, marginBottom: 20, paddingHorizontal: 15 },
  nameRow: { flexDirection: 'row', gap: 10 },
  nameInput: { flex: 1 },
  passwordHint: { color: colors.subText, fontSize: 12, lineHeight: 18, marginBottom: 8, marginTop: -2 },
  passwordInputWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  passwordVisibilityButton: { alignItems: 'center', height: 52, justifyContent: 'center', position: 'absolute', right: 0, top: 0, width: 50 },
  birthDateRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  datePickerContainer: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: colors.sub, borderRadius: 8, borderWidth: 1, flex: 1, height: 52, justifyContent: 'center' },
  datePickerText: { color: colors.mainText, fontSize: 16, fontWeight: '600' },
  datePickerPlaceholder: { color: colors.subText, fontWeight: '400' },
  datePickerModalBackdrop: { backgroundColor: 'rgba(43, 58, 66, 0.35)', flex: 1, justifyContent: 'flex-end' },
  datePickerModalDismiss: { flex: 1 },
  datePickerModalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '72%', padding: 24 },
  datePickerModalTitle: { color: colors.mainText, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  datePickerOptionList: { flexGrow: 0 },
  datePickerOption: { borderBottomColor: colors.sub, borderBottomWidth: 1, minHeight: 48, justifyContent: 'center' },
  datePickerOptionText: { color: colors.mainText, fontSize: 16 },
  datePickerOptionTextSelected: { color: colors.main, fontWeight: '700' },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  genderButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: colors.sub, borderRadius: 8, borderWidth: 1, flex: 1, height: 48, justifyContent: 'center' },
  genderButtonSelected: { backgroundColor: colors.sub, borderColor: colors.main },
  genderButtonText: { color: colors.subText, fontSize: 13, fontWeight: '700' },
  genderButtonTextSelected: { color: colors.mainText },
  measurementRow: { alignItems: 'center', flexDirection: 'row' },
  measurementInput: { flex: 1 },
  unit: { color: '#405044', fontSize: 14, fontWeight: '700', marginBottom: 20, marginLeft: 12, width: 25 },
  message: { color: '#9A5D3F', fontSize: 13, lineHeight: 19, marginBottom: 14, marginTop: -6 },
  loginButton: { alignItems: 'center', backgroundColor: colors.main, borderRadius: 8, height: 52, justifyContent: 'center', marginTop: 4 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  signUpButton: { alignItems: 'center', borderColor: colors.main, borderRadius: 8, borderWidth: 1, height: 52, justifyContent: 'center', marginTop: 12 },
  signUpButtonText: { color: colors.mainText, fontSize: 16, fontWeight: '700' },
  questionnaireContent: { padding: 24, paddingBottom: 48 },
  questionnaireHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  questionnaireEyebrow: { color: colors.subText, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  questionnaireTitle: { color: colors.mainText, fontSize: 24, fontWeight: '700', lineHeight: 32 },
  questionnaireCount: { color: colors.main, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  questionnaireDescription: { color: colors.subText, fontSize: 13, lineHeight: 20, marginBottom: 24 },
  questionnaireCategoryList: { gap: 10 },
  questionnaireCategoryButton: { alignItems: 'center', backgroundColor: colors.sub, borderRadius: 8, flexDirection: 'row', minHeight: 64, paddingHorizontal: 16 },
  questionnaireCategoryButtonAnswered: { borderColor: colors.main, borderWidth: 2 },
  questionnaireBackButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', marginBottom: 16 },
  questionnaireBackButtonText: { color: colors.mainText, fontSize: 13, fontWeight: '700', marginLeft: 2 },
  questionnaireCard: { backgroundColor: colors.sub, borderRadius: 8, marginBottom: 14, padding: 16 },
  questionnaireCardAnswered: { borderColor: colors.main, borderWidth: 2 },
  questionnaireCardHeader: { alignItems: 'center', flexDirection: 'row', marginBottom: 14 },
  questionnaireNumber: { color: colors.subText, fontSize: 13, fontWeight: '800', marginRight: 10 },
  questionnaireNumberAnswered: { color: colors.mainText },
  questionnaireItemTitle: { color: colors.mainText, flex: 1, fontSize: 17, fontWeight: '700' },
  answeredLabel: { color: colors.mainText, fontSize: 11, fontWeight: '700' },
  answerList: { gap: 8 },
  answerButton: { backgroundColor: '#FFFFFF', borderColor: colors.main, borderRadius: 7, borderWidth: 1, minHeight: 42, justifyContent: 'center', paddingHorizontal: 12 },
  answerButtonSelected: { backgroundColor: colors.main, borderColor: colors.main },
  answerButtonText: { color: colors.mainText, fontSize: 13, fontWeight: '600' },
  answerButtonTextSelected: { color: '#FFFFFF' },
  fieldList: { gap: 16 },
  fieldBlock: {},
  painSectionSpacing: { marginTop: 16 },
  painScaleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  painScaleButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: colors.main, borderRadius: 7, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  checklist: { gap: 16 },
  checklistRow: { gap: 8 },
  checklistQuestion: { color: colors.mainText, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  checklistAnswerRow: { flexDirection: 'row', gap: 8 },
  checklistOptionButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: colors.main, borderRadius: 7, borderWidth: 1, flex: 1, height: 42, justifyContent: 'center' },
  questionnaireMeasurement: { flex: 1 },
  questionnaireMeasurementLabel: { color: colors.mainText, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  questionnaireMeasurementInputRow: { alignItems: 'center', flexDirection: 'row' },
  questionnaireMeasurementInput: { backgroundColor: '#FFFFFF', borderColor: colors.main, borderRadius: 7, borderWidth: 1, color: colors.mainText, flex: 1, fontSize: 14, height: 42, paddingHorizontal: 10 },
  questionnaireFreeTextInput: { backgroundColor: '#FFFFFF', borderColor: colors.main, borderRadius: 7, borderWidth: 1, color: colors.mainText, fontSize: 14, height: 42, paddingHorizontal: 10 },
  questionnaireUnit: { color: colors.mainText, fontSize: 12, fontWeight: '700', marginLeft: 6 },
});
