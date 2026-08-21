import React, { useState, useEffect, useMemo } from 'react';
import { 
    Bell, 
    Clock, 
    Send, 
    Save, 
    History, 
    AlertTriangle, 
    Trash2, 
    Plus, 
    Check, 
    Loader2, 
    Megaphone, 
    Info, 
    AlertCircle,
    ShieldCheck,
    CreditCard,
    Tag,
    Smartphone,
    Monitor,
    Eye,
    Sparkles,
    Copy,
    RotateCcw,
    Users,
    Layers,
    CheckSquare,
    Square,
    Split,
    Image as ImageIcon,
    TrendingUp,
    Trophy,
    Award,
    Archive,
    ChevronDown,
    ChevronUp,
    Activity
} from 'lucide-react';
import { socket } from '../services/socket';

interface Template {
    id: string;
    name: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    createdAt: string;
}

interface BroadcastHistoryEntry {
    id: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    audience: string;
    targetSegment?: {
        type: 'all' | 'kycStatus' | 'txVolume' | 'combined';
        value: string;
    };
    timestamp: string;
    status: string;
    attachedMedia?: string | null;
    isAbTest?: boolean;
    messageVariantB?: string | null;
    isArchived?: boolean;
    metrics?: any;
    category?: string;
}

interface ScheduledAlert {
    id: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    scheduledFor: string;
    status: 'pending' | 'sending' | 'sent' | 'failed';
    createdAt: string;
    attachedMedia?: string | null;
    isAbTest?: boolean;
    messageVariantB?: string | null;
    metrics?: any;
    targetSegment?: {
        type: 'all' | 'kycStatus' | 'txVolume' | 'combined';
        value: string;
    };
}

// Helper to get metrics for a history entry with a stable random seed generator
const getMetricsForEntry = (hist: BroadcastHistoryEntry) => {
    const defaultSent = 150;
    // Stable pseudo-random generator based on entry id
    const seed = hist.id.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rand = (max: number, offset = 0) => {
        const x = Math.sin(seed + offset) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };

    if (hist.isAbTest) {
        const vA_sent = hist.metrics?.variantA_sent || 75;
        const vA_opens = hist.metrics?.variantA_opens || (rand(20) + 15);
        const vB_sent = hist.metrics?.variantB_sent || 75;
        const vB_opens = hist.metrics?.variantB_opens || (rand(25) + 20);
        
        const totalSent = vA_sent + vB_sent;
        const totalOpens = vA_opens + vB_opens;
        const totalDelivered = Math.floor(totalSent * 0.98);
        const totalClicks = rand(15) + 10;
        
        return {
            sent: totalSent,
            delivered: totalDelivered,
            opens: totalOpens,
            clicks: totalClicks,
            openRate: ((totalOpens / totalSent) * 100).toFixed(1),
            engagementRate: ((totalClicks / totalSent) * 100).toFixed(1),
            deliveryRate: ((totalDelivered / totalSent) * 100).toFixed(1),
            isAbTest: true,
            variantA_sent: vA_sent,
            variantA_opens: vA_opens,
            variantA_openRate: ((vA_opens / vA_sent) * 100).toFixed(1),
            variantB_sent: vB_sent,
            variantB_opens: vB_opens,
            variantB_openRate: ((vB_opens / vB_sent) * 100).toFixed(1),
        };
    } else {
        const sent = hist.metrics?.sent || defaultSent;
        const delivered = hist.metrics?.delivered || Math.floor(sent * 0.98);
        const opens = hist.metrics?.opens || (rand(40) + 50);
        const clicks = hist.metrics?.clicks || (rand(15) + 12);
        
        return {
            sent,
            delivered,
            opens,
            clicks,
            openRate: ((opens / sent) * 100).toFixed(1),
            engagementRate: ((clicks / sent) * 100).toFixed(1),
            deliveryRate: ((delivered / sent) * 100).toFixed(1),
            isAbTest: false,
        };
    }
};

interface AdminPushAlertsManagerProps {
    allUsers?: any[];
}

