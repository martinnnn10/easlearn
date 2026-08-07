import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import { FOCUSED_LAUNCH } from "@shared/featureFlags";
import Simulator from "./pages/Simulator";
import Courses from "./pages/Courses";
import CourseModule from "./pages/CourseModule";
import Lesson from "./pages/Lesson";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
import Authoring from "./pages/Authoring";
import SkillsPassport from "./pages/SkillsPassport";
import VerifySkillsPassport from "./pages/VerifySkillsPassport";
import DailyChallenge from "./pages/DailyChallenge";
import Review from "./pages/Review";
import ReviewQueue from "./pages/ReviewQueue";
import JobBoard from "./pages/JobBoard";
import EmployerPortal from "./pages/EmployerPortal";
import WorkforceIntelligence from "./pages/WorkforceIntelligence";
import CompetencyGraph from "./pages/CompetencyGraph";
import ManagerDashboard from "./pages/ManagerDashboard";
import WorkforcePlanner from "./pages/WorkforcePlanner";
import OperatorToTech from "./pages/OperatorToTech";
import ManagerHub from "./pages/ManagerHub";
import AdminLogin from "./pages/AdminLogin";
import Assessment from "./pages/Assessment";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Quiz from "./pages/Quiz";
import Certificate from "./pages/Certificate";
import MyCertificates from "./pages/MyCertificates";
import Dashboard from "./pages/Dashboard";
import WeakSpots from "./pages/WeakSpots";
import PrintLesson from "./pages/PrintLesson";
import Team from "./pages/Team";
import TeamInvite from "./pages/TeamInvite";
import TeamProgress from "./pages/TeamProgress";
import Tutorials from "./pages/Tutorials";
import TutorialDetail from "./pages/TutorialDetail";
import Resources from "./pages/Resources";
import InteractiveLabs from "./pages/InteractiveLabs";
import VFDSandbox from "./pages/VFDSandbox";
import HydraulicLab from "./pages/HydraulicLab";
import MotorControlWorkstation from "./pages/MotorControlWorkstation";
import Certifications from "./pages/Certifications";
import SkillMatrix from "./pages/SkillMatrix";
import Videos from "./pages/Videos";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Account from "./pages/Account";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Upgrade from "./pages/Upgrade";
import Enterprise from "./pages/Enterprise";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import VerifyCertificate from "./pages/VerifyCertificate";
import Roadmap from "./pages/Roadmap";
import FaultMasteryMap from "./pages/FaultMasteryMap";
import HireReadyDashboard from "./pages/HireReadyDashboard";
import HireReadyResult from "./pages/HireReadyResult";
import Progress from "./pages/Progress";
import FreeTraining from "./pages/FreeTraining";
import LearningPath from "./pages/LearningPath";
import SemiconductorReference from "./pages/SemiconductorReference";
import ElectricalStandardsLibrary from "./pages/ElectricalStandardsLibrary";
import ElectricalStandardDetail from "./pages/ElectricalStandardDetail";
import TroubleshootingReferencePage from "./pages/TroubleshootingReferencePage";
import PlcHub from "./pages/hubs/PlcHub";
import VfdHub from "./pages/hubs/VfdHub";
import SafetyHub from "./pages/hubs/SafetyHub";
import PrintReadingHub from "./pages/hubs/PrintReadingHub";
import Leaderboard from "./pages/Leaderboard";
import ManagerDemo from "./pages/ManagerDemo";
import TechnicianDetail from "./pages/TechnicianDetail";
import Onboarding from "./pages/Onboarding";
import OnboardingStart from "./pages/OnboardingStart";
import LearnerHome from "./pages/LearnerHome";
import ClientPortal from "./pages/ClientPortal";
import CandidatePortal from "./pages/CandidatePortal";
import Layout from "./components/Layout";
import MobileLabNav from "./components/MobileLabNav";
import CookieConsent from "./components/CookieConsent";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import ScrollToTopButton from "./components/ScrollToTopButton";
import ReferralCapture from "./components/ReferralCapture";
import OnboardingGuard from "./components/OnboardingGuard";

