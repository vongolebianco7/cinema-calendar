export function searchMovies(options: {
 query: string;
 titles?: any[];
 fetchPage: (query: string, page: number) => Promise<any>;
 maxRequests?: number;
 maxVariants?: number;
}): Promise<{results: any[]; truncated: boolean; incomplete: boolean; requests: number}>;
