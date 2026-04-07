import { apiClient } from "@/shared/lib/api-client";
import { normalizePaginatedList } from "@/shared/lib/normalizers/base";
import { normalizeAsset } from "@/shared/lib/normalizers/features";
import type { ApiAsset, ApiPaginatedAssetList } from "@/types/contracts";
import type { Asset } from "@/types/api";

export type AssetsQuery = {
  status?: string;
  category?: string;
  employee?: string;
};

export const getAssets = async (params: AssetsQuery = {}) => {
  const res = await apiClient.get("/assets/", { params });
  return normalizePaginatedList(
    res.data as ApiPaginatedAssetList | ApiAsset[],
    normalizeAsset,
  ).results;
};

export const getAssetsReport = async (params: AssetsQuery = {}) => {
  const mapped: Record<string, unknown> = { ...params };
  if (params.employee) {
    mapped["assigned_to__employee_code"] = params.employee;
    delete mapped.employee;
  }
  const res = await apiClient.get("/assets/report/", { params: mapped });
  return normalizePaginatedList(
    res.data as ApiPaginatedAssetList | ApiAsset[],
    normalizeAsset,
  ).results;
};

export const createAsset = async (data: Partial<Asset>) => {
  const res = await apiClient.post("/assets/", data);
  return normalizeAsset(res.data as ApiAsset);
};

export const updateAsset = async (id: string, data: Partial<Asset>) => {
  const res = await apiClient.patch(`/assets/${id}/`, data);
  return normalizeAsset(res.data as ApiAsset);
};

export const deleteAsset = async (id: string) => {
  const res = await apiClient.delete(`/assets/${id}/`);
  return res.data;
};
