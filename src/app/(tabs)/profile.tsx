// Kinezi-AI Profile & Settings Screen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { getUserSettings, saveUserSettings, UserSettings, clearAllData, getUserStats } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const [settings, setSettings] = useState<UserSettings>({
    voiceEnabled: true,
    hapticEnabled: true,
    cameraPosition: 'front',
    sensitivity: 'medium',
    language: 'tr',
  });

  const { signOut, user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await getUserSettings();
    setSettings(s);
  };

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveUserSettings({ [key]: value });
  };

  const handleClearData = () => {
    Alert.alert(
      'Verileri Sil',
      'Tüm antrenman geçmişi ve istatistikler silinecek. Devam etmek istiyor musun?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Başarılı', 'Tüm veriler silindi.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const renderSettingRow = (
    label: string,
    description: string,
    icon: string,
    rightComponent: React.ReactNode
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Text style={styles.settingEmoji}>{icon}</Text>
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <View style={styles.settingRight}>{rightComponent}</View>
    </View>
  );

  const renderSegmentControl = (
    options: { value: string; label: string }[],
    currentValue: string,
    onChange: (value: string) => void
  ) => (
    <View style={styles.segmentControl}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[
            styles.segmentOption,
            currentValue === option.value && styles.segmentOptionActive,
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              currentValue === option.value && styles.segmentTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil & Ayarlar</Text>
        <Text style={styles.subtitle}>
          Kinezi AI deneyimini kişiselleştir{user ? `, ${user.username}` : ''}.
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info Card */}
        <View style={styles.appInfoCard}>
          <Text style={styles.appIcon}>🤖</Text>
          <Text style={styles.appName}>Kinezi-AI</Text>
          <Text style={styles.appVersion}>v1.0.0</Text>
          <Text style={styles.appDescription}>
            Kamera tabanlı biyomekanik form asistanı
          </Text>
        </View>

        {/* Voice & Feedback */}
        <Text style={styles.sectionTitle}>Geri Bildirim</Text>
        <View style={styles.settingsCard}>
          {renderSettingRow(
            'Sesli Komutlar',
            'Antrenman sırasında sesli uyarılar',
            '🔊',
            <Switch
              value={settings.voiceEnabled}
              onValueChange={(v) => updateSetting('voiceEnabled', v)}
              trackColor={{ false: Colors.bgTertiary, true: Colors.neonCyanDim }}
              thumbColor={settings.voiceEnabled ? Colors.neonCyan : Colors.textTertiary}
            />
          )}
          <View style={styles.settingDivider} />
          {renderSettingRow(
            'Titreşim',
            'Hata ve uyarılarda titreşim',
            '📳',
            <Switch
              value={settings.hapticEnabled}
              onValueChange={(v) => updateSetting('hapticEnabled', v)}
              trackColor={{ false: Colors.bgTertiary, true: Colors.neonCyanDim }}
              thumbColor={settings.hapticEnabled ? Colors.neonCyan : Colors.textTertiary}
            />
          )}
        </View>

        {/* Camera */}
        <Text style={styles.sectionTitle}>Kamera</Text>
        <View style={styles.settingsCard}>
          {renderSettingRow(
            'Kamera Pozisyonu',
            'Varsayılan kamera',
            '📸',
            renderSegmentControl(
              [
                { value: 'front', label: 'Ön' },
                { value: 'back', label: 'Arka' },
              ],
              settings.cameraPosition,
              (v) => updateSetting('cameraPosition', v as 'front' | 'back')
            )
          )}
        </View>

        {/* Sensitivity */}
        <Text style={styles.sectionTitle}>Hassasiyet</Text>
        <View style={styles.settingsCard}>
          {renderSettingRow(
            'Analiz Hassasiyeti',
            'Form kontrol hassasiyeti',
            '🎯',
            renderSegmentControl(
              [
                { value: 'low', label: 'Düşük' },
                { value: 'medium', label: 'Orta' },
                { value: 'high', label: 'Yüksek' },
              ],
              settings.sensitivity,
              (v) => updateSetting('sensitivity', v as 'low' | 'medium' | 'high')
            )
          )}
        </View>

        {/* Data Management */}
        <Text style={styles.sectionTitle}>Veri Yönetimi</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            onPress={handleClearData}
            style={styles.dangerButton}
            activeOpacity={0.7}
          >
            <Text style={styles.dangerEmoji}>🗑️</Text>
            <View>
              <Text style={styles.dangerText}>Tüm Verileri Sil</Text>
              <Text style={styles.dangerSubtext}>
                Antrenman geçmişi ve istatistikler silinir
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.settingDivider} />

          <TouchableOpacity
            onPress={handleLogout}
            style={styles.dangerButton}
            activeOpacity={0.7}
          >
            <Text style={styles.dangerEmoji}>🚪</Text>
            <View>
              <Text style={[styles.dangerText, { color: Colors.textPrimary }]}>Çıkış Yap</Text>
              <Text style={styles.dangerSubtext}>
                Hesabınızdan güvenli bir şekilde çıkış yapın
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.black,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  appInfoCard: {
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
  },
  appIcon: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.black,
    color: Colors.neonCyan,
    letterSpacing: -0.5,
  },
  appVersion: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  appDescription: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  settingsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.bgGlassBorder,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingEmoji: {
    fontSize: 20,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  settingDescription: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  settingRight: {
    marginLeft: Spacing.sm,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.bgGlassBorder,
    marginHorizontal: Spacing.lg,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.sm,
    padding: 2,
  },
  segmentOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm - 2,
  },
  segmentOptionActive: {
    backgroundColor: Colors.neonCyan,
  },
  segmentText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  segmentTextActive: {
    color: Colors.bgPrimary,
    fontWeight: FontWeight.bold,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  dangerEmoji: {
    fontSize: 24,
  },
  dangerText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.neonRed,
  },
  dangerSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 1,
  },
});
