'use client';

import { useState, useEffect } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebaseConfig";

interface Task {
    id: string;
    description: string;
    status: 'completed' | 'in-progress' | 'pending';
    timeAgo?: string;
    dueDate?: string;
}

interface Activity {
    id: string;
    description: string;
    timeAgo: string;
    status: 'completed' | 'in-progress' | 'pending';
}

const getStatusColor = (status: Activity['status']) => {
    switch (status) {
        case 'completed':
            return 'bg-blue-100 text-blue-800';
        case 'in-progress':
            return 'bg-red-100 text-red-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getStatusText = (status: Activity['status']) => {
    switch (status) {
        case 'completed':
            return 'Completed';
        case 'in-progress':
            return 'In-progress';
        case 'pending':
            return 'Pending';
        default:
            return 'Unknown';
    }
};

export default function RecentActivities({ activities: initialActivities }: { activities: Activity[] }) {
    const [activities, setActivities] = useState<Activity[]>(initialActivities);

    useEffect(() => {
        const activitiesRef = ref(db(), 'tasks');
        const unsubscribe = onValue(activitiesRef, (snapshot) => {
            const tasksData = snapshot.val();
            const fetchedActivities = tasksData
                ? (Object.values(tasksData) as Task[]).map((task: Task) => ({
                    id: task.id,
                    description: task.description,
                    status: task.status,
                    timeAgo: task.timeAgo || calculateTimeAgo(task.dueDate || ''), // Fallback to calculated timeAgo
                }))
                : [];
            // Limit to 5 most recent activities based on timeAgo
            const recentActivities = fetchedActivities
                .sort((a, b) => {
                    const timeA = parseTimeAgo(a.timeAgo);
                    const timeB = parseTimeAgo(b.timeAgo);
                    return timeB - timeA; // Sort descending (most recent first)
                })
                .slice(0, 5); // Limit to 5
            setActivities(recentActivities);
        }, (error) => {
            console.error("Activities fetch error:", error);
        });

        return () => unsubscribe();
    }, []);

    // Helper function to parse timeAgo into milliseconds for sorting
    const parseTimeAgo = (timeAgo: string) => {
        const now = new Date(1759382940000); // Oct 01, 2025, 04:49 PM +0530
        const match = timeAgo.match(/(\d+) hours ago/);
        const hoursAgo = match ? parseInt(match[1], 10) : 0;
        return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).getTime();
    };

    // Helper function to calculate timeAgo if not provided
    const calculateTimeAgo = (dueDate: string) => {
        const now = new Date(1759382940000); // Oct 01, 2025, 04:49 PM +0530
        const then = new Date(dueDate);
        const diffMs = now.getTime() - then.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        return `${diffHours} hours ago`;
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Recent Activities</h2>
                <p className="text-gray-600">Latest system updates</p>
            </div>

            <div className="space-y-4">
                {activities.map((activity, index) => (
                    <div key={`${activity.id || 'activity'}-${index}`} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-800 text-sm mb-1">{activity.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">{activity.timeAgo}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                                    {getStatusText(activity.status)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}