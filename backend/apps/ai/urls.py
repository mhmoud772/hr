from django.urls import path
from apps.ai import views

urlpatterns = [
    path("query/", views.AIQueryView.as_view(), name="ai_query"),
    path("dashboard-summary/", views.AIDashboardSummaryView.as_view(), name="ai_summary"),
    path("policies/", views.PolicyDocumentListView.as_view(), name="ai_policies"),
]
