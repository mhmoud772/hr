import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEmployeeActions } from "../hooks/useEmployeeActions";
import { EmployeeForm } from "../components/EmployeeForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { PageHero } from "@/shared/components/PageHero";
import { Users } from "lucide-react";

export default function AddEmployee() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { handleSave, isSaving } = useEmployeeActions();
  const isRtl = i18n.language?.startsWith("ar");

  const onSave = async (data: any, avatarFile?: File | null) => {
    // handleSave returns void but internally toasts and refetches if provided
    // We pass null for selectedEmployee to indicate "Create"
    await handleSave(null, data, avatarFile);
    // After a short delay to allow the toast to be seen/mutation to finish
    // though the mutation is awaited.
    navigate("/employees");
  };

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 pb-10" dir={isRtl ? "rtl" : "ltr"}>
      <PageHero
        title={t("add_employee")}
        subtitle={t("employees_subtitle")}
      />
      
      <Card className="rounded-[28px] border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{t("employee_form_add_title")}</CardTitle>
              <CardDescription>{t("fill_required_details", "Please fill in all the required details below")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <EmployeeForm
            onSave={onSave}
            onCancel={() => navigate("/employees")}
            isLoading={isSaving}
          />
        </CardContent>
      </Card>
    </div>
  );
}
