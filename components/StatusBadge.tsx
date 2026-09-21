export default function StatusBadge({
 text,
 type=''
}:{
 text:string;
 type?:string;
}) {
 return (
  <span className={`badge ${type}`}>
    {text}
  </span>
 );
}
