import { JarvisDashboard } from './components/JarvisDashboard';
import { useSocket } from './hooks/useSocket';

/**
 * App root. Opens the orchestrator WebSocket (feeds the Zustand store) and renders
 * the Jarvis Command Center dashboard (ported from the Lovable build, wired to live
 * terminal logs + skill execution).
 */
export default function App() {
  useSocket();
  return <JarvisDashboard />;
}
