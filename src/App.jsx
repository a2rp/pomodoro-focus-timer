import { useEffect, useState } from "react";
import PomodoroFocusTimer from "./components/pomodoroFocusTimer/index.jsx";
import BackToTop from "./components/backToTop/index.jsx";
import SiteFooter from "./components/siteFooter/index.jsx";
import SiteHeader from "./components/siteHeader/index.jsx";
import styles from "./App.module.css";
const App = () => {
 const [showBackToTop, setShowBackToTop] = useState(false);
 useEffect(() => { const update = () => setShowBackToTop(window.scrollY > 50); window.addEventListener("scroll", update, { passive: true }); update(); return () => window.removeEventListener("scroll", update); }, []);
 return <div className={styles.appShell} id="top"><SiteHeader title="Focus Timer" mark="F" repoUrl="https://github.com/a2rp/pomodoro-focus-timer" navItems={[["Focus","#focus"],["Sessions","#sessions"]]} /><main className={styles.pageContent}><PomodoroFocusTimer /></main><SiteFooter repoUrl="https://github.com/a2rp/pomodoro-focus-timer" /><BackToTop visible={showBackToTop} /></div>;
};
export default App;