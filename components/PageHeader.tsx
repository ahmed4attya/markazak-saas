export default function PageHeader({
 title,
 desc,
 children
}:{
 title:string;
 desc:string;
 children?:React.ReactNode;
}) {
 return (
  <div className="pageIntroCards">
    <div className="contextCard">
      <b>{title}</b>
      <span>{desc}</span>
    </div>
    <div>
      {children}
    </div>
  </div>
 );
}
