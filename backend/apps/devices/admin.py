from django.contrib import admin
from .models import (
    DeviceGroup, DevicePolicy, Device, DeviceUserMapping, 
    DeviceSyncLog, DeviceCommandApproval, BiometricTemplate, 
    BiometricTemplateDistribution, DeviceFirmwareRollout, DeviceBackupSnapshot
)

@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = ('name', 'serial_number', 'ip_address', 'status', 'connection_mode')
    list_filter = ('status', 'connection_mode', 'group')
    search_fields = ('name', 'serial_number', 'ip_address')

@admin.register(DeviceGroup)
class DeviceGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')

admin.site.register(DevicePolicy)
admin.site.register(DeviceUserMapping)
admin.site.register(DeviceSyncLog)
admin.site.register(DeviceCommandApproval)
admin.site.register(BiometricTemplate)
admin.site.register(BiometricTemplateDistribution)
admin.site.register(DeviceFirmwareRollout)
admin.site.register(DeviceBackupSnapshot)
