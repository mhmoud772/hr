import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";

export function SecuritySection() {
  const { t } = useTranslation();

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle>{t("self_service_security")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("self_service_security_hint")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/settings?tab=security")}
          >
            {t("change_password")}
          </Button>
          <Badge variant="outline">{t("self_service_mfa_hint")}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
