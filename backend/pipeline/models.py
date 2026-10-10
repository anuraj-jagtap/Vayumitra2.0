from django.db import models

class IngestLog(models.Model):
    log_id = models.BigAutoField(primary_key=True)
    job = models.CharField(max_length=255)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='running')
    rows_written = models.IntegerField(null=True, blank=True)
    detail = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'ingest_log'
        constraints = [
            models.CheckConstraint(check=models.Q(status__in=['running', 'ok', 'failed']), name='ingest_log_status_check')
        ]
