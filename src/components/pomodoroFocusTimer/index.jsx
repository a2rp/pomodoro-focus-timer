import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronRight, FiPlus, FiRotateCcw, FiSettings } from "react-icons/fi";
import styles from "./styles.module.css";
const key = "pomodoro-focus-data";
const load = () => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } };
const saved = load();
const seedTasks = [{ id: "p1", title: "Draft the first section", done: false }, { id: "p2", title: "Clear the reading notes", done: false }];
const PomodoroFocusTimer = () => {
    const [mode, setMode] = useState("focus");
    const [durations, setDurations] = useState(() => saved.durations || { focus: 25, short: 5, long: 15 });
    const initialTime = (saved.durations?.focus || 25) * 60;
    const [remaining, setRemaining] = useState(initialTime);
    const remainingRef = useRef(initialTime);
    const [running, setRunning] = useState(false);
    const [sessions, setSessions] = useState(() => Number(saved.sessions) || 0);
    const [tasks, setTasks] = useState(() => Array.isArray(saved.tasks) ? saved.tasks : seedTasks);
    const [newTask, setNewTask] = useState("");
    useEffect(() => localStorage.setItem(key, JSON.stringify({ durations, sessions, tasks })), [durations, sessions, tasks]);
    useEffect(() => {
        if (!running) return undefined;
        const timer = window.setInterval(() => {
            const next = remainingRef.current - 1;
            if (next <= 0) {
                setRunning(false);
                if (mode === "focus") setSessions((count) => count + 1);
                const nextMode = mode === "focus" ? "short" : "focus";
                const nextTime = durations[nextMode] * 60;
                setMode(nextMode);
                remainingRef.current = nextTime;
                setRemaining(nextTime);
            } else {
                remainingRef.current = next;
                setRemaining(next);
            }
        }, 1000);
        return () => window.clearInterval(timer);
    }, [running, mode, durations]);
    const selectMode = (next) => { setRunning(false); setMode(next); remainingRef.current = durations[next] * 60; setRemaining(durations[next] * 60); };
    const reset = () => { setRunning(false); remainingRef.current = durations[mode] * 60; setRemaining(durations[mode] * 60); };
    const skip = () => { const next = mode === "focus" ? "short" : "focus"; selectMode(next); };
    const changeDuration = (name, raw) => {
        const value = Math.min(name === "focus" ? 90 : 60, Math.max(1, Number(raw) || 1));
        setDurations((current) => ({ ...current, [name]: value }));
        if (mode === name) { remainingRef.current = value * 60; setRemaining(value * 60); }
    };
    const addTask = (event) => { event.preventDefault(); if (!newTask.trim()) return; setTasks((items) => [...items, { id: crypto.randomUUID(), title: newTask.trim(), done: false }]); setNewTask(""); };
    const clock = String(Math.floor(remaining / 60)).padStart(2, "0") + ":" + String(remaining % 60).padStart(2, "0");
    const total = durations[mode] * 60;
    const progress = total ? (total - remaining) / total : 0;
    return <section className={styles.focusPage} id="focus">
        <header className={styles.heading}><div className={styles.brand}><span>STILL / WORK</span><FiSettings /></div><p>One thing at a time.</p></header>
        <div className={styles.layout}>
            <section className={styles.timerPanel}>
                <div className={styles.modes} role="group" aria-label="Timer mode">{[["focus", "Focus"], ["short", "Short break"], ["long", "Long break"]].map(([value, label]) => <button className={mode === value ? styles.selected : ""} key={value} onClick={() => selectMode(value)}>{label}</button>)}</div>
                <div className={styles.clockFace}><svg viewBox="0 0 280 280" aria-hidden="true"><circle cx="140" cy="140" r="126" /><circle className={styles.progressRing} cx="140" cy="140" r="126" strokeDasharray="791.7" strokeDashoffset={791.7 * (1 - progress)} /></svg><div><small>{mode === "focus" ? "WORK SESSION" : "REST YOUR EYES"}</small><strong>{clock}</strong><span>{running ? "Stay with this moment" : "Ready when you are"}</span></div></div>
                <div className={styles.timerControls}><button className={styles.startButton} onClick={() => setRunning(!running)}>{running ? "Pause" : "Start focus"}</button><button onClick={reset} aria-label="Reset timer"><FiRotateCcw /> Reset</button><button onClick={skip} aria-label="Skip to next mode"><FiChevronRight /> Skip</button></div><p className={styles.sessionCount}>Completed focus sessions <strong>{sessions}</strong></p>
            </section>
            <aside className={styles.sidePanel} id="sessions">
                <div className={styles.focusNote}><span>THE RHYTHM</span><h2>Protect a little quiet.</h2><p>Work in one clear block. When the bell arrives, let the next few minutes be a real break.</p></div>
                <section className={styles.settings}><span><FiSettings /> Timer lengths</span><label>Focus minutes<input type="number" min="1" max="90" value={durations.focus} onChange={(event) => changeDuration("focus", event.target.value)} /></label><div><label>Short break<input type="number" min="1" max="30" value={durations.short} onChange={(event) => changeDuration("short", event.target.value)} /></label><label>Long break<input type="number" min="1" max="60" value={durations.long} onChange={(event) => changeDuration("long", event.target.value)} /></label></div></section>
                <div className={styles.taskList}><h2>Focus list <small>{tasks.filter((task) => !task.done).length} left</small></h2><form onSubmit={addTask}><input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add a task to focus on" aria-label="New focus task" required /><button aria-label="Add task"><FiPlus /></button></form>{tasks.map((task) => <label className={task.done ? styles.taskDone : ""} key={task.id}><input type="checkbox" checked={task.done} onChange={() => setTasks((items) => items.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} /><span><FiCheck />{task.title}</span></label>)}</div>
            </aside>
        </div>
    </section>;
};
export default PomodoroFocusTimer;
