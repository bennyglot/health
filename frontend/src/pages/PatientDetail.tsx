import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPatient } from '../api/patients';
import { getReadings, getHighEvents } from '../api/heartRate';
import { getAnalytics } from '../api/analytics';
import HeartRateChart from '../components/HeartRateChart';
import StatCard from '../components/StatCard';
import HighEventsTable from '../components/HighEventsTable';
import styles from './PatientDetail.module.css';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [analyticsParams, setAnalyticsParams] = useState<{ start?: string; end?: string }>({});

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id!),
    enabled: !!id,
  });

  const { data: readings, isLoading: loadingReadings } = useQuery({
    queryKey: ['readings', id],
    queryFn: () => getReadings(id!),
    enabled: !!id,
  });

  const { data: highEvents } = useQuery({
    queryKey: ['high-events', id],
    queryFn: () => getHighEvents(id!),
    enabled: !!id,
  });

  const { data: analytics, isLoading: loadingAnalytics, error: analyticsError } = useQuery({
    queryKey: ['analytics', id, analyticsParams.start, analyticsParams.end],
    queryFn: () => getAnalytics(id!, analyticsParams.start, analyticsParams.end),
    enabled: !!id,
  });

  if (loadingPatient) return <div className={styles.loading}>Loading...</div>;
  if (!patient) return <div className={styles.error}>Patient not found.</div>;

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>← Back to Dashboard</Link>

      <div className={styles.header}>
        <div>
          <h1>{patient.name}</h1>
          <p className={styles.meta}>{patient.age} years · <span style={{ textTransform: 'capitalize' }}>{patient.gender}</span></p>
        </div>
        <div className={styles.badge}>{patient.requestCount} requests</div>
      </div>

      <section className={styles.section}>
        <h2>Heart Rate Over Time</h2>
        {loadingReadings ? (
          <div className={styles.loading}>Loading chart...</div>
        ) : readings && readings.length > 0 ? (
          <HeartRateChart readings={readings} />
        ) : (
          <p className={styles.empty}>No readings available.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2>Analytics</h2>
        <div className={styles.analyticsForm}>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={styles.input}
          />
          <span>to</span>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.input}
          />
          <button
            className={styles.btn}
            onClick={() => setAnalyticsParams({ start: startDate || undefined, end: endDate || undefined })}
          >
            Calculate
          </button>
        </div>

        {loadingAnalytics && <div className={styles.loading}>Calculating...</div>}
        {analyticsError && <div className={styles.error}>{(analyticsError as Error).message}</div>}
        {analytics && (
          <div className={styles.statsRow}>
            <StatCard label="Average" value={analytics.avg} unit="bpm" highlight />
            <StatCard label="Maximum" value={analytics.max} unit="bpm" />
            <StatCard label="Minimum" value={analytics.min} unit="bpm" />
            <StatCard label="Readings" value={analytics.readingCount} />
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>High Heart Rate Events <span className={styles.threshold}>({">"} 100 bpm)</span></h2>
        <HighEventsTable events={highEvents ?? []} />
      </section>
    </div>
  );
}
