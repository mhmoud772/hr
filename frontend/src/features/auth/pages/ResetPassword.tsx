import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { requestPasswordReset } from "@/features/auth/api/auth";

export default function ResetPassword() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError(t("email_invalid"));
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      toast({
        title: t("reset_password_sent_title"),
        description: t("reset_password_sent_desc"),
      });
      setEmail("");
    } catch (err) {
      setError(t("generic_error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">{t("reset_password_title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("reset_password_desc")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("email")}</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
                autoComplete="email"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert" aria-live="polite">
                {error}
              </div>
            )}
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? t("loading") : t("reset_password_submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

