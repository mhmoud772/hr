import { useState } from "react";
import { FileText, Trash2, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { useToast } from "@/shared/hooks/use-toast";
import {
  useCreateEmployeeDocument,
  useDeleteEmployeeDocument,
  useEmployeeDocumentsQuery,
} from "@/features/employees/hooks/useEmployeeDocuments";

type EmployeeDocumentsSectionProps = {
  employeeId?: string;
  canUpload?: boolean;
};

export function EmployeeDocumentsSection({ employeeId, canUpload = false }: EmployeeDocumentsSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const docsQuery = useEmployeeDocumentsQuery(employeeId);
  const createDoc = useCreateEmployeeDocument();
  const deleteDoc = useDeleteEmployeeDocument();
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [notes, setNotes] = useState("");

  const handleUpload = async (file: File) => {
    if (!employeeId) return;
    const form = new FormData();
    form.append("employeeId", employeeId);
    form.append("title", title.trim() || file.name);
    if (docType.trim()) form.append("doc_type", docType.trim());
    if (notes.trim()) form.append("notes", notes.trim());
    form.append("file", file);
    try {
      await createDoc.mutateAsync(form);
      setTitle("");
      setDocType("");
      setNotes("");
      toast({ title: t("document_uploaded"), description: t("document_uploaded_desc") });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc.mutateAsync(id);
      toast({ title: t("document_deleted"), description: t("document_deleted_desc") });
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  return (
    <Card className="bg-card border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          {t("documents")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canUpload && (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("document_title")}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("document_title")} />
              </div>
              <div className="space-y-2">
                <Label>{t("document_type")}</Label>
                <Input value={docType} onChange={(e) => setDocType(e.target.value)} placeholder={t("document_type")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notes")} />
            </div>
            <div className="space-y-2">
              <Label>{t("upload")}</Label>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </div>
          </div>
        )}

        {docsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : docsQuery.data && docsQuery.data.length > 0 ? (
          <div className="space-y-2">
            {docsQuery.data.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded border p-3">
                <div>
                  <p className="text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.doc_type || doc.filename || "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {doc.fileUrl && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  {canUpload && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(String(doc.id))}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("no_documents")}</p>
        )}
      </CardContent>
    </Card>
  );
}
