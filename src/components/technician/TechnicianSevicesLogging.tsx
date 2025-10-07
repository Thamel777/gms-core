'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { onValue, ref } from 'firebase/database';

import ServicesPage from '../admin/Services';
import { auth, db } from '@/firebaseConfig';

interface TechnicianServicesLoggingProps {
  onNavigate?: (page: string) => void;
}

interface RawTask {
  generatorId?: string;
  assignedTo?: string;
}

const addIdentifier = (collection: Set<string>, value?: string | null) => {
  if (!value) {
    return;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }
  collection.add(trimmed);
  const lower = trimmed.toLowerCase();
  collection.add(lower);
};

export default function TechnicianServicesLogging({ onNavigate }: TechnicianServicesLoggingProps) {
  void onNavigate;

  const [assignmentIdentifiers, setAssignmentIdentifiers] = useState<string[]>([]);
  const [allowedGeneratorIds, setAllowedGeneratorIds] = useState<string[]>([]);
  const [technicianName, setTechnicianName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authInstance = auth();
    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribeAuth = authInstance.onAuthStateChanged((user) => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (!user) {
        setAssignmentIdentifiers([]);
        setAllowedGeneratorIds([]);
        setTechnicianName(null);
        setIsLoading(false);
        return;
      }

      const identifiers = new Set<string>();
      addIdentifier(identifiers, user.uid);
      addIdentifier(identifiers, user.email);
      addIdentifier(identifiers, user.displayName);

      const baseTechnicianName = user.displayName?.trim() ?? user.email?.trim() ?? null;
      setTechnicianName(baseTechnicianName ?? null);

      setAssignmentIdentifiers(Array.from(identifiers));
      setIsLoading(true);

      const dbInstance = db();
      const profileRef = ref(dbInstance, `users/${user.uid}`);
      profileUnsubscribe = onValue(profileRef, (snapshot) => {
        const data = snapshot.val() as { name?: string; email?: string } | null;
        if (data) {
          addIdentifier(identifiers, data.name ?? null);
          addIdentifier(identifiers, data.email ?? null);
          setAssignmentIdentifiers(Array.from(identifiers));

          const resolvedName = data.name?.trim() ?? data.email?.trim() ?? null;
          if (resolvedName) {
            setTechnicianName(resolvedName);
          }
        }
      });
    });

    return () => {
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!assignmentIdentifiers.length) {
      setAllowedGeneratorIds([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const identifierSet = new Set<string>();
    assignmentIdentifiers.forEach((identifier) => {
      const trimmed = identifier.trim();
      if (!trimmed) {
        return;
      }
      identifierSet.add(trimmed);
      identifierSet.add(trimmed.toLowerCase());
    });

    const dbInstance = db();
    const tasksRef = ref(dbInstance, 'tasks');

    const unsubscribeTasks = onValue(tasksRef, (snapshot) => {
      const value = snapshot.val() as Record<string, RawTask> | null;
      const generatorIds = new Set<string>();

      if (value) {
        Object.values(value).forEach((task) => {
          const generatorId = task.generatorId?.trim();
          if (!generatorId) {
            return;
          }

          const assigned = task.assignedTo?.trim();
          if (!assigned) {
            return;
          }

          const assignedLower = assigned.toLowerCase();
          if (!identifierSet.has(assigned) && !identifierSet.has(assignedLower)) {
            return;
          }

          generatorIds.add(generatorId);
        });
      }

      setAllowedGeneratorIds(Array.from(generatorIds));
      setIsLoading(false);
    });

    return () => unsubscribeTasks();
  }, [assignmentIdentifiers]);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading assigned services...
      </div>
    );
  }

  if (!allowedGeneratorIds.length) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-gray-500 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-orange-400" />
        <div>
          <p className="text-lg font-semibold text-gray-700">No assigned generators found</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Service logs become available once generators are assigned to you through tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ServicesPage
      allowedGeneratorIds={allowedGeneratorIds}
      lockedTechnicianName={technicianName ?? undefined}
    />
  );
}
