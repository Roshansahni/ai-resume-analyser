begin;

alter table public.resumes
  drop constraint if exists resumes_file_type_check;

alter table public.resumes
  add constraint resumes_file_type_check check (
    file_type in (
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf',
      'text/html',
      'application/vnd.oasis.opendocument.text'
    )
  );

update storage.buckets
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/rtf',
    'text/html',
    'application/vnd.oasis.opendocument.text'
  ]
where id = 'resumes';

commit;
