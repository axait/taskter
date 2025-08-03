// Debug toggle
const debugVar = false;

// Debug function to log messages in non-production environments
function debug(...messages) {
	if (process.env.NODE_ENV !== 'production' && debugVar === true) {
		console.log(...messages);
	}
}

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { v4 as uuidv4 } from 'uuid';

// Variants for motion animations
const variants = {
	initial: { opacity: 0, y: 20, scale: 0.9 },
	animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeInOut' } },
	exit: { opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.3, ease: 'easeInOut' } }
};

// Task component to render task list
function Task({ tasks = [], setTasks, filter }) {
	debug('Rendering Task component with:', { tasks, filter });
	const [editing, setEditing] = useState(null);
	const inputRef = useRef(null);
	const hasTyped = useRef(false);

	// Handle task edit
	const handleEdit = (task) => {
		debug('Editing task:', task);
		setEditing(task);
	};

	// Save edited task
	const handleSave = (task) => {
		debug('Saving task:', task);
		const newTasks = tasks.map(t => {
			if (t.id === task.id) {
				return { ...t, name: inputRef.current.value };
			}
			return t;
		});
		setTasks(newTasks.filter((t, i) => newTasks.findIndex(v => v.name === t.name) === i));
		setEditing(null);
	};

	// Cancel editing
	const handleCancel = () => {
		debug('Cancel editing');
		setEditing(null);
	};

	// Handle input change
	const handleInput = (e) => {
		if (hasTyped.current) {
			debug('User is typing:', e.target.value);
			setTasks(tasks.map(t => t.id === editing.id ? { ...t, name: e.target.value } : t));
		}
		hasTyped.current = true;
	};

	// Effect to handle visibility change
	useEffect(() => {
		const handleBlur = () => {
			debug('User has stopped typing');
			hasTyped.current = false;
		};
		document.addEventListener('visibilitychange', handleBlur);
		return () => document.removeEventListener('visibilitychange', handleBlur);
	}, []);

	// Filter tasks based on the filter criteria
	const filteredTasks = tasks.filter(task => {
		if (filter === 'all') return true;
		if (filter === 'completed') return task.completed;
		if (filter === 'incompleted') return !task.completed;
	});

	// Render tasks
	return (
		<motion.ul className="space-y-4 transition-all duration-500" initial="animate" exit="exit" variants={variants}>
			<AnimatePresence>
				{filteredTasks.length === 0 ? (
					<motion.li
						className="flex items-center justify-center p-4 bg-blue-[10] border border-blue-200 rounded-lg shadow-sm transition-shadow hover:shadow-md text-gray-500"
						key="empty"
					>
						Add tasks
					</motion.li>
				) : (
					filteredTasks.map((task) => (
						<motion.li
							key={task.id}
							className="flex items-center justify-between p-4 bg-blue-[10] border border-blue-200 rounded-lg shadow-sm transition-shadow hover:shadow-md"
							variants={variants}
						>
							<motion.input
								type="checkbox"
								className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								exit={{ scale: 0 }}
								transition={{ duration: 0.2 }}
								checked={task.completed}
								onChange={() => {
									debug('Toggling task completion:', task);
									setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !task.completed } : t));
								}}
							/>
							{editing && editing.id === task.id ? (
								<motion.input
									type="text"
									ref={inputRef}
									className="flex-1 ml-3 text-lg font-medium text-gray-800 text-center"
									defaultValue={task.name}
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									exit={{ scale: 0 }}
									transition={{ duration: 0.2 }}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											handleSave(task);
											inputRef.current.value = '';
										}
										if (e.key === 'Escape') {
											handleCancel();
											inputRef.current.value = '';
										}
									}}
									onInput={handleInput}
								/>
							) : (
								<motion.span
									className="flex-1 ml-3 text-lg font-medium text-gray-800 text-center"
									initial={{ x: -20 }}
									animate={{ x: 0 }}
									exit={{ x: -20 }}
									transition={{ duration: 0.2 }}
									onClick={() => handleEdit(task)}
								>
									{task.name}
								</motion.span>
							)}
							<motion.div className="flex space-x-2" initial={{ x: 20 }} animate={{ x: 0 }} exit={{ x: 20 }} transition={{ duration: 0.2 }}>
								<motion.button
									className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200 ease-in-out"
									onClick={() => {
										debug('Deleting task:', task);
										setTasks(tasks.filter(t => t.id !== task.id));
									}}
									whileTap={{ scale: 0.95 }}
								>
									Delete
								</motion.button>
							</motion.div>
						</motion.li>
					))
				)}
			</AnimatePresence>
		</motion.ul>
	);
}

// Function to add a new task
const addTask = (task, setTasks) => {
	if (task.length > 100) return;
	const newTask = { name: task, id: uuidv4(), completed: false };
	setTasks(prev => {
		const updatedTasks = [...prev, newTask];
		const uniqueTasks = updatedTasks.filter((t, i) => updatedTasks.findIndex(v => v.name === t.name) === i);
		localStorage.setItem('tasks', JSON.stringify(uniqueTasks));
		debug('Added new task:', newTask);
		return uniqueTasks;
	});
};

// Main App component
function App() {
	debug('Rendering App component');
	const [tasks, setTasks] = useState(() => {
		const savedTasks = localStorage.getItem('tasks');
		return savedTasks ? JSON.parse(savedTasks) : [];
	});
	const [filter, setFilter] = useState('all');
	const inputRef = useRef(null);

	// Effect to update tasks in local storage
	useEffect(() => {
		localStorage.setItem('tasks', JSON.stringify(tasks));
		debug('Tasks updated:', tasks);
	}, [tasks]);

	// Handle key press for adding a task
	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && inputRef.current.value.trim()) {
			addTask(inputRef.current.value, setTasks);
			inputRef.current.value = '';
		}
	};

	// Render App component
	return (
		<motion.div
			className="max-w-md mx-auto mt-10 p-5 bg-gray-100 rounded-lg shadow-lg transition-all duration-500"
		>
			<h1 className="text-3xl font-bold text-center mb-6 text-blue-700">Taskter</h1>
			<div className="flex mb-6">
				<motion.input
					type="text"
					ref={inputRef}
					onKeyPress={handleKeyPress}
					className="flex-1 px-4 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Enter a task (max 100 chars)"
				/>
				<motion.button
					className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
					onClick={() => {
						if (inputRef.current.value.trim()) {
							addTask(inputRef.current.value, setTasks);
							inputRef.current.value = '';
						}
					}}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
				>
					Add
				</motion.button>
			</div>
			<div className="flex space-x-2 mb-6">
				<motion.button
					className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
					onClick={() => {
						debug('Filter set to: all');
						setFilter('all');
					}}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
				>
					All
				</motion.button>
				<motion.button
					className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
					onClick={() => {
						debug('Filter set to: completed');
						setFilter('completed');
					}}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
				>
					Completed
				</motion.button>
				<motion.button
					className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
					onClick={() => {
						debug('Filter set to: incompleted');
						setFilter('incompleted');
					}}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
				>
					Incompleted
				</motion.button>
			</div>
			<Task tasks={tasks} setTasks={setTasks} filter={filter} />
		</motion.div>
	);
}

export default App;