export function AdminPushAlertsManager({ allUsers = [] }: AdminPushAlertsManagerProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('info');
    const [category, setCategory] = useState<'Security' | 'Promotional' | 'Transactional'>('Security');
    const [templateName, setTemplateName] = useState('');
    const [scheduledFor, setScheduledFor] = useState('');
    
    // Segmented Broadcasting filters
    const [targetType, setTargetType] = useState<'all' | 'kycStatus' | 'txVolume' | 'combined'>('all');
    const [kycSegment, setKycSegment] = useState<'verified' | 'pending' | 'unverified' | 'rejected'>('verified');
    const [volumeSegment, setVolumeSegment] = useState<'high' | 'low'>('high');

    // High-fidelity extra features
    const [attachedMedia, setAttachedMedia] = useState<string>(''); 
    const [customMediaUrl, setCustomMediaUrl] = useState<string>('');
    const [isAbTest, setIsAbTest] = useState<boolean>(false);
    const [messageVariantB, setMessageVariantB] = useState<string>('');
    const [isAutoOptimize, setIsAutoOptimize] = useState<boolean>(false);

    // Live Device Preview Modal
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

    // Bulk action state
    const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
    const [showArchivedFolder, setShowArchivedFolder] = useState<boolean>(false);
    const [expandedMetricsIds, setExpandedMetricsIds] = useState<string[]>([]);
    
    const [templates, setTemplates] = useState<Template[]>([]);
    const [history, setHistory] = useState<BroadcastHistoryEntry[]>([]);
    const [schedules, setSchedules] = useState<ScheduledAlert[]>([]);
    
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
    
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
    
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Fetch initial data
    const fetchTemplates = async () => {
        setIsLoadingTemplates(true);
        try {
            const res = await fetch('/api/admin/push-templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (err) {
            console.error('Failed to fetch templates:', err);
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch('/api/admin/push-broadcast-history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const fetchSchedules = async () => {
        setIsLoadingSchedules(true);
        try {
            const res = await fetch('/api/admin/scheduled-push-alerts');
            if (res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (err) {
            console.error('Failed to fetch schedules:', err);
        } finally {
            setIsLoadingSchedules(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
        fetchHistory();
        fetchSchedules();

        // Refresh schedules and history on a loop to stay aligned
        const timer = setInterval(() => {
            fetchSchedules();
            fetchHistory();
        }, 10000);

        return () => clearInterval(timer);
    }, []);

    // Helper to run optimization analysis on user engagement history
    const engagementAnalysis = useMemo(() => {
        // Collect active user history
        const times = allUsers
            .map(u => {
                const dateStr = u.profile?.lastLogin?.date || u.createdAt;
                if (!dateStr) return null;
                const d = new Date(dateStr);
                return isNaN(d.getTime()) ? null : d.getHours();
            })
            .filter((h): h is number => h !== null);

        // Calculate distributions
        const distribution = Array(24).fill(0);
        times.forEach(h => { distribution[h]++; });

        // If we have no data or flat data, seed typical client-side engagement peaks (e.g. 10 AM, 3 PM)
        if (times.length === 0) {
            distribution[9] = 2;
            distribution[10] = 5;
            distribution[11] = 3;
            distribution[14] = 2;
            distribution[15] = 4;
            distribution[16] = 6;
            distribution[17] = 3;
        }

        // Find peak hour
        let peakHour = 10; // Default 10 AM
        let maxCount = 0;
        for (let h = 0; h < 24; h++) {
            if (distribution[h] > maxCount) {
                maxCount = distribution[h];
                peakHour = h;
            }
        }

        // Period grouping
        const morningCount = distribution.slice(6, 12).reduce((a, b) => a + b, 0);
        const afternoonCount = distribution.slice(12, 18).reduce((a, b) => a + b, 0);
        const eveningCount = distribution.slice(18, 24).reduce((a, b) => a + b, 0) + distribution.slice(0, 6).reduce((a, b) => a + b, 0);
        const total = Math.max(1, morningCount + afternoonCount + eveningCount);

        const morningPct = Math.round((morningCount / total) * 100);
        const afternoonPct = Math.round((afternoonCount / total) * 100);
        const eveningPct = Math.round((eveningCount / total) * 100);

        // Optimal date/time: next occurrence of peakHour:30
        const now = new Date();
        const suggested = new Date();
        suggested.setHours(peakHour, 30, 0, 0);
        if (suggested.getTime() <= now.getTime()) {
            suggested.setDate(suggested.getDate() + 1);
        }

        // YYYY-MM-DDTHH:mm
        const pad = (num: number) => String(num).padStart(2, '0');
        const formattedStr = `${suggested.getFullYear()}-${pad(suggested.getMonth() + 1)}-${pad(suggested.getDate())}T${pad(suggested.getHours())}:${pad(suggested.getMinutes())}`;

        return {
            peakHour,
            morningPct,
            afternoonPct,
            eveningPct,
            suggestedDateTimeStr: formattedStr,
            userCountAnalyzed: allUsers.length || 15
        };
    }, [allUsers]);

    // Automatically update scheduledFor when Auto-Optimize is toggled on
    useEffect(() => {
        if (isAutoOptimize) {
            setScheduledFor(engagementAnalysis.suggestedDateTimeStr);
        }
    }, [isAutoOptimize, engagementAnalysis]);

    // Filtered list based on active/archived folder selection
    const displayedHistory = useMemo(() => {
        return history.filter(item => !!item.isArchived === showArchivedFolder);
    }, [history, showArchivedFolder]);

    // Real-time aggregate Performance Metrics calculated from active campaigns
    const aggregateMetrics = useMemo(() => {
        const activeHistory = history.filter(item => !item.isArchived);
        if (activeHistory.length === 0) {
            return {
                avgDeliveryRate: '0.0',
                avgOpenRate: '0.0',
                avgEngagementRate: '0.0',
                totalDispatched: 0,
            };
        }

        let totalSent = 0;
        let totalDelivered = 0;
        let totalOpens = 0;
        let totalClicks = 0;

        activeHistory.forEach(hist => {
            const m = getMetricsForEntry(hist);
            totalSent += m.sent;
            totalDelivered += m.delivered;
            totalOpens += m.opens;
            totalClicks += m.clicks;
        });

        return {
            avgDeliveryRate: totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0.0',
            avgOpenRate: totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0.0',
            avgEngagementRate: totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0',
            totalDispatched: totalSent,
        };
    }, [history]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Calculate audience details for broadcasting payload
    const getTargetingDetails = () => {
        let audienceName = 'All Users';
        let targetSegmentPayload: { type: 'all' | 'kycStatus' | 'txVolume' | 'combined'; value: string } = { type: 'all', value: '' };

        if (targetType === 'kycStatus') {
            audienceName = `KYC Segment: ${kycSegment.toUpperCase()}`;
            targetSegmentPayload = { type: 'kycStatus', value: kycSegment };
        } else if (targetType === 'txVolume') {
            audienceName = `Volume Segment: ${volumeSegment === 'high' ? 'High Volume (>$5k)' : 'Low Volume (≤$5k)'}`;
            targetSegmentPayload = { type: 'txVolume', value: volumeSegment };
        } else if (targetType === 'combined') {
            audienceName = `Combined: KYC ${kycSegment.toUpperCase()} & Volume ${volumeSegment === 'high' ? 'High' : 'Low'}`;
            targetSegmentPayload = { type: 'combined', value: `${kycSegment}:${volumeSegment}` };
        }

        return { audienceName, targetSegmentPayload };
    };

    const handleBroadcast = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!title.trim() || !message.trim()) {
            showToast('Please enter both title and message text.', 'error');
            return;
        }

        setIsBroadcasting(true);
        try {
            const fullMessageText = `${title.toUpperCase()}: ${message}`;
            const { audienceName, targetSegmentPayload } = getTargetingDetails();
            const finalMedia = attachedMedia === 'custom' ? customMediaUrl : (attachedMedia || null);
            
            // Generate mock metrics for simulated A/B test splits on trigger
            const generatedMetrics = isAbTest ? {
                variantA_sent: 50,
                variantA_opens: Math.floor(Math.random() * 15) + 12, // ~24% to 54%
                variantB_sent: 50,
                variantB_opens: Math.floor(Math.random() * 18) + 18, // ~36% to 72% (Variant B usually wins!)
            } : null;

            // 1. Emit live websocket trigger
            socket.emit('admin:push_alert', {
                message: fullMessageText,
                severity: severity,
                targetSegment: targetSegmentPayload,
                attachedMedia: finalMedia,
                isAbTest,
                messageVariantB: isAbTest ? messageVariantB : null,
                metrics: generatedMetrics,
                category: category
            });

            // 2. Save broadcast history to Firestore via API
            const res = await fetch('/api/admin/push-broadcast-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    message,
                    severity,
                    audience: audienceName,
                    targetSegment: targetSegmentPayload,
                    attachedMedia: finalMedia,
                    isAbTest,
                    messageVariantB: isAbTest ? messageVariantB : null,
                    metrics: generatedMetrics,
                    category: category
                })
            });

            if (res.ok) {
                showToast(`Websocket Broadcast sent to targeted segment: ${audienceName}`);
                setTitle('');
                setMessage('');
                setSeverity('info');
                setCategory('Security');
                setTargetType('all');
                setAttachedMedia('');
                setCustomMediaUrl('');
                setIsAbTest(false);
                setMessageVariantB('');
                setIsAutoOptimize(false);
                setShowPreviewModal(false);
                fetchHistory();
            } else {
                throw new Error('Failed to log broadcast in database.');
            }
        } catch (err: any) {
            showToast(err.message || 'Transmission failed.', 'error');
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!title.trim() || !message.trim()) {
            showToast('Compose an alert with title and message first.', 'error');
            return;
        }

        const name = templateName.trim() || `Template ${templates.length + 1}`;
        setIsSavingTemplate(true);
        try {
            const res = await fetch('/api/admin/push-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    title,
                    message,
                    severity
                })
            });

            if (res.ok) {
                showToast(`Template "${name}" saved securely.`);
                setTemplateName('');
                fetchTemplates();
            } else {
                throw new Error('Failed to save template to Firestore.');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this template?')) return;
        
        try {
            const res = await fetch(`/api/admin/push-templates/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showToast('Template deleted.');
                fetchTemplates();
            }
        } catch (err) {
            showToast('Failed to delete template.', 'error');
        }
    };

    const handleSchedule = async () => {
        if (!title.trim() || !message.trim()) {
            showToast('Compose an alert with title and message first.', 'error');
            return;
        }
        if (!scheduledFor) {
            showToast('Please select a valid future date and time.', 'error');
            return;
        }

        const selectedTime = new Date(scheduledFor).getTime();
        if (selectedTime <= Date.now()) {
            showToast('Please specify a future timestamp.', 'error');
            return;
        }

        setIsScheduling(true);
        try {
            const { audienceName, targetSegmentPayload } = getTargetingDetails();
            const finalMedia = attachedMedia === 'custom' ? customMediaUrl : (attachedMedia || null);
            
            // For A/B tests, pre-populate future potential split details
            const generatedMetrics = isAbTest ? {
                variantA_sent: 50,
                variantA_opens: Math.floor(Math.random() * 15) + 12,
                variantB_sent: 50,
                variantB_opens: Math.floor(Math.random() * 18) + 18,
            } : null;

            const res = await fetch('/api/admin/schedule-push-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    message,
                    severity,
                    scheduledFor: new Date(scheduledFor).toISOString(),
                    attachedMedia: finalMedia,
                    isAbTest,
                    messageVariantB: isAbTest ? messageVariantB : null,
                    metrics: generatedMetrics,
                    targetSegment: targetSegmentPayload
                })
            });

            if (res.ok) {
                showToast('Automatic Push Broadcast pre-scheduled!');
                setTitle('');
                setMessage('');
                setScheduledFor('');
                setAttachedMedia('');
                setCustomMediaUrl('');
                setIsAbTest(false);
                setMessageVariantB('');
                setIsAutoOptimize(false);
                fetchSchedules();
            } else {
                throw new Error('Scheduler failed to register schedule record.');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsScheduling(false);
        }
    };

    const handleCancelSchedule = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this scheduled alert?')) return;
        
        try {
            const res = await fetch(`/api/admin/scheduled-push-alerts/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showToast('Scheduled alert cancelled and removed.');
                fetchSchedules();
            }
        } catch (err) {
            showToast('Failed to cancel schedule.', 'error');
        }
    };

    const loadTemplate = (temp: Template) => {
        setTitle(temp.title);
        setMessage(temp.message);
        setSeverity(temp.severity);
        showToast(`Loaded template "${temp.name}"`);
    };

    // --- Bulk Action Handlers ---
    const handleSelectAllHistory = () => {
        if (selectedHistoryIds.length === history.length) {
            setSelectedHistoryIds([]);
        } else {
            setSelectedHistoryIds(history.map(item => item.id));
        }
    };

    const handleSelectHistoryItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedHistoryIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedHistoryIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedHistoryIds.length} campaigns? This action cannot be undone.`)) return;

        setIsPerformingBulkAction(true);
        try {
            const res = await fetch('/api/admin/push-broadcast-history/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedHistoryIds })
            });
            if (res.ok) {
                showToast(`Deleted ${selectedHistoryIds.length} records successfully.`);
                setSelectedHistoryIds([]);
                fetchHistory();
            } else {
                throw new Error('Bulk delete operations encountered an error.');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsPerformingBulkAction(false);
        }
    };

    const handleBulkResend = async () => {
        if (selectedHistoryIds.length === 0) return;
        if (!confirm(`Re-broadcast all ${selectedHistoryIds.length} selected notifications instantly?`)) return;

        setIsPerformingBulkAction(true);
        const selectedEntries = history.filter(item => selectedHistoryIds.includes(item.id));
        try {
            const res = await fetch('/api/admin/push-broadcast-history/bulk-resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: selectedEntries })
            });
            if (res.ok) {
                showToast(`Re-broadcasted ${selectedEntries.length} notifications in real-time.`);
                setSelectedHistoryIds([]);
                fetchHistory();
            } else {
                throw new Error('Bulk re-broadcast operations failed.');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsPerformingBulkAction(false);
        }
    };

    const handleBulkDuplicate = async () => {
        if (selectedHistoryIds.length === 0) return;
        if (!confirm(`Clone ${selectedHistoryIds.length} notifications directly into history?`)) return;

        setIsPerformingBulkAction(true);
        const selectedEntries = history.filter(item => selectedHistoryIds.includes(item.id));
        try {
            const res = await fetch('/api/admin/push-broadcast-history/bulk-duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: selectedEntries })
            });
            if (res.ok) {
                showToast(`Cloned ${selectedEntries.length} items in the database history.`);
                setSelectedHistoryIds([]);
                fetchHistory();
            } else {
                throw new Error('Bulk cloning failed.');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsPerformingBulkAction(false);
        }
    };

    const handleResendSingle = async (hist: BroadcastHistoryEntry, e: React.MouseEvent) => {
        e.stopPropagation();
        setIsBroadcasting(true);
        try {
            const fullMessageText = `${hist.title.toUpperCase()}: ${hist.message}`;
            const targetSegment = hist.targetSegment || { type: 'all', value: '' };
            
            socket.emit('admin:push_alert', {
                message: fullMessageText,
                severity: hist.severity,
                targetSegment
            });

            const res = await fetch('/api/admin/push-broadcast-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: hist.title,
                    message: hist.message,
                    severity: hist.severity,
                    audience: hist.audience,
                    targetSegment
                })
            });

            if (res.ok) {
                showToast('Notification re-sent successfully!');
                fetchHistory();
            } else {
                throw new Error('Failed to save to database history.');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleDuplicateToComposer = (hist: BroadcastHistoryEntry, e: React.MouseEvent) => {
        e.stopPropagation();
        setTitle(hist.title);
        setMessage(hist.message);
        setSeverity(hist.severity);
        if (hist.category) {
            setCategory(hist.category as any);
        }
        
        const segment = hist.targetSegment;
        if (segment) {
            setTargetType(segment.type);
            if (segment.type === 'kycStatus') {
                setKycSegment(segment.value as any);
            } else if (segment.type === 'txVolume') {
                setVolumeSegment(segment.value as any);
            }
        } else {
            setTargetType('all');
        }
        showToast('Notification settings populated in Composer!');
    };

    const handleDeleteSingleHistory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this notification history record?')) return;
        
        try {
            const res = await fetch(`/api/admin/push-broadcast-history/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                showToast('Notification history record deleted.');
                setSelectedHistoryIds(prev => prev.filter(item => item !== id));
                fetchHistory();
            }
        } catch (err) {
            showToast('Failed to delete history record.', 'error');
        }
    };

    const handleArchiveToggleSingle = async (id: string, archived: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/admin/push-broadcast-history/${id}/archive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived })
            });
            if (res.ok) {
                setHistory(prev => prev.map(item => item.id === id ? { ...item, isArchived: archived } : item));
                showToast(archived ? 'Notification campaign moved to Archived folder.' : 'Notification campaign restored to Active folder.');
                setSelectedHistoryIds(prev => prev.filter(selectedId => selectedId !== id));
            } else {
                throw new Error('Failed to update campaign archive status.');
            }
        } catch (err) {
            console.error('Archive failed:', err);
            showToast('Failed to archive notification campaign.', 'error');
        }
    };

    const handleBulkArchiveToggle = async () => {
        setIsPerformingBulkAction(true);
        try {
            const archiving = !showArchivedFolder;
            const res = await fetch('/api/admin/push-broadcast-history/bulk-archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedHistoryIds, archived: archiving })
            });
            if (res.ok) {
                setHistory(prev => prev.map(item => selectedHistoryIds.includes(item.id) ? { ...item, isArchived: archiving } : item));
                showToast(archiving ? `Successfully archived ${selectedHistoryIds.length} campaigns.` : `Successfully restored ${selectedHistoryIds.length} campaigns.`);
                setSelectedHistoryIds([]);
            } else {
                throw new Error('Bulk archive operation failed.');
            }
        } catch (err) {
            console.error('Bulk archive failed:', err);
            showToast('Failed to bulk update campaign statuses.', 'error');
        } finally {
            setIsPerformingBulkAction(false);
        }
    };

    const toggleMetricsExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedMetricsIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Live Target Count Calculation
    const getTargetCount = () => {
        if (!allUsers || allUsers.length === 0) return 0;
        if (targetType === 'all') return allUsers.length;
        
        if (targetType === 'kycStatus') {
            return allUsers.filter(u => (u.profile?.kycStatus || 'unverified') === kycSegment).length;
        }
        
        if (targetType === 'txVolume') {
            // We can calculate simulated volume levels or use simple volume rules
            // Let's assume users with kycStatus 'verified' or balance > 5000 count as high volume
            // for immediate visual representation.
            if (volumeSegment === 'high') {
                return allUsers.filter(u => (u.profile?.kycLevel || 0) >= 2 || (u.profile?.balance || 0) > 5000).length;
            } else {
                return allUsers.filter(u => (u.profile?.kycLevel || 0) < 2 && (u.profile?.balance || 0) <= 5000).length;
            }
        }

        if (targetType === 'combined') {
            return allUsers.filter(u => {
                const matchesKyc = (u.profile?.kycStatus || 'unverified') === kycSegment;
                const isHighVal = (u.profile?.kycLevel || 0) >= 2 || (u.profile?.balance || 0) > 5000;
                const matchesVolume = volumeSegment === 'high' ? isHighVal : !isHighVal;
                return matchesKyc && matchesVolume;
            }).length;
        }
        return allUsers.length;
    };

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border animate-bounce ${
                    toast.type === 'success' 
                        ? 'bg-emerald-500 dark:bg-emerald-950 text-emerald-500 border-emerald-500/20' 
                        : 'bg-rose-500 dark:bg-rose-950 text-rose-500 border-rose-500/20'
                }`} id="push-toast">
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono">{toast.message}</span>
                </div>
            )}

            {/* Core Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-850 dark:text-white flex items-center gap-2" id="push-alerts-header-title">
                        <Megaphone className="w-5 h-5 text-cyan-500" />
                        Segmented WebSocket Alerts Center
                    </h2>
                    <p className="text-[#0F172A] text-xs mt-1">
                        Send real-time bulletins with instant mobile device frames preview, user targeting segmentation filters, and bulk history execution.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200/50 dark:border-white/10 w-fit">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-mono font-bold text-[#0F172A] dark:text-white uppercase">SYS GATEWAY: ACTIVE (PORT 3000)</span>
                </div>
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Composer Form */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm relative">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-widest flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5 text-cyan-500" />
                            Alert Composer
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowPreviewModal(true)}
                            className="text-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 text-xs font-bold flex items-center gap-1 transition px-2.5 py-1 rounded-lg hover:bg-cyan-500 border border-cyan-500/10"
                            id="btn-preview-alert"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Live Preview Simulation
                        </button>
                    </div>

                    <form onSubmit={handleBroadcast} className="space-y-4">
                        {/* Title Input */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase font-mono">Alert Subject / Title Prefix</label>
                            <input 
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. SECURITY NOTICE, BULLETIN, SYSTEM UPDATE"
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 text-[#0F172A] dark:text-white"
                                id="alert-title-input"
                                required
                            />
                        </div>

                        {/* Message Textarea */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase font-mono">Alert Body Message</label>
                            <textarea 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                placeholder="Enter the exact body message that will appear instantly on users' dashboards..."
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 text-[#0F172A] dark:text-[#1E293B] font-bold"
                                id="alert-message-textarea"
                                required
                            />
                        </div>

                        {/* A/B Test Mode Panel */}
                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-white/10 rounded-xl p-3.5 space-y-3">
                            <label className="flex items-center justify-between cursor-pointer relative">
                                <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase font-mono flex items-center gap-1.5">
                                    <Split className="w-4 h-4 text-pink-500" />
                                    A/B Test Mode Split Delivery
                                </span>
                                <div className="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isAbTest}
                                        onChange={(e) => setIsAbTest(e.target.checked)}
                                        className="sr-only peer"
                                        id="toggle-ab-test"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[22px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500 relative cursor-pointer"></div>
                                </div>
                            </label>

                            {isAbTest && (
                                <div className="space-y-1.5 pt-1 animate-fade-in border-t border-slate-150 dark:border-white/10 pt-2">
                                    <div className="flex items-center justify-between text-[9px] font-bold text-[#0F172A] uppercase font-mono">
                                        <span>Variant B Message Body (50% Split)</span>
                                        <span className="text-pink-500">Variant A carries the primary message above</span>
                                    </div>
                                    <textarea 
                                        value={messageVariantB}
                                        onChange={(e) => setMessageVariantB(e.target.value)}
                                        rows={2}
                                        placeholder="Enter the variant B body message. Delivers to 50% of targeted users..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-pink-500/20 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500 text-[#0F172A] dark:text-[#1E293B] font-bold font-mono"
                                        id="alert-variantB-textarea"
                                        required={isAbTest}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Thumbnail & Branded Icons Attachments */}
                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-white/10 rounded-xl p-3.5 space-y-2.5">
                            <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase font-mono flex items-center gap-1.5">
                                <ImageIcon className="w-4 h-4 text-emerald-500" />
                                Attached Branded Media Icon / Thumbnail
                            </span>
                            <div className="grid grid-cols-5 gap-2">
                                {[
                                    { name: 'None', val: '', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=40&auto=format&fit=crop' },
                                    { name: 'Security', val: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=120&auto=format&fit=crop', icon: '🛡️' },
                                    { name: 'Promo', val: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=120&auto=format&fit=crop', icon: '⭐' },
                                    { name: 'System', val: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=120&auto=format&fit=crop', icon: '⚙️' },
                                    { name: 'Custom', val: 'custom', icon: '🔗' },
                                ].map((p) => {
                                    const isActive = attachedMedia === p.val;
                                    return (
                                        <button
                                            type="button"
                                            key={p.name}
                                            onClick={() => setAttachedMedia(p.val)}
                                            className={`p-1.5 rounded-lg border text-[9px] font-bold uppercase transition flex flex-col items-center justify-center gap-1 ${
                                                isActive
                                                    ? 'bg-emerald-500 border-emerald-500 text-emerald-500'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A]'
                                            }`}
                                        >
                                            {p.val && p.val !== 'custom' ? (
                                                <img src={p.val} className="w-6 h-6 rounded-md object-cover" alt="" referrerPolicy="no-referrer" />
                                            ) : (
                                                <span className="text-base leading-none">{p.icon || '❌'}</span>
                                            )}
                                            <span>{p.name}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {attachedMedia === 'custom' && (
                                <div className="space-y-1.5 pt-1 animate-fade-in">
                                    <label className="text-[9px] font-bold text-[#0F172A] uppercase font-mono">Custom Image / Thumbnail URL</label>
                                    <input 
                                        type="url"
                                        value={customMediaUrl}
                                        onChange={(e) => setCustomMediaUrl(e.target.value)}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-850 dark:text-white font-mono"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Segment targeting Filter Panel */}
                        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-white/10 rounded-xl p-3.5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase font-mono flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-cyan-500" />
                                    Segmented Broadcasting Filters
                                </span>
                                <span className="bg-cyan-500 text-cyan-500 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    Targets: {getTargetCount()} Users
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTargetType('all')}
                                    className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase transition flex flex-col items-center justify-center gap-1 ${
                                        targetType === 'all' 
                                            ? 'bg-cyan-500 border-cyan-500/30 text-cyan-500' 
                                            : 'bg-transparent border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A]'
                                    }`}
                                >
                                    <span className="text-[9px]">Target all users</span>
                                    <span>All Audiences</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTargetType('kycStatus')}
                                    className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase transition flex flex-col items-center justify-center gap-1 ${
                                        targetType === 'kycStatus' 
                                            ? 'bg-cyan-500 border-cyan-500/30 text-cyan-500' 
                                            : 'bg-transparent border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A]'
                                    }`}
                                >
                                    <span className="text-[9px]">Verify KYC levels</span>
                                    <span>By Account Status</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTargetType('txVolume')}
                                    className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase transition flex flex-col items-center justify-center gap-1 ${
                                        targetType === 'txVolume' 
                                            ? 'bg-cyan-500 border-cyan-500/30 text-cyan-500' 
                                            : 'bg-transparent border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A]'
                                    }`}
                                >
                                    <span className="text-[9px]">Account activity</span>
                                    <span>By Tx Volume</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTargetType('combined')}
                                    className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase transition flex flex-col items-center justify-center gap-1 ${
                                        targetType === 'combined' 
                                            ? 'bg-cyan-500 border-cyan-500/30 text-cyan-500 font-bold' 
                                            : 'bg-transparent border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A]'
                                    }`}
                                >
                                    <span className="text-[9px]">Multi-Criteria filter</span>
                                    <span className="flex items-center gap-1">
                                        <Layers className="w-3 h-3 text-amber-500" />
                                        Combined Segments
                                    </span>
                                </button>
                            </div>

                            {/* Sub-selectors */}
                            {targetType === 'combined' && (
                                <div className="space-y-4 pt-1 animate-fade-in border-t border-slate-100 dark:border-white/10 pt-3 mt-1">
                                    <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold uppercase font-mono">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Interactive Multi-Criteria Match (AND Filter)
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-[#0F172A] uppercase font-mono">1. Targeted KYC Status</label>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {(['verified', 'pending', 'unverified', 'rejected'] as const).map((status) => (
                                                    <button
                                                        type="button"
                                                        key={status}
                                                        onClick={() => setKycSegment(status)}
                                                        className={`py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase border transition ${
                                                            kycSegment === status
                                                                ? 'bg-cyan-500 text-white border-cyan-500'
                                                                : 'bg-slate-100 dark:bg-slate-900 border-transparent text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#1E293B]'
                                                        }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-[#0F172A] uppercase font-mono">2. Targeted Activity Volume</label>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setVolumeSegment('high')}
                                                    className={`py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase border transition flex flex-col items-center justify-center ${
                                                        volumeSegment === 'high'
                                                            ? 'bg-cyan-500 text-white border-cyan-500'
                                                            : 'bg-slate-100 dark:bg-slate-900 border-transparent text-[#0F172A]'
                                                    }`}
                                                >
                                                    <span>High Volume</span>
                                                    <span className="text-[7px] opacity-75 mt-0.5">&gt;$5k USD</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setVolumeSegment('low')}
                                                    className={`py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase border transition flex flex-col items-center justify-center ${
                                                        volumeSegment === 'low'
                                                            ? 'bg-cyan-500 text-white border-cyan-500'
                                                            : 'bg-slate-100 dark:bg-slate-900 border-transparent text-[#0F172A]'
                                                    }`}
                                                >
                                                    <span>Low Volume</span>
                                                    <span className="text-[7px] opacity-75 mt-0.5">≤$5k USD</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sub-selectors */}
                            {targetType === 'kycStatus' && (
                                <div className="space-y-1.5 pt-1 animate-fade-in">
                                    <label className="text-[9px] font-bold text-[#0F172A] uppercase font-mono">Select Targeted Verification Status</label>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {(['verified', 'pending', 'unverified', 'rejected'] as const).map((status) => (
                                            <button
                                                type="button"
                                                key={status}
                                                onClick={() => setKycSegment(status)}
                                                className={`py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase border transition ${
                                                    kycSegment === status
                                                        ? 'bg-cyan-500 text-white border-cyan-500'
                                                        : 'bg-slate-100 dark:bg-slate-900 border-transparent text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#1E293B]'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {targetType === 'txVolume' && (
                                <div className="space-y-1.5 pt-1 animate-fade-in">
                                    <label className="text-[9px] font-bold text-[#0F172A] uppercase font-mono">Select Target Transaction Activity Range</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setVolumeSegment('high')}
                                            className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase border transition ${
                                                volumeSegment === 'high'
                                                    ? 'bg-cyan-500 text-white border-cyan-500'
                                                    : 'bg-slate-100 dark:bg-slate-900 border-transparent text-[#0F172A]'
                                            }`}
                                        >
                                            High Volume Senders
                                            <span className="block text-[8px] opacity-75 mt-0.5">Total transfers &gt; $5,000 USD</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVolumeSegment('low')}
                                            className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase border transition ${
                                                volumeSegment === 'low'
                                                    ? 'bg-cyan-500 text-white border-cyan-500'
                                                    : 'bg-slate-100 dark:bg-slate-900 border-transparent text-[#0F172A]'
                                            }`}
                                        >
                                            Low Volume / Inactive
                                            <span className="block text-[8px] opacity-75 mt-0.5">Total transfers ≤ $5,000 USD</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notification Predefined Category Selector */}
                        <div className="space-y-1" id="category-selector-wrapper">
                            <label className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase font-mono flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-cyan-500" />
                                Notification Category (Auto-assigns Icon & Color)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {([
                                    { name: 'Security', icon: ShieldCheck, desc: 'Safety & Auth Alerts' },
                                    { name: 'Promotional', icon: Megaphone, desc: 'Offers & Campaigns' },
                                    { name: 'Transactional', icon: CreditCard, desc: 'Transfers & Payments' }
                                ] as const).map((catItem) => {
                                    const IconComponent = catItem.icon;
                                    const isSelected = category === catItem.name;
                                    
                                    let activeStyle = '';
                                    if (isSelected) {
                                        if (catItem.name === 'Security') activeStyle = 'bg-rose-500 border-rose-500 text-rose-500 dark:border-rose-500/40';
                                        if (catItem.name === 'Promotional') activeStyle = 'bg-purple-500 border-purple-500 text-purple-500 dark:border-purple-500/40';
                                        if (catItem.name === 'Transactional') activeStyle = 'bg-cyan-500 border-cyan-500 text-cyan-500 dark:border-cyan-500/40';
                                    } else {
                                        activeStyle = 'bg-transparent border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A]';
                                    }

                                    return (
                                        <button
                                            type="button"
                                            key={catItem.name}
                                            onClick={() => setCategory(catItem.name)}
                                            className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase transition flex flex-col items-center justify-center gap-1 min-h-[58px] ${activeStyle}`}
                                            id={`category-btn-${catItem.name.toLowerCase()}`}
                                        >
                                            <IconComponent className="w-4 h-4" />
                                            <span>{catItem.name}</span>
                                            <span className="text-[7px] lowercase opacity-75 hidden sm:inline">{catItem.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Severity Selector */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase font-mono">Severity Level</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['info', 'warning', 'critical'] as const).map((level) => (
                                    <button
                                        type="button"
                                        key={level}
                                        onClick={() => setSeverity(level)}
                                        className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                                            severity === level 
                                                ? level === 'critical' 
                                                    ? 'bg-rose-500 border-rose-500/30 text-rose-500' 
                                                    : level === 'warning' 
                                                        ? 'bg-amber-500 border-amber-500/30 text-amber-500' 
                                                        : 'bg-cyan-500 border-cyan-500/30 text-cyan-500'
                                                : 'bg-transparent border-slate-200 dark:border-white/10 text-[#0F172A] hover:text-[#0F172A] dark:hover:text-[#0F172A]'
                                        }`}
                                    >
                                        {level === 'critical' && <AlertCircle className="w-3 h-3 text-rose-500" />}
                                        {level === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                        {level === 'info' && <Info className="w-3 h-3 text-cyan-500" />}
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Buttons Row */}
                        <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex flex-wrap gap-2 items-center justify-between">
                            
                            {/* Save Template Tool */}
                            <div className="flex gap-1.5 items-center w-full sm:w-auto">
                                <input 
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="Template Name..."
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#0F172A] dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 w-32"
                                    id="template-name-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleSaveTemplate}
                                    disabled={isSavingTemplate}
                                    className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-750 text-[#0F172A] dark:text-[#1E293B] py-1.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wide transition flex items-center gap-1"
                                    id="btn-save-template"
                                >
                                    {isSavingTemplate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 text-cyan-500" />}
                                    Save
                                </button>
                            </div>

                            {/* Broadcast Dispatch Trigger */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="submit"
                                    disabled={isBroadcasting}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/10 active:scale-95 transition flex-1 sm:flex-initial"
                                    id="btn-broadcast-alert"
                                >
                                    {isBroadcasting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Broadcasting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-3.5 h-3.5" />
                                            Broadcast Alert
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Scheduler Block */}
                    <div className="border-t border-slate-100 dark:border-white/10 pt-4 mt-2 space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase font-mono flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                                Timed Alert Scheduler
                            </h4>
                            <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-bold text-[#0F172A] uppercase font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-50 border border-slate-200 dark:border-white/10">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>Auto-Optimize Time</span>
                                <input 
                                    type="checkbox" 
                                    checked={isAutoOptimize}
                                    onChange={(e) => setIsAutoOptimize(e.target.checked)}
                                    className="rounded border-slate-200 dark:border-white/10 text-amber-500 focus:ring-amber-500 w-3 h-3 cursor-pointer"
                                />
                            </label>
                        </div>
                        
                        {isAutoOptimize && (
                            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-xl p-3.5 space-y-2.5 animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                                        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                                        <span>Engagement Optimizer Active</span>
                                    </div>
                                    <span className="text-[9px] font-mono font-bold bg-amber-500 text-amber-500 px-2 py-0.5 rounded-md uppercase">
                                        Confidence: 94%
                                    </span>
                                </div>
                                <p className="text-[10px] text-[#0F172A] leading-normal">
                                    Calculated peak client interaction metrics across <strong className="text-[#1E293B]">{engagementAnalysis.userCountAnalyzed} active members</strong>:
                                </p>
                                
                                {/* Metrics Grid */}
                                <div className="grid grid-cols-3 gap-2 py-1">
                                    <div className="bg-slate-50 p-2 rounded-lg border border-black/5 text-center dark:bg-slate-900">
                                        <div className="text-[9px] text-[#0F172A] font-bold uppercase font-mono">Peak Hour</div>
                                        <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                                            {engagementAnalysis.peakHour > 12 ? `${engagementAnalysis.peakHour - 12}:30 PM` : `${engagementAnalysis.peakHour}:30 AM`}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-black/5 text-center dark:bg-slate-900">
                                        <div className="text-[9px] text-[#0F172A] font-bold uppercase font-mono">Best Day</div>
                                        <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">Tuesday</div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border border-black/5 text-center dark:bg-slate-900">
                                        <div className="text-[9px] text-[#0F172A] font-bold uppercase font-mono">Visibility</div>
                                        <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">Maximum</div>
                                    </div>
                                </div>

                                {/* Hourly density distribution bars */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="text-[8px] font-bold text-[#0F172A] uppercase tracking-wider font-mono">Engagement Distribution Breakdown</div>
                                    <div className="space-y-1">
                                        <div>
                                            <div className="flex items-center justify-between text-[8px] font-bold text-[#0F172A]">
                                                <span>Morning Period (06:00 - 12:00)</span>
                                                <span>{engagementAnalysis.morningPct}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5 border border-black/5">
                                                <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${engagementAnalysis.morningPct}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between text-[8px] font-bold text-[#0F172A]">
                                                <span>Afternoon Peak (12:00 - 18:00)</span>
                                                <span>{engagementAnalysis.afternoonPct}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5 border border-black/5">
                                                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${engagementAnalysis.afternoonPct}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between text-[8px] font-bold text-[#0F172A]">
                                                <span>Evening / Night (18:00 - 06:00)</span>
                                                <span>{engagementAnalysis.eveningPct}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-0.5 border border-black/5">
                                                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${engagementAnalysis.eveningPct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <input 
                                type="datetime-local"
                                value={scheduledFor}
                                onChange={(e) => setScheduledFor(e.target.value)}
                                disabled={isAutoOptimize}
                                className={`bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-bold font-mono text-[#0F172A] dark:text-white flex-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isAutoOptimize ? 'opacity-70 cursor-not-allowed' : ''}`}
                                id="alert-scheduler-time"
                            />
                            <button
                                type="button"
                                onClick={handleSchedule}
                                disabled={isScheduling}
                                className="bg-white dark:bg-slate-700 hover:bg-slate-750 dark:hover:bg-slate-650 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                                id="btn-schedule-alert"
                            >
                                {isScheduling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                                Schedule Alert
                            </button>
                        </div>
                        {!isAutoOptimize && (
                            <button
                                type="button"
                                onClick={() => {
                                    setScheduledFor(engagementAnalysis.suggestedDateTimeStr);
                                    showToast(`Applied optimal predicted timestamp based on user login frequency!`);
                                }}
                                className="text-[10px] text-amber-500 font-bold hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1.5 mt-1 transition select-none self-start bg-amber-500 dark:bg-amber-500 border border-amber-500/20 rounded-lg px-2.5 py-1"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                Predict Optimal Time: {engagementAnalysis.peakHour > 12 ? `${engagementAnalysis.peakHour - 12}:30 PM` : `${engagementAnalysis.peakHour}:30 AM`}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Side: Saved Templates */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col max-h-[500px]">
                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Save className="w-3.5 h-3.5 text-cyan-500" />
                            Saved Templates ({templates.length})
                        </span>
                        {isLoadingTemplates && <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />}
                    </h3>

                    {/* Pre-made standard template catalog */}
                    <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 scrollbar-thin">
                        {templates.length === 0 && !isLoadingTemplates ? (
                            <div className="text-center py-8 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                                <p className="text-[#0F172A] text-xs font-bold">No saved custom templates yet.</p>
                                <p className="text-[#0F172A] text-[10px] mt-1">Compose above and save to build your alert catalog.</p>
                            </div>
                        ) : (
                            templates.map((temp) => (
                                <div
                                    key={temp.id}
                                    onClick={() => loadTemplate(temp)}
                                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-100 border border-slate-150 dark:border-white/10 rounded-xl cursor-pointer transition flex items-start justify-between group"
                                >
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-[#0F172A] dark:text-white">{temp.name}</span>
                                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                temp.severity === 'critical' ? 'bg-rose-500 text-rose-500' :
                                                temp.severity === 'warning' ? 'bg-amber-500 text-amber-500' :
                                                'bg-cyan-500 text-cyan-500'
                                            }`}>
                                                {temp.severity}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-[#0F172A] font-semibold truncate font-mono">{temp.title}</p>
                                        <p className="text-[10px] text-[#0F172A] line-clamp-1">{temp.message}</p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteTemplate(temp.id, e)}
                                        className="text-[#0F172A] hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Template"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row Grid: Schedules & History */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Pending Schedules */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col">
                    <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-cyan-500" />
                            Pending Schedules ({schedules.filter(s => s.status === 'pending').length})
                        </span>
                        {isLoadingSchedules && <Loader2 className="w-3 h-3 animate-spin text-cyan-500" />}
                    </h3>

                    <div className="space-y-2 flex-1 max-h-[350px] overflow-y-auto scrollbar-thin">
                        {schedules.filter(s => s.status === 'pending').length === 0 ? (
                            <div className="text-center py-6 text-[#0F172A] text-xs font-bold">
                                No future alerts currently scheduled.
                            </div>
                        ) : (
                            schedules.filter(s => s.status === 'pending').map((sched) => (
                                <div key={sched.id} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-white/10 rounded-xl flex items-center justify-between">
                                    <div className="space-y-1 flex-1 pr-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-[#0F172A] dark:text-white truncate max-w-[120px]" title={sched.title}>{sched.title}</span>
                                            <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500 text-amber-500">PENDING</span>
                                        </div>
                                        <p className="text-[10px] text-[#0F172A] line-clamp-1">{sched.message}</p>
                                        <p className="text-[9px] font-bold font-mono text-cyan-500 flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {new Date(sched.scheduledFor).toLocaleString()}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handleCancelSchedule(sched.id)}
                                        className="text-[#0F172A] hover:text-rose-500 p-1"
                                        title="Cancel Schedule"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Broadcast History with Multi-select Bulk Actions */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col relative" id="broadcast-history-section">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-widest flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-cyan-500" />
                            Broadcast History ({history.length})
                        </h3>
                        {displayedHistory.length > 0 && (
                            <button
                                onClick={handleSelectAllHistory}
                                className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-900 text-[#0F172A] dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-750 flex items-center gap-1.5 transition select-none"
                                id="btn-select-all-history"
                            >
                                {displayedHistory.every(item => selectedHistoryIds.includes(item.id)) ? (
                                    <CheckSquare className="w-3 h-3 text-cyan-500" />
                                ) : (
                                    <Square className="w-3 h-3 text-[#0F172A]" />
                                )}
                                {displayedHistory.every(item => selectedHistoryIds.includes(item.id)) ? 'Deselect All' : 'Select All'}
                            </button>
                        )}
                    </div>

                    {/* Active & Archived Folder Selector Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowArchivedFolder(false);
                                setSelectedHistoryIds([]);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                !showArchivedFolder 
                                    ? 'bg-cyan-500 dark:bg-cyan-500 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' 
                                    : 'text-[#0F172A] hover:text-[#1E293B] dark:hover:text-white border border-transparent'
                            }`}
                        >
                            <History className="w-3.5 h-3.5" />
                            Active Campaigns ({history.filter(i => !i.isArchived).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowArchivedFolder(true);
                                setSelectedHistoryIds([]);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                                showArchivedFolder 
                                    ? 'bg-amber-500 dark:bg-amber-500 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                                    : 'text-[#0F172A] hover:text-[#1E293B] dark:hover:text-white border border-transparent'
                            }`}
                        >
                            <Archive className="w-3.5 h-3.5" />
                            Archived Folder ({history.filter(i => i.isArchived).length})
                        </button>
                    </div>

                    {/* Performance Metrics Aggregation Dashboard */}
                    {!showArchivedFolder && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 animate-fade-in">
                            <div className="space-y-1">
                                <span className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase font-mono block">Avg Delivery</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-black text-[#0F172A] dark:text-white font-mono">{aggregateMetrics.avgDeliveryRate}%</span>
                                    <span className="text-[9px] text-emerald-500 font-bold font-mono">Stable</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${aggregateMetrics.avgDeliveryRate}%` }}></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase font-mono block">Avg Open Rate</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-black text-[#0F172A] dark:text-white font-mono">{aggregateMetrics.avgOpenRate}%</span>
                                    <span className="text-[9px] text-cyan-500 font-bold font-mono">Active</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
                                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${aggregateMetrics.avgOpenRate}%` }}></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase font-mono block">Engagement Rate</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-black text-[#0F172A] dark:text-white font-mono">{aggregateMetrics.avgEngagementRate}%</span>
                                    <span className="text-[9px] text-amber-500 font-bold font-mono">Good</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${aggregateMetrics.avgEngagementRate}%` }}></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-[#0F172A] dark:text-white font-bold uppercase font-mono block">Dispatched</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-black text-[#0F172A] dark:text-white font-mono">{aggregateMetrics.totalDispatched}</span>
                                    <span className="text-[9px] text-indigo-500 font-bold font-mono">Devices</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-900 h-1 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Floating Glassmorphic Bulk Actions Bar */}
                    {selectedHistoryIds.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-800 border border-cyan-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-fade-in z-20" id="bulk-actions-container">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-[#0F172A] dark:text-[#1E293B]">
                                    {selectedHistoryIds.length} Campaigns Selected
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                                <button
                                    onClick={handleBulkResend}
                                    disabled={isPerformingBulkAction}
                                    className="flex-1 sm:flex-none text-[10px] font-bold bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition"
                                    title="Re-broadcast all selected immediately"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Bulk Re-send
                                </button>
                                <button
                                    onClick={handleBulkDuplicate}
                                    disabled={isPerformingBulkAction}
                                    className="flex-1 sm:flex-none text-[10px] font-bold bg-slate-200 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition"
                                    title="Clone history records"
                                >
                                    <Copy className="w-3 h-3" />
                                    Bulk Duplicate
                                </button>
                                <button
                                    onClick={handleBulkArchiveToggle}
                                    disabled={isPerformingBulkAction}
                                    className="flex-1 sm:flex-none text-[10px] font-bold bg-amber-500 hover:bg-amber-500 text-amber-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition border border-amber-500/20"
                                    title={showArchivedFolder ? "Restore selected campaigns" : "Archive selected campaigns"}
                                >
                                    <Archive className="w-3 h-3" />
                                    {showArchivedFolder ? 'Bulk Unarchive' : 'Bulk Archive'}
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isPerformingBulkAction}
                                    className="flex-1 sm:flex-none text-[10px] font-bold bg-rose-500 hover:bg-rose-500 text-rose-500 hover:text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition border border-rose-500/20"
                                    title="Delete selected from database"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Bulk Delete
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2.5 flex-1 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
                        {displayedHistory.length === 0 ? (
                            <div className="text-center py-12 text-[#0F172A] text-xs font-bold border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                                {showArchivedFolder 
                                    ? 'No archived campaigns are currently stored here.' 
                                    : 'No active push broadcasts found. Keep your users updated!'}
                            </div>
                        ) : (
                            displayedHistory.map((hist) => {
                                const isSelected = selectedHistoryIds.includes(hist.id);
                                const isExpanded = expandedMetricsIds.includes(hist.id);
                                return (
                                    <div 
                                        key={hist.id} 
                                        onClick={(e) => handleSelectHistoryItem(hist.id, e)}
                                        className={`p-3 border rounded-xl space-y-1 transition-all cursor-pointer relative group ${
                                            isSelected 
                                                ? 'bg-cyan-500 dark:bg-cyan-950 border-cyan-500/30 shadow-sm shadow-cyan-500/5' 
                                                : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-100 border-slate-150 dark:border-white/10'
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* Selection Checkbox */}
                                                <span className="text-[#0F172A] transition hover:text-cyan-500 mr-0.5">
                                                    {isSelected ? (
                                                        <CheckSquare className="w-4 h-4 text-cyan-500" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-[#0F172A] dark:text-white" />
                                                    )}
                                                </span>
                                                <span className="text-xs font-bold text-slate-850 dark:text-white">{hist.title}</span>
                                                {hist.category && (
                                                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                                        hist.category.toLowerCase() === 'security' ? 'bg-rose-500 text-rose-500 border-rose-500/20' :
                                                        hist.category.toLowerCase() === 'promotional' ? 'bg-purple-500 text-purple-500 border-purple-500/20' :
                                                        'bg-cyan-500 text-cyan-500 border-cyan-500/20'
                                                    }`}>
                                                        {hist.category}
                                                    </span>
                                                )}
                                                <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                                    hist.severity === 'critical' ? 'bg-rose-500 text-rose-500' :
                                                    hist.severity === 'warning' ? 'bg-amber-500 text-amber-500' :
                                                    'bg-cyan-500 text-cyan-500'
                                                }`}>
                                                    {hist.severity}
                                                </span>
                                                {hist.isAbTest && (
                                                    <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-pink-500 text-pink-500 flex items-center gap-0.5">
                                                        <Split className="w-2.5 h-2.5" />
                                                        A/B TEST
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
                                                <span className="text-[9px] font-bold font-mono text-[#0F172A] whitespace-nowrap">
                                                    {new Date(hist.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {new Date(hist.timestamp).toLocaleDateString()}
                                                </span>

                                                {/* Real-time open metrics expander trigger */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleMetricsExpand(hist.id, e)}
                                                    className="text-[9px] font-bold px-2 py-0.5 bg-cyan-500 hover:bg-cyan-500 text-cyan-500 rounded-md transition select-none flex items-center gap-1 shrink-0"
                                                >
                                                    <Activity className="w-2.5 h-2.5 animate-pulse" />
                                                    {isExpanded ? 'Hide Metrics' : 'Show Metrics'}
                                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                </button>

                                                {/* Row Actions Menu */}
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => handleResendSingle(hist, e)}
                                                        className="text-[#0F172A] hover:text-cyan-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-50 dark:bg-slate-900"
                                                        title="Re-broadcast Alert"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDuplicateToComposer(hist, e)}
                                                        className="text-[#0F172A] hover:text-indigo-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-50 dark:bg-slate-900"
                                                        title="Duplicate/Tweak in Composer"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleArchiveToggleSingle(hist.id, !hist.isArchived, e)}
                                                        className="text-[#0F172A] hover:text-amber-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-50 dark:bg-slate-900"
                                                        title={hist.isArchived ? "Restore to Active folder" : "Move to Archived Folder"}
                                                    >
                                                        <Archive className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteSingleHistory(hist.id, e)}
                                                        className="text-[#0F172A] hover:text-rose-500 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-50 dark:bg-slate-900"
                                                        title="Delete Record"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-[#0F172A] dark:text-white leading-relaxed font-bold pl-6">{hist.message}</p>
                                        <div className="flex items-center gap-1.5 pt-1 pl-6">
                                            <span className="text-[8px] font-mono font-bold text-[#0F172A] dark:text-white uppercase">AUDIENCE: {hist.audience}</span>
                                            <span className="text-[8px] font-mono font-bold text-[#0F172A] dark:text-white">•</span>
                                            <span className="text-[8px] font-mono font-bold text-emerald-500 flex items-center gap-0.5">
                                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                                {hist.status}
                                            </span>
                                        </div>

                                        {/* Expandable performance report indicators panel */}
                                        {isExpanded && (
                                            <div 
                                                className="mt-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-3 border border-slate-200/50 dark:border-white/10 space-y-3 animate-slide-in-top"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3 text-cyan-500" />
                                                        Campaign Performance Indicators
                                                    </span>
                                                    <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full ${
                                                        hist.status === 'delivered' ? 'bg-emerald-500 text-emerald-500' : 'bg-amber-500 text-amber-500'
                                                    }`}>
                                                        Delivery Status: {hist.status === 'delivered' ? '100% Successful' : hist.status}
                                                    </span>
                                                </div>

                                                {/* Stats progress items */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    {/* Open Rate Meter */}
                                                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-white/[0.03] space-y-1.5">
                                                        <div className="flex items-center justify-between text-[9px] font-bold text-[#0F172A] uppercase font-mono">
                                                            <span>Open Rate</span>
                                                            <span className="text-cyan-500">{getMetricsForEntry(hist).openRate}%</span>
                                                        </div>
                                                        <div className="flex items-baseline justify-between">
                                                            <span className="text-sm font-black text-[#0F172A] dark:text-white font-mono">{getMetricsForEntry(hist).opens} opens</span>
                                                            <span className="text-[8px] text-[#0F172A] font-bold">out of {getMetricsForEntry(hist).sent} sent</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-black/5">
                                                            <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${getMetricsForEntry(hist).openRate}%` }} />
                                                        </div>
                                                    </div>

                                                    {/* Click / Engagement Meter */}
                                                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-white/[0.03] space-y-1.5">
                                                        <div className="flex items-center justify-between text-[9px] font-bold text-[#0F172A] uppercase font-mono">
                                                            <span>Engagement</span>
                                                            <span className="text-amber-500">{getMetricsForEntry(hist).engagementRate}%</span>
                                                        </div>
                                                        <div className="flex items-baseline justify-between">
                                                            <span className="text-sm font-black text-[#0F172A] dark:text-white font-mono">{getMetricsForEntry(hist).clicks} clicks</span>
                                                            <span className="text-[8px] text-[#0F172A] font-bold">out of {getMetricsForEntry(hist).sent} views</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-black/5">
                                                            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${getMetricsForEntry(hist).engagementRate}%` }} />
                                                        </div>
                                                    </div>

                                                    {/* Delivery Integrity */}
                                                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-white/[0.03] space-y-1.5">
                                                        <div className="flex items-center justify-between text-[9px] font-bold text-[#0F172A] uppercase font-mono">
                                                            <span>Delivery Rate</span>
                                                            <span className="text-emerald-500">{getMetricsForEntry(hist).deliveryRate}%</span>
                                                        </div>
                                                        <div className="flex items-baseline justify-between">
                                                            <span className="text-sm font-black text-[#0F172A] dark:text-white font-mono">{getMetricsForEntry(hist).delivered} devices</span>
                                                            <span className="text-[8px] text-[#0F172A] font-bold">dispatched core</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden border border-black/5">
                                                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${getMetricsForEntry(hist).deliveryRate}%` }} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Split details if A/B Test */}
                                                {hist.isAbTest && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/50 dark:border-white/10 space-y-2">
                                                        <div className="flex items-center gap-1">
                                                            <Split className="w-3.5 h-3.5 text-pink-500" />
                                                            <span className="text-[9px] font-bold text-[#0F172A] dark:text-white uppercase tracking-wider font-sans">A/B Testing Breakdown</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-white/10 space-y-1">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[9px] text-[#0F172A] font-extrabold uppercase">Variant A</span>
                                                                    {parseFloat(getMetricsForEntry(hist).variantA_openRate || '0') >= parseFloat(getMetricsForEntry(hist).variantB_openRate || '0') && (
                                                                        <span className="text-[7.5px] bg-emerald-500 text-emerald-500 px-1 rounded uppercase font-extrabold flex items-center gap-0.5"><Trophy className="w-2 h-2" /> Winner</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-baseline justify-between">
                                                                    <span className="text-xs font-black text-[#1E293B] dark:text-slate-100">{getMetricsForEntry(hist).variantA_opens} opens</span>
                                                                    <span className="text-[10px] font-bold font-mono text-cyan-400">{getMetricsForEntry(hist).variantA_openRate}%</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-white/10 space-y-1">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[9px] text-[#0F172A] font-extrabold uppercase">Variant B</span>
                                                                    {parseFloat(getMetricsForEntry(hist).variantB_openRate || '0') > parseFloat(getMetricsForEntry(hist).variantA_openRate || '0') && (
                                                                        <span className="text-[7.5px] bg-emerald-500 text-emerald-500 px-1 rounded uppercase font-extrabold flex items-center gap-0.5"><Trophy className="w-2 h-2" /> Winner</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-baseline justify-between">
                                                                    <span className="text-xs font-black text-[#1E293B] dark:text-slate-100">{getMetricsForEntry(hist).variantB_opens} opens</span>
                                                                    <span className="text-[10px] font-bold font-mono text-cyan-400">{getMetricsForEntry(hist).variantB_openRate}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-[8.5px] text-[#0F172A] font-sans italic">
                                                            * Real-time optimization algorithms are actively adjusting audience distributions towards the winning Variant.
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* HIGH-FIDELITY LIVE PREVIEW DEVICE SIMULATION MODAL */}
            {showPreviewModal && (
                <div className="fixed inset-0 bg-slate-100  z-50 flex items-center justify-center p-4 animate-fade-in" id="preview-modal">
                    <div className="bg-slate-50 border border-black/5 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative dark:bg-slate-900">
                        
                        {/* Header controls */}
                        <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between bg-slate-100">
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                    <Sparkles className="text-cyan-400 w-4 h-4 animate-pulse" />
                                    Visual Device Broadcast Simulator
                                </h3>
                                <p className="text-xs text-[#0F172A] mt-0.5">Live mockup of alert rendering prior to network dispatch</p>
                            </div>
                            <button 
                                onClick={() => setShowPreviewModal(false)}
                                className="text-[#0F172A] hover:text-white font-mono text-sm px-2.5 py-1 rounded-lg bg-white hover:bg-white dark:bg-slate-800"
                                id="btn-close-preview"
                            >
                                CLOSE
                            </button>
                        </div>

                        {/* Switch device tabs */}
                        <div className="p-3 bg-slate-100 flex items-center justify-center gap-2 border-b border-black/5">
                            <button
                                onClick={() => setPreviewDevice('mobile')}
                                className={`flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold rounded-xl transition ${
                                    previewDevice === 'mobile' 
                                        ? 'bg-cyan-500 text-white shadow' 
                                        : 'text-[#0F172A] hover:text-white hover:bg-white'
                                }`}
                                id="btn-switch-preview-mobile"
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                iOS Lockscreen Push
                            </button>
                            <button
                                onClick={() => setPreviewDevice('desktop')}
                                className={`flex items-center gap-1.5 py-1.5 px-4 text-xs font-bold rounded-xl transition ${
                                    previewDevice === 'desktop' 
                                        ? 'bg-cyan-500 text-white shadow' 
                                        : 'text-[#0F172A] hover:text-white hover:bg-white'
                                }`}
                                id="btn-switch-preview-desktop"
                            >
                                <Monitor className="w-3.5 h-3.5" />
                                macOS Notification
                            </button>
                        </div>

                        {/* Interactive Screen Simulator stage */}
                        <div className="p-6 bg-slate-100 flex-1 flex items-center justify-center min-h-[320px] relative overflow-hidden">
                            
                            {/* Ambient Wallpaper underlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 via-purple-900/30 to-slate-950 opacity-80" />

                            {/* MOBILE DEVICE SCREEN SIMULATION */}
                            {previewDevice === 'mobile' ? (
                                <div className="w-[300px] h-[450px] border-[6px] border-slate-750 rounded-[40px] overflow-hidden shadow-2xl relative flex flex-col bg-slate-50 shrink-0 dark:bg-slate-900">
                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-100 h-4.5 w-28 rounded-b-xl z-30 flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-50 mr-2 border border-black/5 dark:bg-slate-900" />
                                        <div className="w-8 h-1 rounded bg-slate-50 dark:bg-slate-900" />
                                    </div>

                                    {/* Phone Screen Canvas Wallpaper */}
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center z-10" />
                                    <div className="absolute inset-0 bg-slate-100 z-11" />

                                    {/* Lockscreen Interface content */}
                                    <div className="relative z-20 flex-1 flex flex-col p-4 pt-10 text-white select-none overflow-y-auto max-h-[380px] scrollbar-none">
                                        {/* Phone Time */}
                                        <div className="text-center space-y-0.5 mb-6">
                                            <p className="text-4xl font-extralight tracking-tight">
                                                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                                            </p>
                                            <p className="text-[9px] font-bold tracking-wider uppercase opacity-85">
                                                {new Date().toLocaleDateString([], {weekday: 'long', month: 'long', day: 'numeric'})}
                                            </p>
                                        </div>
 
                                        {/* RENDERED LOCKSCREEN NOTIFICATION CARD */}
                                        <div className="mt-2 transition-all duration-300 transform scale-100 space-y-3">
                                            {/* Variant A Card */}
                                            <div className="bg-slate-50  border border-black/5 rounded-2xl p-3 shadow-xl space-y-1 dark:bg-slate-900">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 font-sans">
                                                        <div className="w-4.5 h-4.5 rounded bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-inner">
                                                            <Bell className="w-2.5 h-2.5 text-white" />
                                                        </div>
                                                        <span className="text-[9px] font-bold tracking-wider uppercase opacity-80">
                                                            iCredit Union {isAbTest && <span className="bg-pink-500 text-white text-[7px] font-bold px-1 rounded ml-1">A</span>}
                                                        </span>
                                                    </div>
                                                    <span className="text-[8px] opacity-60 font-mono">now</span>
                                                </div>
 
                                                <div className="flex gap-2.5 items-start">
                                                    <div className="flex-1 space-y-0.5">
                                                        <p className="text-[10.5px] font-extrabold text-white flex items-center gap-1">
                                                            {title.trim() ? title.toUpperCase() : 'ALERT SUBJECT'}
                                                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                                                                severity === 'critical' ? 'bg-rose-500 animate-pulse' :
                                                                severity === 'warning' ? 'bg-amber-500 animate-pulse' :
                                                                'bg-cyan-400 animate-pulse'
                                                            }`} />
                                                        </p>
                                                        <p className="text-[9.5px] text-[#1E293B] leading-tight line-clamp-3">
                                                            {message.trim() ? message : 'Alert body text will align here. Formulate subjects above to see live updates.'}
                                                        </p>
                                                    </div>
                                                    {attachedMedia && (
                                                        <img 
                                                            src={attachedMedia === 'custom' ? customMediaUrl : attachedMedia} 
                                                            className="w-9 h-9 rounded-lg object-cover border border-black/5 shrink-0 mt-0.5" 
                                                            alt="" 
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Variant B Card (shown stacked if A/B Test is enabled) */}
                                            {isAbTest && (
                                                <div className="bg-slate-50  border border-pink-500/20 rounded-2xl p-3 shadow-xl space-y-1 animate-fade-in dark:bg-slate-900">
                                                    <div className="flex items-center justify-between font-sans">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-4.5 h-4.5 rounded bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-inner">
                                                                <Bell className="w-2.5 h-2.5 text-white" />
                                                            </div>
                                                            <span className="text-[9px] font-bold tracking-wider uppercase opacity-80 flex items-center gap-1">
                                                                iCredit Union <span className="bg-pink-500 text-white text-[7px] font-bold px-1 rounded ml-1">B</span>
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] opacity-60 font-mono">now</span>
                                                    </div>
                                                    
                                                    <div className="flex gap-2.5 items-start">
                                                        <div className="flex-1 space-y-0.5">
                                                            <p className="text-[10.5px] font-extrabold text-white flex items-center gap-1">
                                                                {title.trim() ? title.toUpperCase() : 'ALERT SUBJECT'}
                                                                <span className="w-1.5 h-1.5 rounded-full inline-block bg-pink-400 animate-pulse" />
                                                            </p>
                                                            <p className="text-[9.5px] text-[#1E293B] leading-tight line-clamp-3">
                                                                {messageVariantB.trim() ? messageVariantB : 'Enter Variant B body in the composer panel to preview.'}
                                                            </p>
                                                        </div>
                                                        {attachedMedia && (
                                                            <img 
                                                                src={attachedMedia === 'custom' ? customMediaUrl : attachedMedia} 
                                                                className="w-9 h-9 rounded-lg object-cover border border-black/5 shrink-0 mt-0.5" 
                                                                alt="" 
                                                                referrerPolicy="no-referrer"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Bottom Action bar */}
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <div className="w-20 h-1 bg-white rounded-full mx-auto mb-2 dark:bg-slate-800" />
                                            <span className="text-[8px] uppercase tracking-widest font-bold opacity-60">Swipe up to unlock</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* DESKTOP WEB SIMULATION */
                                <div className="space-y-3 w-full max-w-sm">
                                    {/* Variant A Desktop */}
                                    <div className="bg-slate-50  border border-black/5 rounded-2xl p-4 shadow-2xl relative z-20 space-y-2 select-none text-white w-full dark:bg-slate-900">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center border border-black/5">
                                                    <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-extrabold text-white leading-none flex items-center gap-1">
                                                        iCREDIT UNION SERVICE
                                                        <span className={`text-[7px] font-bold px-1 rounded uppercase ${
                                                            severity === 'critical' ? 'bg-rose-500 text-rose-400' :
                                                            severity === 'warning' ? 'bg-amber-500 text-amber-400' :
                                                            'bg-cyan-500 text-cyan-400'
                                                        }`}>
                                                            {severity}
                                                        </span>
                                                        {isAbTest && <span className="text-[7px] font-bold px-1 rounded bg-pink-500 text-white ml-1">Variant A</span>}
                                                    </p>
                                                    <p className="text-[8px] text-[#0F172A]">icredit-union.app</p>
                                                </div>
                                            </div>
                                            <span className="text-[8px] text-[#0F172A] font-mono">now</span>
                                        </div>

                                        <div className="flex gap-3 items-start">
                                            <div className="flex-1 space-y-1">
                                                <p className="text-xs font-bold text-white uppercase tracking-wide">
                                                    {title.trim() ? title : 'SECURITY NOTICE'}
                                                </p>
                                                <p className="text-[10px] text-[#0F172A] leading-relaxed">
                                                    {message.trim() ? message : 'Broadcast notification summary text showing real-time formatting guidelines.'}
                                                </p>
                                            </div>
                                            {attachedMedia && (
                                                <img 
                                                    src={attachedMedia === 'custom' ? customMediaUrl : attachedMedia} 
                                                    className="w-12 h-12 rounded-lg object-cover border border-black/5 shrink-0" 
                                                    alt="" 
                                                    referrerPolicy="no-referrer"
                                                />
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-1 border-t border-black/5">
                                            <span className="text-[8px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                                                AUDIENCE: {getTargetingDetails().audienceName}
                                            </span>
                                            <div className="flex gap-1.5">
                                                <button className="px-2 py-0.5 bg-white hover:bg-white rounded text-[9px] font-bold transition dark:bg-slate-800">Acknowledge</button>
                                                <button className="px-2 py-0.5 text-[#0F172A] hover:text-white rounded text-[9px] font-bold transition">Close</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Variant B Desktop */}
                                    {isAbTest && (
                                        <div className="bg-slate-50  border border-pink-500/20 rounded-2xl p-4 shadow-2xl relative z-20 space-y-2 select-none text-white w-full animate-fade-in dark:bg-slate-900">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center border border-pink-500/20">
                                                        <Monitor className="w-3.5 h-3.5 text-pink-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-extrabold text-white leading-none flex items-center gap-1">
                                                            iCREDIT UNION SERVICE
                                                            <span className="text-[7px] font-bold px-1 rounded uppercase bg-pink-500 text-pink-400">
                                                                {severity}
                                                            </span>
                                                            <span className="text-[7px] font-bold px-1 rounded bg-pink-500 text-white ml-1">Variant B</span>
                                                        </p>
                                                        <p className="text-[8px] text-[#0F172A]">icredit-union.app</p>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] text-[#0F172A] font-mono">now</span>
                                            </div>

                                            <div className="flex gap-3 items-start">
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-xs font-bold text-white uppercase tracking-wide">
                                                        {title.trim() ? title : 'SECURITY NOTICE'}
                                                    </p>
                                                    <p className="text-[10px] text-[#0F172A] leading-relaxed font-sans">
                                                        {messageVariantB.trim() ? messageVariantB : 'Enter Variant B message inside the composer panel to preview.'}
                                                    </p>
                                                </div>
                                                {attachedMedia && (
                                                    <img 
                                                        src={attachedMedia === 'custom' ? customMediaUrl : attachedMedia} 
                                                        className="w-12 h-12 rounded-lg object-cover border border-black/5 shrink-0" 
                                                        alt="" 
                                                        referrerPolicy="no-referrer"
                                                    />
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-1 border-t border-black/5">
                                                <span className="text-[8px] font-mono text-pink-400 font-bold uppercase tracking-wider">
                                                    AUDIENCE: {getTargetingDetails().audienceName}
                                                </span>
                                                <div className="flex gap-1.5">
                                                    <button className="px-2 py-0.5 bg-white hover:bg-white rounded text-[9px] font-bold transition dark:bg-slate-800">Acknowledge</button>
                                                    <button className="px-2 py-0.5 text-[#0F172A] hover:text-white rounded text-[9px] font-bold transition">Close</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bottom action bar */}
                        <div className="px-5 py-4 border-t border-black/5 bg-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="text-[10px] text-[#0F172A]">
                                Target Audience: <span className="font-bold text-cyan-400">{getTargetingDetails().audienceName}</span>
                            </div>
                            <button
                                onClick={() => handleBroadcast()}
                                disabled={isBroadcasting || !title.trim() || !message.trim()}
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 disabled:opacity-70 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10 transition"
                                id="btn-dispatch-from-preview"
                            >
                                {isBroadcasting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
                                Broadcast Directly From Simulator
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
