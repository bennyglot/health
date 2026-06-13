import { HighEvent } from '../types';
import styles from './HighEventsTable.module.css';

interface Props {
  events: HighEvent[];
}

export default function HighEventsTable({ events }: Props) {
  if (!events.length) return <p className={styles.empty}>No high heart rate events.</p>;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Heart Rate</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e) => (
          <tr key={e.id} className={e.heartRate > 120 ? styles.critical : ''}>
            <td>{new Date(e.timestamp).toLocaleString()}</td>
            <td><strong>{e.heartRate} bpm</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
