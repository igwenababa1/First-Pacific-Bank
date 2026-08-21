
import React, { useState, useMemo } from 'react';
import { Task, TaskCategory, TaskPriority, RecurrenceFrequency } from '../types';
import { TASK_CATEGORIES } from './constants';
import { PlusCircleIcon, CalendarDaysIcon, ClipboardDocumentIcon, XIcon, FlagIcon, ArrowPathIcon, SparklesIcon, SpinnerIcon, InfoIcon, TrophyIcon, MapPinIcon, ClockIcon } from './Icons';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { getSuggestedTasks, SuggestedTask } from '../services/geminiService';

interface FinancialTasksProps {
    tasks: Task[];
    addTask: (text: string, dueDate?: Date, dueTime?: string, location?: string, category?: TaskCategory, priority?: TaskPriority, recurrence?: RecurrenceFrequency, reason?: string) => void;
    toggleTask: (taskId: string) => void;
    deleteTask: (taskId: string) => void;
}

const getCategoryStyles = (category: string) => {
    switch (category) {
        case 'Financial':
            return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-400 dark:border-emerald-800';
        case 'Work':
            return 'primary- primary- primary- dark:primary- dark:primary- dark:primary-';
        case 'Personal':
            return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-400 dark:border-purple-800';
        case 'Other':
        default:
            return 'bg-slate-100 text-[#0F172A] border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-300';
    }
};

const getPriorityStyles = (priority: TaskPriority) => {
    switch (priority) {
        case 'High':
            return 'text-red-500 bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800';
        case 'Medium':
            return 'text-amber-500 bg-amber-100 dark:bg-amber-900 border-amber-200 dark:border-amber-800';
        case 'Low':
            return 'primary- primary- dark:primary- primary- dark:primary-';
        default:
            return 'text-[#0F172A] bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-300';
    }
};

const AnimatedCheckmark: React.FC = () => (
    <svg className="w-6 h-6 text-green-500 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" className="check-circle origin-center" />
        <path d="M9 12l2 2 4-4" className="check-mark" />
    </svg>
);

