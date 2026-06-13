import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPatients } from '../api/patients';
import { getHighEvents } from '../api/heartRate';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { data: patients, isLoading, error } = useQuery({
    queryKey: ['patients'],
    queryFn: getPatients,
  });

  const { data: highEvents } = useQuery({
    queryKey: ['high-events'],
    queryFn: () => getHighEvents(),
  });

  if (isLoading) return <div className={styles.loading}>Loading patients...</div>;
  if (error) return <div className={styles.error}>Error: {(error as Error).message}</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Patient Heart Rate Monitor</h1>
      </header>

      {highEvents && highEvents.length > 0 && (
        <div className={styles.alert}>
          ⚠ {highEvents.length} high heart rate event{highEvents.length !== 1 ? 's' : ''} detected across all patients
        </div>
      )}

      <div className={styles.grid}>
        {patients?.map((patient) => (
          <Link key={patient.id} to={`/patient/${patient.id}`} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.name}>{patient.name}</span>
              <span className={styles.badge}>{patient.requestCount} requests</span>
            </div>
            <div className={styles.meta}>
              <span>{patient.age} years</span>
              <span className={styles.dot}>·</span>
              <span style={{ textTransform: 'capitalize' }}>{patient.gender}</span>
            </div>
          </Link>
        ))}
      </div>

      {patients?.length === 0 && (
        <p className={styles.empty}>No patients found.</p>
      )}
    </div>
  );
}
