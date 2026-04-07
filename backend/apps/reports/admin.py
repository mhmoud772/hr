from django.contrib import admin
from .models import AnalyticalMetric

@admin.register(AnalyticalMetric)
class AnalyticalMetricAdmin(admin.ModelAdmin):
    list_display = ('metric_type', 'scope', 'value', 'period_start', 'period_end')
    list_filter = ('metric_type', 'scope')
