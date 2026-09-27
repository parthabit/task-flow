export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse {
  static success<T>(data: T, message = 'Success') {
    return { success: true, message, data };
  }
  static paginated<T>(result: Paginated<T>, message = 'Success') {
    return {
      success: true,
      message,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
}
