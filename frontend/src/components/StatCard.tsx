import styles from './StatCard.module.css';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, unit, highlight }: Props) {
  return (
    <div className={`${styles.card} ${highlight ? styles.highlight : ''}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}{unit && <small> {unit}</small>}</span>
    </div>
  );
}
