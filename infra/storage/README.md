# Storage Policy Notes

## Objectives

- Keep meeting audio in encrypted object storage.
- Use retention windows to delete or archive expired assets.
- Avoid writing raw transcript content to application logs.

## Planned Lifecycle Buckets

- Raw uploads: short retention, encrypted
- Processed transcript assets: medium retention
- Derived structured action items: long retention
