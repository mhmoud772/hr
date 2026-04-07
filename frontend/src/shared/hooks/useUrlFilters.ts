/**
 * useUrlFilters — hook لمزامنة حالة الفلاتر مع URL Search Params
 *
 * الاستخدام:
 *   const { filters, setFilter, resetFilters } = useUrlFilters({
 *     search: "",
 *     status: "",
 *     department: "",
 *   });
 *
 * عند تغيير أي فلتر يُحدَّث URL تلقائياً، وعند Refresh أو مشاركة الرابط
 * تُستعاد الفلاتر من الـ URL.
 */

import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

type FilterRecord = Record<string, string | number | undefined>;

interface UseUrlFiltersOptions<T extends FilterRecord> {
  /**
   * الفلاتر الافتراضية — تُستخدم عند غياب قيمة في الـ URL
   * وعند resetFilters().
   */
  defaults: T;
  /**
   * عدد أحرف البحث الأدنى قبل تحديث الـ URL (الافتراضي: 0 — فوري)
   */
  minSearchLength?: number;
}

interface UseUrlFiltersResult<T extends FilterRecord> {
  /** الفلاتر الحالية (مدمجة من الـ URL + القيم الافتراضية) */
  filters: T;
  /** تحديث فلتر واحد */
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  /** تحديث عدة فلاتر دفعةً واحدة */
  setFilters: (partial: Partial<T>) => void;
  /** إعادة تعيين جميع الفلاتر إلى القيم الافتراضية */
  resetFilters: () => void;
  /** هل توجد فلاتر مُطبَّقة غير القيم الافتراضية؟ */
  hasActiveFilters: boolean;
}

export function useUrlFilters<T extends FilterRecord>({
  defaults,
  minSearchLength = 0,
}: UseUrlFiltersOptions<T>): UseUrlFiltersResult<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  // قراءة الفلاتر من الـ URL مع الرجوع للقيم الافتراضية
  const filters = useMemo<T>(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as Array<keyof T>) {
      const raw = searchParams.get(String(key));
      if (raw !== null) {
        // حفظ نوع البيانات: إذا كانت القيمة الافتراضية رقماً نحوّل
        if (typeof defaults[key] === "number") {
          const num = Number(raw);
          (result[key] as unknown) = isNaN(num) ? defaults[key] : num;
        } else {
          (result[key] as unknown) = raw;
        }
      }
    }
    return result;
  }, [searchParams, defaults]);

  // تحديث الـ URL عند تغيير فلتر
  const updateParams = useCallback(
    (partial: Partial<T>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(partial)) {
            const defaultVal = defaults[key as keyof T];
            if (
              value === undefined ||
              value === null ||
              String(value) === String(defaultVal)
            ) {
              // إزالة الفلتر من الـ URL إذا رجع للقيمة الافتراضية
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          // إعادة تعيين رقم الصفحة عند تغيير أي فلتر آخر
          if (!("page" in partial)) {
            next.delete("page");
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, defaults]
  );

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      // تأجيل تحديث الـ URL إذا كان نص البحث أقل من الحد الأدنى
      if (
        key === "search" &&
        minSearchLength > 0 &&
        typeof value === "string" &&
        value.length > 0 &&
        value.length < minSearchLength
      ) {
        return;
      }
      updateParams({ [key]: value } as unknown as Partial<T>);
    },
    [updateParams, minSearchLength]
  );

  const setFilters = useCallback(
    (partial: Partial<T>) => {
      updateParams(partial);
    },
    [updateParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const hasActiveFilters = useMemo(() => {
    for (const [key, defaultVal] of Object.entries(defaults)) {
      const current = filters[key as keyof T];
      if (String(current) !== String(defaultVal)) return true;
    }
    return false;
  }, [filters, defaults]);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    hasActiveFilters,
  };
}
