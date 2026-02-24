from django.db import models


class RealtimeSequence(models.Model):
    stream_key = models.CharField(max_length=64, unique=True, db_column="stream_key")
    last_sequence = models.BigIntegerField(default=0, db_column="last_sequence")
    fch_modf = models.DateTimeField(auto_now=True, db_column="fch_modf")

    class Meta:
        db_table = "rt_realtime_sequences"