function Router() {
  return (
    <Switch>
      {/* Jobs cut: the magic moment is the homepage; full site lives at /explore. */}
      <Route path="/" component={FOCUSED_LAUNCH ? Landing : Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/onboarding/start" component={OnboardingStart} />
      <Route path="/learn" component={LearnerHome} />
      <Route path="/demo" component={Landing} />
      <Route path="/explore" component={Home} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:moduleSlug" component={CourseModule} />
      <Route path="/courses/:moduleSlug/quiz" component={Quiz} />
      {/* Redirect legacy /lessons/ URLs (old links, bookmarks, search results) to the real route */}
      <Route path="/courses/:moduleSlug/lessons/:lessonSlug">
        {(params) => <Redirect to={`/courses/${params.moduleSlug}/${params.lessonSlug}`} />}
      </Route>
      <Route path="/lessons/:moduleSlug/:lessonSlug">
        {(params) => <Redirect to={`/courses/${params.moduleSlug}/${params.lessonSlug}`} />}
      </Route>
      <Route path="/courses/:moduleSlug/:lessonSlug/print" component={PrintLesson} />
      <Route path="/courses/:moduleSlug/:lessonSlug" component={Lesson} />
      <Route path="/simulator" component={Simulator} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/eas-owner" component={AdminLogin} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/authoring" component={Authoring} />
      <Route path="/skills-passport" component={SkillsPassport} />
      <Route path="/verify/skills/:code" component={VerifySkillsPassport} />
      <Route path="/daily" component={DailyChallenge} />
      <Route path="/review" component={Review} />
      <Route path="/review-queue" component={ReviewQueue} />
      <Route path="/jobs" component={JobBoard} />
      <Route path="/employer" component={EmployerPortal} />
      <Route path="/intelligence" component={WorkforceIntelligence} />
      <Route path="/competency" component={CompetencyGraph} />
      <Route path="/manager/demo" component={ManagerDemo} />
      <Route path="/manager/technician/:userId" component={TechnicianDetail} />
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/planner" component={WorkforcePlanner} />
      <Route path="/become-a-tech" component={OperatorToTech} />
      <Route path="/manage" component={ManagerHub} />
      <Route path="/assessment/:token" component={Assessment} />
      <Route path="/certificate/:code" component={Certificate} />
      <Route path="/my-certificates" component={MyCertificates} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/weak-spots" component={WeakSpots} />
      <Route path="/tutorials" component={Tutorials} />
      <Route path="/tutorials/:slug" component={TutorialDetail} />
      <Route path="/resources" component={Resources} />
      <Route path="/labs" component={InteractiveLabs} />
      <Route path="/labs/hydraulic" component={HydraulicLab} />
      <Route path="/labs/motor-control-workstation" component={MotorControlWorkstation} />
      <Route path="/prototype/workstation">
        {() => <Redirect to="/labs/motor-control-workstation" />}
      </Route>
      <Route path="/labs/sandbox" component={VFDSandbox} />
      <Route path="/programs">
        <Redirect to="/courses" />
      </Route>
      <Route path="/certifications" component={Certifications} />
      <Route path="/team/skills" component={SkillMatrix} />
      <Route path="/videos" component={Videos} />
      <Route path="/team" component={Team} />
      <Route path="/team/invite/:token" component={TeamInvite} />
      <Route path="/team/progress" component={TeamProgress} />
      <Route path="/terms" component={Terms} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/account" component={Account} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/upgrade" component={Upgrade} />
      <Route path="/enterprise" component={Enterprise} />
      <Route path="/community" component={Community} />
      <Route path="/free-training" component={FreeTraining} />
      <Route path="/learning-path" component={LearningPath} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/profile" component={Profile} />
      <Route path="/mastery" component={FaultMasteryMap} />
      <Route path="/hire-ready" component={HireReadyDashboard} />
      <Route path="/hire-ready/:id" component={HireReadyResult} />
      <Route path="/progress" component={Progress} />
      <Route path="/verify-certificate/:code" component={VerifyCertificate} />
      <Route path="/verify-certificate" component={VerifyCertificate} />
      <Route path="/reference/semiconductor" component={SemiconductorReference} />
      <Route path="/reference/electrical" component={ElectricalStandardsLibrary} />
      <Route path="/symbols" component={ElectricalStandardsLibrary} />
      <Route path="/reference/electrical/:symbolId" component={ElectricalStandardDetail} />
      <Route path="/reference/troubleshooting/:topicId" component={TroubleshootingReferencePage} />
      <Route path="/hubs/plc" component={PlcHub} />
      <Route path="/hubs/vfd" component={VfdHub} />
      <Route path="/hubs/safety" component={SafetyHub} />
      <Route path="/hubs/print-reading" component={PrintReadingHub} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/client-portal" component={ClientPortal} />
      <Route path="/candidate-portal" component={CandidatePortal} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Layout>
            <OnboardingGuard>
              <Router />
            </OnboardingGuard>
          </Layout>
          <MobileLabNav />
          <ScrollToTopButton />
          <CookieConsent />
          <PWAInstallPrompt />
          <ReferralCapture />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
