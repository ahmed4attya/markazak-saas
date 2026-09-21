export default function StatCard({
  title,
  value,
  icon,
  tone=''
}:{
  title:string;
  value:string|number;
  icon:string;
  tone?:string;
}) {
  return (
    <div className={`stat ${tone}`}>
      <div className="statIcon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
