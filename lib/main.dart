import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'engine/game_state.dart';
import 'screens/dashboard_screen.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const ServerIdleApp());
}

class ServerIdleApp extends StatelessWidget {
  const ServerIdleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) {
        final state = GameState();
        state.loadGame().then((_) => state.startTicking());
        return state;
      },
      child: MaterialApp(
        title: 'Server Idle',
        theme: buildAppTheme(),
        debugShowCheckedModeBanner: false,
        home: const DashboardScreen(),
      ),
    );
  }
}
