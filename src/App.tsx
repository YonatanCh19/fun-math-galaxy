import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Practice from "./pages/Practice";
import Games from "./pages/Games";
import MemoryGame from "./pages/games/MemoryGame";
import SnakeGame from "./pages/games/SnakeGame";
import TetrisGame from "./pages/games/TetrisGame";
import { AuthProvider } from "./hooks/useAuth";
import AuthPage from "./pages/Auth";
import ProfileSelection from "./pages/ProfileSelection";
import BalloonPopGame from "./pages/games/BalloonPopGame";
import DrawingBoardGame from "./pages/games/DrawingBoardGame";
import EndlessRunnerGame from "./pages/games/EndlessRunnerGame";
import OnlineCompetition from "./pages/OnlineCompetition";
import OnlineGame from "./pages/OnlineGame";
import { LanguageProvider } from "./contexts/LanguageContext";
import GlobalGameInviteListener from "./components/GlobalGameInviteListener";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            {/* Global Game Invite Listener - works on all pages */}
            <GlobalGameInviteListener />
            
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/profile-selection" element={<ProfileSelection />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/memory" element={<MemoryGame />} />
              <Route path="/games/snake" element={<SnakeGame />} />
              <Route path="/games/tetris" element={<TetrisGame />} />
              <Route path="/games/balloon-pop" element={<BalloonPopGame />} />
              <Route path="/games/drawing-board" element={<DrawingBoardGame />} />
              <Route path="/games/endless-runner" element={<EndlessRunnerGame />} />
              <Route path="/online-competition" element={<OnlineCompetition />} />
              <Route path="/online-game/:competitionId" element={<OnlineGame />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;