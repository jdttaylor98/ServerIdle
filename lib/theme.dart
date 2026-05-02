import 'package:flutter/material.dart';

/// App-wide color constants matching the React Native version
class AppColors {
  static const Color background = Color(0xFF0D0D1A);
  static const Color cardBg = Color(0xFF1A1A2E);
  static const Color border = Color(0xFF2A2A4A);
  static const Color green = Color(0xFF00FF88);
  static const Color red = Color(0xFFFF3355);
  static const Color gold = Color(0xFFFFAA44);
  static const Color purple = Color(0xFFCC88FF);
  static const Color blue = Color(0xFF44AAFF);
  static const Color orange = Color(0xFFFF7755);
  static const Color white = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF888888);
  static const Color textDim = Color(0xFF666666);
  static const Color textMuted = Color(0xFF555555);
  static const Color dangerBg = Color(0xFF3A0D18);
  static const Color devBg = Color(0xFF1A0D00);
  static const Color devBorder = Color(0xFFAA6600);
  static const Color devButton = Color(0xFF332200);
}

ThemeData buildAppTheme() {
  return ThemeData.dark().copyWith(
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.green,
      secondary: AppColors.gold,
      surface: AppColors.cardBg,
      error: AppColors.red,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      elevation: 0,
    ),
  );
}
