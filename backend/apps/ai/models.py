from django.db import models
from django.conf import settings

class PolicyDocument(models.Model):
    CATEGORY_CHOICES = [
        ('attendance', 'Attendance & Time Tracking'),
        ('leaves', 'Leave & Absence'),
        ('compensation', 'Compensation & Benefits'),
        ('conduct', 'Code of Conduct'),
        ('general', 'General HR Policies'),
    ]

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='general')
    content = models.TextField(help_text="The actual text layout of the policy")
    version = models.CharField(max_length=20, default="1.0.0")
    is_active = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Policy Document"
        verbose_name_plural = "Policy Documents"
        ordering = ["-last_updated"]

    def __str__(self):
        return f"{self.title} (v{self.version})"


class AIInteraction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name="ai_interactions"
    )
    prompt = models.TextField()
    response = models.TextField()
    context_metadata = models.JSONField(
        default=dict, 
        help_text="Metadata about analytical snapshots or policy versions used"
    )
    tokens_used = models.IntegerField(default=0)
    response_time_ms = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "AI Interaction"
        verbose_name_plural = "AI Interactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Interaction by {self.user} at {self.created_at}"