const TaskItem: React.FC<{ task: Task; onToggle: (id: string) => void; onDeleteRequest: (task: Task) => void; }> = ({ task, onToggle, onDeleteRequest }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = !task.completed && task.dueDate && task.dueDate < today;
    
    const formatDate = (date: Date) => {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div 
            className={`task-item flex items-center p-3 rounded-xl shadow-sm border transition-all duration-500 ease-out group ${
                task.completed 
                ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800/30' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-300 hover:border-primary/30'
            }`}
        >
            <button 
                onClick={() => onToggle(task.id)} 
                className="flex-shrink-0 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-slate-800 transition-transform active:scale-90"
            >
                {task.completed ? (
                    <AnimatedCheckmark />
                ) : (
                    <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-500 rounded-full group-hover:border-primary transition-colors bg-white dark:bg-slate-700"></div>
                )}
            </button>
            <div className={`flex-grow mx-3 transition-opacity duration-300 ${task.completed ? 'opacity-70' : 'opacity-100'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold relative w-fit transition-colors duration-300 ${task.completed ? 'text-[#0F172A] dark:text-white' : 'text-[#1E293B] dark:text-slate-100'}`}>
                            {task.text}
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-slate-400 dark:bg-slate-500 transition-all duration-500 ease-out ${task.completed ? 'w-full' : 'w-0'}`}></span>
                        </p>
                        {task.recurrence && task.recurrence !== 'None' && (
                            <div title={`Repeats ${task.recurrence}`} className="flex items-center gap-1 text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-wider bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full">
                                <ArrowPathIcon className="w-3 h-3" />
                                <span>{task.recurrence}</span>
                            </div>
                        )}
                        {task.reason && (
                            <div className="group/tooltip relative">
                                <InfoIcon className="w-3 h-3 primary- cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    AI Suggestion: {task.reason}
                                </div>
                            </div>
                        )}
                    </div>
                    {task.priority && !task.completed && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-2 flex items-center gap-1 ${getPriorityStyles(task.priority)}`}>
                            <FlagIcon className="w-3 h-3" /> {task.priority}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-4 mt-1">
                    {task.dueDate && (
                        <div className={`flex items-center space-x-1 text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-[#0F172A] dark:text-white'}`}>
                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                            <span>Due: {formatDate(task.dueDate)}</span>
                        </div>
                    )}
                    {task.dueTime && (
                        <div className={`flex items-center space-x-1 text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-[#0F172A] dark:text-white'}`}>
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span>{task.dueTime}</span>
                        </div>
                    )}
                    {task.location && (
                        <div className={`flex items-center space-x-1 text-xs ${task.completed ? 'text-[#0F172A] dark:text-white' : 'text-[#0F172A] dark:text-white'}`}>
                            <MapPinIcon className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]" title={task.location}>{task.location}</span>
                        </div>
                    )}
                    {task.category && (
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                             task.completed 
                             ? 'bg-slate-100 text-[#0F172A] dark:text-white border-transparent dark:bg-slate-900 dark:text-white' 
                             : getCategoryStyles(task.category)
                         }`}>
                            {task.category}
                         </span>
                    )}
                </div>
            </div>
            <button 
                onClick={() => onDeleteRequest(task)} 
                className="text-[#0F172A] dark:text-white hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete task"
            >
                 <XIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

export const FinancialTasks: React.FC<FinancialTasksProps> = ({ tasks, addTask, toggleTask, deleteTask }) => {
    const [text, setText] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState<TaskCategory>(TaskCategory.Financial);
    const [priority, setPriority] = useState<TaskPriority>('Medium');
    const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('None');
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);

    // Filters & Sorting
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
    const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        
        const date = dueDate ? new Date(dueDate) : undefined;
        if (date) {
            // Adjust for timezone offset to ensure date is stored as intended
            date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        }

        addTask(text, date, dueTime || undefined, location || undefined, category, priority, recurrence);
        setText('');
        setDueDate('');
        setDueTime('');
        setLocation('');
        setCategory(TaskCategory.Financial);
        setPriority('Medium');
        setRecurrence('None');
    };

    const handleGenerateSuggestions = async () => {
        setIsGeneratingSuggestions(true);
        // Mock user context - in a real app this would come from transaction history, etc.
        const userContext = "High net worth individual, frequent traveler, crypto investor, owns a business";
        const result = await getSuggestedTasks(userContext);
        
        if (!result.isError && result.tasks) {
            setSuggestedTasks(result.tasks);
        }
        setIsGeneratingSuggestions(false);
    };

    const handleAddSuggestion = (task: SuggestedTask) => {
        addTask(task.text, undefined, undefined, undefined, task.category, task.priority, 'None', task.reason);
        setSuggestedTasks(prev => prev.filter(t => t !== task));
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const statusMatch = statusFilter === 'all' || (statusFilter === 'completed' && task.completed) || (statusFilter === 'pending' && !task.completed);
            const categoryMatch = categoryFilter === 'all' || task.category === categoryFilter;
            const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
            return statusMatch && categoryMatch && priorityMatch;
        });
    }, [tasks, statusFilter, categoryFilter, priorityFilter]);

    const pendingTasks = useMemo(() => filteredTasks
        .filter(t => !t.completed)
        .sort((a,b) => {
             if (sortBy === 'priority') {
                 // Sort by priority first (High > Medium > Low) then by date
                 const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2, undefined: 3 };
                 const pA = priorityOrder[a.priority || 'Medium'];
                 const pB = priorityOrder[b.priority || 'Medium'];
                 if (pA !== pB) return pA - pB;
                 return (a.dueDate?.getTime() || Infinity) - (b.dueDate?.getTime() || Infinity);
             } else {
                 // Sort by date then priority
                 const dateA = a.dueDate?.getTime() || Infinity;
                 const dateB = b.dueDate?.getTime() || Infinity;
                 if (dateA !== dateB) return dateA - dateB;
                 
                 const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2, undefined: 3 };
                 return priorityOrder[a.priority || 'Medium'] - priorityOrder[b.priority || 'Medium'];
             }
        }), [filteredTasks, sortBy]);

    const completedTasks = useMemo(() => filteredTasks
        .filter(t => t.completed)
        .sort((a,b) => (b.dueDate?.getTime() || 0) - (a.dueDate?.getTime() || 0)), [filteredTasks]);

    const handleConfirmDelete = () => {
        if (taskToDelete) {
            deleteTask(taskToDelete.id);
            setTaskToDelete(null);
        }
    };

    // Calculate Gamification Score
    const completionScore = useMemo(() => {
        const total = tasks.length;
        if (total === 0) return 0;
        const completed = tasks.filter(t => t.completed).length;
        return Math.round((completed / total) * 100);
    }, [tasks]);

    return (
        <>
            <div className="space-y-8 max-w-3xl mx-auto animate-fade-in-up pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">Financial Tasks</h2>
                        <p className="text-sm text-[#0F172A] dark:text-white mt-1">Organize your financial to-dos and stay on top of your goals.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-300">
                            <TrophyIcon className={`w-4 h-4 ${completionScore === 100 ? 'text-yellow-500' : 'text-[#0F172A] dark:text-white'}`} />
                            <span className="text-xs font-bold text-[#0F172A] dark:text-white">Score: {completionScore}%</span>
                        </div>
                        <button 
                            onClick={handleGenerateSuggestions}
                            disabled={isGeneratingSuggestions}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-[#0F172A] dark:text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isGeneratingSuggestions ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                            <span className="text-xs font-bold uppercase tracking-wide">AI Suggestions</span>
                        </button>
                    </div>
                </div>

                {/* Add Task Form */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-6 ">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                        <div className="sm:col-span-12 relative">
                            <input 
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="What needs to be done?"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 p-4 rounded-xl shadow-inner text-[#0F172A] dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="sm:col-span-6">
                            <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-1 block">Location (Optional)</label>
                            <input 
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Branch Office, 123 Main St"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 p-3 rounded-lg shadow-sm text-[#0F172A] dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary outline-none text-sm"
                            />
                        </div>
                        <div className="sm:col-span-3">
                            <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-1 block">Due Date</label>
                            <input 
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 p-3 rounded-lg shadow-sm text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm"
                            />
                        </div>
                        <div className="sm:col-span-3">
                            <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-1 block">Due Time</label>
                            <input 
                                type="time"
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 p-3 rounded-lg shadow-sm text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm"
                            />
                        </div>
                        <div className="sm:col-span-4">
                             <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-1 block">Category</label>
                             <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 p-3 rounded-lg shadow-sm text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm"
                            >
                                {TASK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-4">
                             <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-1 block">Priority</label>
                             <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 p-3 rounded-lg shadow-sm text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm"
                            >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div className="sm:col-span-4">
                            <label className="text-xs font-bold text-[#0F172A] dark:text-white uppercase tracking-wider mb-1 block">Recurrence</label>
                            <select
                                value={recurrence}
                                onChange={(e) => setRecurrence(e.target.value as RecurrenceFrequency)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-300 p-3 rounded-lg shadow-sm text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none text-sm"
                            >
                                <option value="None">None</option>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Yearly">Yearly</option>
                            </select>
                        </div>
                        <button type="submit" disabled={!text.trim()} className="sm:col-span-12 w-full flex-shrink-0 px-4 py-3 bg-primary text-[#0F172A] dark:text-white rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2">
                            <PlusCircleIcon className="w-5 h-5"/>
                            <span className="font-bold">Add Task</span>
                        </button>
                    </form>
                </div>

                {suggestedTasks.length > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-900 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/30 animate-fade-in">
                        <div className="flex items-center gap-2 mb-4">
                            <SparklesIcon className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-bold text-indigo-900 dark:text-indigo-200">AI Suggested Tasks</h3>
                        </div>
                        <div className="space-y-3">
                            {suggestedTasks.map((task, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
                                    <div>
                                        <p className="text-sm font-bold text-[#1E293B] dark:text-slate-100">{task.text}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryStyles(task.category)}`}>{task.category}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityStyles(task.priority)}`}>{task.priority}</span>
                                            <span className="text-xs text-[#0F172A] dark:text-white italic flex items-center gap-1"><InfoIcon className="w-3 h-3" /> {task.reason}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleAddSuggestion(task)}
                                        className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                                        title="Add Task"
                                    >
                                        <PlusCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters & Controls */}
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                    <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-xl overflow-x-auto max-w-full">
                        {(['all', 'pending', 'completed'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                    statusFilter === status
                                        ? 'bg-white dark:bg-slate-600 shadow-sm text-primary'
                                        : 'text-[#0F172A] dark:text-white hover:text-[#0F172A] dark:hover:text-[#0F172A] dark:text-[#1E293B]'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="flex-1 xl:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-300 px-3 py-2 rounded-lg text-xs font-bold text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer uppercase tracking-wider shadow-sm"
                        >
                            <option value="priority">Sort: Priority</option>
                            <option value="date">Sort: Due Date</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as any)}
                            className="flex-1 xl:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-300 px-3 py-2 rounded-lg text-xs font-bold text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer uppercase tracking-wider shadow-sm"
                        >
                            <option value="all">Priority: All</option>
                            <option value="High">Priority: High</option>
                            <option value="Medium">Priority: Medium</option>
                            <option value="Low">Priority: Low</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as TaskCategory | 'all')}
                            className="flex-1 xl:flex-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-300 px-3 py-2 rounded-lg text-xs font-bold text-[#0F172A] dark:text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer uppercase tracking-wider shadow-sm"
                        >
                            <option value="all">Category: All</option>
                            {TASK_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-8">
                    {(statusFilter === 'all' || statusFilter === 'pending') && (
                        <div className="space-y-4">
                            {pendingTasks.length > 0 && <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider ml-1">Pending - {pendingTasks.length}</h3>}
                            {pendingTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingTasks.map(task => <TaskItem key={task.id} task={task} onToggle={toggleTask} onDeleteRequest={setTaskToDelete} />)}
                                </div>
                            ) : statusFilter === 'pending' && (
                                <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-300">
                                    <ClipboardDocumentIcon className="w-12 h-12 mx-auto text-[#0F172A] dark:text-white dark:text-white mb-3"/>
                                    <p className="text-[#0F172A] dark:text-white font-bold">No pending tasks found.</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {(statusFilter === 'all' || statusFilter === 'completed') && (
                        <div className="space-y-4">
                            {completedTasks.length > 0 && <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider ml-1">Completed - {completedTasks.length}</h3>}
                            {completedTasks.length > 0 ? (
                                <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
                                    {completedTasks.map(task => <TaskItem key={task.id} task={task} onToggle={toggleTask} onDeleteRequest={setTaskToDelete} />)}
                                </div>
                            ) : statusFilter === 'completed' && (
                                <div className="text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-300">
                                    <ClipboardDocumentIcon className="w-12 h-12 mx-auto text-[#0F172A] dark:text-white dark:text-white mb-2"/>
                                    <p className="text-[#0F172A] dark:text-white">No completed tasks yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {taskToDelete && (
                <DeleteConfirmationModal
                    taskText={taskToDelete.text}
                    onClose={() => setTaskToDelete(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}
             <style>{`
                @keyframes pop-in {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes circle-scale {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes check-draw {
                  0% { stroke-dashoffset: 20; opacity: 0; }
                  50% { opacity: 1; }
                  100% { stroke-dashoffset: 0; opacity: 1; }
                }
                
                .check-circle {
                    transform-origin: center;
                    animation: circle-scale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .check-mark {
                    stroke-dasharray: 20;
                    stroke-dashoffset: 20;
                    animation: check-draw 0.4s 0.15s ease-out forwards;
                }
             `}</style>
        </>
    );
};
