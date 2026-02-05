import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useRecruitmentQuery, useCreateCandidate, useUpdateCandidate, useDeleteCandidate } from "@/features/recruitment/hooks/useRecruitment";
import type { RecruitmentCandidate } from "@/types/api";

const statusOptions = ["applied", "screening", "interview", "offered", "hired", "rejected"];

export default function Recruitment() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const query = useRecruitmentQuery();
  const createCandidate = useCreateCandidate();
  const updateCandidate = useUpdateCandidate();
  const deleteCandidate = useDeleteCandidate();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<RecruitmentCandidate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    status: "applied",
    source: "",
    notes: "",
  });

  const openAdd = () => {
    setSelected(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      position: "",
      status: "applied",
      source: "",
      notes: "",
    });
    setFormOpen(true);
  };

  const openEdit = (candidate: RecruitmentCandidate) => {
    setSelected(candidate);
    setFormData({
      name: candidate.name || "",
      email: candidate.email || "",
      phone: candidate.phone || "",
      position: candidate.position || "",
      status: candidate.status || "applied",
      source: candidate.source || "",
      notes: candidate.notes || "",
    });
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.position.trim()) {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
      return;
    }
    try {
      if (selected?.id) {
        await updateCandidate.mutateAsync({ id: selected.id, data: formData });
      } else {
        await createCandidate.mutateAsync(formData);
      }
      setFormOpen(false);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCandidate.mutateAsync(id);
    } catch {
      toast({ title: t("generic_error"), description: t("error_loading"), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("recruitment_title")}</h1>
          <p className="text-muted-foreground">{t("recruitment_subtitle")}</p>
        </div>
        <Button onClick={openAdd}>{t("add")}</Button>
      </div>

      <Card className="bg-card border-none shadow-sm">
        <CardHeader>
          <CardTitle>{t("recruitment_candidates")}</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <LoadingState label={t("loading")} />
          ) : query.isError ? (
            <EmptyState icon={AlertTriangle} title={t("error_loading")} />
          ) : query.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("position")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell>{candidate.name}</TableCell>
                    <TableCell>{candidate.position}</TableCell>
                    <TableCell>{t(`candidate_status_${candidate.status}`)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(candidate)}>
                          {t("edit")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(String(candidate.id))}>
                          {t("delete")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">{t("no_data")}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selected ? t("edit") : t("add")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("name")}</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("position")}</Label>
                <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("phone")}</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("status")}</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`candidate_status_${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("source")}</Label>
                <Input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit">{selected ? t("save") : t("add")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
