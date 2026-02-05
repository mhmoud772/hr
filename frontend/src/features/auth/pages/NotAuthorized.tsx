import { useTranslation } from "react-i18next";

export default function NotAuthorized() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded shadow text-center">
        <h2 className="text-2xl font-bold mb-4">{t("not_authorized_title")}</h2>
        <p className="text-muted-foreground">{t("not_authorized_desc")}</p>
      </div>
    </div>
  );
}
