import { useCallback, useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronRight, FiPlus, FiRotateCcw, FiSettings } from "react-icons/fi";
import styles from "./styles.module.css";

const key = "pomodoro-focus-data";
const defaultDurations = { focus: 25, short: 5, long: 15 };
const defaultTasks = [
    { id: "p1", title: "Draft the first section", done: false },
    { id: "p2", title: "Clear the reading notes", done: false },
];
const isValidDurations = (value) => value && Number.isInteger(value.focus) && value.focus >= 1 && value.focus <= 90 && Number.isInteger(value.short) && value.short >= 1 && value.short <= 30 && Number.isInteger(value.long) && value.long >= 1 && value.long <= 60;
const normalizeTasks = (value) => {
    if (!Array.isArray(value)) return null;
    const tasks = value.map((task) => {
        if (!task || typeof task !== "object" || !(typeof task.id === "string" ? Boolean(task.id.trim()) : Number.isSafeInteger(task.id)) || typeof task.title !== "string" || !task.title.trim() || typeof task.done !== "boolean") return null;
        return { id: task.id, title: task.title.trim(), done: task.done };
    });
    if (!tasks.every(Boolean) || new Set(tasks.map((task) => task.id)).size !== tasks.length) return null;
    return tasks;
};
const readSavedData = () => {
    try {
        const serialized = localStorage.getItem(key);
        if (serialized === null) return { value: { durations: defaultDurations, sessions: 0, tasks: defaultTasks }, notice: "" };
        const saved = JSON.parse(serialized);
        const tasks = normalizeTasks(saved?.tasks);
        if (!saved || typeof saved !== "object" || !isValidDurations(saved.durations) || !Number.isSafeInteger(saved.sessions) || saved.sessions < 0 || !tasks) throw new Error("Invalid saved timer data");
        return { value: { durations: saved.durations, sessions: saved.sessions, tasks }, notice: "" };
    } catch {
        return {
            value: { durations: defaultDurations, sessions: 0, tasks: defaultTasks },
            notice: "Saved timer data could not be read. You can still use the timer during this visit.",
        };
    }
};

