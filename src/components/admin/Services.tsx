'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, Calendar, X, Plus } from 'lucide-react';
import { MdSearch } from 'react-icons/md';
import { ref, onValue, push, set, update } from 'firebase/database';
import { db } from '../../firebaseConfig';

type ServiceStatus = 'Completed' | 'Upcoming' | 'Overdue';

interface Service {
  id: string;
  serviceId: string;
  generatorId: string;
  serviceType: string;
  technician: string;
  serviceCost?: string;
  serviceDate: string;
  nextDueDate: string;
  notes: string;
  isOverdue: boolean;
  overdueDays?: number;
  createdAt?: number;
  updatedAt?: number;
  statusOverride?: ServiceStatus;
}

interface RawService {
  id?: string;
  serviceId?: string;
  generatorId?: string;
  serviceType?: string;
  technician?: string;
  serviceCost?: string;
  serviceDate?: string;
  nextDueDate?: string;
  notes?: string;
  isOverdue?: boolean;
  overdueDays?: number;
  createdAt?: number;
  updatedAt?: number;
  statusOverride?: ServiceStatus;
  status?: ServiceStatus;
}

interface ServicesPageProps {
  allowedGeneratorIds?: string[];
  lockedTechnicianName?: string;
}

const serviceTypeOptions = [
  'Maintenance',
  'Emergency Repair',
  'Repair'
];

const resolveDueDate = (service: Service) =>
  service.serviceType === 'Maintenance' ? service.nextDueDate : service.serviceDate;

type ServiceWithStatus = Service & { status: ServiceStatus };

const statusOptions: ServiceStatus[] = ['Completed', 'Upcoming', 'Overdue'];

const getServiceStatus = (service: Service, referenceDate: Date): ServiceStatus => {
  if (service.statusOverride) {
    return service.statusOverride;
  }

  if (service.isOverdue) {
    return 'Overdue';
  }

  const dueDateString = resolveDueDate(service);
  if (dueDateString) {
    const dueDate = new Date(dueDateString);
    if (!Number.isNaN(dueDate.getTime()) && dueDate > referenceDate) {
      return 'Upcoming';
    }
  }

  return 'Completed';
};

const statusBadgeClasses: Record<ServiceStatus, string> = {
  Completed: 'bg-green-100 text-green-700',
  Upcoming: 'bg-blue-100 text-blue-700',
  Overdue: 'bg-red-100 text-red-700',
};

