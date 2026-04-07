import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/shared/hooks/use-toast";
import { LoadingState } from "@/shared/components/LoadingState";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHero } from "@/shared/components/PageHero";
import { AlertTriangle, FileSearch, Plus, Users, Search, UserCheck } from "lucide-react";
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
import type { ApiRecruitmentCandidateRequest, ApiPatchedRecruitmentCandidateRequest } from "@/types/contracts";

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
      const payload: ApiRecruitmentCandidateRequest = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        position: formData.position,
        status: formData.status,
        source: formData.source || undefined,
        notes: formData.notes || undefined,
      };
      if (selected?.id) {
        await updateCandidate.mutateAsync({ id: selected.id, data: payload as ApiPatchedRecruitmentCandidateRequest });
      } else {
        await createCandidate.mutateAsync(payload);
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

  const totalCandidates = query.data?.length || 0;
  const screeningCount = query.data?.filter(r => r.status === "screening" || r.status === "interview").length || 0;
  const hiredCount = query.data?.filter(r => r.status === "hired").length || 0;

  const spotlightMetrics = [
    {
      label: t("total_records"),
      value: totalCandidates,
      icon: Users,
      color: "text-primary",
    },
    {
      label: t("candidate_status_screening"),
      value: screeningCount,
      icon: Search,
      color: "text-warning",
    },
    {
      label: t("candidate_status_hired"),
      value: hiredCount,
      icon: UserCheck,
      color: "text-success",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <PageHero
        title={t("recruitment_title")}
        subtitle={t("recruitment_subtitle")}
        icon={Users}
        metrics={spotlightMetrics.map((item, index) => ({
          label: item.label,
          value: item.value,
          icon: item.icon,
          tone: index === 0 ? "primary" : index === 1 ? "warning" : "success",
        }))}
        actions={
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("add")}
          </Button>
        }
      />

      <Card className="bg-card/90 border border-border/60 shadow-sm">
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
            <EmptyState 
              icon={FileSearch} 
              title={t("no_data")} 
              description={t("recruitment_no_candidates_desc", "No candidates found. Start by adding a new applicant.")}
              actionLabel={t("add_candidate")}
              onAction={openAdd}
            />
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
