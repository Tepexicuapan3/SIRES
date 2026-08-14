interface VitalMetricProps {
  label: string;
  value: string;
}

export const VitalMetric = ({ label, value }: VitalMetricProps) => {
  return (
    <article className="rounded-lg border border-line-hairline bg-subtle/20 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-txt-muted">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-txt-body">{value}</p>
    </article>
  );
};