export default function ServicesPage({ allowedGeneratorIds, lockedTechnicianName }: ServicesPageProps = {}) {
  const [services, setServices] = useState<Service[]>([]);
  const [generators, setGenerators] = useState<string[]>([]);
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'upcoming' | 'overdue'>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');

  const [selectedService, setSelectedService] = useState<ServiceWithStatus | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Service>>({});

  const allowedGeneratorSet = useMemo(() => {
    if (!allowedGeneratorIds || allowedGeneratorIds.length === 0) {
      return null;
    }
    return new Set(allowedGeneratorIds.map((id) => id.trim()));
  }, [allowedGeneratorIds]);

  const lockedTechnician = useMemo(() => lockedTechnicianName?.trim() ?? '', [lockedTechnicianName]);

  useEffect(() => {
    const dbInstance = db();
    const servicesRef = ref(dbInstance, 'services');
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const value = snapshot.val() as Record<string, RawService> | null;
      if (!value) {
        setServices([]);
        setLoading(false);
        return;
      }

      const mapped: Service[] = Object.entries(value).map(([id, data]) => {
        const serviceType = data.serviceType ?? '';
        const serviceDate = data.serviceDate ?? '';
        const nextDueDate = data.nextDueDate ?? '';
        const dueDateReference = serviceType === 'Maintenance' ? nextDueDate : serviceDate;
        const isOverdue = dueDateReference ? new Date(dueDateReference) < new Date() : false;

        return {
          id,
          serviceId: data.serviceId ?? id,
          generatorId: data.generatorId ?? '',
          serviceType,
          technician: data.technician ?? '',
          serviceCost: data.serviceCost ?? '0',
          serviceDate,
          nextDueDate,
          notes: data.notes ?? '',
          isOverdue,
          overdueDays: data.overdueDays,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          statusOverride: data.statusOverride ?? data.status,
        };
      });

      const filtered = allowedGeneratorSet
        ? mapped.filter(service => allowedGeneratorSet.has(service.generatorId.trim()))
        : mapped;

      setServices(filtered.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [allowedGeneratorSet]);

  useEffect(() => {
    const dbInstance = db();
    const generatorsRef = ref(dbInstance, 'generators');
    const unsubscribe = onValue(generatorsRef, (snapshot) => {
      const value = snapshot.val() as Record<string, unknown> | null;
      if (!value) {
        if (allowedGeneratorIds && allowedGeneratorIds.length > 0) {
          setGenerators(allowedGeneratorIds.map((id) => id.trim()));
        } else {
          setGenerators([]);
        }
        return;
      }

      const ids = Object.keys(value);

      if (allowedGeneratorSet) {
        const filtered = ids.filter((id) => allowedGeneratorSet.has(id.trim()));
        const missing = (allowedGeneratorIds ?? [])
          .map((id) => id.trim())
          .filter((id) => id && !filtered.includes(id));
        setGenerators([...filtered, ...missing]);
      } else {
        setGenerators(ids);
      }
    });

    return () => unsubscribe();
  }, [allowedGeneratorSet, allowedGeneratorIds]);

  useEffect(() => {
    const dbInstance = db();
    const usersRef = ref(dbInstance, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const value = snapshot.val();
      if (!value) {
        if (lockedTechnician) {
          setTechnicians([lockedTechnician]);
        } else {
          setTechnicians([]);
        }
        return;
      }
      const techs = Object.values(value)
        .filter((user: unknown) => {
          const u = user as { role?: string; name?: string };
          return u.role === 'technician';
        })
        .map((user: unknown) => {
          const u = user as { name?: string };
          return u.name ?? '';
        })
        .filter(Boolean);
      const combined = lockedTechnician
        ? Array.from(new Set([lockedTechnician, ...techs]))
        : techs;
      setTechnicians(combined);
    });

    return () => unsubscribe();
  }, [lockedTechnician]);

  const parseDate = (d: string) => new Date(d);

  const now = useMemo(() => new Date(), []);

  const servicesWithStatus = useMemo<ServiceWithStatus[]>(
    () => services.map(service => ({ ...service, status: getServiceStatus(service, now) })),
    [services, now]
  );

  const statusCounts = useMemo(() => {
    return servicesWithStatus.reduce(
      (acc, service) => {
        acc[service.status] = (acc[service.status] ?? 0) + 1;
        return acc;
      },
      { Completed: 0, Upcoming: 0, Overdue: 0 } as Record<ServiceStatus, number>
    );
  }, [servicesWithStatus]);

  const completedServices = statusCounts.Completed;
  const upcomingServices = statusCounts.Upcoming;
  const overdueServices = statusCounts.Overdue;

  const thisMonthServices = useMemo(
    () =>
      services.filter(s => {
        if (!s.serviceDate) {
          return false;
        }
        const date = parseDate(s.serviceDate);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
    [services, now]
  );

  const filteredServices = useMemo(() => {
    return servicesWithStatus.filter(service => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        service.serviceId.toLowerCase().includes(q) ||
        service.generatorId.toLowerCase().includes(q) ||
        service.serviceType.toLowerCase().includes(q) ||
        service.technician.toLowerCase().includes(q) ||
        (service.notes ?? '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' || service.status.toLowerCase() === statusFilter;

      const matchesType = serviceTypeFilter === 'all' || service.serviceType === serviceTypeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [servicesWithStatus, searchTerm, statusFilter, serviceTypeFilter]);

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(lockedTechnician ? { technician: lockedTechnician } : {});
    setIsModalOpen(true);
  };

  const openEditModal = (service: ServiceWithStatus) => {
    setIsEditing(true);

    const baseService = services.find(s => s.id === service.id);
    let serviceForForm: Partial<Service>;

    if (baseService) {
      serviceForForm = { ...baseService };
    } else {
      const rest = { ...service } as Partial<Service> & { status?: ServiceStatus };
      delete rest.status;
      serviceForForm = rest;
    }

  serviceForForm.statusOverride = baseService?.statusOverride ?? service.statusOverride;

    setFormData(serviceForForm);
    setIsModalOpen(true);
  };

  const handleFormChange = (field: keyof Service, value: string) => {
    setFormData(prev => {
      if (field === 'technician' && lockedTechnician) {
        return prev;
      }
      if (field === 'statusOverride') {
        if (!value) {
          const rest = { ...prev };
          delete rest.statusOverride;
          return rest;
        }

        return { ...prev, statusOverride: value as ServiceStatus };
      }
      if (field === 'serviceType') {
        return {
          ...prev,
          [field]: value,
          serviceDate: '',
          ...(value === 'Maintenance' ? {} : { nextDueDate: '' }),
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const technicianValue = lockedTechnician
      ? (isEditing ? (formData.technician || lockedTechnician) : lockedTechnician)
      : (formData.technician || '');

    if (!formData.generatorId || !formData.serviceType || !technicianValue) {
      alert('Please select Generator, Service Type, and Technician.');
      return;
    }

    if (allowedGeneratorSet && formData.generatorId && !allowedGeneratorSet.has(formData.generatorId.trim())) {
      alert('You can only log services for generators assigned to you.');
      return;
    }

    const isMaintenance = formData.serviceType === 'Maintenance';

    if (isMaintenance) {
      if (!formData.serviceDate || !formData.nextDueDate) {
        alert('Please provide Service Date and Next Due Date.');
        return;
      }
    } else {
      if (!formData.serviceDate) {
        alert('Please provide Due Date.');
        return;
      }
    }

    const dueDate = isMaintenance ? formData.nextDueDate : formData.serviceDate;
    const nextDueDate = isMaintenance ? formData.nextDueDate ?? '' : '';
    const serviceDate = formData.serviceDate ?? '';
    const statusOverride = formData.statusOverride ?? undefined;
    const timestamp = Date.now();

    const dbInstance = db();

    const computeIsOverdue = () => {
      if (statusOverride) {
        return statusOverride === 'Overdue';
      }
      return dueDate ? new Date(dueDate) < new Date() : false;
    };

    try {
      if (isEditing && formData.id) {
        await update(ref(dbInstance, `services/${formData.id}`), {
          generatorId: formData.generatorId,
          serviceType: formData.serviceType,
          technician: technicianValue,
          serviceDate,
          nextDueDate,
          notes: formData.notes || '',
          updatedAt: timestamp,
          isOverdue: computeIsOverdue(),
          statusOverride: statusOverride ?? null,
        });
      } else {
        const servicesRef = ref(dbInstance, 'services');
        const newServiceRef = push(servicesRef);
        const serviceId = `S${String(services.length + 1).padStart(3, '0')}`;

        await set(newServiceRef, {
          id: newServiceRef.key,
          serviceId,
          generatorId: formData.generatorId,
          serviceType: formData.serviceType,
          technician: technicianValue,
          serviceDate,
          nextDueDate,
          notes: formData.notes || '',
          isOverdue: computeIsOverdue(),
          statusOverride: statusOverride ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service. Please try again.');
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Services</h1>
          <p className="text-gray-600 text-lg">Track maintenance and service activities</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} /> Log Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 text-center">
          <CheckCircle className="text-green-500 mx-auto mb-3" size={32} />
          <h3 className="text-sm font-medium text-gray-500 mb-1">Completed</h3>
          <p className="text-3xl font-bold text-gray-900">{completedServices}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 text-center">
          <Clock className="text-blue-500 mx-auto mb-3" size={32} />
          <h3 className="text-sm font-medium text-gray-500 mb-1">Upcoming</h3>
          <p className="text-3xl font-bold text-gray-900">{upcomingServices}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 text-center">
          <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
          <h3 className="text-sm font-medium text-gray-500 mb-1">Overdue</h3>
          <p className="text-3xl font-bold text-gray-900">{overdueServices}</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200 text-center">
          <Calendar className="text-blue-500 mx-auto mb-3" size={32} />
          <h3 className="text-sm font-medium text-gray-500 mb-1">This Month</h3>
          <p className="text-3xl font-bold text-gray-900">{thisMonthServices}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 border border-blue-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MdSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'upcoming' | 'overdue')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter services by status"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
          </select>
          <select
            value={serviceTypeFilter}
            onChange={(e) => setServiceTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Filter services by type"
          >
            <option value="all">All Types</option>
            {serviceTypeOptions.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Service Log Table</h2>
        {loading ? (
          <p className="text-center py-4 text-gray-500">Loading services...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-50 text-blue-600 font-semibold">
                  <th className="p-3 text-left">Service ID</th>
                  <th className="p-3 text-left">Generator ID</th>
                  <th className="p-3 text-left">Service Type</th>
                  <th className="p-3 text-left">Technician</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Service Date</th>
                  <th className="p-3 text-left">Due Dates</th>
                  <th className="p-3 text-left">Notes</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="p-3 font-semibold text-gray-800">{s.serviceId}</td>
                    <td className="p-3">{s.generatorId}</td>
                    <td className="p-3">{s.serviceType}</td>
                    <td className="p-3">{s.technician}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3">{s.serviceDate || '-'}</td>
                    <td className="p-3">
                      {s.serviceType === 'Maintenance' ? (
                        <div className="flex flex-col gap-1">
                          <span>
                            <span className="font-medium text-gray-700">Next:</span> {s.nextDueDate || '-'}
                            {s.isOverdue && s.nextDueDate && (
                              <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                Overdue
                              </span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span>
                          <span className="font-medium text-gray-700">Due:</span> {resolveDueDate(s) || '-'}
                          {s.isOverdue && resolveDueDate(s) && (
                            <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                              Overdue
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-3">{s.notes}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => setSelectedService(s)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(s)}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredServices.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={9}>
                      No services match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedService && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close details"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-2 text-blue-600">Service Details</h2>
            <div className="space-y-2 text-sm">
              <p><b>Service ID:</b> {selectedService.serviceId}</p>
              <p><b>Generator ID:</b> {selectedService.generatorId}</p>
              <p><b>Type:</b> {selectedService.serviceType}</p>
              <p><b>Technician:</b> {selectedService.technician}</p>
              <p><b>Status:</b> {getServiceStatus(selectedService, now)}</p>
              {selectedService.serviceType === 'Maintenance' && (
                <p><b>Service Date:</b> {selectedService.serviceDate || 'N/A'}</p>
              )}
              <p>
                <b>{selectedService.serviceType === 'Maintenance' ? 'Next Due:' : 'Due Date:'}</b>{' '}
                {resolveDueDate(selectedService) || 'N/A'}
              </p>
              <p><b>Notes:</b> {selectedService.notes || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-2 text-blue-600">
              {isEditing ? 'Edit Service' : 'Log Service'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">Record service activities and maintenance</p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.generatorId || ''}
                  onChange={(e) => handleFormChange('generatorId', e.target.value)}
                  className="border p-2 rounded-lg"
                  required
                  aria-label="Select generator"
                >
                  <option value="">Select generator</option>
                  {generators.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                <select
                  value={formData.serviceType || ''}
                  onChange={(e) => handleFormChange('serviceType', e.target.value)}
                  className="border p-2 rounded-lg"
                  required
                  aria-label="Select service type"
                >
                  <option value="">Select service type</option>
                  {serviceTypeOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                {lockedTechnician ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-700">Technician</span>
                    <input
                      type="text"
                      value={formData.technician || lockedTechnician}
                      readOnly
                      className="border p-2 rounded-lg w-full bg-gray-100 text-gray-600"
                      aria-label="Selected technician"
                    />
                  </div>
                ) : (
                  <select
                    value={formData.technician || ''}
                    onChange={(e) => handleFormChange('technician', e.target.value)}
                    className="border p-2 rounded-lg w-full"
                    required
                    aria-label="Select technician"
                  >
                    <option value="">Select technician</option>
                    {technicians.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                )}
              </div>

              {formData.serviceType && (
                formData.serviceType === 'Maintenance' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={formData.serviceDate || ''}
                      onChange={(e) => handleFormChange('serviceDate', e.target.value)}
                      className="border p-2 rounded-lg"
                      required
                      aria-label="Select service date"
                      aria-describedby="service-date-help"
                    />
                    <input
                      type="date"
                      value={formData.nextDueDate || ''}
                      onChange={(e) => handleFormChange('nextDueDate', e.target.value)}
                      className="border p-2 rounded-lg"
                      required
                      aria-label="Select next due date"
                      aria-describedby="next-due-date-help"
                    />
                    <p
                      id="service-date-help"
                      className="text-xs text-gray-500 md:col-span-1"
                    >
                      Service Date reflects when the maintenance visit happened.
                    </p>
                    <p
                      id="next-due-date-help"
                      className="text-xs text-gray-500 md:col-span-1"
                    >
                      Next Due Date schedules the follow-up maintenance window.
                    </p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="date"
                      value={formData.serviceDate || ''}
                      onChange={(e) => handleFormChange('serviceDate', e.target.value)}
                      className="border p-2 rounded-lg w-full"
                      required
                      aria-label="Select due date"
                      aria-describedby="repair-due-date-help"
                    />
                    <p
                      id="repair-due-date-help"
                      className="mt-1 text-xs text-gray-500"
                    >
                      Due Date represents when the repair or emergency response should be completed.
                    </p>
                  </div>
                )
              )}

              {isEditing && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Service Status</span>
                  <select
                    value={formData.statusOverride ?? ''}
                    onChange={(e) => handleFormChange('statusOverride', e.target.value)}
                    className="mt-1 border p-2 rounded-lg w-full"
                    aria-label="Select service status override"
                  >
                    <option value="">Auto (calculated)</option>
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Override the automatically calculated status when manual tracking is required.
                  </p>
                </div>
              )}

              <textarea
                placeholder="Enter technician notes and observations..."
                value={formData.notes || ''}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                className="border p-2 rounded-lg w-full h-24"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {isEditing ? 'Update Service' : 'Log Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
