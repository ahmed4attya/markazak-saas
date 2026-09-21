import {NextResponse} from 'next/server';
import {query,withTx,safeError} from '@/lib/db';
import {getSession,isAdmin} from '@/lib/auth';
import {paymentSchema} from '@/lib/validation';
import {logAudit} from '@/lib/audit';

export async function GET(){

const s=await getSession();

if(!s)
return NextResponse.json({error:'unauthorized'},{status:401});

try{

const r=await query(
`
select 
p.*,
i.number invoice_number,
st.name student_name
from payments p
left join invoices i on i.id=p.invoice_id
left join students st on st.id=i.student_id
where p.tenant_id=$1
order by p.paid_at desc
limit 500
`,
[s.tenantId]
);

return NextResponse.json(r.rows);

}catch(e:any){

return NextResponse.json(
{error:safeError(e)},
{status:500}
);

}

}


export async function POST(req:Request){

const s=await getSession();

if(!s)
return NextResponse.json({error:'unauthorized'},{status:401});

if(!isAdmin(s.role))
return NextResponse.json({error:'forbidden'},{status:403});


let x;

try{

x=paymentSchema.parse(await req.json());

}catch(e:any){

return NextResponse.json(
{error:safeError(e,'بيانات الدفعة غير صالحة')},
{status:400}
);

}


try{

const inv=await query(
`
select 
id,
amount,
(select coalesce(sum(amount),0) from payments where invoice_id=invoices.id) paid
from invoices
where id=$1
and tenant_id=$2
`,
[x.invoice_id,s.tenantId]
);


if(!inv.rows[0])
return NextResponse.json(
{error:'الفاتورة غير موجودة'},
{status:404}
);


const remaining=
Number(inv.rows[0].amount)-
Number(inv.rows[0].paid);


if(x.amount>remaining+0.01)

return NextResponse.json(
{error:`المبلغ أكبر من المتبقي ${remaining.toFixed(2)}`},
{status:400}
);


const out=await withTx(async c=>{

const p=await c.query(
`
insert into payments
(
tenant_id,
invoice_id,
amount,
method,
reference
)
values($1,$2,$3,$4,$5)
returning *
`,
[
s.tenantId,
x.invoice_id,
x.amount,
x.method,
x.reference
]
);


await c.query(
`
update invoices i
set status=
case 
when 
(select coalesce(sum(amount),0) from payments where invoice_id=i.id)>=i.amount
then 'paid'
else 'partial'
end
where i.id=$1
and i.tenant_id=$2
`,
[
x.invoice_id,
s.tenantId
]
);


return p.rows[0];

});


await logAudit({
tenantId:s.tenantId,
userId:s.userId,
action:'payment.create',
entity:'payment',
entityId:out.id,
metadata:{
invoice_id:x.invoice_id,
amount:x.amount
}
});


return NextResponse.json(out,{status:201});


}catch(e:any){

return NextResponse.json(
{error:safeError(e,'تعذر تسجيل الدفعة')},
{status:400}
);

}

}