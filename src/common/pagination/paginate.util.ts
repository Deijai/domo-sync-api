import { PaginatedResult } from './paginated-result.interface';

export async function paginate<T>(
  countFn: () => Promise<number>,
  findFn: (skip: number, take: number) => Promise<T[]>,
  page = 1,
  pageSize = 10,
): Promise<PaginatedResult<T>> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const skip = (safePage - 1) * safePageSize;

  const [total, data] = await Promise.all([countFn(), findFn(skip, safePageSize)]);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);

  return {
    data,
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}
