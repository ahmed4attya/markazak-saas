'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Save,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';

export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: {
    value: string;
    label: string;
  }[];
};

type Column = {
  key: string;
  label: string;
};

type CrudPageProps = {
  title: string;
  subtitle?: string;
  endpoint: string;
  columns: Column[];
  fields: Field[];
  empty?: string;
};

const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  graduated: 'متخرج',
  suspended: 'موقوف',
  draft: 'مسودة',
  archived: 'مؤرشف',
  scheduled: 'مجدولة',
  completed: 'مكتملة',
};

function getStatusLabel(value: string) {
  return statusLabels[value] || value || '-';
}

export default function CrudPage({
  title,
  subtitle,
  endpoint,
  columns,
  fields,
  empty = 'لا توجد بيانات',
}: CrudPageProps) {

  const [rows, setRows] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<Record<string, any>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] =
    useState<string | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function load() {

    setLoading(true);

    try {

      const url =
        query
          ? `${endpoint}?q=${encodeURIComponent(query)}`
          : endpoint;

      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include',
      });


      if (response.status === 401) {
        setError(
          'انتهت الجلسة، يرجى تسجيل الدخول'
        );
        return;
      }


      const data =
        await response.json();


      setRows(
        Array.isArray(data)
          ? data
          : []
      );


    } catch {

      setError(
        'تعذر الاتصال بالخادم'
      );

    } finally {

      setLoading(false);

    }
  }


  useEffect(() => {

    load();

  }, [query]);



  function setField(
    key: string,
    value: any
  ) {

    setForm(current => ({
      ...current,
      [key]: value,
    }));

  }



  function openCreate() {

    setEditingId(null);
    setForm({});
    setError('');
    setSuccess('');
    setModal(true);

  }



  function openEdit(row:any) {

    const data:any = {};

    fields.forEach(field => {

      data[field.key] =
        row[field.key] ?? '';

    });


    setEditingId(row.id);
    setForm(data);
    setError('');
    setSuccess('');
    setModal(true);

  }



  async function save(
    event:React.FormEvent
  ) {

    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');


    try {

      const response =
        await fetch(
          editingId
            ? `${endpoint}/${editingId}`
            : endpoint,
          {

            method:
              editingId
                ? 'PATCH'
                : 'POST',

            headers:{
              'Content-Type':
                'application/json',
            },

            credentials:
              'include',

            body:
              JSON.stringify(form),
          }
        );


      const data =
        await response.json();


      if(!response.ok){

        throw new Error(
          data.error ||
          'تعذر الحفظ'
        );

      }


      setModal(false);
      setForm({});
      setEditingId(null);

      setSuccess(
        editingId
          ? 'تم تحديث البيانات'
          : 'تمت الإضافة بنجاح'
      );


      await load();


    } catch(e:any){

      setError(
        e.message ||
        'تعذر الحفظ'
      );

    } finally {

      setSaving(false);

    }

  }




  async function remove(row:any){

    if(!confirm(
      `هل تريد حذف ${row.name || title}؟`
    )) return;


    setDeleting(row.id);


    try{

      const response =
        await fetch(
          `${endpoint}/${row.id}`,
          {
            method:'DELETE',
            credentials:'include',
          }
        );


      if(!response.ok){

        const data =
          await response.json();

        throw new Error(
          data.error ||
          'تعذر الحذف'
        );

      }


      await load();


    }catch(e:any){

      setError(
        e.message
      );

    }finally{

      setDeleting(null);

    }

  }



  return (

    <>

      <div className="toolbar">

        <div className="toolbarSearch">

          <Search size={17}/>

          <input
            value={query}
            onChange={
              e=>setQuery(e.target.value)
            }
            placeholder="بحث..."
          />

        </div>


        <div className="toolbarActions">

          <button
            className="ghost"
            onClick={load}
          >
            <RefreshCw size={16}/>
          </button>


          <button
            className="primary"
            onClick={openCreate}
          >

            <Plus size={17}/>
            إضافة جديد

          </button>


        </div>

      </div>



      {error &&
        <div className="error">
          {error}
        </div>
      }


      {success &&
        <div className="success">
          {success}
        </div>
      }



      <div className="panel tablePanel">

        <table>

          <thead>

            <tr>

              {columns.map(column=>(

                <th key={column.key}>
                  {column.label}
                </th>

              ))}

              <th>
                الإجراءات
              </th>

            </tr>

          </thead>


          <tbody>

          {
          loading ?

          <tr>
            <td colSpan={
              columns.length+1
            }>
              جاري التحميل...
            </td>
          </tr>


          :

          rows.length ?


          rows.map(row=>(

            <tr key={row.id}>

              {
              columns.map(column=>(

                <td key={column.key}>

                  {
                  column.key==='status'
                  ?
                  <span className={`badge ${row.status}`}>
                    {getStatusLabel(row.status)}
                  </span>
                  :
                  row[column.key] || '-'
                  }

                </td>

              ))
              }


              <td>

                <button
                  onClick={()=>openEdit(row)}
                  className="iconAction"
                >
                  <Pencil size={15}/>
                </button>


                <button
                  onClick={()=>remove(row)}
                  disabled={
                    deleting===row.id
                  }
                  className="iconAction"
                >
                  <Trash2 size={15}/>
                </button>


              </td>


            </tr>

          ))

          :

          <tr>
            <td colSpan={columns.length+1}>
              {empty}
            </td>
          </tr>

          }


          </tbody>


        </table>

      </div>



      {modal && (

      <div className="modalBack">

        <div className="modal">

          <div className="modalHead">

            <h2>
              {
              editingId
              ? `تعديل ${title}`
              : `إضافة ${title}`
              }
            </h2>


            <button
              onClick={()=>
                setModal(false)
              }
            >

              <X/>

            </button>


          </div>



          <form
            onSubmit={save}
            className="formGrid"
          >

          {
          fields.map(field=>(

            <label key={field.key}>

              {field.label}


              {
              field.type==='select'

              ?

              <select
                value={
                  form[field.key] || ''
                }
                onChange={
                  e=>
                  setField(
                    field.key,
                    e.target.value
                  )
                }
              >

                <option value="">
                  اختر...
                </option>


                {
                field.options?.map(option=>(

                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>

                ))
                }

              </select>


              :

              <input
                type={
                  field.type || 'text'
                }
                value={
                  form[field.key] || ''
                }
                onChange={
                  e=>
                  setField(
                    field.key,
                    e.target.value
                  )
                }
              />

              }


            </label>

          ))
          }



          <div className="modalActions">


            <button
              type="button"
              onClick={()=>
                setModal(false)
              }
            >
              إلغاء
            </button>


            <button
              type="submit"
              disabled={saving}
              className="primary"
            >

              <Save size={16}/>

              {
              saving
              ? 'يتم الحفظ'
              : 'حفظ'
              }

            </button>


          </div>


          </form>


        </div>

      </div>

      )}

    </>

  );

}