const PomodoroFocusTimer = () => {
    const [savedData] = useState(readSavedData);
    const [mode, setMode] = useState("focus");
    const [durations, setDurations] = useState(savedData.value.durations);
    const [remaining, setRemaining] = useState(savedData.value.durations.focus * 60);
    const remainingRef = useRef(savedData.value.durations.focus * 60);
    const [running, setRunning] = useState(false);
    const [sessions, setSessions] = useState(savedData.value.sessions);
    const [tasks, setTasks] = useState(savedData.value.tasks);
    const [storageNotice, setStorageNotice] = useState(savedData.notice);
    const settingsRef = useRef({ durations: savedData.value.durations, sessions: savedData.value.sessions, tasks: savedData.value.tasks });
    const [newTask, setNewTask] = useState("");

    const persistSettings = useCallback((updates) => {
        const nextSettings = { ...settingsRef.current, ...updates };
        settingsRef.current = nextSettings;
        try {
            localStorage.setItem(key, JSON.stringify(nextSettings));
            setStorageNotice("");
        } catch {
            setStorageNotice("Timer settings and tasks could not be saved in this browser. Changes will reset when you leave this page.");
        }
    }, []);

    useEffect(() => {
        if (!running) return undefined;
        const timer = window.setInterval(() => {
            const next = remainingRef.current - 1;
            if (next <= 0) {
                setRunning(false);
                let nextMode;
                if (mode === "focus") {
                    const nextSessions = settingsRef.current.sessions + 1;
                    setSessions(nextSessions);
                    persistSettings({ sessions: nextSessions });
                    nextMode = nextSessions % 4 === 0 ? "long" : "short";
                } else {
                    nextMode = "focus";
                }
                const nextTime = settingsRef.current.durations[nextMode] * 60;
                setMode(nextMode);
                remainingRef.current = nextTime;
                setRemaining(nextTime);
            } else {
                remainingRef.current = next;
                setRemaining(next);
            }
        }, 1000);
        return () => window.clearInterval(timer);
    }, [running, mode, durations, persistSettings]);

    const selectMode = (next) => {
        setRunning(false);
        setMode(next);
        remainingRef.current = durations[next] * 60;
        setRemaining(durations[next] * 60);
    };
    const reset = () => {
        setRunning(false);
        remainingRef.current = durations[mode] * 60;
        setRemaining(durations[mode] * 60);
    };
    const skip = () => selectMode(mode === "focus" ? "short" : "focus");
    const changeDuration = (name, raw) => {
        const maximum = name === "focus" ? 90 : name === "short" ? 30 : 60;
        const value = Math.min(maximum, Math.max(1, Math.round(Number(raw) || 1)));
        const nextDurations = { ...durations, [name]: value };
        setDurations(nextDurations);
        persistSettings({ durations: nextDurations });
        if (mode === name) {
            remainingRef.current = value * 60;
            setRemaining(value * 60);
        }
    };
    const addTask = (event) => {
        event.preventDefault();
        const title = newTask.trim();
        if (!title) return;
        const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Date.now());
        const nextTasks = [...tasks, { id, title, done: false }];
        setTasks(nextTasks);
        persistSettings({ tasks: nextTasks });
        setNewTask("");
    };
    const toggleTask = (taskId) => {
        const nextTasks = tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task);
        setTasks(nextTasks);
        persistSettings({ tasks: nextTasks });
    };

    const clock = String(Math.floor(remaining / 60)).padStart(2, "0") + ":" + String(remaining % 60).padStart(2, "0");
    const total = durations[mode] * 60;
    const progress = total ? (total - remaining) / total : 0;

    return <section className={styles.focusPage} id="focus">
        <header className={styles.heading}><div className={styles.brand}><span>STILL / WORK</span><FiSettings aria-hidden="true" /></div><p>One thing at a time.</p></header>
        {storageNotice && <p className={styles.storageNotice} role="status">{storageNotice}</p>}
        <div className={styles.layout}>
            <section className={styles.timerPanel}>
                <div className={styles.modes} role="group" aria-label="Timer mode">{[["focus", "Focus"], ["short", "Short break"], ["long", "Long break"]].map(([value, label]) => <button type="button" className={mode === value ? styles.selected : ""} key={value} onClick={() => selectMode(value)} aria-pressed={mode === value}>{label}</button>)}</div>
                <div className={styles.clockFace} role="timer" aria-label={`${mode === "focus" ? "Focus" : "Break"} time remaining ${clock}`}><svg viewBox="0 0 280 280" aria-hidden="true"><circle cx="140" cy="140" r="126" /><circle className={styles.progressRing} cx="140" cy="140" r="126" strokeDasharray="791.7" strokeDashoffset={791.7 * (1 - progress)} /></svg><div><small>{mode === "focus" ? "WORK SESSION" : "REST YOUR EYES"}</small><strong>{clock}</strong><span>{running ? "Stay with this moment" : "Ready when you are"}</span></div></div>
                <div className={styles.timerControls}><button type="button" className={styles.startButton} onClick={() => setRunning((value) => !value)} aria-pressed={running}>{running ? "Pause" : mode === "focus" ? "Start focus" : "Start break"}</button><button type="button" onClick={reset} aria-label="Reset timer"><FiRotateCcw aria-hidden="true" /> Reset</button><button type="button" onClick={skip} aria-label="Skip to next mode"><FiChevronRight aria-hidden="true" /> Skip</button></div>
                <p className={styles.sessionCount}>Completed focus sessions <strong>{sessions}</strong></p>
            </section>
            <aside className={styles.sidePanel} id="sessions">
                <div className={styles.focusNote}><span>THE RHYTHM</span><h2>Protect a little quiet.</h2><p>Work in one clear block. When a session ends, let the next few minutes be a real break.</p></div>
                <section className={styles.settings}><span><FiSettings aria-hidden="true" /> Timer lengths</span><label>Focus minutes<input type="number" min="1" max="90" step="1" value={durations.focus} onChange={(event) => changeDuration("focus", event.target.value)} /></label><div><label>Short break<input type="number" min="1" max="30" step="1" value={durations.short} onChange={(event) => changeDuration("short", event.target.value)} /></label><label>Long break<input type="number" min="1" max="60" step="1" value={durations.long} onChange={(event) => changeDuration("long", event.target.value)} /></label></div></section>
                <div className={styles.taskList}><h2>Focus list <small>{tasks.filter((task) => !task.done).length} left</small></h2><form onSubmit={addTask}><input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add a task to focus on" aria-label="New focus task" required /><button type="submit" aria-label="Add task"><FiPlus aria-hidden="true" /></button></form>{tasks.map((task) => <label className={task.done ? styles.taskDone : ""} key={task.id}><input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} /><span><FiCheck aria-hidden="true" />{task.title}</span></label>)}</div>
            </aside>
        </div>
    </section>;
};

export default PomodoroFocusTimer;
